from django.urls import path
from . import views

urlpatterns = [
    # Profile and balance
    path("profile/", views.profile_view),
    path("balance/", views.get_balance),
    path("transactions/", views.get_transactions),
    
    # Combined Profile and KYC
    path("profile/update/", views.update_profile),
    
    # Unified Admin Verification (for KYC, Game IDs, Payment Details)
    path("verifications/pending/", views.list_pending_verifications),
    path("verifications/verify/<uuid:player_uuid>/", views.verify_profile_section),
    
    # Withdrawals
    path("withdraw/my/", views.get_my_withdrawals),
    path("withdraw/request/", views.request_withdrawal),
    path("withdraw/all/", views.list_withdrawals),
    path("withdraw/approve/<uuid:withdrawal_id>/", views.approve_withdrawal),
    path("withdraw/reject/<uuid:withdrawal_id>/", views.reject_withdrawal),
    path("withdraw/mark_paid/<uuid:withdrawal_id>/", views.mark_withdrawal_paid),
    # Deposits & Site Config
    path("site-config/", views.get_site_config),
    path("deposit/request/", views.request_deposit),
    path("deposit/pending/", views.list_pending_deposits),
    path("deposit/verify/<uuid:deposit_id>/", views.verify_deposit),
]
