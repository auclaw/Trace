import { expect, test } from '@playwright/test'

const DESKTOP_VIEWPORT = { width: 1440, height: 900 }

async function seedTestData(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('trace-language', 'zh-CN')
    localStorage.setItem('trace-first-launch-done', '1')
    localStorage.setItem('trace-theme', 'light')
    localStorage.setItem('trace-seeded', 'false')
  })
}

test.describe('任务操作端到端测试', () => {
  test.use({ viewport: DESKTOP_VIEWPORT })

  test.beforeEach(async ({ page }) => {
    await seedTestData(page)
    await page.goto('/')
  })

  test('应该能够添加新任务', async ({ page }) => {
    // 导航到任务页面
    await page.getByRole('link', { name: '任务' }).click()
    await expect(page).toHaveURL(/\/task$/)

    // 点击添加任务按钮
    await page.getByRole('button', { name: '添加任务' }).click()

    // 填写任务信息
    await page.getByPlaceholder('任务标题').fill('测试任务 - 撰写项目文档')
    await page.getByPlaceholder('例如: 撰写需求文档 (选填)').fill('完成项目需求文档')
    await page.getByRole('button', { name: '添加任务' }).nth(1).click()

    // 验证任务已添加
    await expect(page.getByText('测试任务 - 撰写项目文档')).toBeVisible()
  })

  test('应该能够选择多个任务并批量完成', async ({ page }) => {
    // 导航到任务页面
    await page.getByRole('link', { name: '任务' }).click()
    await expect(page).toHaveURL(/\/task$/)

    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]', { timeout: 5000 })

    // 选择前3个任务
    const taskCheckboxes = page.locator('[data-testid="task-checkbox"]')
    const count = await taskCheckboxes.count()

    if (count >= 3) {
      await taskCheckboxes.nth(0).click()
      await taskCheckboxes.nth(1).click()
      await taskCheckboxes.nth(2).click()

      // 验证批量操作栏显示
      await expect(page.getByText('已选择 3 /')).toBeVisible()

      // 点击批量完成
      await page.getByRole('button', { name: '批量完成' }).click()

      // 验证成功提示
      await expect(page.getByText('已完成 3 个任务')).toBeVisible()
    }
  })

  test('应该能够批量归档任务', async ({ page }) => {
    // 导航到任务页面
    await page.getByRole('link', { name: '任务' }).click()
    await expect(page).toHaveURL(/\/task$/)

    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]', { timeout: 5000 })

    // 选择前2个任务
    const taskCheckboxes = page.locator('[data-testid="task-checkbox"]')
    const count = await taskCheckboxes.count()

    if (count >= 2) {
      await taskCheckboxes.nth(0).click()
      await taskCheckboxes.nth(1).click()

      // 点击批量归档
      await page.getByRole('button', { name: '归档' }).click()

      // 验证成功提示
      await expect(page.getByText('已归档 2 个任务')).toBeVisible()
    }
  })

  test('应该能够删除单个任务', async ({ page }) => {
    // 导航到任务页面
    await page.getByRole('link', { name: '任务' }).click()
    await expect(page).toHaveURL(/\/task$/)

    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]', { timeout: 5000 })

    // 点击第一个任务的删除按钮
    const deleteButtons = page.locator('[data-testid="task-delete"]')
    const count = await deleteButtons.count()

    if (count > 0) {
      // 获取第一个任务标题
      const firstTaskTitle = await page.locator('[data-testid="task-title"]').nth(0).innerText()

      await deleteButtons.nth(0).click()

      // 确认删除
      await page.getByRole('button', { name: '删除' }).click()

      // 验证删除成功提示
      await expect(page.getByText('已成功删除')).toBeVisible()
    }
  })

  test('应该能够拖拽任务到时间线', async ({ page }) => {
    // 导航到时间线页面
    await page.getByRole('link', { name: '时间线' }).click()
    await expect(page).toHaveURL(/\/timeline$/)

    // 等待待安排任务列表加载
    await page.waitForSelector('[data-testid="unscheduled-task"]', { timeout: 5000 })

    // 获取第一个待安排任务
    const unscheduledTasks = page.locator('[data-testid="unscheduled-task"]')
    const count = await unscheduledTasks.count()

    if (count > 0) {
      // 获取任务标题
      const taskTitle = await unscheduledTasks.nth(0).locator('[data-testid="task-title"]').innerText()

      // 拖拽任务到时间线
      const timelineArea = page.locator('[data-testid="timeline-day"]').nth(0)

      await unscheduledTasks.nth(0).hover()
      await page.mouse.down()

      await timelineArea.hover({ position: { x: 100, y: 200 } })
      await page.mouse.up()

      // 等待一段时间让拖放完成
      await page.waitForTimeout(1000)

      // 验证任务不再在待安排列表中
      const remainingTasks = page.locator('[data-testid="unscheduled-task"]')
      const newCount = await remainingTasks.count()
      expect(newCount).toBeLessThan(count)
    }
  })

  test('应该能够编辑任务详情', async ({ page }) => {
    // 导航到任务页面
    await page.getByRole('link', { name: '任务' }).click()
    await expect(page).toHaveURL(/\/task$/)

    // 等待任务列表加载
    await page.waitForSelector('[data-testid="task-item"]', { timeout: 5000 })

    // 点击第一个任务
    const taskItems = page.locator('[data-testid="task-item"]')
    const count = await taskItems.count()

    if (count > 0) {
      await taskItems.nth(0).click()

      // 等待详情面板打开
      await page.waitForSelector('[data-testid="task-detail-panel"]', { timeout: 5000 })

      // 编辑任务标题
      const titleInput = page.locator('[data-testid="task-title-input"]')
      await titleInput.fill('')
      await titleInput.fill('已编辑的任务标题')

      // 保存修改
      await page.getByRole('button', { name: '保存' }).click()

      // 验证修改成功
      await expect(page.getByText('任务已更新')).toBeVisible()
    }
  })
})
