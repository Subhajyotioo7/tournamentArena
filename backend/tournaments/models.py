from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Tournament(models.Model):
    GAME_TYPES = (("fifa","FIFA"),("bgmi","BGMI"),("freefire","FreeFire"))
    TEAM_MODES = (("solo","Solo (1 player)"),("duo","Duo (2 players)"),("squad","Squad (4 players)"))
    
    name = models.CharField(max_length=200)
    game = models.CharField(max_length=50, choices=GAME_TYPES)
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    team_mode = models.CharField(max_length=10, choices=TEAM_MODES, default="solo")
    max_players_per_room = models.IntegerField(default=1)  # Deprecated, use team_mode
    max_participants = models.IntegerField(default=100, help_text="Maximum total participants allowed")
    registration_deadline = models.DateTimeField(null=True, blank=True, help_text="Last date/time to register")
    start_time = models.DateTimeField(null=True, blank=True, help_text="Tournament start date/time")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_tournaments")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def get_team_size(self):
        """Get number of players based on team mode"""
        return {"solo": 1, "duo": 2, "squad": 4}.get(self.team_mode, 1)

    def __str__(self):
        return self.name

class PrizeDistribution(models.Model):
    """Defines rank-wise prize structure for tournaments"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="prize_distributions")
    rank = models.IntegerField()  # 1, 2, 3, etc.
    prize_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Fixed prize amount")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("tournament", "rank")
        ordering = ["rank"]

    def __str__(self):
        return f"{self.tournament.name} - Rank {self.rank}: ₹{self.prize_amount}"

    def calculate_prize_amount(self, total_pool):
        """Return fixed prize amount"""
        return self.prize_amount


class Room(models.Model):
    ROOM_STATUS = (("open","Open"),("full","Full"),("cancelled","Cancelled"),("started","Started"),("completed","Completed"))
    PAYMENT_TYPES = (("leader_pays_all", "Leader Pays All"), ("split_equally", "Split Equally"))
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.OneToOneField(Tournament, on_delete=models.CASCADE, related_name="room")
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="owned_rooms")
    status = models.CharField(max_length=20, choices=ROOM_STATUS, default="open")
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, default="split_equally", help_text="How team payment is handled")
    created_at = models.DateTimeField(auto_now_add=True)

    def current_count(self):
        return self.participants.count()

    def required_per_user_amount(self):
        # Each participant pays the FULL entry fee (not split)
        return self.tournament.entry_fee

    def total_prize_pool(self):
        """Calculate total prize pool from all paid participants"""
        paid_count = self.participants.filter(paid=True).count()
        return self.tournament.entry_fee * paid_count

    def __str__(self):
        return f"{self.tournament.name} room {self.id}"
    


class TeamInvitation(models.Model):
    """Team invitations for duo/squad tournaments"""
    STATUS_CHOICES = (("pending","Pending"),("accepted","Accepted"),("rejected","Rejected"),("expired","Expired"))
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="invitations")
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_invitations")
    invitee_game_id = models.CharField(max_length=100)
    invitee = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="received_invitations")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Invitation from {self.inviter.username} to {self.invitee_game_id}"


class RoomParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="room_participations")
    joined_at = models.DateTimeField(auto_now_add=True)
    paid = models.BooleanField(default=False)
    team_leader = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="team_members")
    is_team_leader = models.BooleanField(default=False)
    payment_share = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ("room","user")

    def __str__(self):
        return f"{self.user.username} in {self.room.id}"


class RoomResult(models.Model):
    """Stores results and prize payout information for room participants"""
    PAYOUT_STATUS = (("pending","Pending"),("approved","Approved"),("paid","Paid"),("rejected","Rejected"))
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="results")
    participant = models.ForeignKey(RoomParticipant, on_delete=models.CASCADE, related_name="results")
    rank = models.IntegerField()  # Final rank achieved by participant
    prize_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payout_status = models.CharField(max_length=20, choices=PAYOUT_STATUS, default="pending")
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_payouts")
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("room", "participant")
        ordering = ["rank"]

    def __str__(self):
        return f"{self.participant.user.username} - Rank {self.rank} in {self.room.id}"
