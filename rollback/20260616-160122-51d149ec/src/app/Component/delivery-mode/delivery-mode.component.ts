import { Component, OnInit, ElementRef, ViewChild, HostListener, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryMode, DeliveryModeRequest, SmartCardInfo, SmartCardValidationRequest } from 'src/app/models/delivery-modes/delivery-modes.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { Observable, Subscription } from 'rxjs';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { CustomerLoginRequest } from 'src/app/models/customer/customer-login-request.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { CustomerLoginResponse } from 'src/app/models/customer/customer-login-response.model';
import { DeliveryModeService } from 'src/app/services/delivery-mode-service';
import { FareBreakdownComponent } from '../mixing-deck/fare-breakdown/fare-breakdown.component';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { JourneyModel, FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { CommonServices } from 'src/app/services/common.service';
import { CustomerAddress, Address } from 'src/app/models/payment-details/billing-address-response.model';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { browserRefresh, navigationTrigger, eventUrl } from '../../app-component/app.component';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { CustomerInfoUpdate } from 'src/app/models/customer/customer-address.model';
import { AddressService } from 'src/app/services/address.service';
import { DeliveryModeEnum, AppRouteEnum, LocalStorageKeyEnum, QuickBuyEnum } from 'src/app/utility/app-constants.service';
import { ConfirmPopupComponent } from '../review-and-buy/confirm-popup/confirm-popup.component';
import { GeneralInformation, SmartCardDetails } from 'src/app/models/account/my-payment-vouchers.model';
import { FareModel } from 'src/app/models/mixing-deck/fare.model';
import { TicketInfoComponent } from '../mixing-deck/ticket-info/ticket-info.component';
import { checkUserName } from 'src/app/utility/custom-validations/must-match-validation';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { DisruptionServiceComponent } from '../mixing-deck/disruption-service/disruption-service.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
declare var pca: any;

@Component({
  selector: 'app-delivery-mode',
  templateUrl: './delivery-mode.component.html',
  styleUrls: ['./delivery-mode.component.css'],
  styles: [`
  .my-custom-class .tooltip-inner {
    background-color: darkgreen;
    font-size: 125%;
  }
  .my-custom-class .arrow::before {
    border-top-color: darkgreen;
  }
`]
})
export class DeliveryModeComponent implements OnInit {
  @ViewChild('mep', {static: false,read: MatExpansionPanel}) mep: MatExpansionPanel;
  @ViewChild('PostExpensionPanelmep', {static: false,read: MatExpansionPanel}) PostExpensionPanelmep: MatExpansionPanel;
  departure: string = "London Euston";
  arrival: string = "GAINSBOROUG";
  deliveryModes: DeliveryMode;
  isDeliveryModeTOD: boolean = false;
  isDeliveryModeEticket: boolean = false;
  isDeliveryModeSmartCard: boolean = false;
  isDeliveryModeNextDayDelivery: boolean = false;
  nextDayDeliveryModePrice: number = 0;
  isDeliveryModeFirstClassPost: boolean = false;
  firstClassPostPrice: number = 0;
  deliveryModeCurrency: string;
  deliveryModesCount: number = 0;
  showChangeDeliveryButton: boolean = false;
  filteredStations: Observable<LocationMasterData[]>;
  locations: LocationMasterData[];
  control = new FormControl();
  locationControl: string;
  customerLoginRequest: any;
  deliveryModeRequest: DeliveryModeRequest;
  defaultDeliveryMode: string = 'TOD';
  deliveryModeCache: string;
  selectedStation: number;
  totalFare: number;
  responseData: ResponseData;
  invalidJourney: string = '';
  stationResponseData: ResponseData;
  customerLoginResponse: CustomerLoginResponse;
  isSubmitted: boolean = true;
  firstClassPost: FormGroup;
  nextDayDelivery: FormGroup;
  addressForm: FormGroup;
  smartCardForm: FormGroup;
  isTODChecked: boolean = false;
  isEticketChecked: boolean = false;
  isFirstClassPostChecked: boolean = false;
  isNextDayDeliveryChecked: boolean = false;
  isSmartCardDeliveryChecked: boolean = false;
  extended: boolean = false;
  isAddAddress: boolean = false;
  isAdd: boolean = false;
  showAddAdress: boolean = true;
  isAddressShow: boolean = false;
  address: CustomerAddress;
  editableAddress: CustomerAddress;
  editIndex: number;
  addressList = ["postCode", "address1", "address2", "address3", "city", "country"];
  addressListFc = ["postCodeFc", "address1Fc", "address2Fc", "address3Fc", "cityFc", "countryFc"];
  // for Smart Card
  addressListSm = ["postCodeSm", "address1Sm", "address2Sm", "address3Sm", "citySm", "countrySm"];
  customerInfoUpdateModel: CustomerInfoUpdate
  isNreBasket: boolean;
  step = true;
  step1 = 0;
  step2 = 0;
  step3 = 0;
  isShow = false;
  status: boolean = false;
  totalPrice: number = 0.00;
  billingAddresses: CustomerAddress[];
  storedAddress: CustomerAddress[];
  isDelete: boolean = false;
  customerKey: any;
  customerEmail: any;
  isHideTod: boolean;
  browserRefresh: boolean;
  navigationTrigger: string;
  eventUrl: string;
  isJEForwardClick: boolean = false;
  selected = "Mr";
  tempDeliveryAddress: Address;
  MySmartcard = false;
  maxDate = new Date();
  minDate = this.maxDate.setFullYear(this.maxDate.getFullYear() - 15);
  isMultiplePassengerCase: boolean = false;

  smartCardNumber: string;
  locationId: string;
  locationName: string;
  IsLoadStationAvailable: boolean;
  isOrderSmartCard: boolean = false;
  smartCardPassengerList: SmartCardInfo[];
  totalPassenger: number;
  isValidatePassenger: boolean = true;
  totalAdult: number;
  totalChild: number;
  adultCount: number = 0;
  childCount: number = 0;
  IsValidateAddPassenger: boolean;
  selectedSmartCardNumber: string;
  isCheckedTermsCondition: boolean = false;
  selectedSmartcardList: { passengerIndex: number, smartcardIndex: number, smartcard: string }[] = [];
  isAddSmartCard: boolean = false;
  basketCount: number = 0;
  postDeliveryForm: FormGroup;
  showSmartCardCancel: boolean = false;
  reviewBuyCache: string;
  IsDeliveryModeSmartcardSelected: boolean = false;
  showOnlySelectedDeliveryType: boolean = false;
  firstClassDeliveryPriceForPost: number = 2.00;
  nextDayDeliveryPriceForPost: number = 7.50;
  isSmartCardPanelAddress: boolean = false;
  isPostPanelAddress: boolean = false;
  sticky: boolean;
  showclasstoggle: boolean = false;
  onSelectPassenger: boolean = false;
  postDeliveryTypeValue;
  postDeliveryPrice: number = 2.00;
  innerWidth: number = 0;
  defaultDeliveryAddressIndex: number = 0;
  defaultDeliveryAddressIndexPost: number = 0;
  singleSmartCardDefaultOpen: boolean = true;
  selectedaddress: any;
  hasDefault:boolean = false;

  sharedService: SharedService;
  notificationService: NotificationService;
  appRouteEnum: AppRouteEnum;
  deliveryModeService: DeliveryModeService;
  router: Router;
  spinnerService: NgxSpinnerService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  addressService: AddressService;
  deliveryModeEnum: DeliveryModeEnum;
  commonService: CommonServices;
  dataLayerService: DataLayerService;
  el: ElementRef;
  ga4dataLayerService: GA4DatalayerService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  quickBuyEnum: QuickBuyEnum;
  postCodeValueChangeSubscription: Subscription;
  constructor(private readonly injector: Injector, private readonly formbuilder: FormBuilder, private readonly dialog: MatDialog) {
    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.notificationService = this.injector.get(NotificationService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.deliveryModeService = this.injector.get(DeliveryModeService);
    this.router = this.injector.get(Router);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.addressService = this.injector.get(AddressService);
    this.deliveryModeEnum = this.injector.get(DeliveryModeEnum);
    this.commonService = this.injector.get(CommonServices);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.el = this.injector.get(ElementRef);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.quickBuyEnum = this.injector.get(QuickBuyEnum);
    if (!this.sharedService.IsJEForwardClick) {
      this.setConstructorData();
    }
  }

  orderSmartcardForm: any = this.formbuilder.group({
    Title: ['', [Validators.required]],
    Name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    Surname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    SmartcardNickName: ['', [Validators.required]],
    DateOfBirth: ['', [Validators.required]],
    delPersonTitle: ['', [Validators.required]],
    delPersonName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    delPersonSurname: ['', [Validators.required,Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    checked: new FormControl(false)
  }
    , {
      validator: [checkUserName('SmartcardNickName')]


    })

  orderSmartcardtoggle() {
    this.showSmartCardCancel = false;
    this.isOrderSmartCard = true;
  }

  cancelOrderSmartCard() {
    this.orderSmartcardForm.reset();
    this.isOrderSmartCard = false;
    this.IsDeliveryModeSmartcardSelected = true;
  }
  
  // fixed 1089 call function for select post delivery type radio button
  radioChange(event){
   this.postDeliveryTypeValue = event.value;
   if(this.postDeliveryTypeValue == 'FRTFIRSTCLASS'){
      this.postDeliveryPrice = 2.00;
   }else{
      this.postDeliveryPrice = 7.50;
   }
  }

  setConstructorData() {
    this.customerLoginRequest = new CustomerLoginRequest;
    this.deliveryModeRequest = new DeliveryModeRequest;
    this.deliveryModes = this.sharedService.deliveryModes;
    this.deliveryModeRequest.ReservationCache = this.sharedService.ReservationCache;
    this.deliveryModeRequest.IsNreBasket = this.sharedService.isNreBasket;
    this.deliveryModeRequest.PreviousCache = this.sharedService.reviewBuyCache;
    this.deliveryModeRequest.CustomerKey = localStorage.getItem('CustomerKey');

    if (this.sharedService.searchRequest != null) {

      this.departure = this.sharedService.searchRequest.DepartureLocationName;
      this.arrival = this.sharedService.searchRequest.ArrivalLocationName;
    }

    if (this.sharedService.reviewBuyResponse != undefined && this.sharedService.reviewBuyResponse != null) {
      this.basketCount = this.sharedService.reviewBuyResponse.BasketCount;
    }
  }

  showclickEvent() {
    this.showclasstoggle = !this.showclasstoggle;
  }

  ngOnDestroy() {
    if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.ReviewBuy)) {
      this.onClickBuyNow();
    }
    else if (this.router.getCurrentNavigation().trigger == "popstate" && (this.router.url.includes(this.appRouteEnum.JourneyExtras) || this.router.url.includes(this.appRouteEnum.Register) || this.router.url.includes(this.appRouteEnum.RegistrationSuccess))) {
      this.router.navigateByUrl('/' + this.appRouteEnum.JourneyExtras);
    }
    else if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.MixingDeck) && this.commonService.doesTravelExtraPageSkipped()) {
      this.router.navigateByUrl('/' + this.appRouteEnum.MixingDeck);
    }
    if (this.subsVar) {
      this.subsVar.unsubscribe()
    }
    this.postCodeValueChangeSubscription.unsubscribe();
  }

  subsVar: Subscription;

  @HostListener('window:resize', ['$event'])
  onResize(_event) {
    this.innerWidth = window.innerWidth;
  }
  ngOnInit() {

    // for showing basket icon when go back from review-buy to search-results
    if (this.sharedService?.reviewBuyResponse) {
      this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
    }

    this.innerWidth = window.innerWidth;
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    if (!this.sharedService.IsJEForwardClick) {
      this.ngOnInitFunction()
    }
    this.subsVar = this.sharedService.getJourneyExtraCompleteStatus.subscribe(check => {
      this.isJEForwardClick = check;
      if (check) {
        this.setConstructorData();
        this.ngOnInitFunction()
      }
    });
    this.trimSpacesFromPostCodeFormControl();
  }
  onLoadPassengerList() {
    this.smartCardPassengerList = new Array<SmartCardInfo>();
    let passenger = new SmartCardInfo();
    passenger.IsAdult = undefined;
    if (this.sharedService?.searchRequest?.DepartureLocationName != undefined) {
      passenger.LocationId = this.findLocationCode(this.sharedService.searchRequest.DepartureLocationName).toString();
      if (passenger.LocationId != "0") {
        passenger.LocationName = this.sharedService.searchRequest.DepartureLocationName;
      }
      else if (passenger.LocationId == "0") {
        passenger.LocationId = "";
        passenger.LocationName = "";
      }
    }
    else {
      passenger.LocationId = "";
      passenger.LocationName = "";
    }
    passenger.IsLoadStationAvailable = passenger.LocationId == "" ? false : true;
    passenger.SmartCardNumber = "";
    passenger.IsAddedSmartcard = false;
    this.smartCardPassengerList.push(passenger);
  }
  ngOnInitFunction() {
    this.browserRefresh = browserRefresh;
    this.navigationTrigger = navigationTrigger;
    this.eventUrl = eventUrl;
    //Get shared cache data
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
        this.sharedService.searchRequest = sharedSiblingRefresh.searchRequest;
        this.sharedService.journeyExtrasResponseShared = sharedSiblingRefresh.journeyExtrasResponseShared;
        this.sharedService.createReservationRequest = sharedSiblingRefresh.createReservationRequest;
        this.sharedService.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        this.deliveryModes = sharedSiblingRefresh.deliveryModes;
        this.deliveryModeRequest.ReservationCache = sharedSiblingRefresh.ReservationCache;
        this.deliveryModeRequest.IsNreBasket = sharedSiblingRefresh.isNreBasket;
        this.deliveryModeRequest.PreviousCache = sharedSiblingRefresh.reviewBuyCache;
        this.sharedService.ReservationCache = sharedSiblingRefresh.ReservationCache;
        this.sharedService.isNreBasket = sharedSiblingRefresh.isNreBasket;
        this.sharedService.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
        this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        if (this.sharedService.reviewBuyResponse != null && this.sharedService.reviewBuyResponse != undefined) {
          this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
        }
        this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        if (this.sharedService.searchRequest != null) {
          this.departure = this.sharedService.searchRequest.DepartureLocationName;
          this.arrival = this.sharedService.searchRequest.ArrivalLocationName;

        }
      }
    }



    this.getDeliveryMode();
    this.createForms();
    this.totalPrice = +(this.sharedService.calculateTotalAmount());
    if (this.sharedService.searchRequest != null) {
      this.totalPassenger = this.sharedService.searchRequest.Child + this.sharedService.searchRequest.Adult;
      this.totalAdult = this.sharedService.searchRequest.Adult;
      this.totalChild = this.sharedService.searchRequest.Child;
      if (this.totalPassenger > 1) {
        this.isMultiplePassengerCase = true;
      }
    }
    this.billingAddresses = new Array<CustomerAddress>();
    this.storedAddress = new Array<CustomerAddress>();
    this.customerInfoUpdateModel = new CustomerInfoUpdate;
    this.customerInfoUpdateModel.Addresses = new Array<CustomerAddress>();
    this.deliveryModeRequest.Title = localStorage.getItem('Title');

    this.deliveryModeRequest.Name = localStorage.getItem('FirstName');
    this.deliveryModeRequest.Surname = localStorage.getItem('LastName');
    this.initializeFormsGroup();
    this.populateForms();
  }

  createForms() {
    this.nextDayDelivery = this.formbuilder.group({
      title: new FormControl(''),
      name: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
      surname: new FormControl('', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
    },
    );

    this.firstClassPost = this.formbuilder.group({
      title: new FormControl(''),
      name: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
      surname: new FormControl('', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
    },
    );
    let title = localStorage.getItem('Title');
    let firstName = localStorage.getItem('FirstName');
    let lastName = localStorage.getItem('LastName');

    // Next Day Delivery Form
    this.postDeliveryForm = this.formbuilder.group({
      title: new FormControl(title ? title : ''),
      deliveryType: new FormControl(),
      name: new FormControl(firstName ? firstName : '', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
      surname: new FormControl(lastName ? lastName : '', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
    },);

    this.addressForm = this.formbuilder.group({
      address1: new FormControl("", [Validators.required,Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      address2: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      address3: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      city: new FormControl("", [Validators.required,Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      postCode: new FormControl("", [Validators.required, Validators.minLength(4)]),
      country: new FormControl("", [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
    });


  }

  viewmoreToggle() {
    this.isShow = !this.isShow;
    this.status = !this.status;
  }

  extendDeliveryOption(exp) {
    this.extended = !this.extended;
    this.step = exp;
    if (this.isHideTod && this.isDeliveryModeEticket) {
      this.onSelectDeliveryMode('eTicket');
    }
    else if (!this.isEticketChecked && this.isTODChecked) {
      this.onSelectDeliveryMode('TOD');
    }
    else if (!this.isDeliveryModeEticket && this.isDeliveryModeTOD) {
      this.onSelectDeliveryMode('TOD');
    }
    else {
      this.onSelectDeliveryMode('eTicket');
    }
  }
  removePassenger(PassengerNo) {
    if (this.smartCardPassengerList.length > 1) {
      let findIndexInSelectedList = this.selectedSmartcardList.findIndex(x => x.passengerIndex == PassengerNo)
      if (findIndexInSelectedList != -1)
        this.selectedSmartcardList.splice(findIndexInSelectedList, 1);

      this.smartCardPassengerList[PassengerNo].IsAdult ? this.adultCount-- : this.childCount--;
      this.smartCardPassengerList.splice(PassengerNo, 1);

      this.updateAvailableStatus();
    }
  }
  onAddressCreated(isSmartCard) {
      this.addressList.forEach(x => {
        let elementValue = document.getElementById(x)['value'];
        const ctrlValue = this.addressForm.controls[x];
        ctrlValue.setValue(elementValue);
      });
    for (const key of Object.keys(this.addressForm.controls)) {
      if (this.addressForm.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector('[formcontrolname="' + key + '"]');
        invalidControl.focus();
        return false;
      }
    }
    if (this.addressForm.valid) {
      this.address = new CustomerAddress();
      this.address.Address = new Address();
      this.address.Address.Address1 = this.addressForm.get('address1').value;
      this.address.Address.Address2 = this.addressForm.get('address2').value;
      this.address.Address.Address3 = this.addressForm.get('address3').value;
      this.address.Address.PostCode = this.addressForm.get('postCode').value;
      this.address.Address.City = this.addressForm.get('city').value;
      this.address.Address.Country = this.addressForm.get('country').value;
      if (this.isAddAddress) {
        this.address.AddressType = 'Address' + " " + (this.billingAddresses.length + 1).toString();
        let obj = Object.assign({}, this.address);
        this.billingAddresses.push(obj);
        this.isAddAddress = false;
        this.isAddressShow = false;
        this.isAdd = true;
      }
      else {
        this.address.Address.CountryCode = this.editableAddress.Address.CountryCode;
        this.address.AddressType = this.editableAddress.AddressType;
        this.address.IsDefault = this.editableAddress.IsDefault;
        this.billingAddresses[this.editIndex] = this.address;
        this.isAddressShow = false;
      }
      this.showAddAdress = true;
      this.customerInfoUpdateModel.Email = localStorage.getItem('Email');
      this.customerInfoUpdateModel.Addresses = this.billingAddresses;
      this.sendModifyAddress(isSmartCard);
    }
    else {
      this.notificationService.warn("Please fill all required data.");
    }
  }

  onClose() {
    this.isAddressShow = false;
    this.isAddAddress = false;
    this.showAddAdress = true;
  }
  onPostPanelCancel(){
    this.PostExpensionPanelmep.expanded = false;
  }
  onSmartCardPanelCancel(){
    this.isOrderSmartCard = false;
    this.mep.expanded = false;
  }
  
  updateAvailableStatus() {
    this.deliveryModes.SmartCardDetails.forEach(element => {
      let j = this.selectedSmartcardList.findIndex(x => x.smartcard == element.SmartCardNumber)
      if (j != -1) {
        element.IsAlreadySelected = true;
      }
      else {
        element.IsAlreadySelected = false;
      }
    });
  }

  checkAddressPanelName(addressformid) {
    if (addressformid == 'addressForm1') {
      this.isPostPanelAddress = true;
      this.isSmartCardPanelAddress = false;
    } else if (addressformid == 'addressFormSmartcard') {
      this.isSmartCardPanelAddress = true;
      this.isPostPanelAddress = false;
    }
  }

  addressmodal(addressformid) {
    this.checkAddressPanelName(addressformid);
    addressformid = '#' + addressformid;
    this.isAddAddress = true;
    this.isAddressShow = true;
    this.showAddAdress = false;
    setTimeout(() => {
      document.querySelectorAll(addressformid)[0].scrollIntoView({ block: 'center' });
      (document.querySelectorAll(addressformid)[0].getElementsByTagName('input')[0] as HTMLElement).focus();
    }, 0);
    this.initializeAddress(this.isAddAddress);
  }

  editAddress(index,addressformid) {
    this.checkAddressPanelName(addressformid);
    addressformid = '#' + addressformid;
    this.editableAddress = this.billingAddresses[index];
    this.editIndex = index;
    this.isAddressShow = true;
    this.isAddAddress = false;
    this.showAddAdress = false;
    setTimeout(() => {
      document.querySelectorAll(addressformid)[0].scrollIntoView({ block: 'center' });
      (document.querySelectorAll(addressformid)[0].getElementsByTagName('input')[0] as HTMLElement).focus();
    }, 0);
    this.initializeAddress(this.isAddAddress);
  }

  initializeAddress(isAdd) {
    pca.load();
    if (!isAdd) {
      this.addressForm.patchValue({
        address1: this.editableAddress.Address.Address1,
        address2: this.editableAddress.Address.Address2,
        address3: this.editableAddress.Address.Address3,
        city: this.editableAddress.Address.City,
        postCode: this.editableAddress.Address.PostCode,
        country: this.editableAddress.Address.Country
      });
    }
    else {
      this.addressForm.markAsUntouched();
      this.addressForm.patchValue({
        address1: null,
        address2: null,
        address3: null,
        city: null,
        postCode: null,
        country: null
      });
    }
  }

  onSelectAddress(index, isSmartCard) {
    this.deliveryModeRequest.Address = this.billingAddresses[index].Address;
    this.selectedaddress = this.deliveryModes.Addresses[index];
    this.tempDeliveryAddress = this.deliveryModeRequest.Address;
    if (isSmartCard)
      this.defaultDeliveryAddressIndex = index;
    else
      this.defaultDeliveryAddressIndexPost = index;
  }

  setBillingDeleteAddressIndex(index, isSmartCard) {
    let temp;
    for (let i = index; i < this.billingAddresses.length - 1; i++) {
      temp = this.storedAddress[i].AddressType;
      this.billingAddresses[i + 1].AddressType = temp;
    }
    if (this.billingAddresses.length > 1) {
      if (this.deliveryModeRequest.Address === this.billingAddresses[index].Address) {
        this.deliveryModeRequest.Address = null;
      }
      this.billingAddresses.splice(index, 1);
      // only last option is left for address
      if (this.billingAddresses.length == 1) {
        this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
      }
      else {
        if ((this.billingAddresses.filter(x => x.IsDefault)).length > 0)
          this.deliveryModeRequest.Address = this.billingAddresses.filter(x => x.IsDefault)[0].Address;
        else
          this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
      }
    }
    else {
      this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
    }
    this.isDelete = true;
    this.customerInfoUpdateModel.Email = localStorage.getItem('Email');
    this.customerInfoUpdateModel.Addresses = this.billingAddresses;
    this.sendModifyAddress(isSmartCard);
  }

  onDeleteAddresss(index, isSmartCard) {
    if (this.billingAddresses.length == 1) {
      this.notificationService.warn("You must have at least one postal address");
      return;
    }
    let dialogRef = this.dialog.open(ConfirmPopupComponent, {
      width: '500px',
      disableClose: false,
    });
    dialogRef.componentInstance.confirmMessage = "Are you sure you want to delete this address?";
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.setBillingDeleteAddressIndex(index, isSmartCard);
      }
      else {
        return false;
      }
    });
  }

  setIndexToAddress(){
    this.deliveryModes.Addresses.forEach((address, index) => {
      if (address.IsDefault) {
        this.defaultDeliveryAddressIndex = index;
        this.defaultDeliveryAddressIndexPost = index;
        this.selectedaddress = this.deliveryModes.Addresses[index];
        this.hasDefault = true;
      }
    });
  }
  selectedDeleteAddress() {
    if (this.deliveryModes.Addresses.length > 0) {
      this.hasDefault = false;
      if (this.deliveryModes.Addresses.length > 0) {
        this.setIndexToAddress();
      }
      if (!this.hasDefault) {
        this.deliveryModes.Addresses[0].IsDefault = true;
        this.defaultDeliveryAddressIndex = 0;
        this.defaultDeliveryAddressIndexPost = 0;
        this.selectedaddress = this.deliveryModes.Addresses[0];
      }
    }
  }
  getmodifiedAddressMsg() {
    if (this.isDelete) {
      this.selectedDeleteAddress();
      this.isDelete = false;
      this.notificationService.success('Address deleted successfully.');
    }
    else if (this.isAdd) {
      this.isAdd = false;
      this.deliveryModes.Addresses = this.billingAddresses;
      if (this.deliveryModes.Addresses.length > 0) {
        this.hasDefault = false;
        if (this.deliveryModes.Addresses.length > 0) {
          this.setIndexToAddress();
        }
        if (!this.hasDefault) {
          this.deliveryModes.Addresses[0].IsDefault = true;
          this.defaultDeliveryAddressIndex = 0;
          this.defaultDeliveryAddressIndexPost = 0;
          this.selectedaddress = this.deliveryModes.Addresses[0];
          this.deliveryModeRequest.Address = this.deliveryModes.Addresses[0].Address;
        }
      }
      this.notificationService.success('Address added successfully.');
    }
    else {
      this.notificationService.success('Address updated successfully.');
    }
    this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
    if (!this.isDefaultAvailable(this.billingAddresses)) {
      this.billingAddresses[0].IsDefault = true;
    }
  }

  sendModifyAddress(_isSmartCard) {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);
    this.addressService.modifyAddress(this.customerInfoUpdateModel).subscribe(res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data) {
              this.getmodifiedAddressMsg();
            }
            else {
              this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
              this.deliveryModeRequest.Address = this.tempDeliveryAddress;
              this.notificationService.error('Sorry, We are not able to update address this time. Please try again.');
            }
          }
          else {
            this.billingAddresses = this.storedAddress.slice(0);
            this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
            this.deliveryModeRequest.Address = this.tempDeliveryAddress;
          }
          this.isAdd = false;
          this.isDelete = false;
        }
      });
  }

  isDefaultAvailable(addressarray): boolean {
    for(let address of addressarray){
      if (address.IsDefault) return true;
    }
    return false;
  }

  setStep(step) {
    this.step = step;
  }

  findLocationCode(value) {
    if (value !== null || value !== '' || value !== undefined || value !== 0) {
      if (this.deliveryModes.SmartCardLocation != null && this.deliveryModes.SmartCardLocation != undefined) {
        let station = this.deliveryModes.SmartCardLocation.filter(m => m.Name == value);
        if (station.length > 0)
          return station[0].Id;
        else
          return 0;
      }
      else {
        return 0;
      }
    }
    else {
      return 0;
    }
  }

  farebreakdown() {
    this.dialog.open(FareBreakdownComponent, {
      width: '600px',
      disableClose: false,
      panelClass: ['farebreak', 'common-popup-theme'],
    });
  }

  filterSmartCard(smartCards: SmartCardDetails[]) {
    if (smartCards != undefined && smartCards != null) {
      let filteredSmartCard = smartCards.filter(x => x.Status === 'ISSUED' || (x.Status === 'ACCEPTED' && x.Type === 'LINK') && x.RecipientCustomerKey !== x.SenderCustomerKey);
      // check for filtering based on adult and child count
      if (this.sharedService.searchRequest.Adult == 0 && this.sharedService.searchRequest.Child != 0) {
        filteredSmartCard = filteredSmartCard.filter(x => (!x.IsAdult));
      }
      else if (this.sharedService.searchRequest.Adult != 0 && this.sharedService.searchRequest.Child == 0) {
        filteredSmartCard = filteredSmartCard.filter(x => x.IsAdult);
      }
      //check ends
      if (filteredSmartCard.length == 0) {
        return null;
      }
      else {
        return filteredSmartCard;
      }
    }
  }

  setDeliveryModesData() {
    if (this.deliveryModes != null) {
      if (this.deliveryModes.DeliveryMode != null) {
        this.deliveryModes.DeliveryMode = this.deliveryModes.DeliveryMode.filter(x => !x.IsHide && x.DeliveryMode != 'FRT');
        this.deliveryModes.DeliveryMode = this.deliveryModes.DeliveryMode.filter(x => {
          if ((this.totalAdult > 0 && this.totalChild > 0) && (x.DeliveryMode === 'SMART_CARD')) {
            return false;
          }
          return true;
        });
        this.deliveryModesCount = this.deliveryModes.DeliveryMode.length;

        this.getValueOnCheckDeliveryModesCount();

        this.getShowHideDeliveryModeValueInSetDelivery();
      }
      this.getAddressDtaInCaseOfSetDeliveryModes();
    }
    this.getDeliveryModeExtendedValue();

    let myPreferencesResponse = this.storageDataService.getLocalStorageData("myPreferencesResponse", true);

    if (myPreferencesResponse != null && myPreferencesResponse != undefined && myPreferencesResponse != ''
      && myPreferencesResponse.UserDeliveryMode != null && myPreferencesResponse.UserDeliveryMode != undefined
      && myPreferencesResponse.UserDeliveryMode != '' && this.isPreferenceTicketTypeAvailableToSelect(myPreferencesResponse, this.deliveryModes, this.deliveryModeEnum)) {
      this.setDeliveryDatainCaseOfCheckPrefrences(myPreferencesResponse);
    }
    else {
      this.setDeliveryModesValueInCseOfNullPreference();
    }
  }
  getValueOnCheckDeliveryModesCount() {
    if (this.deliveryModesCount == 0) {
      this.notificationService.error('Sorry, there are currently no delivery modes available for your selected journey(s). Please try searching again.');
    }
    else {
      if (this.deliveryModesCount > 1) {
        if (this.deliveryModesCount == 2) {
          this.showChangeDeliveryButton = this.deliveryModes.DeliveryMode.some(x => x.DeliveryMode == 'FRTNEXTDAY' && !x.IsHide) && this.deliveryModes.DeliveryMode.some(x => x.DeliveryMode == 'FRTFIRSTCLASS' && !x.IsHide) ? true : false;
        }
      }
    }
  }
  getShowHideDeliveryModeValueInSetDelivery() {
    let displayFirstClassOrNextDayDelivery = false;
    this.deliveryModes.DeliveryMode.forEach(m => {
      if (m.DeliveryMode == 'TOD') {
        this.isHideTod = m.IsHide;
        this.getIsDeliveryModeTODValue();
        //Check for delivermodecounts incase price more than 1000. TOD will be there but isHideTod will true
        if (this.isHideTod) {
          this.deliveryModesCount -= 1;
        }
        //check end
      }
      else if (m.DeliveryMode == 'ETICKET') {
        this.isDeliveryModeEticket = true;
      }
      else if (m.DeliveryMode == 'SMART_CARD') {
        this.isDeliveryModeSmartCard = true;

      }
      else if (m.DeliveryMode == 'FRTNEXTDAY' && !m.IsHide) {
        // add custom hide property 
        if (!displayFirstClassOrNextDayDelivery) {
          m['displayBoth'] = true;
          displayFirstClassOrNextDayDelivery = true;

        } else {
          m['displayBoth'] = false;
        }
        this.postDeliveryForm.get('deliveryType').setValue('FRTNEXTDAY');
        this.isDeliveryModeNextDayDelivery = true;
        this.nextDayDeliveryModePrice = 7.50;
        this.postDeliveryPrice = 7.50;
      }
      else if (m.DeliveryMode == 'FRTFIRSTCLASS' && !m.IsHide) {
        // add custom hide property 
        if (!displayFirstClassOrNextDayDelivery) {
          m['displayBoth'] = true;
          displayFirstClassOrNextDayDelivery = true;

        } else {
          m['displayBoth'] = false;
        }
        this.postDeliveryForm.get('deliveryType').setValue('FRTFIRSTCLASS');
        this.isDeliveryModeFirstClassPost = true;
        this.firstClassPostPrice = 2;
        this.postDeliveryPrice = 2;
      }
      this.deliveryModeCurrency = m.Currency;
    });
  }

  getIsDeliveryModeTODValue() {
    this.isDeliveryModeTOD = this.isHideTod ? false : true;
  }

  getDeliveryModeExtendedValue() {
    if (!this.isDeliveryModeEticket && !this.isDeliveryModeTOD) {
      if (this.isDeliveryModeSmartCard) {
        this.extended = false;
      }
      else {
        this.extended = true;
      }
    }
  }

  getAddressDtaInCaseOfSetDeliveryModes() {
    if (this.deliveryModes.Addresses != null && this.deliveryModes.Addresses.length > 0) {
      this.billingAddresses = this.deliveryModes.Addresses;
      this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
      let address = this.billingAddresses.filter(m => m.IsDefault);
      this.billingAddresses.forEach((m, index) => {
        if (m.IsDefault) {
          this.defaultDeliveryAddressIndex = index;
          this.defaultDeliveryAddressIndexPost = index;
        }
      })
      if (address != undefined && address.length != 0) {
        this.deliveryModeRequest.Address = address[0].Address;
      }
      else {
        this.billingAddresses[0].IsDefault = true;
        this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
      }
      this.tempDeliveryAddress = this.deliveryModeRequest.Address;
    }
  }

  setDeliveryDatainCaseOfCheckPrefrences(myPreferencesResponse) {
    if (this.isDeliveryModeEticket && myPreferencesResponse.UserDeliveryMode == this.deliveryModeEnum.ETicket) {
      this.deliveryModeRequest.DeliveryMode = 'ETICKET';
      setTimeout(() => {
        this.onSelectDeliveryMode('eTicket');
      }, 0);
    }
    else if (this.isDeliveryModeTOD && myPreferencesResponse.UserDeliveryMode == this.deliveryModeEnum.TOD) {
      this.deliveryModeRequest.DeliveryMode = 'TOD';
      setTimeout(() => {
        this.onSelectDeliveryMode('TOD');
      }, 0);
    }
    else if (this.isDeliveryModeNextDayDelivery && myPreferencesResponse.UserDeliveryMode == this.deliveryModeEnum.NextDayDelivery) {
      this.deliveryModeRequest.DeliveryMode = 'FRTNEXTDAY';
      this.deliveryModeRequest.DeliveryType = 'NEXTDAYDELIVERY';
      setTimeout(() => {
        this.extended = false;
        this.extendDeliveryOption(true);
        this.onSelectDeliveryMode('FRTNEXTDAY');
      }, 0);
    }
    else if (this.isDeliveryModeFirstClassPost && myPreferencesResponse.UserDeliveryMode == this.deliveryModeEnum.FirstClassPost) {
      this.deliveryModeRequest.DeliveryMode = 'FRTFIRSTCLASS';
      this.deliveryModeRequest.DeliveryType = 'FIRSTCLASSPOST';
      setTimeout(() => {
        this.extended = false;
        this.extendDeliveryOption(true);
        this.onSelectDeliveryMode('FRTFIRSTCLASS');
      }, 0);
    }
    else if (!this.isDeliveryModeEticket && !this.isDeliveryModeTOD && this.isDeliveryModeNextDayDelivery) {
      this.deliveryModeRequest.DeliveryMode = 'FRTNEXTDAY';
      this.deliveryModeRequest.DeliveryType = 'NEXTDAYDELIVERY';
      setTimeout(() => {
        this.extended = false;
        this.extendDeliveryOption(true);
        this.onSelectDeliveryMode('NextDayDelivery');
      }, 0);
    }
    else if (this.isDeliveryModeSmartCard) {
      this.deliveryModeRequest.DeliveryMode = 'SMART_CARD';
      setTimeout(() => {
        this.onSelectDeliveryMode('SMART_CARD');
      }, 0);
    }
    else {
      if (this.isDeliveryModeEticket) {
        this.deliveryModeRequest.DeliveryMode = 'ETICKET';
        setTimeout(() => {
          this.onSelectDeliveryMode('eTicket');
        }, 0);
      }
      else if (this.isDeliveryModeTOD) {
        this.deliveryModeRequest.DeliveryMode = 'TOD';
        setTimeout(() => {
          this.onSelectDeliveryMode('TOD');
        }, 0);
      }
    }
  }
  // call method for check deliverymode type in case of set Delivery mode
  setDeliveryModesValueInCseOfNullPreference() {
    if (this.isDeliveryModeEticket) {
      this.deliveryModeRequest.DeliveryMode = 'ETICKET';
      setTimeout(() => {
        this.onSelectDeliveryMode('eTicket');
      }, 0);

    }
    else if (this.isDeliveryModeTOD && !this.isHideTod) {
      this.deliveryModeRequest.DeliveryMode = 'TOD';
      setTimeout(() => {
        this.onSelectDeliveryMode('TOD');
      }, 0);
    }
    else if (this.isDeliveryModeSmartCard) {
      this.deliveryModeRequest.DeliveryMode = 'SMART_CARD';
      setTimeout(() => {
        this.onSelectDeliveryMode('SMART_CARD');
      }, 0);
    }
    else if (this.isDeliveryModeNextDayDelivery) {
      this.deliveryModeRequest.DeliveryMode = 'FRTNEXTDAY';
      this.deliveryModeRequest.DeliveryType = 'NEXTDAYDELIVERY';
      setTimeout(() => {
        this.onSelectDeliveryMode('FRTNEXTDAY');
      }, 0);
    }
  }

  isPreferenceTicketTypeAvailableToSelect(myPreferencesResponse, deliveryModes:DeliveryMode, deliveryModeEnum:DeliveryModeEnum){
    try {      
      for(let deliveryMode of deliveryModes.DeliveryMode) {
        // If selected preference is E-ticket and it's available to select
        if ((myPreferencesResponse.UserDeliveryMode === deliveryModeEnum.ETicket) && (deliveryMode.DeliveryMode === 'ETICKET')) {
          return true
        }
        // If selected preference is First class delivery and it's available to select
        if ((myPreferencesResponse.UserDeliveryMode === deliveryModeEnum.FirstClassPost) && (deliveryMode.DeliveryMode === 'FRTFIRSTCLASS')) {
          return true
        }
        // If selected preference is Next day delivery and it's available to select
        if ((myPreferencesResponse.UserDeliveryMode === deliveryModeEnum.NextDayDelivery) && (deliveryMode.DeliveryMode === 'FRTNEXTDAY')) {
          return true
        }
        // If selected preference is Collect from station and it's available to select
        if ((myPreferencesResponse.UserDeliveryMode === deliveryModeEnum.TOD) && (deliveryMode.DeliveryMode === 'TOD')) {
          return true
        }
      }
      return false;      
    } catch (error) {
      console.log(error);
    }
  }

  // calling function to select a deliveryMode after click on Select button
  onSelectDeliveryMode(selectedDeliveryMode) {
    if (this.isNextDayDeliveryChecked) {
      this.totalPrice -= this.nextDayDeliveryModePrice;
    }
    else if (this.isFirstClassPostChecked) {
      this.totalPrice -= this.firstClassPostPrice;
    }
    this.isSubmitted = false;
    this.isTODChecked = false;
    this.isNextDayDeliveryChecked = false;
    this.isFirstClassPostChecked = false;
    this.isEticketChecked = false;
    this.isSmartCardDeliveryChecked = false;
    if (selectedDeliveryMode == this.appRouteEnum.DeliveryMode_TOD) {
      this.isTODChecked = true;
      this.deliveryModeRequest.DeliveryMode = 'TOD';
      this.deliveryModeRequest.DeliveryType = null;
    }
    else if (selectedDeliveryMode == this.appRouteEnum.DeliveryMode_ETicket) {
      this.isEticketChecked = true;
      this.deliveryModeRequest.DeliveryMode = 'ETICKET';
      this.deliveryModeRequest.DeliveryType = null;
    }
    else if (selectedDeliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card) {
      this.deliveryModeRequest.DeliveryType = null;      
      if(this.deliveryModes.DeliveryMode.length == 1){
        this.mep.expanded = this.singleSmartCardDefaultOpen ? true : false;
        this.singleSmartCardDefaultOpen = false;
      }
      this.mep.expanded = true;
      this.isSmartCardDeliveryChecked = true;
      this.IsDeliveryModeSmartcardSelected = true;
      this.deliveryModeRequest.DeliveryMode = 'SMART_CARD';
    }
    else if (selectedDeliveryMode == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS) {
      this.totalFare = this.totalFare + this.firstClassPostPrice;
      this.isFirstClassPostChecked = true;
      //Fare Breakup
      this.totalPrice += this.firstClassPostPrice;
      this.deliveryModeRequest.DeliveryMode = 'FRTFIRSTCLASS';
      this.deliveryModeRequest.DeliveryType = 'FIRSTCLASSPOST';
      //Expansion of Mat Expansion Panel
      this.step = false;
      this.PostExpensionPanelmep.expanded = true;
    }
    else if (selectedDeliveryMode == this.appRouteEnum.DeliveryMode_FRTNEXTDAY) {
      this.totalFare = this.totalFare + this.nextDayDeliveryModePrice;
      this.isNextDayDeliveryChecked = true;
      //Fare Breakup
      this.totalPrice += this.nextDayDeliveryModePrice;
      this.deliveryModeRequest.DeliveryMode = 'FRTNEXTDAY';
      this.deliveryModeRequest.DeliveryType = 'NEXTDAYDELIVERY';
      //Expansion of Mat Expansion Panel
      this.step = false;
      this.PostExpensionPanelmep.expanded = true;
    }
    this.updateFareBreakDown();

  }
  
  getFareBreakDownPassangerDetail() {
    let deliveryDetails = new JourneyModel;
    if (this.sharedService.searchRequest.Adult != 0 && this.sharedService.searchRequest.Child != 0) {
      deliveryDetails.Passenger = this.sharedService.searchRequest.Adult + ' * Adult' + ', ' + this.sharedService.searchRequest.Child + ' * Child';
    }
    else if (this.sharedService.searchRequest.Adult == 0 && this.sharedService.searchRequest.Child != 0) {
      deliveryDetails.Passenger = this.sharedService.searchRequest.Child + ' * Child';
    }
    else if (this.sharedService.searchRequest.Adult != 0 && this.sharedService.searchRequest.Child == 0) {
      deliveryDetails.Passenger = this.sharedService.searchRequest.Adult + ' * Adult';
    }
    return deliveryDetails;
  }
  updateFareBreakDown() {
    this.sharedService.fareBreakdownModelData.forEach((obj, index) => {
      obj.DeliveryDetails = new Array<JourneyModel>();
      let deliveryDetails = new JourneyModel;
      let deliveryDetailPassanger = this.getFareBreakDownPassangerDetail();
      if (deliveryDetailPassanger) {
        deliveryDetails = deliveryDetailPassanger;
      }
      if (this.isTODChecked) {
        deliveryDetails.JourneyDeliveryTitle = 'TOD';
        deliveryDetails.TotalPrice = 0;
        deliveryDetails.PricePerPerson = 0;
      }
      else if (this.isEticketChecked) {
        deliveryDetails.JourneyDeliveryTitle = 'ETICKET';
        deliveryDetails.TotalPrice = 0;
        deliveryDetails.PricePerPerson = 0;
      }
      else if (this.isNextDayDeliveryChecked) {
        deliveryDetails.JourneyDeliveryTitle = 'NEXTDAYDELIVERY';
        if (this.isNreBasket)
          deliveryDetails.TotalPrice = (index == 0) ? 7.50 : 0;
        else
          deliveryDetails.TotalPrice = 7.50;
      }
      else if (this.isFirstClassPostChecked) {
        deliveryDetails.JourneyDeliveryTitle = 'FIRSTCLASSPOST';
        deliveryDetails.TotalPrice = 2;
      }
      else if (this.isSmartCardDeliveryChecked) {
        deliveryDetails.JourneyDeliveryTitle = 'SMART_CARD';
        deliveryDetails.TotalPrice = 0;
      }
      obj.DeliveryDetails.push(deliveryDetails);
    });
    this.totalPrice = +(this.sharedService.calculateTotalAmount());
  }
  // check for smart card deliverymodes which used in below method getDeliveryModeRequest
  checkForsmartCardMode() {
    if (this.isDeliveryModeSmartCard) {
      if (this.sharedService?.searchRequest?.DepartureLocationName != undefined) {
        this.locationId = this.findLocationCode(this.sharedService.searchRequest.DepartureLocationName).toString();
        if (this.locationId != "0") {
          this.locationName = this.sharedService.searchRequest.DepartureLocationName;
        }
        else if (this.locationId == "0") {
          this.locationId = "";
          this.locationName = "";
        }
      }
      else {
        this.locationId = "";
        this.locationName = "";
      }
      this.IsLoadStationAvailable = this.locationId == '' ? false : true;
      this.onLoadPassengerList();
    }
  }
  getDeliveryModeRequest() {
    this.deliveryModeService.getDeliveryMode(this.deliveryModeRequest).subscribe(res => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          this.deliveryModes = this.responseData.Data;
          this.setDeliveryModesData();
          for (let [index, deliverymode] of this.deliveryModes.DeliveryMode.entries()) {
            // if selected anytype delivery mode then push it on top and remove previous value
            if (this.deliveryModeRequest.DeliveryMode == deliverymode.DeliveryMode) {
              this.deliveryModes.DeliveryMode.splice(0, 0, deliverymode)
              this.deliveryModes.DeliveryMode.splice(index + 1, 1);
            }
          }
          this.checkForsmartCardMode();

          this.deliveryModeCache = this.deliveryModes.DeliveryCache;
          this.isNreBasket = this.deliveryModes.IsNreBasket;
          this.dataLayerService.loadGALayerForCheckoutStep1(this.sharedService.searchRequest, this.sharedService.fareBreakdownModelData[0], this.sharedService.journeyExtrasResponseShared.Detail, this.sharedService.journeySummaryModel);
        }
        else {
          this.dataLayerService.loadGALayerForCheckoutStep1(null, null, null, null);
        }
      }
    });
  }
  getDeliveryMode() {
    this.spinnerService.show();
    this.deliveryModeRequest.UserEmail = localStorage.getItem('Email');
    if (this.sharedService.searchRequest.TravelSolutionDirection == 'SEASON') {
      this.deliveryModeRequest.isSeason = true;
    }
    else if (this.sharedService.searchRequest.TravelSolutionDirection == 'FLEXI') {
      this.deliveryModeRequest.ReservationCache = this.sharedService.journeyExtrasResponseShared.EvaluateTravelCache;
      this.deliveryModeRequest.isSeason = true;
    }
    this.deliveryModeRequest.IsFlexi = this.sharedService.searchRequest.IsFlexiTicketSelected;
    this.getDeliveryModeRequest();
  }
  // call method in case of get orderSmartcardForm Data on continue 
  getOrderSmartCardFormDetail() {
    if (this.locationId != undefined && this.locationId != null) {
      this.deliveryModeRequest.GeneralInformation = new GeneralInformation();
      this.deliveryModeRequest.GeneralInformation.Title = this.orderSmartcardForm.get('delPersonTitle').value;
      this.deliveryModeRequest.GeneralInformation.Name = this.orderSmartcardForm.get('delPersonName').value;
      this.deliveryModeRequest.GeneralInformation.Surname = this.orderSmartcardForm.get('delPersonSurname').value;
      this.deliveryModeRequest.GeneralInformation.Name = this.orderSmartcardForm.get('Name').value;
      this.deliveryModeRequest.GeneralInformation.Surname = this.orderSmartcardForm.get('Surname').value;
      this.deliveryModeRequest.GeneralInformation.SmartcardNickName = this.orderSmartcardForm.get('SmartcardNickName').value;
      this.deliveryModeRequest.GeneralInformation.Title = this.orderSmartcardForm.get('Title').value;
      this.deliveryModeRequest.GeneralInformation.DateOfBirth = this.orderSmartcardForm.get('DateOfBirth').value;

      if (this.locationId == "") {
        this.notificationService.error("Please fill smartcard load station detail.")
        return false;
      }

      if (this.locationId != "") {
        this.locationName = this.locationName.trim();
        this.locationId = this.findLocationCode(this.locationName).toString();
        if (this.locationId == "0") {
          this.locationId = "";
          this.notificationService.warn("please enter a valid load station detail.")
          return false;
        }
      }


      this.deliveryModeRequest.GeneralInformation.LoadSation = this.locationId;

      if (!this.isCheckedTermsCondition) {
        this.notificationService.error("Please accept terms and condtions first.");
        return false;
      }
      else {
        this.isCheckedTermsCondition = false;
      }
    }
    else {
      this.notificationService.error("Please fill smartcard load station details.");
      return false;
    }
  }
  // call method in case of order smart card delivery mode on continue
  checkOrderSmartCardDetail() {
    this.isSubmitted = true;
    this.orderSmartcardForm.markAllAsTouched();
    for (const key of Object.keys(this.orderSmartcardForm.controls)) {
      if (this.orderSmartcardForm.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector('[formcontrolname="' + key + '"]');
        if (!!invalidControl) invalidControl.focus();
        this.mep.expanded = true;
        return false;
      }
    }
    if (this.billingAddresses == null || this.billingAddresses.length == 0 || this.deliveryModeRequest.Address == null) {
      this.notificationService.warn("Address is required.");
      return false;
    }
    if (this.orderSmartcardForm.valid) {
      let getOrderSmartCardFormValue = this.getOrderSmartCardFormDetail();
      if (!getOrderSmartCardFormValue && getOrderSmartCardFormValue !== undefined) {
        return false;
      }
    }
    else {
      return false;
    }
  }
  // call method for showing notification error in case of invalid smartcard detail
  checkPassangerSmartCardDetailStep1() {
    for (let smartCardPassenger of this.smartCardPassengerList) {
      if (smartCardPassenger.IsAdult == undefined) {
        this.mep.expanded = true;
        this.notificationService.warn("Please fill all the passenger smartcard type details.")
        return false;
      }
      if ((smartCardPassenger.SmartCardNumber == "") || smartCardPassenger.SmartCardNumber == null) {
        this.mep.expanded = true;
        this.notificationService.warn("Please fill all the passenger smartcard number details.")

        return false;
      }
      if (smartCardPassenger.LocationId == "" || smartCardPassenger.LocationId == undefined || smartCardPassenger.LocationId == "0") {
        this.notificationService.warn("Please fill all the passenger smartcard load station details.")

        return false;
      }
      if (smartCardPassenger.LocationId != "") {
        smartCardPassenger.LocationName = smartCardPassenger.LocationName.trim();
        smartCardPassenger.LocationId = this.findLocationCode(smartCardPassenger.LocationName).toString();
        if (smartCardPassenger.LocationId == "0") {
          smartCardPassenger.LocationId = "";
          this.notificationService.warn("please enter a valid load station details.")
          return false;
        }
      }
    }
  }
  // call method for showing notification error in case of invalid Passangersmartcard detail
  checkPassangerSmartCardDetailStep2() {
    if (this.adultCount + this.childCount < this.totalPassenger) {

      this.notificationService.warn('Please enter smartcard details for all the passengers otherwise choose other delivery mode.')
      return false;
    }
    if (this.childCount > this.totalChild) {

      this.notificationService.warn("please select valid passenger types of smartcard.")
      return false;
    }
    if (this.adultCount > this.totalAdult) {

      this.notificationService.warn("please select valid passenger types of smartcard.")
      return false;
    }
  }
  // call method in case of get PassangerSmartCardDetail on continue
  checkPassangerSmartCardDetail() {
    this.smartCardPassengerList.forEach(element => {
      if (!this.isMultiplePassengerCase && (this.adultCount + this.childCount < 1)) {
        element.IsAdult = this.sharedService.searchRequest.Adult > 0 ? true : false;
        element.IsAdult ? this.adultCount++ : this.childCount++;
      }
    });
    let checkTotalsmartCardPassengerList = this.checkPassangerSmartCardDetailStep1();
    if (!checkTotalsmartCardPassengerList && checkTotalsmartCardPassengerList !== undefined) {
      return false;
    }

    let checkTotalPassnger = this.checkPassangerSmartCardDetailStep2();
    if (!checkTotalPassnger && checkTotalPassnger !== undefined) {
      return false;
    }
    this.deliveryModeRequest.SmartCardDelivery = this.smartCardPassengerList;
  }
  isDeliveryModesCheckedStep1ForPost() {
    this.postDeliveryForm.clearValidators();
    this.postDeliveryForm.updateValueAndValidity();
    this.isSubmitted = true;
    if (this.billingAddresses == null || this.billingAddresses.length == 0 || this.deliveryModeRequest.Address == null) {
      this.notificationService.warn("Address is required.");
      return false;
    }

    if (this.postDeliveryForm.valid) {
      this.deliveryModeRequest.Title = this.postDeliveryForm.get('title').value;
      this.deliveryModeRequest.Name = this.postDeliveryForm.get('name').value;
      this.deliveryModeRequest.Surname = this.postDeliveryForm.get('surname').value;
    }
    else {
      return false;
    }
  }
  // call method in case of smart card delivery mode on continue
  getSmartCardDeliveryCheckedValue() {
    if (this.isOrderSmartCard) {
      let getOrderSmartCardValue = this.checkOrderSmartCardDetail();
      if (!getOrderSmartCardValue && getOrderSmartCardValue !== undefined) {
        return false;
      }
    }
    else {
      this.deliveryModeRequest.SmartCardDelivery = new Array<SmartCardInfo>();
      let passangerSmartCard = this.checkPassangerSmartCardDetail();
      if (!passangerSmartCard && passangerSmartCard !== undefined) {
        return false;
      }
    }
  }
  // call function after click on Continue button
  onClickBuyNow() {
    this.commonService.loaderRequired = true;
    if (this.deliveryModesCount == 0) {
      this.notificationService.warn('Sorry, there are currently no delivery modes available for your selected journey(s). Please try searching again.');
      return;
    }
    if (this.deliveryModes.DeliveryMode.length == 1 && this.deliveryModes.DeliveryMode[0].DeliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card && !this.isSmartCardDeliveryChecked) {
      this.notificationService.warn("Please fill all the passenger smartcard number details.");
      return;
    }
    if (this.isTODChecked) {
      this.isSubmitted = true;
      this.deliveryModeRequest.DeliveryMode = this.defaultDeliveryMode;
    }
    else if (this.isEticketChecked) {
      this.firstClassPost.clearValidators();
      this.firstClassPost.updateValueAndValidity();
      this.nextDayDelivery.clearValidators();
      this.nextDayDelivery.updateValueAndValidity();
      this.isSubmitted = true;
    }
    else if (this.isNextDayDeliveryChecked || this.isFirstClassPostChecked) {
      let checkDeliveryForPost = this.isDeliveryModesCheckedStep1ForPost();
      if (!checkDeliveryForPost && checkDeliveryForPost !== undefined) {
        return false;
      }
    }
    else if (this.isSmartCardDeliveryChecked) {
      let smartCardCheckedValue = this.getSmartCardDeliveryCheckedValue();
      if (!smartCardCheckedValue && smartCardCheckedValue !== undefined) {
        return false;
      }
    }

    this.deliveryModeRequest.DeliveryCache = this.deliveryModeCache;
    this.deliveryModeRequest.PreviousCache = this.sharedService.reviewBuyCache;
    this.deliveryModeRequest.IsNreBasket = this.isNreBasket;
    this.getIsSeasonValueInCaseOfTravelSolutionDirection();

    this.deliveryModeRequest.IsAdult = this.sharedService.searchRequest.Adult > 0 ? true : false; //PICO-2150 added a property for check passanger added to smart card adult or child
    this.sendDeliveryModeRequestData();
  }
  getIsSeasonValueInCaseOfTravelSolutionDirection() {
    if ((this.sharedService.searchRequest.TravelSolutionDirection == 'SEASON') || (this.sharedService.searchRequest.TravelSolutionDirection == 'FLEXI')) {
      this.deliveryModeRequest.isSeason = true;
    }
  }
  // call api saveDeliveryMode after click on continue button
  sendDeliveryModeRequestData() {
    this.deliveryModeService.saveDeliveryModeData(this.deliveryModeRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.sharedService.reviewBuyResponse = this.responseData.Data;
            this.sharedService.reviewBuyCache = this.sharedService.reviewBuyResponse.ReviewBuyCache;
            this.sharedService.reviewBuyResponse.Journey = null;
            localStorage.setItem(this.localStorageKeyEnum.isQuickBuyOrContinue, this.quickBuyEnum.default);

            this.ga4dataLayerService.loadGALayerForAddDeliveryOption(this.sharedService.searchRequest, this.sharedService.journeySummaryModel, this.deliveryModeRequest.DeliveryMode, this.commonService.jourenyExtraForCheckout());
            this.ga4dataLayerService.loadGALayerForAddToCartInfo(this.sharedService.searchRequest, this.sharedService.journeySummaryModel, this.commonService.jourenyExtraForCheckout());

            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            if (this.responseData.Data != null) {
              this.router.navigate([`./` + this.appRouteEnum.ReviewBuy]);
            }
          }
          else if (this.responseData.ResponseCode == '203') {
            this.invalidJourney = this.responseData.ResponseMessage;
            this.totalPrice = 0;
            this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  initializeFormsGroup() {
    this.nextDayDelivery.setValue({
      title: '',
      name: '',
      surname: '',
    });
    this.firstClassPost.setValue({
      title: '',
      name: '',
      surname: '',
    });
  }

  populateForms() {
    let title = localStorage.getItem('Title');
    let firstName = localStorage.getItem('FirstName');
    let lastName = localStorage.getItem('LastName');
    if (this.commonService.titleListArrayWithOutOther.indexOf(title) < 0 && title != "") {
      title = "Other";
      this.nextDayDelivery.setValue({
        title: title,
        name: firstName,
        surname: lastName,
      });
      this.firstClassPost.setValue({
        title: title,
        name: firstName,
        surname: lastName,
      });
    } else {

      this.nextDayDelivery.setValue({
        title: title,
        name: firstName,
        surname: lastName,
      });
      this.firstClassPost.setValue({
        title: title,
        name: firstName,
        surname: lastName,
      });
      if (this.isOrderSmartCard) {
        this.orderSmartcardForm.setValue({
          Title: title,
          Name: firstName,
          Surname: lastName
        });
      }

    }
  }

  onTermConditionChange($event) {
    this.isCheckedTermsCondition = $event.checked
  }
  addPassInSmartCard() {
    if (this.smartCardPassengerList.length < this.totalPassenger) {
      let passenger = new SmartCardInfo();
      passenger.IsAdult = undefined;
      passenger.LocationId = this.findLocationCode(this.sharedService.searchRequest.DepartureLocationName).toString();
      if (passenger.LocationId != "0") {
        passenger.LocationName = this.sharedService.searchRequest.DepartureLocationName;
      }
      else if (passenger.LocationId == "0") {
        passenger.LocationId = "";
        passenger.LocationName = "";
      }
      passenger.IsLoadStationAvailable = passenger.LocationId == "" ? false : true;
      passenger.SmartCardNumber = "";
      passenger.SmartCardNumberText = "";
      passenger.SmartCardNumberSelectedOption = "";
      passenger.IsAddedSmartcard = false;
      this.smartCardPassengerList.push(passenger);
    }
  }
  setToLinkSmartCardNum(smartcard, i, smartcardNo) {
    this.deliveryModeService.addSmartCard(smartcard).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {

            this.IsValidateAddPassenger = this.responseData.Data.IsValidate;
            if (this.IsValidateAddPassenger) {
              this.notificationService.success(this.responseData.Data.SmartCardMessage);
              this.smartCardOptionSelect(i, null, smartcardNo, null);
              this.smartCardPassengerList[i].IsAddedSmartcard = true;
              this.smartCardPassengerList[i].SmartCardNumber = smartcardNo;
              this.updateAvailableStatus();
            }
            else
              this.notificationService.error(this.responseData.Data.SmartCardMessage);
          }
          else if (this.responseData.ResponseCode == '203') {
            console.log(this.responseData.ResponseMessage);
          }
          else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      }
    )
  }
  addSmartCard(smartcardNo, i) {
    if (smartcardNo.length < 18) {
      this.notificationService.error("smartcard is not valid.")
      return;
    }

    for (let index = 0; index < this.smartCardPassengerList.length; index++) {
      if (i != index) {
        if (smartcardNo == this.smartCardPassengerList[index].SmartCardNumber) {
          this.notificationService.warn("smartcard number already applied. Please enter another smartcard.")
          return;
        }
      }
    }
    let smartcard = new SmartCardValidationRequest();
    smartcard.SmartCardNumber = smartcardNo;
    smartcard.IsAdult = this.sharedService.searchRequest.Adult > 0 ? true : false; //PICO-2150 added a property for check passanger added to smart card adult or child
    this.setToLinkSmartCardNum(smartcard, i, smartcardNo);
    
  }

  smartCardOptionSelect(passengerIndex, smartcardIndex, selectedSmartCardNumber, isAddSmartCard) {
    if (this.selectedSmartcardList != undefined || this.selectedSmartcardList != null) {

      let i = this.selectedSmartcardList.findIndex(x => x.passengerIndex == passengerIndex);
      if (i != -1) {
        this.selectedSmartcardList[i].smartcard = selectedSmartCardNumber;
        this.selectedSmartcardList[i].smartcardIndex = smartcardIndex;
      }

      else {
        this.selectedSmartcardList.push({ "passengerIndex": passengerIndex, "smartcardIndex": smartcardIndex, "smartcard": selectedSmartCardNumber });
      }
    }
    this.updateAvailableStatus();
    this.smartCardPassengerList[passengerIndex].SmartCardNumberSelectedOption = selectedSmartCardNumber;
    this.smartCardPassengerList[passengerIndex].SmartCardNumber = selectedSmartCardNumber;

    if (isAddSmartCard) {
      this.smartCardPassengerList[passengerIndex].IsAddedSmartcard = false;

    }
    else if (isAddSmartCard === false) {
      this.smartCardPassengerList[passengerIndex].IsAddedSmartcard = true;
      this.smartCardPassengerList[passengerIndex].SmartCardNumberText = "";
    }

  }

  checkAdultChildCount(_i) {

    this.adultCount = 0;
    this.childCount = 0;
    this.onSelectPassenger = true;

    for(let smartCardPassenger of this.smartCardPassengerList){
      let isAdult: any = smartCardPassenger.IsAdult;
      if (isAdult) this.adultCount++;
      if (isAdult === false) this.childCount++;
    }

    if (this.childCount > this.totalChild) {
      this.notificationService.warn("please select valid passenger type.")
    }
  }

  onLocationChange(index, $event) {
    this.smartCardPassengerList[index].LocationName = $event.option.value;
    this.smartCardPassengerList[index].LocationId = this.findLocationCode($event.option.value).toString();
    this.smartCardPassengerList[index].IsLoadStationAvailable = true;
  }
  onLocationChangeOrder($event) {
    this.locationName = $event.option.value;
    this.locationId = this.findLocationCode($event.option.value).toString();
    this.IsLoadStationAvailable = true;
  }


  onInputLocationChange(index, $event) {
    this.smartCardPassengerList[index].LocationName = $event.currentTarget.value;
  }
  onInputLocationChangeOrder($event) {
    this.locationName = $event.currentTarget.value;
  }
  filterLocation(stationList: any, $event) {
    if ($event != undefined && $event.target.value != "" && $event.target.value.length >= 2) {
      this.filteredStations = this._filterLocation($event.target.value, stationList);
    }
    else {
      stationList = [];
      this.filteredStations = this._filterLocation($event.target.value, stationList);
    }
  }

  private _filterLocation(value: string, stationList: any): Observable<LocationMasterData[]> {
    const filterValue = value.toLowerCase();
    let suggestedLocations;
    if (value.length == 3) {
      suggestedLocations = stationList.filter(location => location.Name.split('(').pop().split(')')[0].toLowerCase().includes(filterValue));
      if (suggestedLocations.length <= 0) {
        suggestedLocations = stationList.filter(location => location.Name.toLowerCase().includes(filterValue));
      }
    }
    else {
      suggestedLocations = stationList.filter(location => location.Name.toLowerCase().includes(filterValue));
    }
    return suggestedLocations.length ? suggestedLocations : [{ Id: null, Name: 'No results found' }];

  }


  setStep1(step1) {
    this.step1 = step1;
  }
  setStep2(step2) {
    this.step2 = step2;
  }
  setStep3(step3) {
    this.step3 = step3;
  }
  ticketInfo(ticketType: string, fare: FareModel) {
    let ticketTypeCode = fare.TicketTypeCode;
    this.dialog.open(TicketInfoComponent, {
      disableClose: false,
      panelClass: 'ticket-info',
      data: {
        TicketType: ticketType.trim(),
        fare: fare,
        ticketTypeCode: ticketTypeCode
      }
    });
  }

  showRouteDetails(row, isReturnCase) {
    this.dialog.open(DisruptionServiceComponent, {
      width: '1086px',
      disableClose: false,
      id: "serviceDisruptionPopUpSingle",
      panelClass: 'your-journey-popup',
      data: {
        TravelSolutionCache: row.TravelSolutionCache,
        TravelSolutionId: row.TravelSolId,
        SaleCompanyId: row.SaleCompanyId,
        Changes: row.Changes,
        Duration: row.Duration,
        IsDisruption: row.IsDelayed,
        SearchCustomCache: isReturnCase ? this.sharedService.journeySummaryModel.ReturnSearchCache : this.sharedService.journeySummaryModel.SingleSearchCache,
      }
    });

  }

  getSelectedPostDeliveryPrice(deliveryMode: string) {
    switch (deliveryMode) {
      case 'FRTNEXTDAY': return this.nextDayDeliveryPriceForPost;
      case 'FRTFIRSTCLASS': return this.firstClassDeliveryPriceForPost;
    }
  }

  onEnterToDeliveryTypes(){
    (document.getElementById('deliverymodes').firstElementChild.getElementsByTagName('mat-expansion-panel-header')[0] as HTMLElement).focus();
  }

  goBack() {
    if (this.commonService.doesTravelExtraPageSkipped()) {
      this.router.navigate(["./" + this.appRouteEnum.MixingDeck]);
    }
    else {
      this.router.navigate(["./" + this.appRouteEnum.JourneyExtras]);
    }
  }

  trimSpacesFromPostCodeFormControl(){
    this.postCodeValueChangeSubscription = this.addressForm.controls['postCode'].valueChanges
    .subscribe(x=>{
      if(x?.includes(' ')){
        this.addressForm.controls['postCode'].setValue(x.trim().replace(/\s/g, ""))
      }
    });
  }
}
