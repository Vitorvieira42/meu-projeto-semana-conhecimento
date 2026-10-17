import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react';
import { Modal } from './Modal';
import { classNames, NUM } from '@/lib/utils';
import type { Product } from '@/lib/supabase';

type MovementFormProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: { product_id: string; type: 'entrada' | 'saida' | 'ajuste'; quantity: number; reason: string }) => Promise<void>;
  products: Product[];
  presetProductId?: string | null;
};

const TYPES = [
  { key: 'entrada' as const, label: 'Entrada', icon: ArrowDownCircle, color: 'herb' },
  { key: 'saida' as const, label: 'Saída', icon: ArrowUpCircle, color: 'ember' },
  { key: 'ajuste' as const, label: 'Ajuste', icon: SlidersHorizontal, color: 'berry' },
];

export function MovementForm({ open, onClose, onSave, products, presetProductId }: MovementFormProps) {
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setProductId(presetProductId || products[0]?.id || '');
      setType('entrada');
      setQuantity(0);
      setReason('');
    }
  }, [open, presetProductId, products]);

  const selected = products.find((p) => p.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError('Selecione um produto.');
      return;
    }
    if (quantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ product_id: productId, type, quantity: Number(quantity), reason: reason.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível registrar.');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    'w-full rounded-xl border border-flour-300 bg-white px-3.5 py-2.5 text-sm text-crust-800 focus:border-crust-400 focus:ring-2 focus:ring-crust-200 outline-none transition';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar movimentação"
      subtitle="Entradas, saídas ou ajustes de estoque"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
            Produto
          </label>
          <select className={fieldCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.length === 0 && <option value="">Nenhum produto cadastrado</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {NUM(p.current_stock)} {p.unit}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-1.5 text-xs text-flour-600">
              Estoque atual: <span className="font-semibold text-crust-700">{NUM(selected.current_stock)} {selected.unit}</span>
              {' · '}Mínimo: {NUM(selected.min_stock)} {selected.unit}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
            Tipo de movimentação
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.key;
              const tones: Record<string, string> = {
                herb: 'border-herb-400 bg-herb-50 text-herb-700',
                ember: 'border-ember-400 bg-ember-50 text-ember-700',
                berry: 'border-berry-400 bg-berry-50 text-berry-700',
              };
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={classNames(
                    'flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition',
                    active ? tones[t.color] : 'border-flour-200 bg-white text-flour-600 hover:border-flour-300',
                  )}
                >
                  <Icon size={20} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Quantidade
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldCls}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-flour-700">
              Motivo
            </label>
            <input
              className={fieldCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Produção do dia"
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
            className="rounded-xl bg-crust-600 px-5 py-2.5 text-sm font-semibold text-flour-50 shadow-soft hover:bg-crust-700 active:scale-[0.98] transition disabled:opacity-60"
          >
            {saving ? 'Registrando…' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
