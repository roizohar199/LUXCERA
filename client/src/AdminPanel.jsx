/**
 * Admin Panel - CMS for managing products
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LogOut, Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon,
  Eye, EyeOff, AlertCircle, CheckCircle, Loader, Gift, Package
} from 'lucide-react';

// Base API URL - same logic as main app
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

function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'giftcards', or 'promogifts'
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    salePrice: '',
    imageUrl: '',
    category: 'sets',
    isActive: true,
  });
  
  // Gift Cards state
  const [giftCardFormData, setGiftCardFormData] = useState({
    initial_amount: '',
    expires_at: '',
    assigned_to: '',
    currency: 'ILS',
  });
  const [giftCards, setGiftCards] = useState([]);
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);
  const [createdGiftCard, setCreatedGiftCard] = useState(null); // לשמירת Gift Card שנוצר
  const [giftCardFilter, setGiftCardFilter] = useState('active'); // 'active', 'used', 'expired', 'all'
  
  // Promo Gifts state
  const [promoGiftFormData, setPromoGiftFormData] = useState({
    amount: '',
    hours: '24',
    max_uses: '1',
    currency: 'ILS',
    note: '',
  });
  const [promoGifts, setPromoGifts] = useState([]);
  const [loadingPromoGifts, setLoadingPromoGifts] = useState(false);
  const [createdPromoGift, setCreatedPromoGift] = useState(null);
  const [promoGiftFilter, setPromoGiftFilter] = useState('active');

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Try to fetch products as auth check
      const res = await fetch(getApiUrl('/api/admin/products'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsAuthenticated(true);
        loadProducts(token);
        if (activeTab === 'giftcards') {
          loadGiftCards(token);
        }
        if (activeTab === 'promogifts') {
          loadPromoGifts(token);
        }
      } else {
        localStorage.removeItem('adminToken');
        setLoading(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setLoading(false);
    }
  };
  
  // Load gift cards
  const loadGiftCards = async (token, status = 'active') => {
    setLoadingGiftCards(true);
    try {
      // אם status הוא 'all', נשלח ?status=all כדי שהשרת יבין שאנחנו רוצים הכל
      const urlParams = status === 'all' ? '?status=all' : `?status=${status}`;
      const url = getApiUrl(`/api/giftcards${urlParams}`);
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setGiftCards(data.giftCards || []);
        }
      } else {
        console.error('Failed to load gift cards:', res.statusText);
      }
    } catch (err) {
      console.error('Failed to load gift cards:', err);
    } finally {
      setLoadingGiftCards(false);
    }
  };
  
  // Create gift card
  const handleCreateGiftCard = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    if (!giftCardFormData.initial_amount || Number(giftCardFormData.initial_amount) <= 0) {
      alert('סכום חייב להיות גדול מ-0');
      return;
    }
    
    try {
      // Get CSRF token
      const csrfRes = await fetch(getApiUrl('/api/csrf'), {
        credentials: 'include',
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      
      const res = await fetch(getApiUrl('/api/giftcards'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          initial_amount: Number(giftCardFormData.initial_amount),
          expires_at: giftCardFormData.expires_at || null,
          assigned_to: giftCardFormData.assigned_to || null,
          currency: giftCardFormData.currency || 'ILS',
        }),
      });
      
      const data = await res.json();
      
      if (data.ok && data.giftCard) {
        // שמירת Gift Card שנוצר להצגה
        setCreatedGiftCard(data.giftCard);
        
        // יצירת קישור לשיתוף
        const shareUrl = `${window.location.origin}/giftcard/${data.giftCard.code}`;
        
        // ניסיון להעתיק את הקישור ל-clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert(`✅ Gift Card נוצר בהצלחה!\n\nקוד: ${data.giftCard.code}\nסכום: ₪${data.giftCard.initial_amount}\nיתרה: ₪${data.giftCard.balance}\n\nהקישור הועתק ללוח!`);
        } catch (err) {
          // אם clipboard לא עובד, רק להציג את הקישור
          alert(`✅ Gift Card נוצר בהצלחה!\n\nקוד: ${data.giftCard.code}\nסכום: ₪${data.giftCard.initial_amount}\nיתרה: ₪${data.giftCard.balance}\n\nקישור לשיתוף:\n${shareUrl}`);
        }
        
        setGiftCardFormData({
          initial_amount: '',
          expires_at: '',
          assigned_to: '',
          currency: 'ILS',
        });
        
        // רענון הרשימה לאחר יצירה
        await loadGiftCards(token, giftCardFilter);
      } else {
        alert(data.error || 'שגיאה ביצירת Gift Card');
      }
    } catch (err) {
      alert('שגיאה: ' + err.message);
    }
  };
  
  // Load gift cards when tab changes or filter changes
  useEffect(() => {
    if (isAuthenticated && activeTab === 'giftcards') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        loadGiftCards(token, giftCardFilter);
      }
    }
  }, [activeTab, isAuthenticated, giftCardFilter]);

  // Load promo gifts
  const loadPromoGifts = async (token, status = 'active') => {
    setLoadingPromoGifts(true);
    try {
      const urlParams = status === 'all' ? '?status=all' : `?status=${status}`;
      const url = getApiUrl(`/api/promo-gifts${urlParams}`);
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setPromoGifts(data.promoGifts || []);
        }
      } else {
        console.error('Failed to load promo gifts:', res.statusText);
      }
    } catch (err) {
      console.error('Failed to load promo gifts:', err);
    } finally {
      setLoadingPromoGifts(false);
    }
  };

  // Create promo gift
  const handleCreatePromoGift = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    if (!promoGiftFormData.amount || Number(promoGiftFormData.amount) <= 0) {
      alert('סכום חייב להיות גדול מ-0');
      return;
    }
    
    try {
      // Get CSRF token
      const csrfRes = await fetch(getApiUrl('/api/csrf'), {
        credentials: 'include',
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      
      const res = await fetch(getApiUrl('/api/promo-gifts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(promoGiftFormData.amount),
          hours: Number(promoGiftFormData.hours) || 24,
          max_uses: Number(promoGiftFormData.max_uses) || 1,
          currency: promoGiftFormData.currency || 'ILS',
          note: promoGiftFormData.note || null,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok && data.token) {
        const createdData = {
          token: data.token,
          link: data.link || `/promo/${data.token}`,
          expires_at: data.expires_at,
          amount: data.amount || Number(promoGiftFormData.amount),
        };
        setCreatedPromoGift(createdData);
        
        const shareUrl = `${window.location.origin}${createdData.link}`;
        
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert(`✅ Promo Gift נוצר בהצלחה!\n\nקוד: ${data.token}\nסכום: ₪${createdData.amount.toFixed(2)}\nתוקף: ${promoGiftFormData.hours} שעות\n\nהקישור הועתק ללוח!`);
        } catch (err) {
          alert(`✅ Promo Gift נוצר בהצלחה!\n\nקוד: ${data.token}\nסכום: ₪${createdData.amount.toFixed(2)}\nתוקף: ${promoGiftFormData.hours} שעות\n\nקישור: ${shareUrl}`);
        }
        
        setPromoGiftFormData({
          amount: '',
          hours: '24',
          max_uses: '1',
          currency: 'ILS',
          note: '',
        });
        
        await loadPromoGifts(token, promoGiftFilter);
      } else {
        alert(data.error || 'שגיאה ביצירת Promo Gift');
      }
    } catch (err) {
      alert('שגיאה: ' + err.message);
    }
  };

  // Load promo gifts when tab changes
  useEffect(() => {
    if (isAuthenticated && activeTab === 'promogifts') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        loadPromoGifts(token, promoGiftFilter);
      }
    }
  }, [activeTab, isAuthenticated, promoGiftFilter]);

  const loadProducts = async (token) => {
    try {
      const res = await fetch(getApiUrl('/api/admin/products'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        loadProducts(data.token);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setProducts([]);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch(getApiUrl('/api/admin/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      const data = await res.json();
      if (data.ok) {
        // The server returns a relative URL like /uploads/filename.jpg
        // We'll store it as-is, and it will be resolved correctly when displayed
        const imageUrl = data.url.startsWith('/') ? data.url : '/' + data.url;
        setFormData(prev => ({ ...prev, imageUrl: imageUrl }));
        setUploading(false);
        return imageUrl;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
      setUploading(false);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    // Client-side validation
    if (!formData.title || !formData.title.trim()) {
      alert('שדה שם המוצר (title) הוא חובה');
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      alert('שדה מחיר הוא חובה וחייב להיות מספר');
      return;
    }
    if (!formData.imageUrl || !formData.imageUrl.trim()) {
      alert('שדה תמונת מוצר הוא חובה');
      return;
    }

    try {
      const url = editingProduct
        ? getApiUrl(`/api/admin/products/${editingProduct.id}`)
        : getApiUrl('/api/admin/products');
      const method = editingProduct ? 'PUT' : 'POST';

      // Clean imageUrl - remove trailing slashes and normalize
      let imageUrl = formData.imageUrl.trim();
      if (imageUrl.endsWith('/')) {
        imageUrl = imageUrl.slice(0, -1);
      }
      // If it's a relative path, ensure it starts with /
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = '/' + imageUrl;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          price: parseFloat(formData.price),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          imageUrl: imageUrl,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadProducts(token);
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
          title: '',
          description: '',
          price: '',
          salePrice: '',
          imageUrl: '',
          category: 'sets',
          isActive: true,
        });
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      salePrice: product.salePrice ? product.salePrice.toString() : '',
      imageUrl: product.imageUrl,
      category: product.category || 'sets',
      isActive: product.isActive === 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(getApiUrl(`/api/admin/products/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await loadProducts(token);
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">ניהול LUXCERA</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם משתמש</label>
              <input
                type="text"
                name="username"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סיסמה</label>
              <input
                type="password"
                name="password"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#4A6741] hover:bg-[#5a7a51] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              התחבר
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-500 text-center">ברירת מחדל: admin / admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ניהול LUXCERA</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            התנתק
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'products'
                  ? 'border-[#4A6741] text-[#4A6741]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-5 h-5 inline mr-2" />
              מוצרים
            </button>
            <button
              onClick={() => setActiveTab('giftcards')}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'giftcards'
                  ? 'border-[#4A6741] text-[#4A6741]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Gift className="w-5 h-5 inline mr-2" />
              Gift Cards
            </button>
            <button
              onClick={() => setActiveTab('promogifts')}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'promogifts'
                  ? 'border-[#4A6741] text-[#4A6741]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Gift className="w-5 h-5 inline mr-2" />
              Promo Gifts (מבצעים)
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' ? (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">מוצרים ({products.length})</h2>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                title: '',
                description: '',
                price: '',
                salePrice: '',
                imageUrl: '',
                category: 'sets',
                isActive: true,
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-[#4A6741] hover:bg-[#5a7a51] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            הוסף מוצר חדש
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProduct ? 'ערוך מוצר' : 'מוצר חדש'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם המוצר *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                  >
                    <option value="sets">מארזים</option>
                    <option value="fireplace">נרות אח</option>
                    <option value="wax-pearls">פניני שעווה</option>
                    <option value="accessories">אביזרים</option>
                    <option value="general">כללי</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מחיר (₪) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">מחיר מבצע (₪)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תמונת מוצר *</label>
                <p className="text-xs text-gray-500 mb-3">
                  <strong>פורמט מומלץ:</strong> JPG, PNG או WEBP | <strong>רזולוציה מומלצת:</strong> 1200x1200 פיקסלים (ריבוע) | <strong>גודל מקסימלי:</strong> 5MB
                </p>
                <div className="flex gap-4">
                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="URL של התמונה או העלה קובץ"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                  />
                  <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-5 h-5 text-gray-600" />
                    {uploading ? 'מעלה...' : 'העלה קובץ'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                      }}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl.startsWith('http') ? formData.imageUrl : getApiUrl(formData.imageUrl)}
                    alt="Preview"
                    className="mt-2 w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      // If image fails to load, try with relative path
                      if (!formData.imageUrl.startsWith('/')) {
                        e.target.src = '/' + formData.imageUrl;
                      }
                    }}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#4A6741] rounded focus:ring-[#4A6741]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  מוצר פעיל (יופיע באתר)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#4A6741] hover:bg-[#5a7a51] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingProduct ? 'עדכן' : 'שמור'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                  }}
                />
                {product.isActive === 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    לא פעיל
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                <div className="mb-3">
                  {product.salePrice && product.salePrice > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-semibold text-sm">מבצע:</span>
                        <span className="text-red-600 text-lg font-bold">₪{Number(product.salePrice).toFixed(2)}</span>
                      </div>
                      <span className="text-gray-400 text-sm line-through">₪{Number(product.price).toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">₪{Number(product.price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    ערוך
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex items-center justify-center gap-1 border border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">אין מוצרים עדיין. הוסף מוצר ראשון!</p>
          </div>
        )}
          </>
        ) : activeTab === 'giftcards' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">יצירת Gift Card חדש</h2>
              
              <form onSubmit={handleCreateGiftCard} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סכום (₪) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={giftCardFormData.initial_amount}
                      onChange={(e) => setGiftCardFormData({ ...giftCardFormData, initial_amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                      placeholder="100.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      מטבע
                    </label>
                    <select
                      value={giftCardFormData.currency}
                      onChange={(e) => setGiftCardFormData({ ...giftCardFormData, currency: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                    >
                      <option value="ILS">₪ ILS (שקל)</option>
                      <option value="USD">$ USD (דולר)</option>
                      <option value="EUR">€ EUR (יורו)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      תאריך תפוגה (אופציונלי)
                    </label>
                    <input
                      type="date"
                      value={giftCardFormData.expires_at}
                      onChange={(e) => setGiftCardFormData({ ...giftCardFormData, expires_at: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                    />
                    <p className="text-xs text-gray-500 mt-1">אם לא יוזן, Gift Card לא יפוג</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      משויך ללקוח (ID) (אופציונלי)
                    </label>
                    <input
                      type="number"
                      value={giftCardFormData.assigned_to}
                      onChange={(e) => setGiftCardFormData({ ...giftCardFormData, assigned_to: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                      placeholder="מספר ID של הלקוח"
                    />
                    <p className="text-xs text-gray-500 mt-1">אם לא יוזן, Gift Card יהיה כללי</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#4A6741] hover:bg-[#5a7a51] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    צור Gift Card
                  </button>
                </div>
              </form>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 טיפ:</strong> לאחר יצירת Gift Card, הקוד והקישור יוצגו למטה. העתק את הקישור ושלח ללקוח.
                  הקוד ייווצר אוטומטית בפורמט: <code className="bg-blue-100 px-2 py-1 rounded">GC-XXXXXXXX</code>
                </p>
              </div>
            </div>
            
            {/* הצגת Gift Card שנוצר */}
            {createdGiftCard && (
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">✅ Gift Card נוצר בהצלחה!</h3>
                  <button
                    onClick={() => setCreatedGiftCard(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">קוד:</span>
                    <code className="bg-gray-100 px-3 py-1 rounded font-mono text-lg font-bold text-[#4A6741]">
                      {createdGiftCard.code}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">סכום:</span>
                    <span className="text-lg font-bold text-gray-900">₪{Number(createdGiftCard.initial_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">יתרה:</span>
                    <span className="text-lg font-bold text-gray-900">₪{Number(createdGiftCard.balance).toFixed(2)}</span>
                  </div>
                  {createdGiftCard.expires_at && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">תאריך תפוגה:</span>
                      <span className="text-gray-900">
                        {new Date(createdGiftCard.expires_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קישור לשיתוף:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/giftcard/${createdGiftCard.code}`}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-gray-50 font-mono text-sm"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const url = `${window.location.origin}/giftcard/${createdGiftCard.code}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          alert('✅ הקישור הועתק ללוח!');
                        } catch (err) {
                          // Fallback - select the text
                          const input = document.querySelector('input[readonly]');
                          if (input) {
                            input.select();
                            document.execCommand('copy');
                            alert('✅ הקישור הועתק ללוח!');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-[#4A6741] hover:bg-[#5a7a51] text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                    >
                      העתק קישור
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    הלקוח יוכל לפתוח את הקישור כדי לראות את פרטי ה-Gift Card ולהשתמש בו בקופה
                  </p>
                </div>
              </div>
            )}
            
            {/* רשימת Gift Cards פעילים */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gift Cards ({giftCards.length})
                </h2>
                <div className="flex gap-2 items-center">
                  <select
                    value={giftCardFilter}
                    onChange={(e) => {
                      setGiftCardFilter(e.target.value);
                      const token = localStorage.getItem('adminToken');
                      if (token) {
                        loadGiftCards(token, e.target.value);
                      }
                    }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                  >
                    <option value="active">פעילים</option>
                    <option value="used">משומשים</option>
                    <option value="expired">פגי תוקף</option>
                    <option value="cancelled">מבוטלים</option>
                    <option value="all">הכל</option>
                  </select>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('adminToken');
                      if (token) {
                        loadGiftCards(token, giftCardFilter);
                      }
                    }}
                    className="text-sm text-[#4A6741] hover:text-[#5a7a51] font-semibold"
                  >
                    רענן
                  </button>
                </div>
              </div>
              
              {loadingGiftCards ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-gray-600 mx-auto" />
                </div>
              ) : giftCards.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">אין Gift Cards פעילים</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">קוד</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">סכום התחלתי</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">יתרה</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">סטטוס</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">תאריך תפוגה</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">נוצר ב</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {giftCards.map((card) => (
                        <tr key={card.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm font-bold text-[#4A6741]">
                              {card.code}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-gray-900">₪{Number(card.initial_amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-900 font-semibold">₪{Number(card.balance).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              card.status === 'active' ? 'bg-green-100 text-green-800' :
                              card.status === 'used' ? 'bg-gray-100 text-gray-800' :
                              card.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {card.status === 'active' ? 'פעיל' :
                               card.status === 'used' ? 'משומש' :
                               card.status === 'expired' ? 'פג תוקף' :
                               card.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {card.expires_at 
                              ? new Date(card.expires_at).toLocaleDateString('he-IL')
                              : 'ללא תפוגה'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-sm">
                            {new Date(card.issued_at).toLocaleDateString('he-IL')}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/giftcard/${card.code}`;
                                navigator.clipboard.writeText(url).then(() => {
                                  alert(`✅ הקישור הועתק: ${url}`);
                                }).catch(() => {
                                  alert(`קישור: ${url}`);
                                });
                              }}
                              className="text-sm text-[#4A6741] hover:text-[#5a7a51] font-semibold"
                              title="העתק קישור"
                            >
                              📋
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'promogifts' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">יצירת Promo Gift חדש</h2>
              
              <form onSubmit={handleCreatePromoGift} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סכום הנחה (₪) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={promoGiftFormData.amount}
                      onChange={(e) => setPromoGiftFormData({ ...promoGiftFormData, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                      placeholder="50.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      מטבע
                    </label>
                    <select
                      value={promoGiftFormData.currency}
                      onChange={(e) => setPromoGiftFormData({ ...promoGiftFormData, currency: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                    >
                      <option value="ILS">₪ ILS (שקל)</option>
                      <option value="USD">$ USD (דולר)</option>
                      <option value="EUR">€ EUR (יורו)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      תוקף (שעות) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={promoGiftFormData.hours}
                      onChange={(e) => setPromoGiftFormData({ ...promoGiftFormData, hours: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                      placeholder="24"
                    />
                    <p className="text-xs text-gray-500 mt-1">כמה שעות הקוד יהיה תקף</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      מספר שימושים מקסימלי *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={promoGiftFormData.max_uses}
                      onChange={(e) => setPromoGiftFormData({ ...promoGiftFormData, max_uses: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">1 = חד פעמי, 10 = 10 פעמים וכו'</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    הערה (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={promoGiftFormData.note}
                    onChange={(e) => setPromoGiftFormData({ ...promoGiftFormData, note: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                    placeholder="למשל: מבצע פייסבוק נובמבר"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#4A6741] hover:bg-[#5a7a51] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    צור Promo Gift
                  </button>
                </div>
              </form>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 טיפ:</strong> Promo Gift הוא קופון מבצע זמני. הקוד ייווצר בפורמט: <code className="bg-blue-100 px-2 py-1 rounded">PG-XXXXXXXX</code>
                  הקוד פג תוקף אחרי מספר השעות שצוין, או אחרי מספר השימושים המקסימלי.
                </p>
              </div>
            </div>
            
            {/* הצגת Promo Gift שנוצר */}
            {createdPromoGift && (
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">✅ Promo Gift נוצר בהצלחה!</h3>
                  <button
                    onClick={() => setCreatedPromoGift(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">קוד:</span>
                    <code className="bg-gray-100 px-3 py-1 rounded font-mono text-lg font-bold text-[#4A6741]">
                      {createdPromoGift.token}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">סכום הנחה:</span>
                    <span className="text-lg font-bold text-gray-900">₪{Number(createdPromoGift.amount).toFixed(2)}</span>
                  </div>
                  {createdPromoGift.expires_at && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">תאריך תפוגה:</span>
                      <span className="text-gray-900">
                        {new Date(createdPromoGift.expires_at).toLocaleDateString('he-IL', { 
                          year: 'numeric', 
                          month: 'numeric', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קישור לשיתוף:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}${createdPromoGift.link}`}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-gray-50 font-mono text-sm"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const url = `${window.location.origin}${createdPromoGift.link}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          alert('✅ הקישור הועתק ללוח!');
                        } catch (err) {
                          const input = document.querySelector('input[readonly]');
                          if (input) {
                            input.select();
                            document.execCommand('copy');
                            alert('✅ הקישור הועתק ללוח!');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-[#4A6741] hover:bg-[#5a7a51] text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                    >
                      העתק קישור
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    הלקוח יוכל להשתמש בקוד הזה בדף התשלום בשדה "קוד מבצע / Gift 24h"
                  </p>
                </div>
              </div>
            )}
            
            {/* רשימת Promo Gifts */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Promo Gifts ({promoGifts.length})
                </h2>
                <div className="flex gap-2 items-center">
                  <select
                    value={promoGiftFilter}
                    onChange={(e) => {
                      setPromoGiftFilter(e.target.value);
                      const token = localStorage.getItem('adminToken');
                      if (token) {
                        loadPromoGifts(token, e.target.value);
                      }
                    }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 text-gray-900 focus:outline-none focus:border-[#4A6741]"
                  >
                    <option value="active">פעילים</option>
                    <option value="expired">פגי תוקף</option>
                    <option value="disabled">מבוטלים</option>
                    <option value="all">הכל</option>
                  </select>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('adminToken');
                      if (token) {
                        loadPromoGifts(token, promoGiftFilter);
                      }
                    }}
                    className="text-sm text-[#4A6741] hover:text-[#5a7a51] font-semibold"
                  >
                    רענן
                  </button>
                </div>
              </div>
              
              {loadingPromoGifts ? (
                <div className="text-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-gray-600 mx-auto" />
                </div>
              ) : promoGifts.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">אין Promo Gifts</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">קוד</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">סכום הנחה</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">שימושים</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">סטטוס</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">תאריך תפוגה</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {promoGifts.map((promo) => (
                        <tr key={promo.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm font-bold text-[#4A6741]">
                              {promo.token}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-gray-900">₪{Number(promo.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-900">
                            {promo.times_used} / {promo.max_uses}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              promo.status === 'active' ? 'bg-green-100 text-green-800' :
                              promo.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {promo.status === 'active' ? 'פעיל' :
                               promo.status === 'expired' ? 'פג תוקף' :
                               'מבוטל'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {new Date(promo.expires_at).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/promo/${promo.token}`;
                                navigator.clipboard.writeText(url).then(() => {
                                  alert(`✅ הקישור הועתק: ${url}`);
                                }).catch(() => {
                                  alert(`קישור: ${url}`);
                                });
                              }}
                              className="text-sm text-[#4A6741] hover:text-[#5a7a51] font-semibold"
                              title="העתק קישור"
                            >
                              📋
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default AdminPanel;
