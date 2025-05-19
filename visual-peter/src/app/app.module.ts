import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

/**
 * Este módulo ya no es necesario para la configuración principal
 * de la aplicación porque estamos usando el enfoque de componentes standalone.
 * Se mantiene por compatibilidad con bibliotecas que podrían requerir NgModule.
 */
@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: []
})
export class AppModule {}
