from django.contrib import admin

from .models import HostPartnerRequest


@admin.register(HostPartnerRequest)
class HostPartnerRequestAdmin(admin.ModelAdmin):
    list_display = ["requested_by", "game", "requested_tournament_name", "player_count", "status", "created_at"]
    list_filter = ["status", "game"]
    search_fields = ["requested_by__username", "requested_tournament_name", "game"]
    readonly_fields = ["created_at"]
