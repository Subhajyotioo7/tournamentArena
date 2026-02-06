from django.urls import path
from . import views

urlpatterns = [
    path('room/<uuid:room_id>/messages/', views.get_room_messages, name='room-messages'),
]
