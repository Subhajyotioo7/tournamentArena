from decimal import Decimal, InvalidOperation
import uuid
import logging
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from wallet.models import Profile, Transaction
from .models import PhonePePayment
from .pricing import calculate_payment_breakdown

logger = logging.getLogger(__name__)


@api_view(["GET"])
@require_GET
@permission_classes([IsAuthenticated])
def phonepe_payment_pricing(request):
    fee, gst, _ = calculate_payment_breakdown(Decimal("0.00"))
    return Response({
        "gateway_fee": fee,
        "gst_amount": gst,
        "gst_rate": 0,
    })


def _phonepe_urls():
    if settings.PHONEPE_ENV == "PRODUCTION":
        return ("https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
                "https://api.phonepe.com/apis/pg/checkout/v2/pay",
                "https://api.phonepe.com/apis/pg/checkout/v2/order")
    return ("https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
            "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
            "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order")


def _get_phonepe_token():
    if not all((settings.PHONEPE_CLIENT_ID, settings.PHONEPE_CLIENT_SECRET, settings.PHONEPE_CLIENT_VERSION)):
        raise RuntimeError("PhonePe credentials are not configured. Set client ID, secret, and version.")
    cached = cache.get("phonepe_access_token")
    if cached:
        return cached
    token_url, _, _ = _phonepe_urls()
    response = requests.post(token_url, data={
        "client_id": settings.PHONEPE_CLIENT_ID,
        "client_version": settings.PHONEPE_CLIENT_VERSION,
        "client_secret": settings.PHONEPE_CLIENT_SECRET,
        "grant_type": "client_credentials",
    }, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=15)
    if response.status_code >= 400:
        logger.error("PhonePe OAuth failed: HTTP %s - %s", response.status_code, response.text[:500])
    response.raise_for_status()
    payload = response.json()
    token = payload.get("access_token")
    if not token:
        raise RuntimeError("PhonePe did not return an access token.")
    cache.set("phonepe_access_token", token, max(int(payload.get("expires_in", 900)) - 60, 60))
    return token


def _phonepe_request(method, url, token, **kwargs):
    response = requests.request(method, url, headers={
        "Authorization": f"O-Bearer {token}", "Content-Type": "application/json"
    }, timeout=15, **kwargs)
    if response.status_code >= 400:
        logger.error("PhonePe API failed: HTTP %s - %s", response.status_code, response.text[:500])
    response.raise_for_status()
    return response.json()


def _phonepe_error(exc):
    if isinstance(exc, requests.HTTPError) and exc.response is not None:
        try:
            payload = exc.response.json()
            message = payload.get("message") or payload.get("code") or payload
        except ValueError:
            message = exc.response.text[:300]
        return f"PhonePe rejected the request ({exc.response.status_code}): {message}"
    return f"PhonePe request failed: {exc}"


