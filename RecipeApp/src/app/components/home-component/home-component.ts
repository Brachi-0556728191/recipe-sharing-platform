import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RecipeService } from '../../services/recipe-service';
import { CommonModule } from '@angular/common';
import { IngredientSearcherComponent } from '../ingredient-searcher-component/ingredient-searcher-component';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [
    CommonModule,           // *ngFor, *ngIf וכו'
    RouterLink,            // [routerLink]
    IngredientSearcherComponent  // הקומפוננטה הילדה
  ],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {

  constructor(
    private recipeService: RecipeService,
    private router: Router,
  ) { }

  // רשימת קטגוריות עם האייקונים וה-ID התואם לצד השרת שלך
  categories = [
    // { id: 0, name: 'מנות עיקריות', icon: '🍗' },
    // { id: 0, name: 'תוספות', icon: '🍝' },
    { id: 2, name: 'קינוחים', icon: '🧁' },
    { id: 3, name: 'עוגות', icon: '🎂' },
    { id: 4, name: 'עוגיות', icon: '🍪' },
    { id: 5, name: 'סלטים', icon: '🥗' },
    { id: 6, name: 'מרקים', icon: '🥣' },
    { id: 7, name: 'לחמים', icon: '🥖' },
    { id: 8, name: 'גלידות', icon: '🍨' },
    { id: 9, name: 'פשטידות', icon: '🥧' }
  ];

  // מהילד - ציבורי לכולם Output פונקציה שמקבלת את ה    
  handleIngredientSearch(ingredients: string[]) {
    // שמירת הפילטרים בסרוויס (כדי שדף המתכונים יידע מה לחפש)
    this.recipeService.updateFilters({
      ingredients: ingredients,
      usedIngredientSearch: true,
      kashrut: 'all',
      category: 'all',
      maxTime: 180,
      minRating: 0
    });
    // לא בדיקת התחברות!
    this.router.navigate(['/recipes']);
  }

  // ✅ סינון מהיר לפי קטגוריה - ציבורי לכולם
  filterByCategory(catId: number) {
    this.recipeService.updateFilters({
      category: catId.toString(),
      kashrut: 'all',
      maxTime: 180,
      minRating: 0
    });

    // ניווט לדף המתכונים - ללא בדיקת התחברות!
    this.router.navigate(['/recipes']);
  }

  // ✅ מעבר לדף המתכונים - ציבורי לכולם
  goRecipesPage() {
    // ניווט לדף המתכונים - ללא בדיקת התחברות!
    this.router.navigate(['/recipes']);
  }
}
