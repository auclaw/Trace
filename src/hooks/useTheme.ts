import { useAppStore } from '../store/useAppStore'
import type { AppState } from '../store/useAppStore'
import { colorThemeConfigs, backgroundSkinConfigs } from '../config/themes'
import type { BackgroundSkin } from '../config/themes'

export function useTheme() {
  const theme = useAppStore((s: AppState) => s.theme)
  const backgroundSkin = useAppStore((s: AppState) => s.backgroundSkin)

  const isDark = theme === 'dark'
  const accentColor = colorThemeConfigs['blue'].accent
  const accentSoft = colorThemeConfigs['blue'].accentSoft
  const bgClass = backgroundSkinConfigs[backgroundSkin as BackgroundSkin].getBgClass(isDark)

  return {
    theme,
    isDark,
    backgroundSkin,
    accentColor,
    accentSoft,
    bgClass,
  }
}

export default useTheme
