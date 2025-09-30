# subscriptions/admin.py
from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'start_date', 'custom_price')
    list_filter = ('user', 'plan__service')