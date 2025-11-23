import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, Minus, ShoppingBag } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

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

// Helper to get full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/')) {
    const envUrl = (import.meta?.env?.VITE_API_URL || '').trim();
    if (envUrl) {
      let baseUrl = envUrl.replace(/\/+$/, '');
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }
      return `${baseUrl}${imageUrl}`;
    }
    return imageUrl;
  }
  return `/${imageUrl}`;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useApp(); // שימוש ב-addToCart מ-AppContext
  const [product, setProduct] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedColor, setSelectedColor] = React.useState(null);
  const [quantity, setQuantity] = React.useState(1);
  const [colors, setColors] = React.useState([]);
  const [selectedMedia, setSelectedMedia] = React.useState('main'); // 'main', 'video', or image index
  const [additionalImages, setAdditionalImages] = React.useState([]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`/api/public/products/${id}`));
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.product) {
            setProduct(data.product);
            // Parse colors if exists
            if (data.product.colors) {
              try {
                const parsedColors = typeof data.product.colors === 'string' 
                  ? JSON.parse(data.product.colors) 
                  : data.product.colors;
                if (Array.isArray(parsedColors) && parsedColors.length > 0) {
                  setColors(parsedColors);
                  setSelectedColor(parsedColors[0]);
                }
              } catch (e) {
                console.error('Error parsing colors:', e);
              }
            }
            // Parse additional images if exists
            if (data.product.additional_images) {
              try {
                const parsedImages = typeof data.product.additional_images === 'string' 
                  ? JSON.parse(data.product.additional_images) 
                  : data.product.additional_images;
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  setAdditionalImages(parsedImages);
                }
              } catch (e) {
                console.error('Error parsing additional images:', e);
              }
            }
          } else {
            setError('מוצר לא נמצא');
          }
        } else {
          setError('שגיאה בטעינת המוצר');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('שגיאה בטעינת המוצר');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    const cartItem = {
      id: product.id,
      name: product.title,
      price: product.salePrice || product.price,
      originalPrice: product.price,
      salePrice: product.salePrice || null,
      quantity: quantity,
      inStock: product.isActive === 1 || product.isActive === true,
      color: selectedColor || null,
      image: product.imageUrl || '',
      imageUrl: product.imageUrl,
      category: product.category || 'general',
      description: product.description,
    };

    // שימוש ב-addToCart מ-AppContext במקום localStorage ישירות
    // זה מבטיח שהעגלה תתעדכן בצורה נכונה ולא תהיה כפילות
    // Source of Truth יחיד - כל עדכון עובר דרך AppContext
    try {
      await addToCart(cartItem);
      // Show success message
      alert('המוצר נוסף לסל בהצלחה!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('שגיאה בהוספת המוצר לסל. אנא נסה שוב.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gold text-xl">טוען מוצר...</div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-gold text-xl mb-4">{error || 'מוצר לא נמצא'}</div>
            <button
              onClick={() => navigate('/')}
              className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 border-2 border-gold/50 rounded-lg shadow-lg hover:shadow-gold transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ArrowRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
              <span className="text-gold font-semibold text-lg relative z-10 group-hover:text-gold/90 transition-colors duration-300" style={{ fontFamily: 'serif' }}>
                חזרה לדף הבית
              </span>
              <div className="absolute -inset-1 bg-gold/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const hasSalePrice = product.salePrice && product.salePrice > 0;
  const displayPrice = hasSalePrice ? product.salePrice : product.price;

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 text-gold hover:text-gold/80 transition-colors text-lg font-semibold"
            >
              <ArrowRight className="w-6 h-6" />
              חזרה
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Side - Image/Video Gallery */}
            <div className="space-y-3">
              {/* Main Media Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black rounded-lg overflow-visible border border-gold/30 shadow-lg p-2"
              >
                <div className="relative w-full flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
                  {(product.isNew === 1 || product.isNew === true) && (
                    <div className="new-ribbon text-2xl px-6 py-3">
                      חדש
                    </div>
                  )}
                  {selectedMedia === 'main' && (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.title}
                      className="w-full h-auto object-contain"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
                      }}
                    />
                  )}
                  {selectedMedia === 'video' && (product.video_file || product.video_url) && (
                    product.video_file ? (
                      <video
                        src={getImageUrl(product.video_file)}
                        controls
                        className="w-full h-auto object-contain"
                        style={{ display: 'block' }}
                      >
                        הדפדפן שלך לא תומך בנגינת וידאו.
                      </video>
                    ) : (
                      <div className="aspect-video w-full">
                        <iframe
                          src={product.video_url}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={product.title}
                        />
                      </div>
                    )
                  )}
                  {typeof selectedMedia === 'number' && additionalImages[selectedMedia] && (
                    <img
                      src={getImageUrl(additionalImages[selectedMedia])}
                      alt={`${product.title} - תמונה ${selectedMedia + 1}`}
                      className="w-full h-auto object-contain"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
                      }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Media Thumbnails */}
              {(additionalImages.length > 0 || product.video_file || product.video_url) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <label className="block text-gold font-semibold text-sm">בחר תמונה/וידאו:</label>
                  <div className="flex flex-wrap gap-2">
                    {/* Main Image Thumbnail */}
                    <button
                      onClick={() => setSelectedMedia('main')}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMedia === 'main' ? 'border-gold scale-110' : 'border-gold/30 hover:border-gold/50'
                      }`}
                    >
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt="תמונה ראשית"
                        className="w-full h-full object-cover"
                      />
                      {selectedMedia === 'main' && (
                        <div className="absolute inset-0 bg-gold/20 border-2 border-gold" />
                      )}
                    </button>

                    {/* Video Thumbnail */}
                    {(product.video_file || product.video_url) && (
                      <button
                        onClick={() => setSelectedMedia('video')}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-black ${
                          selectedMedia === 'video' ? 'border-gold scale-110' : 'border-gold/30 hover:border-gold/50'
                        }`}
                      >
                        <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        {selectedMedia === 'video' && (
                          <div className="absolute inset-0 bg-gold/20 border-2 border-gold" />
                        )}
                      </button>
                    )}

                    {/* Additional Images Thumbnails */}
                    {additionalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedMedia(idx)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedMedia === idx ? 'border-gold scale-110' : 'border-gold/30 hover:border-gold/50'
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`תמונה ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedMedia === idx && (
                          <div className="absolute inset-0 bg-gold/20 border-2 border-gold" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Side - Product Info */}
            <div className="space-y-4">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-bold text-black"
                style={{
                  textShadow: '3px 3px 6px rgba(212, 175, 55, 0.8), 0 0 15px rgba(212, 175, 55, 0.7), 0 0 30px rgba(212, 175, 55, 0.6), 1px 1px 2px rgba(212, 175, 55, 0.8)',
                  fontFamily: 'serif',
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale'
                }}
              >
                {product.title}
              </motion.h1>

              {/* Price */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                {hasSalePrice ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-semibold text-base" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>מבצע:</span>
                      <span className="text-red-400 text-3xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>₪{Number(product.salePrice).toFixed(2)}</span>
                    </div>
                    <span className="text-gold/50 text-base line-through" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>₪{Number(product.price).toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-black text-3xl font-bold" style={{ textShadow: '3px 3px 6px rgba(212, 175, 55, 0.8), 0 0 12px rgba(212, 175, 55, 0.7)', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>₪{Number(product.price).toFixed(2)}</span>
                )}
              </motion.div>

              {/* Description */}
              {product.description && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="prose prose-invert max-w-none"
                >
                  <p className="text-black text-2xl leading-relaxed whitespace-pre-line" style={{ textShadow: '3px 3px 6px rgba(212, 175, 55, 0.8), 0 0 12px rgba(212, 175, 55, 0.7), 1px 1px 2px rgba(212, 175, 55, 0.8)', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
                    {product.description}
                  </p>
                </motion.div>
              )}

              {/* Color Selection */}
              {colors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <label className="block text-black font-semibold text-2xl" style={{ textShadow: '3px 3px 6px rgba(212, 175, 55, 0.8), 0 0 12px rgba(212, 175, 55, 0.7), 1px 1px 2px rgba(212, 175, 55, 0.8)', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
                    בחר צבע:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all border-2 text-sm ${
                          selectedColor === color
                            ? 'border-gold bg-gold text-black'
                            : 'border-gold/30 bg-black text-gold hover:border-gold/50'
                        }`}
                      >
                        {typeof color === 'object' ? color.name || color.value : color}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quantity Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="block text-black font-semibold text-2xl" style={{ textShadow: '3px 3px 6px rgba(212, 175, 55, 0.8), 0 0 12px rgba(212, 175, 55, 0.7), 1px 1px 2px rgba(212, 175, 55, 0.8)', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
                  כמות:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border-2 border-gold/30 bg-black text-gold hover:border-gold hover:bg-gold/10 transition-colors flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-black text-3xl font-bold w-12 text-center" style={{ textShadow: '3px 3px 6px rgba(212, 175, 55, 0.8), 0 0 12px rgba(212, 175, 55, 0.7), 1px 1px 2px rgba(212, 175, 55, 0.8)', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border-2 border-gold/30 bg-black text-gold hover:border-gold hover:bg-gold/10 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

              {/* Add to Cart Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleAddToCart}
                disabled={!product.isActive}
                className="w-full bg-gold text-black px-6 py-3 rounded-lg font-bold text-lg hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                הוספה לסל - ₪{(displayPrice * quantity).toFixed(2)}
              </motion.button>

              {!product.isActive && (
                <p className="text-red-400 text-center">מוצר זה לא זמין כרגע</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

