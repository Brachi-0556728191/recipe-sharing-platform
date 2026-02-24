import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { ConnectionStatusService } from '../services/connection-status-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private connectionStatusService: ConnectionStatusService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree{
    // קבל את המשתמש מהמזיכרון (AuthGuard כבר בדק ו-stored אותו)
    const user = this.connectionStatusService.getCurrentUser();

    console.log('🔍 RoleGuard check:');
    console.log('Current user:', user);

    // אם אין משתמש - זה לא היה צריך להגיע לכאן (AuthGuard צריכה לעצור את זה)
    // אבל בטיחות נוספת:
    if (!user) {
      console.log('❌ No user found');
      return this.router.createUrlTree(['/login']);
    }

    // קבל את הרול המינימלי מה-routing data
    const minRole = route.data['minRole'] ?? 0;

    console.log(`Required minRole: ${minRole}`);
    console.log(`User role: ${user.role}`);

    // בדוק אם הרול תואם
    if (user.role !== undefined && user.role >= minRole) {
      console.log('✅ Role check passed - allowing access');
      return true;
    } else {
      console.log(`❌ Role ${user.role} < ${minRole} - Insufficient permissions`);
      return this.router.createUrlTree(['/recipes']);
    }
  }
}