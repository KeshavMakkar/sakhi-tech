-- ==============================================================================
-- Sakhi Tech: Safe Additive Products Schema Migration & Secure RLS
-- ==============================================================================
-- Preserves owner_id as UUID referencing auth.users(id).
-- Enforces strict owner-based Row Level Security (auth.uid() = owner_id).
-- Adds missing product columns without dropping or modifying existing data.
-- Configures secure storage upload policy for authenticated users.
-- Reloads the PostgREST schema cache.
-- ==============================================================================

-- 1. Ensure table exists with UUID owner_id
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  price         NUMERIC     NOT NULL CHECK (price > 0),
  category      TEXT        NOT NULL,
  status        TEXT        DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure foreign key constraint exists if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'products'
      AND kcu.column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_owner_id_fkey
      FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Purely additive columns for missing product form fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS owner_email    TEXT,
  ADD COLUMN IF NOT EXISTS owner_name     TEXT,
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS unit           TEXT DEFAULT '1 piece',
  ADD COLUMN IF NOT EXISTS seller_name    TEXT,
  ADD COLUMN IF NOT EXISTS shg_name       TEXT,
  ADD COLUMN IF NOT EXISTS location       TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone  TEXT,
  ADD COLUMN IF NOT EXISTS image_url      TEXT,
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS badge          TEXT DEFAULT 'Artisan Listing',
  ADD COLUMN IF NOT EXISTS ingredients    TEXT,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

-- Ensure phone numbers are stored as TEXT
ALTER TABLE public.products 
  ALTER COLUMN contact_phone TYPE TEXT USING contact_phone::TEXT;

-- 3. Create indexes for high-performance marketplace queries
CREATE INDEX IF NOT EXISTS products_status_created_idx 
  ON public.products (status, created_at DESC);

CREATE INDEX IF NOT EXISTS products_owner_id_idx 
  ON public.products (owner_id);

CREATE INDEX IF NOT EXISTS products_category_idx 
  ON public.products (category);

-- 4. Secure Owner-Based Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop obsolete or permissive legacy policies
DROP POLICY IF EXISTS "read_active" ON public.products;
DROP POLICY IF EXISTS "read_active_listings" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "insert_own" ON public.products;
DROP POLICY IF EXISTS "insert_own_listing" ON public.products;
DROP POLICY IF EXISTS "products_insert_valid_owner" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "update_own" ON public.products;
DROP POLICY IF EXISTS "update_own_listing" ON public.products;
DROP POLICY IF EXISTS "products_update_owner" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "delete_own" ON public.products;
DROP POLICY IF EXISTS "delete_own_listing" ON public.products;
DROP POLICY IF EXISTS "products_delete_owner" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.products;

-- (a) SELECT: Anyone can view active marketplace listings
CREATE POLICY "products_select_active"
  ON public.products FOR SELECT
  USING (status = 'active');

-- (b) INSERT: Only authenticated users can insert, strictly where owner_id matches auth.uid()
CREATE POLICY "products_insert_own"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- (c) UPDATE: Only the listing owner can update their own rows (status='deleted')
CREATE POLICY "products_update_own"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- (d) DELETE: Only the listing owner can delete their own rows
CREATE POLICY "products_delete_own"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- 5. Enable Realtime updates on products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

-- 6. Storage Bucket & Policies for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_product_image_read" ON storage.objects;
DROP POLICY IF EXISTS "allow_product_image_uploads" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_product_image_uploads" ON storage.objects;

-- Public read for product images
CREATE POLICY "public_product_image_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only authenticated users can upload product photos
CREATE POLICY "authenticated_product_image_uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 7. Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
