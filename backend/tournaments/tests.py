# Create your tests here.
from rest_framework import serializers
from .models import Tournament, Room, RoomParticipant

class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = "__all__"
        read_only_fields = ["created_by","created_at"]

class RoomSerializer(serializers.ModelSerializer):
    tournament = TournamentSerializer(read_only=True)
    required_amount = serializers.SerializerMethodField()
    current_players = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ["id","tournament","owner","status","created_at","required_amount","current_players"]

    def get_required_amount(self,obj):
        return obj.required_per_user_amount()

    def get_current_players(self,obj):
        return obj.current_count()

class RoomParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomParticipant
        fields = "__all__"
        read_only_fields = ["joined_at","paid","razorpay_order_id","razorpay_payment_id"]
