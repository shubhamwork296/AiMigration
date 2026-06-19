import { ChangeDetectorRef, Component, ElementRef, HostListener, Injector, OnInit, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatAccordion, MatExpansionPanel } from "@angular/material/expansion";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";
import { ResponseData } from "src/app/models/common/response.model";
import { EnhancedFareModel } from "src/app/models/enhanced-mixing-deck/enhanced-fare.model";
import { EnhancedGetDeliveryAndBasketJourneyRequest } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-get-delivery-and-basket-journey-request";
import { EnhancedAddDiscountRequest, EnhancedDiscountResponse, EnhancedJourneyDetail, EnhancedRemoveJourneyRequest, EnhancedReviewBuyAndDeliveryResponse, EnhancedReviewBuyResponse } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";
import { CommonServices } from "src/app/services/common.service";
import { EnhancedReviewBuyAndDeliveryService } from "src/app/services/enhanced-review-buy-and-delivery.service";
import { SearchStateService } from "src/app/services/search-state.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import { AppConstantsService, AppRouteEnum, ClassTypeEnum, CommonIconImg, DeliveryModeEnum, EnhancedAppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedGa4DatalayeEventNameEnum, EnhancedGA4SearchSourceEnum, EnhancedJourneyType, EnhancedLoaderTextEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedOperatorNamesEnum, EnhancedPassangerTypeEnum, EnhancedPrefixOfTicketTypeEnum, EnhancedRailcardTypeEnum, EnhancedReviewBuyAndDeliveryBtnTextEnum, EnhancedReviewBuyAndDeliveryErrorMessageEnum, EnhancedReviewBuyAndDeliveryIdsEnum, EnhancedReviewBuyAndDeliveryPageEnum, EnhancedReviewBuyAndDeliveryReservationMessageEnum, EnhancedReviewBuyReservedOrNonReservedMessageHeading, EnhancedTravelExtrasTextEnum, EnhancedTravelSolutionTypesEnum, Ga4DatalayeEventNameEnum, Ga4ItemListEnum, LocalStorageKeyEnum, NotificationErrorMsg, PageTypeEnum, TravelSolutionDirectionEnum, TravelSolutionJourneyTypeEnum } from "src/app/utility/app-constants.service";
import { EnhancedTicketDetailsDialogsComponent } from "../enhanced-dialogs/enhanced-ticket-detail-dialogs/enhanced-ticket-detail-dialogs.component";
import { EnhancedSeatpickerPopupComponent } from "../enhanced-dialogs/enhanced-seat-picker-dialogs/enhanced-seatpicker-popup.component";
import { EnhancedJourneyExtrasRequest, TravelExtraList } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-journey-extras-request.model";
import { SharedServiceCache } from "src/app/services/SharedServiceCache.service";
import { EnhancedTravelExtraResponseDto, ReservationResponse } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-journey-extras-response.model";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { FareBreakdownModel, JourneyModel } from "src/app/models/mixing-deck/fare-breakdown.model";
import { browserRefresh } from "src/app/app-component/app.component";
import { RailCardPriceList } from "src/app/models/review-buy/review-buy-model";
import { EnhancedDeliveryMode, EnhancedDeliveryModeRequest } from "src/app/models/enhanced-delivery-modes/enhanced-delivery-mode-request.model";
import { JourneySummaryModel } from "src/app/models/mixing-deck/travel-solution.model";
import { FormGroup, FormControl, Validators, FormBuilder, NgModel } from "@angular/forms";
import { Address, CustomerAddress } from 'src/app/models/payment-details/billing-address-response.model';
import { CustomerInfoUpdate } from "src/app/models/customer/customer-address.model";
import { checkUserName } from "src/app/utility/custom-validations/must-match-validation";
import { GeneralInformation, SmartCardDetails } from "src/app/models/account/my-payment-vouchers.model";
import { SmartCardInfo, SmartCardValidationRequest } from "src/app/models/delivery-modes/delivery-modes.model";
import { LocationMasterData } from "src/app/models/master/location-master.model";
import { Observable, of, Subscription } from "rxjs";
import * as moment from "moment";
import { NotificationService } from "src/app/utility/toastr-notification/toastr-notification.service";
import { EnhancedPriceBreakdownDialogs } from "../enhanced-dialogs/enhanced-price-breakdown-dialogs/enhanced-price-breakdown-dialogs.component";
import { EnhancedGoBackDialogsComponent } from "../enhanced-dialogs/enhanced-go-back-dialogs/enhanced-go-back-dialogs.component";
import { EnhancedRemoveJourneyDialogsComponent } from "../enhanced-dialogs/enhanced-remove-journey-dialogs/enhanced-remove-journey-dialogs.component";
import { EnhancedExpireBasketJourneyDialogsComponent } from "../enhanced-dialogs/enhanced-expire-basket-journey-dialogs/enhanced-expire-basket-journey-dialogs.component";
import { EnhancedExpiredJourneyDialogsComponent } from "../enhanced-dialogs/enhanced-expired-journey-dialogs/enhanced-expired-journey-dialogs.component";
import { EnhancedChangeDeliveryOptionDialogsComponent } from "../enhanced-dialogs/enhanced-change-delivery-option-dialogs/enhanced-change-delivery-option-dialogs.component";
import { EnhancedNoSeatsAvailableDialogsComponent } from "../enhanced-dialogs/enhanced-no-seats-available-dialogs/enhanced-no-seats-available-dialogs.component";
import { EnhancedChangeSeatPreferenceDialogs } from "../enhanced-dialogs/enhanced-change-seat-preference-dialogs/enhanced-change-seat-preference-dialogs.component";
import { EnhancedTimeoutDialogsComponent } from "../enhanced-dialogs/enhanced-timeout-dialogs/enhanced-timeout-dialogs.component";
import { EnhancedPaymentApiDataService } from "src/app/services/enhanced-payment-api-data.service";
import { PaymentDetailRequest } from "src/app/models/payment-details/payment-details-request.model";
import { PaymentDetailResponse } from "src/app/models/payment-details/payment-details-response.model";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { MonetateService } from "src/app/utility/monetate/monetate.service";
import { DatePipe } from "@angular/common";
 
