import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import ProductsCarousel from '../components/ProductsCarousel';
import bestPriceImage from '../assets/best-price - Copy.png';

// Base API URL helper
const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const envUrl = (import.meta?.env?.VITE_API_URL || '').trim();
  if (!envUrl) {
    return cleanPath;
  }
  let baseUrl = envUrl.replace(/\/+$/, '');
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  return `${baseUrl}${cleanPath}`;
};

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { addToCart, getCartCount, isLoggedIn, openAccountModal } = useApp();
  const [allProducts, setAllProducts] = React.useState([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  
  // טעינת שם משתמש מ-localStorage
  const [userName, setUserName] = React.useState('');
  React.useEffect(() => {
    const savedUserName = localStorage.getItem('luxcera_userName');
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  // Scroll to top כשנכנסים לקטגוריה
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [category]);

  // בדיקה שהתמונה נטענת (רק בדיבוג)
  React.useEffect(() => {
    if (category === 'sales') {
      console.log('Sales page - Background image:', bestPriceImage);
    }
  }, [category, bestPriceImage]);

  // Load products from API
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await fetch(getApiUrl('/api/public/products'));
        if (response.ok) {
          const data = await response.json();
          const transformed = (data.products || []).map(product => ({
            id: product.id,
            name: product.title,
            price: product.salePrice || product.price,
            originalPrice: product.price,
            salePrice: product.salePrice || null,
            inStock: product.isActive === 1 || product.isActive === true,
            color: product.color || 'bg-white',
            image: product.imageUrl || '🕯️',
            imageUrl: product.imageUrl,
            category: product.category || 'general',
            description: product.description,
            isNew: product.isNew === 1 || product.isNew === true,
          }));
          setAllProducts(transformed);
        } else {
          console.error('Failed to load products:', response.status);
          setAllProducts([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setAllProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);
  
  // פונקציה להוספה לסל
  const handleAddToCart = async (product) => {
    const result = await addToCart(product);
    if (result === false) {
      // אם המשתמש לא מחובר - נווט לדף הבית עם הודעה
      alert('עליך להתחבר או להירשם לאתר כדי להוסיף פריטים לסל. אנא התחבר/הירשם ואז נסה שוב.');
      navigate('/');
    }
  };

  // מיפוי קטגוריות
  const categoryMap = {
    'sales': { title: 'מבצעים', filter: (p) => p.category === 'sales' || p.category === 'מבצעים' || p.on_sale === true || p.sale_price != null },
    'sets': { title: 'מארזים', filter: (p) => p.category === 'sets' || p.category === 'מארזים' || p.category === 'general' },
    'wax-pearls': { title: 'פניני שעווה', filter: (p) => p.category === 'pearls' || p.category === 'פנינים' },
    'accessories': { title: 'נרות אור ויוקרה', filter: (p) => p.category === 'accessories' || p.category === 'אביזרים' || p.category === 'נרות אור ויוקרה' },
    'gift-packages': { title: 'מוצרי מתנה', filter: (p) => p.category === 'gift-packages' || p.category === 'מארזי מתנה' || p.category === 'מוצרי מתנה' || p.category === 'gift' },
  };

  const categoryInfo = categoryMap[category];

  if (!categoryInfo) {
    return (
      <Layout
        onUserClick={() => navigate('/')}
        onSearchClick={() => navigate('/')}
        cartCount={getCartCount()}
        isLoggedIn={isLoggedIn}
        userName={userName}
      >
        <div className="min-h-screen bg-ivory flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">קטגוריה לא נמצאה</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-gold text-black-lux px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors"
            >
              חזרה לדף הבית
            </button>
          </div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const filteredProducts = loadingProducts ? [] : allProducts.filter(categoryInfo.filter);

  // Handlers for Nav - פותח מודאל התחברות במקום לנווט לדף הבית
  const handleUserClick = () => {
    if (isLoggedIn) {
      // אם המשתמש מחובר - נווט לדף הבית (או אפשר לפתוח מודאל פרופיל)
      navigate('/');
    } else {
      // אם המשתמש לא מחובר - פתח מודאל התחברות
      openAccountModal();
    }
  };
  const handleSearchClick = () => navigate('/');

  return (
    <Layout
      onUserClick={handleUserClick}
      onSearchClick={handleSearchClick}
      cartCount={getCartCount()}
      isLoggedIn={isLoggedIn}
      userName={userName}
    >
      <div className="min-h-screen bg-ivory pt-4 relative">
        {/* רקע שקוף עם תמונת מבצעים - רק בדף המבצעים */}
        {category === 'sales' && (
          <div 
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `url(${bestPriceImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.25,
              filter: 'blur(30px) grayscale(15%)',
              mixBlendMode: 'multiply'
            }}
            aria-hidden="true"
          />
        )}
        <div className="relative z-10">
          {loadingProducts ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                <p className="text-gray-600">טוען מוצרים...</p>
              </div>
            </div>
          ) : (
            <ProductsCarousel
              title={categoryInfo.title}
              products={filteredProducts}
              onAddToCart={handleAddToCart}
            />
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  );
}

export default CategoryPage;

