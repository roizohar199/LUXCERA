import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClubJoin } from '../api/club';

interface Props {
  onJoined: () => void;
  userEmail: string;
}

const ClubJoinForm: React.FC<Props> = ({ onJoined, userEmail }) => {
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // הסר כל מה שאינו ספרה
    
    // אם יש לפחות 3 ספרות, הוסף מקף אחרי 3 ספרות
    if (value.length >= 3) {
      value = value.substring(0, 3) + '-' + value.substring(3, 10);
    }
    
    setPhone(value);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // בדיקת ולידציה
    if (!birthday || birthday.trim() === '') {
      setError('אנא הזן תאריך לידה');
      return;
    }
    
    if (!phone || phone.trim() === '') {
      setError('אנא הזן מספר טלפון');
      return;
    }
    
    // בדיקת פורמט טלפון (05x-xxxxxxx או 0xx-xxxxxxx)
    const phonePattern = /^0[0-9]{1,2}-[0-9]{7}$/;
    if (!phonePattern.test(phone.trim())) {
      setError('אנא הזן מספר טלפון תקין בפורמט: 05x-xxxxxxx');
      return;
    }
    
    setLoading(true);
    
    try {
      await apiClubJoin({
        email: userEmail,
        birthday: birthday.trim(),
        phone: phone.trim(),
        marketingOptIn,
      });
      onJoined();
    } catch (err: any) {
      setError(err.message || 'משהו השתבש');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 border-2 border-gold/30 rounded-lg bg-white/90 shadow-lg flex flex-col gap-4"
      dir="rtl"
    >
      <h2 className="text-2xl font-bold text-gold text-center mb-2">הצטרפות למועדון LUXCERA</h2>
      <p className="text-sm text-gray-600 text-center mb-2">
        הצטרף למועדון והתחל לצבור נקודות בכל רכישה. מתנת הצטרפות: 50 ש"ח (מותנה בקנייה מעל 150 ש"ח)!
      </p>
      
      {/* מדרגות אחוזי הנחה */}
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-3">
        <h3 className="text-sm font-semibold text-gold mb-2 text-center">🎁 מדרגות אחוזי הנחה לפי רכישה</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-700">ברונזה:</span>
            <span className="font-semibold text-gold">3%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">כסף:</span>
            <span className="font-semibold text-gold">5%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">זהב:</span>
            <span className="font-semibold text-gold">7%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">פלטינום:</span>
            <span className="font-semibold text-gold">10%</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          ככל שתקנה יותר, תעלה במדרגות ותקבל אחוזי הנחה גבוהים יותר!
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center mb-1">
        על ידי הצטרפות למועדון, אתה מסכים ל
        <Link to="/loyalty-club-terms" className="text-gold hover:text-gold/80 underline mx-1">
          תנאי השימוש
        </Link>
        של מתנת ההצטרפות
      </p>
      <p className="text-xs text-gray-500 text-center mb-4">
        <span className="text-red-500">*</span> שדות חובה - נדרשים לשליחת מתנות בימי הולדת והטבות בלעדיות
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gold font-semibold">תאריך לידה <span className="text-red-500">*</span></span>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          required
          className="border border-gold/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gold font-semibold">טלפון <span className="text-red-500">*</span></span>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          required
          pattern="[0-9]{2,3}-[0-9]{7}"
          maxLength={11}
          className="border border-gold/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          placeholder="05x-xxxxxxx"
        />
      </label>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="w-4 h-4 text-gold rounded focus:ring-gold"
        />
        <span className="text-gray-700">אני מעוניין לקבל הטבות ועדכונים במייל / WhatsApp</span>
      </label>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors shadow-lg"
      >
        {loading ? 'מצטרף...' : 'הצטרף למועדון'}
      </button>
    </form>
  );
};

export default ClubJoinForm;

