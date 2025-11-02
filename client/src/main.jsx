import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import LuxceraLanding from './LuxceraLanding';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
console.log('[main.jsx] Google Client ID:', GOOGLE_CLIENT_ID); // דיבוג

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LuxceraLanding />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

