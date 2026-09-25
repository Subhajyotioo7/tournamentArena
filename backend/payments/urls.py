from django.urls import path
from . import views

urlpatterns = [
    path("razorpay/pricing/", views.razorpay_payment_pricing),
    path("razorpay/create/", views.create_razorpay_payment),
    path("razorpay/verify/", views.verify_razorpay_payment),
]
