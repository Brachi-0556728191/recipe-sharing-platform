import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';//מייבא את הכלי שמאפשר לשלוח בקשות HTTP.
import { Observable } from 'rxjs';//מייבא את סוג האובייקט המשמש לטיפול בבקשות אסינכרוניות.
import { User} from '../models/User';
import { ApiResponse } from '../models/API_Response';

const API_URL = 'http://localhost:5000/api/profile';


@Injectable({
  providedIn: 'root',
})


export class ProfileService {

constructor(
    private http: HttpClient,
  ) { }

  //קריאת שרת להצגת הפרופיל (עבור איזור אישי)
    getProfile(): Observable<User> { return this.http.get<User>(`${API_URL}/profileId`,{ withCredentials: true });
    }
  requestContentRole(userId: number): Observable<ApiResponse> {
      return this.http.post<ApiResponse>(`${API_URL}/request-content-role`, { user_id: userId }, { withCredentials: true });
    }
    //קריאת שרת להצגת כל המשתמשים שהגישו בקשה להיות משתמשי תוכן
    getPendingContentRequests(): Observable<User[]> {
      return this.http.get<User[]>(`${API_URL}/admin/pending-content-requests`, { withCredentials: true });
    }
    //אישור משתמש רגיל למשתמש תוכן
    approveContentUser(userId: number): Observable<ApiResponse> {
      return this.http.post<ApiResponse>(`${API_URL}/admin/approve-content-user`, { user_id: userId }, { withCredentials: true });
    }
    //דחית בקשה של משתמש רגיל להפוך למשתמש תוכן 
    rejectContentUser(userId: number): Observable<ApiResponse> {
      return this.http.post<ApiResponse>(`${API_URL}/admin/reject-content-user`, { user_id: userId }, { withCredentials: true });
    }
    
}
