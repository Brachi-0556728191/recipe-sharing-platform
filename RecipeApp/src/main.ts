// import { platformBrowser } from '@angular/platform-browser';
// import { AppModule } from './app/app-module';

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { App } from './app/app';
import { routes } from './app/app-routing-module';
import { ConnectionStatusService } from './app/services/connection-status-service';


// platformBrowser().bootstrapModule(AppModule, {
  
// })
//   .catch(err => console.error(err));


export function initializeApp(connectionStatusService: ConnectionStatusService) {
  return async () => {
    console.log('🔄 [APP_INITIALIZER] Initializing app...');

    const existingUser = connectionStatusService.getCurrentUser();
    if (existingUser) {
      console.log('✅ [APP_INITIALIZER] User already in memory:', existingUser.username);
      return;
    }

    try {
      const response = await firstValueFrom(
        connectionStatusService.checkConnectionStatus()
      );

      if (response?.logged_in) {
        console.log('✅ [APP_INITIALIZER] User logged in on server:', response.username);
        connectionStatusService.setCurrentUser(response);
      } else {
        console.log('❌ [APP_INITIALIZER] User not logged in');
      }
    } catch (error) {
      console.error('❌ [APP_INITIALIZER] Error checking user status:', error);
    }
  };
}

//הדרושים Providers הדלקת האפליקציה עם ה-
bootstrapApplication(App, {
  providers: [
    provideRouter(routes),           //<router-outlet> מאפשר 
    provideHttpClient(),             // HTTP
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConnectionStatusService],
      multi: true
    }
  ]
}).catch(err => console.error(err));
