import { useEffect, useState, useRef } from 'react'
import { X, Trophy, Target, Clock, Share2, Download, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  totalMinutes: number
  goalMinutes: number
}

// 🎨 分享卡片主题配置
const CARD_THEMES = [
  { name: '晴空', colors: ['#79BEEB', '#D4C4FB', '#FFD3B6'], accent: '#FFD700' },
  { name: '日落', colors: ['#FF6B6B', '#FFA07A', '#FFD93D'], accent: '#FFFFFF' },
  { name: '森林', colors: ['#A8E6CF', '#88D8B0', '#56AB91'], accent: '#FFFFFF' },
  { name: '樱花', colors: ['#FFB6C1', '#FFC0CB', '#FFE4E1'], accent: '#FF69B4' },
  { name: '深海', colors: ['#2193B0', '#6DD5FA', '#FFFFFF'], accent: '#FFFFFF' },
  { name: '极光', colors: ['#667eea', '#764ba2', '#f093fb'], accent: '#FFFFFF' },
  { name: '暖阳', colors: ['#f093fb', '#f5576c', '#fee140'], accent: '#FFFFFF' },
  { name: '薄荷', colors: ['#43e97b', '#38f9d7', '#00c6fb'], accent: '#FFFFFF' },
]

// ✨ 随机文案库
const CARD_TITLES = [
  '🎉 今日目标达成！',
  '⭐ 专注成就解锁！',
  '🏆 今日份成就已达成',
  '💪 专注力 Max！',
  '🌟 今天的你超棒',
  '🎯 目标完成度 100%',
  '✨ 今日份专注已打卡',
  '🌈 又进步了一点点',
  '🔥 专注达人就是你',
  '💫 时间看得见',
]

const ENCOURAGEMENTS = [
  '太棒了！今天的你超棒 🌟',
  '做得很好！继续保持 💪',
  '每天进步一点点 ✨',
  '专注的你闪闪发光 ✨',
  '时间会给你答案 ⏰',
  '坚持就是胜利 🏆',
  '今日份努力已达成 ✅',
  '为你感到骄傲 🎉',
  '专注是最好的投资 📈',
  '每一分钟都有价值 💎',
  '今天也是努力的一天呀 🌻',
  '你的坚持，终将美好 🌸',
]

const BOTTOM_SLOGANS = [
  'Getting better each day',
  '时间看得见',
  '每一分钟都算数',
  '专注 · 成长',
  'Trace your time, trace your dream',
  '日积跬步，以至千里',
  '专注当下，成就未来',
  '和更好的自己相遇',
]

