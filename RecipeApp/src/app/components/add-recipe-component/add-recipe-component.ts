import { Component, OnInit, signal } from '@angular/core'; // ייבוא מחלקות בסיסיות של Angular
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'; // ייבוא מחלקות לטיפול בטפסים ריאקטיביים (Reactive Forms)
import { Router } from '@angular/router'; // ייבוא Router לניווט לאחר הוספה מוצלחת
import { RecipeService } from '../../services/recipe-service'; // ייבוא סרוויס מותאם אישית לטיפול ב-API של מתכונים (נניח שהוא קיים)
import { RECIPE_CONSTANTS, KASHRUT_LABELS, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../constants/recipe.constants'; // ייבוא קבועים מותאמים אישית
import { VALIDATION_MESSAGES } from '../../constants/validation-messages-add-recipe';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-recipe-component',
  standalone: true,
  imports: [
    CommonModule,           // *ngFor, *ngIf
    ReactiveFormsModule,    // [formGroup], formControlName
    FormsModule
  ],
  templateUrl: './add-recipe-component.html',
  styleUrl: './add-recipe-component.css',
})
export class AddRecipeComponent implements OnInit {
  //הטופס הראקטיבי - מכיל את כל שדות המתכון
  //מתאימים Validators עם initForm() נוצר ב  
  recipeForm!: FormGroup;

  //תמונות 
  mainImageFile: File | null = null;//קובץ תמונה שנבחרים ע"י המשתמש 
  imagePreviewUrl = signal<string>('');//נתיב לתצוגה מקדימה של התמונה

  //רכיבים (Ingredients)
  //כל רכיב מכיל: שם, כמות, יחידת מידה
  ingredients: { name: string; amount: number; unit: string }[] = [];
  newIngredientName: string = '';
  ingredientErrors: { [key: number]: string } = {}; // שגיאות לכל רכיב
  //הודעות למשתמש 
  successMessage: string = '';
  errorMessage: string = '';
  isSubmitting: boolean = false;//האם הטופס בתהליך שליחה לשרת, true = מציג spinner וניטרול הכפתורים 

  //שגיאות לשדות הבודדים 
  fieldErrors: { [key: string]: string } = {};

  // אפשרויות לרשימות הנפתחות (Options)
  kashrutOptions = Object.entries(KASHRUT_LABELS);
  categoryOptions = Object.entries(CATEGORY_LABELS);
  difficultyOptions = Object.entries(DIFFICULTY_LABELS);

  //  (Switch מילון הודעות שגיאה (במקום 
  private readonly validationMessages = VALIDATION_MESSAGES.recipe as Record<string, Record<string, string>>;;

  // הסבר מפורט יותר בקובץ טקסט של הקומפוננטה - Subject לניהול מחזור חיים של הקומפוננטה
  private destroy$ = new Subject<void>();



  constructor(
    private fb: FormBuilder,
    private router: Router,
    private recipeService: RecipeService
  ) { }

  //רץ פעם אחת כשהקומפוננטה נטענת
  //כאן אנחנו מאתחלים את הטופס
  ngOnInit(): void {
    this.initForm();
  }

  /**
 * רץ כשהקומפוננטה נהרסת (לדוגמה: המשתמש עבר לדף אחר)
 * כאן אנחנו מנקים משאבים למניעת Memory Leaks
 */
  ngOnDestroy(): void {
    // 1. שלח איות שהקומפוננטה נהרסת
    this.destroy$.next();
    // 2. סיים את ה-Subject (best practice)
    this.destroy$.complete();
    // 3. נקה את ה-URL של התמונה (למניעת Memory Leak)
    // URL.createObjectURL יוצר URL זמני בזיכרון
    // אם לא נקרא ל-revokeObjectURL, הזיכרון לא משוחרר
    if (this.imagePreviewUrl()) {
      URL.revokeObjectURL(this.imagePreviewUrl());
    }
  }


