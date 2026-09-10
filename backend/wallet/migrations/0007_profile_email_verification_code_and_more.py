from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0006_profile_is_email_verified"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="email_verification_code",
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AddField(
            model_name="profile",
            name="email_verification_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]