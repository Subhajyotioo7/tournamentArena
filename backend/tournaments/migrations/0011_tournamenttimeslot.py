from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("tournaments", "0010_tournament_creator_prize_pool_funded"),
    ]

    operations = [
        migrations.CreateModel(
            name="TournamentTimeSlot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start_time", models.DateTimeField(unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "booked_tournament",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="booked_time_slot",
                        to="tournaments.tournament",
                    ),
                ),
            ],
            options={"ordering": ["start_time"]},
        ),
    ]
