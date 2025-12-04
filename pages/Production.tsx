
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Ingredient, MasaRecipe, MasaRecipeItem, ProductionLog } from '../types';
import { ChefHat, History, Scale, AlertCircle, CheckCircle, Plus, Trash2, Save } from 'lucide-react';

export const Production: React.FC = () => {
  const [amount, setAmount] = useState<number>(3000); // Default 3kg
  const [recipe, setRecipe] = useState<MasaRecipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  
  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setRecipe(StorageService.getMasaRecipe());
    setIngredients(StorageService.getIngredients());
    setLogs(StorageService.getProductionLogs());
  };

  if (!recipe) return <div>Cargando...</div>;

  // --- RECIPE EDITING LOGIC ---

  const handleRecipeChange = (index: number, field: keyof MasaRecipeItem, value: any) => {
    if (!recipe) return;
    const newItems = [...recipe.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const newRecipe = { ...recipe, items: newItems };
    setRecipe(newRecipe);
    StorageService.saveMasaRecipe(newRecipe); // Auto-save
  };

  const handleAddIngredient = () => {
    if (!recipe) return;
    // Default to the first base ingredient found
    const firstBase = ingredients.find(i => i.type === 'BASE')?.id || ingredients[0]?.id || '';
    
    const newItems = [...recipe.items, { ingredientId: firstBase, quantity: 10 }];
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

  // --- CALCULATION LOGIC ---
  const ratio = amount / recipe.baseAmount;
  const requirements = recipe.items.map(item => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    const required = item.quantity * ratio;
    const available = ing?.quantity || 0;
    const hasEnough = available >= required;
    
    return {
      name: ing?.name || 'Desconocido',
      required,
      available,
      unit: ing?.unit || 'g',
      hasEnough
    };
  });

  const canProduce = requirements.every(r => r.hasEnough) && requirements.length > 0;

  const handleProduce = () => {
    if (!canProduce) return;
    StorageService.produceMasa(amount);
    alert(`¡Éxito! Se han producido ${amount}g de masa.`);
    refresh();
  };

  // Filter ingredients for the dropdown (Prefer BASE, but allow others)
  const sortedIngredients = [...ingredients].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="bg-primary-500 p-3 rounded-2xl text-white shadow-lg shadow-primary-500/30">
          <ChefHat size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Producción de Masa</h2>
          <p className="text-slate-500">Fabrica el insumo base para tus deditos y empanadas</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CALCULATOR & ACTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Scale className="text-primary-500" />
              Calculadora de Producción
            </h3>

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
                  className="flex-1 text-3xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-primary-500 outline-none py-2 bg-transparent"
                 />
                 <span className="text-xl font-bold text-slate-400">gramos</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setAmount(1000)} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-200">1kg</button>
                <button onClick={() => setAmount(3000)} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-200">3kg</button>
                <button onClick={() => setAmount(5000)} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-200">5kg</button>
                <button onClick={() => setAmount(10000)} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-gray-200">10kg</button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
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
                {requirements.length === 0 && <p className="text-slate-400 text-xs italic">La receta está vacía.</p>}
              </div>
            </div>

            <button 
              onClick={handleProduce}
              disabled={!canProduce || amount <= 0}
              className="w-full py-4 bg-primary-500 text-white rounded-xl font-bold text-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 transition flex items-center justify-center gap-2"
            >
              {canProduce ? (
                <>
                  <ChefHat /> Fabricar Masa y Actualizar Inventario
                </>
              ) : (
                <>
                  <AlertCircle /> Stock Insuficiente
                </>
              )}
            </button>
          </div>
        </div>

        {/* HISTORY & RECIPE */}
        <div className="space-y-6">
           {/* Recipe Card (EDITABLE) */}
           <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col h-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full blur-3xl opacity-20 -translate-y-10 translate-x-10 pointer-events-none"></div>
              
              <div className="relative z-10 mb-4 pb-4 border-b border-slate-800">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Save size={16} className="text-primary-500"/> Fórmula Maestra</h3>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Base de cálculo:</span>
                    <input 
                        type="number"
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 w-20 text-white text-center font-bold outline-none focus:border-primary-500"
                        value={recipe.baseAmount}
                        onChange={e => handleBaseAmountChange(parseFloat(e.target.value) || 0)}
                    />
                    <span>g</span>
                </div>
              </div>
              
              <div className="relative z-10 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                {recipe.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                       {/* Ingredient Selector (Acts as Name Input) */}
                       <select 
                            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-2 outline-none focus:border-primary-500 appearance-none cursor-pointer hover:bg-slate-700 transition"
                            value={item.ingredientId}
                            onChange={(e) => handleRecipeChange(idx, 'ingredientId', e.target.value)}
                       >
                           {sortedIngredients.map(ing => (
                               <option key={ing.id} value={ing.id}>{ing.name}</option>
                           ))}
                       </select>

                       {/* Quantity Input */}
                       <div className="relative w-20">
                            <input 
                                type="number"
                                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-2 outline-none focus:border-primary-500 text-right font-mono"
                                value={item.quantity}
                                onChange={(e) => handleRecipeChange(idx, 'quantity', parseFloat(e.target.value))}
                            />
                       </div>
                       <span className="text-xs text-slate-500 font-bold w-4">g</span>

                       {/* Delete Button */}
                       <button 
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-slate-600 hover:text-red-500 transition p-1"
                       >
                           <Trash2 size={16} />
                       </button>
                    </div>
                ))}
              </div>

              <button 
                onClick={handleAddIngredient}
                className="relative z-10 mt-4 w-full py-2 border border-dashed border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-primary-400 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                  <Plus size={16} /> Agregar Ingrediente
              </button>
           </div>

           {/* History Log */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-80 overflow-y-auto">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <History size={18} className="text-slate-400" /> Historial
             </h3>
             <div className="space-y-4">
               {logs.map(log => (
                 <div key={log.id} className="border-l-2 border-primary-200 pl-4 py-1">
                   <p className="font-bold text-slate-800 text-sm">Producción: {log.amountProduced}g</p>
                   <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{new Date(log.date).toLocaleDateString()}</span>
                      <span>
                        {log.costPerGram.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 })} / g
                      </span>
                   </div>
                 </div>
               ))}
               {logs.length === 0 && <p className="text-slate-400 text-sm">No hay producciones recientes.</p>}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};
