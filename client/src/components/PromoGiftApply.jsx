import React, { useState } from 'react';

const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const envUrl = (import.meta?.env?.VITE_API_URL || '').trim();
  if (!envUrl) {
    return cleanPath; // Use proxy
  }
  let baseUrl = envUrl.replace(/\/+$/, '');
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  return `${baseUrl}${cleanPath}`;
};

function PromoGiftApply({ orderTotal, onApply }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState(null); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  // Get CSRF token
  const getCsrfToken = async () => {
    // First, try to get from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        const token = decodeURIComponent(value);
        if (token) return token;
      }
    }
    
    // If not in cookie, fetch it from the server
    try {
      const csrfRes = await fetch(getApiUrl('/api/csrf'), {
        credentials: 'include',
      });
      const csrfData = await csrfRes.json();
      return csrfData.csrfToken || null;
    } catch (err) {
      console.error('Failed to get CSRF token:', err);
      return null;
    }
  };

  const handleApply = async () => {
    if (!code.trim()) {
      setMsg('אנא הכנס קוד מבצע');
      setMsgType('error');
      return;
    }

    setLoading(true);
    setMsg(null);
    setMsgType(null);

    try {
      // קודם בודקים שזה קיים
      let checkRes;
      try {
        checkRes = await fetch(getApiUrl(`/api/promo-gifts/${code.trim()}`));
      } catch (networkError) {
        if (networkError.name === 'TypeError' || networkError.message.includes('fetch') || networkError.message.includes('ECONNREFUSED')) {
          setMsg('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
          setMsgType('error');
          setLoading(false);
          return;
        }
        throw networkError;
      }

      let checkData;
      try {
        checkData = await checkRes.json();
      } catch (parseError) {
        setMsg('השרת החזיר תגובה לא תקינה. אנא נסה שוב מאוחר יותר.');
        setMsgType('error');
        setLoading(false);
        return;
      }

      if (!checkRes.ok || !checkData.ok) {
        const errorMsg = checkData.error || 'קוד לא תקף';
        if (errorMsg.includes('לא זמין') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('proxy')) {
          setMsg('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
        } else {
          setMsg(errorMsg);
        }
        setMsgType('error');
        setLoading(false);
        return;
      }

      // עכשיו מממשים
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        setMsg('לא ניתן לקבל אסימון אבטחה. אנא רענן את הדף ונסה שוב.');
        setMsgType('error');
        setLoading(false);
        return;
      }

      let res;
      try {
        res = await fetch(getApiUrl(`/api/promo-gifts/${code.trim()}/redeem`), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ orderTotal }),
        });
      } catch (networkError) {
        if (networkError.name === 'TypeError' || networkError.message.includes('fetch') || networkError.message.includes('ECONNREFUSED')) {
          setMsg('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
          setMsgType('error');
          setLoading(false);
          return;
        }
        throw networkError;
      }

      if (!res.ok) {
        // טיפול בשגיאות שרת
        let errorMsg = 'לא ניתן לממש';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || `השרת לא זמין (קוד ${res.status})`;
        } catch (parseError) {
          errorMsg = `השרת לא זמין (קוד ${res.status}). אנא ודא שהשרת רץ ונסה שוב.`;
        }
        if (errorMsg.includes('לא זמין') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('proxy')) {
          setMsg('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
        } else {
          setMsg(errorMsg);
        }
        setMsgType('error');
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        setMsg('השרת החזיר תגובה לא תקינה. אנא נסה שוב מאוחר יותר.');
        setMsgType('error');
        setLoading(false);
        return;
      }

      if (!data.ok) {
        const errorMsg = data.error || 'לא ניתן לממש';
        // זיהוי שגיאות רשת
        if (errorMsg.includes('לא זמין') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('proxy')) {
          setMsg('⚠️ השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב.');
        } else {
          setMsg(errorMsg);
        }
        setMsgType('error');
      } else {
        // שולח גם את הסכום וגם את ה-token
        onApply?.(data.applied, code.trim());
        
        // הודעה מותאמת לפי מספר השימושים הנשארים
        const remainingUses = data.remainingUses !== undefined ? data.remainingUses : (data.max_uses - data.times_used);
        if (remainingUses === 0 || data.status === 'disabled') {
          setMsg(`קיבלת הנחה של ₪${data.applied.toFixed(2)} | ⚠️ קוד זה שומש עד תומו ואין אפשרות להשתמש בו שוב`);
        } else {
          setMsg(`קיבלת הנחה של ₪${data.applied.toFixed(2)}${remainingUses !== undefined ? ` | שימושים נשארים: ${remainingUses}` : ''}`);
        }
        setMsgType('success');
        // Clear code on success
        setCode('');
      }
    } catch (err) {
      setMsg('שגיאת רשת');
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
    <div className="promo-gift-box" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
        קוד מבצע / Gift 24h
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="הכנס קוד זמני"
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

export default PromoGiftApply;

