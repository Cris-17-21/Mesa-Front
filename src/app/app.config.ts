import { APP_INITIALIZER, ApplicationConfig, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { appInitializer } from './app.init';
import { AuthService } from './core/auth/auth.service';
import { MyPreset } from './mypreset';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      deps: [AuthService],
      multi: true
    },
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: '.primeng-noir',
          cssLayer: false
        }
      }
    })
  ]
};
