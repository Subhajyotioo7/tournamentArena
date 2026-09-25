from decimal import Decimal, InvalidOperation
import hashlib
import hmac
import logging
import uuid

import requests
from django.conf import settings
from django.db import transaction
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from wallet.models import Profile, Transaction
from .models import RazorpayPayment
from .pricing import calculate_payment_breakdown

logger = logging.getLogger(__name__)


@api_view(["GET"])
@require_GET
@permission_classes([IsAuthenticated])
def razorpay_payment_pricing(request):
    fee, gst, _ = calculate_payment_breakdown(Decimal("0.00"))
    return Response({"gateway_fee": fee, "gst_amount": gst, "gst_rate": 0})


def _razorpay_request(method, url, **kwargs):
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise RuntimeError("Razorpay credentials are not configured.")
    try:
        response = requests.request(
            method,
            url,
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
            headers={"Content-Type": "application/json"},
            timeout=15,
            **kwargs,
        )
        if response.status_code >= 400:
            logger.error("Razorpay API failed: HTTP %s - %s", response.status_code, response.text[:500])
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"Razorpay request failed: {exc}") from exc


def _razorpay_error(exc):
    if isinstance(exc, RuntimeError):
        return str(exc)
    return f"Razorpay request failed: {exc}"


@api_view(["POST"])
@require_POST
@permission_classes([IsAuthenticated])
def create_razorpay_payment(request):
    try:
        amount = Decimal(str(request.data.get("amount", ""))).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": "Enter a valid amount."}, status=400)
    if amount < Decimal("1.00") or amount > Decimal("100000.00"):
        return Response({"error": "Amount must be between ₹1 and ₹100,000."}, status=400)

    gateway_fee, gst_amount, total_paid = calculate_payment_breakdown(amount)
    profile, _ = Profile.objects.get_or_create(user=request.user)
    receipt = f"TA{uuid.uuid4().hex[:30].upper()}"
    try:
        result = _razorpay_request(
            "POST",
            "https://api.razorpay.com/v1/orders",
            json={
                "amount": int(total_paid * 100),
                "currency": "INR",
                "receipt": receipt,
                "notes": {"purpose": "Tournament Arena wallet top-up"},
            },
        )
    except (RuntimeError, requests.RequestException) as exc:
        return Response({"error": _razorpay_error(exc)}, status=502)

    order_id = result.get("id")
    if not order_id:
        return Response({"error": "Razorpay did not return an order ID."}, status=502)
    RazorpayPayment.objects.create(
        profile=profile,
        razorpay_order_id=order_id,
        amount=amount,
        gateway_fee=gateway_fee,
        gst_amount=gst_amount,
        total_paid=total_paid,
    )
    return Response({
        "razorpay_order_id": order_id,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "wallet_amount": amount,
        "gateway_fee": gateway_fee,
        "gst_amount": gst_amount,
        "total_paid": total_paid,
    })


@api_view(["POST"])
@require_POST
@permission_classes([IsAuthenticated])
def verify_razorpay_payment(request):
    if not settings.RAZORPAY_KEY_SECRET:
        return Response({"error": "Razorpay credentials are not configured."}, status=503)
    order_id = str(request.data.get("razorpay_order_id", "")).strip()
    payment_id = str(request.data.get("razorpay_payment_id", "")).strip()
    signature = str(request.data.get("razorpay_signature", "")).strip()
    if not order_id or not payment_id or not signature:
        return Response({"error": "Incomplete Razorpay payment details."}, status=400)
    try:
        payment = RazorpayPayment.objects.get(
            razorpay_order_id=order_id, profile__user=request.user
        )
    except RazorpayPayment.DoesNotExist:
        return Response({"error": "Payment not found."}, status=404)

    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return Response({"error": "Invalid Razorpay payment signature."}, status=400)
    payment = _complete_razorpay_payment(payment, payment_id, signature)
    return Response({
        "razorpay_order_id": payment.razorpay_order_id,
        "status": payment.status,
        "amount": payment.amount,
        "gateway_fee": payment.gateway_fee,
        "gst_amount": payment.gst_amount,
        "total_paid": payment.total_paid,
    })


def _complete_razorpay_payment(payment, payment_id, signature):
    with transaction.atomic():
        payment = RazorpayPayment.objects.select_for_update().get(pk=payment.pk)
        if payment.status != "PENDING":
            return payment
        payment.status = "SUCCESS"
        payment.razorpay_payment_id = payment_id
        payment.razorpay_signature = signature
        payment.save(update_fields=[
            "status", "razorpay_payment_id", "razorpay_signature", "updated_at"
        ])
        profile = Profile.objects.select_for_update().get(pk=payment.profile_id)
        profile.balance += payment.amount
        profile.save(update_fields=["balance"])
        Transaction.objects.create(
            profile=profile,
            tx_type="credit",
            amount=payment.amount,
            note=(
                f"Razorpay wallet credit: {payment.razorpay_order_id} "
                f"(paid ₹{payment.total_paid}, fee ₹{payment.gateway_fee}, "
                f"GST ₹{payment.gst_amount})"
            ),
        )
    return payment
