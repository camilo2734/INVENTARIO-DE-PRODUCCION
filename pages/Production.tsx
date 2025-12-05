
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Ingredient, MasaRecipe, MasaRecipeItem, ProductionLog, Product } from '../types';
import { ChefHat, History, Scale, AlertCircle, CheckCircle, Plus, Trash2, Save, PackageCheck, ArrowRight, Box } from 'lucide-react';

export const Production: React.FC = () => {
  const [amount, setAmount] = useState<number>(3000); // Default 3kg for Masa Calculator
  const [recipe, setRecipe] = useState<MasaRecipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  
  // Manufacture State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manufactureQty, setManufactureQty] = useState(1);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setRecipe(StorageService.getMasaRecipe());
    setIngredients(StorageService.getIngredients());
    setProducts(StorageService.getProducts());
    setLogs(StorageService.getProductionLogs());
  };

  if (!recipe) return <div>Cargando...</div>;

  // --- MASA CALCULATOR LOGIC ---
  const handleRecipeChange = (index: number, field: keyof MasaRecipeItem, value: any) => {
    if (!recipe) return;
    const newItems = [...recipe.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const newRecipe = { ...recipe, items: newItems };
    setRecipe(newRecipe);
    StorageService.saveMasaRecipe(newRecipe);
  };

  const handleAddIngredient = () => {
    if (!recipe) return;
    const firstBase = ingredients.find(i => i.type === 'BASE')?.id || ingredients[0]?.id || '';
    const newItems = [...recipe.items, { ingredientId: firstBase, quantity: 10, unit: 'g' }];
    const newRecipe = { ...recipe, items: newItems };
    setRecipe(newRecipe);
    StorageService.saveMasaRecipe(newRecipe);
  };

  const handleRemoveIngredient = (index: number) => {
    if (!recipe) return;
    const newItems = recipe.items.filter((_, i) => i !== index);
    const newRecipe = { ...recipe, items: newItems };
    setRecipe(newRecipe);
    StorageService.saveMasaRecipe(newRecipe);
  };

  const handleBaseAmountChange = (val: number) => {
     if (!recipe) return;
     const newRecipe = { ...recipe, baseAmount: val };
     setRecipe(newRecipe);
     StorageService.saveMasaRecipe(newRecipe);
  };

  const ratio = amount / recipe.baseAmount;
  const requirements = recipe.items.map(item => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    const required = item.quantity * ratio;
    const available = ing?.quantity || 0;
    const hasEnough = available >= required;
    return { name: ing?.name || 'Desconocido', required, available, unit: item.unit || ing?.unit || 'g', hasEnough };
  });

  const canProduce = requirements.every(r => r.hasEnough) && requirements.length > 0;

  const handleProduceMasa = () => {
    if (!canProduce) return;
    StorageService.produceMasa(amount);
    alert(`¡Éxito! Se han producido ${amount}g de masa.`);
    refresh();
  };

  const handleClearLogs = () => {
      if (window.confirm('¿Seguro que deseas borrar todo el historial de producción de masa? Esta acción no se puede deshacer, pero el stock actual se mantendrá.')) {
          StorageService.clearProductionLogs();
          refresh();
      }
  };

  // --- MANUFACTURE LOGIC ---
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const manufactureRequirements = selectedProduct ? selectedProduct.recipe.map(item => {
      const needed = item.quantity * manufactureQty;
      const ing = ingredients.find(i => i.id === item.ingredientId);
      const stock = ing?.quantity || 0;
      // Special logic for masa: if stock is low, we auto-produce from raw, so it's "Available" effectively
      const isMasa = item.ingredientId === 'masa_base';
      const available = isMasa ? 999999 : stock; 
      
      return {
          name: ing?.name || item.ingredientId,
          needed,
          stock: ing?.quantity || 0,
          unit: ing?.unit || '',
          isMasa
      };
  }) : [];

  const handleManufacture = () => {
      if (!selectedProductId || manufactureQty <= 0) return;
      StorageService.manufactureProduct(selectedProductId, manufactureQty);
      alert(`Fabricados ${manufactureQty} ${selectedProduct?.name}. Inventario descontado.`);
      setManufactureQty(1);
      refresh();
  };

  const sortedIngredients = [...ingredients].sort((a,b) => a.name.localeCompare(b.name));
  const groupedProducts = products.reduce((acc, p) => {
      const c = p.category || 'Otros';
      if (!acc[c]) acc[c] = [];
      acc[c].push(p);
      return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex items-center gap-3 border-b border-gray-200 pb-6">
        <div className="bg-primary-500 p-3 rounded-2xl text-white shadow-lg shadow-primary-500/30">
          <ChefHat size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Centro de Producción</h2>
          <p className="text-slate-500">Fabrica Masa y Productos Terminados</p>
        </div>
      </header>

      {/* SECTION 1: MANUFACTURE PRODUCTS (Consumes Masa) */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-primary-500 p-2 rounded-lg text-white"><PackageCheck size={24} /></div>
                 <div>
                     <h3 className="text-xl font-bold text-white">Registrar Producto Terminado</h3>
                     <p className="text-slate-400 text-sm">Convierte masa e ingredientes en producto listo para venta</p>
                 </div>
              </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Producto a Fabricar</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedProductId}
                        onChange={e => setSelectedProductId(e.target.value)}
                      >
                          <option value="">Selecciona un producto...</option>
                          {Object.entries(groupedProducts).map(([cat, items]) => (
                              <optgroup label={cat} key={cat}>
                                  {items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </optgroup>
                          ))}
                      </select>
                  </div>

                  {selectedProduct && (
                      <div>
                        <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Cantidad (Unidades/Bandejas)</label>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setManufactureQty(Math.max(1, manufactureQty - 1))} className="w-12 h-12 bg-gray-100 rounded-xl font-bold text-xl hover:bg-gray-200">-</button>
                            <input 
                                type="number" 
                                min="1"
                                className="flex-1 text-center bg-white border border-slate-200 rounded-xl p-3 font-bold text-2xl outline-none"
                                value={manufactureQty}
                                onChange={e => setManufactureQty(parseInt(e.target.value) || 1)}
                            />
                            <button onClick={() => setManufactureQty(manufactureQty + 1)} className="w-12 h-12 bg-gray-100 rounded-xl font-bold text-xl hover:bg-gray-200">+</button>
                        </div>
                      </div>
                  )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative">
                  {selectedProduct ? (
                      <>
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Scale size={18} /> Resumen de Consumo</h4>
                        <div className="space-y-3 mb-6">
                            {manufactureRequirements.map((req, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-600">{req.name}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-slate-800">-{req.needed} {req.unit}</span>
                                        {req.isMasa && req.needed > req.stock && (
                                            <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1 rounded">
                                                (Stock: {req.stock}) → Auto-descontará ingredientes base
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                             <div className="text-sm text-slate-500">Stock Actual: <span className="font-bold">{selectedProduct.stock}</span></div>
                             <ArrowRight className="text-slate-300" />
                             <div className="text-sm text-primary-600">Nuevo Stock: <span className="font-bold text-lg">{selectedProduct.stock + manufactureQty}</span></div>
                        </div>
                        <button 
                            onClick={handleManufacture}
                            className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                        >
                            <Box size={20} /> Fabricar y Guardar
                        </button>
                      </>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <PackageCheck size={48} className="mb-2 opacity-20" />
                          <p>Selecciona un producto para calcular</p>
                      </div>
                  )}
              </div>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 2: MASA CALCULATOR (Pre-production) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Scale className="text-orange-500" />
              Calculadora de Masa (Pre-producción)
            </h3>
            <p className="text-sm text-slate-500 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
                Usa esta sección si quieres preparar masa y guardarla en la nevera para usar después. 
                Si vas a fabricar productos inmediatamente, usa la sección de arriba.
            </p>

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                ¿Cuánta masa vas a fabricar?
              </label>
              <div className="flex gap-4 items-center">
                 <input 
                  type="number"
                  min="0"
                  step="100"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 text-3xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-orange-500 outline-none py-2 bg-transparent"
                 />
                 <span className="text-xl font-bold text-slate-400">gramos</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setAmount(3000)} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-200">3kg</button>
                <button onClick={() => setAmount(5000)} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-200">5kg</button>
                <button onClick={() => setAmount(10000)} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-200">10kg</button>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 mb-6">
              <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">Ingredientes Requeridos</h4>
              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">{req.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-800">{req.required.toFixed(1)} {req.unit}</span>
                      {req.hasEnough ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                           <AlertCircle size={16} />
                           <span>Faltan {(req.required - req.available).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleProduceMasa}
              disabled={!canProduce || amount <= 0}
              className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
            >
              {canProduce ? (
                <>
                  <Plus size={20} /> Crear Stock de Masa
                </>
              ) : (
                <>
                  <AlertCircle /> Faltan Ingredientes Base
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION 3: CONFIG & HISTORY */}
        <div className="space-y-6">
           {/* Recipe Config */}
           <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col h-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-20 -translate-y-10 translate-x-10 pointer-events-none"></div>
              
              <div className="relative z-10 mb-4 pb-4 border-b border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-2"><Save size={16} className="text-orange-500"/> Config. Fórmula Masa</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Base de cálculo:</span>
                    <input 
                        type="number"
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 w-20 text-white text-center font-bold outline-none focus:border-orange-500"
                        value={recipe.baseAmount}
                        onChange={e => handleBaseAmountChange(parseFloat(e.target.value) || 0)}
                    />
                    <span>g</span>
                </div>
              </div>
              
              <div className="relative z-10 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                {recipe.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                       <select 
                            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-2 outline-none focus:border-orange-500 appearance-none"
                            value={item.ingredientId}
                            onChange={(e) => handleRecipeChange(idx, 'ingredientId', e.target.value)}
                       >
                           {sortedIngredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                       </select>
                       <div className="relative w-16">
                            <input 
                                type="number"
                                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-2 text-right"
                                value={item.quantity}
                                onChange={(e) => handleRecipeChange(idx, 'quantity', parseFloat(e.target.value))}
                            />
                       </div>
                       <button onClick={() => handleRemoveIngredient(idx)} className="text-slate-600 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                    </div>
                ))}
              </div>

              <button 
                onClick={handleAddIngredient}
                className="relative z-10 mt-4 w-full py-2 border border-dashed border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-orange-400 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                  <Plus size={16} /> Agregar Ingrediente
              </button>
           </div>

           {/* History Log */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-80 flex flex-col">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <History size={18} className="text-slate-400" /> Historial Masa
                 </h3>
                 {logs.length > 0 && (
                     <button onClick={handleClearLogs} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded">
                         <Trash2 size={12} /> Borrar Todo
                     </button>
                 )}
             </div>
             
             <div className="space-y-4 overflow-y-auto flex-1 pr-2">
               {logs.map(log => (
                 <div key={log.id} className="border-l-2 border-orange-200 pl-4 py-1">
                   <p className="font-bold text-slate-800 text-sm">Producción: {log.amountProduced}g</p>
                   <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{new Date(log.date).toLocaleDateString()}</span>
                      <span>{log.costPerGram.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 1 })}/g</span>
                   </div>
                 </div>
               ))}
               {logs.length === 0 && <div className="h-full flex items-center justify-center text-slate-300 text-sm italic">Sin historial</div>}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};
