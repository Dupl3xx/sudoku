import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { resolveScheme } from './theme';
import { getSettings, saveSettings } from './storage';

interface ThemeContextValue {
  scheme: 'light' | 'dark';
  themeSetting: 'auto' | 'light' | 'dark';
  setThemeSetting: (t: 'auto' | 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  themeSetting: 'auto',
  setThemeSetting: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeSetting, setThemeSettingState] = useState<'auto' | 'light' | 'dark'>('auto');

  useEffect(() => {
    getSettings().then((s) => setThemeSettingState(s.theme));
  }, []);

  const setThemeSetting = (t: 'auto' | 'light' | 'dark') => {
    setThemeSettingState(t);
    getSettings().then((s) => saveSettings({ ...s, theme: t }));
  };

  const scheme =
    themeSetting === 'auto'
      ? resolveScheme(systemScheme)
      : themeSetting;

  return (
    <ThemeContext.Provider value={{ scheme, themeSetting, setThemeSetting }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
