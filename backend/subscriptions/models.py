# subscriptions/models.py
from django.conf import settings
from django.db import models
from services.models import Plan # services 앱의 Plan 모델을 가져옴


# 사용자별 구독서비스 사용목록
class Subscription(models.Model):
    id = models.BigAutoField(db_column="subscription_id", help_text="Subscription ID", primary_key=True)
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column="user_id", related_name="subscriptions", on_delete=models.CASCADE)
    plan = models.ForeignKey(to="services.Plan", db_column="plan_id", related_name="subscriptions", on_delete=models.CASCADE)
    status = models.BooleanField(db_column="status", default=True)
    start_date = models.DateField(db_column="start_date")
    next_payment_date = models.DateField(db_column="next_payment_date")
    custom_memo = models.TextField(db_column="custom_memo")
    price_override = models.DecimalField(db_column="price_override", max_digits=10, decimal_places=2 , null=True, blank=True)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="updated_at", auto_now=True)

    class Meta:
        db_table = 'subscription'   # 실제 테이블명 그대로
        managed = False         # Django가 테이블을 만들거나 변경하지 않음

    def __str__(self):
        plan_name = getattr(self.plan, "plan_name", "Unknown")
        username = getattr(self.user, "username", "Unknown")
        return f"{username}의 {plan_name} 구독"


#북마크
class Bookmark(models.Model):
    id = models.BigAutoField(db_column="bookmark_id", help_text="Bookmark ID", primary_key=True)
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column="user_id", related_name="bookmarks", on_delete=models.CASCADE)
    service = models.ForeignKey(to="services.Service", db_column="service_id", related_name="bookmarks", on_delete=models.CASCADE)
    memo = models.TextField(db_column="memo", null=True, blank=True)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)

    class Meta:
        db_table = 'bookmark'   # 실제 테이블명 그대로
        managed = False         # Django가 테이블을 만들거나 변경하지 않음

    def __str__(self):
        service_name = getattr(self.service, "name", "Unknown")
        username = getattr(self.user, "username", "Unknown")
        return f"{username}의 {service_name} 북마크"