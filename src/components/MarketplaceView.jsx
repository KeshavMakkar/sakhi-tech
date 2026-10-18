import React, { useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { TRANSLATIONS } from '../data/translations';
import { getCategoryPlaceholder } from '../data/products';
import ContactModal from './ContactModal';
import { 
  Store, 
  Search, 
  MapPin, 
  Phone, 
  Sparkles, 
  CheckCircle, 
  X, 
  Trash2,
  MessageCircle, 
  SlidersHorizontal,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function MarketplaceView({ 
  products, 
  selectedCategory, 
  onSelectCategory, 
  onSelectTab,
  newlyAddedId,
  lang,
  onDeleteProduct,
  deletedRecord,
  onUndoDelete
}) {
  const t = TRANSLATIONS[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price-low' | 'price-high'
  const [activeProductModal, setActiveProductModal] = useState(null);
  const [activeContactModal, setActiveContactModal] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Filter & Search Logic
  const filteredProducts = products.filter(product => {
    // Category match
    const categoryMatches = selectedCategory === 'all' || product.category === selectedCategory;

    // Search query match
    if (!categoryMatches) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const nameMatch = (product.nameEn || '').toLowerCase().includes(term) || 
                      (product.nameHi || '').toLowerCase().includes(term);
    const sellerMatch = (product.sellerNameEn || '').toLowerCase().includes(term) ||
                        (product.sellerNameHi || '').toLowerCase().includes(term);
    const locationMatch = (product.locationEn || '').toLowerCase().includes(term) ||
                          (product.locationHi || '').toLowerCase().includes(term);

    return nameMatch || sellerMatch || locationMatch;
  });

  // Sort logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      return a.price - b.price;
    }
    if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    // Newest first (default): newly added IDs will appear at top
    if (a.id === newlyAddedId) return -1;
    if (b.id === newlyAddedId) return 1;
    return 0;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    onSelectCategory('all');
  };

  return (
    <div className="marketplace-view">
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="section-title">
          <Store size={24} style={{ color: 'var(--primary-500)' }} />
          <span>{t.marketTitle}</span>
        </h2>
        <p className="section-sub">{t.marketSub}</p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="filter-search-bar">
        {/* Search Input with properly placed Clear X */}
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              title={t.clearSearchTooltip}
              aria-label={t.clearSearchTooltip}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Horizontal Scrolling Chips */}
        <div className="category-chips-scroll">
          <button
            className={`filter-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => onSelectCategory('all')}
          >
            <span>{t.allCategories}</span>
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span>{cat.emoji}</span>
              <span>{lang === 'hi' ? cat.nameHi : cat.nameEn}</span>
            </button>
          ))}
        </div>

        {/* Sort Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {sortedProducts.length} {lang === 'hi' ? 'उत्पाद मिले' : 'Products Available'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t.sortBy}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-canvas)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="price-low">{t.sortPriceLow}</option>
              <option value="price-high">{t.sortPriceHigh}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Newly Added Celebration Alert if just listed */}
      {newlyAddedId && (
        <div style={{
          background: 'var(--green-50)',
          border: '1.5px solid var(--green-600)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--green-700)',
          fontWeight: 700
        }}>
          <CheckCircle size={20} />
          <span>{t.productAddedBanner}</span>
        </div>
      )}

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1.5px dashed var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{ fontSize: '3rem' }}>🧺</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {lang === 'hi' ? 'कोई उत्पाद नहीं मिला' : 'No Products Found'}
          </h3>
          <p style={{ maxWidth: 420, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t.noProductsFound}
          </p>
          <button 
            className="btn btn-secondary" 
            onClick={handleClearFilters}
          >
            {t.clearFilters}
          </button>
        </div>
      )}

      {/* Product Cards Grid */}
      <div className="products-grid">
        {sortedProducts.map((product) => {
          const isNewlyAdded = product.id === newlyAddedId;

          return (
            <article 
              key={product.id} 
              className={`product-card ${isNewlyAdded ? 'new-highlight' : ''}`}
              style={isNewlyAdded ? { borderColor: 'var(--green-600)', borderWidth: '2px' } : {}}
            >
              {/* Product Image */}
              <div 
                className="product-image-wrap" 
                onClick={() => setActiveProductModal(product)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={product.image || getCategoryPlaceholder(product.category)}
                  alt={product.imageAlt || `${lang === 'hi' ? product.nameHi : product.nameEn} - ${product.category}`}
                  className="product-image"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = getCategoryPlaceholder(product.category);
                  }}
                />

                <div className="product-badge-overlay">
                  {product.isPlaceholder ? (
                    <span className="badge badge-subtle" style={{ background: 'rgba(255, 255, 255, 0.95)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                      {lang === 'hi' ? 'श्रेणी प्लेसहोल्डर' : 'Category Placeholder'}
                    </span>
                  ) : (
                    <span className={`badge ${product.badgeEn ? 'badge-primary' : 'badge-subtle'}`}>
                      {lang === 'hi' ? (product.badgeHi || 'सखी उत्पाद') : (product.badgeEn || 'Sakhi Item')}
                    </span>
                  )}
                </div>

                <div className="product-price-overlay">
                  ₹{product.price}
                </div>
              </div>

              {/* Product Info */}
              <div className="product-content">
                <div className="product-title-row">
                  <h3 
                    className="product-title"
                    onClick={() => setActiveProductModal(product)}
                    style={{ cursor: 'pointer', flex: 1, margin: 0 }}
                  >
                    {lang === 'hi' ? product.nameHi : product.nameEn}
                  </h3>
                  <button
                    type="button"
                    className="item-delete-btn"
                    title={t.deleteItemTooltip}
                    aria-label={t.deleteItemTooltip}
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(product);
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="seller-info-row">
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {product.sellerNameEn?.charAt(0) || 'S'}
                  </div>
                  <span style={{ fontWeight: 600 }}>
                    {lang === 'hi' ? product.sellerNameHi : product.sellerNameEn}
                  </span>
                  {product.shgNameEn && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      • {lang === 'hi' ? product.shgNameHi : product.shgNameEn}
                    </span>
                  )}
                </div>

                <div className="seller-location">
                  <MapPin size={14} style={{ flexShrink: 0 }} />
                  <span>{lang === 'hi' ? product.locationHi : product.locationEn}</span>
                </div>

                {/* Bottom Actions */}
                <div className="product-actions-row">
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                    onClick={() => setActiveProductModal(product)}
                  >
                    <span>{t.viewDetails}</span>
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    onClick={() => setActiveContactModal(product)}
                    title={t.contactSeller}
                  >
                    <MessageCircle size={16} />
                    <span>{lang === 'hi' ? 'संपर्क' : 'Contact'}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      {activeProductModal && (
        <div className="modal-overlay" onClick={() => setActiveProductModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            {/* Modal Header */}
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                {lang === 'hi' ? activeProductModal.nameHi : activeProductModal.nameEn}
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setActiveProductModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Product Image */}
              <div style={{
                width: '100%',
                maxHeight: 280,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: 'var(--bg-subtle)'
              }}>
                <img
                  src={activeProductModal.image || getCategoryPlaceholder(activeProductModal.category)}
                  alt={activeProductModal.imageAlt || `${lang === 'hi' ? activeProductModal.nameHi : activeProductModal.nameEn} - ${activeProductModal.category}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = getCategoryPlaceholder(activeProductModal.category);
                  }}
                />
              </div>

              {/* Category Placeholder Notice */}
              {activeProductModal.isPlaceholder && (
                <div style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                  <span>
                    {lang === 'hi' 
                      ? 'कारीगर द्वारा अभी तक इस उत्पाद की वास्तविक फोटो अपलोड नहीं की गई है। यहाँ श्रेणी का प्लेसहोल्डर प्रदर्शित है।'
                      : 'Note: Authentic artisan photo pending upload. Displaying neutral category placeholder.'}
                  </span>
                </div>
              )}

              {/* Price & Unit Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'var(--primary-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-200)'
              }}>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {lang === 'hi' ? 'कीमत / मात्रा' : 'Price / Unit'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                      ₹{activeProductModal.price}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      / {activeProductModal.unit || (lang === 'hi' ? 'प्रति पीस' : 'piece')}
                    </span>
                  </div>
                </div>

                <span className="badge badge-green">
                  {lang === 'hi' ? 'उपलब्ध' : 'In Stock'}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
                  {lang === 'hi' ? 'उत्पाद विवरण' : 'Description'}
                </h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {lang === 'hi' ? activeProductModal.descriptionHi : activeProductModal.descriptionEn}
                </p>
              </div>

              {/* Ingredients / Materials if available */}
              {activeProductModal.ingredients && (
                <div style={{
                  background: 'var(--bg-canvas)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-muted)' }}>
                    {t.ingredientsTitle}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {activeProductModal.ingredients}
                  </p>
                </div>
              )}

              {/* Seller Story / SHG Box */}
              <div style={{
                background: 'var(--accent-50)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-200)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-800)' }}>
                    {t.sellerStoryTitle}
                  </span>
                  <span className="badge badge-accent">
                    {t.verifiedSHG}
                  </span>
                </div>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lang === 'hi' ? activeProductModal.sellerNameHi : activeProductModal.sellerNameEn}
                  {activeProductModal.shgNameEn && ` • ${lang === 'hi' ? activeProductModal.shgNameHi : activeProductModal.shgNameEn}`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <MapPin size={14} />
                  <span>{lang === 'hi' ? activeProductModal.locationHi : activeProductModal.locationEn}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveProductModal(null)}
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  const prod = activeProductModal;
                  setActiveProductModal(null);
                  setActiveContactModal(prod);
                }}
              >
                <MessageCircle size={18} />
                <span>{t.contactSeller}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Contact Modal */}
      {activeContactModal && (
        <ContactModal
          product={activeContactModal}
          onClose={() => setActiveContactModal(null)}
          lang={lang}
        />
      )}

      {/* Item Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="modal-overlay" onClick={() => setItemToDelete(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-full)',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {t.deleteConfirmTitle}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {lang === 'hi' ? itemToDelete.nameHi : itemToDelete.nameEn}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              {t.deleteConfirmText}
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => setItemToDelete(null)}
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  background: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '8px 18px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (onDeleteProduct) {
                    onDeleteProduct(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
              >
                {t.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast Notification */}
      {deletedRecord && (
        <div className="undo-toast" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>🗑️</span>
            <span>
              {t.itemDeletedToast} ({lang === 'hi' ? deletedRecord.product.nameHi : deletedRecord.product.nameEn})
            </span>
          </div>
          <button 
            type="button"
            className="undo-toast-btn"
            onClick={onUndoDelete}
          >
            {t.undoBtn}
          </button>
        </div>
      )}
    </div>
  );
}
