import { test, expect } from '@playwright/test';

test('happy path: 로그인→마이페이지', async ({ page }) => {
  await page.goto('/');
  await page.goto('/login');

  await page.getByLabel('아이디').fill('demo');
  await page.getByLabel('비밀번호').fill('demo1234');
  await page.getByRole('button', { name: '로그인' }).click();

  await page.waitForURL(/mypage/);
  await expect(page.getByText('마이페이지')).toBeVisible();
});


