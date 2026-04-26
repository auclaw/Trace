# 🧪 测试数据文件夹

## 概述
这个文件夹包含 Timeline 页面的测试用假数据，用于在开发阶段验证各种功能场景。

**⚠️ 重要：上线前必须删除此文件夹！**

---

## 使用方法

### 1. 临时替换数据源
在 `src/services/dataService.ts` 中找到 `getTimeBlocks` 和 `getTasks` 函数，临时替换为测试数据：

```typescript
import { MOCK_TIME_BLOCKS, MOCK_TASKS } from '../test-data/mockTimelineData'

// 临时替换
export const getTimeBlocks = async (date: string): Promise<TimeBlock[]> => {
  // 注释掉原来的代码
  // const response = await api.get(`/time-blocks?date=${date}`)
  // return response.data
  
  // 使用测试数据
  return MOCK_TIME_BLOCKS.filter(block => block.date === date)
}

export const getTasks = async (): Promise<Task[]> => {
  // 注释掉原来的代码
  // const response = await api.get('/tasks')
  // return response.data
  
  // 使用测试数据
  return MOCK_TASKS
}
```

### 2. 另一种方法：在 Timeline 组件中临时注入
在 `src/pages/Timeline.tsx` 中直接导入并使用：

```typescript
import { MOCK_TIME_BLOCKS, MOCK_TASKS } from '../test-data/mockTimelineData'

// 替换 useEffect 中的加载逻辑
useEffect(() => {
  // 注释掉原来的加载
  // loadDayBlocks(...)
  
  // 直接设置测试数据
  const todayStr = formatDateYMD(new Date())
  setLoadedBlocks(new Map([
    [todayStr, MOCK_TIME_BLOCKS.filter(b => b.date === todayStr)]
  ]))
}, [])
```

---

## 测试覆盖场景

| 场景 | 说明 | 测试内容 |
|------|------|----------|
| `AUTO_DETECTED_BLOCKS` | 自动追踪未确认 | AUTO 标签、虚线边框、透明度 |
| `CONFIRMED_BLOCKS` | 已确认的时间块 | ✓ 标签、实色填充 |
| `FUTURE_PLANNED` | 未来计划事件 | 斜线纹理、PLANNED 标签 |
| `SEVERE_CONFLICT` | 严重冲突检测 | 红色发光边框、拖拽时高亮 |
| `LIGHT_CONFLICT` | 轻度冲突 | 正常显示，无警告 |
| `P0_PRIORITY` | P0 最高优先级 | 红色侧边标记 |
| `P1_PRIORITY` | P1 高优先级 | 橙色侧边标记 |
| `SCHEDULED_TASKS` | 已计划任务 | 时间线上的任务块 |
| `UNSCHEDULED_TASKS` | 未计划任务 | 侧边栏待安排列表 |
| `ALL_CATEGORIES` | 所有分类颜色 | 9 种分类颜色展示 |
| `CROSS_DAY` | 跨天数据 | 昨天、今天、明天滚动查看 |

---

## 文件说明

- `mockTimelineData.ts` - 主要测试数据文件
- `README.md` - 本说明文档

---

## 清理步骤（上线前）

1. 恢复 `dataService.ts` 中的真实数据源
2. 删除整个 `src/test-data/` 文件夹
3. 移除 Timeline 组件中的测试数据导入
4. 确认构建无报错：`npm run build`
