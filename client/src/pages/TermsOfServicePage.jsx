import React from 'react';
import { useNavigate } from 'react-router-dom';
import TermsOfService from '../components/TermsOfService';
import Footer from '../components/Footer';
import Layout from '../components/Layout';

function TermsOfServicePage() {
  const navigate = useNavigate();
  
  // Mock handlers for Nav component
  const handleCartClick = () => navigate('/');
  const handleUserClick = () => navigate('/');
  const handleSearchClick = () => navigate('/');

  return (
    <Layout 
      onCartClick={handleCartClick}
      onUserClick={handleUserClick}
      onSearchClick={handleSearchClick}
      cartCount={0}
      isLoggedIn={false}
      userName=""
    >
      <TermsOfService />
      <Footer />
    </Layout>
  );
}

export default TermsOfServicePage;

