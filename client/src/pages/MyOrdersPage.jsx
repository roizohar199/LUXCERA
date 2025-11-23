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

  // תאום מצב התחברות גם אם הגעת מהדף הראשי שלא משתמש ב-AppContext
  const storedIsLoggedIn = typeof window !== 'undefined' && localStorage.getItem('luxcera_isLoggedIn') === 'true';
  const storedEmail = typeof window !== 'undefined' ? (localStorage.getItem('luxcera_userEmail') || '') : '';
  const effectiveIsLoggedIn = isLoggedIn || storedIsLoggedIn;
  const emailToUse = userEmail || storedEmail;

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
      if (!effectiveIsLoggedIn || !emailToUse) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(getApiUrl(`/api/orders/user/${encodeURIComponent(emailToUse)}`), {
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
  }, [effectiveIsLoggedIn, emailToUse]);

  // אם המשתמש לא מחובר, הפנה לדף הבית
  if (!effectiveIsLoggedIn) {
    return (
      <Layout
        onUserClick={() => navigate('/')}
        onSearchClick={() => navigate('/')}
        cartCount={0}
        isLoggedIn={false}
        userName=""
      >
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gold mb-4" style={{ fontFamily: 'serif' }}>נדרשת התחברות</h1>
            <p className="text-gold/80 mb-6">עליך להתחבר כדי לצפות בהזמנות שלך</p>
            <button
              onClick={() => navigate('/')}
              className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 border-2 border-gold/50 rounded-lg shadow-lg hover:shadow-gold transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ArrowRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
              <span className="text-gold font-semibold text-lg relative z-10 group-hover:text-gold/90 transition-colors duration-300" style={{ fontFamily: 'serif' }}>
                חזרה לדף הבית
              </span>
              <div className="absolute -inset-1 bg-gold/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
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
      isLoggedIn={effectiveIsLoggedIn}
      userName={userName}
    >
      <div className="min-h-screen bg-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 border-2 border-gold/50 rounded-lg shadow-lg hover:shadow-gold transition-all duration-300 hover:scale-105 mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ArrowRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
              <span className="text-gold font-semibold text-lg relative z-10 group-hover:text-gold/90 transition-colors duration-300" style={{ fontFamily: 'serif' }}>
                חזרה לדף הבית
              </span>
              <div className="absolute -inset-1 bg-gold/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
            <h1 className="text-4xl font-bold text-gold mb-2" style={{ fontFamily: 'serif' }}>
              הזמנות שלי
            </h1>
            <p className="text-gold/80">כל ההזמנות שביצעת באתר</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                <p className="text-gold/80">טוען הזמנות...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && orders.length === 0 && (
            <div className="bg-black/90 rounded-lg shadow-luxury border-2 border-gold/30 p-12 text-center">
              <Package className="w-16 h-16 text-gold/60 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gold mb-2" style={{ fontFamily: 'serif' }}>אין הזמנות עדיין</h2>
              <p className="text-gold/80 mb-6">עדיין לא ביצעת הזמנות באתר</p>
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
                  className="bg-black/90 rounded-lg shadow-luxury border-2 border-gold/30 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gold/20 to-transparent p-6 border-b border-gold/30">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-6 h-6 text-gold" />
                          <h2 className="text-2xl font-bold text-gold" style={{ fontFamily: 'serif' }}>
                            הזמנה #{order.id}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 text-gold/80">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-3xl font-bold text-gold mb-1">
                          ₪{order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gold/80">
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
                        <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
                          <MapPin className="w-5 h-5 text-gold" />
                          פרטי משלוח
                        </h3>
                        <div className="space-y-2 text-gold/90">
                          <p><strong>שם:</strong> {order.fullName}</p>
                          <p><strong>כתובת:</strong> {order.address}</p>
                          <p><strong>עיר:</strong> {order.city}</p>
                          {order.postalCode && (
                            <p><strong>מיקוד:</strong> {order.postalCode}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
                          <CreditCard className="w-5 h-5 text-gold" />
                          פרטי תשלום
                        </h3>
                        <div className="space-y-2 text-gold/90">
                          <p><strong>שיטת תשלום:</strong> {formatPaymentMethod(order.paymentMethod)}</p>
                          {order.giftCardAmount > 0 && (
                            <>
                              <p><strong>שימוש בגיפט קארד:</strong> ₪{order.giftCardAmount.toFixed(2)}</p>
                              {order.giftCardCode && (
                                <p className="text-sm text-gold/70">
                                  <strong>קוד:</strong> {order.giftCardCode}
                                </p>
                              )}
                            </>
                          )}
                          <p className="pt-2 border-t border-gold/30">
                            <strong>סה"כ:</strong> ₪{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gold/30">
                      <div className="flex items-center gap-2 text-gold/90">
                        <Mail className="w-4 h-4 text-gold" />
                        <span>{order.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gold/90">
                        <Phone className="w-4 h-4 text-gold" />
                        <span>{order.phone}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-semibold text-gold mb-4" style={{ fontFamily: 'serif' }}>פריטים בהזמנה</h3>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 bg-black/50 rounded-lg border border-gold/20"
                          >
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-lg border border-gold/30"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gold mb-1">{item.name}</h4>
                              <p className="text-sm text-gold/80">
                                כמות: {item.quantity} | מחיר ליחידה: ₪{item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gold">
                                ₪{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mt-6 pt-6 border-t border-gold/30">
                        <h3 className="text-lg font-semibold text-gold mb-2" style={{ fontFamily: 'serif' }}>הערות</h3>
                        <p className="text-gold/90">{order.notes}</p>
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

