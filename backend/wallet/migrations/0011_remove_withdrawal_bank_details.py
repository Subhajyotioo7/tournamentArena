from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("wallet", "0010_withdrawal_payout_fields")]
    operations = [migrations.RemoveField(model_name="withdrawal", name="bank_details")]
