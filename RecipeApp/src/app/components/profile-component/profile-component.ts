import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {ProfileService} from '../../services/profile-service'
import { RecipeService } from '../../services/recipe-service';
import { User } from '../../models/User';
import { Recipe } from '../../models/Recipe';
import { getKashrutLabel, getCategoryLabel, getDifficultyLabel } from '../../utils/recipe_labels';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-component',
  standalone: true,
  imports:[
    CommonModule
  ],
  templateUrl: './profile-component.html',
  styleUrl: './profile-component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {

  user: User | null = null;
  userRecipes = signal<Recipe[]>([]);
  requestSent: boolean = false;
  errorMessage: string = '';

  //פונקציות המרה כשרות, דרגת קושי וקטגוריה (מקובץ utils / recipe_labels.ts)
  getKashrutLabel = getKashrutLabel;
  getCategoryLabel = getCategoryLabel;
  getDifficultyLabel = getDifficultyLabel;

  private destroy$ = new Subject<void>();



  constructor(
    private profileService: ProfileService,
    private recipeService: RecipeService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}


  // טעינת פרופיל המשתמש
  loadProfile() {
    this.profileService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          this.user = user;
          this.loadUserRecipes();
        },
        error: (err) => {
          console.error('Error loading profile', err);
          this.errorMessage = 'שגיאה בטעינת פרופיל המשתמש';
        }
      });
  }

  // טעינת מתכוני המשתמש
  loadUserRecipes() {
    if (!this.user || !this.user.id) return;

    this.recipeService.getAllRecipes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recipes: Recipe[]) => {
          this.userRecipes.set(recipes.filter( r => r.user_id === this.user?.id));
        },
        error: (err) => {
          console.error('Error fetching user recipes', err);
          this.errorMessage = 'לא הצלחנו לטעון את המתכונים שלך';
        }
      });
  }

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
        this.recipeService.deleteRecipe(id).subscribe({
          next: () => {
            this.userRecipes.set(this.userRecipes().filter(r => r.id !== id));
            Swal.fire('נמחק!', 'המתכון הוסר בהצלחה.', 'success');
          },
          error: (err) => Swal.fire('שגיאה', err.message, 'error')
        });
      }
    });
  }

  // שליחת בקשה לתפקיד יוצר תוכן
  requestContentRole() {
    if (!this.user) return;

    this.profileService.requestContentRole(this.user.id).subscribe({
      next: () => {
        this.requestSent = true;
        // רענון המידע בפרופיל כדי להציג את השינוי
        this.ngOnInit();
      },
      error: (err) => {
        console.error('Error sending request', err);
        this.errorMessage = 'שגיאה בשליחת הבקשה. נסה שוב מאוחר יותר.';
      }
    });
  }

  // ניווט לדף פרטי המתכון
  viewDetails(recipeId: number): void {
    this.router.navigate(['/recipe', recipeId]);
  }

  // ניווט לדף הוספת מתכון
  goToAddRecipe() {
    this.router.navigate(['/addRecipe']);
  }

  // של המתכון id ניווט לדף עריכת המתכון עם ה 
  editRecipe(recipeId: number) {
    this.router.navigate(['/edit-recipe', recipeId]);
  }
}


