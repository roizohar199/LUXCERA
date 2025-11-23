import React, { useEffect, useState } from 'react';
import { apiClubMe, LoyaltyMember, LoyaltyTransaction, TIER_INFO, LoyaltyTier } from '../api/club';
import { Gift, TrendingUp, ShoppingBag, Calendar, Award } from 'lucide-react';

interface Props {
  userEmail: string;
}

const ClubDashboard: React.FC<Props> = ({ userEmail }) => {
  const [member, setMember] = useState<LoyaltyMember | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiClubMe(userEmail);
      setMember(data.member);
      setTransactions(data.transactions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-gray-600">טוען נתוני מועדון...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">לא נמצאה חברות במועדון עבור משתמש זה.</p>
      </div>
    );
  }

  const availablePoints = member.total_points - member.used_points;
  const tier: LoyaltyTier = member.tier || 'bronze';
  const tierInfo = TIER_INFO[tier];
  const totalSpent = Number(member.total_spent);

  // חשב כמה נקודות יצברו בהזמנה הבאה (לצורך תצוגה)
  const calculatePointsForOrder = (orderAmount: number) => {
    return Math.floor(orderAmount * tierInfo.earnRate);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6" dir="rtl">
      {/* Header Card */}
      <div className="border-2 border-gold/30 rounded-lg p-6 bg-gradient-to-br from-black/95 to-black/90 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-8 h-8 text-gold" />
          <h2 className="text-2xl font-bold text-gold">מועדון LUXCERA</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* מדרגה */}
          <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5" style={{ color: tierInfo.color }} />
              <span className="text-sm text-gold/80">מדרגה נוכחית</span>
            </div>
            <p className="text-xl font-bold" style={{ color: tierInfo.color }}>
              {tierInfo.labelHe}
            </p>
            <p className="text-xs text-gold/70 mt-1">
              {tierInfo.earnRate * 100}% צבירה
            </p>
          </div>

          <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              <span className="text-sm text-gold/80">נקודות זמינות</span>
            </div>
            <p className="text-3xl font-bold text-gold">{availablePoints.toLocaleString('he-IL')}</p>
          </div>
          
          <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-gold" />
              <span className="text-sm text-gold/80">סה״כ רכישות</span>
            </div>
            <p className="text-2xl font-bold text-gold">
              {totalSpent.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
          
          <div className="bg-gold/10 rounded-lg p-4 border border-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gold" />
              <span className="text-sm text-gold/80">סטטוס</span>
            </div>
            <p className="text-xl font-bold text-gold">
              {member.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
            </p>
          </div>
        </div>

        {/* הסבר על המדרגות */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mt-4">
          <h5 className="font-semibold text-blue-900 mb-3 text-base">
            📊 מדרגות צבירה לפי סכום קניות מצטבר:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: TIER_INFO.bronze.color }}>●</span>
              <span><strong>ברונזה:</strong> 0-499 ₪ → 3% צבירה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: TIER_INFO.silver.color }}>●</span>
              <span><strong>כסף:</strong> 500-1,499 ₪ → 5% צבירה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: TIER_INFO.gold.color }}>●</span>
              <span><strong>זהב:</strong> 1,500-3,999 ₪ → 7% צבירה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: TIER_INFO.platinum.color }}>●</span>
              <span><strong>פלטינום:</strong> 4,000+ ₪ → 10% צבירה</span>
            </div>
          </div>
          <p className="text-sm text-blue-700 mt-3 pt-3 border-t border-blue-200">
            💡 <strong>מדרגה נוכחית שלך:</strong> {tierInfo.labelHe} ({tierInfo.earnRate * 100}% צבירה)
            {totalSpent < 500 && (
              <span> - עוד {500 - totalSpent} ₪ כדי לעלות למדרגת כסף!</span>
            )}
            {totalSpent >= 500 && totalSpent < 1500 && (
              <span> - עוד {1500 - totalSpent} ₪ כדי לעלות למדרגת זהב!</span>
            )}
            {totalSpent >= 1500 && totalSpent < 4000 && (
              <span> - עוד {4000 - totalSpent} ₪ כדי לעלות למדרגת פלטינום!</span>
            )}
          </p>
        </div>

        {/* הסבר על מדרגות השימוש בנקודות */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mt-4">
          <h5 className="font-semibold text-blue-900 mb-3 text-base">
            📊 מדרגות שימוש בנקודות:
          </h5>
          <ul className="text-sm text-blue-800 space-y-2 list-none" style={{ paddingRight: '1rem' }}>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>עד ₪149:</strong> לא ניתן לממש נקודות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>מ-₪150 עד ₪299:</strong> ניתן לממש עד 50 נקודות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>מ-₪300 עד ₪499:</strong> ניתן לממש עד 150 נקודות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>מ-₪500 ומעלה:</strong> ניתן לממש עד 300 נקודות</span>
            </li>
          </ul>
        </div>

        {/* הודעה על מימוש נקודות */}
        <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mt-4">
          <p className="text-sm text-gold/90 text-center">
            <strong>💳 מימוש נקודות:</strong> כדי לממש את הנקודות שלכם ולקבל הנחה על ההזמנה, 
            אנא הוסיפו מוצרים לעגלה ובצעו הזמנה. בתהליך התשלום המאובטח תוכלו לממש את הנקודות שלכם לפי המדרגות המפורטות לעיל.
          </p>
        </div>
      </div>

      {/* Transactions History */}
      <div className="border-2 border-gold/30 rounded-lg p-6 bg-white/90 shadow-xl">
        <h3 className="text-xl font-bold text-gold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          היסטוריית נקודות
        </h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">אין תנועות מועדון להצגה.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gold/30">
                  <th className="text-right py-3 text-gold font-semibold">תאריך</th>
                  <th className="text-right py-3 text-gold font-semibold">סוג</th>
                  <th className="text-right py-3 text-gold font-semibold">נקודות</th>
                  <th className="text-right py-3 text-gold font-semibold">יתרה</th>
                  <th className="text-right py-3 text-gold font-semibold">תיאור</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // מחשב את היתרה לאחר כל תנועה
                  // התנועות מסודרות מהחדש לישן (DESC), אז נחשב מההתחלה (הישן ביותר)
                  const reversedTransactions = [...transactions].reverse();
                  let runningBalance = 0;
                  const transactionsWithBalance = reversedTransactions.map((tx) => {
                    // מעדכן את היתרה לפי סוג התנועה
                    if (tx.type === 'EARN') {
                      runningBalance += tx.points;
                    } else {
                      runningBalance -= tx.points;
                    }
                    return { ...tx, balance: runningBalance };
                  });
                  // מחזירים לסדר המקורי (מהחדש לישן)
                  return transactionsWithBalance.reverse();
                })().map((tx: LoyaltyTransaction & { balance: number }) => (
                  <tr key={tx.id} className="border-b border-gold/10 hover:bg-gold/5">
                    <td className="py-3 text-gray-700">
                      {new Date(tx.created_at).toLocaleString('he-IL')}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          tx.type === 'EARN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.type === 'EARN' ? 'צבירה' : 'מימוש'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-700 font-semibold">
                      {tx.type === 'EARN' ? '+' : '-'}{tx.points}
                    </td>
                    <td className="py-3 text-gray-900 font-bold">
                      {tx.balance.toLocaleString('he-IL')}
                    </td>
                    <td className="py-3 text-gray-600">{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubDashboard;