@api_view(["POST"])
@require_POST
@permission_classes([IsAuthenticated])
def create_phonepe_payment(request):
    try:
        amount = Decimal(str(request.data.get("amount", ""))).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": "Enter a valid amount."}, status=400)
    if amount < Decimal("1.00") or amount > Decimal("100000.00"):
        return Response({"error": "Amount must be between ₹1 and ₹100,000."}, status=400)
    gateway_fee, gst_amount, total_paid = calculate_payment_breakdown(amount)

    profile, _ = Profile.objects.get_or_create(user=request.user)
    order_id = f"TA{uuid.uuid4().hex[:30].upper()}"
    payment = PhonePePayment.objects.create(
        profile=profile,
        merchant_order_id=order_id,
        amount=amount,
        gateway_fee=gateway_fee,
        gst_amount=gst_amount,
        total_paid=total_paid,
    )
    try:
        token = _get_phonepe_token()
        _, pay_url, _ = _phonepe_urls()
        result = _phonepe_request("POST", pay_url, token, json={
            "merchantOrderId": order_id,
            "amount": int(total_paid * 100),
            "expireAfter": 1200,
            "paymentFlow": {
                "type": "PG_CHECKOUT",
                "message": "Add money to Tournament Arena wallet",
                "merchantUrls": {
                    "redirectUrl": (
                        f"{settings.PHONEPE_REDIRECT_URL}"
                        f"{'&' if '?' in settings.PHONEPE_REDIRECT_URL else '?'}"
                        f"{urlencode({'merchantOrderId': order_id})}"
                    )
                },
            },
            "paymentModeConfig": {
                "enabledPaymentModes": [{"type": "UPI_INTENT"}, {"type": "UPI_QR"}]
            },
        })
    except (requests.RequestException, RuntimeError) as exc:
        payment.status = "FAILED"
        payment.save(update_fields=["status", "updated_at"])
        return Response({"error": _phonepe_error(exc)}, status=502)

    redirect_url = result.get("redirectUrl") or result.get("data", {}).get("redirectUrl")
    if not redirect_url:
        payment.status = "FAILED"
        payment.save(update_fields=["status", "updated_at"])
        return Response({"error": "PhonePe did not return a payment URL."}, status=502)
    return Response({
        "merchant_order_id": order_id,
        "redirect_url": redirect_url,
        "wallet_amount": amount,
        "gateway_fee": gateway_fee,
        "gst_amount": gst_amount,
        "total_paid": total_paid,
    })


@api_view(["GET"])
@require_GET
@permission_classes([IsAuthenticated])
def phonepe_payment_status(request, merchant_order_id):
    try:
        payment = PhonePePayment.objects.get(merchant_order_id=merchant_order_id, profile__user=request.user)
    except PhonePePayment.DoesNotExist:
        return Response({"error": "Payment not found."}, status=404)

    if payment.status == "PENDING":
        try:
            token = _get_phonepe_token()
            _, _, status_url = _phonepe_urls()
            result = _phonepe_request("GET", f"{status_url}/{merchant_order_id}/status", token)
        except (requests.RequestException, RuntimeError) as exc:
            return Response({"error": f"Unable to verify payment: {exc}"}, status=502)
        phonepe_status = result.get("state") or result.get("status")
        if phonepe_status in {"SUCCESS", "COMPLETED"}:
            payment = _complete_phonepe_payment(payment, result)
        elif phonepe_status in {"FAILED", "DECLINED", "CANCELLED", "EXPIRED"}:
            payment = _fail_phonepe_payment(payment)
    return Response({
        "merchant_order_id": payment.merchant_order_id,
        "status": payment.status,
        "amount": payment.amount,
        "gateway_fee": payment.gateway_fee,
        "gst_amount": payment.gst_amount,
        "total_paid": payment.total_paid,
    })


def _complete_phonepe_payment(payment, result):
    with transaction.atomic():
        payment = PhonePePayment.objects.select_for_update().get(pk=payment.pk)
        if payment.status != "PENDING":
            return payment
        payment_details = result.get("paymentDetails") or []
        latest_detail = payment_details[-1] if payment_details else {}
        payment.status = "SUCCESS"
        payment.phonepe_transaction_id = (
            result.get("transactionId")
            or latest_detail.get("transactionId")
            or result.get("data", {}).get("transactionId", "")
        )
        payment.save(update_fields=["status", "phonepe_transaction_id", "updated_at"])
        profile = Profile.objects.select_for_update().get(pk=payment.profile_id)
        profile.balance += payment.amount
        profile.save(update_fields=["balance"])
        Transaction.objects.create(
            profile=profile,
            tx_type="credit",
            amount=payment.amount,
            note=(
                f"PhonePe UPI wallet credit: {payment.merchant_order_id} "
                f"(paid ₹{payment.total_paid}, fee ₹{payment.gateway_fee}, "
                f"GST ₹{payment.gst_amount})"
            ),
        )
    return payment


def _fail_phonepe_payment(payment):
    payment.status = "FAILED"
    payment.save(update_fields=["status", "updated_at"])
    return payment
