import { NavLink } from 'react-router-dom';
import { useAuth } from '../shared/contexts/auth';
import { useTheme } from '../shared/contexts/theme';

export interface HeaderProps { wishlistCount: number }

export function Header({ wishlistCount }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return <header className="site-header">
    <NavLink className="site-header__brand" to="/books" aria-label="BookNest, перейти в каталог">BookNest</NavLink>
    <nav className="site-nav" aria-label="Основная навигация"><ul>
      <li><NavLink to="/books" end>Каталог</NavLink></li>
      <li><NavLink to="/books/new">Новая запись</NavLink></li>
      <li><NavLink to="/loan">Форма выдачи</NavLink></li>
      <li><NavLink to="/wishlist">Мой список (<span data-wishlist-count>{wishlistCount}</span>)</NavLink></li>
      <li><NavLink to="/login">{user ? 'Профиль' : 'Войти'}</NavLink></li>
    </ul></nav>
    <div className="site-header__preferences">
      <span className="site-header__user">{user?.displayName ?? 'Гость'}</span>
      <label className="theme-switch"><input type="checkbox" role="switch" checked={theme === 'dark'} onChange={toggleTheme} /> Тёмная тема</label>
    </div>
  </header>;
}
