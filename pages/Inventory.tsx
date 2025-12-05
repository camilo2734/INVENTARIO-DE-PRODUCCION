
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Ingredient, Product, InvoiceItem, Purchase } from '../types';
import { Plus, Camera, Check, X, Edit2, Trash2, AlertTriangle, Package, ChefHat, Wheat, Layers, PackageCheck, Minus, Calendar, ShoppingCart, DollarSign, FileText, Lock } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'purchases'>('stock');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Edit/Delete Stock State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    setIngredients(StorageService.getIngredients());
    setProducts(StorageService.getProducts());
    setPurchases(StorageService.getPurchases().sort((a,b) => b.timestamp - a.timestamp));
  }, [refreshKey]);

  const refresh = () => setRefreshKey(prev => prev + 1);

  // --- STOCK ACTIONS ---
  const handleEditClick = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditForm({ ...ing });
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };
  const handleSaveEdit = () => {
    if (!editForm.id) return;
    if ((editForm.quantity ?? 0) < 0) return alert("La cantidad no puede ser negativa.");
    StorageService.saveIngredient(editForm as Ingredient);
    setEditingId(null);
    setEditForm({});
    refresh();
  };
  const handleDeleteClick = (id: string) => setDeleteConfirmationId(id);
  const confirmDelete = () => {
    if (deleteConfirmationId) {
      StorageService.deleteIngredient(deleteConfirmationId);
      setDeleteConfirmationId(null);
      refresh();
    }
  };
  const handleProductStockChange = (productId: string, newStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const delta = newStock - product.stock;

    if (delta > 0) {
        // FIX 2: Increasing stock triggers manufacturing logic (consuming ingredients)
        StorageService.manufactureProduct(productId, delta);
    } else {
        // Decreasing stock remains a simple manual adjustment (waste/correction)
        // to avoid double counting or complex reversal logic
        StorageService.updateProductStock(productId, newStock);
    }
    
    // Refresh full state to show ingredient deductions
    refresh();
  };

  // --- SECTIONS ---
  const masaIngredients = ingredients.filter(i => i.type === 'MASA');
  const baseIngredients = ingredients.filter(i => i.type === 'BASE');
  const fillingIngredients = ingredients.filter(i => ['FILLING', 'PACKAGING'].includes(i.type));

  // --- PURCHASE GROUPING ---
  const groupedPurchases = purchases.reduce((acc, purchase) => {
    const date = purchase.date; // already YYYY-MM-DD
    if (!acc[date]) acc[date] = [];
    acc[date].push(purchase);
    return acc;
  }, {} as Record<string, Purchase[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedPurchases).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // --- RENDER FUNCTIONS ---
  
  const IngredientTable = ({ title, icon: Icon, items, colorClass }: any) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
                <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase w-1/3">Insumo</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase">Cantidad</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase">Unidad</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase">Costo Prom.</th>
                <th className="p-4 font-bold text-slate-500 text-xs uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((ing: Ingredient) => {
                const isEditing = editingId === ing.id;
                const isMasaBase = ing.id === 'masa_base';
                
                return (
                  <tr key={ing.id} className={`transition group ${isEditing ? 'bg-orange-50' : 'hover:bg-primary-50'}`}>
                    <td className="p-4 font-bold text-slate-800">{ing.name}
                        {ing.quantity <= ing.minThreshold && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">Bajo</span>}
                    </td>
                    <td className="p-4 font-mono font-medium">
                        {isEditing ? (
                            <input type="number" min="0" className="w-24 border border-orange-300 rounded px-2 py-1 outline-none bg-white"
                                value={editForm.quantity ?? ''} onChange={e => setEditForm({...editForm, quantity: parseFloat(e.target.value) || 0})} />
                        ) : ing.quantity}
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                        {isEditing ? (
                             <select className="border border-orange-300 rounded px-2 py-1 outline-none bg-white"
                                value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})}>
                                 <option value="g">g</option><option value="ml">ml</option><option value="kg">kg</option><option value="l">l</option><option value="units">units</option>
                             </select>
                        ) : ing.unit}
                    </td>
                    <td className="p-4 text-slate-500">
                         {isEditing && isMasaBase ? (
                             <div className="flex items-center gap-1 text-xs text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded w-fit">
                                 <Lock size={12} /> Auto
                             </div>
                         ) : isEditing ? (
                            <input type="number" min="0" step="0.001" className="w-24 border border-orange-300 rounded px-2 py-1 outline-none bg-white"
                                value={editForm.cost ?? ''} onChange={e => setEditForm({...editForm, cost: parseFloat(e.target.value) || 0})} />
                        ) : (
                            <span>
                                {(ing.cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                {isMasaBase && <span className="text-[10px] text-slate-400 ml-1">(Auto)</span>}
                            </span>
                        )}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                                <><button onClick={handleSaveEdit} className="p-2 bg-green-100 text-green-700 rounded-lg"><Check size={18}/></button>
                                  <button onClick={handleCancelEdit} className="p-2 bg-red-100 text-red-700 rounded-lg"><X size={18}/></button></>
                            ) : (
                                <><button onClick={() => handleEditClick(ing)} className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg"><Edit2 size={18} /></button>
                                  {/* Don't allow deleting Masa Base */}
                                  {ing.id !== 'masa_base' && <button onClick={() => handleDeleteClick(ing.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={18} /></button>}</>
                            )}
                        </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400 italic">Sin items</td></tr>}
            </tbody>
          </table>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-200">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Inventario</h2>
              <p className="text-slate-500">Control de stock y compras</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button 
                onClick={() => setActiveTab('stock')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Stock & Existencias
               </button>
               <button 
                onClick={() => setActiveTab('purchases')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'purchases' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Historial de Compras
               </button>
            </div>
        </div>

        {/* --- TAB: STOCK --- */}
        {activeTab === 'stock' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowOCRModal(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition font-medium"><Camera size={20} /> Escanear Factura</button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl hover:bg-primary-600 transition font-medium"><Plus size={20} /> Nuevo Insumo</button>
                </div>

                <div className="bg-orange-50 p-1 rounded-3xl border border-orange-100">
                    <IngredientTable title="Masa & Producción Intermedia" icon={ChefHat} items={masaIngredients} colorClass="bg-orange-500 text-white" />
                </div>

                <IngredientTable title="Ingredientes Base (Materia Prima)" icon={Wheat} items={baseIngredients} colorClass="bg-yellow-500 text-white" />
                <IngredientTable title="Rellenos, Cárnicos y Empaque" icon={Layers} items={fillingIngredients} colorClass="bg-blue-500 text-white" />

                <hr className="border-gray-200" />

                <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-800 text-white">
                            <PackageCheck size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Productos Terminados (Stock Listos)</h3>
                    </div>
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="p-4 font-bold text-xs uppercase w-1/2">Producto</th>
                                    <th className="p-4 font-bold text-xs uppercase text-center">Stock (Bandejas)</th>
                                    <th className="p-4 font-bold text-xs uppercase text-right">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-slate-800">
                                            {p.name}
                                            <div className="text-xs text-slate-400 font-normal">{p.category}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-3">
                                                <button onClick={() => handleProductStockChange(p.id, p.stock - 1)} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus size={14}/></button>
                                                <span className="font-bold text-lg w-8 text-center">{p.stock}</span>
                                                <button onClick={() => handleProductStockChange(p.id, p.stock + 1)} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus size={14}/></button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-800">
                                            {(p.price * p.stock).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        )}

        {/* --- TAB: PURCHASES (NEW) --- */}
        {activeTab === 'purchases' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
                 {/* Floating Action Button */}
                 <div className="fixed bottom-8 right-8 z-50">
                    <button 
                        onClick={() => setShowPurchaseModal(true)}
                        className="bg-slate-900 text-white p-4 rounded-full shadow-2xl shadow-slate-900/40 hover:scale-105 transition-transform flex items-center gap-2 pr-6"
                    >
                        <Plus size={24} /> <span className="font-bold">Añadir Compra</span>
                    </button>
                 </div>

                 {sortedDates.length === 0 && (
                     <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                         <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                             <ShoppingCart size={40} />
                         </div>
                         <h3 className="text-xl font-bold text-slate-800">Sin compras registradas</h3>
                         <p className="text-slate-500 mt-2">Registra tus compras para llevar el control de costos.</p>
                         <button onClick={() => setShowPurchaseModal(true)} className="mt-6 text-primary-500 font-bold hover:underline">Registrar primera compra</button>
                     </div>
                 )}

                 {sortedDates.map(date => (
                     <div key={date} className="mb-8">
                         {/* Sticky Date Header */}
                         <div className="sticky top-0 z-10 py-3 bg-gray-50/95 backdrop-blur-sm mb-4 border-b border-gray-200 flex items-center gap-2">
                             <Calendar size={18} className="text-primary-500" />
                             <h3 className="font-bold text-slate-800 text-lg capitalize">
                                {new Date(date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                             </h3>
                         </div>

                         {/* Cards Grid */}
                         <div className="grid grid-cols-1 gap-4">
                             {groupedPurchases[date].map(purchase => (
                                 <div key={purchase.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
                                     <div className="flex items-start gap-4">
                                         <div className="bg-primary-50 p-3 rounded-xl text-primary-600 mt-1">
                                             <ShoppingCart size={20} />
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-slate-800 text-lg">{purchase.ingredientName}</h4>
                                             <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                                                 <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 font-bold uppercase">{purchase.quantity} {purchase.unit}</span>
                                                 <span className="text-sm">Costó: {purchase.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                                             </p>
                                             {purchase.notes && (
                                                 <div className="mt-3 text-xs text-slate-400 flex items-start gap-1 bg-gray-50 p-2 rounded-lg">
                                                     <FileText size={12} className="mt-0.5 shrink-0" />
                                                     <span>{purchase.notes}</span>
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                     
                                     {/* Delete Action (Optional: could add Edit too) */}
                                     <button 
                                        onClick={() => {
                                            if(window.confirm('¿Eliminar este registro del historial? (Nota: El stock no se revertirá automáticamente)')) {
                                                StorageService.deletePurchase(purchase.id);
                                                refresh();
                                            }
                                        }}
                                        className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                     >
                                         <Trash2 size={18} />
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
            </div>
        )}

      {showAddModal && <AddIngredientModal onClose={() => setShowAddModal(false)} onSave={refresh} />}
      {showOCRModal && <OCRModal onClose={() => setShowOCRModal(false)} onSave={refresh} />}
      {showPurchaseModal && <PurchaseModal onClose={() => setShowPurchaseModal(false)} onSave={refresh} ingredients={ingredients} />}
      {deleteConfirmationId && <DeleteConfirm id={deleteConfirmationId} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmationId(null)} />}
    </div>
  );
};

// --- Subcomponents ---

const PurchaseModal = ({ onClose, onSave, ingredients }: any) => {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        date: today,
        ingredientId: '',
        quantity: '',
        totalCost: '',
        notes: ''
    });

    const selectedIng = ingredients.find((i: Ingredient) => i.id === form.ingredientId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.ingredientId || !form.quantity || !form.totalCost) return;

        const purchase: Purchase = {
            id: Date.now().toString(),
            date: form.date,
            timestamp: new Date(form.date).getTime(),
            ingredientId: form.ingredientId,
            ingredientName: selectedIng?.name || 'Desconocido',
            quantity: parseFloat(form.quantity),
            unit: selectedIng?.unit || 'units',
            totalCost: parseFloat(form.totalCost),
            notes: form.notes
        };

        StorageService.savePurchase(purchase);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart size={20} className="text-primary-500" /> Registrar Compra</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Fecha</label>
                            <input 
                                type="date" 
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                                value={form.date}
                                onChange={e => setForm({...form, date: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Insumo</label>
                             <select 
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                                value={form.ingredientId}
                                onChange={e => setForm({...form, ingredientId: e.target.value})}
                             >
                                 <option value="">Seleccionar...</option>
                                 {ingredients.sort((a:any,b:any) => a.name.localeCompare(b.name)).map((ing: Ingredient) => (
                                     <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                 ))}
                             </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cantidad Comprada</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    placeholder="0"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg"
                                    value={form.quantity}
                                    onChange={e => setForm({...form, quantity: e.target.value})}
                                />
                                <span className="absolute right-3 top-4 text-xs font-bold text-slate-400">{selectedIng?.unit || '-'}</span>
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Costo Total ($)</label>
                             <div className="relative">
                                <input 
                                    type="number" 
                                    step="100"
                                    required
                                    placeholder="0"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 pl-8 outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg"
                                    value={form.totalCost}
                                    onChange={e => setForm({...form, totalCost: e.target.value})}
                                />
                                <span className="absolute left-3 top-4 text-slate-400"><DollarSign size={16} /></span>
                            </div>
                        </div>
                    </div>

                    {/* Calculated Unit Cost Preview */}
                    {form.quantity && form.totalCost && (
                        <div className="bg-primary-50 p-3 rounded-xl flex justify-between items-center text-sm">
                            <span className="text-primary-800">Costo Unitario Calculado:</span>
                            <span className="font-bold text-primary-600">
                                {(parseFloat(form.totalCost) / parseFloat(form.quantity)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 1 })} / {selectedIng?.unit}
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nota (Opcional)</label>
                        <textarea 
                            rows={2}
                            placeholder="Ej: Proveedor nuevo, marca diferente..."
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-500"
                            value={form.notes}
                            onChange={e => setForm({...form, notes: e.target.value})}
                        />
                    </div>

                    <button className="w-full bg-primary-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-600 shadow-lg shadow-primary-500/30 transition mt-2">
                        Guardar Compra
                    </button>
                </form>
            </div>
        </div>
    );
}

const DeleteConfirm = ({id, onConfirm, onCancel}: any) => (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white p-6 rounded-2xl w-80 text-center">
             <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertTriangle /></div>
             <h3 className="font-bold mb-4">¿Eliminar item?</h3>
             <div className="flex gap-2 justify-center">
                 <button onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded-xl">Cancelar</button>
                 <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold">Eliminar</button>
             </div>
        </div>
    </div>
);

const AddIngredientModal = ({ onClose, onSave }: any) => {
    const [form, setForm] = useState<any>({ name: '', type: 'BASE', quantity: 0, unit: 'g', cost: 0, minThreshold: 0 });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        StorageService.saveIngredient({ id: Date.now().toString(), ...form });
        onSave(); onClose();
    };
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-4 text-slate-800">Nuevo Insumo</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre del Insumo</label>
                    <input required placeholder="Ej: Harina de Trigo" className="w-full border border-slate-200 bg-slate-800 text-white placeholder-slate-400 p-3 rounded-xl outline-none focus:border-primary-500 transition-colors" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoría</label>
                     <select className="w-full border border-slate-200 bg-slate-800 text-white p-3 rounded-xl outline-none focus:border-primary-500 transition-colors" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                        <option value="BASE" className="bg-slate-800 text-white">Ingrediente Base</option>
                        <option value="FILLING" className="bg-slate-800 text-white">Relleno</option>
                        <option value="PACKAGING" className="bg-slate-800 text-white">Empaque</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cantidad</label>
                        <input type="number" placeholder="0" className="w-full border border-slate-200 bg-slate-800 text-white p-3 rounded-xl outline-none focus:border-primary-500" value={form.quantity} onChange={e => setForm({...form, quantity: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Unidad</label>
                        <select className="w-full border border-slate-200 bg-slate-800 text-white p-3 rounded-xl outline-none focus:border-primary-500" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                             <option value="g">g</option><option value="ml">ml</option><option value="units">units</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Costo Unitario</label>
                        <input type="number" placeholder="0.00" step="0.001" className="w-full border border-slate-200 bg-slate-800 text-white p-3 rounded-xl outline-none focus:border-primary-500" value={form.cost} onChange={e => setForm({...form, cost: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Alerta Mínima</label>
                        <input type="number" placeholder="0" className="w-full border border-slate-200 bg-slate-800 text-white p-3 rounded-xl outline-none focus:border-primary-500" value={form.minThreshold} onChange={e => setForm({...form, minThreshold: parseFloat(e.target.value)})} />
                    </div>
                </div>
                <div className="pt-2">
                    <button className="w-full bg-primary-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition">Guardar Insumo</button>
                </div>
            </form>
          </div>
        </div>
    );
};

const OCRModal = ({ onClose, onSave }: any) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const process = async () => {
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            try {
                const items = await GeminiService.parseInvoice(reader.result as string);
                items.forEach(item => {
                    const current = StorageService.getIngredients();
                    const existing = current.find(i => i.name.toLowerCase().includes(item.name.toLowerCase()));
                    if (existing) StorageService.updateStock(existing.id, item.quantity);
                    else StorageService.saveIngredient({id: Date.now().toString(), name: item.name, type: 'BASE', quantity: item.quantity, unit: item.unit, cost: item.cost, minThreshold: 100});
                });
                onSave(); onClose();
            } catch(e) { alert('Error'); } finally { setLoading(false); }
        };
    };
    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-2xl w-80 text-center">
                 <h3 className="font-bold mb-4">Escanear Factura</h3>
                 <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="mb-4 text-sm" />
                 {loading ? <p>Procesando...</p> : <button onClick={process} disabled={!file} className="bg-primary-500 text-white px-4 py-2 rounded-xl font-bold w-full">Procesar</button>}
                 <button onClick={onClose} className="mt-2 text-slate-400 text-sm">Cancelar</button>
             </div>
        </div>
    );
};