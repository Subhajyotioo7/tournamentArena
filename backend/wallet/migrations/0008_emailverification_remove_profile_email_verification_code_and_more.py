import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0007_profile_email_verification_code_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailVerification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("game_id", models.CharField(blank=True, max_length=50, null=True)),
                ("code", models.CharField(max_length=6)),
                ("expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="email_verification", to="auth.user")),
            ],
        ),
        migrations.RemoveField(model_name="profile", name="email_verification_code"),
        migrations.RemoveField(model_name="profile", name="email_verification_expires_at"),
    ]