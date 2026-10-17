import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { CurrentUser } from '../../types';
import { AUTH_STORAGE_KEY, AuthContext, localUser } from './auth';

function readUser(): CurrentUser | null {
  try { return localStorage.getItem(AUTH_STORAGE_KEY) === 'guest' ? null : localUser; }
  catch { return localUser; }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(readUser);
  const signIn = useCallback(() => setUser(localUser), []);
  const signOut = useCallback(() => setUser(null), []);
  const value = useMemo(() => ({ user, signIn, signOut }), [signIn, signOut, user]);

  useEffect(() => {
    try { localStorage.setItem(AUTH_STORAGE_KEY, user ? 'local-reader' : 'guest'); }
    catch { /* The in-memory auth stub still works when storage is blocked. */ }
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
