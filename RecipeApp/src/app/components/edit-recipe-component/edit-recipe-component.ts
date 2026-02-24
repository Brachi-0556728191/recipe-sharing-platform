import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // ActivatedRoute חשוב לקבלת ה-ID
import { RecipeService } from '../../services/recipe-service';
import { RECIPE_CONSTANTS, KASHRUT_LABELS, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../constants/recipe.constants'; // ייבוא קבועים מותאמים אישית
import { VALIDATION_MESSAGES } from '../../constants/validation-messages-add-recipe';// ייבוא הודעות וולידציה
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-recipe-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './edit-recipe-component.html',
  styleUrl: './edit-recipe-component.css',
})
export class EditRecipeComponent {

  recipeForm!: FormGroup; // הטופס 
  recipeId!: number; // מזהה המתכון שאנחנו עורכים

  // משתנים למילוי הטופס

  //תמונות 
  currentImageUrl: string | null = null; // להצגת התמונה הקיימת  
  mainImageFile: File | null = null; // קובץ תמונה חדש אם נבחר
  imagePreviewUrl = signal<string>('');// תצוגה מקדימה של התמונה החדשה

  // רכיבים 
  ingredients: { name: string; amount: number; unit: string }[] = [];
  newIngredientName: string = '';
  ingredientErrors: { [key: number]: string } = {};

  // הודעות 
  successMessage: string = '';
  errorMessage: string = '';
  isSubmitting: boolean = false;

  isLoading: boolean = true; // האם אנחנו עדיין טוענים את המידע מהשרת?

  fieldErrors: { [key: string]: string } = {};
  private readonly validationMessages = VALIDATION_MESSAGES.recipe as Record<string, Record<string, string>>;   // הודעות וולידציה

  // המרת הקבועים למערכים עבור ה-Select ב-HTML
  kashrutOptions = Object.entries(KASHRUT_LABELS);
  categoryOptions = Object.entries(CATEGORY_LABELS);
  difficultyOptions = Object.entries(DIFFICULTY_LABELS);

