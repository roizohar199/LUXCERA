import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
  );
}

function ProductsCarousel({ onAddToCart, title, products }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const maxIndex = Math.max(0, products.length - 4);

  const nextSlide = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  const prevSlide = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));

  const visibleProducts = products.slice(currentIndex, currentIndex + 4);
  const hasNavigation = products.length > 4;

  const backgroundImage = title === 'מארזים' ? 'bg-packages-bg' : title === 'פניני שעווה' ? 'bg-waxpearls-bg' : null;
  
  return backgroundImage ? (
    <Section className="py-0">
      <div className={`relative min-h-screen ${backgroundImage} bg-cover bg-center bg-no-repeat rounded-2xl overflow-hidden`}>
        <div className="absolute inset-0 bg-candle/40 z-0 pointer-events-none" />
        <div className="relative h-full flex flex-col px-4 sm:px-6 lg:px-8 py-16 z-10">
          <div className="mb-12 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-5xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{title}</h2>
            </div>
          </div>

          <div className="relative flex-1">
            {hasNavigation && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors z-10"
                  aria-label="למוצרים הקודמים"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors z-10"
                  aria-label="למוצרים הבאים"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <div className="flex gap-6 overflow-hidden">
              {visibleProducts.map(product => {
                const hasSalePrice = product.salePrice && product.salePrice > 0;
                return (
                  <motion.div key={product.id} whileHover={{ y: -8 }} className="flex-shrink-0 w-64 bg-white border-2 border-gold/20 rounded-lg overflow-hidden cursor-pointer group relative shadow-luxury hover:shadow-gold transition-all">
                    <div 
                      className="absolute inset-0 bg-packages-bg bg-cover bg-center bg-no-repeat opacity-20 rounded-lg"
                      style={{
                        zIndex: 0
                      }}
                      role="img"
                      aria-label="מארז נרות ברקע המוצר"
                    />
                    <div className="aspect-square bg-white flex items-center justify-center p-8 relative overflow-hidden z-10">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="text-8xl transform group-hover:scale-110 transition-transform">{product.image}</div>
                      )}
                      {hasSalePrice && (
                        <div className="sale-ribbon">
                          מחיר מבצע
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60"></div>
                    </div>

                    <div className="p-6 relative z-10 bg-ivory/95 backdrop-blur-sm border-t border-gold/10">
                      <h3 className="font-semibold text-gray-900 mb-3 text-lg" style={{ fontFamily: 'serif' }}>{product.name}</h3>
                      <div className="mb-4">
                        {hasSalePrice ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gold font-semibold">מבצע:</span>
                              <span className="text-gold text-2xl font-bold">₪ {Number(product.salePrice).toFixed(2)}</span>
                            </div>
                            <span className="text-gray-400 text-sm line-through">₪ {Number(product.originalPrice).toFixed(2)}</span>
                          </div>
                        ) : (
                          <p className="text-gray-700 text-xl font-semibold">₪ {Number(product.price).toFixed(2)}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => product.inStock && onAddToCart(product)}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors ${product.inStock ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-400 text-white cursor-not-allowed'}`}
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
    <Section className="py-16">
      <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'serif' }}>{title}</h2>
      
      <div className="relative">
        {hasNavigation && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors z-10"
              aria-label="למוצרים הקודמים"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors z-10"
              aria-label="למוצרים הבאים"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        <div className="flex gap-6 overflow-hidden">
          {visibleProducts.map(product => {
            const hasSalePrice = product.salePrice && product.salePrice > 0;
            return (
              <motion.div key={product.id} whileHover={{ y: -8 }} className="flex-shrink-0 w-64 bg-white border-2 border-gold/20 rounded-lg overflow-hidden cursor-pointer group relative shadow-luxury hover:shadow-gold transition-all">
                <div className="aspect-square bg-white flex items-center justify-center p-8 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="text-8xl transform group-hover:scale-110 transition-transform">{product.image}</div>
                  )}
                  {hasSalePrice && (
                    <div className="sale-ribbon">
                      מחיר מבצע
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60"></div>
                </div>

                <div className="p-6 bg-white">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg" style={{ fontFamily: 'serif' }}>{product.name}</h3>
                  <div className="mb-4">
                    {hasSalePrice ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gold font-semibold">מבצע:</span>
                          <span className="text-gold text-2xl font-bold">₪ {Number(product.salePrice).toFixed(2)}</span>
                        </div>
                        <span className="text-gray-400 text-sm line-through">₪ {Number(product.originalPrice).toFixed(2)}</span>
                      </div>
                    ) : (
                      <p className="text-gray-700 text-xl font-semibold">₪ {Number(product.price).toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => product.inStock && onAddToCart(product)}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${product.inStock ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-400 text-white cursor-not-allowed'}`}
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
    </Section>
  );
}

export default ProductsCarousel;

