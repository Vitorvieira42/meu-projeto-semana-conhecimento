import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react';
import { Modal } from './Modal';
import { NUM } from '@/lib/utils';
import type { Product, StockMovement } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type HistoryModalProps = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onRefresh: () => void;
};

const TYPE_META = {
  entrada: { label: 'Entrada', icon: ArrowDownCircle, cls: 'text-herb-600 bg-herb-50 ring-herb-200' },
  saida: { label: 'Saída', icon: ArrowUpCircle, cls: 'text-ember-600 bg-ember-50 ring-ember-200' },
  ajuste: { label: 'Ajuste', icon: SlidersHorizontal, cls: 'text-berry-600 bg-berry-50 ring-berry-200' },
} as const;

export function HistoryModal({ open, onClose, product, onRefresh }: HistoryModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product) return;
    setLoading(true);
    supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setMovements(data || []);
        setLoading(false);
      });
  }, [open, product]);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Histórico de movimentações"
      subtitle={product ? `${product.name} — ${NUM(product.current_stock)} ${product.unit} atual` : ''}
      maxWidth="max-w-xl"
    >
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-flour-100 shimmer" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <p className="py-8 text-center text-sm text-flour-600">Nenhuma movimentação registrada ainda.</p>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
          {movements.map((m) => {
            const meta = TYPE_META[m.type];
            const Icon = meta.icon;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-flour-200 bg-white px-3.5 py-3"
              >
                <div className={`shrink-0 rounded-lg p-2 ring-1 ${meta.cls}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-crust-800">
                    {meta.label} · <span className="tabular-nums">{NUM(m.quantity)} {product?.unit}</span>
                  </p>
                  <p className="truncate text-xs text-flour-600">
                    {m.reason || 'Sem motivo informado'} · {fmtDate(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
