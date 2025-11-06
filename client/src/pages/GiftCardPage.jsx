import React from 'react';
import { useNavigate } from 'react-router-dom';
import GiftCardPurchase from '../components/GiftCardPurchase';
import Footer from '../components/Footer';
import Layout from '../components/Layout';

function GiftCardPage() {
  const navigate = useNavigate();
  const [cart, setCart] = React.useState([]);
  
  // Load cart from localStorage
  React.useEffect(() => {
    const savedCart = localStorage.getItem('luxcera_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Failed to load cart from localStorage:', err);
      }
    }
  }, []);

  // Save cart to localStorage
  React.useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('luxcera_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('luxcera_cart');
    }
  }, [cart]);

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleCartClick = () => {
    // Navigate to home and open cart
    navigate('/');
    setTimeout(() => {
      const cartButton = document.querySelector('[aria-label="עגלת קניות"]');
      if (cartButton) cartButton.click();
    }, 100);
  };

  const handleUserClick = () => navigate('/');
  const handleSearchClick = () => navigate('/');

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout 
      onCartClick={handleCartClick}
      onUserClick={handleUserClick}
      onSearchClick={handleSearchClick}
      cartCount={cartCount}
      isLoggedIn={false}
      userName=""
    >
      <div className="py-20 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'serif' }}>לרכישת כרטיס קוד קופון/GIFT CARD</h2>
          </div>
          <GiftCardPurchase onAddToCart={handleAddToCart} />
        </div>
      </div>
      <Footer />
    </Layout>
  );
}

export default GiftCardPage;

