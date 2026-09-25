from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0012_alter_withdrawal_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="cognito_phone",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="profile",
            name="cognito_sub",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
    ]
