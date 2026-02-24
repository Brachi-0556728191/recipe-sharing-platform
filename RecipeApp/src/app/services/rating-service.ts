import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RatingRequest, RatingResponse } from '../models/Rating';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  
  // כתובת הבסיס לשרת הדירוגים החדש
  private apiUrl = 'http://localhost:5000/api/ratings';

  constructor(private http: HttpClient) { }

  /**
   * שליחת דירוג למתכון
   * @param recipeId מזהה המתכון
   * @param score הציון (1-5)
   */
  rateRecipe(recipeId: number, score: number): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(`${this.apiUrl}/${recipeId}`, { score }, {
      withCredentials: true // חובה לשליחת עוגיות זיהוי
    });
  }
}
