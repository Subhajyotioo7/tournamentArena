from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("tournaments", "0009_tournament_custom_player_count_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="TournamentEarning",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("organizer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tournament_earnings", to="auth.user")),
                ("participant", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="organizer_earning", to="tournaments.roomparticipant")),
                ("tournament", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="earnings", to="tournaments.tournament")),
            ],
            options={"ordering": ("-created_at",)},
        ),
    ]
