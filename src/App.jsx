import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from './context/AuthContext';
import { INITIAL_PRODUCTS } from './data/products';
import { TRANSLATIONS } from './data/translations';
import { isSupabaseConfigured } from './lib/supabase';
import {
  fetchProducts,
  deleteProduct,
  subscribeToProducts,
} from './lib/productsService';

// localStorage is only used for UI preferences (route, language)
// Products now live in Supabase – never in localStorage
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

// DEMO_PRODUCTS are the 8 seed/sample listings.
// They are shown ONLY when Supabase is not configured, so users always see
// something useful while setting up the backend. They are never written to
// Supabase and are clearly labelled as demo items.
const DEMO_PRODUCTS = INITIAL_PRODUCTS;

function SakhiApp() {
  const { user } = useAuth();
  const [lang, setLang] = useState('hi'); // Default to Hindi for authentic rural connection, toggleable to English anytime
  const [currentTab, setCurrentTab] = useState(getRouteFromLocation);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [deletedProductRecord, setDeletedProductRecord] = useState(null);

  // ── Supabase product state ─────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null); // null | 'not_configured' | string

  /** Load (or reload) all active listings from Supabase. */
  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Show demo seed data so the UI is never empty for first-time setup
      setProducts(DEMO_PRODUCTS);
      setProductsLoading(false);
      setProductsError('not_configured');
      return;
    }
    setProductsLoading(true);
    setProductsError(null);
    const { data, error } = await fetchProducts();
    if (error && error !== 'not_configured') {
      setProductsError(error);
    }
    setProducts(data);
    setProductsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Refresh listings when the user switches back to the marketplace tab
  // (also covers returning from another browser tab via visibilitychange)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && currentTab === 'marketplace') {
        loadProducts();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [currentTab, loadProducts]);

  // Reload when the user navigates to the marketplace tab
  useEffect(() => {
    if (currentTab === 'marketplace') {
      loadProducts();
    }
  }, [currentTab, loadProducts]);

  // Supabase Realtime: add new listings without a manual refresh
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = subscribeToProducts((newProduct) => {
      setProducts((prev) => {
        // Avoid duplicates (our own optimistic insert arrives first)
        if (prev.some((p) => p.id === newProduct.id)) return prev;
        return [newProduct, ...prev];
      });
    });
    return () => {
      channel?.unsubscribe();
    };
  }, []);

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
    // Optimistically prepend – realtime will deduplicate if it arrives too
    setProducts((prev) => {
      if (prev.some((p) => p.id === newProd.id)) return prev;
      return [newProd, ...prev];
    });
    setNewlyAddedId(newProd.id);
  };

  const handleNavigateToMarket = () => {
    setSelectedCategory('all');
    handleSelectTab('marketplace');
  };

  // Delete product with Undo support
  const handleDeleteProduct = async (productId) => {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return;
    const removed = products[index];

    // Optimistic UI update first
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setDeletedProductRecord({ product: removed, index });

    // If this was a real DB product, soft-delete it
    if (isSupabaseConfigured && removed._fromDb && user?.id) {
      const { error } = await deleteProduct(productId, user.id);
      if (error) {
        // Roll back on failure
        setProducts((prev) => {
          const copy = [...prev];
          copy.splice(index, 0, removed);
          return copy;
        });
        setDeletedProductRecord(null);
        console.error('[App] deleteProduct error:', error);
      }
    }
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
            productsLoading={productsLoading}
            productsError={productsError}
            onRefresh={loadProducts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectTab={handleSelectTab}
            newlyAddedId={newlyAddedId}
            lang={lang}
            onDeleteProduct={handleDeleteProduct}
            deletedRecord={deletedProductRecord}
            onUndoDelete={handleUndoDelete}
            currentUser={user}
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
