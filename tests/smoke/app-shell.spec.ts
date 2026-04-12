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
        'planner',
        'focus',
        'habits',
        'statistics',
        'pet',
        'settings',
      ]),
    )
  })
}

test.describe('app shell smoke', () => {
  test.use({ viewport: DESKTOP_VIEWPORT })

  test('loads the shell, shows sidebar navigation, and opens a main page', async ({ page }) => {
    await seedStableAppState(page)

    await page.goto('/')

    await expect(page.locator('aside')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()

    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings$/)

    const main = page.locator('main')
    await expect(main).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save AI Settings' })).toBeVisible()
    await expect(main).toContainText('Configure appearance, feature modules, and data management')

    const mainText = await main.innerText()
    expect(mainText.trim().length).toBeGreaterThan(150)
  })
})
