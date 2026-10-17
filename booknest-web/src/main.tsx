import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import App from './app/App.tsx';
import { AuthProvider } from './shared/contexts/AuthProvider.tsx';
import { ThemeProvider } from './shared/contexts/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
