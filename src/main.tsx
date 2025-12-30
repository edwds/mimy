import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './i18n';

// 에러 핸들링
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Root element not found!</div>';
} else {
  try {
    const root = createRoot(rootElement);
    // TODO: Replace with your actual Google Client ID
    const GOOGLE_CLIENT_ID = "519194261404-j45gmu8fcpl0d43do4g8vabp64rg9fkn.apps.googleusercontent.com";

    root.render(
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error}</div>`;
  }
}


