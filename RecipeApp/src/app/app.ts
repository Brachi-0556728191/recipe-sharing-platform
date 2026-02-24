import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionStatusService } from './services/connection-status-service'
// import { CommonModule } from '@angular/common';
import { NavBarComponent } from './components/nav-bar-component/nav-bar-component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [
    RouterOutlet,        // מאפשר ניתוב דינמי
    NavBarComponent      // סרגל ניווט
  ],
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  // protected readonly title = signal('RecipeApp');
  //Constructor - הזרקת Services
  constructor(
    private connectionStatusService: ConnectionStatusService,
  ) { }
  // בכל פעם שהאפליקציה נטענת, בדוק סטטוס התחברות
  ngOnInit(): void {

    console.log('🚀 App initialized');
    //  אם אתה רוצה להאזין לשינויים במשתמש בזמן אמת
    // Observable הוא currentUser$
    // כל שינוי במשתמש → מגיע לכאן
    // גלובלי listener זה
    this.connectionStatusService.currentUser$.subscribe(user => {
      if (user) {
        console.log('👤 Current user updated:', user.username, 'Role:', user.role);
      } else {
        console.log('👤 Current user cleared');
      }
    });
  }
}
