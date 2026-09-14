from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("payments", "0001_initial")]
    operations = [
        migrations.AddField("phonepepayment", "gateway_fee", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
        migrations.AddField("phonepepayment", "gst_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
        migrations.AddField("phonepepayment", "total_paid", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
    ]
