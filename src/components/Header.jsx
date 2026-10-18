import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../data/translations';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  BookOpen, 
  Calculator, 
  Store, 
  PlusCircle, 
  Calendar, 
  Globe,
  LogIn,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

export default function Header({ currentTab, onSelectTab, lang, onToggleLang }) {
  const t = TRANSLATIONS[lang];
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu if resized to desktop (>= 1100px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1100 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const handleNavClick = (tab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-inner">
        {/* 1. LEFT: Brand Logo & Title */}
        <div 
          className="brand-wrapper" 
          onClick={() => handleNavClick('home')}
          title="Sakhi Tech - Home"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavClick('home')}
        >
          <div className="brand-icon-box" aria-hidden="true">
            🪔
          </div>
          <div className="brand-text-box">
            <h1 className="brand-title">
              <span className="brand-primary-name">
                {lang === 'hi' ? 'सखी टेक' : 'Sakhi Tech'}
              </span>
              <span className="brand-pill-badge">
                {lang === 'hi' ? 'ग्रामीण उद्यम' : 'Artisan Hub'}
              </span>
            </h1>
            <p className="brand-tagline">
              {lang === 'hi' ? 'ग्रामीण महिला उद्यमिता मंच' : 'Rural Women Marketplace'}
            </p>
          </div>
        </div>

        {/* 2. MIDDLE: Navigation Links on one horizontal line (Desktop >= 1100px) */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <button 
            type="button"
            className={`nav-link-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <Home size={15} />
            <span>{t.navHome}</span>
          </button>

          <button 
            type="button"
            className={`nav-link-btn ${currentTab === 'learn' ? 'active' : ''}`}
            onClick={() => handleNavClick('learn')}
          >
            <BookOpen size={15} />
            <span>{t.navLearn}</span>
          </button>

          <button 
            type="button"
            className={`nav-link-btn ${currentTab === 'calculator' ? 'active' : ''}`}
            onClick={() => handleNavClick('calculator')}
          >
            <Calculator size={15} />
            <span>{t.navCalculator}</span>
          </button>

          <button 
            type="button"
            className={`nav-link-btn ${currentTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => handleNavClick('marketplace')}
          >
            <Store size={15} />
            <span>{t.navMarketplace}</span>
          </button>

          <button 
            type="button"
            className={`nav-link-btn ${currentTab === 'opportunities' ? 'active' : ''}`}
            onClick={() => handleNavClick('opportunities')}
          >
            <Calendar size={15} />
            <span>{t.navOpportunities}</span>
          </button>
        </nav>

        {/* 3. RIGHT: Add Product, Language Selector, and Sign In on one horizontal line */}
        <div className="header-actions">
          {/* Add Product Button (stays on right, one line, never wraps) */}
          <button 
            type="button"
            className={`header-add-product-btn ${currentTab === 'add-product' ? 'active' : ''}`}
            onClick={() => handleNavClick('add-product')}
            title={t.navAddProduct}
          >
            <PlusCircle size={16} />
            <span>{t.navAddProduct}</span>
          </button>

          {/* Language Selector */}
          <button 
            type="button"
            className="lang-selector-btn" 
            onClick={onToggleLang}
            title={lang === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
            aria-label="Change Language"
          >
            <Globe size={15} />
            <span className={lang === 'en' ? 'lang-pill-active' : ''}>EN</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span className={lang === 'hi' ? 'lang-pill-active' : ''}>हिन्दी</span>
          </button>

          {/* User Sign-In Profile or Button */}
          {isAuthenticated && user ? (
            <div className="user-profile-header-chip" title={`${user.name} (${user.email})`}>
              <div className="user-header-avatar">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} />
                ) : (
                  <span>{user.name?.charAt(0) || 'S'}</span>
                )}
              </div>
              <span className="user-header-name">
                {user.givenName || user.name}
              </span>
              <button 
                type="button"
                className="user-header-logout-btn" 
                onClick={logout}
                title={t.navSignOut}
                aria-label={t.navSignOut}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              className={`auth-header-btn ${currentTab === 'signin' ? 'active' : ''}`}
              onClick={() => handleNavClick('signin')}
              title={t.navSignIn}
            >
              <LogIn size={15} />
              <span className="auth-btn-text">{t.navSignIn}</span>
            </button>
          )}

          {/* Compact Menu Toggle Button (shown on tablet and mobile < 1100px) */}
          <button
            type="button"
            className="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t.menuClose : t.menuOpen}
            title={mobileMenuOpen ? t.menuClose : t.menuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-menu-backdrop" 
            onClick={() => setMobileMenuOpen(false)} 
            aria-hidden="true" 
          />
          <nav className="mobile-nav-panel" aria-label="Mobile Navigation Drawer">
            <div className="mobile-nav-header">
              <div className="mobile-nav-brand">
                <span style={{ fontSize: '1.25rem' }}>🪔</span>
                <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '1rem' }}>
                  {t.menuTitle}
                </span>
              </div>
              <button 
                type="button"
                className="mobile-nav-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t.menuClose}
                title={t.menuClose}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-nav-links-list">
              <button
                type="button"
                className={`mobile-nav-link ${currentTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                <div className="mobile-nav-icon"><Home size={18} /></div>
                <span className="mobile-nav-text">{t.navHome}</span>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentTab === 'learn' ? 'active' : ''}`}
                onClick={() => handleNavClick('learn')}
              >
                <div className="mobile-nav-icon"><BookOpen size={18} /></div>
                <span className="mobile-nav-text">{t.navLearn}</span>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentTab === 'calculator' ? 'active' : ''}`}
                onClick={() => handleNavClick('calculator')}
              >
                <div className="mobile-nav-icon"><Calculator size={18} /></div>
                <span className="mobile-nav-text">{t.navCalculator}</span>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentTab === 'marketplace' ? 'active' : ''}`}
                onClick={() => handleNavClick('marketplace')}
              >
                <div className="mobile-nav-icon"><Store size={18} /></div>
                <span className="mobile-nav-text">{t.navMarketplace}</span>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </button>

              <button
                type="button"
                className={`mobile-nav-link ${currentTab === 'opportunities' ? 'active' : ''}`}
                onClick={() => handleNavClick('opportunities')}
              >
                <div className="mobile-nav-icon"><Calendar size={18} /></div>
                <span className="mobile-nav-text">{t.navOpportunities}</span>
                <ChevronRight size={16} className="mobile-nav-arrow" />
              </button>

              <button
                type="button"
                className={`mobile-nav-link mobile-add-product-btn ${currentTab === 'add-product' ? 'active' : ''}`}
                onClick={() => handleNavClick('add-product')}
              >
                <div className="mobile-nav-icon"><PlusCircle size={18} /></div>
                <span className="mobile-nav-text">{t.navAddProduct}</span>
                <span className="mobile-nav-highlight-badge">
                  {lang === 'hi' ? 'जोड़ें' : 'Add'}
                </span>
              </button>
            </div>

            {/* Mobile Nav User Actions */}
            <div className="mobile-nav-footer">
              {isAuthenticated && user ? (
                <div className="mobile-nav-user-card">
                  <div className="mobile-nav-user-info">
                    <div className="user-header-avatar">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0) || 'S'}</span>
                      )}
                    </div>
                    <div className="mobile-nav-user-details">
                      <span className="mobile-nav-user-name">{user.name}</span>
                      <span className="mobile-nav-user-email">{user.email}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-secondary mobile-logout-btn"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={16} />
                    <span>{t.navSignOut}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => handleNavClick('signin')}
                  style={{ gap: 8, padding: '12px', fontSize: '0.95rem' }}
                >
                  <LogIn size={18} />
                  <span>{t.navSignIn}</span>
                </button>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
