import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import LearnView from './components/LearnView';
import CalculatorView from './components/CalculatorView';
import MarketplaceView from './components/MarketplaceView';
import AddProductView from './components/AddProductView';
import OpportunitiesView from './components/OpportunitiesView';
import SignInView from './components/SignInView';
import { AuthProvider } from './context/AuthContext';
import { INITIAL_PRODUCTS, getCategoryPlaceholder } from './data/products';
import { TRANSLATIONS } from './data/translations';

const STORAGE_KEY = 'sakhi_bazaar_products_v2';
const VALID_ROUTES = ['home', 'learn', 'calculator', 'marketplace', 'add-product', 'opportunities', 'signin'];

function getRouteFromLocation() {
  if (typeof window === 'undefined') return 'home';

  // 1. Try URL hash e.g. #/marketplace or #marketplace
  const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (VALID_ROUTES.includes(hash)) {
    return hash;
  }

  // 2. Try URL pathname e.g. /marketplace
  const pathname = window.location.pathname.replace(/^\//, '').trim().toLowerCase();
  if (VALID_ROUTES.includes(pathname)) {
    return pathname;
  }

  // 3. Fallback to localStorage saved route
  try {
    const saved = localStorage.getItem('sakhi_active_route');
    if (saved && VALID_ROUTES.includes(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }

  return 'home';
}

function sanitizeProductsList(rawProducts) {
  if (!Array.isArray(rawProducts) || rawProducts.length === 0) return INITIAL_PRODUCTS;
  
  return rawProducts.map(p => {
    const match = INITIAL_PRODUCTS.find(item => item.id === p.id);
    if (match) {
      return {
        ...p,
        image: match.image,
        imageAlt: match.imageAlt,
        isPlaceholder: match.isPlaceholder
      };
    }
    if (typeof p.image === 'string' && p.image.includes('images.unsplash.com')) {
      return {
        ...p,
        image: getCategoryPlaceholder(p.category),
        imageAlt: `${p.nameEn || p.nameHi} - Category placeholder for ${p.category}`,
        isPlaceholder: true
      };
    }
    return p;
  });
}

function SakhiApp() {
  const [lang, setLang] = useState('hi'); // Default to Hindi for authentic rural connection, toggleable to English anytime
  const [currentTab, setCurrentTab] = useState(getRouteFromLocation);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [deletedProductRecord, setDeletedProductRecord] = useState(null);

  // Load products from localStorage or fallback to INITIAL_PRODUCTS
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sakhi_bazaar_products_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeProductsList(parsed);
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_PRODUCTS;
  });

  // Save to localStorage when products change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Safe fallback
    }
  }, [products]);

  // Sync hash routing on navigation
  const handleSelectTab = (tab) => {
    const safeTab = VALID_ROUTES.includes(tab) ? tab : 'home';
    setCurrentTab(safeTab);
    try {
      localStorage.setItem('sakhi_active_route', safeTab);
    } catch {
      // ignore
    }
    if (window.location.hash !== `#/${safeTab}`) {
      window.location.hash = `#/${safeTab}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for browser navigation (back/forward button, refresh, direct link)
  useEffect(() => {
    const handleLocationChange = () => {
      const route = getRouteFromLocation();
      setCurrentTab(route);
      try {
        localStorage.setItem('sakhi_active_route', route);
      } catch {
        // ignore
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // Ensure the hash is present in URL
    const initialRoute = getRouteFromLocation();
    if (!window.location.hash || window.location.hash === '#/') {
      window.location.hash = `#/${initialRoute}`;
    }

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    handleSelectTab('marketplace');
  };

  const handleUsePriceForProduct = (price) => {
    setCalculatedPrice(price);
    handleSelectTab('add-product');
  };

  const handleProductCreated = (newProd) => {
    setProducts(prev => [newProd, ...prev]);
    setNewlyAddedId(newProd.id);
  };

  const handleNavigateToMarket = () => {
    setSelectedCategory('all');
    handleSelectTab('marketplace');
  };

  // Delete product with Undo support
  const handleDeleteProduct = (productId) => {
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return;
    const removed = products[index];
    const newProducts = products.filter(p => p.id !== productId);
    setProducts(newProducts);
    setDeletedProductRecord({ product: removed, index });
  };

  const handleUndoDelete = () => {
    if (!deletedProductRecord) return;
    const { product, index } = deletedProductRecord;
    setProducts(prev => {
      const copy = [...prev];
      copy.splice(index, 0, product);
      return copy;
    });
    setDeletedProductRecord(null);
  };

  // Auto dismiss undo toast after 6s
  useEffect(() => {
    if (!deletedProductRecord) return;
    const timer = setTimeout(() => {
      setDeletedProductRecord(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [deletedProductRecord]);

  const t = TRANSLATIONS[lang];

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        lang={lang}
        onToggleLang={toggleLanguage}
      />

      {/* Main Content Area */}
      <main className="main-content" id="main-content">
        {currentTab === 'home' && (
          <HomeView
            onSelectTab={handleSelectTab}
            onSelectCategory={handleSelectCategory}
            lang={lang}
          />
        )}

        {currentTab === 'learn' && (
          <LearnView
            onSelectTab={handleSelectTab}
            lang={lang}
          />
        )}

        {currentTab === 'calculator' && (
          <CalculatorView
            onUsePriceForProduct={handleUsePriceForProduct}
            lang={lang}
          />
        )}

        {currentTab === 'marketplace' && (
          <MarketplaceView
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectTab={handleSelectTab}
            newlyAddedId={newlyAddedId}
            lang={lang}
            onDeleteProduct={handleDeleteProduct}
            deletedRecord={deletedProductRecord}
            onUndoDelete={handleUndoDelete}
          />
        )}

        {currentTab === 'add-product' && (
          <AddProductView
            initialPrice={calculatedPrice}
            onProductCreated={handleProductCreated}
            onNavigateToMarket={handleNavigateToMarket}
            onSelectTab={handleSelectTab}
            lang={lang}
          />
        )}

        {currentTab === 'opportunities' && (
          <OpportunitiesView
            lang={lang}
          />
        )}

        {currentTab === 'signin' && (
          <SignInView
            onContinue={() => handleSelectTab('marketplace')}
            lang={lang}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border-color)',
        padding: '32px 16px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>🪔</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-600)' }}>
              {t.siteName}
            </span>
            <span style={{ color: 'var(--accent-600)', fontWeight: 700 }}>•</span>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {t.siteTagline}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
            {lang === 'hi'
              ? 'सखी टेक ग्रामीण महिला उद्यमियों और स्वयं सहायता समूहों के आर्थिक स्वावलंबन और हुनर को बाज़ार से जोड़ने का एक डिजिटल मंच है।'
              : 'Sakhi Tech is a rural-first platform dedicated to empowering women artisans and SHG entrepreneurs with business skills and direct market access.'}
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
            fontSize: '0.82rem',
            fontWeight: 600,
            marginTop: 4
          }}>
            <button 
              onClick={() => handleSelectTab('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {t.navHome}
            </button>
            <span>•</span>
            <button 
              onClick={() => handleSelectTab('learn')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {t.navLearn}
            </button>
            <span>•</span>
            <button 
              onClick={() => handleSelectTab('calculator')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {t.navCalculator}
            </button>
            <span>•</span>
            <button 
              onClick={() => handleSelectTab('marketplace')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {t.navMarketplace}
            </button>
            <span>•</span>
            <button 
              onClick={() => handleSelectTab('opportunities')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {t.navOpportunities}
            </button>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
            © 2026 Sakhi Tech • Built for Rural Women Entrepreneurs • Demo Prototype
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        lang={lang}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SakhiApp />
    </AuthProvider>
  );
}
