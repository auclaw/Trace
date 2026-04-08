// 设计风格预览 - 五种现代生产力工具风格供选择
// 1. Linear/Amie - 极简现代深色
// 2. Notion - 干净白纸知识工作风
// 3. Lark/TickTick - 活泼专业国产风
// 4. Trello - 轻松看板通透风
// 5. Aether - 通透干净现代风 (from Figma dashboard reference)

import { useState } from 'react'

type StyleType = 'linear' | 'notion' | 'lark' | 'trello' | 'aether'

interface StyleConfig {
  name: string
  description: string
  bgBase: string
  bgSurface: string
  bgElevation: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  borderSubtle: string
  accent: string
  accentSoft: string
  shadowSubtle: string
  shadowElevated: string
  radius: string
  fontFamily: string
  inspiration: string
}

const styleConfigs: Record<StyleType, StyleConfig> = {
  aether: {
    name: 'Aether 通透现代',
    description: '浅灰通透背景，超大圆角，极柔阴影，无边框分层。现代通透干净设计风格。',
    bgBase: 'bg-[#f0f0f0]',
    bgSurface: 'bg-[#ffffff]',
    bgElevation: 'bg-[#f8f8f8]',
    textPrimary: 'text-[#1d1d1f]',
    textSecondary: 'text-[#6e6e73]',
    textMuted: 'text-[#86868b]',
    borderSubtle: 'border border-[rgba(0,0,0,0.04)]',
    accent: '#5aa9e6',
    accentSoft: 'rgba(90, 169, 230, 0.15)',
    shadowSubtle: '0 4px 20px rgba(0, 0, 0, 0.05)',
    shadowElevated: '0 8px 35px rgba(0, 0, 0, 0.07)',
    radius: '16px',
    fontFamily: 'Inter, -apple-system',
    inspiration: 'Figma Dashboard Templates, iOS Design Language',
  },
  linear: {
    name: 'Linear/Amie',
    description: '极简现代，极细边框，大量留白，深色优雅。适合深度工作和程序员。',
    bgBase: 'bg-[#111111]',
    bgSurface: 'bg-[#1A1A1A]',
    bgElevation: 'bg-[#252525]',
    textPrimary: 'text-[#FFFFFF]',
    textSecondary: 'text-[#A0A0A0]',
    textMuted: 'text-[#686868]',
    borderSubtle: 'border border-[rgba(255,255,255,0.06)]',
    accent: '#5E6AD2',
    accentSoft: 'rgba(94, 106, 210, 0.15)',
    shadowSubtle: '0 1px 12px rgba(0, 0, 0, 0.3)',
    shadowElevated: '0 8px 32px rgba(0, 0, 0, 0.4)',
    radius: '6px',
    fontFamily: 'Inter',
    inspiration: 'Linear.app, Amie.so',
  },
  notion: {
    name: 'Notion',
    description: '干净白纸，清晰层次，内容优先。适合写作、笔记、知识工作。',
    bgBase: 'bg-[#FFFFFF]',
    bgSurface: 'bg-[#FFFFFF]',
    bgElevation: 'bg-[#F7F7F7]',
    textPrimary: 'text-[#37352F]',
    textSecondary: 'text-[#64748B]',
    textMuted: 'text-[#9B9B9B]',
    borderSubtle: 'border border-[rgba(55, 53, 47, 0.16)]',
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.1)',
    shadowSubtle: '0 1px 3px rgba(0, 0, 0, 0.05)',
    shadowElevated: '0 4px 12px rgba(0, 0, 0, 0.08)',
    radius: '4px',
    fontFamily: 'Inter, -apple-system',
    inspiration: 'Notion.so',
  },
  lark: {
    name: 'Lark/TickTick',
    description: '活泼专业，适度色彩，清晰分组。国人熟悉的协作风格设计。',
    bgBase: 'bg-[#F5F5F5]',
    bgSurface: 'bg-[#FFFFFF]',
    bgElevation: 'bg-[#F0F4FF]',
    textPrimary: 'text-[#1F2329]',
    textSecondary: 'text-[#4E5969]',
    textMuted: 'text-[#86909C]',
    borderSubtle: 'border border-[rgba(22, 24, 35, 0.06)]',
    accent: '#0066FF',
    accentSoft: 'rgba(0, 102, 255, 0.1)',
    shadowSubtle: '0 2px 8px rgba(0, 0, 0, 0.06)',
    shadowElevated: '0 6px 16px rgba(0, 0, 0, 0.08)',
    radius: '8px',
    fontFamily: 'PingFang SC, Inter',
    inspiration: '飞书, TickTick',
  },
  trello: {
    name: 'Trello/Agile',
    description: '轻松看板，浮动卡片，通透背景。适合敏捷开发和团队协作。',
    bgBase: 'bg-[#EBECF0]',
    bgSurface: 'bg-[#FFFFFF]',
    bgElevation: 'bg-[#F4F5F7]',
    textPrimary: 'text-[#172B4D]',
    textSecondary: 'text-[#42526E]',
    textMuted: 'text-[#8993A4]',
    borderSubtle: 'border-none',
    accent: '#0052CC',
    accentSoft: 'rgba(0, 82, 204, 0.1)',
    shadowSubtle: '0 1px 0 rgba(9, 30, 66, 0.15)',
    shadowElevated: '0 4px 8px rgba(9, 30, 66, 0.15)',
    radius: '12px',
    fontFamily: 'Inter, -apple-system',
    inspiration: 'Trello, Atlassian',
  },
}

