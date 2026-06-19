import { DatePipe } from "@angular/common";
import { signal, Component, Inject, OnInit, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { browserRefresh } from "src/app/app-component/app.component";
import { ELEMENT_DATA } from "src/app/Component/my-account/payments-vouchers/order-smartcard/order-smartcard.component";
import { EnhancedFareBreakdownModel } from "src/app/models/enhanced-mixing-deck/enhanced-fare-breakdown.model";
import { EnhancedFareModel } from "src/app/models/enhanced-mixing-deck/enhanced-fare.model";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { CommonServices } from "src/app/services/common.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import { AppConstantsService, AppRouteEnum, DeliveryModeEnum, EnhancedAppRouteEnum, EnhancedGa4DatalayeEventNameEnum, EnhancedJourneyType, EnhancedPassangerTypeEnum, EnhancedRailcardTypeEnum, EnhancedTravelSolutionTypesEnum, TicketTypeEnum } from "src/app/utility/app-constants.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { environment } from "src/environments/environment";


@Component({
    selector: "enhanced-price-breakdown-dialogs",
    templateUrl: "./enhanced-price-breakdown-dialogs.component.html",
    styleUrls: ['./enhanced-price-breakdown-dialogs.component.css'],
    standalone: false
})

export class EnhancedPriceBreakdownDialogs implements OnInit{
 
  headerTitle: string = `Price breakdown`;
  readonly panelOpenState = signal(false);
  dataSource = ELEMENT_DATA; // where ELEMENT_DATA is your array
  displayedColumns = ['Passenger', 'RailCard', 'PricePerPersonAndTotalPrice'];
  departureLocationName: string;
  arrivalLocationName: string;
  browserRefresh: boolean;
  sharedService: SharedService;
  storageDataService: StorageDataService;
  enhancedFareBreakdownModelData: EnhancedFareBreakdownModel[];
  totalFare: string;
  totalDiscount: number = 0;
  isPromo: boolean = false;
  totalPrice: string;
  commonService: CommonServices;
  searchRequest: EnhancedSearchRequestModel;
  datePipe: DatePipe;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  selectedOutwardFare: EnhancedFareModel;
  selectedReturnFare: EnhancedFareModel;
  enhancedPassangerTypeEnum: EnhancedPassangerTypeEnum;
  enhancedRailcardTypeEnum: EnhancedRailcardTypeEnum;
  selectedTabIndex = 0;
  // Table 2: Passenger / Travel Extras / Price
  displayedExtrasColumns = ['Passenger', 'JourneyExtrasTitle', 'TotalPrice'];
  outwardJourneyExtras: any[] = [];
  returnJourneyExtras: any[] = [];
  router: Router;
  enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
  enhancedGA4DataLayerEnum: EnhancedGa4DatalayeEventNameEnum;
  currentSelectedPageUrl: string;
  appRouteEnum: AppRouteEnum;
  deliveryModeEnum: DeliveryModeEnum;
  isReviewBuy: boolean;
  appConstantsService: AppConstantsService;
  evouchPrice: number;
  selectedVouchers: boolean;
  totalVoucherPrice: number;
  isPaidByMultipleEVoucher: boolean;
  paymentList: any[] = [];
  enhancedTravelSolutionTypesEnum: EnhancedTravelSolutionTypesEnum;
  enhancedJourneyType: EnhancedJourneyType;
  ticketTypeEnum: TicketTypeEnum;

  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedPriceBreakdownDialogs>) {
    this.sharedService = this.injector.get(SharedService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.enhancedFareBreakdownModelData = new Array<EnhancedFareBreakdownModel>();
    this.commonService = this.injector.get(CommonServices);
    this.searchRequest = new EnhancedSearchRequestModel();
    this.datePipe = this.injector.get(DatePipe);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.enhancedPassangerTypeEnum = this.injector.get(EnhancedPassangerTypeEnum);
    this.enhancedRailcardTypeEnum = this.injector.get(EnhancedRailcardTypeEnum);
    this.router = this.injector.get(Router);
    this.enhancedGA4DataLayerService = this.injector.get(EnhancedGA4DatalayerService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.deliveryModeEnum = this.injector.get(DeliveryModeEnum);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.enhancedGA4DataLayerEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
    this.paymentList = this.data?.PaymentSummaryDetailsList  || [];
    this.enhancedTravelSolutionTypesEnum = this.injector.get(EnhancedTravelSolutionTypesEnum);
    this.enhancedJourneyType = this.injector.get(EnhancedJourneyType);
    this.ticketTypeEnum = this.injector.get(TicketTypeEnum);
  }

  ngOnInit(): void {
    this.currentSelectedPageUrl = `${environment.qttUrl}${this.router?.url?.replace(/^\/+/, '')}`;
    this.enhancedGA4DataLayerService.loadGA4DataLayerInformationModalEvent(this.enhancedGA4DataLayerEnum?.priceBreakDown, this.currentSelectedPageUrl);
    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh)
        this.sharedService.searchRequest = sharedSiblingRefresh?.searchRequest;
      this.searchRequest = this.sharedService?.searchRequest;
    }
    if (this.data?.searchRequest) {
      this.departureLocationName = this.data.searchRequest?.DepartureLocationName;
      this.arrivalLocationName = this.data.searchRequest?.ArrivalLocationName;
      this.searchRequest = this.data?.searchRequest;
      this.selectedOutwardFare = this.data?.selectedOutwardFare;
      this.selectedReturnFare = this.data?.selectedReturnFare;
      this.selectedTabIndex = this.data?.selectedJourneyIndex ?? 0;
      this.isReviewBuy = !!(this.data?.isReviewBuy || this.data?.isPaymentPage || this.data?.isBookingConfirmation);
      this.selectedVouchers = this.data?.selectedVouchers;
      this.totalVoucherPrice = this.data?.totalVoucherPrice;
    }
    this.getFareBreakDownData();
  }

  getFareBreakDownData() {
    try {
      this.enhancedFareBreakdownModelData = this.sharedService?.fareBreakdownModelData;

       // Step 2: Only for confirmation page — reorder using XML ID
      if (this.data?.isBookingConfirmation && this.data?.Journeys?.length) {
        this.enhancedFareBreakdownModelData = this.createConfirmationFareBreakdownModel(this.enhancedFareBreakdownModelData, this.data?.Journeys);
      }

      this.totalFare = this.sharedService?.calculateTotalAmount();
      this.totalDiscount = this.sharedService?.fareBreakDownTotalDiscount;
      this.enhancedFareBreakdownModelData.forEach(element => {
        this.isPromo = element?.OutWardJourney?.some((item) => item?.RailCard?.toLowerCase().includes('1 promotion applied'));

        if (element?.OutWardJourney) {
          element.OutWardJourney = this.prepareOutwardJourneyList(element?.OutWardJourney);
        }
        if (element?.ReturnJourney) {
          element.ReturnJourney = this.prepareOutwardJourneyList(element?.ReturnJourney);
        }

        if (element?.OutwardJourneyExtras) {
          this.outwardJourneyExtras = element?.OutwardJourneyExtras;
        }
        if (element?.ReturnJourneyExtras) {
          this.returnJourneyExtras = element?.ReturnJourneyExtras;
        }

        if (element?.OutwardJourneyExtrasPerPassenger) {
          element.OutwardJourneyExtrasPerPassenger = this.prepareOutwardTravelExtraJourneyList(element?.OutwardJourneyExtrasPerPassenger);
        }
        if (element?.ReturnJourneyExtrasPerPassenger) {
          element.ReturnJourneyExtrasPerPassenger = this.prepareOutwardTravelExtraJourneyList(element?.ReturnJourneyExtrasPerPassenger);
        }

      });

      if (this.data?.isBookingConfirmation) {
        this.evouchPrice = this.data?.PaidByEVoucher || 0;
        this.isPaidByMultipleEVoucher = this.data?.IsPaidByMultipleEVoucher || false;
      } else {
        this.enhancedFareBreakdownModelData.forEach(element => {
          if (element?.EvoucherPrice && element?.EvoucherPrice > 0) {
            this.evouchPrice = element.EvoucherPrice;
          }
        });
      }
      // added fare break down price for review buy
      this.totalPrice = this.commonService.getTotalJourneyAmount(this.sharedService);
    } catch (error) { console.log(error); }
  }
    
  getAriaLabelForOutAndRetStations(isOutward: boolean, fareBreakdown: any) {
    try {
      let fbFrom = isOutward ? fareBreakdown?.departureLocationName : fareBreakdown?.arrivalLocationName;
      let fbTo   = isOutward ? fareBreakdown?.arrivalLocationName   : fareBreakdown?.departureLocationName;

      let from = this.commonService.getCityNameOnly(fbFrom ?? (isOutward ? this.departureLocationName : this.arrivalLocationName));
      let to   = this.commonService.getCityNameOnly(fbTo ?? (isOutward ? this.arrivalLocationName : this.departureLocationName));

      let departTime = isOutward ? (fareBreakdown?.OutwardDepartureTime || '') : (fareBreakdown?.ReturnDepartureTime || '');
      let arrivalTime = isOutward ? (fareBreakdown?.OutwardArrivalTime || '') : (fareBreakdown?.ReturnArrivalTime || '');
      let journeyTime = this.commonService.formatdurationTime(isOutward ? fareBreakdown?.OutwardDuration : fareBreakdown?.ReturnDuration);
      let getChangeLabel = isOutward ? this.commonService.getChangeLabel(fareBreakdown?.OutChanges) : this.commonService.getChangeLabel(fareBreakdown?.RetChanges);

      return `${from} to ${to}. ${departTime} to ${arrivalTime}. ${journeyTime} ${getChangeLabel}.`;
    } catch (error) {
      console.log(error);
      return '';
    }
  }


  getAriaLabelForJourneyTitle(isOutward) {
    try {
      let getTitle = isOutward ? 'Outward' : 'Return';
      let date = isOutward ? this.datePipe.transform(this.searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy') : this.datePipe.transform(this.searchRequest?.ReturnTimesStartShow, 'EEE, dd MMM yyyy');
      return `${getTitle}: ${date}`;
    } catch (error) { console.log(error); }
  }

  getAriaLabelForFareBreakDownJourneyData(journey) {
    try {
      if (!journey) return '';

      const { Passenger, RailCard, TotalPrice, PricePerPerson, IsCheck } = journey;
      let label = `Passenger: ${journey?.DisplayPassenger}.`;

      if (RailCard) {
        label += ` Railcard or offers: ${RailCard}.`;
      }
      label += ` Price: ${this.sharedService.currencySymbol('')}${TotalPrice}`;
      if (IsCheck && PricePerPerson) {
        label += `, discounted from ${this.sharedService.currencySymbol('')}${PricePerPerson}`;
      }
      return label;
    } catch (error) { console.log(error); }
  }

  getAriaLabelForTotalCount() {
    try {
      const totalPrice = this.totalFare || 0;
      const { Adult = 0, Child = 0, RailCardList = [] } = this.searchRequest || {};
      // Passenger string
      let passengerLabel = '';
      if (Adult > 0) {
        passengerLabel += `${Adult} ${Adult === 1 ? 'Adult' : 'Adults'}`;
      }
      if (Child > 0) {
        passengerLabel += (passengerLabel ? ', ' : '') + `${Child} ${Child === 1 ? this.enhancedPassangerTypeEnum.ChildText : this.enhancedPassangerTypeEnum.ChildrenText}`;
      }
      // Railcard string
      const railcardCount = RailCardList.length;
      const railcardLabel = railcardCount > 0
        ? `${railcardCount} ${railcardCount > 1 ? 'railcards' : 'railcard'} applied`
        : this.enhancedRailcardTypeEnum.noRailCardAppliedText;

      return `Total, ${this.sharedService.currencySymbol('')}${totalPrice} for ${passengerLabel || 'no passengers'}, ${railcardLabel}.`;
    } catch (error) { console.log(error); }
  }

  prepareOutwardJourneyList(journeyList: any[]): any[] {
    try {
      let countPassenger: { [key: string]: number } = {};

      return journeyList.map(j => {
        let passengerType = j.Passenger.split('*')[1].trim();

        if (!countPassenger[passengerType]) {
          countPassenger[passengerType] = 1;
        } else {
          countPassenger[passengerType]++;
        }
        return {
          ...j,
          DisplayPassenger: `${passengerType} ${countPassenger[passengerType]}`
        };
      });
    } catch (error) { console.log(error); }
  }

  getDeliveryTitle(title: string): string {
    try {
      if (!title) {
        return '';
      }
      if (title?.toLowerCase() == this.appRouteEnum?.DeliveryMode_TOD?.toLowerCase()) {
        return `${this.appRouteEnum?.collect_at_any_stationText}`;
      }
      else if (title?.toLowerCase() == this.appRouteEnum?.DeliveryModeETicket?.toLowerCase()) {
        return `${this.appRouteEnum?.DeliveryMode_ETicket}`;
      } else if (title == this.appRouteEnum?.DeliveryMode_Smart_Card) {
        return `${this.deliveryModeEnum?.SmartCard}`;
      } else if (title == this.appRouteEnum?.DeliveryMode_FIRSTCLASSPOST) {
        return `${this.deliveryModeEnum?.firstClassPostMsg}`;
      } else if (title == this.appRouteEnum?.DeliveryMode_NEXTDAYDELIVERY) {
        return `${this.deliveryModeEnum?.nextDayDeliveryPostMsg}`;
      }
      else {
        return title;
      }
    } catch (error) { console.log(error); }
  }

  isOnDeliveryAndReviewPage(): boolean {
    return this.router?.url?.includes(this.enhancedAppRouteEnum.deliveryAndReviewBy);
  }

  getOutwardDate(fareBreakdown): Date | string {
    return this.isReviewBuy ? fareBreakdown?.DepartureDate : this.searchRequest?.DepartureTimesStartShow;
  }

  getReturnDate(fareBreakdown): Date | string {
    return this.isReviewBuy ? fareBreakdown?.ReturnDate : this.searchRequest?.ReturnTimesStartShow;
  }

  getFormattedJourneyExtrasTitle(title: string, departure: string): string {
    if (!title) return '';

    switch (title) {
      case this.appConstantsService.bicycleReservation:
        return `${this.appConstantsService.bikeReservationTxt}`;
      case this.appConstantsService.londonTravelcard:
        return `${this.appConstantsService.londonTravelcard}`;
      case this.appConstantsService.plusBus:
        return departure ? `PlusBus for ${departure}` : '';
      default:
        return title;
    }
  }

  getPassengerSummary(isReviewBuy: boolean, selectedTabIndex: number): string {
    try {
      let adult = 0;
      let child = 0;

      if (isReviewBuy) {
        let journey = this.enhancedFareBreakdownModelData[selectedTabIndex];
        adult = journey?.Adult || 0;
        child = journey?.Child || 0;
      } else {
        adult = Number(this.searchRequest?.Adult) || 0;
        child = Number(this.searchRequest?.Child) || 0;
      }
      if (adult === 0) {
        return `${child} ${child === 1 ? 'Child' : 'Children'}`;
      } else if (child === 0) {
        return `${adult} ${adult === 1 ? 'Adult' : 'Adults'}`;
      } else {
        return `${adult} ${adult === 1 ? 'Adult' : 'Adults'}, ${child} ${child === 1 ? 'Child' : 'Children'}`;
      }
    } catch (error) { console.log(error); }
  }

  activeTabIndex(): number {
    return (this.selectedTabIndex !== null && this.selectedTabIndex !== undefined) ? this.selectedTabIndex : 0; // fallback → first journey
  }

  get isSingleTab(): boolean {
    return this.enhancedFareBreakdownModelData?.length === 1;
  }

  isExistPaymentPage(): boolean {
    return this.router?.url?.includes(this.enhancedAppRouteEnum.payment);
  }

  discountAriaLabel(fareBreakdown): string {
  try{
  if (!fareBreakdown || fareBreakdown.DiscountPercent <= 0) {
    return '';
  }

  const discountType = fareBreakdown.DiscountType || '';
  const discountPercent = fareBreakdown.DiscountPercent || 0;
  const discountPrice = this.sharedService.formatPrice(fareBreakdown.DiscountPrice);
  const currency = this.sharedService.currencySymbol('');

  return `Discount ${discountType} (-${discountPercent}%) applied to total price -${currency}${discountPrice}`;
  } catch (error) { console.log(error); }
}

getTicketDeliveryAriaLabel(delivery: any): string {
  try{
  if (!delivery) {
    return '';
  }
  const title = this.getDeliveryTitle(delivery?.JourneyDeliveryTitle);
  const price = this.sharedService.formatPrice(delivery?.TotalPrice);
  const currency = this.sharedService.currencySymbol('');

  return `Ticket delivery ${title} applied to total price ${currency}${price}`;
  } catch (error) { console.log(error); }
}

getFinalJourneyPrice(totalJourneyPrice): number {
    let price = totalJourneyPrice || 0;

    if (this.isExistPaymentPage() && this.selectedVouchers) {
      // hamesha bade se chhote ka difference
      // price = Math.abs(price - this.totalVoucherPrice);
      if (this.totalVoucherPrice >= price) {
      price = 0;
      } else {
      price = price - this.totalVoucherPrice;
      }
    }

    return price;
  }

  shouldShowDiscountedPrice(): boolean {
    return this.isExistPaymentPage() && this.selectedVouchers && this.enhancedFareBreakdownModelData?.length == 1;
  }

  createConfirmationFareBreakdownModel(fareBreakdownData: any[], Journeys: any): any[] {
  try {
      let journeys = Journeys || [];
      let fareBreakdownMap = new Map(fareBreakdownData.map(fb => [fb.XmlId, fb]));

      let confirmationModel = journeys.map(journey => {
        let matchingFareBreakdown = fareBreakdownMap.get(journey?.XmlId);
        return {...matchingFareBreakdown, XmlId: journey?.XmlId, // ensure ID consistency
        };
      });

      return confirmationModel;
    } catch (error) {
      console.error('Error creating confirmation fare breakdown:', error);
      return [];
    }
  }

  onTabChange(event: any) {
    this.selectedTabIndex = event.index;

    let currentPayment = this.paymentList[this.selectedTabIndex];

    this.evouchPrice = currentPayment?.PaidByEVoucher || 0;
    this.isPaidByMultipleEVoucher = currentPayment?.IsPaidByMultipleEVoucher || false;
  }

  getAriaLabelOnPrice(element){
   try {
      if (!element) return '';

      const { TotalPrice, PricePerPerson, IsCheck } = element;
      let label = '';

      label += ` Price: ${this.sharedService.currencySymbol('')}${TotalPrice}`;
      if (IsCheck && PricePerPerson) {
        label += `, discounted from ${this.sharedService.currencySymbol('')}${PricePerPerson}`;
      }
      return label;
    } catch (error) { console.log(error); }
  }

  checkToShowPureReturnAndOpenReturnCard(fareBreakdown) : boolean{
    if(this.isReviewBuy){
      return fareBreakdown?.OpenReturnExpiryDate;
    } else {
      return fareBreakdown?.IsReturnJourney && fareBreakdown?.OutWardJourney?.length > 0 && fareBreakdown?.ReturnJourney?.length == 0;
    }
  }

  checkToShowPureReturnAndOpenReturnCardTitle(fareBreakdown) : boolean{
    if(this.isReviewBuy){
      return fareBreakdown?.OpenReturnExpiryDate;
    } else {
      return this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn;
    }
  }

  prepareOutwardTravelExtraJourneyList(journeyList: any[]): any[] {
    try {
      // JourneyExtrasTitle + PassengerType wise counter
      let countMap: { [key: string]: number } = {};

      return journeyList.map(j => {
        let passengerType = j.Passenger.split(' ')[1].trim(); // Adult / Child
        let extrasTitle = j.JourneyExtrasTitle?.trim();

        if (j.JourneyExtrasTitle?.toLowerCase() === this.appConstantsService?.bicycleReservation?.toLowerCase()) {
          // If it is, no modification to passenger count or DisplayPassenger
          return {
            ...j,
            DisplayPassenger: `${j.Passenger}` // Keep the original passenger value
          };
        }

        // 🔑 Key sirf extras + passenger pe based
        let key = `${extrasTitle}_${passengerType}`;

        countMap[key] = (countMap[key] || 0) + 1;

        return {
          ...j,
          DisplayPassenger: `${passengerType} ${countMap[key]}`
        };
      });

    } catch (error) {
      console.error(error);
      return [];
    }
  }
}