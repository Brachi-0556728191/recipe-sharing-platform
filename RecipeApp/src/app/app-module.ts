// import { APP_INITIALIZER, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { AppRoutingModule } from './app-routing-module';
// import { App } from './app';

// // --- ייבוא חובה: מאפשר בקשות HTTP (שיחה עם Flask) ---
// import { HttpClientModule } from '@angular/common/http';
// // --- ייבוא חובה: מאפשר שימוש בטפסים (Forms) ---
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { firstValueFrom } from 'rxjs';



// import { LoginComponent } from './components/login/login';
// import { RegisterComponent } from './components/register/register';
// import { AddRecipeComponent } from './components/add-recipe-component/add-recipe-component';
// import { RecipeListComponent } from './components/recipe-list-component/recipe-list-component';
// import { RecipeDetailsComponent } from './components/recipe-details-component/recipe-details-component';
// import { ConnectionStatusService } from './services/connection-status-service';
// import { ProfileComponent } from './components/profile-component/profile-component';
// import { AdminComponent } from './components/admin-component/admin-component';
// import { HomeComponent } from './components/home-component/home-component';
// import { NavBarComponent } from './components/nav-bar-component/nav-bar-component';
// import { IngredientSearcherComponent } from './components/ingredient-searcher-component/ingredient-searcher-component';
// import { EditRecipeComponent } from './components/edit-recipe-component/edit-recipe-component';

// /**
//  * APP_INITIALIZER function
//  * ------------------------
//  * מטרת הפונקציה:
//  * לבדוק בעת עליית האפליקציה האם קיימת התחברות פעילה בשרת (Session)
//  * 
//  * שלבי עבודה:
//  * 1. בדיקה האם יש משתמש כבר בזיכרון (BehaviorSubject)
//  * 2. אם אין – קריאה לשרת לבדוק Session
//  * 3. אם השרת מחזיר משתמש – שמירה בזיכרון
//  * 4. בכל מקרה – החזרת Promise resolved כדי לא לחסום את Angular
//  * 
//  * @param connectionStatusService שירות שמנהל את מצב המשתמש
//  * @returns פונקציה שמחזירה Promise (Angular מחכה לה לפני Bootstrap)
//  */
// export function initializeApp(connectionStatusService: ConnectionStatusService) {
//   return async () => {
//     console.log('🔄 [APP_INITIALIZER] Initializing app...');

//     // שלב 1: בדיקה האם כבר יש משתמש בזיכרון
//     const existingUser = connectionStatusService.getCurrentUser();
//     if (existingUser) {
//       console.log('✅ [APP_INITIALIZER] User already in memory:', existingUser.username);
//       return;
//     }

//     // שלב 2: בדיקה מול השרת (Session)
//     try {
//       const response = await firstValueFrom(
//         connectionStatusService.checkConnectionStatus()
//       );

//       if (response?.logged_in) {
//         console.log('✅ [APP_INITIALIZER] User logged in on server:', response.username);
//         connectionStatusService.setCurrentUser(response);
//       } else {
//         console.log('❌ [APP_INITIALIZER] User not logged in');
//       }

//     } catch (error) {
//       console.error('❌ [APP_INITIALIZER] Error checking user status:', error);
//       // לא חוסמים את עליית האפליקציה
//     }
//   };
// }


// //  * מודול זה משמש כ"מכונת הרכבה" של האפליקציה:
// //  * - מגדיר את הקומפוננטות
// //  * - מייבא מודולים חיצוניים
// //  * - מגדיר את ה-Providers (שירותים)

// @NgModule({
//   declarations: [
//     App,                       
//     LoginComponent,                    
//     RegisterComponent,                   
//     AddRecipeComponent,           
//     RecipeListComponent,
//     RecipeDetailsComponent,
//     ProfileComponent,
//     AdminComponent,
//     HomeComponent,
//     NavBarComponent,
//     IngredientSearcherComponent,
//     EditRecipeComponent,         
//   ],
//   //imports: מודולים חיצוניים שהאפליקציה צריכה
//   imports: [
//     BrowserModule,//מודול בסיסי לריצת Angular בדפדפן
//     AppRoutingModule,//מודול הניתובים (הרכבה של כל הנתיבים
//     HttpClientModule,//מודול להתקשורת HTTP עם השרת
//     FormsModule,//מודול עבור Template-Driven Forms
//     ReactiveFormsModule, // מודול שמכיל את FormBuilder ואת הדירקטיבות formGroup, formControlName
//   ],
//   //providers: שירותים וקונפיגורציות גלובליות
//   providers: [
//     /// 🔄 APP_INITIALIZER: מעומד ה-Bootstrap של Angular
//     // זה אומר לאנגולר: "לפני שתעלה את האפליקציה, הרץ את initializeApp"
//     {
//       provide: APP_INITIALIZER,
//       useFactory: initializeApp,
//       deps: [ConnectionStatusService],
//       multi: true
//     }
//   ],
//   bootstrap: [App]
// })
// export class AppModule { }
