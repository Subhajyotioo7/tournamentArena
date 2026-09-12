import uuid

from django.contrib.auth.models import User
from django.db import models


class HostPartnerRequest(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    GAME_CHOICES = (
        ("bgmi", "BGMI"),
        ("freefire", "Free Fire"),
        ("fifa", "FIFA"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="host_partner_requests")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    game = models.CharField(max_length=20, choices=GAME_CHOICES)
    requested_tournament_name = models.CharField(max_length=200)
    player_count = models.IntegerField(default=0, help_text="Custom total players for the BR / long tournament")
    note = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_host_partner_requests")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def is_approved(self):
        return self.status == "approved"

    def can_create_br_tournament(self, user):
        return self.requested_by_id == getattr(user, "id", None) and self.is_approved()

    def __str__(self):
        return f"{self.requested_by.username} - {self.requested_tournament_name} ({self.status})"
