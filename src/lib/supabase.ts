import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  cost_price: number;
  sell_price: number;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  product_id: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason: string;
  created_at: string;
};

export type ProductWithMeta = Product & {
  stock_value: number;
  potential_revenue: number;
  status: 'ok' | 'low' | 'out';
};
