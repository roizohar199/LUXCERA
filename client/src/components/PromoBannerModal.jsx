import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function PromoBannerModal({ banner, onClose }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = React.useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClick = () => {
    if (banner?.link_url) {
      if (banner.link_url.startsWith('/')) {
        navigate(banner.link_url);
      } else {
        window.open(banner.link_url, '_blank');
      }
      handleClose();
    }
  };

  if (!banner) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="relative max-w-4xl w-full bg-gradient-to-br from-black via-black-lux to-black rounded-3xl overflow-hidden shadow-2xl border-2 border-gold/30 cursor-pointer group"
              onClick={handleClick}
            >
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors border border-gold/30 hover:border-gold"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="relative">
                {/* Background Image */}
                {banner.image_url && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${banner.image_url})` }}
                  />
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
                
                {/* Content */}
                <div className="relative p-8 md:p-12 text-center">
                  {/* Discount Badge */}
                  {banner.discount_percent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="inline-block mb-6"
                    >
                      <div className="bg-gold text-black px-6 py-3 rounded-full font-bold text-2xl md:text-3xl shadow-lg">
                        {banner.discount_percent}% הנחה
                      </div>
                    </motion.div>
                  )}

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-bold text-gold mb-4"
                    style={{
                      textShadow: '3px 3px 0px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.5)',
                      fontFamily: 'serif'
                    }}
                  >
                    {banner.title}
                  </motion.h2>

                  {/* Description */}
                  {banner.description && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white/90 text-lg md:text-xl mb-6 max-w-2xl mx-auto leading-relaxed"
                    >
                      {banner.description}
                    </motion.p>
                  )}

                  {/* CTA Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (banner.link_url) {
                        handleClick();
                      } else {
                        handleClose();
                      }
                    }}
                    className="bg-gold text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gold/90 transition-colors shadow-lg"
                  >
                    {banner.link_url ? 'לצפייה במבצע' : 'סגור'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

