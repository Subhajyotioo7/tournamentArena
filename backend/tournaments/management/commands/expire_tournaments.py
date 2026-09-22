from django.core.management.base import BaseCommand

from tournaments.services import expire_unstarted_tournaments


class Command(BaseCommand):
    help = "Cancel expired tournaments and refund creators when no opponent joined."

    def handle(self, *args, **options):
        count = expire_unstarted_tournaments()
        self.stdout.write(self.style.SUCCESS(f"Cancelled {count} expired tournament(s)."))
