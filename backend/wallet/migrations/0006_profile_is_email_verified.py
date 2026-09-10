from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0005_profile_mobile_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="is_email_verified",
            field=models.BooleanField(default=False),
        ),
    ]