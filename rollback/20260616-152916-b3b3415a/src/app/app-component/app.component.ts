import { Component, ChangeDetectorRef, Injector, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SharedService } from '../services/shared-sibling.service';
import { Subscription } from 'rxjs';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppRouteEnum, EnhancedLoaderTextEnum, FilePathEnum, LocalStorageKeyEnum, SessionTimeOutEnum, TravelSolutionJourneyTypeEnum } from '../utility/app-constants.service';
import { CommonServices } from '../services/common.service';
import { environment } from 'src/environments/environment';
import { CustomerServiceService } from '../services/customer-service.service';
import { CookieService } from 'ngx-cookie-service';
import { StorageDataService } from '../services/storage-data.service';
import { EnhancedSessionTimeoutPopupComponent } from '../Enhanced-Component/enhanced-dialogs/enhanced-session-timeout-popup/enhanced-session-timeout-popup.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SharedServiceCache } from '../services/SharedServiceCache.service';
import { DocumentInterruptSource, Idle, StorageInterruptSource } from '@ng-idle/core';
import { Keepalive } from '@ng-idle/keepalive';
import { take } from 'rxjs/operators';

export let browserRefresh = false;
export let navigationTrigger = '';
export let eventUrl = '';

declare global {
  interface Crypto {
    randomUUID () : string;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})



export class AppComponent implements OnInit, OnDestroy {
  // set the new key for NRE during reload the page
  @HostListener('window:beforeunload', ['$event']) pageReload() {
    sessionStorage.setItem('pageReloaded', 'true');
  }
  title = 'PICOWeb';
  subscription: Subscription;
  localStorageKeyEnum: LocalStorageKeyEnum;
  commonServices: CommonServices;
  customerServiceService: CustomerServiceService;
  cookies: CookieService;
  appRouteEnum: AppRouteEnum;
  private routerSubscription: Subscription;
  currentUrl: string = '';
  filePathEnum: FilePathEnum;
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;
  storageDataService: StorageDataService;
  themeLoaded = false;
  enhancedLoaderTextEnum: EnhancedLoaderTextEnum;
  sharedService: SharedService;
  sharedServiceCache: SharedServiceCache;
  sessionTimeOutEnum: SessionTimeOutEnum;
  lastPing?: Date = null;
  distance: {
    minutes;
    seconds;
  } = { minutes: 0, seconds: 0 };
  intervalTime: string;
  isClose: boolean = true;
  isExtendMySession: boolean;
  dialogRef: MatDialogRef<EnhancedSessionTimeoutPopupComponent>;

