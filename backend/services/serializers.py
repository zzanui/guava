# services/serializers.py
from rest_framework import serializers
from .models import Service, Plan, Card, Telecom


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'


class TelecomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Telecom
        fields = '__all__'
