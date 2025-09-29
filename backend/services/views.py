# services/views.py
from rest_framework import viewsets
from rest_framework.permissions import AllowAny  # 누구나 접근 가능하도록 설정
from .models import Service, Plan, Card, Telecom
from .serializers import ServiceSerializer, PlanSerializer, CardSerializer, TelecomSerializer


# --- 핵심 마스터 데이터 API ---

class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    모든 구독 서비스의 목록 및 상세 정보를 조회합니다.
    (권한: 누구나 조회 가능)
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]  # 명시적으로 모든 권한 허용


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    특정 서비스에 속한 요금제 목록 및 상세 정보를 조회합니다.
    (권한: 누구나 조회 가능)
    """
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]

    # URL로부터 service_pk를 받아 해당 서비스의 요금제만 필터링합니다.
    def get_queryset(self):
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