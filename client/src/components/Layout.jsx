import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, Phone, MapPin, CheckCircle, ChevronRight, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import luxceraLogo from '../assets/Luxcera Logo.png';
import candleBg1 from '../assets/candle-bg-1.png';
import candleBg2 from '../assets/candle-bg-2.png';
import candleBg3 from '../assets/candle-bg-3.png';
import { useApp } from '../context/AppContext';
import CartModal from './CartModal';
import { apiClubMe, apiClubRedeem, TIER_INFO } from '../api/club';
import AccountModal from './AccountModal';
import CookieConsent from './CookieConsent';
import BitPaymentButton from './BitPaymentButton';
import GiftCardApply from './GiftCardApply';
import PromoGiftApply from './PromoGiftApply';

function Nav({ onCartClick, onUserClick, onSearchClick, cartCount, isLoggedIn, userName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const links = [
    { name: 'בית', href: '/', onClick: () => navigate('/') },
    { name: 'יצירת קשר', href: '/contact', onClick: () => navigate('/contact') }
  ];

  return (
    <nav className="sticky top-0 w-full z-50 bg-black shadow-md" aria-label="ניווט ראשי" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src={luxceraLogo} alt="LUXCERA" className="h-16 sm:h-20 md:h-24 w-auto rounded-xl" />
        </Link>

        <div className="hidden md:flex gap-8 text-gold text-base">
          {links.map(link => (
            <Link key={link.name} to={link.href} onClick={link.onClick} className="hover:text-gold/80 transition font-medium">{link.name}</Link>
          ))}
        </div>

        <div className="flex items-center gap-5">
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
            {isLoggedIn && cartCount > 0 && (
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
              <Link key={link.name} to={link.href} onClick={() => { link.onClick(); setMobileMenuOpen(false); }} className="block text-gold hover:bg-gold/10 p-2">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function Layout({ children, onCartClick, onUserClick, onSearchClick, cartCount, isLoggedIn, userName }) {
  const { 
    cart, 
    isCartOpen, 
    openCart, 
    closeCart, 
    updateCartQuantity, 
    removeFromCart,
    clearCart,
    getCartCount,
    isAccountModalOpen,
    openAccountModal,
    closeAccountModal,
    isLoggedIn: contextIsLoggedIn,
    login,
    logout
  } = useApp();
  
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  
  // אם לא הועבר cartCount, נשתמש ב-getCartCount מ-AppContext
  const displayCartCount = cartCount !== undefined ? cartCount : getCartCount();
  
  // אם לא הועבר onCartClick, נשתמש ב-openCart מ-AppContext
  const handleCartClick = onCartClick || openCart;
  
  // אם לא הועבר onUserClick, נשתמש ב-openAccountModal מ-AppContext
  const handleUserClick = onUserClick || openAccountModal;
  
  // אם לא הועבר isLoggedIn, נשתמש ב-contextIsLoggedIn מ-AppContext
  const displayIsLoggedIn = isLoggedIn !== undefined ? isLoggedIn : contextIsLoggedIn;
  
  const handleCheckout = () => {
    closeCart();
    setCheckoutOpen(true);
  };
  
  const handleCloseCheckout = () => {
    console.log('[Checkout] Closing checkout modal');
    setCheckoutOpen(false);
    // לא מעדכנים את העגלה כאן - זה יגרום לכפילות
    // העגלה תישאר כפי שהיא ב-AppContext
  };
  
  const handleOrderComplete = async (orderData) => {
    setCheckoutOpen(false);
    // איפוס עגלת הקניות אחרי השלמת ההזמנה
    if (orderData && orderData.orderId) {
      console.log('[Layout] Order completed, clearing cart:', orderData);
      // איפוס העגלה - גם ב-AppContext וגם ב-localStorage
      await clearCart();
      console.log('[Layout] Cart cleared after order completion');
    }
  };
  
  const handleLoginSuccess = (name) => {
    if (name) {
      login({ name, email: localStorage.getItem('luxcera_userEmail') || '' });
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-ivory relative">
      {/* רקע שקוף עם תמונות נרות מפוזרות - עדין מאוד */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            url(${candleBg1}),
            url(${candleBg2}),
            url(${candleBg3}),
            url(${candleBg1}),
            url(${candleBg2}),
            url(${candleBg3})
          `,
          backgroundSize: '600px auto, 500px auto, 550px auto, 450px auto, 480px auto, 520px auto',
          backgroundPosition: '10% 15%, 85% 35%, 50% 70%, 25% 55%, 75% 80%, 40% 25%',
          backgroundRepeat: 'no-repeat',
          opacity: 0.08,
          filter: 'blur(80px) grayscale(20%)',
          mixBlendMode: 'multiply'
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        <Nav 
          onCartClick={handleCartClick}
          onUserClick={handleUserClick}
          onSearchClick={onSearchClick}
          cartCount={displayCartCount}
          isLoggedIn={displayIsLoggedIn}
          userName={userName}
        />
        {children}
      <CartModal 
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
        isLoggedIn={displayIsLoggedIn}
      />
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={closeAccountModal}
        isLoggedIn={displayIsLoggedIn}
        setIsLoggedIn={(loggedIn) => {
          if (!loggedIn) {
            logout();
          }
        }}
        onLoginSuccess={handleLoginSuccess}
      />
      <CookieConsent />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={handleCloseCheckout}
        cart={cart}
        onOrderComplete={handleOrderComplete}
      />
      </div>
    </div>
  );
}

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
  // מועצות מקומיות ואזורים נוספים
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
  // יישובים נוספים
  'אביחיל', 'אבן יצחק', 'אדרת', 'אודם', 'אורים', 'אורן', 'אושה', 'אחוזת ברק',
  'אחיטוב', 'איבים', 'אילון', 'איתן', 'אלוני אבא', 'אלוני יצחק', 'אלונים',
  'אליפלט', 'אלישיב', 'אלישמע', 'אליקים', 'אלרום', 'אלרואי', 'אמונים',
  'אמציה', 'אניעם', 'אסד', 'אשדות יעקב', 'אשדות יעקב מאוחד', 'אשדות יעקב איחוד',
  'אשלים', 'אשתאול', 'אתגר', 'בארות יצחק', 'בארותיים', 'בארי', 'בוסתן הגליל',
  'בורגתה', 'בחן', 'ביצרון', 'בית אורן', 'בית אלעזרי', 'בית גוברין', 'בית גמליאל',
  'בית דוד', 'בית הלוי', 'בית הלל', 'בית זיד', 'בית זית', 'בית חורון', 'בית ינאי',
  'בית יצחק-שער חפר', 'בית לחם הגלילית', 'בית מאיר', 'בית נחמיה', 'בית נקופה',
  'בית עובד', 'בית עוזיאל', 'בית קמה', 'בית רמות', 'בית רימון', 'בית שאן',
  'בית שקמה', 'ביתן אהרן', 'בלפוריה', 'בן שמן', 'בני דקלים', 'בני דרור',
  'בני עטרות', 'בני עי"ש', 'בני ציון', 'בני ראם', 'בנימינה', 'בצרה', 'בר גיורא',
  'בר יוחאי', 'ברור חיל', 'ברכיה', 'ברקאי', 'ברקן', 'ברקת', 'בת הדר', 'בת חן',
  'בת חפר', 'בת שלמה', 'גאולי תימן', 'גאולים', 'גאליה', 'גבולות', 'גבים',
  'גבע', 'גבע כ"ח', 'גבעולים', 'גבעון החדשה', 'גבעות בר', 'גבעת אבני', 'גבעת בוסתן',
  'גבעת ברנר', 'גבעת השלושה', 'גבעת זאב', 'גבעת חיים', 'גבעת חיים איחוד',
  'גבעת כ"ח', 'גבעת ניל"י', 'גבעת עוז', 'גבעת שמואל', 'גבעת שפירא', 'גבעתי',
  'גבעתיים', 'גברעם', 'גבת', 'גדות', 'גדיש', 'גדעונה', 'גדרה', 'גונן',
  'גורן', 'גזית', 'גיאה', 'גיבתון', 'גיזו', 'גילון', 'גילת', 'גינוסר',
  'גיניגר', 'גינתון', 'גיתה', 'גיתית', 'גלאון', 'גליל ים', 'גלעד', 'גמזו',
  'גן הדרום', 'גן השומרון', 'גן חיים', 'גן יאשיה', 'גן יבנה', 'גן נר',
  'גן שורק', 'גן שמואל', 'גנות', 'גנות הדר', 'גני הדר', 'גני טל', 'גני יוחנן',
  'גני מודיעין', 'גני תקווה', 'געש', 'געתון', 'גפן', 'גרופית', 'גשור', 'גשר',
  'גשר הזיו', 'גת', 'גת רימון', 'דבורה', 'דבירה', 'דברת', 'דגניה א', 'דגניה ב',
  'דוב"ב', 'דור', 'דורות', 'דחי', 'דייר אל-אסד', 'דייר חנא', 'דייר רפאת',
  'דימונה', 'דישון', 'דליה', 'דלתון', 'דמיידה', 'דן', 'דפנה', 'האון', 'הבונים',
  'הגושרים', 'הוד השרון', 'הודיה', 'הוזייל', 'הושעיה', 'הזורע', 'הזורעים',
  'החותרים', 'היוגב', 'הילה', 'המעפיל', 'הסוללים', 'העוגן', 'הר אדר', 'הר גילה',
  'הר עמשא', 'הראל', 'הרצליה', 'הרדוף', 'הרצליה', 'זבארה', 'זבדיאל', 'זוהר',
  'זיקים', 'זכרון יעקב', 'זכריה', 'זמר', 'זמרת', 'זנוח', 'זרועה', 'זרזיר',
  'זריקיה', 'חד-נס', 'חדרה', 'חוגלה', 'חולדה', 'חולון', 'חולית', 'חולתה',
  'חוסן', 'חוסנייה', 'חופית', 'חוקוק', 'חורון', 'חורשים', 'חזון', 'חיבת ציון',
  'חיננית', 'חיפה', 'חירות', 'חלוץ', 'חלמיש', 'חלץ', 'חמד', 'חמדיה', 'חמדת',
  'חניאל', 'חניתה', 'חנתון', 'חספין', 'חפץ חיים', 'חפצי-בה', 'חצב', 'חצבה',
  'חצור-אשדוד', 'חצור הגלילית', 'חצרים', 'חרובית', 'חרות', 'חרמש', 'חרשים',
  'טבריה', 'טובא-זנגריה', 'טורעאן', 'טייבה', 'טירה', 'טירת יהודה', 'טירת כרמל',
  'טירת צבי', 'טל-אל', 'טל שחר', 'טללים', 'טלמון', 'טמרה', 'טמרה יזרעאל',
  'טנא', 'טפחות', 'יאנוח-גת', 'יבול', 'יגור', 'יגל', 'יד השמונה', 'יד חנה',
  'יד מרדכי', 'יד נתן', 'יד רמב"ם', 'ידידה', 'יהל', 'יובל', 'יודפת', 'יונתן',
  'יושיביה', 'יזרעאל', 'יחיעם', 'יטבתה', 'ייט"ב', 'יכיני', 'ינוב', 'ינון',
  'יסודות', 'יסוד המעלה', 'יסעור', 'יעד', 'יעל', 'יערה', 'יערות הכרמל',
  'יפיע', 'יפית', 'יפעת', 'יפתח', 'יצהר', 'יציץ', 'יקום', 'יקיר', 'יראון',
  'ירדנה', 'ירוחם', 'ירחיב', 'ירקונה', 'ישע', 'ישעי', 'ישרש', 'יתד', 'כאבול',
  'כאוכב אבו אל-היגא', 'כברי', 'כדורי', 'כדיתה', 'כוכב השחר', 'כוכב יאיר',
  'כוכב מיכאל', 'כורזים', 'כחל', 'כחלה', 'כיסופים', 'כישור', 'כליל', 'כלנית',
  'כמאנה', 'כמהין', 'כמון', 'כנות', 'כנף', 'כנרת', 'כסיפה', 'כסלון', 'כסרא-סמיע',
  'כעביה-טבאש-חגאגרה', 'כרם בן שמן', 'כרם בן זימרה', 'כרם יבנה', 'כרם מהר"ל',
  'כרם שלום', 'כרמי יוסף', 'כרמי צור', 'כרמיאל', 'כרמיה', 'כרמים', 'כרמית',
  'כרנסא', 'כרתים', 'להב', 'להבות חביבה', 'להבים', 'לוטם', 'לוחמי הגיטאות',
  'לוזית', 'לוחם', 'לימן', 'לכיש', 'לפיד', 'לפידות', 'לקיה', 'מאור', 'מאיר שפיה',
  'מבוא ביתר', 'מבוא חורון', 'מבוא מודיעין', 'מבואות ים', 'מבואות יריחו',
  'מבואות עירון', 'מבואות תענך', 'מבוא חמה', 'מבטחים', 'מבקיעים', 'מבשרת ציון',
  'מגאר', 'מגידו', 'מגל', 'מגן', 'מגן שאול', 'מגשימים', 'מדרך עוז', 'מדרשת בן גוריון',
  'מדרשת רופין', 'מודיעין עילית', 'מודיעין-מכבים-רעות', 'מולדת', 'מוצא עילית',
  'מוקייבלה', 'מורן', 'מורשת', 'מזור', 'מזכרת בתיה', 'מזרעה', 'מחולה', 'מחנה הילה',
  'מחנה תל נוף', 'מחנה יתיר', 'מחנה יפה', 'מחנה יקים', 'מחנה מרים', 'מחנה נחום',
  'מחנה סירקין', 'מחנה עוז', 'מחנה רעים', 'מחנה תל נוף', 'מחניים', 'מחסיה',
  'מטולה', 'מטע', 'מי עמי', 'מייסר', 'מיצר', 'מירב', 'מירון', 'מישר', 'מיתר',
  'מכורה', 'מכמורת', 'מכמנים', 'מלכיה', 'מנוחה', 'מנוף', 'מנות', 'מנחמיה',
  'מנרה', 'מסד', 'מסדה', 'מסילות', 'מסילת ציון', 'מסלול', 'מסעדה', 'מעברות',
  'מעגן', 'מעגן מיכאל', 'מעוז חיים', 'מעון', 'מעונה', 'מעין ברוך', 'מעין צבי',
  'מעלה אדומים', 'מעלה גלבוע', 'מעלה גמלא', 'מעלה החמישה', 'מעלה לבונה',
  'מעלה מכמש', 'מעלה עירון', 'מעלות-תרשיחא', 'מענית', 'מעש', 'מפלסים',
  'מצובה', 'מצדות יהודה', 'מצפה', 'מצפה אביב', 'מצפה אילן', 'מצפה הילה',
  'מצפה חגית', 'מצפה יריחו', 'מצפה נטופה', 'מצפה רמון', 'מצפה שלם', 'מצר',
  'מקווה ישראל', 'מרגליות', 'מרום גולן', 'מרחביה', 'מרחב עם', 'מרכז שפירא',
  'משאבי שדה', 'משגב דב', 'משגב עם', 'משהד', 'משואה', 'משואות יצחק', 'משמר איילון',
  'משמר דוד', 'משמר הירדן', 'משמר הנגב', 'משמר העמק', 'משמר השבעה', 'משמר השרון',
  'משמרות', 'משמרת', 'משען', 'מתן', 'מתת', 'מתתיהו', 'נאות גולן', 'נאות הכיכר',
  'נאות מרדכי', 'נאות סמדר', 'נבטים', 'נגבה', 'נגוהות', 'נהורה', 'נהלל', 'נהריה',
  'נוב', 'נוגה', 'נווה', 'נווה אבות', 'נווה אור', 'נווה אטי"ב', 'נווה אילן',
  'נווה איתן', 'נווה דניאל', 'נווה זיו', 'נווה חריף', 'נווה ים', 'נווה ימין',
  'נווה ירק', 'נווה מבטח', 'נווה מיכאל', 'נווה שלום', 'נועם', 'נוף איילון',
  'נופים', 'נופית', 'נופך', 'נוקדים', 'נורדיה', 'נחושה', 'נחל עוז', 'נחלה',
  'נחליאל', 'נחלים', 'נחלת יהודה', 'נחלת יצחק', 'נחלים', 'נחם', 'נחף', 'נחשולים',
  'נחשון', 'נחשונים', 'נטועה', 'נטור', 'נטע', 'נטעים', 'נטף', 'ניין', 'ניל"י',
  'ניצן', 'ניצנה', 'ניצני עוז', 'ניצנים', 'ניר אליהו', 'ניר בנים', 'ניר גלים',
  'ניר דוד', 'ניר ח"ן', 'ניר יפה', 'ניר יצחק', 'ניר ישראל', 'ניר משה', 'ניר עוז',
  'ניר עם', 'ניר עציון', 'ניר עקיבא', 'ניר צבי', 'נירים', 'נירית', 'נס הרים',
  'נס עמים', 'נס ציונה', 'נעורים', 'נעלה', 'נעמ"ה', 'נען', 'נצר חזני', 'נצר סרני',
  'נצרת', 'נצרת עילית', 'נשר', 'נתיב הל"ה', 'נתיב הגדוד', 'נתיב העשרה', 'נתיב השיירה',
  'נתיבות', 'נתניה', 'סאסא', 'סביון', 'סגולה', 'סואעד', 'סולם', 'סומך', 'סוסיה',
  'סופה', 'סח\'נין', 'סייד', 'סלמה', 'סלעית', 'סמר', 'סנסנה', 'סעד', 'סער',
  'ספיר', 'ספסופה', 'סתריה', 'עבדון', 'עברון', 'עגור', 'עדי', 'עדנים', 'עוזה',
  'עוזייר', 'עולש', 'עומר', 'עופר', 'עופרה', 'עוצם', 'עוקבי', 'עזוז', 'עזר',
  'עזריאל', 'עזריה', 'עזריקם', 'עטרת', 'עיינות', 'עין אילה', 'עין אל-אסד',
  'עין גב', 'עין גדי', 'עין הדר', 'עין החורש', 'עין המפרץ', 'עין הנצי"ב',
  'עין העמק', 'עין השופט', 'עין ורד', 'עין זיוון', 'עין חוד', 'עין חרוד',
  'עין חרוד איחוד', 'עין חרוד מאוחד', 'עין יהב', 'עין יעקב', 'עין כרם-בי"ס חקלאי',
  'עין כרמל', 'עין מאהל', 'עין נקובה', 'עין עירון', 'עין צורים', 'עין רפה',
  'עין שמר', 'עין שריד', 'עין תמר', 'עינת', 'עיר אובות', 'עכו', 'עלומים',
  'עלי', 'עלי זהב', 'עלמה', 'עלמון', 'עמוקה', 'עמיעד', 'עמיעוז', 'עמיקם',
  'עמיר', 'עמנואל', 'עספיא', 'עפולה', 'עצמון שגב', 'עראבה', 'ערד', 'ערוגות',
  'ערערה', 'ערערה-בנגב', 'עשרת', 'עתלית', 'עתניאל', 'פארן', 'פדואל', 'פדיה',
  'פוריה - כפר עבודה', 'פוריה - נווה עובד', 'פוריה עילית', 'פוריידיס', 'פורת',
  'פטיש', 'פלך', 'פלמחים', 'פני קדם', 'פנימיית עין כרם', 'פסגות', 'פסוטה',
  'פקיעין', 'פקיעין החדשה', 'פרדס חנה-כרכור', 'פרדסיה', 'פרוד', 'פרזון', 'פתח תקווה',
  'צאלים', 'צביה', 'צובה', 'צוחר', 'צופיה', 'צופים', 'צופית', 'צופר', 'צוקי ים',
  'צוקים', 'צור הדסה', 'צור יצחק', 'צור משה', 'צור נתן', 'צוריאל', 'צורית',
  'ציפורי', 'צלפון', 'צנדלה', 'צפריה', 'צפרירים', 'צרופה', 'צרעה', 'קבועה',
  'קבוצת יבנה', 'קדומים', 'קדימה-צורן', 'קדמה', 'קדמת צבי', 'קדר', 'קדרון',
  'קדרים', 'קודייראת א-צאנע', 'קוואעין', 'קוממיות', 'קורנית', 'קטורה', 'קיבוץ יגור',
  'קיבוץ יפעת', 'קיבוץ רמת רחל', 'קידה', 'קיסריה', 'קלחים', 'קליה', 'קציר',
  'קצר א-סר', 'קצרין', 'קרית ארבע', 'קרית אתא', 'קרית ביאליק', 'קרית גת',
  'קרית טבעון', 'קרית ים', 'קרית יערים', 'קרית מוצקין', 'קרית מלאכי', 'קרית נטפים',
  'קרית ענבים', 'קרית עקרון', 'קרית שמונה', 'קרני שומרון', 'ראס עלי', 'ראס עלי',
  'ראש העין', 'ראש פינה', 'ראש צורים', 'רבבה', 'רבדים', 'רביבים', 'רביד',
  'רגבה', 'רגבים', 'רהט', 'רוויה', 'רוחמה', 'רומת הייב', 'רועי', 'רותם',
  'רחוב', 'רחובות', 'רחלים', 'ריחאניה', 'ריחן', 'רימונים', 'רינתיה', 'רכסים',
  'רם-און', 'רמות', 'רמות השבים', 'רמות מאיר', 'רמות מנשה', 'רמות נפתלי',
  'רמת גן', 'רמת דוד', 'רמת הכובש', 'רמת רחל', 'רמת רזיאל', 'רמת יוחנן',
  'רמת ישי', 'רמת מגשימים', 'רמת רזיאל', 'רמת רחל', 'רמת השופט', 'רמת השרון',
  'רמת טראמפ', 'רמת יוחנן', 'רמת רזיאל', 'רמת רחל', 'רנן', 'רעים', 'רעננה',
  'רשפון', 'רתמים', 'שאר ישוב', 'שבי דרום', 'שבי ציון', 'שבי שומרון', 'שבלי',
  'שגב-שלום', 'שדה אילן', 'שדה אליהו', 'שדה אליעזר', 'שדה בוקר', 'שדה דוד',
  'שדה ורבורג', 'שדה יואב', 'שדה יעקב', 'שדה יצחק', 'שדה משה', 'שדה נחום',
  'שדה נחמיה', 'שדה ניצן', 'שדה עוזיהו', 'שדות ים', 'שדות מיכה', 'שואבה',
  'שובה', 'שובל', 'שוהם', 'שומרה', 'שומריה', 'שוקדה', 'שורש', 'שורשים',
  'שושנת העמקים', 'שזור', 'שחר', 'שחרות', 'שיבולים', 'שיזף', 'שיטים',
  'שייח דנון', 'שילה', 'שילת', 'שכניה', 'שלווה', 'שלוחות', 'שלומי', 'שלומית',
  'שמיר', 'שמעה', 'שמרת', 'שמשית', 'שני', 'שניר', 'שעב', 'שעל', 'שעלבים',
  'שער אפרים', 'שער הגולן', 'שער העמקים', 'שער מנשה', 'שער שומרון', 'שפיים',
  'שפר', 'שפרעם', 'שקד', 'שקף', 'שרונה', 'שריגים', 'שרשרת', 'שרת', 'שרתון',
  'שרשרת', 'תאשור', 'תדהר', 'תובל', 'תומר', 'תושיה', 'תימורים', 'תירוש',
  'תל אביב-יפו', 'תל יוסף', 'תל יצחק', 'תל מונד', 'תל עדשים', 'תל ערד',
  'תל קציר', 'תל ציון', 'תל רעים', 'תל תאומים', 'תלם', 'תלמי אליהו', 'תלמי אלעזר',
  'תלמי ביל"ו', 'תלמי יוסף', 'תלמי יחיאל', 'תלמי יפה', 'תלמים', 'תמרת', 'תנובות',
  'תעוז', 'תפרח', 'תקומה', 'תרום', 'תרדיון', 'תרשיש', 'תשבי', 'תשע פינות'
];

// הסרת כפילויות ומיון
const ISRAELI_CITIES = Array.from(new Set(ISRAELI_CITIES_RAW)).sort();

function CheckoutModal({ isOpen, onClose, cart, onOrderComplete }) {
  const { 
    isLoggedIn, 
    userEmail, 
    giftCardAmount, 
    giftCardCode, 
    promoAmount, 
    promoGiftToken,
    applyGiftCard, 
    applyPromoCode, 
    clearDiscounts, 
    getFinalTotal 
  } = useApp();
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
  
  // Loyalty Club points
  const [loyaltyMember, setLoyaltyMember] = React.useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = React.useState(false);
  const [pointsToRedeem, setPointsToRedeem] = React.useState('');
  const [pointsRedeemed, setPointsRedeemed] = React.useState(0);
  const [pointsRedeemLoading, setPointsRedeemLoading] = React.useState(false);
  const [pointsError, setPointsError] = React.useState(null);
  const [redeemMessage, setRedeemMessage] = React.useState(null);
  const POINT_VALUE = 1; // 1 נקודה = 1 ש"ח
  
  // מדרגות שימוש בנקודות לפי סכום ההזמנה (לפני נקודות)
  const POINTS_TIERS = [
    // עד 149 ₪ – אי אפשר להשתמש בנקודות
    { minTotal: 0,   maxRedeemPoints: 0 },
    // מ-150 ₪ ומעלה – עד 50 נקודות
    { minTotal: 150, maxRedeemPoints: 50 },
    // מ-300 ₪ ומעלה – עד 150 נקודות
    { minTotal: 300, maxRedeemPoints: 150 },
    // מ-500 ₪ ומעלה – עד 300 נקודות
    { minTotal: 500, maxRedeemPoints: 300 },
  ];
  
  // מחזיר את כמות הנקודות המקסימלית לפי סכום ההזמנה (לפני נקודות)
  const getMaxRedeemByTier = (orderTotalWithoutPoints) => {
    let max = 0;
    for (const tier of POINTS_TIERS) {
      if (orderTotalWithoutPoints >= tier.minTotal) {
        max = tier.maxRedeemPoints;
      }
    }
    return max;
  };

  // שמירת הקרט המקורי - כדי שלא יאבד כשהקרט מתרוקן אחרי יצירת ההזמנה
  const [savedCart, setSavedCart] = React.useState([]);

  // שמירת הקרט כשהמודאל נפתח בפעם הראשונה
  // משתמשים ב-useRef כדי לשמור את הקרט המקורי רק פעם אחת
  const initialCartRef = React.useRef(null);
  const wasOpenRef = React.useRef(false);
  const cartSnapshotRef = React.useRef(null); // שמירת snapshot של הקרט המקורי
  
  React.useEffect(() => {
    // שמור את הקרט רק כשהמודאל נפתח בפעם הראשונה (ממצב סגור לפתוח)
    // זה מונע כפילות אם המשתמש יוצא ופותח שוב
    if (isOpen && !wasOpenRef.current) {
      // בדיקה שהקרט לא ריק ולא כפול - הסרת כפילויות לפי id
      // חשוב: נשתמש ב-cart הנוכחי רק כשהמודאל נפתח בפעם הראשונה
      const uniqueCart = cart.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      );
      
      if (uniqueCart.length > 0) {
        console.log('[Checkout] Modal opened, saving initial cart:', uniqueCart);
        // יצירת עותק עמוק של הקרט כדי למנוע התייחסות
        const cartCopy = JSON.parse(JSON.stringify(uniqueCart));
        initialCartRef.current = cartCopy;
        cartSnapshotRef.current = cartCopy; // שמירת snapshot
        setSavedCart(cartCopy);
        wasOpenRef.current = true;
      } else {
        console.log('[Checkout] Modal opened but cart is empty');
      }
    }
    
    // איפוס ה-refs כשהמודאל נסגר
    if (!isOpen && wasOpenRef.current) {
      console.log('[Checkout] Modal closed, resetting refs and savedCart');
      console.log('[Checkout] Cart snapshot before close:', cartSnapshotRef.current);
      console.log('[Checkout] Current cart before close:', cart);
      
      // חשוב: לא מעדכנים את הקרט ב-AppContext כאן!
      // הקרט ב-AppContext נשאר כפי שהוא
      
      initialCartRef.current = null;
      cartSnapshotRef.current = null;
      wasOpenRef.current = false;
      // איפוס הקרט השמור כדי למנוע כפילות בפתיחה הבאה
      setSavedCart([]);
    }
  }, [isOpen]); // רק isOpen - כדי לשמור רק פעם אחת כשהמודאל נפתח

  // שימוש בקרט שמור במקום הקרט הנוכחי (אם יש קרט שמור)
  // זה מבטיח שגם אם הקרט מתרוקן אחרי יצירת ההזמנה, נשתמש בקרט המקורי
  // חשוב: כשהמודאל פתוח, תמיד נשתמש ב-savedCart כדי למנוע כפילות
  // לא משתמשים ב-useMemo עם cart ב-dependencies כדי למנוע עדכונים מיותרים
  const cartToUse = React.useMemo(() => {
    // אם המודאל פתוח, תמיד נשתמש ב-savedCart (אם יש)
    // זה מונע כפילות גם כשעוברים בין השלבים
    if (isOpen) {
      return savedCart.length > 0 ? savedCart : cart;
    }
    // אם המודאל סגור, נשתמש בקרט הנוכחי
    return cart;
  }, [isOpen, savedCart]); // רק isOpen ו-savedCart - לא cart כדי למנוע עדכונים מיותרים

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
    const fee = cartTotal >= 300 ? 0 : 30;
    return fee;
  }, [cartTotal]);

  // שימוש ב-getFinalTotal מה-AppContext לחישוב הסכום הסופי, עם נקודות מועדון
  const finalTotal = React.useMemo(() => {
    const baseTotal = getFinalTotal(shippingFee);
    return Math.max(0, baseTotal - pointsRedeemed); // לא לרדת מתחת ל-0
  }, [getFinalTotal, shippingFee, pointsRedeemed]);
  
  // טעינת נתוני מועדון הלקוחות
  React.useEffect(() => {
    const loadLoyaltyData = async () => {
      if (!isOpen) {
        setLoyaltyMember(null);
        return;
      }
      
      if (!isLoggedIn || !userEmail) {
        setLoyaltyMember(null);
        return;
      }
      
      try {
        setLoyaltyLoading(true);
        console.log('[Checkout] Loading loyalty data for email:', userEmail);
        const data = await apiClubMe(userEmail);
        console.log('[Checkout] Loyalty data response:', data);
        if (data.ok) {
          if (data.member) {
            console.log('[Checkout] Member found:', data.member);
            setLoyaltyMember(data.member);
          } else {
            // אם data.ok הוא true אבל אין member, זה אומר שהמשתמש לא רשום במועדון
            console.log('[Checkout] User is not a member. data:', data);
            setLoyaltyMember(null);
          }
        } else {
          console.log('[Checkout] Response not ok. data:', data);
          setLoyaltyMember(null);
        }
      } catch (err) {
        console.error('Error loading loyalty data:', err);
        setLoyaltyMember(null);
      } finally {
        setLoyaltyLoading(false);
      }
    };
    
    loadLoyaltyData();
  }, [isOpen, isLoggedIn, userEmail]);
  
  // איפוס נקודות ושמירת קרט כשהמודאל נסגר
  // זה כבר מטופל ב-useEffect הקודם, אז לא צריך לעשות את זה שוב כאן
  React.useEffect(() => {
    if (!isOpen) {
      console.log('[Checkout] Modal closed, resetting state');
      setPointsToRedeem('');
      setPointsRedeemed(0);
      setPointsError(null);
      setRedeemMessage(null);
      setLoyaltyMember(null);
      // איפוס שלב התשלום
      setStep(1);
      // הערה: setSavedCart([]) כבר מטופל ב-useEffect הקודם
    }
  }, [isOpen]);
  
  // פונקציה למימוש נקודות (רק שמירה ב-state, לא מימוש בפועל)
  const handleRedeemPoints = () => {
    if (!loyaltyMember || !userEmail) return;
    
    const points = parseInt(pointsToRedeem);
    if (!points || points <= 0) {
      setPointsError('אנא הזן מספר נקודות תקין');
      setRedeemMessage(null);
      return;
    }
    
    // כמה נקודות זמינות למשתמש
    const availablePoints = loyaltyMember.total_points - loyaltyMember.used_points;
    
    if (points > availablePoints) {
      setPointsError(`יש לך רק ${availablePoints.toLocaleString('he-IL')} נקודות זמינות`);
      setRedeemMessage(null);
      return;
    }
    
    // סכום הזמנה לפני נקודות (אבל אחרי משלוח, גיפט קארד וקופון)
    const orderTotalWithoutPoints = cartTotal + shippingFee - giftCardAmount - promoAmount;
    
    if (orderTotalWithoutPoints <= 0) {
      setPointsError('לא ניתן לממש נקודות בהזמנה בסכום 0');
      setRedeemMessage(null);
      return;
    }
    
    // מקסימום נקודות לפי המדרגה
    const tierMax = getMaxRedeemByTier(orderTotalWithoutPoints);
    
    if (tierMax === 0) {
      setPointsError(`לא ניתן לממש נקודות בהזמנה מתחת ל-₪${POINTS_TIERS[1].minTotal}. מינימום למימוש נקודות: ₪${POINTS_TIERS[1].minTotal}`);
      setRedeemMessage(null);
      return;
    }
    
    // מגבלה כללית: לא לממש יותר מסכום ההזמנה
    const maxByOrderTotal = Math.floor(orderTotalWithoutPoints);
    
    // המקסימום הסופי: הכי קטן מבין – זמין, מדרגה, וסכום ההזמנה
    const maxAllowed = Math.min(availablePoints, tierMax, maxByOrderTotal);
    
    if (points > maxAllowed) {
      setPointsError(
        `במדרגת הסכום הנוכחית (₪${orderTotalWithoutPoints.toFixed(2)}) ניתן לממש עד ${maxAllowed.toLocaleString('he-IL')} נקודות (מקסימום למדרגה: ${tierMax.toLocaleString('he-IL')})`
      );
      setRedeemMessage(null);
      return;
    }
    
    // אם הכל תקין – שומרים ב-state, המימוש בפועל קורה רק אחרי שההזמנה נשמרת
    setPointsRedeemed(points);
    setPointsToRedeem('');
    setPointsError(null);
    setRedeemMessage(`נקודות ימומשו לאחר השלמת ההזמנה: ₪${points.toFixed(2)}`);
    
    setTimeout(() => {
      setRedeemMessage(null);
    }, 5000);
  };
  
  const availablePoints = loyaltyMember ? loyaltyMember.total_points - loyaltyMember.used_points : 0;

  React.useEffect(() => {
    if (!isOpen) {
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
      clearDiscounts(); // מנקים הנחות כשהמודאל נסגר
      setPointsToRedeem('');
      setPointsRedeemed(0);
      setPointsError(null);
    }
  }, [isOpen]);

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
    
    if (!shippingData.address || shippingData.address.trim() === '') {
      errors.address = 'כתובת משלוח נדרשת';
    }
    
    if (!shippingData.city || shippingData.city.trim() === '') {
      errors.city = 'עיר נדרשת';
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
    
    setIsProcessing(true);
    setSaveError(null);
    
    try {
      // שליחת ההזמנה לשרת
      // מוודאים שכל הנתונים עם הטיפוסים הנכונים
      const orderData = {
        shippingData,
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
        promo_gift_token: promoGiftToken || null,
        points_redeemed: pointsRedeemed > 0 ? Number(pointsRedeemed) : 0,
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
        // מימוש נקודות רק אחרי שההזמנה נשמרה בהצלחה
        if (pointsRedeemed > 0 && userEmail && loyaltyMember) {
          try {
            await apiClubRedeem(userEmail, pointsRedeemed, `מימוש נקודות בהזמנה #${data.orderId}`);
            console.log(`[Checkout] Points redeemed successfully for order #${data.orderId}`);
          } catch (pointsError) {
            console.error('[Checkout] Failed to redeem points:', pointsError);
            // לא נכשיל את ההזמנה אם מימוש הנקודות נכשל, אבל נודיע למשתמש
            alert('ההזמנה נשמרה בהצלחה, אך הייתה בעיה במימוש הנקודות. אנא פנה לתמיכה.');
          }
        }
        
        setOrderSaved(true);
        setOrderId(data.orderId);
        setIsComplete(true);
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

  if (!isOpen) return null;

  if (isComplete && orderSaved) {
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
          
          <button onClick={onClose} className="w-full bg-[#40E0D0] hover:bg-[#30D5C8] text-white px-6 py-3 rounded-lg font-semibold transition-colors">סגור</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8" data-checkout-modal data-open={isOpen}>
      <div className="absolute inset-0 bg-black/50" onClick={step === 1 ? onClose : undefined}></div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 my-8">
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-lg z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">תשלום מאובטח</h2>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="text-[#40E0D0] hover:text-[#30D5C8] flex items-center gap-2">
                <ChevronRight className="w-5 h-5" /> חזרה
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="סגור">
              <X className="w-6 h-6" />
            </button>
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

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6" /> פרטי משלוח
              </h3>

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
            <div className="space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
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

              {/* Loyalty Points Section - Similar to Gift Card */}
              {isLoggedIn && (
                <div className="border border-gray-200 rounded-lg p-4">
                  {loyaltyLoading ? (
                    <div className="text-center py-4">
                      <p className="text-gray-600 text-sm">טוען נתוני מועדון...</p>
                    </div>
                  ) : loyaltyMember ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <label style={{ display: 'block', marginBottom: '0', fontWeight: '500' }}>
                          נקודות מועדון ({availablePoints.toLocaleString('he-IL')} נקודות זמינות)
                        </label>
                        {loyaltyMember.tier && (() => {
                          const tierInfo = TIER_INFO[loyaltyMember.tier];
                          const orderTotalWithoutPoints = cartTotal + shippingFee - giftCardAmount - promoAmount;
                          const pointsToEarn = Math.floor(orderTotalWithoutPoints * tierInfo.earnRate);
                          return (
                            <div className="text-right text-sm">
                              <span className="font-semibold" style={{ color: tierInfo.color }}>
                                מדרגה: {tierInfo.labelHe}
                              </span>
                              {pointsToEarn > 0 && (
                                <span className="text-gray-600 block text-xs mt-1">
                                  תצברו {pointsToEarn} נקודות בהזמנה זו ({tierInfo.earnRate * 100}%)
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {(() => {
                        const orderTotalWithoutPoints = cartTotal + shippingFee - giftCardAmount - promoAmount;
                        const tierMax = getMaxRedeemByTier(orderTotalWithoutPoints);
                        
                        if (orderTotalWithoutPoints < POINTS_TIERS[1].minTotal) {
                          return (
                            <div className="text-center py-2">
                              <p className="text-gray-600 text-sm">
                                לא ניתן לממש נקודות בהזמנה מתחת ל-₪{POINTS_TIERS[1].minTotal}. מינימום למימוש נקודות: ₪{POINTS_TIERS[1].minTotal}
                              </p>
                            </div>
                          );
                        }
                        
                        if (availablePoints === 0) {
                          return (
                            <div className="text-center py-2">
                              <p className="text-gray-600 text-sm">אין לך נקודות זמינות לממש (0 נקודות)</p>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                      {(() => {
                        const orderTotalWithoutPoints = cartTotal + shippingFee - giftCardAmount - promoAmount;
                        const tierMax = getMaxRedeemByTier(orderTotalWithoutPoints);
                        return tierMax > 0 && availablePoints > 0 && pointsRedeemed === 0 ? (
                    <>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          max={(() => {
                            const orderTotalWithoutPoints = cartTotal + shippingFee - giftCardAmount - promoAmount;
                            const tierMax = getMaxRedeemByTier(orderTotalWithoutPoints);
                            const maxByOrderTotal = Math.floor(orderTotalWithoutPoints);
                            return Math.min(availablePoints, tierMax, maxByOrderTotal);
                          })()}
                          value={pointsToRedeem}
                          onChange={(e) => {
                            setPointsToRedeem(e.target.value);
                            setPointsError(null);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRedeemPoints();
                            }
                          }}
                          placeholder="הזן מספר נקודות לממש"
                          disabled={pointsRedeemLoading || availablePoints === 0 || (() => {
                            const orderTotalWithoutPoints = cartTotal + shippingFee - giftCardAmount - promoAmount;
                            return getMaxRedeemByTier(orderTotalWithoutPoints) === 0;
                          })()}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRedeemPoints}
                          disabled={!pointsToRedeem || parseInt(pointsToRedeem) <= 0 || availablePoints === 0 || (() => {
                            const orderTotalWithoutPoints = cartTotal + shippingFee - giftCardAmount - promoAmount;
                            return getMaxRedeemByTier(orderTotalWithoutPoints) === 0;
                          })()}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: (!pointsToRedeem || parseInt(pointsToRedeem) <= 0 || availablePoints === 0) ? '#ccc' : '#4A6741',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (!pointsToRedeem || parseInt(pointsToRedeem) <= 0 || availablePoints === 0) ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                          }}
                        >
                          החל
                        </button>
                      </div>
                      {pointsError && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            marginTop: '0.5rem',
                            color: '#dc3545',
                          }}
                        >
                          {pointsError}
                        </p>
                      )}
                      {redeemMessage && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            marginTop: '0.5rem',
                            color: '#155724',
                            fontWeight: '500',
                            backgroundColor: '#d4edda',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #c3e6cb',
                          }}
                        >
                          {redeemMessage}
                        </p>
                      )}
                    </>
                        ) : null;
                      })()}
                      {pointsRedeemed > 0 ? (
                        <div style={{ 
                          padding: '0.75rem', 
                          backgroundColor: '#d4edda', 
                          border: '1px solid #c3e6cb', 
                          borderRadius: '4px',
                          marginTop: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#155724', fontWeight: '500' }}>נקודות ממומשות:</span>
                            <span style={{ color: '#155724', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              -{pointsRedeemed.toLocaleString('he-IL')} נקודות (₪{pointsRedeemed.toFixed(2)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPointsRedeemed(0);
                              setPointsToRedeem('');
                              setPointsError(null);
                            }}
                            style={{
                              fontSize: '0.85rem',
                              color: '#155724',
                              textDecoration: 'underline',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            ביטול מימוש
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-gray-600 text-sm">אין לך חברות במועדון הלקוחות</p>
                    </div>
                  )}
                </div>
              )}

              <div className="border border-gray-200 rounded-lg p-4">
                <GiftCardApply
                  orderTotal={cartTotal + shippingFee - pointsRedeemed}
                  onApply={applyGiftCard}
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <PromoGiftApply
                  orderTotal={cartTotal + shippingFee - giftCardAmount - pointsRedeemed}
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
                  {pointsRedeemed > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>מימוש נקודות ({pointsRedeemed.toLocaleString('he-IL')} נק')</span>
                      <span>-₪{pointsRedeemed.toFixed(2)}</span>
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

              <div className="flex gap-4 pt-4">
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

export default Layout;

