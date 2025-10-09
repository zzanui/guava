# subscriptions/urls.py (새로 만들기)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionViewSet

router = DefaultRouter()
# 'subscriptions' 라는 URL 경로에 SubscriptionViewSet을 연결
router.register(r'subscriptions', SubscriptionViewSet, basename='subscriptions')

urlpatterns = [
    path('', include(router.urls)),
]
