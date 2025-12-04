
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, Sale, Ingredient } from '../types';
import { Plus, ShoppingCart, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setProducts(StorageService.getProducts());
    setIngredients(StorageService.getIngredients());
    setSales(StorageService.getSales().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setErrorMsg(null);

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // VALIDATION: Check Masa & Ingredient availability
    for (const item of product.recipe) {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        const needed = item.quantity * quantity;
        
        if (!ing || ing.quantity < needed) {
            const name = ing?.name || 'Ingrediente desconocido';
            if (ing?.id === 'masa_base') {
                setErrorMsg(`⚠️ No hay suficiente MASA. Faltan ${(needed - (ing?.quantity || 0))}g. Debes producir masa antes de vender.`);
            } else {
                setErrorMsg(`⚠️ Stock insuficiente de: ${name}. Faltan ${needed - (ing?.quantity || 0)} ${ing?.unit}.`);
            }
            return;
        }
    }

    // Process Sale
    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      timestamp: Date.now(),
      productId: product.id,
      quantity: quantity,
      total: product.price * quantity
    };

    StorageService.addSale(newSale);
    
    // Refresh local list
    setSales([newSale, ...sales]);
    // Refresh ingredients to reflect deduction
    setIngredients(StorageService.getIngredients());
    
    setQuantity(1);
    setSelectedProduct('');
    alert(`Venta registrada: ${product.name}`);
  };

  const groupedProducts = products.reduce((acc, product) => {
    const cat = product.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Sales Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 sticky top-4">
          <div className="flex items-center gap-2 mb-6 text-primary-600">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-bold text-slate-800">Nueva Venta</h2>
          </div>
          
          <form onSubmit={handleAddSale} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Producto</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none border border-slate-700 bg-slate-900 text-white rounded-xl p-3 pr-8 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                  value={selectedProduct}
                  onChange={e => { setSelectedProduct(e.target.value); setErrorMsg(null); }}
                  required
                >
                  <option value="" className="bg-slate-900 text-slate-400">Seleccionar producto...</option>
                  {Object.entries(groupedProducts).map(([category, items]) => (
                    <optgroup key={category} label={category} className="bg-slate-800 text-primary-200 font-bold">
                      {items.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white font-normal">
                          {p.name} — ${p.price.toLocaleString()}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cantidad</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => {setQuantity(Math.max(1, quantity - 1)); setErrorMsg(null);}} className="w-12 h-12 rounded-xl bg-gray-100 text-slate-600 font-bold text-xl flex items-center justify-center">-</button>
                <input type="number" min="1" className="w-full text-center text-2xl font-bold outline-none bg-slate-800 text-white rounded-xl py-2" value={quantity} onChange={e => {setQuantity(parseInt(e.target.value) || 1); setErrorMsg(null);}} />
                <button type="button" onClick={() => {setQuantity(quantity + 1); setErrorMsg(null);}} className="w-12 h-12 rounded-xl bg-gray-100 text-slate-600 font-bold text-xl flex items-center justify-center">+</button>
              </div>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2 text-sm text-red-700 font-medium">
                    <AlertOctagon className="shrink-0 mt-0.5" size={16} />
                    <div>
                        <p>{errorMsg}</p>
                        {errorMsg.includes('MASA') && (
                            <Link to="/production" className="text-red-900 underline font-bold mt-1 block">Ir a Producción →</Link>
                        )}
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-gray-100">
               <div className="flex justify-between items-center mb-4 bg-primary-50 p-3 rounded-lg">
                 <span className="text-primary-800 font-medium">Total Estimado</span>
                 <span className="text-2xl font-bold text-primary-600">
                   {((selectedProduct ? (products.find(p => p.id === selectedProduct)?.price || 0) * quantity : 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                 </span>
               </div>
               <button 
                type="submit"
                disabled={!selectedProduct}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:hover:bg-slate-900 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
               >
                 <Plus size={20} strokeWidth={3} /> Registrar Venta
               </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sales History */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Historial Reciente</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Producto</th>
                <th className="p-4 font-bold text-center">Cant.</th>
                <th className="p-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.slice(0, 20).map(sale => {
                const product = products.find(p => p.id === sale.productId);
                return (
                  <tr key={sale.id} className="hover:bg-primary-50 transition">
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(sale.date).toLocaleDateString()} <span className="text-xs ml-1 text-slate-400">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {product?.name || 'Producto eliminado'}
                      <div className="text-xs text-slate-400">{product?.category}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-gray-100 text-slate-600 font-bold px-3 py-1 rounded-lg text-sm">{sale.quantity}</span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                        {sale.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400">Aún no has registrado ventas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
