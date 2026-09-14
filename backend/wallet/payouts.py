from decimal import Decimal
import uuid

import requests
from django.conf import settings


def calculate_payout_breakdown(amount):
    fee = Decimal(str(settings.PHONEPE_PAYOUT_FEE)).quantize(Decimal("0.01"))
    gst = (amount * Decimal(str(settings.PHONEPE_PAYOUT_GST_RATE)) / Decimal("100")).quantize(Decimal("0.01"))
    payout_amount = amount.quantize(Decimal("0.01"))
    return payout_amount, fee, gst


def send_phonepe_payout(*, amount, upi_id, merchant_user_id, merchant_order_id):
    if settings.PHONEPE_PAYOUT_TEST_MODE:
        return f"TEST-PAYOUT-{uuid.uuid4().hex[:20].upper()}"

    payout_url = settings.PHONEPE_PAYOUT_URL.rstrip("/")
    if not payout_url or payout_url in {"https://phonepe.com", "https://www.phonepe.com"}:
        raise RuntimeError(
            "PhonePe Payouts is not configured. Set PHONEPE_PAYOUT_URL to the "
            "payout API endpoint provided in your PhonePe Payouts dashboard."
        )
    if not all((settings.PHONEPE_PAYOUT_CLIENT_ID, settings.PHONEPE_PAYOUT_CLIENT_SECRET, settings.PHONEPE_PAYOUT_CLIENT_VERSION)):
        raise RuntimeError("PhonePe Payouts credentials are not configured.")

    token_base = (
        "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
        if settings.PHONEPE_ENV == "PRODUCTION"
        else "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token"
    )
    token_response = requests.post(
        token_base,
        data={
            "client_id": settings.PHONEPE_PAYOUT_CLIENT_ID,
            "client_version": settings.PHONEPE_PAYOUT_CLIENT_VERSION,
            "client_secret": settings.PHONEPE_PAYOUT_CLIENT_SECRET,
            "grant_type": "client_credentials",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    token_response.raise_for_status()
    token = token_response.json().get("access_token")
    if not token:
        raise RuntimeError("PhonePe Payouts did not return an access token.")

    response = requests.post(
        payout_url,
        json={
            "merchantOrderId": merchant_order_id,
            "amount": int(amount * 100),
            "merchantUserId": merchant_user_id,
            "paymentInstrument": {"type": "UPI", "vpa": upi_id},
        },
        headers={"Authorization": f"O-Bearer {token}", "Content-Type": "application/json"},
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    transaction_id = payload.get("transactionId") or payload.get("data", {}).get("transactionId")
    if not transaction_id:
        raise RuntimeError("PhonePe Payouts did not return a transaction ID.")
    return transaction_id
