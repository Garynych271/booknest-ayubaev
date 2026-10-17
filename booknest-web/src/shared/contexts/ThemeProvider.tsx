import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { readTheme, saveTheme, ThemeContext } from './theme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState(readTheme);
  const toggleTheme = useCallback(() => setTheme(value => value === 'light' ? 'dark' : 'light'), []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  useEffect(() => { saveTheme(theme); }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
