import { createContext, useContext } from 'react';
import type { Theme } from '../../types';

export const THEME_STORAGE_KEY = 'booknest.theme';
export interface ThemeContextValue { theme: Theme; toggleTheme: () => void }
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function readTheme(getStorage: () => Storage = () => localStorage): Theme {
  try {
    const saved = getStorage().getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // The system preference remains available when storage is blocked.
  }
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: Theme, getStorage: () => Storage = () => localStorage): boolean {
  try { getStorage().setItem(THEME_STORAGE_KEY, theme); return true; }
  catch { return false; }
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
