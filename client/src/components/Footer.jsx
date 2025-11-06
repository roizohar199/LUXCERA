import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Instagram, Facebook } from 'lucide-react';

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
  );
}

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-black via-black-lux to-black text-white py-12 relative overflow-hidden">
      {/* גרדיאנט זהב עדין */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <Section>
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">חנות</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#בית" className="hover:text-white transition">בית</a></li>
              <li><a href="#קטלוג" className="hover:text-white transition">קטלוג</a></li>
              <li><a href="#הזמנה" className="hover:text-white transition">יצירת קשר</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">יצירת קשר</h3>
            <div className="flex gap-4">
              <a href="https://facebook.com" className="hover:opacity-70 transition" target="_blank" rel="noopener noreferrer" aria-label="פייסבוק">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" className="hover:opacity-70 transition" target="_blank" rel="noopener noreferrer" aria-label="אינסטגרם">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="tel:0546998603" className="hover:opacity-70 transition" aria-label="טלפון">
                <Phone className="w-5 h-5" />
              </a>
              <a href="mailto:info@luxcera.com" className="hover:opacity-70 transition" aria-label="דוא״ל">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">הצטרפות לקהילה שלנו</h3>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="אימייל" className="flex-1 bg-white/10 border-b-2 border-white/30 text-white placeholder-white/50 px-2 py-2 focus:outline-none focus:border-white transition-colors" aria-label="אימייל לניוזלטר" />
              <button type="submit" className="text-white hover:opacity-70 transition" aria-label="שלח">→</button>
            </form>
          </div>
        </div>

        <div className="border-t border-gold/30 pt-8 text-center text-sm text-white/60 relative z-10">
          <p className="mb-2">© 2025 LUXCERA, Powered by Roi Zohar. All rights reserved.</p>
          <p className="flex justify-center gap-4 flex-wrap">
            <Link to="/terms-of-service" className="hover:text-white transition underline">תנאי שימוש</Link>
            <span className="text-white/40">|</span>
            <Link to="/cancellation-policy" className="hover:text-white transition underline">ביטול עסקה</Link>
            <span className="text-white/40">|</span>
            <Link to="/shipping-and-returns" className="hover:text-white transition underline">משלוחים והחזרות</Link>
          </p>
        </div>
      </Section>
    </footer>
  );
}

export default Footer;

