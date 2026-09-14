from decimal import Decimal

def calculate_payment_breakdown(wallet_amount):
    # Add-money deposits are free; fees apply only to instant withdrawals.
    fee = Decimal("0.00")
    gst = Decimal("0.00")
    total = wallet_amount.quantize(Decimal("0.01"))
    return fee, gst, total
