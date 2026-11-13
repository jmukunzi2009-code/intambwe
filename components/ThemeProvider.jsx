'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeContext = createContext(null);
const themeListeners = new Set();

function getThemeSnapshot() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function subscribeToTheme(listener) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function notifyThemeChange() {
  themeListeners.forEach((listener) => listener());
}

function setThemePreference(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  if (persist) window.localStorage.setItem('intambwe-theme', theme);
  notifyThemeChange();
}

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => 'light');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('intambwe-theme');
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setThemePreference(initialTheme, false);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemePreference(nextTheme);
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
}

export function ThemeModeButton({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const targetTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${targetTheme} mode`}
      title={`Switch to ${targetTheme} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
    </button>
  );
}
