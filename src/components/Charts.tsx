import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BRL, NUM } from '@/lib/utils';

const AXIS = { fontSize: 11, fill: '#8C7042', fontFamily: 'Inter' };
const GRID = '#E8D8B8';

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-crust-900/95 text-flour-50 px-3 py-2 shadow-lift text-xs">
      {label && <p className="font-medium mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-flour-200">{p.name}:</span>
          <span className="font-semibold tabular-nums">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export type DailyPoint = { date: string; label: string; entradas: number; saidas: number };
export type CategoryPoint = { category: string; value: number; count: number };
export type StockPoint = { name: string; stock: number; min: number; unit: string };

export function MovementAreaChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gEntradas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4E924A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4E924A" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gSaidas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6612E" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#E6612E" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip formatter={(v: number) => NUM(v)} />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="entradas"
          name="Entradas"
          stroke="#4E924A"
          strokeWidth={2.5}
          fill="url(#gEntradas)"
          dot={false}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="saidas"
          name="Saídas"
          stroke="#E6612E"
          strokeWidth={2.5}
          fill="url(#gSaidas)"
          dot={false}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ['#C97F2E', '#7B65BC', '#4E924A', '#E6612E', '#D04A1E'];

export function CategoryPieChart({ data }: { data: CategoryPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={3}
          stroke="#FDFCF9"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }: any) =>
            active && payload?.length ? (
              <div className="rounded-xl bg-crust-900/95 text-flour-50 px-3 py-2 shadow-lift text-xs">
                <p className="font-medium">{payload[0].payload.category}</p>
                <p className="text-flour-200">
                  {payload[0].payload.count} itens · {BRL(payload[0].value)}
                </p>
              </div>
            ) : null
          }
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StockBarChart({ data }: { data: StockPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        barCategoryGap={6}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ ...AXIS, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={96}
        />
        <Tooltip
          cursor={{ fill: 'rgba(201, 127, 46, 0.06)' }}
          content={({ active, payload }: any) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as StockPoint;
            return (
              <div className="rounded-xl bg-crust-900/95 text-flour-50 px-3 py-2 shadow-lift text-xs">
                <p className="font-medium">{p.name}</p>
                <p className="text-flour-200">
                  Estoque: {NUM(p.stock)} {p.unit}
                </p>
                <p className="text-flour-200">
                  Mínimo: {NUM(p.min)} {p.unit}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="stock" name="Estoque atual" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((p, i) => (
            <Cell
              key={i}
              fill={p.stock <= 0 ? '#EF4444' : p.stock <= p.min ? '#E6612E' : '#C97F2E'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export type RevenuePoint = { name: string; receita: number; custo: number };

export function RevenueBarChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap={12}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<ChartTooltip formatter={(v: number) => BRL(v)} />} cursor={{ fill: 'rgba(201, 127, 46, 0.06)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', paddingTop: 8 }} />
        <Bar dataKey="receita" name="Receita potencial" fill="#C97F2E" radius={[6, 6, 0, 0]} barSize={14} />
        <Bar dataKey="custo" name="Custo" fill="#D9C193" radius={[6, 6, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
