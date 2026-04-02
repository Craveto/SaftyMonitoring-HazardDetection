from django.contrib import admin
from .models import HazardAlert, HazardAlertHistory

admin.site.register(HazardAlert)


admin.site.register(HazardAlertHistory)


