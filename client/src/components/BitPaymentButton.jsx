import React, { useState, useEffect } from 'react';

export default function BitPaymentButton({
  amount,
  bitPhone = '0501234567',
  whatsappPhone = '972501234567',
  buttonLabel = 'תשלום בביט',
  allowEdit = false,
}) {
  const [open, setOpen] = useState(false);
  const [localAmount, setLocalAmount] = useState(() => {
    // מוודאים שהסכום הוא מספר תקין
    const numAmount = Number(amount);
    return isNaN(numAmount) || numAmount <= 0 ? 0 : numAmount;
  });

  useEffect(() => {
    // מעדכן את הסכום כשהפרופ changes
    if (amount !== undefined && amount !== null) {
      const numAmount = Number(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        setLocalAmount(numAmount);
      }
    }
  }, [amount]);

  // מעדכן את הסכום כשפותחים את המודאל (במקרה שהסכום השתנה)
  useEffect(() => {
    if (open && amount !== undefined && amount !== null) {
      const numAmount = Number(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        setLocalAmount(numAmount);
      }
    }
  }, [open, amount]);

  const handleOpenWhatsapp = () => {
    const formattedAmount = Number(localAmount).toFixed(2);
    const text = encodeURIComponent(
      `היי, אני רוצה לשלם בביט על הזמנה מהאתר.\nסכום: ${formattedAmount} ₪.\nמספר לתשלום בביט: ${bitPhone}`
    );
    window.open(`https://wa.me/${whatsappPhone}?text=${text}`, '_blank');
  };

  const isDisabled = !localAmount || Number(localAmount) <= 0;

  return (
    <>
      <button
        onClick={() => {
          // מעדכן את הסכום לפני פתיחת המודאל
          if (amount !== undefined && amount !== null) {
            const numAmount = Number(amount);
            if (!isNaN(numAmount) && numAmount > 0) {
              setLocalAmount(numAmount);
            }
          }
          setOpen(true);
        }}
        disabled={isDisabled}
        className={`px-5 py-2 rounded-lg font-semibold transition ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#4A6741] text-white shadow-md hover:bg-[#5a7a51]'
        }`}
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">תשלום בביט</h2>
            <p className="text-sm text-gray-600 mb-2">לתשלום בביט שלח העברה למספר:</p>
            <p className="text-lg font-mono mb-4 bg-gray-100 rounded px-3 py-2 select-all">
              {bitPhone}
            </p>

            <label className="block mb-2 text-sm font-medium">סכום העסקה (₪)</label>

            {allowEdit ? (
              <input
                type="number"
                min="1"
                step="0.01"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
              />
            ) : (
              <div className="w-full border rounded-lg px-3 py-2 mb-4 bg-gray-100 font-bold text-lg">
                ₪{Number(localAmount).toFixed(2)}
              </div>
            )}

            <p className="text-xs text-gray-500 mb-4">
              לאחר ביצוע ההעברה בביט, יש לשלוח בוואטסאפ לאותו המספר את צילום המסך של אישור ההעברה בביט.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleOpenWhatsapp}
                disabled={isDisabled}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  isDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#25D366] text-white hover:bg-[#1bb856]'
                }`}
              >
                פתח וואטסאפ
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

