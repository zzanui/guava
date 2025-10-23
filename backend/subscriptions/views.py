# subscriptions/views.py
import csv
from datetime import date
from dateutil.relativedelta import relativedelta

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated # 로그인 권한
from .models import Subscription, models
from .serializers import SubscriptionSerializer

#list 메서드 커스터마이징을 위한 import
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models.functions import Coalesce
from decimal import Decimal
from django.db.models import Sum
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from django.conf import settings


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
        plan = serializer.validated_data.get('plan')
        today = date.today()

        if plan.billing_cycle == 'year':
            next_payment = today + relativedelta(years=1)
        else:
            next_payment = today + relativedelta(months=1)

        # custom_memo는 일단 빈 값으로(추후 마이 페이지에서 수정가능)
        serializer.save(
            user=self.request.user,
            start_date=today,
            next_payment_date=next_payment,
            custom_memo="")

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

    # 💡 2. CSV 내보내기 '액션'을 추가합니다.
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """
        현재 사용자의 구독 목록을 CSV 파일로 내보냅니다.
        URL: /api/my/subscriptions/export_csv/
        """
        # 💡 3. self.get_queryset()을 재사용하여 '본인 것만' 가져옵니다.
        queryset = self.get_queryset().select_related("plan__service")

        response = HttpResponse(
            content_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename="subscriptions.csv"'},
        )
        response.write(u'\ufeff'.encode('utf8'))  # 한글 깨짐 방지 (BOM 추가)

        writer = csv.writer(response)
        writer.writerow(['서비스명', '요금제', '월 가격', '다음 결제일'])  # CSV 헤더

        for sub in queryset:
            writer.writerow([
                sub.plan.service.name,
                sub.plan.plan_name,
                sub.plan.price,  # 또는 price_override
                sub.next_payment_date
            ])

        return response

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        """
        현재 사용자의 구독 현황을 PDF 파일로 내보냅니다.
        URL: /api/my/subscriptions/export_pdf/
        """
        # 1. 쿼리셋과 총액 계산 (기존 list 뷰 로직 재사용)
        queryset = self.get_queryset().select_related("plan__service")
        total_price = queryset.aggregate(
            total=Sum(Coalesce('price_override', 'plan__price',
                               output_field=models.DecimalField(max_digits=10, decimal_places=2)))
        )['total'] or Decimal('0')

        # 2. 템플릿에 전달할 데이터(context) 준비
        context = {
            'user': request.user,
            'subscriptions': queryset,
            'total_price': total_price
        }

        # 3. HTML 템플릿을 context 데이터와 "구워서" 문자열로 만듭니다.
        html_string = render_to_string('pdf/subscription_report.html', context)

        # 4. WeasyPrint를 사용해 HTML 문자열을 PDF로 변환
        pdf = HTML(string=html_string).write_pdf()

        # 5. PDF 파일을 HTTP 응답으로 반환
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="report.pdf"'

        return response