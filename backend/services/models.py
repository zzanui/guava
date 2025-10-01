# services/models.py
from django.db import models


class Service(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50)
    logo_url = models.URLField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    official_link = models.URLField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Plan(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='plans')
    plan_name = models.CharField(max_length=100)
    payment_cycle = models.CharField(max_length=50, default='month')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    free_trial = models.BooleanField(default=False)
    benefits = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.service.name} - {self.plan_name}"


class Card(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Telecom(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
