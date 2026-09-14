-- ==============================================================================
-- WARUNGPRO POS & ACCOUNTING - SUPABASE POSTGRESQL SCHEMA
-- Project Endpoint: https://zzpnqmghzkaqwpkphvpz.supabase.co
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: products (Katalog Barang, Barcode SKU, & Stok Inventaris)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'sembako',
    price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock_alert INTEGER NOT NULL DEFAULT 5,
    unit TEXT NOT NULL DEFAULT 'pcs',
    image_url TEXT DEFAULT '/products/prod_sembako_001.svg',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast search & barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- 3. TABLE: transactions (Jurnal Nota Penjualan Kasir)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount_total NUMERIC NOT NULL DEFAULT 0,
    tax_total NUMERIC NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'TUNAI',
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    change_due NUMERIC NOT NULL DEFAULT 0,
    profit NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    customer_name TEXT,
    customer_phone TEXT,
    cashier_name TEXT DEFAULT 'Store Cashier',
    notes TEXT,
    member_id TEXT,
    member_code TEXT,
    member_name TEXT,
    member_tier TEXT,
    member_discount_total NUMERIC DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    points_value_redeemed NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON public.transactions(timestamp DESC);

-- 4. TABLE: customer_debts (Buku Kasbon / Piutang Pelanggan)
CREATE TABLE IF NOT EXISTS public.customer_debts (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '-',
    total_debt NUMERIC NOT NULL DEFAULT 0,
    remaining_debt NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    due_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    payments JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_invoices TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_customer_debts_name ON public.customer_debts(customer_name);

-- 5. TABLE: cashflow_records (Buku Arus Kas Masuk & Keluar Toko)
CREATE TABLE IF NOT EXISTS public.cashflow_records (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('KAS_MASUK', 'KAS_KELUAR')),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'IDR',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT DEFAULT '',
    operator TEXT DEFAULT 'Kasir Toko',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashflow_timestamp ON public.cashflow_records(timestamp DESC);

-- 6. TABLE: store_settings (Pengaturan Toko & Preferensi Global)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_settings',
    store_name TEXT NOT NULL DEFAULT 'Warung Sembako Berkah Global',
    address TEXT DEFAULT 'Jl. Raya Sudirman No. 108, Jakarta Pusat',
    phone TEXT DEFAULT '+62 812-8899-7700',
    currency TEXT NOT NULL DEFAULT 'IDR',
    language TEXT NOT NULL DEFAULT 'id',
    tax_enabled BOOLEAN DEFAULT FALSE,
    tax_rate NUMERIC DEFAULT 11,
    tax_name TEXT DEFAULT 'PPN',
    enable_sound BOOLEAN DEFAULT TRUE,
    receipt_header TEXT DEFAULT 'Terima kasih atas kunjungan Anda!',
    receipt_footer TEXT DEFAULT 'Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE: keepalive_logs (Heartbeat Otomasi Bot 24/7 Supabase)
CREATE TABLE IF NOT EXISTS public.keepalive_logs (
    id BIGSERIAL PRIMARY KEY,
    pinged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'OK',
    response_time_ms INTEGER DEFAULT 0,
    source TEXT DEFAULT 'cron-bot',
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_keepalive_pinged_at ON public.keepalive_logs(pinged_at DESC);

-- Auto-cleanup keepalive logs older than 30 days to prevent bloating
CREATE OR REPLACE FUNCTION clean_old_keepalive_logs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.keepalive_logs WHERE pinged_at < NOW() - INTERVAL '30 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clean_keepalive_logs ON public.keepalive_logs;
CREATE TRIGGER trigger_clean_keepalive_logs
AFTER INSERT ON public.keepalive_logs
FOR EACH STATEMENT
EXECUTE FUNCTION clean_old_keepalive_logs();

-- 8. TABLE: customer_members (Sistem Membership, Loyalitas Poin, & Diskon Bertingkat)
CREATE TABLE IF NOT EXISTS public.customer_members (
    id TEXT PRIMARY KEY,
    member_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    tier TEXT NOT NULL DEFAULT 'REGULAR' CHECK (tier IN ('REGULAR', 'SILVER', 'GOLD', 'PLATINUM')),
    membership_type TEXT NOT NULL DEFAULT 'HYBRID' CHECK (membership_type IN ('POINT', 'POTONGAN', 'HYBRID')),
    points INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    total_visits INTEGER NOT NULL DEFAULT 0,
    discount_percent NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_members_code ON public.customer_members(member_code);
CREATE INDEX IF NOT EXISTS idx_customer_members_phone ON public.customer_members(phone);
CREATE INDEX IF NOT EXISTS idx_customer_members_tier ON public.customer_members(tier);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Memberikan akses penuh untuk Anon/Authenticated Key WarungPro POS
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keepalive_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customer_debts" ON public.customer_debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for cashflow_records" ON public.cashflow_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for keepalive_logs" ON public.keepalive_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customer_members" ON public.customer_members FOR ALL USING (true) WITH CHECK (true);
