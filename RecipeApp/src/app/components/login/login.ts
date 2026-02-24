import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { ConnectionStatusService } from '../../services/connection-status-service';
import {
  LoginCredentials, LoginServerErrors

} from '../../models/User';
import Swal from 'sweetalert2';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,  // *ngFor, *ngIf
    FormsModule,   // [(ngModel)]
    RouterLink     // [routerLink]
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit, OnDestroy {


  // נתוני טופס ההתחברות
  credentials: LoginCredentials = {
    username: '',
    email: '',
    password: ''
  };

  // שגיאות מהשרת עבור כל שדה סוג של הטופס
  serverErrors = signal<LoginServerErrors>({
    username: '',
    email: '',
    password: ''
  });


  // שגיאה כללית (למקרה שאין שדה ספציפי)
  errorMessage: string = '';

  // מצב הצגת הסיסמה
  showPassword: boolean = false;

  // מצב טעינה של הטופס
  isLoading: boolean = false;

  //משתנה לשמירת הכתובת URL לחזרה לאחר ההתחברות
  returnUrl: string = '/home'; // ברירת מחדל


  private destroy$ = new Subject<void>();


  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private connectionStatusService: ConnectionStatusService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // החלפת מצב הצגת הסיסמה
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }


  // רשימת דומיינים נפוצים לאימייל
  emailDomains: string[] = [
    'gmail.com',
    'walla.co.il',
    'yahoo.com',
    'outlook.com',
    'hotmail.com'
  ];

  // הצעות אימייל שיוצגו למשתמש
  suggestedEmails: string[] = [];


  // פונקציה שמופעלת בכל הקשה בשדה האימייל

  onEmailInput(event: Event): void {
    // קבלת הערך שהוקלד בשדה האימייל
    const input = event.target as HTMLInputElement;
    const value = input.value;

    //אם השטרודל הוא התו האחרון, נציג את כל האפשרויות
    if (!value.includes('@')) {
      this.suggestedEmails = this.emailDomains.map(domain => `${value}@${domain}`);
      return;
    }
    // פיצול הטקסט לשני חלקים: לפני ואחרי השטרודל
    const [localPart, domainPart] = value.split('@');
    // אם יש טקסט אחרי השטרודל, נסנן את הרשימה
    if (domainPart !== undefined) {
      this.suggestedEmails = this.emailDomains
        .filter(domain => domain.startsWith(domainPart)) // סינון: רק מה שמתחיל במה שהוקלד
        .map(domain => `${localPart}@${domain}`); // בניית הכתובת המלאה
    } else {
      // אם רק כתבו @ ועוד לא המשיכו, נציג את כל האפשרויות
      this.suggestedEmails = this.emailDomains.map(domain => `${localPart}@${domain}`);
    }
  }

  onLogin(): void {
    // 1. איפוס שגיאות לפני שליחה מחדש
    this.errorMessage = '';
    this.serverErrors.set({ username: '', email: '', password: '' });

    // 2. סימון מצב טעינה
    this.isLoading = true;

    this.authService.login(this.credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Login successful:', response.username);
          this.connectionStatusService.setCurrentUser(response);
          Swal.fire({
            title: `הי ${response.username}`,
            text: 'ההרשמה בוצעה בהצלחה! !טוב לראות אותך שוב 🎉.',
            icon: 'success',
            timer: 2500,
            showConfirmButton: false,
            // toast: true,
            timerProgressBar: true,
            iconColor: '#2ecc71',
          });
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('❌ Login failed:', err);

          // בדיקה: האם השרת החזיר שדה ספציפי שנכשל?
          if (err.error && err.error.field) {
            const field = err.error.field;
            const msg = err.error.message;

            // מיפוי השגיאה לשדה המתאים
            if (field === 'username') {
              this.serverErrors.set({ ...this.serverErrors(), username: msg });
            } else if (field === 'email') {
              this.serverErrors.set({ ...this.serverErrors(), email: msg });
            } else if (field === 'password') {
              this.serverErrors.set({ ...this.serverErrors(), password: msg });
            } else {
              // שגיאה כללית
              this.errorMessage = msg;
            }
          } else {
            // Fallback למקרה של שגיאה לא צפויה
            this.errorMessage = err.error?.message || 'ההתחברות נכשלה. אנא נסה שנית.';
          }
          this.cdr.detectChanges();
        }
      });
  }
}
