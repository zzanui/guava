# subscriptions/models.py
from django.conf import settings
from django.db import models
from services.models import Plan # services 앱의 Plan 모델을 가져옴

class Subscription(models.Model):
    # 어떤 유저의 구독 정보인지 연결 (User가 삭제되면, 구독 정보도 함께 삭제)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    # 어떤 요금제를 구독했는지 연결
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)

    # 추가 정보들
    start_date = models.DateField(verbose_name="구독 시작일")
    custom_price = models.PositiveIntegerField(
        verbose_name="사용자 정의 가격",
        null=True, # 사용자가 직접 입력하지 않아도 됨
        blank=True
    )
    # ... 그 외 메모, 결제 주기 등 필요한 필드 추가 ...

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}의 {self.plan.plan_name} 구독"