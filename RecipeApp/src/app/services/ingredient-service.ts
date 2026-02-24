import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IngredientItem } from '../models/ingredient';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  
  private apiUrl = 'http://localhost:5000/api/recipes/ingredient';

  constructor(private http: HttpClient) { }

  /**
   * שליפת כל הרכיבים הייחודיים מהמערכת
   * משמש ל-Autocomplete
   * 
   * @returns Observable<IngredientItem[]> - רשימת רכיבים עם ספירת הופעות
   * 
   * דוגמה לתשובה מהשרת:
   * [
   *   { name: "קמח", count: 45 },
   *   { name: "סוכר", count: 38 },
   *   { name: "שוקולד מריר", count: 12 }
   * ]
   */
  getAllIngredients(): Observable<IngredientItem[]> {
    return this.http.get<IngredientItem[]>(
      `${this.apiUrl}/all`,
      { withCredentials: true }
    );
  }

  /**
   * פונקציית עזר: סינון רכיבים לפי טקסט חיפוש
   * משמשת ל-Autocomplete בצד לקוח
   * 
   * @param ingredients - רשימת כל הרכיבים
   * @param searchText - הטקסט שהמשתמש הקליד
   * @param limit - מספר התוצאות המקסימלי (ברירת מחדל: 100)
   * @returns רשימה מסוננת של רכיבים
   */
  filterIngredients(
    ingredients: IngredientItem[], 
    searchText: string, 
    limit: number = 100
  ): IngredientItem[] {
    
    // ניקוי והמרה לאותיות קטנות
    const search = searchText.trim().toLowerCase();
    
    // אם אין טקסט חיפוש, החזר רשימה ריקה
    if (!search) {
      return [];
    }

    // סינון רכיבים שמכילים את טקסט החיפוש
    return ingredients
      .filter(ing => ing.name.toLowerCase().includes(search))
      .slice(0, limit); // הגבלה למספר תוצאות
  }

  /**
   * פונקציית עזר: הדגשת טקסט החיפוש בתוך שם הרכיב
   * משמשת להדגשה ויזואלית ב-HTML
   * 
   * @param ingredientName - שם הרכיב המלא
   * @param searchText - הטקסט שהמשתמש הקליד
   * @returns HTML string עם <strong> סביב החלק המודגש
   * 
   * דוגמה:
   * highlightMatch("שוקולד מריר", "שוק") 
   * => "<strong>שוק</strong>ולד מריר"
   */
  highlightMatch(ingredientName: string, searchText: string): string {
    
    if (!searchText.trim()) {
      return ingredientName;
    }

    // יצירת Regex שאינו תלוי רישיות (case-insensitive)
    const regex = new RegExp(`(${searchText})`, 'gi');
    
    // החלפת החלק התואם ב-<strong>
    return ingredientName.replace(regex, '<strong>$1</strong>');
  }
}
