import { createContext, useContext } from 'react';
import type { CurrentUser } from '../../types';

export interface AuthContextValue {
  user: CurrentUser | null;
  signIn: () => void;
  signOut: () => void;
}

export const AUTH_STORAGE_KEY = 'booknest.auth.stub';
export const localUser: CurrentUser = { id: 'local-reader', displayName: 'Учебный читатель', role: 'reader' };
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
