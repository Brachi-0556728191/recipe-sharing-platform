import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { ConnectionStatusService } from '../services/connection-status-service';
import { catchError, map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private connectionStatusService: ConnectionStatusService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // 1️⃣ בדוק אם יש משתמש בזיכרון המקומי
    const currentUser = this.connectionStatusService.getCurrentUser();
    
    if (currentUser) {
      console.log('✅ AuthGuard: User already in memory:', currentUser.username);
      return of(true);
    }

    // 2️⃣ אם אין משתמש בזיכרון, בדוק עם השרת
    console.log('🔄 AuthGuard: Checking with server...');
    
    return this.connectionStatusService.checkConnectionStatus().pipe(
      tap(res => {
        console.log('📡 AuthGuard: Server response:', res);
        if (res.logged_in) {
          console.log('✅ AuthGuard: User logged in on server, storing in memory');
          this.connectionStatusService.setCurrentUser(res);
        }
      }),
      map(res => {
        if (res.logged_in) {
          console.log('✅ AuthGuard: Access granted');
          return true;
        }
        console.log('❌ AuthGuard: Not logged in - redirecting to /login');
        return this.router.createUrlTree(['/login']);
      }),
      catchError(err => {
        console.error('❌ AuthGuard: Server error:', err);
        return of(this.router.createUrlTree(['/login']));
      })
    );
  }
}