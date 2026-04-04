from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("hazards", "0002_hazardalerthistory"),
    ]

    operations = [
        migrations.CreateModel(
            name="PPEViolation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("media_type", models.CharField(max_length=30)),
                ("filename", models.CharField(max_length=255)),
                ("detected", models.BooleanField(default=False)),
                ("violation_type", models.CharField(blank=True, default="none", max_length=60)),
                ("confidence", models.FloatField(default=0.0)),
                ("status", models.CharField(choices=[("open", "Open"), ("acknowledged", "Acknowledged"), ("resolved", "Resolved")], default="open", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "ppe_violations",
                "ordering": ["-created_at"],
            },
        ),
    ]
