import React, { useState } from 'react';
import { Gift, Star, CheckCircle } from 'lucide-react';

export default function GiftCardPurchase({ onAddToCart }) {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const amounts = [100, 200, 300, 400];

  const handleAddToCart = async () => {
    if (!email || !email.includes('@')) {
      setError('אנא הכנס אימייל תקין');
      return;
    }

    setError(null);

    // יצירת אובייקט Gift Card כמו מוצר רגיל
    const giftCardProduct = {
      id: `gift-card-${selectedAmount}-${Date.now()}`, // ID ייחודי
      name: `Gift Card - ₪${selectedAmount.toFixed(2)}`,
      price: selectedAmount,
      quantity: quantity,
      image: '🎁',
      imageUrl: null,
      inStock: true,
      isGiftCard: true, // סימון שזה Gift Card
      giftCardEmail: email, // שמירת האימייל
      giftCardAmount: selectedAmount, // שמירת הסכום
    };

    // הוספה לסל
    if (onAddToCart) {
      // אם יש כמות > 1, נוסיף כל אחד בנפרד
      let allAdded = true;
      for (let i = 0; i < quantity; i++) {
        const singleGiftCard = {
          ...giftCardProduct,
          id: `gift-card-${selectedAmount}-${Date.now()}-${i}`,
          quantity: 1,
        };
        const result = await onAddToCart(singleGiftCard);
        if (result === false) {
          allAdded = false;
          break;
        }
      }
      
      if (allAdded) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setEmail('');
          setQuantity(1);
          setSelectedAmount(100);
        }, 2000);
      } else {
        setError('עליך להתחבר או להירשם לאתר כדי להוסיף פריטים לסל. אנא התחבר/הירשם ואז נסה שוב.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16" dir="rtl">
      {/* Decorative star top left */}
      <div className="relative">
        <Star className="absolute -top-8 -right-8 w-12 h-12 text-amber-300 opacity-60" fill="currentColor" />
        
        <div className="bg-white rounded-lg shadow-luxury p-8 border-2 border-gold/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">GIFT CARD</h1>
            <p className="text-3xl font-bold text-gray-800">₪ {selectedAmount.toFixed(2)}</p>
          </div>

          {/* Rating section (optional) */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">חווה דעתך על המוצר</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 text-gray-300" />
              ))}
            </div>
          </div>

          {/* Amount selection */}
          <div className="mb-8 bg-candle/20 p-6 rounded-xl border border-sage/30">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">בחירת סכום הגיפט קארד</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {amounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                  className={`px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
                    selectedAmount === amount
                      ? 'border-2 border-gold text-gold bg-gold/10 shadow-gold'
                      : 'border border-sage/40 text-gray-700 hover:border-gold/50 hover:bg-gold/5'
                  }`}
                >
                  ₪{amount.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8 space-y-4 text-gray-700">
            <p className="text-lg font-semibold">העניקו מתנה מושלמת – גיפט קארד בסכום לבחירתכם!</p>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                עם סיום הרכישה, תקבלו למייל קוד אישי לגיפט קארד שניתן למימוש באתר. תוכלו להעביר את הקוד לאנשים שיקרים לכם, והם יוכלו לבחור בעצמם מכל מגוון מוצרי החנות.
              </p>
              <p>
                הגיפט קארד מאפשר ליהנות גם ממבצעים והנחות הפעילים בחנות בזמן השימוש.
              </p>
              <p>
                אז למה לחכות? תנו למי שאתם אוהבים לבחור את הנרות הריחניים והמוצרים שישדרגו להם את האווירה. מתנה כזו – בטוח שהם יזכרו!
              </p>
            </div>
          </div>

          {/* Email, Quantity and Purchase */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אימייל לקבלת הקוד</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full max-w-xs border border-sage/40 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">כמות</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full max-w-xs border border-sage/40 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Gift Card נוסף לסל בהצלחה!
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!email || !email.includes('@')}
                className={`w-full max-w-xs py-3 rounded-lg font-semibold text-lg transition-colors ${
                  !email || !email.includes('@')
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gold text-black-lux hover:bg-gold/90 border-2 border-gold shadow-gold'
                }`}
              >
                הוספה לסל
              </button>
            </div>
          </div>

          {/* Gift Card Logo - styled as credit card */}
          <div className="mt-8 flex justify-center">
            <div className="relative w-64 h-40 rounded-2xl overflow-hidden shadow-xl bg-black">
              <img 
                src="/gift-card-logo.png" 
                alt="Gift Card" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

