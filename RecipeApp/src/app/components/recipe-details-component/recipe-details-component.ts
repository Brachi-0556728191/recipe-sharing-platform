import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import Swal from 'sweetalert2';

import { RecipeService } from '../../services/recipe-service';
import { CommentService } from '../../services/comment-service';
import { RatingService } from '../../services/rating-service';
import { ConnectionStatusService } from '../../services/connection-status-service';

import { Recipe } from '../../models/Recipe';
import { Comment } from '../../models/Comment';

// ייבוא פונקציות העזר לשימוש ב-HTML
import { getKashrutLabel, getCategoryLabel, getDifficultyLabel } from '../../utils/recipe_labels';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recipe-details-component',
  standalone: true,
  imports: [
    CommonModule,  // *ngFor, *ngIf, date pipe
    FormsModule   // [(ngModel), [value]
  ],
  templateUrl: './recipe-details-component.html',
  styleUrl: './recipe-details-component.css',
})
export class RecipeDetailsComponent implements OnInit {

  //  State Management with Signals
  recipe = signal<Recipe | null>(null);
  comments = signal<Comment[]>([]);

  isLoading = signal<boolean>(true);
  isLoadingComments = signal<boolean>(false);

  selectedImageUrl = signal<string>('');
  hoverRating = signal<number>(0);
  newCommentContent = signal<string>('');

  // קבועים לשימוש ב-HTML
  readonly stars = [1, 2, 3, 4, 5];

  // חשיפת פונקציות עזר ל-Template
  readonly getKashrutLabel = getKashrutLabel;
  readonly getCategoryLabel = getCategoryLabel;
  readonly getDifficultyLabel = getDifficultyLabel;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private recipeService: RecipeService,
    private commentService: CommentService,
    private ratingService: RatingService,
    private connectionStatusService: ConnectionStatusService
  ) { }

  //--- פונקציה שנטענת עם אתחול הקומפוננטה ---//
  // טוענת את פרטי המתכון עפ"י איידי והתגובות
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRecipe(+id);
    } else {
      this.handleError('מזהה מתכון לא תקין');
    }
  }

  ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}


  //פונקציית טעינת מתכון פרטני
  private loadRecipe(id: number): void {
    this.isLoading.set(true);

    this.recipeService.getRecipeById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.recipe.set(data);
          // בחירת תמונה ראשית להצגה
          this.selectedImageUrl.set(data.main_image_url || data.image_url);
          this.isLoading.set(false);

          // טעינת תגובות רק לאחר שיש מתכון
          this.loadComments(id);
        },
        error: (err) => {
          this.handleError('לא הצלחנו לטעון את המתכון', err);
          this.isLoading.set(false);
        }
      });
  }

  // פונקציית טעינת תגובות למתכון
  private loadComments(recipeId: number): void {
    this.isLoadingComments.set(true);
    this.commentService.getRecipeComments(recipeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.comments.set(data);
          this.isLoadingComments.set(false);
        },
        error: () => this.isLoadingComments.set(false) // שגיאה בתגובות לא קריטית
      });
  }

  // --- אינטראקציות ממשק משתמש ---

  // שינוי התמונה הראשית שמוצגת בקומפוננטה
  changeMainImage(url: string): void {
    this.selectedImageUrl.set(url);
  }

  // גלילה חלקה לאזורים שונים בדף (כפתורים: מצרכים, הוראות)
  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // חזרה לעמוד הקודם בהיסטוריית הניווט (גלריית מתכונים או אזור אישי)
  goBack(): void {
    this.location.back();
  }


