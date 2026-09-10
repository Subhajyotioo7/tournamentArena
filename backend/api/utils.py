from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone
from datetime import timedelta
import secrets
import resend
from wallet.models import EmailVerification


def send_verification_email(user, game_id=None):
    if not user.email:
        raise ValueError("User must have an email address to verify it")
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured")

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    verification_link = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email/{uid}/{token}"
    verification_code = f"{secrets.randbelow(1000000):06d}"
    EmailVerification.objects.update_or_create(
        user=user,
        defaults={
            "game_id": game_id,
            "code": verification_code,
            "expires_at": timezone.now() + timedelta(minutes=15),
        },
    )

    resend.api_key = settings.RESEND_API_KEY
    return resend.Emails.send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [user.email],
        "subject": "Verify your Tournament Arena email",
        "html": (
            f"<p>Hi {user.username},</p>"
            f"<p>Your email verification code is <strong>{verification_code}</strong>.</p>"
            "<p>This code expires in 15 minutes.</p>"
            "<p>Click the button below to verify your Tournament Arena email address.</p>"
            f'<p><a href="{verification_link}">Verify email address</a></p>'
            "<p>This link expires automatically for your security.</p>"
        ),
    })
