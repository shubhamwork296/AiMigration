import { DatePipe } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, HostListener, Injector, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatExpansionPanel } from "@angular/material/expansion";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { Subscription } from "rxjs";
import { FareBreakdownModel } from "src/app/models/mixing-deck/fare-breakdown.model";
import { BookingDetailsResponseDto, EticketRequestDto, EticketResponse, EticketResponseList, JourneyDetails } from "src/app/models/account/my-bookings.model";
import { ResponseData } from "src/app/models/common/response.model";
import { FortressValidateRequest, PassengerAssistRequest, PassengerDetail, PassengerJourneyDetails, PassengerReservationDetails, Products, ValidatePaymentResponse } from "src/app/models/payment-details/validate-payment-response.model";
import { CalendarService } from "src/app/services/calendar.service";
import { CommonServices } from "src/app/services/common.service";
import { CompleteOrderService } from "src/app/services/complete-order.service";
import { EnhancedCompleteOrderService } from "src/app/services/enhanced-complete-order.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { SharedServiceCache } from "src/app/services/SharedServiceCache.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import { AppRouteEnum, BookingTypeEnum, BookPassangerAssistEnum, DeliveryModeEnum, EnhancedDynamicClassesNameEnum, EnhancedOperatorNamesEnum, EnhancedPassangerTypeEnum, EnhancedPrefixOfTicketTypeEnum, EnhancedRailcardTypeEnum, EnhancedReviewBuyAndDeliveryReservationMessageEnum, EnhancedReviewBuyReservedOrNonReservedMessageHeading, JourneyTypeEnum, LocalStorageKeyEnum, NotificationErrorMsg, ShowAndHideTextDetailEnum, TabIndexValueEnum, TravelSolutionJourneyTypeEnum, NativePaymentMethodEnum, AppConstantsService, EnhancedGa4DatalayeEventNameEnum, EnhancedConfirmationPageEnum, EnhancedPaymentPageMessageEnum, EnhancedJourneyType, TicketTypeEnum, PermissionTextEnum, ClassTypeEnum, EnhancedLocalOrSessionStorageKeysEnum } from "src/app/utility/app-constants.service";
import { downloadFile } from "src/app/utility/download-file";
import { environment } from "src/environments/environment";
import { EnhancedPriceBreakdownDialogs } from "../enhanced-dialogs/enhanced-price-breakdown-dialogs/enhanced-price-breakdown-dialogs.component";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { EnhancedTicketDetailsDialogsComponent } from "../enhanced-dialogs/enhanced-ticket-detail-dialogs/enhanced-ticket-detail-dialogs.component";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { MonetateService } from "src/app/utility/monetate/monetate.service";
import { MatMenuItem, MatMenuTrigger } from "@angular/material/menu";

declare global {
  interface Window {
    usabilla_live?: {
      trigger?: (surveyName: string) => void;
      push?: (args: any[]) => void;
    } | any[];
  }
}

@Component({
    selector: 'app-enhanced-booking-confirmation',
    templateUrl: './enhanced-booking-confirmation.component.html',
    styleUrls: ['./enhanced-booking-confirmation.component.css']
})

export class EnhancedBookingConfirmationComponent implements OnInit{
    customerFirstName: string;
    localStorageEnum: LocalStorageKeyEnum;
    sharedService: SharedService;
    sharedServiceCache: SharedServiceCache;
    validatePaymentResponse: ValidatePaymentResponse;
    appRouteEnum: AppRouteEnum;
    commonService: CommonServices;
    iframeSrc: any;
    paymentRecords = [];
    cookies: CookieService;
    fortressValidateRequest: FortressValidateRequest;
    productslist: Array<Products> = [];
    products: Products;
    datePipe: DatePipe;
    completeOrderService: CompleteOrderService;
    selectedIndex = 0;
    enhancedPassangerTypeEnum: EnhancedPassangerTypeEnum;
    calendarService : CalendarService;
    isSeason: boolean = false;
    travelSolutionEnum: TravelSolutionJourneyTypeEnum;
    tabIndexValueEnum: TabIndexValueEnum;
    tabIndex: number;
    enhancedReviewBuyReservedOrNonReservedMessageHeading: EnhancedReviewBuyReservedOrNonReservedMessageHeading;
    enhancedReservationMessageEnum: EnhancedReviewBuyAndDeliveryReservationMessageEnum;
    enhancedOperatorNameEnum: EnhancedOperatorNamesEnum;
    enhancedPrefixOfTicketTypeEnum: EnhancedPrefixOfTicketTypeEnum;
    isOutSeatDetailsOpenMap: { [key: number]: boolean } = {};
    isRetSeatDetailsOpenMap: { [key: number]: boolean } = {};
    activePanel: MatExpansionPanel;
    showAndHideDetailTextEnum: ShowAndHideTextDetailEnum;
    passengerAssistRequest: PassengerAssistRequest;
    passengerDetail: PassengerDetail;
    bookPassangerAssistEnum: BookPassangerAssistEnum;
    storageDataService: StorageDataService;
    journeyDetails: PassengerJourneyDetails;
    reservationDetails: PassengerReservationDetails;
    enhancedRailCardTypeEnum: EnhancedRailcardTypeEnum;
    bookingTypeEnum: BookingTypeEnum;
    discountPaymentSummaryListArrayObject: any = [];
    travelExtrasPaymentSummaryListArrayObject: any = [];
    deliveryPaymentSummaryListArrayObject: any = [];
    journeyTypeEnum: JourneyTypeEnum;
    subscription: Subscription;
    isRedirectFromValidateDo: boolean = false;
    nextDayDeliveryModePrice: number;
    firstClassPostPrice: number;
    notificationErrorMsg: NotificationErrorMsg;
    deliveryModeEnum: DeliveryModeEnum;
    enhancedEticketRequestDto: EticketRequestDto;
    enhancedEticketResponse: EticketResponseList;
    responseData: ResponseData;
    bookingDetailsResponse: BookingDetailsResponseDto;
    enhancedCompleteOrderService: EnhancedCompleteOrderService;
    nativePaymentMethod: NativePaymentMethodEnum;
    enhancedDynamicClassEnum: EnhancedDynamicClassesNameEnum;
    searchRequest: EnhancedSearchRequestModel;
    showTicketOutsideArea : boolean = false;
    hideTicketOutsideArea : boolean = false;
    ga4dataLayerService: GA4DatalayerService;
    monetateService: MonetateService;
    appConstantService: AppConstantsService;
    enhancedGA4DatalayerEventEnum: EnhancedGa4DatalayeEventNameEnum;
    panelOpenState = false;
    paymentSummaryAriaLabel;
    enhancedConfirmationPageEnum: EnhancedConfirmationPageEnum;
    enhancedPaymentPageMessageEnum: EnhancedPaymentPageMessageEnum;
    enhancedJourneyType: EnhancedJourneyType;
    ticketTypeEnum: TicketTypeEnum;
    permissionTextEnum : PermissionTextEnum;
    classTypeEnum: ClassTypeEnum;
    @ViewChild('menu') menu!: ElementRef<HTMLButtonElement>;
    @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
    @ViewChildren(MatMenuItem) menuItems!: QueryList<MatMenuItem>;
    @ViewChild('seePriceBtn') seePriceBtn!: ElementRef<HTMLButtonElement>;
    enhancedLocalOrSessionStorageKeysEnum: EnhancedLocalOrSessionStorageKeysEnum;
    private surveyTriggered = false;

