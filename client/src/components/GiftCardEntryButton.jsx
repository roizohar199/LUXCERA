import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import luxceraLogo from '../assets/Luxcera Logo.png';

export default function GiftCardEntryButton({ onShowPurchase }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onShowPurchase) {
      onShowPurchase();
    } else {
      navigate('/gift-card');
    }
  };
  return (
    <div className="flex justify-center mb-12" dir="rtl">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full max-w-md h-80 rounded-3xl overflow-hidden shadow-2xl cursor-pointer group"
        style={{
          background: '#0B0B0B',
          border: '2px solid #D4AF37'
        }}
      >
        {/* רקע עם טקסטורה עדינה (נקודות) */}
        <div 
          className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
            backgroundSize: '15px 15px'
          }} 
        />
        
        {/* מסגרת זהב דקה */}
        <div className="absolute inset-0 border-2 border-gold rounded-3xl" style={{ borderWidth: '1.5px' }} />
        
        {/* תוכן הכרטיס */}
        <div className="relative h-full flex flex-col items-center justify-center p-8 z-10">
          {/* לוגו - מעוצב כנר עם להבה */}
          <div className="mb-6 relative">
            <div className="flex items-center justify-center">
              {/* להבת נר */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="w-6 h-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-300 via-yellow-400 to-yellow-500 rounded-full blur-sm animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-full" />
                </div>
              </div>
              {/* האות L */}
              <div className="text-6xl font-bold text-gold" style={{ fontFamily: 'serif' }}>
                L
              </div>
            </div>
          </div>
          
          {/* טקסט LUXCERA */}
          <h3 
            className="text-2xl font-bold text-gold mb-3" 
            style={{ 
              fontFamily: 'sans-serif', 
              letterSpacing: '0.15em',
              fontWeight: 600
            }}
          >
            LUXCERA
          </h3>
          
          {/* טקסט GIFT CARD */}
          <h2 
            className="text-3xl font-bold mb-6" 
            style={{ 
              fontFamily: 'sans-serif', 
              letterSpacing: '0.2em',
              fontWeight: 700,
              color: '#D4AF37',
              textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3), 6px 6px 10px rgba(0, 0, 0, 0.2), 0 0 20px rgba(212, 175, 55, 0.5)'
            }}
          >
            GIFT CARD
          </h2>
          
          {/* אפקט hover - זוהר זהב */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/15 group-hover:via-gold/8 group-hover:to-gold/15 transition-all duration-500 rounded-3xl" />
          
          {/* הודעה - לחץ לרכישה */}
          <div className="mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
            <p className="text-gold text-sm font-medium" style={{ letterSpacing: '0.1em' }}>
              לחץ לרכישה
            </p>
          </div>
        </div>
      </motion.button>
    </div>
  );
}

