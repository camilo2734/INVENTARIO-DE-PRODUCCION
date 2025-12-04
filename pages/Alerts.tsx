
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Alert } from '../types';
import { AlertTriangle, Calendar, ShoppingBag, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    calculateAlerts();
  }, []);

  const calculateAlerts = () => {
    const ingredients = StorageService.getIngredients();
    const sales = StorageService.getSales();
    const products = StorageService.getProducts();

    // 1. Calculate Average Daily Consumption per Ingredient (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const recentSales = sales.filter(s => new Date(s.date) >= sevenDaysAgo);
    const consumptionMap: Record<string, number> = {}; 

    recentSales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        product.recipe.forEach(item => {
          if (!consumptionMap[item.ingredientId]) consumptionMap[item.ingredientId] = 0;
          consumptionMap[item.ingredientId] += (item.quantity * sale.quantity);
        });
      }
    });

    // 2. Build Alerts
    const newAlerts: Alert[] = ingredients.map(ing => {
      const weeklyConsumption = consumptionMap[ing.id] || 0;
      const dailyConsumption = Math.max(weeklyConsumption / 7, 0.1); 
      const daysRemaining = ing.quantity / dailyConsumption;
      
      let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
      
      // Logic for Masa (Special Handling)
      if (ing.type === 'MASA') {
          if (ing.quantity < 2000) status = 'CRITICAL'; // Alert if less than 2kg
          else if (ing.quantity < 5000) status = 'WARNING';
      } else {
          // Normal logic for others
          if (ing.quantity <= ing.minThreshold || daysRemaining < 2) status = 'CRITICAL';
          else if (daysRemaining < 5) status = 'WARNING';
      }

      return {
        ingredientId: ing.id,
        ingredientName: ing.name,
        currentStock: ing.quantity,
        daysRemaining: Math.floor(daysRemaining),
        status
      };
    });

    setAlerts(newAlerts.sort((a, b) => {
        // Prioritize Critical, then warnings
        if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
        if (b.status === 'CRITICAL' && a.status !== 'CRITICAL') return 1;
        return a.daysRemaining - b.daysRemaining;
    }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Alertas de Inventario</h2>
        <p className="text-slate-500">Predicción de compras y producción para Umami Fénix</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.map(alert => {
            if (alert.status === 'OK') return null;

            const isCritical = alert.status === 'CRITICAL';
            const isMasa = alert.ingredientName.toLowerCase().includes('masa');
            
            return (
                <div key={alert.ingredientId} className={`relative overflow-hidden p-6 rounded-2xl border-l-4 shadow-sm ${isCritical ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-400'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-full ${isCritical ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {isMasa ? <ChefHat size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${isCritical ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                            {isCritical ? 'Crítico' : 'Advertencia'}
                        </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{alert.ingredientName}</h3>
                    <p className="text-slate-600 text-sm mb-4">Stock actual: <span className="font-bold">{alert.currentStock}</span></p>

                    <div className="space-y-3">
                        {/* Custom Msg for Masa */}
                        {isMasa ? (
                            <div className="bg-white/80 p-3 rounded-lg border border-white">
                                <p className="text-xs text-slate-500 mb-1">Acción requerida:</p>
                                <p className="font-bold text-slate-800">
                                    {alert.currentStock < 500 ? '¡DETENER VENTAS! Producir masa urgente.' : 'Producir al menos 3kg hoy.'}
                                </p>
                                <Link to="/production" className="block mt-2 text-center bg-primary-500 text-white text-xs py-1.5 rounded font-bold hover:bg-primary-600">
                                    Ir a Fabricar
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 bg-white/80 p-3 rounded-lg border border-white">
                                    <Calendar size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Duración</p>
                                        <p className="font-bold text-slate-800">
                                            {alert.daysRemaining <= 0 ? 'AGOTADO' : `${alert.daysRemaining} días`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/80 p-3 rounded-lg border border-white">
                                    <ShoppingBag size={18} className="text-slate-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Comprar</p>
                                        <p className="font-bold text-slate-800 leading-tight">
                                            {alert.daysRemaining <= 1 ? 'URGENTE: Comprar Hoy' : `Antes del ${new Date(Date.now() + (alert.daysRemaining * 86400000)).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
        })}
        {alerts.filter(a => a.status !== 'OK').length === 0 && (
            <div className="col-span-3 bg-white p-12 rounded-2xl border border-gray-100 text-center">
                <div className="bg-primary-50 text-primary-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Todo en orden</h3>
                <p className="text-slate-500 mt-2">Tienes insumos y masa suficiente para la producción de esta semana.</p>
            </div>
        )}
      </div>
    </div>
  );
};

const CheckCircle = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
