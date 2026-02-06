import razorpay
from django.conf import settings

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def create_razorpay_order(amount_in_rupees, currency="INR", receipt=None):
    # Razorpay expects amount in paise
    amount_paise = int(amount_in_rupees * 100)
    data = {"amount": amount_paise, "currency": currency, "receipt": receipt or ""}
    order = client.order.create(data)
    return order  # contains id, amount, status

def verify_signature(order_id, payment_id, signature, razorpay_secret=None):
    # server-side signature verification (alternative: razorpay.utils.verify_payment_signature)
    try:
        razorpay.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        }, settings.RAZORPAY_KEY_SECRET)
        return True
    except Exception:
        return False
