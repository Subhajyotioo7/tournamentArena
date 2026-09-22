from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from wallet.models import Transaction

from .models import Room, Tournament


def expire_unstarted_tournaments():
    """Cancel expired tournaments and refund the creator exactly once."""
    now = timezone.now()
    expired = Tournament.objects.filter(
        is_active=True,
        start_time__isnull=False,
        start_time__lte=now,
        room__status="open",
    ).select_related("room", "created_by")
    cancelled_count = 0

    for tournament in expired:
        with transaction.atomic():
            # Lock only the tournament row. PostgreSQL cannot apply FOR UPDATE
            # to the nullable side of the joins added by select_related().
            locked = Tournament.objects.select_for_update().get(pk=tournament.pk)
            room = locked.room
            if not locked.is_active or room.status != "open":
                continue

            participants = list(room.participants.select_related("user__profile"))
            # A creator who joined is waiting for an opponent in one-vs-one.
            has_opponent = any(
                participant.user_id != locked.created_by_id for participant in participants
            )
            if has_opponent:
                room.status = "started"
                room.save(update_fields=["status"])
                continue

            refund_by_profile = {}
            for participant in participants:
                if participant.paid and participant.payment_share > 0:
                    refund_by_profile[participant.user.profile] = (
                        refund_by_profile.get(participant.user.profile, Decimal("0.00"))
                        + participant.payment_share
                    )

            if locked.creator_prize_pool_funded > 0 and locked.created_by_id:
                profile = locked.created_by.profile
                refund_by_profile[profile] = (
                    refund_by_profile.get(profile, Decimal("0.00"))
                    + locked.creator_prize_pool_funded
                )

            for profile, amount in refund_by_profile.items():
                profile.balance += amount
                profile.save(update_fields=["balance"])
                Transaction.objects.create(
                    profile=profile,
                    tx_type="credit",
                    amount=amount,
                    note=f"Refund for cancelled tournament: {locked.name}",
                )

            room.status = "cancelled"
            room.save(update_fields=["status"])
            locked.is_active = False
            locked.save(update_fields=["is_active"])
            cancelled_count += 1

    return cancelled_count
