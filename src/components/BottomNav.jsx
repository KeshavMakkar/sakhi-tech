import React from 'react';
import { Home, BookOpen, Calculator, Store, Calendar, Plus } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function BottomNav({ currentTab, onSelectTab, lang }) {
  const t = TRANSLATIONS[lang];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button 
        className={`bottom-nav-item ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => onSelectTab('home')}
        aria-label={t.navHome}
      >
        <Home />
        <span>{t.navHome}</span>
      </button>

      <button 
        className={`bottom-nav-item ${currentTab === 'learn' ? 'active' : ''}`}
        onClick={() => onSelectTab('learn')}
        aria-label={t.navLearn}
      >
        <BookOpen />
        <span>{t.navLearn}</span>
      </button>

      {/* Floating Center Add Button */}
      <button 
        className="bottom-nav-add-btn"
        onClick={() => onSelectTab('add-product')}
        title={t.navAddProduct}
        aria-label={t.navAddProduct}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <button 
        className={`bottom-nav-item ${currentTab === 'calculator' ? 'active' : ''}`}
        onClick={() => onSelectTab('calculator')}
        aria-label={t.navCalculator}
      >
        <Calculator />
        <span>{lang === 'hi' ? 'दाम' : 'Price'}</span>
      </button>

      <button 
        className={`bottom-nav-item ${currentTab === 'marketplace' ? 'active' : ''}`}
        onClick={() => onSelectTab('marketplace')}
        aria-label={t.navMarketplace}
      >
        <Store />
        <span>{t.navMarketplace}</span>
      </button>

      <button 
        className={`bottom-nav-item ${currentTab === 'opportunities' ? 'active' : ''}`}
        onClick={() => onSelectTab('opportunities')}
        aria-label={t.navOpportunities}
      >
        <Calendar />
        <span>{lang === 'hi' ? 'अवसर' : 'Events'}</span>
      </button>
    </nav>
  );
}
