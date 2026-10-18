import React, { useState } from 'react';
import { TRANSLATIONS } from '../data/translations';
import { narrator } from '../utils/speech';
import { 
  Calculator, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Check, 
  TrendingUp, 
  HelpCircle,
  ShoppingBag
} from 'lucide-react';

export default function CalculatorView({ onUsePriceForProduct, lang }) {
  const t = TRANSLATIONS[lang];

  // Calculator inputs
  const [materialCost, setMaterialCost] = useState('115');
  const [extraCost, setExtraCost] = useState('25');
  const [laborCost, setLaborCost] = useState('40');
  const [profitMargin, setProfitMargin] = useState(25); // percentage
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Parse numbers safely
  const mat = Math.max(0, parseFloat(materialCost) || 0);
  const ext = Math.max(0, parseFloat(extraCost) || 0);
  const lab = Math.max(0, parseFloat(laborCost) || 0);
  const margin = Math.max(0, parseFloat(profitMargin) || 0);

  // Calculations
  const directCost = mat + ext;
  const baseCostWithLabor = directCost + lab;
  const profitAmount = Math.round(baseCostWithLabor * (margin / 100));
  const suggestedSellingPrice = baseCostWithLabor + profitAmount;
  const totalArtisanEarnings = lab + profitAmount; // Hard work reward + business profit

  const presets = [
    {
      nameEn: '1kg Mango Pickle',
      nameHi: '1 किलो आम का अचार',
      mat: 115,
      ext: 25,
      lab: 40,
      margin: 25
    },
    {
      nameEn: 'Embroidered Khadi Kurta',
      nameHi: 'कढ़ाई वाला खादी कुर्ता',
      mat: 220,
      ext: 30,
      lab: 120,
      margin: 20
    },
    {
      nameEn: 'Terracotta Jug & 2 Cups',
      nameHi: 'मिट्टी का जग व 2 कुल्हड़',
      mat: 80,
      ext: 35,
      lab: 90,
      margin: 30
    },
    {
      nameEn: 'Cold-Pressed Oil (1L)',
      nameHi: 'कच्ची घानी तेल (1 लीटर)',
      mat: 160,
      ext: 25,
      lab: 35,
      margin: 20
    }
  ];

  const applyPreset = (preset) => {
    setMaterialCost(String(preset.mat));
    setExtraCost(String(preset.ext));
    setLaborCost(String(preset.lab));
    setProfitMargin(preset.margin);
  };

  const resetFields = () => {
    setMaterialCost('');
    setExtraCost('');
    setLaborCost('');
    setProfitMargin(20);
  };

  // Plain language explanation string
  const plainExplanation = lang === 'hi'
    ? `अगर आपका कच्चा माल ₹${mat} और पैकिंग-किराया ₹${ext} है, तो कुल बुनियादी खर्च ₹${directCost} हुआ। अपनी मेहनत के ₹${lab} और ${margin}% मुनाफे (₹${profitAmount}) को मिलाकर, आपको यह सामान कम से कम ₹${suggestedSellingPrice} में बेचना चाहिए ताकि आपको कुल ₹${totalArtisanEarnings} की शुद्ध कमाई हो सके!`
    : `If raw materials cost ₹${mat} and packaging/transport is ₹${ext}, your production expense is ₹${directCost}. Adding ₹${lab} for your labor and a ${margin}% profit (₹${profitAmount}), you should sell for at least ₹${suggestedSellingPrice}. This guarantees you earn ₹${totalArtisanEarnings} for your hard work!`;

  const handleAudioExplain = () => {
    if (isSpeaking) {
      narrator.stop();
      setIsSpeaking(false);
    } else {
      narrator.speak(plainExplanation, lang, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  };

  return (
    <div className="calculator-view">
      {/* Page Title Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">
          <Calculator size={24} style={{ color: 'var(--primary-500)' }} />
          <span>{t.calcTitle}</span>
        </h2>
        <p className="section-sub">{t.calcSub}</p>
      </div>

      {/* Preset Buttons for Quick Testing */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
          {lang === 'hi' ? 'त्वरित उदाहरण (क्लिक करके जांचें):' : 'Quick Samples (Click to test):'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem', minHeight: 36 }}
              onClick={() => applyPreset(p)}
            >
              <span>{lang === 'hi' ? p.nameHi : p.nameEn}</span>
            </button>
          ))}
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', minHeight: 36, color: 'var(--text-muted)' }}
            onClick={resetFields}
            title={t.resetCalc}
          >
            <RotateCcw size={14} />
            <span>{t.resetCalc}</span>
          </button>
        </div>
      </div>

      <div className="calculator-container">
        {/* Input Form Card */}
        <div className="calc-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{lang === 'hi' ? 'लागत और मेहनत का हिसाब' : 'Cost & Labor Inputs'}</span>
          </h3>

          {/* Field 1: Raw Material Cost */}
          <div className="calc-field-group">
            <label className="calc-label" htmlFor="material-cost">
              <span>{t.materialCostLabel}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                {lang === 'hi' ? 'ज़रूरी' : 'Required'}
              </span>
            </label>
            <p className="calc-hint">{t.materialCostHint}</p>
            <div className="calc-input-wrap">
              <span className="calc-rupee-symbol">₹</span>
              <input
                id="material-cost"
                type="number"
                min="0"
                step="5"
                className="calc-input"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Field 2: Extra Costs */}
          <div className="calc-field-group">
            <label className="calc-label" htmlFor="extra-cost">
              <span>{t.extraCostLabel}</span>
            </label>
            <p className="calc-hint">{t.extraCostHint}</p>
            <div className="calc-input-wrap">
              <span className="calc-rupee-symbol">₹</span>
              <input
                id="extra-cost"
                type="number"
                min="0"
                step="5"
                className="calc-input"
                value={extraCost}
                onChange={(e) => setExtraCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Field 3: Labor & Time */}
          <div className="calc-field-group">
            <label className="calc-label" htmlFor="labor-cost">
              <span>{t.laborCostLabel}</span>
            </label>
            <p className="calc-hint">{t.laborCostHint}</p>
            <div className="calc-input-wrap">
              <span className="calc-rupee-symbol">₹</span>
              <input
                id="labor-cost"
                type="number"
                min="0"
                step="5"
                className="calc-input"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Field 4: Desired Profit Margin Slider & Input */}
          <div className="calc-field-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="calc-label" style={{ marginBottom: 0 }}>
                {t.profitMarginLabel}
              </label>
              <span style={{ 
                background: 'var(--accent-100)', 
                color: 'var(--accent-800)', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 800,
                fontSize: '0.95rem'
              }}>
                {profitMargin}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
              style={{ 
                width: '100%', 
                accentColor: 'var(--primary-500)', 
                cursor: 'pointer',
                height: '8px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>5% (न्यूनतम)</span>
              <span>25% (सुझाया गया)</span>
              <span>60% (प्रीमियम)</span>
            </div>
          </div>
        </div>

        {/* Calculated Result Card */}
        <div className="calc-result-box">
          <div className="suggested-price-badge">
            <p>{t.suggestedPrice}</p>
            <h2>₹{suggestedSellingPrice}</h2>
            <span className="badge badge-green" style={{ marginTop: 4 }}>
              <TrendingUp size={14} />
              <span>{lang === 'hi' ? `आपकी कमाई: ₹${totalArtisanEarnings}` : `Your Total Earnings: ₹${totalArtisanEarnings}`}</span>
            </span>
          </div>

          {/* Breakdown Table */}
          <div className="calc-breakdown-table">
            <div className="breakdown-row">
              <span>{lang === 'hi' ? 'कच्चा माल (सामग्री)' : 'Raw Materials'}</span>
              <span style={{ fontWeight: 600 }}>₹{mat}</span>
            </div>
            <div className="breakdown-row">
              <span>{lang === 'hi' ? 'किराया व पैकेजिंग' : 'Transport & Packing'}</span>
              <span style={{ fontWeight: 600 }}>₹{ext}</span>
            </div>
            <div className="breakdown-row">
              <span>{lang === 'hi' ? 'आपकी मेहनत (मजदूरी)' : 'Your Labor & Time'}</span>
              <span style={{ fontWeight: 600, color: 'var(--green-700)' }}>+ ₹{lab}</span>
            </div>
            <div className="breakdown-row">
              <span>{lang === 'hi' ? `अतिरिक्त मुनाफा (${margin}%)` : `Profit Margin (${margin}%)`}</span>
              <span style={{ fontWeight: 600, color: 'var(--green-700)' }}>+ ₹{profitAmount}</span>
            </div>
            <div className="breakdown-row total">
              <span>{t.suggestedPrice}</span>
              <span style={{ fontSize: '1.2rem', color: 'var(--primary-600)' }}>₹{suggestedSellingPrice}</span>
            </div>
          </div>

          {/* Plain Language Box */}
          <div className="plain-language-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{t.calcExplanationTitle}</span>
              <button 
                className={`audio-button ${isSpeaking ? 'playing' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: 28 }}
                onClick={handleAudioExplain}
                title="Listen to explanation"
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isSpeaking ? 'Stop' : (lang === 'hi' ? 'सुनें' : 'Listen')}</span>
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
              {plainExplanation}
            </p>
          </div>

          {/* Action Button: Use this Price to List Product */}
          <button
            className="btn btn-primary btn-block"
            onClick={() => onUsePriceForProduct(suggestedSellingPrice)}
            style={{ padding: '14px 20px', fontSize: '1rem' }}
          >
            <ShoppingBag size={18} />
            <span>{t.usePriceBtn}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
