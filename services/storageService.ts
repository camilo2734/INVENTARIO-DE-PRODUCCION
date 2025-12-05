
import { Ingredient, Product, Sale, InventoryMovement, MasaRecipe, ProductionLog, Purchase } from '../types';

/**
 * Storage Service
 * Uses LocalStorage to mimic a database.
 */

// Bumped version keys to force a fresh data load with the new structure and prices
const KEYS = {
  INGREDIENTS: 'umami_ingredients_v4_cop', 
  PRODUCTS: 'umami_products_v4_cop', 
  SALES: 'umami_sales_v2',
  MOVEMENTS: 'umami_movements_v2',
  MASA_RECIPE: 'umami_masa_recipe_v1',
  PRODUCTION_LOGS: 'umami_production_logs_v1',
  PURCHASES: 'umami_purchases_v1'
};

// --- SEED DATA: LEVEL 1 & 2 (Updated to COP prices) ---
// Precios estimados promedio 2024/2025 Colombia
const seedIngredients: Ingredient[] = [
  // LEVEL 2: Intermediate
  { id: 'masa_base', name: 'Masa (Lista para usar)', type: 'MASA', quantity: 0, unit: 'g', cost: 0, minThreshold: 2000 },

  // LEVEL 1: Base Ingredients (For making Masa)
  { id: 'harina', name: 'Harina de Trigo', type: 'BASE', quantity: 50000, unit: 'g', cost: 3.8, minThreshold: 5000 }, // $190.000 bulto 50kg aprox
  { id: 'margarina', name: 'Margarina Hojaldre', type: 'BASE', quantity: 10000, unit: 'g', cost: 22, minThreshold: 2000 }, // $11.000 libra aprox
  { id: 'aceite', name: 'Aceite Vegetal', type: 'BASE', quantity: 20000, unit: 'ml', cost: 12, minThreshold: 3000 }, // $12.000 litro
  { id: 'sal', name: 'Sal', type: 'BASE', quantity: 2000, unit: 'g', cost: 2.5, minThreshold: 500 },
  { id: 'azucar', name: 'Azúcar', type: 'BASE', quantity: 3000, unit: 'g', cost: 5, minThreshold: 500 },
  { id: 'color', name: 'Color/Achiote', type: 'BASE', quantity: 500, unit: 'g', cost: 45, minThreshold: 100 },
  { id: 'agua', name: 'Agua Filtrada', type: 'BASE', quantity: 100000, unit: 'ml', cost: 0.1, minThreshold: 1000 },

  // LEVEL 3: Fillings & Packaging
  { id: 'queso_costeno', name: 'Queso Costeño', type: 'FILLING', quantity: 10000, unit: 'g', cost: 28, minThreshold: 2000 }, // $28.000 kilo
  { id: 'queso_moz', name: 'Queso Mozzarella', type: 'FILLING', quantity: 5000, unit: 'g', cost: 32, minThreshold: 1000 },
  { id: 'pollo', name: 'Pollo Desmechado', type: 'FILLING', quantity: 5000, unit: 'g', cost: 25, minThreshold: 1000 }, // Pechuga + cocción
  { id: 'carne', name: 'Carne Molida/Desmechada', type: 'FILLING', quantity: 5000, unit: 'g', cost: 30, minThreshold: 1000 },
  { id: 'jamon', name: 'Jamón', type: 'FILLING', quantity: 2000, unit: 'g', cost: 35, minThreshold: 500 },
  { id: 'salchicha', name: 'Salchicha', type: 'FILLING', quantity: 100, unit: 'units', cost: 600, minThreshold: 20 },
  { id: 'chorizo', name: 'Chorizo', type: 'FILLING', quantity: 2000, unit: 'g', cost: 28, minThreshold: 500 },
  { id: 'butifarra', name: 'Butifarra', type: 'FILLING', quantity: 2000, unit: 'g', cost: 25, minThreshold: 500 },
  { id: 'bocadillo', name: 'Bocadillo (Guayaba)', type: 'FILLING', quantity: 3000, unit: 'g', cost: 12, minThreshold: 1000 },
  { id: 'pina', name: 'Piña Calada', type: 'FILLING', quantity: 3000, unit: 'g', cost: 15, minThreshold: 1000 },
  { id: 'maiz', name: 'Maíz Dulce', type: 'FILLING', quantity: 2000, unit: 'g', cost: 18, minThreshold: 500 },
  { id: 'espinaca', name: 'Espinaca', type: 'FILLING', quantity: 1000, unit: 'g', cost: 10, minThreshold: 200 },
  { id: 'bolsa', name: 'Bolsas Empaque', type: 'PACKAGING', quantity: 500, unit: 'units', cost: 80, minThreshold: 50 },
];

