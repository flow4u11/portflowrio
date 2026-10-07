import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App';
import { MotionSettingsProvider } from './components/MotionSettings';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <MotionSettingsProvider><App /></MotionSettingsProvider>
    </MotionConfig>
  </React.StrictMode>,
);
