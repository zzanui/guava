from rest_framework import serializers
from .models import Subscription
from services.models import Plan


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_service_category = serializers.SerializerMethodField()
    plan_service_name = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    plan_price = serializers.SerializerMethodField()

    def get_plan_service_category(self, obj):
        """안전하게 category 반환"""
        try:
            if obj.plan and obj.plan.service:
                return obj.plan.service.category
        except Exception as e:
            print(f"⚠️ Error getting category for subscription {obj.id}: {e}")
        return "기타"

    def get_plan_service_name(self, obj):
        """안전하게 service name 반환"""
        try:
            if obj.plan and obj.plan.service:
                return obj.plan.service.name
        except Exception as e:
            print(f"⚠️ Error getting service name for subscription {obj.id}: {e}")
        return ""

    def get_plan_name(self, obj):
        """안전하게 plan name 반환"""
        try:
            if obj.plan_name:
                return obj.plan.name
        except Exception as e:
            print(f"⚠️ Error getting plan name for subscription {obj.id}: {e}")
        return ""

    def get_plan_price(self, obj):
        """안전하게 plan price 반환"""
        try:
            if obj.plan:
                return obj.plan.price
        except Exception as e:
            print(f"⚠️ Error getting plan price for subscription {obj.id}: {e}")
        return 0
    class Meta:
        model = Subscription
        # API를 통해 보여줄 필드    목록
        # fields = ['id', 'user', 'plan_name', 'plan_service_name', 'start_date', 'next_payment_date', 'price_override']
        fields = [
            'id',
            'plan_name',  # 3번
            'plan_service_name',  # 2번
            'plan_service_category',  # 1번 (차트 문제 해결!)
            'plan_price',  # 4번
            'status',
            'start_date',
            'next_payment_date',
            'custom_memo',
            'price_override',  # 월/연간 합계 문제 해결용
            'user',
            'plan',  # plan_id (숫자)
        ]
        # 'user' 필드는 요청 본문(body)으로 받지 않고, 서버에서 자동으로 설정할 것이므로 읽기 전용으로 설정
        read_only_fields = ['user', 'start_date', 'next_payment_date']