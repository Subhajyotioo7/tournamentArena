import hashlib
import hmac

import requests
from django.conf import settings

RAZORPAY_API_URL = "https://api.razorpay.com/v1"

def create_razorpay_order(amount_in_rupees, currency="INR", receipt=None):
    amount_paise = int(amount_in_rupees * 100)
    data = {"amount": amount_paise, "currency": currency, "receipt": receipt or ""}
    response = requests.post(
        f"{RAZORPAY_API_URL}/orders",
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
        json=data,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()

def verify_signature(order_id, payment_id, signature, razorpay_secret=None):
    secret = razorpay_secret or settings.RAZORPAY_KEY_SECRET
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        secret.encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature or "")
