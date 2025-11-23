import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Search, User, ShoppingBag, Phone, Mail, Instagram, Facebook, Menu, X, Trash2, Plus, Minus, Package,
  Settings, Heart, ChevronLeft, ChevronRight, Maximize2, Minimize2, Type, Eye, Link as LinkIcon, Hash,
  Palette, Contrast, Filter, Keyboard, Volume2, RotateCcw, AlertTriangle, Flag, Shield, Info, HelpCircle,
  Wand2, Image as ImageIcon, Hand, Headphones, ArrowRight, CreditCard, MapPin, CheckCircle, Truck, Gift, TrendingUp
} from 'lucide-react';
import BitPaymentButton from './components/BitPaymentButton';
import GiftCardApply from './components/GiftCardApply';
import PromoGiftApply from './components/PromoGiftApply';
import GiftCardView from './components/GiftCardView';
import GiftCardEntryButton from './components/GiftCardEntryButton';
import Footer from './components/Footer';
import CategoryShowcase from './components/CategoryShowcase';
import PromoBannerModal from './components/PromoBannerModal';
import ClubJoinForm from './components/ClubJoinForm';
import ClubDashboard from './components/ClubDashboard';
import { apiClubMe } from './api/club';
import luxceraLogo from './assets/Luxcera Logo.png';
import candleBg1 from './assets/candle-bg-1.png';

// Base API URL from environment variables (עם פולבק בטוח לדומיין הנוכחי)
// משתמשים ב-path יחסי /api/... דרך proxy של Vite כדי למנוע בעיות כפילות
const getApiUrl = (path) => {
  // מסיר / מההתחלה של path אם קיים (כי אנחנו מוסיפים אותו)
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  const envUrl = (import.meta?.env?.VITE_API_URL || '').trim();
  if (!envUrl) {
    // אם אין VITE_API_URL, נשתמש ב-proxy של Vite (localhost:5173)
    // זה יעבוד דרך ה-proxy שמוגדר ב-vite.config.ts - פשוט path יחסי
    return cleanPath;
  }
  
  // אם יש VITE_API_URL, נשתמש בו ישירות
  let baseUrl = envUrl.replace(/\/+$/, ''); // מסיר סלאשים בסוף
  // מסיר /api בסוף אם קיים (כדי למנוע /api/api)
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  const finalUrl = `${baseUrl}${cleanPath}`;
  // דיבוג - להסיר בפרודקשן
  if (typeof window !== 'undefined' && import.meta?.env?.DEV) {
    console.log('[getApiUrl]', { path, envUrl, baseUrl, finalUrl });
  }
  return finalUrl;
};

// פונקציה לקבלת CSRF token
async function getCsrfToken() {
  try {
    const res = await fetch(getApiUrl('/api/csrf'), {
      credentials: 'include', // חובה כדי לקבל/לשלוח עוגיות
    });
    const data = await res.json();
    // אפשר לקחת מ-res.json().csrfToken או לקרוא מהעוגייה XSRF-TOKEN
    return data.csrfToken || '';
  } catch (err) {
    console.error('Failed to get CSRF token:', err);
    return '';
  }
}

