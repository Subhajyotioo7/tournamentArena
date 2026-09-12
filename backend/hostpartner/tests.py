from django.contrib.auth import get_user_model
from django.test import TestCase

from hostpartner.models import HostPartnerRequest
from wallet.models import Profile

User = get_user_model()


class HostPartnerRequestTests(TestCase):
    def test_approved_request_allows_br_access(self):
        user = User.objects.create_user(username='hostuser', password='secret123')
        Profile.objects.create(user=user)
        request = HostPartnerRequest.objects.create(
            requested_by=user,
            status='approved',
            game='bgmi',
            requested_tournament_name='Weekend BR Cup',
            player_count=32,
        )

        self.assertTrue(request.is_approved())
        self.assertTrue(request.can_create_br_tournament(user))

    def test_pending_request_blocks_br_access(self):
        user = User.objects.create_user(username='newhost', password='secret123')
        Profile.objects.create(user=user)
        request = HostPartnerRequest.objects.create(
            requested_by=user,
            status='pending',
            game='freefire',
            requested_tournament_name='Long Battle',
            player_count=50,
        )

        self.assertFalse(request.is_approved())
        self.assertFalse(request.can_create_br_tournament(user))
