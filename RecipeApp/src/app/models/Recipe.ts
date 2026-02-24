export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  instructions: string;
  notes?: string;
  servings: number;
  prep_time: number;
  kashrut: 0 | 1 | 2;  // פרווה, חלבי, בשרי
  category: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  rating: number;
  average_rating?: number;
  user_rating?: number;
  image_url: string;
  main_image_url?: string;
  ingredients: Ingredient[];
  variations?: RecipeVariation[];
  author?: string;
  is_admin?: boolean;
  match_score?: number;  // לחיפוש לפי רכיבים
}

export interface RecipeVariation {
  effect: string;
  url: string;
}

// export interface RecipeFilters {
//   kashrut: string;
//   category: string;
//   maxTime: number;
//   minRating: number;
//   ingredients?: string[];
//   usedIngredientSearch?: boolean;
// }

export interface RecipeFilters {
  kashrut?: string;
  category?: string;
  maxTime?: number;
  minRating?: number;
  ingredients?: string[];
  usedIngredientSearch?: boolean;
}