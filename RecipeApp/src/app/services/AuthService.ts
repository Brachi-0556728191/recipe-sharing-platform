import { Injectable } from '@angular/core';//מייבא את ה-Decorator שמאפשר להגדיר את הקלאס כשירות (Service).
import { HttpClient } from '@angular/common/http';//מייבא את הכלי שמאפשר לשלוח בקשות HTTP.
import { Observable, tap } from 'rxjs';//מייבא את סוג האובייקט המשמש לטיפול בבקשות אסינכרוניות.
import { ConnectionStatusService } from './connection-status-service';
import { UserStatus, LoginCredentials, RegisterData } from '../models/User';
import { ApiResponse } from '../models/API_Response';


const API_URL = 'http://localhost:5000/api/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private connectionStatusService: ConnectionStatusService
  ) { }

  /**
   * .Flask מטפל בשליחת נתוני הרשמה לשרת 
   * @param userData - אובייקט עם first_name, last_name, email, password ועוד.
   */
  register(userData: RegisterData): Observable<UserStatus> {
    return this.http.post<UserStatus>(`${API_URL}/register`, userData, { withCredentials: true })
    .pipe(
       tap((response: UserStatus) => {  
          // בדיקה: האם ההרשמה הצליחה?
          // Flask מחזיר response עם logged_in או message
          if (response && response.user_id) { 
            // שמירת נתוני המשתמש ב-Service
            this.connectionStatusService.setCurrentUser(response);
          }
        })
    );
  }

  /**
   * מטפל בשליחת נתוני כניסה לשרת Flask.
   * @param credentials - אובייקט עם username (שם מלא), email, ו-password.
   */
  login(credentials: LoginCredentials): Observable<UserStatus> {
    return this.http.post<UserStatus>(`${API_URL}/login`, credentials, { withCredentials: true })
      .pipe(
        // tap - מאפשר לנו "להציץ" לתוך התשובה ולבצע פעולת צד
        // בלי לשנות את התשובה עצמה
        tap((response: UserStatus) => {  
          // בדיקה: האם ההתחברות הצליחה?
          // Flask מחזיר response עם logged_in או message
          if (response && response.user_id) { 
            // שמירת נתוני המשתמש ב-Service
            this.connectionStatusService.setCurrentUser(response);
          }
        })
      );
  }

  isLoggedIn(): boolean {
    return this.connectionStatusService.isLoggedIn();
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_URL}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          // אחרי התנתקות מוצלחת, נקה את המשתמש
          this.connectionStatusService.clearCurrentUser();
        })
      );
  }
  
}



//פונקציות חדשות שבשימוש בקובץ:
// .pipe() = צינור שמעביר נתונים דרך אופרטורים
// .tap() = "הצצה" לנתונים בלי לשנות אותם (Side Effects)
// response: any = פתרון מהיר לבעיות טיפוסים