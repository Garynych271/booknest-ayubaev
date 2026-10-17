// @vitest-environment jsdom
import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../src/contexts/AuthProvider';
import { useAuth } from '../src/contexts/auth';
import { ThemeProvider } from '../src/contexts/ThemeProvider';
import { THEME_STORAGE_KEY, useTheme } from '../src/contexts/theme';

beforeEach(() => localStorage.clear());

describe('global contexts', () => {
  it('reads, toggles and persists the theme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(useTheme, { wrapper });
    expect(result.current.theme).toBe('dark');
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    await waitFor(() => expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light'));
  });

  it('provides only the local current-user stub', () => {
    const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(useAuth, { wrapper });
    expect(result.current.user).toEqual({ id: 'local-reader', displayName: 'Учебный читатель', role: 'reader' });
    expect(Object.keys(result.current)).toEqual(['user']);
  });
});
