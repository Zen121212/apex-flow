import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './components/atoms/Button/Button.css'; // Preload button styles
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
