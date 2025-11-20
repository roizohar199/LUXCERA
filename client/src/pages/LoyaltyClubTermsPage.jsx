import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Footer from '../components/Footer';
import Layout from '../components/Layout';
import { ArrowRight } from 'lucide-react';

function LoyaltyClubTermsPage() {
  const navigate = useNavigate();
  const { getCartCount, isLoggedIn } = useApp();
  
  const [userName, setUserName] = React.useState('');
  React.useEffect(() => {
    const savedUserName = localStorage.getItem('luxcera_userName');
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);
  
  const handleUserClick = () => navigate('/');
  const handleSearchClick = () => navigate('/');

  return (
    <Layout 
      onUserClick={handleUserClick}
      onSearchClick={handleSearchClick}
      cartCount={getCartCount()}
      isLoggedIn={isLoggedIn}
      userName={userName}
    >
      <div className="min-h-screen bg-ivory pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span>חזרה לדף הבית</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
              תנאי שימוש – מועדון הלקוחות LUXCERA
            </h1>
            <p className="text-gray-600 text-lg">
              כללי הצטרפות, צבירה ומימוש נקודות במועדון הלקוחות
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-luxury border-2 border-gold/20 p-8 space-y-6" dir="rtl">
            {/* מערכת המדרגות */}
            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                מערכת מדרגות מועדון הלקוחות
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                מועדון הלקוחות של LUXCERA פועל במערכת מדרגות המבוססת על סכום הקניות המצטבר שלכם באתר. 
                ככל שתצברו יותר קניות, כך תעלו במדרגות ותזכו לאחוז צבירה גבוה יותר של נקודות.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">טבלת המדרגות:</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-[#CD7F32] pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg" style={{ color: '#CD7F32' }}>מדרגת ברונזה</h4>
                      <span className="text-sm text-gray-600">3% צבירה</span>
                    </div>
                    <p className="text-gray-700">סכום קניות מצטבר: 0-499 ₪</p>
                    <p className="text-sm text-gray-600 mt-1">
                      כל לקוח חדש מתחיל במדרגת ברונזה. על כל 100 ₪ רכישה תצברו 3 נקודות (שווי 3 ₪).
                    </p>
                  </div>

                  <div className="border-l-4 border-[#C0C0C0] pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg" style={{ color: '#C0C0C0' }}>מדרגת כסף</h4>
                      <span className="text-sm text-gray-600">5% צבירה</span>
                    </div>
                    <p className="text-gray-700">סכום קניות מצטבר: 500-1,499 ₪</p>
                    <p className="text-sm text-gray-600 mt-1">
                      כשתגיעו ל-500 ₪ רכישות מצטברות, תעלו למדרגת כסף. על כל 100 ₪ רכישה תצברו 5 נקודות (שווי 5 ₪).
                    </p>
                  </div>

                  <div className="border-l-4 border-[#FFD700] pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg" style={{ color: '#FFD700' }}>מדרגת זהב</h4>
                      <span className="text-sm text-gray-600">7% צבירה</span>
                    </div>
                    <p className="text-gray-700">סכום קניות מצטבר: 1,500-3,999 ₪</p>
                    <p className="text-sm text-gray-600 mt-1">
                      כשתגיעו ל-1,500 ₪ רכישות מצטברות, תעלו למדרגת זהב. על כל 100 ₪ רכישה תצברו 7 נקודות (שווי 7 ₪).
                    </p>
                  </div>

                  <div className="border-l-4 border-[#E5E4E2] pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg" style={{ color: '#E5E4E2' }}>מדרגת פלטינום</h4>
                      <span className="text-sm text-gray-600">10% צבירה</span>
                    </div>
                    <p className="text-gray-700">סכום קניות מצטבר: 4,000 ₪ ומעלה</p>
                    <p className="text-sm text-gray-600 mt-1">
                      כשתגיעו ל-4,000 ₪ רכישות מצטברות, תעלו למדרגת פלטינום - המדרגה הגבוהה ביותר. 
                      על כל 100 ₪ רכישה תצברו 10 נקודות (שווי 10 ₪).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 חשוב לדעת:</strong> המדרגה מחושבת לפי סכום הקניות המצטבר שלכם (total_spent) 
                  ולא לפי מספר הרכישות. כל רכישה מעדכנת את הסכום המצטבר שלכם ומחושבת בהתאם למדרגה הנוכחית שלכם.
                </p>
              </div>
            </section>

            {/* בונוס קפיצת מדרגה */}
            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                בונוס קפיצת מדרגה
              </h2>
              <p className="text-gray-700 leading-relaxed">
                כאשר תעלו מדרגה אחת למדרגה גבוהה יותר (למשל מכסף לזהב), תקבלו בונוס חד-פעמי של 100 נקודות 
                (שווי 100 ₪) שיתווסף לחשבון הנקודות שלכם אוטומטית.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                הבונוס ניתן רק פעם אחת לכל קפיצת מדרגה ואינו ניתן לצבירה חוזרת.
              </p>
            </section>

            {/* הטבת הצטרפות */}
            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                מתנת הצטרפות למועדון
              </h2>
              <p className="text-gray-700 leading-relaxed">
                כל לקוח הנרשם למועדון הלקוחות של LUXCERA זכאי לקבל מתנת הצטרפות בשווי 50 ₪ (50 נקודות).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                תנאים לקבלת מתנת הצטרפות
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                מתנת ההצטרפות תינתן רק לאחר ביצוע רכישה ראשונה בסכום של 150 ₪ ומעלה (לאחר הנחות אחרות ולפני עלות משלוח).
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                <li>המתנה תינתן רק ברכישה אחת - לא ניתן לצבור רכישות קטנות יותר.</li>
                <li>המתנה תקפה ל-30 ימים ממועד ההצטרפות למועדון.</li>
                <li>אם לא בוצעה רכישה של 150 ₪ ומעלה תוך 30 ימים, המתנה תתבטל.</li>
              </ul>
            </section>

            {/* צבירת נקודות */}
            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                איך צוברים נקודות?
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                נקודות נצברות אוטומטית לאחר כל רכישה מוצלחת באתר, לפי המדרגה הנוכחית שלכם:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                <li>הנקודות מחושבות לפי סכום ההזמנה הסופי (לאחר הנחות Gift Card, קופונים וכו', אך לפני מימוש נקודות).</li>
                <li>הנקודות מתווספות לחשבון שלכם אוטומטית לאחר אישור ההזמנה ותשלום מלא.</li>
                <li>כל נקודה שווה 1 ₪ הנחה בעתיד.</li>
                <li>הנקודות נשמרות בחשבון שלכם ללא תאריך תפוגה.</li>
              </ul>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-800">
                  <strong>📊 דוגמה לחישוב:</strong> אם אתם במדרגת זהב (7% צבירה) וביצעתם רכישה של 500 ₪, 
                  תצברו 35 נקודות (500 × 0.07 = 35 נקודות = 35 ₪ הנחה עתידית).
                </p>
              </div>
            </section>

            {/* מימוש נקודות */}
            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                מימוש נקודות - מדרגות מימוש
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                מימוש הנקודות מתבצע בעת ביצוע הזמנה בדף התשלום המאובטח בלבד. 
                לא ניתן לממש נקודות מדף הפרופיל - רק בתהליך התשלום.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-900 mb-3">מדרגות מימוש נקודות לפי סכום ההזמנה:</h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>עד ₪149:</strong> לא ניתן לממש נקודות</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>מ-₪150 עד ₪299:</strong> ניתן לממש עד 50 נקודות (50 ₪ הנחה)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>מ-₪300 עד ₪499:</strong> ניתן לממש עד 150 נקודות (150 ₪ הנחה)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>מ-₪500 ומעלה:</strong> ניתן לממש עד 300 נקודות (300 ₪ הנחה)</span>
                  </li>
                </ul>
              </div>

              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>חשוב:</strong> הסכום מחושב לפני מימוש הנקודות (אחרי הנחות Gift Card וקופונים).
              </p>

              <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                <li>לא ניתן לממש נקודות מעבר לסכום ההזמנה הסופי.</li>
                <li>לא ניתן לממש נקודות בהזמנות מתחת ל-150 ₪.</li>
                <li>מימוש הנקודות מתבצע רק לאחר השלמת כל תהליך התשלום - לא לפני.</li>
                <li>לאחר מימוש נקודות, הן יקוזזו מהחשבון שלכם ולא ניתן להחזירן.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                מימוש מתנת הצטרפות
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                <li>מתנת ההצטרפות ניתנת למימוש פעם אחת בלבד עבור כל משתמש/חשבון.</li>
                <li>המתנה מקוזזת מסך העסקה בקופה אוטומטית בעת ביצוע הרכישה הראשונה של 150 ₪ ומעלה.</li>
                <li>לא ניתן לפצל את שווי המתנה או לעשות בה שימוש חלקי.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                תוקף מתנת הצטרפות ונקודות
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>מתנת הצטרפות:</strong> שובר ההצטרפות תקף ל-30 ימים ממועד ההצטרפות למועדון, 
                אלא אם צוין אחרת באתר או בעדכון רשמי מטעם LUXCERA.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>נקודות מועדון:</strong> נקודות שצברתם במועדון הלקוחות נשמרות ללא תאריך תפוגה 
                וניתן לממש אותן בכל עת, בכפוף למדרגות המימוש המפורטות לעיל. 
                הנקודות לא יפוגו ולא יבוטלו, אלא אם יוחלט על כך מטעם LUXCERA או במקרים של שימוש לא תקין.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                אי-המרה לכסף
              </h2>
              <p className="text-gray-700 leading-relaxed">
                ההטבה אינה ניתנת להמרה לכסף מזומן, זיכוי או החזר. במקרה של ביטול עסקה — ההטבה לא תזוכה מחדש.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                שימוש אחד ללקוח
              </h2>
              <p className="text-gray-700 leading-relaxed">
                ההטבה ניתנת לשימוש ללקוח אחד בלבד, בהתאם לפרטי ההרשמה (שם, מייל ומספר טלפון).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                שילוב עם מבצעים אחרים
              </h2>
              <p className="text-gray-700 leading-relaxed">
                ההטבה אינה ניתנת לשילוב עם קופונים אחרים, שוברים, הטבות הצטרפות נוספות או מבצעים מיוחדים, אלא אם צוין אחרת במפורש.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                זכאות
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                <li>דורש הרשמה למועדון הלקוחות ואימות פרטים בסיסיים.</li>
                <li>LUXCERA רשאית לבטל או לשלול את ההטבה במקרים של שימוש לא תקין, רישום כפול או חשד להונאה.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>
                שינויים ועדכונים
              </h2>
              <p className="text-gray-700 leading-relaxed">
                LUXCERA שומרת לעצמה את הזכות לעדכן, לשנות או לבטל את תנאי ההטבה בכל עת, ללא הודעה מוקדמת.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}

export default LoyaltyClubTermsPage;

