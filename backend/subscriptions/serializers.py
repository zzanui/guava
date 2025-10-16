from rest_framework import serializers
from .models import Subscription
from services.models import Plan


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.plan_name', read_only=True)
    plan_service_name = serializers.CharField(
        source='plan.service.name', read_only=True, allow_null=True
    )
    plan_price = serializers.DecimalField(source='plan.price', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = Subscription
        # API를 통해 보여줄 필드    목록
        # fields = ['id', 'user', 'plan_name', 'plan_service_name', 'start_date', 'next_payment_date', 'price_override']
        fields = '__all__'
        # 'user' 필드는 요청 본문(body)으로 받지 않고, 서버에서 자동으로 설정할 것이므로 읽기 전용으로 설정
        read_only_fields = ['user']