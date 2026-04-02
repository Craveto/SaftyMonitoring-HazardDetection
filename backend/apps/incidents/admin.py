from django.contrib import admin

from .models import Incident, HazardReport

admin.site.register(Incident)
admin.site.register(HazardReport)
