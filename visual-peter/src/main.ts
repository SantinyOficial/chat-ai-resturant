import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
// Importar funciones de prueba de pagos para entorno de desarrollo
import './test-pagos';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
