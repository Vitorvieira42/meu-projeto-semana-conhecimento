import { classNames } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: 'crust' | 'herb' | 'ember' | 'berry';
  trend?: { value: string; up: boolean };
};

const TONES: Record<string, { bg: string; fg: string; ring: string }> = {
  crust: { bg: 'bg-crust-100', fg: 'text-crust-700', ring: 'ring-crust-200' },
  herb: { bg: 'bg-herb-100', fg: 'text-herb-700', ring: 'ring-herb-200' },
  ember: { bg: 'bg-ember-100', fg: 'text-ember-700', ring: 'ring-ember-200' },
  berry: { bg: 'bg-berry-100', fg: 'text-berry-700', ring: 'ring-berry-200' },
};

export function StatCard({ label, value, sub, icon: Icon, tone = 'crust', trend }: StatCardProps) {
  const t = TONES[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-flour-200 shadow-soft hover:shadow-lift transition-all duration-300 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-flour-600">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-crust-800 tabular-nums truncate">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-flour-600">{sub}</p>}
        </div>
        <div className={classNames('shrink-0 rounded-xl p-2.5 ring-1', t.bg, t.fg, t.ring)}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          <span className={trend.up ? 'text-herb-600' : 'text-ember-600'}>
            {trend.up ? '▲' : '▼'} {trend.value}
          </span>
          <span className="text-flour-500">vs. semana anterior</span>
        </div>
      )}
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-flour-100/60 group-hover:bg-flour-200/60 transition-colors" />
    </div>
  );
}
