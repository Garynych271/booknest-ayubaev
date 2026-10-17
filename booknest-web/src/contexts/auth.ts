import { createContext, useContext } from 'react';
import type { CurrentUser } from '../types';

export interface AuthContextValue { user: CurrentUser }
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
