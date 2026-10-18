/**
 * productsService.js
 * All Supabase product CRUD operations, payload validation, and schema mapping.
 *
 * DB Table: public.products
 *   id             UUID DEFAULT gen_random_uuid() PRIMARY KEY
 *   owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    return `Database schema mismatch: a column is missing from the "products" table in Supabase. Please execute the additive migration script in Supabase SQL Editor and reload the schema cache. (${msg})`;
  }

  // 42501: Row Level Security policy failure
  if (code === '42501' || msg.includes('violates row-level security')) {
    return `Database permission error (RLS): Row-Level Security blocked this ${action}. Please verify you are signed in with an active Supabase session.`;
  }

  // 22P02: Type mismatch on UUID
  if (code === '22P02' && (msg.includes('uuid') || details.includes('uuid'))) {
    return `Database type error: owner_id must be a valid Supabase user UUID. Please verify that your Google sign-in is properly authenticated with Supabase.`;
  }

  // 23503: Foreign key violation (user doesn't exist in auth.users)
  if (code === '23503' && (msg.includes('owner_id') || msg.includes('auth.users'))) {
    return `Authentication error: The current user does not exist in Supabase auth.users. Please sign in again so your Google session is registered with Supabase.`;
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
 * Maps a Supabase row → the shape expected by UI components.
 * Guarantees fallbacks so UI components never encounter undefined values.
 */
