import { test, expect } from '@playwright/test';

// 간단한 JWT (미서명, 디코딩만 사용하는 용도)
const ACCESS = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImRlbW8iLCJleHAiIjoyNTM0MDk1MjAwfQ.test';
const REFRESH = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsImV4cCI6MjUzNDA5NTIwMH0.test';

test('통합: 로그인 후 마이페이지 로드(스텁 응답)', async ({ page }) => {
  // 로그인/프로필/마이페이지 관련 API 스텁
  await page.route('**/api/auth/login/', async (route) => {
    const json = { access: ACCESS, refresh: REFRESH };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.route('**/api/my/subscriptions/**', async (route) => {
    const json = { results: [], total_price: 0 };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.route('**/api/telecoms/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/cards/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/services/**', async (route) => {
    // 최소 데이터(이름 맵 구성용)
    const body = JSON.stringify([{ id: 1, name: '넷플릭스' }]);
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });
  await page.route('**/api/my/bookmarks/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/login');
  await page.getByLabel('아이디').fill('demo');
  await page.getByLabel('비밀번호').fill('demo1234');
  await page.getByRole('button', { name: '로그인' }).click();

  await page.waitForURL(/\/mypage/);
  await expect(page.getByRole('heading', { name: '마이페이지' })).toBeVisible();
  await expect(page.getByText('아직 등록된 구독이 없습니다.')).toBeVisible();
});