    constructor(private readonly injector : Injector, private readonly router: Router, private readonly cdr: ChangeDetectorRef, private readonly dialog: MatDialog,){
        this.sharedService = this.injector.get(SharedService);
        this.localStorageEnum = this.injector.get(LocalStorageKeyEnum);
        this.appRouteEnum = this.injector.get(AppRouteEnum);
        this.commonService = this.injector.get(CommonServices);
        this.deliveryModeEnum = this.injector.get(DeliveryModeEnum);
        this.cookies = this.injector.get(CookieService);
        this.datePipe = this.injector.get(DatePipe);
        this.completeOrderService = this.injector.get(CompleteOrderService);
        this.enhancedPassangerTypeEnum = this.injector.get(EnhancedPassangerTypeEnum);
        this.calendarService = this.injector.get(CalendarService);
        this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
        this.tabIndexValueEnum = this.injector.get(TabIndexValueEnum);
        this.enhancedReviewBuyReservedOrNonReservedMessageHeading = this.injector.get(EnhancedReviewBuyReservedOrNonReservedMessageHeading);
        this.enhancedReservationMessageEnum = this.injector.get(EnhancedReviewBuyAndDeliveryReservationMessageEnum);
        this.enhancedOperatorNameEnum = this.injector.get(EnhancedOperatorNamesEnum);
        this.enhancedPrefixOfTicketTypeEnum = this.injector.get(EnhancedPrefixOfTicketTypeEnum);
        this.showAndHideDetailTextEnum = this.injector.get(ShowAndHideTextDetailEnum);
        this.bookPassangerAssistEnum = this.injector.get(BookPassangerAssistEnum);
        this.storageDataService = this.injector.get(StorageDataService);
        this.enhancedRailCardTypeEnum = this.injector.get(EnhancedRailcardTypeEnum);
        this.bookingTypeEnum = this.injector.get(BookingTypeEnum);
        this.journeyTypeEnum = this.injector.get(JourneyTypeEnum);
        this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
        this.sharedServiceCache = this.injector.get(SharedServiceCache);
        this.bookingDetailsResponse = new BookingDetailsResponseDto();
        this.enhancedCompleteOrderService = this.injector.get(EnhancedCompleteOrderService);
        this.nativePaymentMethod = this.injector.get(NativePaymentMethodEnum);
        this.enhancedEticketRequestDto = new EticketRequestDto();
        this.enhancedDynamicClassEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
        this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
        this.monetateService = this.injector.get(MonetateService);
        this.appConstantService = this.injector.get(AppConstantsService);
        this.enhancedGA4DatalayerEventEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
        this.enhancedConfirmationPageEnum = this.injector.get(EnhancedConfirmationPageEnum);
        this.enhancedPaymentPageMessageEnum = this.injector.get(EnhancedPaymentPageMessageEnum);
        this.enhancedJourneyType = this.injector.get(EnhancedJourneyType);
        this.ticketTypeEnum = this.injector.get(TicketTypeEnum);
        this.permissionTextEnum = this.injector.get(PermissionTextEnum);
        this.classTypeEnum = this.injector.get(ClassTypeEnum);
        this.searchRequest = this.sharedService.searchRequest;
        this.setValidatePaymentResponse();
        this.removeQuickBuyAndBrowserBackFromLocalStorage();
        this.validateJourneyPaymentResponse();
        this.checkPaymentRecordsForPaymentDetails();
        let fortressId = this.getFortcidFromCookies();
        let fortressClubId = this.getFortclubFromCookies();
        if (fortressId && fortressClubId) {
            try {
                this.fortressFunction(this.validatePaymentResponse.Journey, fortressId, fortressClubId);
            } catch (error) {
                console.log('fortress error:' + error);
            }
        }
        this.settingPaymentSummaryListArrayObjects();
        localStorage.removeItem(this.localStorageEnum.paymentData);
    }

    ngOnInit() {
        try {
            if (!this.surveyTriggered) {
                this.surveyTriggered = true;
                this.triggerSurvey();
            }
        } catch (error) {
            console.log(error);
        }
        this.ga4dataLayerService.loadGA4DataLayerAllPages(true, true);
        this.monetateService.setPageType();
        this.searchRequest = this.sharedService.searchRequest;
        let check = this.storageDataService.getStorageData(this.localStorageEnum?.isRedirectFromValidateDo, true);
        if (check) {
            this.isRedirectFromValidateDo = true;
        }
        
        if (!this.isRedirectFromValidateDo) {
        window.location.href = environment.qttUrl;
        return false;
        }
        else {
        this.storageDataService.clearStorageData(this.localStorageEnum?.isRedirectFromValidateDo);
        this.storageDataService.setStorageData(this.localStorageEnum?.isRedirectFromValidateDo, false, true);
        }
        this.setIsSeasonAsTrue();
        this.customerFirstName = localStorage.getItem(this.localStorageEnum?.firstName);
        this.setDeliveryModePriceOnNgOnInit();
        this.setSharedService();
        this.ga4dataLayerService.loadGTMDataLayerPurchaseOnConfirmation(this.validatePaymentResponse, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue, true, this.searchRequest);
        localStorage.removeItem(this.localStorageEnum.nreDataResponse);
        this.monetateService.setaddTrainBookingData(this.validatePaymentResponse);
        this.monetateService.setAddProductRowsEvent(this.validatePaymentResponse);
        this.monetateService.flushEvents();
        this.getBookPassengerAssistURL();
        this.validatePaymentResponse?.Journey?.forEach(e =>{
        if(e.AnnualGoldCardDetail?.IsGoldCardAvailable){
            let goldCardMsgsObj = {
            notificationErrorMsg: this.notificationErrorMsg.confirmedGoldCardMessage,
            notificationTitle: this.notificationErrorMsg.confirmedGoldCardTiltle,
            }
            this.commonService.enhancedCommonNotificationDialog('gold-card-alert-common-notification-dialog', goldCardMsgsObj, '', false, false, true, false);
            return;
        }
        });
        this.sharedService.selectedJourneyDataForQuickBuyOrContiue = null;
    }

    getBookPassengerAssistURL() {
        this.subscription = this.commonService.passnegerAssistUrl$.subscribe(() => {
        });
    }

    setDeliveryModePriceOnNgOnInit() {
        if (this.validatePaymentResponse != null) {
        this.validatePaymentResponse.Journey.forEach(journey => {

            if (journey.DeliveryDetail != null) {
            journey.DeliveryDetail.forEach(obj => {

                if (obj.DeliveryModeName == 'NEXTDAYDELIVERY') {
                this.nextDayDeliveryModePrice = obj.Price;
                }
                else if (obj.DeliveryModeName == 'FIRSTCLASSPOST') {
                this.firstClassPostPrice = obj.Price;
                }
            });
            }
        });
        }
    }

    setSharedService(){
        this.sharedService.enhancedReviewBuyResponse = null; // Remove basket data
        this.sharedService.getBasketCount.emit(0); // Remove basket data
        this.sharedService.reviewBuyCache = "";
        // this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData(this.localStorageEnum.sharedSiblingText);
        this.storageDataService.setStorageData(this.localStorageEnum.sharedSiblingText, this.sharedServiceCache, true);
    }

    setValidatePaymentResponse() {
        try {
            let validatePaymentResponse = localStorage.getItem(this.localStorageEnum?.validatePaymentResponseText);
            this.sharedService.validatePaymentResponse = JSON.parse(validatePaymentResponse);
            this.validatePaymentResponse = new ValidatePaymentResponse;
            this.validatePaymentResponse.Journey = [];
            this.validatePaymentResponse = this.sharedService.validatePaymentResponse;
        } catch (error) {
            console.log(error);
        }
    }

    removeQuickBuyAndBrowserBackFromLocalStorage(){
        localStorage.removeItem(this.localStorageEnum.isQuickBuyOrContinue);
        localStorage.removeItem(this.appRouteEnum.isBrowserBackButton);
    }

