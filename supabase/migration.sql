-- ==============================================================================
-- Sakhi Tech: Products Table Schema Migration & PostgREST Cache Reload
-- ==============================================================================
-- Safe, additive, data-preserving migration.
-- Fixes missing columns (badge, contact_phone, unit, shg_name, is_placeholder,
-- owner_email, owner_name), converts owner_id from UUID to TEXT for Google OAuth,
-- updates RLS policies, and reloads the PostgREST schema cache.
-- ==============================================================================

-- 1. Ensure table exists with core columns
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  price         NUMERIC     NOT NULL,
  category      TEXT        NOT NULL,
  status        TEXT        DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop any foreign key constraints on owner_id that reference auth.users(id)
--    (Required because the app authenticates via Google OAuth client JWT, not Supabase auth.users)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND tc.table_name = 'products'
          AND kcu.column_name = 'owner_id'
    ) LOOP
        EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 3. Safely convert owner_id to TEXT if it was originally created as UUID
ALTER TABLE public.products 
  ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;

-- 4. Add all missing columns (additive and data-preserving)
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

-- 5. Guarantee text types and defaults for columns
ALTER TABLE public.products ALTER COLUMN contact_phone TYPE TEXT USING contact_phone::TEXT;
ALTER TABLE public.products ALTER COLUMN badge TYPE TEXT USING badge::TEXT;
ALTER TABLE public.products ALTER COLUMN unit SET DEFAULT '1 piece';
ALTER TABLE public.products ALTER COLUMN is_placeholder SET DEFAULT TRUE;
ALTER TABLE public.products ALTER COLUMN status SET DEFAULT 'active';

-- 6. Add performance indexes for marketplace browsing
CREATE INDEX IF NOT EXISTS products_status_created_idx 
  ON public.products (status, created_at DESC);

CREATE INDEX IF NOT EXISTS products_owner_id_idx 
  ON public.products (owner_id);

CREATE INDEX IF NOT EXISTS products_category_idx 
  ON public.products (category);

-- 7. Reset and update Row Level Security (RLS) policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop legacy or conflicting policies
DROP POLICY IF EXISTS "read_active" ON public.products;
DROP POLICY IF EXISTS "read_active_listings" ON public.products;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
DROP POLICY IF EXISTS "insert_own" ON public.products;
DROP POLICY IF EXISTS "insert_own_listing" ON public.products;
DROP POLICY IF EXISTS "products_insert_valid_owner" ON public.products;
DROP POLICY IF EXISTS "update_own" ON public.products;
DROP POLICY IF EXISTS "update_own_listing" ON public.products;
DROP POLICY IF EXISTS "products_update_owner" ON public.products;
DROP POLICY IF EXISTS "delete_own" ON public.products;
DROP POLICY IF EXISTS "delete_own_listing" ON public.products;
DROP POLICY IF EXISTS "products_delete_owner" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.products;

-- (a) SELECT: Anyone can read active marketplace products
CREATE POLICY "products_select_active"
  ON public.products FOR SELECT
  USING (status = 'active');

-- (b) INSERT: Allow inserting if owner_id is provided and valid
CREATE POLICY "products_insert_valid_owner"
  ON public.products FOR INSERT
  WITH CHECK (owner_id IS NOT NULL AND length(trim(owner_id)) > 0);

-- (c) UPDATE: Allow updating (used for soft-delete status='deleted')
CREATE POLICY "products_update_owner"
  ON public.products FOR UPDATE
  USING (owner_id IS NOT NULL AND length(trim(owner_id)) > 0);

-- (d) DELETE: Allow hard delete if needed
CREATE POLICY "products_delete_owner"
  ON public.products FOR DELETE
  USING (owner_id IS NOT NULL AND length(trim(owner_id)) > 0);

-- 8. Enable Realtime updates on products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

-- 9. Ensure Storage bucket 'product-images' exists and is publicly accessible
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  -- Storage upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'allow_product_image_uploads'
  ) THEN
    CREATE POLICY "allow_product_image_uploads"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'product-images');
  END IF;

  -- Storage public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_product_image_read'
  ) THEN
    CREATE POLICY "public_product_image_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- 10. CRITICAL: Force PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
