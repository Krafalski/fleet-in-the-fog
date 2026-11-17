// Where the app starts: finds <div id="root"> in index.html and draws <App /> inside it.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { THEME } from './config';

// Puts the theme name on the <html> tag, so theme.css can swap colors for it.
document.documentElement.dataset.theme = THEME;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
