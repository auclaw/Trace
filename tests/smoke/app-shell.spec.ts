import { expect, test } from '@playwright/test'

const DESKTOP_VIEWPORT = { width: 1440, height: 900 }

async function seedStableAppState(page: Parameters<typeof test>[0]['page']) {
  await page.addInitScript(() => {
    localStorage.setItem('trace-language', 'en-US')
    localStorage.setItem('trace-first-launch-done', '1')
    localStorage.setItem('trace-theme', 'light')
    localStorage.setItem('trace-color-theme', 'orange')
    localStorage.setItem('trace-background-skin', 'gradient')
    localStorage.setItem('trace-sidebar-collapsed', 'false')
    localStorage.setItem(
      'trace-active-modules',
      JSON.stringify([
        'dashboard',
        'timeline',
        'task',
        'analytics',
        'settings',
      ]),
    )
  })
}

test.describe('app shell smoke', () => {
  test.use({ viewport: DESKTOP_VIEWPORT })

  test('loads the shell, shows sidebar navigation, and opens a main page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30000 })

    // 等待侧边栏出现 - 表示应用已加载
    await page.waitForSelector('aside', { timeout: 30000 })
    await expect(page.locator('aside')).toBeVisible()

    // 等待导航链接出现
    await page.waitForSelector('nav a', { timeout: 10000 })

    // 验证导航链接
    const navLinks = page.locator('nav a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)

    // 点击 Settings 链接 - 使用中文文本因为默认语言是中文
    const settingsLink = page.locator('nav a').filter({ hasText: '设置' })
    await settingsLink.click()
    await page.waitForURL(/\/settings$/, { timeout: 10000 })

    // 验证主内容区
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })

    // 验证页面内容不为空
    const mainText = await main.innerText()
    expect(mainText.trim().length).toBeGreaterThan(50)
  })
})
