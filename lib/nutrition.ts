import type { TDEEInput } from './types';

// Conversiones
export const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number) => Math.round(lbs * 0.453592 * 10) / 10;
export const cmToFtIn = (cm: number): [number, number] => {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return [ft, inches];
};

// Mifflin-St Jeor — el más preciso para adultos
export function calculateTDEE(input: TDEEInput): number {
  const { sex, age, weight_kg, height_cm, activity_level = 1.4 } = input;
  const bmr = sex === 'M'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  return Math.round(bmr * activity_level);
}

// Calorías meta para pérdida de peso (déficit del 15-20%)
export function calculateTargetKcal(tdee: number, deficitPct = 0.15): number {
  return Math.round(tdee * (1 - deficitPct));
}

// Macros recomendados para GLP-1 (alta proteína)
export function calculateMacros(targetKcal: number) {
  const proteinG = Math.round((targetKcal * 0.30) / 4);
  const carbsG = Math.round((targetKcal * 0.40) / 4);
  const fatG = Math.round((targetKcal * 0.30) / 9);
  return { proteinG, carbsG, fatG };
}

// Semanas estimadas
export function estimateWeeks(currentKg: number, targetKg: number, weeklyLossKg = 0.5): number {
  const diff = currentKg - targetKg;
  if (diff <= 0) return 0;
  return Math.ceil(diff / weeklyLossKg);
}
