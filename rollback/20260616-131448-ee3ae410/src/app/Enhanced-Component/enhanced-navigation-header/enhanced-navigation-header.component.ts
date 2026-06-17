import { Component, Injector, Input, OnInit } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NavigationEnd, Router } from "@angular/router";
import { LoginPageComponent } from "src/app/Component/login-page/login-page.component";
import { EnhancedFilterMobileDialogs } from "../enhanced-dialogs/enhanced-filter-mobile-dialogs/enhanced-filter-mobile-dialogs.component";
import { AppRouteEnum, EnhancedAppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedNavigationHeaderEnum, TravelSolutionJourneyTypeEnum } from "src/app/utility/app-constants.service";
import { environment } from "src/environments/environment";
import { EnhancedLoginPopupComponent } from "../enhanced-login-page/enhanced-login-popup.component";
import { SharedService } from "src/app/services/shared-sibling.service";
import { EnhancedLoginCommonService } from "src/app/services/enhanced-login-common.service";
import { CustomerServiceService } from "src/app/services/customer-service.service";
import { CommonServices } from "src/app/services/common.service";
import { CookieService } from "ngx-cookie-service";
import { EnhancedLogoutDialogs } from "../enhanced-dialogs/enhanced-logout-dialogs/enhanced-logout-dialogs.component";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { StorageDataService } from "src/app/services/storage-data.service";
import { SharedServiceCache } from "src/app/services/SharedServiceCache.service";
import { DatePipe } from "@angular/common";

@Component({
  selector: 'app-enhanced-navigation-header',
  templateUrl: './enhanced-navigation-header.component.html',
  styleUrls: ['./enhanced-navigation-header.component.css']
})
export class EnhancedNavigationHeaderComponent implements OnInit {
  router: Router;
  dialog: MatDialog;
  currentStep = 1;
  enhancedDynamicClassNameEnum : EnhancedDynamicClassesNameEnum;
  @Input() isAvantiFilterSelected: any;
  @Input() isDirectFilterSelected!: any;
  @Input() isReturn!: boolean;
  homePageURL: string;
  enhancedNavigationHeaderEnum : EnhancedNavigationHeaderEnum;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  sharedService: SharedService;
  customerName: string;
  enhancedLoginCommonService: EnhancedLoginCommonService;
  @Input() travelSolutionDirection: any;
  appRouteEnum: AppRouteEnum;
  basketCount: number = 0;
  isLoggedOut: boolean = false;
  customerServiceService: CustomerServiceService;
  commonServices: CommonServices;
  cookies: CookieService;
  isLoggedIn: boolean = false;
  onSignInPage: boolean = false;
  isLoginTooltip: boolean = false;
  isHideLoginToolTip: boolean = true;
  isHideLoginTooltipBackdrop: boolean = false;
  showEdit: boolean = false;
  storageDataService: StorageDataService;
  enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
  sharedServiceCache: SharedServiceCache;
  @Input() searchRequest: EnhancedSearchRequestModel;
  datePipe: DatePipe;
  sharedSibling: SharedService;
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;
  distance: {
    minutes;
    seconds;  
   } = {minutes : 0, seconds : 0};
   intervalTime: string;
   lastPing?: Date = null;
   menuOpen: boolean = false;
   @Input() isLoaderActive: boolean = false;
   @Input() isPaymentAPICall: boolean = false;

    constructor(private readonly injector: Injector){
      this.router = this.injector.get(Router);
      this.dialog = this.injector.get(MatDialog);
      this.enhancedDynamicClassNameEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
      this.enhancedNavigationHeaderEnum = this.injector.get(EnhancedNavigationHeaderEnum);
      this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
      this.enhancedLoginCommonService = this.injector.get(EnhancedLoginCommonService);
      this.sharedService = this.injector.get(SharedService);
      this.appRouteEnum = this.injector.get(AppRouteEnum);
      this.customerServiceService = this.injector.get(CustomerServiceService);
      this.commonServices = this.injector.get(CommonServices);
      this.cookies = this.injector.get(CookieService);
      this.storageDataService = this.injector.get(StorageDataService);
      this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
      this.sharedServiceCache = this.injector.get(SharedServiceCache);
      this.datePipe = this.injector.get(DatePipe);
      this.sharedSibling = this.injector.get(SharedService);
      this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
      if (
        localStorage.getItem("Email") &&
        localStorage.getItem("CustomerKey")
      ) {
        this.isLoggedIn = true;
        this.sharedService.isLogin = true;
        this.customerName = localStorage.getItem("FirstName");
      }

      this.sharedService.getLoggedInName.subscribe((name) => {
        this.sharedService.isLogin = true;
        this.customerName = name;
        this.isLoggedIn = true;
      });

      this.basketCount = this.sharedService.basketCount;
      this.sharedService.getBasketCount.subscribe(count => this.basketCount = count);
    }

