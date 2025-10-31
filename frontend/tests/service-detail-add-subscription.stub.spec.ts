import { test, expect } from '@playwright/test';

const ACCESS = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImRlbW8iLCJleHAiIjoyNTM0MDk1MjAwfQ.test';
const REFRESH = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsImV4cCI6MjUzNDA5NTIwMH0.test';

test('통합: 서비스 상세 → 구독 추가 플로우(스텁 응답)', async ({ page }) => {
  // 사전 로그인(스토리지 기반)
  await page.addInitScript(([a, r]) => {
    localStorage.setItem('access', a);
    localStorage.setItem('refresh', r);
  }, [ACCESS, REFRESH]);

  // 상세/구독 API 스텁
  await page.route('**/api/services/123/**', async (route) => {
    const json = {
      id: 123,
      name: '구아바뮤직',
      category: 'music',
      official_link: null,
      logo_url: null,
      plans: [
        { id: 9001, plan_name: 'Lite', price: 5000, billing_cycle: 'month', benefits: 'FHD' },
        { id: 9002, plan_name: 'Pro', price: 11000, billing_cycle: 'month', benefits: 'FHD,백그라운드' },
      ],
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.route('**/api/my/subscriptions/**', async (route) => {
    if (route.request().method() === 'GET') {
      const json = { results: [], total_price: 0 };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
      return;
    }
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      return;
    }
    await route.continue();
  });

  await page.goto('/services/123');

  // 플랜 카드 존재
  await expect(page.getByText('Lite')).toBeVisible();
  await expect(page.getByText('Pro')).toBeVisible();

  // 첫 플랜 추가 → 모달(선택 단계)
  await page.getByRole('button', { name: '내 구독에 추가' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // 라디오 선택 후 다음
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: '다음' }).click();

  // 세부 정보 입력 단계 → 바로 추가 (기본값 채움)
  await page.getByRole('button', { name: '추가' }).click();

  // 토스트 확인
  await expect(page.getByText('구독 서비스가 추가되었습니다.')).toBeVisible();
});


