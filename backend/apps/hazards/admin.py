from django.contrib import admin
from .models import HazardAlert, HazardAlertHistory, PPEViolation

admin.site.register(HazardAlert)
admin.site.register(HazardAlertHistory)
admin.site.register(PPEViolation)