    validateJourneyPaymentResponse() {
        try {
            //word spacing
            this.validatePaymentResponse?.Journey?.forEach(journey => {

                this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey?.OutwardSeat);
                this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey?.ReturnSeat);
                //PICO-1301 check for outward multiple same railcard with count
                if (journey?.OutwardDetail?.Fares != null) {
                    this.commonService.checkMultipleRailcardCountForOutward(journey);
                }
                //PICO-1301 check for return multiple same railcard with count
                if (journey?.ReturnDetail?.Fares != null) {
                    this.commonService.checkMultipleRailcardCountForReturn(journey);
                }

                this.isExistNreDataResponse(journey);
            });
        } catch (error) {
            console.log(error);
        }
    }

    isExistNreDataResponse(journey) {
        try {
            let nreOutwardFaresTotalPrice = 0;
            let nreStorageDataObj = JSON.parse(localStorage.getItem(this.localStorageEnum?.nreDataResponse));
            let handOffIdFromNre = localStorage.getItem(this.localStorageEnum?.handOffRequestId);
            if (nreStorageDataObj?.OutwardFares && journey?.OutwardDetail) {
                nreStorageDataObj?.OutwardFares?.forEach(nreOutwardFarePrice => {
                if (nreOutwardFarePrice) {
                    nreOutwardFaresTotalPrice += nreOutwardFarePrice?.Price;
                }
                });
                if (journey?.DepartureDate == nreStorageDataObj?.SearchRequest?.DepartureDate && journey?.OutwardDetail?.Price == nreOutwardFaresTotalPrice) {
                let loadIframeForNreJourney = journey;
                this.bookingConfirmationCallback(nreStorageDataObj, loadIframeForNreJourney, this.validatePaymentResponse?.OrderId, handOffIdFromNre);
                }
            }
        } catch (error) {
            console.log(error);
            localStorage.removeItem(this.localStorageEnum.nreDataResponse);
            localStorage.removeItem(this.localStorageEnum.handOffRequestId);
            localStorage.removeItem(this.enhancedLocalOrSessionStorageKeysEnum.getDataFromNRE);
        }
    }

    bookingConfirmationCallback(nreStorageDataObj, validatePaymentResponse, orderId, handOffIdFromNre) {
        try {
            this.iframeSrc = this.commonService.trackNreHandOffUrl(nreStorageDataObj, true, validatePaymentResponse, orderId, handOffIdFromNre);
            localStorage.removeItem(this.localStorageEnum.handOffRequestId);
            localStorage.removeItem(this.enhancedLocalOrSessionStorageKeysEnum.getDataFromNRE);
        } catch (error) {
            console.log(error);
        }
    }

    checkPaymentRecordsForPaymentDetails() {
        try {
            if (this.validatePaymentResponse?.PaymentRecords?.length > 0) {
                this.validatePaymentResponse?.PaymentRecords?.forEach(paymentrecord => {
                    if (this.validatePaymentResponse?.PaymentRecords?.length > 1) {
                    if (paymentrecord.CardNumber) {
                        paymentrecord.CardNumber = paymentrecord?.CardNumber?.slice(0, 4) + paymentrecord?.CardNumber?.slice(4, paymentrecord?.CardNumber?.length - 4).replace(/\d/g, '*') + paymentrecord?.CardNumber?.slice(paymentrecord?.CardNumber?.length - 4);
                        this.paymentRecords?.push(paymentrecord);
                    } else if (paymentrecord?.PaymentMode != 'Evoucher') {
                        this.paymentRecords?.push(paymentrecord);
                    }
                    } else {
                    if (paymentrecord?.CardNumber) {
                        paymentrecord.CardNumber = paymentrecord?.CardNumber?.slice(0, 4) + paymentrecord?.CardNumber?.slice(4, paymentrecord?.CardNumber?.length - 4).replace(/\d/g, '*') + paymentrecord?.CardNumber?.slice(paymentrecord?.CardNumber?.length - 4);
                    }
                    this.paymentRecords?.push(paymentrecord);
                    }

                });
            }
        } catch (error) {
            console.log(error);
        }
    }

    getFortcidFromCookies(){
        return this.cookies.get(this.localStorageEnum?.fortCidText);
    }

    getFortclubFromCookies(){
        return this.cookies.get(this.localStorageEnum?.fortClubText);
    }

    fortressFunction(Journey, fortcId, fortClubId) {
        this.fortressValidateRequest = new FortressValidateRequest();
        this.fortressValidateRequest.id = fortcId;
        this.fortressValidateRequest.transactionIdentifier = fortcId;
        this.fortressValidateRequest.clubId = fortClubId;
        this.fortressValidateRequest.total = 0;
        this.productslist = [];
        Journey.forEach(journey => {
            this.fortressValidateRequest.total += journey.OutwardDetail.Price + (journey.ReturnDetail ? journey.ReturnDetail.Price : 0);
            this.fortressFunctionForOutwardDetail(journey);
            this.fortressFunctionForReturnDetail(journey);
        });
        if (this.productslist.length > 0) {
            this.fortressValidateRequest.produts = this.productslist;
            this.completeOrderService.fortressEndPoint(this.fortressValidateRequest).subscribe((res: any) => {
            if (res != null) {
                console.log('fortress success');
            } else {
                console.log('fortress error' + 'id:' + fortcId + 'clubId:' + fortClubId);
            }
            });
        }
    }

    fortressFunctionForOutwardDetail(journey) {
        if (journey?.OutwardDetail?.Operator === 1 || journey?.OutwardDetail?.Operator === 2) {
        if (journey && this.validatePaymentResponse?.Journey) {
            let product = this.isCheckProducts(journey, this.validatePaymentResponse?.Journey, true);
            if (product) {
            this.productslist?.push(product);
            }
        }
        }
    }

    fortressFunctionForReturnDetail(journey) {
        if (journey?.ReturnDetail != null && (journey?.ReturnDetail?.Operator === 1 || journey?.ReturnDetail?.Operator === 2)) {
        if (journey && this.validatePaymentResponse?.Journey) {
            let product = this.isCheckProducts(journey, this.validatePaymentResponse?.Journey, false);
            if (product) {
            this.productslist?.push(product);
            }
        }
        }
    }

    isCheckProducts(journey, validatePaymentResponse, isOutward) {
        this.products = new Products();
        this.products.productName = this.checkProductNameForJourney(isOutward, journey);
        this.products.productPrice = this.checkProductPriceForJourney(isOutward, journey);
        this.products.productQuantity = validatePaymentResponse.length.toString();
        this.products.productSKU = "";
        this.products.brand = this.getProductBrandMethod(isOutward, journey);
        this.products.category = (journey.OutwardDetail.Changes == '0' ? 'Direct' : 'Connection');
        this.products.category1 = "";
        this.products.variant = this.getVarient(isOutward, journey);
        this.products.metric1 = journey.Adult.toString();
        this.products.metric2 = journey.Child.toString();
        this.products.metric3 = (journey.Adult + journey.Child).toString();
        this.products.dimension1 = this.createDateForJourney(isOutward, journey);
        this.products.dimension2 = "";
        this.products.dimension3 = "";
        this.products.dimension4 = this.getTicketClassNameForJourney(isOutward, journey);
        this.products.dimension5 = this.getTicketTypeNameForJourney(isOutward, journey);
        this.products.dimension6 = this.getTravelTypeNameForJourney(isOutward, journey);
        this.products.dimension7 = journey.GAJourneyType;
        return this.products;
    }

    checkProductNameForJourney(isOutward, journey) {
        try {
        if (isOutward) {
            return journey?.Departure?.split('(')?.pop()?.split(')')[0] + '-' + journey?.Arrival?.split('(')?.pop()?.split(')')[0];
        } else if (!isOutward && journey?.ReturnDetail != null) {
            return journey?.Arrival?.split('(')?.pop()?.split(')')[0] + '-' + journey?.Departure?.split('(')?.pop()?.split(')')[0];
        }
        return '';
        } catch (error) {
        console.log(error);
        }
    }

    checkProductPriceForJourney(isOutward, journey) {
        try {
        if (isOutward) {
            return journey?.OutwardDetail?.Fares?.reduce((sum, current) => sum + current.Price, 0).toString();
        } else if (!isOutward && journey?.ReturnDetail != null) {
            return journey?.ReturnDetail?.Fares?.reduce((sum, current) => sum + current.Price, 0).toString();
        }
        return '';
        } catch (error) {
        console.log(error);
        }
    }

    getProductBrandMethod(isOutward, journey) {
        try {
        if (isOutward) return journey?.OutwardDetail?.Brand;
        else if (!isOutward && journey?.ReturnDetail != null) return journey?.ReturnDetail?.Brand;
        return '';
        } catch (error) {
        console.log(error);
        }
    }

    getVarient(isOutward, journey) {
        if (isOutward) {
        if (journey?.OutwardDetail?.Changes == '0') {
            return '1:' + journey?.Departure?.split('(').pop().split(')')[0] + '-' + journey.Arrival.split('(').pop().split(')')[0];
        } else {
            return journey?.OutwardDetail?.CallingPointName;
        }
        } else {
            if (journey?.ReturnDetail != null) {
                if (journey?.ReturnDetail?.Changes == '0') {
                return '1:' + journey?.Arrival?.split('(').pop().split(')')[0] + '-' + journey.Departure.split('(').pop().split(')')[0];
                } else {
                return journey?.ReturnDetail?.CallingPointName;
                }
            } else {
                return '';
            }
        }
    }

    createDateForJourney(isOutward, journey) {
        try {
            if (isOutward) {
                return this.datePipe?.transform(journey?.DepartureDate, 'dd/MM/yy');
            } else if (!isOutward && journey?.ReturnDetail != null) {
                return this.datePipe?.transform(journey?.ReturnDepartureDate, 'dd/MM/yy');
            }
            return '';
        } catch (error) {
            console.log(error);
        }
    }

    getTicketClassNameForJourney(isOutward, journey) {
        try {
            if (isOutward) {
                return journey?.OutwardDetail?.TicketClass;
            } else if (!isOutward && journey?.ReturnDetail != null) {
                return journey?.ReturnDetail?.TicketClass;
            }
            return '';
        } catch (error) {
            console.log(error);
        }
    }
  // get ticketTypeName which used below function in isCheckProducts
    getTicketTypeNameForJourney(isOutward, journey) {
        try {
            if (isOutward) {
                return journey?.OutwardDetail?.TicketType;
            } else if (!isOutward && journey?.ReturnDetail != null) {
                return journey?.ReturnDetail?.TicketType;
            }
            return '';
        } catch (error) {
            console.log(error);
        }
    }
    // get travelTypeName which used below function in isCheckProducts
    getTravelTypeNameForJourney(isOutward, journey) {
        try {
            if (isOutward) {
                return journey?.OutwardDetail?.TravelType;
            } else if (!isOutward && journey?.ReturnDetail != null) {
                return journey?.ReturnDetail?.TravelType;
            }
            return '';
        } catch (error) {
            console.log(error);
        }
    }

    onTabChange(event: MatTabChangeEvent) {
     this.selectedIndex = event.index;

     // close the e-ticket dropdown when tab changes
     this.closeEticketDropdownOnTabChange();
    }

    calculateTotalTravelExtrasPrice(travelExtrasArray: Array<any>) {
        let totalPrice = 0;
        if (travelExtrasArray && travelExtrasArray.length > 0) {
        travelExtrasArray.forEach(travelExtras => {
            totalPrice += travelExtras.Price;
        });
        }
        return totalPrice;
    }

    calendarClick (index) {
      try {
        let events = [];
        if (this.sharedService.validatePaymentResponse.Journey) {
          if (this.sharedService.validatePaymentResponse.Journey[index].OutwardDetail) {
            let outwardDetailObj = this.creatingOutAndRetJourneyEventDetail(true, this.sharedService.validatePaymentResponse.Journey[index], this.sharedService.validatePaymentResponse.JourneyReferenceNumber);
            events.push(outwardDetailObj);
          }
          if (this.sharedService.validatePaymentResponse.Journey[index].ReturnDetail) {
            let returnDetailObj = this.creatingOutAndRetJourneyEventDetail(false, this.sharedService.validatePaymentResponse.Journey[index], this.sharedService.validatePaymentResponse.JourneyReferenceNumber);
            events.push(returnDetailObj);
          }
          let content = this.calendarService.createEvent(events);
          if (content) {
            let fileName = environment.addToCalendarFileName + "-" +this.calendarService.formattingDateForCalendar(new Date(this.sharedService.validatePaymentResponse.Journey[index].DepartureDate),true) + ".ics";
            this.calendarService.download(fileName, content);
          } else {
            //this.notificationService.error("Something went wrong. Please try again later.");
          } 
        } else {
          //this.notificationService.error("Something went wrong. Please try again later.");
        }
      } catch (error) {
        console.log(error);
      }
    }

    creatingOutAndRetJourneyEventDetail (isOutwardOrReturn: boolean,journey: any, collectionReferenceNumber : any) {
        try {
            let arrivalTime = isOutwardOrReturn ? new Date(journey.ArrivalDate) : new Date(journey.ReturnArrivalDate);
            let departureTime = isOutwardOrReturn ? new Date(journey.DepartureDate) : new Date(journey.ReturnDepartureDate);
            let location = isOutwardOrReturn ? journey.Departure : journey.Arrival;
            let arrival = isOutwardOrReturn ? journey.Arrival : journey.Departure;
            let train = isOutwardOrReturn ? this.commonService.setTrainNo(journey.OutwardSeat) : this.commonService.setTrainNo(journey.ReturnSeat); // I have used here index as 0 bcz train no remains same for all seats
            let dataObject;
            if (isOutwardOrReturn) {
            dataObject =this.creatingCalendarFileData(true, location, journey, arrival, train, collectionReferenceNumber);
            } else {
            dataObject = this.creatingCalendarFileData(false, location, journey, arrival, train, collectionReferenceNumber);
            }
            return this.commonService.createCalendarDetailObject(departureTime, arrivalTime, dataObject.summary, dataObject.description, location);
        } catch (error) {
            console.log(error);
        }
    }

    creatingCalendarFileData(isOutwardOrReturn: boolean, location: any, journey: any, arrival: any, train: any, collectionReferenceNumber: any) {
        try {
            let obj;
            let description = '';
            if (isOutwardOrReturn) {
            obj = this.commonService.setCoachAndSeatForCalendarFile(journey.OutwardSeat);
            let outwardJourneyInformation = { location : location, arrival : arrival, train: train, journeyDetail: journey.OutwardDetail, coach: obj.coach, seats: obj.seats, collectionReferenceNumber: collectionReferenceNumber};
            description = this.creatingCalendarDescriptionString(outwardJourneyInformation);
            } else {
            obj = this.commonService.setCoachAndSeatForCalendarFile(journey.ReturnSeat)
            ;
            let returnJourneyInformation = { location : location, arrival : arrival, train: train, journeyDetail: journey.ReturnDetail, coach: obj.coach, seats: obj.seats, collectionReferenceNumber: collectionReferenceNumber}
            description = this.creatingCalendarDescriptionString(returnJourneyInformation);
            }
            let journeySummary = {location: location, arrival: arrival, train: train, coach: obj.coach, seats: obj.seats, collectionReferenceNumber: collectionReferenceNumber}
            let summary = this.commonService.creatingCalendarSummaryString(journeySummary);
            return {description: description, summary: summary};
        } catch (error) {
            console.log(error);
        }
    }

    creatingCalendarDescriptionString (journeyInformation: any) {
        try {
            let descriptionWithOutCollectionReference = `${journeyInformation.location}-${journeyInformation.arrival}; Train ${journeyInformation.train} , departing from ${journeyInformation.location} Hours: 
            ${journeyInformation.journeyDetail.DepartureTimeStart}; arriving at ${journeyInformation.arrival} Hours: ${journeyInformation.journeyDetail.ArrivalTimeStart}
            Coach ${journeyInformation.coach}, Seat(s) ${journeyInformation.seats}`;
            let descriptionWithCollectionReference = `${journeyInformation.location}-${journeyInformation.arrival}; Train ${journeyInformation.train} , departing from ${journeyInformation.location} Hours: 
            ${journeyInformation.journeyDetail.DepartureTimeStart}; arriving at ${journeyInformation.arrival} Hours: ${journeyInformation.journeyDetail.ArrivalTimeStart}
            Coach ${journeyInformation.coach}, Seat(s) ${journeyInformation.seats}; Collection reference number ${journeyInformation.collectionReferenceNumber}`;
            return journeyInformation.collectionReferenceNumber ? descriptionWithCollectionReference : descriptionWithOutCollectionReference;
        } catch (error) {
            console.log(error);
        }
    }

    navigateToBooking() {
        try {
            if (this.isSeason) {
            this.tabIndex = this.tabIndexValueEnum.seasonJourneyTabIndex;
            }
            else {
            this.tabIndex = this.tabIndexValueEnum.upcomingJourneyTabIndex;
            }
            localStorage.setItem(this.localStorageEnum.tabIndex, this.tabIndex.toString());
            this.router.navigateByUrl('/' + this.appRouteEnum.MyBookings);
        } catch (error) {
            console.log(error);
        }
    }

    setIsSeasonAsTrue(){
        if (localStorage.getItem(this.travelSolutionEnum?.isSeason)) {
        this.isSeason = true;
        }
    }

    showSeatPickerBasedOnAvailibilityForOutward(outwardSeat) {
        return ( outwardSeat && !outwardSeat.IsSeatPicker && this.commonService.isSeatPickerNotAvaliable(outwardSeat) );
    }

    showReservedOrNoReservedMessageForOutward(outwardSeat) {
        return this.showSeatPickerBasedOnAvailibilityForOutward(outwardSeat) ? this.enhancedReviewBuyReservedOrNonReservedMessageHeading?.noSeatReserved : this.enhancedReviewBuyReservedOrNonReservedMessageHeading?.seatReserved;
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

    getPanelKey(outwardSeatData: any, index: number, Journey): string {
        return Journey
        ? Journey + "_" + index
        : outwardSeatData?.Departure +
            "_" +
            outwardSeatData?.Arrival +
            "_" +
            index;
    }

    onParentPanelOpened(panel: MatExpansionPanel): void {
      this.activePanel = panel;
      // Manually trigger change detection so inner accordions are correctly initialized
      this.cdr.detectChanges();
    }

    noOfRailcardSelectedInJourneyInCaseOfGroupSave(railCardPrice) {
        let railcardLength = [...new Set(railCardPrice?.filter(
        (item) =>
            item?.Railcard?.toLowerCase() !== this.enhancedGA4DatalayerEventEnum?.noRailcard?.toLowerCase() && item?.Railcard?.toLowerCase() !== this.appRouteEnum?.newGroupSave?.toLowerCase()
        ).map(item => item?.Railcard))].length;
        return railcardLength === 0 ? "No" : railcardLength;
    }

    checkForGroupSaveRailcard(railCardPrice) {
        return railCardPrice?.filter(
        (item) =>
            item.Railcard.toLowerCase() ===
            this.appRouteEnum?.newGroupSave?.toLowerCase()
        ).length;
    }

    noOfRailcardSelectedInJourney(railCardPrice) {
        return [...new Set(railCardPrice?.filter((item) => item?.Railcard?.toLowerCase() !== this.enhancedGA4DatalayerEventEnum?.noRailcard?.toLowerCase() && item?.Railcard?.toLowerCase() !== this.appRouteEnum?.newGroupSave?.toLowerCase()).map(item => item?.Railcard))].length;
    }

    openTicketDetailInfo(enhancedFare) {
      try {
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

    bookPassengerAssistDetails(Journey) {
      try {
        let journeyList;
        this.passengerAssistRequest = new PassengerAssistRequest();
        this.passengerDetail = new PassengerDetail();
        this.passengerAssistRequest.BookingReference = this.validatePaymentResponse.ReferenceNumber;
        this.passengerAssistRequest.Companion = (Journey.Adult + Journey.Child) > 1 ? '1' : '0';
        this.passengerAssistRequest.ReturnJourney = (Journey.GAJourneyType == this.bookPassangerAssistEnum.single || Journey.GAJourneyType == this.bookPassangerAssistEnum.openReturn) ? '0' : '1';
        let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
        if (customerLoginResponse) {
          let getPassangerDetail = this.commonService.getCustomerLoginResForPassangerDetail(customerLoginResponse);
          this.passengerAssistRequest.PassengerDetail = getPassangerDetail;
        }
        if (Journey?.OutwardDetail) {
          journeyList = this.getJourneyDetailBasedOnDirection(Journey, true);
          this.passengerAssistRequest.OutwardJourneyDetails = journeyList;
        }
        if (this.passengerAssistRequest.ReturnJourney == '1' && Journey?.ReturnDetail) {
          journeyList = this.getJourneyDetailBasedOnDirection(Journey, false);
          this.passengerAssistRequest.ReturnJourneyDetails = journeyList;
        }
        this.commonService.enhancedBookPassangerAssistCallMethod(this.passengerAssistRequest);
      } catch (error) {
        console.log(error);
      }
    }

    getJourneyDetailBasedOnDirection(journey, isOutward) {
      try {
        this.journeyDetails = new PassengerJourneyDetails();
        this.reservationDetails = new PassengerReservationDetails();
        let [seatTypeValue, coachTypeValue] = isOutward ? this.commonService.getSeatAndCoachValue(journey.OutwardSeat) : this.commonService.getSeatAndCoachValue(journey.ReturnSeat);
        this.journeyDetails.Origin = isOutward ? journey?.Departure?.split('(')?.pop()?.split(')')[0] : journey?.Arrival?.split('(')?.pop()?.split(')')[0];
        this.journeyDetails.Destination = isOutward ? journey?.Arrival?.split('(')?.pop()?.split(')')[0] : journey?.Departure?.split('(')?.pop()?.split(')')[0];
        this.journeyDetails.DepartureDate = this.getOutAndReturnJourneyTransformDate(isOutward, journey);
        this.journeyDetails.DepartureTime = this.getOutAndReturnJourneyTime(isOutward, journey)
        this.journeyDetails.Via = journey?.ViaStation ? journey?.ViaStation?.split('(')?.pop()?.split(')')[0] : '';
        this.reservationDetails.CoachNumber = seatTypeValue ? seatTypeValue : '';
        this.reservationDetails.SeatNumber = coachTypeValue ? coachTypeValue : '';
        this.journeyDetails.ReservationDetails = this.reservationDetails;
        return this.journeyDetails;
      } catch (error) {
        console.log(error);
      }
    }

    getOutAndReturnJourneyTime(isOutward, journey) {
        try {
            if (isOutward) {
                return journey?.OutwardDetail ? journey?.OutwardDetail?.DepartureTimeStart : '';
            } else if (!isOutward && journey?.ReturnDetail != null) {
                return journey?.ReturnDetail?.DepartureTimeStart;
            }
            return '';
        } catch (error) {
            console.log(error);
        }
    }

    getOutAndReturnJourneyTransformDate(isOutward, journey) {
        try {
            if (isOutward) {
                return this.datePipe.transform(journey?.DepartureDate, 'dd/MM/yyyy');
            } else if (!isOutward && journey?.ReturnDetail != null) {
                return this.datePipe.transform(journey?.ReturnDepartureDate, 'dd/MM/yyyy');
            }
            return '';
        } catch (error) {
            console.log(error);
        }
    }

    noRailcardTextChange(railcardText){
        if (railcardText) {
            railcardText = railcardText?.replace(/r/, (match) => match.toUpperCase());
        }
        return railcardText;
    }

    hasBicycleReservationOutward(index): boolean {
        return this.validatePaymentResponse?.Journey[index]?.OutwardJourneyExtras?.some(
            (item) => item?.JourneyExtraName?.toLowerCase() === this.appConstantService?.bicycleReservation?.toLowerCase()
        );
    }

    hasBicycleReservationReturn(index): boolean {
        return this.validatePaymentResponse?.Journey[index]?.ReturnJourneyExtras?.some(
            (item) => item?.JourneyExtraName?.toLowerCase() === this.appConstantService?.bicycleReservation?.toLowerCase()
        );
    }

    getBicycleReservationTextOutward(index) {
        let bicycle = this.validatePaymentResponse?.Journey[index]?.OutwardJourneyExtras?.find(
            (item) => item?.JourneyExtraName?.toLowerCase() === this.appConstantService?.bicycleReservation?.toLowerCase()
        );
        if (bicycle?.Count != null) {
            const spaceLabel = bicycle.Count > 1 ? 'spaces' : 'space';
            return `${bicycle.Count} x ${spaceLabel} reserved`;
        }
        return null;
    }

    getBicycleReservationTextReturn(index) {
        let bicycle = this.validatePaymentResponse?.Journey[index]?.ReturnJourneyExtras?.find(
            (item) => item?.JourneyExtraName?.toLowerCase() === this.appConstantService?.bicycleReservation?.toLowerCase()
        );
        if (bicycle?.Count != null) {
            const spaceLabel = bicycle.Count > 1 ? 'spaces' : 'space';
            return `${bicycle.Count} x ${spaceLabel} reserved`;
        }
        return null;
    }

    showPaymentSummaryIfAvailable(paymentSummaryData, journey){
        if(paymentSummaryData?.length > 0 && paymentSummaryData?.some(obj => obj['Journey'] === journey?.Journey)){
            return true;
        } 
        return false;
    }

    settingPaymentSummaryListArrayObjects(){
        try {
            this.validatePaymentResponse?.Journey?.forEach(e => {
                // Filter and push data into discountPaymentSummaryListArrayObject
                e?.PaymentSummaryList?.forEach(item => {
                    if (item?.PaymentType?.toLowerCase() == this.bookingTypeEnum?.voucherCodePaymentType?.toLowerCase() || item?.PaymentType?.toLowerCase() == this.bookingTypeEnum?.railCardDiscountPaymentType?.toLowerCase() || item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.promotionDiscountPaymentType?.toLowerCase() || item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.groupSaveDiscountPaymentType?.toLowerCase()) {
                    item[this.journeyTypeEnum?.journeyText] = e?.Journey;
                    this.discountPaymentSummaryListArrayObject.push(item);
                    }
                });

                // Filter and push data into deliveryPaymentSummaryListArrayObject
                e?.PaymentSummaryList?.forEach(item => {
                    if (item?.PaymentType?.toLowerCase() == this.bookingTypeEnum?.trainTicketPaymentType?.toLowerCase() || item?.PaymentType?.toLowerCase() == this.bookingTypeEnum?.deliveryPaymentType?.toLowerCase()) {
                    item[this.journeyTypeEnum?.journeyText] = e?.Journey;
                    this.deliveryPaymentSummaryListArrayObject.push(item);
                    }
                });

                // Move all objects with PaymentType 'TrainTicket' to the top
                const trainTicketItems = this.deliveryPaymentSummaryListArrayObject.filter(obj => obj[this.journeyTypeEnum?.paymentTypeText]?.toLowerCase() === this.bookingTypeEnum?.trainTicketPaymentType?.toLowerCase());
                this.deliveryPaymentSummaryListArrayObject = [
                    ...trainTicketItems,
                    ...this.deliveryPaymentSummaryListArrayObject.filter(obj => obj[this.journeyTypeEnum?.paymentTypeText]?.toLowerCase() !== this.bookingTypeEnum?.trainTicketPaymentType?.toLowerCase())
                ];

                // Filter and push data into travelExtrasPaymentSummaryListArrayObject
                e?.PaymentSummaryList?.forEach(item => {
                    if ((item?.PaymentType?.toLowerCase() == this.travelSolutionEnum?.outward?.toLowerCase() || item?.PaymentType?.toLowerCase() == this.travelSolutionEnum?.return?.toLowerCase()) && item?.Name?.toLowerCase() !== this.appConstantService?.bicycleReservation?.toLowerCase()) {
                    item[this.journeyTypeEnum?.journeyText] = e?.Journey;
                    this.travelExtrasPaymentSummaryListArrayObject.push(item);
                    }
                });
            });
            this.sortTravelExtraAccordingToPlusBus();
        } catch (error) {
            console.log(error);
        }
    }

    setDiscountPaymentSummaryDetail(discount, journey){
        if(journey?.Journey == discount?.Journey){
            return discount?.Name?.replace(/Groupsave/i, this.appRouteEnum?.newGroupSave);
        }
        return '';
    }

    showDiscountPriceInPaymentSummaryDetail(discount, journey){
        if(journey?.Journey == discount?.Journey){
        return this.sharedService.formatPrice(discount?.Price);
        }
    }

    setDeliveryModeNameOrTrainTicket(deliveryName, journey){
        if(journey?.Journey == deliveryName?.Journey && deliveryName?.Name == this.appRouteEnum?.DeliveryMode_NEXTDAYDELIVERY){
            return this.deliveryModeEnum?.NextDayDelivery;
        } else if(journey?.Journey == deliveryName?.Journey && deliveryName?.Name == this.appRouteEnum?.DeliveryModeETicket){
            return this.deliveryModeEnum?.ETicket;
        } else if(journey?.Journey == deliveryName?.Journey && deliveryName?.Name == this.appRouteEnum?.DeliveryMode_TOD){
            return this.appRouteEnum?.DeliveryMode_TOD_Collect_At_Station;
        } else if(journey?.Journey == deliveryName?.Journey && deliveryName?.Name == this.appRouteEnum?.DeliveryMode_FIRSTCLASSPOST) {
            return this.deliveryModeEnum?.FirstClassPost;
        } else if(journey?.Journey == deliveryName?.Journey && deliveryName?.Name == this.appRouteEnum?.DeliveryMode_Smart_Card){
            return this.deliveryModeEnum?.SmartCard;
        } else {
            return deliveryName?.Name;
        }
    }

    bindDeliveryPriceInPaymentSummaryDetail(deliveryName, journey){
        if(journey?.Journey == deliveryName?.Journey){
            return deliveryName?.PaymentType == this.bookingTypeEnum.trainTicketPaymentType ? 
            this.sharedService.formatPrice(this.commonService.getTrainTicketPrice(journey?.PaymentSummaryList)) :
            this.sharedService.formatPrice(deliveryName?.Price);
        }
    }

    ngOnDestroy() {
        if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.ValidatePaymentDo)) {
        this.router.navigateByUrl("/" + this.appRouteEnum.Confirmation);
        }
        this.subscription.unsubscribe();
    }
    
    downloadTicket(journey: JourneyDetails, referenceNumber) {
       try {
        this.clickToCloseDownloadOption();
         this.showTicketOutsideArea = true;
         this.hideTicketOutsideArea = false;
         this.enhancedEticketRequestDto = this.enhancedEticketRequestDto || new EticketRequestDto();
         this.enhancedEticketRequestDto.EntitlementId = journey?.EntitlementId;
         this.enhancedEticketRequestDto.TravelId = journey.TravelId;
         this.enhancedEticketRequestDto.OrderId = parseInt(referenceNumber);
         this.enhancedEticketRequestDto.TravelSolutionId = journey?.TravelSolutionId;
         this.enhancedEticketRequestDto.IsPartialCoj = false;
     
         this.enhancedCompleteOrderService.enhancedDownloadTicket(this.enhancedEticketRequestDto).subscribe(
             res => {
                 if (res != null) {
                     this.responseData = res as ResponseData;
                     if (this.responseData.ResponseCode == '200') {
                         this.enhancedEticketResponse = this.responseData.Data;
                         this.setDownloadTicketResponse(journey);
                     }
                     else {
                        console.log(this.responseData.ResponseMessage);
                        this.commonService.showEnhancedCommonErrorPopup();
                     }
                 }
             }, err => {
               console.log(err);
           });
       } catch (error) {
         console.log(error);
       }
    }

    setDownloadTicketResponse(journey: JourneyDetails) {
        try {
          if (this.enhancedEticketResponse?.Eticket?.length > 0) {
            if (this.enhancedEticketResponse?.Eticket?.length === 1) {
                journey.ShowDownloadOptions = false;
              this.downloadPassengerTicket(this.enhancedEticketResponse?.Eticket[0]);
            } else {
                journey.ShowDownloadOptions = true;
                 this.enhancedEticketResponse.Eticket.forEach(t => {
                    t.DownloadedList = false;
                });
            }
          }
        } catch (error) {
          console.log(error);
        }
    }

    downloadPassengerTicket(eticket: EticketResponse) {
        try {
        this.enhancedEticketResponse.Eticket.forEach(t => {
            if (eticket.Name == t.Name && eticket.Text == t.Text) {
                t.DownloadedList = true;
            }
        });
          const byteArray = new Uint8Array(atob(eticket?.Content).split('').map(char => char.charCodeAt(0)));
          downloadFile(byteArray, eticket?.Name, 'application/pdf');
        } catch (error) {
          console.log(error);
        }
    }

    onClickOutSideToCloseDropdownList() {
        this.showTicketOutsideArea = false;
        this.hideTicketOutsideArea = true;
    }

    openPriceBreakdown(item, validatePaymentResponse) {
        this.dialog.open(EnhancedPriceBreakdownDialogs, {
          disableClose: true,
          panelClass: [
            this.enhancedDynamicClassEnum?.enhancedFooterPriceBreakDownPanelClass,
          ],
          width: "45rem",
          autoFocus: false,
          data: {
            searchRequest: this.searchRequest,
            selectedJourneyIndex: this.selectedIndex,
            isBookingConfirmation: true,
            XmlId: item?.XmlId,
            Journeys: validatePaymentResponse,
            PaidByEVoucher: item?.PaymentSummaryDetails?.PaidByEVoucher,
            IsPaidByMultipleEVoucher: item?.PaymentSummaryDetails?.IsPaidByMultipleEVoucher,
            PaymentSummaryDetailsList : validatePaymentResponse?.map(x => x.PaymentSummaryDetails)
          },
        });
    }

     checkPaymentSummaryListForTotalPrice(journey) {
        let totalPriceWithExtras = 0;
        if (journey) {
        if (journey.OutwardDetail) {
            totalPriceWithExtras += journey.OutwardDetail.Price
            + (journey.ReturnDetail ? journey.ReturnDetail.Price : 0) + (journey.DeliveryDetail ?
                journey.DeliveryDetail[0].Price
                : 0) + this.calculateTotalTravelExtrasPrice(journey.OutwardJourneyExtras) +
            this.calculateTotalTravelExtrasPrice(journey.ReturnJourneyExtras)
        }
        if (journey.SeasonDeatil && this.isSeason) {
            totalPriceWithExtras += journey.SeasonDeatil?.Price + (journey.DeliveryDetail ?
            journey.DeliveryDetail[0].Price : 0) + this.calculateTotalTravelExtrasPrice(journey.OutwardJourneyExtras)
        }
        }
        return totalPriceWithExtras;
    }

    checkIsApplePayGPayOrPayPalMode(paymentMode){
        return paymentMode?.PaidByApplePay > 0 || paymentMode?.PaidByGooglePay > 0 || paymentMode?.PaidByPaypal > 0;
    }

    displayTextInCaseOfApplePayGPayOrPaypal(paymentMode){
        if(paymentMode?.PaidByApplePay > 0){
            return this.nativePaymentMethod?.applePayeText;
        } else if (paymentMode?.PaidByGooglePay > 0) {
            return this.nativePaymentMethod?.googlePayText;
        } else if (paymentMode?.PaidByPaypal > 0) {
            return this.nativePaymentMethod?.payPalText;
        }
    }

    amountOfApplePayGPayOrPaypal(paymentMode){
        if(paymentMode?.PaidByApplePay > 0){
            return paymentMode?.PaidByApplePay;
        } else if (paymentMode?.PaidByGooglePay > 0) {
            return paymentMode?.PaidByGooglePay;
        } else if (paymentMode?.PaidByPaypal > 0) {
            return paymentMode?.PaidByPaypal;
        }
    }

    extractCardName(): string {
        for (let item of this.validatePaymentResponse?.PaymentDetailsWithModeList) {
            if (/CREDIT|DEBIT/i.test(item)) {
            let words = item.split('from')[1]?.trim().split(' ');
            let cardName = words?.filter(word => /^[A-Z]+$/.test(word) && word !== 'CREDIT' && word !== 'DEBIT')[0];
                if (cardName) {
                    // Capitalize only the first letter and lowercase the rest
                    return cardName.charAt(0) + cardName.slice(1).toLowerCase();
                }
            }
        }
        return '';
    }

    getRailcardSummary(journey): string[] {
        let faresList = this.noOfRailcardSelectedInJourneyInCaseOfGroupSave(journey?.OutwardDetail?.RailCardPrice) !== this.permissionTextEnum?.noText ? journey?.OutwardDetail?.RailCardPrice : journey?.ReturnDetail?.RailCardPrice;
        let filtered = faresList.filter(f => f.Railcard && f.Railcard?.toLowerCase() !== this.enhancedGA4DatalayerEventEnum?.noRailcard?.toLowerCase() && f.Railcard?.toLowerCase() !== this.appRouteEnum?.newGroupSave?.toLowerCase());
        let countMap: any = {};
        filtered.forEach(f => {
            countMap[f.Railcard] = (countMap[f.Railcard] || 0) + 1;
        });

        return Object.keys(countMap).map(key => `${key}`);
    }

    onClickManageBooking(journey: JourneyDetails) {
        this.sharedService.journey = journey;       
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData(this.localStorageEnum.sharedSiblingText);
        this.storageDataService.setStorageData(this.localStorageEnum.sharedSiblingText, this.sharedServiceCache, true);
        this.router.navigate([`./` + this.appRouteEnum.ViewBooking]);
    }

    setTravelExtrasPaymentSummaryName(travelExtrasName, travelExtrasTypes,journey){
        let travelExtra;
        if(journey?.Journey == travelExtrasName?.Journey){
            if(travelExtrasName?.Name?.toLowerCase() == this.appConstantService?.plusBus?.toLowerCase()){
                travelExtra = `${travelExtrasTypes?.PaymentType} ${this.commonService.capitalizePBInPlusBusTavelExtraWord(travelExtrasName?.Name?.toLowerCase())}`;
            } else if (travelExtrasName?.Name?.toLowerCase() == this.appConstantService?.londonTravelcard?.toLowerCase()) {
                travelExtra = travelExtrasName?.Name;
            }
        }
        return travelExtra;
    }

    getJourneyTabAriaLabel(index: number): string {
        try{
            let journeyNumber = index + 1;
            let isSelected = this.selectedIndex === index;
            return `Journey ${journeyNumber}, tab, ${isSelected ? this.enhancedPaymentPageMessageEnum.selected : this.enhancedPaymentPageMessageEnum.notSelected}`;
        } catch(error){ console.log(error); }
    }

    getSeatAccordionAriaLabel(seatData: any, index: number, journey: any, isOutward): string {
        try {
            let key = this.getPanelKey(seatData, index, journey);
            let isExpanded = isOutward ? this.isOutSeatDetailsOpenMap[key] : this.isRetSeatDetailsOpenMap[key];

            // Build dynamic seat info string
            let seatInfoList = '';
            if (seatData?.Seat?.length) {
                seatInfoList = seatData.Seat.map((seat: any) => {
                let seatLabel =
                    (seat?.CoachNumber && seat?.CoachNumber !== '*'
                    ? `${seat.CoachNumber}${seat.ReservationType !== this.appConstantService.unsupported ? seat.Seat : ''}`
                    : '') || '';

                let seatDesc = this.commonService?.filterSeatInfo(
                    this.commonService.getSeatInfoAndCoachType(seat)
                );

                return [seatLabel, seatDesc].filter(Boolean).join(', ');
                }).join('; ');
            }

            // Return dynamic aria label
            if (isExpanded) {
                return `${this.enhancedConfirmationPageEnum.hideSeatDetailTxt} ${this.enhancedConfirmationPageEnum.expandedTxt}${seatInfoList ? ', ' + seatInfoList : ''}`;
            } else {
                return `${this.enhancedConfirmationPageEnum.showSeatDetailTxt}`;
            }
      } catch(error){ console.log(error); }
    } 

    getAriaLabel(actionType: 'calendar' | 'viewAccount' | 'download', journey: any): string {
        try {
            let departure = journey?.Departure?.split('(')[0]?.trim() || '';
            let arrival = journey?.Arrival?.split('(')[0]?.trim() || '';

            switch (actionType) {
                case this.enhancedConfirmationPageEnum.calendar:
                return `${this.enhancedConfirmationPageEnum.addToCalendarTxt} ${departure} to ${arrival}`;
                case this.enhancedConfirmationPageEnum.viewAccount:
                return `${this.enhancedConfirmationPageEnum.viewAccountTxt} ${departure} to ${arrival}`;
                case this.enhancedConfirmationPageEnum.download:
                return `${this.enhancedConfirmationPageEnum.downloadEticketTxt} ${departure} to ${arrival}`;
                default:
                return '';
            }
        } catch(error){ console.log(error); }
    }

    onPaymentSummaryToggle(isExpanded: boolean): void {
      try {
        this.panelOpenState = isExpanded;
        if (this.panelOpenState) {
            setTimeout(() => {
            let btn = document.getElementById(
                'ebcc-biil-see-price-per-person-btn'
            ) as HTMLButtonElement | null;
        
            if (btn) {
                btn.focus();
            }
            }, 300);
        }
        this.paymentSummaryAriaLabel = isExpanded ? `${this.enhancedConfirmationPageEnum.paymentSummaryTxt} ${this.enhancedConfirmationPageEnum.expandedTxt}` : `${this.enhancedConfirmationPageEnum.paymentSummaryTxt} ${this.enhancedConfirmationPageEnum.collapsedTxt}`;
      } catch(error){ console.log(error); }
    }

    getExtraAriaLabel(item, isOutward: boolean, extra: any): string {
        try {
            if (!extra) return '';

            let extraName = extra?.JourneyExtraName || '';
            let journeyDate = isOutward ? this.datePipe.transform(item?.OutwardDetail?.DepartureTime, 'EEE, dd MMM yyyy') : this.datePipe.transform(item?.ReturnDetail?.DepartureTime, 'EEE, dd MMM yyyy');
            let journeyType = isOutward ? `${this.travelSolutionEnum.outward}` : `${this.travelSolutionEnum.return}`;

            return `${this.enhancedConfirmationPageEnum.externalSiteTxt} ${extraName} for your journey ${journeyType} ${journeyDate}`;
        } catch (err) {
            console.error(err);
            return '';
        }
    }

    clickToCloseDownloadOption() {
        this.validatePaymentResponse?.Journey.forEach(t => {
            t.ShowDownloadOptions = false;
        });
    }

    getDownloadAriaLabel(item: any, eticketList?: any[], eticket?: any, index?: number, isClick = false): string {
        try {
            let departure = item?.Departure?.split('(')[0]?.trim() || '';
            let arrival = item?.Arrival?.split('(')[0]?.trim() || '';

            // CASE 1: Main button (collapsed / expanded)
            if (!eticket && !eticketList) {
            return  `${this.enhancedConfirmationPageEnum.downloadEticketMenuTxt} ${departure} to ${arrival}`;
            }

            // CASE 2: When dropdown is open and user tabs to a passenger item
            if (!isClick && item?.ShowDownloadOptions && eticketList && eticket) {
            return `${eticket.Text} ${this.enhancedConfirmationPageEnum.downloadButtonTxt}`;
            }

            // CASE 3: When user clicks a passenger item to download
            if (isClick && eticket) {
            return `Start downloading ${eticket.Text} e-ticket`;
            }

            return '';
        } catch (error) {
            console.log(error);
            return '';
        }
    }  
    
    getPriceBreakdownAriaLabel(item: any, isOutward): string {
        try {
        if (!item) return '';

        let journeyDetail = isOutward ? item?.OutwardDetail : item?.ReturnDetail;
        let journeyDate = isOutward ? this.datePipe.transform(item?.OutwardDetail?.DepartureTime, 'EEE, dd MMM yyyy') : this.datePipe.transform(item?.ReturnDetail?.DepartureTime, 'EEE, dd MMM yyyy');
        let journeyType = isOutward ? this.travelSolutionEnum.outward : this.travelSolutionEnum.return;
        let commonText = this.getCommonJourneyText(item, journeyDetail);

        return `${commonText}. View price breakdown for your journey ${journeyType} ${journeyDate}`;
        } catch(error){ console.log(error); }
    }

    getTicketDetailAriaLabel(item, isOutward){
      try {
        let journeyDate = isOutward ? this.datePipe.transform(item?.OutwardDetail?.DepartureTime, 'EEE, dd MMM yyyy') : this.datePipe.transform(item?.ReturnDetail?.DepartureTime, 'EEE, dd MMM yyyy');
        return `Ticket details for your journey ${isOutward ? this.travelSolutionEnum.outward : this.travelSolutionEnum.return} ${journeyDate}`;
      } catch(error){ console.log(error); }
    }

    getTicketClassListAriaLabel(item: any, isReturn: boolean = false): string {
        try{
            if (!item) return '';
            
            let detail = isReturn ? item.ReturnDetail : item.OutwardDetail;
            if (!detail) return '';

            let commonText = this.getCommonJourneyText(item, detail);

            let journeyType = isReturn ? this.travelSolutionEnum.return : this.travelSolutionEnum.outward;


            let ticketType = detail.TicketType?.includes(this.ticketTypeEnum.firstClassTicketType) ? detail.TicketType.replace(this.ticketTypeEnum.firstClassTicketType, '').trim() : detail.TicketType;

            let ticketClass = detail.TicketClass ? `${detail.TicketClass} class` : '';
            // Fare description list
            let fareDescriptions = detail.FareDescription || [];
            let fareListCount = fareDescriptions.length;
            let fareList =
            fareListCount > 0
            ? `. List with ${fareListCount} item${fareListCount > 1 ? 's' : ''}. ` +
                fareDescriptions.map((desc: string, i: number) => `${i + 1}. ${desc}`).join(' ')
            : '';

            return `${journeyType} journey ticket ${commonText} ${ticketType} ${ticketClass}${fareList}`;
        } catch(error){ console.log(error); }
    }

    getCommonJourneyText(item: any, journeyDetail: any): string {
        try {
            let adultText = `${item.Adult} ${this.enhancedPassangerTypeEnum.adultText}${item.Adult > 1 ? 's' : ''}`;
            let childText = item.Child
                ? `, ${item.Child} ${item.Child > 1 ? this.enhancedPassangerTypeEnum.ChildrenText : this.enhancedPassangerTypeEnum.ChildText}`
                : '';

            let railcardCount = this.noOfRailcardSelectedInJourney(journeyDetail?.RailCardPrice);
            let groupSave = this.checkForGroupSaveRailcard(journeyDetail?.RailCardPrice);

            let railcardText = '';
            if (railcardCount === 0 && groupSave === 0) {
                railcardText = `, ${this.noRailcardTextChange(this.enhancedRailCardTypeEnum?.noRailcardText)}`;
            } else if (railcardCount > 0 && groupSave === 0) {
                railcardText = `, ${railcardCount} ${this.enhancedConfirmationPageEnum.railcardTxt}${railcardCount > 1 ? 's' : ''}`;
            } else if (groupSave > 0) {
                railcardText = `, ${this.noOfRailcardSelectedInJourneyInCaseOfGroupSave(journeyDetail?.RailCardPrice)} ${this.enhancedConfirmationPageEnum.railcardTxt}${railcardCount > 1 ? 's' : ''} ${this.appRouteEnum?.newGroupSave}`;
            }

            return `${adultText}${childText}${railcardText}`;
        } catch(error){ console.log(error); }
    }

    getManageBookingAriaLabel(item: any): string {
        if (!item) return;

        try {
            const origin = item?.Departure?.split('(')[0] || '';
            const destination = item?.Arrival?.split('(')[0] || '';
            const departureDate = this.datePipe.transform(item?.DepartureDate, 'EEE, dd MMM yyyy');
            
            // Journey type
            let journeyTypeText = '';
            if (item?.OutwardDetail?.OpenReturnExpiryDate) {
            journeyTypeText = `${this.enhancedJourneyType.openReturn} journey`;
            } else if (!item?.OutwardDetail?.OpenReturnExpiryDate) {
            journeyTypeText = `${this.enhancedJourneyType.return} journey`;
            } else {
            journeyTypeText = `${this.travelSolutionEnum.outward} journey`;
            }

            // Passengers
            const adultText = `${item.Adult || 0} ${this.enhancedPassangerTypeEnum.adultText}${item.Adult > 1 ? 's' : ''}`;
            const childText = item.Child ? `, ${item.Child} ${item.Child > 1 ? this.enhancedPassangerTypeEnum.ChildrenText : this.enhancedPassangerTypeEnum.ChildText}` : '';

            // Total fare
            const totalFare = this.checkPaymentSummaryListForTotalPrice(item);

            return `${this.enhancedConfirmationPageEnum.manageBookingBtnTxt} ${origin} to ${destination} Departing ${departureDate} ${journeyTypeText} ${adultText}${childText} total ${this.sharedService.currencySymbol('')}${totalFare.toFixed(2)}`;
        } catch (error) {
            console.error(error);
        }
    }

    closeEticketDropdownOnTabChange(): void {
        try {
            // Hide any dropdown shown on screen
            this.showTicketOutsideArea = false;
            this.hideTicketOutsideArea = true;

            // Reset all journeys' dropdown flags
            if (this.validatePaymentResponse?.Journey?.length) {
            this.validatePaymentResponse.Journey.forEach((journey: any) => {
                journey.ShowDownloadOptions = false;
            });
            }
        } catch (error) {
            console.log(error);
        }
    }

    openPlusBusInfo(){
        window.open(this.enhancedConfirmationPageEnum.plusBusInfo, '_blank');
    }

    openLondonTravelcardInfo(){
        window.open(this.enhancedConfirmationPageEnum.travelCardInfo, '_blank');
    }

    formatZoneString(str) {
        if (!str) return str;

        let formatted = str.trim();
        if (/off\s?-?\s?peak/i.test(formatted)) {
            formatted = formatted.replace(/off\s?peak/i, this.enhancedPrefixOfTicketTypeEnum?.offPeak);
        } else if (/peak/i.test(formatted)) {
            formatted = formatted.replace(/peak/i, this.enhancedPrefixOfTicketTypeEnum?.anytime);
        }
        
        formatted = formatted
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());

        return formatted;
    }

    sortTravelExtraAccordingToPlusBus(){
        this.travelExtrasPaymentSummaryListArrayObject.sort((a, b) => {
                if (a.Name?.toLowerCase() === this.appConstantService?.plusBus?.toLowerCase() && b.Name?.toLowerCase() !== this.appConstantService?.plusBus?.toLowerCase()) return -1;
                if (a.Name?.toLowerCase() !== this.appConstantService?.plusBus?.toLowerCase() && b.Name?.toLowerCase() === this.appConstantService?.plusBus?.toLowerCase()) return 1;
                return 0;
        });
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

   ngAfterViewInit(): void {
    // Jab bhi menu items change hon (first time data aaye etc.)
    this.menuItems.changes.subscribe(() => {
      // Agar menu open hai, to first item ko focus de do
      if (this.menuTrigger?.menuOpen) {
        const firstItem = this.menuItems.first;
        if (firstItem) {
          // Thoda delay taki DOM fully ready ho
          setTimeout(() => firstItem.focus());
        }
      }
    });
  }

  getAriaLabelForOutAndRetStations(isOutward, item) {
    try {
      let from = this.commonService.getCityNameOnly(isOutward ? item?.Departure : item?.Arrival);
      let to = this.commonService.getCityNameOnly(isOutward ? item?.Arrival : item?.Departure);
      let departTime = isOutward ? item?.OutwardDetail?.DepartureTimeStart : item?.ReturnDetail?.DepartureTimeStart;
      let arrivalTime = isOutward ? item?.OutwardDetail?.ArrivalTimeStart : item?.ReturnDetail?.ArrivalTimeStart;
      let journeyTime = this.commonService.formatdurationTime(isOutward ? item?.OutwardDetail?.Duration : item?.ReturnDetail?.Duration)
      let getChangeLabel = isOutward ? this.commonService.getChangeLabel(item?.OutwardDetail?.Changes) : this.commonService.getChangeLabel(item?.ReturnDetail?.Changes);
      return `${from} to ${to}. ${departTime} to ${arrivalTime}. ${journeyTime} ${getChangeLabel}.`;
    } catch (error) { console.log(error); }
  }

  calculateTotalFare(fares, paymentSummaryList, isOutwardOrOpenReturn) {
    if (!Array.isArray(fares)) return 0;

    let isRailcardExist = fares?.some(
        x => x.Railcard?.toLowerCase() !== this.enhancedGA4DatalayerEventEnum?.noRailcard?.toLowerCase()
    );

    return fares.reduce((total, { Price, BasePrice, Railcard, FarePerson } = {}, index, array) => {

        let price = Number(Price) || 0;
        let basePrice = Number(BasePrice) || 0;        

        let has100PercentVoucherPayment = paymentSummaryList?.some(
            x => x.PaymentType === this.bookingTypeEnum?.voucherCodePaymentType && x.IsHundredPercentDiscountApplied
        );

        let hasVoucherPayment = paymentSummaryList?.some(
            x => x.PaymentType === this.bookingTypeEnum?.voucherCodePaymentType
        );

        let hasVoucher = has100PercentVoucherPayment || hasVoucherPayment;
        let isChild = FarePerson?.includes(this.enhancedPassangerTypeEnum?.ChildText);

        total += hasVoucher
            ? (isChild ? basePrice / 2 : basePrice)
            : price;

        if (
            Railcard &&
            Railcard?.toLowerCase() !== this.enhancedGA4DatalayerEventEnum?.noRailcard?.toLowerCase() &&
            !has100PercentVoucherPayment &&
            !hasVoucherPayment
        ) {
            if (isChild) {
                basePrice = basePrice / 2;
            }
            total += Math.max(basePrice - price, 0);
        }

        if (index === array.length - 1 && isOutwardOrOpenReturn && !isRailcardExist &&
            !has100PercentVoucherPayment &&
            !hasVoucherPayment) {
            let deliveryCharges = paymentSummaryList?.find(
                x => x.PaymentType === this.bookingTypeEnum?.deliveryPaymentType
            )?.Price || 0;

            total -= deliveryCharges;
        }

        return total;

    }, 0);
  }

  triggerSurvey() {
    let w: any = window; 
    if (w.usabilla_live?.trigger) {
        w.usabilla_live.trigger('new flow survey');
    }
  }
}