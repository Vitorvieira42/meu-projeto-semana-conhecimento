import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { CATEGORIES, UNITS, classNames } from '@/lib/utils';
import type { Product } from '@/lib/supabase';

type ProductFormProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  product?: Product | null;
};

const empty = {
  name: '',
  category: 'Pães' as string,
  unit: 'un' as string,
  min_stock: 0,
  current_stock: 0,
  cost_price: 0,
  sell_price: 0,
};

export function ProductForm({ open, onClose, onSave, product }: ProductFormProps) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        product
          ? {
              name: product.name,
              category: product.category,
              unit: product.unit,
              min_stock: product.min_stock,
              current_stock: product.current_stock,
              cost_price: product.cost_price,
              sell_price: product.sell_price,
            }
          : empty,
      );
    }
  }, [open, product]);

  const set = (key: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Informe o nome do produto.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        min_stock: Number(form.min_stock) || 0,
        current_stock: Number(form.current_stock) || 0,
        cost_price: Number(form.cost_price) || 0,
        sell_price: Number(form.sell_price) || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    'w-full rounded-xl border border-flour-300 bg-white px-3.5 py-2.5 text-sm text-crust-800 placeholder:text-flour-400 focus:border-crust-400 focus:ring-2 focus:ring-crust-200 outline-none transition';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'Editar produto' : 'Novo produto'}
      subtitle={product ? product.name : 'Cadastre um novo item no estoque da padaria'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
            Nome do produto
          </label>
          <input
            className={fieldCls}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex: Pão Francês"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Categoria
            </label>
            <select
              className={fieldCls}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Unidade
            </label>
            <select
              className={fieldCls}
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Estoque atual
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldCls}
              value={form.current_stock}
              onChange={(e) => set('current_stock', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Estoque mínimo
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldCls}
              value={form.min_stock}
              onChange={(e) => set('min_stock', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Preço de custo (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldCls}
              value={form.cost_price}
              onChange={(e) => set('cost_price', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Preço de venda (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldCls}
              value={form.sell_price}
              onChange={(e) => set('sell_price', e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-ember-50 px-3 py-2 text-sm text-ember-700 ring-1 ring-ember-200">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-flour-700 hover:bg-flour-200 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className={classNames(
              'rounded-xl bg-crust-600 px-5 py-2.5 text-sm font-semibold text-flour-50 shadow-soft',
              'hover:bg-crust-700 active:scale-[0.98] transition disabled:opacity-60',
            )}
          >
            {saving ? 'Salvando…' : product ? 'Salvar alterações' : 'Adicionar produto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
