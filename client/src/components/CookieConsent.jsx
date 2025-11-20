import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie } from 'lucide-react';

function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // לא להציג את הבאנר בדף האדמין בלבד
    if (window.location.pathname.includes('/admin') || window.location.pathname.includes('admin.html')) {
      return;
    }
    
    // בדיקה אם המשתמש כבר אישר את ה-Cookies
    const consent = localStorage.getItem('luxcera_cookie_consent');
    if (!consent) {
      // הצג את הבאנר אחרי שנייה (אנימציה חלקה)
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('luxcera_cookie_consent', 'accepted');
    localStorage.setItem('luxcera_cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('luxcera_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t-2 border-gold/50 shadow-2xl"
          dir="rtl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <Cookie className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gold font-semibold text-lg mb-1">שימוש ב-Cookies</h3>
                  <p className="text-gold/80 text-sm leading-relaxed">
                    כדי לשפר את החוויה שלכם, האתר משתמש ב-Cookies, גם מצדדים שלישיים. 
                    על ידי המשך גלישה באתר אתה מקבל את{' '}
                    <a 
                      href="/terms-of-service" 
                      className="text-gold underline hover:text-gold/80 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      מדיניות הפרטיות שלנו
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 text-gold/70 hover:text-gold border border-gold/30 hover:border-gold/50 rounded-lg font-semibold text-sm transition-colors"
                >
                  דחה
                </button>
                <button
                  onClick={handleAccept}
                  className="px-6 py-2 bg-gold text-black hover:bg-gold/90 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-gold/20"
                >
                  אישור
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CookieConsent;

