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
      const checkRes = await fetch(getApiUrl(`/api/promo-gifts/${code.trim()}`));
      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.ok) {
        setMsg(checkData.error || 'קוד לא תקף');
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

      const res = await fetch(getApiUrl(`/api/promo-gifts/${code.trim()}/redeem`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ orderTotal }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMsg(data.error || 'לא ניתן לממש');
        setMsgType('error');
      } else {
        onApply?.(data.applied);
        setMsg(`קיבלת הנחה של ₪${data.applied.toFixed(2)}`);
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

