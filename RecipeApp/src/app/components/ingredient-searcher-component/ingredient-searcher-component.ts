import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientService } from '../../services/ingredient-service';
import { IngredientItem } from '../../models/ingredient';

@Component({
  selector: 'app-ingredient-searcher-component',
  standalone: true,
  imports: [
    CommonModule,    // *ngFor
    FormsModule      // [(ngModel)]
  ],
  templateUrl: './ingredient-searcher-component.html',
  styleUrl: './ingredient-searcher-component.css'
})
export class IngredientSearcherComponent implements OnInit {

  @Input() titleText: string = 'מה יש לך במקרר?'; // קבלת טקסט מהאבא
  @Output() search = new EventEmitter<string[]>(); // שליחת נתונים לאבא

  currentIngredient: string = ''; //הטקסט שהמשתמש מקליד כרגע
  ingredients: string[] = []; //רשימת הרכיבים שנבחרו


  allIngredients: IngredientItem[] = []; // כל הרכיבים מהמערכת
  filteredSuggestions: IngredientItem[] = []; // הצעות מסוננות
  showSuggestions: boolean = false;      // האם להציג את הרשימה הנפתחת
  isLoading: boolean = false;            // טעינה ראשונית

  constructor(private ingredientService: IngredientService) { }

  ngOnInit(): void {
    // טעינת כל הרכיבים פעם אחת בלבד
    this.loadAllIngredients();
  }

  //טעינת כל הרכיבים מהשרת
  // מתבצעת פעם אחת בעת טעינת הקומפוננטה
  loadAllIngredients(): void {
    this.isLoading = true;

    this.ingredientService.getAllIngredients().subscribe({
      next: (data) => {
        this.allIngredients = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load ingredients:', err);
        this.isLoading = false;
      }
    });
  }


  //מופעל בכל פעם שהמשתמש מקליד באינפוט
  // מסנן את ההצעות לפי הטקסט שהוקלד

  onInputChange(): void {
    const searchText = this.currentIngredient.trim();

    // אם יש לפחות 2 תווים, הצג הצעות
    if (searchText.length >= 2) {
      this.filteredSuggestions = this.ingredientService.filterIngredients(
        this.allIngredients,
        searchText,
        8 // מקסימום 8 הצעות
      );
      this.showSuggestions = this.filteredSuggestions.length > 0;
    } else {
      // פחות מ-2 תווים - סגור את הרשימה
      this.showSuggestions = false;
    }
  }


  // בחירת רכיב מהרשימה הנפתחת
  /// @param ingredientName - שם הרכיב שנבחר

  selectSuggestion(ingredientName: string): void {
    this.currentIngredient = ingredientName;
    this.showSuggestions = false;
    this.addIngredient();
  }

 //הוספת רכיב לרשימת הסינון (Enter או לחיצה על כפתור +) 
  addIngredient(): void {
    const trimmed = this.currentIngredient.trim();
    
    if (trimmed && !this.ingredients.includes(trimmed)) {
      this.ingredients.push(trimmed);
      this.currentIngredient = '';
      this.showSuggestions = false;
    }
  }

  
  // הסרת רכיב מהרשימה
  removeIngredient(index: number): void {
    this.ingredients.splice(index, 1);
  }

  /**
   * שיגור אירוע החיפוש להורה
   */
  triggerSearch(): void {
    if (this.ingredients.length > 0) {
      this.search.emit(this.ingredients);
    } else {
      alert('נא להוסיף לפחות מוצר אחד');
    }
  }

  /**
   * פונקציית עזר להדגשת טקסט בהצעות
   * @param ingredientName - שם הרכיב
   * @returns HTML עם הדגשה
   */
  highlightMatch(ingredientName: string): string {
    return this.ingredientService.highlightMatch(
      ingredientName, 
      this.currentIngredient
    );
  }

  /**
   * סגירת הרשימה הנפתחת כשלוחצים מחוץ לה
   */
  closeSuggestions(): void {
    // השהייה קטנה כדי לאפשר לחיצה על הצעה
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }
}
