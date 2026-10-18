import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CATEGORIES } from '../data/categories';
import { PRESET_IMAGE_OPTIONS, getCategoryPlaceholder } from '../data/products';
import { TRANSLATIONS } from '../data/translations';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { insertProduct, uploadProductImage } from '../lib/productsService';
import { 
  PlusCircle, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Store, 
  RefreshCw,
  ShieldCheck,
  LogIn,
  Loader
} from 'lucide-react';

export default function AddProductView({ 
  initialPrice, 
  onProductCreated, 
  onNavigateToMarket, 
  onSelectTab,
  lang 
}) {
  const t = TRANSLATIONS[lang];
  const { user, isAuthenticated } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('food');
  const [price, setPrice] = useState(initialPrice ? String(initialPrice) : '');
  const [unit, setUnit] = useState(lang === 'hi' ? '1 किलो जार' : '1 kg Jar');
  const [sellerName, setSellerName] = useState('');
  const [shgName, setShgName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGE_OPTIONS[0].url);
  const [customImageFile, setCustomImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill artisan name if logged in
  useEffect(() => {
    if (user?.name && !sellerName) {
      setSellerName(user.name);
    }
  }, [user]);

  // Validation errors
  const [errors, setErrors] = useState({});
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);

  // If initialPrice changed from Calculator
  useEffect(() => {
    if (initialPrice) {
      setPrice(String(initialPrice));
    }
  }, [initialPrice]);

  // Handle custom image upload (preview only – actual upload happens on submit)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result); // local preview
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = lang === 'hi' ? 'उत्पाद का नाम आवश्यक है' : 'Product name is required';
    if (!category) errs.category = lang === 'hi' ? 'श्रेणी चुनें' : 'Category is required';
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      errs.price = lang === 'hi' ? 'मान्य कीमत (शून्य से अधिक) दर्ज करें' : 'Enter a valid price greater than 0';
    }
    if (!sellerName.trim()) errs.sellerName = lang === 'hi' ? 'कारीगर का नाम आवश्यक है' : 'Artisan name is required';
    if (!location.trim()) errs.location = lang === 'hi' ? 'गाँव या शहर का नाम आवश्यक है' : 'Location is required';
    if (!description.trim()) errs.description = lang === 'hi' ? 'संक्षिप्त विवरण आवश्यक है' : 'Description is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    const isPlaceholderImg =
      typeof selectedImage === 'string' &&
      !selectedImage.startsWith('data:') &&
      selectedImage.includes('/placeholders/');

    // ── Upload image to Supabase Storage if user picked a file ──────
    let imageUrl = isPlaceholderImg ? selectedImage : null;
    let isPlaceholder = isPlaceholderImg;

    if (customImageFile instanceof File && isSupabaseConfigured) {
      setIsUploading(true);
      const { url, error: uploadErr } = await uploadProductImage(customImageFile, user?.id);
      setIsUploading(false);
      if (uploadErr) {
        // Non-fatal: fall back to placeholder so the listing still gets created
        console.warn('[AddProduct] Image upload failed, using placeholder:', uploadErr);
        imageUrl = getCategoryPlaceholder(category);
        isPlaceholder = true;
      } else {
        imageUrl = url;
        isPlaceholder = false;
      }
    } else if (customImageFile instanceof File) {
      // Supabase not configured – use data-URL (local preview only, not cross-device)
      imageUrl = selectedImage;
      isPlaceholder = false;
    } else if (!isPlaceholderImg) {
      // User picked a preset that isn't a placeholder (e.g. the mango pickle photo)
      imageUrl = selectedImage;
      isPlaceholder = false;
    }

    const formData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      unit: unit.trim() || '1 piece',
      category,
      sellerName: sellerName.trim(),
      shgName: shgName.trim(),
      location: location.trim(),
      phone: phone.trim(),
      imageUrl: imageUrl || getCategoryPlaceholder(category),
      isPlaceholder,
    };

    // ── Save to Supabase (or fall back to in-memory if not configured) ──
    let newProd;
    if (isSupabaseConfigured) {
      const { data, error } = await insertProduct(formData, user);
      if (error) {
        setSubmitError(error);
        setIsSubmitting(false);
        return;
      }
      newProd = data;
    } else {
      // Supabase not configured – optimistic in-memory product (demo mode)
      newProd = {
        id: `prod-local-${Date.now()}`,
        nameEn: formData.name,
        nameHi: formData.name,
        category: formData.category,
        price: formData.price,
        unit: formData.unit,
        sellerNameEn: formData.sellerName,
        sellerNameHi: formData.sellerName,
        shgNameEn: formData.shgName || 'Sakhi Self Help Group',
        shgNameHi: formData.shgName || 'सखी स्वयं सहायता समूह',
        locationEn: formData.location,
        locationHi: formData.location,
        image: formData.imageUrl,
        imageAlt: formData.name + ' artisan product photo',
        isPlaceholder: formData.isPlaceholder,
        descriptionEn: formData.description,
        descriptionHi: formData.description,
        contactPhone: formData.phone || '+91 98290 12345',
        userId: user?.id,
        userEmail: user?.email,
        inStock: true,
        badgeEn: formData.isPlaceholder ? 'Artisan Listing' : 'Photo Attached',
        badgeHi: formData.isPlaceholder ? 'कारीगर उत्पाद' : 'फोटो संलग्न',
        _fromDb: false,
      };
    }

    // Confetti celebration!
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // safe fallback
    }

    setCreatedProduct(newProd);
    setIsSubmittedSuccess(true);
    setIsSubmitting(false);
    onProductCreated(newProd);
  };

  const handleResetForm = () => {
    setName('');
    setCategory('food');
    setPrice('');
    setUnit(lang === 'hi' ? '1 किलो जार' : '1 kg Jar');
    setSellerName('');
    setShgName('');
    setLocation('');
    setPhone('');
    setDescription('');
    setSelectedImage(PRESET_IMAGE_OPTIONS[0].url);
    setCustomImageFile(null);
    setIsSubmittedSuccess(false);
    setCreatedProduct(null);
    setErrors({});
    setSubmitError(null);
  };

  return (
    <div className="add-product-view">
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">
          <PlusCircle size={24} style={{ color: 'var(--primary-500)' }} />
          <span>{t.addProductTitle}</span>
        </h2>
        <p className="section-sub">{t.addProductSub}</p>
      </div>

      {/* If Not Authenticated: Protected Gate */}
      {!isAuthenticated ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '44px 24px',
          textAlign: 'center',
          maxWidth: 560,
          margin: '0 auto',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-100)',
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem'
          }}>
            <ShieldCheck size={32} />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {lang === 'hi' ? 'उत्पाद जोड़ने के लिए गूगल साइन-इन आवश्यक है' : 'Sign in with Google to List Products'}
          </h3>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.6, margin: 0 }}>
            {lang === 'hi' 
              ? 'सखी टेक पर प्रामाणिक ग्रामीण कारीगरों की सुरक्षा और खरीदारों के विश्वास के लिए उत्पाद जोड़ने से पहले गूगल साइन-इन आवश्यक है।'
              : 'To maintain verified artisan listings and protect against fake products, Google authentication is required before listing items in the marketplace.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 12 }}>
            <button 
              type="button"
              className="btn btn-primary"
              onClick={() => onSelectTab && onSelectTab('signin')}
            >
              <LogIn size={18} />
              <span>{lang === 'hi' ? 'गूगल से साइन-इन करें' : 'Sign In with Google'}</span>
            </button>

            <button 
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateToMarket}
            >
              <Store size={18} />
              <span>{lang === 'hi' ? 'बाज़ार देखें' : 'Browse Marketplace'}</span>
            </button>
          </div>
        </div>
      ) : isSubmittedSuccess && createdProduct ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--green-600)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: 600,
          margin: '0 auto'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-full)',
            background: 'var(--green-100)',
            color: 'var(--green-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            🎉
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green-700)' }}>
            {t.successTitle}
          </h3>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 460 }}>
            {t.successDesc}
          </p>

          {/* Mini Preview of Listed Product */}
          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            width: '100%',
            maxWidth: 420,
            textAlign: 'left'
          }}>
            <img 
              src={createdProduct.image || getCategoryPlaceholder(createdProduct.category)} 
              alt={createdProduct.imageAlt || createdProduct.nameEn}
              style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = getCategoryPlaceholder(createdProduct.category);
              }}
            />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{createdProduct.nameEn}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {createdProduct.sellerNameEn} • {createdProduct.locationEn}
              </p>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                ₹{createdProduct.price}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={onNavigateToMarket}
            >
              <Store size={18} />
              <span>{t.viewInMarketBtn}</span>
              <ArrowRight size={18} />
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleResetForm}
            >
              <RefreshCw size={16} />
              <span>{t.addAnotherBtn}</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
          <form className="form-card" onSubmit={handleSubmit} noValidate>
            {/* Authenticated user badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--green-50)',
              border: '1px solid var(--green-600)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--green-700)', fontWeight: 800 }}>✓</span>
                <span style={{ color: 'var(--green-800)', fontWeight: 600 }}>
                  {lang === 'hi' ? `प्रमाणित सखी खाता: ${user?.name}` : `Verified Artisan Account: ${user?.name}`} ({user?.email})
                </span>
              </div>
            </div>

            {/* If initialPrice was imported from Calculator */}
            {initialPrice && (
              <div style={{
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-300)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.9rem',
                color: 'var(--primary-800)',
                fontWeight: 600
              }}>
                <Sparkles size={18} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                <span>
                  {lang === 'hi' 
                    ? `कैलकुलेटर से सुझाया गया दाम ₹${initialPrice} स्वतः भर दिया गया है!` 
                    : `Suggested price ₹${initialPrice} from Pricing Calculator has been auto-filled!`}
                </span>
              </div>
            )}

            <div className="form-grid">
              {/* Product Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="prod-name">
                  {t.productNameLabel}
                </label>
                <input
                  id="prod-name"
                  type="text"
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  placeholder={t.productNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              {/* Category & Price in 2 Columns */}
              <div className="form-grid-2col" style={{ display: 'grid', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-cat">
                    {t.categoryLabel}
                  </label>
                  <select
                    id="prod-cat"
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {lang === 'hi' ? cat.nameHi : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-price">
                    {t.priceLabel}
                  </label>
                  <div className="calc-input-wrap">
                    <span className="calc-rupee-symbol">₹</span>
                    <input
                      id="prod-price"
                      type="number"
                      min="1"
                      className={`form-control ${errors.price ? 'error' : ''}`}
                      style={{ paddingLeft: '34px' }}
                      placeholder={t.pricePlaceholder}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  {errors.price && <span className="field-error">{errors.price}</span>}
                </div>
              </div>

              {/* Unit & Phone */}
              <div className="form-grid-2col" style={{ display: 'grid', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-unit">
                    {t.unitLabel}
                  </label>
                  <input
                    id="prod-unit"
                    type="text"
                    className="form-control"
                    placeholder={t.unitPlaceholder}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-phone">
                    {t.phoneLabel}
                  </label>
                  <input
                    id="prod-phone"
                    type="tel"
                    className="form-control"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Seller Name & SHG */}
              <div className="form-grid-2col" style={{ display: 'grid', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-seller">
                    {t.sellerNameLabel}
                  </label>
                  <input
                    id="prod-seller"
                    type="text"
                    className={`form-control ${errors.sellerName ? 'error' : ''}`}
                    placeholder={t.sellerNamePlaceholder}
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                  />
                  {errors.sellerName && <span className="field-error">{errors.sellerName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-shg">
                    {t.shgNameLabel}
                  </label>
                  <input
                    id="prod-shg"
                    type="text"
                    className="form-control"
                    placeholder={t.shgNamePlaceholder}
                    value={shgName}
                    onChange={(e) => setShgName(e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label" htmlFor="prod-loc">
                  {t.locationInputLabel}
                </label>
                <input
                  id="prod-loc"
                  type="text"
                  className={`form-control ${errors.location ? 'error' : ''}`}
                  placeholder={t.locationPlaceholder}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {errors.location && <span className="field-error">{errors.location}</span>}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="prod-desc">
                  {t.descLabel}
                </label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  className={`form-control ${errors.description ? 'error' : ''}`}
                  placeholder={t.descPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errors.description && <span className="field-error">{errors.description}</span>}
              </div>

              {/* Photo Selection: Presets or Upload */}
              <div className="form-group">
                <label className="form-label">
                  {t.photoSelectLabel}
                </label>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {t.chooseFromPresets}
                </p>

                <div className="preset-image-grid">
                  {PRESET_IMAGE_OPTIONS.map((img) => (
                    <div
                      key={img.id}
                      className={`preset-image-box ${selectedImage === img.url ? 'selected' : ''}`}
                      onClick={() => setSelectedImage(img.url)}
                      title={lang === 'hi' ? img.nameHi : img.nameEn}
                    >
                      <img 
                        src={img.url} 
                        alt={lang === 'hi' ? img.nameHi : img.nameEn} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = getCategoryPlaceholder(category);
                        }}
                      />
                      {selectedImage === img.url && (
                        <div className="check-badge">✓</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Custom File Upload Option */}
                <div style={{ marginTop: '12px' }}>
                  <label 
                    htmlFor="custom-photo-file"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      background: 'var(--bg-canvas)',
                      border: '1.5px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Upload size={16} />
                    <span>{customImageFile ? `Uploaded: ${customImageFile}` : t.uploadCustomPhoto}</span>
                  </label>
                  <input
                    id="custom-photo-file"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* Submit error */}
              {submitError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #F87171',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  color: '#B91C1C',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ padding: '14px', fontSize: '1rem', marginTop: '10px' }}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting || isUploading
                  ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>{lang === 'hi' ? 'सहेज रहे हैं…' : 'Saving…'}</span></>
                  : <><PlusCircle size={20} /><span>{t.submitProductBtn}</span></>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
