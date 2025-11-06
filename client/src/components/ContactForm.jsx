import React from 'react';
import { Phone } from 'lucide-react';

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

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
  );
}

function ContactForm() {
  const [model, setModel] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    message: ""
  });
  const [status, setStatus] = React.useState({ sending: false, ok: null, error: "" });

  const validate = () => {
    if (!model.fullName || model.fullName.trim().length < 2) return 'שם מלא חובה (מינ׳ 2 תווים)';
    if (model.fullName.trim().length > 100) return 'שם יכול להכיל עד 100 תווים';

    const hasEmail = !!model.email?.trim();
    const hasPhone = !!model.phone?.trim();
    if (!hasEmail && !hasPhone) return 'חובה למלא אימייל או טלפון אחד לפחות';

    if (hasEmail && !/^\S+@\S+\.\S+$/.test(model.email.trim())) return 'אימייל לא תקין';

    if (hasPhone) {
      const digitsOnly = model.phone.replace(/\D/g, '');
      if (digitsOnly.length < 8) return 'טלפון חייב להכיל לפחות 8 ספרות';
    }

    if (!model.message || model.message.trim().length < 3) return 'הודעה חובה (מינ׳ 3 תווים)';
    if (model.message.trim().length > 2000) return 'הודעה יכולה להכיל עד 2000 תווים';

    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setStatus({ sending: false, ok: false, error: validationError });
      return;
    }

    setStatus({ sending: true, ok: null, error: "" });
    try {
      // קבל CSRF token לפני שליחת הבקשה
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(getApiUrl('/api/contact'), {
        method: 'POST',
        credentials: 'include', // חובה כדי לשלוח עוגיות
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // שולח את הטוקן בכותרת
        },
        body: JSON.stringify({
          ...model,
          email: model.email.trim() || undefined,
          phone: model.phone.trim() || undefined,
        }),
      });

      // ייתכן ושרת מחזיר non-JSON בשגיאה → מגן
      let data = { ok: false, error: 'שגיאה' };
      try {
        data = await res.json();
      } catch {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      if (res.ok && data?.ok) {
        setStatus({ sending: false, ok: true, error: "" });
        setModel({ fullName: "", email: "", phone: "", message: "" });
      } else {
        setStatus({ sending: false, ok: false, error: data?.error || 'שגיאה' });
      }
    } catch (err) {
      setStatus({ sending: false, ok: false, error: 'שגיאת רשת' });
    }
  };

  return (
    <Section id="הזמנה" className="py-20 bg-ivory">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">יצירת קשר</h2>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                className="w-full border border-sage/40 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                placeholder="שם מלא *"
                required
                value={model.fullName}
                onChange={e => setModel({ ...model, fullName: e.target.value })}
                aria-label="שם מלא"
              />
            </div>
            <div>
              <input
                className="w-full border border-sage/40 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
                type="email"
                placeholder="אימייל"
                value={model.email}
                onChange={e => setModel({ ...model, email: e.target.value })}
                aria-label="אימייל"
              />
            </div>
          </div>

          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
            type="tel"
            placeholder="טלפון"
            value={model.phone}
            onChange={e => setModel({ ...model, phone: e.target.value })}
            aria-label="טלפון"
          />

          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors resize-none"
            placeholder="הודעה *"
            required
            value={model.message}
            onChange={e => setModel({ ...model, message: e.target.value })}
            aria-label="הודעה"
          />

          <button
            type="submit"
            disabled={status.sending}
            className="w-full bg-black hover:bg-black-lux text-gold px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed border border-gold/20"
          >
            {status.sending ? 'שולח…' : 'שלח הודעה'}
          </button>

          {status.ok && <div className="text-green-600 text-sm text-center" role="status">ההודעה נשלחה. נחזור אליך בהקדם 🙏</div>}
          {status.ok === false && <div className="text-red-600 text-sm text-center" role="alert">שגיאה בשליחה: {status.error}</div>}
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4 text-sm">או פנו ישירות בוואטסאפ:</p>
          <a
            href={`https://wa.me/972546998603?text=${encodeURIComponent("היי LUXCERA, אשמח להזמנה/התאמה אישית 🙏")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-black hover:bg-black-lux text-gold px-6 py-3 rounded-lg font-semibold transition-colors border border-gold/20"
          >
            <Phone className="w-5 h-5" />
            וואטסאפ LUXCERA
          </a>
        </div>
      </div>
    </Section>
  );
}

export default ContactForm;

