import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withJsonpSupport } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { VoiceService } from './services/voice.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withJsonpSupport()),
    provideAnimations(),
    VoiceService // ✅ Instancia global para toda la aplicación
  ]
};
