from django.urls import re_path
from .consumers import RoomChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/room/(?P<room_id>[0-9a-fA-F-]+)/$", RoomChatConsumer.as_asgi()),
]
