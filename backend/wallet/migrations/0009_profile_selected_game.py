from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("wallet", "0008_emailverification_remove_profile_email_verification_code_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="selected_game",
            field=models.CharField(
                blank=True,
                choices=[("bgmi", "BGMI"), ("freefire", "Free Fire"), ("fifa", "FIFA")],
                max_length=20,
                null=True,
            ),
        ),
    ]
