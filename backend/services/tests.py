from rest_framework import status
from rest_framework.test import APITestCase
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


class ServiceAPITestCase(APITestCase):
    # Arrange (준비): 모든 테스트 시작 전에 테스트용 데이터를 생성합니다.
    def setUp(self):
        # 서비스 1 (Netflix)와 관련 요금제 2개 생성
        self.service1 = Service.objects.create(name='Netflix', category='OTT')
        Plan.objects.create(service=self.service1, plan_name='Basic', price=9500)
        Plan.objects.create(service=self.service1, plan_name='Premium', price=17000)

        # 서비스 2 (YouTube)와 관련 요금제 1개 생성
        self.service2 = Service.objects.create(name='YouTube Premium', category='OTT')
        Plan.objects.create(service=self.service2, plan_name='Premium', price=10450)

        # 서비스 3 (다른 카테고리)
        self.service3 = Service.objects.create(name='Millie', category='E-Book')
        Plan.objects.create(service=self.service3, plan_name='Monthly', price=9900)

    # --- 1. 검색 및 필터링 기능 테스트 ---

    def test_filter_service_by_category(self):
        """카테고리(category)로 필터링이 잘 되는지 테스트"""
        # Arrange (준비)
        url = '/api/services/?category=OTT'

        # Act (실행)
        response = self.client.get(url)

        # Assert (검증)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # setUp에서 만든 OTT 카테고리 서비스는 Netflix, YouTube 2개여야 함
        self.assertEqual(len(response.data), 2)
        service_names = {item['name'] for item in response.data}
        self.assertIn('Netflix', service_names)
        self.assertIn('YouTube Premium', service_names)

    def test_search_service_by_name(self):
        """서비스 이름(name)으로 검색이 잘 되는지 테스트 (부분 일치)"""
        # Arrange (준비)
        url = '/api/services/?name=flix'  # 'Net'flix'의 일부

        # Act (실행)
        response = self.client.get(url)

        # Assert (검증)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 'flix'를 포함하는 서비스는 Netflix 1개여야 함
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Netflix')

    def test_filter_service_by_price_range(self):
        """가격대(price_min, price_max)로 필터링이 잘 되는지 테스트"""
        # Arrange (준비): 10000원 이상, 11000원 이하의 요금제를 가진 서비스 검색
        url = '/api/services/?price_min=10000&price_max=11000'

        # Act (실행)
        response = self.client.get(url)

        # Assert (검증)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 해당 가격대의 요금제(10450원)를 가진 서비스는 YouTube Premium 1개여야 함
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'YouTube Premium')

    # --- 2. 상세 정보 기능 테스트 ---

    def test_retrieve_service_detail_with_plans(self):
        """상세 조회 시, 관련 요금제(plans) 정보가 포함되는지 테스트"""
        # Arrange (준비)
        url = f'/api/services/{self.service1.id}/'  # Netflix의 상세 페이지 URL

        # Act (실행)
        response = self.client.get(url)

        # Assert (검증)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Netflix')
        # 'plans'라는 키가 응답 데이터에 있는지 확인
        self.assertIn('plans', response.data)
        # Netflix의 요금제는 setUp에서 2개를 만들었으므로 2개가 나와야 함
        self.assertEqual(len(response.data['plans']), 2)

    # --- 3. 가격 비교 기능 테스트 ---

    def test_compare_services_successfully(self):
        """여러 서비스 ID를 받아 비교 데이터를 제대로 반환하는지 테스트"""
        # Arrange (준비)
        url = f'/api/services/compare/?ids={self.service1.id},{self.service3.id}'

        # Act (실행)
        response = self.client.get(url)

        # Assert (검증)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 요청한 ID 개수만큼(2개) 결과가 돌아와야 함
        self.assertEqual(len(response.data), 2)
        service_names = {item['name'] for item in response.data}
        self.assertIn('Netflix', service_names)
        self.assertIn('Millie', service_names)

    def test_compare_services_with_no_ids(self):
        """비교 API에 ID를 전달하지 않았을 때 400 에러가 발생하는지 테스트"""
        # Arrange (준비)
        url = '/api/services/compare/'

        # Act (실행)
        response = self.client.get(url)

        # Assert (검증): 잘못된 요청이므로 400 Bad Request가 와야 함
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)