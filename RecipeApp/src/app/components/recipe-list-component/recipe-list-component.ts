import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Recipe, RecipeFilters } from '../../models/Recipe';
import { RecipeService } from '../../services/recipe-service';
import { RatingService } from '../../services/rating-service';
import { ConnectionStatusService } from '../../services/connection-status-service';
import { IngredientService } from '../../services/ingredient-service';
import { IngredientItem } from '../../models/ingredient';
import { getKashrutLabel, getCategoryLabel } from '../../utils/recipe_labels';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recipe-list-component',
  standalone: true,
  imports: [
    CommonModule,  // *ngFor, *ngIf, date pipe
    FormsModule    // [(ngModel)]
  ],
  templateUrl: './recipe-list-component.html',
  styleUrl: './recipe-list-component.css',
})
export class RecipeListComponent implements OnInit, OnDestroy {

  // שימוש ב-Signals לניהול המצב (State)
  recipes = signal<Recipe[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // פילטרים
  filters: RecipeFilters;

  //UI עזרים ל
  sortOption: string = 'newest';
  ingredientInputs: string[] = [''];
  stars: number[] = [1, 2, 3, 4, 5];
  hoverRating: { [key: number]: number } = {};

  allIngredients: IngredientItem[] = []; // כל הרכיבים מהמערכת
  filteredSuggestions: { [index: number]: IngredientItem[] } = {}; // הצעות לכל שדה
  showSuggestions: { [index: number]: boolean } = {}; // האם להציג רשימה לכל שדה
  isLoadingIngredients: boolean = false; // טעינת רכיבים

  //utils / recipe_labels.ts פונקציות המרה מקובץ 
  getKashrutLabel = getKashrutLabel;
  getCategoryLabel = getCategoryLabel;

  private destroy$ = new Subject<void>();

  constructor(
    private recipeService: RecipeService,
    private ratingService: RatingService,
    private connectionStatusService: ConnectionStatusService,
    private ingredientService: IngredientService,
    private router: Router
  ) {
    this.filters = this.recipeService.getCurrentFilters();
  }

  // קריאה ראשונית בעת טעינת הקומפוננטה
  ngOnInit(): void {

    this.loadAllIngredients();

    // שחזור הפילטרים השמורים
    const saved = this.recipeService.getCurrentFilters();
    this.filters = { ...saved };

    // שחזור שדות הרכיבים אם יש
    if (this.filters.ingredients && this.filters.ingredients.length > 0) {
      this.ingredientInputs = [...this.filters.ingredients];
    }

    // ביצוע הטעינה הראשונית
    // בדיקה האם החיפוש הוא לפי רכיבים
    // אם כן, קריאה לפונקציית החיפוש
    // אחרת, קריאה לטעינה הרגילה
    if (this.filters.usedIngredientSearch && this.filters.ingredients?.length) {
      this.searchByIngredients();
    } else {
      this.fetchRecipes();
    }
  }

  // ניקוי משאבים בעת השמדת הקומפוננטה 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  //הצגת כל מתכונים עם הפילטרים הנוכחיים (בלי חיפוש לפי רכיבים)
  fetchRecipes(): void {
    //  עדכון Signal - מודיע ל-UI שמתחילה טעינה
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.recipeService.updateFilters(this.filters);

    this.recipeService.getAllRecipes(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // עדכון הנתונים בתוך ה-Signal
          this.recipes.set(data);
          this.applyClientSort(); // מיון
          this.isLoading.set(false); // סיום טעינה
        },
        error: (err) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        }
      });
  }

  
  // חיפוש עפ"י רכיבים
  searchByIngredients(): void {
    // ניקוי ערכים ריקים והמרה לאותיות קטנות
    const cleanIngredients = this.ingredientInputs
      .map(i => i.trim().toLowerCase())
      .filter(i => i.length > 0);

    // ולידציה: חייב להיות לפחות רכיב אחד
    if (cleanIngredients.length === 0) {
      Swal.fire('', 'נא להזין לפחות רכיב אחד', 'warning');
      return;
    }

    // הפעלת מצב טעינה
    this.isLoading.set(true);
    // איפוס הודעת שגיאה
    this.errorMessage.set('');
    // עדכון הפילטרים הנוכחיים
    this.filters.ingredients = cleanIngredients;
    // סימון חיפוש לפי רכיבים
    this.filters.usedIngredientSearch = true;
    //מיון עפי אחוזי התאמה
    this.sortOption = 'matchDesc';

    // הפעלת חיפוש לפי רכיבים
    this.recipeService.searchRecipesByIngredients(cleanIngredients, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.recipes.set(data); //  עדכון סיגנל רשימת המתכונים

          // ✅ מיון אוטומטי לפי match_score (מהגבוה לנמוך)
          this.applyClientSort(); // זה ימיין לפי matchDesc כי שינינו את sortOption

          this.isLoading.set(false); //  עדכון סיגנל סיום טעינה
        },
        error: (err) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * טעינת כל הרכיבים מהשרת
   */
  loadAllIngredients(): void {

    this.isLoadingIngredients = true;

    this.ingredientService.getAllIngredients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allIngredients = data;
          this.isLoadingIngredients = false;
        },
        error: (err) => {
          console.error('Failed to load ingredients:', err);
          this.isLoadingIngredients = false;
        }
      });
  }

  // קריאה זו מתבצעת כאשר אחד הפילטרים משתנה (ללא חיפוש לפי רכיבים)
  onFilterChange(): void {
    this.filters.usedIngredientSearch = false;
    this.fetchRecipes();
  }

  // איפוס כל הפילטרים
  resetAll(): void {
    this.recipeService.resetFilters();
    this.filters = this.recipeService.getCurrentFilters();
    this.ingredientInputs = [''];
    this.fetchRecipes();
  }

  // מיון מקומי בצד לקוח בלבד
  applyClientSort(): void {
    // לא משנים את המערך הקיים - אסור Signals ב- 
    // אלא מעדכנים אותו עם מערך חדש ממוין
    this.recipes.update((currentRecipes) => {
      // יוצרים עותק וממיינים אותו
      const sorted = [...currentRecipes].sort((a, b) => {
        switch (this.sortOption) {
          case 'timeAsc': return (a.prep_time || 999) - (b.prep_time || 999);
          case 'timeDesc': return (b.prep_time || 0) - (a.prep_time || 0);
          case 'ratingDesc': return (b.rating || 0) - (a.rating || 0);
          case 'matchDesc': return (b.match_score || 0) - (a.match_score || 0);
          case 'newest': default: return b.id - a.id;
        }
      });
      return sorted;
    });
  }

  

  // ניווט לעמוד פרטי מתכון
  viewDetails(id: number): void {
    this.router.navigate(['/recipe', id]);
  }

  // מחיקת מתכון (למנהל בלבד)
  deleteRecipe(id: number, event: Event): void {
    event.stopPropagation();

    Swal.fire({
      title: 'בטוח למחוק?',
      text: 'המתכון יימחק לצמיתות',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'כן, מחק',
      cancelButtonText: 'ביטול'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recipeService.deleteRecipe(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // ✅ עדכון הרשימה המקומית באמצעות Signal
              this.recipes.update(recipes => recipes.filter(r => r.id !== id));
              Swal.fire('נמחק!', 'המתכון הוסר בהצלחה.', 'success');
            },
            error: (err) => Swal.fire('שגיאה', err.message, 'error')
          });
      }
    });
  }

  // --- לוגיקת דירוג מתכון ---

  // הצגת דירוג בעת ריחוף
  setHover(id: number, star: number) { this.hoverRating[id] = star; }
  // הסרת ריחוף
  clearHover(id: number) { delete this.hoverRating[id]; }

  // דירוג מתכון
  rateRecipe(recipe: Recipe, score: number, event: Event): void {
    event.stopPropagation();
    if (!this.connectionStatusService.isLoggedIn()) {
      Swal.fire({
        title: '⭐ ...רגע לפני הדירוג',
        text: 'כדי לדרג מתכון, נא להתחבר או להירשם. זה ממש קצר!',
        icon: 'warning',
        iconColor: '#E65100',
        showCancelButton: true,
        confirmButtonColor: '#43A047',
        cancelButtonColor: '#d33',
        cancelButtonText: 'אולי בפעם אחרת',
        confirmButtonText: 'התחברות עכשיו',
      })
        .then((result) => {
          if (result.isConfirmed) {
            // שמירת הנתיב הנוכחי כדי לחזור אליו אחרי ההתחברות
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: this.router.url }
            });
          }
        });
      return;
    }

    this.ratingService.rateRecipe(recipe.id, score)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // עדכון האובייקט בתוך הסיגנל
          // מכיוון שאנחנו מעדכנים אובייקט בתוך מערך, אנגולר לא תמיד מזהה שינוי עמוק
          //כדי לרענן את הרשימה update לכן נשתמש ב
          this.recipes.update(currentRecipes => {
            const index = currentRecipes.findIndex(r => r.id === recipe.id);
            if (index !== -1) {
              // יוצרים עותק של המתכון עם הדירוג החדש
              const updatedRecipe = { ...currentRecipes[index], user_rating: score, rating: res.new_average };
              const newRecipes = [...currentRecipes];
              newRecipes[index] = updatedRecipe;
              return newRecipes;
            }
            return currentRecipes;
          });

          Swal.fire({ title: 'תודה!', text: 'הדירוג נשמר', icon: 'success', toast: true, position: 'top', timer: 1500, showConfirmButton: false });
        },
        error: () => Swal.fire('שגיאה', 'לא ניתן לדרג כרגע', 'error')
      });
  }


  /**
   * מופעל בכל פעם שהמשתמש מקליד באינפוט ספציפי
   * @param index - אינדקס השדה
   * @param value - הערך שהוקלד
   */
  onIngredientInputChange(index: number, value: string): void {

    this.ingredientInputs[index] = value;
    const searchText = value.trim();

    // הצג הצעות רק אם יש 2+ תווים
    if (searchText.length >= 2) {
      this.filteredSuggestions[index] = this.ingredientService.filterIngredients(
        this.allIngredients,
        searchText,
        6 // מקסימום 6 הצעות (כדי שלא יתפוס יותר מדי מקום)
      );
      this.showSuggestions[index] = this.filteredSuggestions[index].length > 0;
    } else {
      this.showSuggestions[index] = false;
    }
  }

  /**
   * בחירת הצעה מהרשימה הנפתחת
   * @param index - אינדקס השדה
   * @param ingredientName - שם הרכיב שנבחר
   */
  selectIngredientSuggestion(index: number, ingredientName: string): void {

    this.ingredientInputs[index] = ingredientName;
    this.showSuggestions[index] = false;

    // אם זה השדה האחרון והוא מלא, הוסף שדה חדש
    if (index === this.ingredientInputs.length - 1 && ingredientName.trim()) {
      this.addIngredientInput();
    }
  }

  /**
   * פונקציית עזר להדגשת טקסט בהצעות
   */
  highlightIngredientMatch(ingredientName: string, index: number): string {


    return this.ingredientService.highlightMatch(
      ingredientName,
      this.ingredientInputs[index]
    );
  }

  /**
   * סגירת רשימת ההצעות של שדה ספציפי
   */
  closeIngredientSuggestions(index: number): void {
    setTimeout(() => {
      this.showSuggestions[index] = false;
    }, 200);
  }


  // ---לוגיקת רכיבים ---

  // הוספת שדה רכיב נוסף
  addIngredientInput(): void {
    this.ingredientInputs.push('');
  }

  // הסרת שדה קלט של רכיב
  removeIngredientInput(index: number): void {
    if (this.ingredientInputs.length > 1) {
      this.ingredientInputs.splice(index, 1);
      if (this.filters.usedIngredientSearch) {
        this.searchByIngredients();
      }
    }
  }

  // עדכון ערך רכיב ספציפי
  updateIngredient(index: number, value: string): void {
    this.onIngredientInputChange(index, value);
    this.ingredientInputs[index] = value;
  }


  // -- לוגיקת UI עזר --
// פונקציית TrackBy למניעת re-render מיותר
  trackByIndex(index: number): number {
    return index;
  }

  //קריא UI  החזרת התווית של הרכיב האחרון בשביל
  get lastIngredientLabel(): string {
    const last = this.ingredientInputs[this.ingredientInputs.length - 1];
    return last && last.trim() ? `- ${last}` : '';
  }
}