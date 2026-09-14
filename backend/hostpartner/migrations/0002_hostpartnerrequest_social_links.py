from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("hostpartner", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="hostpartnerrequest",
            name="youtube_link",
            field=models.URLField(max_length=500, default="https://youtube.com"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="hostpartnerrequest",
            name="instagram_link",
            field=models.URLField(max_length=500, default="https://instagram.com"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="hostpartnerrequest",
            name="phone_number",
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
    ]
