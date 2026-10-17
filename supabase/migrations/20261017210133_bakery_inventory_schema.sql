/*
# Bakery Inventory Control System - Database Schema

1. New Tables
- `products`: Stores all bakery products with stock and pricing info.
  - id (uuid, PK)
  - name (text, product name e.g. "Pão Francês")
  - category (text, e.g. "Pães", "Doces", "Bolos", "Salgados")
  - unit (text, e.g. "kg", "un", "L", "dz")
  - min_stock (numeric, minimum stock threshold for alerts)
  - current_stock (numeric, current quantity on hand)
  - cost_price (numeric, purchase cost per unit)
  - sell_price (numeric, selling price per unit)
  - created_at (timestamptz)
  - updated_at (timestamptz)

- `stock_movements`: Records every stock in/out/adjustment event.
  - id (uuid, PK)
  - product_id (uuid, FK -> products.id ON DELETE CASCADE)
  - type (text: 'entrada' | 'saida' | 'ajuste')
  - quantity (numeric, positive number)
  - reason (text, optional description e.g. "Produção do dia", "Venda", "Perda")
  - created_at (timestamptz)

2. Security
- RLS enabled on both tables.
- Single-tenant app (no auth) — anon + authenticated can do full CRUD.
- USING (true) is acceptable because data is intentionally shared/public.

3. Indexes
- Index on stock_movements(product_id) for join performance.
- Index on stock_movements(created_at) for time-based chart queries.
- Index on products(category) for category filtering.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Pães',
  unit text NOT NULL DEFAULT 'un',
  min_stock numeric(12,2) NOT NULL DEFAULT 0,
  current_stock numeric(12,2) NOT NULL DEFAULT 0,
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  sell_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  quantity numeric(12,2) NOT NULL DEFAULT 0,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_movements" ON stock_movements;
CREATE POLICY "anon_select_movements" ON stock_movements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_movements" ON stock_movements;
CREATE POLICY "anon_insert_movements" ON stock_movements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_movements" ON stock_movements;
CREATE POLICY "anon_update_movements" ON stock_movements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_movements" ON stock_movements;
CREATE POLICY "anon_delete_movements" ON stock_movements FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
