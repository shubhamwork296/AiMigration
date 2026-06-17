import { Component, Injector, OnInit } from '@angular/core';
import { FortressValidateRequest, PassengerJourneyDetails, PassengerAssistRequest, PassengerAssistResponse, PassengerDetail, Products, PassengerReservationDetails, ValidatePaymentResponse } from 'src/app/models/payment-details/validate-payment-response.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { AppConstantsService, AppRouteEnum, BookingTypeEnum, BookPassangerAssistEnum, DeliveryModeEnum, JourneyTypeEnum, LocalStorageKeyEnum, NotificationErrorMsg, TabIndexValueEnum, TravelSolutionJourneyTypeEnum } from 'src/app/utility/app-constants.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { MatDialog } from '@angular/material/dialog';
import { TicketInfoComponent } from '../mixing-deck/ticket-info/ticket-info.component';
import { Router } from '@angular/router';
import { FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { environment } from 'src/environments/environment';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { CompleteOrderService } from 'src/app/services/complete-order.service';
import { DatePipe } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { CommonServices } from 'src/app/services/common.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { CalendarService } from 'src/app/services/calendar.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-booking-confirmation',
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit {
  validatePaymentResponse: ValidatePaymentResponse;
  customerFirstName: string;
  isNetsPm: boolean = false;
  isEvoucherPM: boolean = false;
  firstClassPostPrice: number;
  nextDayDeliveryModePrice: number;
  isSeason: boolean = false;
  isRedirectFromValidateDo: boolean = false;
  tabIndex: number;
  showjourney: boolean = true;
  returnshowjourney: boolean = true;
  fortressValidateRequest: FortressValidateRequest;
  products: Products;
  productslist: Array<Products> = [];
  responseData: ResponseData;
  seasonShowjourney: boolean = true;
  paymentRecords = [];
  showOpenReturnJourney: boolean = true;
  innerWidth: number = 0;
  maskedPaymentCardNumber: string;
  stepIndex = 0;

  sharedService: SharedService;
  appRouteEnum: AppRouteEnum;
  commonService: CommonServices;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  datalayerService: DataLayerService;
  completeOrderService: CompleteOrderService;
  datePipe: DatePipe;
  cookies: CookieService;
  ga4datalayerService: GA4DatalayerService;
  passengerAssistRequest: PassengerAssistRequest;
  passengerDetail: PassengerDetail;
  journeyDetails: PassengerJourneyDetails;
  reservationDetails: PassengerReservationDetails;
  passengerAssistResponse: PassengerAssistResponse;
  bookPassangerAssistEnum: BookPassangerAssistEnum;
  calendarService : CalendarService;
  notificationService: NotificationService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  tabIndexValueEnum: TabIndexValueEnum;
  subscription: Subscription;
  notificationErrorMsg: NotificationErrorMsg;
  bookingTypeEnum: BookingTypeEnum;
  discountPaymentSummaryListArrayObject: any = [];
  travelExtrasPaymentSummaryListArrayObject: any = [];
  deliveryPaymentSummaryListArrayObject: any = [];
  deliveryModeEnum: DeliveryModeEnum;
  travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
  journeyTypeEnum: JourneyTypeEnum;
  appConstantService: AppConstantsService;
  iframeSrc: any;
  nreHandOffUrlDataObj;
  createUrl:any;

  constructor(private readonly router: Router, private readonly injector: Injector, public dialog: MatDialog,) {
    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonService = this.injector.get(CommonServices);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.datalayerService = this.injector.get(DataLayerService);
    this.completeOrderService = this.injector.get(CompleteOrderService);
    this.datePipe = this.injector.get(DatePipe);
    this.cookies = this.injector.get(CookieService);
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
    this.bookPassangerAssistEnum = this.injector.get(BookPassangerAssistEnum);
    this.calendarService = this.injector.get(CalendarService);
    this.notificationService = this.injector.get(NotificationService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.tabIndexValueEnum = this.injector.get(TabIndexValueEnum);
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
    this.deliveryModeEnum = this.injector.get(DeliveryModeEnum);
    this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.journeyTypeEnum = this.injector.get(JourneyTypeEnum);
    this.appConstantService = this.injector.get(AppConstantsService);
    let data = localStorage.getItem('validatePaymentResponse');
    this.sharedService.validatePaymentResponse = JSON.parse(data);

    this.validatePaymentResponse = new ValidatePaymentResponse;
    this.validatePaymentResponse.Journey = [];
    this.validatePaymentResponse = this.sharedService.validatePaymentResponse;
    localStorage.removeItem(this.localStorageKeyEnum.isQuickBuyOrContinue);
    localStorage.removeItem(this.appRouteEnum.isBrowserBackButton);
    this.validateJourneyPaymentResponse();
    //PICO-1301 check Payment Records length for showing payment details
    this.checkPaymentRecordsForPaymentDetails();
    // Start PICO-1171 (Fortress Integration)
    // check cookies value for call fortress function
    let fortressId: string = this.cookies.get('fortcid');
    let fortressClubId: string = this.cookies.get('fortclub');
    if (fortressId && fortressClubId) {
      try {
        this.fortressFunction(this.validatePaymentResponse.Journey, fortressId, fortressClubId);
      } catch (error) {
        console.log('fortress error:' + error);
      }
    }
    // End
    this.bookingTypeEnum = this.injector.get(BookingTypeEnum);
    this.settingPaymentSummaryListArrayObjects()
  }

  validateJourneyPaymentResponse() {
    //word spacing
    this.validatePaymentResponse.Journey.forEach(journey => {

      this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.OutwardSeat);
      this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.ReturnSeat);
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
  }

  checkPaymentRecordsForPaymentDetails() {
    if (this.validatePaymentResponse?.PaymentRecords?.length > 0) {
      this.validatePaymentResponse.PaymentRecords.forEach(paymentrecord => {
        if (this.validatePaymentResponse.PaymentRecords.length > 1) {
          if (paymentrecord.CardNumber) {
            paymentrecord.CardNumber = paymentrecord.CardNumber.slice(0, 4) + paymentrecord.CardNumber.slice(4, paymentrecord.CardNumber.length - 4).replace(/\d/g, '*') + paymentrecord.CardNumber.slice(paymentrecord.CardNumber.length - 4);
            this.paymentRecords.push(paymentrecord);
          } else if (paymentrecord.PaymentMode != 'Evoucher') {
            this.paymentRecords.push(paymentrecord);
          }
        } else {
          if (paymentrecord.CardNumber) {
            paymentrecord.CardNumber = paymentrecord.CardNumber.slice(0, 4) + paymentrecord.CardNumber.slice(4, paymentrecord.CardNumber.length - 4).replace(/\d/g, '*') + paymentrecord.CardNumber.slice(paymentrecord.CardNumber.length - 4);
          }
          this.paymentRecords.push(paymentrecord);
        }

      });
    }
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

  // method for check open return journey
  isOpenReturnJourney(journey) {
    if (((journey.OutwardDetail !== null) && ((journey.OutwardDetail.TicketType == 'Anytime Return') || (journey.OutwardDetail.TicketType == 'Anytime Return 1st') || (journey.OutwardDetail.TicketType == 'Off-Peak Return') || (journey.OutwardDetail.TicketType == 'Off-Peak Return 1st')) && (journey.ReturnDetail == null))) {
      return true;
    }
    return false;
  }

  step = 0;
  setStep(step) {
    this.step = step;
  }

  //added for check all journey accordian Index
  setStepIndex(step) {
    this.stepIndex = step;
  }

  ngOnDestroy() {
    if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.ValidatePaymentDo)) {
      this.router.navigateByUrl("/" + this.appRouteEnum.Confirmation);
    }
    this.subscription.unsubscribe();
  }

  expandOrCollapseInMobile() {
    if (window.screen.width <= 767) { // 768px portrait
      this.showjourney = false;
      this.returnshowjourney = false;
      this.showOpenReturnJourney = false;
      this.seasonShowjourney = false;
    } else {
      this.showjourney = true;
      this.returnshowjourney = true;
      this.showOpenReturnJourney = true;
      this.seasonShowjourney = true;
    }
  }

  ngOnInit() {
    //PICO-1301 check screen width for expanded & unexpanded collapse in mobile
    this.expandOrCollapseInMobile();
    this.datalayerService.loadGTMDataLayerOnPageUpdate();
    // page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
    let check = this.storageDataService.getStorageData("isRedirectFromValidateDo", true);
    if (check) {
      this.isRedirectFromValidateDo = true;
    }
    if (!this.isRedirectFromValidateDo) {
      window.location.href = environment.qttUrl;
      return false;
    }
    else {
      this.storageDataService.clearStorageData("isRedirectFromValidateDo");
      this.storageDataService.setStorageData("isRedirectFromValidateDo", false, true);
    }
    this.setIsSeasonAsTrue();
    this.customerFirstName = localStorage.getItem('FirstName');
    this.setDeliveryModePriceOnNgOnInit();
    this.sharedService.reviewBuyResponse = null; // Remove basket data
    this.sharedService.getBasketCount.emit(0); // Remove basket data
    this.sharedService.reviewBuyCache = "";
    this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
    try {
      this.datalayerService.loadGTMDataLayerOnTransactionConfirmation(this.validatePaymentResponse);
      this.ga4datalayerService.loadGTMDataLayerPurchaseOnConfirmation(this.validatePaymentResponse, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
    } catch (error) { console.log(error); }

    this.getBookPassengerAssistURL();
    this.validatePaymentResponse?.Journey?.forEach(e =>{
      if(e.AnnualGoldCardDetail?.IsGoldCardAvailable){
        let goldCardMsgsObj = {
          notificationErrorMsg: this.notificationErrorMsg.confirmedGoldCardMessage,
          notificationTitle: this.notificationErrorMsg.confirmedGoldCardTiltle,
        }
        this.commonService.commonNotificationDialog('gold-card-alert-common-notification-dialog', goldCardMsgsObj, '', false, false, true, false);
        return;
      }
    });
    this.sharedService.selectedJourneyDataForQuickBuyOrContiue = null;
  }

  getBookPassengerAssistURL() {
    this.subscription = this.commonService.passnegerAssistUrl$.subscribe(bookPassengerAssistUrl => {
      if (bookPassengerAssistUrl) {
        this.ga4datalayerService.loadGALayerForBookPassangerAssist(bookPassengerAssistUrl, this.router.url);
      }
    });
  }

  navigateToBooking() {
    if (this.isSeason) {
      this.tabIndex = this.tabIndexValueEnum.seasonJourneyTabIndex;
    }
    else {
      this.tabIndex = this.tabIndexValueEnum.upcomingJourneyTabIndex;
    }
    localStorage.setItem(this.localStorageKeyEnum.tabIndex, this.tabIndex.toString());
    this.router.navigateByUrl('/' + this.appRouteEnum.MyBookings);
  }
  ticketInfo(ticketType: any) {
    if (ticketType == 'season') {
      this.dialog.open(TicketInfoComponent, {
        disableClose: false,
        panelClass: 'ticket-info',
        data: {
          TicketType: ticketType.trim()
        }
      });
    } else {
      this.dialog.open(TicketInfoComponent, {
        disableClose: false,
        panelClass: 'ticket-info',
        data: {
          TicketType: ticketType.TicketType.trim(),
          TicketDescription: ticketType.TicketDescription,
          TicketRestriction: ticketType.TicketRestriction,
          ticketTypeCode: ticketType.TicketTypeCode,
          IsViewBooking: true
        }
      });
    }
  }

  //PICO-1301 call function for Expanded & unexpanded collapse
  journeytoggle() {
    this.showjourney = !this.showjourney;
  }
  returnjourneytoggle() {
    this.returnshowjourney = !this.returnshowjourney;
  }
  seasonjourneytoggle() {
    this.seasonShowjourney = !this.seasonShowjourney;
  }
  openReturnJourneytoggle() {
    this.showOpenReturnJourney = !this.showOpenReturnJourney;
  }

  //start function get varient for outward & return
  getVarient(isOutward, journey) {
    if (isOutward) {
      if (journey.OutwardDetail.Changes == '0') {
        return '1:' + journey.Departure.split('(').pop().split(')')[0] + '-' + journey.Arrival.split('(').pop().split(')')[0];
      } else {
        return journey.OutwardDetail.CallingPointName;
      }
    } else {
      if (journey.ReturnDetail != null) {
        return journey.ReturnDetail.Changes == '0' ? '1:' + journey.Arrival.split('(').pop().split(')')[0] + '-' + journey.Departure.split('(').pop().split(')')[0] : journey.ReturnDetail.CallingPointName;
      } else {
        return '';
      }
    }
  }
  // create product name which used below function in isCheckProducts
  checkProductNameForJourney(isOutward, journey) {
    try {
      if (isOutward) {
        return journey.Departure.split('(').pop().split(')')[0] + '-' + journey.Arrival.split('(').pop().split(')')[0];
      } else if (!isOutward && journey.ReturnDetail != null) {
        return journey.Arrival.split('(').pop().split(')')[0] + '-' + journey.Departure.split('(').pop().split(')')[0];
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }
  // create product price which used below function in isCheckProducts
  checkProductPriceForJourney(isOutward, journey) {
    try {
      if (isOutward) {
        return journey.OutwardDetail.Fares.reduce((sum, current) => sum + current.Price, 0).toString();
      } else if (!isOutward && journey.ReturnDetail != null) {
        return journey.ReturnDetail.Fares.reduce((sum, current) => sum + current.Price, 0).toString();
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }
  // create product date which used below function in isCheckProducts
  createDateForJourney(isOutward, journey) {
    try {
      if (isOutward) {
        return this.datePipe.transform(journey.DepartureDate, 'dd/MM/yy');
      } else if (!isOutward && journey.ReturnDetail != null) {
        return this.datePipe.transform(journey.ReturnDepartureDate, 'dd/MM/yy');
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }
  // get ticketClassName which used below function in isCheckProducts
  getTicketClassNameForJourney(isOutward, journey) {
    try {
      if (isOutward) {
        return journey.OutwardDetail.TicketClass;
      } else if (!isOutward && journey.ReturnDetail != null) {
        return journey.ReturnDetail.TicketClass;
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
        return journey.OutwardDetail.TicketType;
      } else if (!isOutward && journey.ReturnDetail != null) {
        return journey.ReturnDetail.TicketType;
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
        return journey.OutwardDetail.TravelType;
      } else if (!isOutward && journey.ReturnDetail != null) {
        return journey.ReturnDetail.TravelType;
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }
  // get product Brand which used below function in isCheckProducts
  getProductBrandMethod(isOutward, journey) {
    try {
      if (isOutward) return journey.OutwardDetail.Brand;
      else if (!isOutward && journey.ReturnDetail != null) return journey.ReturnDetail.Brand;
      return '';
    } catch (error) {
      console.log(error);
    }
  }

  // Start create to send products data to the productlist below in fortressFunction (PICO-1171 Fortress Function)
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
  //End

  // Start PICO-1171 Fortress Function for call the api
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
    if (journey.OutwardDetail.Operator === 1 || journey.OutwardDetail.Operator === 2) {
      if (journey && this.validatePaymentResponse?.Journey) {
        let product = this.isCheckProducts(journey, this.validatePaymentResponse.Journey, true);
        if (product) {
          this.productslist.push(product);
        }
      }
    }
  }

  fortressFunctionForReturnDetail(journey) {
    if (journey.ReturnDetail != null && (journey.ReturnDetail.Operator === 1 || journey.ReturnDetail.Operator === 2)) {
      if (journey && this.validatePaymentResponse?.Journey) {
        let product = this.isCheckProducts(journey, this.validatePaymentResponse.Journey, false);
        if (product) {
          this.productslist.push(product);
        }
      }
    }
  }
  //End
  getOutAndReturnJourneyTime(isOutward, journey) {
    try {
      if (isOutward) {
        return journey.OutwardDetail ? journey.OutwardDetail.DepartureTimeStart : '';
      } else if (!isOutward && journey.ReturnDetail != null) {
        return journey.ReturnDetail.DepartureTimeStart;
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }

  getOutAndReturnJourneyTransformDate(isOutward, journey) {
    try {
      if (isOutward) {
        return this.datePipe.transform(journey.DepartureDate, 'dd/MM/yyyy');
      } else if (!isOutward && journey.ReturnDetail != null) {
        return this.datePipe.transform(journey.ReturnDepartureDate, 'dd/MM/yyyy');
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }
// PICO-1400 create to send out & ret journey data to the passengerAssistRequest below in bookPassengerAssistDetails
  getJourneyDetailBasedOnDirection(journey, isOutward) {
    try {
      this.journeyDetails = new PassengerJourneyDetails();
      this.reservationDetails = new PassengerReservationDetails();
      let [seatTypeValue, coachTypeValue] = isOutward ? this.commonService.getSeatAndCoachValue(journey.OutwardSeat) : this.commonService.getSeatAndCoachValue(journey.ReturnSeat);
      this.journeyDetails.Origin = isOutward ? journey.Departure.split('(').pop().split(')')[0] : journey.Arrival.split('(').pop().split(')')[0];
      this.journeyDetails.Destination = isOutward ? journey.Arrival.split('(').pop().split(')')[0] : journey.Departure.split('(').pop().split(')')[0];
      this.journeyDetails.DepartureDate = this.getOutAndReturnJourneyTransformDate(isOutward, journey);
      this.journeyDetails.DepartureTime = this.getOutAndReturnJourneyTime(isOutward, journey)
      this.journeyDetails.Via = journey.ViaStation ? journey.ViaStation.split('(').pop().split(')')[0] : '';
      this.reservationDetails.CoachNumber = seatTypeValue ? seatTypeValue : '';
      this.reservationDetails.SeatNumber = coachTypeValue ? coachTypeValue : '';
      this.journeyDetails.ReservationDetails = this.reservationDetails;
      return this.journeyDetails;
    } catch (error) {
      console.log(error);
    }
  }
  // PICO-1400 call method on click book passanger assist on confirmation & view booking page
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
      this.commonService.bookPassangerAssistCallMethod(this.passengerAssistRequest);
    } catch (error) {
      console.log(error);
    }
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
          this.notificationService.error("Something went wrong. Please try again later.");
        } 
      } else {
        this.notificationService.error("Something went wrong. Please try again later.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  creatingOutAndRetJourneyEventDetail (isOutwardOrReturn: boolean,journey: any, collectionReferenceNumber : any) {
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
  }

  creatingCalendarFileData(isOutwardOrReturn: boolean, location: any, journey: any, arrival: any, train: any, collectionReferenceNumber: any) {
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
  }

  creatingCalendarDescriptionString (journeyInformation: any) {
    let descriptionWithOutCollectionReference = `${journeyInformation.location}-${journeyInformation.arrival}; Train ${journeyInformation.train} , departing from ${journeyInformation.location} Hours: 
    ${journeyInformation.journeyDetail.DepartureTimeStart}; arriving at ${journeyInformation.arrival} Hours: ${journeyInformation.journeyDetail.ArrivalTimeStart}
    Coach ${journeyInformation.coach}, Seat(s) ${journeyInformation.seats}`;
    let descriptionWithCollectionReference = `${journeyInformation.location}-${journeyInformation.arrival}; Train ${journeyInformation.train} , departing from ${journeyInformation.location} Hours: 
    ${journeyInformation.journeyDetail.DepartureTimeStart}; arriving at ${journeyInformation.arrival} Hours: ${journeyInformation.journeyDetail.ArrivalTimeStart}
    Coach ${journeyInformation.coach}, Seat(s) ${journeyInformation.seats}; Collection reference number ${journeyInformation.collectionReferenceNumber}`;
    return journeyInformation.collectionReferenceNumber ? descriptionWithCollectionReference : descriptionWithOutCollectionReference;
  }

  // created method for showing Total amount of journey
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

  setIsSeasonAsTrue(){
    if (localStorage.getItem('IsSeason')) {
      this.isSeason = true;
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

  setDiscountPaymentSummaryDetail(discount, journey){
    if(journey?.Journey == discount?.Journey){
      return discount?.Name;
    }
    return '';
  }

  bindDeliveryPriceInPaymentSummaryDetail(deliveryName, journey){
    if(journey?.Journey == deliveryName?.Journey){
      return deliveryName?.PaymentType == this.bookingTypeEnum.trainTicketPaymentType ? 
      this.sharedService.formatPrice(this.commonService.getTrainTicketPrice(journey?.PaymentSummaryList)) :
      this.sharedService.formatPrice(deliveryName?.Price);
    }
  }

  showDiscountPriceInPaymentSummaryDetail(discount, journey){
    if(journey?.Journey == discount?.Journey){
      return this.sharedService.formatPrice(discount?.Price);
    }
  }

  setTravelExtrasPaymentSummaryName(travelExtrasName, travelExtrasTypes,journey){
    let travelExtra;
    if(journey?.Journey == travelExtrasName?.Journey){
      if(travelExtrasName?.Name?.toLowerCase() == this.appConstantService?.plusBus?.toLowerCase()){
        travelExtra = `${travelExtrasTypes?.PaymentType} ${this.commonService.capitalizePBInPlusBusTavelExtraWord(travelExtrasName?.Name?.toLowerCase())}`;
      } else{
        travelExtra = `${travelExtrasTypes?.PaymentType} ${travelExtrasName?.Name}`;
      }
    }
    return travelExtra;
  }

  showPaymentSummaryIfAvailable(paymentSummaryData, journey){
    if(paymentSummaryData?.length > 0 && paymentSummaryData?.some(obj => obj['Journey'] === journey?.Journey)){
      return true;
    } 
    return false;
  }

  settingPaymentSummaryListArrayObjects(){
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
        if (item?.PaymentType?.toLowerCase() == this.travelSolutionJourneyTypeEnum?.outward?.toLowerCase() || item?.PaymentType?.toLowerCase() == this.travelSolutionJourneyTypeEnum?.return?.toLowerCase()) {
          item[this.journeyTypeEnum?.journeyText] = e?.Journey;
          this.travelExtrasPaymentSummaryListArrayObject.push(item);
        }
      });
    });
  }

  bindPriceForPaymentSummaryListInDeliveryType(paymentSummary, journey){
    return (paymentSummary?.PaymentType ==
      this.bookingTypeEnum.trainTicketPaymentType) ?
      this.sharedService.formatPrice(this.commonService.getTrainTicketPrice(journey?.PaymentSummaryList)) :
      this.sharedService.formatPrice(paymentSummary?.Price);
  }

  bindDeliveryModeNameForPaymentSummaryList(paymentSummary){
    return paymentSummary?.Name == this.appRouteEnum?.DeliveryMode_NEXTDAYDELIVERY ? this.appRouteEnum?.DeliveryMode_NextDayDelivery :
    (paymentSummary?.Name == this.appRouteEnum?.DeliveryModeETicket ? this.appRouteEnum?.DeliveryMode_ETicket :
    paymentSummary?.Name)
  }

  bindPaymentTypeForPaymentSummaryInSeason(paymentSummary){
    return (paymentSummary?.PaymentType == this.bookingTypeEnum.voucherCodePaymentType || paymentSummary?.PaymentType == this.bookingTypeEnum.railCardDiscountPaymentType) ? '-' : '';
  }

  // display iframe for nre tracking 
  bookingConfirmationCallback(nreStorageDataObj, validatePaymentResponse, orderId, handOffIdFromNre) {
    this.iframeSrc = this.commonService.trackNreHandOffUrl(nreStorageDataObj, true, validatePaymentResponse, orderId, handOffIdFromNre);
    localStorage.removeItem(this.localStorageKeyEnum.nreDataResponse);
    localStorage.removeItem(this.localStorageKeyEnum.handOffRequestId);
  }

  isExistNreDataResponse(journey) {
    try {
      let nreOutwardFaresTotalPrice = 0;
      let nreStorageDataObj = JSON.parse(localStorage.getItem(this.localStorageKeyEnum?.nreDataResponse));
      let handOffIdFromNre = localStorage.getItem(this.localStorageKeyEnum?.handOffRequestId);
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
      localStorage.removeItem(this.localStorageKeyEnum.nreDataResponse);
      localStorage.removeItem(this.localStorageKeyEnum.handOffRequestId);
    }
  }
} 
