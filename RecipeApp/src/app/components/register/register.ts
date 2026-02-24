import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // לייבוא לאחר יצירת קובץ הניתובים
import { AuthService } from '../../services/AuthService'; // ייבוא שירות ה-Auth
import { ConnectionStatusService } from '../../services/connection-status-service'; // ייבוא שירות בדיקת חיבור
import { RegisterData, RegisterServerErrors } from '../../models/User'; // ✅ הוסף
import Swal from 'sweetalert2';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
type ServerErrorKeys = keyof RegisterServerErrors;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnDestroy{

  // נתוני טופס ההרשמה
  userData: RegisterData = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  };

  // אובייקט לשגיאות מהשרת (כמו בלוגין)
  serverErrors = signal<RegisterServerErrors>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });


  //  שגיאה כללית 
  errorMessage: string = '';

  // מצבי הצגת סיסמה ואימות סיסמה
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // מצב טעינה של הטופס
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService,
    private router: Router,
    private connectionStatusService: ConnectionStatusService) { }


    ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

  // פונקציות החלפת מצב הצגת הסיסמה ואימות הסיסמה
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
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

    // אם השטרודל הוא התו האחרון, נציג את כל האפשרויות
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

  onRegister(): void {
    // 1. איפוס שגיאות
    this.errorMessage = '';
    this.serverErrors.set({
      first_name: '', last_name: '', email: '', password: '', phone: '', address: ''
    });

    // 2. בדיקה מקומית נוספת לאימות סיסמאות
    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'הסיסמאות אינן תואמות';
      return;
    }
    this.isLoading = true;

    this.authService.register(this.userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registration successful', response);
          // עדכון המערכת בפרטי המשתמש החדש כדי שהתפריט יתעדכן מיידית
          this.connectionStatusService.setCurrentUser(response);
          Swal.fire({
            title: 'ברוכים הבאים! 🎉',
            text: 'ההרשמה בוצעה בהצלחה! כעת ניתן להתחיל להשתמש במערכת.',
            icon: 'success',
            timer: 2500, // הודעה שתיעלם אוטומטית
            showConfirmButton: false,
            // toast: true,
            timerProgressBar: true,
            iconColor: '#2ecc71',
          });
          // ניתוב המשתמש לדף המתכונים
          this.router.navigate(['/recipes']);
        },
        error: (err) => {
          this.isLoading = false;
          // יצירת אובייקט שגיאות חדש ונקי
          const newErrors = {
            first_name: '', last_name: '', email: '',
            password: '', phone: '', address: ''
          };

          if (err.status === 409) {
            newErrors.email = 'כתובת האימייל כבר קיימת במערכת';
          }
          else if (err.error && err.error.field) {
            // זה נעשה על ידי יצירת טיפוס חדש `ServerErrorKeys` שמייצג את המפתחות התקפים של אובייקט השגיאות.
            // כך אנו מבטיחים שהמפתח שנקבל מהשרת הוא אכן אחד מהמפתחות הצפויים.
            const field = err.error.field as ServerErrorKeys;

            // בדיקה נוספת לוודא שהמפתח קיים (למקרה שהשרת מחזיר משהו לא צפוי)
            if (newErrors.hasOwnProperty(field)) {
              newErrors[field] = err.error.message;
            } else {
              this.errorMessage = err.error.message;
            }
          } else {
            this.errorMessage = 'אירעה שגיאה כללית';
          }
          // 3. עדכון ה-Signal - זה גורם לעדכון תצוגה מיידי!
          this.serverErrors.set(newErrors);
        }
      });
  }
}