import type { View } from '../types';
import { useAuth } from '../contexts/auth';
import { useTheme } from '../contexts/theme';
export interface HeaderProps { view: View; wishlistCount: number }
export function Header({ view, wishlistCount }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return <header className="site-header"><a className="site-header__brand" href="?" aria-label="BookNest, перейти в каталог">BookNest</a>
    <nav className="site-nav" aria-label="Основная навигация"><ul>
      <li><a href="?" aria-current={view === 'catalog' ? 'page' : undefined}>Каталог</a></li>
      <li><a href="?view=book" aria-current={view === 'book' ? 'page' : undefined}>Карточка книги</a></li>
      <li><a href="?view=loan" aria-current={view === 'loan' ? 'page' : undefined}>Форма выдачи</a></li>
      <li><a href="?#wishlist">Мой список (<span data-wishlist-count>{wishlistCount}</span>)</a></li>
    </ul></nav>
    <div className="site-header__preferences">
      <span className="site-header__user">{user.displayName}</span>
      <label className="theme-switch"><input type="checkbox" role="switch" checked={theme === 'dark'} onChange={toggleTheme} /> Тёмная тема</label>
    </div>
  </header>;
}
