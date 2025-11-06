import { useState } from "react";

// פונקציות עזר ל-API
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

const getCsrfToken = async () => {
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
};

export default function CustomCreationPage() {
  const [files, setFiles] = useState([]);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState({ sending: false, error: "" });
  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    purpose: "",
    dimensions: "",
    style: "",
    budget: "",
    colorPalette: "",
    materials: "",
    notes: "",
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ sending: true, error: "" });

    try {
      // קבל CSRF token לפני שליחת הבקשה
      const csrfToken = await getCsrfToken();

      const res = await fetch(getApiUrl('/api/custom-creation'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          ...formData,
          filesCount: files.length,
        }),
      });

      let data = { ok: false, error: 'שגיאה' };
      try {
        data = await res.json();
      } catch {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      if (res.ok && data?.ok) {
        setSent(true);
        setStatus({ sending: false, error: "" });
        // איפוס הטופס
        setFormData({
          fullName: "",
          contact: "",
          purpose: "",
          dimensions: "",
          style: "",
          budget: "",
          colorPalette: "",
          materials: "",
          notes: "",
        });
        setFiles([]);
      } else {
        setStatus({ sending: false, error: data?.error || 'שגיאה בשליחה' });
      }
    } catch (err) {
      console.error('Custom creation submission error:', err);
      setStatus({ sending: false, error: 'שגיאת רשת' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              יצירה בהתאמה אישית —{" "}
              <span className="underline decoration-purple-400 decoration-4 underline-offset-8">
                בדיוק כמו שדמיינת
              </span>
            </h1>
            <p className="mt-5 text-lg text-zinc-600">
              שלחו לנו השראה, מידות וחומרים מועדפים — ואנחנו נהפוך את הרעיון שלכם ליצירה חד-פעמית,
              עם ליווי מלא בכל שלב.
            </p>

            <ul className="mt-6 space-y-3 text-zinc-700">
              <li>• התאמה מלאה: צבע, מרקם, מידות וחריטות</li>
              <li>• חומרים איכותיים: אפוקסי, גבס, בטון עדין, שעווה</li>
              <li>• תהליך שקוף: סקיצה, אישור, ייצור, מסירה</li>
            </ul>

            <a
              href="#request-form"
              className="inline-flex mt-8 items-center rounded-xl border border-purple-500 px-5 py-3 font-semibold hover:bg-purple-50 transition"
            >
              בואו נתחיל תהליך מותאם
            </a>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-tr from-purple-100 to-amber-50 shadow-lg p-1">
              <div className="h-full w-full rounded-2xl bg-white grid place-items-center">
                <div className="text-center p-6">
                  <div className="text-7xl">🎨</div>
                  <div className="mt-3 font-bold text-xl">הדמיה ראשונית</div>
                  <div className="text-zinc-500 mt-1">
                    נשלח סקיצה/סימולציית צבע לאישור לפני הייצור.
                  </div>
                </div>
              </div>
            </div>
            <span className="absolute -bottom-5 -left-4 rotate-[-3deg] rounded-md bg-black text-white text-xs px-3 py-1 shadow">
              one-of-one
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6">
        <h2 className="text-3xl font-bold text-center mb-8">תמחור שקוף</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t: "Basic", d: "קטן/פשוט עד 20 ס״מ", p: "מ-₪180" },
            { t: "Custom+", d: "בינוני/שילוב חומרים", p: "מ-₪420" },
            { t: "Signature", d: "גדול/מותג/מורכב", p: "מ-₪1,200" },
          ].map((card) => (
            <div key={card.t} className="rounded-2xl border p-6 bg-white shadow-sm">
              <div className="font-extrabold text-2xl">{card.t}</div>
              <div className="text-zinc-500 mt-1">{card.d}</div>
              <div className="mt-4 text-purple-600 font-bold">{card.p}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-zinc-600 mt-6 text-sm">
          המחיר הסופי נקבע לפי חומרים, גודל, מורכבות, חריטות, הדפסות ולוחות זמנים מיוחדים.
        </p>
      </section>

      <section id="request-form" className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border bg-white p-6 md:p-10 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-extrabold">טופס בקשה ליצירה מותאמת</h2>
          <p className="text-zinc-500 mt-2">
            מלאו פרטים קצרים — וחוזרים אליכם בהצעת מחיר מהירה.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-700">
              קיבלנו! נחזור אליך בהקדם עם פרטים והצעת מחיר ❤️
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">שם מלא *</label>
                <input
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">ווטסאפ / אימייל *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 grid gap-5 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium">מטרה</label>
                  <select
                    className="mt-1 w-full rounded-xl border px-4 py-2"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  >
                    <option value="">בחר מטרה</option>
                    <option>מתנה</option>
                    <option>בית</option>
                    <option>אירוע</option>
                    <option>עסק</option>
                    <option>תצוגה/חלון ראווה</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">סגנון</label>
                  <select
                    className="mt-1 w-full rounded-xl border px-4 py-2"
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  >
                    <option value="">בחר סגנון</option>
                    <option>מינימליסטי</option>
                    <option>מודרני</option>
                    <option>אורגני/אמנותי</option>
                    <option>יוקרתי</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">טווח תקציב</label>
                  <select
                    className="mt-1 w-full rounded-xl border px-4 py-2"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  >
                    <option value="">בחר תקציב</option>
                    <option>עד ₪300</option>
                    <option>₪300–₪700</option>
                    <option>₪700–₪1,500</option>
                    <option>₪1,500+</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">מידות (אורך/רוחב/גובה/עובי)</label>
                <input
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                  placeholder='לדוגמה: 15×7×1.5 ס"מ'
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">פלטת צבעים</label>
                <input
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                  placeholder="לבן, קרם, שחור, זהב..."
                  value={formData.colorPalette}
                  onChange={(e) => setFormData({ ...formData, colorPalette: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">חומרים</label>
                <input
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                  placeholder="אפוקסי/גבס/בטון עדין/שעווה/שילוב"
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">הערות/חריטות/לוגו</label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-4 py-2"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">תמונות השראה (ניתן להעלות כמה)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="mt-1 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-white hover:file:bg-purple-700"
                />
                {files?.length > 0 && (
                  <div className="mt-2 text-xs text-zinc-500">{files.length} קבצים נבחרו</div>
                )}
              </div>

              {status.error && (
                <div className="md:col-span-2 text-red-600 text-sm text-center" role="alert">
                  {status.error}
                </div>
              )}

              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={status.sending}
                  className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status.sending ? 'שולח...' : 'שלחו סקיצה וקבלו הצעה'}
                </button>
                <span className="text-zinc-500 text-sm">מענה מהיר בין 24–48 שעות</span>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">איך זה עובד</h2>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            { step: '1', title: 'השראה והכוונה', desc: 'שולחים לנו תמונות/הסבר קצר ומה חשוב לך' },
            { step: '2', title: 'סקיצה + סימולציה', desc: 'נשלח הדמיה/סקיצה מהירה לאישור' },
            { step: '3', title: 'בחירת חומרים', desc: 'נמליץ על שילובים שיתנו יציבות ועמידות' },
            { step: '4', title: 'ייצור קפדני', desc: 'עבודה בשכבות, ייבוש מבוקר, ליטוש והגנה' },
            { step: '5', title: 'מסירה', desc: 'אריזה שמגנה על היצירה ומשלוח עד אליך' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-600">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-zinc-500 mt-8 text-sm">
          זמן אספקה משוער :5-14 ימי עסקים תלוי במורכבות וייבוש החומר.
        </p>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-zinc-500 text-center">
      </footer>
    </div>
  );
}

