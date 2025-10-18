# services/serializers.py
from rest_framework import serializers
from .models import Service, Plan, Card, Telecom


class ServiceSerializer(serializers.ModelSerializer):
    min_price = serializers.DecimalField(max_digits=10, decimal_places=0, read_only=True)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=0, read_only=True)

    class Meta:
        model = Service
        fields = '__all__'


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        # fields = ['plan_name', 'price', 'benefits', 'billing_cycle']
        fields = '__all__'


class ServiceDetailSerializer(serializers.ModelSerializer):
    # Service에 연결된 Plan들을 PlanSerializer를 통해 함께 보여줌
    plans = PlanSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        # fields = ['id', 'name', 'category', 'official_link', 'plans']
        fields = '__all__'


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'


class TelecomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Telecom
        fields = '__all__'