function rowToProduct(row) {
  if (!row) return null;

  const isPlaceholder = Boolean(
    row.is_placeholder ?? (!row.image_url || row.image_url.includes('/placeholders/'))
  );

  return {
    id: String(row.id),
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
 * Requires a valid Supabase session. Uses the authenticated Supabase user's
 * UUID (session.user.id) as the owner_id, preserving UUID column type and owner RLS.
 *
 * @param {Object} formData
 * @param {Object} user - User object from AuthContext
 * @returns {Promise<{ data: Object | null, error: string | null }>}
 */
export async function insertProduct(formData, user) {
  if (!supabase) {
    return { data: null, error: 'Supabase is not configured. Please check environment variables.' };
  }

  // 1. Verify active Supabase session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return { data: null, error: `Authentication error: ${sessionError.message}` };
  }

  const sessionUser = sessionData?.session?.user;
  if (!sessionUser?.id) {
    return { 
      data: null, 
      error: 'A valid Supabase session is required to publish a product. Please sign in with Google first.' 
    };
  }

  const ownerId = sessionUser.id;
  if (!UUID_REGEX.test(ownerId)) {
    return {
      data: null,
      error: 'Invalid Supabase user ID format. An authenticated UUID is required.'
    };
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
    owner_id: ownerId, // Valid Supabase Auth UUID
    owner_email: cleanString(sessionUser.email || user?.email),
    owner_name: cleanString(sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || user?.name),
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
 * Permanently delete a product listing via Supabase DELETE request.
 * Enforces ownership check: extracts authenticated Supabase user ID directly from
 * active session (never relies on caller-supplied owner ID).
 * Relies on RLS policy (auth.uid() = owner_id) and verifies that a row was deleted.
 * Avoids violating the 'products_status_check' constraint.
 *
 * @param {string} productId - ID of the product to delete
 * @returns {Promise<{ error: string | null, deletedId?: string }>}
 */
export async function deleteProduct(productId) {
  if (!supabase) return { error: 'Database is not configured.' };
  
  const cleanProdId = productId != null ? String(productId).trim() : null;
  if (!cleanProdId) return { error: 'Product ID is required for deletion.' };

  // 1. Get authenticated Supabase session directly from Supabase Auth client
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) {
    return { error: `Authentication error: ${sessionErr.message}` };
  }

  const sessionUser = sessionData?.session?.user;
  if (!sessionUser?.id || !UUID_REGEX.test(sessionUser.id)) {
    return { error: 'You must be signed in with Google to delete your listing.' };
  }

  const authUserId = sessionUser.id; // Authenticated Supabase UUID

  try {
    // Delete listing by ID, strictly filtered by authenticated owner_id.
    // This executes DELETE FROM products WHERE id = ... AND owner_id = ...
    // completely avoiding any check constraint on status ('products_status_check').
    const { error, count } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .eq('id', cleanProdId)
      .eq('owner_id', authUserId);

    if (error) {
      console.error('[productsService] deleteProduct error:', error);
      return { error: formatDatabaseError(error, 'deleting product') };
    }

    if (typeof count === 'number' && count === 0) {
      return { 
        error: 'Unable to remove listing. Either the product was already removed or you do not have permission to delete it.' 
      };
    }

    return { error: null, deletedId: cleanProdId };
  } catch (err) {
    console.error('[productsService] deleteProduct unexpected exception:', err);
    return { error: err.message || 'Network error while deleting listing.' };
  }
}

/**
 * Restore a product listing.
 * Accepts either a product object (for re-insertion) or a product ID string.
 *
 * @param {Object | string} productOrId
 * @returns {Promise<{ error: string | null }>}
 */
export async function restoreProduct(productOrId) {
  if (!supabase) return { error: 'Database is not configured.' };
  if (!productOrId) return { error: 'Product is required for restoration.' };

  const isObject = typeof productOrId === 'object' && productOrId !== null;
  const prodId = isObject ? productOrId.id : productOrId;
  const cleanProdId = prodId != null ? String(prodId).trim() : null;
  if (!cleanProdId) return { error: 'Product ID is required for restoration.' };

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser?.id || !UUID_REGEX.test(sessionUser.id)) {
    return { error: 'Authentication required to restore listing.' };
  }

  try {
    // 1. In case the database used soft deletion, attempt to set status back to 'active'
    const { error: updateErr, count } = await supabase
      .from('products')
      .update({ status: 'active' }, { count: 'exact' })
      .eq('id', cleanProdId)
      .eq('owner_id', sessionUser.id);

    if (!updateErr && typeof count === 'number' && count > 0) {
      return { error: null };
    }

    // 2. If row was removed from the database, re-insert using saved product snapshot
    if (isObject) {
      const { error: insertErr } = await supabase
        .from('products')
        .insert([{
          id: cleanProdId,
          owner_id: sessionUser.id,
          owner_email: sessionUser.email || productOrId.ownerEmail || null,
          owner_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || productOrId.sellerNameEn || null,
          name: productOrId.nameEn || productOrId.name || 'Artisan Product',
          price: Number(productOrId.price) || 0,
          category: productOrId.category || 'crafts',
          description: productOrId.descriptionEn || productOrId.description || null,
          unit: productOrId.unit || '1 piece',
          seller_name: productOrId.sellerNameEn || productOrId.sellerName || 'Sakhi Artisan',
          shg_name: productOrId.shgNameEn || productOrId.shgName || null,
          location: productOrId.locationEn || productOrId.location || null,
          contact_phone: productOrId.contactPhone || null,
          image_url: productOrId.image || productOrId.imageUrl || null,
          is_placeholder: Boolean(productOrId.isPlaceholder),
          badge: productOrId.badgeEn || productOrId.badge || 'Artisan Listing',
          ingredients: productOrId.ingredients || null,
          status: 'active',
        }]);

      if (insertErr) {
        return { error: formatDatabaseError(insertErr, 'restoring product') };
      }
      return { error: null };
    }

    return { error: 'Unable to restore product listing.' };
  } catch (err) {
    return { error: err.message || 'Network error while restoring product.' };
  }
}

/**
 * Upload an image file to Supabase Storage bucket 'product-images' and return public URL.
 * Bucket must have public read enabled and authenticated write policy.
 *
 * @param {File} file
 * @param {string} [userId] - Optional fallback user ID
 * @returns {Promise<{ url: string | null, error: string | null }>}
 */
export async function uploadProductImage(file, userId) {
  if (!supabase) return { url: null, error: 'not_configured' };
  if (!file) return { url: null, error: 'Missing image file' };

  // Verify authenticated session
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  const uid = sessionUser?.id || userId;

  if (!uid) {
    return { url: null, error: 'Authentication required to upload photos' };
  }

  try {
    const safeUserId = String(uid).replace(/[^a-zA-Z0-9_-]/g, '_');
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
 * Subscribe to realtime events on public.products.
 * Listens for INSERT, UPDATE, and DELETE events so removals propagate
 * across all connected browsers immediately.
 *
 * @param {Function | Object} handlers - Callback for inserts or { onInsert, onUpdate, onRemove }
 * @returns {Object | null} Channel object
 */
export function subscribeToProducts(handlers) {
  if (!supabase) return null;

  const onInsert = typeof handlers === 'function' ? handlers : handlers?.onInsert;
  const onUpdate = typeof handlers === 'object' ? handlers?.onUpdate : null;
  const onRemove = typeof handlers === 'object' ? handlers?.onRemove : null;

  try {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.new?.status === 'active' && onInsert) {
            const mapped = rowToProduct(payload.new);
            if (mapped) onInsert(mapped);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          if (!payload.new) return;
          if (payload.new.status === 'active') {
            if (onUpdate) {
              const mapped = rowToProduct(payload.new);
              if (mapped) onUpdate(mapped);
            }
          } else {
            // Status changed to inactive/deleted: remove immediately from visible listings
            if (onRemove && payload.new.id) {
              onRemove(String(payload.new.id));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          if (onRemove && payload.old?.id) {
            onRemove(String(payload.old.id));
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
