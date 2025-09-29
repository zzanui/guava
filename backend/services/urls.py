# services/urls.py
from django.urls import path, include
from rest_framework_nested import routers
from .views import ServiceViewSet, PlanViewSet, CardViewSet, TelecomViewSet

# 1. 최상위 라우터 생성
router = routers.DefaultRouter()

# 2. 최상위 라우터에 ViewSet 등록
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'telecoms', TelecomViewSet, basename='telecom')

# 3. 'services' 아래에 'plans'를 위한 중첩 라우터 생성
#  -> /api/services/{service_pk}/plans/ 와 같은 URL을 만들어줍니다.
plans_router = routers.NestedDefaultRouter(router, r'services', lookup='service')
plans_router.register(r'plans', PlanViewSet, basename='service-plans')

# 4. urlpatterns에 모든 라우터 URL 포함
urlpatterns = [
    path('', include(router.urls)),
    path('', include(plans_router.urls)),
]