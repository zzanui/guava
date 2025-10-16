# services/models.py
from django.db import models


class Service(models.Model):
    id = models.BigAutoField(db_column="service_id", help_text="Service ID", primary_key=True)
    name = models.CharField(db_column="name", max_length=120)
    category = models.CharField(db_column="category", max_length=40, null=True)
    description = models.TextField(db_column="description", null=True)
    official_link = models.CharField(db_column="official_link", max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="updated_at", auto_now=True)
    
    class Meta:
        db_table = 'service'   # 실제 테이블명 그대로
        managed = False         # Django가 테이블을 만들거나 변경하지 않음

    def __str__(self):
        return self.name


class Plan(models.Model):
    id = models.BigAutoField(db_column="plan_id", help_text="Plan ID", primary_key=True)
    service = models.ForeignKey(Service, db_column="service_id", on_delete=models.CASCADE, related_name='plans')
    plan_name = models.CharField(db_column="plan_name", max_length=100)
    billing_cycle = models.CharField(db_column="billing_cycle", max_length=50, default='month')
    price = models.DecimalField(db_column="price", max_digits=10, decimal_places=2)
    benefits = models.TextField(db_column="benefits", blank=True)
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="updated_at", auto_now=True)

    class Meta:
        db_table = "plan"  # 실제 테이블 이름을 정확히 지정
        managed = False    # 외부 테이블이라면 꼭 False

    def __str__(self):
        return f"{self.service.name} - {self.plan_name}"


class Card(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Telecom(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
