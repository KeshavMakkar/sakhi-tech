/**
 * productsService.js
 * All Supabase product CRUD operations, payload validation, and schema mapping.
 *
 * DB Table: public.products
 *   id             UUID DEFAULT gen_random_uuid() PRIMARY KEY
 *   owner_id       TEXT NOT NULL (Google OAuth sub ID)
 *   owner_email    TEXT (optional)
 *   owner_name     TEXT (optional)
 *   name           TEXT NOT NULL
 *   description    TEXT (optional)
 *   price          NUMERIC NOT NULL CHECK (price > 0)
 *   unit           TEXT DEFAULT '1 piece'
 *   category       TEXT NOT NULL
 *   seller_name    TEXT (optional)
 *   shg_name       TEXT (optional)
 *   location       TEXT (optional)
 *   contact_phone  TEXT (optional, stored as text to preserve formatting and country code)
 *   image_url      TEXT (optional)
 *   is_placeholder BOOLEAN DEFAULT TRUE
 *   badge          TEXT DEFAULT 'Artisan Listing'
 *   ingredients    TEXT (optional)
 *   status         TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted'))
 *   created_at     TIMESTAMPTZ DEFAULT NOW()
 *   updated_at     TIMESTAMPTZ DEFAULT NOW()
 */
import { supabase } from './supabase';

/* ─── Type Sanitizers & Helpers ───────────────────────────────────── */

/** Clean string: trims and returns null if empty or non-string */
function cleanString(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Clean numeric price */
function cleanPrice(val) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return !isNaN(num) && isFinite(num) && num > 0 ? num : null;
}

/** Translate PostgREST and Postgres error codes into clear, actionable messages */
function formatDatabaseError(error, action = 'save product') {
  if (!error) return null;
  const code = error.code || '';
  const msg = error.message || '';
  const details = error.details || '';

  // PGRST204: Missing column in PostgREST schema cache
  if (code === 'PGRST204' || msg.includes('schema cache')) {
    return `Database schema mismatch: a column is missing from the "products" table in Supabase. Please run the migration script in Supabase SQL Editor and reload the schema cache. (Details: ${msg})`;
  }

  // 42501: Row Level Security policy failure
  if (code === '42501' || msg.includes('violates row-level security')) {
    return `Database permission error (RLS): The row-level security policy rejected this ${action}. Ensure the latest RLS policies from the migration are applied in Supabase.`;
  }

  // 22P02: Type mismatch, e.g. UUID vs TEXT on owner_id
  if (code === '22P02' && (msg.includes('uuid') || details.includes('uuid'))) {
    return `Database type mismatch: "owner_id" is configured as UUID instead of TEXT. Please run the SQL migration in Supabase to convert owner_id to TEXT for Google OAuth.`;
  }

  // 23502: NOT NULL violation
  if (code === '23502') {
    return `Missing required database field: ${msg}`;
  }

  // 23514: Check constraint violation (e.g. price > 0)
  if (code === '23514') {
    return `Invalid field value: ${msg}`;
  }

  return msg || `Database error (${code || 'unknown'})`;
}

/**
 * Maps a Supabase row → the shape expected by the UI components.
 * Guarantees fallbacks so UI components never encounter undefined values.
 */
function rowToProduct(row) {
  if (!row) return null;

  const isPlaceholder = Boolean(
    row.is_placeholder ?? (!row.image_url || row.image_url.includes('/placeholders/'))
  );

  return {
    id: String(row.id),
    // Bilingual display: for user-created products, English and Hindi fall back gracefully
    nameEn: row.name || 'Untitled Listing',
    nameHi: row.name || 'अनाम उत्पाद',
    category: row.category || 'crafts',
    price: Number(row.price) || 0,
    unit: row.unit || '1 piece',
    sellerNameEn: row.seller_name || row.owner_name || 'Sakhi Artisan',
    sellerNameHi: row.seller_name || row.owner_name || 'सखी कारीगर',
    shgNameEn: row.shg_name || '',
    shgNameHi: row.shg_name || '',
    locationEn: row.location || '',
    locationHi: row.location || '',
    image: row.image_url || '',
    imageAlt: (row.name || 'Artisan product') + ' photo',
    isPlaceholder,
    descriptionEn: row.description || '',
    descriptionHi: row.description || '',
    contactPhone: row.contact_phone || '',
    badgeEn: row.badge || (isPlaceholder ? 'Artisan Listing' : 'Photo Attached'),
    badgeHi: row.badge || (isPlaceholder ? 'कारीगर उत्पाद' : 'फोटो संलग्न'),
    ingredients: row.ingredients || '',
    inStock: row.status === 'active',
    status: row.status || 'active',
    ownerId: row.owner_id ? String(row.owner_id) : '',
    ownerEmail: row.owner_email || '',
    createdAt: row.created_at || new Date().toISOString(),
    _fromDb: true,
  };
}

/* ─── Public API ─────────────────────────────────────────────────── */

/**
 * Fetch all active marketplace listings, newest first.
 * Returns { data: Product[], error: string | null }
 */