// 从数组中随机选择一项
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 🎨 生成精美的分享卡片（Canvas 实现）
function generateShareCard(
  hours: number,
  mins: number,
  completionPercent: number,
  dateStr: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // 卡片尺寸 - 适合小红书/朋友圈分享
    canvas.width = 800
    canvas.height = 1000

    // 🎲 随机选择主题 + 文案
    const theme = pickRandom(CARD_THEMES)
    const title = pickRandom(CARD_TITLES)
    const encouragement = pickRandom(ENCOURAGEMENTS)
    const slogan = pickRandom(BOTTOM_SLOGANS)

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 800, 1000)
    gradient.addColorStop(0, theme.colors[0])
    gradient.addColorStop(0.5, theme.colors[1])
    gradient.addColorStop(1, theme.colors[2])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 1000)

    // 装饰性圆形
    ctx.globalAlpha = 0.15
    ctx.beginPath()
    ctx.arc(650, 120, 180, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(100, 850, 140, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.globalAlpha = 1

    // 白色卡片容器
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 10
    roundRect(ctx, 60, 80, 680, 840, 40)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // 🏆 Trophy 图标位置
    ctx.fillStyle = theme.accent
    ctx.beginPath()
    ctx.arc(400, 220, 60, 0, Math.PI * 2)
    ctx.fill()

    // Trophy 简化图标
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(360, 200)
    ctx.lineTo(440, 200)
    ctx.lineTo(430, 250)
    ctx.lineTo(370, 250)
    ctx.closePath()
    ctx.stroke()

    // 标题
    ctx.fillStyle = '#3A3638'
    ctx.font = 'bold 44px Quicksand, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, 400, 350)

    // 日期
    ctx.fillStyle = '#9E9899'
    ctx.font = '24px sans-serif'
    ctx.fillText(dateStr, 400, 400)

    // 数据卡片 - 专注时长
    ctx.fillStyle = '#79BEEB20'
    roundRect(ctx, 100, 450, 260, 150, 24)
    ctx.fill()

    ctx.fillStyle = '#2A4A5E'
    ctx.font = 'bold 56px Quicksand, sans-serif'
    ctx.fillText(`${hours}h ${mins}m`, 230, 540)

    ctx.fillStyle = '#9E9899'
    ctx.font = '22px sans-serif'
    ctx.fillText('专注时长', 230, 575)

    // 数据卡片 - 目标完成
    ctx.fillStyle = '#A8E6CF20'
    roundRect(ctx, 440, 450, 260, 150, 24)
    ctx.fill()

    ctx.fillStyle = '#2D5A4A'
    ctx.font = 'bold 56px Quicksand, sans-serif'
    ctx.fillText(`${completionPercent}%`, 570, 540)

    ctx.fillStyle = '#9E9899'
    ctx.font = '22px sans-serif'
    ctx.fillText('目标完成', 570, 575)

    // 进度条背景
    ctx.fillStyle = '#E8E6E1'
    roundRect(ctx, 100, 660, 600, 24, 12)
    ctx.fill()

    // 进度条填充
    const progressWidth = Math.min(600, (completionPercent / 100) * 600)
    const progressGradient = ctx.createLinearGradient(100, 0, 700, 0)
    progressGradient.addColorStop(0, '#79BEEB')
    progressGradient.addColorStop(1, '#D4C4FB')
    ctx.fillStyle = progressGradient
    roundRect(ctx, 100, 660, progressWidth, 24, 12)
    ctx.fill()

    // 鼓励语
    ctx.fillStyle = '#5C5658'
    ctx.font = '26px sans-serif'
    ctx.fillText(encouragement, 400, 740)

    // 底部 Slogan
    ctx.fillStyle = theme.colors[1]
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('Trace · 追踪你的每一分钟', 400, 820)

    ctx.fillStyle = '#C0C0C0'
    ctx.font = '16px sans-serif'
    ctx.fillText(`「${theme.name}」主题 · ${slogan}`, 400, 855)

    resolve(canvas.toDataURL('image/png', 0.95))
  })
}