    ngOnInit(): void {
      this.homePageURL = environment.qttUrl;
      this.onSignInPage = window.location.href.includes(this.appRouteEnum.Login);
      let url = this.router.url;
      this.updateStepBasedOnRoute(url);
    }

    updateStepBasedOnRoute(url: string): void {
      if (url.includes(`/${this.enhancedAppRouteEnum?.searchResult}`)) {
        this.currentStep = 1;
      } else if (url.includes(`/${this.enhancedAppRouteEnum?.selectTicketAndClass}`)) {
        this.currentStep = 2;
      } else if (url.includes(`/${this.enhancedAppRouteEnum?.deliveryAndReviewBy}`)) {
        this.currentStep = 3;
      } else if (url.includes(`/${this.enhancedAppRouteEnum?.payment}`)) {
        this.currentStep = 4;
      } else {
        this.currentStep = 0;
      }
    }
  
    getStepClass(step: number): string {
      if (step === this.currentStep) {
        return 'edit';
      } else if (step < this.currentStep) {
        return 'check';
      } else {
        return '';
      }
    }

    openLogin() {
      const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = false;
        dialogConfig.width = "60%";
        dialogConfig.panelClass = 'class-dialog1';
        dialogConfig.data = { returnUrl: this.router.url };
        this.dialog.open(LoginPageComponent, dialogConfig);
    }

    setActiveClass(page: number): string {
      const stepClass = this.getStepClass(page);
      
      switch (stepClass) {
        case 'check':
          return this.enhancedDynamicClassNameEnum?.enhancedStepperNavigationCompletedCircleClass;
        case 'edit':
          return this.enhancedDynamicClassNameEnum?.enhancedStepperNavigationActiveCircleClass;
        default:
          return this.enhancedDynamicClassNameEnum?.enhancedStepperNavigationDisabledCircleClass;
      }
    }

    addActiveOrDisabledClassOnHeaderText(pageNo){
      return this.getStepClass(pageNo) !== 'edit' && this.getStepClass(pageNo) !== 'check' ? this.enhancedDynamicClassNameEnum?.enhancedStepperNavigationDisabledText : this.enhancedDynamicClassNameEnum?.enhancedStepperNavigationActiveText;
    }


    
    enhancedFilterMobileDialogs(){
      this.dialog.open(EnhancedFilterMobileDialogs, {
       disableClose: false,
       panelClass: [this.enhancedDynamicClassNameEnum?.mobileFilterPanelClass, this.enhancedDynamicClassNameEnum?.filterRangePanelClass],
       width: '100%',
      autoFocus: false,
      data: {
        isAvantiSelected: this.isAvantiFilterSelected,
        isDirectSelected: !this.isDirectFilterSelected,
        isReturn: this.isReturn
      }
    }); 
    
    }

  headerTextOutwardOrReturn() {
    let directionText: string = '';
    let isSearchResultPage = this.router?.url === `/${this.enhancedAppRouteEnum?.searchResult}`;
    let isSelectTicketPage = this.router?.url === `/${this.enhancedAppRouteEnum?.selectTicketAndClass}`;
    let isReviewPage = this.router?.url === `/${this.enhancedAppRouteEnum?.deliveryAndReviewBy}`;
    let isPaymentPage = this.router?.url === `/${this.enhancedAppRouteEnum?.payment}`;

    directionText = this.isReturn
      ? this.enhancedNavigationHeaderEnum?.selectReturnTrainTxt
      : this.enhancedNavigationHeaderEnum?.selectOutwardTrainTxt;

    if (isSelectTicketPage) {
      if (this.travelSolutionDirection === 'OPEN_RETURN') {
        directionText = this.enhancedNavigationHeaderEnum?.selectOpenReturnTrainTxt;
      }
    }
    if (isSearchResultPage) {
      return `${directionText} train`;
    } else if (isSelectTicketPage) {
      return `${directionText} ticket`;
    } else if (isReviewPage) {
      return `${this.enhancedNavigationHeaderEnum?.reviewBuyPageHeaderTxtInMobile}`;
    } else if (isPaymentPage) {
      return `${this.enhancedNavigationHeaderEnum?.paymentPageHeaderTxtInMobile}`;
    }
    return directionText;
  }

