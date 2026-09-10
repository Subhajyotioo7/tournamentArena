from django.urls.conf import include
from django.urls import path
from .views import register_api, login_api, user_profile, verify_email, verify_email_code, resend_verification_email
from . import views
from .views import profile

urlpatterns = [
    path("register/", register_api, name="register_api"),
    path("login/", login_api, name="login_api"),
    path("verify-email/<uidb64>/<token>/", verify_email, name="verify_email"),
    path("verify-email/code/", verify_email_code, name="verify_email_code"),
    path("verify-email/resend/", resend_verification_email, name="resend_verification_email"),
    path("me/", user_profile, name="user_profile"),
    path("profile/", profile, name="profile"),
    path("forgot-password/", views.forgot_password_api, name="forgot_password"),
    path("reset-password/", views.reset_password_api, name="reset_password"),
]

