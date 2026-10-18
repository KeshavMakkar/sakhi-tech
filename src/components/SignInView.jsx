import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { TRANSLATIONS } from '../data/translations';
import { 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Store,
  BookOpen
} from 'lucide-react';

export default function SignInView({ onContinue, lang = 'hi' }) {
  const { 
    user, 
    isAuthenticated, 
    isConfigured, 
    authError, 
    handleGoogleSuccess, 
    handleGoogleError, 
    logout 
  } = useAuth();

  const isHindi = lang === 'hi';

  if (isAuthenticated && user) {
    return (
      <div style={{ maxWidth: 540, margin: '20px auto', padding: '0 12px' }}>
        <div className="calc-card" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-full)',
            margin: '0 auto 16px',
            overflow: 'hidden',
            border: '3px solid var(--primary-500)',
            boxShadow: 'var(--shadow-md)'
          }}>
            {user.picture ? (
              <img src={user.picture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800 }}>
                {user.name?.charAt(0) || 'S'}
              </div>
            )}
          </div>

          <span className="badge badge-green" style={{ marginBottom: 10 }}>
            <CheckCircle2 size={14} />
            <span>{isHindi ? 'सफलतापूर्वक साइन-इन हैं' : 'Signed In with Google'}</span>
          </span>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            {isHindi ? `नमस्ते, ${user.givenName || user.name}!` : `Welcome, ${user.name}!`}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            {user.email}
          </p>

          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'left',
            marginBottom: 24,
            fontSize: '0.88rem',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ fontWeight: 700, color: 'var(--primary-700)', marginBottom: 6 }}>
              {isHindi ? 'सखी टेक सुरक्षित पहुंच सक्रिय:' : 'Protected Features Active:'}
            </p>
            <ul style={{ paddingLeft: 18, lineHeight: 1.6, margin: 0 }}>
              <li>{isHindi ? 'नया उत्पाद जोड़ने की सुविधा' : 'Create and publish product listings'}</li>
              <li>{isHindi ? 'सीधे खरीदार संपर्क एवं सुरक्षित व्हाट्सएप' : 'Verified direct buyer contacts via WhatsApp'}</li>
              <li>{isHindi ? 'सरकारी योजनाओं में निःशुल्क रुचि पंजीकरण' : 'Register for rural melas & govt schemes'}</li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={onContinue}>
              <span>{isHindi ? 'सखी टेक में आगे बढ़ें' : 'Continue to Sakhi Tech'}</span>
              <ArrowRight size={18} />
            </button>

            <button className="btn btn-secondary" onClick={logout}>
              <LogOut size={16} />
              <span>{isHindi ? 'साइन आउट करें' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 580, margin: '20px auto', padding: '0 12px' }}>
      <div className="calc-card" style={{ padding: '36px 24px', textAlign: 'center' }}>
        {/* Brand Icon Header */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--accent-600) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: '#fff',
          margin: '0 auto 16px',
          boxShadow: '0 8px 18px rgba(184, 67, 35, 0.25)'
        }}>
          🪔
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {isHindi ? 'सखी टेक में साइन-इन करें' : 'Sign In to Sakhi Tech'}
        </h2>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
          {isHindi 
            ? 'अपने हस्तनिर्मित उत्पाद जोड़ने, खरीदारों से सुरक्षित जुड़ने और सरकारी सहायता योजनाओं के लिए कृपया गूगल से साइन-इन करें।'
            : 'Sign in securely with Google to list your handmade products, connect directly with buyers, and save opportunities.'}
        </p>

        {/* Benefits list */}
        <div style={{
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'left',
          marginBottom: 24,
          fontSize: '0.88rem',
          color: 'var(--primary-900)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 8, color: 'var(--primary-800)' }}>
            <ShieldCheck size={18} />
            <span>{isHindi ? 'सखी सुरक्षा एवं लाभ:' : 'Safe & Verified Benefits:'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--green-600)', fontWeight: 800 }}>✓</span>
              <span>{isHindi ? 'उत्पाद सीधे आपके नाम से बाज़ार में जुड़ेंगे' : 'Listings published under your verified name'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--green-600)', fontWeight: 800 }}>✓</span>
              <span>{isHindi ? 'व्हाट्सएप पर केवल गंभीर खरीदार संपर्क कर सकेंगे' : 'Connect directly with buyers via genuine WhatsApp inquiries'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--green-600)', fontWeight: 800 }}>✓</span>
              <span>{isHindi ? '100% निःशुल्क एवं सुरक्षित डिजिटल पहचान' : '100% free, private, and secure'}</span>
            </div>
          </div>
        </div>

        {/* Error notice if sign-in failed */}
        {authError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: 20,
            fontSize: '0.85rem',
            color: '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'left'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        {/* Real Google OAuth Login Button */}
        {isConfigured ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
              text="signin_with"
            />
          </div>
        ) : (
          /* When Google Client ID is not yet configured in environment variables */
          <div style={{
            background: '#FFFBEB',
            border: '1.5px dashed #F59E0B',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'left',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontWeight: 800, marginBottom: 8 }}>
              <AlertTriangle size={20} />
              <span>Google OAuth Configuration Guide</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: 1.5, marginBottom: 12 }}>
              To enable live Google Sign-In, configure your Google Cloud OAuth 2.0 Web Client ID in the project environment:
            </p>
            <ol style={{ fontSize: '0.82rem', color: '#78350F', paddingLeft: 20, lineHeight: 1.6, margin: 0 }}>
              <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ fontWeight: 700, textDecoration: 'underline' }}>Google Cloud Console</a>.</li>
              <li>Create an <strong>OAuth 2.0 Client ID</strong> (Application Type: <em>Web application</em>).</li>
              <li>Add Authorized JavaScript Origins: <code>http://localhost:5173</code>.</li>
              <li>Add <code>VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com</code> to <code>.env</code> file.</li>
            </ol>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 8 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isHindi 
              ? 'बिना साइन-इन के आप बाज़ार देख सकती हैं, हुनर पाठ पढ़ सकती हैं और कैलकुलेटर का उपयोग कर सकती हैं।'
              : 'You can still browse the marketplace, read learning lessons, and use the pricing calculator without signing in.'}
          </p>
        </div>
      </div>
    </div>
  );
}
