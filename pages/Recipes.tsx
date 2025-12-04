
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, Ingredient, RecipeItem } from '../types';
import { Edit2, Save, Trash, Plus, Tag } from 'lucide-react';

export const Recipes: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit State
  const [tempProduct, setTempProduct] = useState<Product | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setProducts(StorageService.getProducts());
    setIngredients(StorageService.getIngredients());
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setTempProduct({ ...product, recipe: [...product.recipe] });
  };

  const saveEdit = () => {
    if (tempProduct) {
      StorageService.saveProduct(tempProduct);
      setEditingId(null);
      setTempProduct(null);
      refresh();
    }
  };

  const updateRecipeItem = (idx: number, field: keyof RecipeItem, value: any) => {
    if (!tempProduct) return;
    const newRecipe = [...tempProduct.recipe];
    newRecipe[idx] = { ...newRecipe[idx], [field]: value };
    setTempProduct({ ...tempProduct, recipe: newRecipe });
  };

  const addRecipeItem = () => {
    if (!tempProduct || ingredients.length === 0) return;
    setTempProduct({
      ...tempProduct,
      recipe: [...tempProduct.recipe, { ingredientId: ingredients[0].id, quantity: 10 }]
    });
  };

  const removeRecipeItem = (idx: number) => {
    if (!tempProduct) return;
    const newRecipe = tempProduct.recipe.filter((_, i) => i !== idx);
    setTempProduct({ ...tempProduct, recipe: newRecipe });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Catálogo y Recetas</h2>
           <p className="text-slate-500">Administra tus productos, precios e ingredientes</p>
        </div>
        <button 
            onClick={() => {
                const newP: Product = { id: Date.now().toString(), name: 'Nuevo Producto', category: 'Otros', price: 0, stock: 0, recipe: [] };
                StorageService.saveProduct(newP);
                refresh();
                startEdit(newP);
            }}
            className="bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-primary-600 transition shadow-lg shadow-slate-900/20 font-medium"
        >
            <Plus size={20} /> Crear Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => {
          const isEditing = editingId === product.id;
          const displayProduct = isEditing && tempProduct ? tempProduct : product;

          return (
            <div key={product.id} className={`bg-white rounded-2xl shadow-sm border ${isEditing ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100'} overflow-hidden transition-all group hover:shadow-md`}>
              
              {/* Header: Dark Background with Orange Accents */}
              <div className="bg-slate-900 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500 rounded-full blur-2xl opacity-10 -translate-y-10 translate-x-10"></div>
                  
                  {isEditing ? (
                    <div className="space-y-4 relative z-10">
                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Nombre</label>
                        <input 
                          className="w-full text-lg font-bold bg-transparent border-b border-slate-600 text-white focus:border-primary-500 outline-none pb-1 placeholder-slate-500"
                          value={displayProduct.name}
                          onChange={e => setTempProduct({...displayProduct, name: e.target.value})}
                          placeholder="Nombre del producto"
                        />
                      </div>
                      
                      <div>
                         <label className="text-xs text-slate-400 uppercase font-bold">Categoría</label>
                         <input 
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm focus:border-primary-500 outline-none mt-1"
                          value={displayProduct.category}
                          onChange={e => setTempProduct({...displayProduct, category: e.target.value})}
                          placeholder="Ej: Deditos, Empanadas..."
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-primary-500 font-bold">$</span>
                        <input 
                          type="number"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:border-primary-500 outline-none font-bold"
                          value={displayProduct.price}
                          onChange={e => setTempProduct({...displayProduct, price: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="inline-flex items-center gap-1 bg-slate-800 text-primary-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-2 border border-slate-700">
                            <Tag size={10} /> {product.category || 'General'}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 leading-tight">{product.name}</h3>
                        <p className="text-white font-medium text-xl mt-2">
                            {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <button onClick={() => startEdit(product)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  )}
              </div>

              {/* Body: Contains Ingredients List */}
              <div className="p-6">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        Receta / Insumos
                    </p>
                    <ul className="space-y-2 text-sm">
                      {displayProduct.recipe.map((item, idx) => {
                        const ingName = ingredients.find(i => i.id === item.ingredientId)?.name || 'Desconocido';
                        const ingUnit = ingredients.find(i => i.id === item.ingredientId)?.unit || '';

                        if (isEditing) {
                          return (
                              <li key={idx} className="flex gap-2 items-center bg-white p-1 rounded border border-gray-200">
                                  <select 
                                    className="flex-1 text-xs bg-white text-slate-800 border-none outline-none font-medium"
                                    value={item.ingredientId}
                                    onChange={(e) => updateRecipeItem(idx, 'ingredientId', e.target.value)}
                                  >
                                      {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                  </select>
                                  <input 
                                    type="number" 
                                    className="w-14 text-xs bg-gray-50 text-slate-800 border rounded p-1 text-center font-bold outline-none focus:ring-1 focus:ring-primary-500"
                                    value={item.quantity}
                                    onChange={(e) => updateRecipeItem(idx, 'quantity', parseFloat(e.target.value))}
                                  />
                                  <span className="text-xs text-slate-400 w-8">{ingUnit}</span>
                                  <button onClick={() => removeRecipeItem(idx)} className="text-red-400 hover:text-red-600 px-1"><Trash size={14}/></button>
                              </li>
                          )
                        }

                        return (
                          <li key={idx} className="flex justify-between items-center text-slate-700">
                            <span className="truncate pr-2">{ingName}</span>
                            <span className="font-bold text-slate-900 whitespace-nowrap">{item.quantity} <span className="text-slate-400 font-normal text-xs">{ingUnit}</span></span>
                          </li>
                        );
                      })}
                      {displayProduct.recipe.length === 0 && !isEditing && (
                          <li className="text-slate-400 italic text-xs py-2 text-center">Sin ingredientes definidos</li>
                      )}
                    </ul>
                    {isEditing && (
                        <button onClick={addRecipeItem} className="mt-4 w-full py-2 text-xs text-center border border-dashed border-primary-300 text-primary-600 rounded hover:bg-primary-50 transition font-medium">
                            + Agregar Ingrediente
                        </button>
                    )}
                  </div>

                  {isEditing && (
                      <div className="mt-6 flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800">Cancelar</button>
                          <button onClick={saveEdit} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-primary-600 shadow-md font-bold">
                              <Save size={16} /> Guardar Cambios
                          </button>
                      </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
