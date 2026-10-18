import React, { useState } from 'react';
import { TRANSLATIONS } from '../data/translations';
import { buildWhatsAppContactUrl, validateWhatsAppNumber } from '../utils/whatsapp';
import { 
  X, 
  MessageCircle, 
  Phone, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Info
} from 'lucide-react';

export default function ContactModal({ product, onClose, lang = 'hi' }) {
  const t = TRANSLATIONS[lang];
  const [activeMode, setActiveMode] = useState('whatsapp'); // 'whatsapp' | 'call' | 'inquiry'
  const [quantity, setQuantity] = useState('1');
  const [buyerName, setBuyerName] = useState('');
  const [customNote, setCustomNote] = useState('');
  
  // WhatsApp state
  const [whatsAppOpened, setWhatsAppOpened] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState(null);

  // Inquiry form state
  const [buyerPhone, setBuyerPhone] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  // Call simulation state
  const [callInitiated, setCallInitiated] = useState(false);

  const phoneValidation = validateWhatsAppNumber(product?.contactPhone);

  const handleOpenWhatsApp = () => {
    setWhatsAppError(null);

    const contactResult = buildWhatsAppContactUrl({
      product,
      quantity,
      buyerName,
      customNote,
      lang
    });

    if (!contactResult.valid) {
      setWhatsAppError(t.invalidPhoneAlert);
      return;
    }

    // Open WhatsApp in a new tab/window
    try {
      window.open(contactResult.url, '_blank', 'noopener,noreferrer');
      setWhatsAppOpened(true);
    } catch {
      // Fallback
      window.location.href = contactResult.url;
      setWhatsAppOpened(true);
    }
  };

  const handleSendInquiry = (e) => {
    e.preventDefault();
    setInquirySent(true);
  };

  const handleInitiateCall = () => {
    setCallInitiated(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-100)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              {product.sellerNameEn?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', lineHeight: 1.3 }}>
                {t.contactSeller}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {lang === 'hi' ? product.sellerNameHi : product.sellerNameEn} • {lang === 'hi' ? product.locationHi : product.locationEn}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Product Summary Card */}
          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <img 
              src={product.image} 
              alt={product.imageAlt || product.nameEn} 
              style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                {lang === 'hi' ? product.nameHi : product.nameEn}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--primary-600)', fontWeight: 800, margin: '2px 0 0' }}>
                ₹{product.price} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {product.unit || 'unit'}</span>
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`filter-chip ${activeMode === 'whatsapp' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setActiveMode('whatsapp'); setWhatsAppError(null); setWhatsAppOpened(false); }}
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </button>
            <button
              className={`filter-chip ${activeMode === 'call' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setActiveMode('call'); setCallInitiated(false); }}
            >
              <Phone size={16} />
              <span>{t.callAction}</span>
            </button>
            <button
              className={`filter-chip ${activeMode === 'inquiry' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setActiveMode('inquiry'); setInquirySent(false); }}
            >
              <Send size={16} />
              <span>{lang === 'hi' ? 'आर्डर फॉर्म' : 'Order Form'}</span>
            </button>
          </div>

          {/* WhatsApp Direct Contact Mode */}
          {activeMode === 'whatsapp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* WhatsApp Disclaimer Notice */}
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: '0.82rem',
                color: '#92400E',
                lineHeight: 1.45
              }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{t.whatsAppDisclaimer}</span>
              </div>

              {/* Invalid Phone Warning */}
              {whatsAppError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #EF4444',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  color: '#B91C1C'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{whatsAppError}</span>
                </div>
              )}

              {/* WhatsApp Opened State Notice */}
              {whatsAppOpened && (
                <div style={{
                  background: 'var(--green-50)',
                  border: '1.5px solid var(--green-600)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.88rem',
                  color: 'var(--green-800)'
                }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--green-600)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, margin: 0 }}>
                      {t.openingWhatsAppNotice}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--green-700)', margin: '2px 0 0' }}>
                      {lang === 'hi' 
                        ? 'कारीगर से चैट में उपलब्धता और डिलीवरी पर चर्चा करें।' 
                        : 'Connect directly with the artisan to discuss availability and delivery.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Inquiry Customization Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    {lang === 'hi' ? 'मात्रा (Quantity)' : 'Quantity'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ minHeight: 40, fontSize: '0.9rem' }}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>
                    {lang === 'hi' ? 'आपका नाम (वैकल्पिक)' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ minHeight: 40, fontSize: '0.9rem' }}
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder={lang === 'hi' ? 'उदा. अनीता' : 'e.g. Anita'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  {lang === 'hi' ? 'विशेष संदेश या प्रश्न (वैकल्पिक)' : 'Message / Questions'}
                </label>
                <textarea
                  rows={2}
                  className="form-control"
                  style={{ minHeight: 60, fontSize: '0.88rem', resize: 'vertical' }}
                  placeholder={lang === 'hi' ? 'क्या होम डिलीवरी उपलब्ध है? सामग्री के बारे में बताएं...' : 'Is delivery available to my location?'}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>

              {/* WhatsApp Action Button */}
              <button
                className="btn btn-green btn-block"
                onClick={handleOpenWhatsApp}
                style={{ padding: '12px 18px', fontSize: '0.95rem' }}
              >
                <MessageCircle size={18} />
                <span>{t.openWhatsAppBtn}</span>
                <ExternalLink size={16} />
              </button>
            </div>
          )}

          {/* Direct Telephone Call Mode */}
          {activeMode === 'call' && (
            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-color)',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 'var(--radius-full)',
                background: callInitiated ? 'var(--green-600)' : 'var(--primary-500)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)'
              }}>
                <Phone size={28} />
              </div>

              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {lang === 'hi' ? product.sellerNameHi : product.sellerNameEn}
                </h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>
                  {product.contactPhone || '+91 98290 12345'}
                </p>
              </div>

              {callInitiated ? (
                <div style={{
                  background: 'var(--green-100)',
                  color: 'var(--green-700)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}>
                  {lang === 'hi' ? 'कॉल जारी है... (डेमो फोन कॉल)' : 'Simulating Outgoing Call... (Demo)'}
                </div>
              ) : (
                <a
                  href={`tel:${product.contactPhone ? product.contactPhone.replace(/\D/g, '') : '9829012345'}`}
                  className="btn btn-primary"
                  onClick={handleInitiateCall}
                  style={{ textDecoration: 'none' }}
                >
                  <Phone size={18} />
                  <span>{lang === 'hi' ? 'फोन लगाएं' : 'Dial Number'}</span>
                </a>
              )}
            </div>
          )}

          {/* Form Inquiry Mode */}
          {activeMode === 'inquiry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {inquirySent ? (
                <div style={{
                  background: 'var(--green-50)',
                  border: '1.5px solid var(--green-600)',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--green-600)' }} />
                  <h4 style={{ fontWeight: 800, color: 'var(--green-700)' }}>
                    {lang === 'hi' ? 'आर्डर अनुरोध प्राप्त हो गया!' : 'Order Request Submitted!'}
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {lang === 'hi'
                      ? `धन्यवाद! सखी कारीगर आपको पुष्टि और डिलीवरी के लिए सीधे संपर्क करेंगी।`
                      : `Thank you! The artisan will connect with you directly to confirm delivery and payment.`}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">{lang === 'hi' ? 'आपका नाम *' : 'Your Name *'}</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder={lang === 'hi' ? 'उदा. अनीता शर्मा' : 'e.g. Anita Sharma'}
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === 'hi' ? 'आपका फोन नंबर *' : 'Your Phone Number *'}</label>
                    <input
                      type="tel"
                      required
                      className="form-control"
                      placeholder="9876543210"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === 'hi' ? 'मात्रा (संख्या / पैकेट)' : 'Quantity'}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    <Send size={18} />
                    <span>{lang === 'hi' ? 'आर्डर अनुरोध भेजें' : 'Submit Order Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
