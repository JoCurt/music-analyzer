import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideLucideIcons,
  LucideRewind,
  LucidePlay,
  LucidePause,
  LucideFastForward,
  LucideVolume2
} from '@lucide/angular';

import { routes } from './app.routes';
import {provideHttpClient} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideLucideIcons(
      LucideRewind,
      LucidePlay,
      LucidePause,
      LucideFastForward,
      LucideVolume2
    )
  ]
};
