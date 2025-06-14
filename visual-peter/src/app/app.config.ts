import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withJsonpSupport } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { EstadoSincronizacionService } from './services/estado-sincronizacion.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withJsonpSupport()),
    provideAnimations(),
    EstadoSincronizacionService
  ]
};
