import { useAppStore } from '../store/useAppStore'
import { colorThemeConfigs, backgroundSkinConfigs } from '../config/themes'

export function useTheme() {
  const theme = useAppStore((s) => s.theme)
  const colorTheme = useAppStore((s) => s.colorTheme)
  const backgroundSkin = useAppStore((s) => s.backgroundSkin)

  const isDark = theme === 'dark'
  const accentColor = colorThemeConfigs[colorTheme].accent
  const accentSoft = colorThemeConfigs[colorTheme].accentSoft
  const bgClass = backgroundSkinConfigs[backgroundSkin].getBgClass(isDark)

  return {
    theme,
    isDark,
    colorTheme,
    backgroundSkin,
    accentColor,
    accentSoft,
    bgClass,
  }
}

export default useTheme