function PromoBanner() {
  const items = Array(6).fill(null);
  const duplicatedItems = [...items, ...items];
  return (
    <div className="relative overflow-hidden bg-[#40E0D0] border-t border-b border-[#30D5C8] py-3" aria-label="הטבת משלוח">
      <div className="flex animate-scroll whitespace-nowrap">
        {duplicatedItems.map((_, i) => (
          <div key={i} className="inline-flex items-center gap-3 mx-8">
            <span className="text-white font-medium text-lg">משלוח חינם מעל ₪300</span>
            <Heart className="w-5 h-5 text-white" fill="currentColor" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Nav({ onCartClick, onUserClick, onSearchClick, cartCount, isLoggedIn, userName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const { userEmail } = useApp();
  const [isClubMember, setIsClubMember] = React.useState(false);
  const [clubLoading, setClubLoading] = React.useState(true);
  
  const scrollToClub = () => {
    const clubSection = document.getElementById('מועדון-לקוחות');
    if (clubSection) {
      clubSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  React.useEffect(() => {
    async function checkClubMember() {
      if (!isLoggedIn || !userEmail) {
        setClubLoading(false);
        return;
      }
      
      try {
        const data = await apiClubMe(userEmail);
        setIsClubMember(!!data.member);
      } catch (err) {
        setIsClubMember(false);
      } finally {
        setClubLoading(false);
      }
    }
    
    checkClubMember();
  }, [isLoggedIn, userEmail]);
  
  const links = [
    { name: 'בית', href: '#בית', onClick: () => window.location.hash = 'בית' },
    { name: 'יצירת קשר', href: '/contact', onClick: () => navigate('/contact') }
  ];

  return (
    <nav className="sticky top-0 w-full z-50 bg-black shadow-md" aria-label="ניווט ראשי">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <a href="#בית" className="flex items-center">
          <img src={luxceraLogo} alt="LUXCERA" className="h-16 sm:h-20 md:h-24 w-auto rounded-xl" />
        </a>

        <div className="hidden md:flex gap-8 text-gold text-base">
          {links.map(link => (
            link.href.startsWith('/') ? (
              <Link key={link.name} to={link.href} onClick={link.onClick} className="hover:text-gold/80 transition font-medium">{link.name}</Link>
            ) : (
              <a key={link.name} href={link.href} onClick={link.onClick} className="hover:text-gold/80 transition font-medium">{link.name}</a>
            )
          ))}
        </div>

        <div className="flex items-center gap-5">
          {!(clubLoading || (isLoggedIn && isClubMember)) && (
            <div className="hidden lg:block">
              <div className="bg-black border-2 border-gold rounded-lg p-3 shadow-xl max-w-[240px]">
                <div className="text-center mb-2">
                  <p className="text-gold text-xs mb-1" style={{ fontFamily: 'sans-serif' }}>
                    הטבות בלעדיות לחברי המועדון בלבד
                  </p>
                  <p className="text-gold text-xs" style={{ fontFamily: 'sans-serif' }}>
                    צבירת נקודות למימוש בהזמנות באתר
                  </p>
                </div>
                <button
                  onClick={scrollToClub}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-2 px-3 rounded-lg transition-colors text-xs shadow-lg shadow-gold/20"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  הרשמה למועדון
                </button>
              </div>
            </div>
          )}
          <button onClick={onSearchClick} className="text-gold hover:text-gold/80 transition" aria-label="חיפוש">
            <Search className="w-6 h-6" />
          </button>
          <button onClick={onUserClick} className="flex items-center gap-2 text-gold hover:text-gold/80 transition" aria-label="אזור אישי">
            {isLoggedIn && userName && (
              <span className="hidden sm:inline text-base font-medium text-gold">{userName}</span>
            )}
            <User className="w-6 h-6" />
          </button>
          <button onClick={onCartClick} className="relative text-gold hover:text-gold/80 transition" aria-label="עגלת קניות">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-live="polite">
                {cartCount}
              </span>
            )}
          </button>
          <button className="md:hidden text-gold hover:text-gold/80" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="תפריט">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

          {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-gold/30">
          <div className="px-4 py-3 space-y-2">
            {links.map(link => (
              link.href.startsWith('/') ? (
                <Link key={link.name} to={link.href} onClick={() => { link.onClick(); setMobileMenuOpen(false); }} className="block text-gold hover:bg-gold/10 p-2">
                  {link.name}
                </Link>
              ) : (
                <a key={link.name} href={link.href} onClick={() => { link.onClick(); setMobileMenuOpen(false); }} className="block text-gold hover:bg-gold/10 p-2">
                  {link.name}
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
  );
}

function Hero() {
  return (
    <Section id="בית" className="pt-20">
      <div className="relative h-[600px] rounded-2xl overflow-hidden bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1608075702949-9077fcc29419?w=2000&auto=format&fit=crop&q=80)',
            filter: 'blur(2px) brightness(0.9)'
          }}
          role="img"
          aria-label="נרות מעוצבים ברקע"
        />
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute w-32 h-32 bg-yellow-200/40 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
          <div className="absolute w-40 h-40 bg-orange-200/30 rounded-full blur-3xl top-40 right-20 animate-pulse delay-150"></div>
          <div className="absolute w-28 h-28 bg-yellow-100/50 rounded-full blur-3xl bottom-32 left-1/3 animate-pulse delay-300"></div>
          <div className="absolute w-36 h-36 bg-amber-200/30 rounded-full blur-3xl bottom-20 right-1/4 animate-pulse delay-500"></div>
          <div className="absolute w-24 h-24 bg-yellow-300/40 rounded-full blur-3xl top-1/3 left-1/2 animate-pulse delay-700"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />
        <div className="relative h-full flex items-center justify-center px-8 lg:px-16 z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl text-center">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-gold mb-6 leading-tight tracking-tight" style={{ fontFamily: 'serif' }}>
              LUXCERA
            </h1>
            <p className="text-2xl sm:text-3xl text-gold font-light tracking-wide mb-8" style={{ fontFamily: 'serif' }}>
              The Art of Light
            </p>
            <p className="text-lg text-gold mb-10 max-w-2xl mx-auto leading-relaxed">
              נרות שעווה יוקרתיים בעבודת יד, עם ריחות מרגיעים וצבעים מותאמים אישית
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('קטגוריות');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-block bg-gold hover:bg-gold/90 text-black-lux px-10 py-4 rounded-xl font-semibold transition-colors shadow-gold text-lg border-2 border-gold"
              >
                הזמן עכשיו
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

function ProductsCarousel({ onAddToCart, title, products }) {
  const navigate = useNavigate();
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

          <div className="relative z-10">
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

            <div className="flex gap-12 overflow-hidden">
              {visibleProducts.map(product => {
                const hasSalePrice = product.salePrice && product.salePrice > 0;
                return (
                  <motion.div 
                    key={product.id} 
                    whileHover={{ y: -16 }} 
                    className="flex-shrink-0 w-[512px] bg-white border-2 border-gold/20 rounded-lg overflow-hidden cursor-pointer group relative shadow-luxury hover:shadow-gold transition-all"
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
                    <div className="aspect-square bg-white flex items-center justify-center p-16 relative overflow-hidden z-10">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="text-[16rem] transform group-hover:scale-110 transition-transform">{product.image}</div>
                      )}
                      {hasSalePrice && (
                        <div className="sale-ribbon text-2xl px-6 py-3">
                          מחיר מבצע
                        </div>
                      )}
                      {product.isNew === 1 || product.isNew === true ? (
                        <div className="new-ribbon text-2xl px-6 py-3">
                          חדש
                        </div>
                      ) : null}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-gold/60 via-gold to-gold/60"></div>
                    </div>

                    <div className="p-12 relative z-10 bg-ivory/95 backdrop-blur-sm border-t border-gold/10">
                      <h3 className="font-semibold text-gray-900 mb-6 text-2xl" style={{ fontFamily: 'serif' }}>{product.name}</h3>
                      <div className="mb-8">
                        {hasSalePrice ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                              <span className="text-gold font-semibold text-xl">מבצע:</span>
                              <span className="text-gold text-4xl font-bold">₪ {Number(product.salePrice).toFixed(2)}</span>
                            </div>
                            <span className="text-gray-400 text-base line-through">₪ {Number(product.originalPrice).toFixed(2)}</span>
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
                        className={`w-full py-6 rounded-lg font-semibold text-xl transition-colors ${product.inStock ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-400 text-white cursor-not-allowed'}`}
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
        <div className={`mb-12 ${title === 'מארזים' ? 'relative z-10' : ''}`}>
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-5xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>{title}</h2>
          </div>
          {title === 'מארזים' && (
            <p className="text-gray-600 text-sm max-w-2xl">חשוב לנו לציין שחלק מהמוצרים שלנו נעשים בעבודת יד ולכן ייתכנו שינויים קלים בצורות ובגוונים.</p>
          )}
        </div>

        <div className={`relative ${title === 'מארזים' ? 'z-10' : ''}`}>
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

          <div className="flex gap-12 overflow-hidden">
            {visibleProducts.map(product => {
              const hasSalePrice = product.salePrice && product.salePrice > 0;
              return (
                <motion.div 
                  key={product.id} 
                  whileHover={{ y: -16 }} 
                  className={`flex-shrink-0 w-[512px] bg-white border-2 border-gold/20 rounded-lg overflow-hidden cursor-pointer group relative shadow-luxury hover:shadow-gold transition-all ${title === 'מארזים' ? 'relative' : ''}`}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {title === 'מארזים' && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 rounded-lg"
                      style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1576072457077-0fa7b4d2cbf4?w=800&auto=format&fit=crop&q=80)',
                        zIndex: 0
                      }}
                      role="img"
                      aria-label="מארז נרות ברקע המוצר"
                    />
                  )}
                  <div className={`aspect-square ${product.color} flex items-center justify-center p-16 relative overflow-hidden ${title === 'מארזים' ? 'z-10' : ''}`}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="text-[16rem] transform group-hover:scale-110 transition-transform">{product.image}</div>
                    )}
                    {hasSalePrice && (
                      <div className="sale-ribbon text-2xl px-6 py-3">
                        מחיר מבצע
                      </div>
                    )}
                    {product.isNew === 1 || product.isNew === true ? (
                      <div className="new-ribbon text-2xl px-6 py-3">
                        חדש
                      </div>
                    ) : null}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-gold/60 via-gold to-gold/60"></div>
                  </div>

                  <div className={`p-12 ${title === 'מארזים' ? 'relative z-10 bg-white/80 backdrop-blur-sm' : 'bg-white'}`}>
                    <h3 className="font-semibold text-gray-900 mb-6 text-2xl" style={{ fontFamily: 'serif' }}>{product.name}</h3>
                    <div className="mb-8">
                      {hasSalePrice ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-4">
                            <span className="text-gold font-semibold text-xl">מבצע:</span>
                            <span className="text-gold text-4xl font-bold">₪ {Number(product.salePrice).toFixed(2)}</span>
                          </div>
                          <span className="text-gray-400 text-base line-through">₪ {Number(product.originalPrice).toFixed(2)}</span>
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
                      className={`w-full py-6 rounded-lg font-semibold text-xl transition-colors ${product.inStock ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-400 text-white cursor-not-allowed'}`}
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

function Gallery() {
  return (
    <Section id="גלריה" className="py-20">
      {/* גלריה תמונות */}
    </Section>
  );
}

function About() {
  return (
    <Section id="אודות" className="py-20">
      <div className="text-center mb-12">
        <h2 
          className="text-4xl font-bold mb-4"
          style={{
            color: '#D4AF37',
            fontFamily: 'serif',
            textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6), 3px 3px 0px rgba(0, 0, 0, 0.5), 6px 6px 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(212, 175, 55, 0.5)',
            letterSpacing: '0.05em'
          }}
        >
          אודות LUXCERA
        </h2>
        <p 
          className="max-w-3xl mx-auto leading-relaxed text-lg mb-6"
          style={{
            color: '#D4AF37',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.6), 2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.3), 0 0 15px rgba(212, 175, 55, 0.4)',
            letterSpacing: '0.02em',
            fontWeight: 500
          }}
        >
          ב-LUXCERA אנו יוצרים נרות שעווה יוקרתיים בעבודת יד, עם דגש על איכות, יופי וריחות מרגיעים.
          כל נר נבנה בקפידה ומתוך אהבה למלאכה.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { icon: '💎', title: 'איכות גבוהה', desc: 'שעווה איכותית וארומה מתמשכת', IconComponent: null },
          { icon: '✨', title: 'בעבודת יד', desc: 'יצירה קפדנית ואומנותית', IconComponent: null },
          { icon: null, title: 'משלוחים חינם', desc: 'משלוח חינם ברכישה מעל 300 ש״ח', IconComponent: Truck },
        ].map(({ icon, title, desc, IconComponent }) => (
          <div key={title} className="bg-black border-2 border-gold/20 rounded-lg p-6 text-center hover:shadow-gold transition-all shadow-luxury" role="article" aria-label={title}>
            {IconComponent ? (
              <div className="flex justify-center mb-4" aria-hidden="true">
                <IconComponent className="w-12 h-12 text-gold" />
              </div>
            ) : (
              <div className="text-4xl mb-4" aria-hidden="true">{icon}</div>
            )}
            <h3 className="font-semibold text-gold mb-2 text-lg">{title}</h3>
            <p className="text-gold/80 text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function LoyaltyClubSection({ onAccountClick }) {
  const { isLoggedIn, userEmail } = useApp();
  const navigate = useNavigate();
  const [isClubMember, setIsClubMember] = React.useState(false);
  const [clubLoading, setClubLoading] = React.useState(true);
  const [member, setMember] = React.useState(null);

  React.useEffect(() => {
    async function checkClubMember() {
      if (!isLoggedIn || !userEmail) {
        setClubLoading(false);
        return;
      }
      
      try {
        const data = await apiClubMe(userEmail);
        setIsClubMember(!!data.member);
        setMember(data.member);
      } catch (err) {
        setIsClubMember(false);
      } finally {
        setClubLoading(false);
      }
    }
    
    checkClubMember();
  }, [isLoggedIn, userEmail]);

  const handleJoinClick = () => {
    navigate('/profile');
  };

  return (
    <Section id="מועדון-לקוחות" className="py-20">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gift className="w-10 h-10 text-gold" />
          <h2 
            className="text-4xl font-bold"
            style={{
              color: '#D4AF37',
              fontFamily: 'serif',
              textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6), 3px 3px 0px rgba(0, 0, 0, 0.5), 6px 6px 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(212, 175, 55, 0.5)',
              letterSpacing: '0.05em'
            }}
          >
            מועדון לקוחות LUXCERA
          </h2>
        </div>
        <p 
          className="max-w-3xl mx-auto leading-relaxed text-lg mb-6"
          style={{
            color: '#D4AF37',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.6), 2px 2px 0px rgba(0, 0, 0, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.3), 0 0 15px rgba(212, 175, 55, 0.4)',
            letterSpacing: '0.02em',
            fontWeight: 500
          }}
        >
          הצטרף למועדון הלקוחות שלנו וצבור נקודות בכל רכישה! מתנת הצטרפות: 50 ש"ח (מותנה בקנייה מעל 150 ש"ח)
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {clubLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gold/80">טוען נתוני מועדון...</p>
          </div>
        ) : isLoggedIn && isClubMember && member ? (
          <div className="bg-black border-2 border-gold/30 rounded-lg p-8 shadow-xl">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gold/10 rounded-lg p-6 border border-gold/20 text-center">
                <TrendingUp className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-sm text-gold/80 mb-2">נקודות זמינות</p>
                <p className="text-3xl font-bold text-gold">
                  {(member.total_points - member.used_points).toLocaleString('he-IL')}
                </p>
              </div>
              <div className="bg-gold/10 rounded-lg p-6 border border-gold/20 text-center">
                <ShoppingBag className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-sm text-gold/80 mb-2">סה״כ רכישות</p>
                <p className="text-2xl font-bold text-gold">
                  {Number(member.total_spent).toLocaleString('he-IL', {
                    style: 'currency',
                    currency: 'ILS',
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="bg-gold/10 rounded-lg p-6 border border-gold/20 text-center">
                <Gift className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-sm text-gold/80 mb-2">סטטוס</p>
                <p className="text-xl font-bold text-gold">
                  {member.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                </p>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/profile')}
                className="bg-gold hover:bg-gold/90 text-black px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              >
                צפה בדשבורד המלא
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-black border-2 border-gold/30 rounded-lg p-8 shadow-xl text-center">
            <div className="mb-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gold/10 rounded-lg p-6 border border-gold/20">
                  <Gift className="w-8 h-8 text-gold mx-auto mb-3" />
                  <h3 className="font-semibold text-gold mb-2">מתנת הצטרפות</h3>
                  <p className="text-gold/80 text-sm">50 ש"ח מתנה</p>
                  <p className="text-gold/60 text-xs mt-1">מותנה בקנייה מעל 150 ש"ח</p>
                  <Link 
                    to="/loyalty-club-terms" 
                    className="text-gold/70 hover:text-gold text-xs underline mt-1 inline-block"
                  >
                    תנאי שימוש
                  </Link>
                </div>
                <div className="bg-gold/10 rounded-lg p-6 border border-gold/20">
                  <TrendingUp className="w-8 h-8 text-gold mx-auto mb-3" />
                  <h3 className="font-semibold text-gold mb-2">צבירת נקודות</h3>
                  <p className="text-gold/80 text-sm">5% החזר נקודות בכל רכישה</p>
                </div>
                <div className="bg-gold/10 rounded-lg p-6 border border-gold/20">
                  <ShoppingBag className="w-8 h-8 text-gold mx-auto mb-3" />
                  <h3 className="font-semibold text-gold mb-2">מימוש נקודות</h3>
                  <p className="text-gold/80 text-sm">הנחות והטבות בלעדיות</p>
                </div>
              </div>
            </div>
            {isLoggedIn ? (
              <button
                onClick={handleJoinClick}
                className="bg-gold hover:bg-gold/90 text-black px-10 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
              >
                הצטרף למועדון עכשיו
              </button>
            ) : (
              <div>
                <p className="text-gold/80 mb-4 text-lg">
                  התחבר או הירשם כדי להצטרף למועדון הלקוחות
                </p>
                <button
                  onClick={onAccountClick}
                  className="bg-gold hover:bg-gold/90 text-black px-10 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
                >
                  התחבר / הירשם
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}


function AccountModal({ isOpen, onClose, showCartMessage = false, onLoginSuccess }) {
  const { login, logout, isLoggedIn: contextIsLoggedIn } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = React.useState('login'); // 'login' or 'register'
  
  // טעינת פרטי משתמש מ-localStorage בהתחלה
  const [formData, setFormData] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('luxcera_userEmail');
      const savedUserName = localStorage.getItem('luxcera_userName');
      return {
        fullName: savedUserName || '',
        email: savedEmail || '',
        password: '',
        confirmPassword: '',
        phone: ''
      };
    }
    return { fullName: '', email: '', password: '', confirmPassword: '', phone: '' };
  });
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successType, setSuccessType] = React.useState(''); // 'login' or 'register'
  
  // עדכון פרטי משתמש מ-localStorage כשהמודאל נפתח והמשתמש מחובר
  React.useEffect(() => {
    if (isOpen && contextIsLoggedIn) {
      const savedEmail = localStorage.getItem('luxcera_userEmail');
      const savedUserName = localStorage.getItem('luxcera_userName');
      if (savedEmail || savedUserName) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail || prev.email,
          fullName: savedUserName || prev.fullName,
        }));
      }
    } else if (!contextIsLoggedIn) {
      // אם המשתמש לא מחובר, איפוס formData
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
    }
  }, [isOpen, contextIsLoggedIn]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(res => res.json());

        setLoading(true);
        setError('');

        try {
          // קבל CSRF token לפני שליחת הבקשה
          const csrfToken = await getCsrfToken();
          
          // אם זה מצב התחברות - בודקים אם המשתמש רשום
          if (mode === 'login') {
            const loginResponse = await fetch(getApiUrl('/api/login-google'), {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
              },
              body: JSON.stringify({ fullName: userInfo.name || 'משתמש', email: userInfo.email || '' })
            });
            
            const loginData = await loginResponse.json();
            
            if (!loginResponse.ok) {
              // המשתמש לא רשום - לא מאפשרים התחברות
              setLoading(false);
              setError(loginData.error || 'החשבון לא רשום במערכת. אנא הירשם קודם באמצעות Google.');
              return;
            }

            // המשתמש קיים - מאפשרים התחברות
            // נשתמש בשם מהמשתמש ב-DB אם קיים, אחרת מהמשתמש ב-Google
            const fullName = loginData.user?.full_name || userInfo.name || 'משתמש';
            const userEmail = userInfo.email || '';
            setFormData({ fullName, email: userEmail, password: '', confirmPassword: '', phone: '' });
            // שמירת אימייל ב-localStorage
            if (userEmail) {
              localStorage.setItem('luxcera_userEmail', userEmail);
            }
            setLoading(false);
            login({ name: fullName, email: userEmail });
            onLoginSuccess?.(fullName); // עדכון שם המשתמש ב-parent component
            setSuccessType('login');
            setShowSuccessMessage(true);
            setTimeout(() => { onClose(); setShowSuccessMessage(false); }, 2500);
            return;
          }
          
          // אם זה מצב הרשמה - רושמים משתמש חדש
          const response = await fetch(getApiUrl('/api/register'), {
            method: 'POST',
            credentials: 'include', // חובה כדי לשלוח עוגיות
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken, // שולח את הטוקן בכותרת
            },
            body: JSON.stringify({ fullName: userInfo.name || 'משתמש', email: userInfo.email || '' })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            // אם יש שגיאה מהשרת (למשל אימייל כבר קיים)
            setLoading(false);
            setError(data.error || 'שגיאה בהרשמה. אנא נסה שוב.');
            // אם האימייל כבר קיים - מעבר למצב התחברות
            if (data.error && data.error.includes('כבר רשומה')) {
              setTimeout(() => {
                setMode('login');
                setError('האימייל כבר רשום. אנא התחבר.');
              }, 2000);
            }
            return;
          }

          const fullName = userInfo.name || 'משתמש';
          const userEmail = userInfo.email || '';
          setFormData({ fullName, email: userEmail, password: '', confirmPassword: '', phone: '' });
          setLoading(false);
          login({ name: fullName, email: userEmail });
          // שמירת אימייל ב-localStorage
          if (userEmail) {
            localStorage.setItem('luxcera_userEmail', userEmail);
          }
          onLoginSuccess?.(fullName); // עדכון שם המשתמש ב-parent component
          setSuccessType('register');
          setShowSuccessMessage(true);
          setTimeout(() => { onClose(); setShowSuccessMessage(false); }, 2500);
        } catch (emailErr) {
          console.error('Email error:', emailErr);
          setLoading(false);
          setError('שגיאה בהרשמה. אנא נסה שוב.');
        }
      } catch (err) {
        console.error('Google login error:', err);
        setLoading(false);
        setError('שגיאה בהתחברות עם Google');
      }
    },
    onError: () => {
      setError('שגיאה בהתחברות עם Google');
      setLoading(false);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'register') {
      if (!formData.fullName || !formData.email || !formData.password) {
        setError('אנא מלא את כל השדות הנדרשים'); setLoading(false); return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('הסיסמאות אינן תואמות'); setLoading(false); return;
      }
      if (formData.password.length < 6) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים'); setLoading(false); return;
      }
    } else {
      // mode === 'login' - התחברות רגילה
      // הערה: כרגע אין endpoint להתחברות רגילה, רק Google login
      // אבל נשאיר את הקוד הזה למקרה שיוסיף בעתיד
      if (!formData.email || !formData.password) {
        setError('אנא מלא את כל השדות הנדרשים'); setLoading(false); return;
      }
      // TODO: הוסף endpoint להתחברות רגילה אם צריך
      setError('התחברות רגילה טרם זמינה. אנא השתמש ב-Google Login.'); 
      setLoading(false); 
      return;
    }

    try {
      if (mode === 'register') {
        try {
          // קבל CSRF token לפני שליחת הבקשה
          const csrfToken = await getCsrfToken();
          
          const response = await fetch(getApiUrl('/api/register'), {
            method: 'POST',
            credentials: 'include', // חובה כדי לשלוח עוגיות
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken, // שולח את הטוקן בכותרת
            },
            body: JSON.stringify({ fullName: formData.fullName, email: formData.email })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            // אם יש שגיאה מהשרת (למשל אימייל כבר קיים)
            setLoading(false);
            setError(data.error || 'שגיאה בהרשמה. אנא נסה שוב.');
            return;
          }
        } catch (emailErr) {
          console.error('Email error:', emailErr);
          setLoading(false);
          setError('שגיאה בהרשמה. אנא נסה שוב.');
          return;
        }
      }

      setLoading(false);
      login({ name: formData.fullName, email: formData.email });
      // עדכון שם המשתמש ב-parent component
      if (formData.fullName) {
        onLoginSuccess?.(formData.fullName);
      }
      setSuccessType(mode);
      setShowSuccessMessage(true);
      setTimeout(() => { onClose(); setShowSuccessMessage(false); }, 2500);
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      setError('שגיאה בהרשמה. אנא נסה שוב.');
    }
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'Google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID' || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        alert('Google Login אינו מוגדר כרגע. אנא השתמש בטופס הרגיל להרשמה או פנה למנהל המערכת.');
        return;
      }
      googleLogin();
    }
  };

  if (!isOpen) return null;

  // הודעה אם צריך להתחבר כדי לראות עגלה
  const showCartPrompt = showCartMessage && !contextIsLoggedIn;

  if (contextIsLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">אזור אישי</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="סגור">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 bg-[#40E0D0] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(formData.fullName || (typeof window !== 'undefined' && localStorage.getItem('luxcera_userName'))) 
                  ? (formData.fullName || localStorage.getItem('luxcera_userName') || 'U')[0].toUpperCase() 
                  : 'U'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {formData.fullName || (typeof window !== 'undefined' && localStorage.getItem('luxcera_userName')) || 'משתמש'}
                </h3>
                <p className="text-sm text-gray-600">
                  {formData.email || (typeof window !== 'undefined' && localStorage.getItem('luxcera_userEmail')) || 'email@example.com'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                onClose();
                navigate('/my-orders');
              }}
              className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-700" />
                <span className="font-semibold text-gray-900">הזמנות שלי</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button 
              onClick={() => {
                onClose();
                navigate('/profile');
              }}
              className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-700" />
                <span className="font-semibold text-gray-900">פרופיל</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button onClick={() => {
              logout();
              onLoginSuccess?.(''); // איפוס שם המשתמש
            }} className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mt-4">
              התנתק
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">{mode === 'login' ? 'התחברות' : 'הרשמה'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="סגור">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showCartPrompt && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-start gap-3">
              <ShoppingBag className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-bold text-sm mb-1">עליך להתחבר או להירשם לאתר כדי להוסיף פריטים לסל</p>
                <p className="text-yellow-700 text-sm">אנא התחבר/הירשם באמצעות Google או הרשמה רגילה, ואז תוכל להוסיף פריטים לסל הקניות שלך ולהשלים את ההזמנה.</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors font-semibold text-gray-900"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93ל2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              המשך עם Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">או</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                  placeholder="הזן שם מלא"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אימייל *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                placeholder="הזן אימייל"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                  placeholder="הזן מספר טלפון"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סיסמה *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                placeholder="הזן סיסמה"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">אישור סיסמה *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                  placeholder="הזן סיסמה שוב"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'מעבד...' : mode === 'login' ? 'התחבר' : 'הירשם'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-gray-600">
              {mode === 'login' ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setFormData({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
                }}
                className="underline font-medium text-[#40E0D0] hover:text-[#30D5C8] mr-1"
              >
                {mode === 'login' ? 'הרשם כאן' : 'התחבר כאן'}
              </button>
            </p>
          </div>
        </div>

        {showSuccessMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-green-50 border-2 border-green-500 rounded-lg flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              {successType === 'register' ? 'ברוכים הבאים ל-LUXCERA!' : 'התחברת בהצלחה!'}
            </h3>
            <p className="text-green-700 text-center text-lg">
              {successType === 'register'
                ? 'ההרשמה הושלמה בהצלחה. כעת ניתן לבצע הזמנות ולהתאים אישית את נרות השעווה שלך.'
                : 'נכנסת לחשבון שלך. כעת ניתן לבצע הזמנות ולצפות בהיסטוריית ההזמנות.'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function SearchModal({ isOpen, onClose, products, onAddToCart }) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(product => product.name.toLowerCase().includes(query));
  }, [searchQuery, products]);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const input = document.querySelector('#search-input');
        if (input) input.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2ל font-bold text-gray-900">חיפוש מוצרים</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="סגור">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש מוצרים..."
              className="w-full border border-gray-300 rounded-lg px-12 py-4 text-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
              dir="rtl"
              aria-label="חיפוש"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {searchQuery.trim() ? 'לא נמצאו מוצרים התואמים לחיפוש' : 'התחל להקליד כדי לחפש מוצרים'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => {
                const hasSalePrice = product.salePrice && product.salePrice > 0;
                return (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -4 }}
                    className="flex items-center gap-4 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => {
                      const gallerySection = document.getElementById('גלריה');
                      if (gallerySection) gallerySection.scrollIntoView({ behavior: 'smooth' });
                      onClose();
                    }}
                  >
                    <div className={`w-20 h-20 rounded-lg ${product.color} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-4xl" aria-hidden="true">{product.image}</div>
                      )}
                      {hasSalePrice && (
                        <div className="sale-badge-corner">
                          מבצע
                        </div>
                      )}
                    </div>

                                                                                     <div className="flex-1 min-w-0">
                         <h3 className="font-semibold text-gray-900 mb-1 text-lg truncate" style={{ fontFamily: 'serif' }}>{product.name}</h3>
                         {hasSalePrice ? (
                           <div className="mb-2 flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                               <span className="text-gold font-semibold text-sm">מבצע:</span>
                               <span className="text-gold text-xl font-bold">₪ {Number(product.salePrice).toFixed(2)}</span>
                             </div>
                             <span className="text-gray-400 text-sm line-through">₪ {Number(product.originalPrice).toFixed(2)}</span>
                           </div>
                         ) : (
                           <p className="text-gray-700 text-xl font-semibold mb-2">₪ {Number(product.price).toFixed(2)}</p>
                         )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.inStock) {
                            onAddToCart(product);
                            onClose();
                          }
                        }}
                        className={`text-sm px-4 py-2 rounded-lg font-semibold transition-colors ${product.inStock ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-400 text-white cursor-not-allowed'}`}
                        disabled={!product.inStock}
                      >
                        {product.inStock ? 'הוספה לסל' : 'אזל מהמלאי'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">נמצאו {filteredProducts.length} מוצרים</div>
      </motion.div>
    </div>
  );
}

// רשימת ערים, מושבים וקיבוצים בישראל - ללא כפילויות
const ISRAELI_CITIES_RAW = [
  'תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'אשדוד', 'נתניה', 'באר שבע',
  'בני ברק', 'חולון', 'רמת גן', 'אשקלון', 'רחובות', 'בת ים', 'כפר סבא',
  'הרצליה', 'מודיעין', 'לוד', 'רמת השרון', 'רמלה', 'אילת', 'עכו',
  'טבריה', 'צפת', 'נצרת', 'עפולה', 'נהריה', 'קריית שמונה', 'מגדל העמק',
  'כרמיאל', 'קריית גת', 'דימונה', 'אריאל', 'בית שמש', 'נתיבות', 'קריית מלאכי',
  'שדרות', 'סחנין', 'אום אל פחם', 'טייבה', 'רהט', 'נס ציונה', 'קריית אונו',
  'גבעתיים', 'יהוד', 'ראש העין', 'יבנה', 'אור יהודה', 'גבעת שמואל',
  'קריית אתא', 'קריית ביאליק', 'קריית ים', 'קריית מוצקין', 'זכרון יעקב', 'מעלות',
  'מצפה רמון', 'ערד', 'ירוחם', 'מיתר', 'להבים', 'עומר', 'לקיה',
  'בית דגן', 'הוד השרון', 'כפר יונה', 'מעלה אדומים', 'קריית טבעון', 'רעננה',
  'רשפון', 'שוהם', 'תל מונד', 'אבן יהודה', 'אזור', 'בני עטרות', 'גבעת כ"ח',
  'גני תקווה', 'זכריה', 'חדרה', 'טירת כרמל', 'יקנעם עילית',
  'מגדיאל', 'מזכרת בתיה', 'מעברות', 'נס הרים', 'עין הוד', 'פרדס חנה',
  'קדימה', 'רמת ישי', 'שדה ורבורג', 'אבו גוש', 'אביאל', 'אבן שמואל',
  'אור עקיבא', 'אורנית', 'אליכין', 'ארסוף', 'באר טוביה', 'באר יעקב', 'בית ברל',
  'בית חנן', 'בית חירות', 'בית יצחק', 'בית נחמיה', 'בית עוזיאל', 'בית עריף',
  'בית רבן', 'בני דרור', 'בני עי"ש', 'בני ציון', 'בצרה', 'בר גיורא',
  'גבעת ברנר', 'גבעת חיים', 'גבעת ניל"י', 'גבעת עדה', 'גדרה',
  'גן יבנה', 'גן שמואל', 'גני הדר', 'גת רימון', 'דגניה', 'דורות',
  'כפר ביל"ו', 'כפר גלים', 'כפר המכבי', 'כפר הנוער', 'כפר חב"ד', 'כפר מנדא',
  'כפר שמואל', 'מגידו', 'מקווה ישראל', 'פתח תקווה',
  'אביחיל', 'אבן יצחק', 'אדרת', 'אודם', 'אורים', 'אורן', 'אושה', 'אחוזת ברק',
  'אחיטוב', 'איבים', 'אילון', 'איתן', 'אלוני אבא', 'אלוני יצחק', 'אלונים',
  'אליפלט', 'אלישיב', 'אלישמע', 'אליקים', 'אלרום', 'אלרואי', 'אמונים',
  'אמציה', 'אניעם', 'אסד', 'אשדות יעקב', 'אשדות יעקב מאוחד', 'אשדות יעקב איחוד',
  'אשלים', 'אשתאול', 'אתגר', 'בארות יצחק', 'בארותיים', 'בארי', 'בוסתן הגליל',
  'בורגתה', 'בחן', 'ביצרון', 'בית אורן', 'בית אלעזרי', 'בית גוברין', 'בית גמליאל',
  'בית דוד', 'בית הלוי', 'בית הלל', 'בית זיד', 'בית זית', 'בית חורון', 'בית ינאי',
  'בית יצחק-שער חפר', 'בית לחם הגלילית', 'בית מאיר', 'בית נקופה',
  'בית עובד', 'בית קמה', 'בית רמות', 'בית רימון', 'בית שאן',
  'בית שקמה', 'ביתן אהרן', 'בלפוריה', 'בן שמן', 'בני דקלים',
  'בני ראם', 'בנימינה', 'בר יוחאי', 'ברור חיל', 'ברכיה', 'ברקאי', 'ברקן', 'ברקת', 'בת הדר', 'בת חן',
  'בת חפר', 'בת שלמה', 'גאולי תימן', 'גאולים', 'גאליה', 'גבולות', 'גבים',
  'גבע', 'גבע כ"ח', 'גבעולים', 'גבעון החדשה', 'גבעות בר', 'גבעת אבני', 'גבעת בוסתן',
  'גבעת השלושה', 'גבעת זאב', 'גבעת חיים איחוד',
  'גבעת עוז', 'גבעת שפירא', 'גבעתי',
  'גברעם', 'גבת', 'גדות', 'גדיש', 'גדעונה',
  'גונן', 'גורן', 'גזית', 'גיאה', 'גיבתון', 'גיזו', 'גילון', 'גילת', 'גינוסר',
  'גיניגר', 'גינתון', 'גיתה', 'גיתית', 'גלאון', 'גליל ים', 'גלעד', 'גמזו',
  'גן הדרום', 'גן השומרון', 'גן חיים', 'גן יאשיה', 'גן נר',
  'גן שורק', 'גנות', 'גנות הדר', 'גני טל', 'גני יוחנן',
  'גני מודיעין', 'געש', 'געתון', 'גפן', 'גרופית', 'גשור', 'גשר',
  'גשר הזיו', 'גת', 'דבורה', 'דבירה', 'דברת', 'דגניה א', 'דגניה ב',
  'דוב"ב', 'דור', 'דחי', 'דייר אל-אסד', 'דייר חנא', 'דייר רפאת',
  'דישון', 'דליה', 'דלתון', 'דמיידה', 'דן', 'דפנה', 'האון', 'הבונים',
  'הגושרים', 'הודיה', 'הוזייל', 'הושעיה', 'הזורע', 'הזורעים',
  'החותרים', 'היוגב', 'הילה', 'המעפיל', 'הסוללים', 'העוגן', 'הר אדר', 'הר גילה',
  'הר עמשא', 'הראל', 'הרדוף', 'זבארה', 'זבדיאל', 'זוהר',
  'זיקים', 'זמר', 'זמרת', 'זנוח', 'זרועה', 'זרזיר',
  'זריקיה', 'חד-נס', 'חוגלה', 'חולדה', 'חולית', 'חולתה',
  'חוסן', 'חוסנייה', 'חופית', 'חוקוק', 'חורון', 'חורשים', 'חזון', 'חיבת ציון',
  'חיננית', 'חירות', 'חלוץ', 'חלמיש', 'חלץ', 'חמד', 'חמדיה', 'חמדת',
  'חניאל', 'חניתה', 'חנתון', 'חספין', 'חפץ חיים', 'חפצי-בה', 'חצב', 'חצבה',
  'חצור-אשדוד', 'חצור הגלילית', 'חצרים', 'חרובית', 'חרות', 'חרמש', 'חרשים',
  'טובא-זנגריה', 'טורעאן', 'טירה', 'טירת יהודה',
  'טירת צבי', 'טל-אל', 'טל שחר', 'טללים', 'טלמון', 'טמרה', 'טמרה יזרעאל',
  'טנא', 'טפחות', 'יאנוח-גת', 'יבול', 'יגור', 'יגל', 'יד השמונה', 'יד חנה',
  'יד מרדכי', 'יד נתן', 'יד רמב"ם', 'ידידה', 'יהל', 'יובל', 'יודפת', 'יונתן',
  'יושיביה', 'יזרעאל', 'יחיעם', 'יטבתה', 'ייט"ב', 'יכיני', 'ינוב', 'ינון',
  'יסודות', 'יסוד המעלה', 'יסעור', 'יעד', 'יעל', 'יערה', 'יערות הכרמל',
  'יפיע', 'יפית', 'יפעת', 'יפתח', 'יצהר', 'יציץ', 'יקום', 'יקיר', 'יראון',
  'ירדנה', 'ירחיב', 'ירקונה', 'ישע', 'ישעי', 'ישרש', 'יתד', 'כאבול',
  'כאוכב אבו אל-היגא', 'כברי', 'כדורי', 'כדיתה', 'כוכב השחר', 'כוכב יאיר',
  'כוכב מיכאל', 'כורזים', 'כחל', 'כחלה', 'כיסופים', 'כישור', 'כליל', 'כלנית',
  'כמאנה', 'כמהין', 'כמון', 'כנות', 'כנף', 'כנרת', 'כסיפה', 'כסלון', 'כסרא-סמיע',
  'כעביה-טבאש-חגאגרה', 'כרם בן שמן', 'כרם בן זימרה', 'כרם יבנה', 'כרם מהר"ל',
  'כרם שלום', 'כרמי יוסף', 'כרמי צור', 'כרמיה', 'כרמים', 'כרמית',
  'כרנסא', 'כרתים', 'להב', 'להבות חביבה',
  'לוטם', 'לוחמי הגיטאות', 'לוזית', 'לוחם', 'לימן', 'לכיש', 'לפיד', 'לפידות',
  'מאור', 'מאיר שפיה', 'מבוא ביתר', 'מבוא חורון', 'מבוא מודיעין', 'מבואות ים', 'מבואות יריחו',
  'מבואות עירון', 'מבואות תענך', 'מבוא חמה', 'מבטחים', 'מבקיעים', 'מבשרת ציון',
  'מגאר', 'מגל', 'מגן', 'מגן שאול', 'מגשימים', 'מדרך עוז', 'מדרשת בן גוריון',
  'מדרשת רופין', 'מודיעין עילית', 'מודיעין-מכבים-רעות', 'מולדת', 'מוצא עילית',
  'מוקייבלה', 'מורן', 'מורשת', 'מזור', 'מזרעה', 'מחולה', 'מחנה הילה',
  'מחנה תל נוף', 'מחנה יתיר', 'מחנה יפה', 'מחנה יקים', 'מחנה מרים', 'מחנה נחום',
  'מחנה סירקין', 'מחנה עוז', 'מחנה רעים', 'מחניים', 'מחסיה',
  'מטולה', 'מטע', 'מי עמי', 'מייסר', 'מיצר', 'מירב', 'מירון', 'מישר',
  'מכורה', 'מכמורת', 'מכמנים', 'מלכיה', 'מנוחה', 'מנוף', 'מנות', 'מנחמיה',
  'מנרה', 'מסד', 'מסדה', 'מסילות', 'מסילת ציון', 'מסלול', 'מסעדה',
  'מעגן', 'מעגן מיכאל', 'מעוז חיים', 'מעון', 'מעונה', 'מעין ברוך', 'מעין צבי',
  'מעלה גלבוע', 'מעלה גמלא', 'מעלה החמישה', 'מעלה לבונה',
  'מעלה מכמש', 'מעלה עירון', 'מעלות-תרשיחא', 'מענית', 'מעש', 'מפלסים',
  'מצובה', 'מצדות יהודה', 'מצפה', 'מצפה אביב', 'מצפה אילן', 'מצפה הילה',
  'מצפה חגית', 'מצפה יריחו', 'מצפה נטופה', 'מצפה שלם', 'מצר',
  'מרגליות', 'מרום גולן', 'מרחביה', 'מרחב עם', 'מרכז שפירא',
  'משאבי שדה', 'משגב דב', 'משגב עם', 'משהד', 'משואה', 'משואות יצחק', 'משמר איילון',
  'משמר דוד', 'משמר הירדן', 'משמר הנגב', 'משמר העמק', 'משמר השבעה', 'משמר השרון',
  'משמרות', 'משמרת', 'משען', 'מתן', 'מתת', 'מתתיהו', 'נאות גולן', 'נאות הכיכר',
  'נאות מרדכי', 'נאות סמדר', 'נבטים', 'נגבה', 'נגוהות', 'נהורה', 'נהלל',
  'נוב', 'נוגה', 'נווה', 'נווה אבות', 'נווה אור', 'נווה אטי"ב', 'נווה אילן',
  'נווה איתן', 'נווה דניאל', 'נווה זיו', 'נווה חריף', 'נווה ים', 'נווה ימין',
  'נווה ירק', 'נווה מבטח', 'נווה מיכאל', 'נווה שלום', 'נועם', 'נוף איילון',
  'נופים', 'נופית', 'נופך', 'נוקדים', 'נורדיה', 'נחושה', 'נחל עוז', 'נחלה',
  'נחליאל', 'נחלים', 'נחלת יהודה', 'נחלת יצחק', 'נחם', 'נחף', 'נחשולים',
  'נחשון', 'נחשונים', 'נטועה', 'נטור', 'נטע', 'נטעים', 'נטף', 'ניין',
  'ניצן', 'ניצנה', 'ניצני עוז', 'ניצנים', 'ניר אליהו', 'ניר בנים', 'ניר גלים',
  'ניר דוד', 'ניר ח"ן', 'ניר יפה', 'ניר יצחק', 'ניר ישראל', 'ניר משה', 'ניר עוז',
  'ניר עם', 'ניר עציון', 'ניר עקיבא', 'ניר צבי', 'נירים', 'נירית',
  'נס עמים', 'נעורים', 'נעלה', 'נעמ"ה', 'נען', 'נצר חזני', 'נצר סרני',
  'נצרת עילית', 'נשר', 'נתיב הל"ה', 'נתיב הגדוד', 'נתיב העשרה', 'נתיב השיירה',
  'סאסא', 'סביון', 'סגולה', 'סואעד', 'סולם', 'סומך', 'סוסיה',
  'סופה', 'סייד', 'סלמה', 'סלעית', 'סמר', 'סנסנה', 'סעד', 'סער',
  'ספיר', 'ספסופה', 'סתריה', 'עבדון', 'עברון', 'עגור', 'עדי', 'עדנים', 'עוזה',
  'עוזייר', 'עולש', 'עופר', 'עופרה', 'עוצם', 'עוקבי', 'עזוז', 'עזר',
  'עזריאל', 'עזריה', 'עזריקם', 'עטרת', 'עיינות', 'עין אילה', 'עין אל-אסד',
  'עין גב', 'עין גדי', 'עין הדר', 'עין החורש', 'עין המפרץ', 'עין הנצי"ב',
  'עין העמק', 'עין השופט', 'עין ורד', 'עין זיוון', 'עין חוד', 'עין חרוד',
  'עין חרוד איחוד', 'עין חרוד מאוחד', 'עין יהב', 'עין יעקב', 'עין כרם-בי"ס חקלאי',
  'עין כרמל', 'עין מאהל', 'עין נקובה', 'עין עירון', 'עין צורים', 'עין רפה',
  'עין שמר', 'עין שריד', 'עין תמר', 'עינת', 'עיר אובות', 'עלומים',
  'עלי', 'עלי זהב', 'עלמה', 'עלמון', 'עמוקה', 'עמיעד', 'עמיעוז', 'עמיקם',
  'עמיר', 'עמנואל', 'עספיא', 'עצמון שגב', 'עראבה', 'ערוגות',
  'ערערה', 'ערערה-בנגב', 'עשרת', 'עתלית', 'עתניאל', 'פארן', 'פדואל', 'פדיה',
  'פוריה - כפר עבודה', 'פוריה - נווה עובד', 'פוריה עילית', 'פוריידיס', 'פורת',
  'פטיש', 'פלך', 'פלמחים', 'פני קדם', 'פנימיית עין כרם', 'פסגות', 'פסוטה',
  'פקיעין', 'פקיעין החדשה', 'פרדס חנה-כרכור', 'פרדסיה', 'פרוד', 'פרזון',
  'צאלים', 'צביה', 'צובה', 'צוחר', 'צופיה', 'צופים', 'צופית', 'צופר', 'צוקי ים',
  'צוקים', 'צור הדסה', 'צור יצחק', 'צור משה', 'צור נתן', 'צוריאל', 'צורית',
  'ציפורי', 'צלפון', 'צנדלה', 'צפריה', 'צפרירים', 'צרופה', 'צרעה', 'קבועה',
  'קבוצת יבנה', 'קדומים', 'קדמה', 'קדמת צבי', 'קדר', 'קדרון',
  'קדרים', 'קודייראת א-צאנע', 'קוואעין', 'קוממיות', 'קורנית', 'קטורה', 'קיבוץ יגור',
  'קיבוץ יפעת', 'קיבוץ רמת רחל', 'קידה', 'קיסריה', 'קלחים', 'קליה', 'קציר',
  'קצר א-סר', 'קצרין', 'קרית ארבע', 'קרית יערים',
  'קרית נטפים', 'קרית ענבים', 'קרית עקרון', 'קרני שומרון', 'ראס עלי',
  'ראש פינה', 'ראש צורים', 'רבבה', 'רבדים', 'רביבים', 'רביד',
  'רגבה', 'רגבים', 'רוויה', 'רוחמה', 'רומת הייב', 'רועי', 'רותם',
  'רחוב', 'רחלים', 'ריחאניה', 'ריחן', 'רימונים', 'רינתיה', 'רכסים',
  'רם-און', 'רמות', 'רמות השבים', 'רמות מאיר', 'רמות מנשה', 'רמות נפתלי',
  'רמת דוד', 'רמת הכובש', 'רמת רחל', 'רמת רזיאל', 'רמת יוחנן',
  'רמת מגשימים', 'רמת השופט',
  'רמת טראמפ', 'רנן', 'רעים',
  'רתמים', 'שאר ישוב', 'שבי דרום', 'שבי ציון', 'שבי שומרון', 'שבלי',
  'שגב-שלום', 'שדה אילן', 'שדה אליהו', 'שדה אליעזר', 'שדה בוקר', 'שדה דוד',
  'שדה יואב', 'שדה יעקב', 'שדה יצחק', 'שדה משה', 'שדה נחום',
  'שדה נחמיה', 'שדה ניצן', 'שדה עוזיהו', 'שדות ים', 'שדות מיכה', 'שואבה',
  'שובה', 'שובל', 'שומרה', 'שומריה', 'שוקדה', 'שורש', 'שורשים',
  'שושנת העמקים', 'שזור', 'שחר', 'שחרות', 'שיבולים', 'שיזף', 'שיטים',
  'שייח דנון', 'שילה', 'שילת', 'שכניה', 'שלווה', 'שלוחות', 'שלומי', 'שלומית',
  'שמיר', 'שמעה', 'שמרת', 'שמשית', 'שני', 'שניר', 'שעב', 'שעל', 'שעלבים',
  'שער אפרים', 'שער הגולן', 'שער העמקים', 'שער מנשה', 'שער שומרון', 'שפיים',
  'שפר', 'שפרעם', 'שקד', 'שקף', 'שרונה', 'שריגים', 'שרשרת', 'שרת', 'שרתון',
  'תאשור', 'תדהר', 'תובל', 'תומר', 'תושיה', 'תימורים', 'תירוש',
  'תל אביב-יפו', 'תל יוסף', 'תל יצחק', 'תל עדשים', 'תל ערד',
  'תל קציר', 'תל ציון', 'תל רעים', 'תל תאומים', 'תלם', 'תלמי אליהו', 'תלמי אלעזר',
  'תלמי ביל"ו', 'תלמי יוסף', 'תלמי יחיאל', 'תלמי יפה', 'תלמים', 'תמרת', 'תנובות',
  'תעוז', 'תפרח', 'תקומה', 'תרום', 'תרדיון', 'תרשיש', 'תשבי', 'תשע פינות'
];

// הסרת כפילויות ומיון
const ISRAELI_CITIES = Array.from(new Set(ISRAELI_CITIES_RAW)).sort();

function CheckoutModal({ isOpen, onClose, cart, onOrderComplete }) {
  const { giftCardAmount, giftCardCode, promoAmount, applyGiftCard, applyPromoCode, clearDiscounts, getFinalTotal, getCartTotal } = useApp();
  const [step, setStep] = React.useState(1);
  const [shippingData, setShippingData] = React.useState({ fullName: '', email: '', phone: '', address: '', city: '', postalCode: '', notes: '' });
  const [paymentData, setPaymentData] = React.useState({ paymentMethod: 'bit' });
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [orderSaved, setOrderSaved] = React.useState(false);
  const [orderId, setOrderId] = React.useState(null);
  const [saveError, setSaveError] = React.useState(null);
  const [citySuggestions, setCitySuggestions] = React.useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = React.useState(false);
  const cityInputRef = React.useRef(null);
  const [validationErrors, setValidationErrors] = React.useState({});
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  // שמירת הקרט המקורי - כדי שלא יאבד כשהקרט מתרוקן אחרי יצירת ההזמנה
  const [savedCart, setSavedCart] = React.useState([]);

  // שמירת הקרט כשהמודאל נפתח או כשהקרט משתנה (אבל לא ריק)
  React.useEffect(() => {
    // אם המודאל פתוח והקרט לא ריק, שמור אותו
    if (isOpen && cart.length > 0) {
      setSavedCart(cart);
    }
    // אם המודאל נפתח בפעם הראשונה, שמור את הקרט גם אם הוא ריק (אבל זה לא אמור לקרות)
    else if (isOpen && savedCart.length === 0 && cart.length > 0) {
      setSavedCart(cart);
    }
  }, [isOpen, cart]);

  // שימוש בקרט שמור במקום הקרט הנוכחי (אם יש קרט שמור)
  // זה מבטיח שגם אם הקרט מתרוקן אחרי יצירת ההזמנה, נשתמש בקרט המקורי
  const cartToUse = savedCart.length > 0 ? savedCart : cart;

  // חישוב הסכומים - משתמשים ב-useMemo כדי לוודא שהחישוב מתעדכן כשה-cart משתנה
  const cartTotal = React.useMemo(() => {
    const total = cartToUse.reduce((sum, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      return sum + (itemPrice * itemQuantity);
    }, 0);
    return total;
  }, [cartToUse]);

  const shippingFee = React.useMemo(() => {
    // בדיקה אם כל הפריטים בעגלה הם Gift Cards - אם כן, אין עלות משלוח
    const isOnlyGiftCards = cartToUse.length > 0 && cartToUse.every(item => item.isGiftCard === true);
    
    // אם כל הפריטים הם Gift Cards, אין עלות משלוח. אחרת, חישוב רגיל
    if (isOnlyGiftCards) {
      return 0;
    }
    
    const fee = cartTotal >= 300 ? 0 : 30;
    return fee;
  }, [cartTotal, cartToUse]);

  // חישוב הסכום הסופי - משתמש ב-cartTotal המקומי (מ-cartToUse) ולא מה-AppContext
  const finalTotal = React.useMemo(() => {
    const subtotal = cartTotal;
    const total = subtotal + shippingFee - giftCardAmount - promoAmount;
    return Math.max(0, total); // לא פחות מ-0
  }, [cartTotal, shippingFee, giftCardAmount, promoAmount]);

  React.useEffect(() => {
    // אם המודל נסגר וההזמנה לא הושלמה, מאפסים את כל ה-states
    // אבל אם ההזמנה הושלמה (יש orderId), לא מאפסים כדי שה-POP UP יישאר פתוח
    if (!isOpen && !(isComplete && orderSaved && orderId)) {
      setStep(1);
      setIsComplete(false);
      setIsProcessing(false);
      setOrderSaved(false);
      setOrderId(null);
      setSaveError(null);
      setShippingData({ fullName: '', email: '', phone: '', address: '', city: '', postalCode: '', notes: '' });
      setPaymentData({ paymentMethod: 'bit' });
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setValidationErrors({});
      setAgreedToTerms(false);
      clearDiscounts(); // מנקים הנחות כשהמודאל נסגר
    }
  }, [isOpen, isComplete, orderSaved, orderId, clearDiscounts]);

  // פונקציה לסינון ערים לפי הקלדה
  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setShippingData({ ...shippingData, city: value });
    
    if (value.length > 0) {
      // מחפש ערים שמתחילות עם הטקסט הקליד, ואם אין - מחפש גם בתוך השם
      const startsWith = ISRAELI_CITIES.filter(city => 
        city.startsWith(value)
      );
      const contains = ISRAELI_CITIES.filter(city => 
        city.includes(value) && !city.startsWith(value)
      );
      const filtered = [...startsWith, ...contains].slice(0, 10); // מוגבל ל-10 תוצאות
      setCitySuggestions(filtered);
      setShowCitySuggestions(filtered.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  const handleCitySelect = (city) => {
    setShippingData({ ...shippingData, city });
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    // ניקוי שגיאת ולידציה אם הייתה
    if (validationErrors.city) {
      setValidationErrors({ ...validationErrors, city: '' });
    }
  };

  // סגירת רשימת הערים כשלוחצים מחוץ
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // פונקציה לבדיקת ולידציה של פרטי משלוח
  const validateShippingData = () => {
    const errors = {};
    
    if (!shippingData.fullName || shippingData.fullName.trim() === '') {
      errors.fullName = 'שם מלא נדרש';
    }
    
    if (!shippingData.phone || shippingData.phone.trim() === '') {
      errors.phone = 'טלפון נדרש';
    } else if (shippingData.phone.trim().length < 9) {
      errors.phone = 'מספר טלפון לא תקין';
    }
    
    // בדיקה אם כל הפריטים בעגלה הם Gift Cards - אם כן, לא צריך address ו-city
    const isOnlyGiftCards = cartToUse.length > 0 && cartToUse.every(item => item.isGiftCard === true);
    
    // address ו-city נדרשים רק אם יש מוצרים רגילים (לא Gift Cards בלבד)
    if (!isOnlyGiftCards) {
      if (!shippingData.address || shippingData.address.trim() === '') {
        errors.address = 'כתובת משלוח נדרשת';
      }
      
      if (!shippingData.city || shippingData.city.trim() === '') {
        errors.city = 'עיר נדרשת';
      }
    }
    
    // מיקוד לא חובה - לא בודקים אותו
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    
    if (!validateShippingData()) {
      // גלילה למעלה כדי שהשגיאות יראו
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }
    
    setStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    // בודקים שוב את פרטי המשלוח לפני מעבר לסיכום
    if (!validateShippingData()) {
      // אם יש שגיאות, חוזרים לשלב 1
      setStep(1);
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }
    
    setStep(3);
  };

  const handleCompleteOrder = async () => {
    // בודקים שוב את כל הפרטים לפני שליחת ההזמנה
    if (!validateShippingData()) {
      setStep(1);
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }
    
    // בדיקה שהמשתמש הסכים לתנאי השימוש ומדיניות הפרטיות
    if (!agreedToTerms) {
      setSaveError('יש לאשר את תנאי השימוש ומדיניות הפרטיות כדי להמשיך');
      return;
    }
    
    setIsProcessing(true);
    setSaveError(null);
    
    try {
      // שליחת ההזמנה לשרת
      // מוודאים שכל הנתונים עם הטיפוסים הנכונים
      
      // בדיקה אם כל הפריטים בעגלה הם Gift Cards - אם כן, לא צריך address ו-city
      const isOnlyGiftCards = cartToUse.length > 0 && cartToUse.every(item => item.isGiftCard === true);
      
      // הכנת shippingData - עבור Gift Cards בלבד, address ו-city יכולים להיות null
      const shippingDataForOrder = {
        ...shippingData,
        address: isOnlyGiftCards ? null : (shippingData.address || null),
        city: isOnlyGiftCards ? null : (shippingData.city || null),
      };
      
      const orderData = {
        shippingData: shippingDataForOrder,
        paymentData: {
          paymentMethod: 'bit',
        },
        cart: cartToUse.map(item => ({
          id: item.isGiftCard ? String(item.id) : Number(item.id), // Gift Cards יש להם string ID
          name: String(item.name),
          price: Number(item.price),
          originalPrice: Number(item.originalPrice || item.price),
          salePrice: item.salePrice ? Number(item.salePrice) : null,
          quantity: Number(item.quantity),
          inStock: item.inStock !== undefined ? Boolean(item.inStock) : true,
          color: item.color || null,
          image: item.image || null,
          imageUrl: item.imageUrl || null,
          category: item.category || null,
          description: item.description || null,
          isGiftCard: item.isGiftCard || false,
          giftCardEmail: item.giftCardEmail || null,
          giftCardAmount: item.giftCardAmount || null,
        })),
        total: Number(finalTotal),
        gift_card_amount: giftCardAmount > 0 ? Number(giftCardAmount) : 0,
        gift_card_code: giftCardCode || null,
      };

      const res = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      
      if (data.ok) {
        setOrderSaved(true);
        setOrderId(data.orderId);
        setIsComplete(true);
        // לא מאפסים את agreedToTerms כאן כי אנחנו רוצים שה-POP UP יופיע
        // אבל נאפס אותו כשסוגרים את ה-POP UP כדי שבעסקה הבאה התיבה תופיע שוב
        onOrderComplete?.({ shippingData, paymentData, cart: cartToUse, total: finalTotal, orderId: data.orderId });
      } else {
        setSaveError(data.error || 'שגיאה בשמירת ההזמנה');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Order error:', err);
      setSaveError('לא הצלחתי לשלוח את ההזמנה לשרת');
      setIsProcessing(false);
    }
  };

  // אם ההזמנה הושלמה בהצלחה, מציגים את ה-POP UP גם אם המודל נסגר
  // חשוב: ה-POP UP יופיע גם אם המודל נסגר, כל עוד ההזמנה הושלמה
  if (isComplete && orderSaved && orderId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-8 text-center" dir="rtl">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">ההזמנה התקבלה!</h2>
          <p className="text-gray-600 mb-4">תודה על רכישתך. ההזמנה נשמרה בהצלחה.</p>
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">מספר הזמנה</p>
              <p className="text-2xl font-bold text-[#40E0D0]">#{orderId}</p>
            </div>
          )}
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4 font-semibold">עכשיו תוכל לשלם בביט:</p>
            <div className="flex justify-center">
              <BitPaymentButton
                amount={finalTotal}
                bitPhone="0546998603"
                whatsappPhone="972546998603"
                buttonLabel="תשלום בביט"
                allowEdit={false}
              />
            </div>
          </div>
          
          <button onClick={() => {
            // כשסוגרים את ה-POP UP, מאפסים את כל ה-states כולל אישור תנאי השימוש
            // כך שבעסקה הבאה התיבה תופיע שוב
            setIsComplete(false);
            setOrderSaved(false);
            setOrderId(null);
            setAgreedToTerms(false); // מאפסים את אישור תנאי השימוש כדי שבעסקה הבאה התיבה תופיע שוב
            onClose();
          }} className="w-full bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-3 rounded-lg font-semibold transition-colors">סגור</button>
        </motion.div>
      </div>
    );
  }

  // אם המודל לא פתוח, לא מציגים כלום
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="absolute inset-0 bg-black/50" onClick={step === 1 ? onClose : undefined}></div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 my-8">
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-lg z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">תשלום מאובטח</h2>
            <div className="flex items-center gap-4">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="text-[#40E0D0] hover:text-[#30D5C8] flex items-center gap-2">
                  <ChevronRight className="w-5 h-5" /> חזרה
                </button>
              ) : (
                <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5" /> חזרה
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="סגור">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#40E0D0]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#40E0D0] text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">פרטי משלוח</span>
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-[#40E0D0]' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#40E0D0]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#40E0D0] text-white' : 'bg-gray-200'}`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium">תשלום</span>
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-[#40E0D0]' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#40E0D0]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#40E0D0] text-white' : 'bg-gray-200'}`}>3</div>
              <span className="text-sm font-medium">סיכום</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          {step === 1 && (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6" /> פרטי משלוח
              </h3>

              <div className="bg-blue-50 border-r-4 border-blue-400 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-semibold text-sm mb-1">זמן אספקה</p>
                    <p className="text-blue-700 text-sm">
                      זמן האספקה הוא בין 5 ל-14 ימי עסקים ממועד ביצוע ההזמנה והעברת התשלום.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
                  <input 
                    type="text" 
                    required 
                    value={shippingData.fullName} 
                    onChange={(e) => {
                      setShippingData({ ...shippingData, fullName: e.target.value });
                      if (validationErrors.fullName) {
                        setValidationErrors({ ...validationErrors, fullName: '' });
                      }
                    }}
                    className={`w-full border rounded-lg px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                      validationErrors.fullName 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gold focus:ring-2 focus:ring-gold/20'
                    }`} 
                    placeholder="הזן שם מלא" 
                  />
                  {validationErrors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                  <input type="email" value={shippingData.email} onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors" placeholder="הזן אימייל" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">טלפון *</label>
                  <input 
                    type="tel" 
                    required 
                    value={shippingData.phone} 
                    onChange={(e) => {
                      setShippingData({ ...shippingData, phone: e.target.value });
                      if (validationErrors.phone) {
                        setValidationErrors({ ...validationErrors, phone: '' });
                      }
                    }}
                    className={`w-full border rounded-lg px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                      validationErrors.phone 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gold focus:ring-2 focus:ring-gold/20'
                    }`} 
                    placeholder="הזן מספר טלפון" 
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>
                <div className="relative" ref={cityInputRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">עיר *</label>
                  <input 
                    type="text" 
                    required 
                    value={shippingData.city} 
                    onChange={(e) => {
                      handleCityInputChange(e);
                      if (validationErrors.city) {
                        setValidationErrors({ ...validationErrors, city: '' });
                      }
                    }}
                    onFocus={() => {
                      if (shippingData.city.length > 0 && citySuggestions.length > 0) {
                        setShowCitySuggestions(true);
                      }
                    }}
                    className={`w-full border rounded-lg px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                      validationErrors.city 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gold focus:ring-2 focus:ring-gold/20'
                    }`} 
                    placeholder="הזן עיר" 
                    autoComplete="off"
                  />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {citySuggestions.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleCitySelect(city)}
                          className="w-full text-right px-4 py-2 hover:bg-[#40E0D0] hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                  {validationErrors.city && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">כתובת משלוח *</label>
                <input 
                  type="text" 
                  required 
                  value={shippingData.address} 
                  onChange={(e) => {
                    setShippingData({ ...shippingData, address: e.target.value });
                    if (validationErrors.address) {
                      setValidationErrors({ ...validationErrors, address: '' });
                    }
                  }}
                  className={`w-full border rounded-lg px-4 py-3 text-gray-900 focus:outline-none transition-colors ${
                    validationErrors.address 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-gold focus:ring-2 focus:ring-gold/20'
                  }`} 
                  placeholder="הזן כתובת מלאה" 
                />
                {validationErrors.address && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מיקוד</label>
                  <input type="text" value={shippingData.postalCode} onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors" placeholder="הזן מיקוד" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">הערות למשלוח</label>
                <textarea rows={3} value={shippingData.notes} onChange={(e) => setShippingData({ ...shippingData, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors resize-none" placeholder="הערות נוספות (אופציונלי)" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors">ביטול</button>
                <button type="submit" className="flex-1 bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-3 rounded-lg font-semibold transition-colors">המשך לתשלום</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Phone className="w-6 h-6" /> תשלום בביט
              </h3>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Phone className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-green-800 font-semibold mb-2">תשלום בביט</p>
                    <p className="text-green-700 text-sm">אחרי שתסיים את ההזמנה, תוכל לשלם בביט דרך וואטסאפ. נשלח לך הודעה עם פרטי התשלום.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors">חזרה</button>
                <button type="submit" className="flex-1 bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-3 rounded-lg font-semibold transition-colors">המשך לסיכום</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4" style={{ scrollbarWidth: 'thin' }}>
              <h3 className="text-xl font-bold text-gray-900 mb-6">סיכום הזמנה</h3>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">מוצרים בסל ({cartToUse.length})</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {cartToUse.map(item => (
                    <div key={item.id} className="flex items-center justify-between pb-3 border-b border-gray-300 last:border-0 last:pb-0 bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center relative border border-gray-200">
                          {item.imageUrl ? (
                            <>
                              <img 
                                src={
                                  item.imageUrl.startsWith('http') 
                                    ? item.imageUrl 
                                    : item.imageUrl.startsWith('/') 
                                      ? getApiUrl(item.imageUrl)
                                      : getApiUrl(`/${item.imageUrl}`)
                                } 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Hide image and show fallback
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextElementSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="text-2xl hidden absolute inset-0 items-center justify-center bg-gray-100">{item.image || '🕯️'}</div>
                            </>
                          ) : (
                            <div className="text-3xl">{item.image || (item.isGiftCard ? '🎁' : '🕯️')}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 mb-1 text-base">{item.name}</p>
                          <p className="text-sm text-gray-600">כמות: {item.quantity} × ₪{Number(item.price).toFixed(2)}</p>
                          {item.isGiftCard && item.giftCardEmail && (
                            <p className="text-xs text-gray-500 mt-1">אימייל: {item.giftCardEmail}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-gray-900 text-lg">₪{(Number(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">פרטי משלוח</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">שם:</span> {shippingData.fullName}</p>
                  <p><span className="font-semibold">טלפון:</span> {shippingData.phone}</p>
                  <p><span className="font-semibold">כתובת:</span> {shippingData.address}, {shippingData.city}</p>
                  {shippingData.postalCode && <p><span className="font-semibold">מיקוד:</span> {shippingData.postalCode}</p>}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <GiftCardApply
                  orderTotal={cartTotal + shippingFee}
                  onApply={applyGiftCard}
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <PromoGiftApply
                  orderTotal={cartTotal + shippingFee - giftCardAmount}
                  onApply={applyPromoCode}
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>סה"כ מוצרים</span>
                    <span>₪{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>משלוח</span>
                    <span>{shippingFee === 0 ? <span className="text-green-600">חינם</span> : `₪${shippingFee.toFixed(2)}`}</span>
                  </div>
                  {giftCardAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Gift Card</span>
                      <span>-₪{giftCardAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {promoAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>קוד מבצע</span>
                      <span>-₪{promoAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {shippingFee === 0 && cartTotal >= 300 && <p className="text-sm text-green-600">✓ משלוח חינם מעל ₪300</p>}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>סה"כ לתשלום</span>
                    <span>₪{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">{saveError}</p>
                </div>
              )}
              </div>

              {/* Checkbox אישור תנאי שימוש ומדיניות פרטיות - מחוץ ל-overflow, תמיד גלוי בתחתית */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex-shrink-0">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (saveError && e.target.checked) {
                        setSaveError(null);
                      }
                    }}
                    className="mt-1 w-5 h-5 text-[#40E0D0] border-gray-300 rounded focus:ring-[#40E0D0] focus:ring-2 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    קראתי ואני מסכים ל-{' '}
                    <Link to="/terms-of-service" target="_blank" className="underline font-semibold text-[#40E0D0] hover:text-[#30D5C8]" onClick={(e) => e.stopPropagation()}>
                      תנאי שימוש
                    </Link>
                    {' '}ול-{' '}
                    <Link to="/terms-of-service" target="_blank" className="underline font-semibold text-[#40E0D0] hover:text-[#30D5C8]" onClick={(e) => e.stopPropagation()}>
                      מדיניות פרטיות
                    </Link>
                    {' '}ועיבוד המידע..*
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 flex-shrink-0">
                <button type="button" onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors">חזרה</button>
                <button onClick={handleCompleteOrder} disabled={isProcessing} className="flex-1 bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {isProcessing ? 'מעבד הזמנה...' : 'אשר והזמן'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CartModal({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout, isLoggedIn }) {
  if (!isOpen) return null;

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const isEmpty = cart.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 flex flex-col" style={{ height: '90vh', maxHeight: '90vh' }}>
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">עגלת קניות</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="סגור">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-scroll p-6" style={{ flex: '1 1 auto', minHeight: 0, maxHeight: '100%' }}>
          {isEmpty ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">העגלה שלך ריקה</h3>
              {!isLoggedIn && (
                <p className="text-gray-600 mb-2">
                  יש לך חשבון?
                  <a href="#" className="underline font-medium hover:text-gray-900"> התחבר</a> כדי להזמין מהר יותר.
                </p>
              )}
              <button onClick={onClose} className="mt-6 w-full bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                המשך לקניות
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl.startsWith('http') ? item.imageUrl : getApiUrl(item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`)}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full ${item.color || 'bg-gray-300'}`}></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    {item.scent && <p className="text-gray-600 text-sm">{item.scent}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100" aria-label="הפחת כמות">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100" aria-label="הוסף כמות">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700" aria-label="הסר פריט">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">₪{(Number(item.price) * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">₪{Number(item.price).toFixed(2)} ליחידה</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="border-t p-6 bg-white flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700 font-semibold">סה"כ</span>
              <span className="text-2xl font-bold text-gray-900">₪{cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => { onClose(); onCheckout?.(); }}
              className="w-full bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              המשך לתשלום
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}


function AccessibilityWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState({
    fontSize: 100,
    highlightLinks: false,
    highlightHeadings: false,
    invertColors: false,
    highContrast: false,
    sepia: false,
    monochrome: false,
    screenZoom: 100,
    blackYellow: false,
    readingMode: false,
    fixedDescription: false,
    showDescription: false,
    disableBlinks: false,
    keyboardNav: false,
    blackCursor: false,
    largeCursor: false,
  });

  const toggleSetting = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const applyStyles = () => {
    const root = document.documentElement;
    const body = document.body;
    root.style.fontSize = settings.fontSize !== 100 ? `${settings.fontSize}%` : '';
    // zoom לא תקני בכל הדפדפנים, אך שימושי לדמו
    root.style.zoom = settings.screenZoom !== 100 ? `${settings.screenZoom}%` : '';

    body.classList.toggle('highlight-links', !!settings.highlightLinks);
    body.classList.toggle('highlight-headings', !!settings.highlightHeadings);
    body.classList.toggle('fixed-descriptions', !!settings.fixedDescription);
    body.classList.toggle('show-descriptions', !!settings.showDescription);
    body.classList.toggle('disable-blinks', !!settings.disableBlinks);
    body.classList.toggle('keyboard-navigation', !!settings.keyboardNav);
    body.classList.toggle('black-cursor', !!settings.blackCursor);
    body.classList.toggle('large-cursor', !!settings.largeCursor);

    const filters = [];
    if (settings.invertColors) filters.push('invert(1)');
    else if (settings.highContrast) filters.push('contrast(1.5)');
    else if (settings.blackYellow) filters.push('contrast(2) brightness(1.5)');
    else if (settings.sepia) filters.push('sepia(1)');
    else if (settings.monochrome) filters.push('grayscale(1)');
    body.style.filter = filters.join(' ');
  };

  React.useEffect(() => { applyStyles(); }, [settings]);

  const accessButtons = [
    { icon: Minimize2, label: 'הקטנת מסך', action: () => setSettings(s => ({ ...s, screenZoom: Math.max(50, s.screenZoom - 10) })) },
    { icon: Maximize2, label: 'הגדלת מסך', action: () => setSettings(s => ({ ...s, screenZoom: Math.min(150, s.screenZoom + 10) })) },
    { icon: Type, label: 'הקטנת גופן', action: () => setSettings(s => ({ ...s, fontSize: Math.max(80, s.fontSize - 10) })) },
    { icon: Type, label: 'הגדלת גופן', action: () => setSettings(s => ({ ...s, fontSize: Math.min(150, s.fontSize + 10) })) },
    { icon: Type, label: 'גופן קריא', action: () => setSettings(s => ({ ...s, fontSize: 100 })) },
    { icon: ImageIcon, label: 'תיאור קבוע', action: () => toggleSetting('fixedDescription') },
    { icon: ImageIcon, label: 'הצגת תיאור', action: () => toggleSetting('showDescription') },
    { icon: Eye, label: 'הדגשת קישורים', action: () => toggleSetting('highlightLinks') },
    { icon: Hash, label: 'הדגשת כותרות', action: () => toggleSetting('highlightHeadings') },
    { icon: Palette, label: 'היפוך צבעים', action: () => toggleSetting('invertColors') },
    { icon: Contrast, label: 'שחור צהוב', action: () => toggleSetting('blackYellow') },
    { icon: Contrast, label: 'ניגודיות גבוהה', action: () => toggleSetting('highContrast') },
    { icon: Filter, label: 'ספיה', action: () => toggleSetting('sepia') },
    { icon: Filter, label: 'מונוכרום', action: () => toggleSetting('monochrome') },
    { icon: Hand, label: 'ביטול הבהובים', action: () => toggleSetting('disableBlinks') },
    { icon: Keyboard, label: 'ניווט מקלדת', action: () => toggleSetting('keyboardNav') },
    { icon: Wand2, label: 'סמן שחור', action: () => toggleSetting('blackCursor') },
    { icon: Wand2, label: 'סמן גדול', action: () => toggleSetting('largeCursor') },
    { icon: Headphones, label: 'מצב קריאה', action: () => toggleSetting('readingMode') },
  ];

  const WheelchairIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="4" r="2" />
      <path d="M20 20h-6l-2-6h-4" />
      <circle cx="8" cy="16" r="2" />
      <circle cx="18" cy="20" r="2" />
    </svg>
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-xl transition-colors"
        aria-label="פתח הגדרות נגישות"
      >
        <WheelchairIcon className="w-8 h-8 text-white" />
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t-4 border-blue-600">
        <div className="bg-blue-600 text-white p-4 flex items-center gap-4">
          <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80 bg-white/20 px-2 py-1 rounded">ESC</button>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <WheelchairIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 bg-blue-700/50 px-4 py-2 rounded text-sm">ניתן לנווט בין כפתורים עם חצי המקלדת</div>
        </div>

        <div className="bg-gray-100 overflow-x-auto">
          <div className="flex gap-2 p-4 min-w-max">
            {accessButtons.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-blue-50 border border-gray-300 rounded-lg transition-all hover:border-blue-400 hover:shadow-md flex-shrink-0 w-24"
              >
                <btn.icon className="w-6 h-6 text-gray-800" />
                <span className="text-xs font-medium text-gray-800 text-center leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-yellow-50 border-t-2 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-base text-yellow-900 leading-relaxed">
              אזהרה! הרחק מהישג ידם של ילדים וחיות מחמד. אל תשאיר נרות דולקים או פניני שעווה ללא השגחה בקרבת חפצים דליקים. אל תזיז את הנר בעת בעירה או כשהוא חם.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-100 border-t-2 border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">מופעל על ידי</span>
            <span className="text-sm font-bold text-blue-600">LUXCERA ACCESSIBILITY</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-200 rounded transition" aria-label="דיווח בעיה">
              <Flag className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded transition" aria-label="יצירת קשר">
              <Mail className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setSettings({
                fontSize: 100, highlightLinks: false, highlightHeadings: false, invertColors: false, highContrast: false,
                sepia: false, monochrome: false, screenZoom: 100, blackYellow: false, readingMode: false, fixedDescription: false,
                showDescription: false, disableBlinks: false, keyboardNav: false, blackCursor: false, largeCursor: false,
              })}
              className="p-2 hover:bg-gray-200 rounded transition"
              aria-label="איפוס הגדרות"
            >
              <RotateCcw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LuxceraLanding() {
  const navigate = useNavigate();
  const { isLoggedIn, login, cart, addToCart, updateCartQuantity, removeFromCart, clearCart, openCart, closeCart, isCartOpen } = useApp();
  // בדיקה אם יש קישור Gift Card ב-URL
  const [giftCardCode, setGiftCardCode] = React.useState(() => {
    // בדיקה ראשונית של ה-URL
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/giftcard\/([^\/]+)$/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  });

  const [cartOpen, setCartOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  
  // סנכרון cartOpen עם isCartOpen מ-AppContext
  React.useEffect(() => {
    setCartOpen(isCartOpen);
  }, [isCartOpen]);
  const [userName, setUserName] = React.useState(''); // שם המשתמש
  const [pendingCartOpen, setPendingCartOpen] = React.useState(false); // האם צריך לפתוח עגלה אחרי התחברות
  const [promoBanner, setPromoBanner] = React.useState(null);
  const [showPromoBanner, setShowPromoBanner] = React.useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = React.useState(false);

  // טעינת מצב התחברות ושם משתמש מ-localStorage
  React.useEffect(() => {
    const savedLoginState = localStorage.getItem('luxcera_isLoggedIn');
    const savedUserName = localStorage.getItem('luxcera_userName');
    
    if (savedLoginState === 'true' && savedUserName) {
      const savedEmail = localStorage.getItem('luxcera_userEmail') || '';
      login({ name: savedUserName, email: savedEmail });
      setUserName(savedUserName);
    }
  }, []);

  // שמירת מצב התחברות ושם משתמש ב-localStorage
  React.useEffect(() => {
    if (isLoggedIn && userName) {
      localStorage.setItem('luxcera_isLoggedIn', 'true');
      localStorage.setItem('luxcera_userName', userName);
    } else {
      localStorage.removeItem('luxcera_isLoggedIn');
      localStorage.removeItem('luxcera_userName');
    }
  }, [isLoggedIn, userName]);

  // שמירת עגלה ב-localStorage בכל פעם שהעגלה משתנה (רק למשתמשים לא מחוברים)
  React.useEffect(() => {
    if (!isLoggedIn) {
      try {
        if (cart.length > 0) {
          localStorage.setItem('luxcera_cart', JSON.stringify(cart));
        } else {
          localStorage.removeItem('luxcera_cart');
        }
      } catch (e) {
        console.error('Error saving cart to localStorage:', e);
      }
    }
  }, [cart, isLoggedIn]);

  const handleCartClick = () => {
    if (!isLoggedIn) {
      // אם המשתמש לא מחובר - פותחים את מודאל ההתחברות
      setPendingCartOpen(true); // מסמן שצריך לפתוח עגלה אחרי התחברות
      setAccountOpen(true);
    } else {
      // אם המשתמש מחובר - פותחים את העגלה דרך AppContext
      openCart();
    }
  };
  const handleCloseCart = () => {
    setCartOpen(false);
    closeCart();
  };
  const handleAccountClick = () => setAccountOpen(true);
  const handleCloseAccount = () => {
    setAccountOpen(false);
    // אם המשתמש התחבר ואמור לפתוח עגלה - פותחים אותה
    if (isLoggedIn && pendingCartOpen) {
      setPendingCartOpen(false);
      setCartOpen(true);
    }
  };
  const handleSearchClick = () => setSearchOpen(true);
  const handleCloseSearch = () => setSearchOpen(false);
  const handleCheckout = () => setCheckoutOpen(true);
  const handleCloseCheckout = () => setCheckoutOpen(false);

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) { 
      handleRemoveItem(id); 
      return; 
    }
    updateCartQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id) => removeFromCart(id);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = async (product) => {
    // בדיקה אם המשתמש מחובר
    if (!isLoggedIn) {
      // אם המשתמש לא מחובר - פתיחת מודאל ההרשמה עם הודעה
      setPendingCartOpen(true); // מסמן שצריך לפתוח עגלה אחרי התחברות
      setAccountOpen(true);
      return;
    }
    
    // שימוש ב-addToCart מ-AppContext
    await addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      originalPrice: product.price,
      salePrice: product.salePrice || null,
      quantity: 1,
      inStock: product.inStock !== false,
      color: product.color || null,
      image: product.image || null,
      imageUrl: product.imageUrl || null,
      category: product.category || null,
      description: product.description || null,
    });
  };

  // Load products from API
  const [allProducts, setAllProducts] = React.useState([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);

  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await fetch(getApiUrl('/api/public/products'));
        if (response.ok) {
          const data = await response.json();
          // Transform API data to match component structure
          const transformed = (data.products || []).map(product => ({
            id: product.id,
            name: product.title,
            price: product.salePrice || product.price, // The active price for cart (salePrice if exists, otherwise price)
            originalPrice: product.price, // Always the original price (will be crossed out if salePrice exists)
            salePrice: product.salePrice || null, // Sale price if exists (will be displayed in red)
            inStock: product.isActive === 1 || product.isActive === true,
            color: product.color || 'bg-white',
            image: product.imageUrl || '🕯️',
            imageUrl: product.imageUrl,
            isNew: product.isNew === 1 || product.isNew === true, // Keep original for display
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

  // Load active promotional banner - מופיע בכל רענון
  React.useEffect(() => {
    // מאפסים את המצב לפני טעינה
    setShowPromoBanner(false);
    setPromoBanner(null);
    
    const loadBanner = async () => {
      try {
        const response = await fetch(getApiUrl('/api/public/banners/active'));
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.banner) {
            // תמיד מציגים את הבאנר הפעיל בכל רענון
            console.log('Banner loaded:', data.banner);
            setPromoBanner(data.banner);
            setShowPromoBanner(true);
          } else {
            console.log('No active banner found');
          }
        } else {
          console.error('Failed to load banner:', response.status);
        }
      } catch (error) {
        console.error('Error loading banner:', error);
      }
    };
    
    // עיכוב קטן כדי לוודא שהדף נטען
    const timer = setTimeout(() => {
      loadBanner();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCloseBanner = () => {
    // סוגרים את הבאנר - יופיע שוב ברענון הבא
    setShowPromoBanner(false);
  };

  // Group products by category
  const sets = allProducts.filter(p => p.category === 'sets' || p.category === 'מארזים' || p.category === 'general');
  const fireplace = allProducts.filter(p => p.category === 'fireplace' || p.category === 'אח');
  const waxPearls = allProducts.filter(p => p.category === 'pearls' || p.category === 'פנינים');
  const accessories = allProducts.filter(p => p.category === 'accessories' || p.category === 'אביזרים');

  // אם יש Gift Card code, הצג את הדף שלו
  if (giftCardCode) {
    return (
      <GiftCardView 
        code={giftCardCode} 
        onBack={() => {
          setGiftCardCode(null);
          window.history.pushState({}, '', '/');
        }} 
      />
    );
  }

  return (
    <div dir="rtl" className="min-h-screen relative">
      {/* רקע שקוף עם תמונת נר - בדף הראשי */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${candleBg1})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.75,
          filter: 'blur(10px) grayscale(0%)',
          mixBlendMode: 'multiply'
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        <PromoBanner />
        <Nav onCartClick={handleCartClick} onUserClick={handleAccountClick} onSearchClick={handleSearchClick} cartCount={cartCount} isLoggedIn={isLoggedIn} userName={userName} />
        <SearchModal isOpen={searchOpen} onClose={handleCloseSearch} products={allProducts} onAddToCart={handleAddToCart} />
      <AccountModal 
        isOpen={accountOpen} 
        onClose={handleCloseAccount} 
        showCartMessage={pendingCartOpen}
        onLoginSuccess={(name) => {
          setUserName(name);
        }}
      />
      <CartModal isOpen={cartOpen} onClose={handleCloseCart} cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} onCheckout={handleCheckout} isLoggedIn={isLoggedIn} />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={handleCloseCheckout}
        cart={cart}
        onOrderComplete={async (orderData) => {
          // מרוקנים את הסל רק אחרי שההזמנה הושלמה בהצלחה
          if (orderData && orderData.orderId) {
            // שימוש ב-clearCart מה-AppContext כדי לנקות גם מהשרת (אם המשתמש מחובר)
            await clearCart();
            console.log('[LuxceraLanding] Cart cleared after order completion');
          }
          console.log('Order completed:', orderData);
        }}
      />
      <Hero />

      <CategoryShowcase 
        sets={sets} 
        waxPearls={waxPearls} 
        accessories={accessories} 
        id="קטגוריות"
      />

      <Gallery />
      <Section id="gift-card" className="py-16">
        <div className="text-center mb-8">
          <h2 
            className="text-4xl font-bold mb-4"
            style={{
              color: '#D4AF37',
              fontFamily: 'serif',
              textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3), 6px 6px 10px rgba(0, 0, 0, 0.2), 0 0 20px rgba(212, 175, 55, 0.5)',
              letterSpacing: '0.05em'
            }}
          >
            לרכישת כרטיס קוד קופון/GIFT CARD
          </h2>
        </div>
        <GiftCardEntryButton />
      </Section>
      <About />
      <LoyaltyClubSection onAccountClick={handleAccountClick} />
      
      {/* מודל הוראות שימוש ואזהרה */}
      {safetyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSafetyModalOpen(false)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-gradient-to-b from-black via-black to-black/95 rounded-2xl shadow-2xl border-2 border-gold/30 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gold/30 bg-black/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-gold" />
                <h2 
                  className="text-2xl md:text-3xl font-bold text-gold"
                  style={{ fontFamily: 'serif' }}
                >
                  הוראות שימוש ואזהרה לנרות
                </h2>
              </div>
              <button 
                onClick={() => setSafetyModalOpen(false)}
                className="text-gold/70 hover:text-gold transition-colors p-2 hover:bg-gold/10 rounded-lg"
                aria-label="סגור"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="space-y-6 text-gold/90 leading-relaxed">
                <div className="bg-gold/10 rounded-lg p-6 border-r-4 border-gold">
                  <p className="text-lg font-semibold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                    לקוח/ה יקר/ה
                  </p>
                  <p className="text-base md:text-lg">
                    תודה שרכשתם מוצר מבית LUXCERA, חשוב מאוד שתקדישו מספר דקות לקרוא את הוראות השימוש והאזהרה לטובת בטיחות והנאה מרבית מהנרות והמוצרים שלנו.
                  </p>
                  <p className="text-base md:text-lg mt-4">
                    אנו גאים מאוד במוצרים שאנחנו משווקים ומקפידים שיהיו על בסיס מרכיבים וחומרים איכותיים ביותר.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gold mt-8 mb-4" style={{ fontFamily: 'serif' }}>
                    הוראות בטיחות בסיסיות:
                  </h3>
                  
                  <ul className="space-y-3 text-base md:text-lg">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>הסירו את כל מרכיבי האריזה לפני ההדלקה.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>יש להדליק נרות הנמצאים בטווח ראייה כל הזמן ועל משטח ישר ועמיד לחום.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>הרחיקו את הנרות מילדים, חיות מחמד וחפצים דליקים.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span><strong className="text-gold">לעולם אל תשאיר נר דולק ללא השגחה.</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>הימנעו מהדלקת נרות בסביבה עם רוח.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>אין לגעת בזכוכית חמה על נר דולק או מתקרר.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>אסור להזיז נר דולק או נר שהשעווה שלו עדיין נוזלית אחרי כיבוי.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>יש לשמור על בריכת השעווה נקייה מפסולת מגזימות פתילות עץ או פתיל בד.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>יש לשרוף נרות תמיד בחדר מאוורר היטב.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>אסור לכבות נרות במים. אם מופיע עישון, יש לכבות את הנר, לחתוך את הפתילה ולהדליק שוב.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>יש לטפל בצנצנת הזכוכית בזהירות.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>אם הצנצנת שבורה, סדוקה או סדוקה, יש להפסיק את השימוש.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-6 mt-8">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xl font-bold text-red-300 mb-2">
                        חשוב מאוד !!!
                      </p>
                      <p className="text-base md:text-lg text-red-200">
                        להפסיק את השימוש בנר כשנותר רק 1.5 ס"מ של שעווה מהתחתית. שריפה מעבר לנקודה זו עלולה להוות סכנת שריפה !!!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <h3 className="text-xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                    טיפים להדלקה נכונה:
                  </h3>
                  
                  <ul className="space-y-3 text-base md:text-lg">
                    <li className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>בעת הדלקת הנר המתינו שהשעווה הנמסה תגיע לקצה הזכוכית לפני הכיבוי כדי למנוע מנהור של השעווה, זה עשוי לקחת לפחות 2-4 שעות לפי גודל וסוג הנר.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>אם מתרחשת תופעה של עשן מהנר, בדקו אם יש רוח בסביבת הנר או שהוא מממוקם באזור עם תנועה רבה, העלולים לגרום ללהבה להבהב ולעשן.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>כמו כן, ודאו שהפתילה גזומה לאורך המצוין בתווית התחתית של הנר. אם היא ארוכה יותר, כבו, גזמו את הפתילה והדליקו אותה שוב.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                      <span>למדו את כל בני המשפחה את כללי השימוש הבטוח בנרות.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gold/10 rounded-lg p-6 border-r-4 border-gold mt-8">
                  <p className="text-base md:text-lg">
                    כדי להבטיח שתפיקו את ההנאה המרבית מהנרות שלכם, חשוב לפעול לפי הנחיות הבטיחות והטיפול הסטנדרטיות בנרות. חברת וויטסנט אינה אחראית לשימוש בנרות בצורה שאינה נכונה.
                  </p>
                  <p className="text-base md:text-lg mt-4">
                    כל נר כולל הוראות בטיחות בתווית התחתונה עם ציורים נוספים להמחשה.
                  </p>
                </div>

                <div className="space-y-4 mt-8">
                  <h3 className="text-xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                    הוראות אחסון נרות:
                  </h3>
                  
                  <div className="space-y-3 text-base md:text-lg">
                    <p>
                      שעוות הנרות שאנו משתמשים בהם בנרות שלנו רגישים הן לטמפרטורה והן לאור, לכן אנא היזהרו בעת אחסון נרות למשך זמן ממושך. אם אתם מאחסנים את הנר שלכם, ודאו שהוא נמצא במקום קריר ויבש הרחק מאור שמש ישיר או אור חזק. שמירה במקום חשוך כמו ארון או קופסה תגן עליו מפני דהייה ושינוי צבע.
                    </p>
                    <p>
                      מכיוון שהנרות שלנו יכולים להיות רגישים לקור וחום קיצוניים, עדיף לאחסן אותם בין 10 ל-27 מעלות צלזיוס. הקפידו לא להשאיר את הנרות שלנו במכונית למשך זמן ממושך (במיוחד בימים חמים) מכיוון שהם עלולים להימס או לדהות את צבעם. קור קיצוני עלול לגרום לסדקים והפרדה. לאחר חשיפה ממושכת לטמפרטורות קרות, יש לאפשר לנר לחזור לטמפרטורת החדר למשך שעתיים לפחות לפני פתיחת האריזה או שריפתו.
                    </p>
                  </div>
                </div>

                <div className="text-center mt-10 pt-8 border-t border-gold/30">
                  <p className="text-xl font-bold text-gold" style={{ fontFamily: 'serif' }}>
                    תודה רבה על הקריאה עכשיו הזמן להנות מהנרות שלנו.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      <Footer onSafetyClick={() => setSafetyModalOpen(true)} />
      <AccessibilityWidget />
      </div>
      
      {/* Promotional Banner Modal */}
      {showPromoBanner && promoBanner && (
        <PromoBannerModal banner={promoBanner} onClose={handleCloseBanner} />
      )}
    </div>
  );
}
