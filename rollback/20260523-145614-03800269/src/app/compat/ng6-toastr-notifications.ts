import { Injectable, ModuleWithProviders, NgModule } from '@angular/core';

export interface ToastrOptions {
  position?: string;
  showCloseButton?: boolean;
  animate?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ToastrManager {
  successToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('success', message, title, options);
  }

  errorToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('error', message, title, options);
  }

  warningToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('warn', message, title, options);
  }

  infoToastr(message: string, title?: string, options?: ToastrOptions): void {
    this.log('info', message, title, options);
  }

  private log(level: 'success' | 'error' | 'warn' | 'info', message: string, title?: string, options?: ToastrOptions): void {
    const text = title ? `${title}: ${message}` : message;
    const log = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    log(text, options ?? {});
  }
}

@NgModule({})
export class ToastrModule {
  static forRoot(): ModuleWithProviders<ToastrModule> {
    return {
      ngModule: ToastrModule,
      providers: [ToastrManager]
    };
  }
}