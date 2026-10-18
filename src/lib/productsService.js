/**
 * productsService.js
 * All Supabase product CRUD operations in one place.
 * Components import these functions instead of touching supabase directly.
 *
 * DB table: products
 *   id            uuid  DEFAULT gen_random_uuid()  PRIMARY KEY
 *   owner_id      text  NOT NULL          -- Google "sub" claim
 *   owner_email   text
 *   owner_name    text
 *   name          text  NOT NULL
 *   description   text
 *   price         numeric NOT NULL
 *   unit          text
 *   category      text  NOT NULL
 *   seller_name   text
 *   shg_name      text
 *   location      text
 *   contact_phone text
 *   image_url     text
 *   is_placeholder boolean DEFAULT true
 *   badge         text
 *   status        text  DEFAULT 'active'
 *   created_at    timestamptz DEFAULT now()
 *
 * RLS policies (run in Supabase SQL editor):
 *   -- Anyone can read active listings
 *   CREATE POLICY "read_active" ON products FOR SELECT USING (status = 'active');
 *   -- Signed-in users can insert; owner_id must match their JWT sub
 *   CREATE POLICY "insert_own" ON products FOR INSERT WITH CHECK (owner_id = current_user);
 *   -- Owners can update/delete only their own rows
 *   CREATE POLICY "update_own" ON products FOR UPDATE USING (owner_id = current_user);
 *   CREATE POLICY "delete_own" ON products FOR DELETE USING (owner_id = current_user);
 */
import { supabase } from './supabase';

/* ─── helpers ─────────────────────────────────────────────────── */

/** Map a Supabase row → the shape the UI already understands. */
function rowToProduct(row) {
  return {
    id: row.id,
    // UI expects bilingual pairs; for user-created products both are the same value
    nameEn: row.name,
    nameHi: row.name,
    category: row.category,
    price: Number(row.price),
    unit: row.unit || '1 piece',
    sellerNameEn: row.seller_name || row.owner_name || 'Sakhi Artisan',
    sellerNameHi: row.seller_name || row.owner_name || 'सखी कारीगर',
    shgNameEn: row.shg_name || 'Sakhi Self Help Group',
    shgNameHi: row.shg_name || 'सखी स्वयं सहायता समूह',
    locationEn: row.location || '',
    locationHi: row.location || '',
    image: row.image_url || '',
    imageAlt: row.name + ' – artisan product',
    isPlaceholder: row.is_placeholder ?? true,
    descriptionEn: row.description || '',
    descriptionHi: row.description || '',
    contactPhone: row.contact_phone || '',
    badgeEn: row.badge || 'Artisan Listing',
    badgeHi: row.badge || 'कारीगर उत्पाद',
    inStock: row.status === 'active',
    status: row.status,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email,
    createdAt: row.created_at,
    // Flag so UI knows this came from Supabase
    _fromDb: true,
  };
}

/* ─── public API ───────────────────────────────────────────────── */

/**
 * Fetch all active products, newest first.
 * Returns { data: Product[], error: string | null }
 */
export async function fetchProducts() {
  if (!supabase) return { data: [], error: 'not_configured' };

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[productsService] fetchProducts error:', error);
    return { data: [], error: error.message };
  }

  return { data: (data || []).map(rowToProduct), error: null };
}

/**
 * Insert a new product row.
 * The `user` object comes from AuthContext (Google JWT payload).
 * Returns { data: Product | null, error: string | null }
 */
export async function insertProduct(formData, user) {
  if (!supabase) return { data: null, error: 'not_configured' };
  if (!user?.id) return { data: null, error: 'unauthenticated' };

  const row = {
    owner_id: user.id,
    owner_email: user.email || null,
    owner_name: user.name || null,
    name: formData.name,
    description: formData.description || null,
    price: Number(formData.price),
    unit: formData.unit || null,
    category: formData.category,
    seller_name: formData.sellerName || user.name || null,
    shg_name: formData.shgName || null,
    location: formData.location || null,
    contact_phone: formData.phone || null,
    image_url: formData.imageUrl || null,
    is_placeholder: formData.isPlaceholder ?? true,
    badge: formData.isPlaceholder ? 'Artisan Listing' : 'Photo Attached',
    status: 'active',
  };

  const { data, error } = await supabase
    .from('products')
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error('[productsService] insertProduct error:', error);
    return { data: null, error: error.message };
  }

  return { data: rowToProduct(data), error: null };
}

/**
 * Soft-delete a product (set status = 'deleted').
 * Only the owner can do this (enforced by RLS + owner_id check here).
 * Returns { error: string | null }
 */
export async function deleteProduct(productId, userId) {
  if (!supabase) return { error: 'not_configured' };
  if (!userId) return { error: 'unauthenticated' };

  const { error } = await supabase
    .from('products')
    .update({ status: 'deleted' })
    .eq('id', productId)
    .eq('owner_id', userId);   // double-guard; RLS is the real lock

  if (error) {
    console.error('[productsService] deleteProduct error:', error);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * Bucket "product-images" must exist and have public read access.
 * Returns { url: string | null, error: string | null }
 */
export async function uploadProductImage(file, userId) {
  if (!supabase) return { url: null, error: 'not_configured' };
  if (!file || !userId) return { url: null, error: 'missing params' };

  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    console.error('[productsService] uploadProductImage error:', uploadError);
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);

  return { url: data?.publicUrl || null, error: null };
}

/**
 * Subscribe to realtime INSERT events on the products table.
 * Returns the Supabase channel object (call channel.unsubscribe() to clean up).
 *
 * @param {(product: Product) => void} onNewProduct
 */
export function subscribeToProducts(onNewProduct) {
  if (!supabase) return null;

  const channel = supabase
    .channel('products-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'products' },
      (payload) => {
        if (payload.new?.status === 'active') {
          onNewProduct(rowToProduct(payload.new));
        }
      }
    )
    .subscribe();

  return channel;
}
