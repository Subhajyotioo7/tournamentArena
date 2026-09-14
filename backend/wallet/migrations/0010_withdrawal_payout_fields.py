from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("wallet", "0009_profile_selected_game")]
    operations = [
        migrations.AddField("withdrawal", "payout_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
        migrations.AddField("withdrawal", "gateway_fee", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
        migrations.AddField("withdrawal", "gst_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
        migrations.AddField("withdrawal", "payout_method", models.CharField(choices=[("instant", "Instant UPI"), ("manual", "Manual")], default="manual", max_length=20)),
        migrations.AddField("withdrawal", "payout_transaction_id", models.CharField(blank=True, max_length=255, null=True)),
        migrations.AddField("withdrawal", "paid_at", models.DateTimeField(blank=True, null=True)),
    ]
