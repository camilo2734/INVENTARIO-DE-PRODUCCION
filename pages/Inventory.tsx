
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Ingredient, Product, InvoiceItem, IngredientType } from '../types';
import { Plus, Camera, Check, X, Edit2, Trash2, AlertTriangle, Package, ChefHat, Wheat, Layers, PackageCheck, Minus } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit/Delete State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    setIngredients(StorageService.getIngredients());
    setProducts(StorageService.getProducts());
  }, [refreshKey]);

  const refresh = () => setRefreshKey(prev => prev + 1);

  // --- ACTIONS ---
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
    const updatedProducts = products.map(p => p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p);
    setProducts(updatedProducts);
    StorageService.updateProductStock(productId, newStock);
  };

  // --- SECTIONS ---
  const masaIngredients = ingredients.filter(i => i.type === 'MASA');
  const baseIngredients = ingredients.filter(i => i.type === 'BASE');
  const fillingIngredients = ingredients.filter(i => ['FILLING', 'PACKAGING'].includes(i.type));

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
                return (
                  <tr key={ing.id} className={`transition group ${isEditing ? 'bg-orange-50' : 'hover:bg-primary-50'}`}>
                    <td className="p-4 font-bold text-slate-800">{ing.name}
                        {ing.quantity <= ing.minThreshold && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">Bajo</span>}
                    </td>
                    <td className="p-4 font-mono font-medium">
                        {isEditing ? (
                            <input type="number" min="0" className="w-24 border border-orange-300 rounded px-2 py-1 outline-none bg-white"
                                value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: parseFloat(e.target.value)})} />
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
                         {isEditing ? (
                            <input type="number" min="0" step="0.001" className="w-24 border border-orange-300 rounded px-2 py-1 outline-none bg-white"
                                value={editForm.cost} onChange={e => setEditForm({...editForm, cost: parseFloat(e.target.value)})} />
                        ) : ing.cost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
    <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Inventario General</h2>
            <p className="text-slate-500">Gestión de materia prima y producto terminado</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowOCRModal(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition font-medium"><Camera size={20} /> Escanear Factura</button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl hover:bg-primary-600 transition font-medium"><Plus size={20} /> Manual</button>
          </div>
        </div>

        {/* SECTION 1: MASA (The most important) */}
        <div className="bg-orange-50 p-1 rounded-3xl border border-orange-100">
            <IngredientTable title="Masa & Producción Intermedia" icon={ChefHat} items={masaIngredients} colorClass="bg-orange-500 text-white" />
        </div>

        {/* SECTION 2: BASE INGREDIENTS */}
        <IngredientTable title="Ingredientes Base (Materia Prima)" icon={Wheat} items={baseIngredients} colorClass="bg-yellow-500 text-white" />

        {/* SECTION 3: FILLINGS & PACKAGING */}
        <IngredientTable title="Rellenos, Cárnicos y Empaque" icon={Layers} items={fillingIngredients} colorClass="bg-blue-500 text-white" />

        <hr className="border-gray-200" />

        {/* SECTION 4: FINISHED PRODUCTS */}
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

      {showAddModal && <AddIngredientModal onClose={() => setShowAddModal(false)} onSave={refresh} />}
      {showOCRModal && <OCRModal onClose={() => setShowOCRModal(false)} onSave={refresh} />}
      {deleteConfirmationId && <DeleteConfirm id={deleteConfirmationId} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmationId(null)} />}
    </div>
  );
};

// --- Subcomponents (Kept minimal for brevity) ---
const DeleteConfirm = ({id, onConfirm, onCancel}: any) => (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50">
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
    // Simplified version of the previous modal, added 'type' selector
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
                        <option value="BASE" className="bg-slate-800 text-white">Ingrediente Base (Harina, Sal...)</option>
                        <option value="FILLING" className="bg-slate-800 text-white">Relleno (Queso, Carne...)</option>
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
    // Reusing the logic, simplified UI for xml brevity
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
                    // Logic to add/merge
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
