// Base API URL helper - same logic as main app
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

export async function redeemGiftCard({ code, orderId, amountToApply }) {
  // Always fetch fresh CSRF token from server to ensure we have the correct signed token
  const getCsrfToken = async () => {
    try {
      const csrfRes = await fetch(getApiUrl('/api/csrf'), {
        method: 'GET',
        credentials: 'include', // Important: include cookies
      });
      
      if (!csrfRes.ok) {
        console.error('CSRF endpoint returned:', csrfRes.status);
        return null;
      }
      
      const csrfData = await csrfRes.json();
      const token = csrfData.csrfToken;
      
      if (!token) {
        console.error('No CSRF token in response:', csrfData);
        return null;
      }
      
      return token;
    } catch (err) {
      console.error('Failed to get CSRF token:', err);
      return null;
    }
  };

  const csrfToken = await getCsrfToken();
  
  if (!csrfToken) {
    throw new Error('לא ניתן לקבל אסימון אבטחה. אנא רענן את הדף ונסה שוב.');
  }
  
  let res;
  try {
    res = await fetch(getApiUrl('/api/giftcards/redeem'), {
      method: 'POST',
      credentials: 'include', // Important: include cookies (including _csrf cookie)
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ code, orderId, amountToApply }),
    });
  } catch (networkError) {
    // טיפול בשגיאות רשת (ECONNREFUSED, proxy errors, וכו')
    if (networkError.name === 'TypeError' || networkError.message.includes('fetch') || networkError.message.includes('ECONNREFUSED')) {
      throw new Error('השרת לא זמין כרגע. אנא ודא שהשרת רץ ונסה שוב. אם הבעיה נמשכת, צור קשר עם התמיכה.');
    }
    throw new Error('שגיאת רשת. אנא נסה שוב מאוחר יותר.');
  }

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch (parseError) {
      // אם לא ניתן לפרסר JSON, זה כנראה שגיאת שרת
      throw new Error(`השרת לא זמין (קוד ${res.status}). אנא ודא שהשרת רץ ונסה שוב.`);
    }
    throw new Error(errorData.error || `HTTP ${res.status}: Failed to redeem gift card`);
  }

  let data;
  try {
    data = await res.json();
  } catch (parseError) {
    throw new Error('השרת החזיר תגובה לא תקינה. אנא נסה שוב מאוחר יותר.');
  }
  
  if (!data.ok) {
    throw new Error(data.error || 'Failed to redeem gift card');
  }
  
  return data;
}

