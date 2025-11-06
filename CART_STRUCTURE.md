# מבנה Cart - LUXCERA

## מבנה כללי

ה-`cart` הוא **array של objects**, כאשר כל object מייצג פריט בסל.

## מבנה Item (Cart Item)

```javascript
{
  id: number,                    // מזהה ייחודי של המוצר
  name: string,                  // שם המוצר (title מהדאטה)
  price: number,                 // המחיר הפעיל (salePrice אם קיים, אחרת price)
  originalPrice: number,         // המחיר המקורי (תמיד price מהדאטה)
  salePrice: number | null,      // מחיר מבצע אם קיים (אחרת null)
  quantity: number,              // כמות הפריט (מינימום 1)
  inStock: boolean,              // האם המוצר במלאי
  color: string,                 // צבע לסטיילינג (לדוגמה: 'bg-white')
  image: string,                 // איקון/תמונת ברירת מחדל (לדוגמה: '🕯️')
  imageUrl: string | null,       // URL לתמונה (אם קיים)
  category: string,              // קטגוריה (לדוגמה: 'sets', 'fireplace', 'pearls', 'accessories')
  description: string | null     // תיאור המוצר (אופציונלי)
}
```

## חישובי מחירים

### Cart Total (סה"כ מוצרים)
```javascript
const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
```

### Shipping Fee (משלוח)
```javascript
const shippingFee = cartTotal >= 300 ? 0 : 30;
// משלוח חינם מעל ₪300, אחרת ₪30
```

### Final Total (סה"כ לתשלום)
```javascript
const finalTotal = cartTotal + shippingFee;
```

## דוגמה למבנה Cart מלא

```javascript
const cart = [
  {
    id: 1,
    name: "נר שעווה יוקרתי",
    price: 89.90,              // המחיר הפעיל (salePrice אם קיים)
    originalPrice: 120.00,     // המחיר המקורי
    salePrice: 89.90,          // מחיר מבצע
    quantity: 2,
    inStock: true,
    color: "bg-yellow-100",
    image: "🕯️",
    imageUrl: "https://example.com/candle.jpg",
    category: "sets",
    description: "נר שעווה יוקרתי עם ריח וניל"
  },
  {
    id: 2,
    name: "קמין אש",
    price: 150.00,             // המחיר הפעיל (אין salePrice)
    originalPrice: 150.00,     // המחיר המקורי
    salePrice: null,           // אין מחיר מבצע
    quantity: 1,
    inStock: true,
    color: "bg-red-100",
    image: "🔥",
    imageUrl: "https://example.com/fireplace.jpg",
    category: "fireplace",
    description: "קמין אש לבית"
  }
];

// חישובים:
const cartTotal = (89.90 * 2) + (150.00 * 1) = 329.80;
const shippingFee = 329.80 >= 300 ? 0 : 30; // = 0 (משלוח חינם)
const finalTotal = 329.80 + 0 = 329.80;
```

## פעולות על Cart

### הוספת פריט
```javascript
const handleAddToCart = (product) => {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    // אם הפריט כבר קיים, מעדכן כמות
    handleUpdateQuantity(product.id, existingItem.quantity + 1);
  } else {
    // אם הפריט לא קיים, מוסיף פריט חדש
    setCart([...cart, { ...product, quantity: 1 }]);
  }
};
```

### עדכון כמות
```javascript
const handleUpdateQuantity = (id, newQuantity) => {
  if (newQuantity <= 0) {
    handleRemoveItem(id);
    return;
  }
  setCart(cart.map(item => 
    item.id === id ? { ...item, quantity: newQuantity } : item
  ));
};
```

### הסרת פריט
```javascript
const handleRemoveItem = (id) => {
  setCart(cart.filter(item => item.id !== id));
};
```

### חישוב סך כמות פריטים
```javascript
const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
```

## מבנה Order Data (לשליחה ל-ZCREDIT)

כאשר מסיימים הזמנה, הנתונים נשלחים בצורה הבאה:

```javascript
const orderData = {
  shippingData: {
    fullName: string,      // שם מלא
    email: string,        // אימייל
    phone: string,        // טלפון
    address: string,      // כתובת משלוח
    city: string,         // עיר
    postalCode: string,   // מיקוד
    notes: string         // הערות
  },
  paymentData: {
    cardNumber: string,   // מספר כרטיס (עם רווחים: "1234 5678 9012 3456")
    cardName: string,     // שם על הכרטיס
    expiryDate: string,   // תאריך תפוגה (MM/YY)
    cvv: string,         // CVV
    paymentMethod: 'credit' | 'cash'  // שיטת תשלום
  },
  cart: [...],           // מערך הפריטים (כמתואר למעלה)
  total: number          // finalTotal (סה"כ לתשלום כולל משלוח)
};
```

## הערות חשובות

1. **מחיר פעיל**: `item.price` הוא המחיר שבו משתמשים לחישוב - אם יש `salePrice` הוא משמש, אחרת `originalPrice`.

2. **משלוח חינם**: מעל ₪300 המשלוח הוא חינם (₪0), אחרת ₪30.

3. **Quantity**: כמות מינימלית היא 1. אם הכמות מגיעה ל-0 או פחות, הפריט מוסר מהסל.

4. **מחיר ליחידה**: המחיר ליחידה מוצג כ-`item.price`, והמחיר הכולל לפריט הוא `item.price * item.quantity`.

