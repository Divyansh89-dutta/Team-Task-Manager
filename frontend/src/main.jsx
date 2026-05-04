import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E1E1E',
            color: '#EEEEEE',
            border: '1px solid #2E2E2E',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#111111' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#111111' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
