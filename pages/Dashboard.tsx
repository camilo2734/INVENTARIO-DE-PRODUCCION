
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Ingredient, Sale } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, DollarSign, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StorageService.init();
    setIngredients(StorageService.getIngredients());
    setSales(StorageService.getSales());
    setLoading(false);
  }, []);

  const masa = ingredients.find(i => i.id === 'masa_base');
  const lowStockCount = ingredients.filter(i => i.quantity <= i.minThreshold).length;
  
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales
    .filter(s => s.date.startsWith(today))
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalValue = ingredients.reduce((acc, curr) => acc + (curr.quantity * curr.cost), 0);

  // Prepare Chart Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const chartData = last7Days.map(date => {
    const dailyTotal = sales.filter(s => s.date.startsWith(date)).reduce((acc, curr) => acc + curr.total, 0);
    return { date: date.slice(5), total: dailyTotal };
  });

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Resumen del Negocio</h2>
        <p className="text-slate-500">Métricas clave de Umami Fénix</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* MASA KPI (NEW) */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-900/20 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500 rounded-full blur-2xl opacity-20 -translate-y-5 translate-x-5"></div>
            <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400 uppercase">Masa Disponible</p>
                <h3 className={`text-3xl font-bold mt-1 ${masa && masa.quantity < 2000 ? 'text-red-400' : 'text-primary-400'}`}>
                    {masa ? (masa.quantity / 1000).toFixed(1) : 0} kg
                </h3>
                <Link to="/production" className="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 transition">
                    <ChefHat size={14} /> Ir a Producción
                </Link>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                 <p className="text-sm font-medium text-slate-400">Ventas de Hoy</p>
                 <h3 className="text-2xl font-bold text-slate-800">
                    {todaySales.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                 </h3>
            </div>
            <div className="self-end bg-primary-50 p-2 rounded-full text-primary-500"><TrendingUp size={20} /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <p className="text-sm font-medium text-slate-400">Valor Inventario</p>
                <h3 className="text-2xl font-bold text-slate-800">
                    {totalValue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                </h3>
            </div>
            <div className="self-end bg-blue-50 p-2 rounded-full text-blue-600"><DollarSign size={20} /></div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
            <div>
                <p className="text-sm font-medium text-slate-400">Alertas Stock</p>
                <h3 className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStockCount} items</h3>
            </div>
            <div className={`self-end p-2 rounded-full ${lowStockCount > 0 ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-500'}`}><AlertCircle size={20} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Tendencia de Ventas (7 Días)</h3>
          <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChartComponent data={chartData} /></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Insumos Críticos</h3>
          <div className="space-y-4">
            {ingredients.slice(0, 5).sort((a,b) => (a.quantity/a.minThreshold) - (b.quantity/b.minThreshold)).map(ing => {
              const percentage = Math.min(100, (ing.quantity / (ing.minThreshold * 2)) * 100);
              const color = ing.quantity <= ing.minThreshold ? 'bg-red-500' : 'bg-primary-500';
              return (
                <div key={ing.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{ing.name}</span>
                    <span className="text-slate-500 text-xs">{ing.quantity} {ing.unit}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`${color} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const AreaChartComponent = ({ data }: { data: any[] }) => (
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#cbd5e1' }} />
    <Line type="monotone" dataKey="total" stroke="#FF6B2B" strokeWidth={3} dot={{ r: 4, fill: '#FF6B2B' }} activeDot={{ r: 6 }} />
  </LineChart>
);
