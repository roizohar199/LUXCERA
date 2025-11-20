import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 ${className}`}>{children}</section>
  );
}

function ProductsCarousel({ onAddToCart, title, products }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const maxIndex = Math.max(0, products.length - 3);

  const nextSlide = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  const prevSlide = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));

  const visibleProducts = products.slice(currentIndex, currentIndex + 3);
  const hasNavigation = products.length > 3;

  const backgroundImage = title === 'מארזים' ? 'bg-packages-bg' : title === 'פניני שעווה' ? 'bg-waxpearls-bg' : null;
  const isGiftPackages = title === 'מוצרי מתנה';
  
  return backgroundImage ? (
    <Section className="py-0">
      <div className={`relative min-h-screen ${backgroundImage} bg-cover bg-center bg-no-repeat rounded-2xl overflow-hidden`}>
        <div className="absolute inset-0 bg-candle/40 z-0 pointer-events-none" />
        <div className="relative h-full flex flex-col px-2 sm:px-4 lg:px-6 py-4 z-10">
          <div className="mb-4 relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{title}</h2>
            </div>
          </div>

          <div className="relative flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => {
                const hasSalePrice = product.salePrice && product.salePrice > 0;
                // חישוב אחוז ההנחה
                const originalPrice = product.originalPrice || product.price;
                const discountPercent = hasSalePrice && originalPrice && originalPrice > 0 && originalPrice > product.salePrice
                  ? Math.round(((originalPrice - product.salePrice) / originalPrice) * 100)
                  : 0;
                return (
                  <motion.div 
                    key={product.id} 
                    whileHover={{ y: -8 }} 
                    className="bg-white border-2 border-black rounded-lg overflow-hidden cursor-pointer group relative shadow-lg hover:shadow-xl transition-all flex flex-col h-full"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div 
                      className="absolute inset-0 bg-packages-bg bg-cover bg-center bg-no-repeat opacity-20 rounded-lg"
                      style={{
                        zIndex: 0
                      }}
                      role="img"
                      aria-label="מארז נרות ברקע המוצר"
                    />
                    <div className="bg-white relative overflow-hidden z-10" style={{ minHeight: '400px', height: '400px' }}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain object-bottom" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', marginBottom: '0', paddingBottom: '0', verticalAlign: 'bottom' }} />
                      ) : (
                        <div className="text-6xl flex items-center justify-center h-full">{product.image}</div>
                      )}
                      {hasSalePrice && discountPercent > 0 && (
                        <div 
                          className="absolute top-0 left-0 z-30 font-bold text-white shadow-lg"
                          style={{
                            transform: 'rotate(-45deg)',
                            transformOrigin: 'center',
                            backgroundColor: isGiftPackages ? '#dc2626' : '#4A6741',
                            padding: '8px 40px',
                            fontSize: '14px',
                            lineHeight: '1.2',
                            marginTop: '15px',
                            marginLeft: '-35px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                        >
                          הנחה {discountPercent}%
                        </div>
                      )}
                      <div className="absolute top-0 right-0 flex gap-1 z-20">
                        {hasSalePrice && (
                          <div className={`text-white text-sm px-3 py-1 rounded font-bold ${isGiftPackages ? 'bg-red-600' : 'bg-red-500'}`}>
                            מחיר מבצע
                          </div>
                        )}
                        {(product.isNew === 1 || product.isNew === true) && (
                          <div className={`text-white text-sm px-3 py-1 rounded font-bold bg-blue-500`}>
                            חדש
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60"></div>
                    </div>

                    <div className="p-4 relative z-10 bg-ivory/95 backdrop-blur-sm border-t border-gold/10 flex flex-col flex-grow">
                      <h3 className="font-semibold text-gray-900 mb-2 text-xl" style={{ fontFamily: 'serif' }}>{product.name}</h3>
                      <div className="mb-3">
                        {hasSalePrice ? (
                          <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-base ${isGiftPackages ? 'text-red-600' : 'text-gold'}`}>מבצע:</span>
                        <span className={`text-2xl font-bold ${isGiftPackages ? 'text-red-600' : 'text-gold'}`}>₪ {Number(product.salePrice).toFixed(2)}</span>
                      </div>
                            <span className="text-gray-400 text-sm line-through">₪ {Number(product.originalPrice).toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="text-gray-700 text-2xl font-semibold">₪ {Number(product.price).toFixed(2)}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.inStock) {
                            onAddToCart(product);
                          }
                        }}
                        className={`w-full py-2 rounded-lg font-semibold text-base transition-colors mt-auto ${product.inStock ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-400 text-white cursor-not-allowed'}`}
                        disabled={!product.inStock}
                      >
                        {product.inStock ? 'הוספה לסל' : 'אזל מהמלאי'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Section>
  ) : (
    <Section className="py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center" style={{ fontFamily: 'serif' }}>{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => {
          const hasSalePrice = product.salePrice && product.salePrice > 0;
          // חישוב אחוז ההנחה
          const originalPrice = product.originalPrice || product.price;
          const discountPercent = hasSalePrice && originalPrice && originalPrice > 0 && originalPrice > product.salePrice
            ? Math.round(((originalPrice - product.salePrice) / originalPrice) * 100)
            : 0;
          return (
            <motion.div 
              key={product.id} 
              whileHover={{ y: -8 }} 
              className="bg-white border-2 border-black rounded-lg overflow-hidden cursor-pointer group relative shadow-lg hover:shadow-xl transition-all flex flex-col h-full"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="bg-white relative overflow-hidden" style={{ minHeight: '400px', height: '400px' }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain object-bottom" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', marginBottom: '0', paddingBottom: '0', verticalAlign: 'bottom' }} />
                ) : (
                  <div className="text-6xl flex items-center justify-center h-full">{product.image}</div>
                )}
                {hasSalePrice && discountPercent > 0 && (
                  <div 
                    className="absolute top-0 left-0 z-30 font-bold text-white shadow-lg"
                    style={{
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'center',
                      backgroundColor: isGiftPackages ? '#dc2626' : '#4A6741',
                      padding: '8px 40px',
                      fontSize: '14px',
                      lineHeight: '1.2',
                      marginTop: '15px',
                      marginLeft: '-35px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    הנחה {discountPercent}%
                  </div>
                )}
                <div className="absolute top-0 right-0 flex gap-1 z-10">
                  {hasSalePrice && (
                    <div className={`text-white text-sm px-3 py-1 rounded font-bold ${isGiftPackages ? 'bg-red-600' : 'bg-red-500'}`}>
                      מחיר מבצע
                    </div>
                  )}
                  {(product.isNew === 1 || product.isNew === true) && (
                    <div className={`text-white text-sm px-3 py-1 rounded font-bold bg-blue-500`}>
                      חדש
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60"></div>
              </div>

              <div className="p-4 bg-white flex flex-col flex-grow">
                <h3 className="font-semibold text-gray-900 mb-2 text-xl" style={{ fontFamily: 'serif' }}>{product.name}</h3>
                <div className="mb-3">
                  {hasSalePrice ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-base ${isGiftPackages ? 'text-red-600' : 'text-gold'}`}>מבצע:</span>
                        <span className={`text-2xl font-bold ${isGiftPackages ? 'text-red-600' : 'text-gold'}`}>₪ {Number(product.salePrice).toFixed(2)}</span>
                      </div>
                      <span className="text-gray-400 text-sm line-through">₪ {Number(product.originalPrice).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-2xl font-semibold">₪ {Number(product.price).toFixed(2)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.inStock) {
                      onAddToCart(product);
                    }
                  }}
                  className={`w-full py-2 rounded-lg font-semibold text-base transition-colors mt-auto ${product.inStock ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-400 text-white cursor-not-allowed'}`}
                  disabled={!product.inStock}
                >
                  {product.inStock ? 'הוספה לסל' : 'אזל מהמלאי'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

export default ProductsCarousel;

