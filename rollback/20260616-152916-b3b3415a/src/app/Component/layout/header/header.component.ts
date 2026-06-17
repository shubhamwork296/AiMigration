import { Component, OnInit, Inject, Injector} from '@angular/core';
import { MatDialog, MatDialogConfig, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FooterComponent } from '../footer/footer.component';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { LoginPageComponent } from '../../login-page/login-page.component';
import { environment } from 'src/environments/environment';
import { AppRouteEnum, LocalStorageKeyEnum, SessionTimeOutEnum } from 'src/app/utility/app-constants.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { CookieService } from 'ngx-cookie-service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { CommonServices } from 'src/app/services/common.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})

export class HeaderComponent
  implements OnInit {

  isLoggedIn: boolean = false;
  customerName: string;
  basketCount: number;
  isLoggedOut: boolean = false;
  qtturl: string;
  langCode: string;
  serviceUrl = environment.reciteUrl;
  serviceKey = environment.reciteKey;
  onSignInPage: boolean = false;

  router: Router;
  sharedService: SharedService;
  appRouteEnum: AppRouteEnum;
  storageDataService: StorageDataService;
  customerServiceService: CustomerServiceService;
  cookies: CookieService;
  sharedServiceCache: SharedServiceCache;
  sessionTimeOutEnum: SessionTimeOutEnum;
  commonServices: CommonServices;
  isShowBuyTicket: boolean;
  isLoginTooltip: boolean = false;
  isHideLoginToolTip: boolean = true;
  isHideLoginTooltipBackdrop: boolean = false;
  localStorageKeyEnum: LocalStorageKeyEnum;

  constructor(private readonly injector: Injector, private readonly dialogSingle: MatDialog, private readonly dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.router = this.injector.get(Router);
    this.sharedService = this.injector.get(SharedService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.storageDataService = this.injector.get(StorageDataService);
    this.customerServiceService = this.injector.get(CustomerServiceService);
    this.cookies = this.injector.get(CookieService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.sessionTimeOutEnum = this.injector.get(SessionTimeOutEnum);
    this.commonServices = this.injector.get(CommonServices);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);

    this.qtturl = environment.qttUrl;
    if (localStorage.getItem('Email') && localStorage.getItem('CustomerKey')) {
      this.isLoggedIn = true;
      this.sharedService.isLogin = true;
      this.customerName = localStorage.getItem('FirstName');
    }

    this.basketCount = this.sharedService.basketCount;
    this.sharedService.getLoggedInName.subscribe(name => {
      this.sharedService.isLogin = true;
      this.customerName = name;
      this.isLoggedIn = true;
    });
    this.sharedService.getBasketCount.subscribe(count => this.basketCount = count);
  }
  
  ngOnInit() {
    this.sharedService.getIsShowBuyButton().subscribe(res => {
      this.isShowBuyTicket = res;
    });
    // used this property to disable signin button from LoginPageComponent
    this.onSignInPage = window.location.href.includes(this.appRouteEnum.Login);

    this.sharedService.getIsLoginToolTip().subscribe(res => {
      if (!res) {
        this.isLoginTooltip = false;
        this.isHideLoginToolTip = res;
      }
    });

  }




  handleLanguage(event: any) {
    this.langCode = event.target.getAttribute('data-lang');
    //@ts-ignore
    _handleLanguageClick(this.langCode);
  }

  showPopUp(): void {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = "60%";
    dialogConfig.panelClass = ['class-dialog1', 'extras-login-popup-cus'];
    this.dialogSingle.open(FooterComponent, dialogConfig);
  }

  openLogin() {
    if (this.router.url.includes(this.appRouteEnum.MixingDeck) || this.router.url.includes(this.appRouteEnum.JourneyExtras) || this.router.url.includes(this.appRouteEnum.Register)) {
      this.isHideLoginTooltipBackdrop = false;
      this.isLoginTooltip = true;
      this.isHideLoginToolTip = true;
      this.sharedService.activeValidatorOnLogin.next(this.isLoginTooltip);
    } else {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.width = "60%";
      dialogConfig.panelClass = ['class-dialog1', 'extras-login-popup-cus'];
      dialogConfig.data = { returnUrl: this.router.url };
      this.dialog.open(LoginPageComponent, dialogConfig);
    }
  }
  logout() {
    if (this.isLoggedOut) {
      this.customerServiceService.logOutCustomer().subscribe(
        _res => { this.logoutCustomer(); }, _err => {
          this.logoutCustomer();
        });
    }
  }
  logoutCustomer() {
    this.commonServices.removeSessionStorage();
    this.cookies.delete('SessionId');
    this.removeLocalStorage();
  }

  removeLocalStorage() {
    this.isLoggedIn = false;
    this.sharedService.isLogin = false;
    if (localStorage.getItem('RememberMe') !== null) {
      let userName = localStorage.getItem('UserNameRM');
      this.customerServiceService.logout(this.router.url);
      localStorage.setItem('UserNameRM', userName);
      localStorage.setItem('RememberMe', 'true');
    }
    else {
      this.customerServiceService.logout(this.router.url);
    }
    if (!this.router.url.includes(this.appRouteEnum.MixingDeck) && !this.router.url.includes(this.appRouteEnum.SeasonSolutions)) {
      if (!this.router.url.includes(this.appRouteEnum.JourneyExtras) || (this.router.url.includes(this.appRouteEnum.JourneyExtras) && this.sharedService.searchRequest.TravelSolutionDirection == 'SEASON')) {
        window.location.href = environment.qttUrl;
      }
    }
    if ((this.router.url.indexOf(this.appRouteEnum.CojMixingDeck) > -1) || (this.router.url.indexOf(this.appRouteEnum.CojReviewBuy) > -1) || (this.router.url.indexOf(this.appRouteEnum.CojPayment) > -1)) {
      window.location.href = environment.qttUrl;
    }
  }

  redirectToReviewBuy() {
    localStorage.setItem(this.localStorageKeyEnum.isReturnFromPaymentOrBasket, 'true');
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
    if (this.commonServices.doesDeliveryPageSkipped()) {
      if (this.basketCount > 0) {
        this.commonServices?.setSessionKeyInLocalStorageIfSeasonJourneyIsAvailable();
        localStorage.setItem(this.appRouteEnum.isBrowserBackButton, 'false');
      }
      this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
      return;
    }
    this.router.navigate([`./` + this.appRouteEnum.ReviewBuy]);
  }

  showLogoutPopup() {
    let logoutDialog = this.dialogSingle.open(LogoutPopup, {
      panelClass: 'logout-popup',
      data: {
        Message: (this.basketCount > 0)
          ? "Are you sure you want to log out now? Logging out will clear your basket."
          : "Are you sure you want to log out now?"
      }
    });

    logoutDialog.afterClosed().subscribe(res => {
      this.isLoggedOut = res;
      this.logout();
    });
  }
  showAccountDetails() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl(`/` + this.appRouteEnum.MyBookings,{state: {routedFrom: currentUrl}});
  }

  buyTicket() {
    window.location.href = environment.qttUrl;
  }

  isShowHeaderMenu() {
    if (!(this.router.url.includes(this.appRouteEnum.MixingDeck) || this.router.url.includes(this.appRouteEnum.JourneyExtras) || this.router.url.includes(this.appRouteEnum.DeliveryMode) || this.router.url.includes(this.appRouteEnum.ReviewBuy) || this.router.url.includes(this.appRouteEnum.Payment) || this.router.url.includes(this.appRouteEnum.Login) || this.router.url.includes(this.appRouteEnum.ForgotPassword) || this.router.url.includes(this.appRouteEnum.Register) || this.router.url.includes(this.appRouteEnum.Confirmation) || this.router.url.includes(this.appRouteEnum.FlexiSolutions) || this.router.url.includes(this.appRouteEnum.SeasonSolutions) || this.router.url.includes(this.appRouteEnum.MyBookings) || this.router.url.includes(this.appRouteEnum.MyPreferences) || this.router.url.includes(this.appRouteEnum.MyProfile) || this.router.url.includes(this.appRouteEnum.ViewBooking) || this.router.url.includes(this.appRouteEnum.PaymentsAndVouchers) || this.router.url.includes(this.appRouteEnum.Reset) || this.router.url.includes(this.appRouteEnum.ValidatePaymentDo) || this.router.url.includes(this.appRouteEnum.ValidateEnrollmentDo) || this.router.url.includes(this.appRouteEnum.RegistrationSuccess) || this.router.url.includes(this.appRouteEnum.Page500) || this.router.url.includes(this.appRouteEnum.RefundBooking) || this.router.url.includes(this.appRouteEnum.resetEmail) || this.router.url.includes(this.appRouteEnum.verifyEmail) || this.router.url.includes(this.appRouteEnum.deliveryAndReviewbuy) || this.router.url.includes(this.appRouteEnum.clubAvanti))) {
      return true;
    } else {
      return false;
    }
  }
}

@Component({
  selector: 'logout-popup',
  templateUrl: 'logout-popup.html',
})
export class LogoutPopup {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly dialogRef: MatDialogRef<LogoutPopup>) { }
  isLoggedOut: boolean;
  onLogout(result) {
    this.isLoggedOut = result;
    this.dialogRef.close(this.isLoggedOut);
  }

}


export class MenuPositionExample {

}

