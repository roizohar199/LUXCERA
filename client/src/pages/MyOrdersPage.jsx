import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import Footer from '../components/Footer';
import { Package, Calendar, MapPin, Phone, Mail, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';

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

function MyOrdersPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail } = useApp();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [userName, setUserName] = React.useState('');

  // טעינת שם משתמש מ-localStorage
  React.useEffect(() => {
    const savedUserName = localStorage.getItem('luxcera_userName');
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  // טעינת הזמנות מהשרת
  React.useEffect(() => {
    const loadOrders = async () => {
      if (!isLoggedIn || !userEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(getApiUrl(`/api/orders/user/${encodeURIComponent(userEmail)}`), {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.orders) {
            setOrders(data.orders);
          } else {
            setError('לא הצלחנו לטעון את ההזמנות');
          }
        } else {
          setError('שגיאה בטעינת ההזמנות');
        }
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('שגיאה בטעינת ההזמנות');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isLoggedIn, userEmail]);

  // אם המשתמש לא מחובר, הפנה לדף הבית
  if (!isLoggedIn) {
    return (
      <Layout
        onUserClick={() => navigate('/')}
        onSearchClick={() => navigate('/')}
        cartCount={0}
        isLoggedIn={false}
        userName=""
      >
        <div className="min-h-screen bg-ivory flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">נדרשת התחברות</h1>
            <p className="text-gray-600 mb-6">עליך להתחבר כדי לצפות בהזמנות שלך</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gold text-black-lux px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors"
            >
              חזרה לדף הבית
            </button>
          </div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPaymentMethod = (method) => {
    const methods = {
      bit: 'ביט',
      credit: 'כרטיס אשראי',
      cash: 'מזומן',
    };
    return methods[method] || method;
  };

  return (
    <Layout
      onUserClick={() => navigate('/')}
      onSearchClick={() => navigate('/')}
      cartCount={0}
      isLoggedIn={isLoggedIn}
      userName={userName}
    >
      <div className="min-h-screen bg-ivory pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span>חזרה לדף הבית</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
              הזמנות שלי
            </h1>
            <p className="text-gray-600">כל ההזמנות שביצעת באתר</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                <p className="text-gray-600">טוען הזמנות...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && orders.length === 0 && (
            <div className="bg-white rounded-lg shadow-luxury p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">אין הזמנות עדיין</h2>
              <p className="text-gray-600 mb-6">עדיין לא ביצעת הזמנות באתר</p>
              <button
                onClick={() => navigate('/')}
                className="bg-gold text-black-lux px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors"
              >
                התחל לקנות
              </button>
            </div>
          )}

          {/* Orders List */}
          {!loading && !error && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-luxury border-2 border-gold/20 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gold/10 to-transparent p-6 border-b border-gold/20">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-6 h-6 text-gold" />
                          <h2 className="text-2xl font-bold text-gray-900">
                            הזמנה #{order.id}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-3xl font-bold text-gold mb-1">
                          ₪{order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.itemCount} {order.itemCount === 1 ? 'פריט' : 'פריטים'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    {/* Shipping Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-gold" />
                          פרטי משלוח
                        </h3>
                        <div className="space-y-2 text-gray-700">
                          <p><strong>שם:</strong> {order.fullName}</p>
                          <p><strong>כתובת:</strong> {order.address}</p>
                          <p><strong>עיר:</strong> {order.city}</p>
                          {order.postalCode && (
                            <p><strong>מיקוד:</strong> {order.postalCode}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-gold" />
                          פרטי תשלום
                        </h3>
                        <div className="space-y-2 text-gray-700">
                          <p><strong>שיטת תשלום:</strong> {formatPaymentMethod(order.paymentMethod)}</p>
                          {order.giftCardAmount > 0 && (
                            <>
                              <p><strong>שימוש בגיפט קארד:</strong> ₪{order.giftCardAmount.toFixed(2)}</p>
                              {order.giftCardCode && (
                                <p className="text-sm text-gray-600">
                                  <strong>קוד:</strong> {order.giftCardCode}
                                </p>
                              )}
                            </>
                          )}
                          <p className="pt-2 border-t border-gray-200">
                            <strong>סה"כ:</strong> ₪{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-gold" />
                        <span>{order.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-gold" />
                        <span>{order.phone}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">פריטים בהזמנה</h3>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                          >
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                כמות: {item.quantity} | מחיר ליחידה: ₪{item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                ₪{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">הערות</h3>
                        <p className="text-gray-700">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  );
}

export default MyOrdersPage;

