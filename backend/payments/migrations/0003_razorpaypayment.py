from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("payments", "0002_phonepepayment_fee_fields")]

    operations = [
        migrations.RenameModel("PhonePePayment", "RazorpayPayment"),
        migrations.RenameField(
            "razorpaypayment", "merchant_order_id", "razorpay_order_id"
        ),
        migrations.RenameField(
            "razorpaypayment", "phonepe_transaction_id", "razorpay_payment_id"
        ),
        migrations.AlterField(
            "razorpaypayment",
            "razorpay_order_id",
            field=models.CharField(max_length=255, unique=True),
        ),
        migrations.AlterField(
            "razorpaypayment",
            "profile",
            field=models.ForeignKey(
                on_delete=models.CASCADE,
                related_name="razorpay_payments",
                to="wallet.profile",
            ),
        ),
        migrations.AddField(
            "razorpaypayment",
            "razorpay_signature",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