export async function fetchProducts() {
  if (!supabase) return { data: [], error: 'not_configured' };

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[productsService] fetchProducts error:', error);
      return { data: [], error: formatDatabaseError(error, 'fetching products') };
    }

    return { 
      data: (data || []).map(rowToProduct).filter(Boolean), 
      error: null 
    };
  } catch (err) {
    console.error('[productsService] fetchProducts unexpected exception:', err);
    return { data: [], error: err.message || 'Network error fetching products' };
  }
}

/**
 * Insert a new product listing.
 * Validates all required fields before making the network call and sanitizes
 * the payload so no undefined or extraneous properties are sent to Supabase.
 *
 * @param {Object} formData
 * @param {Object} user - Authenticated user from AuthContext (Google JWT payload)
 * @returns {Promise<{ data: Object | null, error: string | null }>}
 */
export async function insertProduct(formData, user) {
  if (!supabase) {
    return { data: null, error: 'Supabase is not configured. Please check environment variables.' };
  }

  // 1. Authenticated user validation
  const ownerId = cleanString(user?.id);
  if (!ownerId) {
    return { data: null, error: 'Authentication required. Please sign in with Google to list a product.' };
  }

  // 2. Form field validation
  const name = cleanString(formData?.name);
  if (!name) {
    return { data: null, error: 'Product name is required.' };
  }

  const price = cleanPrice(formData?.price);
  if (!price) {
    return { data: null, error: 'A valid price greater than 0 is required.' };
  }

  const category = cleanString(formData?.category);
  if (!category) {
    return { data: null, error: 'Product category is required.' };
  }

  // 3. Build strictly sanitized payload matching public.products schema
  const isPlaceholder = Boolean(formData?.isPlaceholder);
  const badgeText = isPlaceholder ? 'Artisan Listing' : 'Photo Attached';

  const row = {
    owner_id: ownerId,
    owner_email: cleanString(user?.email),
    owner_name: cleanString(user?.name),
    name,
    description: cleanString(formData?.description),
    price,
    unit: cleanString(formData?.unit) || '1 piece',
    category,
    seller_name: cleanString(formData?.sellerName) || cleanString(user?.name) || 'Sakhi Artisan',
    shg_name: cleanString(formData?.shgName),
    location: cleanString(formData?.location),
    contact_phone: cleanString(formData?.phone),
    image_url: cleanString(formData?.imageUrl),
    is_placeholder: isPlaceholder,
    badge: cleanString(formData?.badge) || badgeText,
    ingredients: cleanString(formData?.ingredients),
    status: 'active',
  };

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('[productsService] insertProduct error:', error);
      return { data: null, error: formatDatabaseError(error, 'inserting product') };
    }

    return { data: rowToProduct(data), error: null };
  } catch (err) {
    console.error('[productsService] insertProduct unexpected exception:', err);
    return { data: null, error: err.message || 'Unexpected network error during product insertion' };
  }
}

/**
 * Soft-delete a product (set status = 'deleted').
 * Enforces ownership check: only the listing owner can delete their item.
 *
 * @param {string} productId
 * @param {string} userId - Google user ID
 * @returns {Promise<{ error: string | null }>}
 */
export async function deleteProduct(productId, userId) {
  if (!supabase) return { error: 'not_configured' };
  
  const cleanProdId = cleanString(productId);
  const cleanUserId = cleanString(userId);

  if (!cleanProdId) return { error: 'Product ID is required for deletion.' };
  if (!cleanUserId) return { error: 'Authentication required to delete a listing.' };

  try {
    const { error } = await supabase
      .from('products')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', cleanProdId)
      .eq('owner_id', cleanUserId);

    if (error) {
      console.error('[productsService] deleteProduct error:', error);
      return { error: formatDatabaseError(error, 'deleting product') };
    }

    return { error: null };
  } catch (err) {
    console.error('[productsService] deleteProduct unexpected exception:', err);
    return { error: err.message || 'Network error while deleting listing' };
  }
}

/**
 * Upload an image file to Supabase Storage bucket 'product-images' and return public URL.
 * Bucket must have public read enabled.
 *
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<{ url: string | null, error: string | null }>}
 */
export async function uploadProductImage(file, userId) {
  if (!supabase) return { url: null, error: 'not_configured' };
  if (!file || !userId) return { url: null, error: 'Missing image file or user credentials' };

  try {
    // Sanitize user ID and filename for storage path
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = (file.name || 'jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeExt = ext || 'jpg';
    const filePath = `${safeUserId}/${Date.now()}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { 
        upsert: false, 
        contentType: file.type || 'image/jpeg' 
      });

    if (uploadError) {
      console.error('[productsService] uploadProductImage error:', uploadError);
      return { url: null, error: formatDatabaseError(uploadError, 'uploading image') };
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { url: data?.publicUrl || null, error: null };
  } catch (err) {
    console.error('[productsService] uploadProductImage exception:', err);
    return { url: null, error: err.message || 'Image upload failed' };
  }
}

/**
 * Subscribe to realtime INSERT events on public.products.
 * Returns the channel object (call channel.unsubscribe() to cleanup).
 *
 * @param {(product: Object) => void} onNewProduct
 */
export function subscribeToProducts(onNewProduct) {
  if (!supabase) return null;

  try {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.new?.status === 'active') {
            const mapped = rowToProduct(payload.new);
            if (mapped) onNewProduct(mapped);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.warn('[productsService] subscribeToProducts warning:', err);
    return null;
  }
}
