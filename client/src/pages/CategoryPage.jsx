import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import ProductsCarousel from '../components/ProductsCarousel';

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
  const { addToCart } = useApp();
  const [allProducts, setAllProducts] = React.useState([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);

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
  const handleAddToCart = (product) => {
    addToCart(product);
  };

  // מיפוי קטגוריות
  const categoryMap = {
    'sets': { title: 'מארזים', filter: (p) => p.category === 'sets' || p.category === 'מארזים' || p.category === 'general' },
    'wax-pearls': { title: 'פניני שעווה', filter: (p) => p.category === 'pearls' || p.category === 'פנינים' },
    'accessories': { title: 'אביזרים', filter: (p) => p.category === 'accessories' || p.category === 'אביזרים' },
  };

  const categoryInfo = categoryMap[category];

  if (!categoryInfo) {
    return (
      <Layout
        onCartClick={() => navigate('/')}
        onUserClick={() => navigate('/')}
        onSearchClick={() => navigate('/')}
        cartCount={0}
        isLoggedIn={false}
        userName=""
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

  // Mock handlers for Nav
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
      <div className="min-h-screen bg-ivory pt-20">
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
      <Footer />
    </Layout>
  );
}

export default CategoryPage;

