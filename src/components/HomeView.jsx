import React, { useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { TRANSLATIONS } from '../data/translations';
import { narrator } from '../utils/speech';
import { 
  ArrowRight, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  BookOpen, 
  Calculator,
  Calendar
} from 'lucide-react';

export default function HomeView({ onSelectTab, onSelectCategory, lang }) {
  const t = TRANSLATIONS[lang];
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleAudioGreeting = () => {
    if (isSpeaking) {
      narrator.stop();
      setIsSpeaking(false);
    } else {
      const greetingText = lang === 'hi' 
        ? 'नमस्ते सखी बहन! सखी टेक में आपका हार्दिक स्वागत है। यहाँ आप व्यापार के गुर सीख सकती हैं, सही दाम निकाल सकती हैं और अपने हाथ से बने सामान को सीधे ग्राहकों तक पहुंचा सकती हैं। चलिए मिलकर शुरुआत करें!'
        : 'Welcome Sister to Sakhi Tech! Here you can learn practical business skills, calculate fair prices for your products, and showcase your handmade crafts directly to buyers. Let us build your dream business together!';
      
      narrator.speak(greetingText, lang, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  };

  return (
    <div className="home-view">
      {/* Hero Card */}
      <section className="hero-card" aria-label="Welcome Banner">
        <div className="hero-content">
          <div className="hero-tag">
            <Sparkles size={16} />
            <span>{t.heroTag}</span>
          </div>

          <h2 className="hero-title">{t.heroTitle}</h2>
          <p className="hero-sub">{t.heroSub}</p>

          <div className="hero-cta-group">
            <button 
              className="btn btn-primary"
              onClick={() => onSelectTab('learn')}
            >
              <span>{t.getStartedBtn}</span>
              <ArrowRight size={18} />
            </button>

            <button 
              className="btn btn-secondary"
              onClick={() => onSelectTab('marketplace')}
            >
              <ShoppingBag size={18} />
              <span>{t.exploreMarketBtn}</span>
            </button>

            <button 
              className={`audio-button ${isSpeaking ? 'playing' : ''}`}
              onClick={handleAudioGreeting}
              aria-label="Audio Welcome"
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span>{isSpeaking ? (lang === 'hi' ? 'आवाज़ बंद करें' : 'Stop Audio') : t.audioListenWelcome}</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Box / Impact Dashboard */}
        <div className="hero-visual-box">
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <h4>{t.statWomen}</h4>
              <p>{t.statWomenLabel}</p>
            </div>
            <div className="hero-stat-item">
              <h4>{t.statEarned}</h4>
              <p>{t.statEarnedLabel}</p>
            </div>
            <div className="hero-stat-item">
              <h4>{t.statClusters}</h4>
              <p>{t.statClustersLabel}</p>
            </div>
          </div>

          <div className="hero-feature-preview">
            <div className="avatar">🪔</div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {lang === 'hi' ? 'कमला देवी (सखी लीडर, भीलवाड़ा)' : 'Kamala Devi (SHG Leader)'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {lang === 'hi' ? '“पहले 1 किलो अचार ₹120 में बेचती थी, अब सखी कैलकुलेटर से ₹220 में सीधे बेचकर हर महीने ₹18,000 कमा रही हूँ।”' : '“I used to sell pickles at a loss for ₹120. With Sakhi Tech pricing, I now sell at ₹220 directly to buyers!”'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main User Journey - 4 Simple Steps */}
      <section className="journey-section" style={{ marginBottom: '36px' }}>
        <div className="section-header">
          <h2 className="section-title">
            <TrendingUp size={24} style={{ color: 'var(--primary-500)' }} />
            <span>{t.journeyTitle}</span>
          </h2>
          <p className="section-sub">{t.journeySub}</p>
        </div>

        <div className="journey-grid">
          {/* Step 1 */}
          <div 
            className="journey-step-card"
            onClick={() => onSelectTab('marketplace')}
          >
            <div className="step-number">1</div>
            <h3>{t.step1Title}</h3>
            <p>{t.step1Desc}</p>
            <div className="step-cta">
              <span>{lang === 'hi' ? 'श्रेणी देखें' : 'View Categories'}</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Step 2 */}
          <div 
            className="journey-step-card"
            onClick={() => onSelectTab('learn')}
          >
            <div className="step-number">2</div>
            <h3>{t.step2Title}</h3>
            <p>{t.step2Desc}</p>
            <div className="step-cta">
              <span>{lang === 'hi' ? 'हुनर सीखें' : 'Read Lessons'}</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Step 3 */}
          <div 
            className="journey-step-card"
            onClick={() => onSelectTab('calculator')}
          >
            <div className="step-number">3</div>
            <h3>{t.step3Title}</h3>
            <p>{t.step3Desc}</p>
            <div className="step-cta">
              <span>{lang === 'hi' ? 'दाम निकालें' : 'Calculate Price'}</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Step 4 */}
          <div 
            className="journey-step-card"
            onClick={() => onSelectTab('add-product')}
          >
            <div className="step-number">4</div>
            <h3>{t.step4Title}</h3>
            <p>{t.step4Desc}</p>
            <div className="step-cta">
              <span>{lang === 'hi' ? 'उत्पाद जोड़ें' : 'List Product'}</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Business Categories */}
      <section className="categories-section" style={{ marginBottom: '36px' }}>
        <div className="section-header">
          <h2 className="section-title">
            <span>{t.categoriesTitle}</span>
          </h2>
          <p className="section-sub">{t.categoriesSub}</p>
        </div>

        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <div 
              key={cat.id} 
              className="category-card"
              style={{ '--cat-color': cat.color }}
              onClick={() => onSelectCategory(cat.id)}
            >
              <div className="category-header-row">
                <span className="category-emoji">{cat.emoji}</span>
                <span className="category-count">{cat.count}</span>
              </div>
              <h3>{lang === 'hi' ? cat.nameHi : cat.nameEn}</h3>
              <p>{lang === 'hi' ? cat.taglineHi : cat.taglineEn}</p>
              
              <div className="popular-chips">
                {cat.popular.map((item, idx) => (
                  <span key={idx} className="popular-chip">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links Strip */}
      <section className="quick-actions-section">
        <div className="quick-action-strip">
          <div 
            className="quick-action-card"
            style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA' }}
            onClick={() => onSelectTab('learn')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#9A3412' }}>
                {lang === 'hi' ? '3-मिनट के व्यापारिक पाठ' : '3-Minute Business Lessons'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#C2410C' }}>
                {lang === 'hi' ? 'पैकेजिंग, फोटो और व्हाट्सएप से बिक्री सीखें' : 'Master packing, smartphone photos & WhatsApp'}
              </p>
            </div>
          </div>

          <div 
            className="quick-action-card"
            style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0' }}
            onClick={() => onSelectTab('calculator')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#16A34A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#166534' }}>
                {lang === 'hi' ? 'सटीक दाम कैलकुलेटर' : 'Fair Pricing Calculator'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#15803D' }}>
                {lang === 'hi' ? 'कच्चा माल + समय + मुनाफा जोड़कर बेचें' : 'Include materials + labor + fair profit'}
              </p>
            </div>
          </div>

          <div 
            className="quick-action-card"
            style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}
            onClick={() => onSelectTab('opportunities')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#1E40AF' }}>
                {lang === 'hi' ? 'ज़िला मेले व सरकारी योजनाएं' : 'Melas & Govt Support'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#1D4ED8' }}>
                {lang === 'hi' ? 'मुफ्त स्टॉल, टूलकिट व प्रशिक्षण शिविर' : 'Free stalls, artisan grants & workshops'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
