import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { ConnectionStatusService } from '../../services/connection-status-service';
import { UserStatus } from '../../models/User';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-bar-component',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,        // [routerLink]
    RouterLinkActive   // routerLinkActive="active"
  ],
  templateUrl: './nav-bar-component.html',
  styleUrl: './nav-bar-component.css',
})
export class NavBarComponent implements OnInit {

  //  הלוגו הזמני
  appName = 'MealMate';

  // 1. משתנה המשתמש המחובר, נרשמים ל-BehaviorSubject
  protected currentUser: UserStatus | null = null;

  // 8. מצב תפריט המבורגר (Mobile)
  protected isMenuOpen = signal(false);

  // 4. הגדרות תפקידים (כדי שהקוד יהיה קריא יותר)
  readonly ROLE_UPLOADER = 2;
  readonly ROLE_ADMIN = 3;

  constructor(
    private connectionStatusService: ConnectionStatusService,
    private authService: AuthService, // הזרקת AuthService ליציאה
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // הרשמה לשינויי סטטוס המשתמש (מחובר / לא מחובר)
    this.connectionStatusService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // 8. לוגיקה לפתיחה/סגירה של תפריט ההמבורגר
  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  // 2. לוגיקת יציאה מהמערכת
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // לאחר יציאה מוצלחת, הפנה לדף הבית/התחברות
        this.router.navigate(['/home']);
        // סגור את התפריט ב-Mobile
        this.isMenuOpen.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Logout error:', err);
        // טיפול בשגיאה: אפשר להציג הודעה למשתמש
        alert('אירעה שגיאה במהלך ניתוק מהשרת. נסה שוב.');
        // בכל מקרה ננקה מקומית כדי לא להיתקע:
        this.connectionStatusService.setCurrentUser(null);
        this.router.navigate(['/home']);
      }
    });
  }

  // 4. בדיקת הרשאה פשוטה (לצורך הצגת קישורים)
  hasMinRole(minRole: number): boolean {
    // return !!this.currentUser && (this.currentUser.role >= minRole);
    return !!this.currentUser &&
      this.currentUser.role !== undefined &&
      this.currentUser.role >= minRole;
  }
}
