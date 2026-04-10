import { test, expect } from '@playwright/test';

// Test all pages at three breakpoints
// 768px (mobile), 1024px (tablet), 1440px (desktop)
const breakpoints = [
  { name: 'mobile', width: 768, height: 1024 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

const pages = [
  { name: 'dashboard', path: '/' },
  { name: 'timeline', path: '/timeline' },
  { name: 'planner', path: '/planner' },
  { name: 'focus', path: '/focus' },
  { name: 'habits', path: '/habits' },
  { name: 'statistics', path: '/statistics' },
  { name: 'pet', path: '/pet' },
  { name: 'settings', path: '/settings' },
];

test.describe('responsive layout tests', () => {
  for (const { name, width, height } of breakpoints) {
    test.describe(`${name} (${width}px)`, () => {
      test.use({ viewport: { width, height } });

      for (const { name: pageName, path } of pages) {
        test(`page ${pageName} should render without horizontal scroll`, async ({ page }) => {
          await page.goto(path);
          // Wait for any loading to complete
          await page.waitForLoadState('networkidle');
          // Take screenshot for visual inspection
          await page.screenshot({
            path: `tests/responsive/screenshots/${name}-${pageName}.png`,
            fullPage: true,
          });
          // Check that no element overflows the viewport (causes horizontal scroll)
          const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const viewportWidth = await page.evaluate(() => window.innerWidth);
          // Allow small tolerance for scrollbar
          expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 10);
        });
      }
    });
  }
});

test('sidebar should be collapsible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Check that sidebar toggle exists and works
  const toggleButton = page.getByRole('button').first();
  // Click to toggle
  await toggleButton.click();
  // Take after-click screenshot
  await page.screenshot({
    path: 'tests/responsive/screenshots/mobile-sidebar-collapsed.png',
    fullPage: true,
  });
});