  openSignInDialog() {
    const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = false;
      dialogConfig.width = "42rem";
      dialogConfig.panelClass = [this.enhancedDynamicClassNameEnum?.enhancedCommonPopupThemePanelClass , this.enhancedDynamicClassNameEnum?.enhancedSignInDialogPopupPanelClass];
      dialogConfig.data = { returnUrl: this.router.url };
      this.dialog.open(EnhancedLoginPopupComponent, dialogConfig);
  }

  callLoginMethod(){
      this.enhancedLoginCommonService.checkLogin();
  }

  showAccountDetails() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl(`/` + this.appRouteEnum.MyBookings, {
      state: { routedFrom: currentUrl },
    });
  }

  showLogoutPopup() {
    let logoutDialog = this.dialog.open(EnhancedLogoutDialogs, {
      disableClose: true,
      autoFocus:false,
      panelClass: ['logout-popup', 'logout-style-popup'],
      width: '22.688rem',
    
      data: {
        Message:
          this.basketCount > 0
            ? "Log out now? Your searches and basket won't be saved."
            : "Are you sure you want to log out now?",
      },
    });

    logoutDialog.afterClosed().subscribe((res) => {
      this.isLoggedOut = res;
      
      this.logout();
    });
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
    this.sharedService.isNewLoaderForNewFlow = false;
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
    if (!this.router.url.includes(this.enhancedAppRouteEnum.selectTicketAndClass) && !this.router.url.includes(this.appRouteEnum.MixingDeck) && !this.router.url.includes(this.appRouteEnum.SeasonSolutions)) {
      if (!this.router.url.includes(this.appRouteEnum.JourneyExtras) || (this.router.url.includes(this.appRouteEnum.JourneyExtras) && this.sharedService.searchRequest.TravelSolutionDirection == 'SEASON')) {
        window.location.href = environment.qttUrl;
      }
    }
    if ((this.router.url.indexOf(this.appRouteEnum.CojMixingDeck) > -1) || (this.router.url.indexOf(this.appRouteEnum.CojReviewBuy) > -1) || (this.router.url.indexOf(this.appRouteEnum.CojPayment) > -1)) {
      window.location.href = environment.qttUrl;
    }
  }

  openEdit() {
    try {
      this.sharedService.amendSearchRequest = this.searchRequest;
      this.showEdit = true;
      this.sharedService.isDisabledContinue.next(true);
      this.sharedService.setJourneyTxtMode(false);
    } catch (error) { console.log(error); }
  }

  submitEdit(isSuccessful: boolean): void {
    try {
      if (!isSuccessful) {
        this.showEdit = !this.showEdit;
      } else {
        this.searchRequest = this.sharedService.amendSearchRequest;
        this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
        this.searchRequest.ReturnTimesStartShow = new Date(this.searchRequest.ReturnTimesStart);
        this.sharedService.searchRequest = structuredClone(this.searchRequest);
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
        this.storageDataService.setStorageData(
          this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling,
          this.sharedServiceCache,
          true
        );
        this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
      }
    } catch (error) { console.log(error); }
  }

  travelDateFormatted(searchRequest) {
    try {
      let formattedDate: string = '';
      if (!searchRequest) return;
      formattedDate = this.isReturn
        ? this.datePipe?.transform(searchRequest?.ReturnTimesStartShow, 'EEE dd MMM')
        : this.datePipe?.transform(searchRequest?.DepartureTimesStartShow, 'EEE dd MMM');

      return formattedDate;
    } catch (error) { console.log(error); }
  }

  redirectToReviewBuyPage() {
    this.commonServices.cacheSharedData();
    if (this.basketCount > 0) {
      this.commonServices?.setSessionKeyInLocalStorageIfSeasonJourneyIsAvailable();
      this.router.navigate([`./` + this.enhancedAppRouteEnum.deliveryAndReviewBy]);
    }
  }

  getJourneyFilterAriaLabel(searchRequest: any): string {
    try {
      let journeyType = this.isReturn ? this.travelSolutionEnum.return : this.travelSolutionEnum.outward;
      let formattedDate = this.isReturn ? this.datePipe?.transform(searchRequest?.ReturnTimesStartShow, 'EEE, dd MMM yyyy') : this.datePipe?.transform(searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy');
      return `Filters for your journey ${journeyType}, ${formattedDate}.`;
    } catch (error) { console.log(error); }
  }
}