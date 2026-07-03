import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { ThemeName, themes } from '../constants/theme';

type Preference = ThemeName | 'system';

type ThemeState = {
  preference: Preference;
  setPreference: (preference: Preference) => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  setPreference: (preference) => set({ preference }),
  toggleTheme: () => {
    const next = get().preference === 'dark' ? 'light' : 'dark';
    set({ preference: next });
  },
}));

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const { preference, setPreference, toggleTheme } = useThemeStore();
  const resolvedTheme: ThemeName =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  return {
    colors: themes[resolvedTheme],
    mode: resolvedTheme,
    preference,
    setPreference,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}
