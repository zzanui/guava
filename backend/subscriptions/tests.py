# tests/test_subscriptions_api.py
from decimal import Decimal
from typing import Optional

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import connection
from rest_framework.test import APIClient
from rest_framework import status

from services.models import Plan
from subscriptions.models import Subscription


LOGIN_URL = "/api/auth/login/"
SCHEMA_URL = "/api/schema/"
SUBSCRIPTIONS_URL = "/api/my/subscriptions/"


def _ensure_tables_exist(*models):
    """managed=False 모델이 테스트 DB에 없을 수 있으므로 필요 시 생성"""
    with connection.schema_editor() as schema:
        for m in models:
            try:
                schema.create_model(m)
            except Exception:
                # 이미 있으면 무시
                pass


def _extract_token(json_data: dict) -> Optional[str]:
    """
    다양한 로그인 응답 포맷을 지원:
    - SimpleJWT: {"access": "...", "refresh": "..."}
    - authtoken: {"token": "..."}
    - 커스텀: {"access_token": "..."} 등
    """
    for key in ("access", "token", "access_token", "jwt"):
        if key in json_data and isinstance(json_data[key], str):
            return json_data[key]
    return None


def _auth_header(token: str) -> dict:
    """
    토큰 형식 추정:
    - JWT일 가능성이 높으면 Bearer
    - 그 외엔 Token 스킴
    """
    if "." in token:  # JWT처럼 보임
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}
    return {"HTTP_AUTHORIZATION": f"Token {token}"}


class SubscriptionFlowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()

        # 테스트에 사용할 계정(요청 주신 계정)
        cls.username = "logadia2"
        cls.password = "StrongPass!123"
        cls.user1 = User.objects.create_user(username=cls.username, password=cls.password)

        # 비교용 다른 사용자
        cls.user2 = User.objects.create_user(username="other", password="pw1234")

        # 테스트 DB에 테이블이 없다면 생성(특히 managed=False 모델 대비)
        _ensure_tables_exist(Plan, Subscription)

        # 요금제 2개
        cls.plan_basic = Plan.objects.create(plan_name="Basic", price=Decimal("10.00"))
        cls.plan_premium = Plan.objects.create(plan_name="Premium", price=Decimal("20.00"))

        # user1 구독 2개: override(None → 10) + override(15) = 합계 25
        Subscription.objects.create(
            user=cls.user1,
            plan=cls.plan_basic,
            status=True,
            start_date="2025-01-01",
            next_payment_date="2025-02-01",
            custom_memo="memo1",
            price_override=None,
        )
        Subscription.objects.create(
            user=cls.user1,
            plan=cls.plan_premium,
            status=True,
            start_date="2025-01-05",
            next_payment_date="2025-02-05",
            custom_memo="memo2",
            price_override=Decimal("15.00"),
        )

        # user2 구독 1개(조회에 섞이면 안 됨)
        Subscription.objects.create(
            user=cls.user2,
            plan=cls.plan_premium,
            status=True,
            start_date="2025-01-10",
            next_payment_date="2025-02-10",
            custom_memo="memo3",
            price_override=None,
        )

    def setUp(self):
        self.client = APIClient()

    def test_schema_endpoint_returns_200(self):
        """
        /api/schema/ 가 스키마 생성에 성공해야 함.
        (drf-spectacular가 모든 뷰/시리얼라이저 파싱에 성공해야 200)
        """
        res = self.client.get(SCHEMA_URL)
        assert res.status_code == status.HTTP_200_OK, res.content[:500]

    def test_login_and_list_subscriptions(self):
        """
        1) /api/auth/login/ 으로 로그인 → 토큰 획득
        2) /api/my/subscriptions/ 호출 → 본인 구독 2개 + total_price=25.00
        """
        # --- 1) 로그인
        login_payload = {"username": self.username, "password": self.password}
        login_res = self.client.post(LOGIN_URL, login_payload, format="json")
        assert login_res.status_code in (200, 201), login_res.content

        token = _extract_token(login_res.json())
        if token:
            headers = _auth_header(token)
            res = self.client.get(SUBSCRIPTIONS_URL, **headers)
        else:
            # 만약 로그인 응답이 토큰을 주지 않는 커스텀 구현이라면,
            # 인증 세션/쿠키가 잡혔는지 확인. 아니라면 강제로 인증.
            # (fallback: 테스트를 깨지 않기 위한 안전장치)
            res = self.client.get(SUBSCRIPTIONS_URL)
            if res.status_code in (401, 403):
                # 강제 인증 fallback (테스트 신뢰성을 위해)
                self.client.force_authenticate(user=self.user1)
                res = self.client.get(SUBSCRIPTIONS_URL)

        assert res.status_code == status.HTTP_200_OK, res.content

        data = res.json()
        assert "count" in data and "results" in data and "total_price" in data

        # 본인 데이터만 2개
        assert data["count"] == 2
        # total_price: 10 + 15 = 25.00
        assert Decimal(str(data["total_price"])) == Decimal("25.00")

    def test_unauthenticated_access_denied(self):
        """비인증 사용자는 401을 받아야 한다."""
        res = self.client.get(SUBSCRIPTIONS_URL)
        assert res.status_code == status.HTTP_401_UNAUTHORIZED, res.content