// --- פונקציות לניהול דירוגים ותגובות ---

  /**
   * לוגיקת הכוכבים:
   * צבוע רק אם המשתמש מרחף כרגע, או אם המשתמש דירג בעבר.
   * הממוצע הכללי לא משפיע על הצבע (רק מוצג כטקסט).
   */
  isStarActive(star: number): boolean {
    const hover = this.hoverRating();
    const userRating = this.recipe()?.user_rating || 0;

    if (hover > 0) return star <= hover;
    return star <= userRating;
  }

  // עדכון ערכי Signal עבור ה-HTML
  setHover(star: number) { this.hoverRating.set(star); }
  clearHover() { this.hoverRating.set(0); }

  // דירוג מתכון - דורש התחברות
  rateRecipe(score: number): void {
    if (!this.requireLogin()) return;

    const currentRecipe = this.recipe();
    if (!currentRecipe) return;

    this.ratingService.rateRecipe(currentRecipe.id, score)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // עדכון אופטימי ומיידי של ה-UI
          this.recipe.update(r => r ? { ...r, user_rating: score, average_rating: res.new_average } : null);
          this.showToast('הדירוג נקלט בהצלחה!');
        },
        error: () => this.showError('לא ניתן לשמור דירוג כרגע')
      });
  }


  updateComment(text: string) { this.newCommentContent.set(text); }

    // הוספת תגובה חדשה - דורש התחברות
  submitComment(): void {
    if (!this.requireLogin()) return;

    const content = this.newCommentContent();
    const currentRecipe = this.recipe();

    if (!content.trim() || !currentRecipe) return;

    this.commentService.addComment(currentRecipe.id, content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newComment) => {
          this.comments.update(list => [...list, newComment]);
          this.newCommentContent.set('');
          this.showToast('תגובתך נוספה!');
        },
        error: () => this.showError('שגיאה בשליחת התגובה')
      });
  }

  // מחיקת תגובה - רק לבעלים (מוגן גם בשרת, באנגולר ישנה הגנה נוספת - הכפתור מוצג רק לבעלים)
  deleteComment(commentId: number): void {
    Swal.fire({
      title: 'למחוק?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'מחק',
      cancelButtonText: 'ביטול'
    }).then((res) => {
      if (res.isConfirmed) {
        this.commentService.deleteComment(commentId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.comments.update(list => list.filter(c => c.id !== commentId));
              this.showToast('התגובה נמחקה');
            },
            error: () => this.showError('מחיקה נכשלה')
          });
      }
    });
  }


  // --- פונקציות עזר לניהול דירוגים ותגובות ---

  /** בדיקת התחברות מרכזית - מונעת שכפול קוד */
  private requireLogin(): boolean {
    if (!this.connectionStatusService.isLoggedIn()) {
      Swal.fire({
        title: 'פעולה זו דורשת הרשמה',
        text: '...כדי לבצע פעולה זו, נא להתחבר או להירשם. זה ממש קצר',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#43A047',
        cancelButtonColor: '#d33',
        cancelButtonText: 'אולי בפעם אחרת',
        confirmButtonText: 'התחבר עכשיו',
      }).then((res) => {
        if (res.isConfirmed) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        }
      });
      return false;
    }
    return true;
  }

  // הצגת הודעת הצלחה קצרה 
  private showToast(title: string) {
    Swal.fire({
      icon: 'success',
      title: title,
      toast: true,
      position: 'top',
      timer: 2000,
      showConfirmButton: false
    });
  }

  // הצגת הודעת שגיאה
  private showError(msg: string) {
    Swal.fire('שגיאה', msg, 'error');
  }

  // טיפול בשגיאות קריטיות - הצגת הודעה וחזרה לעמוד הקודם
  private handleError(msg: string, err?: any) {
    console.error(err);
    Swal.fire('שגיאה', msg, 'error').then(() => this.goBack());
  }

  checkedIngredients = new Set<number>();

  //פונקציה המשהה אילו רכיבים סומנו
  toggleIngredient(index: number): void {
    if (this.checkedIngredients.has(index)) {
      this.checkedIngredients.delete(index);
    } else {
      this.checkedIngredients.add(index);
    }
  }

  // פורמט הוראות ההכנה למערך שורות של טקסט
  formatInstructions(text: string): string[] {
    if (!text) return [];
    return text.split(/\r\n|\n|\./).filter(line => line.trim().length > 0);
  }

  // הדפסת המתכון בעיצוב ידידותי לדפוס
  printRecipe(): void {
    const r = this.recipe();
    if (!r) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
  <html dir="rtl">
  <head>
    <title>${r.title}</title>
    <style>
      body {
        font-family: "Arial";
        margin: 0;
        padding: 40px;
        color: #333;
        background: #fff;
      }

      .page {
        max-width: 800px;
        margin: auto;
      }

      .logo {
        text-align: center;
        margin-bottom: 20px;
      }

      .logo img {
  height: 60px;
  opacity: 1;
  display: block;
  margin: 0 auto;
}

      h1 {
        text-align: center;
        margin-bottom: 5px;
      }

      .author {
        text-align: center;
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 20px;
      }

      .meta {
        display: flex;
        justify-content: center;
        gap: 20px;
        font-size: 0.85rem;
        color: #555;
        margin-bottom: 25px;
        flex-wrap: wrap;
      }

      .main-img {
  width: 100%;
  max-width: 420px;
  max-height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin: 0 auto 25px;
  display: block;
}

      h2 {
        border-bottom: 2px solid #eee;
        padding-bottom: 6px;
        margin-top: 35px;
      }

      ul {
        padding-right: 20px;
      }

      li {
        margin-bottom: 8px;
      }

      .step {
        margin-bottom: 12px;
        line-height: 1.6;
      }

      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 0.8rem;
        color: #999;
      }
    </style>
  </head>
  <body>
    <div class="page">

      <h1>${r.title}</h1>
      <div class="author">מאת: ${r.author || 'מערכת MealMate'}</div>

      <div class="meta">
        <span>⏱️ ${r.prep_time} דק'</span>
        <span>🍽️ ${r.servings || 4} מנות</span>
        <span>👨‍🍳 ${this.getDifficultyLabel(r.difficulty)}</span>
        <span>${this.getKashrutLabel(r.kashrut)}</span>
      </div>

      ${this.selectedImageUrl() ? `<img class="main-img" src="${this.selectedImageUrl()}">` : ''}

      <h2>מצרכים</h2>
      <ul>
        ${r.ingredients.map(i =>
      `<li>${i.amount} ${i.unit} ${i.name}</li>`
    ).join('')}
      </ul>

      <h2>אופן ההכנה</h2>
      ${this.formatInstructions(r.instructions).map((s, i) =>
      `<div class="step">${i + 1}. ${s}</div>`
    ).join('')}

      <div class="footer">
        בתיאבון 🌿<br>
        נשמח לראות אתכם חוזרים ל־MealMate
      </div>

    </div>
  </body>
  </html>
  `);

    win.document.close();
    win.print();
    
  }

// הדפסת רשימת קניות של המצרכים החסרים
  printShoppingList(): void {
    const recipe = this.recipe();
    if (!recipe) return;

    const missing = recipe.ingredients.filter((_, i) =>
      !this.checkedIngredients.has(i)
    );

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
    <html dir="rtl">
    <head>
      <title>רשימת קניות</title>
      <style>
        body {
          font-family: Arial;
          padding: 40px;
          max-width: 600px;
          margin: auto;
        }

        h1 {
          text-align: center;
        }

        .hint {
          background: #FFFDE7;
          padding: 12px;
          border-radius: 10px;
          margin: 20px 0;
          font-size: 0.95rem;
        }

        ul {
          list-style: none;
          padding: 0;
        }

        li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-bottom: 1px solid #eee;
          font-size: 1.05rem;
        }

        .box {
          width: 18px;
          height: 18px;
          border: 2px solid #555;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>

      <h1>🛒 רשימת קניות</h1>
      <div class="hint">
        רק המוצרים שחסרים לך בבית...
      </div>

      <ul>
        ${missing.map(i =>
      `<li><span class="box"></span> ${i.amount} ${i.unit} ${i.name}</li>`
    ).join('')}
      </ul>

    </body>
    </html>
  `);

    win.document.close();
    win.print();
  }

}
