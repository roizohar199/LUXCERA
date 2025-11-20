import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import LuxceraLanding from './LuxceraLanding';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CancellationPolicyPage from './pages/CancellationPolicyPage';
import ShippingAndReturnsPage from './pages/ShippingAndReturnsPage';
import GiftCardPage from './pages/GiftCardPage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';
import LoyaltyClubTermsPage from './pages/LoyaltyClubTermsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
console.log('[main.jsx] Google Client ID:', GOOGLE_CLIENT_ID); // דיבוג

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LuxceraLanding />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
              <Route path="/shipping-and-returns" element={<ShippingAndReturnsPage />} />
              <Route path="/gift-card" element={<GiftCardPage />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/loyalty-club-terms" element={<LoyaltyClubTermsPage />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

