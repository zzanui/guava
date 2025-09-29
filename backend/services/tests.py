from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Service, Plan


class PlanAPITestCase(APITestCase):
    # 테스트 시작 전, 테스트에 필요한 데이터를 미리 생성합니다.
    def setUp(self):
        self.service1 = Service.objects.create(name='Netflix', category='video')
        self.plan1_1 = Plan.objects.create(service=self.service1, plan_name='Basic', price=9500, benefits={})
        self.plan1_2 = Plan.objects.create(service=self.service1, plan_name='Premium', price=17000, benefits={})

        self.service2 = Service.objects.create(name='YouTube', category='video')
        self.plan2_1 = Plan.objects.create(service=self.service2, plan_name='Premium', price=10450, benefits={})

    def test_list_plans_for_a_service(self):
        """특정 서비스의 요금제 목록이 정상적으로 반환되는지 테스트"""
        # /api/services/1/plans/ URL을 동적으로 생성
        url = f'/api/services/{self.service1.id}/plans/'

        # API에 GET 요청
        response = self.client.get(url)

        # 1. 응답 코드가 200 OK인지 확인
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. 반환된 요금제의 개수가 2개인지 확인
        self.assertEqual(len(response.data), 2)

        # 3. 반환된 데이터에 YouTube 요금제는 없는지 확인
        plan_names = [item['plan_name'] for item in response.data]
        self.assertIn('Basic', plan_names)
        self.assertNotIn('YouTube Premium', plan_names)