// DEFAULT MASA RECIPE (For 1000g of Masa)
const defaultMasaRecipe: MasaRecipe = {
  baseAmount: 1000,
  items: [
    { ingredientId: 'harina', quantity: 600 },
    { ingredientId: 'agua', quantity: 300 },
    { ingredientId: 'aceite', quantity: 50 },
    { ingredientId: 'margarina', quantity: 20 },
    { ingredientId: 'sal', quantity: 15 },
    { ingredientId: 'azucar', quantity: 10 },
    { ingredientId: 'color', quantity: 5 }
  ]
};

// --- SEED PRODUCTS: Using 'masa_base' instead of raw flour ---
const seedProducts: Product[] = [
  // --- DEDITOS x6 ($14.000) ---
  { id: 'd_pollo', name: 'Dedito Pollo x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'pollo', quantity: 180}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_pollo_queso', name: 'Dedito Pollo/Queso x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'pollo', quantity: 100}, {ingredientId: 'queso_costeno', quantity: 80}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_carne', name: 'Dedito Carne x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'carne', quantity: 180}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_hawaiana', name: 'Dedito Hawaiana x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'jamon', quantity: 60}, {ingredientId: 'queso_moz', quantity: 60}, {ingredientId: 'pina', quantity: 60}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_mpq', name: 'Dedito Maíz/Pollo/Queso x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'pollo', quantity: 60}, {ingredientId: 'maiz', quantity: 60}, {ingredientId: 'queso_costeno', quantity: 60}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_jamon_queso', name: 'Dedito Jamón/Queso x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'jamon', quantity: 90}, {ingredientId: 'queso_costeno', quantity: 90}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_espinaca', name: 'Dedito Espinaca x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'espinaca', quantity: 80}, {ingredientId: 'queso_costeno', quantity: 100}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_ranchera', name: 'Dedito Ranchera x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'salchicha', quantity: 3}, {ingredientId: 'maiz', quantity: 50}, {ingredientId: 'queso_costeno', quantity: 50}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_napolitana', name: 'Dedito Napolitana x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'jamon', quantity: 60}, {ingredientId: 'queso_moz', quantity: 80}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'd_salvaje', name: 'Dedito Salvaje x6', category: 'Deditos (Bandeja x6)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 240}, {ingredientId: 'chorizo', quantity: 50}, {ingredientId: 'butifarra', quantity: 50}, {ingredientId: 'maiz', quantity: 30}, {ingredientId: 'queso_costeno', quantity: 30}, {ingredientId: 'bolsa', quantity: 1}] },

  // --- EMPANADAS x18 ($14.000) ---
  { id: 'e_pollo', name: 'Empanada Pollo x18', category: 'Empanadas (Bandeja x18)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 360}, {ingredientId: 'pollo', quantity: 200}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'e_pollo_queso', name: 'Empanada Pollo/Queso x18', category: 'Empanadas (Bandeja x18)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 360}, {ingredientId: 'pollo', quantity: 100}, {ingredientId: 'queso_costeno', quantity: 100}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'e_carne', name: 'Empanada Carne x18', category: 'Empanadas (Bandeja x18)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 360}, {ingredientId: 'carne', quantity: 200}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'e_ranchera', name: 'Empanada Ranchera x18', category: 'Empanadas (Bandeja x18)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 360}, {ingredientId: 'salchicha', quantity: 4}, {ingredientId: 'maiz', quantity: 50}, {ingredientId: 'queso_costeno', quantity: 50}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'e_jamon_queso', name: 'Empanada Jamón/Queso x18', category: 'Empanadas (Bandeja x18)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 360}, {ingredientId: 'jamon', quantity: 100}, {ingredientId: 'queso_costeno', quantity: 100}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'e_hawaiana', name: 'Empanada Hawaiana x18', category: 'Empanadas (Bandeja x18)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 360}, {ingredientId: 'jamon', quantity: 60}, {ingredientId: 'pina', quantity: 60}, {ingredientId: 'queso_moz', quantity: 60}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'e_bocadillo', name: 'Empanada Bocadillo/Queso x18', category: 'Empanadas (Bandeja x18)', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 360}, {ingredientId: 'bocadillo', quantity: 100}, {ingredientId: 'queso_costeno', quantity: 100}, {ingredientId: 'bolsa', quantity: 1}] },

  // --- OTROS ---
  { id: 'medallones', name: 'Medallones Salchicha x25', category: 'Otros', price: 10000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 200}, {ingredientId: 'salchicha', quantity: 10}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'bolitas', name: 'Bolitas Carne Pequeñas x20', category: 'Otros', price: 10000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 180}, {ingredientId: 'carne', quantity: 150}, {ingredientId: 'bolsa', quantity: 1}] },

  // --- PERSONALES ---
  { id: 'p_dedito_q8_25', name: 'Dedito Queso x8 (25g)', category: 'Personales', price: 13000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 100}, {ingredientId: 'queso_costeno', quantity: 200}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'p_dedito_q8_40', name: 'Dedito Queso x8 (40g)', category: 'Personales', price: 16000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 160}, {ingredientId: 'queso_costeno', quantity: 320}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'p_cazador', name: 'Dedito Cazador x7', category: 'Personales', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 175}, {ingredientId: 'salchicha', quantity: 7}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'p_jamon', name: 'Dedito Jamón x7', category: 'Personales', price: 15000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 175}, {ingredientId: 'jamon', quantity: 150}, {ingredientId: 'bolsa', quantity: 1}] },
  { id: 'p_bocadillo', name: 'Dedito Bocadillo x7', category: 'Personales', price: 14000, stock: 0, recipe: [{ingredientId: 'masa_base', quantity: 175}, {ingredientId: 'bocadillo', quantity: 150}, {ingredientId: 'bolsa', quantity: 1}] },
];

