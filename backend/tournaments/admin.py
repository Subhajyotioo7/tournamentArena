from django.contrib import admin
from .models import Tournament, Room, RoomParticipant, PrizeDistribution, RoomResult


class PrizeDistributionInline(admin.TabularInline):
    model = PrizeDistribution
    extra = 1
    fields = ["rank", "prize_amount"]


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ["name", "game", "entry_fee", "max_players_per_room", "is_active", "created_at"]
    list_filter = ["game", "is_active"]
    search_fields = ["name"]
    inlines = [PrizeDistributionInline]


@admin.register(PrizeDistribution)
class PrizeDistributionAdmin(admin.ModelAdmin):
    list_display = ["tournament", "rank", "prize_amount", "created_at"]
    list_filter = ["tournament"]
    ordering = ["tournament", "rank"]


class RoomResultInline(admin.TabularInline):
    model = RoomResult
    extra = 0
    readonly_fields = ["participant", "rank", "prize_amount", "payout_status", "approved_by", "approved_at"]
    can_delete = False


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ["id", "tournament", "owner", "status", "current_count", "prize_pool_display", "created_at"]
    list_filter = ["status", "tournament"]
    search_fields = ["id", "owner__username"]
    inlines = [RoomResultInline]
    
    def current_count(self, obj):
        return obj.current_count()
    current_count.short_description = "Players"
    
    def prize_pool_display(self, obj):
        return f"₹{obj.total_prize_pool()}"
    prize_pool_display.short_description = "Prize Pool"


@admin.register(RoomParticipant)
class RoomParticipantAdmin(admin.ModelAdmin):
    list_display = ["user", "room", "paid", "joined_at"]
    list_filter = ["paid", "room__tournament"]
    search_fields = ["user__username", "room__id"]


@admin.register(RoomResult)
class RoomResultAdmin(admin.ModelAdmin):
    list_display = ["participant_username", "room", "rank", "prize_amount", "payout_status", "approved_by", "approved_at"]
    list_filter = ["payout_status", "rank"]
    search_fields = ["participant__user__username", "room__id"]
    readonly_fields = ["created_at"]
    actions = ["approve_selected_payouts"]
    
    def participant_username(self, obj):
        return obj.participant.user.username
    participant_username.short_description = "Player"
    
    def approve_selected_payouts(self, request, queryset):
        """Bulk action to approve selected payouts"""
        from django.utils import timezone
        from wallet.models import Transaction
        from django.db import transaction as db_transaction
        
        pending_results = queryset.filter(payout_status="pending")
        count = 0
        
        with db_transaction.atomic():
            for result in pending_results:
                if result.prize_amount > 0:
                    # Credit winner's wallet
                    profile = result.participant.user.profile
                    profile.balance += result.prize_amount
                    profile.save()
                    
                    # Create transaction record
                    Transaction.objects.create(
                        profile=profile,
                        tx_type="credit",
                        amount=result.prize_amount,
                        note=f"Prize for Rank {result.rank} in room {result.room.id}"
                    )
                    
                    # Update result status
                    result.payout_status = "paid"
                    result.approved_by = request.user
                    result.approved_at = timezone.now()
                    result.save()
                    count += 1
        
        self.message_user(request, f"Successfully approved {count} payouts")
    approve_selected_payouts.short_description = "Approve selected payouts"
