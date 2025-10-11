from django.db import models
from django.conf import settings

#구독서비스 목록
class Service(models.Model):
    id = models.BigAutoField(db_column="service_id", help_text="Service ID", primary_key=True)
    name = models.CharField(db_column="name", max_length=120)
    category = models.CharField(db_column="category", max_length=40, null=True)
    description = models.TextField(db_column="description", null=True)
    official_link = models.CharField(db_column="official_link", max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="updated_at", auto_now=True)

    USERNAME_FIELD = "name"

    class Meta:
        db_table = 'service'   # 실제 테이블명 그대로
        managed = False         # Django가 테이블을 만들거나 변경하지 않음

#구독서비스 세부 정보
class Plan(models.Model):
    id = models.BigAutoField(db_column="plan_id", help_text="plan_id", primary_key=True)
    service_id = models.ForeignKey("Service", db_column="service_id", related_name="service", on_delete=models.CASCADE)
    plan_name = models.CharField(db_column="plan_name", max_length=80, blank=True, null=False)
    billing_cycle = models.CharField(db_column="billing_cycle", max_length=80, blank=True)
    price = models.DecimalField(db_column="price", max_digits=12, decimal_places=2)
    benefits = models.TextField(db_column="benefits", blank=True)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="updated_at", auto_now=True)
    currency_code = models.CharField(db_column="currency_code", max_length=3, default="KRW")

    USERNAME_FIELD = "plan_name"

    class Meta:
        db_table = 'plan'   # 실제 테이블명 그대로
        managed = False         # Django가 테이블을 만들거나 변경하지 않음


#사용자별 구독서비스 사용목록
class Subscription(models.Model):
    class Status(models.TextChoices): #status용으로 사용
        ACTIVE = "ACTIVE", "Active"
        CANCELED = "CANCELED", "Canceled"

    id = models.BigAutoField(db_column="subscription_id", help_text="Subscription ID", primary_key=True)
    user_id = models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column="user_id", related_name="user", on_delete=models.CASCADE)
    plan_id = models.ForeignKey(to="plan", db_column="plan_id", related_name="plan", on_delete=models.CASCADE)
    status = models.BooleanField(db_column="status", default=True) #True=ACTIVE, False=CANCELED
    start_date = models.DateField(db_column="start_date")
    next_payment_date = models.DateField(db_column="next_payment_date")
    custom_memo = models.TextField(db_column="custom_memo")
    price_override = models.DecimalField(db_column="price_override", max_digits=10, decimal_places=2 , null=True, blank=True)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="updated_at", auto_now=True)

    class Meta:
        db_table = 'subscription'   # 실제 테이블명 그대로
        managed = False         # Django가 테이블을 만들거나 변경하지 않음