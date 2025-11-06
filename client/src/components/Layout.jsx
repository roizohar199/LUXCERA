import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import luxceraLogo from '../assets/Luxcera Logo.png';

function Nav({ onCartClick, onUserClick, onSearchClick, cartCount, isLoggedIn, userName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const links = [
    { name: 'בית', href: '/', onClick: () => navigate('/') },
    { name: 'קטלוג', href: '/#קטלוג', onClick: () => navigate('/#קטלוג') },
    { name: 'יצירת קשר', href: '/#הזמנה', onClick: () => navigate('/#הזמנה') }
  ];

  return (
    <nav className="sticky top-0 w-full z-50 bg-black shadow-md" aria-label="ניווט ראשי" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src={luxceraLogo} alt="LUXCERA" className="h-16 sm:h-20 md:h-24 w-auto rounded-xl" />
        </Link>

        <div className="hidden md:flex gap-8 text-gold text-base">
          {links.map(link => (
            <Link key={link.name} to={link.href} onClick={link.onClick} className="hover:text-gold/80 transition font-medium">{link.name}</Link>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <button onClick={onSearchClick} className="text-gold hover:text-gold/80 transition" aria-label="חיפוש">
            <Search className="w-6 h-6" />
          </button>
          <button onClick={onUserClick} className="flex items-center gap-2 text-gold hover:text-gold/80 transition" aria-label="אזור אישי">
            {isLoggedIn && userName && (
              <span className="hidden sm:inline text-base font-medium text-gold">{userName}</span>
            )}
            <User className="w-6 h-6" />
          </button>
          <button onClick={onCartClick} className="relative text-gold hover:text-gold/80 transition" aria-label="עגלת קניות">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-live="polite">
                {cartCount}
              </span>
            )}
          </button>
          <button className="md:hidden text-gold hover:text-gold/80" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="תפריט">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-gold/30">
          <div className="px-4 py-3 space-y-2">
            {links.map(link => (
              <Link key={link.name} to={link.href} onClick={() => { link.onClick(); setMobileMenuOpen(false); }} className="block text-gold hover:bg-gold/10 p-2">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function Layout({ children, onCartClick, onUserClick, onSearchClick, cartCount, isLoggedIn, userName }) {
  return (
    <div dir="rtl" className="min-h-screen bg-ivory">
      <Nav 
        onCartClick={onCartClick}
        onUserClick={onUserClick}
        onSearchClick={onSearchClick}
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
        userName={userName}
      />
      {children}
    </div>
  );
}

export default Layout;

