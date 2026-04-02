from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("hazards", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="HazardAlertHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("old_status", models.CharField(blank=True, default="", max_length=20)),
                ("new_status", models.CharField(max_length=20)),
                ("changed_at", models.DateTimeField(auto_now_add=True)),
                (
                    "alert",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="history", to="hazards.hazardalert"),
                ),
            ],
            options={
                "db_table": "hazard_alert_history",
                "ordering": ["-changed_at"],
            },
        ),
    ]
