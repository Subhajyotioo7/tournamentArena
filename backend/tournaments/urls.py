from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_tournament),
    path("user-create/", views.create_user_tournament),
    path("tournaments/", views.TournamentViewSet.as_view({"get":"list","post":"create"})),
    path("tournaments/<int:pk>/", views.TournamentViewSet.as_view({"get":"retrieve"})),
    
    # Room management
    path("tournament/<int:tournament_id>/create-room/", views.create_room),
    path("room/<uuid:room_id>/join/", views.join_room),  # Legacy
    path("room/<uuid:room_id>/join-solo/", views.join_room_solo),
    path("room/<uuid:room_id>/create-team/", views.create_team_and_invite),
    path("room/<uuid:room_id>/verify-payment/", views.verify_payment),
    
    # Team invitations
    path("my-invitations/", views.my_invitations),
    path("invitation/<uuid:invitation_id>/accept/", views.accept_invitation),
    path("invitation/<uuid:invitation_id>/reject/", views.reject_invitation),
    
    # My rooms
    path("my-rooms/", views.my_rooms),
    path("room/<uuid:room_id>/", views.get_room_detail),
    
    # Prize distribution endpoints
    path("tournament/<int:tournament_id>/set-prizes/", views.set_prize_distribution),
    path("tournament/<int:tournament_id>/prizes/", views.get_prize_distribution),
    path("tournament/<int:tournament_id>/participants/", views.get_tournament_participants),
    
    # Result declaration endpoints
    path("room/<uuid:room_id>/declare-results/", views.declare_results),
    path("room/<uuid:room_id>/add-winner/", views.add_single_winner),
    path("room/<uuid:room_id>/results/", views.get_results),
    
    # Payout approval endpoints
    path("room/<uuid:room_id>/approve-payouts/", views.approve_payouts),
    path("pending-payouts/", views.pending_payouts),
]

