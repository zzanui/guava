from django_filters import rest_framework as filters
from .models import Service


class ServiceFilter(filters.FilterSet):
    price = filters.RangeFilter(field_name="plans__price")
    # legacy codes
    # min_price = filters.NumberFilter(field_name="plans__price", lookup_expr='gte')
    # max_price = filters.NumberFilter(field_name="plans__price", lookup_expr='lte')
    name = filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = Service
        # 'category'는 완전 일치 필터로 자동 생성
        fields = ['name', 'category']
