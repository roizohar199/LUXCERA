import React, { useState } from 'react';
import { redeemGiftCard } from '../api/giftcards.js';

function GiftCardApply({ orderTotal, onApply }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState(null); // 'success' or 'error'

  const handleApply = async () => {
    if (!code.trim()) {
      setMsg('אנא הכנס קוד Gift Card');
      setMsgType('error');
      return;
    }

    setLoading(true);
    setMsg(null);
    setMsgType(null);

    try {
      const data = await redeemGiftCard({
        code: code.trim(),
        amountToApply: orderTotal,
      });

      // מחזיר: { applied, balance, status }
      onApply?.({ 
        applied: data.applied, 
        balance: data.balance, 
        code: code.trim() 
      });
      
      // הודעה מותאמת לפי היתרה
      if (Number(data.balance) === 0) {
        setMsg(`שויך בהצלחה: ₪${data.applied.toFixed(2)} | ⚠️ כרטיס זה שומש עד תומו ואין אפשרות להשתמש בו שוב`);
      } else {
        setMsg(`שויך בהצלחה: ₪${data.applied.toFixed(2)} | יתרה נשארה: ₪${data.balance.toFixed(2)}`);
      }
      setMsgType('success');
      
      // Clear code on success
      setCode('');
    } catch (err) {
      console.error('Gift Card redeem error:', err);
      const errorMessage = err.message || 'שגיאה במימוש Gift Card';
      
      // זיהוי סוגי שגיאות שונים
      if (errorMessage.includes('CSRF') || errorMessage.includes('403')) {
        setMsg('שגיאת אבטחה. אנא רענן את הדף ונסה שוב.');
      } else if (errorMessage.includes('לא זמין') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('proxy')) {
        setMsg('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב. אם הבעיה נמשכת, צור קשר עם התמיכה.');
      } else if (errorMessage.includes('רשת') || errorMessage.includes('network')) {
        setMsg('שגיאת רשת. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
      } else {
        setMsg(errorMessage);
      }
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="giftcard-box" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
        יש לך Gift Card?
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="הכנס קוד Gift Card"
          disabled={loading}
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
          onClick={handleApply}
          disabled={loading || !code.trim()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: loading ? '#ccc' : '#4A6741',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
          }}
        >
          {loading ? 'בודק...' : 'החל'}
        </button>
      </div>
      {msg && (
        <p
          style={{
            fontSize: '0.85rem',
            marginTop: '0.5rem',
            color: msgType === 'success' ? '#4A6741' : '#dc3545',
            fontWeight: msgType === 'success' ? '500' : 'normal',
          }}
        >
          {msg}
        </p>
      )}
    </div>
  );
}

export default GiftCardApply;