  @HostListener('window:click', ['$event.target'])
  onClick(e) {
    if (e.textContent != this.sessionTimeOutEnum.backToHomePageCTA && e.textContent != this.sessionTimeOutEnum.extendMySessionCTA && e.textContent != this.sessionTimeOutEnum.signInCTA) {
      this.isExtendMySession = false;
    }
  }
  constructor(public router: Router,private readonly changeDetector: ChangeDetectorRef, private readonly injector: Injector,
    private readonly idle: Idle, private readonly keepalive: Keepalive, private readonly dialog: MatDialog, public spinnerService: NgxSpinnerService
  )
  {
    this.subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        browserRefresh = !router.navigated;
        navigationTrigger = event.navigationTrigger;
        eventUrl = event.url;
        this.currentUrl = event.url;
      }
  });
  this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  this.commonServices = this.injector.get(CommonServices);
  this.customerServiceService = this.injector.get(CustomerServiceService);
  this.cookies = this.injector.get(CookieService);
  this.appRouteEnum = this.injector.get(AppRouteEnum);
  this.filePathEnum = this.injector.get(FilePathEnum);
  this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
  this.storageDataService = this.injector.get(StorageDataService);
  this.enhancedLoaderTextEnum = this.injector.get(EnhancedLoaderTextEnum);
  this.sharedService = this.injector.get(SharedService);
  this.sharedServiceCache = this.injector.get(SharedServiceCache);
  this.sessionTimeOutEnum = this.injector.get(SessionTimeOutEnum);

  // sets an idle timeout of 5 minuts.
    idle.setIdle(environment.idleTimeout);

    // sets a timeout period of 30 minuts. after 30 minuts of inactivity, the user will be considered timed out.
    idle.setTimeout(environment.sessionTimeout);

    // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    idle.setInterrupts(this.createCustomInterruptSources(null));

    this.sharedService.getUserLoggedIn().subscribe(name => {
      if (name) {
        idle.watch();
      } else {
        idle.stop();
      }
    });

    this.getExtendValueBtnAfterClick();

    // do something when the user is no longer idle
    idle.onIdleEnd.subscribe(() => {
      console.log('idle end');
    });

    // do something when the user has timed out
    idle.onTimeout.subscribe(() => {

      this.dialogRef = null
      this.customerServiceService.logout('');
      this.commonServices.removeSessionStorage();
      idle.stop();

      if (this.dialogRef == null) {

        this.openSearchAgainPopup();

      }


    });

    // do something when the user becomes idle
    idle.onIdleStart.subscribe(() => {

      if ((sessionStorage.getItem('CustomerKey') && sessionStorage.getItem('Email')) && (localStorage.getItem('CustomerKey') && localStorage.getItem('Email'))) {

        this.openExtendSessionPopup();

      } else {
        idle.stop();
        this.commonServices.removeSessionStorage();
      }

    });

    idle.onTimeoutWarning.subscribe((countdown) => {

      this.distance.minutes = (Math.floor(countdown / 60));
      this.distance.seconds = countdown % 60;
      this.distance.minutes = this.distance.minutes < 10 ? "0" + this.distance.minutes : this.distance.minutes;
      this.distance.seconds = this.distance.seconds < 10 ? "0" + this.distance.seconds : this.distance.seconds;
      this.intervalTime = this.distance.minutes + " mins " + ': ' + this.distance.seconds + " secs ";
      this.sharedService.timeCounter.next(this.intervalTime);

    });

    
    // sets the ping interval to 15 seconds
    keepalive.interval(environment.keepaliveInterval); // will ping at this interval while not idle, in seconds

    keepalive.onPing.subscribe(() => this.lastPing = new Date()); // do something when it pings
  }

  openExtendSessionPopup() {
      if (this.dialogRef == null) {
  
        setTimeout(() => {
  
          this.dialogRef = this.openSessionTimeOutPopup(this.sessionTimeOutEnum.sessionTimeOutWarningTitle, true, false);
  
          this.dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
  
            this.dialogRef = null;
            this.reset();
  
            this.isCheckExtendMySessionBtnClickedOrNot(result);
  
          });
        }, 1000);
      }
    }
  
    getExtendValueBtnAfterClick() {
      this.sharedService.getExtendValueBtn().subscribe(res => {
        this.isExtendMySession = res;
      });
    }
  
    isCheckExtendMySessionBtnClickedOrNot(result) {
      if (!this.isExtendMySession) {
        let loginResStr = localStorage.getItem('customerLoginResponse');
        if (loginResStr && (localStorage.getItem('CustomerKey') && localStorage.getItem('Email'))) {
          let loginResObj = JSON.parse(loginResStr);
  
          this.checkLoginExpirationTime(loginResObj);
  
        } else {
          this.customerServiceService.logout('');
          this.commonServices.removeSessionStorage();
          this.openSearchAgainPopup();
        }
      }
      else {
        if (result && result.isTimeOut) {
          this.openSearchAgainPopup();
        } else {
          this.dialog.closeAll();
        }
      }
    }
  
    checkLoginExpirationTime(loginResObj) {
      if (loginResObj && loginResObj.Expiration) {
        let currentUkTime = new Date((new Date()).toLocaleString('en-US', { timeZone: 'Europe/London' }));
        let tokenExpiryTime = new Date(loginResObj.Expiration);
        if (tokenExpiryTime > currentUkTime) {
          this.commonServices.callRefreshTokenApiForExtendSession();
          this.dialog.closeAll();
        } else {
          this.customerServiceService.logout('');
          this.commonServices.removeSessionStorage();
          this.openSearchAgainPopup();
        }
      }
      else {
        this.customerServiceService.logout('');
        this.commonServices.removeSessionStorage();
        this.openSearchAgainPopup();
      }
    }
  
    createCustomInterruptSources(options) {
      return [
        new DocumentInterruptSource('keydown mousedown touchstart touchmove scroll', options),
        new StorageInterruptSource(options)
      ];
    }
  
    reset() {
      // we'll call this method when we want to start/reset the idle process
      this.idle.watch();
      this.idle.setInterrupts(this.createCustomInterruptSources(null));
    }
  
    openSearchAgainPopup() {
      this.dialogRef = this.openSessionTimeOutPopup(this.sessionTimeOutEnum.sessionTimeOutTitle, false, true);
  
      this.dialogRef.afterClosed().subscribe(() => {
  
        this.dialogRef = null;
        this.dialog.closeAll();
        this.reset();
  
      });
    }
  
    openSessionTimeOutPopup(headerTitle, isIdleNotify, isClose) {
  
      return this.dialog.open(EnhancedSessionTimeoutPopupComponent, {
        width: '600px',
        disableClose: isClose,
        panelClass: ['common-popup-theme', 'session-timeout-shadow'],
        backdropClass: 'session-timeout-bg',
        autoFocus: false,
        restoreFocus: false,
        data: {
          headerTitle: headerTitle,
          isIdleNotify: isIdleNotify
        }
      });
  
    }

  ngOnInit() {
    this.reset();
    let localStorageVersion = localStorage.getItem(this.localStorageKeyEnum.version);
    let newBookingFlowControl = sessionStorage.getItem(this.localStorageKeyEnum.newDesignJourneyBookingFlow);
    if (newBookingFlowControl === null || newBookingFlowControl === undefined) {
      newBookingFlowControl = "true";
      sessionStorage.setItem(this.localStorageKeyEnum.newDesignJourneyBookingFlow, newBookingFlowControl);
    }
    localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlow, "true");
    localStorage.setItem(this.localStorageKeyEnum.loyaltyPortalShow, "true");
    if ([null,undefined].includes(localStorageVersion)) {
      localStorageVersion = "0";
    }
    if (+localStorageVersion < environment.verison) {
      // set the new version from localstorage
      this.commonServices.getLocationMasterData();
      this.commonServices.getRailcardStationMasterData();
    }    
    if(localStorage.getItem('Token')) {
      this.commonServices.removeSessionStorage();
      this.cookies.delete('SessionId');
      this.customerServiceService.logout('');
      localStorage.removeItem('Token');
    }
    // Load stylesheet before components render
    this.setGlobalStyleAccordingToQubitKey().then(() => {
      this.themeLoaded = true;
      this.changeDetector.detectChanges();
    });
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.handleRouteChange(event.urlAfterRedirects);
        this.currentUrl = event.urlAfterRedirects;
        this.setGlobalStyleAccordingToQubitKey().then(() => {
        this.themeLoaded = true;
        this.changeDetector.detectChanges();
      });
      }
    });
  }

  setGlobalStyleAccordingToQubitKey(): Promise<void>{
    let useNewStyle = this.commonServices.checkNewBookingFlowKeyInLocalStorage();
    if(this.currentUrl.toLowerCase() === "/" + this.appRouteEnum.MixingDeck){
      this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "false", false);
      this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "false", false); 
      this.commonServices?.setIsSeasonkeyInLocalStorage('false');
    } else if(this.currentUrl.includes('season') && this.checkIsSeasonInLocalStorage()){
      this.commonServices?.setIsSeasonkeyInLocalStorage('true');
    }
    return Promise.resolve();
  }

  checkRoutesToRenderNewStyleOrOldStyle(){
    return this.checkIsSeasonInLocalStorage() && !this.currentUrl.includes('account') && !this.currentUrl.includes('order-smartcard') && !this.currentUrl.includes('replace-smartcard') 
    && !this.currentUrl.includes('reset-email') && !this.currentUrl.includes('verify-email') && !this.currentUrl.includes('vat-receipt');
  }

  checkIsSeasonInLocalStorage(){
    return this.storageDataService.getStorageData(this.travelSolutionEnum.isSeason.charAt(0).toLowerCase() + this.travelSolutionEnum.isSeason.slice(1), false) === 'false';
  }

  handleRouteChange(url: string) {
    const body = document.body;
    if (url.includes(this.appRouteEnum.CojMixingDeck)) {
      body.classList.add('page-bg');
    } else {
      body.classList.remove('page-bg');
    }
  }
  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();

    if (localStorage.getItem('CustomerKey')) {
      sessionStorage.setItem('CustomerKey', localStorage.getItem('CustomerKey'));
      sessionStorage.setItem('Email', localStorage.getItem('Email'));
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
