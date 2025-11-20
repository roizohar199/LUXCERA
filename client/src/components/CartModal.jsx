import React from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

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

function CartModal({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout, isLoggedIn }) {
  const { getCartTotal, giftCardAmount, promoAmount, getFinalTotal } = useApp();
  
  if (!isOpen) return null;

  const cartTotal = getCartTotal();
  const finalTotal = getFinalTotal(0); // ללא משלוח במודאל העגלה
  const isEmpty = cart.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 flex flex-col" style={{ height: '90vh', maxHeight: '90vh' }}>
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">עגלת קניות</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900" aria-label="סגור">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-scroll p-6" style={{ flex: '1 1 auto', minHeight: 0, maxHeight: '100%' }}>
          {isEmpty ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">העגלה שלך ריקה</h3>
              {!isLoggedIn && (
                <p className="text-gray-600 mb-2">
                  יש לך חשבון?
                  <a href="#" className="underline font-medium hover:text-gray-900"> התחבר</a> כדי להזמין מהר יותר.
                </p>
              )}
              <button onClick={onClose} className="mt-6 w-full bg-gold hover:bg-gold/90 text-black-lux px-6 py-3 rounded-lg font-semibold transition-colors">
                המשך לקניות
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl.startsWith('http') ? item.imageUrl : getApiUrl(item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`)}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full ${item.color || 'bg-gray-300'}`}></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    {item.scent && <p className="text-gray-600 text-sm">{item.scent}</p>}
                    {item.giftCardEmail && (
                      <p className="text-gray-600 text-sm">Gift Card - {item.giftCardEmail}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 border border-sage/40 rounded-lg">
                        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100" aria-label="הפחת כמות">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100" aria-label="הוסף כמות">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700" aria-label="הסר פריט">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">₪{(Number(item.price) * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">₪{Number(item.price).toFixed(2)} ליחידה</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="border-t p-6 bg-white flex-shrink-0">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">סה"כ מוצרים</span>
                <span className="text-gray-900 font-semibold">₪{cartTotal.toFixed(2)}</span>
              </div>
              {giftCardAmount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Gift Card</span>
                  <span className="text-sm font-semibold">-₪{giftCardAmount.toFixed(2)}</span>
                </div>
              )}
              {promoAmount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">קוד מבצע</span>
                  <span className="text-sm font-semibold">-₪{promoAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-gray-900 font-semibold">סה"כ לתשלום</span>
                <span className="text-2xl font-bold text-gray-900">₪{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => { onClose(); onCheckout?.(); }}
              className="w-full bg-gold hover:bg-gold/90 text-black-lux px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              המשך לתשלום
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default CartModal;

