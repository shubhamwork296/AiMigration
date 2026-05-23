import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DatePipe, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

//LAYOUT COMPONENTS
// import * as layoutComponents from './layout/index';
import { SharedModule } from './shared/shared.module';
import { TokenInterceptor } from './core/interceptor/token.interceptor';
import { TruncateTextPipe } from './shared/pipes/truncate-text.pipe';
import { LoaderService } from './core/service/loader.service';
import { LoaderInterceptor } from './core/interceptor/loader.interceptor';
import { GuestGuard } from './core/guard/guest.guard';
import { ConfirmationDialogComponent } from './modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { ErrorInterceptor } from './core/interceptor/error.interceptor';
import { HttpCancelService } from './core/service/httpcancel.service';
import { ManageHttpInterceptor } from './core/interceptor/managehttp.interceptor';
import { CookieAlertDialogComponent } from './shared/components/cookie-alert-dialog/cookie-alert-dialog.component';
@NgModule({
  declarations: [
    AppComponent,
    ConfirmationDialogComponent,
    CookieAlertDialogComponent,
  ], 
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    BrowserAnimationsModule,// required animations module 
  
    
  ],
  providers: [TruncateTextPipe, LoaderService,GuestGuard, DatePipe,HttpCancelService,
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ManageHttpInterceptor, multi: true }
    // { provide: UrlSerializer, useClass: CustomUrlSerializer }
  ],
  bootstrap: [AppComponent]})
export class AppModule { }
