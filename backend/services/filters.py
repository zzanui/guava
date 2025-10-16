# services/filters.py

from django_filters import rest_framework as filters
from .models import Service


class ServiceFilter(filters.FilterSet):
    # 1. 'q' 파라미터를 'name' 필드 검색에 사용하도록 연결
    q = filters.CharFilter(field_name='name', lookup_expr='icontains')

    # 2. 'categories' 파라미터를 배열로 받아 'category' 필드를 필터링
    #    (Category가 Foreign Key일 경우 category__id 또는 category__name 사용)
    categories = filters.BaseInFilter(field_name='category__id', lookup_expr='in')

    # 3. 'min_price'와 'max_price' 파라미터로 가격 범위 필터링
    #    field_name="plans__price"는 Service 모델과 연결된 Plan 모델의 price 필드를 의미
    min_price = filters.NumberFilter(field_name="plans__price", lookup_expr='gte')
    max_price = filters.NumberFilter(field_name="plans__price", lookup_expr='lte')

    # 4. 'sort' 파라미터를 위한 정렬 필터 추가
    sort = filters.OrderingFilter(
        # 프론트엔드에서 사용할 정렬 옵션 정의
        # ('DB 필드명', '프론트엔드에서 사용할 이름')
        fields=(
            ('plans__price', 'price'),  # ?sort=price 또는 ?sort=-price (오름/내림차순)
            ('name', 'name'),  # ?sort=name 또는 ?sort=-name
        )
    )

    class Meta:
        model = Service
        # API가 필터링에 사용할 모든 파라미터 이름을 여기에 명시합니다.
        fields = ['q', 'category', 'min_price', 'max_price']