from rest_framework import serializers
from .models import Tournament, Room, RoomParticipant, PrizeDistribution, RoomResult


class PrizeDistributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrizeDistribution
        fields = ["id", "tournament", "rank", "prize_amount", "created_at"]
        read_only_fields = ["id", "created_at"]


class TournamentSerializer(serializers.ModelSerializer):
    prize_distributions = PrizeDistributionSerializer(many=True, read_only=True)
    rooms = serializers.SerializerMethodField()
    team_size = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = "__all__"
        read_only_fields = ["created_by","created_at"]
    
    def get_team_size(self, obj):
        """Get team size based on team mode"""
        return obj.get_team_size()
    
    def get_rooms(self, obj):
        """Get simplified room data to avoid circular references"""
        from .models import Room
        rooms = Room.objects.filter(tournament=obj)
        return [{
            'id': str(room.id),
            'status': room.status,
            'current_players': room.current_count(),
            'max_players': obj.max_participants,  # Use max_participants instead of team_size
            'prize_pool': str(room.total_prize_pool()),
            'owner': {'username': room.owner.username} if room.owner else None,
            'created_at': room.created_at
        } for room in rooms]

    def get_total_participants(self, obj):
        """Count total participants across all rooms"""
        return RoomParticipant.objects.filter(room__tournament=obj).count()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['total_participants'] = self.get_total_participants(instance)
        return representation


class RoomParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = RoomParticipant
        fields = ["id", "room", "user", "username", "joined_at", "paid", "razorpay_order_id", "razorpay_payment_id"]
        read_only_fields = ["joined_at","paid","razorpay_order_id","razorpay_payment_id"]


class RoomResultSerializer(serializers.ModelSerializer):
    participant_username = serializers.CharField(source="participant.user.username", read_only=True)
    participant_id = serializers.UUIDField(source="participant.id", read_only=True)

    class Meta:
        model = RoomResult
        fields = ["id", "room", "participant", "participant_id", "participant_username", "rank", "prize_amount", "payout_status", "approved_by", "approved_at", "created_at"]
        read_only_fields = ["id", "prize_amount", "payout_status", "approved_by", "approved_at", "created_at"]


class TournamentParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    game_id = serializers.CharField(source="user.profile.game_id", read_only=True)
    room_id = serializers.CharField(source="room.id", read_only=True)
    payment_share = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RoomParticipant
        fields = ["id", "user", "username", "email", "game_id", "room_id", "joined_at", "paid", "payment_share", "is_team_leader"]


class RoomSerializer(serializers.ModelSerializer):
    tournament = TournamentSerializer(read_only=True)
    required_amount = serializers.SerializerMethodField()
    current_players = serializers.SerializerMethodField()
    max_players = serializers.SerializerMethodField()  # Add max_players
    prize_pool = serializers.SerializerMethodField()
    participants = RoomParticipantSerializer(many=True, read_only=True)
    results = RoomResultSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = ["id","tournament","owner","status","created_at","required_amount","current_players","max_players","prize_pool","participants","results"]

    def get_required_amount(self,obj):
        return obj.required_per_user_amount()

    def get_current_players(self,obj):
        return obj.current_count()

    def get_max_players(self, obj):
        return obj.tournament.max_participants

    def get_prize_pool(self, obj):
        return obj.total_prize_pool()