  private destroy$ = new Subject<void>(); // לניקוי מנויים

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute, // הזרקת ה-Route
    private recipeService: RecipeService
  ) { }

  ngOnInit(): void {
    this.initForm();

    // 1. קבלת ה-ID מהכתובת (URL)
    this.route.params
      .pipe(takeUntil(this.destroy$))  //ניקוי אוטומטי
      .subscribe(params => {
        // המר את ה-ID מ-string ל-number (ה-'+' עושה את זה)
        this.recipeId = +params['id'];
        if (this.recipeId) {
          // טען את המתכון מהשרת
          this.loadRecipeData(this.recipeId);
        }
      });
  }

  ngOnDestroy(): void {
    // ניקוי subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // ניקוי תצוגה מקדימה
    if (this.imagePreviewUrl()) {
      URL.revokeObjectURL(this.imagePreviewUrl());
    }

    // ניקוי תמונה נוכחית (אם יש)
    if (this.currentImageUrl && this.currentImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentImageUrl);
    }
  }

  //loadRecipeData() אתחול הטופס עם שדות וולידציה - יוצר טופס ריק הנתונים ייתמלאו ב 
  initForm(): void {
    this.recipeForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      servings: ['', Validators.min(1)],
      preparation_time: ['', [Validators.required, Validators.min(1)]],
      kashrut: [null, Validators.required],
      category: [null, Validators.required],
      difficulty: [null, Validators.required],
      instructions: ['', Validators.required],
      notes: [''],
    });
  }

  // טעינת המידע מהשרת ומילוי הטופס
  loadRecipeData(id: number) {
    this.recipeService.getRecipeById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // מילוי שדות הטופס
          this.recipeForm.patchValue({
            title: data.title,
            description: data.description,
            servings: data.servings,
            preparation_time: data.prep_time,
            kashrut: data.kashrut.toString(),
            category: data.category.toString(),
            difficulty: data.difficulty.toString(),
            instructions: data.instructions,
            notes: data.notes
          });

          // מילוי הרכיבים
          this.ingredients = data.ingredients;

          // שמירת התמונה הנוכחית להצגה
          this.currentImageUrl = data.main_image_url || null;

          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'שגיאה בטעינת המתכון לעריכה';
          this.isLoading = false;
        }
      });
  }



  // --- AddRecipe כל הפונקציות מתחת זהות כמעט לחלוטין ל  ---

  //  בדיקת שדה בודד 
  checkField(fieldName: string): void {
    const control = this.recipeForm.get(fieldName);
    this.fieldErrors[fieldName] = '';

    if (!control || !control.touched) return;

    const fieldMessages = this.validationMessages[fieldName];
    if (!fieldMessages) return;

    for (const [errorType, message] of Object.entries(fieldMessages)) {
      if (control.hasError(errorType)) {
        this.fieldErrors[fieldName] = message;
        return;
      }
    }
  }

  //  טיפול בתמונה
  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList = element.files;
    if (fileList && fileList.length > 0) {
      this.mainImageFile = fileList[0];
      this.currentImageUrl = null; // ברגע שנבחר חדש, נפסיק להציג את הישן
      // הצג תצוגה מקדימה של החדשה
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(this.mainImageFile);
    }
  }

  //מסיר תמונה חדשה שנבחרה
  //מחזיר להצגת התמונה הישנה
  removeNewImage(): void {
    this.mainImageFile = null;
    this.imagePreviewUrl.set('');

    const fileInput = document.getElementById('main_image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // הוספה והסרה של רכיבים
  addIngredient(): void {
    if (this.newIngredientName.trim()) {
      this.ingredients.push({ name: this.newIngredientName.trim(), amount: 0, unit: '' });
      this.newIngredientName = '';
      this.validateIngredients();
    }
  }

  removeIngredient(index: number): void {
    this.ingredients.splice(index, 1);
    delete this.ingredientErrors[index];
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
      if (!ing.name || !ing.name.trim()) { errors.push('שם רכיב חסר'); }
      // בדיקה: כמות
      if (ing.amount == null || ing.amount <= 0) { errors.push('כמות חייבת להיות מעל 0'); }
      // בדיקה: יחידת מידה
      if (!ing.unit || !ing.unit.trim()) { errors.push('יחידת מידה חסרה'); }
      // אם יש שגיאות, שמור אותן
      if (errors.length > 0) { this.ingredientErrors[i] = errors.join(', '); }
    }
  }

  // בדיקה אם יש שגיאות ברכיבים
  hasIngredientErrors(): boolean {
    return Object.keys(this.ingredientErrors).length > 0;
  }


  // שליחת הטופס המעודכן לשרת
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // ולידציות (זהה להוספה, מלבד התמונה)
    // בעריכה - התמונה לא חובה! אם לא מעלים, נשארת הישנה.
    this.checkField('title');
    this.checkField('preparation_time');
    this.checkField('instructions');
    this.checkField('kashrut');
    this.checkField('category');
    this.checkField('difficulty');
    this.validateIngredients();

    if (this.recipeForm.invalid || this.hasIngredientErrors()) {
      this.errorMessage = 'יש שדות לא תקינים';
      return;
    }

    const hasFieldErrors = Object.values(this.fieldErrors).some(msg => msg.length > 0);
    if (hasFieldErrors || this.recipeForm.invalid) {
      this.errorMessage = '❌ יש שדות לא תקינים בטופס. בדוק את השדות המסומנים *.';
      return;
    }
    // בדיקה :  מחקו רכיבים
    if (this.ingredients.length === 0) {
      this.errorMessage = '❌ יש להוסיף לפחות רכיב אחד';
      return;
    }
    // בדיקה : רכיבים לא תקינים
    if (this.hasIngredientErrors()) {
      this.errorMessage = '❌ כמה רכיבים חסרים נתונים. תקן אותם לפני הוספת המתכון.';
      return;
    }

    this.isSubmitting = true;


    // הכנת הנתונים לשליחה
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      ...this.recipeForm.value,
      ingredients: this.ingredients
    }));

    // הוספת תמונה רק אם נבחרה חדשה!
    if (this.mainImageFile) {
      formData.append('image', this.mainImageFile);
    }

    // קריאה ל-updateRecipe במקום addRecipe
    this.recipeService.updateRecipe(this.recipeId, formData)
      .pipe(takeUntil(this.destroy$))  //ניקוי אוטומטי
      .subscribe({
        next: () => {
          this.successMessage = 'המתכון עודכן בהצלחה!';
          setTimeout(() => this.router.navigate(['/profile']), 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = 'שגיאה בעדכון: ' + (err.error?.message || err.message);
        }
      });
  }
}
