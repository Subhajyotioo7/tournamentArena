from django.urls.conf import include
from django.urls import path
from .views import login_api, user_profile, cognito_callback
from . import views
from .views import profile

urlpatterns = [
    path("login/", login_api, name="login_api"),
    path("auth/cognito/callback/", cognito_callback, name="cognito_callback"),
    path("me/", user_profile, name="user_profile"),
    path("profile/", profile, name="profile"),
    path("forgot-password/", views.forgot_password_api, name="forgot_password"),
    path("reset-password/", views.reset_password_api, name="reset_password"),
]
