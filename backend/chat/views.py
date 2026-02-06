from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import RoomMessage

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_room_messages(request, room_id):
    """Fetch chat history for a specific room"""
    # Fetch messages for this room
    messages = RoomMessage.objects.filter(room_id=room_id).select_related('sender').order_by('created_at')
    
    data = []
    for msg in messages:
        data.append({
            "id": msg.id,
            "sender": msg.sender.username,
            "message": msg.message,
            "is_admin": msg.is_admin,
            "msg_type": "chat",
            "created_at": msg.created_at
        })
    
    return Response(data)
