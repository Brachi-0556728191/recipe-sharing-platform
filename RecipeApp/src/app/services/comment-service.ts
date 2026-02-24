import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../models/Comment';
import { ApiResponse } from '../models/API_Response';


@Injectable({
  providedIn: 'root',
})
export class CommentService {
  // קביע: הכתובת הבסיסית של השרת
  private apiUrl = 'http://localhost:5000/api/comments';

  // Dependency Injection: HttpClient מאפשר קריאות HTTP לשרת
  constructor(private http: HttpClient) { }

  // ===================================================================
  // שיטה 1: שליפת כל התגובות של מתכון מסוים
  // ===================================================================
  /**
   * קורא לשרת וקבל את כל התגובות על מתכון מסוים
   * GET /api/comments/<recipe_id>
   * 
   * @param recipeId - ID של המתכון
   * @returns Observable רשימה של תגובות
   */
  getRecipeComments(recipeId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      `${this.apiUrl}/${recipeId}`,
      {
        withCredentials: true  // שלח cookies (כדי להאמת המשתמש)
      }
    );
  }

  // ===================================================================
  // שיטה 2: הוספת תגובה חדשה
  // ===================================================================
  /**
   * שולח תגובה חדשה לשרת
   * POST /api/comments
   * 
   * @param recipeId - ID של המתכון שעליו אנחנו כותבים
   * @param content - תוכן התגובה (מחרוזת)
   * @returns Observable התגובה שנוצרה (עם ID וכו')
   */
  addComment(recipeId: number, content: string): Observable<Comment> {
    // הנתונים שנשלח לשרת (JSON)
    const payload = {
      recipe_id: recipeId,
      content: content
    };

    return this.http.post<Comment>(
      this.apiUrl,
      payload,
      {
        withCredentials: true  // שלח cookies
      }
    );
  }

  // ===================================================================
  // שיטה 3: מחיקת תגובה קיימת
  // ===================================================================
  /**
   * מחק תגובה מהשרת
   * DELETE /api/comments/<comment_id>
   * 
   * @param commentId - ID של התגובה שרוצים למחוק
   * @returns Observable בדיקה שהמחיקה הצליחה
   */
  deleteComment(commentId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.apiUrl}/${commentId}`,
      {
        withCredentials: true  // שלח cookies
      }
    );
  }
}

// 1. למה @Injectable(providedIn: 'root')?
//    ✅ זה עוזר ל-Angular להזריק את השירות לכל הקומפוננטות
//    ✅ 'root' = בן זמן החיים של כל האפליקציה
//
// 2. למה private apiUrl?
//    ✅ קביע = לא משנה אחרי יצירה
//    ✅ private = רק בקובץ הזה משתמשים בו
//    ✅ תרכזיות = אם נשנה כתובת, מעדכנים במקום אחד
//
// 3. למה Observable ולא Promise?
//    ✅ RxJS Observable = lazy evaluation
//    ✅ אפשר לבטל subscription בקלות
//    ✅ עדיף ל-multiple subscriptions
//    ✅ עקביות עם זאת שכבר קיימת
//
// 4. withCredentials: true - למה בכל פונקציה?
//    ✅ זה שולח את ה-cookies עם כל בקשה
//    ✅ בלי זה, השרת לא יכול להאמת המשתמש
//    ✅ זה חשוב לאבטחה
//
// 5. Observable<any[]> vs Observable<any>?
//    ✅ getRecipeComments מחזיר רשימה (any[])
//    ✅ addComment/deleteComment מחזירים single object (any)
//    ✅ ההבחנה תעזור לך בקוד הקומפוננטה
