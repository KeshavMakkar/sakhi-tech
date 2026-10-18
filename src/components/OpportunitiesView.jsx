import React, { useState } from 'react';
import { OPPORTUNITIES } from '../data/opportunities';
import { TRANSLATIONS } from '../data/translations';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Gift, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Sparkles,
  Check,
  Send
} from 'lucide-react';

export default function OpportunitiesView({ lang }) {
  const t = TRANSLATIONS[lang];
  const [selectedType, setSelectedType] = useState('all');
  const [registeredIds, setRegisteredIds] = useState({});
  const [registrationModalOpp, setRegistrationModalOpp] = useState(null);
  const [sakhiName, setSakhiName] = useState('');
  const [sakhiPhone, setSakhiPhone] = useState('');
  const [sakhiVillage, setSakhiVillage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const filteredOpportunities = selectedType === 'all'
    ? OPPORTUNITIES
    : OPPORTUNITIES.filter(o => {
        if (selectedType === 'market') return o.type === 'market';
        if (selectedType === 'training') return o.type === 'training';
        if (selectedType === 'scheme') return o.type === 'scheme';
        return true;
      });

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registrationModalOpp) return;

    setRegisteredIds(prev => ({
      ...prev,
      [registrationModalOpp.id]: true
    }));

    setRegistrationModalOpp(null);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  return (
    <div className="opportunities-view">
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">
          <Calendar size={24} style={{ color: 'var(--primary-500)' }} />
          <span>{t.oppTitle}</span>
        </h2>
        <p className="section-sub">{t.oppSub}</p>
      </div>

      {/* Filter Chips */}
      <div className="filter-search-bar" style={{ marginBottom: '24px' }}>
        <div className="category-chips-scroll">
          <button
            className={`filter-chip ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            <span>{t.allOppTypes}</span>
          </button>
          <button
            className={`filter-chip ${selectedType === 'market' ? 'active' : ''}`}
            onClick={() => setSelectedType('market')}
          >
            <span>🎪</span>
            <span>{t.melaType}</span>
          </button>
          <button
            className={`filter-chip ${selectedType === 'training' ? 'active' : ''}`}
            onClick={() => setSelectedType('training')}
          >
            <span>📚</span>
            <span>{t.trainingType}</span>
          </button>
          <button
            className={`filter-chip ${selectedType === 'scheme' ? 'active' : ''}`}
            onClick={() => setSelectedType('scheme')}
          >
            <span>🏛️</span>
            <span>{t.schemeType}</span>
          </button>
        </div>
      </div>

      {/* Opportunities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredOpportunities.map((opp) => {
          const isRegistered = registeredIds[opp.id];

          return (
            <article key={opp.id} className="opportunity-card">
              <div className="opportunity-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="opp-demo-tag">{t.demoBadge}</span>
                    <span className="badge badge-accent">
                      {lang === 'hi' ? opp.badgeHi : opp.badgeEn}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {lang === 'hi' ? opp.titleHi : opp.titleEn}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t.organizerLabel}: {lang === 'hi' ? opp.organizerHi : opp.organizerEn}
                  </p>
                </div>

                <div style={{ alignSelf: 'flex-start' }}>
                  {isRegistered ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--green-100)',
                      color: 'var(--green-700)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      <CheckCircle2 size={16} />
                      <span>{lang === 'hi' ? 'पंजीकृत (Registered)' : 'Interest Recorded'}</span>
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                      onClick={() => setRegistrationModalOpp(opp)}
                    >
                      <Sparkles size={16} />
                      <span>{t.expressInterestBtn}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="opp-details-grid">
                <div className="opp-detail-item">
                  <span className="label">{t.datesLabel}</span>
                  <span className="val">{lang === 'hi' ? opp.datesHi : opp.datesEn}</span>
                </div>

                <div className="opp-detail-item">
                  <span className="label">{t.locationOppLabel}</span>
                  <span className="val">{lang === 'hi' ? opp.locationHi : opp.locationEn}</span>
                </div>

                <div className="opp-detail-item">
                  <span className="label">{t.eligibilityLabel}</span>
                  <span className="val">{lang === 'hi' ? opp.eligibilityHi : opp.eligibilityEn}</span>
                </div>

                <div className="opp-detail-item">
                  <span className="label">{t.benefitsLabel}</span>
                  <span className="val" style={{ color: 'var(--green-700)' }}>
                    {lang === 'hi' ? opp.benefitsHi : opp.benefitsEn}
                  </span>
                </div>
              </div>

              {/* Help & Contact Bar */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                paddingTop: 8,
                borderTop: '1px solid var(--border-color)',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} />
                  <span>{opp.contactPerson} ({opp.contactPhone})</span>
                </div>
                <div style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                  {lang === 'hi' ? opp.deadlineHi : opp.deadlineEn}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Registration Demo Modal */}
      {registrationModalOpp && (
        <div className="modal-overlay" onClick={() => setRegistrationModalOpp(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <span className="opp-demo-tag">{t.demoBadge}</span>
                <h3 style={{ fontSize: '1.15rem', marginTop: 4 }}>
                  {lang === 'hi' ? registrationModalOpp.titleHi : registrationModalOpp.titleEn}
                </h3>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {lang === 'hi' 
                    ? 'कृपया अपना विवरण भरें। इस अवसर की पुष्टि और स्टॉल/पास की जानकारी एसएमएस द्वारा भेजी जाएगी।'
                    : 'Enter your details to register interest. Confirmation and entry pass details will be sent via SMS.'}
                </p>

                <div className="form-group">
                  <label className="form-label">{lang === 'hi' ? 'सखी / कारीगर का नाम *' : 'Artisan Name *'}</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder={lang === 'hi' ? 'उदा. मीरा देवी' : 'e.g. Meera Devi'}
                    value={sakhiName}
                    onChange={(e) => setSakhiName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'hi' ? 'मोबाइल नंबर *' : 'Phone Number *'}</label>
                  <input
                    type="tel"
                    required
                    className="form-control"
                    placeholder="9829012345"
                    value={sakhiPhone}
                    onChange={(e) => setSakhiPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'hi' ? 'गाँव / शहर *' : 'Village / Town *'}</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder={lang === 'hi' ? 'उदा. किशनगढ़' : 'e.g. Kishangarh'}
                    value={sakhiVillage}
                    onChange={(e) => setSakhiVillage(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRegistrationModalOpp(null)}
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button type="submit" className="btn btn-primary">
                  <Send size={16} />
                  <span>{lang === 'hi' ? 'पुष्टि करें (Submit)' : 'Confirm Registration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {showToast && (
        <div className="toast-banner">
          <CheckCircle2 size={18} style={{ color: 'var(--green-400, #4ade80)' }} />
          <span>{t.registeredToast}</span>
        </div>
      )}
    </div>
  );
}
