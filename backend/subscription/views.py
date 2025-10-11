from django.shortcuts import render
from .models import Subscription
from .serializers import SubscriptionSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Sum
from django.db.models.functions import Coalesce
from decimal import Decimal
from rest_framework.response import Response


# Create your views here.
class SubscriptionView(viewsets.ModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    # permission_classes = [IsAuthenticated]  # ★ 로그인 필수 // 비로그인 401/403 응답 // 로그인된 후 접근 권한은 있는가
    authentication_classes = [JWTAuthentication]  # ★ JWT 인증 사용 // 로그인을 어떻게 할 것인가?

    search_fields = ['user_id__username', 'plan_id__plan_name', 'plan_id__service_id__name']


    def list(self, request, *args, **kwargs):
        user_id = request.query_params.get("user_id")
        if not user_id:#user_id가 없으면 에러
            return Response({"detail": "user_id query param is required"}, status=400)
        
        queryset = Subscription.objects.select_related("plan_id").filter(user_id=user_id)
        total_price = queryset.aggregate(
            total=Coalesce(Sum('plan_id__price'), Decimal('0'))
        )['total']
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data,
            'total_price': total_price
        })