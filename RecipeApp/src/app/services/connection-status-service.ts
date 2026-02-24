import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserStatus } from '../models/User';
// הגדרת כתובת ה-API
const API_URL = 'http://localhost:5000/api/status';

// Service לניהול סטטוס החיבור של המשתמש
@Injectable({
  providedIn: 'root'
})
export class ConnectionStatusService {

  // ---------------------------------------------------------------
  // BehaviorSubject - מאפשר לקומפוננטות "להאזין" לשינויים במשתמש
  // ---------------------------------------------------------------
  // BehaviorSubject שומר ערך אחרון ושולח אותו לכל מי שמאזין
  // 🔐 private – רק הסרוויס שולט בעדכון
  private currentUserSubject = new BehaviorSubject<UserStatus | null>(null);
  // Observable שקומפוננטות יכולות להירשם אליו
  // $ בסוף השם = מוסכמה שזה Observable
  // 👂 חשיפה לקריאה בלבד
  public currentUser$ = this.currentUserSubject.asObservable();

  // ---------------------------------------------------------------
  // Constructor - הזרקת HttpClient
  // ---------------------------------------------------------------
  constructor(private http: HttpClient) { }

  // =================================================================
  // פונקציה: בדיקת סטטוס חיבור מהשרת
  // =================================================================
  /**
   * לשרת לבדיקת סטטוס ההתחברות GET שולח בקשת  
   * עם הבקשה Cookie (session) הדפדפן ישלח אוטומטית את ה- 
   * 
   * @returns Observable עם תגובת השרת: {logged_in: bool, user_id?, username?, ...}
   */
  checkConnectionStatus(): Observable<UserStatus> {
    // GET /api/status/check
    // withCredentials: true - חובה! כדי ששרת יקבל את ה-Cookie
    return this.http.get<UserStatus>(`${API_URL}/check`, { withCredentials: true });
  }

  // =================================================================
  // פונקציה: שמירת נתוני המשתמש הנוכחי
  // =================================================================
  /**
   * מעדכנת את המשתמש הנוכחי בזיכרון.
   * כל הקומפוננטות שמאזינות ל-currentUser$ יקבלו עדכון אוטומטי.
   * 
   * @param userData - נתוני המשתמש (או null אם לא מחובר)
   */
  setCurrentUser(userData: UserStatus | null): void {
    // עדכון ה-BehaviorSubject
    // כל מי שמאזין (subscribe) יקבל את הערך החדש
    console.log('💾 Setting current user:', userData?.username);
    this.currentUserSubject.next(userData);
  }

  // =================================================================
  // פונקציה: קבלת נתוני המשתמש הנוכחי
  // =================================================================
  /**
   * מחזירה את נתוני המשתמש הנוכחי (ללא Observable).
   * שימושי כשצריך לבדוק במהירות האם משתמש מחובר.
   * 
   * @returns נתוני המשתמש או null
   */
  getCurrentUser(): UserStatus | null {
    // .value - מחזיר את הערך הנוכחי של ה-BehaviorSubject
    const user = this.currentUserSubject.value;
    console.log('🔍 Getting current user:', user?.username || 'null');
    return user;
  }

  // =================================================================
  // פונקציה: בדיקה פשוטה האם מחובר
  // =================================================================
  /**
   * בדיקה מהירה האם יש משתמש מחובר.
   * 
   * @returns true אם מחובר, false אחרת
   */
  isLoggedIn(): boolean {
    // !! - ממיר ערך ל-boolean (null/undefined → false, אחרת → true)
    return !!this.currentUserSubject.value;
  }

  // =================================================================
  // פונקציה: התנתקות (ניקוי)
  // =================================================================
  /**
   * מנקה את נתוני המשתמש מהזיכרון.
   * לא שולחת בקשה לשרת - רק מנקה בצד הלקוח.
   */
  clearCurrentUser(): void {
    console.log('🔓 Clearing current user');
    this.currentUserSubject.next(null);
  }
}