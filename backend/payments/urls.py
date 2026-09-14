from django.urls import path
from . import views

urlpatterns = [
    path("phonepe/pricing/", views.phonepe_payment_pricing),
    path("phonepe/create/", views.create_phonepe_payment),
    path("phonepe/status/<str:merchant_order_id>/", views.phonepe_payment_status),
]
