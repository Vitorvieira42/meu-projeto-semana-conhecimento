import { useEffect } from 'react';
import { X } from 'lucide-react';
import { classNames } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
};

export function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-crust-900/40 backdrop-blur-sm animate-fade-in-up"
        onClick={onClose}
      />
      <div
        className={classNames(
          'relative w-full bg-flour-50 rounded-t-3xl sm:rounded-3xl shadow-lift border border-flour-200',
          'max-h-[92vh] overflow-y-auto scrollbar-thin animate-fade-in-up',
          maxWidth,
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 bg-flour-50/95 backdrop-blur border-b border-flour-200">
          <div>
            <h2 className="font-display text-xl font-semibold text-crust-800">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-flour-700">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-flour-700 hover:bg-flour-200 hover:text-crust-800 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
