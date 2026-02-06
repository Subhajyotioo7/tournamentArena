from django.urls.conf import include
from django.urls import path
from .views import register_api, login_api, user_profile
from . import views
from .views import profile

urlpatterns = [
    path("register/", register_api, name="register_api"),
    path("login/", login_api, name="login_api"),
    path("me/", user_profile, name="user_profile"),
    path("profile/", profile, name="profile"),
    path("forgot-password/", views.forgot_password_api, name="forgot_password"),
    path("reset-password/", views.reset_password_api, name="reset_password"),
]

