import { useToast } from '../components/ui/Toast'

/**
 * 统一的 Toast 反馈 Hook
 *
 * 提供标准化的成功、错误、信息提示
 * 确保所有页面的交互反馈风格一致
 */
export function useToastFeedback() {
  const { toast } = useToast()

  return {
    /**
     * 成功提示
     * @param message 提示消息
     */
    success: (message: string) => toast(`✅ ${message}`, 'success'),

    /**
     * 错误提示
     * @param message 提示消息
     */
    error: (message: string) => toast(`❌ ${message}`, 'error'),

    /**
     * 信息提示
     * @param message 提示消息
     */
    info: (message: string) => toast(`ℹ️ ${message}`, 'info'),

    /**
     * 警告提示
     * @param message 提示消息
     */
    warning: (message: string) => toast(`⚠️ ${message}`, 'warning'),

    /**
     * 原始 toast 方法，用于自定义场景
     */
    toast,
  }
}
