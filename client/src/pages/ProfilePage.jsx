import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import { useApp } from '../context/AppContext';
import { ArrowRight, Lock, Mail, User, Gift, CheckCircle, XCircle, Calendar, DollarSign, Search } from 'lucide-react';
import ClubJoinForm from '../components/ClubJoinForm';
import ClubDashboard from '../components/ClubDashboard';
import { apiClubMe } from '../api/club';

// Helpers
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

async function getCsrfToken() {
  try {
    const res = await fetch(getApiUrl('/api/csrf'), { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken || '';
  } catch {
    return '';
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, getCartCount } = useApp();
  const [fullName, setFullName] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('luxcera_userName') || '';
    }
    return '';
  });
  const [email, setEmail] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('luxcera_userEmail') || userEmail || '';
    }
    return userEmail || '';
  });
  const [saved, setSaved] = React.useState(false);
  
  // Gift Card balance check state
  const [giftCardCode, setGiftCardCode] = React.useState('');
  const [giftCardInfo, setGiftCardInfo] = React.useState(null);
  const [giftCardLoading, setGiftCardLoading] = React.useState(false);
  const [giftCardError, setGiftCardError] = React.useState(null);
  
  // Loyalty Club state
  const [isClubMember, setIsClubMember] = React.useState(false);
  const [clubLoading, setClubLoading] = React.useState(true);

  // Scroll to top כשנכנסים לדף פרופיל
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Check if user is a club member
  React.useEffect(() => {
    async function checkClubMember() {
      if (!email) {
        setClubLoading(false);
        return;
      }
      
      try {
        const data = await apiClubMe(email);
        setIsClubMember(!!data.member);
      } catch (err) {
        setIsClubMember(false);
      } finally {
        setClubLoading(false);
      }
    }
    
    checkClubMember();
  }, [email]);

  const handleClubJoined = () => {
    setIsClubMember(true);
  };

  const checkGiftCardBalance = async () => {
    if (!giftCardCode.trim()) {
      setGiftCardError('אנא הכנס קוד Gift Card');
      return;
    }

    setGiftCardLoading(true);
    setGiftCardError(null);
    setGiftCardInfo(null);

    try {
      let res;
      try {
        res = await fetch(getApiUrl(`/api/giftcards/${giftCardCode.trim()}`));
      } catch (networkError) {
        // טיפול בשגיאות רשת
        if (networkError.name === 'TypeError' || networkError.message.includes('fetch') || networkError.message.includes('ECONNREFUSED')) {
          setGiftCardError('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב. אם הבעיה נמשכת, צור קשר עם התמיכה.');
          setGiftCardLoading(false);
          return;
        }
        throw networkError;
      }

      if (!res.ok) {
        // אם השרת החזיר שגיאה, ננסה לפרסר את ה-JSON
        try {
          const errorData = await res.json();
          setGiftCardError(errorData.error || `השרת לא זמין (קוד ${res.status})`);
        } catch (parseError) {
          setGiftCardError(`השרת לא זמין (קוד ${res.status}). אנא ודא שהשרת רץ ונסה שוב.`);
        }
        setGiftCardLoading(false);
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        setGiftCardError('השרת החזיר תגובה לא תקינה. אנא נסה שוב מאוחר יותר.');
        setGiftCardLoading(false);
        return;
      }

      if (data.ok && data.giftCard) {
        setGiftCardInfo(data.giftCard);
      } else {
        setGiftCardError(data.error || 'Gift Card לא נמצא');
      }
    } catch (err) {
      console.error('Gift Card check error:', err);
      const errorMessage = err.message || 'שגיאה בבדיקת Gift Card';
      if (errorMessage.includes('לא זמין') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('proxy')) {
        setGiftCardError('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
      } else {
        setGiftCardError('שגיאה בבדיקת Gift Card. אנא נסה שוב מאוחר יותר.');
      }
    } finally {
      setGiftCardLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout onUserClick={() => navigate('/')} onSearchClick={() => navigate('/')} isLoggedIn={false} userName="">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>נדרשת התחברות</h1>
            <p className="text-gold/80 mb-6">עליך להתחבר כדי לצפות ולערוך את הפרופיל</p>
            <button onClick={() => navigate('/')} className="bg-gold text-black-lux px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors">
              חזרה לדף הבית
            </button>
          </div>
        </div>
        <Footer />
      </Layout>
    );
  }

  // הערות: מידע DB לצורכי דיבוג הוסר מתצוגת המשתמש

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // עדכון בצד שרת
      const csrfToken = await getCsrfToken();
      const currentEmail = (typeof window !== 'undefined' && localStorage.getItem('luxcera_userEmail')) || userEmail || '';
      const res = await fetch(getApiUrl('/api/users/me'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ currentEmail, email, fullName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'שגיאה בעדכון הפרופיל');
        return;
      }

      // Persist locally for UI
      if (typeof window !== 'undefined') {
        if (fullName) {
          localStorage.setItem('luxcera_userName', fullName);
        }
        if (email) {
          localStorage.setItem('luxcera_userEmail', email);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

    } catch (err) {
      alert('שגיאה בעדכון הפרופיל');
    }
  };

  return (
    <Layout onUserClick={() => navigate('/')} onSearchClick={() => navigate('/')} isLoggedIn={isLoggedIn} userName={fullName}>
      <div className="min-h-screen bg-black pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button 
              onClick={() => navigate('/')} 
              className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 border-2 border-gold/50 rounded-lg shadow-lg hover:shadow-gold transition-all duration-300 hover:scale-105 mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ArrowRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
              <span className="text-gold font-semibold text-lg relative z-10 group-hover:text-gold/90 transition-colors duration-300" style={{ fontFamily: 'serif' }}>
                חזרה לדף הבית
              </span>
              <div className="absolute -inset-1 bg-gold/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
            <h1 className="text-4xl font-bold text-gold mb-2" style={{ fontFamily: 'serif' }}>
              פרופיל
            </h1>
            <p className="text-gold/80">עדכון פרטים אישיים והעדפות</p>
          </div>

          <form onSubmit={handleSave} className="bg-black/90 rounded-lg shadow-luxury border-2 border-gold/30 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gold mb-2">שם מלא</label>
              <div className="relative">
                <User className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gold/60" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gold/30 bg-black/50 rounded-lg px-10 py-3 text-gold placeholder-gold/50 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                  placeholder="הזן שם מלא"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gold mb-2">אימייל</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gold/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gold/30 bg-black/50 rounded-lg px-10 py-3 text-gold placeholder-gold/50 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                  placeholder="name@example.com"
                />
              </div>
              <p className="text-xs text-gold/70 mt-2">
                שינוי האימייל כאן מעדכן את פרטי יצירת הקשר בתצוגה. כדי לחבר/לנתק אימייל להתחברות Google, יש לעדכן בחשבון Google.
              </p>
            </div>

            <div className="opacity-70">
              <label className="block text-sm font-medium text-gold mb-2">סיסמה</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gold/60" />
                <input
                  type="password"
                  disabled
                  value="********"
                  className="w-full border border-gold/30 rounded-lg px-10 py-3 text-gold/50 bg-black/30 cursor-not-allowed"
                  readOnly
                />
              </div>
              <p className="text-xs text-gold/70 mt-2">
                ההתחברות מתבצעת באמצעות Google; שינוי סיסמה אינו זמין באתר. ניתן לנהל סיסמאות דרך חשבון Google.
              </p>
            </div>

            <div className="pt-2">
              <button type="submit" className="bg-gold text-black-lux px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors">
                שמור שינויים
              </button>
              {saved && <span className="text-gold ml-4">נשמר</span>}
            </div>
          </form>

          {/* Gift Card Balance Check Section */}
          <div className="mt-8 bg-black/90 rounded-lg shadow-luxury border-2 border-gold/30 p-6">
            <h2 className="text-2xl font-bold text-gold mb-4 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
              <Gift className="w-6 h-6 text-gold" />
              בדיקת יתרת Gift Card
            </h2>
            <p className="text-gold/80 mb-4 text-sm">הכנס את קוד ה-Gift Card שלך כדי לבדוק את היתרה הנשארת</p>
            
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && checkGiftCardBalance()}
                  className="w-full border border-gold/30 bg-black/50 rounded-lg px-4 py-3 text-gold placeholder-gold/50 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                  placeholder="הכנס קוד Gift Card (לדוגמה: GC-ABC123)"
                  dir="ltr"
                />
              </div>
              <button
                onClick={checkGiftCardBalance}
                disabled={giftCardLoading}
                className="bg-gold text-black-lux px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {giftCardLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black-lux"></div>
                    <span>בודק...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>בדוק יתרה</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {giftCardError && (
              <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-red-300">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">{giftCardError}</span>
                </div>
              </div>
            )}

            {/* Gift Card Info */}
            {giftCardInfo && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg border border-gold/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gold">קוד Gift Card:</span>
                    <code className="bg-black/50 px-3 py-1 rounded font-mono text-lg font-bold text-gold border border-gold/30">
                      {giftCardInfo.code}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg mb-3 border border-gold/20">
                    <span className="font-semibold text-gold flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gold" />
                      יתרה נשארת:
                    </span>
                    <span className={`text-2xl font-bold ${Number(giftCardInfo.balance) > 0 ? 'text-gold' : 'text-red-400'}`}>
                      ₪{Number(giftCardInfo.balance).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* הודעה כש-Gift Card שומש עד תומו */}
                  {Number(giftCardInfo.balance) === 0 && (
                    <div className="mb-3 p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg">
                      <div className="flex items-center gap-2 text-red-300">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold">כרטיס זה שומש עד תומו ואין אפשרות להשתמש בו</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg mb-3 border border-gold/20">
                    <span className="font-semibold text-gold">סכום התחלתי:</span>
                    <span className="text-lg font-bold text-gold">
                      ₪{Number(giftCardInfo.initial_amount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg mb-3 border border-gold/20">
                    <span className="font-semibold text-gold">סטטוס:</span>
                    {(() => {
                      const balance = Number(giftCardInfo.balance) || 0;
                      const isActive = giftCardInfo.status === 'active' && !giftCardInfo.isExpired && balance > 0;
                      const isUsed = giftCardInfo.status === 'used' || balance <= 0;
                      const isExpired = giftCardInfo.status === 'expired' || giftCardInfo.isExpired;
                      const isDisabled = giftCardInfo.status === 'disabled' || giftCardInfo.status === 'inactive';
                      
                      let statusDisplay = 'פעיל';
                      if (isUsed) {
                        statusDisplay = 'משומש / לא פעיל';
                      } else if (isExpired) {
                        statusDisplay = 'פג תוקף';
                      } else if (isDisabled) {
                        statusDisplay = 'לא פעיל';
                      } else if (isActive) {
                        statusDisplay = 'פעיל';
                      } else {
                        statusDisplay = giftCardInfo.status;
                      }
                      
                      return (
                        <span className={`flex items-center gap-2 font-bold ${
                          isActive ? 'text-gold' : 'text-red-400'
                        }`}>
                          {isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          {statusDisplay}
                        </span>
                      );
                    })()}
                  </div>

                  {giftCardInfo.expires_at && (
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gold/20">
                      <span className="font-semibold text-gold flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        תאריך תפוגה:
                      </span>
                      <span className={`text-lg font-bold ${
                        giftCardInfo.isExpired ? 'text-red-400' : 'text-gold'
                      }`}>
                        {new Date(giftCardInfo.expires_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                    <p className="text-sm text-gold/90">
                      <strong>💡 איך להשתמש:</strong> בעת ביצוע הזמנה, הכנס את קוד ה-Gift Card בשדה המתאים והסכום יופחת אוטומטית מהתשלום.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loyalty Club Section */}
          <div className="mt-8 bg-black/90 rounded-lg shadow-luxury border-2 border-gold/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-bold text-gold" style={{ fontFamily: 'serif' }}>
                מועדון לקוחות LUXCERA
              </h2>
            </div>
            
            {clubLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
                <p className="text-gold/80">בודק חברות במועדון...</p>
              </div>
            ) : isClubMember ? (
              <ClubDashboard userEmail={email} />
            ) : (
              <ClubJoinForm userEmail={email} onJoined={handleClubJoined} />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}


