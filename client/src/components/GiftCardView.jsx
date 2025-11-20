import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';

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

export default function GiftCardView({ code, onBack }) {
  const [giftCard, setGiftCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGiftCard = async () => {
      try {
        setLoading(true);
        const res = await fetch(getApiUrl(`/api/giftcards/${code}`));
        const data = await res.json();

        if (data.ok && data.giftCard) {
          setGiftCard(data.giftCard);
        } else {
          setError(data.error || 'Gift Card לא נמצא');
        }
      } catch (err) {
        setError('שגיאה בטעינת Gift Card');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchGiftCard();
    }
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6741] mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gift Card לא נמצא</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              חזרה לאתר
            </button>
          )}
        </div>
      </div>
    );
  }

  // Gift Card פעיל רק אם הסטטוס הוא 'active', לא פג תוקף, ויש יתרה גדולה מ-0
  // אם הסטטוס הוא 'used' או שהיתרה היא 0, זה לא פעיל
  const balance = Number(giftCard.balance) || 0;
  const isActive = giftCard.status === 'active' && !giftCard.isExpired && balance > 0;
  const isUsed = giftCard.status === 'used' || balance <= 0;
  
  const statusText = {
    active: isUsed ? 'משומש / לא פעיל' : 'פעיל',
    used: 'משומש / לא פעיל',
    expired: 'פג תוקף',
    cancelled: 'בוטל',
    disabled: 'לא פעיל',
    inactive: 'לא פעיל',
  };
  
  // אם היתרה היא 0 או הסטטוס הוא 'used', נציג "משומש / לא פעיל"
  const displayStatus = isUsed ? 'משומש / לא פעיל' : (statusText[giftCard.status] || giftCard.status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${isActive ? 'from-[#4A6741] to-[#5a7a51]' : 'from-gray-400 to-gray-500'} text-white p-6 text-center`}>
          <Gift className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Gift Card</h1>
          <code className="bg-white/20 px-4 py-2 rounded font-mono text-lg font-bold">
            {giftCard.code}
          </code>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-semibold text-gray-700">סטטוס:</span>
            <span className={`flex items-center gap-2 font-bold ${
              isActive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {displayStatus}
            </span>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              יתרה:
            </span>
            <span className={`text-2xl font-bold ${balance > 0 ? 'text-[#4A6741]' : 'text-red-600'}`}>
              ₪{Number(giftCard.balance).toFixed(2)}
            </span>
          </div>
          
          {/* הודעה כש-Gift Card שומש עד תומו */}
          {balance === 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-5 h-5" />
                <span className="font-bold">כרטיס זה שומש עד תומו ואין אפשרות להשתמש בו</span>
              </div>
            </div>
          )}

          {/* Initial Amount */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <span className="font-semibold text-gray-700">סכום התחלתי:</span>
            <span className="text-lg font-bold text-gray-900">
              ₪{Number(giftCard.initial_amount).toFixed(2)}
            </span>
          </div>

          {/* Expiry Date */}
          {giftCard.expires_at && (
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                תאריך תפוגה:
              </span>
              <span className={`text-lg font-bold ${
                giftCard.isExpired ? 'text-red-600' : 'text-gray-900'
              }`}>
                {new Date(giftCard.expires_at).toLocaleDateString('he-IL')}
              </span>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 איך להשתמש:</strong> בעת ביצוע הזמנה, הכנס את קוד ה-Gift Card בשדה המתאים
              והסכום יופחת אוטומטית מהתשלום.
            </p>
          </div>

          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="w-full mt-4 bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              חזרה לאתר
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

