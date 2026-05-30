export type ThemePref = 'system' | 'light' | 'dark'

export function getThemePref(): ThemePref {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('tripsync_theme') as ThemePref) ?? 'system'
}

export function setThemePref(pref: ThemePref) {
  localStorage.setItem('tripsync_theme', pref)
  applyTheme(pref)
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement
  if (pref === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else if (pref === 'light') {
    root.classList.add('light')
    root.classList.remove('dark')
  } else {
    root.classList.remove('dark', 'light')
  }
}

export function initTheme() {
  applyTheme(getThemePref())
}
