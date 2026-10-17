import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex gap-3">
        {danger && (
          <div className="shrink-0 rounded-xl bg-ember-50 p-2.5 text-ember-600 ring-1 ring-ember-200">
            <AlertTriangle size={20} />
          </div>
        )}
        <p className="text-sm text-crust-700 pt-1">{message}</p>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-flour-700 hover:bg-flour-200 transition"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={
            danger
              ? 'rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-red-700 active:scale-[0.98] transition'
              : 'rounded-xl bg-crust-600 px-5 py-2.5 text-sm font-semibold text-flour-50 shadow-soft hover:bg-crust-700 active:scale-[0.98] transition'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
