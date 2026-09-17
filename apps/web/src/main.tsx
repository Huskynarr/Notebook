import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import './styles/theme.css';

const container = document.getElementById('root');
if (container === null) throw new Error('Wurzelelement #root fehlt in index.html');

createRoot(container).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
