import { Component, Injector, Input, OnInit } from '@angular/core';
import { AccountHeaderLabelEnum, AppRouteEnum } from 'src/app/utility/app-constants.service';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { CommonServices } from 'src/app/services/common.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
    selector: 'app-account-header',
    templateUrl: './account-header.component.html',
    styleUrls: ['./account-header.component.css'],
    standalone: false
})
export class AccountHeaderComponent implements OnInit {

  firstName: string;
  selectedAccountMenu: string;
  tabIndex: any = 0;
  @Input() headerFlag;
  selectedIndexOfAccountMenuHeaderTab: number;
  @Input() newHeaderFlag;
  commonServices: CommonServices;
  ga4dataLayerService: GA4DatalayerService;

  constructor(private readonly injector: Injector, public appRouteEnum: AppRouteEnum, public router: Router, public sharedService: SharedService, public accountHeaderEnum: AccountHeaderLabelEnum) {
    this.commonServices = this.injector.get(CommonServices);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.selectedAccountMenu = this.router.url.split('/')[this.router.url.split('/').length - 1];
    let routeEnumArray = [appRouteEnum.MyBookings, appRouteEnum.MyPreferences, appRouteEnum.PaymentsAndVouchers, appRouteEnum.clubAvanti, appRouteEnum.MyProfile
      , appRouteEnum.clubAvantiToMyProfileFocusRoute, appRouteEnum.clubAvantiToCommPrefrenceFocusRoute, appRouteEnum?.appRedirectedURLToMyProfileForChangeEmail
    ];
    if (!this.commonServices.doesClubAvantiPortalDisplay() && this.hasClubAvantiOrMyProfile()) {
      const index = routeEnumArray.indexOf(this.appRouteEnum.clubAvanti)
      if (index > -1) {
        routeEnumArray.splice(index, 1);
      }
      if ((this.selectedAccountMenu == this.appRouteEnum.clubAvanti)) {
        this.selectedAccountMenu = this.appRouteEnum.MyProfile;
      }
      this.router.navigate([`./` + this.selectedAccountMenu]);
    }
    this.selectedIndexOfAccountMenuHeaderTab = routeEnumArray.findIndex(e => e == this.selectedAccountMenu);
    this.setTabIndexWhenRedirectFromClubAvanti();
    if (this.selectedAccountMenu == appRouteEnum.ViewBooking) {
      this.selectedAccountMenu = appRouteEnum.MyBookings;
      this.selectedIndexOfAccountMenuHeaderTab = 0; // set this as 0 because in html My bookings is having 0 index on mat tab
    }
    this.setClubAvantiNavigationDataLayerOnPageLoad();
  }

  ngOnInit() {
    this.firstName = localStorage.getItem("FirstName");
    this.sharedService.getLoggedInName.subscribe(name => {
      this.firstName = name;
    });
  }

  onChangeAccountMenu(event) {
    this.selectedAccountMenu = event.value;
    this.router.navigate([`./` + this.selectedAccountMenu]);
  }

  onTabChanged(event) {
    this.tabIndex = event.index;
    if (event.tab.textLabel === this.accountHeaderEnum.bookings) {
      this.ga4dataLayerService.loadGA4DataLayerForClubAvantiNavigation(this.router.url, `/` + this.appRouteEnum.MyBookings, event.tab.textLabel);
      this.selectedIndexOfAccountMenuHeaderTab = 0;
      this.router.navigate([`./` + this.appRouteEnum.MyBookings]);
    } else if (event.tab.textLabel === this.accountHeaderEnum.preferences) {
      this.ga4dataLayerService.loadGA4DataLayerForClubAvantiNavigation(this.router.url, `/` + this.appRouteEnum.MyPreferences, event.tab.textLabel);
      this.selectedIndexOfAccountMenuHeaderTab = 1;
      this.router.navigate([`./` + this.appRouteEnum.MyPreferences]);
    } else if (event.tab.textLabel === this.accountHeaderEnum.paymentsAndVouchers) {
      this.ga4dataLayerService.loadGA4DataLayerForClubAvantiNavigation(this.router.url, `/` + this.appRouteEnum.PaymentsAndVouchers, event.tab.textLabel);
      this.selectedIndexOfAccountMenuHeaderTab = 2;
      this.router.navigate([`./` + this.appRouteEnum.PaymentsAndVouchers]);
    } else if (this.commonServices.doesClubAvantiPortalDisplay() && event.tab.textLabel == this.accountHeaderEnum.clubAvanti) {
      this.ga4dataLayerService.loadGA4DataLayerForClubAvantiNavigation(this.router.url, `/` + this.appRouteEnum.clubAvanti, event.tab.textLabel);
      this.selectedIndexOfAccountMenuHeaderTab = 3;
      this.router.navigate([`./` + this.appRouteEnum.clubAvanti]);
    } else if (this.commonServices.doesClubAvantiPortalDisplay() && event.tab.textLabel === this.accountHeaderEnum.profile) {
      this.ga4dataLayerService.loadGA4DataLayerForClubAvantiNavigation(this.router.url, `/` + this.appRouteEnum.MyProfile, event.tab.textLabel);
      this.selectedIndexOfAccountMenuHeaderTab = 4;
      this.router.navigate([`./` + this.appRouteEnum.MyProfile]);
    } else if (!this.commonServices.doesClubAvantiPortalDisplay() && event.tab.textLabel === this.accountHeaderEnum.profile) {
      this.ga4dataLayerService.loadGA4DataLayerForClubAvantiNavigation(this.router.url, `/` + this.appRouteEnum.MyProfile, event.tab.textLabel);
      this.selectedIndexOfAccountMenuHeaderTab = 3;
      this.router.navigate([`./` + this.appRouteEnum.MyProfile]);
    }
  }

  setTabIndexWhenRedirectFromClubAvanti() {
    if (this.selectedIndexOfAccountMenuHeaderTab == 5) {
      this.selectedIndexOfAccountMenuHeaderTab = 4;
      this.selectedAccountMenu = this.appRouteEnum.MyProfile;
    } else if (this.selectedIndexOfAccountMenuHeaderTab == 6) {
      this.selectedIndexOfAccountMenuHeaderTab = 1;
      this.selectedAccountMenu = this.appRouteEnum.MyPreferences;
    }
  }

  hasClubAvantiOrMyProfile(){
    return this.selectedAccountMenu == this.appRouteEnum.clubAvanti || this.selectedAccountMenu == this.appRouteEnum.MyProfile;
  }

  setClubAvantiNavigationDataLayerOnPageLoad(){
    let routedFrom = this.router?.getCurrentNavigation()?.extras?.state?.routedFrom;
    if(routedFrom){
      this.ga4dataLayerService.loadGA4DataLayerForClubAvantiNavigation(routedFrom, `/` + this.selectedAccountMenu, this.accountHeaderEnum.bookings);
    }
  }

  setNavigationTextLabelNameBasedOnRoute(selectedTab){
    let textLabel = '';
    if(this.appRouteEnum.MyBookings == selectedTab){
      textLabel = this.accountHeaderEnum.bookings;
    } else if(this.appRouteEnum.MyPreferences == selectedTab){
      textLabel = this.accountHeaderEnum.preferences;
    } else if(this.appRouteEnum.PaymentsAndVouchers == selectedTab){
      textLabel = this.accountHeaderEnum.paymentsAndVouchers;
    } else {
      textLabel = this.accountHeaderEnum.profile;
    }
    return textLabel;
  }

}
