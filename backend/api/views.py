
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
from django.core.mail import send_mail
from django.conf import settings
from wallet.models import Profile



# ---------- REGISTER API ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_api(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    game_id = request.data.get("game_id")

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    
    # Profile is created by signal, but let's be sure we update it
    profile, created = Profile.objects.get_or_create(user=user)
    profile.game_id = game_id
    if not profile.player_uuid:
        import uuid
        profile.player_uuid = uuid.uuid4()
    profile.save()

    # Generate JWT tokens after register
    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "User registered successfully",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "player_uuid": str(user.profile.player_uuid),
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

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Login successful",
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    }, status=status.HTTP_200_OK)



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