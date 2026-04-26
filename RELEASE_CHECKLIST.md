# 🚀 上线前检查清单

## Timeline 页面测试数据清理

### 1. 删除测试数据文件夹
```bash
rm -rf src/test-data/
```

### 2. 恢复 Timeline.tsx 中的代码

#### 步骤 1: 恢复 useAppStore import
```typescript
// 删除这行
import { MOCK_TIME_BLOCKS, MOCK_TASKS } from '../test-data/mockTimelineData'

// 恢复 useAppStore 导入（取消注释）
import { useAppStore } from '../store/useAppStore'
```

#### 步骤 2: 恢复真实任务数据
```typescript
// 删除测试数据行
const tasks: Task[] = MOCK_TASKS

// 恢复 useAppStore（取消注释）
const tasks = useAppStore((s) => s.tasks)
```

#### 步骤 3: 恢复真实时间块数据加载
在 `loadDayBlocks` 函数中：
```typescript
// 删除测试数据行
const blocks = MOCK_TIME_BLOCKS.filter(block => block.date === dateStr)

// 恢复 dataService 调用（取消注释）
const blocks = await dataService.getTimeBlocks(dateStr)
```

---

## 完整构建验证
```bash
npm run build
```

---

## 📋 清理完成后检查项

- [ ] Timeline 页面正常加载
- [ ] 无 TypeScript 错误
- [ ] 无控制台错误
- [ ] 时间块显示正常
- [ ] 任务列表显示正常
- [ ] 拖拽功能正常
