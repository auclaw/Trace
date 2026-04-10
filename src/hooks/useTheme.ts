import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'
import { colorThemeConfigs, backgroundSkinConfigs } from '../config/themes'
import type { ColorTheme, BackgroundSkin } from '../config/themes'

export function useTheme() {
  const theme = useAppStore((s: AppState) => s.theme)
  const colorTheme = useAppStore((s: AppState) => s.colorTheme)
  const backgroundSkin = useAppStore((s: AppState) => s.backgroundSkin)

  const isDark = theme === 'dark'
  const accentColor = colorThemeConfigs[colorTheme as ColorTheme].accent
  const accentSoft = colorThemeConfigs[colorTheme as ColorTheme].accentSoft
  const bgClass = backgroundSkinConfigs[backgroundSkin as BackgroundSkin].getBgClass(isDark)

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
