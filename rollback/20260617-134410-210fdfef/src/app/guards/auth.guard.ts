import { Injectable, Injector } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { NotificationService } from '../utility/toastr-notification/toastr-notification.service';
import { environment } from 'src/environments/environment';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LoginPageComponent } from '../Component/login-page/login-page.component';
import { AppRouteEnum } from '../utility/app-constants.service';
import { SharedService } from '../services/shared-sibling.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  spinnerService: NgxSpinnerService;
  constructor(private readonly router: Router, private readonly _notificationservice: NotificationService,
    private readonly appRouteEnum: AppRouteEnum, private readonly dialog: MatDialog, private readonly sharedurl: SharedService, private readonly injector: Injector) {
      this.spinnerService = this.injector.get(NgxSpinnerService);
  }
  canActivate(_next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (localStorage.getItem('CustomerKey') != null && localStorage.getItem('Email') != null) {
      return of(true);
    }
    else {
      // added this for ticket 1603
      if (state.url.includes(this.appRouteEnum.MyBookings) || state.url.includes(this.appRouteEnum.MyPreferences)
        || state.url.includes(this.appRouteEnum.PaymentsAndVouchers) || state.url.includes(this.appRouteEnum.MyProfile)
        || state.url.includes(this.appRouteEnum.clubAvanti)) {
          if(state.url.includes(this.appRouteEnum.appRedirectedURLToMyProfileForChangeEmail)){
            this.spinnerService.hide();
          }
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.width = "60%";
        dialogConfig.panelClass = ['class-dialog1', 'extras-login-popup-cus'];
        dialogConfig.disableClose = true;
        dialogConfig.hasBackdrop = false; 
        dialogConfig.data = { returnUrl: state.url, isLoginFromOutside: true };

        return new Observable(observer => {
          this.dialog.open(LoginPageComponent, dialogConfig).afterClosed().subscribe(_result => {
            observer.next(true);
          });
        });
      }
      else {
        window.location.href = environment.qttUrl;
        return of(false);
      }
    }

  }

}