const StylePreview = () => {
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('aether')
  const config = styleConfigs[selectedStyle]

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-serif font-semibold mb-3 text-[var(--color-text-primary)]">
          🎨 选择设计风格
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          基于顶尖生产力产品的设计语言，四种成熟方案供你选择。点击左侧选择，右侧实时预览各个UI组件。
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Style Selection */}
        <div className="lg:col-span-1">
          <div className={`p-5 rounded-card shadow-subtle ${config.bgSurface}`}>
            <h3 className="font-semibold text-lg mb-4 text-[var(--color-text-primary)]">风格选择</h3>
            <div className="space-y-3">
              {(Object.keys(styleConfigs) as StyleType[]).map((key) => {
                const s = styleConfigs[key]
                const isSelected = selectedStyle === key
                return (
                  <div
                    key={key}
                    className={`p-4 cursor-pointer transition-all duration-200 rounded-card ${
                      isSelected
                        ? `ring-2 ring-[${s.accent}] scale-[1.02]`
                        : 'hover:scale-[1.01]'
                    } ${s.bgElevation}`}
                    style={{
                      backgroundColor: isSelected ? s.accentSoft : 'var(--color-bg-surface-1)',
                      border: isSelected ? `2px solid ${s.accent}` : 'none',
                      borderRadius: s.radius,
                    }}
                    onClick={() => setSelectedStyle(key)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold" style={{ color: s.textPrimary }}>
                        {s.name}
                      </h3>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.accent }} />
                      )}
                    </div>
                    <p className="text-xs mb-1" style={{ color: s.textSecondary }}>
                      {s.inspiration}
                    </p>
                    <p className="text-sm" style={{ color: s.textSecondary }}>
                      {s.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Preview - Brainstorm style - show each component separately */}
        <div className="lg:col-span-2">
          <div
            className={`rounded-xl p-6 md:p-8 transition-all duration-300 ${config.bgBase}`}
            style={{ color: config.textPrimary }}
          >
            {/* 1. Color Palette */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                1. 配色板
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div
                  className="aspect-square rounded-card flex flex-col items-end justify-end p-2"
                  style={{ backgroundColor: config.bgBase.replace('bg-', '').replace('[', '').replace(']', ''), border: config.borderSubtle }}
                >
                  <span className="text-[10px]" style={{ color: config.textPrimary.replace('text-', '').replace('[', '').replace(']', '') }}>bg</span>
                </div>
                <div
                  className="aspect-square rounded-card flex flex-col items-end justify-end p-2"
                  style={{ backgroundColor: config.bgSurface.replace('bg-', '').replace('[', '').replace(']', ''), border: config.borderSubtle }}
                >
                  <span className="text-[10px]" style={{ color: config.textPrimary.replace('text-', '').replace('[', '').replace(']', '') }}>surface</span>
                </div>
                <div
                  className="aspect-square rounded-card flex flex-col items-end justify-end p-2"
                  style={{ backgroundColor: config.bgElevation.replace('bg-', '').replace('[', '').replace(']', ''), border: config.borderSubtle }}
                >
                  <span className="text-[10px]" style={{ color: config.textPrimary.replace('text-', '').replace('[', '').replace(']', '') }}>elevation</span>
                </div>
                <div
                  className="aspect-square rounded-card flex flex-col items-end justify-end p-2"
                  style={{ backgroundColor: config.accent }}
                >
                  <span className="text-[10px]" style={{ color: 'white' }}>accent</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div
                  className="h-12 rounded-card flex items-end justify-end p-2"
                  style={{ backgroundColor: config.textPrimary.replace('text-', '').replace('[', '').replace(']', ''), border: config.borderSubtle }}
                >
                  <span className="text-[10px]" style={{ color: config.bgBase.startsWith('bg-[#111') ? 'white' : 'black' }}>text.primary</span>
                </div>
                <div
                  className="h-12 rounded-card flex items-end justify-end p-2"
                  style={{ backgroundColor: config.textSecondary.replace('text-', '').replace('[', '').replace(']', ''), border: config.borderSubtle }}
                >
                  <span className="text-[10px]" style={{ color: config.bgBase.startsWith('bg-[#111') ? 'white' : 'black' }}>text.secondary</span>
                </div>
                <div
                  className="h-12 rounded-card flex items-end justify-end p-2"
                  style={{ backgroundColor: config.textMuted.replace('text-', '').replace('[', '').replace(']', ''), border: config.borderSubtle }}
                >
                  <span className="text-[10px]" style={{ color: config.bgBase.startsWith('bg-[#111') ? 'white' : 'black' }}>text.muted</span>
                </div>
              </div>
            </div>

            {/* 2. Buttons */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                2. 按钮样式
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <button
                  className="px-6 py-3 font-semibold text-white rounded-card"
                  style={{
                    backgroundColor: config.accent,
                    borderRadius: config.radius,
                  }}
                >
                  主按钮
                </button>
                <button
                  className="px-6 py-3 font-medium rounded-card"
                  style={{
                    backgroundColor: config.accentSoft,
                    color: config.accent,
                    borderRadius: config.radius,
                    border: config.borderSubtle,
                  }}
                >
                  次要按钮
                </button>
                <button
                  className="px-4 py-2 text-sm rounded-card"
                  style={{
                    backgroundColor: config.bgElevation,
                    color: config.textSecondary,
                    borderRadius: config.radius,
                  }}
                >
                  小按钮
                </button>
                <button
                  disabled
                  className="px-6 py-3 font-semibold rounded-card opacity-50 cursor-not-allowed"
                  style={{
                    backgroundColor: config.accent,
                    color: 'white',
                    borderRadius: config.radius,
                  }}
                >
                  禁用
                </button>
              </div>
            </div>

            {/* 3. Card / Container */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                3. 卡片容器
              </h3>
              <div
                className="p-6 rounded-card"
                style={{
                  backgroundColor: config.bgSurface.replace('bg-', '').replace('[', '').replace(']', ''),
                  boxShadow: config.shadowSubtle,
                  border: config.borderSubtle,
                  borderRadius: config.radius,
                }}
              >
                <h4 className="font-semibold mb-2" style={{ color: config.textPrimary }}>
                  这是一个卡片
                </h4>
                <p style={{ color: config.textSecondary }}>
                  卡片用来包裹一组相关内容。阴影{config.shadowSubtle === '0 1px 0 rgba(9, 30, 66, 0.15)' ? '非常轻薄' : '柔和'}，{config.borderSubtle === 'border-none' ? '无边框' : '极细边框'}。
                </p>

                <div className="mt-4 p-4 rounded-card" style={{ backgroundColor: config.bgElevation.replace('bg-', '').replace('[', '').replace(']', ''), border: config.borderSubtle, borderRadius: config.radius }}>
                  <p style={{ color: config.textSecondary }}>
                    这是更深一层的elevations，用于内容分组。
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Form Input */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                4. 表单输入
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.textPrimary }}>
                    输入框标签
                  </label>
                  <input
                    type="text"
                    placeholder="请输入内容..."
                    className="w-full px-3 py-2 rounded-card focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: config.bgElevation.replace('bg-', '').replace('[', '').replace(']', ''),
                      color: config.textPrimary.replace('text-', '').replace('[', '').replace(']', ''),
                      border: config.borderSubtle,
                      borderRadius: config.radius,
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: config.textMuted }}>
                    辅助说明文字放在输入框底部
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: config.textPrimary }}>
                    滑块
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full"
                    style={{ accentColor: config.accent }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: config.textMuted }}>
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Modal / Dialog */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                5. 弹窗对话框
              </h3>
              <div
                className="rounded-card overflow-hidden"
                style={{
                  backgroundColor: config.bgSurface.replace('bg-', '').replace('[', '').replace(']', ''),
                  boxShadow: config.shadowElevated,
                  border: config.borderSubtle,
                  borderRadius: config.radius,
                }}
              >
                <div className="p-5 border-b" style={{ borderColor: config.borderSubtle.startsWith('border-') ? config.borderSubtle.replace('border-', '').replace('[', '').replace(']', '') : 'transparent' }}>
                  <h4 className="font-semibold" style={{ color: config.textPrimary }}>
                    修改每日目标
                  </h4>
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: config.textPrimary }}>
                      每日目标（小时）
                    </label>
                    <input
                      type="number"
                      defaultValue={4}
                      className="w-full px-3 py-2 rounded-card focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: config.bgElevation.replace('bg-', '').replace('[', '').replace(']', ''),
                        color: config.textPrimary.replace('text-', '').replace('[', '').replace(']', ''),
                        border: config.borderSubtle,
                        borderRadius: config.radius,
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      className="px-4 py-2 rounded-card"
                      style={{
                        backgroundColor: config.bgElevation.replace('bg-', '').replace('[', '').replace(']', ''),
                        color: config.textSecondary.replace('text-', '').replace('[', '').replace(']', ''),
                        borderRadius: config.radius,
                      }}
                    >
                      取消
                    </button>
                    <button
                      className="px-4 py-2 text-white rounded-card"
                      style={{
                        backgroundColor: config.accent,
                        borderRadius: config.radius,
                      }}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. List / Item 列表 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                6. 列表项
              </h3>
              <div
                className="rounded-card overflow-hidden"
                style={{
                  backgroundColor: config.bgSurface.replace('bg-', '').replace('[', '').replace(']', ''),
                  border: config.borderSubtle,
                  borderRadius: config.radius,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 ${i > 1 ? 'border-t' : ''}`}
                    style={{ borderColor: i > 1 ? (config.borderSubtle.startsWith('border-') ? config.borderSubtle.replace('border-', '').replace('[', '').replace(']', '') : 'transparent') : 'transparent' }}
                  >
                    <div>
                      <div className="font-medium" style={{ color: config.textPrimary }}>
                        {i * 60} - {(i + 1) * 60} • VS Code
                      </div>
                      <div className="text-sm" style={{ color: config.textSecondary }}>
                        merize 开发 • 深度工作 • {i * 60} 分钟
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 text-xs rounded-card"
                        style={{
                          backgroundColor: config.bgElevation.replace('bg-', '').replace('[', '').replace(']', ''),
                          color: config.textSecondary.replace('text-', '').replace('[', '').replace(']', ''),
                          borderRadius: config.radius,
                        }}
                      >
                        编辑
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded-card"
                        style={{
                          backgroundColor: `${config.accent}10`,
                          color: config.accent,
                          borderRadius: config.radius,
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Progress Bar */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                7. 进度条
              </h3>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: config.textSecondary }}>每日目标进度</span>
                  <span style={{ color: config.textPrimary }}>3h 15m / 4h (81%)</span>
                </div>
                <div
                  className="h-4 rounded-full overflow-hidden"
                  style={{ backgroundColor: config.bgElevation.replace('bg-', '').replace('[', '').replace(']', '') }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: '81%',
                      backgroundColor: config.accent,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 8. Typography */}
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: config.textPrimary }}>
                8. 排版
              </h3>
              <div
                className="p-6 rounded-card"
                style={{
                  backgroundColor: config.bgSurface.replace('bg-', '').replace('[', '').replace(']', ''),
                  border: config.borderSubtle,
                  borderRadius: config.radius,
                }}
              >
                <h1 className="text-3xl font-serif font-semibold mb-2" style={{ color: config.textPrimary }}>
                  h1. 这是大标题
                </h1>
                <h2 className="text-xl font-semibold mb-2" style={{ color: config.textPrimary }}>
                  h2. 这是二级标题
                </h2>
                <h3 className="text-lg font-medium mb-3" style={{ color: config.textPrimary }}>
                  h3. 这是三级标题
                </h3>
                <p className="mb-2" style={{ color: config.textPrimary }}>
                  这是正文字。正文段落用于展示较长的内容，清晰易读，符合最佳行高。文字颜色使用primary，确保可读性。
                </p>
                <p className="mb-0" style={{ color: config.textSecondary }}>
                  这是secondary文字，用于次要信息，比如描述和说明，对比度稍低一些减少视觉干扰。
                </p>
              </div>
            </div>

            {/* Style Info */}
            <div className="mt-8 p-6 rounded-card" style={{ backgroundColor: config.bgSurface.replace('bg-', '').replace('[', '').replace(']', ''), boxShadow: config.shadowSubtle, border: config.borderSubtle, borderRadius: config.radius }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: config.textPrimary }}>
                {config.name} 设计规范
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p style={{ color: config.textSecondary }}>
                    <span className="font-medium" style={{ color: config.textPrimary }}>
                      背景:
                    </span>{' '}
                    {config.bgBase}
                  </p>
                </div>
                <div>
                  <p style={{ color: config.textSecondary }}>
                    <span className="font-medium" style={{ color: config.textPrimary }}>
                      强调色:
                    </span>{' '}
                    {config.accent}
                  </p>
                </div>
                <div>
                  <p style={{ color: config.textSecondary }}>
                    <span className="font-medium" style={{ color: config.textPrimary }}>
                      圆角:
                    </span>{' '}
                    {config.radius}
                  </p>
                </div>
                <div>
                  <p style={{ color: config.textSecondary }}>
                    <span className="font-medium" style={{ color: config.textPrimary }}>
                      字体:
                    </span>{' '}
                    {config.fontFamily}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 text-center">
        <p className="text-[var(--color-text-secondary)]">
          选择你喜欢的风格后，我会将整个项目统一更新为这个设计语言。
        </p>
      </div>
    </div>
  )
}

export default StylePreview
