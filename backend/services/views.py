# services/views.py
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Service, Plan, Card, Telecom
from .serializers import ServiceSerializer, ServiceDetailSerializer, \
                        PlanSerializer, CardSerializer, TelecomSerializer

from .filters import ServiceFilter


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    모든 구독 서비스의 목록 및 상세 정보를 조회합니다.
    (권한: 누구나 조회 가능)
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filterset_class = ServiceFilter
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ServiceDetailSerializer
        return ServiceSerializer


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    특정 서비스에 속한 요금제 목록 및 상세 정보를 조회합니다.
    (권한: 누구나 조회 가능)
    """
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]

    # URL로부터 service_pk를 받아 해당 서비스의 요금제만 필터링합니다.
    def get_queryset(self):

        if getattr(self, 'swagger_fake_view', False):
            # 스키마 생성 시에는 빈 쿼리셋 반환
            return Plan.objects.none()

        return Plan.objects.filter(service_id=self.kwargs['service_pk'])


# --- 기타 마스터 데이터 API ---

class CardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    카드사 목록 및 상세 정보를 조회합니다.
    (권한: 누구나 조회 가능)
    """
    queryset = Card.objects.all()
    serializer_class = CardSerializer
    permission_classes = [AllowAny]


class TelecomViewSet(viewsets.ReadOnlyModelViewSet):
    """
    통신사 목록 및 상세 정보를 조회합니다.
    (권한: 누구나 조회 가능)
    """
    queryset = Telecom.objects.all()
    serializer_class = TelecomSerializer
    permission_classes = [AllowAny]


class ComparisonView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
    throttle_scope = 'comparison'

    @extend_schema(
        description="여러 서비스 ID를 받아 상세 정보를 비교하여 반환하는 API",
        # 이 API는 GET 요청 시 request body가 없으므로 request=None
        request=None,
        # 이 API의 성공 응답(200 OK)은 ServiceDetailSerializer 형태의 리스트라고 알려줌
        responses=ServiceDetailSerializer(many=True)
    )
    def get(self, request):
        ids_str = request.query_params.get('ids', '')
        if not ids_str:
            return Response({"error": "No service IDs provided"}, status=400)

        try:
            service_ids = [int(id) for id in ids_str.split(',')][:5]
        except ValueError:
            return Response({"error": "Invalid ID format"}, status=400)

        services = Service.objects.filter(pk__in=service_ids)
        serializer = ServiceDetailSerializer(services, many=True)
        return Response(serializer.data)