@Component({
    selector: "app-enhanced-travel-extra-and-reviewby-delivery",
    templateUrl: "./enhanced-travelExtra-and-reviewByDelivery.component.html",
    styleUrls: ["./enhanced-travelExtra-and-reviewByDelivery.component.css"],
    standalone: false
})
export class EnhancedTravelExtraAndReviewByDeliveryComponent implements OnInit {
  @ViewChildren(MatAccordion) allAccordions!: QueryList<MatAccordion>;
  storageDataService: StorageDataService;
  sharedService: SharedService;
  reviewBuyJourneyTimeStampArr: any[] = [];
  enhancedReviewBuyAndDelivery: EnhancedReviewBuyAndDeliveryService;
  searchStateService: SearchStateService;
  selectedOutOrRetTravelSolutionData: any;
  enhancedGetDeliveryAndBasketJourneyRequest: EnhancedGetDeliveryAndBasketJourneyRequest;
  selectedTravelSolutionFares: any;
  localStorageEnum: LocalStorageKeyEnum;
  enhancedReviewBuyAndDeliveryResponse: EnhancedReviewBuyAndDeliveryResponse;
  responseData: ResponseData;
  spinnerService: NgxSpinnerService;
  enhancedReviewBuyAndDeliveryPageEnum: EnhancedReviewBuyAndDeliveryPageEnum;
  router: Router;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  isLoaderActive: boolean = true;
  commonServices: CommonServices;
  appConstantsService: AppConstantsService;
  appRouteEnum: AppRouteEnum;
  enhancedDynamicClassEnum: EnhancedDynamicClassesNameEnum;
  selectedBicycle = "1";
  selectedBicycleReturn = "1";
  enhancedTravelExtrasTextEnum: EnhancedTravelExtrasTextEnum;
  isOpenSeatpicker: boolean = false;
  ga4ItemListEnum: Ga4ItemListEnum;
  isLegChoosed: boolean = false;
  choosedTrainLeg: any;
  reviewBuyCache: string;
  outwardBicycleReservation: number = 0;
  returnBicycleReservation: number = 0;
  journeyExtras: Array<TravelExtraList> = [];
  enhancedJourneyExtrasRequest: EnhancedJourneyExtrasRequest;
  browserRefresh: boolean;
  sharedServiceCache: SharedServiceCache;
  enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
  enhancedTravelExtraResponseDto: EnhancedTravelExtraResponseDto;
  travelExtraReservationResponse: ReservationResponse;
  isOutSeatDetailsOpen: boolean = false;
  isRetSeatDetailsOpen: boolean = false;
  outwardPlusBusReservePrice: number = 0;
  returnPlusBusReservePrice: number = 0;
  outwardLondonTravelReservePrice: number = 0;
  returnLondonTravelReservePrice: number = 0;
  getIsBackButttonRes: boolean = false;
  searchRequest: EnhancedSearchRequestModel;
  fareBreakDownData: FareBreakdownModel[];
  railCardPriceListArray: Array<RailCardPriceList> = [];
  deliveryModeRequest: EnhancedDeliveryModeRequest;
  removeJourneyRequest: EnhancedRemoveJourneyRequest;
  removeIndexOfreviewBuyJourneyTimeStampArr = -1;
  deletedJourney = null;
  enhancedDiscountResponse: EnhancedDiscountResponse;
  GAremoveCartResponse: EnhancedReviewBuyAndDeliveryResponse;
  removeResponse: EnhancedReviewBuyResponse;
  isBasketEmpty: boolean = false;
  returnTravelCardPrice = 0;
  outwardTravelCardPrice = 0;
  outwardSelectedTravelCard: any = -1;
  returnSelectedTravelCard: any = -1;
  totalPlusBusReservePrice: number = 0;
  @ViewChild("bikePanel") bikePanel!: MatExpansionPanel;
  @ViewChild("plusBusPanel") plusBusPanel!: MatExpansionPanel;
  @ViewChild("travelCardPanel") travelCardPanel!: MatExpansionPanel;
  accordionRefs: Record<string, MatExpansionPanel> = {};
  noOfAdult: number = 0;
  noOfChild: number = 0;
  totalPassengerCount: number = 0;
  hasSavedTravelCard: boolean = false;
  lastSavedTravelCard: any = null;
  enhancedPassangerTypeEnum: EnhancedPassangerTypeEnum;
  selectedDeliveryMode: any;
  nextDayDeliveryPriceForPost: number = 7.5;
  firstClassDeliveryPriceForPost: number = 2.0;
  totalPrice: number = 0;
  enhancedAddDiscountRequest: EnhancedAddDiscountRequest;
  discountCode: string;
  postDeliveryForm: FormGroup;
  addressForm: FormGroup;
  billingAddresses: any[] = [];
  isChangeAddressOfPostDelivery: boolean = false;
  selectedaddress: any;
  tempDeliveryAddress: Address;
  defaultDeliveryAddressIndexPost: number = 0;
  defaultDeliveryAddressIndex: number = 0;
  isSmartCardPanelAddress: boolean = false;
  isPostPanelAddress: boolean = false;
  showAddAdress: boolean = true;
  isAddressShow: boolean = false;
  isAddAddress: boolean = true;
  editIndex: number;
  editableAddress: CustomerAddress;
  addressList = ["postCode", "address1", "address2", "address3", "city", "country"];
  address: CustomerAddress;
  isAdd: boolean = false;
  el: ElementRef;
  customerInfoUpdateModel: CustomerInfoUpdate;
  smartCardBillingAddress: CustomerAddress[] = [];
  DeliveryModesDto: EnhancedDeliveryMode[] = [];
  orderSmartcardForm: FormGroup;
  isCheckedTermsCondition: boolean = true;
  IsDeliveryModeSmartcardSelected: boolean = false;
  isOrderSmartCard: { [key: number]: boolean } = {};
  isChangeAddressOfOrderSmartCardDelivery: boolean = false;
  totalAdult: number;
  totalChild: number;
  totalPassenger: number;
  isMultiplePassengerCase: boolean = false;
  storedAddress: CustomerAddress[];
  selectedSmartCardNumber: any[] = [];
  isChangeNumberOfSmartCard: boolean = false;
  selectedSmartcardList: { passengerIndex: number, smartcardIndex: number, smartcard: string }[] = [];
  smartCardPassengerList: SmartCardInfo[];
  adultCount: number = 1;
  childCount: number = 0;
  onSelectPassenger: boolean;
  filteredStations: Observable<LocationMasterData[]>;
  locationName: any;
  showSmartCardCancel: boolean = false;
  locationId: string;
  IsLoadStationAvailable: boolean;
  maxDate = new Date();
  isDelete: boolean = false;
  isTravelCardChanged: boolean = false;
  IsValidateAddPassenger: { [key: number]: boolean } = {};
  defaultDeliveryMode: string = "TOD";
  deliveryModeCache: string;
  isNreBasket: boolean;
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;
  isUpdateDeliveryModeOnSelection: boolean = false;
  invalidJourney: string = "";
  showOnlySelectedDeliveryType: boolean = true;
  commonIconImg: CommonIconImg;
  notificationservice: NotificationService;
  discountCodeControls: { [creationDate: string]: FormControl } = {};
  selectedJourneyAccordion: number;
  deliveryModesCount: number[] = [];
  notificationErrorMsg: NotificationErrorMsg;
  showChangeDeliveryButton: boolean = false;
  IsSmartCardAvailableFlag: any;
  deliveryModes: any;
  isHideTod: any;
  isDeliveryModeTOD: boolean = false;
  isDeliveryModeEticket: boolean = false;
  isDeliveryModeFirstClassPost: boolean = false;
  firstClassPostPrice: number;
  postDeliveryPrice: number = 2.0;
  isDeliveryModeNextDayDelivery: boolean = false;
  nextDayDeliveryModePrice: number;
  isBikeExtraChanged: boolean = false;
  isPlusBusExtraChanged: boolean = false;
  outwardSelectedTravelCardPeak: any = -1;
  outwardSelectedTravelCardOffPeak: any = -1;
  returnSelectedTravelCardPeak: any = -1;
  returnSelectedTravelCardOffPeak: any = -1;
  smartCardError: boolean = false;
  isSmartCardAlreadyAdded: boolean = false;
  expiredJounreyDetailObject: any;
  enhancedReservationMessageEnum: EnhancedReviewBuyAndDeliveryReservationMessageEnum;
  orderOfDeliveryModes = [
    "ETICKET",
    "TOD",
    "SMART_CARD",
    "FRTFIRSTCLASS",
    "FRTNEXTDAY",
  ];
  @ViewChildren("smartcardCtrl") smartcardCtrl!: QueryList<NgModel>;
  usePersonalInfoCheckbox: boolean = true;
  enhancedPrefixOfTicketTypeEnum: EnhancedPrefixOfTicketTypeEnum;
  deliveryModeEnum: DeliveryModeEnum;
  hasDefault: boolean = false;
  ga4DataLayerEnum: Ga4DatalayeEventNameEnum;
  reviewBuyAndDeliveryErrorMessageEnum: EnhancedReviewBuyAndDeliveryErrorMessageEnum;
  enhancedJourneyType: EnhancedJourneyType;
  enhancedRailCardTypeEnum: EnhancedRailcardTypeEnum;
  enhancedReviewBuyAndDeliveryBtnTextEnum: EnhancedReviewBuyAndDeliveryBtnTextEnum;
  journeyRemovedClass: boolean = false;
  enhancedReviewBuyReservedOrNonReservedMessageHeading: EnhancedReviewBuyReservedOrNonReservedMessageHeading;
  timeoutRef: any;
  showEnterSmartCardDiv: boolean = false;
  enhancedOperatorNameEnum: EnhancedOperatorNamesEnum;
  isDisabledContinue: boolean = false;
  @ViewChild("deliveryModeExpansionPanel") deliveryModeExpansionPanel!: MatExpansionPanel;
  enhancedReviewBuyAndDeliveryIdEnum: EnhancedReviewBuyAndDeliveryIdsEnum;
  activePanel: MatExpansionPanel;
  previousSelectedDeliveryMode: string = "";
  isOutSeatDetailsOpenMap: { [key: number]: boolean } = {};
  isRetSeatDetailsOpenMap: { [key: number]: boolean } = {};
  @ViewChildren("scrollTarget") journeyScrollTargets!: QueryList<ElementRef>;
  accordionRefsExtras: { [creationDate: string]: { [key: string]: MatExpansionPanel } } = {};
  isDeliveryModeChange: boolean = false;
  smartcardAddressAdded: { [key: number]: boolean } = {};
  smartcardAddressDeleted: { [key: number]: boolean } = {};
  postAddressDeleted: { [key: number]: boolean } = {};
  postAddressAdded: { [key: number]: boolean } = {};
  smartcardAddressUpdated: { [key: number]: boolean } = {};
  postAddressUpdated: { [key: number]: boolean } = {};
  @ViewChild("loadStationOrderSmartCardTwo") loadStationOrderSmartCardTwo: NgModel;
  @ViewChildren("loadStationOrderSmartCardOne") loadStationOrderSmartCardOneControls!: QueryList<NgModel>;
  isSelectedPassengerValid: boolean[] = [];
  @ViewChildren("passengerType") passengerTypeControls!: QueryList<NgModel>;
  isEnterSmartCardNumber: boolean = false;
  isAccordion: boolean = true;
  outwardSeatMessage: string | null = null;
  outwardSeatMessageSuccess: boolean = false;
  showOutwardSeatMessage: boolean = false;
  returnSeatMessage: string | null = null;
  returnSeatMessageSuccess: boolean = false;
  showReturnSeatMessage: boolean = false;
  journeyXMLID: string;
  uniqueDepartureForchangeSeat: string;
  selectedPassengerIndex: number | null = null;
  selectAllPassengersInSmartCard: { [key: number]: boolean } = {};
  blankSmartCardNumber: { [key: number]: boolean } = {};
  InValidSmartCard: { [key: number]: boolean } = {};
  isOutSeatDetailsOpenMapMessage: { [key: string]: boolean } = {};
  isRetSeatDetailsOpenMapMessage: { [key: string]: boolean } = {};
  inValidAddress: { [key: string]: boolean } = {};
  uniqueArrivalForchangeSeat: string;
  smartCardValidateMesage: string = "";
  backendErrorState: {
    [journeyId: string]: {
      bike: string;
      plusbus: string;
      travelcard: string;
    };
  } = {};
  discountErrorState: { [journeyId: string]: string } = {};
  selectedAddressIndexForSmartCard: number;
  selectedAddressIndexForPost: number;
  isBikeExtraChangedMap: { [creationDate: string]: boolean } = {};
  isPlusBusExtraChangedMap: { [creationDate: string]: boolean } = {};
  isAdd_New: string = "ADD_NEW";
  outwardBikeChecked: boolean = false;
  returnBikeChecked: boolean = false;
  enhancedPaymentApiDataService: EnhancedPaymentApiDataService;
  paymentDetailsRequest: PaymentDetailRequest;
  paymentDetailsResponse: PaymentDetailResponse;
  ga4DatalayerService: GA4DatalayerService;
  enhancedTravelSolutionTypesEnum: EnhancedTravelSolutionTypesEnum;
  enhancedSearchSourceTypeEnum: EnhancedGA4SearchSourceEnum;
  enhancedGA4DataLayer: EnhancedGA4DatalayerService;
  monetateService: MonetateService;
  pageTypeEnum: PageTypeEnum;
  postCodeValueChangeSubscription: Subscription;
  isCancelVisibleBtn: boolean = true;
  isBackToHomeBtnVisible: boolean = false;
  classTypeEnum: ClassTypeEnum;
  enhancedLoaderTextEnum: EnhancedLoaderTextEnum;
  isBasketJourney: boolean = false;
  isPaymentAPICall: boolean = false;
  ariaPlusOutLabel: string = '';
  ariaMinusOutLabel: string = '';
  ariaPlusRetLabel: string = '';
  ariaMinusRetLabel: string = '';
  travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
  datePipe: DatePipe;
  enhancedGA4DataLayerEventNameEnum: EnhancedGa4DatalayeEventNameEnum;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly injector: Injector,
    private readonly dialog: MatDialog,
    private readonly formbuilder: FormBuilder,
    private readonly route: ActivatedRoute
  ) {
    this.storageDataService = this.injector.get(StorageDataService);
    this.enhancedReviewBuyAndDelivery = this.injector.get(EnhancedReviewBuyAndDeliveryService);
    this.searchStateService = this.injector.get(SearchStateService);
    this.localStorageEnum = this.injector.get(LocalStorageKeyEnum);
    this.sharedService = this.injector.get(SharedService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.enhancedReviewBuyAndDeliveryPageEnum = this.injector.get(EnhancedReviewBuyAndDeliveryPageEnum);
    this.router = this.injector.get(Router);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.commonServices = this.injector.get(CommonServices);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.enhancedDynamicClassEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
    this.enhancedTravelExtrasTextEnum = this.injector.get(EnhancedTravelExtrasTextEnum);
    this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
    this.enhancedJourneyExtrasRequest = new EnhancedJourneyExtrasRequest();
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
    this.searchRequest = this.sharedService.searchRequest;
    this.enhancedReviewBuyAndDeliveryResponse = this.sharedService.enhancedReviewBuyResponse;
    if (this.enhancedReviewBuyAndDeliveryResponse) {
      this.reviewBuyCache = this.enhancedReviewBuyAndDeliveryResponse?.ReviewBuyCache;
    }
    this.fareBreakDownData = [];
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.deliveryModeRequest = new EnhancedDeliveryModeRequest();
    this.deliveryModeRequest.PreviousCache = this.sharedService.reviewBuyCache;
    this.removeJourneyRequest = new EnhancedRemoveJourneyRequest();
    this.GAremoveCartResponse = new EnhancedReviewBuyAndDeliveryResponse();
    this.enhancedPassangerTypeEnum = this.injector.get(EnhancedPassangerTypeEnum);
    this.enhancedAddDiscountRequest = new EnhancedAddDiscountRequest();
    this.customerInfoUpdateModel = new CustomerInfoUpdate();
    this.customerInfoUpdateModel.Addresses = new Array<CustomerAddress>();
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
    this.commonIconImg = this.injector.get(CommonIconImg);
    this.notificationservice = this.injector.get(NotificationService);
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
    this.enhancedReservationMessageEnum = this.injector.get(EnhancedReviewBuyAndDeliveryReservationMessageEnum);
    this.enhancedPrefixOfTicketTypeEnum = this.injector.get(EnhancedPrefixOfTicketTypeEnum);
    this.deliveryModeEnum = this.injector.get(DeliveryModeEnum);
    this.ga4DataLayerEnum = this.injector.get(Ga4DatalayeEventNameEnum);
    this.reviewBuyAndDeliveryErrorMessageEnum = this.injector.get(EnhancedReviewBuyAndDeliveryErrorMessageEnum);
    this.enhancedJourneyType = this.injector.get(EnhancedJourneyType);
    this.enhancedRailCardTypeEnum = this.injector.get(EnhancedRailcardTypeEnum);
    this.enhancedReviewBuyAndDeliveryBtnTextEnum = this.injector.get(EnhancedReviewBuyAndDeliveryBtnTextEnum);
    this.enhancedReviewBuyReservedOrNonReservedMessageHeading = this.injector.get(EnhancedReviewBuyReservedOrNonReservedMessageHeading);
    this.enhancedOperatorNameEnum = this.injector.get(EnhancedOperatorNamesEnum);
    this.enhancedReviewBuyAndDeliveryIdEnum = this.injector.get(EnhancedReviewBuyAndDeliveryIdsEnum);
    this.enhancedPaymentApiDataService = this.injector.get(EnhancedPaymentApiDataService);
    this.ga4DatalayerService = this.injector.get(GA4DatalayerService);
    this.enhancedTravelSolutionTypesEnum = this.injector.get(EnhancedTravelSolutionTypesEnum);
    this.enhancedSearchSourceTypeEnum= this.injector.get(EnhancedGA4SearchSourceEnum);
    this.enhancedGA4DataLayer = this.injector.get(EnhancedGA4DatalayerService);
    this.pageTypeEnum = this.injector.get(PageTypeEnum);
    this.monetateService = this.injector.get(MonetateService);
    this.classTypeEnum = this.injector.get(ClassTypeEnum);
    this.enhancedLoaderTextEnum = this.injector.get(EnhancedLoaderTextEnum);
    this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.datePipe = this.injector.get(DatePipe);
    this.enhancedGA4DataLayerEventNameEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
    
  }

  ngOnInit() {
    localStorage.removeItem(this.enhancedLocalOrSessionStorageKeyEnum.getDataFromNRE); // Remove NRE key from localStorage after user clicks Continue
    this.route.paramMap.subscribe(() => {
    this.isBasketJourney = history?.state?.isBasketJourney;
    delete history?.state?.isBasketJourney; 
    window.history.replaceState(history?.state, '');
  });
    setTimeout(() => {
            this.isLoaderActive = false;
            this.isBasketJourney = false; 
        }, 2000);
    this.ga4DatalayerService.loadGA4DataLayerAllPages(true, true);
    this.monetateService.setPageType();

    this.sharedService.isJourneyRemoved$.subscribe((isRemovedJourney) => {
      if (isRemovedJourney) this.journeyRemovedClass = true;
    });

    if (localStorage.getItem(this.appRouteEnum.isBrowserBackButton) == "true") {
      this.getIsBackButttonRes = Boolean(localStorage.getItem(this.appRouteEnum.isBrowserBackButton));
    }
    this.browserRefresh = browserRefresh;
    let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    this.enhancedReviewBuyAndDeliveryResponse = sharedSiblingRefresh?.enhancedReviewBuyResponse;
    this.sharedService.enhancedReviewBuyResponse = this.enhancedReviewBuyAndDeliveryResponse;
    this.sharedService.reviewBuyCache = this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
    this.reviewBuyCache = this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
    this.setSharedServiceDetailAndEnhancedReviewBuyResponseOnInit(sharedSiblingRefresh)
    this.selectedTravelSolutionFares = this.storageDataService.getStorageData(this.localStorageEnum.selectedTicketFareDetail, true);
    this.enhancedGetDeliveryAndBasketJourneyRequest = this.storageDataService.getStorageData(this.localStorageEnum.enhancedGetDeliveryAndBasketJourneyRequest, true);
    this.reviewBuyJourneyTimeStampArr = this.sharedService.reviewBuyJourneyTimeStampArr || [];
    let selectedData = this.searchStateService.get();
    if (selectedData?.outAndRetTravelSolData) {
      this.selectedOutOrRetTravelSolutionData = selectedData;
    }
    this.searchRequest = this.sharedService.searchRequest;
    this.noOfAdult = this.searchRequest?.Adult;
    this.noOfChild = this.searchRequest?.Child;
    this.totalPassengerCount = this.noOfAdult + this.noOfChild;
    this.getJourneyExtrasData();
    this.createForms();
    this.orderSmartCardForm();
    if (this.sharedService.searchRequest != null) {
      this.totalPassenger = this.sharedService.searchRequest.Child + this.sharedService.searchRequest.Adult;
      this.totalAdult = this.sharedService.searchRequest.Adult;
      this.totalChild = this.sharedService.searchRequest.Child;
      if (this.totalPassenger > 1) {
        this.isMultiplePassengerCase = true;
      }
    }
    this.selectedJourneyAccordion = this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length - 1;
    this.DeliveryModesDto = this.enhancedReviewBuyAndDeliveryResponse.Journey.map((m) => m.DeliveryModesDto);
    this.setIsOrderSmartCardOnPageLoad();
    this.getOrderSmartCardDetails(this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]);
    if(this.browserRefresh && this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length == 0){
      this.openEditQttAndSetRequest();
      this.journeyRemovedClass = true;
    }
    if(this.selectedJourneyAccordion != -1){ 
      this.setDeliveryModesData();
    }
    if (this.enhancedReviewBuyAndDeliveryResponse) {
      this.sharedService.getBasketCount.emit(this.enhancedReviewBuyAndDeliveryResponse?.BasketCount);
    }
    this.changeTitleInSmarCardDetail();
    this.changeFirstNameInSmartCardDetail();
    this.changeSurNameInSmartCardDetail();
    this.commonServices.cacheSharedData();
    let outwardSeat = this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]?.OutwardSeat;
    let returnSeat = this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]?.ReturnSeat;
    this.ga4DatalayerService.loadGALayerForAddToCartInfo(this.sharedService.searchRequest, this.sharedService.journeySummaryModel, this.commonServices.jourenyExtraForCheckout(), false, false, false, false, true, outwardSeat, returnSeat, this.DeliveryModesDto[this.selectedJourneyAccordion]?.DeliveryMode, this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]);
    this.monetateService.setaddTrainReviewData(this.enhancedReviewBuyAndDeliveryResponse?.Journey);
    this.monetateService.flushEvents();
    this.trimSpacesFromPostCodeFormControl();
    this.setPostDilveryFormDetail();
  }

  checkIsJourneyReturnFromBasketOrNot() {
    return (localStorage.getItem(this.localStorageEnum?.isReturnFromPaymentOrBasket) !== null && localStorage.getItem(this.localStorageEnum?.isReturnFromPaymentOrBasket) == "true");
  }

  ngAfterViewInit(): void {
    this.accordionRefs = {
      bike: this.bikePanel,
      plusBus: this.plusBusPanel,
      travelCard: this.travelCardPanel,
      deliveryModeExpansionPanel: this.deliveryModeExpansionPanel,
    };

    // Wait a tick for the view to stabilize
    setTimeout(() => {
      this.cdr.detectChanges();
    });
    if (this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length === 1) {
      this.selectedDeliveryMode = this.enhancedReviewBuyAndDeliveryResponse?.Journey[0]?.DeliveryDetail[0]?.DeliveryModeType;
    } else {
      this.selectedDeliveryMode = this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]?.DeliveryDetail[0]?.DeliveryModeType;
    }
    this.previousSelectedDeliveryMode = this.selectedDeliveryMode;
  }

  onParentPanelOpened(panel: MatExpansionPanel): void {
    this.activePanel = panel;
    // Manually trigger change detection so inner accordions are correctly initialized
    this.cdr.detectChanges();
  }

  getJourneyExtrasData() {
    try {
      if (this.isEnhancedReviewBuyAndDeliveryResponseDetailNullOrNot()) {
        this.totalPrice = 0;
        this.enhancedReviewBuyAndDeliveryResponse.Journey.forEach((journey) => {
          let outExtras = journey?.OutwardJourneyExtras || [];
          let retExtras = journey?.ReturnJourneyExtras || [];

          this.processBicycleExtras(journey, outExtras, retExtras);
          this.processPlusBusExtras(journey, outExtras, retExtras);
          this.processTravelCardExtras(journey, outExtras, retExtras);

          this.totalPrice += journey.JourneyTotalPrice;
          let creationKey = journey?.CreationDate; // key as string
          let isInvalid = journey?.IsDiscountCodeInvalid;
          let discountCode = journey?.DiscountCode || "";

          if (this.discountCodeControls[creationKey]) {
            // updating value if already created controll
            if (!isInvalid) {
              this.discountCodeControls[creationKey].setValue(discountCode, { emitEvent: false });
            }
          } else {
            this.discountCodeControls[creationKey] = new FormControl(discountCode, [
              Validators.minLength(19), 
              Validators.maxLength(19)
            ]);
          }
          this.setEnhancedFareBreakDownModelData(journey);
        });
      }
    } catch (error) { console.log(error); }
  }

  isEnhancedReviewBuyAndDeliveryResponseDetailNullOrNot() {
    return this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length > 0;
  }

  showSeatPickerBasedOnAvailibilityForOutward(outwardSeat) {
    return ( outwardSeat && !outwardSeat.IsSeatPicker && this.commonServices.isSeatPickerNotAvaliable(outwardSeat) );
  }

  showReservedOrNoReservedMessageForOutward(outwardSeat) {
    return this.showSeatPickerBasedOnAvailibilityForOutward(outwardSeat) ? this.enhancedReviewBuyReservedOrNonReservedMessageHeading?.noSeatReserved : this.enhancedReviewBuyReservedOrNonReservedMessageHeading?.seatReserved;
  }

  showTicketTypeInfoHeading(journey) {
    return (
      (journey.OutwardDetail.TicketType == "Anytime Return" ||
        journey.OutwardDetail.TicketType == "Anytime Return 1st" ||
        journey.OutwardDetail.TicketType == "Off-Peak Return" ||
        journey.OutwardDetail.TicketType == "Off-Peak Return 1st") &&
      journey.ReturnDetail == null
    );
  }

  titleCaseWord(word) {
    try {
      if (!word) return word;
      return word[0].toUpperCase() + word.substr(1).toLowerCase();
    } catch (err) {
      console.log("titleCaseWord function error : " + err);
      return word;
    }
  }

  noOfRailcardSelectedInJourney(railCardPrice) {
    return [...new Set(railCardPrice?.filter((item) => item?.Railcard !== "No Railcard" && item?.Railcard !== "Groupsave").map(item => item?.Railcard))].length;
  }

  openTicketDetailInfo(enhancedFare: EnhancedFareModel, isReturn) {
    try {
      let row;
      if(!isReturn) {
          row = this.selectedTravelSolutionFares?.selectedOutwardTravelSolution;
      } else {
          row = this.selectedTravelSolutionFares?.selectedReturnTravelSolution;
      }
      this.enhancedGA4DataLayer.loadGA4ViewItem(this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion], this.searchRequest, isReturn);
      this.dialog.open(EnhancedTicketDetailsDialogsComponent, {
        disableClose: true,
        panelClass: [this.enhancedDynamicClassEnum?.enhancedPopupFullWidthPanelClass],
        width: "45rem",
        autoFocus: false,
        data: {
          fare: enhancedFare,
          ticketTypeCode: enhancedFare?.TicketTypeCode,
          TicketType: enhancedFare?.TicketType.replace(" 1st", "").trim(),
          isSearchResults: true,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  seatPickerPopup(journey: any, seatInfo: any, isOutWardJourney: boolean, seatIndex) {
    let dialogRef = this.dialog.open(EnhancedSeatpickerPopupComponent, {
      disableClose: false,
      autoFocus: false,
      panelClass: "enhanced-seat-picker",
      data: {
        seatInfo: seatInfo,
        journey: journey,
        isOutWardJourney: isOutWardJourney,
        openedFeature: this.ga4ItemListEnum.openedSeatPickerFromBooking,
        bookingReferenceNumber: undefined,
        isPostSale: false,
      },
    });

    // To prevent page refresh on seat picker popup open added this class on html and body tag
    document.getElementsByTagName("html")[0].classList.add("prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup");
    document.getElementsByTagName("body")[0].classList.add("prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup");

    // * New Changes
    if (this.isOpenSeatpicker) {
      this.isOpenSeatpicker = false;
      this.isLegChoosed = false;
      this.choosedTrainLeg = null;
    }

    dialogRef.afterClosed().subscribe(() => {
      if (isOutWardJourney) {
        if (
          this.isOutSeatDetailsOpenMap[this.getPanelKey(seatInfo, seatIndex, journey?.Journey)]) {
          this.isOutSeatDetailsOpenMap[this.getPanelKey(seatInfo, seatIndex, journey?.Journey)] = false;
        }
      } else if (!isOutWardJourney) {
        if (this.isRetSeatDetailsOpenMap[this.getPanelKey(seatInfo, seatIndex, journey?.Journey)]) {
          this.isRetSeatDetailsOpenMap[this.getPanelKey(seatInfo, seatIndex, journey?.Journey)] = false;
        }
      }
      this.isOutSeatDetailsOpen = false;
      this.reviewBuyCache = this.sharedService.reviewBuyCache;
      this.enhancedReviewBuyAndDeliveryResponse = this.sharedService.enhancedReviewBuyResponse;
      this.setPreferencesOfGetDeliveryBasketAndResposne();

      // on seat picker popup close removed this class from html and body tag
      document.getElementsByTagName("html")[0].classList.remove("prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup");
      document.getElementsByTagName("body")[0].classList.remove("prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup");

      if (this.sharedService.reviewBuyCache == "") {
      } else {
        this.getDeliveryAndBasketJourney(false, 0);
      }
    });
  }

  onBicycleCountChange(
    bicycleObj,
    isReturn,
    flag,
    isBikeOutSaved,
    isBikeRetSaved,
    savedExtrasObjData,
    item
  ) {
    try {
      // Step 2: Update count value
      if (isReturn) {
        this.getPassangerDetailForRetJourneyExtras(flag, item);
      } else {
        this.getPassangerDetailForOutJourneyExtras(flag, item);
      }

      this.getBikeAriaLabelOnClickPlusOrMinus(isReturn, item, bicycleObj, flag);

      if (bicycleObj?.IsSelected || bicycleObj?.IsUserChecked) {
        this.updateJourneyExtraFromCount(
          bicycleObj,
          isReturn,
          flag,
          isBikeOutSaved,
          isBikeRetSaved,
          savedExtrasObjData,
          item
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  updateJourneyExtraFromCount(
    bicycle,
    isReturn,
    flag,
    isBikeOutSaved,
    isBikeRetSaved,
    savedExtrasObjData,
    item
  ) {
    let uiOutCount = Number(item?.selectedBicycle || 0);
    let uiRetCount = Number(item?.selectedBicycleReturn || 0);
    let uiCount = isReturn ? uiRetCount : uiOutCount;
    // let savedCount = Number(bicycle?.Count || 0);
    // 2. Saved count (from backend)
    let savedCount = Number(
      savedExtrasObjData.find(
        (x) =>
          x?.OfferId === bicycle?.OfferId &&
          x?.ServiceId === bicycle?.ServiceId &&
          x?.SolutionNodeRef === bicycle?.SolutionNodeRef
      )?.Count || 0
    );

    let index = this.journeyExtras.findIndex(
      (i) =>
        i?.OfferId === bicycle?.OfferId &&
        i?.ServiceId === bicycle?.ServiceId &&
        i?.SolutionNodeRef === bicycle?.SolutionNodeRef &&
        i?.IsReturn === isReturn
    );

    let journey = new TravelExtraList();
    journey.OfferId = bicycle?.OfferId;
    journey.ServiceId = bicycle?.ServiceId;
    journey.SolutionNodeRef = bicycle?.SolutionNodeRef;
    journey.IsReturn = isReturn;
    journey.IsAddTravelExtra = flag;
    journey.SelectCount = Math.abs(uiCount - savedCount);
    journey.extraType = bicycle?.extraType;

    if (index == -1) {
      this.journeyExtras.push(journey);
    } else {
      this.journeyExtras[index].OfferId = bicycle?.OfferId;
      this.journeyExtras[index].ServiceId = bicycle?.ServiceId;
      this.journeyExtras[index].SolutionNodeRef = bicycle?.SolutionNodeRef;
      this.journeyExtras[index].IsReturn = isReturn;
      if (!isReturn && isBikeOutSaved) {
        if (uiCount < savedCount) {
          this.journeyExtras[index].IsAddTravelExtra = false;
        } else if (uiCount > savedCount) {
          this.journeyExtras[index].IsAddTravelExtra = true;
        }
      }
      if (isReturn && isBikeRetSaved) {
        if (uiCount < savedCount) {
          this.journeyExtras[index].IsAddTravelExtra = false;
        } else if (uiCount > savedCount) {
          this.journeyExtras[index].IsAddTravelExtra = true;
        }
      }
      this.journeyExtras[index].SelectCount = Math.abs(uiCount - savedCount);
      this.journeyExtras[index].extraType = bicycle?.extraType;
    }

    // Update flag per journey (not globally)
    if (!this.isBikeExtraChangedMap) {
      this.isBikeExtraChangedMap = {};
    }

    // saved counts from item.bikeOutward / bikeReturn
    let savedOutCount = Number(item?.bikeOutward?.[0]?.Count || 0);
    let savedRetCount = Number(item?.bikeReturn?.[0]?.Count || 0);
    const outwardChanged =
      isBikeOutSaved || this.outwardBikeChecked
        ? uiOutCount !== savedOutCount
        : false;
    const returnChanged =
      isBikeRetSaved || this.returnBikeChecked
        ? uiRetCount !== savedRetCount
        : false;
    this.isBikeExtraChangedMap[item?.CreationDate] =
      outwardChanged || returnChanged;

    // Update only once, based on final comparison
    // let selectedSavedCard = savedExtrasObjData.find(card => card?.IsSelected);
    // this.isBikeExtraChanged = !(selectedSavedCard &&
    //   selectedSavedCard.OfferId === journey.OfferId &&
    //   selectedSavedCard.ServiceId === journey.ServiceId &&
    //   selectedSavedCard.SolutionNodeRef === journey.SolutionNodeRef &&
    //   bicycle?.IsUserChecked);
  }

  getPassangerDetailForOutJourneyExtras(flag, item) {
    if (flag) {
      item.selectedBicycle = (Number(item.selectedBicycle) + 1).toString();
    } else {
      item.selectedBicycle = (Number(item.selectedBicycle) - 1).toString();
    }
  }

  getPassangerDetailForRetJourneyExtras(flag, item) {
    if (flag) {
      item.selectedBicycleReturn = (
        Number(item.selectedBicycleReturn) + 1
      ).toString();
    } else {
      item.selectedBicycleReturn = (
        Number(item.selectedBicycleReturn) - 1
      ).toString();
    }
  }

  formatLondonTravelCard(travelcard: any): string {
    try {
      let cs = this.sharedService.currencySymbol(travelcard?.Currency);
      let adult = Number(travelcard?.NoOfAdult) || 0;
      let child = Number(travelcard?.NoOfChild) || 0;
      let adultPrice = this.sharedService.formatPrice(travelcard?.MaxPrice);
      let childPrice = this.sharedService.formatPrice(travelcard?.MinPrice);

      if (adult === 0) {
        return `(${child} x ${this.enhancedPassangerTypeEnum.ChildText} ${cs}${childPrice})`;
      }

      if (child === 0) {
        return `(${adult} x ${this.enhancedPassangerTypeEnum.adultText} ${cs}${adultPrice})`;
      }

      return `(${adult} x ${this.enhancedPassangerTypeEnum.adultText} ${cs}${adultPrice}, ${child} x ${this.enhancedPassangerTypeEnum.ChildText} ${cs}${childPrice})`;
    } catch (error) {
      console.log(error);
    }
  }

  onJourneyExtrasChange(checked, value, isReturn, item) {
    try {
      value.IsUserChecked = checked;
      value.hasAnnouncedCheckbox = false;
      value.AriaLabel = this.getPlusBusAriaLabel(value, item, isReturn);
      let selectedJourneyExtras = value;

      if (isReturn) {
        this.returnBikeChecked = checked;
      } else {
        this.outwardBikeChecked = checked;
      }

      if (selectedJourneyExtras) {
        let journey = new TravelExtraList();
        journey.OfferId = selectedJourneyExtras.OfferId;
        journey.ServiceId = selectedJourneyExtras.ServiceId;
        journey.IsReturn = isReturn;
        journey.SolutionNodeRef = selectedJourneyExtras.SolutionNodeRef;
        journey.IsAddTravelExtra = checked;
        journey.extraType = selectedJourneyExtras?.extraType;
        journey[this.enhancedTravelExtrasTextEnum.isBikeSaved] =
          selectedJourneyExtras?.[
            this.enhancedTravelExtrasTextEnum.isBikeSaved
          ];
        journey[this.enhancedTravelExtrasTextEnum.isBikeOutsaved] =
          selectedJourneyExtras?.[
            this.enhancedTravelExtrasTextEnum.isBikeOutsaved
          ];
        journey[this.enhancedTravelExtrasTextEnum.isBikeRetsaved] =
          selectedJourneyExtras?.[
            this.enhancedTravelExtrasTextEnum.isBikeRetsaved
          ];

        this.getCountOfSelectedJourneyExtra(
          journey,
          selectedJourneyExtras,
          isReturn,
          item
        );

        let fareBreakDownJourneyExtras = new JourneyModel();

        this.getPassangerOfFareBreakDownJourneyExtras(
          fareBreakDownJourneyExtras,
          selectedJourneyExtras,
          journey
        );

        fareBreakDownJourneyExtras.PricePerPerson = selectedJourneyExtras.Price;
        fareBreakDownJourneyExtras.TotalPrice = selectedJourneyExtras.Price;
        fareBreakDownJourneyExtras.RailCard = "";
        fareBreakDownJourneyExtras.JourneyExtrasTitle =
          selectedJourneyExtras.JourneyExtraName;
        fareBreakDownJourneyExtras.OfferId = selectedJourneyExtras.OfferId;
        fareBreakDownJourneyExtras.ServiceId = selectedJourneyExtras.ServiceId;
        fareBreakDownJourneyExtras.SolutionNodeRef =
          selectedJourneyExtras.SolutionNodeRef;
        fareBreakDownJourneyExtras.Departure = selectedJourneyExtras?.Departure;

        this.getArrayOfJourneyExtraForCheckedValue(
          checked,
          journey,
          this.getCombinedSavedPlusBusExtras(item, journey.extraType),
          fareBreakDownJourneyExtras,
          isReturn,
          selectedJourneyExtras,
          item
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  getCombinedSavedPlusBusExtras(item, extraType: string) {
    if (
      extraType?.toLowerCase() === this.enhancedTravelExtrasTextEnum.plusBusTxt
    ) {
      return [...(item?.plusBusOutward || []), ...(item?.plusBusReturn || [])];
    } else if (
      extraType?.toLowerCase() === this.enhancedTravelExtrasTextEnum.bikeTxt
    ) {
      return [...(item?.bikeOutward || []), ...(item?.bikeReturn || [])];
    }
    return [];
  }

  getCountOfSelectedJourneyExtra(
    journey,
    selectedJourneyExtras,
    isReturn,
    item
  ) {
    if (
      selectedJourneyExtras?.JourneyExtraName !=
      this.appConstantsService.bicycleReservation
    ) {
      journey.SelectCount = selectedJourneyExtras?.AvailableAmount;
    } else {
      journey.SelectCount = isReturn
        ? Number(item?.selectedBicycleReturn)
        : Number(item?.selectedBicycle);
    }
  }

  // call method for checked value on journey extra which is used below function in onJourneyExtraChange
  getArrayOfJourneyExtraForCheckedValue(
    checked: boolean,
    journey: any,
    savedExtrasObjData: any[],
    fareBreakDownJourneyExtras,
    isReturn: boolean,
    selectedJourneyExtras: any,
    item
  ) {
    if (item?.isBikeOutsaved || item?.isBikeRetsaved || item?.isPlusBusSaved) {
      this.handleSavedExtrasCase(
        checked,
        journey,
        isReturn,
        selectedJourneyExtras,
        fareBreakDownJourneyExtras
      );
    } else {
      this.handleUnSavedExtrasCase(
        checked,
        journey,
        isReturn,
        selectedJourneyExtras,
        fareBreakDownJourneyExtras
      );
    }

    // Instead of checking single card, compare full list
    const combinedExtras = this.getCombinedSavedPlusBusExtras(
      item,
      journey.extraType
    );

    const isChanged = this.haveExtrasChanged(
      savedExtrasObjData, // backend saved
      combinedExtras, // current outward+return ticked list
      item
    );

    // Assign change flag based on type
    this.updateChangeExtrasFlags(
      journey?.extraType,
      isChanged,
      item?.CreationDate
    );
  }

  createSaveRequestAndCallAPI(
    journey,
    panelKey: "bike" | "plusbus" | "travelcard"
  ) {
    try {
      if (this.journeyExtras?.length == 0) return;
      this.journeyExtras = this.journeyExtras?.filter((travelExtra) => {
        return (
          travelExtra?.extraType?.toLowerCase() === panelKey?.toLowerCase()
        );
      });
      this.enhancedJourneyExtrasRequest.ReviewBuyCache = this.reviewBuyCache;
      this.enhancedJourneyExtrasRequest.JourneyCreationDate =
        journey?.CreationDate;
      this.enhancedJourneyExtrasRequest.TravelExtraList = this.journeyExtras;
      this.enhancedJourneyExtrasRequest.Title =
        this.storageDataService.getStorageData(
          this.localStorageEnum?.titleText,
          false
        );
      this.enhancedJourneyExtrasRequest.Name =
        this.storageDataService.getStorageData(
          this.localStorageEnum?.firstName,
          false
        );
      this.enhancedJourneyExtrasRequest.Surname =
        this.storageDataService.getStorageData(
          this.localStorageEnum?.lastNameText,
          false
        );
      this.enhancedJourneyExtrasRequest.IsAdult = this.isExistAdultValue();
      this.enhancedJourneyExtrasRequest.IsReserved = false;
      this.enhancedJourneyExtrasRequest.OutwardReservation =
        journey?.OutwardReservation;
      this.enhancedJourneyExtrasRequest.ReturnReservation =
        journey?.ReturnReservation;
      this.enhancedReviewBuyAndDelivery
        .enhancedAddRemoveTravelExtras(this.enhancedJourneyExtrasRequest)
        .subscribe((res) => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == "200") {
              if (this.responseData.Data != null) {
                this.enhancedReviewBuyAndDeliveryResponse =
                  this.responseData?.Data?.DeliveryAndBasketJourneyResponse?.BasketJourneyResponse;
                this.setPreferencesOfGetDeliveryBasketAndResposne();
                this.selectedDeliveryMode =
                  this.enhancedReviewBuyAndDeliveryResponse?.Journey[
                    this.selectedJourneyAccordion
                  ]?.DeliveryDetail[0]?.DeliveryModeType;
                if (
                  this.selectedDeliveryMode !==
                  this.appRouteEnum?.DeliveryMode_Smart_Card
                ) {
                  this.onLoadPassengerList();
                  this.isCheckedTermsCondition = false;
                  this.orderSmartcardForm.reset();
                  this.isOrderSmartCard[this.selectedJourneyAccordion] = false;
                }
                this.reviewBuyCache =
                  this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
                this.sharedService.enhancedReviewBuyResponse =
                  this.enhancedReviewBuyAndDeliveryResponse;
                this.sharedService.reviewBuyCache =
                  this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
                this.storageDataService.setStorageData(
                  this.localStorageEnum?.getDeliveryAndBasketJourneyResponse,
                  this.responseData?.Data,
                  true
                );
                if (this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length > 0) {
                  this.enhancedReviewBuyAndDeliveryResponse?.Journey.forEach(
                    (journey) => {
                      if (journey) {
                        let outExtras = this.extractJourneyExtras(
                          journey?.OutwardJourneyExtras
                        );
                        let retExtras = this.extractJourneyExtras(
                          journey?.ReturnJourneyExtras
                        );

                        journey[
                          this.enhancedTravelExtrasTextEnum.outwardBicycleReservation
                        ] = outExtras.bicycleReservation;
                        journey[
                          this.enhancedTravelExtrasTextEnum.returnBicycleReservation
                        ] = retExtras.bicycleReservation;

                        journey[
                          this.enhancedTravelExtrasTextEnum.outwardPlusBusReservePrice
                        ] = outExtras.plusBusReservePrice;
                        journey[
                          this.enhancedTravelExtrasTextEnum.returnPlusBusReservePrice
                        ] = retExtras.plusBusReservePrice;

                        journey[
                          this.enhancedTravelExtrasTextEnum.outwardLondonTravelReservePrice
                        ] = outExtras.londonTravelReservePrice;
                        journey[
                          this.enhancedTravelExtrasTextEnum.returnLondonTravelReservePrice
                        ] = retExtras.londonTravelReservePrice;

                        this.getTotalPlusBusReservePrice(journey);

                        let panel =
                          this.accordionRefsExtras[journey?.CreationDate]?.[
                            panelKey
                          ];
                        if (panel && panel.expanded) {
                          panel.close();
                        }

                        let savedTravelCardItem = this.journeyExtras.find(
                          (x) => x.IsAddTravelExtra === true
                        );
                        if (savedTravelCardItem) {
                          journey[
                            this.enhancedTravelExtrasTextEnum.isLondonTravelSaved
                          ] = true;
                          this.lastSavedTravelCard = savedTravelCardItem;
                        }

                        this.journeyExtras = [];

                        this.commonServices.cacheSharedData();
                        this.setEnhancedFareBreakDownModelData(journey);
                        this.sharedService.fareBreakdownModelData =
                          this.fareBreakDownData;
                      }
                    }
                  );
                  this.setReservationMessageData();
                  this.getJourneyExtrasData();
                }
              }
            } else {
              this.setBackendError(
                journey?.CreationDate,
                panelKey,
                this.responseData.ResponseMessage
              );
              console.log(this.responseData.ResponseMessage);
            }
          }
        });
    } catch (error) {
      console.log(error);
    }
  }

  private extractJourneyExtras(extras: any[] | undefined | null) {
    let extrasResult = {
      bicycleReservation: 0,
      plusBusReservePrice: 0,
      londonTravelReservePrice: 0,
    };

    if (!extras?.length) return extrasResult;

    for (let extra of extras) {
      if (extra?.Count > 0) {
        switch (extra.JourneyExtraName) {
          case this.appConstantsService.bicycleReservation:
            extrasResult.bicycleReservation += extra.Count;
            break;
          case this.appConstantsService.plusBus:
            extrasResult.plusBusReservePrice += extra.Price;
            break;
          case this.appConstantsService.londonTravelcard:
            extrasResult.londonTravelReservePrice += extra.Price;
            break;
        }
      }
    }

    return extrasResult;
  }

  isExistAdultValue() {
    if (this.sharedService.searchRequest.Adult > 0) {
      return true;
    } else {
      return false;
    }
  }

  browserRefreshData(sharedSiblingRefresh) {
    if (sharedSiblingRefresh) {
      this.sharedService.enhancedReviewBuyResponse =
        sharedSiblingRefresh.enhancedReviewBuyResponse;
      this.enhancedReviewBuyAndDeliveryResponse =
        sharedSiblingRefresh.enhancedReviewBuyResponse;
      this.sharedService.journeySummaryModel =
        sharedSiblingRefresh.journeySummaryModel;
      if (this.enhancedReviewBuyAndDeliveryResponse) {
        this.reviewBuyCache =
          this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
        this.sharedService.reviewBuyCache =
          this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
      }
      this.deliveryModeRequest.PreviousCache =
        sharedSiblingRefresh.reviewBuyCache;
      this.sharedService.ReservationCache =
        sharedSiblingRefresh.ReservationCache;
      if (this.sharedService?.enhancedReviewBuyResponse)
        this.sharedService.getBasketCount.emit(
          this.sharedService.enhancedReviewBuyResponse?.BasketCount
        );
      this.sharedService.locationMasterData =
        sharedSiblingRefresh.locationMasterData;
      this.sharedService.reviewBuyJourneyTimeStampArr =
        sharedSiblingRefresh.reviewBuyJourneyTimeStampArr || [];
      this.sharedService.railCardPriceList =
        sharedSiblingRefresh.railCardPriceList;
      this.railCardPriceListArray = this.sharedService.railCardPriceList;
      this.sharedService.LatestJourneyCache =
        sharedSiblingRefresh.LatestJourneyCache;
      //Set shared cache data
      this.commonServices.cacheSharedData();
    }
  }

  getSharedCacheDataOnBrowserRefresh(sharedSiblingRefresh) {
    this.sharedService.enhancedReviewBuyResponse =
      sharedSiblingRefresh.enhancedReviewBuyResponse;
    this.enhancedReviewBuyAndDeliveryResponse =
      sharedSiblingRefresh.enhancedReviewBuyResponse;
    if (this.enhancedReviewBuyAndDeliveryResponse) {
      this.reviewBuyCache =
        this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
      this.sharedService.reviewBuyCache =
        this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
    }
    this.deliveryModeRequest.PreviousCache = this.sharedService.reviewBuyCache;
    this.searchRequest = sharedSiblingRefresh.searchRequest;
    this.sharedService.searchRequest = sharedSiblingRefresh.searchRequest;
    if (this.sharedService?.enhancedReviewBuyResponse)
      this.sharedService.getBasketCount.emit(
        this.sharedService?.enhancedReviewBuyResponse?.BasketCount
      );
    this.sharedService.locationMasterData =
      sharedSiblingRefresh.locationMasterData;
    this.sharedService.reviewBuyJourneyTimeStampArr =
      sharedSiblingRefresh.reviewBuyJourneyTimeStampArr || [];
    this.sharedService.createReservationRequest =
      sharedSiblingRefresh.createReservationRequest;
    this.sharedService.railCardPriceList =
      sharedSiblingRefresh.railCardPriceList;
    this.railCardPriceListArray = this.sharedService.railCardPriceList;
    this.sharedService.selectedJourneyDataForQuickBuyOrContiue =
      sharedSiblingRefresh?.selectedJourneyDataForQuickBuyOrContiue;
    //Set shared cache data
    this.commonServices.cacheSharedData();
  }

  getDeliveryAndBasketJourney(IsNewJourney: boolean, index) {
    this.spinnerService.show();
    this.deliveryModeRequest.ReservationCache =
      this.sharedService.ReservationCache;
    this.deliveryModeRequest.IsNreBasket = false;
    this.deliveryModeRequest.CustomerKey = localStorage.getItem("CustomerKey");
    this.deliveryModeRequest.UserEmail = localStorage.getItem("Email");
    this.deliveryModeRequest.Name = localStorage.getItem("FirstName");
    this.deliveryModeRequest.Title = localStorage.getItem("Title");
    this.deliveryModeRequest.Surname = localStorage.getItem("LastName");
    this.deliveryModeRequest.LatestJourneyCache =
      this.sharedService.LatestJourneyCache;
    this.deliveryModeRequest.isSeason = this.searchRequest.IsSeason;

    this.setIsSeasonValueInDeliveryModeRequest();

    let data = {
      getDeliveryModeRequset: this.deliveryModeRequest,
      name: localStorage.getItem("FirstName"),
      title: localStorage.getItem("Title"),
      surname: localStorage.getItem("LastName"),
      previousCache: this.sharedService.reviewBuyCache,
      isNewJourney: IsNewJourney,
      reviewBuyCache: this.sharedService.reviewBuyCache,
      IsAdult: this.sharedService.searchRequest.Adult > 0, //PICO-2150 added a property for check passanger added to smart card adult or child
    };
    this.enhancedReviewBuyAndDelivery
      .enhancedGetDeliveryAndBasketJourney(data)
      .subscribe((res) => {
        if (res != null) {
          this.commonServices.loaderRequired = false;
          this.spinnerService.hide();
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            //get deliveryModes data
            this.DeliveryModesDto = this.responseData.Data.Journey.map(
              (m) => m.DeliveryModesDto
            );
            this.enhancedReviewBuyAndDeliveryResponse = this.responseData.Data;
            this.setPreferencesOfGetDeliveryBasketAndResposne();
            this.setDeliveryAndBasketResponse(index);
          } else {
            console.log(this.responseData.ResponseMessage);
            this.commonServices.showEnhancedCommonErrorPopup();
          }
        }
      });
  }

  callingMethodToAddDeliveryModesInEveryJourney() {
    for (let journey of this.enhancedReviewBuyAndDeliveryResponse.Journey) {
      journey["deliveryModes"] = [];
      journey["deliveryModes"].push(...this.deliveryModes);
      for (let selectedDeliveryType of journey.DeliveryDetail) {
        selectedDeliveryType["DeliveryMode"] = "";
        selectedDeliveryType["DeliveryMode"] =
          selectedDeliveryType["DeliveryModeType"];
      }
      for (let [index, deliverymode] of this.DeliveryModesDto[
        this.selectedJourneyAccordion
      ].DeliveryMode.entries()) {
        // if selected anytype delivery mode then push it on top and remove previous value
        if (
          journey.DeliveryDetail[0]["DeliveryModeType"] ==
          deliverymode.DeliveryMode
        ) {
          this.DeliveryModesDto[
            this.selectedJourneyAccordion
          ].DeliveryMode.splice(0, 0, deliverymode);
          this.DeliveryModesDto[
            this.selectedJourneyAccordion
          ].DeliveryMode.splice(index + 1, 1);
        }
      }
    }
  }

  callingMethodToRemoveJourneyWhenExpired(index) {
    if (
      this.commonServices.removedJourneyOnReservationTimeExpired(
        index,
        this.expiredJounreyDetailObject
      )
    ) {
      this.removeJourneyWhenExpired(
        this.expiredJounreyDetailObject?.removeJourneyArrayObject[index + 1]
          .journeyCreationDate,
        index + 1
      );
    }
  }

  checkandRemoveJourneyOnSeatUpdateFail() {
    this.reviewBuyJourneyTimeStampArr.forEach((timesStamp, index) => {
      if (timesStamp.updateCount > 0 && timesStamp.updateCount < 3) {
        this.removeJourneyRequest.JourneyCreationDate =
          timesStamp.reviewBuyOrginalTimeStamp;
        this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
        this.removeJourneyRequest.IsNreBasket =
          this.enhancedReviewBuyAndDeliveryResponse.IsNreBasket;
        this.removeJourneyData(this.removeJourneyRequest, 0);
        this.removeIndexOfreviewBuyJourneyTimeStampArr = index;
      }
    });
  }

  addTimeStampToReviewBuyJourneyTimeStampArr() {
    let alrdyPresentJourney = false;
    this.enhancedReviewBuyAndDeliveryResponse.Journey.forEach((journey) => {
      alrdyPresentJourney = false;
      this.reviewBuyJourneyTimeStampArr.forEach((timeStampObj) => {
        if (
          timeStampObj.CreationDate === new Date(journey.CreationDate).getTime()
        ) {
          alrdyPresentJourney = true;
        }
      });

      if (alrdyPresentJourney === false) {
        this.reviewBuyJourneyTimeStampArr.push({
          CreationDate: new Date(journey.CreationDate).getTime(),
          updateCount: 0,
          reviewBuyOrginalTimeStamp: journey.CreationDate,
        });
      }
    });
    this.sharedService.reviewBuyJourneyTimeStampArr =
      this.reviewBuyJourneyTimeStampArr;
  }

  getBasketJourneyForPromoValue() {
    if (this.enhancedReviewBuyAndDeliveryResponse != null) {
      if (
        this.enhancedReviewBuyAndDeliveryResponse.PromotionCode != "" &&
        this.enhancedReviewBuyAndDeliveryResponse.PromotionCode != null
      ) {
        this.searchRequest.PromotionCode =
          this.enhancedReviewBuyAndDeliveryResponse.PromotionCode;
        if (this.sharedService.journeySummaryModel == null) {
          this.sharedService.journeySummaryModel = new JourneySummaryModel();
        }
        this.sharedService.journeySummaryModel.IsPromo = true;
      } else {
        this.searchRequest.PromotionCode = "";
        if (this.sharedService.journeySummaryModel == null) {
          this.sharedService.journeySummaryModel = new JourneySummaryModel();
        }
        this.sharedService.journeySummaryModel.IsPromo = false;
      }
    }
  }

  setIsSeasonValueInDeliveryModeRequest() {
    if (
      (this.sharedService &&
        this.sharedService.reviewBuyResponse &&
        this.sharedService.reviewBuyResponse.Journey != null &&
        this.sharedService.reviewBuyResponse.Journey.length > 0 &&
        this.sharedService.reviewBuyResponse.Journey[0].SeasonDeatil != null) ||
      this.searchRequest.IsSeason
    ) {
      this.deliveryModeRequest.isSeason = true;
    }
    if (
      this.sharedService &&
      this.sharedService.reviewBuyResponse &&
      this.sharedService.reviewBuyResponse.Journey != null &&
      this.sharedService.reviewBuyResponse.Journey.length > 0 &&
      this.sharedService.reviewBuyResponse.Journey[0].SeasonDeatil == null
    ) {
      this.deliveryModeRequest.isSeason = false;
    }
  }

  callRedirectionOnSearchResultPage() {
    if (
      this.DeliveryModesDto[this.selectedJourneyAccordion] &&
      !this.DeliveryModesDto[this.selectedJourneyAccordion]
        ?.IsDeliveryModesAvailable
    ) {
      let noDeliveryMsgsObj = {
        notificationErrorMsg:
          this.notificationErrorMsg.noDeliveryModeInformation,
        notificationTitle:
          this.notificationErrorMsg.deliveryModesUnavailabitilyTitle,
      };
      this.sharedService.ReservationCache = null;
      this.sharedService.LatestJourneyCache =
        this.enhancedReviewBuyAndDeliveryResponse.LatestJourneyCache;
      let dialogRef = this.commonServices.enhancedCommonNotificationDialog(
        "review-nodelivery-common-notification-dialog",
        noDeliveryMsgsObj,
        this.commonIconImg.exclamationIConImgForNoDelivery,
        true,
        false,
        false,
        true
      );
      dialogRef.afterClosed().subscribe(() => {
        this.redirectingOnSearchResultsPage();
      });
    }
  }

  redirectingOnSearchResultsPage() {
    if (!this.searchRequest.IsSeason) {
      this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
    } else {
      this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
    }
  }

  callTimeOutPopupForBasketJourneyOfReviewBuyResponse() {
    if (!this.enhancedReviewBuyAndDeliveryResponse.IsBasketJourneyValid) {
      this.timeoutpopup(
        this.enhancedReviewBuyAndDeliveryResponse.BasketJourneyMessage,
        false
      );
    }
  }

  timeoutpopup(message, isCallApi) {
    let dialogRef = this.dialog.open(EnhancedTimeoutDialogsComponent, {
      panelClass: [
        "enhanced-common-info-theme",
        "enhanced-common-notification",
      ],
      disableClose: false,
      width: "45rem",
      data: {
        Message: message,
      },
    });
    dialogRef.afterClosed().subscribe(() => {
      if (isCallApi) {
        this.getDeliveryAndBasketJourney(false, 0);
      }
    });
  }

  removeJourneyData(removeJourneyRequest, index) {
    this.enhancedReviewBuyAndDelivery
      .enhancedRemovejourney(removeJourneyRequest)
      .subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            this.getRemoveJourneyData(removeJourneyRequest, index);
            this.ga4DatalayerService.loadGALayerForReviewBuyRemoveCart(this.GAremoveCartResponse, false, null, null, null, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue, true, this.selectedTravelSolutionFares);
            this.commonServices.deletedRemovedJourneyForQuickBuyOrContinue(
              this.deletedJourney
            );
            this.enhancedDiscountResponse = null;

            if(this.responseData?.Data?.GetDeliveryAndBasketJourneyResponseDto){
                  this.responseData?.Data?.GetDeliveryAndBasketJourneyResponseDto.BasketJourneyResponse?.Journey?.forEach(journey => {
                    this.commonServices.removeStandPreFromTicketTypeForOutAndReturn(journey);
                  });
            }
          } else {
            this.deletedJourney =
              this.enhancedReviewBuyAndDeliveryResponse?.Journey?.filter(
                (m) =>
                  m.CreationDate === removeJourneyRequest.JourneyCreationDate
              );
            this.GAremoveCartResponse.Journey = this.deletedJourney;
            this.enhancedReviewBuyAndDeliveryResponse.Journey =
              this.enhancedReviewBuyAndDeliveryResponse?.Journey?.filter(
                (m) =>
                  m.CreationDate != removeJourneyRequest.JourneyCreationDate
              );
            this.commonServices.showEnhancedCommonErrorPopup();
          }
        }
      });
  }

  getRemoveJourneyData(removeJourneyRequest, index) {
    this.removeResponse = this.responseData.Data;
    let creationDateToRemove = removeJourneyRequest?.JourneyCreationDate;

    this.sharedService.LatestJourneyCache =
      this.removeResponse?.LatestJourneyCache;
    this.sharedService.ReservationCache = null;

    this.reviewBuyCache = this.removeResponse?.ReviewBuyCache;
    this.sharedService.reviewBuyCache = this.reviewBuyCache;

    this.sharedService.getBasketCount.emit(this.removeResponse?.BasketCount);
    this.sharedService.enhancedReviewBuyResponse.ReviewBuyCache =
      this.removeResponse?.ReviewBuyCache;
    this.sharedService.enhancedReviewBuyResponse.BasketCount =
      this.removeResponse?.BasketCount;

    this.deletedJourney =
      this.enhancedReviewBuyAndDeliveryResponse?.Journey?.filter(
        (m) => m.CreationDate === creationDateToRemove
      );
    this.GAremoveCartResponse.Journey = this.deletedJourney;
    this.enhancedReviewBuyAndDeliveryResponse.Journey =
      this.enhancedReviewBuyAndDeliveryResponse?.Journey?.filter(
        (m) => m.CreationDate != creationDateToRemove
      );

    // Remove journey from fareBreakdownData also
    this.fareBreakDownData = this.fareBreakDownData?.filter(
      (fb) => fb?.CreationDate !== creationDateToRemove
    );
    this.sharedService.fareBreakdownModelData = this.fareBreakDownData;

    let basketIsEmpty =
      this.removeResponse?.BasketCount === 0 &&
      this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length === 0;

    if (basketIsEmpty) {
      this.handleEmptyBasket();
    } else {
      this.handleNonEmptyBasket();
    }
    this.commonServices.cacheSharedData();
  }

  checkedLondonTravelcardExtra(
    checked: boolean,
    value: any,
    index: number,
    item: any,
    isReturn: boolean
  ) {
    try {
      value.hasAnnouncedTravelcardCheckbox = false;
      value.IsUserChecked = checked;

      // Merge outward/return + peak/offpeak arrays
      let travelCardObj = isReturn
        ? [
            ...(item?.travelcardReturnPeak || []),
            ...(item?.travelcardReturnOffPeak || []),
          ]
        : [
            ...(item?.travelcardOutwardPeak || []),
            ...(item?.travelcardOutwardOffPeak || []),
          ];
      // First detect OffPeak or Peak
      let isOffPeak = value?.ServiceName?.toLowerCase().includes("offpeak");
      this.setOutAndRetTravelCardSelectedIndex(
        index,
        checked,
        isReturn,
        isOffPeak,
        item
      );

      let journey = this.createTravelExtraObj(value, isReturn);

      if (!item?.isLondonTravelSaved) {
        this.handleBeforeSaveTravelCard(
          checked,
          journey,
          travelCardObj,
          value,
          isReturn
        );
      } else {
        this.handleAfterSaveTravelCard(
          checked,
          journey,
          travelCardObj,
          value,
          isReturn
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  isSameAsSavedTravelCard(journey: TravelExtraList, travelCardObj): boolean {
    let selectedTravelCard = travelCardObj.find(
      (selectedTC) => selectedTC?.IsSelected
    );
    if (!selectedTravelCard) return false;
    return (
      selectedTravelCard.OfferId === journey.OfferId &&
      selectedTravelCard.ServiceId === journey.ServiceId &&
      selectedTravelCard.SolutionNodeRef === journey.SolutionNodeRef
    );
  }

  setJourneyExtraArrayAfterSave(checked, journey, value, isReturn) {
    // CASE 1: Selecting a different travelcard after save
    if (checked) {
      // Push new one
      this.journeyExtras.push(journey);
      isReturn
        ? this.setReturnTravelCardPrice(value)
        : this.setOutwardTravelCardPrice(value);
    }

    // CASE 2: Unchecking current one
    else {
      let isUncheckingSavedOne =
        this.lastSavedTravelCard &&
        this.lastSavedTravelCard.OfferId === journey.OfferId &&
        this.lastSavedTravelCard.ServiceId === journey.ServiceId &&
        this.lastSavedTravelCard.SolutionNodeRef === journey.SolutionNodeRef &&
        this.lastSavedTravelCard.IsReturn === journey.IsReturn;

      if (isUncheckingSavedOne) {
        let removalEntry = { ...journey, IsAddTravelExtra: false };
        this.journeyExtras.push(removalEntry);
        this.lastSavedTravelCard = null; // clear saved
      }

      this.subtractOutAndRetTravelCardPrice(value, isReturn);
    }
  }

  setReturnTravelCardPrice(value) {
    this.returnTravelCardPrice = value?.Price || 0;
  }

  setOutwardTravelCardPrice(value) {
    this.outwardTravelCardPrice = value?.Price || 0;
  }

  subtractOutAndRetTravelCardPrice(value, isReturn) {
    if (!value?.Price) return;

    let currentPrice = isReturn
      ? this.returnTravelCardPrice
      : this.outwardTravelCardPrice;

    if (currentPrice > 0) {
      let newPrice = currentPrice - value.Price;
      if (isReturn) {
        this.returnTravelCardPrice = newPrice;
      } else {
        this.outwardTravelCardPrice = newPrice;
      }
    }
  }

  setOutAndRetTravelCardSelectedIndex(
    index: number,
    checked: boolean,
    isReturn: boolean,
    isOffPeak: boolean,
    item: any
  ) {
    let selectedIndex = checked ? index : -1;
    if (isReturn) {
      if (isOffPeak) {
        item.returnSelectedTravelCardOffPeak = selectedIndex;
        if (checked) item.returnSelectedTravelCardPeak = -1; // OffPeak select → Peak reset
      } else {
        item.returnSelectedTravelCardPeak = selectedIndex;
        if (checked) item.returnSelectedTravelCardOffPeak = -1; // Peak select → OffPeak reset
      }
    } else {
      if (isOffPeak) {
        item.outwardSelectedTravelCardOffPeak = selectedIndex;
        if (checked) item.outwardSelectedTravelCardPeak = -1; // OffPeak select → Peak reset
      } else {
        item.outwardSelectedTravelCardPeak = selectedIndex;
        if (checked) item.outwardSelectedTravelCardOffPeak = -1; // Peak select → OffPeak reset
      }
    }
  }

  parseCustomDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Format: "30-08-2025 23:59:00"
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("-").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  getTotalPlusBusReservePrice(journey) {
    let outward =
      journey[this.enhancedTravelExtrasTextEnum.outwardPlusBusReservePrice] ||
      0;
    let ret =
      journey[this.enhancedTravelExtrasTextEnum.returnPlusBusReservePrice] || 0;
    journey[this.enhancedTravelExtrasTextEnum.totalPlusBusReservePrice] =
      outward + ret;
    journey[this.enhancedTravelExtrasTextEnum.isBikeSaved] =
      (journey[this.enhancedTravelExtrasTextEnum.outwardBicycleReservation] ||
        0) > 0 ||
      (journey[this.enhancedTravelExtrasTextEnum.returnBicycleReservation] ||
        0) > 0;
    journey[this.enhancedTravelExtrasTextEnum.isBikeOutsaved] =
      (journey[this.enhancedTravelExtrasTextEnum.outwardBicycleReservation] ||
        0) > 0;
    journey[this.enhancedTravelExtrasTextEnum.isBikeRetsaved] =
      (journey[this.enhancedTravelExtrasTextEnum.returnBicycleReservation] ||
        0) > 0;
    journey[this.enhancedTravelExtrasTextEnum.isPlusBusSaved] =
      outward > 0 || ret > 0;
    journey[this.enhancedTravelExtrasTextEnum.isLondonTravelSaved] =
      journey[
        this.enhancedTravelExtrasTextEnum.outwardLondonTravelReservePrice
      ] > 0 ||
      journey[
        this.enhancedTravelExtrasTextEnum.returnLondonTravelReservePrice
      ] > 0;
  }

  removeJourney(journeyCreatationDate: Date) {
    try {
      this.removeJourneyRequest.JourneyCreationDate = journeyCreatationDate;
      this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
      this.removeJourneyRequest.Title = this.storageDataService.getStorageData(
        this.localStorageEnum?.titleText,
        false
      );
      this.removeJourneyRequest.Name = this.storageDataService.getStorageData(
        this.localStorageEnum?.firstName,
        false
      );
      this.removeJourneyRequest.Surname =
        this.storageDataService.getStorageData(
          this.localStorageEnum?.lastNameText,
          false
        );
      this.removeJourneyRequest.IsAdult = this.isExistAdultValue();
      let dialogRef = this.dialog.open(EnhancedRemoveJourneyDialogsComponent, {
        disableClose: true,
        panelClass: [
          this.enhancedDynamicClassEnum.enhancedCommonInfoPopup,
          this.enhancedDynamicClassEnum.enhancedRemoveJourneyDialog,
        ],
        width: "45rem",
        autoFocus: false,
      });
      dialogRef.afterClosed().subscribe((dialogResult) => {
        if (dialogResult) {
          this.removeJourneyData(this.removeJourneyRequest, 0);
        } else {
          return false;
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  addNewJourney() {
    try {
      this.sharedService.isAmendSearchOpen = true;
      this.sharedService.evaluateRequest = null;
      this.sharedService.railcardStationMasterData = JSON.parse(
        localStorage.getItem("railcardStationList")
      );

      let shouldEnableEdit =
        (this.checkLengthOfJourney() &&
          this.enhancedReviewBuyAndDeliveryResponse?.Journey?.[0]
            ?.SeasonDeatil) ||
        !this.searchRequest?.IsSeason;

      if (shouldEnableEdit) {
        window.scrollTo(0, 0);
        this.sharedService.isStationListAPILoaderRequired = true;
        this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
        this.isCancelVisibleBtn = true;
        this.isBackToHomeBtnVisible = false;
        this.sharedService.showEdit = true;
        this.sharedService.isDisabledContinue.next(true);
        this.sharedService.setJourneyTxtMode(true);
        this.enhancedGA4DataLayer?.loadGA4DataLayerOnCheckoutClickOrAttempt(this.enhancedGA4DataLayerEventNameEnum?.editNameText, this.enhancedGA4DataLayerEventNameEnum?.editActionName, undefined, undefined, true, true);
      }
    } catch (error) {
      console.log(error);
    }
  }

  checkLengthOfJourney() {
    return this.enhancedReviewBuyAndDeliveryResponse?.Journey.length > 0;
  }

  setDeliveryModeLabel(deliveryMode: string) {
    if (
      deliveryMode?.toLowerCase() ==
      this.appRouteEnum?.DeliveryModeETicket?.toLowerCase()
    ) {
      return `${this.appRouteEnum?.DeliveryMode_ETicket} (Free)`;
    } else if (
      deliveryMode?.toLowerCase() ==
      this.appRouteEnum?.DeliveryMode_TOD?.toLowerCase()
    ) {
      return `${this.appRouteEnum?.collect_at_any_stationText} (Free)`;
    } else if (deliveryMode == this.appRouteEnum?.DeliveryMode_Smart_Card) {
      return `${this.deliveryModeEnum?.SmartCard} (Free)`;
    } else if (deliveryMode == this.appRouteEnum?.DeliveryMode_FRTFIRSTCLASS) {
      return `${
        this.deliveryModeEnum?.firstClassPostMsg
      } (${this.sharedService?.currencySymbol(
        ""
      )}${this.sharedService.formatPrice(
        this.firstClassDeliveryPriceForPost
      )})`;
    } else if (deliveryMode == this.appRouteEnum?.DeliveryMode_FRTNEXTDAY) {
      return `${
        this.deliveryModeEnum?.nextDayDeliveryPostMsg
      } (${this.sharedService?.currencySymbol(
        ""
      )}${this.sharedService.formatPrice(this.nextDayDeliveryPriceForPost)})`;
    } else if (deliveryMode == "FRT") {
      return `${this.deliveryModeEnum?.postMsg}`;
    }
  }

  getDeliveryModeLabel(mode: string): string {
    switch (mode) {
      case this.appRouteEnum?.DeliveryModeETicket:
        return this.appRouteEnum?.DeliveryMode_ETicket;
      case this.appRouteEnum?.DeliveryMode_TOD:
        return this.appRouteEnum?.collect_at_any_stationText;
      case this.appRouteEnum?.DeliveryMode_Smart_Card:
        return this.deliveryModeEnum?.SmartCard;
      case this.appRouteEnum?.DeliveryMode_FRTFIRSTCLASS:
        return `${
          this.deliveryModeEnum?.firstClassPostMsg
        } (${this.sharedService?.currencySymbol(
          ""
        )}${this.sharedService.formatPrice(
          this.firstClassDeliveryPriceForPost
        )})`;
      case this.appRouteEnum?.DeliveryMode_FRTNEXTDAY:
        return `${
          this.deliveryModeEnum?.nextDayDeliveryPostMsg
        } (${this.sharedService?.currencySymbol(
          ""
        )}${this.sharedService.formatPrice(this.nextDayDeliveryPriceForPost)})`;
      default:
        return mode;
    }
  }

  onDeliveryModeChange(event: any, journeyIndex, journey) {
    if (event.value) {
      this.inValidAddress[this.selectedJourneyAccordion] = false;
      this.previousSelectedDeliveryMode = this.selectedDeliveryMode;
      this.changeDeliveryModeDetail(event, journey, journeyIndex);
      this.selectAllPassengersInSmartCard = {};
      this.blankSmartCardNumber = {};
    }
  }

  changeDeliveryModeDetail(event, journey, journeyIndex) {
    this.selectedDeliveryMode = event.value; // this will be index (or value) of selected option
    this.onLoadPassengerList();
    if (
      (this.selectedDeliveryMode === this.appRouteEnum?.DeliveryModeETicket ||
        this.selectedDeliveryMode === this.appRouteEnum?.DeliveryMode_TOD) &&
      this.selectedDeliveryMode != journey?.DeliveryDetail[0]?.DeliveryModeType
    ) {
      this.onClickAddDeliveryMode(
        this.selectedDeliveryMode,
        journey,
        event,
        journeyIndex
      );
    }
    this.isAddressShow = false;
    this.isAddAddress = true;
    this.showAddAdress = true;
    this.isCheckedTermsCondition = true;
    this.isSmartCardAlreadyAdded = false;
    this.smartCardError = false;
  }

  createForms() {
    let title = this.enhancedReviewBuyAndDeliveryResponse?.Journey[
      this.selectedJourneyAccordion
    ]?.DeliveryDetail[0]?.Title
      ? this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0]?.Title
      : localStorage.getItem(this.localStorageEnum?.titleText);
    let firstName = this.enhancedReviewBuyAndDeliveryResponse?.Journey[
      this.selectedJourneyAccordion
    ]?.DeliveryDetail[0]?.Name
      ? this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0]?.Name
      : localStorage.getItem(this.localStorageEnum?.firstName);
    let lastName = this.enhancedReviewBuyAndDeliveryResponse?.Journey[
      this.selectedJourneyAccordion
    ]?.DeliveryDetail[0]?.Surname
      ? this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0]?.Surname
      : localStorage.getItem(this.localStorageEnum?.lastNameText);
    this.postDeliveryForm = this.formbuilder.group({
      title: new FormControl(title ? title : ""),
      deliveryType: new FormControl(),
      name: new FormControl(firstName ? firstName : "", [
        Validators.required,
        Validators.pattern(
          /^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/
        ),
      ]),
      surname: new FormControl(lastName ? lastName : "", [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(
          /^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/
        ),
      ]),
    });
    this.addressForm = this.formbuilder.group({
      address1: new FormControl("", [
        Validators.required,
        Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/),
      ]),
      address2: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      address3: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      city: new FormControl("", [
        Validators.required,
        Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/),
      ]),
      postCode: new FormControl("", [
        Validators.required,
        Validators.minLength(4),
      ]),
      country: new FormControl("", [
        Validators.required,
        Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/),
      ]),
    });
  }

  onSelectPostDeliveryMethodAddress(index, address) {
    this.inValidAddress[this.selectedJourneyAccordion] = false;
    this.isChangeAddressOfPostDelivery = false;
    this.deliveryModeRequest.Address = address?.Address;
    this.selectedaddress = address;
    this.tempDeliveryAddress = this.deliveryModeRequest.Address;
    this.defaultDeliveryAddressIndexPost = index;
  }

  editAddress(index, addressformid, journeyIndex) {
    this.smartcardAddressUpdated[this.selectedJourneyAccordion] = false;
    this.postAddressUpdated[this.selectedJourneyAccordion] = false;
    this.checkAddressPanelName(addressformid);
    addressformid = "#" + addressformid;
    if (this.isSmartCardPanelAddress) {
      this.editableAddress = this.smartCardBillingAddress[index];
    } else {
      this.editableAddress =
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          journeyIndex
        ]?.DeliveryModesDto?.Addresses[index];
    }
    this.editIndex = index;
    this.isAddressShow = true;
    this.isAddAddress = false;
    this.showAddAdress = true;
    setTimeout(() => {
      document
        .querySelectorAll(addressformid)[0]
        .scrollIntoView({ block: "center" });
      (
        document
          .querySelectorAll(addressformid)[0]
          .getElementsByTagName("input")[0] as HTMLElement
      ).focus();
    }, 0);
    this.initializeAddress(this.isAddAddress);
  }

  checkAddressPanelName(addressformid) {
    if (addressformid == "addressForm1") {
      this.isPostPanelAddress = true;
      this.isSmartCardPanelAddress = false;
    } else if (addressformid == "addressFormSmartcard") {
      this.isSmartCardPanelAddress = true;
      this.isPostPanelAddress = false;
    }
  }

  initializeAddress(isAdd) {
    if (!isAdd) {
      this.addressForm.patchValue({
        address1: this.editableAddress.Address.Address1,
        address2: this.editableAddress.Address.Address2,
        address3: this.editableAddress.Address.Address3,
        city: this.editableAddress.Address.City,
        postCode: this.editableAddress.Address.PostCode,
        country: this.editableAddress.Address.Country,
      });
    } else {
      this.addressForm.markAsUntouched();
      this.addressForm.patchValue({
        address1: null,
        address2: null,
        address3: null,
        city: null,
        postCode: null,
        country: null,
      });
    }
  }

  onClose() {
    this.addressForm.controls["postCode"].markAsUntouched();
    this.isAddressShow = false;
    this.isAddAddress = true;
    this.showAddAdress = true;
  }

  // Method to create address
  onAddressCreated(_isSmartCard, journeyIndex) {
    this.smartcardAddressAdded[this.selectedJourneyAccordion] = false;
    this.postAddressAdded[this.selectedJourneyAccordion] = false;
    this.addressList.forEach((x) => {
      let elementValue = document.getElementById(x)["value"];
      const ctrlValue = this.addressForm.controls[x];
      ctrlValue.setValue(elementValue);
    });
    for (const key of Object.keys(this.addressForm.controls)) {
      if (this.addressForm.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector(
          '[formcontrolname="' + key + '"]'
        );
        invalidControl.focus();
        return false;
      }
    }
    if (this.addressForm.valid) {
      this.address = new CustomerAddress();
      this.address.Address = new Address();
      this.address.Address.Address1 = this.addressForm.get("address1").value;
      this.address.Address.Address2 = this.addressForm.get("address2").value;
      this.address.Address.Address3 = this.addressForm.get("address3").value;
      this.address.Address.PostCode = this.addressForm.get("postCode").value;
      this.address.Address.City = this.addressForm.get("city").value;
      this.address.Address.Country = this.addressForm.get("country").value;
      if (this.isAddAddress) {
        if (_isSmartCard) {
          this.address.AddressType =
            "Address" +
            " " +
            (this.smartCardBillingAddress.length + 1).toString();
        } else {
          this.address.AddressType =
            "Address" + " " + (this.billingAddresses.length + 1).toString();
        }
        let obj = { ...this.address };

        this.smartCardBillingAddress.push(obj);
        if (
          this.smartCardBillingAddress.length !== this.billingAddresses.length
        ) {
          this.billingAddresses = JSON.parse(
            JSON.stringify(this.smartCardBillingAddress)
          );
        }
        this.isAddAddress = true;
        this.isAddressShow = false;
        this.isAdd = true;
      } else {
        this.address.Address.CountryCode =
          this.editableAddress.Address.CountryCode;
        this.address.AddressType = this.editableAddress.AddressType;
        this.address.IsDefault = this.editableAddress.IsDefault;
        this.smartCardBillingAddress[this.editIndex] = this.address;
        this.billingAddresses[this.editIndex] = this.address;
        this.isAddressShow = false;
        this.isAddAddress = true;
      }
      this.showAddAdress = true;
      this.customerInfoUpdateModel.Email = localStorage.getItem("Email");
      this.customerInfoUpdateModel.Addresses = this.billingAddresses;
      this.sendModifyAddress(_isSmartCard);
    } else {
      this.addressForm.markAllAsTouched();
      this.addressForm.markAsDirty();
      this.addressForm.updateValueAndValidity();
      return false;
    }
  }

  sendModifyAddress(_isSmartCard) {
    this.enhancedReviewBuyAndDelivery
      .enhancedModifyAddress(this.customerInfoUpdateModel)
      .subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            if (this.responseData.Data) {
              this.getmodifiedAddressMsg();
            } else {
              this.billingAddresses = JSON.parse(
                JSON.stringify(this.storedAddress)
              );
              this.deliveryModeRequest.Address = this.tempDeliveryAddress;
            }
          } else {
            this.billingAddresses = this.storedAddress.slice(0);
            this.billingAddresses = JSON.parse(
              JSON.stringify(this.storedAddress)
            );
            this.deliveryModeRequest.Address = this.tempDeliveryAddress;
          }
          this.isAdd = false;
          this.isDelete = false;
        }
      });
  }

  getmodifiedAddressMsg() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    if (this.isDelete) {
      this.selectedDeleteAddress();
      this.isDelete = false;
      if (this.isSmartCardPanelAddress) {
        this.smartcardAddressDeleted[this.selectedJourneyAccordion] = true;
      } else {
        this.postAddressAdded[this.selectedJourneyAccordion] = true;
      }
      this.timeoutRef = setTimeout(() => {
        if (this.isSmartCardPanelAddress) {
          this.smartcardAddressDeleted[this.selectedJourneyAccordion] = false;
        } else {
          this.postAddressDeleted[this.selectedJourneyAccordion] = false;
        }
      }, 10000);
    } else if (this.isAdd) {
      this.isAdd = false;
      this.DeliveryModesDto[0].Addresses = this.billingAddresses;

      this.setDataInDeliveryModeReqForUpdatedAndAddedAddress();
      if (this.isSmartCardPanelAddress) {
        this.smartcardAddressAdded[this.selectedJourneyAccordion] = true;
      } else {
        this.postAddressAdded[this.selectedJourneyAccordion] = true;
      }
      this.timeoutRef = setTimeout(() => {
        if (this.isSmartCardPanelAddress) {
          this.smartcardAddressAdded[this.selectedJourneyAccordion] = false;
        } else {
          this.postAddressAdded[this.selectedJourneyAccordion] = false;
        }
      }, 10000);
    } else {
      this.setDataInDeliveryModeReqForUpdatedAndAddedAddress();
      if (this.isSmartCardPanelAddress) {
        this.smartcardAddressUpdated[this.selectedJourneyAccordion] = true;
      } else {
        this.postAddressUpdated[this.selectedJourneyAccordion] = true;
      }
      this.timeoutRef = setTimeout(() => {
        if (this.isSmartCardPanelAddress) {
          this.smartcardAddressUpdated[this.selectedJourneyAccordion] = false;
        } else {
          this.postAddressUpdated[this.selectedJourneyAccordion] = false;
        }
      }, 10000);
    }
    this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
    this.smartCardBillingAddress = JSON.parse(
      JSON.stringify(this.billingAddresses)
    );
    this.enhancedReviewBuyAndDeliveryResponse.Journey.forEach(
      (journey) => (journey.DeliveryModesDto.Addresses = this.billingAddresses)
    );
    this.sharedService.enhancedReviewBuyResponse =
      this.enhancedReviewBuyAndDeliveryResponse;
    this.commonServices.cacheSharedData();
    if (!this.isDefaultAvailable(this.billingAddresses)) {
      this.billingAddresses[0].IsDefault = true;
    }
  }

  addressmodal(addressformid) {
    this.checkAddressPanelName(addressformid);
    addressformid = "#" + addressformid;
    this.isAddAddress = true;
    this.isAddressShow = true;
    this.showAddAdress = false;
    setTimeout(() => {
      document
        .querySelectorAll(addressformid)[0]
        .scrollIntoView({ block: "center" });
    }, 0);
    this.initializeAddress(this.isAddAddress);
  }

  getOrderSmartCardDetails(basketJourneyResponse) {
    if (
      basketJourneyResponse?.DeliveryDetail[0]?.SmartCardNumber == null &&
      basketJourneyResponse?.DeliveryDetail[0]?.IsOrderSmartCard
    ) {
      if (basketJourneyResponse?.OrderSmartCardInfo?.GeneralInformation) {
        this.orderSmartcardForm
          .get("Title")
          .patchValue(
            basketJourneyResponse.OrderSmartCardInfo.GeneralInformation.Title
          );
        this.orderSmartcardForm
          .get("Name")
          .patchValue(
            basketJourneyResponse.OrderSmartCardInfo.GeneralInformation.Name
          );
        this.orderSmartcardForm
          .get("Surname")
          .patchValue(
            basketJourneyResponse.OrderSmartCardInfo.GeneralInformation.Surname
          );
        this.orderSmartcardForm
          .get("SmartcardNickName")
          .patchValue(
            basketJourneyResponse.OrderSmartCardInfo.GeneralInformation
              .SmartcardNickName
          );
        this.orderSmartcardForm
          .get("DateOfBirth")
          .patchValue(
            basketJourneyResponse.OrderSmartCardInfo.GeneralInformation
              .DateOfBirth
          );
        this.orderSmartcardForm
          .get("delPersonTitle")
          .patchValue(basketJourneyResponse.OrderSmartCardInfo.Title);
        this.orderSmartcardForm
          .get("delPersonName")
          .patchValue(basketJourneyResponse.OrderSmartCardInfo.Name);
        this.orderSmartcardForm
          .get("delPersonSurname")
          .patchValue(basketJourneyResponse.OrderSmartCardInfo.Surname);
        this.isCheckedTermsCondition = true;
      }
      this.IsDeliveryModeSmartcardSelected = true;
      this.isOrderSmartCard[this.selectedJourneyAccordion] = true;
      this.isChangeAddressOfOrderSmartCardDelivery = true;
    } else {
      this.orderSmartcardForm.reset();
      this.orderSmartcardForm.markAsUntouched();
      this.orderSmartcardForm.updateValueAndValidity();
    }
  }

  orderSmartCardForm() {
    this.orderSmartcardForm = this.formbuilder.group(
      {
        Title: ["", [Validators.required]],
        Name: [
          "",
          [
            Validators.required,
            Validators.pattern(
              /^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/
            ),
          ],
        ],
        Surname: [
          "",
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(
              /^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/
            ),
          ],
        ],
        SmartcardNickName: ["", [Validators.required]],
        DateOfBirth: ["", [Validators.required]],
        delPersonTitle: ["", [Validators.required]],
        delPersonName: [
          "",
          [
            Validators.required,
            Validators.pattern(
              /^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/
            ),
          ],
        ],
        delPersonSurname: [
          "",
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(
              /^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/
            ),
          ],
        ],
        checked: new FormControl(false),
      },
      {
        validator: [checkUserName("SmartcardNickName")],
      }
    );
  }

  setDeliveryModesData() {
    if (this.DeliveryModesDto) {
      this.DeliveryModesDto.forEach((dto) => {
        if (dto?.DeliveryMode) {
          dto.DeliveryMode = dto.DeliveryMode.filter(
            (x) => !x.IsHide && x.DeliveryMode !== "FRT"
          );
        }
      });

      this.getDeliveryModeForPassangarDetailWithSmartCard();
      this.deliveryModesCount = this.DeliveryModesDto.map(
        (obj) => obj.DeliveryMode?.length || 0
      );
      this.getValueOnCheckDeliveryModesCount();
      this.setDetailsIfSmartCardNumberExistsOfLatestJourney();
      this.checkDeliveryModeSmartCardSelectedOrNot();

      // get defaultDeliveryAddressIndex for post and smart card address
      this.getDefaultDeliveryAddressIndexForPostAndSmartcard();
      this.deliveryModes =
        this.enhancedReviewBuyAndDeliveryResponse.Journey.map(
          (m) => m.DeliveryModesDto?.DeliveryMode
        );
      this.getShowHideDeliveryModeValueInSetDelivery();
    }
    this.reviewBuyCache =
      this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
    this.sharedService.reviewBuyCache = this.reviewBuyCache;

    this.setBillingAddressInDeliveryModeReq();
  }

  getDeliveryModeForPassangarDetailWithSmartCard() {
    this.DeliveryModesDto.forEach((dto) => {
      if (dto?.DeliveryMode) {
        dto.DeliveryMode = dto.DeliveryMode.filter((x) => {
          if (x.IsHide || x.DeliveryMode === "FRT") {
            return false;
          }

          if (
            this.totalAdult > 0 &&
            this.totalChild > 0 &&
            x.DeliveryMode === this.appRouteEnum.DeliveryMode_Smart_Card
          ) {
            return false;
          }

          return true;
        });
      }
    });
  }

  checkLengthOfDeliveryModesAddress() {
    return (
      this.DeliveryModesDto[0]?.Addresses &&
      this.DeliveryModesDto[0]?.Addresses?.length > 0
    );
  }

  getDefaultDeliveryAddressIndexForPostAndSmartcard() {
    if (this.checkLengthOfDeliveryModesAddress()) {
      for (let i = 0; i < this.DeliveryModesDto[0]?.Addresses?.length; i++) {
        if (this.DeliveryModesDto[0]?.Addresses[i]?.IsDefault === true) {
          this.defaultDeliveryAddressIndex = i;
          this.defaultDeliveryAddressIndexPost = i;
          this.selectedaddress = this.DeliveryModesDto[0]?.Addresses[i];
        }
      }

      // for post delivery address
      this.setBillingAddressForPostAddresses();

      // for order smart card address
      this.setBillingAddressForOrderSmartCardAddresses();
      this.smartCardBillingAddress =
        this.DeliveryModesDto[this.selectedJourneyAccordion]?.Addresses;

      this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    }
  }

  setBillingAddressForPostAddresses() {
    if (
      (this.enhancedReviewBuyAndDeliveryResponse?.Journey &&
        this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length > 0 &&
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ].DeliveryDetail[0] &&
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ].DeliveryDetail[0].DeliveryModeType ==
          this.appRouteEnum.DeliveryMode_FRTNEXTDAY) ||
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ].DeliveryDetail[0].DeliveryModeType ==
        this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS
    ) {
      // if selected default post delivery
      let selectedAddressForPostDelivery =
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ].SelectedDeliveryAddress;
      let clonedArrForPostDeliveryAddress: any[] = JSON.parse(
        JSON.stringify(
          this.DeliveryModesDto[this.selectedJourneyAccordion]?.Addresses
        )
      );
      if (selectedAddressForPostDelivery) {
        for (let [
          index,
          DeliveryModesDtoAddress,
        ] of clonedArrForPostDeliveryAddress.entries()) {
          if (
            selectedAddressForPostDelivery?.Address1.includes(
              DeliveryModesDtoAddress?.Address?.Address1
            )
          ) {
            DeliveryModesDtoAddress.IsDefault = true;
            this.defaultDeliveryAddressIndexPost = index;
          } else {
            DeliveryModesDtoAddress.IsDefault = false;
          }
        }
      }
      this.billingAddresses = clonedArrForPostDeliveryAddress;
    } else {
      this.billingAddresses =
        this.DeliveryModesDto[this.selectedJourneyAccordion]?.Addresses;
    }
    let selectedAddress = this.billingAddresses.find(
      (address) => address.IsDefault
    );
    if (selectedAddress) {
      this.selectedAddressIndexForPost =
        this.billingAddresses.indexOf(selectedAddress);
    }
  }

  setBillingAddressForOrderSmartCardAddresses() {
    if (this.checkOrderSmartCardAddressWithSmartCard()) {
      // if selected default smart card delivery with order smart card info
      this.setDetailForBillingAddressInCaseOfOrderSmartCardInfo();
    } else if (
      this.checkSmartCardDelectedOrNot() &&
      this.DeliveryModesDto[this.selectedJourneyAccordion]?.SmartCardDetails &&
      this.DeliveryModesDto[this.selectedJourneyAccordion]?.SmartCardDetails
        ?.length > 0
    ) {
      // if selected default smart card delivery with smart card numbers
      this.setDetailForBillingAddressInCaseOfSmartCardNumber();
    } else {
      this.smartCardBillingAddress =
        this.DeliveryModesDto[this.selectedJourneyAccordion]?.Addresses;
    }
    let selectedAddress = this.smartCardBillingAddress.find(
      (address) => address.IsDefault
    );
    if (selectedAddress) {
      this.selectedAddressIndexForSmartCard =
        this.smartCardBillingAddress.indexOf(selectedAddress);
    }
  }

  checkOrderSmartCardAddressWithSmartCard() {
    return this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length > 0 && this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion].DeliveryDetail[0] && (this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion].DeliveryDetail[0].DeliveryModeType == this.appRouteEnum.DeliveryMode_Smart_Card && this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]?.OrderSmartCardInfo?.Address);
  }

  setDetailForBillingAddressInCaseOfOrderSmartCardInfo() {
    this.smartCardBillingAddress = [];
    let selectedAddressForOrderSmartCard = this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]?.OrderSmartCardInfo?.Address;
    let clonedArrForSmartCardDeliveryAddress: any[] = JSON.parse(JSON.stringify(this.DeliveryModesDto[this.selectedJourneyAccordion]?.Addresses));
    if (selectedAddressForOrderSmartCard) {
      for (let [
        index,
        DeliveryModesDtoAddress,
      ] of clonedArrForSmartCardDeliveryAddress.entries()) {
        if (
          selectedAddressForOrderSmartCard?.Address1.includes(
            DeliveryModesDtoAddress?.Address?.Address1
          )
        ) {
          DeliveryModesDtoAddress.IsDefault = true;
          this.defaultDeliveryAddressIndex = index;
        } else {
          DeliveryModesDtoAddress.IsDefault = false;
        }
      }
    }
    this.smartCardBillingAddress = JSON.parse(
      JSON.stringify(clonedArrForSmartCardDeliveryAddress)
    );
  }

  setBillingAddressInDeliveryModeReq() {
    if (this.billingAddresses && this.billingAddresses.length > 0) {
      if(this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]?.SelectedDeliveryAddress){
        this.deliveryModeRequest.Address = this.enhancedReviewBuyAndDeliveryResponse?.Journey[this.selectedJourneyAccordion]?.SelectedDeliveryAddress;
      } else {
        this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
      }
    }
  }

  filterSmartCard(smartCards: SmartCardDetails[]) {
    if (smartCards) {
      let filteredSmartCard = smartCards.filter(
        (x) =>
          x.Status === "ISSUED" ||
          (x.Status === "ACCEPTED" &&
            x.Type === "LINK" &&
            x.RecipientCustomerKey !== x.SenderCustomerKey)
      );
      // check for filtering based on adult and child count
      if (
        this.sharedService.searchRequest.Adult == 0 &&
        this.sharedService.searchRequest.Child != 0
      ) {
        filteredSmartCard = filteredSmartCard.filter((x) => !x.IsAdult);
      } else if (
        this.sharedService.searchRequest.Adult != 0 &&
        this.sharedService.searchRequest.Child == 0
      ) {
        filteredSmartCard = filteredSmartCard.filter((x) => x.IsAdult);
      }
      //check ends
      if (filteredSmartCard.length == 0) {
        return null;
      } else {
        return filteredSmartCard;
      }
    }
  }

  smartCardOptionSelect(
    passengerIndex,
    smartcardIndex,
    selectedSmartCardNumber,
    isAddSmartCard
  ) {
    // if (selectedSmartCardNumber == this.selectedSmartCardNumber) {
    //   this.isChangeNumberOfSmartCard = true;
    // } else {
    //   this.isChangeNumberOfSmartCard = false;
    // }
    if (this.selectedSmartcardList) {
      let i = this.selectedSmartcardList.findIndex(
        (x) => x.passengerIndex == passengerIndex
      );
      if (i != -1) {
        this.selectedSmartcardList[i].smartcard = selectedSmartCardNumber;
        this.selectedSmartcardList[i].smartcardIndex = smartcardIndex;
      } else {
        this.selectedSmartcardList.push({
          passengerIndex: passengerIndex,
          smartcardIndex: smartcardIndex,
          smartcard: selectedSmartCardNumber,
        });
      }
    }
    this.updateAvailableStatus();
    this.smartCardPassengerList[passengerIndex].SmartCardNumberSelectedOption =
      selectedSmartCardNumber;
    this.smartCardPassengerList[passengerIndex].SmartCardNumber =
      selectedSmartCardNumber;

    if (isAddSmartCard) {
      this.smartCardPassengerList[passengerIndex].IsAddedSmartcard = false;
      this.smartCardPassengerList[passengerIndex].newSmartCardAdded = true;
      this.smartCardPassengerList[passengerIndex].isEnterSmartVisible = true;
    } else if (isAddSmartCard === false) {
      this.smartCardPassengerList[passengerIndex].IsAddedSmartcard = true;
      this.smartCardPassengerList[passengerIndex].SmartCardNumberText = "";
      this.smartCardPassengerList[passengerIndex].newSmartCardAdded = false;
      this.smartCardPassengerList[passengerIndex].isEnterSmartVisible = false;
    }
  }

  updateAvailableStatus() {
    let smartCardDetails =
      this.DeliveryModesDto[this.selectedJourneyAccordion].SmartCardDetails;

    if (smartCardDetails) {
      smartCardDetails.forEach((card) => {
        const selected = this.selectedSmartcardList.find(
          (entry) => entry.smartcard === card.SmartCardNumber
        );

        if (selected) {
          card.IsAlreadySelected = true;
          card.passengerIndex = selected.passengerIndex;
        } else {
          card.IsAlreadySelected = false;
          card.passengerIndex = null;
        }
      });
    }
  }

  checkAdultChildCount(_i, passengerType: NgModel) {
    this.adultCount = 0;
    this.childCount = 0;
    this.onSelectPassenger = true;

    for (let smartCardPassenger of this.smartCardPassengerList) {
      let isAdult: any = smartCardPassenger.IsAdult;
      if (isAdult) this.adultCount++;
      if (isAdult === false) this.childCount++;
    }

    let isInvalid = this.childCount > this.totalChild;

    this.isSelectedPassengerValid = [...this.isSelectedPassengerValid];
    this.isSelectedPassengerValid[_i] = isInvalid;
    if (isInvalid) {
      passengerType.control?.setErrors({ invalidPassengerType: true });
      passengerType?.control?.markAsTouched();
    } else {
      passengerType.control?.setErrors(null);
    }
  }

  removePassenger(PassengerNo) {
    if (this.smartCardPassengerList.length > 1) {
      let findIndexInSelectedList = this.selectedSmartcardList.findIndex(
        (x) => x.passengerIndex == PassengerNo
      );
      if (findIndexInSelectedList != -1)
        this.selectedSmartcardList.splice(findIndexInSelectedList, 1);

      this.smartCardPassengerList[PassengerNo].IsAdult
        ? this.adultCount--
        : this.childCount--;
      this.smartCardPassengerList.splice(PassengerNo, 1);

      this.updateAvailableStatus();
    }
  }

  onLoadPassengerList() {
    this.smartCardPassengerList = new Array<SmartCardInfo>();
    this.isSelectedPassengerValid = [];
    let passenger = new SmartCardInfo();
    passenger.IsAdult = true;
    if (
      this.sharedService.searchRequest != undefined &&
      this.sharedService.searchRequest.DepartureLocationName != undefined
    ) {
      passenger.LocationId = this.findLocationCode(
        this.sharedService.searchRequest.DepartureLocationName
      ).toString();
      if (passenger.LocationId != "0") {
        passenger.LocationName =
          this.sharedService.searchRequest.DepartureLocationName;
      } else if (passenger.LocationId == "0") {
        passenger.LocationId = "";
        passenger.LocationName = "";
      }
    } else {
      passenger.LocationId = "";
      passenger.LocationName = "";
    }
    passenger.IsLoadStationAvailable =
      passenger.LocationId == "" ? false : true;
    passenger.SmartCardNumber = "";
    if (
      (this.selectedSmartCardNumber.length === 1 &&
        this.selectedSmartCardNumber[0] === "") ||
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.DeliveryModesDto?.SmartCardDetails?.length === 0
    ) {
      passenger.IsAddedSmartcard = false;
    } else {
      passenger.IsAddedSmartcard = true;
    }
    passenger.newSmartCardAdded = false;
    passenger.xmlId = passenger.xmlId
      ? passenger?.xmlId
      : this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.XmlId;
    this.smartCardPassengerList.push(passenger);
    this.smartCardPassengerList.forEach((_, index) => {
      this.isSelectedPassengerValid[index] = false;
    });
  }

  findLocationCode(value) {
    if (value !== null || value !== "" || value !== undefined || value !== 0) {
      if (
        this.DeliveryModesDto[this.selectedJourneyAccordion]
          .SmartCardLocation != null &&
        this.DeliveryModesDto[this.selectedJourneyAccordion]
          .SmartCardLocation != undefined
      ) {
        let station = this.DeliveryModesDto[
          this.selectedJourneyAccordion
        ].SmartCardLocation.filter((m) => m.Name == value);
        if (station.length > 0) return station[0].Id;
        else return 0;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  addSmartCard(smartcardNo, i) {
    this.smartCardError = false;
    this.isSmartCardAlreadyAdded = false;
    let ctrl = this.smartcardCtrl.toArray()[i];
    if (!smartcardNo || smartcardNo?.length < 18) {
      this.smartCardError = !this.smartCardError; // Set error flag to true
      return;
    }

    for (let index = 0; index < this.smartCardPassengerList?.length; index++) {
      if (i != index) {
        if (
          this.smartCardPassengerList[index]?.IsAddedSmartcard &&
          smartcardNo == this.smartCardPassengerList[index].SmartCardNumber &&
          this.enhancedReviewBuyAndDeliveryResponse?.Journey[
            this.selectedJourneyAccordion
          ]?.XmlId === this.smartCardPassengerList[index]?.xmlId
        ) {
          this.isSmartCardAlreadyAdded = !this.isSmartCardAlreadyAdded;
          if (this.isSmartCardAlreadyAdded) {
            ctrl.control.setErrors({
              ...ctrl.errors,
              isSmartCardAlreadyAdded: true,
            });
          } else {
            // Remove only isSmartCardAlreadyAdded, keep others
            if (ctrl.errors) {
              let { isSmartCardAlreadyAdded, ...otherErrors } = ctrl.errors;
              ctrl.control.setErrors(
                Object.keys(otherErrors).length ? otherErrors : null
              );
            }
          }
          return;
        }
      }
    }
    let smartcard = new SmartCardValidationRequest();
    smartcard.SmartCardNumber = smartcardNo;
    smartcard.IsAdult = this.sharedService.searchRequest.Adult > 0; //PICO-2150 added a property for check passanger added to smart card adult or child
    this.setToLinkSmartCardNum(smartcard, i, smartcardNo);
  }

  setToLinkSmartCardNum(smartcard, i, smartcardNo) {
    this.smartCardValidateMesage = "";
    this.IsValidateAddPassenger[this.selectedJourneyAccordion] = false;
    this.InValidSmartCard[this.selectedJourneyAccordion] = false;
    this.enhancedReviewBuyAndDelivery
      .enhancedAddSmartCard(smartcard)
      .subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            this.IsValidateAddPassenger[i] =
              this.responseData?.Data?.IsValidate;
            this.smartCardValidateMesage =
              this.responseData?.Data?.SmartCardMessage;
            if (this.timeoutRef) {
              clearTimeout(this.timeoutRef);
            }
            if (this.IsValidateAddPassenger[i]) {
              // Auto-hide message after 5 seconds
              this.timeoutRef = setTimeout(() => {
                this.IsValidateAddPassenger[i] = false;
              }, 10000);
              this.smartCardOptionSelect(i, null, smartcardNo, null);
              this.smartCardPassengerList[i].IsAddedSmartcard = true;
              this.smartCardPassengerList[i].newSmartCardAdded = true;
              this.smartCardPassengerList[i].SmartCardNumber = smartcardNo;
              this.updateAvailableStatus();
            } else if (!this.IsValidateAddPassenger[i]) {
              this.InValidSmartCard[i] = true;
              this.timeoutRef = setTimeout(() => {
                this.InValidSmartCard[i] = false;
              }, 10000);
            }
          } else if (this.responseData.ResponseCode == "203") {
            this.handleInvalidSmartCard(i, this.responseData?.ResponseMessage);
          } else {
            this.handleInvalidSmartCard(i, this.responseData?.ResponseMessage);
          }
        }
      });
  }

  filterLocation(stationList: any, $event) {
    if (
      $event != undefined &&
      $event.target.value != "" &&
      $event.target.value.length >= 2
    ) {
      this.filteredStations = this._filterLocation(
        $event.target.value,
        stationList
      );
    } else {
      stationList = [];
      this.filteredStations = this._filterLocation(
        $event.target.value,
        stationList
      );
    }
  }

  private _filterLocation(
    value: string,
    stationList: any
  ): Observable<LocationMasterData[]> {
    const filterValue = value.toLowerCase();
    let suggestedLocations;
    if (value.length == 3) {
      suggestedLocations = stationList.filter((location) =>
        location.Name.split("(")
          .pop()
          .split(")")[0]
          .toLowerCase()
          .includes(filterValue)
      );
      if (suggestedLocations.length <= 0) {
        suggestedLocations = stationList.filter((location) =>
          location.Name.toLowerCase().includes(filterValue)
        );
      }
    } else {
      suggestedLocations = stationList.filter((location) =>
        location.Name.toLowerCase().includes(filterValue)
      );
    }
    return suggestedLocations.length
      ? of(suggestedLocations)
      : of([{ Id: null, Name: "No results found" }]);
  }

  onLocationChange(index, $event) {
    this.smartCardPassengerList[index].LocationName = $event.option.value;
    this.smartCardPassengerList[index].LocationId = this.findLocationCode(
      $event.option.value
    ).toString();
    this.smartCardPassengerList[index].IsLoadStationAvailable = true;
  }

  onInputLocationChangeOrder($event) {
    this.locationName = $event.currentTarget.value;
  }

  onInputLocationChange(index, $event) {
    this.smartCardPassengerList[index].LocationName =
      $event.currentTarget.value;
  }

  orderSmartcardtoggle() {
    this.showSmartCardCancel = false;
    this.isOrderSmartCard[this.selectedJourneyAccordion] = true;
    this.IsDeliveryModeSmartcardSelected = false;
    this.isChangeAddressOfOrderSmartCardDelivery = false;
  }

  onLocationChangeOrder($event, journeyIndex) {
    this.locationName = $event.option.value;
    this.locationId = this.findLocationCode($event.option.value).toString();
    this.IsLoadStationAvailable = true;
  }

  setBillingDeleteAddressIndex(index, isSmartCard) {
    let temp;
    for (let i = index; i < this.billingAddresses.length - 1; i++) {
      temp = this.storedAddress[i].AddressType;
      this.billingAddresses[i + 1].AddressType = temp;
    }
    if (this.billingAddresses.length > 1) {
      if (
        this.deliveryModeRequest.Address ===
        this.billingAddresses[index].Address
      ) {
        this.deliveryModeRequest.Address = null;
      }
      this.billingAddresses.splice(index, 1);
      // only last option is left for address
      if (this.billingAddresses.length == 1) {
        this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
      } else {
        if (this.billingAddresses.filter((x) => x.IsDefault).length > 0)
          this.deliveryModeRequest.Address = this.billingAddresses.filter(
            (x) => x.IsDefault
          )[0].Address;
        else
          this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
      }
    } else {
      this.deliveryModeRequest.Address = this.billingAddresses[0].Address;
    }
    this.isDelete = true;
    this.customerInfoUpdateModel.Email = localStorage.getItem("Email");
    this.customerInfoUpdateModel.Addresses = this.billingAddresses;
    this.smartCardBillingAddress = JSON.parse(
      JSON.stringify(this.billingAddresses)
    );
    this.sendModifyAddress(isSmartCard);
  }

  onSelectAddress(index, isSmartCard) {
    this.inValidAddress[this.selectedJourneyAccordion] = false;
    if (isSmartCard && this.smartCardBillingAddress.length > 1) {
      this.isChangeAddressOfOrderSmartCardDelivery = false;
    } else {
      this.isChangeAddressOfPostDelivery = false;
    }
    this.deliveryModeRequest.Address = this.billingAddresses[index].Address;
    this.selectedaddress = this.DeliveryModesDto[0].Addresses[index];
    this.tempDeliveryAddress = this.deliveryModeRequest.Address;
    if (isSmartCard) this.defaultDeliveryAddressIndex = index;
    else this.defaultDeliveryAddressIndexPost = index;
  }

  setReservationMessageData() {
    if (this.responseData?.Data?.TravelExtraResponseDto?.ReservationResponse) {
      if (
        this.responseData?.Data?.TravelExtraResponseDto?.ReservationResponse
          ?.IsBlock
      ) {
        let respMsg =
          this.responseData?.Data?.TravelExtraResponseDto?.ReservationResponse
            ?.ReservationMessage;

        this.spinnerService.hide();
        let dialogRef = this.dialog.open(EnhancedNoSeatsAvailableDialogsComponent, {
          disableClose: true,
          panelClass: [this.enhancedDynamicClassEnum?.enhancedCommonInfoPopup, this.enhancedDynamicClassEnum?.enhancedGoBackDialog, this.enhancedDynamicClassEnum?.enhancedNoSeatAvailableDialogPanelClass],
          width: "45rem",
          autoFocus: false,
          data: {
            Message: respMsg,
            bikeNotAvailable: true
          },
        });
        dialogRef.afterClosed().subscribe( value => {
          if(value){
            this.router.navigate([`./` + this.enhancedAppRouteEnum.searchResult]);
          }
        });
      }
    }
  }

  applyDiscountCode(journeyDetail: EnhancedJourneyDetail, isAddDiscount) {
    try {
      let creationDateKey = journeyDetail?.CreationDate;
      let code =
        this.discountCodeControls[creationDateKey.toString()]?.value?.trim();
      if (!code || code.length != 19) {
        return false;
      }
      this.discountCode = code;
      this.commonServices.loaderRequired = true;
      let {
        titleText,
        firstName,
        lastNameText,
        getDeliveryAndBasketJourneyResponse,
      } = this.localStorageEnum;

      let enhancedAddDiscountRequest: EnhancedAddDiscountRequest = {
        JourneyCreationDate: journeyDetail.CreationDate,
        ReviewBuyCache: this.reviewBuyCache,
        DiscountCode: code,
        IsAddDiscountCode: isAddDiscount,
        Title: this.storageDataService.getStorageData(titleText, false),
        Name: this.storageDataService.getStorageData(firstName, false),
        Surname: this.storageDataService.getStorageData(lastNameText, false),
        IsAdult: this.isExistAdultValue(),
      };
      this.enhancedReviewBuyAndDelivery
        .enhancedAddDiscounCode(enhancedAddDiscountRequest)
        .subscribe((res) => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == "200") {
              this.commonServices.loaderRequired = false;
              this.spinnerService.hide();
              this.enhancedDiscountResponse = this.responseData.Data;
              let deliveryAndBasketJourneyResponse =
                this.responseData?.Data?.DeliveryAndBasketJourneyResponse;
              this.enhancedReviewBuyAndDeliveryResponse =
                deliveryAndBasketJourneyResponse?.BasketJourneyResponse ||
                this.responseData?.Data;
              this.setPreferencesOfGetDeliveryBasketAndResposne();
              let journeys =
                this.enhancedReviewBuyAndDeliveryResponse?.Journey || [];
              journeys.forEach((journey) => {
                // Match creation date
                if (journey?.CreationDate === journeyDetail?.CreationDate) {
                  journey[
                    this.enhancedTravelExtrasTextEnum.showDiscountMessage
                  ] = false;
                  journey[this.enhancedTravelExtrasTextEnum.showDiscountError] =
                    false;

                  let isInvalid = journey?.IsDiscountCodeInvalid;
                  let message = journey?.DiscountMessage;

                  if (!isInvalid) {
                    if (
                      isAddDiscount &&
                      message?.toLowerCase()?.includes("applied")
                    ) {
                      journey[
                        this.enhancedTravelExtrasTextEnum.showDiscountMessage
                      ] = true;
                    }
                    this.sharedService.enhancedReviewBuyResponse =
                      deliveryAndBasketJourneyResponse
                        ? this.enhancedReviewBuyAndDeliveryResponse
                        : this.responseData?.Data;
                    this.reviewBuyCache =
                      this.enhancedDiscountResponse.ReviewBuyCache;
                    this.sharedService.reviewBuyCache = this.reviewBuyCache;
                  } else {
                    journey[
                      this.enhancedTravelExtrasTextEnum.showDiscountError
                    ] = true;
                    journey[
                      this.enhancedTravelExtrasTextEnum.disableAddButton
                    ] = true;
                  }
                }
              });
              this.getJourneyExtrasData();
              this.storageDataService.setStorageData(
                getDeliveryAndBasketJourneyResponse,
                this.responseData?.Data,
                true
              );
              this.commonServices.cacheSharedData();
            } else {
              this.showDiscountBackendError(
                journeyDetail?.CreationDate,
                this.responseData?.ResponseMessage
              );
              console.log(this.responseData.ResponseMessage);
            }
          }
        });
    } catch (error) {
      console.log(error);
    }
  }

  onFocusOutGetDiscountCode(event: any, item: any) {
    let key = item?.CreationDate;
    this.discountCode = event.target.value?.trim();
    this.discountCodeControls[key].setValue(this.discountCode);
  }

  removeErrorMessage(item) {
    item.DiscountMessage = "";
    item.invalid = false;
    item.disableAddButton = false; // re-enable button when user types
  }

  isDiscountInputReadOnly(item): boolean {
    return (
      (!this.enhancedReviewBuyAndDeliveryResponse?.IsDoubleDiscountEnabled &&
        item?.IsRailCardApplied) ||
      !!item?.DiscountCode
    );
  }

  isAddButtonDisabled(item): boolean {
    let key = item?.CreationDate;
    return (
      item?.disableAddButton ||
      (item?.IsRailCardApplied &&
        !this.enhancedReviewBuyAndDeliveryResponse?.IsDoubleDiscountEnabled) ||
      !this.discountCodeControls[key]?.value ||
      this.discountCodeControls[key].value.length < 19
    );
  }

  shouldShowAddButton(item): boolean {
    return item && !item?.DiscountCode;
  }

  shouldShowRemoveButton(item): boolean {
    return item && !!item?.DiscountCode;
  }

  getDiscountErrorMessage(item: any): string {
    let key = item?.CreationDate;

    if (!item?.IsInvalid) return null;

    let message = item?.DiscountMessage;
    if (
      message ===
      this.enhancedTravelExtrasTextEnum.RemoveJourneyOnInvalidDiscount
    ) {
      return `${this.enhancedReviewBuyAndDeliveryPageEnum.invalidDiscountMessage}`;
    }
    return message;
  }

  private processBicycleExtras(journey, outExtras, retExtras) {
    let creationDate = journey?.CreationDate; // unique key per journey
    let bikeOut = outExtras.filter(
      (item) =>
        item?.JourneyExtraName === this.appConstantsService.bicycleReservation
    );
    journey[this.enhancedTravelExtrasTextEnum.bikeOutward] =
      bikeOut.length > 0 ? [...bikeOut] : [];
    if (bikeOut.length > 0) {
      bikeOut.forEach((bikeOutItem) => {
        bikeOutItem.extraType = this.enhancedTravelExtrasTextEnum.bikeTxt;
        let bikeOutCount = bikeOutItem?.Count;
        journey[this.enhancedTravelExtrasTextEnum.selectedBicycle] =
          bikeOutCount > 0 ? bikeOutCount : bikeOutItem?.AvailableAmount;
        if (bikeOutItem?.IsSelected) {
          this.isBikeExtraChangedMap[creationDate] = false;
          journey[this.enhancedTravelExtrasTextEnum.outwardBicycleReservation] =
            bikeOutCount;
          journey[this.enhancedTravelExtrasTextEnum.isBikeSaved] =
            bikeOutCount > 0;
        }
      });
    }

    let bikeRet = retExtras.filter(
      (item) =>
        item?.JourneyExtraName === this.appConstantsService.bicycleReservation
    );
    journey[this.enhancedTravelExtrasTextEnum.bikeReturn] =
      bikeRet.length > 0 ? [...bikeRet] : [];
    if (bikeRet.length > 0) {
      bikeRet.forEach((bikeRetItem) => {
        bikeRetItem.extraType = this.enhancedTravelExtrasTextEnum.bikeTxt;
        let bikeRetCount = bikeRetItem?.Count;
        journey[this.enhancedTravelExtrasTextEnum.selectedBicycleReturn] =
          bikeRetCount > 0 ? bikeRetCount : bikeRetItem?.AvailableAmount;
        if (bikeRetItem?.IsSelected) {
          journey[this.enhancedTravelExtrasTextEnum.returnBicycleReservation] =
            bikeRetCount;
          this.isBikeExtraChangedMap[creationDate] = false;
          journey[this.enhancedTravelExtrasTextEnum.isBikeSaved] =
            bikeRetCount > 0;
        }
      });
    }
  }

  private processPlusBusExtras(journey, outExtras, retExtras) {
    journey[this.enhancedTravelExtrasTextEnum.outwardPlusBusReservePrice] = 0;
    journey[this.enhancedTravelExtrasTextEnum.returnPlusBusReservePrice] = 0;

    let pbOut = outExtras.filter(
      (item) => item?.JourneyExtraName === this.appConstantsService.plusBus
    );
    if (pbOut.length > 0) {
      journey[this.enhancedTravelExtrasTextEnum.plusBusOutward] = [...pbOut];
      pbOut.forEach((plusBusOutItem) => {
        plusBusOutItem.extraType = this.enhancedTravelExtrasTextEnum.plusBusTxt;
        // Only assign if IsSelected is true
        if (plusBusOutItem?.IsSelected) {
          journey[
            this.enhancedTravelExtrasTextEnum.outwardPlusBusReservePrice
          ] += plusBusOutItem?.Price;
          this.isPlusBusExtraChangedMap[journey?.CreationDate] = false;
        }
      });
    }

    let pbRet = retExtras.filter(
      (item) => item?.JourneyExtraName === this.appConstantsService.plusBus
    );
    if (pbRet.length > 0) {
      journey[this.enhancedTravelExtrasTextEnum.plusBusReturn] = [...pbRet];
      pbRet.forEach((plusBusRetItem) => {
        plusBusRetItem.extraType = this.enhancedTravelExtrasTextEnum.plusBusTxt;
        // Only assign if IsSelected is true
        if (plusBusRetItem?.IsSelected) {
          journey[
            this.enhancedTravelExtrasTextEnum.returnPlusBusReservePrice
          ] += plusBusRetItem?.Price;
          this.isPlusBusExtraChangedMap[journey?.CreationDate] = false;
        }
      });
    }

    // Total aur flags isi journey object me hi update ho jaaye
    let outward =
      journey[this.enhancedTravelExtrasTextEnum.outwardPlusBusReservePrice] ||
      0;
    let ret =
      journey[this.enhancedTravelExtrasTextEnum.returnPlusBusReservePrice] || 0;

    journey[this.enhancedTravelExtrasTextEnum.totalPlusBusReservePrice] =
      outward + ret;
    journey[this.enhancedTravelExtrasTextEnum.isPlusBusSaved] =
      outward > 0 || ret > 0;
  }

  private processTravelCardExtras(journey, outExtras, retExtras) {
    let travelOut = outExtras.filter(
      (e) => e?.JourneyExtraName === this.appConstantsService.londonTravelcard
    );
    let travelRet = retExtras.filter(
      (e) => e?.JourneyExtraName === this.appConstantsService.londonTravelcard
    );

    // Split Peak vs OffPeak for outward
    journey.travelcardOutwardPeak = travelOut.filter(
      (tc) =>
        tc?.ServiceName?.toLowerCase().includes("peak") &&
        !tc?.ServiceName?.toLowerCase().includes("offpeak")
    );
    journey.travelcardOutwardOffPeak = travelOut.filter((tc) =>
      tc?.ServiceName?.toLowerCase().includes("offpeak")
    );

    // Split Peak vs OffPeak for return
    journey.travelcardReturnPeak = travelRet.filter(
      (tc) =>
        tc?.ServiceName?.toLowerCase().includes("peak") &&
        !tc?.ServiceName?.toLowerCase().includes("offpeak")
    );
    journey.travelcardReturnOffPeak = travelRet.filter((tc) =>
      tc?.ServiceName?.toLowerCase().includes("offpeak")
    );

    // Add extraType to all for consistent handling
    [...travelOut, ...travelRet].forEach(
      (item) =>
        (item.extraType = this.enhancedTravelExtrasTextEnum.travelCardTxt)
    );

    journey.isLondonTravelSaved = [...travelOut, ...travelRet].some(
      (t) => t?.Count > 0
    );

    // Separate selection index for outward peak
    let selectedOutPeakIndex = journey.travelcardOutwardPeak.findIndex(
      (tc) => tc?.IsSelected
    );
    if (selectedOutPeakIndex !== -1) {
      journey.outwardSelectedTravelCardPeak = selectedOutPeakIndex;
    }

    // Separate selection index for outward offpeak
    let selectedOutOffPeakIndex = journey.travelcardOutwardOffPeak.findIndex(
      (tc) => tc?.IsSelected
    );
    if (selectedOutOffPeakIndex !== -1) {
      journey.outwardSelectedTravelCardOffPeak = selectedOutOffPeakIndex;
    }

    // Separate selection index for return peak
    let selectedRetPeakIndex = journey.travelcardReturnPeak.findIndex(
      (tc) => tc?.IsSelected
    );
    if (selectedRetPeakIndex !== -1) {
      journey.returnSelectedTravelCardPeak = selectedRetPeakIndex;
    }

    // Separate selection index for return offpeak
    let selectedRetOffPeakIndex = journey.travelcardReturnOffPeak.findIndex(
      (tc) => tc?.IsSelected
    );
    if (selectedRetOffPeakIndex !== -1) {
      journey.returnSelectedTravelCardOffPeak = selectedRetOffPeakIndex;
    }

    let selectedTravelCard = [...travelOut, ...travelRet].find(
      (t) => t?.IsSelected && t?.Count > 0
    );
    if (selectedTravelCard) {
      journey[
        this.enhancedTravelExtrasTextEnum.outwardLondonTravelReservePrice
      ] = selectedTravelCard?.Price;
      journey.isLondonTravelSaved = true;
      // this.hasSavedTravelCard = true;
      this.isTravelCardChanged = false;
    } else {
      journey.isLondonTravelSaved = false;
    }
  }

  topParentPanelOpened(journey, journeyIndex): void {
    // Manually trigger change detection so inner accordions are correctly initialized
    this.cdr.detectChanges();
    this.selectedDeliveryMode = journey?.DeliveryDetail[0]?.DeliveryModeType;
    this.selectedJourneyAccordion = journeyIndex;
    this.isAccordion = true;
    this.setDeliveryModesData();
    this.scrollToPanel(this.selectedJourneyAccordion);
    this.selectedPassengerIndex = null;
    this.selectAllPassengersInSmartCard = {};
    this.blankSmartCardNumber = {};
    let totalPax =
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.Adult +
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.Child;
    this.setPostDilveryFormDetail();
    this.getOrderSmartCardDetails(
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]
    );
    if (
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.DeliveryDetail[0].DeliveryModeName ===
        this.appRouteEnum?.DeliveryMode_Smart_Card &&
      totalPax > 1
    ) {
      this.setSelectedDeliveryModeDetail();
    }
  }

  onClickAddDeliveryMode(deliveryMode: string, journey: any, event, journeyIndex) {
      if (this.checkEventTypeOrCode(event)) {
        if(this.conditionToCheckDeliveryModeTypeWithBlankAddress()){
          this.inValidAddress[this.selectedJourneyAccordion] =  true;
          this.timeoutRef = setTimeout(() => {
            this.inValidAddress[this.selectedJourneyAccordion] = false;
          }, 10000);
          return false;
        }
        this.commonServices.loaderRequired = true;
        this.callingRedirectOnSearchResultPageWhenClickOnDeliveryMode(journeyIndex);
        this.deliveryModeRequest.DeliveryMode = deliveryMode;
  
        this.setDeliveryTypeValueInDeliveryModeRequest(deliveryMode);
        
        if (deliveryMode == this.appRouteEnum.DeliveryMode_TOD) {
          this.deliveryModeRequest.Address = null;
          this.deliveryModeRequest.DeliveryMode = this.defaultDeliveryMode;
        }
        else if (deliveryMode == this.appRouteEnum.DeliveryModeETicket) {
          this.deliveryModeRequest.Address = null;
          this.postDeliveryForm.clearValidators();
          this.postDeliveryForm.updateValueAndValidity();
          this.deliveryModeRequest.DeliveryMode = deliveryMode;
        }
        else if (this.checkDeliveryModeIsNextDayOrFirstClass(deliveryMode)) {
          this.deliveryModeRequest.Address =  this.billingAddresses[this.defaultDeliveryAddressIndexPost]?.Address;
        let checkDeliveryForPost = this.isDeliveryModesCheckedStep1ForPost();
        if (!checkDeliveryForPost && checkDeliveryForPost !== undefined) {
          return false;
        }
      } else if (deliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card) {
          this.deliveryModeRequest.Address = this.smartCardBillingAddress[this.defaultDeliveryAddressIndex]?.Address;
        let smartCardCheckedValue =
          this.getSmartCardDeliveryCheckedValue(journeyIndex);
        if (!smartCardCheckedValue && smartCardCheckedValue !== undefined) {
          return false;
        }
      }
      this.deliveryModeRequest.DeliveryCache = this.deliveryModeCache;
      this.deliveryModeRequest.reviewBuyCache = this.reviewBuyCache;
      this.deliveryModeRequest.journeyCreationDate = journey.CreationDate;
      this.deliveryModeRequest.PreviousCache = this.sharedService.previousCache;
      this.deliveryModeRequest.IsNreBasket = this.isNreBasket;
      this.deliveryModeRequest.IsAdult =
        this.checkIfSearchResultIsHavingAdultsOrNot(); //PICO-2150 added a property for check passanger added to smart card adult or child
      this.getIsSeasonValueInCaseOfTravelSolutionDirection();
      this.sendDeliveryModeRequestData(deliveryMode);
    }
  }

  checkEventTypeOrCode(event) {
    return (
      event.type == "click" ||
      event.keyCode === 13 ||
      event.value == "TOD" ||
      event.value == "ETICKET"
    );
  }

  callingRedirectOnSearchResultPageWhenClickOnDeliveryMode(journeyIndex) {
    if (
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[journeyIndex]
        ?.DeliveryModesDto.DeliveryMode.length == 0
    ) {
      let noDeliveryMsgsObj = {
        notificationErrorMsg:
          this.notificationErrorMsg.noDeliveryModeInformation,
        notificationTitle:
          this.notificationErrorMsg.deliveryModesUnavailabitilyTitle,
      };
      let dialogRef = this.commonServices.enhancedCommonNotificationDialog(
        "review-nodelivery-common-notification-dialog",
        noDeliveryMsgsObj,
        this.commonIconImg.exclamationIConImgForNoDelivery,
        true,
        false,
        false,
        true
      );
      dialogRef.afterClosed().subscribe(() => {
        this.redirectingOnSearchResultsPage();
      });
    }
  }

  setDeliveryTypeValueInDeliveryModeRequest(deliveryMode) {
    if (deliveryMode == this.appRouteEnum.DeliveryMode_FRTNEXTDAY) {
      this.deliveryModeRequest.DeliveryType =
        this.appRouteEnum.DeliveryMode_NEXTDAYDELIVERY;
      this.isChangeAddressOfPostDelivery = true;
    } else if (deliveryMode == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS) {
      this.deliveryModeRequest.DeliveryType =
        this.appRouteEnum.DeliveryMode_FIRSTCLASSPOST;
      this.isChangeAddressOfPostDelivery = true;
    } else {
      this.deliveryModeRequest.DeliveryType = "";
    }
  }

  checkDeliveryModeIsNextDayOrFirstClass(deliveryMode) {
    return (
      deliveryMode == this.appRouteEnum.DeliveryMode_FRTNEXTDAY ||
      deliveryMode == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS
    );
  }

  isDeliveryModesCheckedStep1ForPost() {
    this.postDeliveryForm.clearValidators();
    this.postDeliveryForm.updateValueAndValidity();
    if (
      this.billingAddresses == null ||
      this.billingAddresses.length == 0 ||
      this.deliveryModeRequest.Address == null
    ) {
      alert("Address is required.");
      return false;
    }
    if (this.postDeliveryForm.valid) {
      this.deliveryModeRequest.Title = this.postDeliveryForm.get("title").value;
      this.deliveryModeRequest.Name = this.postDeliveryForm.get("name").value;
      this.deliveryModeRequest.Surname =
        this.postDeliveryForm.get("surname").value;
    } else {
      return false;
    }
  }

  // call method in case of smart card delivery mode on continue
  getSmartCardDeliveryCheckedValue(journeyIndex) {
    if (this.isOrderSmartCard[this.selectedJourneyAccordion]) {
      let getOrderSmartCardValue = this.checkOrderSmartCardDetail(journeyIndex);
      if (!getOrderSmartCardValue && getOrderSmartCardValue !== undefined) {
        return false;
      }
    } else {
      this.deliveryModeRequest.SmartCardDelivery = new Array<SmartCardInfo>();
      let passangerSmartCard = this.checkPassangerSmartCardDetail(journeyIndex);
      if (!passangerSmartCard && passangerSmartCard !== undefined) {
        return false;
      }
    }
  }

  checkIfSearchResultIsHavingAdultsOrNot() {
    return this.sharedService.searchRequest.Adult > 0 ? true : false;
  }

  getIsSeasonValueInCaseOfTravelSolutionDirection() {
    if (
      this.sharedService.searchRequest.TravelSolutionDirection ==
        this.travelSolutionDirectionEnum.season ||
      this.sharedService.searchRequest.TravelSolutionDirection ==
        this.travelSolutionDirectionEnum.flexi
    ) {
      this.deliveryModeRequest.isSeason = true;
    }
  }

  // call api saveDeliveryMode after click on continue button
  sendDeliveryModeRequestData(deliveryMode) {
    this.enhancedReviewBuyAndDelivery
      .enhancedUpdateDeliveryModes(this.deliveryModeRequest)
      .subscribe((res) => {
        if (res != null) {
          this.commonServices.loaderRequired = false;
          this.spinnerService.hide();
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            this.DeliveryModesDto =
              this.responseData?.Data?.DeliveryAndBasketJourneyResponse?.BasketJourneyResponse?.Journey.map(
                (m) => m.DeliveryModesDto
              );
            this.enhancedReviewBuyAndDeliveryResponse =
              this.responseData.Data.DeliveryAndBasketJourneyResponse.BasketJourneyResponse;
            this.setPreferencesOfGetDeliveryBasketAndResposne();
            this.sharedService.reviewBuyCache =
              this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
            this.reviewBuyCache = this.sharedService.reviewBuyCache;
            this.sharedService.enhancedReviewBuyResponse =
              this.enhancedReviewBuyAndDeliveryResponse;
            this.sharedService.enhancedReviewBuyResponse.ReviewBuyCache =
              this.reviewBuyCache;
            this.isUpdateDeliveryModeOnSelection = true;
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData(
              "sharedSibling",
              this.sharedServiceCache,
              true
            );
            this.commonServices.loaderRequired = true;
            if (deliveryMode == this.appRouteEnum.DeliveryMode_Smart_Card) {
              this.IsDeliveryModeSmartcardSelected = true;
              this.isChangeAddressOfOrderSmartCardDelivery = true;
            } else {
              this.isCheckedTermsCondition = false;
              this.orderSmartcardForm.reset();
            }
            this.setDeliveryAndBasketResponse(this.selectedJourneyAccordion);
            if (
              this.enhancedReviewBuyAndDeliveryResponse?.Journey[
                this.selectedJourneyAccordion
              ]?.DeliveryDetail[0].DeliveryModeName ===
              this.appRouteEnum?.DeliveryMode_Smart_Card
            ) {
              this.setSelectedDeliveryModeDetail();
            } else if (
              this.enhancedReviewBuyAndDeliveryResponse?.Journey[
                this.selectedJourneyAccordion
              ]?.DeliveryDetail[0].DeliveryModeName ===
                this.appRouteEnum?.DeliveryMode_FIRSTCLASSPOST ||
              this.enhancedReviewBuyAndDeliveryResponse?.Journey[
                this.selectedJourneyAccordion
              ]?.DeliveryDetail[0].DeliveryModeName ===
                this.appRouteEnum?.DeliveryMode_NEXTDAYDELIVERY
            ) {
              this.isOrderSmartCard[this.selectedJourneyAccordion] = false;
            }
            this.showOnlySelectedDeliveryType = true;
            this.scrollToElement(
              `${this.enhancedReviewBuyAndDeliveryIdEnum?.selectedDeliveryModeId}${this.selectedJourneyAccordion}`
            );
            let panel =
              this.accordionRefs[
                this.enhancedReviewBuyAndDeliveryIdEnum
                  ?.deliveryModeExpansionPanelId
              ];
            if (this.activePanel && this.activePanel.expanded) {
              this.activePanel.close();
            }
          } else if (this.responseData.ResponseCode == "203") {
            this.invalidJourney = this.responseData.ResponseMessage;
            this.totalPrice = 0;
            this.sharedService.fareBreakdownModelData =
              new Array<FareBreakdownModel>();
          } else {
            console.log(this.responseData.ResponseMessage);
            this.commonServices.showEnhancedCommonErrorPopup();
          }
        }
      });
  }

  // call method in case of order smart card delivery mode on continue
  checkOrderSmartCardDetail(journeyIndex) {
    this.orderSmartcardForm.markAllAsTouched();
    for (const key of Object.keys(this.orderSmartcardForm.controls)) {
      if (this.orderSmartcardForm.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector(
          '[formcontrolname="' + key + '"]'
        );
        if (!!invalidControl) invalidControl.focus();
        return false;
      }
    }
    if (
      this.billingAddresses == null ||
      this.billingAddresses.length == 0 ||
      this.deliveryModeRequest.Address == null
    ) {
      alert("Address is required.");
      return false;
    }
    if (this.orderSmartcardForm.valid) {
      let getOrderSmartCardFormValue =
        this.getOrderSmartCardFormDetail(journeyIndex);
      if (
        !getOrderSmartCardFormValue &&
        getOrderSmartCardFormValue !== undefined
      ) {
        return false;
      }
    } else {
      return false;
    }
  }

  // call method in case of get orderSmartcardForm Data on continue
  getOrderSmartCardFormDetail(journeyIndex) {
    if (this.locationId != undefined && this.locationId != null) {
      this.deliveryModeRequest.GeneralInformation = new GeneralInformation();
      this.deliveryModeRequest.Title =
        this.orderSmartcardForm.get("delPersonTitle").value;
      this.deliveryModeRequest.Name =
        this.orderSmartcardForm.get("delPersonName").value;
      this.deliveryModeRequest.Surname =
        this.orderSmartcardForm.get("delPersonSurname").value;
      this.deliveryModeRequest.GeneralInformation.Name =
        this.orderSmartcardForm.get("Name").value;
      this.deliveryModeRequest.GeneralInformation.Surname =
        this.orderSmartcardForm.get("Surname").value;
      this.deliveryModeRequest.GeneralInformation.SmartcardNickName =
        this.orderSmartcardForm.get("SmartcardNickName").value;
      this.deliveryModeRequest.GeneralInformation.Title =
        this.orderSmartcardForm.get("Title").value;
      this.deliveryModeRequest.GeneralInformation.DateOfBirth = moment(
        this.orderSmartcardForm.get("DateOfBirth").value
      ).format("YYYY-MM-DD");
      console.log(this.orderSmartcardForm.get("DateOfBirth").value);
      if (this.locationId == "") {
        alert(
          this.reviewBuyAndDeliveryErrorMessageEnum
            ?.fillSmartCardLoadStationDetails
        );
        return false;
      }
      if (this.locationId != "") {
        this.locationName = this.locationName.trim();
        this.locationId = this.findLocationCode(this.locationName).toString();
        if (this.locationId == "0") {
          this.locationId = "";
          alert(
            this.reviewBuyAndDeliveryErrorMessageEnum?.enterValidLoadStation
          );
          return false;
        }
      }
      this.deliveryModeRequest.GeneralInformation.LoadSation = this.locationId;
      if (!this.isCheckedTermsCondition) {
        return false;
      }
      // else {
      //   this.isCheckedTermsCondition = false;
      // }
    } else {
      alert(
        this.reviewBuyAndDeliveryErrorMessageEnum
          ?.fillSmartCardLoadStationDetails
      );
      return false;
    }
  }

  // call method in case of get PassangerSmartCardDetail on continue
  checkPassangerSmartCardDetail(journeyIndex) {
    this.smartCardPassengerList.forEach((element) => {
      this.isMultiplePassengerCase =
        this.enhancedReviewBuyAndDeliveryResponse.Journey[
          this.selectedJourneyAccordion
        ]?.Adult +
          this.enhancedReviewBuyAndDeliveryResponse.Journey[
            this.selectedJourneyAccordion
          ]?.Child >
        1;
      if (
        !this.isMultiplePassengerCase &&
        this.adultCount + this.childCount < 1
      ) {
        element.IsAdult =
          this.sharedService.searchRequest.Adult > 0 ? true : false;
        element.IsAdult ? this.adultCount++ : this.childCount++;
      }
    });
    let checkTotalsmartCardPassengerList =
      this.checkPassangerSmartCardDetailStep1(journeyIndex);
    if (
      !checkTotalsmartCardPassengerList &&
      checkTotalsmartCardPassengerList !== undefined
    ) {
      return false;
    }
    let checkTotalPassnger = this.checkPassangerSmartCardDetailStep2();
    if (!checkTotalPassnger && checkTotalPassnger !== undefined) {
      return false;
    }
    this.deliveryModeRequest.SmartCardDelivery = this.smartCardPassengerList;
  }

  // call method for showing notification error in case of invalid smartcard detail
  checkPassangerSmartCardDetailStep1(journeyIndex) {
    let ctrl = this.smartcardCtrl.toArray()[this.selectedPassengerIndex];
    for (let smartCardPassenger of this.smartCardPassengerList) {
      smartCardPassenger.SmartCardNumber =
        this.getSelectedSmartCardNumber(smartCardPassenger);
      if (smartCardPassenger.IsAdult == undefined) {
        this.validatePassengerTypes();
        return false;
      }
      if (this.isExistSmartCardNumber(smartCardPassenger)) {
        if (this.selectedPassengerIndex) {
          ctrl?.control?.setValidators([
            Validators.required,
            Validators.minLength(18),
            Validators.maxLength(18),
          ]);
          ctrl?.control?.markAsTouched();
          ctrl?.control?.updateValueAndValidity();
        } else {
          this.blankSmartCardNumber[this.selectedJourneyAccordion] = true;
          this.timeoutRef = setTimeout(() => {
            this.blankSmartCardNumber[this.selectedJourneyAccordion] = false;
          }, 10000);
        }
        return false;
      }
      if (this.isExistLocationId(smartCardPassenger)) {
        alert(
          this.reviewBuyAndDeliveryErrorMessageEnum
            ?.allPassengerLoadStationDetails
        );
        return false;
      }
      if (smartCardPassenger.LocationId != "") {
        smartCardPassenger.LocationName =
          smartCardPassenger.LocationName.trim();
        smartCardPassenger.LocationId = this.findLocationCode(
          smartCardPassenger.LocationName
        ).toString();
        if (smartCardPassenger.LocationId == "0") {
          smartCardPassenger.LocationId = "";
          alert(
            this.reviewBuyAndDeliveryErrorMessageEnum?.enterValidLoadStation
          );
          return false;
        }
      }
    }
  }

  // call method for showing notification error in case of invalid Passangersmartcard detail
  checkPassangerSmartCardDetailStep2() {
    if (
      this.adultCount + this.childCount <
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.Adult +
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.Child
    ) {
      this.selectAllPassengersInSmartCard[this.selectedJourneyAccordion] = true;
      this.timeoutRef = setTimeout(() => {
        this.selectAllPassengersInSmartCard[this.selectedJourneyAccordion] =
          false;
      }, 10000);
      return false;
    }
    if (
      this.childCount >
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.Child
    ) {
      this.validatePassengerTypes();
      return false;
    }
    if (
      this.adultCount >
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.Adult
    ) {
      this.validatePassengerTypes();
      return false;
    }
  }

  getSelectedSmartCardNumber(smartCardPassenger) {
    if (
      smartCardPassenger.SmartCardNumber == "" ||
      smartCardPassenger.SmartCardNumber == null
    ) {
      return this.selectedSmartCardNumber;
    }
    return smartCardPassenger.SmartCardNumber;
  }

  isExistSmartCardNumberOfLatestJourney(journeyIndex) {
    return (
      this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length > 0 &&
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[journeyIndex]
        ?.DeliveryDetail?.[0]?.SmartCardNumber
    );
  }

  isExistSmartCardNumber(smartCardPassenger) {
    return (
      smartCardPassenger.SmartCardNumber == "" ||
      smartCardPassenger.SmartCardNumber == null
    );
  }

  isExistLocationId(smartCardPassenger) {
    return (
      smartCardPassenger.LocationId == "" ||
      smartCardPassenger.LocationId == undefined ||
      smartCardPassenger.LocationId == "0"
    );
  }

  getDecreaseCountClassForBikeOut(
    bikeOut: any,
    selectedBicycle: number
  ): string {
    let isDisabled =
      (!bikeOut?.IsUserChecked && !bikeOut?.IsSelected) || selectedBicycle == 1;
    return isDisabled
      ? this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasDisabledBtn
      : this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasActiveBtn;
  }

  isOutDecreaseButtonDisabled(bikeOut: any, selectedBicycle: number): boolean {
    return (
      (!bikeOut?.IsUserChecked && !bikeOut?.IsSelected) || selectedBicycle === 1
    );
  }

  isOutIncreaseButtonDisabled(bikeOut: any, selectedBicycle: number): boolean {
    return (
      (!bikeOut?.IsUserChecked && !bikeOut?.IsSelected) ||
      bikeOut?.AvailableAmount === selectedBicycle
    );
  }

  getIncreaseCountClassForBikeOut(
    bikeOut: any,
    selectedBicycle: number
  ): string {
    let isDisabled =
      (!bikeOut?.IsUserChecked && !bikeOut?.IsSelected) ||
      bikeOut?.AvailableAmount === selectedBicycle;
    return isDisabled
      ? this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasDisabledBtn
      : this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasActiveBtn;
  }

  getDecreaseCountClassForBikeRet(
    bikeRet: any,
    selectedBicycleReturn: number
  ): string {
    let isDisabled =
      (!bikeRet?.IsUserChecked && !bikeRet?.IsSelected) ||
      selectedBicycleReturn == 1;
    return isDisabled
      ? this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasDisabledBtn
      : this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasActiveBtn;
  }

  isRetDecreaseButtonDisabled(
    bikeRet: any,
    selectedBicycleReturn: number
  ): boolean {
    return (
      (!bikeRet?.IsUserChecked && !bikeRet?.IsSelected) ||
      selectedBicycleReturn === 1
    );
  }

  isRetIncreaseButtonDisabled(
    bikeRet: any,
    selectedBicycleReturn: number
  ): boolean {
    return (
      (!bikeRet?.IsUserChecked && !bikeRet?.IsSelected) ||
      bikeRet?.AvailableAmount === selectedBicycleReturn
    );
  }

  getIncreaseCountClassForBikeRet(
    bikeRet: any,
    selectedBicycleReturn: number
  ): string {
    let isDisabled =
      (!bikeRet?.IsUserChecked && !bikeRet?.IsSelected) ||
      bikeRet?.AvailableAmount === selectedBicycleReturn;
    return isDisabled
      ? this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasDisabledBtn
      : this.enhancedDynamicClassEnum.enhancedReviewTravelExtrasActiveBtn;
  }

  shouldShowBikeSave(item: any): boolean {
    try {
      let hasCheckedOutward = item?.bikeOutward?.some((bike) =>
        this.isBikeCheckedOrSelected(bike)
      );
      let hasCheckedReturn = item?.bikeReturn?.some((bike) =>
        this.isBikeCheckedOrSelected(bike)
      );
      return item?.isBikeSaved || hasCheckedOutward || hasCheckedReturn;
    } catch (error) {
      console.log(error);
    }
  }

  onTermConditionChange($event) {
    this.isCheckedTermsCondition = $event.checked;
  }

  getValueOnCheckDeliveryModesCount() {
    if (this.deliveryModesCount[this.selectedJourneyAccordion] == 0) {
      let noDeliveryMsgsObj = {
        notificationErrorMsg:
          this.notificationErrorMsg.noDeliveryModeInformation,
        notificationTitle:
          this.notificationErrorMsg.deliveryModesUnavailabitilyTitle,
      };
      let dialogRef = this.commonServices.enhancedCommonNotificationDialog(
        "review-nodelivery-common-notification-dialog",
        noDeliveryMsgsObj,
        this.commonIconImg.exclamationIConImgForNoDelivery,
        true,
        false,
        false,
        true
      );
      dialogRef.afterClosed().subscribe(() => {
        this.redirectingOnSearchResultsPage();
      });
    }
    if (this.deliveryModesCount[this.selectedJourneyAccordion] > 1) {
      if (this.deliveryModesCount[this.selectedJourneyAccordion] == 2) {
        this.showChangeDeliveryButton =
          this.DeliveryModesDto[
            this.selectedJourneyAccordion
          ].DeliveryMode.some(
            (x) =>
              x.DeliveryMode == this.appRouteEnum.DeliveryMode_FRTNEXTDAY &&
              !x.IsHide
          ) &&
          this.DeliveryModesDto[
            this.selectedJourneyAccordion
          ].DeliveryMode.some(
            (x) =>
              x.DeliveryMode == this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS &&
              !x.IsHide
          );
      }
    }
  }

  setDetailsIfSmartCardNumberExistsOfLatestJourney() {
    if (
      this.isExistSmartCardNumberOfLatestJourney(this.selectedJourneyAccordion)
    ) {
      this.IsDeliveryModeSmartcardSelected = true;
      this.selectedSmartCardNumber =
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ].DeliveryDetail[0].SmartCardList;
      this.isChangeAddressOfOrderSmartCardDelivery = true;
      this.isChangeNumberOfSmartCard = true;
    }
  }

  checkDeliveryModeSmartCardSelectedOrNot() {
    if (this.IsDeliveryModeSmartcardSelected) {
      this.IsSmartCardAvailableFlag = true;
    } else {
      this.IsSmartCardAvailableFlag = this.DeliveryModesDto[this.selectedJourneyAccordion]?.IsSmartCardAvailable;
    }
  }

  getShowHideDeliveryModeValueInSetDelivery() {
    let displayFirstClassOrNextDayDelivery = false;
    for (let mode of this.deliveryModes[this.selectedJourneyAccordion]) {
      this.setDetailsWhenDeliveryModeIsTOD(mode);
      this.setDetailsWhenDeliveryModeIsETicket(mode);
      // if delivery mode is first class delivery and it is not hidden
      displayFirstClassOrNextDayDelivery =
        this.setDetailsWhenDeliveryModeIsFirstClass(
          mode,
          displayFirstClassOrNextDayDelivery
        );
      // if delivery mode is next day delivery and it is not hidden
      displayFirstClassOrNextDayDelivery =
        this.setDetailsWhenDeliveryModeIsNextDay(
          mode,
          displayFirstClassOrNextDayDelivery
        );
      //if delivery mode is smart card "SMART_CARD"
      this.setDetailsWhenDeliveryModeIsSmartCard(mode);
    }
  }

  setDetailsWhenDeliveryModeIsTOD(mode) {
    if (mode.DeliveryMode == this.appRouteEnum.DeliveryMode_TOD) {
      this.isHideTod = mode.IsHide;
      this.getIsDeliveryModeTODValue();
      //Check for delivermodecounts incase price more than 1000. TOD will be there but isHideTod will true
      this.setDeliveryModesCountInCaseOfHideTOD();
      //check end
    }
  }

  getIsDeliveryModeTODValue() {
    this.isDeliveryModeTOD = !this.isHideTod;
  }
  setDeliveryModesCountInCaseOfHideTOD() {
    if (this.isHideTod) {
      this.deliveryModesCount[this.selectedJourneyAccordion] -= 1;
    }
  }

  setDetailsWhenDeliveryModeIsETicket(mode) {
    if (mode.DeliveryMode == this.appRouteEnum.DeliveryModeETicket) {
      this.isDeliveryModeEticket = true;
    }
  }

  setDetailsWhenDeliveryModeIsFirstClass(
    mode,
    displayFirstClassOrNextDayDelivery
  ) {
    if (
      this.checkIfDeliveryModeIsNotHideAndFirstClass(
        mode,
        this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS
      )
    ) {
      // add custom hide property
      if (!displayFirstClassOrNextDayDelivery) {
        mode["displayBoth"] = true;
        displayFirstClassOrNextDayDelivery = true;
      } else {
        mode["displayBoth"] = false;
      }
      this.postDeliveryForm
        .get("deliveryType")
        .setValue(this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS);
      this.isDeliveryModeFirstClassPost = true;
      this.firstClassPostPrice = 2;
      this.postDeliveryPrice = 2;
    }
    return displayFirstClassOrNextDayDelivery;
  }

  checkIfDeliveryModeIsNotHideAndFirstClass(mode, deliveryModeEnum) {
    return mode.DeliveryMode == deliveryModeEnum && !mode.IsHide;
  }

  setDetailsWhenDeliveryModeIsNextDay(
    mode,
    displayFirstClassOrNextDayDelivery
  ) {
    if (
      this.checkIfDeliveryModeIsNotHideAndFirstClass(
        mode,
        this.appRouteEnum.DeliveryMode_FRTNEXTDAY
      )
    ) {
      // add custom hide property
      if (!displayFirstClassOrNextDayDelivery) {
        mode["displayBoth"] = true;
        displayFirstClassOrNextDayDelivery = true;
      } else {
        mode["displayBoth"] = false;
      }
      this.postDeliveryForm
        .get("deliveryType")
        .setValue(this.appRouteEnum.DeliveryMode_FRTNEXTDAY);
      this.isDeliveryModeNextDayDelivery = true;
      this.nextDayDeliveryModePrice = 7.5;
      this.postDeliveryPrice = 7.5;
    }
    return displayFirstClassOrNextDayDelivery;
  }

  setDetailsWhenDeliveryModeIsSmartCard(mode) {
    if (
      this.checkIfDeliveryModeIsNotHideAndFirstClass(
        mode,
        this.appRouteEnum.DeliveryMode_Smart_Card
      )
    ) {
      if (this.sharedService.searchRequest?.DepartureLocationName != undefined) {
        this.locationId = this.findLocationCode(
          this.sharedService.searchRequest.DepartureLocationName
        ).toString();
        this.setLocationId();
      } else {
        this.locationId = "";
        this.locationName = "";
      }
      this.IsLoadStationAvailable = this.locationId == "" ? false : true;
      let smartCardList =
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0]?.SmartCardList;
      this.selectedSmartCardNumber =
        smartCardList?.length > 0
          ? smartCardList.map(
              (card) =>
                `${card}||${
                  this.enhancedReviewBuyAndDeliveryResponse?.Journey[
                    this.selectedJourneyAccordion
                  ]?.XmlId
                }`
            )
          : [""];
      this.checkSelectedSmartCardNumberIsNew();
      if (
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0].DeliveryModeName ===
          this.appRouteEnum?.DeliveryMode_Smart_Card &&
        this.selectedSmartCardNumber?.length > 0
      ) {
        this.setSelectedDeliveryModeDetail();
        this.smartCardPassengerList?.forEach((passenger) => {
          passenger.SmartCardNumber =
            passenger.SmartCardNumber == ""
              ? this.selectedSmartCardNumber[0]
              : passenger.SmartCardNumber;
          // Check if the SmartCardNumber exists in the SmartCardList
          if (
            this.selectedSmartCardNumber.includes(passenger.SmartCardNumber)
          ) {
            // Update the xmlId if there is a match
            passenger.xmlId =
              this.enhancedReviewBuyAndDeliveryResponse?.Journey[
                this.selectedJourneyAccordion
              ]?.XmlId; // You can replace this with the new xmlId value or logic to generate the new xmlId
          }
        });
      } else if (
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0].DeliveryModeName !==
          this.appRouteEnum?.DeliveryMode_Smart_Card ||
        this.smartCardPassengerList.length == 0
      ) {
        this.onLoadPassengerList();
      }
    }
  }

  addPassInSmartCard() {
    if (
      this.smartCardPassengerList.length <
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.Adult +
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.Child
    ) {
      let passenger = new SmartCardInfo();
      passenger.IsAdult = undefined;
      passenger.LocationId = this.findLocationCode(
        this.sharedService.searchRequest.DepartureLocationName
      ).toString();
      if (passenger.LocationId != "0") {
        passenger.LocationName =
          this.sharedService.searchRequest.DepartureLocationName;
      } else if (passenger.LocationId == "0") {
        passenger.LocationId = "";
        passenger.LocationName = "";
      }
      passenger.IsLoadStationAvailable =
        passenger.LocationId == "" ? false : true;
      passenger.SmartCardNumber = "";
      passenger.SmartCardNumberText = "";
      passenger.SmartCardNumberSelectedOption = "";
      passenger.IsAddedSmartcard = false;
      passenger.newSmartCardAdded = false;
      passenger.xmlId =
        this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.XmlId;
      this.smartCardPassengerList.push(passenger);
      this.selectAllPassengersInSmartCard[this.selectedJourneyAccordion] =
        false;
    }
  }

  shouldShowTravelCardPanel(item: any): boolean {
    try {
      return (
        item?.travelcardOutwardPeak?.length > 0 ||
        item?.travelcardOutwardOffPeak?.length > 0 ||
        item?.travelcardReturnPeak?.length > 0 ||
        item?.travelcardReturnOffPeak?.length > 0
      );
    } catch (error) {
      console.log(error);
    }
  }

  shouldShowTravelExtrasPanel(item: any): boolean {
    try {
      return (
        item?.plusBusOutward?.length > 0 ||
        item?.plusBusReturn?.length > 0 ||
        item?.travelcardOutwardPeak?.length > 0 ||
        item?.travelcardOutwardOffPeak?.length > 0 ||
        item?.travelcardReturnPeak?.length > 0 ||
        item?.travelcardReturnOffPeak?.length > 0 ||
        item?.bikeOutward?.length > 0 ||
        item?.bikeReturn?.length > 0
      );
    } catch (error) {
      console.log(error);
    }
  }

  formatTravelCardServiceName(serviceName: string): string {
    try {
      if (!serviceName) return "";

      // Remove last word (Peak / OffPeak)
      let withoutLastWord = serviceName.slice(0, serviceName.lastIndexOf(" "));

      // Lowercase all, then only first letter uppercase
      return (
        withoutLastWord.charAt(0).toUpperCase() +
        withoutLastWord.slice(1).toLowerCase()
      );
    } catch (error) {
      console.log(error);
    }
  }

  setEnhancedFareBreakDownModelData(journey) {
    let fareBreakdownModel = new FareBreakdownModel();
    fareBreakdownModel.OutWardJourney = [];
    fareBreakdownModel.ReturnJourney = [];
    fareBreakdownModel.OutwardJourneyExtras = [];
    fareBreakdownModel.ReturnJourneyExtras = [];
    fareBreakdownModel.OutwardJourneyExtrasPerPassenger = [];
    fareBreakdownModel.ReturnJourneyExtrasPerPassenger = [];
    fareBreakdownModel.DeliveryDetails = [];
    fareBreakdownModel.JourneyType = journey.Journey;
    fareBreakdownModel.DiscountPrice = journey.DiscountedPrice;
    fareBreakdownModel.DiscountPercent = Math.floor(
      +journey.DiscountPercent
    ).toString();
    fareBreakdownModel.DiscountType = journey.DiscountType;
    fareBreakdownModel.CreationDate = journey?.CreationDate;
    fareBreakdownModel.departureLocationName = journey?.Departure;
    fareBreakdownModel.arrivalLocationName = journey?.Arrival;
    fareBreakdownModel.JourneyTotalPrice = journey?.JourneyTotalPrice;
    fareBreakdownModel.Adult = journey?.Adult || 0;
    fareBreakdownModel.Child = journey?.Child || 0;
    fareBreakdownModel.XmlId = journey?.XmlId;
    fareBreakdownModel.IsPureReturnJourney = journey?.IsPureReturnJourney;

    this.commonServices.getOutwardFaresBreakData(journey, fareBreakdownModel);

    this.commonServices.getReturnFaresBreakData(journey, fareBreakdownModel);

    if (journey.OutwardJourneyExtras != null) {
      journey.OutwardJourneyExtras?.filter(
        (obj) => obj.IsSelected && obj.Count > 0
      )?.forEach((obj) => {
        let journeyExtra = new JourneyModel();
        journeyExtra.Passenger = obj.FarePerson;
        journeyExtra.PricePerPerson = obj.Price;
        journeyExtra.TotalPrice = obj.Price;
        journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
        journeyExtra.Departure = obj?.Departure;
        fareBreakdownModel.OutwardJourneyExtras.push(journeyExtra);
      });
    }
    if(journey?.OutwardJourneyExtrasPerPassenger?.length > 0){
      journey.OutwardJourneyExtrasPerPassenger?.forEach((obj) => {
        let journeyExtra = new JourneyModel();
        journeyExtra.Passenger = obj.FarePerson;
        journeyExtra.PricePerPerson = obj.BasePrice;
        journeyExtra.TotalPrice = obj.Price;
        journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
        journeyExtra.Departure = obj?.Departure;
        journeyExtra.IsCheck = obj?.IsCheck;
        fareBreakdownModel.OutwardJourneyExtrasPerPassenger.push(journeyExtra);
      });
    }
    if(journey?.ReturnJourneyExtrasPerPassenger?.length > 0){
      journey.ReturnJourneyExtrasPerPassenger?.forEach((obj) => {
        let journeyExtra = new JourneyModel();
        journeyExtra.Passenger = obj.FarePerson;
        journeyExtra.PricePerPerson = obj.BasePrice;
        journeyExtra.TotalPrice = obj.Price;
        journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
        journeyExtra.Departure = obj?.Departure;
        journeyExtra.IsCheck = obj?.IsCheck;
        fareBreakdownModel.ReturnJourneyExtrasPerPassenger.push(journeyExtra);
      });
    }
    if (journey.ReturnJourneyExtras != null) {
      journey.ReturnJourneyExtras?.filter(
        (obj) => obj.IsSelected && obj.Count > 0
      ).forEach((obj) => {
        let journeyExtra = new JourneyModel();
        journeyExtra.Passenger = obj.FarePerson;
        journeyExtra.PricePerPerson = obj.Price;
        journeyExtra.TotalPrice = obj.Price;
        journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
        journeyExtra.Departure = obj?.Departure;
        fareBreakdownModel.ReturnJourneyExtras.push(journeyExtra);
      });
    }

    if (journey?.OutwardDetail) {
      fareBreakdownModel.OutwardDepartureTime = moment(
        journey?.OutwardDetail?.DepartureTime
      ).format("HH:mm");
      fareBreakdownModel.OutwardArrivalTime = moment(
        journey?.OutwardDetail?.ArrivalTime
      ).format("HH:mm");
      fareBreakdownModel.OutwardDuration = journey?.OutwardDetail?.Duration;
      fareBreakdownModel.OutChanges = journey?.OutwardDetail?.Changes;
      fareBreakdownModel.DepartureDate = journey?.OutwardDetail?.DepartureTime;
      fareBreakdownModel.OpenReturnExpiryDate = journey?.OutwardDetail?.OpenReturnExpiryDate;
      if(journey?.OutwardDetail?.OpenReturnExpiryDate) {
        fareBreakdownModel.ReturnDepartureTime = moment(
          journey?.ReturnDetail?.DepartureTime
        ).format("HH:mm");
        fareBreakdownModel.ReturnArrivalTime = moment(
          journey?.ReturnDetail?.ArrivalTime
        ).format("HH:mm");
        fareBreakdownModel.ReturnDuration = journey?.ReturnDetail?.Duration;
        fareBreakdownModel.RetChanges = journey?.ReturnDetail?.Changes;
        fareBreakdownModel.ReturnDate = journey?.ReturnDetail?.DepartureTime;
        fareBreakdownModel.IsReturnJourney = true;
      }
    }

    if (journey?.ReturnDetail) {
      fareBreakdownModel.ReturnDepartureTime = moment(
        journey?.ReturnDetail?.DepartureTime
      ).format("HH:mm");
      fareBreakdownModel.ReturnArrivalTime = moment(
        journey?.ReturnDetail?.ArrivalTime
      ).format("HH:mm");
      fareBreakdownModel.ReturnDuration = journey?.ReturnDetail?.Duration;
      fareBreakdownModel.RetChanges = journey?.ReturnDetail?.Changes;
      fareBreakdownModel.ReturnDate = journey?.ReturnDetail?.DepartureTime;
      fareBreakdownModel.IsReturnJourney = true;
    }

    this.fareBreakForDeliveryDetail(journey, fareBreakdownModel);

    // Instead of pushing blindly → update if already exists
    let index = this.fareBreakDownData.findIndex(
      (x) => x?.CreationDate === journey?.CreationDate
    );

    if (index !== -1) {
      // replace existing
      this.fareBreakDownData[index] = fareBreakdownModel;
    } else {
      // add new
      this.fareBreakDownData.push(fareBreakdownModel);
    }
    this.sharedService.fareBreakdownModelData = this.fareBreakDownData;
  }

  checkSmartCardDelectedOrNot() {
    if (
      this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length > 0 &&
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ].DeliveryDetail[0] &&
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ].DeliveryDetail[0].DeliveryModeType ==
        this.appRouteEnum.DeliveryMode_Smart_Card
    ) {
      return true;
    } else {
      return false;
    }
  }

  setDetailForBillingAddressInCaseOfSmartCardNumber() {
    this.smartCardBillingAddress = [];
    let selectedAddressForOrderSmartCard =
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ].SelectedDeliveryAddress;
    let clonedArrForSmartCardDeliveryAddress: any[] = JSON.parse(
      JSON.stringify(
        this.DeliveryModesDto[this.selectedJourneyAccordion]?.Addresses
      )
    );
    if (selectedAddressForOrderSmartCard) {
      for (let [
        index,
        DeliveryModesDtoAddress,
      ] of clonedArrForSmartCardDeliveryAddress.entries()) {
        if (
          selectedAddressForOrderSmartCard?.Address1.includes(
            DeliveryModesDtoAddress?.Address?.Address1
          )
        ) {
          DeliveryModesDtoAddress.IsDefault = true;
          this.defaultDeliveryAddressIndex = index;
        } else {
          DeliveryModesDtoAddress.IsDefault = false;
        }
      }
    }
    this.smartCardBillingAddress = JSON.parse(
      JSON.stringify(clonedArrForSmartCardDeliveryAddress)
    );
  }

  checkForGroupSaveRailcard(railCardPrice) {
    return railCardPrice?.filter(
      (item) =>
        item.Railcard.toLowerCase() ===
        this.appRouteEnum?.groupSave?.toLowerCase()
    ).length;
  }

  HasReservationTimeExpiredForAnyJourney() {
    try {
      let journeyDetailObject =
        this.commonServices.checkIfJourneyHsExpiredOrNot(
          this.enhancedReviewBuyAndDeliveryResponse
        );
      this.expiredJounreyDetailObject = journeyDetailObject;
      if (journeyDetailObject.isJourneyExpired) {
        let expiredJourneyRemovedMsgsObj = {
          notificationErrorMsg:
            this.notificationErrorMsg.expiredJourneyNotificationMessage,
          notificationTitle:
            this.notificationErrorMsg.expiredJourneyNotificationTitle,
        };
        let dialogRef = this.commonServices.enhancedCommonNotificationDialog(
          "expired-journey-removed-notification-dialog",
          expiredJourneyRemovedMsgsObj,
          "",
          false,
          false,
          false,
          false
        );
        dialogRef.afterClosed().subscribe(() => {
          this.removeJourneyWhenExpired(
            journeyDetailObject.removeJourneyArrayObject[0].journeyCreationDate,
            0
          );
        });
      } else {
        this.openPaymentDetails();
      }
    } catch (error) {
      console.log(error);
      this.openPaymentDetails();
    }
  }

  removeJourneyWhenExpired(journeyCreatationDate, index) {
    this.removeJourneyRequest.JourneyCreationDate = journeyCreatationDate;
    this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
    this.removeJourneyRequest.IsNreBasket =
      this.enhancedReviewBuyAndDeliveryResponse.IsNreBasket;
    this.removeJourneyData(this.removeJourneyRequest, index);
  }

  showReservationMessage(selectedJourney, outwardOrReturnSeat, isReturn) {
    let legDetail = isReturn
      ? selectedJourney?.ReturnDetail
      : selectedJourney?.OutwardDetail;

    // Check if there are no seats or invalid seat data
    let hasNoSeats =
      !outwardOrReturnSeat?.Seat || outwardOrReturnSeat?.Seat.length === 0;
    let isCoachNumberInvalid =
      outwardOrReturnSeat?.Seat?.[0]?.CoachNumber === "*";

    // If ticket type is offPeak or anytime
    if (
      legDetail?.TicketType?.includes(
        this.enhancedPrefixOfTicketTypeEnum?.offPeak
      ) ||
      legDetail?.TicketType?.includes(
        this.enhancedPrefixOfTicketTypeEnum?.anytime
      )
    ) {
      if (!hasNoSeats && !isCoachNumberInvalid) {
        // Seat reserved message
        return outwardOrReturnSeat?.SaleCompanyName?.includes(
          this.enhancedOperatorNameEnum?.avanti
        )
          ? this.enhancedReservationMessageEnum
              ?.seatReservedForAvantiFlexibleTicket
          : this.enhancedReservationMessageEnum
              ?.seatReservedForNonAvantiFlexibleTicket;
      }

      // No seat reservation message
      return this.enhancedReservationMessageEnum
        ?.noSeatReservationForAllTOCFlexibleTicket;
    }

    // If ticket type is not offPeak or anytime (i.e., it's flexible)
    if (!hasNoSeats && !isCoachNumberInvalid) {
      return this.enhancedReservationMessageEnum
        ?.seatReservedForAllTOCNonFlexibleTicket;
    }

    // No seat reserved message
    return this.enhancedReservationMessageEnum
      ?.noSeatReservedForAllTOCNonFlexibleTicket;
  }

  fareBreakForDeliveryDetail(journey, fareBreakdownModel) {
    if (journey.DeliveryDetail != null) {
      journey.DeliveryDetail.forEach((obj) => {
        let journeyDelivery = new JourneyModel();
        journeyDelivery.Passenger = obj.FarePerson;
        journeyDelivery.PricePerPerson = obj.Price;
        journeyDelivery.TotalPrice = obj.Price;
        journeyDelivery.JourneyDeliveryTitle = obj.DeliveryModeName;

        if (
          obj.DeliveryModeName == this.appRouteEnum.DeliveryMode_NEXTDAYDELIVERY
        ) {
          this.nextDayDeliveryModePrice = obj.Price;
        } else if (
          obj.DeliveryModeName == this.appRouteEnum.DeliveryMode_FIRSTCLASSPOST
        ) {
          this.firstClassPostPrice = obj.Price;
        }

        // Update/replace if already exists
        let index = fareBreakdownModel.DeliveryDetails.findIndex(
          (d) => d?.JourneyDeliveryTitle === obj?.DeliveryModeName
        );
        if (index !== -1) {
          fareBreakdownModel.DeliveryDetails[index] = journeyDelivery;
        } else {
          fareBreakdownModel.DeliveryDetails.push(journeyDelivery);
        }
      });
    }
  }

  openPriceBreakdown() {
    this.dialog.open(EnhancedPriceBreakdownDialogs, {
      disableClose: true,
      panelClass: [
        this.enhancedDynamicClassEnum?.enhancedFooterPriceBreakDownPanelClass,
      ],
      width: "45rem",
      autoFocus: false,
      data: {
        searchRequest: this.searchRequest,
        selectedJourneyIndex: this.selectedJourneyAccordion,
        isReviewBuy: this.isExistDeliveryAndReviewPage(),
      },
    });
  }

  getSortedDeliveryModes(item: any) {
    return item?.DeliveryModesDto?.DeliveryMode?.filter((mode) => {
      if (mode.IsHide) {
        return false;
      }
      if (item?.Adult > 0 && item?.Child > 0 && mode.DeliveryMode === this.appRouteEnum.DeliveryMode_Smart_Card) {
        return false;
      }
      return true;
    })
    ?.sort((a, b) => {
      return (
        this.orderOfDeliveryModes.indexOf(a.DeliveryMode) -
        this.orderOfDeliveryModes.indexOf(b.DeliveryMode)
      );
    });
  }

  useSamePersonalInfoForSmartCardDelivery(event) {
    this.usePersonalInfoCheckbox = event?.checked;
    if (event?.checked) {
      this.orderSmartcardForm
        .get("delPersonTitle")
        ?.patchValue(this.orderSmartcardForm.get("Title").value);
      this.orderSmartcardForm
        .get("delPersonName")
        ?.patchValue(this.orderSmartcardForm.get("Name").value);
      this.orderSmartcardForm
        .get("delPersonSurname")
        ?.patchValue(this.orderSmartcardForm.get("Surname").value);
    } else {
      this.orderSmartcardForm.get("delPersonTitle")?.reset();
      this.orderSmartcardForm.get("delPersonName")?.reset();
      this.orderSmartcardForm.get("delPersonSurname")?.reset();
    }
  }

  changeTitleInSmarCardDetail() {
    this.orderSmartcardForm.get("Title")?.valueChanges.subscribe((value) => {
      if (value && this.usePersonalInfoCheckbox) {
        this.orderSmartcardForm.get("delPersonTitle")?.patchValue(value);
      }
    });
  }

  changeFirstNameInSmartCardDetail() {
    this.orderSmartcardForm.get("Name")?.valueChanges.subscribe((value) => {
      if (value && this.usePersonalInfoCheckbox) {
        this.orderSmartcardForm.get("delPersonName")?.patchValue(value);
      }
    });
  }

  changeSurNameInSmartCardDetail() {
    this.orderSmartcardForm.get("Surname")?.valueChanges.subscribe((value) => {
      if (value && this.usePersonalInfoCheckbox) {
        this.orderSmartcardForm.get("delPersonSurname")?.patchValue(value);
      }
    });
  }

  getPassangerOfFareBreakDownJourneyExtras(
    fareBreakDownJourneyExtras,
    selectedJourneyExtras,
    journey
  ) {
    if (
      selectedJourneyExtras.ServiceName?.toLowerCase() ==
      this.ga4DataLayerEnum?.bikeReservation?.toLowerCase()
    ) {
      this.getPassangerOfFareBreakDownJourneyExtrasInCaseBike(
        fareBreakDownJourneyExtras,
        journey
      );
    } else {
      if (this.searchRequest.Adult != 0 && this.searchRequest.Child != 0) {
        fareBreakDownJourneyExtras.Passenger =
          this.searchRequest.Adult +
          ` ${this.enhancedPassangerTypeEnum?.adultText}` +
          ", " +
          this.searchRequest.Child +
          ` ${this.enhancedPassangerTypeEnum?.ChildText}`;
      } else if (
        this.searchRequest.Adult == 0 &&
        this.searchRequest.Child != 0
      ) {
        fareBreakDownJourneyExtras.Passenger =
          this.searchRequest.Child +
          ` ${this.enhancedPassangerTypeEnum?.ChildText}`;
      } else if (
        this.searchRequest.Adult != 0 &&
        this.searchRequest.Child == 0
      ) {
        fareBreakDownJourneyExtras.Passenger =
          this.searchRequest.Adult +
          ` ${this.enhancedPassangerTypeEnum?.adultText}`;
      }
    }
  }

  getPassangerOfFareBreakDownJourneyExtrasInCaseBike(
    fareBreakDownJourneyExtras,
    journey
  ) {
    if (this.searchRequest.Adult != 0 && this.searchRequest.Child != 0) {
      fareBreakDownJourneyExtras.Passenger =
        journey.SelectCount +
        ` ${this.enhancedPassangerTypeEnum?.adultText}, ${this.enhancedPassangerTypeEnum?.ChildText}`;
    } else if (this.searchRequest.Adult == 0 && this.searchRequest.Child != 0) {
      fareBreakDownJourneyExtras.Passenger =
        journey.SelectCount + ` ${this.enhancedPassangerTypeEnum?.ChildText}`;
    } else if (this.searchRequest.Adult != 0 && this.searchRequest.Child == 0) {
      fareBreakDownJourneyExtras.Passenger =
        journey.SelectCount + ` ${this.enhancedPassangerTypeEnum?.adultText}`;
    }
  }

  isCheckedJourneyExtraChangeInReturn(fareBreakDownJourneyExtras, isReturn) {
    if (isReturn) {
      this.sharedService.fareBreakdownModelData[
        this.selectedJourneyAccordion
      ].ReturnJourneyExtras.push(fareBreakDownJourneyExtras);
    } else {
      this.sharedService.fareBreakdownModelData[
        this.selectedJourneyAccordion
      ].OutwardJourneyExtras.push(fareBreakDownJourneyExtras);
    }
  }

  isNotCheckedJourneyExtraChangeInCaseOfReturn(
    selectedJourneyExtras,
    isReturn,
    journey
  ) {
    if (isReturn) {
      if (
        selectedJourneyExtras.JourneyExtraName ==
        this.appConstantsService.plusBus
      ) {
        this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].ReturnJourneyExtras = this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].ReturnJourneyExtras.filter(
          (i) => i.SolutionNodeRef != journey.SolutionNodeRef
        );
      } else {
        this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].ReturnJourneyExtras = this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].ReturnJourneyExtras.filter(
          (i) =>
            i.OfferId != journey.OfferId && i.ServiceId != journey.ServiceId
        );
      }
    } else {
      if (
        selectedJourneyExtras.JourneyExtraName ==
        this.appConstantsService.plusBus
      ) {
        this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].OutwardJourneyExtras = this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].OutwardJourneyExtras.filter(
          (i) => i.SolutionNodeRef != journey.SolutionNodeRef
        );
      } else {
        this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].OutwardJourneyExtras = this.sharedService.fareBreakdownModelData[
          this.selectedJourneyAccordion
        ].OutwardJourneyExtras.filter(
          (i) =>
            i.OfferId != journey.OfferId && i.ServiceId != journey.ServiceId
        );
      }
    }
  }

  goBackToSearchResults() {
    this.sharedService.isStationListAPILoaderRequired = false;
    if (
      this.isAddedDeliveryForJourney(this.enhancedReviewBuyAndDeliveryResponse)
    ) {
      this.commonServices.IsDeliveryModesAddedForSelectedJourneyOrNot();
      return;
    }
    this.enhancedOpenGoBack();
  }

  isAddedDeliveryForJourney(enhancedReviewBuyAndDeliveryResponse) {
    return (
      enhancedReviewBuyAndDeliveryResponse &&
      enhancedReviewBuyAndDeliveryResponse?.BasketCount > 0 &&
      !enhancedReviewBuyAndDeliveryResponse.IsDeliveryAddedForJourney
    );
  }

  selectedDeleteAddress() {
    if (this.DeliveryModesDto[0].Addresses.length > 0) {
      this.hasDefault = false;
      if (this.DeliveryModesDto[0].Addresses.length > 0) {
        this.setIndexToAddress();
      }
      if (!this.hasDefault) {
        this.DeliveryModesDto[0].Addresses[0].IsDefault = true;
        this.defaultDeliveryAddressIndex = 0;
        this.defaultDeliveryAddressIndexPost = 0;
        this.selectedaddress = this.DeliveryModesDto[0].Addresses[0];
      }
    }
  }

  setIndexToAddress() {
    this.DeliveryModesDto[0].Addresses.forEach((address, index) => {
      if (address.IsDefault) {
        this.defaultDeliveryAddressIndex = index;
        this.defaultDeliveryAddressIndexPost = index;
        this.selectedaddress = this.DeliveryModesDto[0].Addresses[index];
        this.hasDefault = true;
      }
    });
  }

  setDataInDeliveryModeReqForUpdatedAndAddedAddress() {
    if (this.DeliveryModesDto[0].Addresses.length > 0) {
      this.hasDefault = false;
      if (this.DeliveryModesDto[0].Addresses.length > 0) {
        this.setIndexToAddress();
      }
      if (!this.hasDefault) {
        this.DeliveryModesDto[0].Addresses[0].IsDefault = true;
        this.defaultDeliveryAddressIndex = 0;
        this.defaultDeliveryAddressIndexPost = 0;
        this.selectedaddress = this.DeliveryModesDto[0].Addresses[0];
        this.deliveryModeRequest.Address =
          this.DeliveryModesDto[0].Addresses[0].Address;
      }
    }
  }

  isDefaultAvailable(addressarray): boolean {
    for (let address of addressarray) {
      if (address.IsDefault) return true;
    }
    return false;
  }

  private updateChangeExtrasFlags(
    extraType: string,
    isChanged: boolean,
    creationDate: string
  ): void {
    if (!extraType || !creationDate) return;

    switch (extraType.toLowerCase()) {
      case this.enhancedTravelExtrasTextEnum.bikeTxt.toLowerCase():
        this.isBikeExtraChangedMap[creationDate] = isChanged;
        break;

      case this.enhancedTravelExtrasTextEnum.plusBusTxt.toLowerCase():
        this.isPlusBusExtraChangedMap[creationDate] = isChanged;
        break;

      default:
        break;
    }
  }

  ngOnDestroy() {
    this.sharedService.isStationListAPILoaderRequired = false;
    localStorage.removeItem(this.appRouteEnum.isBrowserBackButton);
    if (
      this.router.getCurrentNavigation().trigger == "popstate" &&
      (this.router.url.includes(this.enhancedAppRouteEnum?.searchResult) ||
        this.router.url.includes(
          this.enhancedAppRouteEnum?.selectTicketAndClass
        ))
    ) {
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData(
        "sharedSibling",
        this.sharedServiceCache,
        true
      );
      //Set shared cache data
      this.router
        .navigateByUrl("/" + this.enhancedAppRouteEnum.deliveryAndReviewBy)
        .then(() => {
          if (
            this.isAddedDeliveryForJourney(
              this.enhancedReviewBuyAndDeliveryResponse
            )
          ) {
            this.commonServices.IsDeliveryModesAddedForSelectedJourneyOrNot();
            return;
          }
          this.enhancedOpenGoBack();
        });
    } else if (
      this.router.getCurrentNavigation().trigger == "popstate" &&
      this.router.url.includes(this.enhancedAppRouteEnum?.payment)
    ) {
      if (this.commonServices.isExistJourneyValidForPaymentKey()) {
        this.router
          .navigateByUrl("/" + this.enhancedAppRouteEnum.deliveryAndReviewBy)
          .then(() => {
            if (
              this.isAddedDeliveryForJourney(
                this.enhancedReviewBuyAndDeliveryResponse
              )
            ) {
              this.commonServices.IsDeliveryModesAddedForSelectedJourneyOrNot();
              return;
            }
            this.enhancedOpenGoBack();
          });
      }
    }
    this.postCodeValueChangeSubscription?.unsubscribe();
  }

  enhancedOpenGoBack() {
    this.dialog.open(EnhancedGoBackDialogsComponent, {
      disableClose: true,
      panelClass: [
        this.enhancedDynamicClassEnum.enhancedCommonInfoPopup,
        this.enhancedDynamicClassEnum.enhancedGoBackDialog,
      ],
      width: "45rem",
      autoFocus: false,
    });
  }

  enhancedOpenRemoveJournery() {
    this.dialog.open(EnhancedRemoveJourneyDialogsComponent, {
      disableClose: true,
      panelClass: [
        "enhanced-common-info-popup",
        "enhanced-remove-journey-dialog",
      ],
      width: "45rem",
      autoFocus: false,
    });
  }

  enhancedOpenExpireBasketJournery() {
    this.dialog.open(EnhancedExpireBasketJourneyDialogsComponent, {
      disableClose: true,
      panelClass: ["enhanced-common-info-popup", "enhanced-go-back-dialog"],
      width: "45rem",
      autoFocus: false,
    });
  }

  enhancedOpenExpiredJournery() {
    this.dialog.open(EnhancedExpiredJourneyDialogsComponent, {
      disableClose: true,
      panelClass: ["enhanced-common-info-popup", "enhanced-go-back-dialog"],
      width: "45rem",
      autoFocus: false,
    });
  }

  enhancedChangeDeliveryOption(event, journey, journeyIndex) {
    let dialogRef = this.dialog.open(
      EnhancedChangeDeliveryOptionDialogsComponent,
      {
        disableClose: true,
        panelClass: [
          this.enhancedDynamicClassEnum?.enhancedCommonInfoPopup,
          this.enhancedDynamicClassEnum?.enhancedGoBackDialog,
        ],
        width: "45rem",
        autoFocus: false,
      }
    );
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.selectedSmartcardList = [];
        this.changeDeliveryModeDetail(event, journey, journeyIndex);
        if (
          this.previousSelectedDeliveryMode ===
            this.appRouteEnum?.DeliveryMode_FRTFIRSTCLASS ||
          this.previousSelectedDeliveryMode ===
            this.appRouteEnum?.DeliveryMode_FRTNEXTDAY
        ) {
          let title = localStorage.getItem(this.localStorageEnum?.titleText);
          let firstName = localStorage.getItem(
            this.localStorageEnum?.firstName
          );
          let lastName = localStorage.getItem(
            this.localStorageEnum?.lastNameText
          );
          this.postDeliveryForm.patchValue({
            title: title,
            name: firstName,
            surname: lastName,
          });
        }
        this.previousSelectedDeliveryMode = this.selectedDeliveryMode;
      } else {
        this.selectedDeliveryMode = this.previousSelectedDeliveryMode;
      }
    });
  }

  isCheckedJourneyExtraChange(selectedJourneyExtras, isReturn) {
    if (this.sharedService.journeySummaryModel != null) {
      if (
        selectedJourneyExtras?.JourneyExtraName ==
        this.appConstantsService.londonTravelcard
      ) {
        this.isCheckedForIsReturnInCaseLondonTravel(isReturn);
      } else if (
        selectedJourneyExtras?.JourneyExtraName ==
        this.appConstantsService.plusBus
      ) {
        this.totalPlusBusReservePrice =
          this.totalPlusBusReservePrice + selectedJourneyExtras?.Price;
      } else if (
        selectedJourneyExtras?.JourneyExtraName ==
        this.appConstantsService.bicycleReservation
      ) {
        if (isReturn) {
          this.sharedService.journeySummaryModel.ReturnBicycleReservation =
            true;
        } else {
          this.sharedService.journeySummaryModel.OutwardBicycleReservation =
            true;
        }
      }
    }
  }

  isCheckedForIsReturnInCaseLondonTravel(isReturn) {
    if (isReturn) {
      this.sharedService.journeySummaryModel.ReturnLondonTravelcard = true;
    } else {
      this.sharedService.journeySummaryModel.OutwardLondonTravelcard = true;
    }
  }

  isNotCheckedJourneyExtraChange(selectedJourneyExtras, isReturn) {
    if (this.sharedService.journeySummaryModel != null) {
      if (
        selectedJourneyExtras?.JourneyExtraName ==
        this.appConstantsService.londonTravelcard
      ) {
        this.isNotCheckedForReturnInCaseLondonTravel(isReturn);
      } else if (
        selectedJourneyExtras?.JourneyExtraName ==
        this.appConstantsService.plusBus
      ) {
        if (this.totalPlusBusReservePrice != 0) {
          this.totalPlusBusReservePrice =
            this.totalPlusBusReservePrice - selectedJourneyExtras?.Price;
          this.totalPlusBusReservePrice = parseFloat(
            (Math.round(this.totalPlusBusReservePrice * 100) / 100).toFixed(2)
          );
        }
      } else if (
        selectedJourneyExtras?.JourneyExtraName ==
        this.appConstantsService.bicycleReservation
      ) {
        if (isReturn) {
          this.sharedService.journeySummaryModel.ReturnBicycleReservation =
            false;
        } else {
          this.sharedService.journeySummaryModel.OutwardBicycleReservation =
            false;
        }
      }
    }
  }

  isNotCheckedForReturnInCaseLondonTravel(isReturn) {
    if (isReturn) {
      this.sharedService.journeySummaryModel.ReturnLondonTravelcard = false;
    } else {
      this.sharedService.journeySummaryModel.OutwardLondonTravelcard = false;
    }
  }

  onChangeSmartCard(event: any, passengerIndex) {
    if (!event?.value) {
      this.selectedPassengerIndex = passengerIndex;
    } else {
      this.selectedPassengerIndex = null;
    }
  }

  shouldShowPlusBusSave(item: any): boolean {
    try {
      let hasPlusBusOutward = item?.plusBusOutward?.some(
        (bus) => bus?.IsUserChecked
      );
      let hasPlusBusReturn = item?.plusBusReturn?.some(
        (bus) => bus?.IsUserChecked
      );
      return item?.isPlusBusSaved || hasPlusBusOutward || hasPlusBusReturn;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  shouldShowTravelcardSave(item: any): boolean {
    try {
      let hasTravelcardOutwardPeak = item?.travelcardOutwardPeak?.some(
        (card) => card?.IsUserChecked
      );
      let hasTravelcardOutwardOffPeak = item?.travelcardOutwardOffPeak?.some(
        (card) => card?.IsUserChecked
      );
      let hasTravelcardReturnPeak = item?.travelcardReturnPeak?.some(
        (card) => card?.IsUserChecked
      );
      let hasTravelcardReturnOffPeak = item?.travelcardReturnOffPeak?.some(
        (card) => card?.IsUserChecked
      );

      return (
        item?.isLondonTravelSaved ||
        hasTravelcardOutwardPeak ||
        hasTravelcardOutwardOffPeak ||
        hasTravelcardReturnPeak ||
        hasTravelcardReturnOffPeak
      );
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  filterTravelExtraList(travelList) {
    this.journeyExtras = this.journeyExtras.filter(function (o1) {
      return !travelList.some(function (o2) {
        return (
          o1.OfferId === o2.OfferId &&
          o1.ServiceId === o2.ServiceId &&
          o1.SolutionNodeRef === o2.SolutionNodeRef
        );
      });
    });
  }

  filterTravelExtra(travelList) {
    this.journeyExtras = this.journeyExtras.filter(function (journeyExtra) {
      return !travelList.some(function (o2) {
        return (
          journeyExtra.OfferId === o2.OfferId &&
          journeyExtra.ServiceId === o2.ServiceId &&
          journeyExtra.IsReturn === o2.IsReturn
        );
      });
    });
  }

  createTravelExtraObj(selected, isReturn) {
    let journey = new TravelExtraList();
    journey.OfferId = selected?.OfferId;
    journey.ServiceId = selected?.ServiceId;
    journey.IsReturn = isReturn;
    journey.SolutionNodeRef = selected?.SolutionNodeRef;
    journey.SelectCount = selected?.AvailableAmount;
    journey.extraType = selected?.extraType;
    return journey;
  }

  private handleBeforeSaveTravelCard(
    checked: boolean,
    journey: TravelExtraList,
    travelCardObj: any[],
    value: any,
    isReturn: boolean
  ) {
    this.journeyExtras = []; // only 1 at a time

    if (checked) {
      this.removeExistingExtrasFromFareBreakdown(travelCardObj, isReturn);
      isReturn
        ? this.setReturnTravelCardPrice(value)
        : this.setOutwardTravelCardPrice(value);

      this.filterTravelExtraList(travelCardObj);
      this.journeyExtras.push({ ...journey, IsAddTravelExtra: true });
    } else {
      this.subtractOutAndRetTravelCardPrice(value, isReturn);
      this.filterTravelExtra(travelCardObj);
    }
  }

  private removeExistingExtrasFromFareBreakdown(
    travelCardObj: any[],
    isReturn: boolean
  ) {
    let modelData = this.sharedService.fareBreakdownModelData;
    if (isReturn) {
      modelData[this.selectedJourneyAccordion].ReturnJourneyExtras = modelData[
        this.selectedJourneyAccordion
      ].ReturnJourneyExtras.filter(
        (o1) =>
          !travelCardObj.some(
            (o2) =>
              o1.OfferId === o2.OfferId &&
              o1.ServiceId === o2.ServiceId &&
              o1.SolutionNodeRef === o2.SolutionNodeRef
          )
      );
    } else {
      modelData[this.selectedJourneyAccordion].OutwardJourneyExtras = modelData[
        this.selectedJourneyAccordion
      ].OutwardJourneyExtras.filter(
        (o1) =>
          !travelCardObj.some(
            (o2) =>
              o1.OfferId === o2.OfferId &&
              o1.ServiceId === o2.ServiceId &&
              o1.SolutionNodeRef === o2.SolutionNodeRef
          )
      );
    }
  }

  private handleAfterSaveTravelCard(
    checked: boolean,
    journey: TravelExtraList,
    travelCardObj: any[],
    value: any,
    isReturn: boolean
  ) {
    let isSameAsSaved = this.isSameAsSavedTravelCard(journey, travelCardObj);

    if (!checked && isSameAsSaved) {
      this.journeyExtras.push({ ...journey, IsAddTravelExtra: false });
      this.lastSavedTravelCard = null;
      this.subtractOutAndRetTravelCardPrice(value, isReturn);
    }

    if (checked && !isSameAsSaved) {
      this.removePreviousUnsavedSelection(journey);
      this.addRemovalEntryIfNeeded(travelCardObj, value, isReturn);

      this.journeyExtras.push({ ...journey, IsAddTravelExtra: true });
      isReturn
        ? this.setReturnTravelCardPrice(value)
        : this.setOutwardTravelCardPrice(value);
    }

    if (!checked && !isSameAsSaved) {
      this.journeyExtras = this.journeyExtras.filter(
        (entry) =>
          !(
            entry.OfferId === journey.OfferId &&
            entry.ServiceId === journey.ServiceId &&
            entry.SolutionNodeRef === journey.SolutionNodeRef &&
            entry.IsAddTravelExtra === true
          )
      );
    }

    this.updateIsTravelCardChanged(travelCardObj, journey, checked);
  }

  private removePreviousUnsavedSelection(journey: TravelExtraList) {
    this.journeyExtras = this.journeyExtras.filter(
      (entry) =>
        !(
          entry.extraType === journey.extraType &&
          entry.IsReturn === journey.IsReturn &&
          entry.IsAddTravelExtra === true
        )
    );
  }

  private addRemovalEntryIfNeeded(
    travelCardObj: any[],
    value: any,
    isReturn: boolean
  ) {
    let selectedTravelCard = travelCardObj.find((tc) => tc?.IsSelected);
    if (!selectedTravelCard) return;

    let oldSaved = this.createTravelExtraObj(selectedTravelCard, isReturn);
    oldSaved.IsAddTravelExtra = false;

    let alreadyRemoved = this.journeyExtras.some(
      (entry) =>
        entry.OfferId === oldSaved.OfferId &&
        entry.ServiceId === oldSaved.ServiceId &&
        entry.SolutionNodeRef === oldSaved.SolutionNodeRef &&
        entry.IsAddTravelExtra === false
    );

    if (!alreadyRemoved) this.journeyExtras.push({ ...oldSaved });
  }

  private updateIsTravelCardChanged(
    travelCardObj: any[],
    journey: TravelExtraList,
    checked: boolean
  ) {
    let selectedSaved = travelCardObj.find((card) => card?.IsSelected);

    if (!checked && selectedSaved) {
      this.isTravelCardChanged = true;
      return;
    }
    this.isTravelCardChanged = !(
      selectedSaved &&
      selectedSaved.OfferId === journey.OfferId &&
      selectedSaved.ServiceId === journey.ServiceId &&
      selectedSaved.SolutionNodeRef === journey.SolutionNodeRef &&
      checked
    );
  }

  private handleEmptyBasket(): void {
    this.searchRequest.PromotionCode = "";
    this.sharedService.journeySummaryModel ||= new JourneySummaryModel();
    this.sharedService.journeySummaryModel.IsPromo = false;

    this.sharedService.isAmendSearchOpen = true;
    this.isBasketEmpty = true; // UI flag
    this.sharedService.isJourneySuccessfullyRemoved(true);

    this.commonServices.cacheSharedData();
    this.openEditQttAndSetRequest();
    this.enhancedReviewBuyAndDeliveryResponse.Journey = [];
  }

  openEditQttAndSetRequest(){
    if (!this.searchRequest.IsSeason || this.commonServices?.checkIsSeasonInLocalStorage()) {
      let data = this.storageDataService.getStorageData(this.pageTypeEnum?.search, true);
      this.sharedService.amendSearchRequest = this.searchRequest?.IsSeason && this.commonServices?.checkIsSeasonInLocalStorage() ? data : this.sharedService.searchRequest;
      this.sharedService.amendSearchRequest.JourneySearchType = 'NEW';
      this.sharedService.amendSearchRequest.JourneySearchTypeReturn = 'NEW';
      this.sharedService.showEdit = true;
      this.isCancelVisibleBtn = false;
      this.isBackToHomeBtnVisible = true;
    }
  }

  private handleNonEmptyBasket(): void {
    this.commonServices.loaderRequired = true;

    let data = this.responseData?.Data;
    this.enhancedReviewBuyAndDeliveryResponse =
      data?.GetDeliveryAndBasketJourneyResponseDto
        ? data.GetDeliveryAndBasketJourneyResponseDto.BasketJourneyResponse
        : data;
    this.selectedJourneyAccordion = this.enhancedReviewBuyAndDeliveryResponse?.Journey?.length - 1;
    this.selectedDeliveryMode =
                  this.enhancedReviewBuyAndDeliveryResponse?.Journey[
                    this.selectedJourneyAccordion
                  ]?.DeliveryDetail[0]?.DeliveryModeType;

    this.sharedService.enhancedReviewBuyResponse =
      data?.GetDeliveryAndBasketJourneyResponseDto
        ? this.enhancedReviewBuyAndDeliveryResponse
        : data;

    this.sharedService.reviewBuyCache =
      this.enhancedReviewBuyAndDeliveryResponse?.ReviewBuyCache;
    this.reviewBuyCache = this.sharedService.reviewBuyCache;

    this.getJourneyExtrasData();
  }
  showEticketNotApplicationMessage(journey) {
    if (journey?.OutwardJourneyExtras?.length > 0) {
      return (
        journey?.OutwardJourneyExtras?.some(
          (extra) => extra.IsSelected === true
        ) &&
        !journey?.DeliveryModesDto?.DeliveryMode?.some(
          (mode) => mode.DeliveryMode === this.appRouteEnum?.DeliveryModeETicket
        )
      );
    }
    if (journey?.ReturnJourneyExtras?.length > 0) {
      return (
        journey?.ReturnJourneyExtras?.some(
          (extra) => extra.IsSelected === true
        ) &&
        !journey?.DeliveryModesDto?.DeliveryMode?.some(
          (mode) => mode.DeliveryMode === this.appRouteEnum?.DeliveryModeETicket
        )
      );
    }
  }

  scrollToElement(divId): void {
    setTimeout(() => {
      document.getElementById(divId).scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 200);
  }

  private handleSavedExtrasCase(
    checked: boolean,
    journey: any,
    isReturn: boolean,
    selectedJourneyExtras: any,
    fareBreakDownJourneyExtras: any
  ) {
    let index = this.journeyExtras.findIndex(
      (item) =>
        item.OfferId === journey.OfferId &&
        item.ServiceId === journey.ServiceId &&
        item.SolutionNodeRef === journey.SolutionNodeRef &&
        item.IsReturn === journey.IsReturn
    );

    if (index !== -1) {
      this.journeyExtras[index].IsAddTravelExtra = checked;
      this.journeyExtras[index].SelectCount = journey.SelectCount;
    } else {
      this.journeyExtras.push(journey);
    }
  }

  private handleUnSavedExtrasCase(
    checked: boolean,
    journey: any,
    isReturn: boolean,
    selectedJourneyExtras: any,
    fareBreakDownJourneyExtras: any
  ) {
    if (checked) {
      this.isCheckedJourneyExtraChange(selectedJourneyExtras, isReturn);
      this.journeyExtras.push(journey);
    } else {
      this.isNotCheckedJourneyExtraChange(selectedJourneyExtras, isReturn);
      this.journeyExtras = this.journeyExtras.filter(
        (i) => i.SolutionNodeRef !== journey.SolutionNodeRef
      );
    }
  }

  enhancedNoSeatsAvailable() {
    this.dialog.open(EnhancedNoSeatsAvailableDialogsComponent, {
      disableClose: true,
      panelClass: [
        "enhanced-common-info-popup",
        "enhanced-go-back-dialog",
        "enhanced-no-seats-available-dialog",
      ],
      width: "45rem",
      autoFocus: false,
    });
  }

  scrollToPanel(index: number): void {
    setTimeout(() => {
      let panel = document.querySelectorAll("#matExpansionPanelId")[index];
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" }); // or 'center' depending on your preference
      }
    }, 100);
  }

  onExtrasPanelOpened(
    creationDate: string,
    panelKey: string,
    panelRef: MatExpansionPanel
  ) {
    try {
      if (!this.accordionRefsExtras[creationDate]) {
        this.accordionRefsExtras[creationDate] = {};
      }
      this.accordionRefsExtras[creationDate][panelKey] = panelRef;
    } catch (error) {
      console.log(error);
    }
  }

  changeSeatPreferencePopup(
    journey: any,
    seatInfo: any,
    isOutWardJourney: boolean
  ) {
    this.journeyXMLID = journey?.XmlId;
    this.uniqueDepartureForchangeSeat = seatInfo?.Departure;
    this.uniqueArrivalForchangeSeat = seatInfo?.Arrival;
    let dialogRef = this.dialog.open(EnhancedChangeSeatPreferenceDialogs, {
      disableClose: true,
      panelClass: [
        this.enhancedDynamicClassEnum.enhancedCommonPopupPanelClass,
        this.enhancedDynamicClassEnum?.enhancedSeatPreferenceDialogPanelClass,
      ],
      autoFocus: false,
      data: {
        seatInfo: seatInfo,
        journey: journey,
        isOutWardJourney: isOutWardJourney,
        isPostSale: false,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.enhancedReviewBuyAndDeliveryResponse =
        this.sharedService.enhancedReviewBuyResponse;
      this.setPreferencesOfGetDeliveryBasketAndResposne();
      this.reviewBuyCache =
        this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
      this.sharedService.enhancedReviewBuyResponse =
        this.enhancedReviewBuyAndDeliveryResponse;
      this.sharedService.reviewBuyCache =
        this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
      this.getJourneyExtrasData();
      this.commonServices.cacheSharedData();
      if (result?.IsSuccess) {
        this.showSeatMessage(
          isOutWardJourney,
          this.enhancedReservationMessageEnum
            .sucessfullySeatReservationChangedMsg,
          true
        );
      } else if (result && !result.IsSuccess && result?.msg) {
        this.showSeatMessage(
          isOutWardJourney,
          this.enhancedReservationMessageEnum.noSeatReservationChangedMsg,
          false
        );
      }
    });
  }

  getDiscountCssClass(item: any): string {
    if (item?.showDiscountMessage) {
      return `${this.enhancedDynamicClassEnum.enhancedFieldSuccessWithIcon}`;
    }
    if (item?.showDiscountError) {
      return `${this.enhancedDynamicClassEnum.enhancedFieldError}`;
    }
    return "";
  }

  getDiscountInputClasses(item: any): { [key: string]: boolean } {
    return {
      "enhanced-field-error-border":
        this.discountCodeControls[item?.CreationDate]?.errors ||
        item?.showDiscountError,
      "enhanced-readonly-input-border": this.isDiscountInputReadOnly(item),
    };
  }

  shouldShowBikeInfo(item: any): boolean {
    try {
      let hasCheckedOutward = item?.bikeOutward?.some((bike) =>
        this.isBikeCheckedOrSelected(bike)
      );
      let hasCheckedReturn = item?.bikeReturn?.some((bike) =>
        this.isBikeCheckedOrSelected(bike)
      );

      return hasCheckedOutward || hasCheckedReturn;
    } catch (error) {
      console.log(error);
    }
  }

  private isBikeCheckedOrSelected(bike: any): boolean {
    if (bike?.IsUserChecked !== undefined && bike?.IsUserChecked !== null) {
      return bike?.IsUserChecked;
    }
    return bike?.IsSelected;
  }

  private haveExtrasChanged(
    savedExtrasObjData: any[],
    currentExtras: any[],
    item
  ): boolean {
    const makeKey = (item: any) =>
      `${item.OfferId}_${item.ServiceId}_${item.SolutionNodeRef}_${item.IsReturn}`;

    const savedSelected = savedExtrasObjData?.filter((e) => e.IsSelected) || [];
    const savedSet: Set<string> = new Set(savedSelected.map(makeKey));

    const clonedExtras = JSON.parse(JSON.stringify(currentExtras));

    clonedExtras.forEach((item) => {
      if (item?.IsUserChecked === false) {
        item.IsSelected = false;
      } else if (item?.IsUserChecked) {
        item.IsSelected = true;
      }
    });

    const currentSelected = clonedExtras.filter((e) => e.IsSelected);
    const currentSet: Set<string> = new Set(currentSelected.map(makeKey));

    if (savedSet.size !== currentSet.size) return true;

    for (let key of currentSet) {
      if (!savedSet.has(key)) return true;
    }

    let uiOutCount = 0,
      savedOutCount = 0;
    let uiRetCount = 0,
      savedRetCount = 0;

    if (
      item?.bikeOutward?.[0]?.IsSelected ||
      item?.bikeOutward?.[0]?.IsUserChecked
    ) {
      uiOutCount = Number(item?.selectedBicycle || 0);
      savedOutCount = Number(item?.bikeOutward?.[0]?.Count || 0);
    }

    if (
      item?.bikeReturn?.[0]?.IsSelected ||
      item?.bikeReturn?.[0]?.IsUserChecked
    ) {
      uiRetCount = Number(item?.selectedBicycleReturn || 0);
      savedRetCount = Number(item?.bikeReturn?.[0]?.Count || 0);
    }

    if (uiOutCount !== savedOutCount || uiRetCount !== savedRetCount) {
      return true;
    }

    return false;
  }

  validatePassengerTypes() {
    this.passengerTypeControls.forEach((control, index) => {
      let value = control.value;

      if (value !== true && value !== false) {
        control.control.setErrors({ invalidPassengerType: true });
        control.control.markAsTouched();
      } else {
        let currentErrors = control.control.errors;

        if (currentErrors && !currentErrors["invalidPassengerType"]) {
          control.control.setErrors(null);
        }
      }
    });
  }

  showSeatMessage(isOutward: boolean, message: string, isSuccess: boolean) {
    if (isOutward) {
      this.outwardSeatMessage = message;
      this.outwardSeatMessageSuccess = isSuccess;
      this.showOutwardSeatMessage = true;
      setTimeout(() => {
        this.showOutwardSeatMessage = false;
        this.outwardSeatMessage = null;
      }, 10000);
    } else {
      this.returnSeatMessage = message;
      this.showReturnSeatMessage = true;
      this.returnSeatMessageSuccess = isSuccess;
      setTimeout(() => {
        this.showReturnSeatMessage = false;
        this.returnSeatMessage = null;
      }, 10000);
    }
  }
  isSmartCardInputVisible(passengerIndex: number): boolean {
    return this.selectedPassengerIndex === passengerIndex;
  }

  topParentPanelClosed(journeyIndex): void {
    if (this.selectedJourneyAccordion === journeyIndex) {
      this.isAccordion = false;
      this.selectedJourneyAccordion = null;
    }
  }

  checkIsSmartCardNumberEntered() {
    let hasBlankSmartCard = this.smartCardPassengerList?.some(
      (passenger) =>
        !passenger.SmartCardNumber || passenger.SmartCardNumber.trim() === ""
    );
    return hasBlankSmartCard;
  }

  getPanelKey(outwardSeatData: any, index: number, Journey): string {
    return Journey
      ? Journey + "_" + index
      : outwardSeatData?.Departure +
          "_" +
          outwardSeatData?.Arrival +
          "_" +
          index;
  }

  setPreferencesOfGetDeliveryBasketAndResposne() {
    this.enhancedReviewBuyAndDeliveryResponse?.Journey.forEach((journey) => {
      this.commonServices.getOrganisedOutwardAndReturnSeatInfo(
        journey?.OutwardSeat
      );
      this.commonServices.getOrganisedOutwardAndReturnSeatInfo(
        journey?.ReturnSeat
      );
      this.commonServices.removeStandPreFromTicketTypeForOutAndReturn(journey);
    });
  }

  isPassengerTypeValid(): boolean {
    return this.passengerTypeControls
      ?.toArray()
      ?.every((control) => control.valid);
  }

  checkValidLoadStationOfPassenger() {
    return this.loadStationOrderSmartCardOneControls
      ?.toArray()
      ?.every((control) => control.valid);
  }

  disabledSaveBtnWhenUserHavingSmartcard() {
    return (
      !this.isOrderSmartCard[this.selectedJourneyAccordion] &&
      (!this.isPassengerTypeValid() ||
        !this.checkValidLoadStationOfPassenger() ||
        this.checkIsSmartCardNumberEntered())
    );
  }

  isExistDeliveryAndReviewPage(): boolean {
    return this.router?.url?.includes(
      this.enhancedAppRouteEnum.deliveryAndReviewBy
    );
  }

  setDeliveryAndBasketResponse(index) {
    this.sharedService.getBasketCount.emit(
      this.enhancedReviewBuyAndDeliveryResponse.BasketCount
    );

    this.callRedirectionOnSearchResultPage();

    this.getOrderSmartCardDetails(
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]
    );

    this.setDeliveryModesData();
    this.enhancedReviewBuyAndDeliveryResponse.Journey.forEach((journey) => {
      this.commonServices.getOrganisedOutwardAndReturnSeatInfo(
        journey.OutwardSeat
      );
      this.commonServices.getOrganisedOutwardAndReturnSeatInfo(
        journey.ReturnSeat
      );
      this.commonServices.removeStandPreFromTicketTypeForOutAndReturn(journey);
      this.setEnhancedFareBreakDownModelData(journey);
    });
    this.callTimeOutPopupForBasketJourneyOfReviewBuyResponse();
    this.sharedService.enhancedReviewBuyResponse =
      this.enhancedReviewBuyAndDeliveryResponse;
    this.sharedService.reviewBuyCache =
      this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
    this.reviewBuyCache =
      this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
    this.getBasketJourneyForPromoValue();
    this.sharedService.searchRequest = this.searchRequest;

    this.sharedService.LatestJourneyCache =
      this.enhancedReviewBuyAndDeliveryResponse.LatestJourneyCache;
    this.addTimeStampToReviewBuyJourneyTimeStampArr();
    this.sharedService.ReservationCache = this.sharedService.ReservationCache;
    this.sharedService.previousCache = null;
    this.getJourneyExtrasData();
    this.commonServices.cacheSharedData();
    this.callingMethodToAddDeliveryModesInEveryJourney();
    this.callingMethodToRemoveJourneyWhenExpired(index);
  }

  setSelectedDeliveryModeDetail() {
    let smartCardList =
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.DeliveryDetail[0]?.SmartCardList || [];

    this.enhancedReviewBuyAndDeliveryResponse.Journey[
      this.selectedJourneyAccordion
    ].DeliveryModesDto.SmartCardDetails =
      this.enhancedReviewBuyAndDeliveryResponse.Journey[
        this.selectedJourneyAccordion
      ].DeliveryModesDto.SmartCardDetails.map((card) => ({
        ...card,
        IsAlreadySelected: smartCardList.includes(card.SmartCardNumber),
      }));
    this.smartCardPassengerList = new Array<SmartCardInfo>();
    smartCardList?.forEach((c, index) => {
      this.createSmartCardPassengerListWhenSmartCardAlreadSelected(c);
      this.smartCardOptionSelect(index, index, c, null);
    });
  }

  checkBlankAddress() {
    return (
      this.billingAddresses == null ||
      this.billingAddresses?.length == 0 ||
      (this.billingAddresses.length == 1 &&
        this.billingAddresses[
          this.selectedJourneyAccordion
        ]?.Address?.PostCode.trim() == "") ||
      this.deliveryModeRequest.Address == null ||
      this.deliveryModeRequest.Address?.PostCode?.trim() == ""
    );
  }

  private setBackendError(
    journeyId: string,
    panelKey: "bike" | "plusbus" | "travelcard",
    message: string
  ) {
    if (!this.backendErrorState[journeyId]) {
      this.backendErrorState[journeyId] = {
        bike: "",
        plusbus: "",
        travelcard: "",
      };
    }
    this.backendErrorState[journeyId][panelKey] = message;
    // auto hide after 10s
    setTimeout(() => {
      if (this.backendErrorState[journeyId]?.[panelKey] === message) {
        this.backendErrorState[journeyId][panelKey] = "";
      }
    }, 10000);
  }

  private showDiscountBackendError(journeyId: string, message: string) {
    this.discountErrorState[journeyId] = message;
    setTimeout(() => {
      this.discountErrorState[journeyId] = "";
    }, 10000);
  }

  handleInvalidSmartCard(i: number, message: string): void {
    this.smartCardValidateMesage = message;
    this.InValidSmartCard[i] = true;

    this.timeoutRef = setTimeout(() => {
      this.InValidSmartCard[i] = false;
    }, 10000);
  }

  createSmartCardPassengerListWhenSmartCardAlreadSelected(smartCardNumnber) {
    let passenger = new SmartCardInfo();
    passenger.IsAdult = true;
    if (
      this.sharedService.searchRequest != undefined &&
      this.sharedService.searchRequest.DepartureLocationName != undefined
    ) {
      passenger.LocationId = this.findLocationCode(
        this.sharedService.searchRequest.DepartureLocationName
      ).toString();
      if (passenger.LocationId != "0") {
        passenger.LocationName =
          this.sharedService.searchRequest.DepartureLocationName;
      } else if (passenger.LocationId == "0") {
        passenger.LocationId = "";
        passenger.LocationName = "";
      }
    } else {
      passenger.LocationId = "";
      passenger.LocationName = "";
    }
    passenger.IsLoadStationAvailable =
      passenger.LocationId == "" ? false : true;
    passenger.SmartCardNumber = smartCardNumnber;
    if (this.selectedSmartCardNumber.length > 0) {
      passenger.IsAddedSmartcard = true;
    } else {
      passenger.IsAddedSmartcard = false;
    }
    passenger.xmlId = passenger.xmlId
      ? passenger?.xmlId
      : this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.XmlId;
    this.smartCardPassengerList.push(passenger);

    this.smartCardPassengerList.forEach((_, index) => {
      this.isSelectedPassengerValid[index] = false;
    });
    console.log(
      "This is smartcard passenger list:" + this.smartCardPassengerList
    );
    this.checkIsThisNewSmartCardOrNot();
  }

  checkIsThisNewSmartCardOrNot() {
    let smartCardDetails = this.filterSmartCard(
      this.enhancedReviewBuyAndDeliveryResponse?.Journey[
        this.selectedJourneyAccordion
      ]?.DeliveryModesDto?.SmartCardDetails
    );

    this.smartCardPassengerList?.forEach((passenger, index) => {
      const matchingSmartCard = smartCardDetails.find(
        (card) => card.SmartCardNumber === passenger.SmartCardNumber
      );

      if (!matchingSmartCard) {
        passenger.newSmartCardAdded = true;
        passenger.isEnterSmartVisible = true;
      } else {
        passenger.newSmartCardAdded = false;
        passenger.isEnterSmartVisible = false;
      }
    });
  }

  allSmartcardsValid(): boolean {
    if (!this.smartcardCtrl || this.smartcardCtrl.length === 0) {
      return false;
    }
    return this.smartcardCtrl.toArray().every((ctrl) => ctrl.invalid);
  }

  checkedRadioButtonForAddNewSmartCard(passenger, xmlId) {
    let passanger = passenger;
    if (!passenger.SmartCardNumber) {
      return false;
    }
    if (
      passanger.newSmartCardAdded &&
      passanger.isEnterSmartVisible &&
      passanger?.xmlId == xmlId
    ) {
      return true;
    }
    return false;
  }

  checkIsAllSmartCardSelected(): boolean {
    return this.selectedSmartcardList.every(
      (e) => e.smartcard && e.smartcard.trim() !== ""
    );
  }

  checkSelectedSmartCardNumberIsNew() {
    this.selectedSmartCardNumber = this.selectedSmartCardNumber.map(
      (selectedValue) => {
        const [cardNumber, xmlId] = selectedValue.split("||");

        const exists = this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryModesDto?.SmartCardDetails?.some(
          (detail) => detail?.SmartCardNumber === cardNumber
        );

        return exists ? selectedValue : this.isAdd_New + "||" + xmlId;
      }
    );
  }

  setIsOrderSmartCardOnPageLoad() {
    this.enhancedReviewBuyAndDeliveryResponse?.Journey?.forEach(
      (journey, index) => {
        this.isOrderSmartCard[index] =
          journey?.DeliveryDetail[0]?.IsOrderSmartCard;
      }
    );
  }

  openPaymentDetails() {
    if (!this.hasValidJourney()) {
      this.notificationservice.error("Please add a journey first.");
      return;
    }
    if (
      this.isAddedDeliveryForJourney(this.enhancedReviewBuyAndDeliveryResponse)
    ) {
      this.commonServices.IsDeliveryModesAddedForSelectedJourneyOrNot();
      return;
    }

    if (
      this.requiredSmartCardDetails() &&
      !this.IsDeliveryModeSmartcardSelected
    ) {
      this.notificationservice.warn(
        "Please fill all the passenger smartcard number details."
      );
      return;
    }

    this.sharedService.reviewBuyCache = this.reviewBuyCache;
    this.commonServices.cacheSharedData();
    this.onContinueToPayment();
  }

  private hasValidJourney(): boolean {
    let resp = this.enhancedReviewBuyAndDeliveryResponse;
    return (
      resp?.Journey?.length > 0 &&
      (resp.BasketCount > 0 || resp.IsRenewSmartcard)
    );
  }

  private requiredSmartCardDetails(): boolean {
    return (
      this.deliveryModes.length === 1 &&
      this.deliveryModes[0].DeliveryMode ===
        this.appRouteEnum.DeliveryMode_Smart_Card
    );
  }

  onContinueToPayment(): void {
    this.commonServices.loaderRequired = true;
    let request = this.buildPaymentDetailsRequest();

    this.enhancedPaymentApiDataService.fetchPaymentData(request).subscribe({next: (data) => {
        this.commonServices.loaderRequired = false;
        setTimeout(() => {
          this.handlePaymentDetailResponse(data);
        }, 2000);
      },
      error: (err) => {
        this.commonServices.loaderRequired = false;
        console.error("Payment API failed", err);
      },
    });
  }

  private buildPaymentDetailsRequest(): PaymentDetailRequest {
    let req = new PaymentDetailRequest();
    req.CustomerKey = localStorage.getItem("CustomerKey") ?? "";
    req.Email = localStorage.getItem("Email") ?? "";
    req.ReviewBuyCache = this.sharedService.reviewBuyCache;
    req.IsPostSale =
      !!this.sharedService?.enhancedReviewBuyResponse?.IsRenewSmartcard;
    return req;
  }

  private handlePaymentDetailResponse(data: PaymentDetailResponse): void {
    this.paymentDetailsResponse = data;
    this.sharedService.reviewBuyCache = data.ReviewBuyCache;
    this.reviewBuyCache = data.ReviewBuyCache;
    this.commonServices.cacheSharedData();

    if (data.IsBasketJourneyValid) {
      localStorage.removeItem("isChangeReplace");
      localStorage.removeItem("paymentForSmartcard");
      localStorage.setItem("paymentForSmartcard", "false");
      this.router.navigate([`./` + this.appRouteEnum.Payment]);
      localStorage.setItem("JourneyValidforPayemnt", "false");
    } else {
      this.spinnerService.hide();
      this.timeoutpopup(data.BasketJourneyMessage, true);
    }
  }

  noOfRailcardSelectedInJourneyInCaseOfGroupSave(railCardPrice) {
    let railcardLength = [...new Set(railCardPrice?.filter(
      (item) =>
        item?.Railcard !== "No Railcard" && item?.Railcard !== "Groupsave"
    ).map(item => item?.Railcard))].length;
    return railcardLength === 0 ? "No" : railcardLength;
  }

  setPostDilveryFormDetail() {
    let title = this.enhancedReviewBuyAndDeliveryResponse?.Journey[
      this.selectedJourneyAccordion
    ]?.DeliveryDetail[0]?.Title
      ? this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0]?.Title
      : localStorage.getItem(this.localStorageEnum?.titleText);
    let firstName = this.enhancedReviewBuyAndDeliveryResponse?.Journey[
      this.selectedJourneyAccordion
    ]?.DeliveryDetail[0]?.Name
      ? this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0]?.Name
      : localStorage.getItem(this.localStorageEnum?.firstName);
    let lastName = this.enhancedReviewBuyAndDeliveryResponse?.Journey[
      this.selectedJourneyAccordion
    ]?.DeliveryDetail[0]?.Surname
      ? this.enhancedReviewBuyAndDeliveryResponse?.Journey[
          this.selectedJourneyAccordion
        ]?.DeliveryDetail[0]?.Surname
      : localStorage.getItem(this.localStorageEnum?.lastNameText);
    this.postDeliveryForm.patchValue({
      title: title,
      name: firstName,
      surname: lastName,
    });
  }

  coachTextDisplay(seats) {
    let uniqueCoaches = [...new Set(seats.map((seat) => seat.CoachNumber))];
    uniqueCoaches.sort();
    if (uniqueCoaches?.length === 1) {
      return `${uniqueCoaches[0]}`;
    } else {
      return `${uniqueCoaches.slice(0, -1).join(", ")} & ${
        uniqueCoaches[uniqueCoaches.length - 1]
      }`;
    }
  }
  loadGTMDataLayeronExpandingSolutions(element, isSingleReturnElement, selectedFare) {
      let indexOfElement = -1;
      try {
      let searchResponseData = this.selectedOutOrRetTravelSolutionData;
      if (isSingleReturnElement) {
          indexOfElement = searchResponseData?.searchReturnResponse?.TravelSolutions?.indexOf(element);
          let inward = this.enhancedTravelSolutionTypesEnum?.inward?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.inward?.slice(1).toLowerCase();
          this.ga4DatalayerService.loadGA4ViewItem(selectedFare, this.searchRequest, indexOfElement, -1, inward, selectedFare, false, true, this.enhancedSearchSourceTypeEnum?.reviewBuyAndDelivery);
      }
      else if (!isSingleReturnElement) {
          indexOfElement = searchResponseData?.searchResponse?.TravelSolutions?.indexOf(element);
          let outward = this.enhancedTravelSolutionTypesEnum?.outward?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.outward?.slice(1).toLowerCase();
          this.ga4DatalayerService.loadGA4ViewItem(selectedFare, this.searchRequest, indexOfElement, -1, outward, selectedFare, false, true, this.enhancedSearchSourceTypeEnum?.reviewBuyAndDelivery);
      }
      } catch (err) { console.log(err); }
  }

  noRailcardTextChange(railcardText){
    if (railcardText) {
      railcardText = railcardText.replace(/r/, (match) => match.toUpperCase());
    }
    return railcardText;
  }

  trimSpacesFromPostCodeFormControl() {
    this.postCodeValueChangeSubscription = this.addressForm.controls['postCode'].valueChanges.subscribe(x => {
      if (x?.includes(' ')) {
        this.addressForm.controls['postCode'].setValue(x.trim().replace(/\s/g, ""))
      }
    });
  }

  setSharedServiceDetailAndEnhancedReviewBuyResponseOnInit(sharedSiblingRefresh){
    if (this.commonServices.isExistRenewSmartcard(sharedSiblingRefresh)) {
      this.enhancedReviewBuyAndDeliveryResponse = sharedSiblingRefresh.enhancedReviewBuyResponse;
      this.sharedService.enhancedReviewBuyResponse = sharedSiblingRefresh.enhancedReviewBuyResponse;
      this.sharedService.journey = sharedSiblingRefresh.Journey;
      this.reviewBuyCache = sharedSiblingRefresh.enhancedReviewBuyResponse.ReviewBuyCache;
      this.sharedService.reviewBuyCache = this.reviewBuyCache;
    } else {
      if (this.browserRefresh) {
        this.browserRefreshData(sharedSiblingRefresh);
        if (sharedSiblingRefresh) {
          this.getSharedCacheDataOnBrowserRefresh(sharedSiblingRefresh);
        }
      }
    }
  }

  conditionToCheckDeliveryModeTypeWithBlankAddress(){
    return this.checkBlankAddress() && this.selectedDeliveryMode !== this.appRouteEnum?.DeliveryModeETicket && this.selectedDeliveryMode !== this.appRouteEnum?.DeliveryMode_TOD;
  }

  setLocationId(){
    if (this.locationId != "0") {
      this.locationName =
        this.sharedService.searchRequest.DepartureLocationName;
    } else if (this.locationId == "0") {
      this.locationId = "";
      this.locationName = "";
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-mode');
    }
  }

  @HostListener('document:mousedown')
  handleMouseEvent(): void {
    document.body.classList.remove('keyboard-mode');
  }

  getRemoveJourneyAriaLabel(item) {
    try {
    let outwardDate = this.datePipe.transform(item?.OutwardDetail?.DepartureTime, 'EEE, dd MMM yyyy');
    let returnDate = this.datePipe.transform(item?.ReturnDetail?.DepartureTime, 'EEE, dd MMM yyyy');

    let departureStation = item?.Departure; 
    let arrivalStation = item?.Arrival;    

    let outwardText = `${this.travelSolutionJourneyTypeEnum.outward} ${outwardDate}, ${departureStation} to ${arrivalStation}`;
    let returnText  = `${this.travelSolutionJourneyTypeEnum.return} ${returnDate}, ${arrivalStation} to ${departureStation}`;

    let hasOutward = item?.OutwardDetail?.DepartureTime;
    let hasReturn  = item?.ReturnDetail?.DepartureTime;

    if (hasOutward && hasReturn) {
      return `Remove this journey - ${outwardText}, ${returnText}`;
    }

    if (hasOutward) {
      return `Remove this journey - ${outwardText}`;
    }
    } catch (error) { console.log(error); }
  }

  getPaxRailcardAriaLabel(item, searchRequest, isOutward: boolean) {
    try {
      let adult = item?.Adult || 0;
      let child = item?.Child || 0;
      let date = isOutward ? this.datePipe.transform(searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy') : this.datePipe.transform(searchRequest?.ReturnTimesStartShow, 'EEE, dd MMM yyyy');

      let paxText = `${adult} ${this.enhancedPassangerTypeEnum.adultText}${adult > 1 ? 's' : ''}`;
      if (child > 0) { paxText += `, ${child} ${child > 1 ? this.enhancedPassangerTypeEnum.ChildrenText : this.enhancedPassangerTypeEnum.ChildText}`;}

      let railPrice = isOutward ? item?.OutwardDetail?.RailCardPrice : item?.ReturnDetail?.RailCardPrice;

      let noRail = this.noOfRailcardSelectedInJourney(railPrice) === 0 && this.checkForGroupSaveRailcard(railPrice) === 0;

      let hasRail = this.noOfRailcardSelectedInJourney(railPrice) > 0 && this.checkForGroupSaveRailcard(railPrice) === 0;

      let hasGroup = this.checkForGroupSaveRailcard(railPrice) > 0;

      let railText = '';

      if (noRail) {
        railText = `${this.enhancedRailCardTypeEnum.noRailcardText}`;
      } 
      else if (hasRail) {
        let count = this.noOfRailcardSelectedInJourney(railPrice);
        railText = `${count} Railcard${count > 1 ? 's' : ''}`;
      }
      else if (hasGroup) {
        let count = this.noOfRailcardSelectedInJourneyInCaseOfGroupSave(railPrice);
        railText = `${count} Railcards, ${this.appRouteEnum.newGroupSave}`;
      }

      return `${paxText} ${railText} ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.viewPriceBreakDown} for your journey ${isOutward ? this.travelSolutionJourneyTypeEnum.outwardString : this.travelSolutionJourneyTypeEnum.returnString} ${date}`;
    } catch (error) { console.log(error); }
  }
  getBikeAriaLabel(isChecked: boolean, isReturn: boolean): string {
   try{
    let type = isReturn ? `${this.travelSolutionJourneyTypeEnum.return}` : `${this.travelSolutionJourneyTypeEnum.outward}`;
    return isChecked ? `${type} ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.bikeReservations}.` : `${type} ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.bikeReservations}.`;
   } catch (error) { console.log(error); }
  }

  getBikeQuantityAriaLabel(value: number, isIncrease: boolean, isReturn: boolean): string {
    try { 
    let type = isReturn ? `${this.travelSolutionJourneyTypeEnum.return}` : `${this.travelSolutionJourneyTypeEnum.outward}`;
    let action = isIncrease ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.increase}` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.decrease}`;
    return `current value: ${value}. Press ${isIncrease ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.plus}` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.minus}`} button to ${action} ${type} ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.bikeReservations}.`;
    } catch (error) { console.log(error); }
  } 

  resetBikeAria(isReturn: boolean) {
    if (isReturn) {
      this.ariaPlusRetLabel = '';
      this.ariaMinusRetLabel = '';
    } else {
      this.ariaPlusOutLabel = '';
      this.ariaMinusOutLabel = '';
    }
  }

  getBikeAriaLabelOnClickPlusOrMinus(isReturn, item, bicycleObj, flag){
    try {
    let current = isReturn ? Number(item?.selectedBicycleReturn) : Number(item?.selectedBicycle);
      let available = bicycleObj?.AvailableAmount;
      let type = isReturn ? `${this.travelSolutionJourneyTypeEnum.return}` : `${this.travelSolutionJourneyTypeEnum.outward}`;
      let announcement = '';

      if (current === 1) {
        announcement = `${type} ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.bikeReservations}, ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.minimumValue}`;
      } else if (current === available) {
        announcement = `${type} ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.bikeReservations}, ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.maxValue}`;
      } else {
        announcement = `${type} ${this.enhancedReviewBuyAndDeliveryBtnTextEnum.bikeReservations} ${current}`;
      }

      if (isReturn) {
      if (flag) {
        // PLUS clicked
        this.ariaPlusRetLabel = announcement;
      } else {
        // MINUS clicked
        this.ariaMinusRetLabel = announcement;
      }
    } else {
      if (flag) {
        // PLUS clicked
        this.ariaPlusOutLabel = announcement;
      } else {
        // MINUS clicked
        this.ariaMinusOutLabel = announcement;
      }
    }
    } catch (error) { console.log(error); }
  }

  getPlusBusAriaLabel(pB: any, item: any,isReturn: boolean): string {
    try {
      let journeyType = isReturn ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.returnPlusBusTicket}` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.outwardPlusBusTicket}`;

      let travelDate = isReturn ? item?.ReturnDetail?.DepartureTime : item?.OutwardDetail?.DepartureTime;
      
      let status = !item?.isPlusBusSaved && this.shouldShowPlusBusSave(item) ? "checked" : "not checked";

      let fullDate = this.datePipe.transform(travelDate, 'EEE, dd MMM yyyy');

      // Build adult/child text
      let extraText = "";
      if (item?.Adult || item?.Child) {
        let adultText = item?.Adult ? `£${pB?.MaxPrice} per adult` : "";
        let childText = item?.Child ? `£${pB?.MinPrice} per child` : "";

        extraText = [adultText, childText].filter(x => x).join(", ");
      }

      let checkboxText = '';
      if (status === 'checked' && !pB.hasAnnouncedCheckbox) {
        checkboxText = ' checkbox';
        pB.hasAnnouncedCheckbox = true; // mark as announced
      }
      
      return `from ${pB?.Departure}, £${pB?.Price} ${journeyType}. Travel on ${fullDate}`;
      } catch (error) { console.log(error); }
    }

    getTravelcardAriaLabel(item: any, travelcard: any, checked: boolean, isOffPeak: boolean, searchRequest: any, isOutward): string {
      try {
      let checkboxText = '';
      if (checked && !travelcard?.hasAnnouncedTravelcardCheckbox) {
        checkboxText = ' checkbox';
        travelcard.hasAnnouncedTravelcardCheckbox = true;
      }
      let state = !item?.isLondonTravelSaved && this.shouldShowTravelcardSave(item) ? 'Checkbox, checked:' : 'Checkbox, not checked:';

      let section = isOffPeak ? `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.offPeakDayTravelCard}.` : `${this.enhancedReviewBuyAndDeliveryBtnTextEnum.anyTimeDayTravelCard}.`;

      let subtitle = isOffPeak ? `${this.reviewBuyAndDeliveryErrorMessageEnum.offPeakDayTravelCardInfo}` : `${this.reviewBuyAndDeliveryErrorMessageEnum.anyTimeDayTravelCardInfo}`;

      let title = this.formatTravelCardServiceName(travelcard?.ServiceName);

      let date = this.datePipe.transform(searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy');

      let price = `${this.sharedService.currencySymbol(travelcard?.Currency)}${this.sharedService.formatPrice(travelcard?.Price)}`;

      let journeyType = isOutward ? `${this.travelSolutionJourneyTypeEnum.outward}` : `${this.travelSolutionJourneyTypeEnum.return}`;

      let perPerson = '';
      if (item?.Adult || item?.Child) {
        let adultText = item?.Adult
          ? `${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(travelcard?.MaxPrice)} per adult`
          : '';
        let childText = item?.Child
          ? `${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(travelcard?.MinPrice)} per child`
          : '';
        perPerson = `{${adultText}${item?.Adult && item?.Child ? ', ' : ''}${childText}.}`;
      }

      return `${title} ${journeyType} ${date} ${price} ${section} ${subtitle}`.trim();

      } catch (error) { console.log(error); }
    }

  getAriaLabelOnViewChangeSeat(searchRequest, isOutward: boolean) {
      try {
        let journeyType = isOutward ? `${this.travelSolutionJourneyTypeEnum.outward}` : `${this.travelSolutionJourneyTypeEnum.return}`;
        let date = isOutward ? this.datePipe.transform(searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy') : this.datePipe.transform(searchRequest?.ReturnTimesStartShow, 'EEE, dd MMM yyyy');
        return `View Change seat for your journey ${journeyType}, ${date}`;
      } catch (error) { console.log(error); }
  }




}
