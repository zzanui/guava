from rest_framework import serializers
from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        # API를 통해 보여줄 필드 목록
        fields = ['id', 'user', 'plan', 'start_date', 'custom_price']
        # 'user' 필드는 요청 본문(body)으로 받지 않고, 서버에서 자동으로 설정할 것이므로 읽기 전용으로 설정
        read_only_fields = ['user']