# services/filters.py
from django.db.models import Q
from django_filters import rest_framework as filters
from .models import Service


class ServiceFilter(filters.FilterSet):
    # 1. 'q' 파라미터를 'name' 필드 검색에 사용하도록 연결
    q = filters.CharFilter(field_name='name', lookup_expr='icontains')
    categories = filters.BaseInFilter(method='filter_by_categories')
    # 2. 'min_price'와 'max_price' 파라미터로 가격 범위 필터링
    #    field_name="plans__price"는 Service 모델과 연결된 Plan 모델의 price 필드를 의미
    min_price = filters.NumberFilter(method='filter_by_monthly_price')
    max_price = filters.NumberFilter(method='filter_by_monthly_price')

    # 3. 'sort' 파라미터를 위한 정렬 필터 추가
    sort = filters.OrderingFilter(
        # 프론트엔드에서 사용할 정렬 옵션 정의
        # ('DB 필드명', '프론트엔드에서 사용할 이름')
        fields=(
            ('plans__price', 'price'),  # ?sort=price 또는 ?sort=-price (오름/내림차순)
            ('name', 'name'),  # ?sort=name 또는 ?sort=-name
        )
    )

    def filter_by_monthly_price(self, queryset, name, value):
        # 'name'은 'min_price' 또는 'max_price'가 됩니다.
        # 'value'는 사용자가 입력한 가격입니다.

        # Q 객체를 사용해 복잡한 OR 조건을 만듭니다.
        # 조건 1: 월간 요금제(month)가 가격 범위에 맞는 경우
        monthly_q = Q(plans__billing_cycle='month')

        # 조건 2: 연간 요금제(year)의 '월 환산 가격'이 범위에 맞는 경우
        yearly_q = Q(plans__billing_cycle='year')

        if name == 'min_price':
            monthly_q &= Q(plans__price__gte=value)
            yearly_q &= Q(plans__price__gte=value * 12)  # 연간 가격으로 환산

        elif name == 'max_price':
            monthly_q &= Q(plans__price__lte=value)
            yearly_q &= Q(plans__price__lte=value * 12)  # 연간 가격으로 환산

        # 3. (월간 요금제가 맞거나 OR 연간 요금제가 맞거나)
        # .distinct()로 중복된 서비스가 나오지 않게 합니다.
        return queryset.filter(monthly_q | yearly_q).distinct()

    def filter_by_categories(self, queryset, name, value_list):
        # value_list는 프론트에서 보낸 ['ott', 'music'] 배열입니다.
        if not value_list:
            return queryset

        # 💡 대소문자를 무시하는 Q 객체를 동적으로 생성하여 OR 검색
        query = Q()
        for value in value_list:
            query |= Q(category__iexact=value)  # 'iexact'로 대소문자 무시

        return queryset.filter(query).distinct()

    class Meta:
        model = Service
        # API가 필터링에 사용할 모든 파라미터 이름을 여기에 명시합니다.
        fields = ['q', 'categories', 'min_price', 'max_price', 'sort']
