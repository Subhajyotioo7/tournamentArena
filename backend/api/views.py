
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
import logging
from wallet.models import EmailVerification, Profile
from .utils import send_verification_email

logger = logging.getLogger(__name__)



# ---------- REGISTER API ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_api(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    game_id = request.data.get("game_id")

    if not all([username, email, password]):
        return Response({"error": "Username, email, and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exists():
        return Response({"error": "Email already registered. Use the resend verification code option."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    
    try:
        send_verification_email(user, game_id=game_id)
    except Exception:
        logger.exception("Unable to send verification email during registration")
        return Response(
            {"error": "Account created, but the verification email could not be sent. Check the Resend sender configuration."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        "message": "Registration successful. Check your email to verify your account before logging in.",
    }, status=status.HTTP_201_CREATED)


# ---------- LOGIN API ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)

    if not hasattr(user, "profile") or not user.profile.is_email_verified:
        return Response(
            {"error": "Please verify your email address before logging in."},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Login successful",
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid verification link"}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"error": "This verification link is invalid or expired"}, status=status.HTTP_400_BAD_REQUEST)

    verification = EmailVerification.objects.filter(user=user).first()
    profile, _ = Profile.objects.get_or_create(user=user, defaults={"game_id": verification.game_id if verification else None})
    profile.is_email_verified = True
    profile.save(update_fields=["is_email_verified"])
    if verification:
        verification.delete()

    return Response({"message": "Email verified successfully. You can now log in."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email_code(request):
    email = request.data.get("email")
    code = request.data.get("code")

    if not email or not code:
        return Response({"error": "Email and verification code are required"}, status=status.HTTP_400_BAD_REQUEST)

    verification = EmailVerification.objects.filter(
        user__email__iexact=email,
        code=str(code).strip(),
        expires_at__gt=timezone.now(),
    ).select_related("user").first()

    if verification is None:
        return Response({"error": "Invalid or expired verification code"}, status=status.HTTP_400_BAD_REQUEST)

    user = verification.user
    profile, _ = Profile.objects.get_or_create(user=user, defaults={"game_id": verification.game_id})
    profile.is_email_verified = True
    profile.save(update_fields=["is_email_verified"])
    verification.delete()

    return Response({"message": "Email verified successfully. You can now log in."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_verification_email(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if user is None:
        return Response({"message": "If an account exists, a new verification code has been sent."}, status=status.HTTP_200_OK)

    if hasattr(user, "profile") and user.profile.is_email_verified:
        return Response({"message": "This email is already verified."}, status=status.HTTP_200_OK)

    try:
        send_verification_email(user)
    except Exception:
        logger.exception("Unable to resend verification email")
        return Response(
            {"error": "The verification email could not be sent. Check the Resend sender configuration."},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    return Response({"message": "A new verification code has been sent."}, status=status.HTTP_200_OK)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)
        import uuid
        if not profile.player_uuid:
            profile.player_uuid = uuid.uuid4()
            profile.save()

    return Response({
        "username": request.user.username,
        "email": request.user.email,
        "game_id": profile.game_id,
        "game_id_verified": profile.game_id_verified,
        "player_uuid": str(profile.player_uuid),
    })




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    })


# ---------- FORGOT PASSWORD ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password_api(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Standard security practice: Don't reveal if user exists or not
        return Response({"message": "If an account exists with this email, you will receive a reset link."}, status=status.HTTP_200_OK)
    
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # In a real app, you'd send an email. For now, we'll return it in response 
    # so the user can actually use it without complex SMTP setup.
    reset_link = f"{uid}/{token}"
    
    print(f"PASSWORD RESET LINK FOR {email}: {reset_link}")
    
    return Response({
        "message": "Password reset link generated",
        "reset_token": reset_link # Returning token for easy development/testing
    }, status=status.HTTP_200_OK)


# ---------- RESET PASSWORD ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_api(request):
    uidb64 = request.data.get("uid")
    token = request.data.get("token")
    new_password = request.data.get("password")
    
    if not all([uidb64, token, new_password]):
        return Response({"error": "Incomplete data"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)
        
    if default_token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)