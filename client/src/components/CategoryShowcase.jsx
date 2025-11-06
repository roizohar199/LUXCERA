import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import packagesBg from '../assets/packages-bg.jpg';
import waxPearlsBg from '../assets/wax-pearls-bg.png';
import accessoriesBg from '../assets/2-99cd7c1d.png';
import giftPackageBg from '../assets/gift-package.png';
import bestPriceBg from '../assets/best-price.png';

function CategoryShowcase({ sets, waxPearls, accessories }) {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'מארזים',
      route: '/category/sets',
      bgImage: packagesBg, // תמונה מ-assets
      icon: null, // ללא אייקון
      description: 'מארזים מיוחדים של נרות יוקרתיים',
    },
    {
      title: 'פניני שעווה',
      route: '/category/wax-pearls',
      bgImage: waxPearlsBg, // תמונה מ-assets
      icon: null, // ללא אייקון
      description: 'פניני שעווה ריחניות בעבודת יד',
    },
    {
      title: 'אביזרים',
      route: '/category/accessories',
      bgImage: accessoriesBg, // תמונה מ-assets
      icon: null, // ללא אייקון
      description: 'אביזרים משלימים לנרות',
    },
  ];

  // קטגוריית מבצעים - לכל הרוחב מעל שלוש הקטגוריות
  const salesCategory = {
    title: 'מבצעים',
    route: '/category/sales',
    bgImage: bestPriceBg,
    icon: null,
    description: 'מבצעים מיוחדים ומחירים מושכים',
  };

  // קטגוריית מארזי מתנה - לכל הרוחב
  const giftPackagesCategory = {
    title: 'מארזי מתנה',
    route: '/category/gift-packages',
    bgImage: giftPackageBg,
    icon: null,
    description: 'מארזי מתנה מושלמים לכל אירוע',
  };

  return (
    <Section className="py-16 bg-ivory">
      {/* קטגוריית מבצעים - לכל הרוחב, סימטרית לשלוש הקטגוריות מתחתיה */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0 }}
        className="relative bg-white rounded-lg overflow-hidden shadow-luxury hover:shadow-gold transition-all group cursor-pointer mb-6 lg:mb-8"
        onClick={() => navigate(salesCategory.route)}
      >
        {/* רקע עם תמונת קטגוריה */}
        <div className="relative h-96 bg-white overflow-hidden">
          {salesCategory.bgImage && (
            typeof salesCategory.bgImage === 'string' && salesCategory.bgImage.startsWith('bg-') ? (
              <div className={`absolute inset-0 ${salesCategory.bgImage} bg-cover bg-center opacity-20`} />
            ) : (
              <img 
                src={salesCategory.bgImage} 
                alt={salesCategory.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )
          )}
          
          {/* Overlay עדין */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white/70" />
          
          {/* תוכן מרכזי - אייקון וטקסט */}
          <div className="relative h-full flex flex-col items-center justify-center p-8 z-10">
            {salesCategory.icon && (
              <div className="text-7xl md:text-8xl mb-4 opacity-80">
                {salesCategory.icon}
              </div>
            )}
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
              {salesCategory.title}
            </h3>
            <p className="text-gray-600 text-sm md:text-base text-center max-w-md">
              {salesCategory.description}
            </p>
          </div>
        </div>

        {/* כפתור שחור עם כיתוב זהב בתחתית */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(salesCategory.route);
          }}
          className="w-full bg-black hover:bg-black-lux text-gold py-4 px-6 font-semibold text-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-black-lux border-t border-gold/20"
        >
          <span>{salesCategory.title}</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </motion.div>

      {/* שלוש הקטגוריות הראשונות */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
        {categories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative bg-white rounded-lg overflow-hidden shadow-luxury hover:shadow-gold transition-all group cursor-pointer"
            onClick={() => navigate(category.route)}
          >
            {/* רקע עם תמונת קטגוריה */}
            <div className="relative h-96 bg-white overflow-hidden">
              {category.bgImage && (
                typeof category.bgImage === 'string' && category.bgImage.startsWith('bg-') ? (
                  <div className={`absolute inset-0 ${category.bgImage} bg-cover bg-center opacity-20`} />
                ) : (
                  <img 
                    src={category.bgImage} 
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )
              )}
              
              {/* Overlay עדין */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white/70" />
              
              {/* תוכן מרכזי - אייקון וטקסט */}
              <div className="relative h-full flex flex-col items-center justify-center p-8 z-10">
                {category.icon && (
                  <div className="text-7xl md:text-8xl mb-4 opacity-80">
                    {category.icon}
                  </div>
                )}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
                  {category.title}
                </h3>
                <p className="text-gray-600 text-sm md:text-base text-center max-w-xs">
                  {category.description}
                </p>
              </div>
            </div>

            {/* כפתור שחור עם כיתוב זהב בתחתית */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(category.route);
              }}
              className="w-full bg-black hover:bg-black-lux text-gold py-4 px-6 font-semibold text-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-black-lux border-t border-gold/20"
            >
              <span>{category.title}</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </motion.div>
        ))}
      </div>

      {/* קטגוריית מארזי מתנה - לכל הרוחב, סימטרית לשלוש הקטגוריות מעליה */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative bg-white rounded-lg overflow-hidden shadow-luxury hover:shadow-gold transition-all group cursor-pointer"
        onClick={() => navigate(giftPackagesCategory.route)}
      >
        {/* רקע עם תמונת קטגוריה */}
        <div className="relative h-96 bg-white overflow-hidden">
          {giftPackagesCategory.bgImage && (
            typeof giftPackagesCategory.bgImage === 'string' && giftPackagesCategory.bgImage.startsWith('bg-') ? (
              <div className={`absolute inset-0 ${giftPackagesCategory.bgImage} bg-cover bg-center opacity-20`} />
            ) : (
              <img 
                src={giftPackagesCategory.bgImage} 
                alt={giftPackagesCategory.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )
          )}
          
          {/* Overlay עדין */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white/70" />
          
          {/* תוכן מרכזי - אייקון וטקסט */}
          <div className="relative h-full flex flex-col items-center justify-center p-8 z-10">
            {giftPackagesCategory.icon && (
              <div className="text-7xl md:text-8xl mb-4 opacity-80">
                {giftPackagesCategory.icon}
              </div>
            )}
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
              {giftPackagesCategory.title}
            </h3>
            <p className="text-gray-600 text-sm md:text-base text-center max-w-md">
              {giftPackagesCategory.description}
            </p>
          </div>
        </div>

        {/* כפתור שחור עם כיתוב זהב בתחתית */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(giftPackagesCategory.route);
          }}
          className="w-full bg-black hover:bg-black-lux text-gold py-4 px-6 font-semibold text-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-black-lux border-t border-gold/20"
        >
          <span>{giftPackagesCategory.title}</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </motion.div>
    </Section>
  );
}

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
  );
}

export default CategoryShowcase;

