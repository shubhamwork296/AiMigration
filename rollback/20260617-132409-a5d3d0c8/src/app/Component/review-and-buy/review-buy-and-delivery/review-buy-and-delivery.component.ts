import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FareBreakdownComponent } from '../../mixing-deck/fare-breakdown/fare-breakdown.component';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { ReviewBuyResponse, JourneyDetail, RemoveJourneyRequest, DiscountRequest, DiscountResponse, BasketJourneyRequestDto, RailCardPriceList } from 'src/app/models/review-buy/review-buy-model';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { CancelOrderSmartCard, DeliveryMode, DeliveryModeRequest, SmartCardInfo, SmartCardValidationRequest } from 'src/app/models/delivery-modes/delivery-modes.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { ReviewBuyService } from 'src/app/services/review-buy.service';
import { Router } from '@angular/router';
import { FareBreakdownModel, JourneyModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { browserRefresh } from '../../../app-component/app.component';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { TicketInfoComponent } from '../../mixing-deck/ticket-info/ticket-info.component';
import { AppRouteEnum, CommonIconImg, Ga4ItemListEnum, LocalStorageKeyEnum, NotificationErrorMsg, QuickBuyEnum, TravelSolutionDirectionEnum } from 'src/app/utility/app-constants.service';
import { ConfirmPopupComponent } from '../confirm-popup/confirm-popup.component';
import { CommonServices } from 'src/app/services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PaymentDetailRequest } from 'src/app/models/payment-details/payment-details-request.model';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { PaymentDetailResponse } from 'src/app/models/payment-details/payment-details-response.model';
import { TimeoutComponent } from '../timeout/timeout.component';
import { SeatpickerPopupComponent } from '../seatpicker-popup/seatpicker-popup.component';
import { JourneySummaryModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { DisruptionServiceComponent } from '../../mixing-deck/disruption-service/disruption-service.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { Address, CustomerAddress } from 'src/app/models/payment-details/billing-address-response.model';
import { checkUserName } from 'src/app/utility/custom-validations/must-match-validation';
import { CustomerInfoUpdate } from 'src/app/models/customer/customer-address.model';
import { AddressService } from 'src/app/services/address.service';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { Observable, Subscription ,of} from 'rxjs';
import { GeneralInformation, SmartCardDetails } from 'src/app/models/account/my-payment-vouchers.model';
import { DeliveryModeService } from 'src/app/services/delivery-mode-service';
import { MatExpansionPanel } from '@angular/material/expansion';
import * as moment from 'moment';
declare var pca: any;

@Component({
    selector: 'app-review-buy-and-delivery',
    templateUrl: './review-buy-and-delivery.component.html',
    styleUrls: ['./review-buy-and-delivery.component.css'],
    standalone: false
})
export class ReviewBuyAndDeliveryComponent implements OnInit {
  @ViewChild('mep', {static: false,read: MatExpansionPanel}) mep: MatExpansionPanel;
  @ViewChild('PostExpensionPanelmep', {static: false,read: MatExpansionPanel}) PostExpensionPanelmep: MatExpansionPanel;
  searchRequest: SearchRequestModel;
  reviewBuyResponse: ReviewBuyResponse;
  passengerDetailLabel: string;
  journeyType: string;
  deliveryModeRequest: DeliveryModeRequest;
  removeJourneyRequest: RemoveJourneyRequest;
  removeResponse: ReviewBuyResponse;
  discountResponse: DiscountResponse;
  addDiscountRequest: DiscountRequest;
  discountCode: string;
  reviewBuyCache: string;
  fareBreakDownData: FareBreakdownModel[];
  totalPrice: number = 0;
  responseData: ResponseData;
  discountCodeControl = new FormControl();
  firstClassPostPrice: number;
  nextDayDeliveryModePrice: number;
  browserRefresh: boolean;
  isBasketEmpty: boolean = false;
  basketJourneyRequestDto: BasketJourneyRequestDto;
  paymentDetailsRequest: PaymentDetailRequest;
  paymentDetailsResponse: PaymentDetailResponse;
  isDiscountAddDisabled: boolean = false;
  isRedirectFromRenew: boolean;
  reviewBuyJourneyTimeStampArr: any[] = [];
  removeIndexOfreviewBuyJourneyTimeStampArr = -1;
  deletedJourney = null;
  GAremoveCartResponse: ReviewBuyResponse;

  // * New Changes Bugfix
  isOpenSeatpicker: boolean = false;
  seatReservationMessage = "Seat picker is only available on Avanti West Coast trains";
  choosedTrainLeg: any;
  isLegChoosed: boolean = false;
  isOutwardLegChoosed: boolean;
  isNreBasket: boolean;
  sticky: boolean;

  sharedService: SharedService;
  reviewBuyService: ReviewBuyService;
  router: Router;
  notificationservice: NotificationService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  appRouteEnum: AppRouteEnum;
  commonService: CommonServices;
  spinnerService: NgxSpinnerService;
  paymentDetailsService: PaymentDetailsService;
  dataLayerService: DataLayerService;
  ga4DatalayerService: GA4DatalayerService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  isShowHeader: boolean = false;
  ga4ItemListEnum: Ga4ItemListEnum;
  railCardPriceList: RailCardPriceList;
  railCardPriceListArray: Array<RailCardPriceList> = [];
  notificationErrorMsg: NotificationErrorMsg;
  discountedPrice:  number;
  DeliveryModesDto: DeliveryMode;
  availableDeliveryModes: any;
  IsDeliveryModeSmartcardSelected: boolean = false;
  selectedSmartCardNumber: any;
  IsSmartCardAvailableFlag: any;
  defaultDeliveryAddressIndex: number = 0;
  selectedaddress: any;
  totalAdult: number;
  totalChild: number;
  adultCount: number = 0;
  childCount: number = 0;
  deliveryModes: any;
  billingAddresses: CustomerAddress[] = [];
  smartCardBillingAddress: CustomerAddress[] = [];
  postBiilingAddress: CustomerAddress[] = [];
  storedAddress: CustomerAddress[];
  nextDayDelivery: FormGroup;
  firstClassPost: FormGroup;
  postDeliveryForm: FormGroup;
  addressForm: FormGroup;
  locationId: string;
  locationName: string;
  IsLoadStationAvailable: boolean;
  smartCardPassengerList: SmartCardInfo[];
  deliveryModeCache: string;
  isDelete: boolean = false;
  customerInfoUpdateModel: CustomerInfoUpdate;
  addressService: AddressService;
  tempDeliveryAddress: Address;
  isAdd: boolean = false;
  hasDefault:boolean = false;
  defaultDeliveryAddressIndexPost: number = 0;
  nextDayDeliveryPrice: number = 7.50;
  editableAddress: CustomerAddress;
  editIndex: number;
  showAddAdress: boolean = true;
  isAddressShow: boolean = false;
  isAddAddress: boolean = false;
  isSmartCardPanelAddress: boolean = false;
  isPostPanelAddress: boolean = false;
  el: ElementRef;
  address: CustomerAddress;
  addressList = ["postCode", "address1", "address2", "address3", "city", "country"];
  // for Smart Card
  addressListSm = ["postCodeSm", "address1Sm", "address2Sm", "address3Sm", "citySm", "countrySm"];
  // for First Class
  addressListFc = ["postCodeFc", "address1Fc", "address2Fc", "address3Fc", "cityFc", "countryFc"];
  filteredStations: Observable<LocationMasterData[]>;
  showSmartCardCancel: boolean = false;
  isOrderSmartCard: boolean = false;
  totalPassenger: number;
  maxDate = new Date();
  showOnlySelectedDeliveryType: boolean = true;
  defaultDeliveryMode: string = 'TOD';
  isCheckedTermsCondition: boolean = false;
  isMultiplePassengerCase: boolean = false;
  invalidJourney: string = '';
  deliveryModeService: DeliveryModeService;
  deliveryModesCount: number = 0;
  showChangeDeliveryButton: boolean = false;
  postDeliveryPrice: number = 2.00;
  nextDayDeliveryPriceForPost: number = 7.50;
  firstClassDeliveryPriceForPost: number = 2.00;
  onSelectPassenger: boolean = false;
  selectedSmartcardList: { passengerIndex: number, smartcardIndex: number, smartcard: string }[] = [];
  isDeliveryModeNextDayDelivery: boolean = false;
  IsValidateAddPassenger: boolean;
  isDeliveryModeFirstClassPost: boolean = false;
  isHideTod: boolean;
  isDeliveryModeEticket: boolean = false;
  isDeliveryModeTOD: boolean = false;
  getIsBackButttonRes: boolean = false;
  quickBuyEnum: QuickBuyEnum; 
  orderSmartCardAddress: CustomerAddress[] = [];
  cancelOrderSmartCard: CancelOrderSmartCard;
  commonIconImg: CommonIconImg;
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;
  isChangeAddressOfPostDelivery: boolean = false;
  isChangeAddressOfOrderSmartCardDelivery: boolean = false;
  expiredJounreyDetailObject: any;
  isUpdateDeliveryModeOnSelection: boolean = false; // added to check any delivery mode updated or not for add_delivery_option ga4 data layer event
  isChangeNumberOfSmartCard: boolean = false;
  postCodeValueChangeSubscription: Subscription;

  constructor(private readonly injector: Injector, public dialog: MatDialog, private readonly formbuilder: FormBuilder) {

    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.reviewBuyService = this.injector.get(ReviewBuyService);
    this.router = this.injector.get(Router);
    this.notificationservice = this.injector.get(NotificationService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonService = this.injector.get(CommonServices);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.paymentDetailsService = this.injector.get(PaymentDetailsService);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4DatalayerService = this.injector.get(GA4DatalayerService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.basketJourneyRequestDto = new BasketJourneyRequestDto();
    this.reviewBuyResponse = new ReviewBuyResponse();
    this.reviewBuyResponse.Journey = new Array<JourneyDetail>();
    this.deliveryModeRequest = new DeliveryModeRequest;
    this.removeJourneyRequest = new RemoveJourneyRequest;
    this.addDiscountRequest = new DiscountRequest;
    this.reviewBuyResponse = this.sharedService.reviewBuyResponse;
    if (this.reviewBuyResponse != null && this.reviewBuyResponse != undefined) {
      this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
    }
    this.searchRequest = this.sharedService.searchRequest;
    this.fareBreakDownData = [];
    this.discountCodeControl.setValidators([Validators.minLength(19), Validators.maxLength(19)]);
    this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
    this.addressService = this.injector.get(AddressService);
    this.el = this.injector.get(ElementRef);
    this.deliveryModeService = this.injector.get(DeliveryModeService);
    this.deliveryModeRequest.PreviousCache = this.sharedService.reviewBuyCache;
    this.customerInfoUpdateModel = new CustomerInfoUpdate;
    this.customerInfoUpdateModel.Addresses = new Array<CustomerAddress>();
    this.quickBuyEnum = this.injector.get(QuickBuyEnum);
    this.cancelOrderSmartCard = new CancelOrderSmartCard();
    this.commonIconImg = this.injector.get(CommonIconImg);
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
  }

  orderSmartcardForm: any = this.formbuilder.group({
    Title: ['', [Validators.required]],
    Name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    Surname: ['', [Validators.required,Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    SmartcardNickName: ['', [Validators.required]],
    DateOfBirth: ['', [Validators.required]],
    delPersonTitle: ['', [Validators.required]],
    delPersonName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    delPersonSurname: ['', [Validators.required,Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    checked: new FormControl(false)
  }
    , {
      validator: [checkUserName('SmartcardNickName')]

    });

  step = 0;
  ngOnDestroy() {
    let reviewBackBtnMsgsObj = {
      notificationErrorMsg: this.notificationErrorMsg.backToSearchPageMsgFromReviewBuy,
      notificationTitle: this.notificationErrorMsg.backToSearchPageTitleFromReviewBuy,
    }
    localStorage.removeItem(this.appRouteEnum.isBrowserBackButton);
    if (this.router.getCurrentNavigation().trigger == "popstate" && (this.router.url.includes(this.appRouteEnum.MixingDeck) || this.router.url.includes(this.appRouteEnum.SeasonSolutions) || this.router.url.includes(this.appRouteEnum.DeliveryMode) || this.router.url.includes(this.appRouteEnum.ValidatePaymentDo) || this.router.url.includes(this.appRouteEnum.JourneyExtras))) {
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigateByUrl("/" + this.appRouteEnum.deliveryAndReviewbuy).then(() => {
        if (this.isAddedDeliveryForJourney(this.reviewBuyResponse)) {
          this.commonService.IsDeliveryModesAddedForSelectedJourneyOrNot();
          return;
        }
        this.commonService.commonNotificationDialog('review-backbtn-common-notification-dialog', reviewBackBtnMsgsObj, '', true, false, true, true);

      });
    }
    else if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.Payment)) {
      if (this.commonService.isExistJourneyValidForPaymentKey()) {
        this.router.navigateByUrl("/" + this.appRouteEnum.deliveryAndReviewbuy).then(() => {
          if (this.isAddedDeliveryForJourney(this.reviewBuyResponse)) {
            this.commonService.IsDeliveryModesAddedForSelectedJourneyOrNot();
            return;
          }
          this.commonService.commonNotificationDialog('review-backbtn-common-notification-dialog', reviewBackBtnMsgsObj, '', true, false, true, true);
        });
      }
      else {
        this.openPaymentDetails();
      }
    }
    this.postCodeValueChangeSubscription.unsubscribe();
  }

  ticketInfo(ticket: any) {
    if (ticket == 'season') {
      this.dialog.open(TicketInfoComponent, {
        disableClose: false,
        panelClass: 'ticket-info',
        data: {
          TicketType: ticket.trim()
        }
      });
    } else {
      this.dialog.open(TicketInfoComponent, {
        disableClose: false,
        panelClass: 'ticket-info',
        data: {
          TicketType: ticket.TicketType.trim(),
          TicketDescription: ticket.TicketDescription,
          TicketRestriction: ticket.TicketRestriction,
          ticketTypeCode: ticket.TicketTypeCode,
          IsViewBooking: true,
          TicketInformation: ticket.TicketInformation
        }
      });
    }
  }

  timeoutpopup(message, isCallApi) {
    let dialogRef = this.dialog.open(TimeoutComponent, {
      disableClose: false,
      width: '600px',
      data: {
        Message: message
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      if (isCallApi) {
        this.dataLayerService.loadGTMDataLayerOnPageUpdate();
        // virtual_page_view -- Ga4-datalayer event
        this.ga4DatalayerService.loadGA4DataLayerAllPages(false);

        this.getDeliveryAndBasketJourney(false,0);
      }
    });
  }

  ngOnInit() {
    if (localStorage.getItem(this.appRouteEnum.isBrowserBackButton) == 'true') {
      this.getIsBackButttonRes = Boolean(localStorage.getItem(this.appRouteEnum.isBrowserBackButton));
    }
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4DatalayerService.loadGA4DataLayerAllPages(true);
    this.browserRefresh = browserRefresh;
    let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    this.sharedService.showEdit = false;
    //Get shared cache data
    if (this.commonService.isExistRenewSmartcard(sharedSiblingRefresh)) {
      this.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.sharedService.journey = sharedSiblingRefresh.Journey;
      this.reviewBuyCache = sharedSiblingRefresh.reviewBuyResponse.ReviewBuyCache;
      this.sharedService.reviewBuyCache = this.reviewBuyCache;
      this.setFareBreakDown();
    }
    else {
      if (this.browserRefresh) {
        this.browserRefreshData(sharedSiblingRefresh);
        if (sharedSiblingRefresh) {
          this.getSharedCacheDataOnBrowserRefresh(sharedSiblingRefresh);
        }
      }
      //Get shared cache data
      this.reviewBuyJourneyTimeStampArr = this.sharedService.reviewBuyJourneyTimeStampArr || [];

      if (sharedSiblingRefresh.ReservationCache || sharedSiblingRefresh.reviewBuyCache) {

        this.callGetDeliveryAndBasketJourneyApi(sharedSiblingRefresh);

      }
    }
    this.GAremoveCartResponse = new ReviewBuyResponse();
    this.createForms();

    // for Smart Card
    if (this.sharedService.searchRequest != null) {
      this.totalPassenger = this.sharedService.searchRequest.Child + this.sharedService.searchRequest.Adult;
      this.totalAdult = this.sharedService.searchRequest.Adult;
      this.totalChild = this.sharedService.searchRequest.Child;
      if (this.totalPassenger > 1) {
        this.isMultiplePassengerCase = true;
      }
    }
    // PICO-2212, PICO-2213 & PICO-2215 method is called to check which button is click for showing header on review buy
    this.isShowHeader = this.commonService.isCheckForQuickBuyOrContinue();
    this.trimSpacesFromPostCodeFormControl();
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
      address1: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      address2: new FormControl('', Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      address3: new FormControl('', Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      city: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      postCode: new FormControl('', [Validators.required, Validators.minLength(4)]),
      country: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)])
    });
  }

  getSharedCacheDataOnBrowserRefresh(sharedSiblingRefresh) {
    this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
    this.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
    if (this.reviewBuyResponse != null && this.reviewBuyResponse != undefined) {
      this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
      this.sharedService.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
    }
    this.deliveryModeRequest.PreviousCache = this.sharedService.reviewBuyCache;
    this.searchRequest = sharedSiblingRefresh.searchRequest;
    this.sharedService.searchRequest = sharedSiblingRefresh.searchRequest;
    if (this.sharedService.reviewBuyResponse)
    this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
    this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
    this.sharedService.reviewBuyJourneyTimeStampArr = sharedSiblingRefresh.reviewBuyJourneyTimeStampArr || [];
    this.sharedService.createReservationRequest = sharedSiblingRefresh.createReservationRequest;
    this.sharedService.railCardPriceList = sharedSiblingRefresh.railCardPriceList;
    this.railCardPriceListArray = this.sharedService.railCardPriceList;
    this.sharedService.selectedJourneyDataForQuickBuyOrContiue = sharedSiblingRefresh?.selectedJourneyDataForQuickBuyOrContiue;
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
  }

  checkandRemoveJourneyOnSeatUpdateFail() {
    this.reviewBuyJourneyTimeStampArr.forEach((timesStamp, index) => {
      if (timesStamp.updateCount > 0 && timesStamp.updateCount < 3) {
        this.removeJourneyRequest.JourneyCreationDate = timesStamp.reviewBuyOrginalTimeStamp;
        this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
        this.removeJourneyRequest.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
        this.removeJourneyData(this.removeJourneyRequest,0);
        this.removeIndexOfreviewBuyJourneyTimeStampArr = index;
      }
    })
  }

  setStep(step, _journey?) {
    this.step = step;
    if (_journey) {
      if (_journey.DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryMode_FRTNEXTDAY || _journey.DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS) {
        this.postDeliveryForm.patchValue({
          deliveryType: _journey.DeliveryDetail[0].DeliveryModeType
        });
        this.isChangeAddressOfPostDelivery = true;
      }
    }
  }

  onFocusOutGetDiscountCode(event) {
    this.discountCode = event.target.value;
  }
  addDiscount(journeyDetail: JourneyDetail, isAddDiscount) {
    this.commonService.loaderRequired = true;
    this.discountCode = this.discountCodeControl.value;
    if (this.discountCode.length != 19) {
      this.notificationservice.warn('Please enter a valid discount code.');
      return false;
    }
    this.addDiscountRequest.JourneyCreationDate = journeyDetail.CreationDate;
    this.addDiscountRequest.ReviewBuyCache = this.reviewBuyCache;
    this.addDiscountRequest.DiscountCode = this.discountCode;
    this.addDiscountRequest.IsAddDiscountCode = isAddDiscount;
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4DatalayerService.loadGA4DataLayerAllPages(false);
    this.reviewBuyService.addDiscountCode(this.addDiscountRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.discountResponse = this.responseData.Data;
            if (this.discountResponse.IsInvalid) {
              this.commonService.loaderRequired = false;
              this.spinnerService.hide();
              this.discountResponse.DiscountCode = this.addDiscountRequest.DiscountCode;
            }
            else {
              this.isCheckAddDiscountOrNot(isAddDiscount);
              
              this.reviewBuyCache = this.discountResponse.ReviewBuyCache;
              this.sharedService.reviewBuyCache = this.reviewBuyCache;
              this.getDeliveryAndBasketJourney(false,0);
              this.notificationservice.success(this.discountResponse.DiscountMessage);
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  isCheckAddDiscountOrNot(isAddDiscount) {
    if (isAddDiscount) {
      this.railCardPriceListArray = [];
      this.reviewBuyResponse.Journey.forEach(journey => {
        this.getOutAndRetRailCardPriceListForFareBreakDownModel(journey);
      });
    }
  }

  removeErrorMessage() {
    if (!this.discountCodeControl.value && this.discountCodeControl.value != '') {
      this.discountResponse.DiscountMessage = '';
    }
  }

  addNewJourney() {
    this.sharedService.isAmendSearchOpen = true;
    this.sharedService.evaluateRequest = null;
    this.sharedService.railcardStationMasterData = JSON.parse(localStorage.getItem('railcardStationList'));

    if (this.isAddedDeliveryForJourney(this.reviewBuyResponse)) {
      this.commonService.IsDeliveryModesAddedForSelectedJourneyOrNot();
      return;
    }

    if (this.checkLengthOfJourney()) {
      if (this.reviewBuyResponse.Journey[0].SeasonDeatil == null) {
        window.scrollTo(0, 0);
        this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
        this.sharedService.showEdit = true;
      }
      else if (this.reviewBuyResponse.Journey[0].SeasonDeatil != null) {
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
      }
    }
    else {
      if (!this.searchRequest.IsSeason) {
        window.scrollTo(0, 0);
        this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
        this.sharedService.showEdit = true;
      }
      else if (this.searchRequest.IsSeason) {
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
      }
    }

  }

  openPaymentDetails() {
    if (this.reviewBuyResponse == null || this.reviewBuyResponse.Journey == null
      || this.reviewBuyResponse.Journey.length == 0 || this.reviewBuyResponse.BasketCount == 0 && !this.reviewBuyResponse.IsRenewSmartcard) {
      this.notificationservice.error("Please add a journey first.");
      return;
    }
    if (this.isAddedDeliveryForJourney(this.reviewBuyResponse)) {
      this.commonService.IsDeliveryModesAddedForSelectedJourneyOrNot();
      return;
    }

    if (this.deliveryModes.length == 1 && this.deliveryModes[0].DeliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card && !this.IsDeliveryModeSmartcardSelected) {
      this.notificationservice.warn("Please fill all the passenger smartcard number details.");
      return;
    }

    this.sharedService.reviewBuyCache = this.reviewBuyCache;
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
    this.getPaymentdetails();

  }
  
  setFareBreakDown() {
    this.fareBreakDownData = [];
    this.totalPrice = 0;
    if (this.reviewBuyResponse != null && this.reviewBuyResponse.Journey != null) {
      this.reviewBuyResponse.Journey.forEach(journey => {
        let fareBreakdownModel = new FareBreakdownModel;
        fareBreakdownModel.OutWardJourney = [];
        fareBreakdownModel.ReturnJourney = [];
        fareBreakdownModel.OutwardJourneyExtras = [];
        fareBreakdownModel.ReturnJourneyExtras = [];
        fareBreakdownModel.DeliveryDetails = [];
        fareBreakdownModel.JourneyType = journey.Journey;
        fareBreakdownModel.DiscountPrice = journey.DiscountedPrice;
        fareBreakdownModel.DiscountPercent = journey.DiscountPercent;
        fareBreakdownModel.DiscountType = journey.DiscountType;
        this.totalPrice += journey.JourneyTotalPrice;
        if (journey.IsDiscountVisible) {
          this.discountCodeControl.setValue(journey.DiscountCode);
        }
        this.commonService.getOutwardFaresBreakData(journey, fareBreakdownModel);

        this.commonService.getReturnFaresBreakData(journey, fareBreakdownModel);

        if (journey.OutwardJourneyExtras != null) {

          journey.OutwardJourneyExtras.forEach(obj => {
            let journeyExtra = new JourneyModel;
            journeyExtra.Passenger = obj.FarePerson;
            journeyExtra.PricePerPerson = obj.Price;
            journeyExtra.TotalPrice = obj.Price;
            journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
            fareBreakdownModel.OutwardJourneyExtras.push(journeyExtra);
          });
        }
        if (journey.ReturnJourneyExtras != null) {

          journey.ReturnJourneyExtras.forEach(obj => {
            let journeyExtra = new JourneyModel;
            journeyExtra.Passenger = obj.FarePerson;
            journeyExtra.PricePerPerson = obj.Price;
            journeyExtra.TotalPrice = obj.Price;
            journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
            fareBreakdownModel.ReturnJourneyExtras.push(journeyExtra);
          });
        }
        this.fareBreakForDeliveryDetail(journey, fareBreakdownModel);

        this.fareBreakModelForSeason(journey, fareBreakdownModel);
        this.fareBreakDownData.push(fareBreakdownModel);
      });
      this.sharedService.fareBreakdownModelData = this.fareBreakDownData;
    }
  }
  fareBreakForDeliveryDetail(journey, fareBreakdownModel) {
    if (journey.DeliveryDetail != null) {
      journey.DeliveryDetail.forEach(obj => {
        let journeyDelivery = new JourneyModel;
        journeyDelivery.Passenger = obj.FarePerson;
        journeyDelivery.PricePerPerson = obj.Price;
        journeyDelivery.TotalPrice = obj.Price;
        journeyDelivery.JourneyDeliveryTitle = obj.DeliveryModeName;

        if (obj.DeliveryModeName == this.appRouteEnum.DeliveryMode_NEXTDAYDELIVERY) {
          this.nextDayDeliveryModePrice = obj.Price;
        }
        else if (obj.DeliveryModeName == this.appRouteEnum.DeliveryMode_FIRSTCLASSPOST) {
          this.firstClassPostPrice = obj.Price;
        }
        fareBreakdownModel.DeliveryDetails.push(journeyDelivery);
      });
    }
  }
  fareBreakModelForSeason(journey, fareBreakdownModel){
    if (journey.SeasonDeatil != null) {
      fareBreakdownModel.SeasonJourney = new JourneyModel;
      if (journey.SeasonDeatil.JourneyTicketDescription.toLowerCase().indexOf('adult') !== -1) {
        fareBreakdownModel.SeasonJourney.Passenger = '1 * Adult';
        fareBreakdownModel.SeasonJourney.IsCheck = journey.SeasonDeatil.IsCheck;
      }
      else if (journey.SeasonDeatil.JourneyTicketDescription.toLowerCase().indexOf('child') !== -1) {
        fareBreakdownModel.SeasonJourney.Passenger = '1 * Child';
        fareBreakdownModel.SeasonJourney.IsCheck = true;
      }
      fareBreakdownModel.SeasonJourney.PricePerPerson = journey.SeasonDeatil.BasePrice;
      fareBreakdownModel.SeasonJourney.TotalPrice = journey.SeasonDeatil.Price;
      fareBreakdownModel.SeasonJourney.RailCard = journey.SeasonDeatil.RailCard;
    }
  }

  removeJourney(journeyCreatationDate: Date) {
    this.removeJourneyRequest.JourneyCreationDate = journeyCreatationDate;
    this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
    this.removeJourneyRequest.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
    if (this.reviewBuyResponse != null && this.reviewBuyResponse.IsNreBasket) {
      let dialogRef = this.dialog.open(ConfirmPopupComponent, {
        width: '500px',
        disableClose: false,
      });
      dialogRef.componentInstance.confirmMessage = "Removing a journey will clear your basket. Do you wish to proceed?"
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.removeJourneyData(this.removeJourneyRequest,0);
        }
        else {
          return false;
        }
      });
    }
    else {
      let dialogRef = this.dialog.open(ConfirmPopupComponent, {
        width: '458px',
        disableClose: false,
      });
      dialogRef.componentInstance.confirmTitle = "Remove this journey?"
      dialogRef.componentInstance.confirmMessage = "Are you sure you want to remove this journey?\n You will not be able to recover it once removed"
      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult) {
          this.removeJourneyData(this.removeJourneyRequest,0);
        }
        else {
          return false;
        }
      });
    }
  }

  seatPickerPopup(journey: any, seatInfo: any, isOutWardJourney: boolean) {
    let dialogRef = this.dialog.open(SeatpickerPopupComponent, {
      disableClose: true,
      panelClass: 'seat-picker',
      data: {
        seatInfo: seatInfo,
        journey: journey,
        isOutWardJourney: isOutWardJourney,
        openedFeature: this.ga4ItemListEnum.openedSeatPickerFromBooking,
        bookingReferenceNumber: undefined,
        isPostSale: false
      }
    });
    this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromBooking, undefined, this.ga4ItemListEnum.openAction);

     // To prevent page refresh on seat picker popup open added this class on html and body tag
     document.getElementsByTagName('html')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
     document.getElementsByTagName('body')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
 
    // * New Changes 
    if (this.isOpenSeatpicker) {
      this.isOpenSeatpicker = false;
      this.isLegChoosed = false;
      this.choosedTrainLeg = null;
    }

    dialogRef.afterClosed().subscribe(() => {
      this.reviewBuyCache = this.sharedService.reviewBuyCache;
      this.reviewBuyResponse = this.sharedService.reviewBuyResponse;

      // on seat picker popup close removed this class from html and body tag
      document.getElementsByTagName('html')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
      document.getElementsByTagName('body')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');

      if (this.sharedService.reviewBuyCache == "") {
        this.setFareBreakDown();
      }
      else {
        this.getDeliveryAndBasketJourney(false,0);
      }
      this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromBooking, undefined, this.ga4ItemListEnum.exitAction);
    });

  }

  getRemoveJourneyData(removeJourneyRequest, index) {
    this.removeResponse = this.responseData.Data;
    this.sharedService.LatestJourneyCache = this.removeResponse.LatestJourneyCache;
    this.sharedService.ReservationCache = null;
    this.reviewBuyCache = this.removeResponse.ReviewBuyCache;
    this.sharedService.reviewBuyCache = this.reviewBuyCache;
    this.sharedService.getBasketCount.emit(this.removeResponse.BasketCount);
    this.sharedService.reviewBuyResponse.ReviewBuyCache = this.removeResponse.ReviewBuyCache;
    this.sharedService.reviewBuyResponse.BasketCount = this.removeResponse.BasketCount;
    this.deletedJourney = this.reviewBuyResponse.Journey.filter(m => m.CreationDate === removeJourneyRequest.JourneyCreationDate);
    this.GAremoveCartResponse.Journey = this.deletedJourney;
    this.reviewBuyResponse.Journey = this.reviewBuyResponse.Journey.filter(m => m.CreationDate != removeJourneyRequest.JourneyCreationDate);
    if (this.removeResponse.BasketCount == 0 && this.reviewBuyResponse.Journey.length == 0) {
      this.searchRequest.PromotionCode = "";
      if (this.sharedService.journeySummaryModel == null) {
        this.sharedService.journeySummaryModel = new JourneySummaryModel();
      }
      this.sharedService.journeySummaryModel.IsPromo = false;
      this.sharedService.isAmendSearchOpen = true;
      this.isBasketEmpty = true; // Check for removing bottom ad journey button
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      if (!this.searchRequest.IsSeason) {
        if (!this.commonService.checkIsSeasonInLocalStorage()) {
          this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
        } else {
          this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
          this.sharedService.showEdit = true;
        }
      }
      else if (this.searchRequest.IsSeason) {
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
      }
    }
    else {
      this.commonService.loaderRequired = true;
      this.getDeliveryAndBasketJourney(false, index);
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }

    if (this.removeIndexOfreviewBuyJourneyTimeStampArr > -1) {
      let index = this.removeIndexOfreviewBuyJourneyTimeStampArr;
      this.reviewBuyJourneyTimeStampArr.splice(index, 1);
      this.removeIndexOfreviewBuyJourneyTimeStampArr = -1;

      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
  }
  removeJourneyData(removeJourneyRequest, index) {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4DatalayerService.loadGA4DataLayerAllPages(false);
    this.reviewBuyService.removejourney(removeJourneyRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.getRemoveJourneyData(removeJourneyRequest, index);
            this.ga4DatalayerService.loadGALayerForReviewBuyRemoveCart(this.GAremoveCartResponse, false, null, null, null, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
            this.commonService.deletedRemovedJourneyForQuickBuyOrContinue(this.deletedJourney);
            this.discountResponse = null;
          }
          else {
            this.deletedJourney = this.reviewBuyResponse.Journey.filter(m => m.CreationDate === removeJourneyRequest.JourneyCreationDate);
            this.GAremoveCartResponse.Journey = this.deletedJourney;
            this.reviewBuyResponse.Journey = this.reviewBuyResponse.Journey.filter(m => m.CreationDate != removeJourneyRequest.JourneyCreationDate)
          }
          this.setFareBreakDown();
          this.dataLayerService.loadGALayerForReviewBuyRemoveCart(this.GAremoveCartResponse);      
        }
      });
  }

  getBasketJourney() {
    this.railCardPriceList = new RailCardPriceList();
    if (this.reviewBuyCache == "" || this.reviewBuyCache == null) {
      return;
    }

    this.basketJourneyRequestDto.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
    this.basketJourneyRequestDto.IsSeason = this.searchRequest.IsSeason;
    this.basketJourneyRequestDto.ReviewBuyCache = this.reviewBuyCache;
    if (this.reviewBuyResponse?.Journey) {
      this.reviewBuyResponse.Journey.forEach(journey => {
        this.discountedPrice = journey.DiscountedPrice;
      });
    }
    if (this.addDiscountRequest.IsAddDiscountCode || this.discountedPrice) {
      this.basketJourneyRequestDto.RailCardPriceList = this.railCardPriceListArray;
    }
    this.basketJourneyRequestDto.IsPostSale = false;
    this.reviewBuyService.getBasketJourney(this.basketJourneyRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.reviewBuyResponse = this.responseData.Data;
            this.ga4DatalayerService.loadGALayerForViewBasket(this.reviewBuyResponse, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
            //word spacing
            this.reviewBuyResponse.Journey.forEach(journey => {
              this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.OutwardSeat);
              this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.ReturnSeat);

              // Remove Standard Premium from TicketType from OutwardDetail
              this.removeStandPreFromTicketTypeForOutAndReturn(journey);

            })


            if (!this.reviewBuyResponse.IsBasketJourneyValid) {
              this.timeoutpopup(this.reviewBuyResponse.BasketJourneyMessage, false);
            }
            this.sharedService.reviewBuyResponse = this.reviewBuyResponse;
            this.sharedService.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
            this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;

            this.getBasketJourneyForPromoValue();

            this.sharedService.searchRequest = this.searchRequest;
            this.sharedService.getBasketCount.emit(this.reviewBuyResponse.BasketCount);
            this.addTimeStampToReviewBuyJourneyTimeStampArr();
            this.checkandRemoveJourneyOnSeatUpdateFail();
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            this.setFareBreakDown();
            this.dataLayerService.loadGALayerForCheckoutStep2(this.reviewBuyResponse);

          }
        }
      });

  }

  getValueOnCheckDeliveryModesCount() {
    if (this.deliveryModesCount == 0) {
      let noDeliveryMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.noDeliveryModeInformation,
        notificationTitle: this.notificationErrorMsg.deliveryModesUnavailabitilyTitle,
      }
      let dialogRef = this.commonService.commonNotificationDialog('review-nodelivery-common-notification-dialog', noDeliveryMsgsObj, this.commonIconImg.exclamationIConImgForNoDelivery, true, false, false, true);
      dialogRef.afterClosed().subscribe(() => {
        
        this.redirectingOnSearchResultsPage();
        
      });
    } else {
      if (this.deliveryModesCount > 1) {
        if (this.deliveryModesCount == 2) {
          this.showChangeDeliveryButton = this.DeliveryModesDto.DeliveryMode.some(x => x.DeliveryMode == this.appRouteEnum.DeliveryMode_FRTNEXTDAY && !x.IsHide) && this.DeliveryModesDto.DeliveryMode.some(x => x.DeliveryMode == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS && !x.IsHide) ? true : false;
        }
      }
    }
  }

  getIsDeliveryModeTODValue() {
    this.isDeliveryModeTOD = this.isHideTod ? false : true;
  }

  getShowHideDeliveryModeValueInSetDelivery() {
    let displayFirstClassOrNextDayDelivery = false;
    for (let mode of this.deliveryModes) {
      this.setDetailsWhenDeliveryModeIsTOD(mode);
      this.setDetailsWhenDeliveryModeIsETicket(mode);
      // if delivery mode is first class delivery and it is not hidden
      displayFirstClassOrNextDayDelivery = this.setDetailsWhenDeliveryModeIsFirstClass(mode, displayFirstClassOrNextDayDelivery);
      // if delivery mode is next day delivery and it is not hidden
      displayFirstClassOrNextDayDelivery = this.setDetailsWhenDeliveryModeIsNextDay(mode, displayFirstClassOrNextDayDelivery);
      //if delivery mode is smart card "SMART_CARD"
      this.setDetailsWhenDeliveryModeIsSmartCard(mode); 
    }
  }

  setDeliveryModesData() {
    if (this.DeliveryModesDto) {
      if (this.DeliveryModesDto.DeliveryMode) {
        this.DeliveryModesDto.DeliveryMode = this.DeliveryModesDto.DeliveryMode.filter(x => !x.IsHide && x.DeliveryMode != 'FRT');
        
        this.getDeliveryModeForPassangarDetailWithSmartCard();

        this.deliveryModesCount = this.DeliveryModesDto.DeliveryMode.length;

        this.getValueOnCheckDeliveryModesCount();

        this.setDetailsIfSmartCardNumberExistsOfLatestJourney();

        this.checkDeliveryModeSmartCardSelectedOrNot();

        // get defaultDeliveryAddressIndex for post and smart card address
        this.getDefaultDeliveryAddressIndexForPostAndSmartcard();
        this.deliveryModes = this.responseData.Data.DeliveryModesDto?.DeliveryMode;
        this.getShowHideDeliveryModeValueInSetDelivery();
      }

    }
    this.reviewBuyCache = this.responseData.Data.BasketJourneyResponse.ReviewBuyCache;
    this.sharedService.reviewBuyCache = this.reviewBuyCache;

    this.setBillingAddressInDeliveryModeReq();
    
  }

  checkSmartCardDelectedOrNot() {
    if (this.responseData.Data.BasketJourneyResponse?.Journey?.length > 0 && this.responseData.Data.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1]?.DeliveryDetail[0] && (this.responseData.Data.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1].DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryMode_Smart_Card)) {
      return true;
    } else {
      return false;
    }
  }

  getDeliveryAndBasketJourney(IsNewJourney: boolean, index) {
    this.spinnerService.show();
    this.deliveryModeRequest.ReservationCache = this.sharedService.ReservationCache;
    this.deliveryModeRequest.IsNreBasket = false;
    this.deliveryModeRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.deliveryModeRequest.UserEmail = localStorage.getItem('Email');
    this.deliveryModeRequest.Name = localStorage.getItem('FirstName');
    this.deliveryModeRequest.Title = localStorage.getItem('Title');
    this.deliveryModeRequest.Surname = localStorage.getItem('LastName');
    this.deliveryModeRequest.LatestJourneyCache = this.sharedService.LatestJourneyCache;
    this.deliveryModeRequest.isSeason = this.searchRequest.IsSeason;

    this.setIsSeasonValueInDeliveryModeRequest();
    
    let data = {
      getDeliveryModeRequset: this.deliveryModeRequest,
      name: localStorage.getItem('FirstName'),
      title: localStorage.getItem('Title'),
      surname: localStorage.getItem('LastName'),
      previousCache: this.sharedService.reviewBuyCache,
      isNewJourney: IsNewJourney,
      reviewBuyCache: this.sharedService.reviewBuyCache,
      IsAdult: this.sharedService.searchRequest.Adult > 0 ? true : false //PICO-2150 added a property for check passanger added to smart card adult or child
    }
    this.reviewBuyService.getDeliveryAndBasketJourney(data).subscribe(
      res => {
        if (res != null) {
          this.commonService.loaderRequired = false;
          this.spinnerService.hide();
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            //get deliveryModes data
            this.DeliveryModesDto = this.responseData.Data.DeliveryModesDto;
            this.reviewBuyResponse = this.responseData.Data.BasketJourneyResponse;
            this.sharedService.getBasketCount.emit(this.reviewBuyResponse.BasketCount);

            // calling add_delivery_option ga4 data layer event on load for latest journey only
            this.callDeliveryOptionGA4DataLayer();

            // calling view_cart ga4 data layer event for latest journey only
            this.ga4DatalayerService.loadGALayerForViewBasket(this.reviewBuyResponse, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);

            this.callRedirectionOnSearchResultPage();

            this.getOrderSmartCardDetails(this.responseData.Data.BasketJourneyResponse);

            this.setDeliveryModesData();

            this.isNreBasket = this.DeliveryModesDto.IsNreBasket;
            this.deliveryModeCache = this.DeliveryModesDto.DeliveryCache;
            this.basketJourneyRequestDto.IsNreBasket = this.responseData.Data.BasketJourneyResponse.IsNreBasket;
            this.basketJourneyRequestDto.IsSeason = this.searchRequest.IsSeason;
            //word spacing
            this.reviewBuyResponse.Journey.forEach(journey => {
              this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.OutwardSeat);
              this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.ReturnSeat);
              // Remove Standard Premium from TicketType from OutwardDetail
              this.removeStandPreFromTicketTypeForOutAndReturn(journey);
            });
            this.callTimeOutPopupForBasketJourneyOfReviewBuyResponse();
            this.sharedService.reviewBuyResponse = this.reviewBuyResponse;
            this.sharedService.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
            this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
            this.getBasketJourneyForPromoValue();
            this.sharedService.searchRequest = this.searchRequest;
           
            this.sharedService.LatestJourneyCache = this.reviewBuyResponse.LatestJourneyCache;
            this.addTimeStampToReviewBuyJourneyTimeStampArr();
            this.checkandRemoveJourneyOnSeatUpdateFail();
            this.sharedService.ReservationCache = this.sharedService.ReservationCache;
            this.sharedService.previousCache = null;
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            this.setFareBreakDown();
            this.dataLayerService.loadGALayerForCheckoutStep2(this.reviewBuyResponse);
            // Adding deliverymodes to every journey
            this.callingMethodToAddDeliveryModesInEveryJourney();
            this.callingMethodToRemoveJourneyWhenExpired(index);   
          }
        }
      });
  }

  getOrderSmartCardDetails(BasketJourneyResponse) {
    if (BasketJourneyResponse?.Journey?.length > 0 && BasketJourneyResponse.Journey[BasketJourneyResponse.Journey.length - 1].DeliveryDetail[0] && BasketJourneyResponse.Journey[BasketJourneyResponse.Journey.length - 1].DeliveryDetail[0].SmartCardNumber == null && BasketJourneyResponse.Journey[BasketJourneyResponse.Journey.length - 1].DeliveryDetail[0].IsOrderSmartCard) {
      if (this.reviewBuyResponse?.OrderSmartCardInfo?.GeneralInformation) {
        this.orderSmartcardForm.get('Title').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.GeneralInformation.Title);
        this.orderSmartcardForm.get('Name').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.GeneralInformation.Name);
        this.orderSmartcardForm.get('Surname').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.GeneralInformation.Surname);
        this.orderSmartcardForm.get('SmartcardNickName').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.GeneralInformation.SmartcardNickName);
        this.orderSmartcardForm.get('DateOfBirth').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.GeneralInformation.DateOfBirth);
        this.orderSmartcardForm.get('delPersonTitle').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.Title);
        this.orderSmartcardForm.get('delPersonName').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.Name);
        this.orderSmartcardForm.get('delPersonSurname').patchValue(this.reviewBuyResponse.OrderSmartCardInfo.Surname);
        this.isCheckedTermsCondition = true;
      }
      this.IsDeliveryModeSmartcardSelected = true;
      this.isOrderSmartCard = true;
      this.isChangeAddressOfOrderSmartCardDelivery = true;
    }
  }

  findLocationCode(value) {
    if (value !== null || value !== '' || value !== undefined || value !== 0) {
      if (this.DeliveryModesDto.SmartCardLocation != null && this.DeliveryModesDto.SmartCardLocation != undefined) {
        let station = this.DeliveryModesDto.SmartCardLocation.filter(m => m.Name == value);
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
    if (this.selectedSmartCardNumber) {
      passenger.IsAddedSmartcard = true;
    } else {
      passenger.IsAddedSmartcard = false;
    }
    
    this.smartCardPassengerList.push(passenger);
  }

  getOutAndRetRailCardPriceListForFareBreakDownModel(journey) {
    this.railCardPriceList = new RailCardPriceList();
    if (journey) {
      this.railCardPriceList.CreationDate = journey.CreationDate;
      if (journey.OutwardDetail) {
        this.railCardPriceList.Outward = this.getOutAndRetRailCardPrice(journey.OutwardDetail);
      }
      if (journey.ReturnDetail) {
        this.railCardPriceList.Return = this.getOutAndRetRailCardPrice(journey.ReturnDetail);
      }
      this.railCardPriceListArray.push(this.railCardPriceList);
      this.sharedService.railCardPriceList = this.railCardPriceListArray;
    }
  }

  getOutAndRetRailCardPrice(journeyDetail) {
    let outAndRetRailCardPriceList = [];
    if (journeyDetail?.RailCardPrice?.length > 0) {
      journeyDetail.RailCardPrice.forEach(railCardPrice => {
        outAndRetRailCardPriceList.push(railCardPrice);
      });
    }
    return outAndRetRailCardPriceList;
  }

  removeStandPreFromTicketTypeForOutAndReturn(journey) {
    if (journey.OutwardDetail) {
      if (journey.OutwardDetail.TicketType.includes('Standard Premium')) {
        journey.OutwardDetail.TicketType = journey.OutwardDetail.TicketType.split('Standard Premium')[0];
      }
    }

    // Remove Standard Premium from TicketType from ReturnDetail
    if (journey.ReturnDetail) {
      if (journey.ReturnDetail.TicketType.includes('Standard Premium')) {
        journey.ReturnDetail.TicketType = journey.ReturnDetail.TicketType.split('Standard Premium')[0];
      }
    }
  }
  getBasketJourneyForPromoValue() {
    if (this.reviewBuyResponse != null) {
      if (this.reviewBuyResponse.PromotionCode != "" && this.reviewBuyResponse.PromotionCode != null) {
        this.searchRequest.PromotionCode = this.reviewBuyResponse.PromotionCode;
        if (this.sharedService.journeySummaryModel == null) {
          this.sharedService.journeySummaryModel = new JourneySummaryModel();
        }
        this.sharedService.journeySummaryModel.IsPromo = true;
      }
      else {
        this.searchRequest.PromotionCode = "";
        if (this.sharedService.journeySummaryModel == null) {
          this.sharedService.journeySummaryModel = new JourneySummaryModel();
        }
        this.sharedService.journeySummaryModel.IsPromo = false;
      }
    }
  }

  addTimeStampToReviewBuyJourneyTimeStampArr() {
    let alrdyPresentJourney = false;
    this.reviewBuyResponse.Journey.forEach(journey => {
      alrdyPresentJourney = false;
      this.reviewBuyJourneyTimeStampArr.forEach(timeStampObj => {
        if (timeStampObj.CreationDate === new Date(journey.CreationDate).getTime()) {
          alrdyPresentJourney = true;
        }
      });

      if (alrdyPresentJourney === false) {
        this.reviewBuyJourneyTimeStampArr.push({
          CreationDate: new Date(journey.CreationDate).getTime(),
          updateCount: 0,
          reviewBuyOrginalTimeStamp: journey.CreationDate
        });
      }
    });
    this.sharedService.reviewBuyJourneyTimeStampArr = this.reviewBuyJourneyTimeStampArr;
  }


  showFarebreakdown() {
    this.dialog.open(FareBreakdownComponent, {
      width: '600px',
      disableClose: false,
      panelClass: ['farebreak', 'common-popup-theme'],
    });
  }

  getPaymentdetails() {
    this.ga4DatalayerService.loadGALayerForConfirmOrderDetailInfo(this.reviewBuyResponse, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
    this.commonService.loaderRequired = true;
    this.paymentDetailsRequest = new PaymentDetailRequest();
    this.paymentDetailsRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.paymentDetailsRequest.Email = localStorage.getItem('Email');
    this.paymentDetailsRequest.ReviewBuyCache = this.sharedService.reviewBuyCache;
    if (this.sharedService?.reviewBuyResponse?.IsRenewSmartcard) {
      this.paymentDetailsRequest.IsPostSale = true;
    } else {
      this.paymentDetailsRequest.IsPostSale = false;
    }
    this.reviewBuyCache = this.sharedService.reviewBuyCache;
    this.paymentDetailsService.paymentDetails(this.paymentDetailsRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.commonService.loaderRequired = false;
            this.paymentDetailsResponse = new PaymentDetailResponse();
            this.paymentDetailsResponse = this.responseData.Data;
            this.sharedService.reviewBuyCache = this.paymentDetailsResponse.ReviewBuyCache;
            this.reviewBuyCache = this.paymentDetailsResponse.ReviewBuyCache;
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            if (this.paymentDetailsResponse.IsBasketJourneyValid) {
              localStorage.removeItem("isChangeReplace");
              localStorage.removeItem("paymentForSmartcard");
              localStorage.setItem("paymentForSmartcard", "false");
              this.router.navigate([`./` + this.appRouteEnum.Payment]);
              localStorage.setItem('JourneyValidforPayemnt', 'false');
            }
            else {
              this.commonService.loaderRequired = false;
              this.spinnerService.hide();
              this.timeoutpopup(this.paymentDetailsResponse.BasketJourneyMessage, true);
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }
  isChangeSeatAvailable(journey) {
    let isChangeSeatAvailableFlag = false;

    journey.OutwardSeat.forEach(element => {
      if (element.IsSeatPicker) {
        isChangeSeatAvailableFlag = true;
        return isChangeSeatAvailableFlag;
      }
    });

    if (journey.ReturnSeat) {
      journey.ReturnSeat.forEach(returnSeat => {
        if (returnSeat.IsSeatPicker) {
          isChangeSeatAvailableFlag = true;
          return isChangeSeatAvailableFlag;
        }
      });
    }
    return isChangeSeatAvailableFlag;
  }

  // * New Bugfix Changes

  onChangeSeat(index, journey) {
    // open seat picker directly on change seat click if there is only one train leg -- prashant
    if (!journey.ReturnSeat && journey.OutwardSeat.length == 1 && journey.OutwardSeat[0].IsSeatPicker) {
      this.seatPickerPopup(journey, journey.OutwardSeat[0], true);
      return;
    }
    // open seat picker directly on change seat click if there is only one train leg -- prashant


    this.isOpenSeatpicker = true;
    setTimeout(() => {
      document.querySelectorAll('#selectTrainLegsDiv')[index].scrollIntoView({ block: 'center' });
    }, 0);
  }

  onClosingTrainLegs() {
    this.isOpenSeatpicker = false;
    this.isLegChoosed = false;
    this.choosedTrainLeg = null;
  }

  onTrainLegClick(trainLeg, isValidLeg, isOutwardLegChoosed: boolean) {
    if (isValidLeg) {
      this.isLegChoosed = true;
      this.choosedTrainLeg = trainLeg;
      this.isOutwardLegChoosed = isOutwardLegChoosed;
    }
  }

  showRouteDetails(row, isReturnCase) {
    console.log(row);
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

  removeTravelExtras(travelExtraDetail, TravelExtraType, index, journey) {
    let data = {
      reviewBuyCache: this.reviewBuyCache,
      ReservationCache: this.sharedService.ReservationCache,
      travelExtra: {
        offerId: travelExtraDetail.OfferId,
        serviceId: travelExtraDetail.ServiceId,
        selectCount: travelExtraDetail.Count,
        isReturn: (TravelExtraType == 'RETURN') ? true : false,
        solutionNodeRef: travelExtraDetail.SolutionNodeRef,
      },
      IsNreBasket: this.isNreBasket,
      isSeason: this.isExistSeasonDetail(),
      journeyCreationDate: journey.CreationDate
    }
    this.commonService.loaderRequired = true;
    this.reviewBuyService.removeTravelExtras(data).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (TravelExtraType == 'OUTWARD') {
              journey.OutwardJourneyExtras.splice(index, 1);
            }

            if (TravelExtraType == 'RETURN') {
              journey.ReturnJourneyExtras.splice(index, 1);
            }
            this.sharedService.reviewBuyCache = this.responseData.Data.ReviewBuyCache;
            this.reviewBuyCache = this.sharedService.reviewBuyCache;
            this.sharedService.ReservationCache = this.responseData.Data.ReservationCache;
            this.sharedService.reviewBuyResponse.ReviewBuyCache = this.reviewBuyCache;
            this.sharedService.LatestJourneyCache = this.responseData.Data.LatestJourneyCache;
            this.sharedService.previousCache = null;
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            this.commonService.loaderRequired = true;
            this.getDeliveryAndBasketJourney(false,0);
          }
        }
      });
  }

  browserRefreshData(sharedSiblingRefresh) {
    if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
      this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.sharedService.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
      if (this.reviewBuyResponse != null && this.reviewBuyResponse != undefined) {
        this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
        this.sharedService.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
      }
      this.deliveryModeRequest.PreviousCache = sharedSiblingRefresh.reviewBuyCache;
      this.sharedService.ReservationCache = sharedSiblingRefresh.ReservationCache;
      if (this.sharedService.reviewBuyResponse)
        this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
      this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
      this.sharedService.reviewBuyJourneyTimeStampArr = sharedSiblingRefresh.reviewBuyJourneyTimeStampArr || [];
      this.sharedService.railCardPriceList = sharedSiblingRefresh.railCardPriceList;
      this.railCardPriceListArray = this.sharedService.railCardPriceList;
      this.sharedService.LatestJourneyCache = sharedSiblingRefresh.LatestJourneyCache;
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
  }

  scrollOpenedMatPanelntoView(index) {
    setTimeout(() => {
      document.querySelectorAll('#matExpansionPanelId')[index].scrollIntoView();
    }, 100);
  }  

  // Method to delete Address
  onDeleteAddresss(index, isSmartCard) {
    if(isSmartCard && this.smartCardBillingAddress.length == 1){
      this.notificationservice.warn("You must have at least one postal address");
      return;
    }
    if (this.billingAddresses.length == 1) {
      this.notificationservice.warn("You must have at least one postal address");
      return;
    }
    let dialogRef: any = this.dialog.open(ConfirmPopupComponent, {
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
  setBillingDeleteAddressIndex(index,isSmartCard) {
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
    this.smartCardBillingAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    this.sendModifyAddress(isSmartCard);
  }
  // Method to modify address
  sendModifyAddress(_isSmartCard) {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4DatalayerService.loadGA4DataLayerAllPages(false);
    this.addressService.modifyAddress(this.customerInfoUpdateModel).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data) {
              this.getmodifiedAddressMsg();
            }
            else {
              this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
              this.deliveryModeRequest.Address = this.tempDeliveryAddress;
              this.notificationservice.error('Sorry, We are not able to update address this time. Please try again.');
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
  getmodifiedAddressMsg() {
    if (this.isDelete) {
      this.selectedDeleteAddress();
      this.isDelete = false;
      this.notificationservice.success('Address deleted successfully.');
    }
    else if (this.isAdd) {
      this.isAdd = false;
      this.DeliveryModesDto.Addresses = this.billingAddresses;

      this.setDataInDeliveryModeReqForUpdatedAndAddedAddress();
      
      this.notificationservice.success('Address added successfully.');
    }
    else {

      this.setDataInDeliveryModeReqForUpdatedAndAddedAddress();
      
      this.notificationservice.success('Address updated successfully.');
    }
    this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
    this.smartCardBillingAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    if (!this.isDefaultAvailable(this.billingAddresses)) {
      this.billingAddresses[0].IsDefault = true;
    }
  }
  isDefaultAvailable(addressarray): boolean {
    for (let address of addressarray) {
      if (address.IsDefault) return true;
    }
    return false;
  }
  selectedDeleteAddress() {
    if (this.DeliveryModesDto.Addresses.length > 0) {
      this.hasDefault = false;
      if (this.DeliveryModesDto.Addresses.length > 0) {
        this.setIndexToAddress();
      }
      if (!this.hasDefault) {
        this.DeliveryModesDto.Addresses[0].IsDefault = true;
        this.defaultDeliveryAddressIndex = 0;
        this.defaultDeliveryAddressIndexPost = 0;
        this.selectedaddress = this.DeliveryModesDto.Addresses[0];
      }
    }
  }
  setIndexToAddress() {
    this.DeliveryModesDto.Addresses.forEach((address, index) => {
      if (address.IsDefault) {
        this.defaultDeliveryAddressIndex = index;
        this.defaultDeliveryAddressIndexPost = index;
        this.selectedaddress = this.DeliveryModesDto.Addresses[index];
        this.hasDefault = true;
      }
    });
  }
  // Method to select the address
  onSelectAddress(index, isSmartCard) {
    if (isSmartCard && this.smartCardBillingAddress.length > 1) {
      this.isChangeAddressOfOrderSmartCardDelivery = false;
    } else {
      this.isChangeAddressOfPostDelivery = false;
    }
    this.deliveryModeRequest.Address = this.billingAddresses[index].Address;
    this.selectedaddress = this.DeliveryModesDto.Addresses[index];
    this.tempDeliveryAddress = this.deliveryModeRequest.Address;
    if (isSmartCard)
      this.defaultDeliveryAddressIndex = index;
    else
      this.defaultDeliveryAddressIndexPost = index;
  }
  // Method to edit address
  editAddress(index, addressformid) {
    this.checkAddressPanelName(addressformid);
    addressformid = '#' + addressformid;    
    if(this.isSmartCardPanelAddress){
     this.editableAddress = this.smartCardBillingAddress[index];
    } else{
      this.editableAddress = this.billingAddresses[index];
    }
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
  checkAddressPanelName(addressformid) {
    if (addressformid == 'addressForm1') {
      this.isPostPanelAddress = true;
      this.isSmartCardPanelAddress = false;
    } else if (addressformid == 'addressFormSmartcard') {
      this.isSmartCardPanelAddress = true;
      this.isPostPanelAddress = false;
    }
  }
  // Initialize the address with type of address new or already created
  initializeAddress(isAdd) {
    setTimeout(() => {
      pca.load();
    });
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
  // Method to create address
  onAddressCreated(_isSmartCard) {
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
        if(_isSmartCard){
          this.address.AddressType = 'Address' + " " + (this.smartCardBillingAddress.length + 1).toString();
        } else{
          this.address.AddressType = 'Address' + " " + (this.billingAddresses.length + 1).toString();
        }
        let obj = Object.assign({}, this.address);

        this.smartCardBillingAddress.push(obj);
        if(this.smartCardBillingAddress.length !== this.billingAddresses.length){
         this.billingAddresses = JSON.parse(JSON.stringify(this.smartCardBillingAddress));
        }
        this.isAddAddress = false;
        this.isAddressShow = false;
        this.isAdd = true;
      }
      else {
        this.address.Address.CountryCode = this.editableAddress.Address.CountryCode;
        this.address.AddressType = this.editableAddress.AddressType;
        this.address.IsDefault = this.editableAddress.IsDefault;
        this.smartCardBillingAddress[this.editIndex] = this.address;
        this.billingAddresses[this.editIndex] = this.address;
        this.isAddressShow = false;
      }
      this.showAddAdress = true;
      this.customerInfoUpdateModel.Email = localStorage.getItem('Email');
      this.customerInfoUpdateModel.Addresses = this.billingAddresses;
      this.sendModifyAddress(_isSmartCard);
    }
    else {
      this.notificationservice.warn("Please fill all required data.");
    }
  }
  onLocationChange(index, $event) {
    this.smartCardPassengerList[index].LocationName = $event.option.value;
    this.smartCardPassengerList[index].LocationId = this.findLocationCode($event.option.value).toString();
    this.smartCardPassengerList[index].IsLoadStationAvailable = true;
  }
  orderSmartcardtoggle() {
    this.showSmartCardCancel = false;
    this.isOrderSmartCard = true;
    this.IsDeliveryModeSmartcardSelected = false;
    this.isChangeAddressOfOrderSmartCardDelivery = false;
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
    return of(suggestedLocations.length ? suggestedLocations : [{ Id: null, Name: 'No results found' }]);
  }
  onInputLocationChangeOrder($event) {
    this.locationName = $event.currentTarget.value;
  }
  onLocationChangeOrder($event) {
    this.locationName = $event.option.value;
    this.locationId = this.findLocationCode($event.option.value).toString();
    this.IsLoadStationAvailable = true;
  }
  getIsSeasonValueInCaseOfTravelSolutionDirection() {
    if ((this.sharedService.searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.season) || (this.sharedService.searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.flexi)) {
      this.deliveryModeRequest.isSeason = true;
    }
  }

  onClickAddDeliveryMode(deliveryMode: string, journey: any, event) {
    if (this.checkEventTypeOrCode(event)) {
      this.commonService.loaderRequired = true;
      this.callingRedirectOnSearchResultPageWhenClickOnDeliveryMode();
      this.deliveryModeRequest.DeliveryMode = deliveryMode;

      this.setDeliveryTypeValueInDeliveryModeRequest(deliveryMode);
      
      if (deliveryMode == this.appRouteEnum.DeliveryMode_TOD) {
        this.deliveryModeRequest.DeliveryMode = this.defaultDeliveryMode;
      }
      else if (deliveryMode == this.appRouteEnum.DeliveryModeETicket) {
        this.postDeliveryForm.clearValidators();
        this.postDeliveryForm.updateValueAndValidity();
        this.deliveryModeRequest.DeliveryMode = deliveryMode;
      }
      else if (this.checkDeliveryModeIsNextDayOrFirstClass(deliveryMode)) {
        let checkDeliveryForPost = this.isDeliveryModesCheckedStep1ForPost();
        if (!checkDeliveryForPost && checkDeliveryForPost !== undefined) {
          return false;
        }
      }
      else if (deliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card) {
        let smartCardCheckedValue = this.getSmartCardDeliveryCheckedValue();
        if (!smartCardCheckedValue && smartCardCheckedValue !== undefined) {
          return false;
        }
      }
      this.deliveryModeRequest.DeliveryCache = this.deliveryModeCache;
      this.deliveryModeRequest.reviewBuyCache = this.reviewBuyCache;
      this.deliveryModeRequest.journeyCreationDate = journey.CreationDate;
      this.deliveryModeRequest.PreviousCache = this.sharedService.previousCache;
      this.deliveryModeRequest.IsNreBasket = this.isNreBasket;
      this.deliveryModeRequest.IsAdult = this.checkIfSearchResultIsHavingAdultsOrNot(); //PICO-2150 added a property for check passanger added to smart card adult or child
      this.getIsSeasonValueInCaseOfTravelSolutionDirection();
      this.sendDeliveryModeRequestData(deliveryMode);
    }
  }
  // call api saveDeliveryMode after click on continue button
  sendDeliveryModeRequestData(deliveryMode) {
    this.deliveryModeService.updateDeliveryModeData(this.deliveryModeRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.sharedService.reviewBuyCache = this.responseData.Data.ReviewBuyCache;
            this.reviewBuyCache = this.sharedService.reviewBuyCache;
            this.sharedService.reviewBuyResponse.ReviewBuyCache = this.reviewBuyCache;
            this.isUpdateDeliveryModeOnSelection = true;
            // calling add_delivery_option ga4 data layer event for save delivery mode
            this.ga4DatalayerService.loadGALayerForAddDeliveryOption(this.sharedService?.searchRequest, this.sharedService?.journeySummaryModel, this.deliveryModeRequest?.DeliveryMode, this.commonService.jourenyExtraForCheckout());
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            this.commonService.loaderRequired = true;
            if (deliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card) {
              this.IsDeliveryModeSmartcardSelected = true;
              this.isChangeAddressOfOrderSmartCardDelivery = true;
            } else {
              this.isCheckedTermsCondition = false;
              this.orderSmartcardForm.reset();
            }
            this.getDeliveryAndBasketJourney(false,0);
            this.showOnlySelectedDeliveryType = true;
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
  isDeliveryModesCheckedStep1ForPost() {
    this.postDeliveryForm.clearValidators();
    this.postDeliveryForm.updateValueAndValidity();
    if (this.billingAddresses == null || this.billingAddresses.length == 0 || this.deliveryModeRequest.Address == null) {
      this.notificationservice.warn("Address is required.");
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
  // call method in case of order smart card delivery mode on continue
  checkOrderSmartCardDetail() {
    this.orderSmartcardForm.markAllAsTouched();
    for (const key of Object.keys(this.orderSmartcardForm.controls)) {
      if (this.orderSmartcardForm.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector('[formcontrolname="' + key + '"]');
        if (!!invalidControl) invalidControl.focus();
        return false;
      }
    }
    if (this.billingAddresses == null || this.billingAddresses.length == 0 || this.deliveryModeRequest.Address == null) {
      this.notificationservice.warn("Address is required.");
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
  // call method in case of get orderSmartcardForm Data on continue 
  getOrderSmartCardFormDetail() {
    if (this.locationId != undefined && this.locationId != null) {
      this.deliveryModeRequest.GeneralInformation = new GeneralInformation();
      this.deliveryModeRequest.Title = this.orderSmartcardForm.get('delPersonTitle').value;
      this.deliveryModeRequest.Name = this.orderSmartcardForm.get('delPersonName').value;
      this.deliveryModeRequest.Surname = this.orderSmartcardForm.get('delPersonSurname').value;
      this.deliveryModeRequest.GeneralInformation.Name = this.orderSmartcardForm.get('Name').value;
      this.deliveryModeRequest.GeneralInformation.Surname = this.orderSmartcardForm.get('Surname').value;
      this.deliveryModeRequest.GeneralInformation.SmartcardNickName = this.orderSmartcardForm.get('SmartcardNickName').value;
      this.deliveryModeRequest.GeneralInformation.Title = this.orderSmartcardForm.get('Title').value;
      this.deliveryModeRequest.GeneralInformation.DateOfBirth = moment(this.orderSmartcardForm.get('DateOfBirth').value).format('YYYY-MM-DD');
      console.log(this.orderSmartcardForm.get('DateOfBirth').value);
      if (this.locationId == "") {
        this.notificationservice.error("Please fill smartcard load station detail.")
        return false;
      }
      if (this.locationId != "") {
        this.locationName = this.locationName.trim();
        this.locationId = this.findLocationCode(this.locationName).toString();
        if (this.locationId == "0") {
          this.locationId = "";
          this.notificationservice.warn("please enter a valid load station detail.")
          return false;
        }
      }
      this.deliveryModeRequest.GeneralInformation.LoadSation = this.locationId;
      if (!this.isCheckedTermsCondition) {
        this.notificationservice.error("Please accept terms and condtions first.");
        return false;
      }
      // else {
      //   this.isCheckedTermsCondition = false;
      // }
    }
    else {
      this.notificationservice.error("Please fill smartcard load station details.");
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
  // call method for showing notification error in case of invalid smartcard detail
  checkPassangerSmartCardDetailStep1() {
    for (let smartCardPassenger of this.smartCardPassengerList) {
      smartCardPassenger.SmartCardNumber = this.getSelectedSmartCardNumber(smartCardPassenger);
      if (smartCardPassenger.IsAdult == undefined) {
        this.notificationservice.warn("Please fill all the passenger smartcard type details.")
        return false;
      }
      if (this.isExistSmartCardNumber(smartCardPassenger)) {
        this.notificationservice.warn("Please fill all the passenger smartcard number details.")
        return false;
      }
      if (this.isExistLocationId(smartCardPassenger)) {
        this.notificationservice.warn("Please fill all the passenger smartcard load station details.")
        return false;
      }
      if (smartCardPassenger.LocationId != "") {
        smartCardPassenger.LocationName = smartCardPassenger.LocationName.trim();
        smartCardPassenger.LocationId = this.findLocationCode(smartCardPassenger.LocationName).toString();
        if (smartCardPassenger.LocationId == "0") {
          smartCardPassenger.LocationId = "";
          this.notificationservice.warn("please enter a valid load station details.")
          return false;
        }
      }
    }
  }
  // call method for showing notification error in case of invalid Passangersmartcard detail
  checkPassangerSmartCardDetailStep2() {
    if (this.adultCount + this.childCount < this.totalPassenger) {
      this.notificationservice.warn('Please enter smartcard details for all the passengers otherwise choose other delivery mode.')
      return false;
    }
    if (this.childCount > this.totalChild) {
      this.notificationservice.warn("please select valid passenger types of smartcard.")
      return false;
    }
    if (this.adultCount > this.totalAdult) {
      this.notificationservice.warn("please select valid passenger types of smartcard.")
      return false;
    }
  }

  onEnterToDeliveryTypes(){
    (document.getElementById('deliverymodes').firstElementChild.getElementsByTagName('mat-expansion-panel-header')[0] as HTMLElement).focus();
  }

  onPostPanelCancel(){
    this.PostExpensionPanelmep.expanded = false;
  }

  onClose() {
    this.isAddressShow = false;
    this.isAddAddress = false;
    this.showAddAdress = true;
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

  getSelectedPostDeliveryPrice(deliveryMode: string) {
    switch (deliveryMode) {
      case this.appRouteEnum.DeliveryMode_FRTNEXTDAY: return this.nextDayDeliveryPriceForPost;
      case this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS: return this.firstClassDeliveryPriceForPost;
    }
  }

  checkAdultChildCount(_i) {

    this.adultCount = 0;
    this.childCount = 0;
    this.onSelectPassenger = true;

    for (let smartCardPassenger of this.smartCardPassengerList) {
      let isAdult: any = smartCardPassenger.IsAdult;
      if (isAdult) this.adultCount++;
      if (isAdult === false) this.childCount++;
    }

    if (this.childCount > this.totalChild) {
      this.notificationservice.warn("please select valid passenger type.")
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

  updateAvailableStatus() {
    if (this.DeliveryModesDto.SmartCardDetails) {
      this.DeliveryModesDto.SmartCardDetails.forEach(element => {
        let j = this.selectedSmartcardList.findIndex(x => x.smartcard == element.SmartCardNumber)
        if (j != -1) {
          element.IsAlreadySelected = true;
        }
        else {
          element.IsAlreadySelected = false;
        }
      });
    }
  }

  smartCardOptionSelect(passengerIndex, smartcardIndex, selectedSmartCardNumber, isAddSmartCard) {
    if (selectedSmartCardNumber == this.selectedSmartCardNumber) {
      this.isChangeNumberOfSmartCard = true;
    } else {
      this.isChangeNumberOfSmartCard = false;
    }
    if (this.selectedSmartcardList) {

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

  filterSmartCard(smartCards: SmartCardDetails[]) {
    if (smartCards) {
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

  addSmartCard(smartcardNo, i) {
    if (smartcardNo.length < 18) {
      this.notificationservice.error("smartcard is not valid.")
      return;
    }

    for (let index = 0; index < this.smartCardPassengerList.length; index++) {
      if (i != index) {
        if (smartcardNo == this.smartCardPassengerList[index].SmartCardNumber) {
          this.notificationservice.warn("smartcard number already applied. Please enter another smartcard.")
          return;
        }
      }
    }
    let smartcard = new SmartCardValidationRequest();
    smartcard.SmartCardNumber = smartcardNo;
    smartcard.IsAdult = this.sharedService.searchRequest.Adult > 0 ? true : false; //PICO-2150 added a property for check passanger added to smart card adult or child
    this.setToLinkSmartCardNum(smartcard, i, smartcardNo);
    
  }

  setToLinkSmartCardNum(smartcard, i, smartcardNo) {
    this.deliveryModeService.addSmartCard(smartcard).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {

            this.IsValidateAddPassenger = this.responseData.Data.IsValidate;
            if (this.IsValidateAddPassenger) {
              this.notificationservice.success(this.responseData.Data.SmartCardMessage);
              this.smartCardOptionSelect(i, null, smartcardNo, null);
              this.smartCardPassengerList[i].IsAddedSmartcard = true;
              this.smartCardPassengerList[i].SmartCardNumber = smartcardNo;
              this.updateAvailableStatus();
            }
            else
              this.notificationservice.error(this.responseData.Data.SmartCardMessage);
          }
          else if (this.responseData.ResponseCode == '203') {
            console.log(this.responseData.ResponseMessage);
          }
          else {
            this.notificationservice.error(this.responseData.ResponseMessage);
          }
        }
      }
    )
  }

  onInputLocationChange(index, $event) {
    this.smartCardPassengerList[index].LocationName = $event.currentTarget.value;
  }

  onTermConditionChange($event) {
    this.isCheckedTermsCondition = $event.checked
  }

  onSmartCardPanelCancel(journey: any) {
    if (this.IsDeliveryModeSmartcardSelected) {
      this.cancelOrderSmartCard.ReviewBuyCache = this.reviewBuyCache;
      this.cancelOrderSmartCard.JourneyCreationDate = journey.CreationDate;
      this.commonService.loaderRequired = true;
      this.reviewBuyService.cancelSelectedOrderSmartCard(this.cancelOrderSmartCard).subscribe(
        res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.sharedService.reviewBuyCache = this.responseData.Data.ReviewBuyCache;
              this.reviewBuyCache = this.sharedService.reviewBuyCache;
              this.sharedService.reviewBuyResponse.ReviewBuyCache = this.reviewBuyCache;
              //Set shared cache data
              this.sharedService.setSharedCache();
              this.storageDataService.clearStorageData("sharedSibling");
              this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
              this.isCheckedTermsCondition = false;
              this.orderSmartcardForm.reset();
              this.IsDeliveryModeSmartcardSelected = false;
              this.isOrderSmartCard = false;
              this.showOnlySelectedDeliveryType = false;

              this.isChangeAddressOfOrderSmartCardDelivery = false;

              this.getDeliveryAndBasketJourney(false,0);

            } else if (this.responseData.ResponseCode == '203') {
              console.log(this.responseData.ResponseMessage);
            }
            else {
              this.notificationservice.error(this.responseData.ResponseMessage);
            }
          }
        });
    } else {
      this.isOrderSmartCard = false;
      this.mep.expanded = false;
      this.isCheckedTermsCondition = false;
    }
  }

  goBackToSearchResults() {
    if (this.isAddedDeliveryForJourney(this.reviewBuyResponse)) {
      this.commonService.IsDeliveryModesAddedForSelectedJourneyOrNot();
      return;
    }
    let reviewBackBtnMsgsObj = {
      notificationErrorMsg: this.notificationErrorMsg.backToSearchPageMsgFromReviewBuy,
      notificationTitle: this.notificationErrorMsg.backToSearchPageTitleFromReviewBuy,
    }
    this.commonService.commonNotificationDialog('review-backbtn-common-notification-dialog', reviewBackBtnMsgsObj, '', true, false, true, true);
  }

  isShowEticketDeliveryMode(deliveryMode, journey) {
    if (deliveryMode?.DeliveryMode == this.appRouteEnum.DeliveryModeETicket) {
      if (deliveryMode?.DeliveryMode == this.appRouteEnum.DeliveryModeETicket && !deliveryMode?.IsHide && this.showOnlySelectedDeliveryType) {
        if ((journey?.DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryModeETicket)) {
          return true;
        }
        return false;
      } else {
        if ((deliveryMode?.DeliveryMode == this.appRouteEnum.DeliveryModeETicket && !deliveryMode?.IsHide)) {
          return true;
        }
        return false;
      }
    }
    return false;
  }

  isShowCollectAtStationDeliveryMode(deliveryMode, journey) {
    if (deliveryMode?.DeliveryMode == this.appRouteEnum.DeliveryMode_TOD) {
      if (deliveryMode?.DeliveryMode == this.appRouteEnum.DeliveryMode_TOD && !deliveryMode?.IsHide && this.showOnlySelectedDeliveryType) {
        if ((journey?.DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryMode_TOD)) {
          return true;
        }
        return false;
      } else {
        if ((deliveryMode?.DeliveryMode == this.appRouteEnum.DeliveryMode_TOD && !deliveryMode?.IsHide)) {
          return true;
        }
        return false;
      }
    }
    return false;
  }

  isShowSmartCardDeliveryMode(deliveryMode, journey) {
    if (deliveryMode?.DeliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card) {
      if (!deliveryMode?.IsHide && this.showOnlySelectedDeliveryType) {
        if ((journey?.DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryMode_Smart_Card) || (!deliveryMode?.IsHide && journey?.DeliveryDetail[0].DeliveryModeType == null && journey?.DeliveryDetail[0].SmartCardNumber == null)) {
          return true;
        }
        return false;
      } else {
        if ((!deliveryMode?.IsHide)) {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }

  HasReservationTimeExpiredForAnyJourney(){
    try{
      let journeyDetailObject = this.commonService.checkIfJourneyHsExpiredOrNot(this.reviewBuyResponse);
      this.expiredJounreyDetailObject = journeyDetailObject;
      if(journeyDetailObject.isJourneyExpired){
        let expiredJourneyRemovedMsgsObj = {
          notificationErrorMsg: this.notificationErrorMsg.expiredJourneyNotificationMessage,
          notificationTitle: this.notificationErrorMsg.expiredJourneyNotificationTitle,
        }
        let dialogRef = this.commonService.commonNotificationDialog('expired-journey-removed-notification-dialog', expiredJourneyRemovedMsgsObj, '', false, false, false, false);
        dialogRef.afterClosed().subscribe(() => {
          this.removeJourneyWhenExpired(journeyDetailObject.removeJourneyArrayObject[0].journeyCreationDate, 0);
        });
      } else{
        this.openPaymentDetails();
      }
    } catch (error){
      console.log(error);
      this.openPaymentDetails();
    }
  }

  removeJourneyWhenExpired(journeyCreatationDate, index){
    this.removeJourneyRequest.JourneyCreationDate = journeyCreatationDate;
    this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
    this.removeJourneyRequest.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
    this.removeJourneyData(this.removeJourneyRequest, index);
  }

  isAddedDeliveryForJourney(reviewBuyResponse) {
    return reviewBuyResponse && reviewBuyResponse.BasketCount > 0 && !reviewBuyResponse.IsDeliveryAddedForJourney;
  }

  checkIsJourneyReturnFromBasketOrNot() {
    return localStorage.getItem(this.localStorageKeyEnum.isReturnFromPaymentOrBasket) !== null && localStorage.getItem(this.localStorageKeyEnum.isReturnFromPaymentOrBasket) == 'true';
  }

  callGetDeliveryAndBasketJourneyApi(sharedSiblingRefresh) {

    if (this.checkIsJourneyReturnFromBasketOrNot()) {
      this.browserRefreshData(sharedSiblingRefresh);
      localStorage.removeItem(this.localStorageKeyEnum.isReturnFromPaymentOrBasket);
    }

    if (this.getIsBackButttonRes) {
      if (!this.commonService.isCheckForQuickBuyOrContinue()) { // if it is false, user came from quick buy
        this.getIsBackButttonRes = false;
      } else {
        this.getIsBackButttonRes = this.browserRefresh ? false : true;
      }
      this.getDeliveryAndBasketJourney(this.getIsBackButttonRes, 0);
    } else if (!this.browserRefresh) {
      this.getIsBackButttonRes = false;
      this.getDeliveryAndBasketJourney(this.getIsBackButttonRes, 0);
      localStorage.setItem(this.appRouteEnum.isBrowserBackButton, 'true');
    }
  }

  redirectingOnSearchResultsPage() {
    if (!this.searchRequest.IsSeason) {
      this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
    } else {
      this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
    }
  }

  setDataInDeliveryModeReqForUpdatedAndAddedAddress() {
    if (this.DeliveryModesDto.Addresses.length > 0) {
      this.hasDefault = false;
      if (this.DeliveryModesDto.Addresses.length > 0) {
        this.setIndexToAddress();
      }
      if (!this.hasDefault) {
        this.DeliveryModesDto.Addresses[0].IsDefault = true;
        this.defaultDeliveryAddressIndex = 0;
        this.defaultDeliveryAddressIndexPost = 0;
        this.selectedaddress = this.DeliveryModesDto.Addresses[0];
        this.deliveryModeRequest.Address = this.DeliveryModesDto.Addresses[0].Address;
      }
    }
  }

  isExistSmartCardNumber(smartCardPassenger) {
    return (smartCardPassenger.SmartCardNumber == "") || smartCardPassenger.SmartCardNumber == null;
  }

  isExistLocationId(smartCardPassenger) {
    return smartCardPassenger.LocationId == "" || smartCardPassenger.LocationId == undefined || smartCardPassenger.LocationId == "0";
  }

  getSelectedSmartCardNumber(smartCardPassenger) {
    if (smartCardPassenger.SmartCardNumber == "" || smartCardPassenger.SmartCardNumber == null) {
      return this.selectedSmartCardNumber;
    }
    return smartCardPassenger.SmartCardNumber
  }

  isExistDeliveryModeName(){
    return (!this.isUpdateDeliveryModeOnSelection && this.responseData?.Data?.BasketJourneyResponse?.Journey?.length > 0 && this.responseData?.Data?.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1]?.DeliveryDetail[0] && this.responseData?.Data?.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1]?.DeliveryDetail[0]?.DeliveryModeName);
  }

  setBillingAddressForPostAddresses() {
    if ((this.responseData?.Data?.BasketJourneyResponse?.Journey?.length > 0 && this.responseData?.Data?.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1]?.DeliveryDetail[0] && (this.responseData?.Data?.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1]?.DeliveryDetail[0]?.DeliveryModeType == this.appRouteEnum.DeliveryMode_FRTNEXTDAY) || (this.responseData.Data.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse.Journey?.length - 1].DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS))) { // if selected default post delivery
      let selectedAddressForPostDelivery = this.responseData.Data.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1].SelectedDeliveryAddress;
      let clonedArrForPostDeliveryAddress: any[] = JSON.parse(JSON.stringify(this.DeliveryModesDto?.Addresses));
      if (selectedAddressForPostDelivery) {
        for (let [index, DeliveryModesDtoAddress] of clonedArrForPostDeliveryAddress.entries()) {
          if (selectedAddressForPostDelivery?.Address1.includes(DeliveryModesDtoAddress?.Address?.Address1)) {
            DeliveryModesDtoAddress.IsDefault = true;
            this.defaultDeliveryAddressIndexPost = index;
          } else {
            DeliveryModesDtoAddress.IsDefault = false;
          }
        }
      }
      this.billingAddresses = clonedArrForPostDeliveryAddress;
    } else {
      this.billingAddresses = this.DeliveryModesDto.Addresses;
    }
  }

  setBillingAddressForOrderSmartCardAddresses() {
    if (this.checkOrderSmartCardAddressWithSmartCard()) { // if selected default smart card delivery with order smart card info
      this.setDetailForBillingAddressInCaseOfOrderSmartCardInfo();
    } else if (this.checkSmartCardDelectedOrNot() && this.DeliveryModesDto?.SmartCardDetails && this.DeliveryModesDto?.SmartCardDetails?.length > 0) { // if selected default smart card delivery with smart card numbers
      this.setDetailForBillingAddressInCaseOfSmartCardNumber();
    } else {
      this.smartCardBillingAddress = this.DeliveryModesDto?.Addresses;
    }
  }

  checkOrderSmartCardAddressWithSmartCard() {
    return this.responseData?.Data?.BasketJourneyResponse?.Journey?.length > 0 && this.responseData?.Data?.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1]?.DeliveryDetail[0] && (this.responseData?.Data?.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1]?.DeliveryDetail[0]?.DeliveryModeType == this.appRouteEnum.DeliveryMode_Smart_Card && this.responseData?.Data?.BasketJourneyResponse?.OrderSmartCardInfo?.Address);
  }

  checkLengthOfDeliveryModesAddress() {
    return this.DeliveryModesDto?.Addresses && this.DeliveryModesDto?.Addresses?.length > 0;
  }

  isExistSmartCardNumberOfLatestJourney(): boolean {
    let journeys = this.responseData?.Data?.BasketJourneyResponse?.Journey;

    let latestJourney = journeys?.[journeys.length - 1];
    let smartCardNumber = latestJourney?.DeliveryDetail?.[0]?.SmartCardNumber;

    return !!smartCardNumber;
  }

  setIsSeasonValueInDeliveryModeRequest(): void {
    let hasSeasonDetail =
      !!this.sharedService?.reviewBuyResponse?.Journey?.[0]?.SeasonDeatil;

    let isSeasonSearch = !!this.searchRequest?.IsSeason;

    this.deliveryModeRequest.isSeason = hasSeasonDetail || isSeasonSearch;
  }

  setDeliveryTypeValueInDeliveryModeRequest(deliveryMode) {
    if (deliveryMode == this.appRouteEnum.DeliveryMode_FRTNEXTDAY) {
      this.deliveryModeRequest.DeliveryType = this.appRouteEnum.DeliveryMode_NEXTDAYDELIVERY;
      this.isChangeAddressOfPostDelivery = true;
    } else if (deliveryMode == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS) {
      this.deliveryModeRequest.DeliveryType = this.appRouteEnum.DeliveryMode_FIRSTCLASSPOST;
      this.isChangeAddressOfPostDelivery = true;
    } else {
      this.deliveryModeRequest.DeliveryType = '';
    }
  }

  checkLengthOfJourney() {
    return this.reviewBuyResponse?.Journey?.length > 0;
  }

  checkDeliveryModeSmartCardSelectedOrNot() {
    if (this.IsDeliveryModeSmartcardSelected) {
      this.IsSmartCardAvailableFlag = true;
    } else {
      this.IsSmartCardAvailableFlag = this.DeliveryModesDto.IsSmartCardAvailable;
    }
  }

  setBillingAddressInDeliveryModeReq() {
    if (this.billingAddresses && this.billingAddresses.length > 0) {
      this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
    }
  }

  getDeliveryModeForPassangarDetailWithSmartCard() {
    this.DeliveryModesDto.DeliveryMode = this.DeliveryModesDto.DeliveryMode.filter(x => {
      if ((this.totalAdult > 0 && this.totalChild > 0) && (x.DeliveryMode === this.appRouteEnum.DeliveryMode_Smart_Card)) {
        return false;
      }
      return true;
    });
  }

  checkIfDeliveryModeIsNotHideAndFirstClass(mode, deliveryModeEnum){
    return mode.DeliveryMode == deliveryModeEnum && !mode.IsHide;
  }

  setDeliveryModesCountInCaseOfHideTOD(){
    if (this.isHideTod) {
      this.deliveryModesCount -= 1;
    }
  }

  setDetailsWhenDeliveryModeIsTOD(mode){
    if (mode.DeliveryMode == this.appRouteEnum.DeliveryMode_TOD) {
      this.isHideTod = mode.IsHide;
      this.getIsDeliveryModeTODValue();
      //Check for delivermodecounts incase price more than 1000. TOD will be there but isHideTod will true
      this.setDeliveryModesCountInCaseOfHideTOD();
      //check end
    }
  }

  setDetailsWhenDeliveryModeIsETicket(mode){
    if (mode.DeliveryMode == this.appRouteEnum.DeliveryModeETicket) {
      this.isDeliveryModeEticket = true;
    }
  }

  setDetailsWhenDeliveryModeIsFirstClass(mode, displayFirstClassOrNextDayDelivery){
    if (this.checkIfDeliveryModeIsNotHideAndFirstClass(mode, this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS)) {
      // add custom hide property 
      if (!displayFirstClassOrNextDayDelivery) {
        mode['displayBoth'] = true;
        displayFirstClassOrNextDayDelivery = true;
      } else {
        mode['displayBoth'] = false;
      }
      this.postDeliveryForm.get('deliveryType').setValue(this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS);
      this.isDeliveryModeFirstClassPost = true;
      this.firstClassPostPrice = 2;
      this.postDeliveryPrice = 2;
    }
    return displayFirstClassOrNextDayDelivery;
  }
  
  setDetailsWhenDeliveryModeIsNextDay(mode, displayFirstClassOrNextDayDelivery){
    if (this.checkIfDeliveryModeIsNotHideAndFirstClass(mode, this.appRouteEnum.DeliveryMode_FRTNEXTDAY)) {
      // add custom hide property 
      if (!displayFirstClassOrNextDayDelivery) {
        mode['displayBoth'] = true;
        displayFirstClassOrNextDayDelivery = true;
      } else {
        mode['displayBoth'] = false;
      }
      this.postDeliveryForm.get('deliveryType').setValue(this.appRouteEnum.DeliveryMode_FRTNEXTDAY);
      this.isDeliveryModeNextDayDelivery = true;
      this.nextDayDeliveryModePrice = 7.50;
      this.postDeliveryPrice = 7.50;
    }
    return displayFirstClassOrNextDayDelivery;
  }

  setDetailsWhenDeliveryModeIsSmartCard(mode){
    if (this.checkIfDeliveryModeIsNotHideAndFirstClass(mode, this.appRouteEnum.DeliveryMode_Smart_Card)) {
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
      if (this.smartCardPassengerList == null) {
        this.onLoadPassengerList();
      } else {
        this.smartCardPassengerList[0].IsAddedSmartcard = true;
      }
    }
  }
  
  setDetailsIfSmartCardNumberExistsOfLatestJourney(){
    if (this.isExistSmartCardNumberOfLatestJourney()) {
      this.IsDeliveryModeSmartcardSelected = true
      this.selectedSmartCardNumber = this.responseData.Data.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse.Journey?.length - 1].DeliveryDetail[0].SmartCardNumber;
      this.isChangeAddressOfOrderSmartCardDelivery = true;
      this.isChangeNumberOfSmartCard = true;
    }
  }

  getDefaultDeliveryAddressIndexForPostAndSmartcard(){
    if (this.checkLengthOfDeliveryModesAddress()) {
      for (let i = 0; i < this.DeliveryModesDto?.Addresses?.length; i++) {
        if (this.DeliveryModesDto.Addresses[i].IsDefault === true) {
          this.defaultDeliveryAddressIndex = i;
          this.defaultDeliveryAddressIndexPost = i;
          this.selectedaddress = this.DeliveryModesDto.Addresses[i];
        }
      }
      
      // for post delivery address
      this.setBillingAddressForPostAddresses();
      

      // for order smart card address
      this.setBillingAddressForOrderSmartCardAddresses();
      
      this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    }
  }

  callDeliveryOptionGA4DataLayer(){
    if (this.isExistDeliveryModeName()) {
      let getDeliveryModeNameForLatestJourney = this.responseData.Data.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1].DeliveryDetail[0].DeliveryModeName;
      this.ga4DatalayerService.loadGALayerForAddDeliveryOption(this.sharedService?.searchRequest, this.sharedService?.journeySummaryModel, getDeliveryModeNameForLatestJourney, this.commonService.jourenyExtraForCheckout());
    }
  }

  callRedirectionOnSearchResultPage(){
    if ((this.DeliveryModesDto && !this.DeliveryModesDto?.IsDeliveryModesAvailable)) {
      let noDeliveryMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.noDeliveryModeInformation,
        notificationTitle: this.notificationErrorMsg.deliveryModesUnavailabitilyTitle,
      }
      this.sharedService.ReservationCache = null;
      this.sharedService.LatestJourneyCache = this.reviewBuyResponse.LatestJourneyCache;
      let dialogRef = this.commonService.commonNotificationDialog('review-nodelivery-common-notification-dialog', noDeliveryMsgsObj, this.commonIconImg.exclamationIConImgForNoDelivery, true, false, false, true);
      dialogRef.afterClosed().subscribe(() => {

        this.redirectingOnSearchResultsPage();

      });
      
    }
  }

  callTimeOutPopupForBasketJourneyOfReviewBuyResponse(){
    if (!this.reviewBuyResponse.IsBasketJourneyValid) {
      this.timeoutpopup(this.reviewBuyResponse.BasketJourneyMessage, false);
    }
  }
  
  callingMethodToAddDeliveryModesInEveryJourney(){
    for (let journey of this.reviewBuyResponse.Journey) {
      journey['deliveryModes'] = [];
      journey['deliveryModes'].push(...this.deliveryModes)
      for (let selectedDeliveryType of journey.DeliveryDetail) {
        selectedDeliveryType['DeliveryMode'] = '';
        selectedDeliveryType['DeliveryMode'] = selectedDeliveryType['DeliveryModeType'];
      }
      for (let [index, deliverymode] of this.DeliveryModesDto.DeliveryMode.entries()) {
        // if selected anytype delivery mode then push it on top and remove previous value
        if (journey.DeliveryDetail[0]['DeliveryModeType'] == deliverymode.DeliveryMode) {
          this.DeliveryModesDto.DeliveryMode.splice(0, 0, deliverymode);
          this.DeliveryModesDto.DeliveryMode.splice(index + 1, 1);
        }
      }
    }
  }

  callingMethodToRemoveJourneyWhenExpired(index){
    if(this.commonService.removedJourneyOnReservationTimeExpired(index, this.expiredJounreyDetailObject)){
      this.removeJourneyWhenExpired(this.expiredJounreyDetailObject?.removeJourneyArrayObject[index + 1].journeyCreationDate, index+1);
    }
  }
  
  checkEventTypeOrCode(event){
    return event.type == "click" || event.keyCode === 13;
  }

  callingRedirectOnSearchResultPageWhenClickOnDeliveryMode(){
    if (this.deliveryModes.length == 0) {
      let noDeliveryMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.noDeliveryModeInformation,
        notificationTitle: this.notificationErrorMsg.deliveryModesUnavailabitilyTitle,
      }
      let dialogRef = this.commonService.commonNotificationDialog('review-nodelivery-common-notification-dialog', noDeliveryMsgsObj, this.commonIconImg.exclamationIConImgForNoDelivery, true, false, false, true);
      dialogRef.afterClosed().subscribe(() => {

        this.redirectingOnSearchResultsPage();

      });
    }
  }

  checkDeliveryModeIsNextDayOrFirstClass(deliveryMode){
    return deliveryMode == this.appRouteEnum.DeliveryMode_FRTNEXTDAY || deliveryMode == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS;
  }

  checkIfSearchResultIsHavingAdultsOrNot(){
    return this.sharedService.searchRequest.Adult > 0 ? true : false;
  }
  
  setDetailForBillingAddressInCaseOfOrderSmartCardInfo(){
    this.smartCardBillingAddress = [];
    let selectedAddressForOrderSmartCard = this.responseData.Data.BasketJourneyResponse?.OrderSmartCardInfo?.Address;
    let clonedArrForSmartCardDeliveryAddress: any[] = JSON.parse(JSON.stringify(this.DeliveryModesDto?.Addresses));
    if (selectedAddressForOrderSmartCard) {
      for (let [index, DeliveryModesDtoAddress] of clonedArrForSmartCardDeliveryAddress.entries()) {
        if (selectedAddressForOrderSmartCard?.Address1.includes(DeliveryModesDtoAddress?.Address?.Address1)) {
          DeliveryModesDtoAddress.IsDefault = true;
          this.defaultDeliveryAddressIndex = index;
        } else {
          DeliveryModesDtoAddress.IsDefault = false;
        }
      }
    }
    this.smartCardBillingAddress = JSON.parse(JSON.stringify(clonedArrForSmartCardDeliveryAddress));
  }

  setDetailForBillingAddressInCaseOfSmartCardNumber(){
    this.smartCardBillingAddress = [];
      let selectedAddressForOrderSmartCard = this.responseData.Data.BasketJourneyResponse?.Journey[this.responseData.Data.BasketJourneyResponse?.Journey?.length - 1].SelectedDeliveryAddress;
      let clonedArrForSmartCardDeliveryAddress: any[] = JSON.parse(JSON.stringify(this.DeliveryModesDto?.Addresses));
      if (selectedAddressForOrderSmartCard) {
        for (let [index, DeliveryModesDtoAddress] of clonedArrForSmartCardDeliveryAddress.entries()) {
          if (selectedAddressForOrderSmartCard?.Address1.includes(DeliveryModesDtoAddress?.Address?.Address1)) {
            DeliveryModesDtoAddress.IsDefault = true;
            this.defaultDeliveryAddressIndex = index;
          } else {
            DeliveryModesDtoAddress.IsDefault = false;
          }
        }
      }
      this.smartCardBillingAddress = JSON.parse(JSON.stringify(clonedArrForSmartCardDeliveryAddress));
  }

  trimSpacesFromPostCodeFormControl() {
    this.postCodeValueChangeSubscription = this.addressForm.controls['postCode'].valueChanges.subscribe(x => {
      if (x?.includes(' ')) {
        this.addressForm.controls['postCode'].setValue(x.trim().replace(/\s/g, ""))
      }
    });
  }

  isExistSeasonDetail(): boolean {
    return this.sharedService?.reviewBuyResponse?.Journey?.[0]?.SeasonDeatil != null;
  }

  isAppliedDiscountCode() {
    if (this.reviewBuyResponse?.Journey?.length > 0) {
      if (this.reviewBuyResponse?.Journey[this.reviewBuyResponse?.Journey?.length - 1].CreationDate == this.addDiscountRequest.JourneyCreationDate && this.discountCodeControl.value == this.discountResponse.DiscountCode) {
        return true;
      }
      return false;
    }
  }

}
