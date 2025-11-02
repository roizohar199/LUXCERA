import React from 'react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { Search, User, ShoppingBag, Phone, Mail, Instagram, Facebook, Menu, X, Trash2, Plus, Minus, Package, Settings, Heart, ChevronLeft, ChevronRight, Maximize2, Minimize2, Type, Eye, Link as LinkIcon, Hash, Palette, Contrast, Filter, Keyboard, Volume2, RotateCcw, AlertTriangle, Flag, Shield, Info, HelpCircle, Wand2, Image as ImageIcon, Hand, Headphones, ArrowRight } from 'lucide-react';

function PromoBanner() {
  const items = Array(6).fill(null);
  
  // יצירת עותק כפול לאנימציה רציפה חלקה
  const duplicatedItems = [...items, ...items];
  
  return (
    <div className="relative overflow-hidden bg-[#D4C5B3] border-t border-b border-[#C4B5A3] py-3">
      <div className="flex animate-scroll whitespace-nowrap">
        {duplicatedItems.map((_, i) => (
          <div key={i} className="inline-flex items-center gap-3 mx-8">
            <span className="text-[#A6896D] font-medium text-lg">
              משלוח חינם מעל ₪300
            </span>
            <Heart className="w-5 h-5 text-[#A6896D]" fill="currentColor" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Nav({ onCartClick, onUserClick, cartCount }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const links = [{ name: 'בית', href: '#בית' }, { name: 'קטלוג', href: '#גלריה' }, { name: 'יצירת קשר', href: '#הזמנה' }];
  
  return (
    <nav className="sticky top-0 w-full z-50 bg-black shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* לוגו */}
        <div className="text-xl font-semibold text-white">
          LUXCERA
        </div>
        
        {/* ניווט דסקטופ */}
        <div className="hidden md:flex gap-6 text-white/80 text-sm">
          {links.map(link => (
            <a key={link.name} href={link.href} className="hover:text-white transition">
              {link.name}
            </a>
          ))}
        </div>
        
        {/* אייקונים */}
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-white cursor-pointer hover:opacity-70 transition" />
          <button onClick={onUserClick} className="text-white hover:opacity-70 transition">
            <User className="w-5 h-5" />
          </button>
          <button 
            onClick={onCartClick}
            className="relative text-white hover:opacity-70 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          {/* תפריט מובייל */}
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* תפריט מובייל */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/10">
          <div className="px-4 py-3 space-y-2">
            {links.map(link => (
              <a key={link.name} href={link.href} className="block text-white hover:bg-white/10 p-2" onClick={() => setMobileMenuOpen(false)}>
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </section>
  );
}

function Hero() {
  return (
    <Section id="בית" className="pt-20">
      {/* רקע Hero */}
      <div className="relative h-[600px] rounded-none overflow-hidden bg-gradient-to-b from-[#f5e6d3] to-[#e8d5c4]">
        {/* תמונת רקע - נרות בוקה צפים */}
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1608075702949-9077fcc29419?w=2000&auto=format&fit=crop&q=80)',
          filter: 'blur(2px) brightness(0.9)'
        }}>
        </div>
        
        {/* אפקט אורות צפים עם CSS */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-32 h-32 bg-yellow-200/40 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
          <div className="absolute w-40 h-40 bg-orange-200/30 rounded-full blur-3xl top-40 right-20 animate-pulse delay-150"></div>
          <div className="absolute w-28 h-28 bg-yellow-100/50 rounded-full blur-3xl bottom-32 left-1/3 animate-pulse delay-300"></div>
          <div className="absolute w-36 h-36 bg-amber-200/30 rounded-full blur-3xl bottom-20 right-1/4 animate-pulse delay-500"></div>
          <div className="absolute w-24 h-24 bg-yellow-300/40 rounded-full blur-3xl top-1/3 left-1/2 animate-pulse delay-700"></div>
        </div>
        
        {/* שכבת Gradient לתוכן קריא */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40"></div>
        
        {/* תוכן על פני התמונה */}
        <div className="relative h-full flex items-center justify-center px-8 lg:px-16 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-center"
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-gray-900 mb-6 leading-tight tracking-tight" style={{
              fontFamily: 'serif'
            }}>
              LUXCERA
            </h1>
            <p className="text-2xl sm:text-3xl text-gray-800 font-light tracking-wide mb-8" style={{
              fontFamily: 'serif'
            }}>
              The Art of Light
            </p>
            <p className="text-lg text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
              נרות שעווה יוקרתיים בעבודת יד, עם ריחות מרגיעים וצבעים מותאמים אישית
            </p>
            <motion.a
              href="#הזמנה"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-[#4A6741] hover:bg-[#5a7a51] text-white px-10 py-4 rounded-lg font-semibold transition-colors shadow-xl text-lg"
            >
              הזמן עכשיו
            </motion.a>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

function ProductsCarousel({ onAddToCart, title, products, carouselKey }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const nextSlide = () => {
    const maxIndex = Math.max(0, products.length - 4);
    setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  const prevSlide = () => {
    const maxIndex = Math.max(0, products.length - 4);
    setCurrentIndex((prev) => (prev - 1 + (maxIndex + 1)) % (maxIndex + 1));
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + 4);
  const hasNavigation = products.length > 4;

  return (
    <Section className="py-16">
      <div className="mb-12">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-5xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
            {title}
          </h2>
        </div>
        {title === 'מארזים' && (
          <p className="text-gray-600 text-sm max-w-2xl">
            חשוב לנו לציין שחלק מהמוצרים שלנו נעשים בעבודת יד ולכן ייתכנו שינויים קלים בצורות ובגוונים.
          </p>
        )}
      </div>
      
      {/* קרוסלת מוצרים */}
      <div className="relative">
        {/* כפתורי ניווט */}
        {hasNavigation && (
          <>
            <button
              onClick={prevSlide}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* מוצרים */}
        <div className="flex gap-6 overflow-hidden">
          {visibleProducts.map(product => (
            <motion.div
              key={product.id}
              whileHover={{ y: -8 }}
              className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer group"
            >
              {/* תמונה */}
              <div className={`aspect-square ${product.color} flex items-center justify-center p-8 relative overflow-hidden`}>
                <div className="text-8xl transform group-hover:scale-110 transition-transform">
                  {product.image}
                </div>
                {/* קו זהב תחתון */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
              </div>
              
              {/* פרטי מוצר */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg" style={{ fontFamily: 'serif' }}>
                  {product.name}
                </h3>
                <p className="text-gray-700 text-xl font-semibold mb-4">₪ {product.price.toFixed(2)}</p>
                
                {/* כפתור */}
                <button
                  onClick={() => product.inStock && onAddToCart(product)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    product.inStock 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                  disabled={!product.inStock}
                >
                  {product.inStock ? 'הוספה לסל' : 'אזל מהמלאי'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Gallery() {
  return (
    <Section id="גלריה" className="py-20 bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">אודות LUXCERA</h2>
        <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
          ב-LUXCERA אנו יוצרים נרות שעווה יוקרתיים בעבודת יד, עם דגש על איכות, יופי וריחות מרגיעים.
          כל נר נבנה בקפידה ומתוך אהבה למלאכה.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: '💎', title: 'איכות גבוהה', desc: 'שעווה איכותית וארומה מתמשכת' },
          { icon: '🎨', title: 'מותאם אישית', desc: 'צבעים וריחות לפי הזמנה' },
          { icon: '✨', title: 'בעבודת יד', desc: 'יצירה קפדנית ואומנותית' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h3>
            <p className="text-gray-600 text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function OrderForm() {
  const [model, setModel] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    category: "נרות",
    color: "",
    scent: "",
    qty: 1,
    message: ""
  });
  const [status, setStatus] = React.useState({ sending: false, ok: null, error: "" });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ sending: true, ok: null, error: "" });
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
      });
      const j = await r.json();
      if (j.ok) setStatus({ sending: false, ok: true, error: "" });
      else setStatus({ sending: false, ok: false, error: j.error || 'שגיאה' });
    } catch (err) {
      setStatus({ sending: false, ok: false, error: 'שגיאת רשת' });
    }
  };

  return (
    <Section id="הזמנה" className="py-20 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">יצירת קשר</h2>
        
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4A6741] transition-colors"
                placeholder="שם מלא *" 
                required
                value={model.fullName} 
                onChange={e => setModel({ ...model, fullName: e.target.value })} 
              />
            </div>
            <div>
              <input 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4A6741] transition-colors"
                type="email"
                placeholder="אימייל"
                value={model.email} 
                onChange={e => setModel({ ...model, email: e.target.value })} 
              />
            </div>
          </div>

          <input 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4A6741] transition-colors"
            type="tel"
            placeholder="טלפון"
            value={model.phone} 
            onChange={e => setModel({ ...model, phone: e.target.value })} 
          />

          <div className="grid grid-cols-2 gap-4">
            <select 
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4A6741] transition-colors"
              value={model.category} 
              onChange={e => setModel({ ...model, category: e.target.value })}
            >
              <option>נרות</option>
              <option>גבס</option>
              <option>חרסינה</option>
              <option>אפוקסי</option>
            </select>
            <input 
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4A6741] transition-colors"
              placeholder="צבע" 
              value={model.color} 
              onChange={e => setModel({ ...model, color: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input 
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4A6741] transition-colors"
              placeholder="ריח" 
              value={model.scent} 
              onChange={e => setModel({ ...model, scent: e.target.value })} 
            />
            <input 
              type="number" 
              min={1} 
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4A6741] transition-colors"
              placeholder="כמות" 
              value={model.qty} 
              onChange={e => setModel({ ...model, qty: Number(e.target.value || 1) })} 
            />
          </div>

          <textarea 
            rows={4} 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4A6741] transition-colors resize-none"
            placeholder="הודעה *" 
            required
            value={model.message} 
            onChange={e => setModel({ ...model, message: e.target.value })} 
          />

          <button 
            disabled={status.sending}
            className="w-full bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status.sending ? 'שולח…' : 'שלח הודעה'}
          </button>

          {status.ok && <div className="text-green-600 text-sm text-center">ההודעה נשלחה. נחזור אליך בהקדם 🙏</div>}
          {status.ok === false && <div className="text-red-600 text-sm text-center">שגיאה בשליחה: {status.error}</div>}
        </form>
        
        {/* וואטסאפ */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4 text-sm">או פנו ישירות בוואטסאפ:</p>
          <a
            href={`https://wa.me/972546998603?text=${encodeURIComponent("היי LUXCERA, אשמח להזמנה/התאמה אישית 🙏")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Phone className="w-5 h-5" />
            וואטסאפ LUXCERA
          </a>
        </div>
      </div>
    </Section>
  );
}

function AccountModal({ isOpen, onClose, isLoggedIn, setIsLoggedIn }) {
  const [mode, setMode] = React.useState('login'); // 'login' or 'register'
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const [successType, setSuccessType] = React.useState(''); // 'login' or 'register'

  // Google Login - must be called before any conditional returns
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(res => res.json());
        
        setLoading(true);
        
        // שלח מיילים להרשמה
        try {
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: userInfo.name || 'משתמש',
              email: userInfo.email || ''
            })
          });
          
          if (!response.ok) {
            console.error('Failed to send registration email');
          }
        } catch (emailErr) {
          console.error('Email error:', emailErr);
          // ממשיכים גם אם המייל נכשל
        }

        setFormData({
          fullName: userInfo.name || 'משתמש',
          email: userInfo.email || '',
          password: '',
          confirmPassword: '',
          phone: ''
        });
        setLoading(false);
        setIsLoggedIn(true);
        setSuccessType('register');
        setShowSuccessMessage(true);
        setTimeout(() => {
          onClose();
          setShowSuccessMessage(false);
        }, 2500);
      } catch (err) {
        console.error('Google login error:', err);
        setError('שגיאה בהתחברות עם Google');
      }
    },
    onError: () => {
      setError('שגיאה בהתחברות עם Google');
    }
  });

  // Handlers - must be before any returns
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validation
    if (mode === 'register') {
      if (!formData.fullName || !formData.email || !formData.password) {
        setError('אנא מלא את כל השדות הנדרשים');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('הסיסמאות אינן תואמות');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים');
        setLoading(false);
        return;
      }
    } else {
      if (!formData.email || !formData.password) {
        setError('אנא מלא את כל השדות הנדרשים');
        setLoading(false);
        return;
      }
    }

    try {
      // אם זו הרשמה, שלח מיילים
      if (mode === 'register') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email
          })
        });
        
        if (!response.ok) {
          console.error('Failed to send registration email');
          // ממשיכים גם אם המייל נכשל
        }
      }

      // הצלחה - הצג הודעת הצלחה
      setLoading(false);
      setIsLoggedIn(true);
      setSuccessType(mode);
      setShowSuccessMessage(true);
      setTimeout(() => {
        onClose();
        setShowSuccessMessage(false);
      }, 2500);
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      setError('שגיאה בהרשמה. אנא נסה שוב.');
    }
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'Google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log('Google Client ID:', clientId); // דיבוג
      console.log('Is empty?', !clientId); // דיבוג
      console.log('Is default?', clientId === 'YOUR_GOOGLE_CLIENT_ID' || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE'); // דיבוג
      if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID' || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        console.log('FAILED: Google Login check failed'); // דיבוג
        alert('Google Login אינו מוגדר כרגע. אנא השתמש בטופס הרגיל להרשמה או פנה למנהל המערכת.');
        return;
      }
      console.log('SUCCESS: Calling googleLogin()'); // דיבוג
      googleLogin();
    } else {
      alert(`התחברות עם ${provider} תושק בקרוב!`);
    }
  };

  if (!isOpen) return null;

  if (isLoggedIn) {
    // User is logged in - show account options
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4"
        >
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">אזור אישי</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 bg-[#4A6741] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {formData.fullName ? formData.fullName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{formData.fullName || 'משתמש'}</h3>
                <p className="text-sm text-gray-600">{formData.email || 'email@example.com'}</p>
              </div>
            </div>

            {/* Orders Button */}
            <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-700" />
                <span className="font-semibold text-gray-900">הזמנות שלי</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Profile Button */}
            <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-700" />
                <span className="font-semibold text-gray-900">פרופיל</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Logout Button */}
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mt-4"
            >
              התנתק
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // User is not logged in - show sign in/up
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'התחברות' : 'הרשמה'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button 
              onClick={() => handleSocialLogin('Google')}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors font-semibold text-gray-900"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              המשך עם Google
            </button>

            <button 
              onClick={() => handleSocialLogin('Apple')}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-900 bg-gray-900 text-white rounded-lg p-3 hover:bg-gray-800 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              המשך עם Apple
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4A6741] transition-colors"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4A6741] transition-colors"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4A6741] transition-colors"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4A6741] transition-colors"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#4A6741] transition-colors"
                  placeholder="הזן סיסמה שוב"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'מעבד...' : mode === 'login' ? 'התחבר' : 'הירשם'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-2">
            <p className="text-gray-600">
              {mode === 'login' ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setFormData({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
                }}
                className="underline font-medium text-[#4A6741] hover:text-[#5a7a51] mr-1"
              >
                {mode === 'login' ? 'הרשם כאן' : 'התחבר כאן'}
              </button>
            </p>
          </div>
        </div>

        {/* Success Message Overlay */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-green-50 border-2 border-green-500 rounded-lg flex flex-col items-center justify-center p-8"
          >
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
                ? 'שמתך הושלמה בהצלחה. תוכל כעת לבצע הזמנות ולהתאים אישית את נרות השעווה שלך.' 
                : 'נכנסת לחשבון שלך. תוכל כעת לבצע הזמנות ולראות את ההיסטוריה שלך.'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function CartModal({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem }) {
  if (!isOpen) return null;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isEmpty = cart.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">עגלת קניות</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isEmpty ? (
            /* Empty Cart */
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h3>
              <p className="text-gray-600 mb-2">
                Have an account? 
                <a href="#" className="underline font-medium hover:text-gray-900"> Log in</a> to check out faster.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            /* Full Cart */
            <div>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className={`w-12 h-12 rounded-full ${item.color}`}></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-gray-600 text-sm">{item.scent}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₪{item.price * item.quantity}</p>
                      <p className="text-sm text-gray-600">₪{item.price} ליחידה</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700 font-semibold">סה"כ</span>
                  <span className="text-2xl font-bold text-gray-900">₪{cartTotal}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  alert('המעבר לתשלום יגיע בקרוב!');
                  onClose();
                }}
                className="w-full bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                המשך לתשלום
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-[#2C3E27] text-white py-12">
      <Section>
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4">חנות</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#בית" className="hover:text-white transition">בית</a></li>
              <li><a href="#גלריה" className="hover:text-white transition">קטלוג</a></li>
              <li><a href="#הזמנה" className="hover:text-white transition">יצירת קשר</a></li>
            </ul>
          </div>
          
          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">יצירת קשר</h3>
            <div className="flex gap-4">
              <a href="https://facebook.com" className="hover:opacity-70 transition" target="_blank" rel="noopener noreferrer">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" className="hover:opacity-70 transition" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="tel:0546998603" className="hover:opacity-70 transition">
                <Phone className="w-5 h-5" />
              </a>
              <a href="mailto:info@luxcera.com" className="hover:opacity-70 transition">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">הצטרפות לקהילה שלנו</h3>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="אימייל"
                className="flex-1 bg-white/10 border-b-2 border-white/30 text-white placeholder-white/50 px-2 py-2 focus:outline-none focus:border-white transition-colors"
              />
              <button type="submit" className="text-white hover:opacity-70 transition">→</button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 text-center text-sm text-white/60">
          © 2025 LUXCERA, Powered by Roi Zohar. All rights reserved.
        </div>
      </Section>
    </footer>
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

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyStyles = () => {
    const root = document.documentElement;
    const body = document.body;
    
    // Font size
    if (settings.fontSize !== 100) {
      root.style.fontSize = `${settings.fontSize}%`;
    } else {
      root.style.fontSize = '';
    }
    
    // Screen zoom
    if (settings.screenZoom !== 100) {
      root.style.zoom = `${settings.screenZoom}%`;
    } else {
      root.style.zoom = '';
    }
    
    // Highlight links
    if (settings.highlightLinks) {
      body.classList.add('highlight-links');
    } else {
      body.classList.remove('highlight-links');
    }
    
    // Highlight headings
    if (settings.highlightHeadings) {
      body.classList.add('highlight-headings');
    } else {
      body.classList.remove('highlight-headings');
    }
    
    // Fixed descriptions for images
    if (settings.fixedDescription) {
      body.classList.add('fixed-descriptions');
    } else {
      body.classList.remove('fixed-descriptions');
    }
    
    // Show descriptions on images
    if (settings.showDescription) {
      body.classList.add('show-descriptions');
    } else {
      body.classList.remove('show-descriptions');
    }
    
    // Disable blinks/animations
    if (settings.disableBlinks) {
      body.classList.add('disable-blinks');
    } else {
      body.classList.remove('disable-blinks');
    }
    
    // Keyboard navigation
    if (settings.keyboardNav) {
      body.classList.add('keyboard-navigation');
      // הוספת tabindex לכל הכפתורים והקישורים
      document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
        if (!el.hasAttribute('tabindex')) {
          el.setAttribute('tabindex', el.disabled ? '-1' : '0');
        }
      });
    } else {
      body.classList.remove('keyboard-navigation');
    }
    
    // Cursor settings
    if (settings.blackCursor) {
      body.classList.add('black-cursor');
    } else {
      body.classList.remove('black-cursor');
    }
    
    if (settings.largeCursor) {
      body.classList.add('large-cursor');
    } else {
      body.classList.remove('large-cursor');
    }
    
    // Combine filters - priorities: invertColors > highContrast > blackYellow > sepia > monochrome
    const filters = [];
    if (settings.invertColors) {
      filters.push('invert(1)');
    } else if (settings.highContrast) {
      filters.push('contrast(1.5)');
    } else if (settings.blackYellow) {
      filters.push('contrast(2) brightness(1.5)');
    } else if (settings.sepia) {
      filters.push('sepia(1)');
    } else if (settings.monochrome) {
      filters.push('grayscale(1)');
    }
    
    body.style.filter = filters.join(' ');
  };

  React.useEffect(() => {
    applyStyles();
  }, [settings]);

  // לפי התמונה - 19 כפתורים בשורה אחת (מימין לשמאל)
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

  // Wheelchair icon SVG
  const WheelchairIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="4" r="2"/>
      <path d="M20 20h-6l-2-6h-4"/>
      <circle cx="8" cy="16" r="2"/>
      <circle cx="18" cy="20" r="2"/>
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
      {/* Accessibility Panel - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t-4 border-blue-600">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center gap-4">
            <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80 bg-white/20 px-2 py-1 rounded">
              ESC
            </button>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <WheelchairIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 bg-blue-700/50 px-4 py-2 rounded text-sm">
              ניתן לנווט בין כפתורים עם חצי המקלדת
            </div>
          </div>

          {/* Buttons Grid */}
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

          {/* Warning */}
          <div className="p-6 bg-yellow-50 border-t-2 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-base text-yellow-900 leading-relaxed">
                אזהרה! הרחק מהישג ידם של ילדים וחיות מחמד. אל תשאיר נרות דולקים או פניני שעווה ללא השגחה בקרבת חפצים דליקים. אל תזיז את הנר בעת בעירה או כשהוא חם.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 bg-gray-100 border-t-2 border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">מופעל על ידי</span>
              <span className="text-sm font-bold text-blue-600">LUXCERA ACCESSIBILITY</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-200 rounded transition">
                <Flag className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded transition">
                <Mail className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => setSettings({
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
              })} className="p-2 hover:bg-gray-200 rounded transition">
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
    </>
  );
}

export default function LuxceraLanding() {
  const [cartOpen, setCartOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [cart, setCart] = React.useState([]);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const handleCartClick = () => setCartOpen(true);
  const handleCloseCart = () => setCartOpen(false);
  const handleAccountClick = () => setAccountOpen(true);
  const handleCloseAccount = () => setAccountOpen(false);

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      handleUpdateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // מוצרים לפי קטגוריות
  const sets = [
    { id: 1, name: 'WHITE AMBER SET', price: 219, inStock: false, color: 'bg-white', image: '📿' },
    { id: 2, name: 'ALLISON SET', price: 259, inStock: true, color: 'bg-white', image: '🕯️' },
    { id: 3, name: 'BLACK AMBER SET', price: 219, inStock: true, color: 'bg-gray-900', image: '🕯️' },
    { id: 4, name: 'AMÉLIE SET MEDIUM', price: 169, inStock: true, color: 'bg-white', image: '🏺' },
    { id: 5, name: 'HÉLÈNE SET', price: 399, inStock: true, color: 'bg-white', image: '🌸' },
  ];

  const fireplace = [
    { id: 101, name: 'FIREFLOW BASIC', price: 450, inStock: true, color: 'bg-orange-50', image: '🔥' },
    { id: 102, name: 'FIREFLOW PREMIUM', price: 650, inStock: true, color: 'bg-red-50', image: '🔥' },
    { id: 103, name: 'FIREFLOW LUXURY', price: 899, inStock: true, color: 'bg-amber-50', image: '🔥' },
  ];

  const waxPearls = [
    { id: 201, name: 'PEARLS VANILLA', price: 89, inStock: true, color: 'bg-yellow-50', image: '💛' },
    { id: 202, name: 'PEARLS LAVENDER', price: 89, inStock: true, color: 'bg-purple-50', image: '💜' },
    { id: 203, name: 'PEARLS ROSE', price: 89, inStock: true, color: 'bg-pink-50', image: '💗' },
    { id: 204, name: 'PEARLS COCONUT', price: 89, inStock: true, color: 'bg-blue-50', image: '💙' },
  ];

  const accessories = [
    { id: 301, name: 'HOLDER GOLD', price: 129, inStock: true, color: 'bg-yellow-100', image: '✨' },
    { id: 302, name: 'HOLDER SILVER', price: 129, inStock: true, color: 'bg-gray-100', image: '✨' },
    { id: 303, name: 'WICK TRIMMER', price: 45, inStock: true, color: 'bg-slate-100', image: '✂️' },
    { id: 304, name: 'CANDLE EXTINGUISHER', price: 35, inStock: true, color: 'bg-stone-100', image: '🔔' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <PromoBanner />
      <Nav onCartClick={handleCartClick} onUserClick={handleAccountClick} cartCount={cartCount} />
      <AccountModal 
        isOpen={accountOpen} 
        onClose={handleCloseAccount}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />
      <CartModal 
        isOpen={cartOpen} 
        onClose={handleCloseCart} 
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
      <Hero />
      
      {/* קרסלות מוצרים */}
      <ProductsCarousel 
        title="מארזים"
        products={sets}
        onAddToCart={handleAddToCart}
      />
      <ProductsCarousel 
        title="קמיני אש לבית"
        products={fireplace}
        onAddToCart={handleAddToCart}
      />
      <ProductsCarousel 
        title="פניני שעווה"
        products={waxPearls}
        onAddToCart={handleAddToCart}
      />
      <ProductsCarousel 
        title="אביזרים"
        products={accessories}
        onAddToCart={handleAddToCart}
      />
      
      <Gallery />
      <OrderForm />
      <Footer />
      <AccessibilityWidget />
    </div>
  );
}