export const StorageService = {
  init: () => {
    if (!localStorage.getItem(KEYS.INGREDIENTS)) {
      localStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(seedIngredients));
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(seedProducts));
    }
    if (!localStorage.getItem(KEYS.MASA_RECIPE)) {
      localStorage.setItem(KEYS.MASA_RECIPE, JSON.stringify(defaultMasaRecipe));
    }
    if (!localStorage.getItem(KEYS.SALES)) {
      localStorage.setItem(KEYS.SALES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.MOVEMENTS)) {
      localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.PURCHASES)) {
      localStorage.setItem(KEYS.PURCHASES, JSON.stringify([]));
    }
  },

  // Ingredients
  getIngredients: (): Ingredient[] => {
    try {
      const raw = localStorage.getItem(KEYS.INGREDIENTS);
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];

      // --- AUTO-CALCULAR COSTO DE MASA BASE ---
      const masaIndex = list.findIndex((i: Ingredient) => i.id === 'masa_base');
      
      const recipeRaw = localStorage.getItem(KEYS.MASA_RECIPE);
      let recipe = defaultMasaRecipe;
      if (recipeRaw) {
          try { recipe = JSON.parse(recipeRaw); } catch(e) { console.error("Error parsing recipe", e); }
      }

      if (masaIndex >= 0 && recipe && recipe.baseAmount > 0) {
          let totalBatchCost = 0;
          recipe.items.forEach((item: any) => {
              const rawIng = list.find((i: Ingredient) => i.id === item.ingredientId);
              if (rawIng && typeof rawIng.cost === 'number') {
                  totalBatchCost += (rawIng.cost * item.quantity);
              }
          });

          const calculatedCost = totalBatchCost / recipe.baseAmount;
          
          // Safety: Update only if finite and different
          if (Number.isFinite(calculatedCost)) {
              const currentCost = list[masaIndex].cost || 0;
              // Update local variable for return
              list[masaIndex].cost = calculatedCost;
              
              // Only save back if the difference is significant AND it wasn't zero (to avoid loops if logic fails, 
              // though here we want to ensure cache is hot)
              // Actually, we just return the calculated list. We save back only if necessary.
              if (Math.abs(currentCost - calculatedCost) > 0.0001) {
                  localStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(list));
              }
          }
      }
      return list;
    } catch (e) {
      console.error("Critical error in getIngredients:", e);
      return [];
    }
  },
  saveIngredient: (ingredient: Ingredient) => {
    // FIX 1: Force masa_base cost to 0 so it always recalculates dynamically on get()
    if (ingredient.id === 'masa_base') {
        ingredient.cost = 0;
    }

    const list = StorageService.getIngredients();
    const index = list.findIndex(i => i.id === ingredient.id);
    if (index >= 0) list[index] = ingredient;
    else list.push(ingredient);
    localStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(list));
  },
  updateStock: (id: string, delta: number) => {
    const list = StorageService.getIngredients();
    const item = list.find(i => i.id === id);
    if (item) {
      item.quantity += delta;
      localStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(list));
    }
  },
  deleteIngredient: (id: string) => {
    const list = StorageService.getIngredients();
    const newList = list.filter(i => i.id !== id);
    localStorage.setItem(KEYS.INGREDIENTS, JSON.stringify(newList));
  },

  // Products
  getProducts: (): Product[] => {
    try {
        const raw = localStorage.getItem(KEYS.PRODUCTS);
        if (!raw) return [];
        const products = JSON.parse(raw);
        if (!Array.isArray(products)) return [];
        return products.map((p: Product) => ({...p, stock: p.stock ?? 0}));
    } catch { return []; }
  },
  saveProduct: (product: Product) => {
    const list = StorageService.getProducts();
    const index = list.findIndex(p => p.id === product.id);
    if (index >= 0) list[index] = product;
    else list.push(product);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
  },
  updateProductStock: (productId: string, newStock: number) => {
    const list = StorageService.getProducts();
    const item = list.find(p => p.id === productId);
    if (item) {
      item.stock = Math.max(0, newStock);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
    }
  },

  // Sales
  addSale: (sale: Sale) => {
    const sales = JSON.parse(localStorage.getItem(KEYS.SALES) || '[]');
    sales.push(sale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));

    const products = StorageService.getProducts();
    const product = products.find(p => p.id === sale.productId);
    
    if (product) {
      StorageService.updateProductStock(product.id, product.stock - sale.quantity);
    }
  },
  
  getSales: (): Sale[] => {
    return JSON.parse(localStorage.getItem(KEYS.SALES) || '[]');
  },

  deleteSale: (saleId: string) => {
    const sales = StorageService.getSales();
    const saleIndex = sales.findIndex(s => s.id === saleId);
    
    if (saleIndex === -1) return;

    const sale = sales[saleIndex];
    const products = StorageService.getProducts();
    const product = products.find(p => p.id === sale.productId);

    if (product) {
        StorageService.updateProductStock(product.id, product.stock + sale.quantity);
    }
    sales.splice(saleIndex, 1);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  },

  // Movements
  logMovement: (movement: InventoryMovement) => {
    const list = JSON.parse(localStorage.getItem(KEYS.MOVEMENTS) || '[]');
    list.push(movement);
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(list));
  },
  getMovements: (): InventoryMovement[] => {
    return JSON.parse(localStorage.getItem(KEYS.MOVEMENTS) || '[]');
  },

  // Purchases
  getPurchases: (): Purchase[] => {
    return JSON.parse(localStorage.getItem(KEYS.PURCHASES) || '[]');
  },
  
  savePurchase: (purchase: Purchase) => {
    const list = StorageService.getPurchases();
    list.push(purchase);
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(list));

    // Update Ingredient Stock and Weighted Average Cost
    const ingredients = StorageService.getIngredients();
    const ing = ingredients.find(i => i.id === purchase.ingredientId);
    
    if (ing) {
        const currentTotalValue = ing.quantity * (ing.cost || 0);
        const newTotalQty = ing.quantity + purchase.quantity;
        
        let newCost = ing.cost;
        if (newTotalQty > 0) {
            newCost = (currentTotalValue + purchase.totalCost) / newTotalQty;
        } else if (purchase.quantity > 0) {
             newCost = purchase.totalCost / purchase.quantity;
        }

        ing.quantity = newTotalQty;
        ing.cost = newCost;
        StorageService.saveIngredient(ing);

        StorageService.logMovement({
            id: Date.now().toString() + Math.random(),
            date: purchase.date,
            type: 'IN',
            ingredientId: ing.id,
            quantity: purchase.quantity,
            description: `Compra: ${purchase.quantity}${purchase.unit}`
        });
    }
  },

  deletePurchase: (id: string) => {
      const list = StorageService.getPurchases();
      const newList = list.filter(p => p.id !== id);
      localStorage.setItem(KEYS.PURCHASES, JSON.stringify(newList));
  },

  // --- MASA PRODUCTION LOGIC ---
  
  getMasaRecipe: (): MasaRecipe => {
    return JSON.parse(localStorage.getItem(KEYS.MASA_RECIPE) || JSON.stringify(defaultMasaRecipe));
  },

  saveMasaRecipe: (recipe: MasaRecipe) => {
    localStorage.setItem(KEYS.MASA_RECIPE, JSON.stringify(recipe));
  },

  getProductionLogs: (): ProductionLog[] => {
    return JSON.parse(localStorage.getItem(KEYS.PRODUCTION_LOGS) || '[]');
  },

  clearProductionLogs: () => {
    localStorage.setItem(KEYS.PRODUCTION_LOGS, JSON.stringify([]));
  },

  produceMasa: (amountToProduce: number) => {
    const recipe = StorageService.getMasaRecipe();
    const ingredients = StorageService.getIngredients();
    const ratio = amountToProduce / recipe.baseAmount;

    let totalCostOfIngredients = 0;

    recipe.items.forEach(item => {
      const requiredAmount = item.quantity * ratio;
      const ing = ingredients.find(i => i.id === item.ingredientId);
      
      if (ing) {
        totalCostOfIngredients += ((ing.cost || 0) * requiredAmount);
        StorageService.updateStock(ing.id, -requiredAmount);
        
        StorageService.logMovement({
            id: Date.now().toString() + Math.random(),
            date: new Date().toISOString(),
            type: 'PRODUCTION',
            ingredientId: ing.id,
            quantity: requiredAmount,
            description: `Producción Masa: ${amountToProduce}g`
        });
      }
    });

    const masaIng = ingredients.find(i => i.id === 'masa_base');
    if (masaIng) {
        const currentTotalValue = masaIng.quantity * (masaIng.cost || 0);
        const newBatchValue = totalCostOfIngredients;
        const newTotalQuantity = masaIng.quantity + amountToProduce;
        
        let newCost = masaIng.cost;
        if (newTotalQuantity > 0) {
            newCost = (currentTotalValue + newBatchValue) / newTotalQuantity;
        } else if (amountToProduce > 0) {
            newCost = newBatchValue / amountToProduce;
        }

        masaIng.quantity = newTotalQuantity;
        masaIng.cost = newCost;
        StorageService.saveIngredient(masaIng);

        StorageService.logMovement({
            id: Date.now().toString() + Math.random(),
            date: new Date().toISOString(),
            type: 'PRODUCTION',
            ingredientId: 'masa_base',
            quantity: amountToProduce,
            description: 'Producción Finalizada'
        });
    }

    const logs = StorageService.getProductionLogs();
    logs.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amountProduced: amountToProduce,
        costPerGram: amountToProduce > 0 ? totalCostOfIngredients / amountToProduce : 0
    });
    localStorage.setItem(KEYS.PRODUCTION_LOGS, JSON.stringify(logs));
  },

  manufactureProduct: (productId: string, quantityToMake: number) => {
      const product = StorageService.getProducts().find(p => p.id === productId);
      if (!product) return;

      const ingredients = StorageService.getIngredients();
      const masaRecipe = StorageService.getMasaRecipe();
      let consumedDetails: string[] = [];

      product.recipe.forEach(item => {
          if (item.ingredientId === 'masa_base') {
              const totalMasaNeeded = item.quantity * quantityToMake;
              const masaStock = ingredients.find(i => i.id === 'masa_base');
              
              if (masaStock) {
                  if (masaStock.quantity >= totalMasaNeeded) {
                      StorageService.updateStock('masa_base', -totalMasaNeeded);
                      consumedDetails.push(`${totalMasaNeeded}g Masa (Stock)`);
                  } else {
                      const available = masaStock.quantity;
                      const deficit = totalMasaNeeded - available;

                      if (available > 0) {
                         StorageService.updateStock('masa_base', -available);
                      }

                      const ratio = deficit / masaRecipe.baseAmount;
                      masaRecipe.items.forEach(raw => {
                          const neededRaw = raw.quantity * ratio;
                          StorageService.updateStock(raw.ingredientId, -neededRaw);
                      });

                      consumedDetails.push(`${available.toFixed(0)}g Masa (Stock) + ${deficit.toFixed(0)}g Masa (Producida al instante)`);
                  }
              }
          } else {
              const totalNeeded = item.quantity * quantityToMake;
              StorageService.updateStock(item.ingredientId, -totalNeeded);
              const ingName = ingredients.find(i => i.id === item.ingredientId)?.name || item.ingredientId;
              consumedDetails.push(`${totalNeeded} ${ingName}`);
          }
      });

      StorageService.updateProductStock(productId, product.stock + quantityToMake);

      StorageService.logMovement({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: 'PRODUCTION',
          ingredientId: 'PRODUCT_MANUFACTURE',
          quantity: quantityToMake,
          description: `Fabricación: ${quantityToMake}x ${product.name}. Usado: ${consumedDetails.join(', ')}`
      });
  }
};