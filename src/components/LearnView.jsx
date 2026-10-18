import React, { useState } from 'react';
import { LESSONS } from '../data/lessons';
import { TRANSLATIONS } from '../data/translations';
import { narrator } from '../utils/speech';
import { 
  BookOpen, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  ArrowRight, 
  X, 
  Calculator, 
  Camera, 
  Package, 
  Share2,
  Sparkles,
  Users,
  FileText
} from 'lucide-react';

export default function LearnView({ onSelectTab, lang }) {
  const t = TRANSLATIONS[lang];
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [activeLesson, setActiveLesson] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [checklistProgress, setChecklistProgress] = useState({});

  const filteredLessons = selectedTopic === 'all'
    ? LESSONS
    : LESSONS.filter(l => l.category === selectedTopic);

  const handleToggleAudio = (text) => {
    if (isSpeaking) {
      narrator.stop();
      setIsSpeaking(false);
    } else {
      narrator.speak(text, lang, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  };

  const handleCloseModal = () => {
    narrator.stop();
    setIsSpeaking(false);
    setActiveLesson(null);
  };

  const toggleChecklistItem = (idx) => {
    setChecklistProgress(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="learn-view">
      {/* Page Title Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">
          <BookOpen size={24} style={{ color: 'var(--primary-500)' }} />
          <span>{t.learnTitle}</span>
        </h2>
        <p className="section-sub">{t.learnSub}</p>
      </div>

      {/* Topic Filter Chips */}
      <div className="filter-search-bar" style={{ marginBottom: '24px' }}>
        <div className="category-chips-scroll">
          <button 
            className={`filter-chip ${selectedTopic === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTopic('all')}
          >
            <span>{t.allTopics}</span>
          </button>
          <button 
            className={`filter-chip ${selectedTopic === 'pricing' ? 'active' : ''}`}
            onClick={() => setSelectedTopic('pricing')}
          >
            <Calculator size={15} />
            <span>{t.pricingTopic}</span>
          </button>
          <button 
            className={`filter-chip ${selectedTopic === 'photography' ? 'active' : ''}`}
            onClick={() => setSelectedTopic('photography')}
          >
            <Camera size={15} />
            <span>{t.photographyTopic}</span>
          </button>
          <button 
            className={`filter-chip ${selectedTopic === 'packaging' ? 'active' : ''}`}
            onClick={() => setSelectedTopic('packaging')}
          >
            <Package size={15} />
            <span>{t.packagingTopic}</span>
          </button>
          <button 
            className={`filter-chip ${selectedTopic === 'promotion' ? 'active' : ''}`}
            onClick={() => setSelectedTopic('promotion')}
          >
            <Share2 size={15} />
            <span>{t.promotionTopic}</span>
          </button>
          <button 
            className={`filter-chip ${selectedTopic === 'customer-service' ? 'active' : ''}`}
            onClick={() => setSelectedTopic('customer-service')}
          >
            <Users size={15} />
            <span>{t.customerServiceTopic}</span>
          </button>
          <button 
            className={`filter-chip ${selectedTopic === 'records' ? 'active' : ''}`}
            onClick={() => setSelectedTopic('records')}
          >
            <FileText size={15} />
            <span>{t.recordsTopic}</span>
          </button>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="lessons-grid">
        {filteredLessons.map((lesson) => (
          <article key={lesson.id} className="lesson-card">
            <div className="lesson-meta-row">
              <span className="badge badge-accent">
                {lang === 'hi' ? lesson.badgeHi : lesson.badgeEn}
              </span>
              <div className="lesson-time">
                <Clock size={14} />
                <span>{lesson.readTime} {t.estimatedReadTime}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: '1.8rem' }}>{lesson.emoji}</span>
              <h3>{lang === 'hi' ? lesson.titleHi : lesson.titleEn}</h3>
            </div>

            <p>{lang === 'hi' ? lesson.summaryHi : lesson.summaryEn}</p>

            <div className="lesson-footer-row">
              <button 
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                onClick={() => setActiveLesson(lesson)}
              >
                <span>{t.openLesson}</span>
                <ArrowRight size={15} />
              </button>

              <button 
                className={`audio-button ${isSpeaking && activeLesson?.id === lesson.id ? 'playing' : ''}`}
                onClick={() => handleToggleAudio(lesson.audioText)}
                title={t.listenAudio}
                aria-label={t.listenAudio}
              >
                {isSpeaking && activeLesson?.id === lesson.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>{lang === 'hi' ? 'सुनें' : 'Listen'}</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Full Lesson Interactive Modal */}
      {activeLesson && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.8rem' }}>{activeLesson.emoji}</span>
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: 4 }}>
                    {t.completeSampleLessonBadge}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                    {lang === 'hi' ? activeLesson.titleHi : activeLesson.titleEn}
                  </h3>
                </div>
              </div>
              <button 
                className="modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close Lesson"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Audio Listen Bar */}
              <div style={{ 
                background: 'var(--primary-50)', 
                border: '1px solid var(--primary-200)', 
                padding: '12px 16px', 
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Volume2 size={20} style={{ color: 'var(--primary-600)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {lang === 'hi' ? 'यह पाठ बोलकर सुनें' : 'Listen to this lesson read aloud'}
                  </span>
                </div>
                <button 
                  className={`audio-button ${isSpeaking ? 'playing' : ''}`}
                  onClick={() => handleToggleAudio(
                    (lang === 'hi' ? activeLesson.titleHi : activeLesson.titleEn) + '. ' + 
                    (lang === 'hi' ? activeLesson.summaryHi : activeLesson.summaryEn) + '. ' +
                    activeLesson.audioText
                  )}
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>{isSpeaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : (lang === 'hi' ? 'शुरू करें' : 'Play')}</span>
                </button>
              </div>

              {/* Lesson Summary */}
              <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {lang === 'hi' ? activeLesson.summaryHi : activeLesson.summaryEn}
              </p>

              {/* Lesson Step Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeLesson.sections.map((section, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px'
                    }}
                  >
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--primary-700)' }}>
                      {lang === 'hi' ? section.headingHi : section.headingEn}
                    </h4>
                    <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                      {lang === 'hi' ? section.contentHi : section.contentEn}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actionable Checklist */}
              <div style={{ 
                background: 'var(--accent-50)', 
                border: '1.5px solid var(--accent-300)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px' 
              }}>
                <h4 style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: 800, 
                  color: 'var(--accent-800, #92400e)', 
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Sparkles size={16} />
                  <span>{t.lessonChecklist}</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(lang === 'hi' ? activeLesson.checklistHi : activeLesson.checklistEn).map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => toggleChecklistItem(idx)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: '2px solid',
                        borderColor: checklistProgress[idx] ? 'var(--green-600)' : 'var(--accent-400)',
                        background: checklistProgress[idx] ? 'var(--green-600)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0
                      }}>
                        {checklistProgress[idx] && <CheckCircle size={16} />}
                      </div>
                      <span style={{ 
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: checklistProgress[idx] ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: checklistProgress[idx] ? 'line-through' : 'none'
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>

              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleCloseModal();
                  if (activeLesson.actionType === 'calculator') {
                    onSelectTab('calculator');
                  } else if (activeLesson.actionType === 'marketplace') {
                    onSelectTab('marketplace');
                  } else if (activeLesson.actionType === 'add-product') {
                    onSelectTab('add-product');
                  } else if (activeLesson.actionType === 'opportunities') {
                    onSelectTab('opportunities');
                  }
                }}
              >
                <span>{lang === 'hi' ? activeLesson.actionTextHi : activeLesson.actionTextEn}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
