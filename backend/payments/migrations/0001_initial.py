from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True
    dependencies = [("wallet", "0009_profile_selected_game")]
    operations = [
        migrations.CreateModel(
            name="PhonePePayment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("merchant_order_id", models.CharField(max_length=63, unique=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("SUCCESS", "Success"), ("FAILED", "Failed")], default="PENDING", max_length=20)),
                ("phonepe_transaction_id", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="phonepe_payments", to="wallet.profile")),
            ],
            options={"ordering": ("-created_at",)},
        )
    ]
