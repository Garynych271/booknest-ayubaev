import type { PropsWithChildren } from 'react';
import type { CurrentUser } from '../../types';
import { AuthContext } from './auth';

const localUser: CurrentUser = { id: 'local-reader', displayName: 'Учебный читатель', role: 'reader' };
const localAuth = { user: localUser };

export function AuthProvider({ children }: PropsWithChildren) {
  return <AuthContext.Provider value={localAuth}>{children}</AuthContext.Provider>;
}
