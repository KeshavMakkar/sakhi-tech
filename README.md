# Sakhi Tech (सखी टेक)

**Empowering Rural Women Entrepreneurs to Learn, Price, and Sell**  
*ग्रामीण महिला उद्यमियों के लिए बाज़ार और व्यापार कौशल मंच*

Sakhi Tech is a mobile-first, rural-friendly web application designed to help women in villages and small towns start and grow small businesses. It guides users through an empowering journey: choosing a business category, learning practical bite-sized skills, calculating fair selling prices with zero losses, and listing handcrafted products directly in an artisan marketplace.

---

## 🌟 Key Updates & Features

### 1. Route Preservation on Refresh & Direct Link Access
- **Hash-Based Router**: Built with client-side SPA routing (`#/home`, `#/learn`, `#/calculator`, `#/marketplace`, `#/add-product`, `#/opportunities`, `#/signin`).
- **Refresh Protection**: Refreshing any page (e.g. `#/marketplace` or `#/learn`) preserves the current route and view without resetting to home.
- **Direct Link Support**: Deep links work reliably on both local development servers and static/deployed production hosts without requiring server-side 404 URL rewrite rules.
- **Local Persistence**: User-added marketplace listings and active sessions are persisted in `localStorage` under `sakhi_bazaar_products_v2` and `sakhi_user_session_v1`.

### 2. Google OAuth 2.0 Sign-In Integration
- **Real Provider Integration**: Powered by `@react-oauth/google` and Google Identity Services. No fake or mock sign-in flows.
- **Protected Feature Gating**: Adding and publishing products to the marketplace requires verified Google sign-in to protect artisans, prevent fraud, and build buyer trust.
- **Safe Signed-Out State**: Users can freely explore the marketplace, calculate prices, read business lessons, and view local opportunities without signing in. Attempting to publish an item prompts the user with an informative sign-in wall.
- **Profile Header & Sign-In View**:
  - Displays avatar, name, and email when authenticated with a 1-click Sign Out option.
  - Dedicated Sign-In page (`#/signin`) with benefits and clear OAuth setup instructions.
- **Zero Hardcoded Secrets**: Client IDs are strictly loaded from environment variables (`VITE_GOOGLE_CLIENT_ID`), with safe runtime fallbacks when unconfigured.

### 3. Responsive Top Navigation Bar & Brand Logo
- **Desktop Viewport Fit**: All 6 navigation items, logo, language selector, Add Product button, and Sign In button fit smoothly within the desktop viewport without clipping or horizontal scroll. Sizing and spacing dynamically adjust between 1024px and wide desktop screens (1200px+).
- **Mobile & Tablet Drawer**: On tablet and mobile viewports (< 1024px), crowded horizontal links are replaced by an accessible Menu button (`Menu` / `X` toggle). The slide-down navigation drawer features all links with active indicators, Add Product highlight, and full authentication actions. Auto-closes on navigation, click-outside, or Escape key.
- **Fixed Dimensions & Language Stability**: The logo container is fixed at a strict box with `flex-shrink: 0`. Switching between **हिन्दी (Hindi)** and **English (EN)** maintains vertical alignment and prevents header stretching, wrapping, or overlapping.
- **Zero Horizontal Overflow**: Header inner containers use `box-sizing: border-box` and flexible scaling to ensure `overflow-x: hidden` is preserved across all device sizes.

### 4. Direct WhatsApp Inquiries with URL Encoding & Validation
- **URL-Encoded Inquiry Link**: Opens `https://wa.me/<country_code_number>?text=<encoded_msg>` with a professionally formatted inquiry template including the product name, unit price, quantity, buyer name, and optional custom note.
- **Country Code Normalization**: Automatically validates and standardizes phone numbers (e.g., automatically prepends India's `91` country code for 10-digit mobile numbers).
- **Missing / Invalid Phone Guard**: If an artisan has an invalid or missing number, the application displays an inline error alert with direct call and order form options instead of opening a broken WhatsApp link.
- **Transparent Disclaimer**: Explicitly informs the user that WhatsApp is used solely to contact and chat directly with the seller; no payment is taken and no order has been placed on the website.

### 5. Repositioned Item Delete Control & Undo Capability
- **Precise Alignment**: The delete control (`X` / trash button) is positioned beside each marketplace item title with responsive spacing on mobile and desktop.
- **Accidental Deletion Protection**: Clicking delete prompts a confirmation dialog displaying the exact product title.
- **Instant Undo Toast**: Confirming deletion triggers a floating Undo notification toast at the bottom of the screen, allowing users to restore the removed listing with one click.
- **Search Bar Clear 'X'**: The marketplace search bar features a properly padded search input (`padding-right: 42px`) and centered clear button (`X`) that never overlaps user input.

### 6. Comprehensive Practical Learning Lessons
Expanded to 7 short, practical lessons tailored for rural women entrepreneurs:
1. **Pricing Basics (दाम तय करना)**: How to price products fairly covering raw materials, labor, and profit (*3 min read*).
2. **Smartphone Photography (मोबाइल से फोटो)**: Capturing bright, clean product photos using natural window light (*3 min read*).
3. **Low-Cost Packaging (सुरक्षित पैकेजिंग)**: Eco-friendly, airtight, and leak-proof packaging techniques (*4 min read*).
4. **WhatsApp Promotion (व्हाट्सएप पर प्रचार)**: Setting up WhatsApp Business, status stories, and broadcast lists (*4 min read*).
5. **Customer Service & Retention (ग्राहकों से अच्छा व्यवहार)**: Polite communication, handling returns, and building repeat buyers (*3 min read*).
6. **Simple Bookkeeping & Records (हिसाब-किताब की डायरी)**: Tracking daily cash inflow, raw material expenses, and pending payments (*3 min read*).
7. **Digital UPI Payments (डिजिटल पेमेंट व यूपीआई)**: Safe QR code setup, instant payment verification, and fraud prevention (*4 min read*).

---

## ⚙️ Google OAuth Setup Guide

To enable live Google Sign-In with your own Google Cloud project:

1. **Visit Google Cloud Console**:
   Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. **Create OAuth Client ID**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Select **Application type**: *Web application*.
   - Name your client (e.g., `Sakhi Tech Web`).
3. **Set Authorized JavaScript Origins**:
   Add the following under **Authorized JavaScript origins**:
   - `http://localhost:5173` (for local development)
   - `https://your-production-domain.com` (for deployed production)
4. **Configure Environment Variable**:
   Create a `.env` file in the project root (see `.env.example`):
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
5. **Restart Development Server**:
   ```bash
   npm run dev
   ```

---

## 🚀 Running the Project Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite dev server
npm run dev

# 3. Build for production
npm run build
```

---

## 🎨 Design & Accessibility Principles
- **Palette**: Terracotta Crimson (`#B84323`), Turmeric Gold (`#D97706`), Forest Neem Green (`#15803D`), Sand Cream (`#FAF6F0`).
- **Typography**: Google Fonts *Plus Jakarta Sans* and *Noto Sans Devanagari*.
- **Touch Targets**: Minimum 44px–48px interactive touch zones across mobile bottom navigation, category filters, and action buttons.
- **Audio Voice Reader**: Speech synthesis narrator in Hindi and English for rural accessibility.
