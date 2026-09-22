from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tournaments", "0009_tournament_custom_player_count_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="tournament",
            name="creator_prize_pool_funded",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=12,
            ),
        ),
    ]
