import { Injectable, Injector } from "@angular/core";
import { AppConstantsService, AppRouteEnum, TravelSolutionOperatorEnum, EnhancedGa4DatalayeEventNameEnum, TravelSolutionDirectionEnum, EnhancedAppRouteEnum, TravelSolutionJourneyTypeEnum, PageTypeEnum, EnhancedMonetatePageEventNameEnum, JourneyTypeEnum } from 'src/app/utility/app-constants.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { DatePipe } from '@angular/common';
import { SearchRequestModel } from "src/app/models/mixing-deck/search-request.model";
import { ValidatePaymentResponse } from "src/app/models/payment-details/validate-payment-response.model";
import { JourneyDetail } from "src/app/models/review-buy/review-buy-model";
import { RailcardModel } from "src/app/models/master/railcard-station.model";
import { EnhancedJourneyDetail } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { CommonServices } from 'src/app/services/common.service';

declare global {
  interface Window {
    monetateQ: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class MonetateService {
  isRailCardPresent: boolean = false;

  appRouteEnum: AppRouteEnum;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  pageTypeEnum: PageTypeEnum;
  enhancedMonetatePageEventNameEnum: EnhancedMonetatePageEventNameEnum;
  enhancedGa4DatalayeEventNameEnum: EnhancedGa4DatalayeEventNameEnum;
  journeyTypeEnum: JourneyTypeEnum;
  public sharedService: SharedService;
  railCardListFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
  railCardsSeasonList = [
    { Code: 'TSU', Name: '16-17 Saver' },
    { Code: 'JCP', Name: 'Jobcentre Plus Travel Discount Card' }
  ];

  railCardsList: RailcardModel[];

  datePipe: DatePipe;
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;
  appConstantsService: AppConstantsService;
  travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
  travelSolutionOperatorEnum: TravelSolutionOperatorEnum;
  commonService: CommonServices;

  constructor(private readonly injector: Injector) {
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.enhancedGa4DatalayeEventNameEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
    this.pageTypeEnum = this.injector.get(PageTypeEnum);
    this.sharedService = this.injector.get(SharedService);
    this.datePipe = this.injector.get(DatePipe);
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.travelSolutionOperatorEnum = this.injector.get(TravelSolutionOperatorEnum);
    this.enhancedMonetatePageEventNameEnum = this.injector.get(EnhancedMonetatePageEventNameEnum);
    this.journeyTypeEnum = this.injector.get(JourneyTypeEnum);
    this.commonService = this.injector.get(CommonServices);
  }

  setPageType() {
    try{
      let fullURL = window.location.href;
      let pageType = this.getPageType(fullURL);

      window.monetateQ.push([this.enhancedMonetatePageEventNameEnum?.setPageTypeTxt, pageType]);
    } catch (error) {
      console.log(error);
    }
  }

  setAddTrainSearchData(searchRequest: EnhancedSearchRequestModel) {
    try {
      //prepare data
      let outboundDate = new Date(searchRequest?.DepartureTimesStart);
      let returnDate = null;
      if (searchRequest?.TravelSolutionDirection == this.travelSolutionDirectionEnum?.return) {
        returnDate = new Date(searchRequest?.ReturnTimesStart);
      }

      window.monetateQ.push([
        this.enhancedMonetatePageEventNameEnum.addFlightSearchTxt,
        {
          'origin': [searchRequest?.DepartureLocationName?.split('(')?.pop()?.split(')')[0]],
          'destination': [searchRequest?.ArrivalLocationName?.split('(')?.pop()?.split(')')[0]],
          'depDate': [this.datePipe.transform(outboundDate, 'yyyyMMdd')],
          'retDate': returnDate != null ? [this.datePipe?.transform(returnDate, 'yyyyMMdd')] : null,
          'adults': [searchRequest?.Adult],
          'minors': searchRequest?.Child > 0 ? [searchRequest?.Child] : null,
          'travelers': [(searchRequest?.Adult + searchRequest?.Child)],
        }
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  setaddTrainReviewData(journeys: EnhancedJourneyDetail[]){
    try {
      let price = 0;
      
      let selectItems: Array<string> = [];
      let journeyExtras: Array<string> = [];
      let ticketTypes: Array<string> = [];
      let originStations: Array<string> = [];
      let destinationStations: Array<string> = [];

      let adults: Array<number> = [];
      let minors: Array<number> = [];
      let serviceClass: Array<string> = [];
      let pid: Array<string> = [];

      let departureDates: Array<string> = [];
      let totalTravellersinAllJourneys: number = 0;

      let retDate = journeys?.length == 1 && journeys[0]?.ReturnDetail?.DepartureTime != null ? [this.datePipe.transform(journeys[0].ReturnDetail.DepartureTime, 'yyyyMMdd')] : null;

      journeys?.forEach(val => {
        price += val.JourneyTotalPrice;
        originStations.push(val.Departure?.split('(')?.pop()?.split(')')[0]);
        destinationStations.push(val.Arrival?.split('(')?.pop()?.split(')')[0]);
        departureDates.push(this.datePipe?.transform(val.OutwardDetail?.DepartureTime, 'yyyyMMdd'));
        totalTravellersinAllJourneys += (val?.Adult + val?.Child);
        adults.push(val?.Adult); 
        minors.push(val?.Child);
        serviceClass.push(val?.OutwardDetail?.TicketClass, val?.ReturnDetail?.TicketClass ?? null);
        val?.OutwardSeat?.forEach(seat => {
          pid.push(seat.TrainNumber);
        });
        val?.ReturnSeat?.forEach(seat => {
          pid.push(seat.TrainNumber);
        })
      });
      journeys?.forEach(journey => {

        //outward journey extras
        if(journey?.OutwardJourneyExtras?.filter(x => x.IsSelected).length > 0)
        {
            journey?.OutwardJourneyExtras?.filter(x => x.IsSelected).forEach(extras => journeyExtras?.push(extras.JourneyExtraName))
        }

        //return journey extras
        if(journey?.ReturnJourneyExtras?.filter(x => x.IsSelected).length > 0)
        {
            journey?.ReturnJourneyExtras?.filter(x => x.IsSelected).forEach(extras => journeyExtras?.push(extras.JourneyExtraName))
        }

        //get details for ticket types for outward, return and season journeys
        if(journey?.OutwardDetail?.TicketType)
          ticketTypes.push(journey?.OutwardDetail?.TicketType)

        if(journey?.ReturnDetail?.TicketType)
          ticketTypes.push(journey?.ReturnDetail?.TicketType)

        if(journey?.SeasonDeatil?.TicketType)
          ticketTypes.push(journey?.ReturnDetail?.TicketType)

        let selectItemsList = this.checkPurchaseDetailObj(journey);
          if (selectItemsList) {
            selectItems.push(...selectItemsList);
          }

      });

      pid = pid.filter(x => x);
      
      var monetateObj = {
          'depDate':  departureDates,
          'destination': destinationStations,  
          'origin': originStations,
          'travelers':  [totalTravellersinAllJourneys],
          'adults': this.GetPassengerCountDetails(adults),
          'minors': this.GetPassengerCountDetails(minors),
          'retDate': retDate,
          'serviceClass': this.GetServiceClassForFlightApi(serviceClass?.filter(x => x))
        }
      window.monetateQ.push([
        this.enhancedMonetatePageEventNameEnum?.addFlightReviewTxt,
        monetateObj,
        pid.join(","),
        pid.length * totalTravellersinAllJourneys,
        this.sharedService.formatPrice(price),
        this.appConstantsService.currency
      ]);
    } catch (err) { console.log(err); }
  }

  setaddTrainBookingData(validatePaymentResponse: ValidatePaymentResponse) {
    try {
      let selectItems: Array<string> = [];
      let originStations: Array<string> = [];
      let destinationStations: Array<string> = [];

      let adults: Array<number> = [];
      let minors: Array<number> = [];
      let serviceClass: Array<string> = [];
      let pid: Array<string> = [];
      let price: number = validatePaymentResponse?.PaymentRecords ? (validatePaymentResponse?.PaymentRecords?.reduce((sum, current) => sum + current.Price, 0)) : 0;
      let retDate = validatePaymentResponse?.Journey?.length == 1 && validatePaymentResponse?.Journey?.[0]?.ReturnDetail?.DepartureTime != null ? [this.datePipe.transform(validatePaymentResponse?.Journey?.[0]?.ReturnDetail?.DepartureTime, 'yyyyMMdd')] : null;

      let departureDates: Array<string> = [];
      let totalTravellersinAllJourneys: number = 0;

      if (validatePaymentResponse?.Journey?.length > 0) {
        validatePaymentResponse?.Journey?.forEach((obj, _index) => {
          let selectItemsList = this.checkPurchaseDetailObj(obj)
          if (selectItemsList) {
            selectItems.push(...selectItemsList);
          }
          originStations.push(obj?.Departure?.split('(')?.pop()?.split(')')[0]);
          destinationStations.push(obj?.Arrival?.split('(')?.pop()?.split(')')[0]);
          departureDates.push(this.datePipe?.transform(obj.DepartureDate, 'yyyyMMdd'));
          totalTravellersinAllJourneys += (obj?.Adult + obj?.Child);
          adults.push(obj?.Adult); 
          minors.push(obj?.Child);
          serviceClass.push(obj?.OutwardDetail?.TicketClass, obj?.ReturnDetail?.TicketClass ?? null);
          obj?.OutwardSeat?.forEach(seat => {
            pid.push(seat?.TrainNumber);
          });
          obj?.ReturnSeat?.forEach(seat => {
            pid.push(seat?.TrainNumber);
          })
        });
      }

      pid = pid.filter(x => x);

      var monetateObj = {
          'depDate':  departureDates,
          'destination': destinationStations,
          'origin': originStations,
          'travelers':  [totalTravellersinAllJourneys],  
          'adults': this.GetPassengerCountDetails(adults),
          'minors': this.GetPassengerCountDetails(minors),
          'retDate': retDate,
          'serviceClass': this.GetServiceClassForFlightApi(serviceClass?.filter(x => x))
        };
      window.monetateQ.push([
        this.enhancedMonetatePageEventNameEnum?.addFlightBookingTxt,
        monetateObj,
        validatePaymentResponse?.ReferenceNumber,
        pid.join(","),
        pid.length * totalTravellersinAllJourneys,
        this.sharedService.formatPrice(price),
        this.appConstantsService.currency
      ]);
    } catch (err) { console.log(err); }
  }

  setAddProductRowsEvent(validatePaymentResponse: ValidatePaymentResponse){
    try {
      let referenceNumber : string = validatePaymentResponse?.ReferenceNumber;
      let purchaseRowsList : any[] = [];

      if (validatePaymentResponse?.Journey?.length > 0) {
        validatePaymentResponse?.Journey?.forEach((obj, _index) => {
          let pid: Array<string> = [];
          let totalTravellersInJourney = (obj?.Adult + obj?.Child);
          obj?.OutwardSeat?.forEach(seat => {
            pid.push(seat?.TrainNumber);
          });
          obj?.ReturnSeat?.forEach(seat => {
            pid.push(seat?.TrainNumber);
          })

          pid = pid.filter(x => x); // filter out null values



          var purchaseObject = {
            'purchaseId' :  referenceNumber,
            'currency' : this.appConstantsService.currency,
            'productId' : pid.join(","),
            'sku' : pid.join(","),
            'unitPrice' : this.sharedService.formatPrice(this.commonService.getTrainTicketPrice(obj?.PaymentSummaryList)), // price for TrainTicket
            'quantity' : pid.length * totalTravellersInJourney
          }

          purchaseRowsList.push(purchaseObject)
        });

        window.monetateQ.push([
          this.enhancedMonetatePageEventNameEnum?.addPurchaseRowsTxt, purchaseRowsList
        ]); 
      }
    } catch (err) { console.log(err); }
  }


  flushEvents() {
    window.monetateQ.push([this.enhancedMonetatePageEventNameEnum?.trackDataTxt]); // exactly once per page
  }

  private checkPurchaseDetailObj(obj) {
    let purchaseItem: string;
    let selectItems: Array<string> = [];
    // for Outward & Retrun detail
    if (!obj?.SeasonDeatil) {
      let outRetListItem = this.getDetailForJourney(obj);
      if (outRetListItem) {
        selectItems.push(...outRetListItem);
      }
    }
    // for Season detail
    if (obj?.SeasonDeatil) {
      purchaseItem = this.getTransactionConfirmationModelForSeasonDetail(obj);
      if (purchaseItem)
        selectItems.push(purchaseItem);
    }
    // for Outward & Retrun journey extra detail
    if (obj) {
      let outRetJourneyExtraListItem = this.getTransactionConfirmationDetailForJourneyExtra(obj);
      if (outRetJourneyExtraListItem) {
        selectItems.push(...outRetJourneyExtraListItem);
      }
    }
    return selectItems;
  }

  private getTransactionConfirmationModelForSeasonDetail(obj) {
    return this.getIdForTransactionEvent(obj, this.travelSolutionJourneyTypeEnum?.season);
  }

  private getTransactionConfirmationModelForOutAndReturn(obj, isReturnCase: boolean) {
    return this.getIdForTransactionEvent(obj, (isReturnCase ? this.travelSolutionJourneyTypeEnum?.return : this.travelSolutionJourneyTypeEnum?.outward));
  }

  private getIdForTransactionEvent(journey: JourneyDetail, type) {
    let id = "";
    if (journey) {
      if (type === this.travelSolutionJourneyTypeEnum?.outward || type === this.travelSolutionJourneyTypeEnum?.season) {
        id += `${journey?.Departure?.split('(').pop().split(')')[0]}-${journey?.Arrival?.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey?.DepartureDate?.toString()?.split("T");
        let depDateTimeStamp = `-${depDate[0]?.split("-")?.join("")}${depDate[1]?.split(":")?.join("")?.slice(0, -3)}`;
        id += depDateTimeStamp; // service departure timestamp
      } else {
        id += `${journey?.Arrival?.split('(')?.pop()?.split(')')[0]}-${journey?.Departure.split('(')?.pop()?.split(')')[0]}`; // stn codes

        let depDate = journey?.ReturnDepartureDate.toString().split("T");
        let depDateTimeStamp = `-${depDate[0]?.split("-")?.join("")}${depDate[1]?.split(":")?.join("")?.slice(0, -3)}`;
        id += depDateTimeStamp; // service departure timestamp
      }

      id += `-${journey?.Adult}`;
      id += `-${journey?.Child}`;
      id += `-${((type === this.travelSolutionJourneyTypeEnum?.season) ? this.travelSolutionJourneyTypeEnum?.season.toLowerCase() : (journey?.GAJourneyType && journey?.GAJourneyType?.toLowerCase()))}`;
    }
    return (id || undefined);
  }

  private getDetailForJourney(obj) {
    let outRetListItems = [];
    if (obj?.OutwardDetail) {
      let purchaseItem = this.getTransactionConfirmationModelForOutAndReturn(obj, false);
      if (purchaseItem) {
        outRetListItems.push(purchaseItem);
      }
    }
    if (obj?.ReturnDetail) {
      let purchaseItem = this.getTransactionConfirmationModelForOutAndReturn(obj, true);
      if (purchaseItem) {
        outRetListItems.push(purchaseItem);
      }
    }
    return outRetListItems;
  }

  private getTransactionConfirmationDetailForJourneyExtra(obj) {
    let outRetJourneyExtraListItems = [];
    if (obj?.OutwardJourneyExtras?.length > 0 && obj?.SeasonDeatil == null) {
      obj?.OutwardJourneyExtras.forEach(service => {
        let modifiedService = { ...service, IsReturn: false, Description: service?.JourneyExtraName };
        let purchaseItem = this.getTransactionModelForOutAndReturnJourneyExtra(modifiedService);
        if (purchaseItem) {
          outRetJourneyExtraListItems.push(purchaseItem);
        }
      })
    }
    if (obj?.ReturnJourneyExtras?.length > 0) {
      obj?.ReturnJourneyExtras?.forEach(service => {
        let modifiedService = { ...service, IsReturn: true, Description: service?.JourneyExtraName };
        let purchaseItem = this.getTransactionModelForOutAndReturnJourneyExtra(modifiedService);
        if (purchaseItem) {
          outRetJourneyExtraListItems.push(purchaseItem);
        }
      });
    }
    if (obj?.OutwardJourneyExtras?.length > 0 && obj?.SeasonDeatil) {
      obj?.OutwardJourneyExtras?.forEach(service => {
        let modifiedService = { ...service, IsReturn: false, Description: service?.JourneyExtraName };
        let purchaseItem = this.getTransactionModelForOutAndReturnJourneyExtra(modifiedService);
        if (purchaseItem) {
          outRetJourneyExtraListItems.push(purchaseItem);
        }
      });
    }
    return outRetJourneyExtraListItems;
  }

  private getTransactionModelForOutAndReturnJourneyExtra(service = null) {
    let id = "";
    if (service) {
      let direction = service.IsReturn ? `_${this.journeyTypeEnum?.returnOnlyText}` : `_${this.journeyTypeEnum?.outwardOnlyText}`;
      if (service?.Description === this.appConstantsService?.bicycleReservation) {
        id += (this.appConstantsService?.bikeTxt + direction);
      } else if (service?.Description === this.appConstantsService?.londonTravelcard) {
        let zone = service?.ServiceName ? service?.ServiceName?.split(" ")?.slice(2, service.ServiceName.length)?.join("")?.toLowerCase() : "";
        id += (this.appConstantsService?.travelCardTxt + zone + direction);
      } else if (service?.Description === this.appConstantsService?.plusBus) {
        id += (this.appConstantsService?.plusBusText + direction);
      }
    }
    return id || undefined;
  }

  private getPageType(fullURL) {
    let pageType = '';
    if (fullURL?.includes(this.appRouteEnum?.MixingDeck) || fullURL?.includes(this.appRouteEnum?.SeasonSolutions) || fullURL?.includes(this.appRouteEnum?.ReviewBuy)) {
      pageType = this.pageTypeEnum.search;
    }
    else if(fullURL?.includes(this.enhancedAppRouteEnum?.selectTicketAndClass)) {
      pageType = this.pageTypeEnum.selectTicketAndClass;
    }
    else if (fullURL?.includes(this.appRouteEnum?.JourneyExtras) || fullURL?.includes(this.appRouteEnum?.DeliveryMode) || fullURL?.includes(this.appRouteEnum?.Payment) || fullURL?.includes(this.appRouteEnum?.deliveryAndReviewbuy)) {
      pageType = this.pageTypeEnum.checkout;
    }
    else if (fullURL?.includes(this.appRouteEnum?.Confirmation)) {
      pageType = this.pageTypeEnum.confirmation;
    }
    else if (fullURL?.includes(this.appRouteEnum?.ValidatePaymentDo)) {
      pageType = this.pageTypeEnum.validatePayment;
    }
    else {
      pageType = this.pageTypeEnum?.account;
    }
    return pageType;
  }

  private GetServiceClassForFlightApi(serviceClass: string[]) {
    const mapping = {
    "Standard": "Economy",
    "First": "First",
    "Standard Premium": "Premium Economy"
    };

    return serviceClass?.map(value => mapping[value] ?? value);
  }

  private GetPassengerCountDetails(passengerCount: number[])  {
    return passengerCount?.filter(x => x > 0)?.length > 0 ? passengerCount?.filter(x => x > 0) : null; 
  }
}
