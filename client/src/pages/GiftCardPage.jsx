import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GiftCardPurchase from '../components/GiftCardPurchase';
import Footer from '../components/Footer';
import Layout from '../components/Layout';

function GiftCardPage() {
  const navigate = useNavigate();
  const { addToCart, getCartCount, isLoggedIn } = useApp();
  
  // טעינת שם משתמש מ-localStorage
  const [userName, setUserName] = React.useState('');
  React.useEffect(() => {
    const savedUserName = localStorage.getItem('luxcera_userName');
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  // Scroll to top כשנכנסים לדף Gift Card
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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
      <div className="py-20 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'serif' }}>לרכישת כרטיס קוד קופון/GIFT CARD</h2>
          </div>
          <GiftCardPurchase onAddToCart={addToCart} />
        </div>
      </div>
      <Footer />
    </Layout>
  );
}

export default GiftCardPage;

