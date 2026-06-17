import { Component, OnInit, Renderer2, Inject, ElementRef, Injector, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResponseData } from 'src/app/models/common/response.model';
import { MyPreferencesResponse, GetPreferencesRequest, StationLocation, MyPreferencesRequest, CustomerAddress, CustomerInfoUpdate, CustomerAttributeRequest, SavePreferencesRespons, ConcentricTokenResponse } from 'src/app/models/account/my-preferences.model';
import { DOCUMENT } from '@angular/common';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { Observable } from 'rxjs';
import { FormBuilder, FormControl } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { MyAccountService } from 'src/app/services/my-account.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { browserRefresh } from 'src/app/app-component/app.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonServices } from 'src/app/services/common.service';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { ClubAvantiPopupComponent } from './club-avanti-popup/club-avanti-popup.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { LoyaltySignupPopupComponent } from './loyalty-signup-popup/loyalty-signup-popup.component';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { AppRouteEnum, LocalStorageKeyEnum } from 'src/app/utility/app-constants.service';
import { ActivatedRoute } from '@angular/router';
declare let seamless: any;

@Component({
  selector: 'app-my-preferences',
  templateUrl: './my-preferences.component.html',
  styleUrls: ['./my-preferences.component.css']
})

export class MyPreferencesComponent implements OnInit {
 
  myAccountService: MyAccountService;
  notificationservice: NotificationService;
  storageDataService: StorageDataService;
  sharedService: SharedService;
  spinnerService: NgxSpinnerService;
  commonService: CommonServices;
  el: ElementRef;
  dataLayerService: DataLayerService;
  ga4dataLayerService: GA4DatalayerService;
  hideHeaderFlag : boolean = true;
  myPreferencesHideHeaderFlag : boolean = true;
  favouriteStationDisplayCount : number = 1;
  locations: LocationMasterData[];
  filteredOutLocation : LocationMasterData[];
  favouriteLocations: LocationMasterData[];
  localStorageKeyEnum: LocalStorageKeyEnum;
  appRouteEnum: AppRouteEnum;


