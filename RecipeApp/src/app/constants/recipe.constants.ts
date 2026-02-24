export const RECIPE_CONSTANTS = {
  // גבולות שדות
  TITLE_MAX_LENGTH: 100,
  TITLE_MIN_LENGTH: 3,
  
  // זמן הכנה
  PREP_TIME_MIN: 1,
  PREP_TIME_MAX: 300,
  PREP_TIME_DEFAULT: 30,
  
  // מנות
  SERVINGS_MIN: 1,
  SERVINGS_DEFAULT: 4,
  
  // ערכי ברירת מחדל לפילטרים
  DEFAULT_KASHRUT: 0,
  DEFAULT_CATEGORY: 0,
  DEFAULT_DIFFICULTY: 1,
  DEFAULT_MAX_TIME: 180,
  DEFAULT_MIN_RATING: 0,
  
  // רכיבים
  INGREDIENT_AMOUNT_MIN: 0.1,
  MIN_INGREDIENTS: 1,
  
  // הודעות
  SUCCESS_MESSAGE_DURATION: 1000,
};

// מילונים (Dictionaries) - מגדירים את המיפוי בין המספר לטקסט
export const KASHRUT_LABELS: { [key: number]: string } = {
  0: '🥦 פרווה',
  1: '🥛 חלבי',
  2: '🥩 בשרי'
};

export const CATEGORY_LABELS: { [key: number]: string } = {
  0: '🍖 מנות עיקריות',
  1: '🍝 תוספות',
  2: '🍰 קינוחים',
  3: '🎂 עוגות',
  4: '🍪 עוגיות',
  5: '🥗 סלטים',
  6: '🍲 מרקים',
  7: '🥯 לחמים',
  8: '🍨 גלידות',
  9: '🥧 פשטידות וטארטים'
};

export const DIFFICULTY_LABELS: { [key: number]: string } = {
  1: 'קל מאד',
  2: 'קל',
  3: 'בינוני',
  4: 'קשה',
  5: 'קשה מאד'
};