  // 1️⃣ אתחול הטופס
  initForm(): void {
    // יצירת הטופס עם שדות וולידציה
    this.recipeForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(RECIPE_CONSTANTS.TITLE_MAX_LENGTH)]],
      description: [''],
      servings: ['', Validators.min(RECIPE_CONSTANTS.SERVINGS_MIN)],//חובה ומינימום מנה 1
      preparation_time: ['', [Validators.required, Validators.min(RECIPE_CONSTANTS.SERVINGS_MIN)]],// חובה ומינימום דקה
      kashrut: [RECIPE_CONSTANTS.DEFAULT_KASHRUT, Validators.required],
      category: [RECIPE_CONSTANTS.DEFAULT_CATEGORY, Validators.required],
      difficulty: [RECIPE_CONSTANTS.DEFAULT_DIFFICULTY, Validators.required],
      instructions: ['', Validators.required],
      notes: [''],
    });
  }

  // 2️⃣ בדיקת שדה בודד (Field Validation)

  // 2️⃣ בדיקת שדה בודד - ✅ נקודה 3: עם Map במקום Switch
  checkField(fieldName: string): void {
    //קבל את ה FormControl של השדה
    const control = this.recipeForm.get(fieldName);
    //ניקוי הודעת השגיאה קודמת
    this.fieldErrors[fieldName] = '';

    // אם השדה לא נגע או לא קיים - לא בודקים
    if (!control || !control.touched) return;

    // טיפול מיוחד לתמונה (לא חלק מהטופס  הראקטיבי)
    if (fieldName === 'mainImage') {
      if (!this.mainImageFile) {
        this.fieldErrors['mainImage'] = this.validationMessages['mainImage']['required'];;
      }
      return;
    }

    // לולאה על כל השגיאות האפשריות
    const fieldMessages = this.validationMessages[fieldName];
    if (!fieldMessages) return;

    for (const [errorType, message] of Object.entries(fieldMessages)) {
      if (control.hasError(errorType)) {
        this.fieldErrors[fieldName] = message;
        return;
      }
    }
  }

  // 3️⃣ טיפול בתמונה
  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList = element.files;

    if (fileList && fileList.length > 0) {
      this.mainImageFile = fileList[0];
      this.fieldErrors['mainImage'] = '';
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(this.mainImageFile);
    } else {
      this.mainImageFile = null;
      this.imagePreviewUrl.set('');
    }
  }

  // הסרת תמונה
  removeImage(): void {
    this.mainImageFile = null;
    this.imagePreviewUrl.set('');
    // איפוס ה-input file
    const fileInput = document.getElementById('main_image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // 4️⃣ ניהול רכיבים (Ingredients) - עם בדיקות תקינות

  /**
   * הוסף רכיב חדש
   * בדיקה: שם הרכיב חייב להיות לא ריק
   */
  addIngredient(): void {
    if (this.newIngredientName.trim()) {
      this.ingredients.push({
        name: this.newIngredientName.trim(),
        amount: 0,
        unit: ''
      });
      this.newIngredientName = '';
      // מנקה שגיאות אחרי הוספה
      this.validateIngredients();
    }
  }

  /**
   * הסר רכיב לפי אינדקס
   */
  removeIngredient(index: number): void {
    this.ingredients.splice(index, 1);
    // מנקה את שגיאת הרכיב
    delete this.ingredientErrors[index];
    // מעדכן את הוולידציה של יתר הרכיבים
    this.validateIngredients();
  }

  /**
   * בדוק את כל הרכיבים
   * כל רכיב חייב להיות בעל: שם, כמות > 0, ויחידת מידה
   */
  validateIngredients(): void {
    this.ingredientErrors = {};

    for (let i = 0; i < this.ingredients.length; i++) {
      const ing = this.ingredients[i];
      const errors: string[] = [];

      // בדיקה: שם רכיב
      if (!ing.name || !ing.name.trim()) {
        errors.push('שם רכיב חסר');
      }

      // בדיקה: כמות
      if (ing.amount == null || ing.amount <= 0) {
        errors.push('כמות חייבת להיות מעל 0');
      }

      // בדיקה: יחידת מידה
      if (!ing.unit || !ing.unit.trim()) {
        errors.push('יחידת מידה חסרה');
      }

      // אם יש שגיאות, שמור אותן
      if (errors.length > 0) {
        this.ingredientErrors[i] = errors.join(', ');
      }
    }
  }
  /**
   * בדיקה האם יש שגיאות ברכיבים
   * משמשת בכפתור Submit כדי לדעת אם לתקוף את הבדיקות
   */
  hasIngredientErrors(): boolean {
    return Object.keys(this.ingredientErrors).length > 0;
  }

  // 5️⃣ שליחת הטופס (Submit)

  /**
   * שליחת הטופס:
   * 1. בדיקת כל השדות החיוביים
   * 2. בדיקת התמונה
   * 3. בדיקת הרכיבים
   * 4. שליחה לשרת
   */
  onSubmit(): void {
    // ניקוי הודעות קודמות
    this.errorMessage = '';
    this.successMessage = '';

    // בדיקת כל השדות
    this.checkField('title');
    this.checkField('preparation_time');
    this.checkField('instructions');
    this.checkField('kashrut');
    this.checkField('category');
    this.checkField('difficulty');
    this.checkField('mainImage');

    // בדיקת רכיבים
    this.validateIngredients();

    // בדיקה 1: שדות חיוביים לא תקינים
    const hasFieldErrors = Object.values(this.fieldErrors).some(msg => msg.length > 0);
    if (hasFieldErrors || this.recipeForm.invalid) {
      this.errorMessage = '❌ יש שדות לא תקינים בטופס. בדוק את השדות המסומנים *.';
      return;
    }

    // בדיקה 2: תמונה חסרה
    if (!this.mainImageFile) {
      this.errorMessage = '❌ יש להעלות תמונה ראשית';
      return;
    }

    // בדיקה 3: לא הוסיפו רכיבים
    if (this.ingredients.length === 0) {
      this.errorMessage = '❌ יש להוסיף לפחות רכיב אחד';
      return;
    }

    // בדיקה 4: רכיבים לא תקינים
    if (this.hasIngredientErrors()) {
      this.errorMessage = '❌ כמה רכיבים חסרים נתונים. תקן אותם לפני הוספת המתכון.';
      return;
    }

    // כל הבדיקות עברו! שלח לשרת
    this.isSubmitting = true;
    // הכנת הנתונים לשליחה
    const formData = new FormData();
    formData.append(
      'data',
      JSON.stringify({
        ...this.recipeForm.value,
        ingredients: this.ingredients
      })
    );
    formData.append('image', this.mainImageFile);

    // שלב 5: שליחה לשרת עם ניקוי אוטומטי    
    this.recipeService.addRecipe(formData)
      //  takeUntil: מבטל את ה-subscription אם הקומפוננטה נהרסת
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        // הצלחה 🎉
        next: (response) => {
          this.successMessage = '✅ המתכון נוסף בהצלחה! מעביר אתכם לעמוד המתכונים...';

          // עבור לעמוד המתכונים אחרי שנייה
          setTimeout(() => {
            this.router.navigate(['/recipes']);
          }, RECIPE_CONSTANTS.SUCCESS_MESSAGE_DURATION);
        },

        // שגיאה ❌
        error: (err) => {
          this.isSubmitting = false;  // הסתר spinner

          // נסה לחלץ הודעת שגיאה מהשרת
          const errorMsg = err.error?.message || err.error?.errors || 'שגיאה בהוספת המתכון';

          // הצג הודעת שגיאה
          this.errorMessage = typeof errorMsg === 'string'
            ? '❌ ' + errorMsg
            : '❌ שגיאה בהוספת המתכון: ' + JSON.stringify(errorMsg);
        }
      });
  }
}