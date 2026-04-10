import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './zh-CN.json'
import enUS from './en-US.json'

const LS_LANG_KEY = 'trace-language'

function getInitialLanguage(): string {
  try {
    const saved = localStorage.getItem(LS_LANG_KEY)
    if (saved && ['zh-CN', 'en-US'].includes(saved)) return saved
  } catch { /* noop */ }
  // Auto-detect browser language
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) return 'zh-CN'
  return 'en-US'
}

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
})

export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang)
  try {
    localStorage.setItem(LS_LANG_KEY, lang)
  } catch { /* noop */ }
}

export function getCurrentLanguage(): string {
  return i18n.language || 'zh-CN'
}

export default i18n
