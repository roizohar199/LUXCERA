/**
 * App Context - Global State Management
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

// Helper to get CSRF token
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

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // טעינת מצב התחברות מ-localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('luxcera_isLoggedIn') === 'true';
    }
    return false;
  });
  
  const [userEmail, setUserEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('luxcera_userEmail') || null;
    }
    return null;
  });
  
  const [user, setUser] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [handleAddToCart, setHandleAddToCart] = useState(null);
  const [onLoginRequired, setOnLoginRequired] = useState(null); // Callback לפתיחת מודאל הרשמה
  
  // עגלה - למשתמשים מחוברים מהשרת, למשתמשים לא מחוברים מ-localStorage
  const [cart, setCart] = useState(() => {
    // טעינה ראשונית מ-localStorage למשתמשים לא מחוברים
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('luxcera_cart');
        if (savedCart) {
          return JSON.parse(savedCart);
        }
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }
    }
    return [];
  });
  const [cartLoading, setCartLoading] = useState(false);
  
  // Gift Card ו-Promo Code amounts - state גלובלי לעדכון בכל הדפים
  const [giftCardAmount, setGiftCardAmount] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState(null);
  const [promoAmount, setPromoAmount] = useState(0);
  const [promoGiftToken, setPromoGiftToken] = useState(null);
  
  // טעינת עגלה מהשרת אם המשתמש מחובר
  // חשוב: תמיד דריסה, לא merge - זה Source of Truth יחיד
  // חשוב: לא טוענים מחדש כשהמודאל התשלום פתוח כדי למנוע כפילות
  useEffect(() => {
    const loadCartFromServer = async () => {
      // בדיקה אם המודאל התשלום פתוח - אם כן, לא טוענים מחדש
      // זה מונע כפילות כשהמודאל נסגר
      const checkoutModalOpen = document.querySelector('[data-checkout-modal]')?.getAttribute('data-open') === 'true';
      if (checkoutModalOpen) {
        console.log('[AppContext] Checkout modal is open, skipping cart reload to prevent duplication');
        return;
      }
      
      if (!isLoggedIn || !userEmail) {
        // אם המשתמש לא מחובר, טוענים מ-localStorage
        // דריסה מלאה - לא merge
        if (typeof window !== 'undefined') {
          try {
            const savedCart = localStorage.getItem('luxcera_cart');
            if (savedCart) {
              const parsed = JSON.parse(savedCart);
              // דריסה מלאה - לא [...prev, ...parsed]
              // בדיקה שהקרט לא כפול לפני הטעינה
              const uniqueCart = parsed.filter((item, index, self) => 
                index === self.findIndex((t) => t.id === item.id)
              );
              setCart(uniqueCart);
            } else {
              setCart([]);
            }
          } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            setCart([]);
          }
        } else {
          setCart([]);
        }
        return;
      }
      
      try {
        setCartLoading(true);
        const response = await fetch(getApiUrl('/api/cart'), {
          credentials: 'include',
          headers: {
            'X-User-Email': userEmail,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.cart) {
            // דריסה מלאה מהשרת - לא merge
            // בדיקה שהקרט לא כפול לפני הטעינה
            const uniqueCart = data.cart.filter((item, index, self) => 
              index === self.findIndex((t) => t.id === item.id)
            );
            setCart(uniqueCart);
          } else {
            setCart([]);
          }
        } else {
          console.error('Failed to load cart from server');
          setCart([]);
        }
      } catch (error) {
        console.error('Error loading cart from server:', error);
        setCart([]);
      } finally {
        setCartLoading(false);
      }
    };
    
    loadCartFromServer();
  }, [isLoggedIn, userEmail]);
  
  // שמירת עגלה לשרת אם המשתמש מחובר
  const saveCartToServer = useCallback(async (cartItems) => {
    if (!isLoggedIn || !userEmail) {
      return; // לא שומרים עגלה אם המשתמש לא מחובר
    }
    
    try {
      const csrfToken = await getCsrfToken();
      
      // Clear existing cart first
      await fetch(getApiUrl('/api/cart/clear'), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-User-Email': userEmail,
        },
      });
      
      // Add all items
      for (const item of cartItems) {
        await fetch(getApiUrl('/api/cart/add'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'X-User-Email': userEmail,
          },
          body: JSON.stringify({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            imageUrl: item.imageUrl,
            category: item.category,
          }),
        });
      }
    } catch (error) {
      console.error('Error saving cart to server:', error);
    }
  }, [isLoggedIn, userEmail]);

  // Cart management
  const removeFromCart = useCallback(async (id) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.id !== id);
      
      // Save to server if logged in
      if (isLoggedIn && userEmail) {
        saveCartToServer(newCart).catch(console.error);
      } else {
        // שמירה ב-localStorage למשתמשים לא מחוברים
        if (typeof window !== 'undefined') {
          try {
            if (newCart.length > 0) {
              localStorage.setItem('luxcera_cart', JSON.stringify(newCart));
            } else {
              localStorage.removeItem('luxcera_cart');
            }
          } catch (e) {
            console.error('Error saving cart to localStorage:', e);
          }
        }
      }
      
      return newCart;
    });
  }, [isLoggedIn, userEmail, saveCartToServer]);

  const addToCart = useCallback(async (item) => {
    // בדיקה אם המשתמש מחובר
    if (!isLoggedIn) {
      // אם המשתמש לא מחובר, שומרים ב-localStorage
      // חשוב: לא מכפילים - בודקים אם הפריט כבר קיים
      setCart((prev) => {
        // בדיקה שהפריט לא קיים כבר (לפי id)
        const existing = prev.find((i) => i.id === item.id);
        const newCart = existing
          ? prev.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
            )
          : [...prev, { ...item, quantity: item.quantity || 1 }];
        
        // שמירה ב-localStorage - דריסה מלאה
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('luxcera_cart', JSON.stringify(newCart));
          } catch (e) {
            console.error('Error saving cart to localStorage:', e);
          }
        }
        
        return newCart;
      });
      
      // אם יש callback לפתיחת מודאל - נקרא לו
      if (onLoginRequired) {
        onLoginRequired();
      }
      return true;
    }
    
    // למשתמשים מחוברים - עדכון העגלה
    setCart((prev) => {
      // בדיקה שהפריט לא קיים כבר (לפי id)
      const existing = prev.find((i) => i.id === item.id);
      const newCart = existing
        ? prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
          )
        : [...prev, { ...item, quantity: item.quantity || 1 }];
      
      // Save to server if logged in
      if (isLoggedIn && userEmail) {
        saveCartToServer(newCart).catch(console.error);
      }
      
      return newCart;
    });
    return true;
  }, [isLoggedIn, userEmail, saveCartToServer, onLoginRequired]);

  const updateCartQuantity = useCallback(async (id, quantity) => {
    setCart((prev) => {
      const newCart = quantity <= 0
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) => (item.id === id ? { ...item, quantity } : item));
      
      // Save to server if logged in
      if (isLoggedIn && userEmail) {
        saveCartToServer(newCart).catch(console.error);
      } else {
        // שמירה ב-localStorage למשתמשים לא מחוברים
        if (typeof window !== 'undefined') {
          try {
            if (newCart.length > 0) {
              localStorage.setItem('luxcera_cart', JSON.stringify(newCart));
            } else {
              localStorage.removeItem('luxcera_cart');
            }
          } catch (e) {
            console.error('Error saving cart to localStorage:', e);
          }
        }
      }
      
      return newCart;
    });
  }, [isLoggedIn, userEmail, saveCartToServer]);

  const clearCart = useCallback(async () => {
    console.log('[AppContext] Clearing cart');
    setCart([]);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('luxcera_cart');
        console.log('[AppContext] Cart cleared from localStorage');
      } catch (e) {
        console.error('Error clearing cart from localStorage:', e);
      }
    }
    
    // Clear from server if logged in
    if (isLoggedIn && userEmail) {
      try {
        const csrfToken = await getCsrfToken();
        await fetch(getApiUrl('/api/cart/clear'), {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'X-User-Email': userEmail,
          },
        });
        console.log('[AppContext] Cart cleared from server');
      } catch (error) {
        console.error('Error clearing cart from server:', error);
      }
    }
  }, [isLoggedIn, userEmail]);

  const getCartCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  // פונקציה לחישוב סכום סופי עם הנחות
  const getFinalTotal = useCallback((shippingFee = 0) => {
    const subtotal = getCartTotal();
    const total = subtotal + shippingFee - giftCardAmount - promoAmount;
    return Math.max(0, total); // לא פחות מ-0
  }, [getCartTotal, giftCardAmount, promoAmount]);

  // פונקציות לעדכון הנחות
  const applyGiftCard = useCallback((data) => {
    setGiftCardAmount(data.applied || 0);
    setGiftCardCode(data.code || null);
  }, []);

  const applyPromoCode = useCallback((applied, token) => {
    setPromoAmount(applied || 0);
    setPromoGiftToken(token || null);
  }, []);

  const clearDiscounts = useCallback(() => {
    setGiftCardAmount(0);
    setGiftCardCode(null);
    setPromoAmount(0);
    setPromoGiftToken(null);
  }, []);

  // Modal management
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openAccountModal = useCallback(() => setIsAccountModalOpen(true), []);
  const closeAccountModal = useCallback(() => setIsAccountModalOpen(false), []);

  // User management
  const login = useCallback((userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    if (userData?.email) {
      setUserEmail(userData.email);
      localStorage.setItem('luxcera_userEmail', userData.email);
    }
    localStorage.setItem('luxcera_isLoggedIn', 'true');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    setUserEmail(null);
    setCart([]); // מרוקנים את העגלה בהתנתקות
    clearDiscounts(); // מנקים גם הנחות בהתנתקות
    localStorage.removeItem('luxcera_isLoggedIn');
    localStorage.removeItem('luxcera_userEmail');
    localStorage.removeItem('luxcera_userName');
  }, [clearDiscounts]);

  const value = {
    // Cart
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartTotal,
    getFinalTotal,
    isCartOpen,
    openCart,
    closeCart,
    cartLoading,
    
    // Discounts
    giftCardAmount,
    giftCardCode,
    promoAmount,
    promoGiftToken,
    applyGiftCard,
    applyPromoCode,
    clearDiscounts,
    
    // User
    user,
    isLoggedIn,
    userEmail,
    login,
    logout,
    
    // Modals
    isAccountModalOpen,
    openAccountModal,
    closeAccountModal,
    
    // Products
    allProducts,
    setAllProducts,
    handleAddToCart,
    setHandleAddToCart,
    
    // Login required callback
    onLoginRequired,
    setOnLoginRequired,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
