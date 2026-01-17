import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './i18n/config';
import App from './App';
import { ThemeProvider } from './components/theme-provider';
import { AppInitializer } from './components/AppInitializer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="njangitech-ui-theme">
        <AppInitializer>
          <App />
        </AppInitializer>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
