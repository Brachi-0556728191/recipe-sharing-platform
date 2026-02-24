import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Recipe, RecipeFilters } from '../models/Recipe';
import { ApiResponse } from '../models/API_Response';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = 'http://localhost:5000/api/recipes';
//שומרים את הפילטרים האחרונים בזיכרון :State ניהול   
  // מאתחלים עם ברירות מחדל
  private filtersSubject = new BehaviorSubject<RecipeFilters>({
    kashrut: 'all',
    category: 'all',
    maxTime: 180,
    minRating: 0,
    ingredients: [],
    usedIngredientSearch: false
  });

  constructor(private http: HttpClient) { }

  /**
   * של הפילטרים State עדכון ה-
   */
  updateFilters(filters: RecipeFilters): void {
    this.filtersSubject.next(filters);
  }

  /**
   * קבלת הערך הנוכחי של הפילטרים (Snapshot)
   */
  getCurrentFilters(): RecipeFilters {
    return this.filtersSubject.value;
  }

  /**
   * איפוס פילטרים
   */
  resetFilters(): void {
    this.filtersSubject.next({
      kashrut: 'all',
      category: 'all',
      maxTime: 180,
      minRating: 0,
      ingredients: [],
      usedIngredientSearch: false
    });
  }

  /**
   * שליפת מתכונים (GET)
   * מקבל את הפילטרים כארגומנט או משתמש בנוכחיים
   */
  getAllRecipes(filters: RecipeFilters = this.filtersSubject.value): Observable<Recipe[]> {
    let params = new HttpParams();

    if (filters.kashrut && filters.kashrut !== 'all') params = params.set('kashrut', filters.kashrut);
    if (filters.category && filters.category !== 'all') params = params.set('category', filters.category);
    if (filters.maxTime) params = params.set('max_time', filters.maxTime.toString());
    if (filters.minRating) params = params.set('min_rating', filters.minRating.toString());

    return this.http.get<Recipe[]>(`${this.apiUrl}/all`, { params, withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  /**
 * חיפוש לפי רכיבים (POST)
 */
searchRecipesByIngredients(ingredients: string[], filters: RecipeFilters): Observable<Recipe[]> {
    // עדכון ה-State שהשתמשנו בחיפוש רכיבים
    const updatedFilters = { ...filters, ingredients, usedIngredientSearch: true };
    this.updateFilters(updatedFilters);
   
    //המרת פילטרים לשרת
    const body = {
      ingredients: ingredients,
      //אחרת המר למספר null שלח all  אם 
      kashrut: (filters.kashrut && filters.kashrut !== 'all') ? parseInt(filters.kashrut) : 'all',
      category: (filters.category && filters.category !== 'all') ? parseInt(filters.category) : 'all',
      max_time: filters.maxTime || '180',
      min_rating: filters.minRating || '0'
    };

    return this.http.post<Recipe[]>(`${this.apiUrl}/search-by-ingredients`, body, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  getRecipeById(id: number): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/${id}`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  addRecipe(data: FormData): Observable<ApiResponse<{ recipe_id: number; image_file: string }>> {
    return this.http.post<ApiResponse<{ recipe_id: number; image_file: string }>>(`${this.apiUrl}/add`, data, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

    updateRecipe(id: number, data: FormData): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, data, { withCredentials: true })
     .pipe(catchError(this.handleError));
  }


  deleteRecipe(recipeId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${recipeId}`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  // --- Error Handling ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.status === 404) errorMessage = 'לא נמצאו נתונים.';
      else if (error.status === 500) errorMessage = 'שגיאת שרת, נסה שוב מאוחר יותר.';
      else errorMessage = error.error?.message || 'שגיאת תקשורת.';
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
