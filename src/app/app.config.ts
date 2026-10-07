import { ApplicationConfig, provideZoneChangeDetection,provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient ,withInterceptors} from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService, ConfirmationService } from 'primeng/api';
import { routes } from './app.routes';
import {DatePipe} from '@angular/common';
import {authInterceptor} from './sec-featuers/auth.interceptor'
export const appConfig: ApplicationConfig = {
  providers: [
    DatePipe,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
       withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    providePrimeNG({
      // 1. Theme Configuration
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'none', // Disables automatic dark mode
        },
      },
      // 2. Global Input Configuration (Moved outside of 'theme')
      inputVariant: 'filled', // In v21, this property is technically renamed to inputVariant, but inputStyle often works for backward compatibility. Use 'inputVariant' for best results.
    }),
    MessageService,
    ConfirmationService,
  ],
};
