import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from tournaments.models import Room, RoomParticipant
from .models import RoomMessage


class RoomChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]

        # 🎯 Get tournament ID from room
        self.tournament_id = await self.get_tournament_id()
        if not self.tournament_id:
            print(f"WS REJECTED: Tournament ID not found for room {self.room_id}")
            await self.close()
            return

        self.room_group_name = f"tournament_{self.tournament_id}"

        # 🔐 Authenticate user via JWT
        self.user = await self.get_user_from_token()
        if not self.user:
            await self.close()
            return

        self.scope["user"] = self.user

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        msg_type = data.get("type", "chat")

        if not message:
            return

        allowed = await self.can_chat(self.user)
        if not allowed:
            return

        # 💾 Save message to DB
        await self.save_message(self.room_id, self.user, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": self.user.username,
                "is_admin": self.user.is_staff,
                "msg_type": msg_type,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    # ================= HELPERS =================

    @database_sync_to_async
    def get_tournament_id(self):
        try:
            room = Room.objects.get(id=self.room_id)
            return room.tournament_id
        except Exception as e:
            print(f"WS ERROR: Room {self.room_id} not found or {str(e)}")
            return None

    @database_sync_to_async
    def get_user_from_token(self):
        try:
            query_string = self.scope.get("query_string", b"").decode()
            if not query_string or "token=" not in query_string:
                print("WS AUTH: No token provided in query string")
                return None
            
            token = query_string.split("token=")[1].split("&")[0]

            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            return jwt_auth.get_user(validated_token)
        except Exception as e:
            print(f"WS AUTH ERROR: {str(e)}")
            return None

    @database_sync_to_async
    def can_chat(self, user):
        if user.is_staff:
            return True
        try:
            return RoomParticipant.objects.filter(
                room_id=self.room_id,
                user=user
            ).exists()
        except:
            return False

    @database_sync_to_async
    def save_message(self, room_id, user, message):
        try:
            RoomMessage.objects.create(
                room_id=room_id,
                sender=user,
                message=message,
                is_admin=user.is_staff
            )
        except Exception as e:
            print(f"ERROR SAVING MESSAGE: {str(e)}")

    @database_sync_to_async
    def get_last_messages(self, room_id):
        try:
            from .models import RoomMessage
            # Get last 50 messages ordered by creation time
            messages = RoomMessage.objects.filter(room_id=room_id).select_related('sender').order_by('created_at')[:50]
            return list(messages)
        except:
            return []
