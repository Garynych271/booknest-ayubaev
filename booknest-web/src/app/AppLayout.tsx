import { Outlet } from 'react-router-dom';
import { useTheme } from '../shared/contexts/theme';
import { Footer } from './Footer';
import { Header } from './Header';

export interface AppLayoutProps { wishlistCount: number }

export function AppLayout({ wishlistCount }: AppLayoutProps) {
  const { theme } = useTheme();
  return <div className="page" data-theme={theme}>
    <Header wishlistCount={wishlistCount} />
    <Outlet />
    <Footer />
  </div>;
}
