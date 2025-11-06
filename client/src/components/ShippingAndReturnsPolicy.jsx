import React from 'react';

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
  );
}

function ShippingAndReturnsPolicy() {
  return (
    <Section id="משלוחים-והחזרות" className="py-20 bg-ivory">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'serif' }}>מדיניות משלוחים והחזרות</h2>
        
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-6 text-gray-700 leading-relaxed">
          <p className="text-lg">
            כל המוצרים של LUXCERA נמצאים במלאי בישראל, ומוכנים למשלוח ישיר ומהיר עד אליך.
          </p>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">משלוחים</h3>
            <p>
              אנו מציעים שירות משלוח עד הבית לכל רחבי הארץ.
            </p>
            <p className="mt-3">
              זמן האספקה המשוער הוא בין 5 ל־14 ימי עסקים ממועד ביצוע ההזמנה, בהתאם לאזור המגורים, סוג המוצר ולזמינות המשלוחים.
            </p>
            <p className="mt-3">
              במקרים חריגים (כגון חגים, מזג אוויר קיצוני או עומסים חריגים), ייתכנו עיכובים קלים בזמני האספקה – אנו נעדכן אותך במידת הצורך.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">החזרת מוצרים</h3>
            <p className="mb-4">
              לקוח רשאי להחזיר מוצר שנרכש באתר בתוך 14 ימים ממועד קבלתו, בתנאי שהמוצר:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>לא נעשה בו שימוש,</li>
              <li>והוא מוחזר באריזתו המקורית והשלמה.</li>
            </ul>
            <p className="mt-4">
              לאחר החזרת המוצר ובדיקתו, יינתן זיכוי או החזר כספי בהתאם להעדפת הלקוח ולמדיניות האתר.
            </p>
          </div>

          <div className="bg-yellow-50 border-r-4 border-yellow-500 rounded-lg p-6 mt-6">
            <p className="font-semibold text-gray-900 mb-2">חשוב לדעת:</p>
            <p className="text-gray-700">
              במקרה של ביטול עסקה או החזרת מוצר, עלות המשלוח הלוך וחזור תחול על הלקוח.
            </p>
            <p className="text-gray-700 mt-2">
              החזר כספי (אם אושר) יבוצע לאחר שהמוצר התקבל חזרה אצל LUXCERA ובכפוף לבדיקתו.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default ShippingAndReturnsPolicy;

