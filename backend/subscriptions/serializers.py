from rest_framework import serializers
from .models import Subscription, Bookmark
from services.models import Plan


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_service_category = serializers.SerializerMethodField()
    plan_service_name = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    plan_price = serializers.SerializerMethodField()
    plan_billing_cycle = serializers.SerializerMethodField()

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
    
    def get_plan_billing_cycle(self, obj):
        """안전하게 plan billing_cycle 반환"""
        try:
            if obj.plan:
                return obj.plan.billing_cycle
        except Exception as e:
            print(f"⚠️ Error getting plan billing_cycle for subscription {obj.id}: {e}")
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
            'plan_billing_cycle',  # 5번
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

class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = ['id', 'service', 'memo', 'created_at']
        read_only_fields = ['user', 'created_at']


    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        service = attrs.get('service')

        if user and service and Bookmark.objects.filter(user=user, service=service).exists():
            raise serializers.ValidationError("이미 이 서비스는 북마크되어 있습니다.")
        return attrs


    def create(self, validated_data):
        # user를 강제로 주입(클라이언트가 user를 못 바꾸게)
        validated_data['user'] = self.context['request'].user
        # memo None → '' 정리
        validated_data['memo'] = (validated_data.get('memo') or '').strip()
        return super().create(validated_data)