from django.urls import path, include
from rest_framework_nested import routers
from .views import ServiceViewSet, PlanViewSet, CardViewSet, TelecomViewSet, ComparisonView

router = routers.DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'telecoms', TelecomViewSet, basename='telecom')

plans_router = routers.NestedDefaultRouter(router, r'services', lookup='service')
plans_router.register(r'plans', PlanViewSet, basename='service-plans')

urlpatterns = [
    path('services/compare/', ComparisonView.as_view(), name='service-comparison'),
    path('', include(router.urls)),
    path('', include(plans_router.urls)),
]
