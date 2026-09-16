import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  blueLightProtection: boolean;
  toggleBlueLightProtection: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleDark: () => {},
  blueLightProtection: false,
  toggleBlueLightProtection: () => {},
  reducedMotion: false,
  toggleReducedMotion: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('cn-theme') === 'dark'; } catch { return false; }
  });
  const [blueLightProtection, setBlueLightProtection] = useState(() => {
    try { return localStorage.getItem('cn-blue-light-protection') === 'on'; } catch { return false; }
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    try { return localStorage.getItem('cn-reduced-motion') === 'on'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('cn-theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  useEffect(() => {
    try { localStorage.setItem('cn-blue-light-protection', blueLightProtection ? 'on' : 'off'); } catch {}
    document.documentElement.classList.toggle('blue-light-protection', blueLightProtection);
  }, [blueLightProtection]);

  useEffect(() => {
    try { localStorage.setItem('cn-reduced-motion', reducedMotion ? 'on' : 'off'); } catch {}
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }, [reducedMotion]);

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleDark: () => setIsDark(d => !d),
      blueLightProtection,
      toggleBlueLightProtection: () => setBlueLightProtection(enabled => !enabled),
      reducedMotion,
      toggleReducedMotion: () => setReducedMotion(enabled => !enabled),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
