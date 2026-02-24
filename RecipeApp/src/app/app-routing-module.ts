// import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register';
import { LoginComponent } from './components/login/login';
import { AddRecipeComponent } from './components/add-recipe-component/add-recipe-component';
import { RecipeListComponent } from './components/recipe-list-component/recipe-list-component';
import { RecipeDetailsComponent } from './components/recipe-details-component/recipe-details-component';
import { ProfileComponent } from './components/profile-component/profile-component';
import { AdminComponent } from './components/admin-component/admin-component';
import { HomeComponent } from './components/home-component/home-component';
import { EditRecipeComponent } from './components/edit-recipe-component/edit-recipe-component';

import { AuthGuard } from './guards/auth_guard';
import { RoleGuard } from './guards/role_guard';



export const routes: Routes = [
  // ✅ ניתובים ציבוריים (ללא הגנה) - כולם יכולים לגשת
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'recipes', component: RecipeListComponent },
  { path: 'recipe/:id', component: RecipeDetailsComponent},

  
  // ✅ ניתובים מוגנים - רק למשתמשים מחוברים
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]  
  },
  
  // ✅ ניתובים מוגנים - רק למשתמשי תוכן ומעלה
  {
    path: 'addRecipe',
    component: AddRecipeComponent,
    canActivate: [RoleGuard],
    data: { minRole: 2 }  
  },
  {
    path: 'edit-recipe/:id',
    component: EditRecipeComponent,
    canActivate: [RoleGuard],
    data: { minRole: 2 }  
  },
  
  // ✅ ניתובים מוגנים - רק למנהלים
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [RoleGuard],
    data: { minRole: 3 } 
  },
  
  // ניתוב ברירת מחדל
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];
