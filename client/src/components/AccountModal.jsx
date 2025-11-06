import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  X, Package, Settings, ArrowRight, ShoppingBag
} from 'lucide-react';

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

// פונקציה לקבלת CSRF token
async function getCsrfToken() {
  try {
    const res = await fetch(getApiUrl('/api/csrf'), {
      credentials: 'include',
    });
    const data = await res.json();
    return data.csrfToken || '';
  } catch (err) {
    console.error('Failed to get CSRF token:', err);
    return '';
  }
}

function AccountModal({ isOpen, onClose, isLoggedIn, setIsLoggedIn, showCartMessage = false, onLoginSuccess }) {
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
    if (isOpen && isLoggedIn) {
      const savedEmail = localStorage.getItem('luxcera_userEmail');
      const savedUserName = localStorage.getItem('luxcera_userName');
      if (savedEmail || savedUserName) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail || prev.email,
          fullName: savedUserName || prev.fullName,
        }));
      }
    } else if (!isLoggedIn) {
      // אם המשתמש לא מחובר, איפוס formData
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
    }
  }, [isOpen, isLoggedIn]);

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
            const fullName = loginData.user?.full_name || userInfo.name || 'משתמש';
            const userEmail = userInfo.email || '';
            setFormData({ fullName, email: userEmail, password: '', confirmPassword: '', phone: '' });
            // שמירת אימייל ב-localStorage
            if (userEmail) {
              localStorage.setItem('luxcera_userEmail', userEmail);
              localStorage.setItem('luxcera_userName', fullName);
            }
            setLoading(false);
            setIsLoggedIn(true);
            onLoginSuccess?.(fullName);
            setSuccessType('login');
            setShowSuccessMessage(true);
            setTimeout(() => { onClose(); setShowSuccessMessage(false); }, 2500);
            return;
          }
          
          // אם זה מצב הרשמה - רושמים משתמש חדש
          const response = await fetch(getApiUrl('/api/register'), {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ fullName: userInfo.name || 'משתמש', email: userInfo.email || '' })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            setLoading(false);
            setError(data.error || 'שגיאה בהרשמה. אנא נסה שוב.');
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
          setIsLoggedIn(true);
          // שמירת אימייל ב-localStorage
          if (userEmail) {
            localStorage.setItem('luxcera_userEmail', userEmail);
            localStorage.setItem('luxcera_userName', fullName);
          }
          onLoginSuccess?.(fullName);
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
      if (!formData.email || !formData.password) {
        setError('אנא מלא את כל השדות הנדרשים'); setLoading(false); return;
      }
      setError('התחברות רגילה טרם זמינה. אנא השתמש ב-Google Login.'); 
      setLoading(false); 
      return;
    }

    try {
      if (mode === 'register') {
        try {
          const csrfToken = await getCsrfToken();
          
          const response = await fetch(getApiUrl('/api/register'), {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ fullName: formData.fullName, email: formData.email })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            setLoading(false);
            setError(data.error || 'שגיאה בהרשמה. אנא נסה שוב.');
            return;
          }
          
          // שמירת אימייל ב-localStorage
          if (formData.email) {
            localStorage.setItem('luxcera_userEmail', formData.email);
            localStorage.setItem('luxcera_userName', formData.fullName);
          }
        } catch (emailErr) {
          console.error('Email error:', emailErr);
          setLoading(false);
          setError('שגיאה בהרשמה. אנא נסה שוב.');
          return;
        }
      }

      setLoading(false);
      setIsLoggedIn(true);
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
  const showCartPrompt = showCartMessage && !isLoggedIn;

  if (isLoggedIn) {
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

            <button className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-700" />
                <span className="font-semibold text-gray-900">פרופיל</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button onClick={() => {
              setIsLoggedIn(false);
              onLoginSuccess?.('');
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
                <label className="block text-sm font-medium text-gray-700 mb-2">אימות סיסמה *</label>
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'טוען…' : (mode === 'login' ? 'התחבר' : 'הירשם')}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}
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

export default AccountModal;

