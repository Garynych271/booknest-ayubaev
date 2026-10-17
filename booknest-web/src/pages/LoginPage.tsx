import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/contexts/auth';
import { Button } from '../shared/components/Button';

interface LoginLocationState { from?: string }

export function LoginPage() {
  const { user, signIn, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as LoginLocationState | null)?.from ?? '/books';
  return <main className="main auth-page">
    <h1>{user ? 'Локальный профиль' : 'Вход в BookNest'}</h1>
    <p>{user ? `Вы вошли как ${user.displayName}.` : 'Это учебная локальная заглушка без пароля, JWT и обращения к серверу.'}</p>
    {user
      ? <Button onClick={signOut}>Выйти из локального профиля</Button>
      : <Button onClick={() => { signIn(); navigate(from, { replace: true }); }}>Войти как учебный читатель</Button>}
  </main>;
}