// 辅助函数：绘制圆角矩形
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// 🎨 分享成就弹窗
function ShareAchievementModal({ isOpen, onClose, totalMinutes, completionPercent }: { isOpen: boolean; onClose: () => void; totalMinutes: number; completionPercent: number }) {
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })

  // 生成卡片
  const handleGenerateCard = async () => {
    setGenerating(true)
    try {
      const url = await generateShareCard(hours, mins, completionPercent, dateStr)
      setImageUrl(url)
    } catch (err) {
      console.error('生成分享卡片失败:', err)
    } finally {
      setGenerating(false)
    }
  }

  // 下载图片
  const handleDownload = () => {
    if (imageUrl && linkRef.current) {
      linkRef.current.href = imageUrl
      linkRef.current.download = `Trace-专注成就-${new Date().toISOString().slice(0, 10)}.png`
      linkRef.current.click()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg mx-4 rounded-[24px] p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 z-10"
        >
          <X size={18} color="#5C5658" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}>
            <Trophy size={32} color="#FFFFFF" />
          </div>

          <h2 className="text-xl font-bold mb-2" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
            生成你的成就卡片
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9E9899' }}>
            保存图片，分享到小红书 / 微博 / 朋友圈 ✨
          </p>

          {/* 预览区域 */}
          <div
            className="rounded-2xl overflow-hidden mb-6 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #79BEEB 0%, #D4C4FB 50%, #FFD3B6 100%)',
              aspectRatio: '4/5',
              maxWidth: '320px',
              border: '2px solid #E8E6E1',
            }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="分享卡片" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/80">
                <ImageIcon size={48} className="mb-3" />
                <p className="text-sm">点击下方按钮生成卡片</p>
              </div>
            )}
          </div>

          {/* 数据摘要 */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#79BEEB' }}>{hours}h {mins}m</p>
              <p className="text-xs" style={{ color: '#9E9899' }}>专注时长</p>
            </div>
            <div className="w-px" style={{ background: '#E8E6E1' }} />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#A8E6CF' }}>{completionPercent}%</p>
              <p className="text-xs" style={{ color: '#9E9899' }}>目标完成</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            {!imageUrl ? (
              <button
                onClick={handleGenerateCard}
                disabled={generating}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #79BEEB 0%, #D4C4FB 100%)' }}
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <ImageIcon size={18} />
                    生成分享卡片
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #A8E6CF 0%, #79BEEB 100%)' }}
                >
                  <Download size={18} />
                  保存图片
                </button>
                <button
                  onClick={() => setImageUrl(null)}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: '#F5F1EA', color: '#5C5658' }}
                >
                  重新生成
                </button>
              </>
            )}
          </div>

          <p className="mt-6 text-xs" style={{ color: '#C0C0C0' }}>
            适合分享到小红书 · 微博 · 朋友圈
          </p>
        </div>

        {/* 隐藏的下载链接 */}
        <a ref={linkRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

export default function DailyGoalAchievedModal({ isOpen, onClose, totalMinutes, goalMinutes }: Props) {
  const [visible, setVisible] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
    }
  }, [isOpen])

  if (!isOpen || !visible) return null

  // 安全限制：单日专注时间不超过24小时
  const safeMinutes = Math.min(totalMinutes, 24 * 60)
  const hours = Math.floor(safeMinutes / 60)
  const mins = safeMinutes % 60
  const completionPercent = Math.min(100, Math.round((safeMinutes / goalMinutes) * 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(58, 54, 56, 0.5)' }}>
      <div
        className="mx-4 max-w-sm w-full transition-all duration-300 scale-100"
        style={{
          background: '#FFFFFF',
          border: '2px solid #D6D3CD',
          borderRadius: '24px',
          boxShadow: '8px 8px 0px rgba(121, 190, 235, 0.3)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-8" />
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFD3B6 0%, #FF8C82 100%)' }}
            >
              <Trophy size={24} color="white" />
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F5F1EA' }}>
              <X size={16} style={{ color: '#9E9899' }} />
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#3A3638', fontFamily: 'Quicksand, sans-serif' }}>
              🎉 今日目标达成！
            </h2>
            <p className="text-sm" style={{ color: '#9E9899' }}>
              今天做得很棒，看看你的成绩吧
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl text-center" style={{ background: '#79BEEB20' }}>
              <Clock size={20} style={{ color: '#79BEEB' }} className="mx-auto mb-2" />
              <p className="text-2xl font-bold" style={{ color: '#2A4A5E', fontFamily: 'Quicksand, sans-serif' }}>
                {hours}h {mins}m
              </p>
              <p className="text-xs" style={{ color: '#9E9899' }}>今日专注时长</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: '#A8E6CF20' }}>
              <Target size={20} style={{ color: '#A8E6CF' }} className="mx-auto mb-2" />
              <p className="text-2xl font-bold" style={{ color: '#2D5A4A', fontFamily: 'Quicksand, sans-serif' }}>
                {completionPercent}%
              </p>
              <p className="text-xs" style={{ color: '#9E9899' }}>目标完成度</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="p-4 rounded-xl mb-6" style={{ background: '#FAF7F2' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9E9899' }}>
              专注分类
            </p>
            <div className="space-y-3">
              {[
                { name: '工作', color: '#79BEEB', minutes: 120, pct: 40 },
                { name: '会议', color: '#D4C4FB', minutes: 60, pct: 20 },
                { name: '学习', color: '#FFD3B6', minutes: 50, pct: 17 },
                { name: '其他', color: '#9E9899', minutes: 70, pct: 23 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs font-medium w-16" style={{ color: '#5C5658' }}>{cat.name}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: '#E8E6E1' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.pct}%`, background: cat.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right" style={{ color: '#5C5658' }}>
                    {Math.floor(cat.minutes / 60)}h {cat.minutes % 60}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onClose()
                // 📊 跳转到 Analytics 完整报告页面
                navigate('/analytics')
              }}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #79BEEB 0%, #5AACDF 100%)', boxShadow: '4px 4px 0px rgba(121, 190, 235, 0.3)' }}
            >
              查看完整报告
            </button>
            <button
              onClick={() => {
                // 🎨 打开精美的分享成就弹窗
                setShowShareModal(true)
              }}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#F5F1EA', color: '#5C5658' }}
            >
              <Share2 size={16} className="inline mr-2" />
              分享成就
            </button>
          </div>
        </div>
      </div>

      {/* 🎨 分享成就弹窗 */}
      <ShareAchievementModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false)
          onClose()
        }}
        totalMinutes={safeMinutes}
        completionPercent={completionPercent}
      />
    </div>
  )
}
