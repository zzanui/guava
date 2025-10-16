# subscriptions/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated # 로그인 권한
from .models import Subscription, models
from .serializers import SubscriptionSerializer

#list 메서드 커스터마이징을 위한 import
from rest_framework.response import Response
from django.db.models.functions import Coalesce
from decimal import Decimal
from django.db.models import Sum


class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    # 이 API는 반드시 로그인한 사용자만 접근 가능
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        이 함수는 매우 중요합니다!
        요청을 보낸 사용자의 구독 목록만 필터링해서 반환합니다.
        이것이 없으면 모든 유저의 구독 정보가 노출될 수 있습니다.
        """
        if getattr(self, 'swagger_fake_view', False):
            # 스키마 생성 시에는 빈 쿼리셋 반환
            return Subscription.objects.none()
        # 로그인한 본인 것만
        return Subscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        새로운 구독 정보를 생성할 때, user 필드에 현재 로그인한 사용자를
        자동으로 할당해주는 함수입니다.
        """
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        if getattr(self, 'swagger_fake_view', False):
            return Response({'count': 0, 'results': [], 'total_price': Decimal('0')})

        queryset = self.filter_queryset(
            self.get_queryset().select_related("plan") 
        )
        
        # price_override가 있으면 그 값을, 없으면 plan.price를 합산
        total_price = queryset.aggregate(
            total=Sum(Coalesce('price_override', 'plan__price',
                               output_field=models.DecimalField(max_digits=10, decimal_places=2)))
        )['total'] or Decimal('0')

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data,
            'total_price': total_price
        })