  constructor(@Inject(DOCUMENT) private readonly _document: Document, private readonly formbuilder: FormBuilder,
    private readonly injector: Injector, private readonly _renderer2: Renderer2, public dialog: MatDialog, private readonly cd: ChangeDetectorRef) {
    // Dependency Injection without using constructor's param
    this.myAccountService = this.injector.get(MyAccountService);
    this.notificationservice = this.injector.get(NotificationService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedService = this.injector.get(SharedService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.commonService = this.injector.get(CommonServices);
    this.el = this.injector.get(ElementRef);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);


    this.getPreferencesRequest = new GetPreferencesRequest();
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.route = this.injector.get(ActivatedRoute);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
  }

  customerKey: any;
  responseData: ResponseData;
  myPreferencesResponse: MyPreferencesResponse;
  getConcentricResponse: ConcentricTokenResponse;
  token: any;
  getPreferencesRequest: GetPreferencesRequest;
  myPreferencesRequest: MyPreferencesRequest;
  savePreferencesResponse: SavePreferencesRespons;
  favoriteStation1: Observable<StationLocation[]>;
  favoriteStation2: Observable<StationLocation[]>;
  favoriteStation3: Observable<StationLocation[]>;
  favoriteStation4: Observable<StationLocation[]>;
  favoriteStation5: Observable<StationLocation[]>;
  myPreferencesForm = this.formbuilder.group({
    deliveryModeControl: new FormControl(''),
    favoriteStation1Control: new FormControl(''),
    favoriteStation2Control: new FormControl(''),
    favoriteStation3Control: new FormControl(''),
    favoriteStation4Control: new FormControl(''),
    favoriteStation5Control: new FormControl(''),
    paymentModeControl: new FormControl('Default_Payment'),
    railCardControl: new FormControl('NO_RAILCARD'),
    clubAvantiControl: new FormControl()
  });
  addressControl: any;
  browserRefresh: boolean;
  stationList: any;
  route: ActivatedRoute;
  fragment: string;

  ngOnInit() {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
        this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
      }
    }
    if (this.sharedService?.reviewBuyResponse != null && this.sharedService?.reviewBuyResponse != undefined) {
      this.sharedService.reviewBuyCache = this.sharedService.reviewBuyResponse.ReviewBuyCache;
      this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
    }
    this.customerKey = localStorage.getItem('CustomerKey');
    this.getConcentricToken();
    this.getMyPreferences(false);
    this.route.fragment.subscribe(fragment => { this.fragment = fragment; })
  }

  ngAfterViewInit(): void {
    try {
      if (this.fragment == this.appRouteEnum.mpCommunicationFragmentId) {
        this.scrollIntoViewOnCommunicationPre();
      }
    } catch (e) { console.log(e); }
  }

  scrollIntoViewOnCommunicationPre() {
    document.querySelector('#mp-communication').scrollIntoView();
  }

  getConcentricToken() {
    this.commonService.loaderRequired = true;
    this.myAccountService.getConcentricToken(this.customerKey).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.getConcentricResponse = this.responseData.Data;
            if (this.getConcentricResponse.IsSuccess) {
              this.token = this.getConcentricResponse.ConsentricToken;
            }
            else {
              this.token = "";
            }
            const s1 = this._renderer2.createElement("script");
            s1.innerHTML = `
                let widget_config = {
                  templateId: "57sYDaqBYeB",
                  hideButtons: true,
                  token: "`+ this.token + `",
                  widgetId: "Dh8HZjHyTw",
                }
              `
            this._renderer2.appendChild(this._document.body, s1);
            const s2 = this._renderer2.createElement("script");
            s2.src = 'https://widget.sandbox.consentric.io/public/init.js';
            s2.id = "init";
            this._renderer2.appendChild(this._document.body, s2);
            if (this.fragment == this.appRouteEnum.mpCommunicationFragmentId) { this.scrollIntoViewOnCommunicationPre(); }
          }
        }
        else {
          console.log(this.responseData.ResponseMessage);
        }
      }
    );
  }

  getMyPreferences(isSavePreferenceClicked: boolean) {
    this.commonService.loaderRequired = false;
    this.getPreferencesRequest.CustomerKey = this.customerKey;
    this.getPreferencesRequest.Email = localStorage.getItem('Email');
    this.getPreferencesRequest.IsMasterData = true;
    this.getPreferencesRequest.IsMyPreferencesPage = true;
    this.myAccountService.getMyPreferences(this.getPreferencesRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.myPreferencesResponse = this.responseData.Data;
            this.addressControl = this.myPreferencesResponse.Addresses.filter(x => x.IsDefault)[0];
            this.populateForm(this.myPreferencesResponse);
            this.favouriteStationDisplayCount = this.myPreferencesResponse.FavouriteStationsList?.length > 0 ? this.myPreferencesResponse.FavouriteStationsList?.length : 1;
            this.storageDataService.clearLocalStorageData("myPreferencesResponse");
            this.storageDataService.setLocalStorageData("myPreferencesResponse", this.myPreferencesResponse, true);
            this.locations = this.myPreferencesResponse.StationsList;
            if (localStorage.getItem('CustomerKey') != null && localStorage.getItem('Email') != null) {
              this.setPrefrencesStationData();
            } 
            this.filterOutFavouriteFromMasterLocation();
            this.favoriteStation1 = this.filterStation("favoriteStation1Control");
            this.favoriteStation2 = this.filterStation("favoriteStation2Control");
            this.favoriteStation3 = this.filterStation("favoriteStation3Control");
            this.favoriteStation4 = this.filterStation("favoriteStation4Control");
            this.favoriteStation5 = this.filterStation("favoriteStation5Control");
            window.scrollTo(0,0);
            if (this.fragment == this.appRouteEnum.mpCommunicationFragmentId) { this.scrollIntoViewOnCommunicationPre(); }
          }
          else {
            this.notificationservice.error(this.responseData.ResponseMessage);
          }
        }
        else {
          this.notificationservice.error(this.responseData.ResponseMessage);
        }
        this.showClubAvantiPopupAndSavePreferencMessage(isSavePreferenceClicked);
      }
    );
  }

  _filterFavoriteStation(value: string): StationLocation[] {
    const filterValue = value.toLowerCase();
    let suggestedLocations = this.commonService.getFilteredStation(this.filteredOutLocation, filterValue);
    suggestedLocations = this.commonService.getMoreFilteredStations(suggestedLocations, filterValue);
    return suggestedLocations.length ? suggestedLocations : [{ Id: null, Name: 'No results found' }];
  }

  onStationChanges(num, count) {
    if (num == 4) {
      if (count == 41) {
        this.favoriteStation1 = this.filterStation("favoriteStation1Control");
      }
      else if (count == 42) {
        this.favoriteStation2 = this.filterStation("favoriteStation2Control");
      }
      else if (count == 43) {
        this.favoriteStation3 = this.filterStation("favoriteStation3Control");
      }
      else if (count == 44) {
        this.favoriteStation4 = this.filterStation("favoriteStation4Control");
      }
      else if (count == 45) {
        this.favoriteStation5 = this.filterStation("favoriteStation5Control");
      }
    }
  }

  filterStation(favoriteStationControl) {
    return this.myPreferencesForm.get(favoriteStationControl).valueChanges
      .pipe(
        startWith(''),
        map(location => location.length >= 2 ? this._filterFavoriteStation(location) : [])
      );
  }

  onClickSubmit() {
    this.setMyPreferencesFormFieldErrorToNull();
    let myPreferencesFormValue = this.myPreferencesForm.getRawValue();
    this.myPreferencesRequest = new MyPreferencesRequest();
    this.myPreferencesRequest.CustomerKey = this.customerKey;
    this.stationList = this.myPreferencesResponse.StationsList;
    this.settingDataWhenFavoriteStation1ControlIsNotNull(myPreferencesFormValue);
    this.settingDataWhenFavoriteStation2ControlIsNotNull(myPreferencesFormValue);
    this.settingDataWhenFavoriteStation3ControlIsNotNull(myPreferencesFormValue);
    this.settingDataWhenFavoriteStation4ControlIsNotNull(myPreferencesFormValue);
    this.settingDataWhenFavoriteStation5ControlIsNotNull(myPreferencesFormValue);
    if (this.myPreferencesForm.valid) {
      this.creatingMyPreferencesRequest(myPreferencesFormValue);
      this.saveMyPreferences(this.myPreferencesRequest);      
    }
    else {
      this.makingMyPreferencesControlAsInvalid();
    }
  }

  getRegisterToLoyality(myPreferencesFormValue){
    if(this.myPreferencesResponse.IsRegisteredToLoyality || this.myPreferencesResponse.IsRegistrationInProgress) return false;
    else if(myPreferencesFormValue.clubAvantiControl) return myPreferencesFormValue.clubAvantiControl;
    return false;
  }

  onSelectAddress(address) {
    this.addressControl = address;
  }

  saveMyPreferences(myPreferencesRequest) {
    this.myAccountService.saveMyPreferences(myPreferencesRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data != null) {
              this.savePreferencesResponse = this.responseData.Data;
              this.getConcentricToken();
              setTimeout(() => this.spinnerService.show(), 1);
              this.getMyPreferences(true);
              this.commonService.updateUserAddressesInLocalStorage(this.myPreferencesRequest.CustomerInfoUpdate.Addresses);
            }
          }
          else {
            this.notificationservice.error(this.responseData.ResponseMessage);
          }
        }
        else {
          this.notificationservice.error(this.responseData.ResponseMessage);
        }
      }
    );
  }

  // Method to show my preferences response message
  showResponseOfSavePreferences(savePreferencesResponse: SavePreferencesRespons) {
    if (savePreferencesResponse.IsPreferencesSaveSuccess) {
      this.notificationservice.success(savePreferencesResponse.ResponseMessage);
    }
    else {
      this.notificationservice.error(savePreferencesResponse.ResponseMessage);
    }
  }

  populateForm(myPreferences: any) {
    this.myPreferencesForm.setValue({
      deliveryModeControl: myPreferences.UserDeliveryMode,
      favoriteStation1Control: (myPreferences.FavouriteStationsList != null && myPreferences.FavouriteStationsList.length >= 1) ? myPreferences.FavouriteStationsList[0] : '',
      favoriteStation2Control: (myPreferences.FavouriteStationsList != null && myPreferences.FavouriteStationsList.length >= 2) ? myPreferences.FavouriteStationsList[1] : '',
      favoriteStation3Control: (myPreferences.FavouriteStationsList != null && myPreferences.FavouriteStationsList.length >= 3) ? myPreferences.FavouriteStationsList[2] : '',
      favoriteStation4Control: (myPreferences.FavouriteStationsList != null && myPreferences.FavouriteStationsList.length >= 4) ? myPreferences.FavouriteStationsList[3] : '',
      favoriteStation5Control: (myPreferences.FavouriteStationsList != null && myPreferences.FavouriteStationsList.length == 5) ? myPreferences.FavouriteStationsList[4] : '',
      paymentModeControl: myPreferences.PaymentModeType,
      railCardControl: myPreferences.UserRailCard ? myPreferences.UserRailCard.Code : '',
      clubAvantiControl: false
    });
  }

  _allowSelection(option: string): { [className: string]: boolean } {
    return {
      'no-data': option === 'No results found',
    }
  }

  // Method to display club avanti opt-in success/error in popup
  clubAvantiPopup(savePreferencesResponse: SavePreferencesRespons) {
    let dialogRef = this.dialog.open(ClubAvantiPopupComponent, {
      disableClose: savePreferencesResponse.EnrolledForLoyality,
      width: savePreferencesResponse.EnrolledForLoyality? '570px' : '768px',
      panelClass: 'clubAvantiContainer',
      data: {
        Success: savePreferencesResponse.EnrolledForLoyality,
        Message: savePreferencesResponse.EnrolmentFailureMessage,
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      if (!savePreferencesResponse.EnrolledForLoyality)
        this.showResponseOfSavePreferences(savePreferencesResponse);
    });
  }

  openLoyaltySignupPopup() {
    let myPreferencesForm = this.myPreferencesForm.value;
    if (myPreferencesForm.clubAvantiControl) {
      let dialogRef = this.dialog.open(LoyaltySignupPopupComponent, {
        width: '480px',
        height: '294px',
        panelClass: 'loyalty-signup-popup',
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((flag) => {
        if (flag) {
          let dom = document.querySelector('#savePreference');
          seamless.elementScrollIntoView(dom, {
            block: "center",
            scroll: "smooth"
          });
        }
      });
    }

  }

  setMyPreferencesFormFieldErrorToNull () {
    this.myPreferencesForm.markAllAsTouched();
    this.myPreferencesForm.get('favoriteStation1Control').setErrors(null);
    this.myPreferencesForm.get('favoriteStation2Control').setErrors(null);
    this.myPreferencesForm.get('favoriteStation3Control').setErrors(null);
    this.myPreferencesForm.get('favoriteStation4Control').setErrors(null);
    this.myPreferencesForm.get('favoriteStation5Control').setErrors(null);
  }

  creatingMyPreferencesRequest (myPreferencesFormValue) {
    this.myPreferencesRequest.PayMentModeType = myPreferencesFormValue.paymentModeControl;
    this.myPreferencesRequest.FavouriteStations = new Array<string>();
    if (myPreferencesFormValue.favoriteStation1Control != null && myPreferencesFormValue.favoriteStation1Control != undefined && myPreferencesFormValue.favoriteStation1Control != '')
      this.myPreferencesRequest.FavouriteStations.push(myPreferencesFormValue.favoriteStation1Control);
    if (myPreferencesFormValue.favoriteStation2Control != null && myPreferencesFormValue.favoriteStation2Control != undefined && myPreferencesFormValue.favoriteStation2Control != '')
      this.myPreferencesRequest.FavouriteStations.push(myPreferencesFormValue.favoriteStation2Control);
    if (myPreferencesFormValue.favoriteStation3Control != null && myPreferencesFormValue.favoriteStation3Control != undefined && myPreferencesFormValue.favoriteStation3Control != '')
      this.myPreferencesRequest.FavouriteStations.push(myPreferencesFormValue.favoriteStation3Control);
    if (myPreferencesFormValue.favoriteStation4Control != null && myPreferencesFormValue.favoriteStation4Control != undefined && myPreferencesFormValue.favoriteStation4Control != '')
      this.myPreferencesRequest.FavouriteStations.push(myPreferencesFormValue.favoriteStation4Control);
    if (myPreferencesFormValue.favoriteStation5Control != null && myPreferencesFormValue.favoriteStation5Control != undefined && myPreferencesFormValue.favoriteStation5Control != '')
      this.myPreferencesRequest.FavouriteStations.push(myPreferencesFormValue.favoriteStation5Control);
    this.myPreferencesRequest.CustomerInfoUpdate = new CustomerInfoUpdate();
    this.myPreferencesRequest.CustomerInfoUpdate.Email = localStorage.getItem('Email');
    this.myPreferencesRequest.CustomerInfoUpdate.Addresses = new Array<CustomerAddress>();
    this.myPreferencesRequest.CustomerInfoUpdate.FirstName = localStorage.getItem('FirstName');
    this.myPreferencesResponse.Addresses.forEach((obj, _index) => {
      if (obj.Address == this.addressControl.Address && obj.AddressType == this.addressControl.AddressType) {
        obj.IsDefault = true;
      }
      else {
        obj.IsDefault = false;
      }
    });
    this.myPreferencesRequest.CustomerInfoUpdate.Addresses = this.myPreferencesResponse.Addresses;
    this.creatingMyPreferencesDeliveryModeRequest(myPreferencesFormValue);
    this.creatingMyPreferencesRailCardRequest(myPreferencesFormValue);
    this.myPreferencesRequest.RegisterToLoyality = this.getRegisterToLoyality(myPreferencesFormValue); 
  }

  creatingMyPreferencesDeliveryModeRequest (myPreferencesFormValue) {
    this.myPreferencesRequest.DeliveryMode = new CustomerAttributeRequest();
    if (myPreferencesFormValue.deliveryModeControl != null && myPreferencesFormValue.deliveryModeControl != undefined && myPreferencesFormValue.deliveryModeControl != '') {
      this.myPreferencesRequest.DeliveryMode.DisplayName = myPreferencesFormValue.deliveryModeControl;
      this.myPreferencesRequest.DeliveryMode.Name = "Delivery";
      this.myPreferencesRequest.DeliveryMode.Value = myPreferencesFormValue.deliveryModeControl;
    }
  }

  creatingMyPreferencesRailCardRequest (myPreferencesFormValue) {
    this.myPreferencesRequest.RailCard = new CustomerAttributeRequest();
    if (myPreferencesFormValue.railCardControl != null && myPreferencesFormValue.railCardControl != undefined && myPreferencesFormValue.railCardControl != '') {
      let railCard = this.myPreferencesResponse.RailCardList.filter(x => x.Code == myPreferencesFormValue.railCardControl);
      if (railCard.length > 0) {
        this.myPreferencesRequest.RailCard.DisplayName = railCard[0].Description;
        this.myPreferencesRequest.RailCard.Name = "RailCard";
        this.myPreferencesRequest.RailCard.Value = railCard[0].Code;
      }
    }
  }

  makingMyPreferencesControlAsInvalid () {
    for (const key of Object.keys(this.myPreferencesForm.controls)) {
      if (this.myPreferencesForm.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector('[formcontrolname="' + key + '"]');
        invalidControl.focus();
        break;
      }
    }
  }

  settingDataWhenFavoriteStation1ControlIsNotNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation1Control != null && myPreferencesFormValue.favoriteStation1Control != undefined && myPreferencesFormValue.favoriteStation1Control != '') {
      if (this.stationList != null && this.stationList != undefined && this.stationList.length > 0) {
        this.setErrorOnFavoriteStationControl(myPreferencesFormValue.favoriteStation1Control.toLowerCase(), 'favoriteStation1Control');
      }
      if (this.myPreferencesForm.get('favoriteStation1Control').errors == null) {
        this.setErrorWhenFavoriteStation1ControlErrorIsNull(myPreferencesFormValue);
      }
    }
  }

  setErrorWhenFavoriteStation1ControlErrorIsNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation2Control != null && myPreferencesFormValue.favoriteStation2Control != undefined && myPreferencesFormValue.favoriteStation2Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation2Control', myPreferencesFormValue.favoriteStation1Control, myPreferencesFormValue.favoriteStation2Control);
    }
    if (myPreferencesFormValue.favoriteStation3Control != null && myPreferencesFormValue.favoriteStation3Control != undefined && myPreferencesFormValue.favoriteStation3Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation3Control', myPreferencesFormValue.favoriteStation1Control, myPreferencesFormValue.favoriteStation3Control);
    }
    if (myPreferencesFormValue.favoriteStation4Control != null && myPreferencesFormValue.favoriteStation4Control != undefined && myPreferencesFormValue.favoriteStation4Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation4Control', myPreferencesFormValue.favoriteStation1Control, myPreferencesFormValue.favoriteStation4Control);
    }
    if (myPreferencesFormValue.favoriteStation5Control != null && myPreferencesFormValue.favoriteStation5Control != undefined && myPreferencesFormValue.favoriteStation5Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation5Control', myPreferencesFormValue.favoriteStation1Control, myPreferencesFormValue.favoriteStation5Control);
    }
  }

  settingDataWhenFavoriteStation2ControlIsNotNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation2Control != null && myPreferencesFormValue.favoriteStation2Control != undefined && myPreferencesFormValue.favoriteStation2Control != '') {
      if (this.stationList != null && this.stationList != undefined && this.stationList.length > 0) {
        this.setErrorOnFavoriteStationControl(myPreferencesFormValue.favoriteStation2Control.toLowerCase(), 'favoriteStation2Control');
      }
      if (this.myPreferencesForm.get('favoriteStation2Control').errors == null) {
        this.setErrorWhenFavoriteStation2ControlErrorIsNull(myPreferencesFormValue);
      }
    }
  }

  setErrorWhenFavoriteStation2ControlErrorIsNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation1Control != null && myPreferencesFormValue.favoriteStation1Control != undefined && myPreferencesFormValue.favoriteStation1Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation1Control', myPreferencesFormValue.favoriteStation2Control, myPreferencesFormValue.favoriteStation1Control);
    }
    if (myPreferencesFormValue.favoriteStation3Control != null && myPreferencesFormValue.favoriteStation3Control != undefined && myPreferencesFormValue.favoriteStation3Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation3Control', myPreferencesFormValue.favoriteStation2Control, myPreferencesFormValue.favoriteStation3Control);
    }
    if (myPreferencesFormValue.favoriteStation4Control != null && myPreferencesFormValue.favoriteStation4Control != undefined && myPreferencesFormValue.favoriteStation4Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation4Control', myPreferencesFormValue.favoriteStation2Control, myPreferencesFormValue.favoriteStation4Control);
    }
    if (myPreferencesFormValue.favoriteStation5Control != null && myPreferencesFormValue.favoriteStation5Control != undefined && myPreferencesFormValue.favoriteStation5Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation5Control', myPreferencesFormValue.favoriteStation2Control, myPreferencesFormValue.favoriteStation5Control);
    }
  }

  settingDataWhenFavoriteStation3ControlIsNotNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation3Control != null && myPreferencesFormValue.favoriteStation3Control != undefined && myPreferencesFormValue.favoriteStation3Control != '') {
      if (this.stationList != null && this.stationList != undefined && this.stationList.length > 0) {
        this.setErrorOnFavoriteStationControl(myPreferencesFormValue.favoriteStation3Control.toLowerCase(), 'favoriteStation3Control');
      }
      if (this.myPreferencesForm.get('favoriteStation3Control').errors == null) {
        this.setErrorWhenFavoriteStation3ControlErrorIsNull(myPreferencesFormValue);
      }
    }
  }

  setErrorWhenFavoriteStation3ControlErrorIsNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation1Control != null && myPreferencesFormValue.favoriteStation1Control != undefined && myPreferencesFormValue.favoriteStation1Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation1Control', myPreferencesFormValue.favoriteStation3Control, myPreferencesFormValue.favoriteStation1Control);
    }
    if (myPreferencesFormValue.favoriteStation2Control != null && myPreferencesFormValue.favoriteStation2Control != undefined && myPreferencesFormValue.favoriteStation2Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation2Control', myPreferencesFormValue.favoriteStation3Control, myPreferencesFormValue.favoriteStation2Control);
    }
    if (myPreferencesFormValue.favoriteStation4Control != null && myPreferencesFormValue.favoriteStation4Control != undefined && myPreferencesFormValue.favoriteStation4Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation4Control', myPreferencesFormValue.favoriteStation3Control, myPreferencesFormValue.favoriteStation4Control);
    }
    if (myPreferencesFormValue.favoriteStation5Control != null && myPreferencesFormValue.favoriteStation5Control != undefined && myPreferencesFormValue.favoriteStation5Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation5Control', myPreferencesFormValue.favoriteStation3Control, myPreferencesFormValue.favoriteStation5Control);
    }
  }

  settingDataWhenFavoriteStation4ControlIsNotNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation4Control != null && myPreferencesFormValue.favoriteStation4Control != undefined && myPreferencesFormValue.favoriteStation4Control != '') {
      if (this.stationList != null && this.stationList != undefined && this.stationList.length > 0) {
        this.setErrorOnFavoriteStationControl(myPreferencesFormValue.favoriteStation4Control.toLowerCase(), 'favoriteStation4Control');
      }
      if (this.myPreferencesForm.get('favoriteStation4Control').errors == null) {
        this.setErrorWhenFavoriteStation4ControlErrorIsNull(myPreferencesFormValue);
      }
    }
  }

  setErrorWhenFavoriteStation4ControlErrorIsNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation1Control != null && myPreferencesFormValue.favoriteStation1Control != undefined && myPreferencesFormValue.favoriteStation1Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation1Control', myPreferencesFormValue.favoriteStation4Control, myPreferencesFormValue.favoriteStation1Control);
    }
    if (myPreferencesFormValue.favoriteStation2Control != null && myPreferencesFormValue.favoriteStation2Control != undefined && myPreferencesFormValue.favoriteStation2Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation2Control', myPreferencesFormValue.favoriteStation4Control, myPreferencesFormValue.favoriteStation2Control);
    }
    if (myPreferencesFormValue.favoriteStation3Control != null && myPreferencesFormValue.favoriteStation3Control != undefined && myPreferencesFormValue.favoriteStation3Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation3Control', myPreferencesFormValue.favoriteStation4Control, myPreferencesFormValue.favoriteStation3Control);
    }
    if (myPreferencesFormValue.favoriteStation5Control != null && myPreferencesFormValue.favoriteStation5Control != undefined && myPreferencesFormValue.favoriteStation5Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation5Control', myPreferencesFormValue.favoriteStation4Control, myPreferencesFormValue.favoriteStation5Control);
    }
  }

  settingDataWhenFavoriteStation5ControlIsNotNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation5Control != null && myPreferencesFormValue.favoriteStation5Control != undefined && myPreferencesFormValue.favoriteStation5Control != '') {
      if (this.stationList != null && this.stationList != undefined && this.stationList.length > 0) {
        this.setErrorOnFavoriteStationControl(myPreferencesFormValue.favoriteStation5Control.toLowerCase(), 'favoriteStation5Control');
      }
      if (this.myPreferencesForm.get('favoriteStation5Control').errors == null) {
        this.setErrorWhenFavoriteStation5ControlErrorIsNull(myPreferencesFormValue);
      }
    }
  }

  setErrorWhenFavoriteStation5ControlErrorIsNull (myPreferencesFormValue) {
    if (myPreferencesFormValue.favoriteStation1Control != null && myPreferencesFormValue.favoriteStation1Control != undefined && myPreferencesFormValue.favoriteStation1Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation1Control', myPreferencesFormValue.favoriteStation5Control, myPreferencesFormValue.favoriteStation1Control);
    }
    if (myPreferencesFormValue.favoriteStation2Control != null && myPreferencesFormValue.favoriteStation2Control != undefined && myPreferencesFormValue.favoriteStation2Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation2Control', myPreferencesFormValue.favoriteStation5Control, myPreferencesFormValue.favoriteStation2Control);
    }
    if (myPreferencesFormValue.favoriteStation3Control != null && myPreferencesFormValue.favoriteStation3Control != undefined && myPreferencesFormValue.favoriteStation3Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation3Control', myPreferencesFormValue.favoriteStation5Control, myPreferencesFormValue.favoriteStation3Control);
    }
    if (myPreferencesFormValue.favoriteStation4Control != null && myPreferencesFormValue.favoriteStation4Control != undefined && myPreferencesFormValue.favoriteStation4Control != '') {
      this.setErrorOnFavoriteStationControlWhenErrorIsNull('favoriteStation4Control', myPreferencesFormValue.favoriteStation5Control, myPreferencesFormValue.favoriteStation4Control);
    }
  }

  setErrorOnFavoriteStationControl (value, controlName){
    let station = this.stationList.filter(location => location.Name.toLowerCase() == value);
    if (station.length == 0) {
      this.myPreferencesForm.get(controlName).setErrors({ validStation: true });
    }
  }

  setErrorOnFavoriteStationControlWhenErrorIsNull (controlName, controlValue1, controlValue2) {
    const favoriteStationControl = this.myPreferencesForm.get(controlName);
    if (controlValue1 == controlValue2) {
      favoriteStationControl.setErrors({ mustMatch: true });
    }
  }

  updateFavoriteStationCount () {
     this.favouriteStationDisplayCount = ++this.favouriteStationDisplayCount;
  }

   // filter out the common location out of pupular and master location
   filterOutFavouriteFromMasterLocation(){
    this.filteredOutLocation = this.locations;
    if (this.favouriteLocations && this.favouriteLocations.length > 0) {
      // filterOut favourite location from Masterlocation
      this.filteredOutLocation = this.commonService.commonFilterFunction(this.filteredOutLocation, this.favouriteLocations)
    }
  }

  setPrefrencesStationData() {
    if (this.myPreferencesResponse != null) {
      this.favouriteLocations = this.locations.filter(item => {
        if (this.myPreferencesResponse.FavouriteStationsList != null) {
          if (this.myPreferencesResponse.FavouriteStationsList.indexOf(item.Name) !== -1) {
            return true;
          }
        }
      });
    }
  }
  
  showClubAvantiPopupAndSavePreferencMessage(isSavePreferenceClicked){
    if(isSavePreferenceClicked){
      if (this.myPreferencesRequest.RegisterToLoyality) {
        this.clubAvantiPopup(this.savePreferencesResponse);
      }
      else {
        this.showResponseOfSavePreferences(this.savePreferencesResponse);
      } 
    }
  }
}
