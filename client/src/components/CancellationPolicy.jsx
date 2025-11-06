import React from 'react';

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
  );
}

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

function CancellationPolicy() {
  const [formData, setFormData] = React.useState({
    fullName: '',
    idNumber: '',
    orderNumber: '',
    reason: '',
  });
  const [status, setStatus] = React.useState({ sending: false, ok: null, error: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ sending: true, ok: null, error: '' });

    if (!formData.fullName || !formData.idNumber || !formData.orderNumber) {
      setStatus({ sending: false, ok: false, error: 'אנא מלא את כל השדות הנדרשים' });
      return;
    }

    try {
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(getApiUrl('/api/contact'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: '',
          phone: '',
          category: 'ביטול עסקה',
          message: `בקשה לביטול עסקה\n\nשם מלא: ${formData.fullName}\nמספר תעודת זהות: ${formData.idNumber}\nמספר הזמנה: ${formData.orderNumber}\nסיבת ביטול: ${formData.reason || 'לא צוין'}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.ok) {
        setStatus({ sending: false, ok: true, error: '' });
        setFormData({ fullName: '', idNumber: '', orderNumber: '', reason: '' });
      } else {
        setStatus({ sending: false, ok: false, error: data?.error || 'שגיאה בשליחת הבקשה' });
      }
    } catch (err) {
      setStatus({ sending: false, ok: false, error: 'שגיאת רשת' });
    }
  };

  return (
    <Section id="ביטול-עסקה" className="py-20 bg-ivory">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'serif' }}>ביטול עסקה</h2>
        
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-6 text-gray-700 leading-relaxed mb-8">
          <p>
            LUXCERA מאפשרת ללקוחותיה לבטל עסקה שבוצעה באתר האינטרנט, בהתאם להוראות הדין ולמדיניות החברה כמפורט להלן.
          </p>
          <p>
            ביטול עסקה יתבצע בכפוף להוראות חוק הגנת הצרכן, התשמ"א–1981, ולתיקון 47 לחוק (סעיף 14ג1), וכן בכפוף לתקנון האתר ולתנאי הרכישה של המוצר.
          </p>

          <div className="bg-blue-50 border-r-4 border-blue-500 rounded-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">לקוחות המשתייכים לאחת מהקבוצות הבאות:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>אזרחים ותיקים (מגיל 65 ומעלה)</li>
              <li>עולים חדשים</li>
              <li>אנשים עם מוגבלות</li>
            </ul>
            <p className="mt-4 text-gray-700">
              יהיו רשאים לבטל עסקה תוך עד ארבעה חודשים ממועד ביצוע העסקה, וזאת בתנאי שההתקשרות עם החברה נעשתה בשיחה בין העוסק לצרכן — לרבות שיחה באמצעי תקשורת אלקטרוניים.
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">דרכי ביטול עסקה</h3>
            <p className="mb-4">ניתן להודיע על ביטול העסקה באחת מהדרכים הבאות:</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">בהודעת וואטסאפ:</p>
                  <a href="https://wa.me/972546998603" target="_blank" rel="noopener noreferrer" className="text-[#40E0D0] hover:underline">
                    אל מספר 054-6998603
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">באימייל:</p>
                  <a href="mailto:luxcera777@gmail.com" className="text-[#40E0D0] hover:underline">
                    luxcera777@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">🌐</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">באמצעות האתר:</p>
                  <p className="text-gray-700">באמצעות מילוי ושליחת טופס ביטול העסקה המופיע למטה.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-r-4 border-yellow-500 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">בהודעת הביטול יש לכלול את הפרטים הבאים:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>שם מלא</li>
                <li>מספר תעודת זהות</li>
                <li>פרטי העסקה או מספר ההזמנה</li>
              </ul>
            </div>

            <p className="mt-6 text-gray-700">
              החברה תטפל בבקשת הביטול בהתאם לחוק ולמדיניותה, ותמסור ללקוח אישור על קבלת ההודעה ועל ביצוע הביטול.
            </p>
          </div>
        </div>

        {/* טופס ביטול עסקה */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">טופס ביטול עסקה</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full border border-sage/40 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                placeholder="הזן שם מלא"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מספר תעודת זהות *</label>
              <input
                type="text"
                required
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full border border-sage/40 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                placeholder="הזן מספר תעודת זהות"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מספר הזמנה *</label>
              <input
                type="text"
                required
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full border border-sage/40 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                placeholder="הזן מספר הזמנה"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סיבת ביטול (אופציונלי)</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="w-full border border-sage/40 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                placeholder="אנא פרט את סיבת הביטול (אופציונלי)"
              />
            </div>

            {status.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {status.error}
              </div>
            )}

            {status.ok && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                הבקשה נשלחה בהצלחה! נטפל בבקשתך בהקדם ונשלח לך אישור.
              </div>
            )}

            <button
              type="submit"
              disabled={status.sending}
              className="w-full bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status.sending ? 'שולח...' : 'שלח בקשה לביטול עסקה'}
            </button>
          </form>
        </div>
      </div>
    </Section>
  );
}

export default CancellationPolicy;

