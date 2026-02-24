import { KASHRUT_LABELS, CATEGORY_LABELS, DIFFICULTY_LABELS} from '../constants/recipe.constants';


// 'Unknown' פונקציות עזר שמחזירות את הטקסט, ואם לא קיים מחזירות 
export function getKashrutLabel(type: number): string {
  return KASHRUT_LABELS[type] || 'Unknown';
}

export function getCategoryLabel(type: number): string {
  return CATEGORY_LABELS[type] || 'Unknown';
}

export function getDifficultyLabel(level: number): string {
  return DIFFICULTY_LABELS[level] || 'Unknown';
}