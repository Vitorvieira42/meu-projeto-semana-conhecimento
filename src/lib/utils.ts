import type { Product } from '@/lib/supabase';

export const CATEGORIES = ['Pães', 'Doces', 'Bolos', 'Salgados'] as const;
export const UNITS = ['un', 'kg', 'g', 'L', 'mL', 'dz', 'pac'] as const;

export const BRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);

export const NUM = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value || 0);

export type Status = 'ok' | 'low' | 'out';

export function getStatus(p: Pick<Product, 'current_stock' | 'min_stock'>): Status {
  if (p.current_stock <= 0) return 'out';
  if (p.current_stock <= p.min_stock) return 'low';
  return 'ok';
}

export const STATUS_LABEL: Record<Status, string> = {
  ok: 'Em dia',
  low: 'Estoque baixo',
  out: 'Sem estoque',
};

export const STATUS_STYLES: Record<Status, string> = {
  ok: 'bg-herb-50 text-herb-700 ring-herb-200',
  low: 'bg-ember-50 text-ember-700 ring-ember-200',
  out: 'bg-red-50 text-red-700 ring-red-200',
};

export const STATUS_DOT: Record<Status, string> = {
  ok: 'bg-herb-500',
  low: 'bg-ember-500',
  out: 'bg-red-500',
};

export function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
