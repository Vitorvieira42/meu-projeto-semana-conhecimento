import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  CandlestickChart,
  ClipboardList,
  History,
  Pencil,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Trash2,
  TriangleAlert,
  Wallet,
  Wheat,
} from 'lucide-react';
import { supabase, type Product, type StockMovement } from '@/lib/supabase';
import {
  BRL,
  NUM,
  CATEGORIES,
  classNames,
  getStatus,
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_STYLES,
} from '@/lib/utils';
import { StatCard } from '@/components/StatCard';
import { Modal } from '@/components/Modal';
import { ProductForm } from '@/components/ProductForm';
import { MovementForm } from '@/components/MovementForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HistoryModal } from '@/components/HistoryModal';
import {
  CategoryPieChart,
  MovementAreaChart,
  RevenueBarChart,
  StockBarChart,
  type CategoryPoint,
  type DailyPoint,
  type RevenuePoint,
  type StockPoint,
} from '@/components/Charts';

type View = 'dashboard' | 'estoque' | 'alertas' | 'movimentacoes';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [movementFormOpen, setMovementFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movementPreset, setMovementPreset] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    setProducts(data || []);
  }, []);

  const loadMovements = useCallback(async () => {
    const { data } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    setMovements(data || []);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadProducts(), loadMovements()]);
  }, [loadProducts, loadMovements]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const saveProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('products').insert(data);
      if (error) throw error;
    }
    await refresh();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    await refresh();
  };

  const saveMovement = async (data: {
    product_id: string;
    type: 'entrada' | 'saida' | 'ajuste';
    quantity: number;
    reason: string;
  }) => {
    const product = products.find((p) => p.id === data.product_id);
    if (!product) throw new Error('Produto não encontrado.');

    let newStock = product.current_stock;
    if (data.type === 'entrada') newStock += data.quantity;
    else if (data.type === 'saida') newStock = Math.max(0, newStock - data.quantity);
    else if (data.type === 'ajuste') newStock = data.quantity;

    const { error: mErr } = await supabase.from('stock_movements').insert({
      product_id: data.product_id,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
    });
    if (mErr) throw mErr;

    const { error: pErr } = await supabase
      .from('products')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', data.product_id);
    if (pErr) throw pErr;

    await refresh();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && getStatus(p) !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, categoryFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalUnits = products.reduce((s, p) => s + p.current_stock, 0);
    const stockValue = products.reduce((s, p) => s + p.current_stock * p.cost_price, 0);
    const potentialRevenue = products.reduce((s, p) => s + p.current_stock * p.sell_price, 0);
    const lowCount = products.filter((p) => getStatus(p) === 'low').length;
    const outCount = products.filter((p) => getStatus(p) === 'out').length;
    return { totalItems, totalUnits, stockValue, potentialRevenue, lowCount, outCount };
  }, [products]);

  const dailyData: DailyPoint[] = useMemo(() => {
    const days: Record<string, { date: string; label: string; entradas: number; saidas: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = {
        date: key,
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d),
        entradas: 0,
        saidas: 0,
      };
    }
    movements.forEach((m) => {
      const key = m.created_at.slice(0, 10);
      if (days[key]) {
        if (m.type === 'entrada') days[key].entradas += m.quantity;
        else if (m.type === 'saida') days[key].saidas += m.quantity;
      }
    });
    return Object.values(days);
  }, [movements]);

  const categoryData: CategoryPoint[] = useMemo(() => {
    return CATEGORIES.map((c) => {
      const items = products.filter((p) => p.category === c);
      return {
        category: c,
        count: items.length,
        value: items.reduce((s, p) => s + p.current_stock * p.cost_price, 0),
      };
    }).filter((d) => d.count > 0);
  }, [products]);

  const stockBarData: StockPoint[] = useMemo(
    () =>
      products
        .slice()
        .sort((a, b) => b.current_stock - a.current_stock)
        .slice(0, 10)
        .map((p) => ({ name: p.name, stock: p.current_stock, min: p.min_stock, unit: p.unit })),
    [products],
  );

  const revenueData: RevenuePoint[] = useMemo(
    () =>
      CATEGORIES.map((c) => {
        const items = products.filter((p) => p.category === c);
        return {
          name: c,
          receita: items.reduce((s, p) => s + p.current_stock * p.sell_price, 0),
          custo: items.reduce((s, p) => s + p.current_stock * p.cost_price, 0),
        };
      }).filter((d) => d.receita > 0 || d.custo > 0),
    [products],
  );

  const alertProducts = useMemo(
    () => products.filter((p) => getStatus(p) !== 'ok').sort((a, b) => a.current_stock - b.current_stock),
    [products],
  );

  const recentMovements = useMemo(() => movements.slice(0, 30), [movements]);

  const navItems: { key: View; label: string; icon: typeof Boxes }[] = [
    { key: 'dashboard', label: 'Painel', icon: CandlestickChart },
    { key: 'estoque', label: 'Estoque', icon: Boxes },
    { key: 'alertas', label: 'Alertas', icon: TriangleAlert },
    { key: 'movimentacoes', label: 'Movimentações', icon: ClipboardList },
  ];

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductFormOpen(true);
  };
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductFormOpen(true);
  };
  const openMovement = (productId?: string) => {
    setMovementPreset(productId || null);
    setMovementFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-flour-100 text-crust-800">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-flour-200 bg-flour-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crust-600 text-flour-50 shadow-soft">
              <Wheat size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold leading-none text-crust-800">PadeControl</h1>
              <p className="text-[11px] text-flour-600">Gestão de estoque da padaria</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openMovement()}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-flour-300 bg-white px-3.5 py-2 text-sm font-medium text-crust-700 hover:border-crust-400 hover:bg-flour-50 transition"
            >
              <Plus size={16} /> Movimentação
            </button>
            <button
              onClick={openNewProduct}
              className="flex items-center gap-1.5 rounded-xl bg-crust-600 px-3.5 py-2 text-sm font-semibold text-flour-50 shadow-soft hover:bg-crust-700 active:scale-[0.98] transition"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Novo produto</span>
              <span className="sm:hidden">Produto</span>
            </button>
          </div>
        </div>
        {/* Tabs */}
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              const badge = item.key === 'alertas' && stats.lowCount + stats.outCount > 0
                ? stats.lowCount + stats.outCount
                : null;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={classNames(
                    'relative flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors',
                    active ? 'text-crust-800' : 'text-flour-600 hover:text-crust-700',
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                  {badge && (
                    <span className="ml-1 rounded-full bg-ember-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-crust-600" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-ember-50 px-4 py-3 text-sm text-ember-700 ring-1 ring-ember-200">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-flour-200 shimmer" />
            ))}
          </div>
        ) : (
          <>
            {/* DASHBOARD */}
            {view === 'dashboard' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-crust-800">Painel geral</h2>
                  <p className="text-sm text-flour-600">Visão geral do estoque e desempenho da padaria</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Produtos cadastrados"
                    value={NUM(stats.totalItems)}
                    sub={`${NUM(stats.totalUnits)} unidades em estoque`}
                    icon={Boxes}
                    tone="crust"
                  />
                  <StatCard
                    label="Valor em estoque"
                    value={BRL(stats.stockValue)}
                    sub="Custo de aquisição"
                    icon={Wallet}
                    tone="herb"
                  />
                  <StatCard
                    label="Receita potencial"
                    value={BRL(stats.potentialRevenue)}
                    sub={`Lucro: ${BRL(stats.potentialRevenue - stats.stockValue)}`}
                    icon={TrendingUp}
                    tone="berry"
                  />
                  <StatCard
                    label="Alertas ativos"
                    value={NUM(stats.lowCount + stats.outCount)}
                    sub={`${stats.outCount} sem estoque · ${stats.lowCount} baixo`}
                    icon={TriangleAlert}
                    tone="ember"
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <Panel
                    title="Movimentações (14 dias)"
                    subtitle="Entradas e saídas ao longo do tempo"
                    className="lg:col-span-2"
                  >
                    <MovementAreaChart data={dailyData} />
                  </Panel>
                  <Panel title="Valor por categoria" subtitle="Distribuição do capital em estoque">
                    {categoryData.length > 0 ? (
                      <CategoryPieChart data={categoryData} />
                    ) : (
                      <EmptyChart />
                    )}
                  </Panel>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel title="Receita potencial × Custo" subtitle="Por categoria de produto">
                    {revenueData.length > 0 ? <RevenueBarChart data={revenueData} /> : <EmptyChart />}
                  </Panel>
                  <Panel title="Top 10 produtos em estoque" subtitle="Quantidade atual por produto">
                    {stockBarData.length > 0 ? <StockBarChart data={stockBarData} /> : <EmptyChart />}
                  </Panel>
                </div>

                {alertProducts.length > 0 && (
                  <Panel title="Atenção necessária" subtitle="Produtos com estoque baixo ou esgotado">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {alertProducts.slice(0, 6).map((p) => {
                        const status = getStatus(p);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 rounded-xl border border-flour-200 bg-white px-3.5 py-3"
                          >
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-crust-800">{p.name}</p>
                              <p className="text-xs text-flour-600">
                                {NUM(p.current_stock)} {p.unit} · mín. {NUM(p.min_stock)} {p.unit}
                              </p>
                            </div>
                            <button
                              onClick={() => openMovement(p.id)}
                              className="shrink-0 rounded-lg bg-crust-600 px-3 py-1.5 text-xs font-semibold text-flour-50 hover:bg-crust-700 transition"
                            >
                              Repor
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                )}
              </div>
            )}

            {/* ESTOQUE */}
            {view === 'estoque' && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-crust-800">Estoque</h2>
                    <p className="text-sm text-flour-600">{filteredProducts.length} de {products.length} produtos</p>
                  </div>
                  <button
                    onClick={openNewProduct}
                    className="flex items-center gap-1.5 rounded-xl bg-crust-600 px-4 py-2.5 text-sm font-semibold text-flour-50 shadow-soft hover:bg-crust-700 transition"
                  >
                    <Plus size={16} /> Adicionar produto
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-flour-200 bg-white p-3 shadow-soft">
                  <div className="relative min-w-[180px] flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-flour-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar produto…"
                      className="w-full rounded-xl border border-flour-300 bg-flour-50 py-2 pl-9 pr-3 text-sm text-crust-800 placeholder:text-flour-400 focus:border-crust-400 focus:ring-2 focus:ring-crust-200 outline-none transition"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-xl border border-flour-300 bg-flour-50 px-3 py-2 text-sm text-crust-800 focus:border-crust-400 focus:ring-2 focus:ring-crust-200 outline-none transition"
                  >
                    <option value="all">Todas categorias</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-flour-300 bg-flour-50 px-3 py-2 text-sm text-crust-800 focus:border-crust-400 focus:ring-2 focus:ring-crust-200 outline-none transition"
                  >
                    <option value="all">Todos status</option>
                    <option value="ok">Em dia</option>
                    <option value="low">Estoque baixo</option>
                    <option value="out">Sem estoque</option>
                  </select>
                </div>

                <div className="overflow-hidden rounded-2xl border border-flour-200 bg-white shadow-soft">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-flour-200 bg-flour-50 text-left text-xs font-semibold uppercase tracking-wide text-flour-600">
                          <th className="px-4 py-3">Produto</th>
                          <th className="px-4 py-3">Categoria</th>
                          <th className="px-4 py-3 text-right">Estoque</th>
                          <th className="px-4 py-3 text-right">Mínimo</th>
                          <th className="px-4 py-3 text-right">Custo</th>
                          <th className="px-4 py-3 text-right">Venda</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-flour-100">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-flour-600">
                              Nenhum produto encontrado.
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((p) => {
                            const status = getStatus(p);
                            return (
                              <tr key={p.id} className="hover:bg-flour-50/60 transition-colors">
                                <td className="px-4 py-3 font-medium text-crust-800">{p.name}</td>
                                <td className="px-4 py-3 text-flour-700">{p.category}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-crust-800">
                                  {NUM(p.current_stock)} <span className="text-xs font-normal text-flour-500">{p.unit}</span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-flour-700">
                                  {NUM(p.min_stock)} <span className="text-xs text-flour-400">{p.unit}</span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-flour-700">{BRL(p.cost_price)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-crust-700 font-medium">{BRL(p.sell_price)}</td>
                                <td className="px-4 py-3">
                                  <span className={classNames(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                                    STATUS_STYLES[status],
                                  )}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                                    {STATUS_LABEL[status]}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <IconBtn title="Histórico" onClick={() => setHistoryProduct(p)}>
                                      <History size={15} />
                                    </IconBtn>
                                    <IconBtn title="Movimentar" onClick={() => openMovement(p.id)}>
                                      <Sparkles size={15} />
                                    </IconBtn>
                                    <IconBtn title="Editar" onClick={() => openEditProduct(p)}>
                                      <Pencil size={15} />
                                    </IconBtn>
                                    <IconBtn title="Excluir" danger onClick={() => setDeletingProduct(p)}>
                                      <Trash2 size={15} />
                                    </IconBtn>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ALERTAS */}
            {view === 'alertas' && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-crust-800">Alertas de estoque</h2>
                  <p className="text-sm text-flour-600">
                    {alertProducts.length} produto(s) precisam de atenção
                  </p>
                </div>
                {alertProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-flour-200 bg-white py-16 text-center shadow-soft">
                    <div className="mb-3 rounded-2xl bg-herb-50 p-3 text-herb-600 ring-1 ring-herb-200">
                      <Sparkles size={28} />
                    </div>
                    <p className="font-display text-lg font-semibold text-crust-800">Tudo em ordem!</p>
                    <p className="text-sm text-flour-600">Nenhum produto com estoque baixo ou esgotado.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {alertProducts.map((p) => {
                      const status = getStatus(p);
                      const pct = p.min_stock > 0 ? Math.min(100, (p.current_stock / (p.min_stock * 2)) * 100) : 0;
                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl border border-flour-200 bg-white p-4 shadow-soft hover:shadow-lift transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-crust-800">{p.name}</p>
                              <p className="text-xs text-flour-600">{p.category}</p>
                            </div>
                            <span className={classNames(
                              'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                              STATUS_STYLES[status],
                            )}>
                              {STATUS_LABEL[status]}
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-baseline justify-between text-xs text-flour-600">
                              <span className="tabular-nums font-semibold text-crust-700">
                                {NUM(p.current_stock)} {p.unit}
                              </span>
                              <span>mín. {NUM(p.min_stock)} {p.unit}</span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-flour-100">
                              <div
                                className={classNames(
                                  'h-full rounded-full transition-all',
                                  status === 'out' ? 'bg-red-500' : status === 'low' ? 'bg-ember-500' : 'bg-herb-500',
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => openMovement(p.id)}
                              className="flex-1 rounded-lg bg-crust-600 px-3 py-2 text-xs font-semibold text-flour-50 hover:bg-crust-700 transition"
                            >
                              Repor estoque
                            </button>
                            <button
                              onClick={() => setHistoryProduct(p)}
                              className="rounded-lg border border-flour-300 px-3 py-2 text-xs font-medium text-crust-700 hover:bg-flour-50 transition"
                            >
                              <History size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MOVIMENTACOES */}
            {view === 'movimentacoes' && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-crust-800">Movimentações</h2>
                    <p className="text-sm text-flour-600">Histórico de entradas, saídas e ajustes</p>
                  </div>
                  <button
                    onClick={() => openMovement()}
                    className="flex items-center gap-1.5 rounded-xl bg-crust-600 px-4 py-2.5 text-sm font-semibold text-flour-50 shadow-soft hover:bg-crust-700 transition"
                  >
                    <Plus size={16} /> Nova movimentação
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-flour-200 bg-white shadow-soft">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-flour-200 bg-flour-50 text-left text-xs font-semibold uppercase tracking-wide text-flour-600">
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Produto</th>
                          <th className="px-4 py-3 text-right">Quantidade</th>
                          <th className="px-4 py-3">Motivo</th>
                          <th className="px-4 py-3">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-flour-100">
                        {recentMovements.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-flour-600">
                              Nenhuma movimentação registrada.
                            </td>
                          </tr>
                        ) : (
                          recentMovements.map((m) => {
                            const p = products.find((x) => x.id === m.product_id);
                            const colors: Record<string, string> = {
                              entrada: 'text-herb-700 bg-herb-50 ring-herb-200',
                              saida: 'text-ember-700 bg-ember-50 ring-ember-200',
                              ajuste: 'text-berry-700 bg-berry-50 ring-berry-200',
                            };
                            const labels: Record<string, string> = {
                              entrada: 'Entrada',
                              saida: 'Saída',
                              ajuste: 'Ajuste',
                            };
                            return (
                              <tr key={m.id} className="hover:bg-flour-50/60 transition">
                                <td className="px-4 py-3">
                                  <span className={classNames(
                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                                    colors[m.type],
                                  )}>
                                    {labels[m.type]}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-crust-800">{p?.name || '—'}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-crust-800">
                                  {NUM(m.quantity)} <span className="text-xs font-normal text-flour-500">{p?.unit || ''}</span>
                                </td>
                                <td className="px-4 py-3 text-flour-700">{m.reason || '—'}</td>
                                <td className="px-4 py-3 text-flour-600">
                                  {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(m.created_at))}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <ProductForm
        open={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        onSave={saveProduct}
        product={editingProduct}
      />
      <MovementForm
        open={movementFormOpen}
        onClose={() => setMovementFormOpen(false)}
        onSave={saveMovement}
        products={products}
        presetProductId={movementPreset}
      />
      <HistoryModal
        open={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
        product={historyProduct}
        onRefresh={refresh}
      />
      <ConfirmDialog
        open={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => deletingProduct && deleteProduct(deletingProduct.id)}
        title="Excluir produto"
        message={`Tem certeza que deseja excluir "${deletingProduct?.name}"? Todas as movimentações vinculadas também serão removidas.`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={classNames('rounded-2xl border border-flour-200 bg-white p-5 shadow-soft', className)}>
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold text-crust-800">{title}</h3>
        {subtitle && <p className="text-xs text-flour-600">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-flour-500">
      Sem dados para exibir
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={classNames(
        'rounded-lg p-1.5 transition-colors',
        danger
          ? 'text-flour-500 hover:bg-red-50 hover:text-red-600'
          : 'text-flour-500 hover:bg-flour-200 hover:text-crust-700',
      )}
    >
      {children}
    </button>
  );
}
