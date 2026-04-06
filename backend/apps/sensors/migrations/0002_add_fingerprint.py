from django.db import migrations, models
import hashlib


def _norm(value):
    if value is None:
        return ""
    return str(value).strip().lower()


def _build_fingerprint(reading):
    parts = [
        _norm(reading.timestamp),
        _norm(reading.gas_level),
        _norm(reading.temperature),
        _norm(reading.pressure),
        _norm(reading.smoke_level),
        _norm(reading.location),
        _norm(reading.shift),
        _norm(reading.source_type),
    ]
    raw = "|".join(parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def populate_fingerprints(apps, schema_editor):
    SensorReading = apps.get_model("sensors", "SensorReading")
    qs = SensorReading.objects.all().order_by("id").only(
        "id",
        "timestamp",
        "gas_level",
        "temperature",
        "pressure",
        "smoke_level",
        "location",
        "shift",
        "source_type",
    )
    batch = []
    seen = set()
    for reading in qs.iterator(chunk_size=1000):
        fp = _build_fingerprint(reading)
        if fp in seen:
            fp = hashlib.sha256(f"{fp}|{reading.id}".encode("utf-8")).hexdigest()
        seen.add(fp)
        reading.fingerprint = fp
        batch.append(reading)
        if len(batch) >= 1000:
            SensorReading.objects.bulk_update(batch, ["fingerprint"], batch_size=1000)
            batch = []
    if batch:
        SensorReading.objects.bulk_update(batch, ["fingerprint"], batch_size=1000)


class Migration(migrations.Migration):

    dependencies = [
        ("sensors", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="sensorreading",
            name="fingerprint",
            field=models.CharField(max_length=64, null=True, blank=True),
        ),
        migrations.RunPython(populate_fingerprints, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="sensorreading",
            name="fingerprint",
            field=models.CharField(max_length=64, unique=True, db_index=True),
        ),
    ]
