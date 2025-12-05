
export type IngredientType = 'BASE' | 'MASA' | 'FILLING' | 'PACKAGING';

export interface Ingredient {
  id: string;
  name: string;
  type: IngredientType; // 'BASE' | 'MASA' | 'FILLING' | 'PACKAGING'
  quantity: number;
  unit: string; // kg, g, l, units
  cost: number; // cost per unit
  minThreshold: number; // alert when below this
}

export interface Purchase {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  totalCost: number;
  notes?: string;
  timestamp: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number; // Amount needed for 1 product
}

export interface Product {
  id: string;
  name: string;
  category: string; 
  price: number;
  stock: number; 
  recipe: RecipeItem[];
}

export interface Sale {
  id: string;
  date: string;
  timestamp: number;
  productId: string;
  quantity: number;
  total: number;
}

export interface InventoryMovement {
  id: string;
  date: string;
  type: 'IN' | 'OUT' | 'PRODUCTION';
  ingredientId: string;
  quantity: number;
  description: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

// NEW: Structure for the Standard Masa Recipe (e.g., for 1kg of Dough)
export interface MasaRecipeItem {
  ingredientId: string;
  quantity: number; 
  unit?: string; // Ahora permite guardar la unidad específica para esta receta
}

export interface MasaRecipe {
  baseAmount: number; // e.g., 1000g
  items: MasaRecipeItem[];
}

export interface ProductionLog {
  id: string;
  date: string;
  amountProduced: number; // in grams
  costPerGram: number;
}

export interface Alert {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  daysRemaining: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}
