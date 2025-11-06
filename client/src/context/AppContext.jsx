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
  
  // עגלה - רק למשתמשים מחוברים
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  
  // טעינת עגלה מהשרת אם המשתמש מחובר
  useEffect(() => {
    const loadCartFromServer = async () => {
      if (!isLoggedIn || !userEmail) {
        setCart([]);
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
            setCart(data.cart);
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
      }
      
      return newCart;
    });
  }, [isLoggedIn, userEmail, saveCartToServer]);

  const addToCart = useCallback(async (item) => {
    // בדיקה אם המשתמש מחובר
    if (!isLoggedIn) {
      // אם יש callback לפתיחת מודאל - נקרא לו
      if (onLoginRequired) {
        onLoginRequired();
      }
      // החזרת false כדי שהקומפוננטה יוכל לטפל בזה
      return false;
    }
    
    setCart((prev) => {
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
      }
      
      return newCart;
    });
  }, [isLoggedIn, userEmail, saveCartToServer]);

  const clearCart = useCallback(async () => {
    setCart([]);
    
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
      } catch (error) {
        console.error('Error clearing cart from server:', error);
      }
    }
  }, [isLoggedIn, userEmail]);

  const getCartCount = useCallback(() => {
    if (!isLoggedIn) return 0; // לא מציגים מספר פריטים למשתמשים לא מחוברים
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart, isLoggedIn]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

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
    localStorage.removeItem('luxcera_isLoggedIn');
    localStorage.removeItem('luxcera_userEmail');
    localStorage.removeItem('luxcera_userName');
  }, []);

  const value = {
    // Cart
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartTotal,
    isCartOpen,
    openCart,
    closeCart,
    cartLoading,
    
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
