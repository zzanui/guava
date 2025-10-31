import { test, expect } from '@playwright/test';

test('통합: 서비스 검색 → 상세 페이지 진입(스텁 응답)', async ({ page }) => {
  // 리스트
  await page.route('**/api/services/**', async (route) => {
    const url = route.request().url();
    if (/\/api\/services\/(\d+)\/$/.test(url)) {
      const id = Number(url.match(/(\d+)/)?.[0] || 1);
      const detail = {
        id,
        name: id === 1 ? '넷플릭스' : '디즈니+',
        category: 'ott',
        official_link: null,
        logo_url: null,
        plans: [
          { id: 100 + id, plan_name: 'Basic', price: 9500, billing_cycle: 'month', benefits: 'FHD' },
          { id: 200 + id, plan_name: 'Standard', price: 13500, billing_cycle: 'month', benefits: 'FHD,2명' },
        ],
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) });
      return;
    }
    const list = [
      { id: 1, name: '넷플릭스', category: 'ott' },
      { id: 2, name: '디즈니+', category: 'ott' },
    ];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(list) });
  });

  await page.goto('/search?q=넷');

  await expect(page.getByRole('heading', { name: '서비스 검색' })).toBeVisible();
  await expect(page.getByText('표시', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: '상세 보기' }).first()).toBeVisible();

  // 첫 카드 상세로 이동
  await page.getByRole('link', { name: '상세 보기' }).first().click();
  await page.waitForURL(/\/services\//);

  // 플랜 두 개 노출 확인
  await expect(page.getByText('Basic')).toBeVisible();
  await expect(page.getByText('Standard')).toBeVisible();
});


