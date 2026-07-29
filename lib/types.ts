// Tipos que reflejan nuestro schema de Supabase

export type GLP1Med = 'ozempic' | 'wegovy' | 'mounjaro' | 'saxenda' | 'none';

export type MealType = 'desayuno' | 'almuerzo' | 'snack' | 'cena';

export interface Profile {
  id: string;
  name: string;
  sex: 'F' | 'M' | null;
  age: number | null;
  height_cm: number | null;
  current_weight: number | null;
  target_weight: number | null;
  glp1_med: GLP1Med | null;
  glp1_dose: string | null;
  onboarding_done: boolean;
  plan_type: 'free' | 'pro';
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  kcal: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  cook_minutes: number | null;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  glp1_notes: string | null;
  tone: string;
  image_url: string | null;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  logged_at: string;
  note: string | null;
}

export interface PlannedMeal {
  id: string;
  plan_id: string;
  recipe_id: string | null;
  day_of_week: number;
  meal_type: MealType;
  scheduled_time: string | null;
  is_eaten: boolean;
  eaten_at: string | null;
  custom_kcal: number | null;
  custom_name: string | null;
  recipe?: Recipe; // joined
}

export interface DosingOrder {
  id: string;
  user_id: string;
  order_number: string | null;
  medication: string;
  concentration_mg_per_unit: number | null;
  start_units: number;
  start_mg: number | null;
  increment_units: number;
  increment_mg: number | null;
  max_units: number | null;
  max_mg: number | null;
  max_weeks: number;
  instructions: string | null;
  is_current: boolean;
  ordered_at: string;
  created_at: string;
}

export interface DoseLog {
  id: string;
  user_id: string;
  dose_mg: number;
  dose_units: number | null;
  med_name: string;
  taken_at: string;
  scheduled_for: string | null;
  notes: string | null;
  order_id: string | null;
  week_number: number | null;
}

export interface SideEffects {
  id: string;
  user_id: string;
  week_start: string;
  nausea: number;
  early_satiety: number;
  fatigue: number;
  reflux: number;
  other_notes: string | null;
}

// TDEE calculation helper type
export interface TDEEInput {
  sex: 'F' | 'M';
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_level?: number; // 1.2 sedentary → 1.9 extra active
}
