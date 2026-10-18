import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Global & Section Error Boundary for Sakhi Tech.
 * Catches unhandled runtime render errors in child components,
 * prevents blank/white screen crashes, and provides friendly recovery options.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#home';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback prop if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isHindi = this.props.lang === 'hi';
      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';

      return (
        <div 
          style={{
            minHeight: this.props.isolated ? '320px' : '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 20px',
            background: 'var(--bg-canvas, #faf6f0)',
            fontFamily: 'var(--font-family, system-ui, sans-serif)',
          }}
        >
          <div 
            style={{
              maxWidth: 520,
              width: '100%',
              background: 'var(--bg-card, #ffffff)',
              border: '1.5px solid var(--border-color, #e8ded4)',
              borderRadius: 'var(--radius-xl, 24px)',
              padding: '32px 28px',
              boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.08))',
              textAlign: 'center',
            }}
          >
            {/* Warning Icon Badge */}
            <div 
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-full, 9999px)',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={28} />
            </div>

            {/* Title */}
            <h2 
              style={{ 
                fontSize: '1.35rem', 
                fontWeight: 800, 
                color: 'var(--text-primary, #27211e)',
                margin: '0 0 8px',
              }}
            >
              {isHindi ? 'कुछ गलत हो गया' : 'Something went wrong'}
            </h2>

            {/* Description */}
            <p 
              style={{ 
                fontSize: '0.92rem', 
                color: 'var(--text-secondary, #5c4f46)',
                lineHeight: 1.5,
                margin: '0 0 20px',
              }}
            >
              {isHindi 
                ? 'इस अनुभाग को लोड करने में एक समस्या आई। आपकी जानकारी और सत्र पूरी तरह सुरक्षित हैं।'
                : 'An unexpected issue occurred in this section. Your session and data remain safe.'}
            </p>

            {/* Technical Detail Collapsible / Monospace */}
            <details 
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '10px 14px',
                marginBottom: 24,
                textAlign: 'left',
                fontSize: '0.8rem',
                color: '#4B5563',
                cursor: 'pointer',
              }}
            >
              <summary style={{ fontWeight: 600, color: '#6B7280' }}>
                {isHindi ? 'तकनीकी विवरण देखें' : 'View error details'}
              </summary>
              <pre 
                style={{ 
                  margin: '8px 0 0', 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  fontSize: '0.78rem',
                  color: '#DC2626',
                  fontFamily: 'monospace'
                }}
              >
                {errorMessage}
              </pre>
            </details>

            {/* Recovery Action Buttons */}
            <div 
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={16} />
                <span>{isHindi ? 'पुनः प्रयास करें' : 'Try Again'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-secondary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{isHindi ? 'पेज रीलोड करें' : 'Reload Page'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-secondary"
                style={{
                  padding: '10px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Home size={16} />
                <span>{isHindi ? 'होम पर जाएं' : 'Go Home'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
