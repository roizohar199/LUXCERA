import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TermsOfService from '../components/TermsOfService';
import Footer from '../components/Footer';
import Layout from '../components/Layout';

function TermsOfServicePage() {
  const navigate = useNavigate();
  const { getCartCount, isLoggedIn } = useApp();
  
  // טעינת שם משתמש מ-localStorage
  const [userName, setUserName] = React.useState('');
  React.useEffect(() => {
    const savedUserName = localStorage.getItem('luxcera_userName');
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);
  
  const handleUserClick = () => navigate('/');
  const handleSearchClick = () => navigate('/');

  return (
    <Layout 
      onUserClick={handleUserClick}
      onSearchClick={handleSearchClick}
      cartCount={getCartCount()}
      isLoggedIn={isLoggedIn}
      userName={userName}
    >
      <TermsOfService />
      <Footer />
    </Layout>
  );
}

export default TermsOfServicePage;

