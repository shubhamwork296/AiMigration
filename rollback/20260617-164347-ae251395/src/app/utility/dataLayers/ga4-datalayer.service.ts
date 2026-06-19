import { Injectable, Injector } from '@angular/core';
import { COJDataLayerSelectItemType, DataLayerViewItemType, SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { JourneySummaryModel, TravelSolutionModel } from 'src/app/models/mixing-deck/travel-solution.model';
import * as moment from 'moment';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { DatePipe } from '@angular/common';
import { RailcardModel } from 'src/app/models/master/railcard-station.model';
import { DataLayerAddDeliveryOptionType, DataLayerAddPaymentInfoType, DataLayerBasketItemType, JourneyDetail, ReservationDetail, ReviewBuyResponse, JourneyExtrasDetail, DataLayerRemoveFromCartType, DataLayerBasketItemTypeForConfirmOrder, DataLayerViewCartType, CojReviewBuyResponse } from 'src/app/models/review-buy/review-buy-model';
import { DataLayerRefundType, DataLayerTransactionType, ValidatePaymentResponse } from 'src/app/models/payment-details/validate-payment-response.model';
import { CommonServices, convertToSha256 } from 'src/app/services/common.service';
import { AppConstantsService, AppRouteEnum, DeliveryModeEnum, Ga4ItemListEnum, Ga4DatalayeEventNameEnum, TravelSolutionOperatorEnum, TravelSolutionDirectionEnum, Ga4DatalayerConstantEnum, TravelSolutionJourneyTypeEnum, PageTypeEnum, SeatPrefrenceType, LocalStorageKeyEnum, BookPassangerAssistEnum, TrackMyTrainEnum, ClubAvantiEnum, RewardCodeTypesEnum, RewardSubCategoryEnum, RewardCategoryEnum, QuickBuyEnum, EnhancedGa4DatalayeEventNameEnum, ClassTypeEnum, EnhancedTravelSolutionTypesEnum, EnhancedLoginStatus, BookingFlowTypeEnum, EnhancedGA4SearchSourceEnum, EnhancedAdditionalInformationEnum, EnhancedJourneyType, NativePaymentMethodEnum } from 'src/app/utility/app-constants.service';
import { environment } from 'src/environments/environment';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { Title } from '@angular/platform-browser';
import { DataLayerAddToCartItemType } from 'src/app/models/delivery-modes/delivery-modes.model';
import { JourneyExtraDetail } from 'src/app/models/journey-extras/journey-extras-response.model';

import { DataLayerCheckoutItemType } from 'src/app/models/journey-extras/evaluate-request.model';
import { DataLayerChangeSeatItemType, SeatFeatures, UpdateReservationResponseDto } from 'src/app/models/review-buy/seat-picker-model';
import { BookingDetailsResponseDto, DataLayerStandaloneBikeReservation } from 'src/app/models/account/my-bookings.model';
import { RefundDetailsResponseDto, RefundResponseDetails } from 'src/app/models/account/refund-booking';
import { DataLayerClubAvantiType } from 'src/app/models/customer/customer-registration-request.model';
import { EnhancedReviewBuyAndDeliveryResponse, EnhancedReviewBuyResponse } from 'src/app/models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model';

@Injectable({
  providedIn: 'root'
})
export class GA4DatalayerService {
  isRailCardPresent: boolean = false;
  railCards: string = '';
  railCardListFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));

  public sharedService: SharedService;
  datePipe: DatePipe;
  commonServices: CommonServices;
  deliveryModeEnum: DeliveryModeEnum;
  appConstantsService: AppConstantsService;
  appRouteEnum: AppRouteEnum;
  storageDataService: StorageDataService;
  title: Title;
  ga4ItemListEnum: Ga4ItemListEnum;
  ga4DatalayeEventNameEnum: Ga4DatalayeEventNameEnum;
  travelSolutionOperatorEnum: TravelSolutionOperatorEnum;
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;
  ga4DatalayerConstantEnum: Ga4DatalayerConstantEnum;
  travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
  pageTypeEnum: PageTypeEnum;
  seatPrefrenceType: SeatPrefrenceType;
  isUpgradeEvent : boolean = false;
  selectedUpgrade: string = '';
  localStorageKeyEnum: LocalStorageKeyEnum;
  bookPassangerAssistEnum: BookPassangerAssistEnum;
  isBeginCheckoutEvent: boolean = false;
  trackMyTrainEnum : TrackMyTrainEnum;
  getListOfArraySoldOutTickets: any = [];
  clubAvantiEnum: ClubAvantiEnum;
  rewardCodeTypesEnum: RewardCodeTypesEnum;
  rewardSubCategoryEnum: RewardSubCategoryEnum;
  rewardCategoryEnum: RewardCategoryEnum;
  quickBuyEnum: QuickBuyEnum;
  enhancedGA4DatalayerEventName: EnhancedGa4DatalayeEventNameEnum;
  classTypeEnum: ClassTypeEnum;
  enhancedTravelSolutionTypesEnum: EnhancedTravelSolutionTypesEnum;
  enhancedLoginStatusEnum: EnhancedLoginStatus;
  bookingFlowTypeEnum: BookingFlowTypeEnum;
  enhancedSearchSourceTypeEnum: EnhancedGA4SearchSourceEnum;
  enhancedAdditionalInformationEnum: EnhancedAdditionalInformationEnum;
  enhancedJourenyType : EnhancedJourneyType;
  nativePaymentMethodEnum: NativePaymentMethodEnum;

  constructor(private readonly injector: Injector) {
    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.datePipe = this.injector.get(DatePipe);
    this.commonServices = this.injector.get(CommonServices);
    this.deliveryModeEnum = this.injector.get(DeliveryModeEnum);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.storageDataService = this.injector.get(StorageDataService);
    this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
    this.ga4DatalayeEventNameEnum = this.injector.get(Ga4DatalayeEventNameEnum);
    this.travelSolutionOperatorEnum = this.injector.get(TravelSolutionOperatorEnum);
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
    this.ga4DatalayerConstantEnum = this.injector.get(Ga4DatalayerConstantEnum);
    this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.pageTypeEnum = this.injector.get(PageTypeEnum);
    this.title = this.injector.get(Title);
    this.seatPrefrenceType = this.injector.get(SeatPrefrenceType);
    this.bookPassangerAssistEnum = this.injector.get(BookPassangerAssistEnum);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.trackMyTrainEnum = this.injector.get(TrackMyTrainEnum);
    this.clubAvantiEnum = this.injector.get(ClubAvantiEnum);
    this.rewardCodeTypesEnum = this.injector.get(RewardCodeTypesEnum);
    this.rewardSubCategoryEnum = this.injector.get(RewardSubCategoryEnum);
    this.rewardCategoryEnum = this.injector.get(RewardCategoryEnum);
    this.quickBuyEnum = this.injector.get(QuickBuyEnum);
    this.enhancedGA4DatalayerEventName= this.injector.get(EnhancedGa4DatalayeEventNameEnum);
    this.classTypeEnum= this.injector.get(ClassTypeEnum);
    this.enhancedTravelSolutionTypesEnum= this.injector.get(EnhancedTravelSolutionTypesEnum);
    this.enhancedLoginStatusEnum = this.injector.get(EnhancedLoginStatus);
    this.bookingFlowTypeEnum = this.injector.get(BookingFlowTypeEnum);
    this.enhancedSearchSourceTypeEnum = this.injector.get(EnhancedGA4SearchSourceEnum);
    this.enhancedAdditionalInformationEnum = this.injector.get(EnhancedAdditionalInformationEnum);
    this.enhancedJourenyType = this.injector.get(EnhancedJourneyType);
    this.nativePaymentMethodEnum = this.injector.get(NativePaymentMethodEnum);
  }

  cheapestArr = null;
  railCardsSeasonList = [
    { Code: 'TSU', Name: '16-17 Saver' },
    { Code: 'JCP', Name: 'Jobcentre Plus Travel Discount Card' }
  ];
  railCardsList: RailcardModel[];
  Services = [];
  isReturnJourney = false;
  outwardTravelSolIds = [];
  inwardTravelSolIds = [];
  // for the Journey Type info
  getJourneyType(searchRequest: SearchRequestModel) {
    try {
      if (searchRequest && searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.oneWay) {
        return this.travelSolutionJourneyTypeEnum.single;
      } else if (searchRequest && searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.return) {
        return this.travelSolutionJourneyTypeEnum.return;
      } else if (searchRequest && searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.openReturn) {
        return this.travelSolutionJourneyTypeEnum.anytimeReturn;
      } else if (searchRequest && searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.season) {
        return this.travelSolutionJourneyTypeEnum.season;
      }
      return undefined;
    } catch (error) {
      console.log(error);
    }
  }
  
  // PICO-1870 -- for search and view_item_list event
  loadGA4DataLayerOnSearch(searchRequest, ga4SearchEventParam, searchResponse, activeTab, cheapestTravelSolutionIds, outwardSelectedFare, returnSelectedFare, isNewFlow: boolean = false) {
    try {
      let viaAvoidStation = '';
      this.cheapestArr = cheapestTravelSolutionIds;
      if (searchRequest.PathConstraintLocation != null && searchRequest.PathConstraintLocation != ''
        && searchRequest.PathConstraintLocation != undefined && this.sharedService.locationMasterData != null
        && this.sharedService.locationMasterData.length > 0) {
        let location = this.sharedService.locationMasterData.filter(x => x.Id == searchRequest.PathConstraintLocation);
        if (location != null)
          viaAvoidStation = location[0].Name.split('(').pop().split(')')[0];
      }
      let currentdate = moment.utc(new Date()).tz(this.appConstantsService.timeZone);
      let selectedDate = moment.utc(searchRequest.DepartureTimesStart).tz(this.appConstantsService.timeZone);
      let daysInAdvance = Math.abs(currentdate.diff(selectedDate, 'days'));
      let outboundDate = new Date(searchRequest.DepartureTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
      let outboundTime = this.datePipe.transform(searchRequest.DepartureTimesStart, 'HHmm');
      let returnDate = '';
      let returnTime = '';
      if (searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.return) {
        returnDate = new Date(searchRequest.ReturnTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
        returnTime = this.datePipe.transform(searchRequest.ReturnTimesStart, 'HHmm');
      }
      if (searchRequest.IsSeason) {
        this.setListOfItemsForSeasonJourney(searchRequest, searchResponse);
      }
      else {
        this.setListOfItemsForNonSeasonJourney(searchRequest, searchResponse, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, isNewFlow);
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        ...(isNewFlow && {
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory}),
        search_term: searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        origin: searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
        destination: searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        journey_via: this.getJourneyViaOrAvoid(searchRequest.PathConstraintType, 'VIA', viaAvoidStation),
        start_date: outboundDate,
        end_date: returnDate,
        journey_avoid: this.getJourneyViaOrAvoid(searchRequest.PathConstraintType, 'AVOID', viaAvoidStation),
        outbound_Time: outboundTime,
        outbound_timing: searchRequest.Traveltype,
        return_Time: returnTime,
        return_timing: searchRequest.TraveltypeReturn,
        days_in_advance: daysInAdvance,
        adult_pax: searchRequest.Adult,
        child_pax: searchRequest.Child,
        total_pax: (searchRequest.Adult + searchRequest.Child),
        success: ga4SearchEventParam.searchSuccess,
        search_source: ga4SearchEventParam.searchSource,
        search_error: ga4SearchEventParam.searchError ? ga4SearchEventParam.searchError : undefined,
        duration: undefined,
        type: this.getJourneyType(searchRequest),
        railcard_code: this.getRailCardCode(searchRequest),
        railcard_used: this.isRailCardPresent,
        event: this.ga4DatalayeEventNameEnum.search,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow
      });
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.viewItemList,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory,
          sold_out_trains: this.getClosedTrainsCountForOutward(searchResponse?.TravelSolutions) + this.getClosedTrainsCountForReturn(searchResponse.RetTravelSolutions),
          cancelled_trains: this.getCancelledTrainsCount(searchResponse?.TravelSolutions) + this.getCancelledTrainsCount(searchResponse?.RetTravelSolutions),
        }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: this.Services,
        }
      });
    } catch (error) {
      console.log(error);
    }

  }

  getClosedTrainsCountForOutward(searchResponse): number {
    return searchResponse?.filter(ts => ts.IsTrainClosed === true)?.length || 0;
  }

  getClosedTrainsCountForReturn(searchResponseReturn): number {
    return searchResponseReturn?.filter(ts => ts.IsRetTrainClosed === true)?.length || 0;
  }

  getCancelledTrainsCount(searchResponse): number {
    return searchResponse?.filter(ts => ts.IsCancelled)?.length || 0;
  }

  // get the via or avoid station 
  getJourneyViaOrAvoid(pathConstraintType, viaAvoidstr, viaAvoidStation) {
    if (pathConstraintType == viaAvoidstr) {
      return viaAvoidStation;
    } else {
      return undefined;
    }
  }

  // get list of season offers for season journey
  setListOfItemsForSeasonJourney(searchRequest, searchResponse) {
    if (searchResponse && searchResponse.SeasonEligibleOffers && searchResponse.SeasonEligibleOffers.length > 0) {
      this.Services = [];
      searchResponse.SeasonEligibleOffers.forEach((obj, index) => {
        this.groupSeasonListItems(obj, searchRequest, index);
      });
    }
  }
  // group season list items for view_item_list event
  groupSeasonListItems(obj, searchRequest, index) {
    if (obj.CustomOffers) {
      this.getSessions(obj.CustomOffers, searchRequest, index);
    }
    if (obj.FlexiOffers) {
      this.getSessions(obj.FlexiOffers, searchRequest, index);
    }
    if (obj.MonthlyOffers) {
      this.getSessions(obj.MonthlyOffers, searchRequest, index);
    }
    if (obj.WeeklyOffers) {
      this.getSessions(obj.WeeklyOffers, searchRequest, index);
    }
    if (obj.YearlyOffers) {
      this.getSessions(obj.YearlyOffers, searchRequest, index);
    }
  }

  // get list of travel solution for non season journey
  setListOfItemsForNonSeasonJourney(searchRequest, searchResponse, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, isNewFlow) {
    this.Services = [];
    if(!this.isUpgradeEvent){
      this.isReturnJourney = false;
    }    
    if (searchResponse) {
      this.outwardTravelSolIds = searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
      this.getTicket(searchResponse.TravelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, 1, isNewFlow);
      

      if (searchResponse.RetTravelSolutions) {
        this.isReturnJourney = true;
        this.inwardTravelSolIds = searchResponse.RetTravelSolutions.map(solution => solution.TravelSolId);
        this.getTicket(searchResponse.RetTravelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, 2, isNewFlow);
      }
    }
  }

  // to push the seasonal offers one by one
  getSessions(seasonOffers, searchRequest, index) {
    if (!seasonOffers) {
      return;
    }

    let diffOfDates = Math.abs(this.calculateDiff(searchRequest.DepartureTimesStart));
    let item: any = {
      item_name: searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
      item_id: this.getIdForseasonEvents(seasonOffers, searchRequest),
      price: seasonOffers.Price,
      item_brand: undefined,
      item_category: seasonOffers.TicketClass,
      item_category2: this.getIdMethodSeason(seasonOffers),
      item_category3: undefined,
      item_category5: this.ga4DatalayerConstantEnum.Fare,
      item_variant: ('1:' + searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]),
      item_list_name: this.ga4ItemListEnum.resultPageItemListName,
      item_list_id: this.ga4ItemListEnum.resultPageImpressionItemListId,
      index: (index + 1),
      start_date: new Date(searchRequest.DepartureTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString),
      end_date: new Date(seasonOffers.Expiry).toLocaleDateString(this.appConstantsService.LocaleDateString),
      duration: seasonOffers.DurationType,
      ticket_class: seasonOffers.TicketClass,
      ticket_type: seasonOffers.TicketType,
      ticket_route_code: String(seasonOffers.ServiceId).slice(-5),
      ticket_type_code: undefined,
      type: this.getJourneyType(searchRequest),
      single_or_return: this.travelSolutionJourneyTypeEnum.season,
      number_of_changes: undefined,
      additional_information: undefined,
      days_in_advance: diffOfDates,
      railcard_code: this.getRailCardCode(searchRequest),
      railcard_used: this.isRailCardPresent,
      adult_pax: searchRequest.Adult,
      child_pax: searchRequest.Child,
      total_pax: (searchRequest.Adult + searchRequest.Child),
      start_time: undefined,
      end_time: undefined,
      operator: undefined,
      Journey_prices: {
        id: this.getIdForseasonEvents(seasonOffers, searchRequest),
        price: seasonOffers.Price,
        ticket_type: seasonOffers.TicketType,
      }
    }
    this.Services.push(item);
  }

  // for the travel solution company or operator name
  getTravelSolutionOperatorForCompany(travelSolution) {
    try {
      if (travelSolution && travelSolution.Operator == '1') {
        return this.travelSolutionOperatorEnum.avantiOnly;
      } else if (travelSolution && travelSolution.Operator == '4') {
        return this.travelSolutionOperatorEnum.multipleOperators;
      } else if (travelSolution && travelSolution.Operator == '3') {
        return travelSolution.SaleCompany;
      } else if (travelSolution && travelSolution.Operator == '2') {
        return this.travelSolutionOperatorEnum.avantiPlus;
      }
      return this.travelSolutionOperatorEnum.all;
    } catch (error) {
      console.log(error);
    }
  }

  // add non-season journey in service array for view_list_item event
  getTicket(travelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, column_index, isNewFlow: boolean = false) {
    let email = localStorage.getItem('Email');
    let customerKey = localStorage.getItem('CustomerKey');
    if (customerKey == null) {
      customerKey = undefined;
    }
    if (!travelSolutions && travelSolutions.length > 0) {
      return;
    }
    travelSolutions.forEach((travelSolution, index) => {
      let diffOfDates = Math.abs(this.calculateDiff(travelSolution.DepartureDate));
      let [ticketRoutecode, ticketTypeCode] = this.getTicketRouteAndTypeCode(travelSolution);

      let item : any = {
        item_name: travelSolution.DepartureTime.split('(').pop().split(')')[0] + `-` + travelSolution.ArrivalTime.split('(').pop().split(')')[0],
        item_id: this.getIdForEvents(travelSolution, searchRequest, activeTab),
        price: this.getPriceForItem(travelSolution, activeTab),
        item_brand: travelSolution.Brand,
        item_category: this.getTicketClass(outwardSelectedFare, returnSelectedFare, this.isReturnJourney) ?? undefined,
        item_category2: this.getJourneyType(searchRequest) ?? undefined,
        item_category3: this.getTicketType(outwardSelectedFare, returnSelectedFare, this.isReturnJourney) ?? undefined,
        item_category5: this.ga4DatalayerConstantEnum.Fare,
        item_category4: this.getRailCardString(searchRequest),
        item_variant: this.getVariant(travelSolution),
        item_list_name: this.ga4ItemListEnum.resultPageItemListName,
        item_list_id: this.ga4ItemListEnum.resultPageImpressionItemListId,
        index: (index + 1),
        start_date: new Date(travelSolution.DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
        end_date: new Date(travelSolution.ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
        duration: this.getDurationTime(travelSolution),
        ticket_class: this.getTicketClass(outwardSelectedFare, returnSelectedFare, this.isReturnJourney) ?? undefined,
        ticket_type: this.getTicketType(outwardSelectedFare, returnSelectedFare, this.isReturnJourney) ?? undefined,
        ticket_route_code: ticketRoutecode,
        ticket_type_code: ticketTypeCode,
        type: this.getJourneyType(searchRequest),
        single_or_return: this.isReturnJourney ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
        number_of_changes: travelSolution.Changes,
        additional_information: isNewFlow ? this.getAdditionalInformation(travelSolution, searchRequest) : this.isCheapestTravelSolution(travelSolution),
        days_in_advance: diffOfDates,
        railcard_code: this.getRailCardCode(searchRequest),
        railcard_used: this.isRailCardPresent,
        adult_pax: searchRequest.Adult,
        child_pax: searchRequest.Child,
        total_pax: (searchRequest.Adult + searchRequest.Child),
        start_time: travelSolution.DepartureTime.split('(')[0].trim(),
        end_time: travelSolution.ArrivalTime.split('(')[0].trim(),
        operator: this.getTravelSolutionOperatorForCompany(travelSolution),
        Journey_prices: {
          id: this.getIdForEvents(travelSolution, searchRequest, activeTab),
          price: this.getPriceForItem(travelSolution, activeTab),
          ticket_type: this.getTicketType(outwardSelectedFare, returnSelectedFare, this.isReturnJourney) ?? undefined,
        }
      }
      if(isNewFlow){
        item.column_index= column_index;
        item.origin= searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
        item.destination= searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        item.available_classes = this.getFareMessage(travelSolution?.NewFareList, travelSolution?.NewReturnFareList, travelSolution, searchRequest);
        item.search_source = ga4SearchEventParam.searchSource ?? undefined;
        item.price_from = travelSolution?.SingleFare ?? undefined;
      }
      this.Services.push(item);
    });
  }

  getAdditionalInformation(travelSolution, searchRequest) {
    const solutionTypes = [];

    if (travelSolution.IsCheapest) {
      solutionTypes.push(this.enhancedAdditionalInformationEnum.cheapest);
    }
    if (travelSolution.IsFastest) {
      solutionTypes.push(this.enhancedAdditionalInformationEnum.fastest);
    }
    if (travelSolution.IsLimitedTickets) {
      solutionTypes.push(this.enhancedAdditionalInformationEnum.limited);
    }

    return solutionTypes.length > 0 ? solutionTypes.join(', ') : undefined;
  }

  getTicketRouteAndTypeCode(travelSolution){
    let ticketRoutecode = '';
    let ticketTypeCode = '';
    if(travelSolution && travelSolution.NewFareList){
      travelSolution.NewFareList.forEach((newFareList) => {
        newFareList.FareList.forEach( fareList => {
          let routecode = String(fareList.ServiceId).slice(-5);
          ticketRoutecode += `${routecode}|`;
          ticketTypeCode += `${fareList.TicketTypeCode}|`;
        });
      });
    }
    ticketRoutecode = ticketRoutecode.slice(0,-1);
    ticketTypeCode = ticketTypeCode.slice(0,-1);
    return [ticketRoutecode, ticketTypeCode];
  }

  //to fetch cheapest travel solution
  isCheapestTravelSolution(currentTravelSolution) {
    if (this.cheapestArr) {
      if ((this.cheapestArr.indexOf(currentTravelSolution.TravelSolId) > -1) && (currentTravelSolution.Operator === 1 || currentTravelSolution.Operator === 2)) {
        return `'Cheapest'`;
      }
      else {
        return undefined;
      }
    }
  }

  // *** PICO-1870 For View_Item Event *** 
  loadGA4ViewItem(journey, searchRequest, index, activeTab, journeyTypeForD6: string, selectedFare, isCoj, isNewFlow : boolean = false, isSearchResult = this.enhancedSearchSourceTypeEnum?.searchResultSearchSource) {
    try {
      const items: Array<DataLayerViewItemType> = [];
      let journeyType = this.getJourneyType(searchRequest);
      let company = this.getTravelSolutionOperatorForCompany(journey);
      let diffOfDates = Math.abs(this.calculateDiff(journey.DepartureDate));
      let TicketClass = selectedFare && selectedFare.TicketClass ? selectedFare.TicketClass : undefined;
      let TicketType = selectedFare && selectedFare.TicketType ? selectedFare.TicketType : undefined;

      let viewItemParams = {
        journeyType: journeyType,
        company: company,
        diffOfDates: diffOfDates,
        TicketClass: TicketClass,
        TicketType: TicketType,
        isCoj: isCoj
      }

      let viewItem = this.setJObjectsWithExpandedServiceModel(searchRequest, activeTab, journey, index, selectedFare, journeyTypeForD6, viewItemParams, isNewFlow, isSearchResult);
      if (viewItem) {
        items.push(viewItem);
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.viewItem,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory}),
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: items,
        }
      });
      this.isUpgradeEvent = false;
    } catch (error) {
      console.log(error);
    }
  }

  // to calculate the days in advance of travel solution
  calculateDiff(dateSent) {
    let currentDate = new Date();
    dateSent = new Date(dateSent);

    return Math.floor((Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) - Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate())) / (1000 * 60 * 60 * 24));
  }

  // to calculate the price for the Journey
  getPriceForItem(journey: TravelSolutionModel, activeTab) {
    if (journey && activeTab === 0) {
      return journey.SingleFare;
    } else if (journey && activeTab === 1) {
      return journey.ReturnFare;
    }
    return undefined;
  }

  isInwardOrOutwardJourney(journeyTypeForD6) {
    return (journeyTypeForD6 == this.travelSolutionJourneyTypeEnum.inward) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
  }

  // for view_item event make an entry on selection of travel solution
  setJObjectsWithExpandedServiceModel(searchRequest: SearchRequestModel, activeTab, journey, index, _selectedFare, journeyTypeForD6, viewItemParams, isNewFlow: boolean = false, isSearchResult) {
    try {
      const item: DataLayerViewItemType = new DataLayerViewItemType();
      let endDate = this.getEndDateForCojViewItem(searchRequest);
      endDate = endDate ? endDate : new Date(journey.ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString);
      item.item_name = journey.DepartureTime.split('(').pop().split(')')[0] + `-` + journey.ArrivalTime.split('(').pop().split(')')[0];
      item.item_id = this.getIdForEvents(journey, searchRequest, activeTab);
      item.price = _selectedFare ? parseFloat(_selectedFare) : this.getPriceForItem(journey, activeTab);
      item.item_brand = journey.Brand;
      item.item_category = viewItemParams.TicketClass;
      item.item_category2 = viewItemParams.isCoj ? (this.isInwardOrOutwardJourney(journeyTypeForD6)) : viewItemParams.journeyType;
      item.item_category3 = viewItemParams.TicketType;
      item.item_category4 = this.getRailCardString(searchRequest);
      item.item_category5 = viewItemParams.isCoj ? this.getSelFarePriceInCaseOfCojViewItem(_selectedFare) : this.ga4DatalayerConstantEnum.Fare;
      item.item_variant = this.getVariant(journey);
      item.item_list_name = !viewItemParams.isCoj ? this.ga4ItemListEnum.resultPageItemListName : undefined;
      item.item_list_id = !viewItemParams.isCoj ? this.ga4ItemListEnum.resultsPageSelectionItemListId : undefined;
      item.index = (index + 1);
      item.start_date = new Date(journey.DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString);
      item.end_date = viewItemParams.isCoj ? endDate : new Date(journey.ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString);
      item.duration = this.getDurationTime(journey);
      item.ticket_class = viewItemParams.TicketClass;
      item.ticket_type = viewItemParams.TicketType;
      item.ticket_route_code = _selectedFare ? String(_selectedFare.ServiceId).slice(-5) : undefined;
      item.ticket_type_code = _selectedFare ? _selectedFare.TicketTypeCode : undefined;
      item.type = journeyTypeForD6;
      item.single_or_return = viewItemParams.isCoj ? this.isInwardOrOutwardJourney(journeyTypeForD6) : viewItemParams.journeyType;
      item.number_of_changes = journey.Changes;
      item.additional_information = isNewFlow ? this.getAdditionalInformation(journey, searchRequest) : this.isCheapestTravelSolution(journey);
      item.days_in_advance = viewItemParams.diffOfDates;
      item.railcard_code = this.getRailCardCode(searchRequest);
      item.railcard_used = this.isRailCardPresent;
      item.adult_pax = searchRequest.Adult;
      item.child_pax = searchRequest.Child;
      item.total_pax = (searchRequest.Adult + searchRequest.Child);
      item.start_time = journey.DepartureTime.split('(')[0].trim();
      item.end_time = journey.ArrivalTime.split('(')[0].trim();
      item.operator = viewItemParams.company;
      if (viewItemParams.isCoj) {
        item.feature = this.ga4DatalayeEventNameEnum.changeOfJourney;
        item.booking_reference = localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber)
      }
      if(isNewFlow){
        item.column_index= journeyTypeForD6.toLowerCase() === this.enhancedTravelSolutionTypesEnum?.inward.toLowerCase() ? 2 : 1;
        item.origin= searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
        item.destination= searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        item.available_classes = this.getFareMessage(journey?.NewFareList, journey?.NewReturnFareList, journey, searchRequest);
        item.search_source = isSearchResult;
        item.price_from = _selectedFare ? parseFloat(_selectedFare) : journey?.SingleFare ?? undefined;
      }
      return item;
    } catch (error) {
      console.log(error);
    }
  }

  getSelFarePriceInCaseOfCojViewItem(_selectedFare) {
    let selectedFarePrice = '';
    if (_selectedFare && _selectedFare.Price) {
      selectedFarePrice = _selectedFare.Price;
    }
    return selectedFarePrice ? selectedFarePrice : undefined;
  }

  getEndDateForCojViewItem(searchRequest) {
    let endDate = '';
    if (searchRequest && searchRequest.ReturnTimesStart) {
      endDate = new Date(searchRequest.ReturnTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
    }
    return endDate ? endDate : undefined;
  }

  // for the Item_id property
  getIdMethod(searchRequest: SearchRequestModel, activeTab) {
    if (searchRequest && searchRequest.TravelSolutionDirection === this.travelSolutionDirectionEnum.openReturn) {
      return this.travelSolutionJourneyTypeEnum.openReturn;
    } else {
      if (activeTab === 0) {
        return this.travelSolutionJourneyTypeEnum.single;
      }
      return this.travelSolutionJourneyTypeEnum.return;
    }
  }

  // for the Item_id property
  getIdForEvents(journey: TravelSolutionModel, searchRequest: SearchRequestModel, activeTab) {
    try {
      if (journey && searchRequest) {
        let id = "";
        id += `${journey.DepartureTime.split('(').pop().split(')')[0]}-${journey.ArrivalTime.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.DepartureDate.split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;

        id += depDateTimeStamp; // service departure timestamp
        id += `-${searchRequest.Adult}`;
        id += `-${searchRequest.Child}`;
        id += `-${this.getIdMethod(searchRequest, activeTab)}`;
        return id;
      }
    } catch (error) {
      console.log(error);
    }
  }
  // get Item_id for season 
  getIdForseasonEvents(seasonoffers, searchRequest) {
    if (seasonoffers && searchRequest) {
      let id = "";
      id += `${searchRequest.DepartureLocationName.split('(').pop().split(')')[0]}-${searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]}`; // stn codes

      let depDate = searchRequest.DepartureTimesStart.split("T");
      let depDateTimeStamp = `-${depDate[0].split("-").join("")}`;

      id += depDateTimeStamp; // service departure timestamp
      id += `-${searchRequest.Adult}`;
      id += `-${searchRequest.Child}`;
      id += `-${this.getIdMethodSeason(seasonoffers)}`;
      return id;
    }
  }

  // get method id for season
  getIdMethodSeason(seasonOffers) {
    if (seasonOffers) {
      if (seasonOffers.DurationType == this.travelSolutionJourneyTypeEnum.flexiSeason || seasonOffers.DurationType == this.travelSolutionJourneyTypeEnum.daySeason) {
        return 'Season-' + seasonOffers.DurationType.split(' ')[0];
      } else {
        return 'Season-' + seasonOffers.DurationType
      }
    }
  }

  // for the duration property
  getDurationTime(obj) {
    try {
      if (obj.Duration.indexOf('h') > -1) {
        return `${+(obj.Duration.split('h')[0]) >= 10 ? obj.Duration.split('h')[0] : '0' + obj.Duration.split('h')[0]}:${+(obj.Duration.split('h')[1].split('m')[0].trim()) >= 10 ? obj.Duration.split('h')[1].split('m')[0].trim() : '0' + obj.Duration.split('h')[1].split('m')[0].trim()}`
      }
      else {
        return `00:${+(obj.Duration.slice(0, -1)) >= 10 ? obj.Duration.slice(0, -1) : '0' + obj.Duration.slice(0, -1)}`;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // for the Item_variant property
  getVariant(journey: TravelSolutionModel) {
    return (journey.Changes === 0 ? ('1:' + journey.DepartureTime.split('(').pop().split(')')[0] + '-' + journey.ArrivalTime.split('(').pop().split(')')[0]) : journey.CallingPointName);
  }

  // for the class of the ticket
  getTicketClass(singleSelectedFare, returnSelectedFare, isReturnCase: boolean, activeTab = '0') {
    if (isReturnCase && activeTab == '0') {
      return (returnSelectedFare) ? returnSelectedFare.TicketClass : singleSelectedFare && singleSelectedFare.TicketClass;
    } else {
      return singleSelectedFare && singleSelectedFare.TicketClass;
    }
  }

  // for the type of the ticket
  getTicketType(singleSelectedFare, returnSelectedFare, isReturnCase: boolean, activeTab = '0') {
    if (isReturnCase && activeTab == '0') {
      return returnSelectedFare ? returnSelectedFare.TicketType : singleSelectedFare && singleSelectedFare.TicketType;
    } else {
      return singleSelectedFare && singleSelectedFare.TicketType;
    }
  }

  // to get the railcard code and check if railcard is present
  getRailCardCode(searchRequest: SearchRequestModel) {
    let railCards = '';
    if (searchRequest && searchRequest.RailCardList && searchRequest.RailCardList.length > 0) {
      this.isRailCardPresent = true;
      searchRequest.RailCardList.forEach((obj, _index) => {
        railCards += `${obj.RailCard}:${obj.RailCardCount}|`;
      });
      railCards = railCards.slice(0, -1);
      return railCards;
    }
    return undefined;
  }

  // to get the price property
  getPrice(isReturnCase: boolean, activeTab: number, journeySummaryModel: JourneySummaryModel) {
    if (isReturnCase) {
      return ((activeTab === 0) ? journeySummaryModel.ReturnSelectedFare.Price : 0);
    } else {
      return (journeySummaryModel.SingleSelectedFare.Price);
    }
  }

  // *** PICO-1870 For Select_Item Event *** 
  loadGA4selectItem(journeySummaryModel: JourneySummaryModel, seasonOffers, activeTab: number, searchRequest: SearchRequestModel, index, isCheckQuickBuy, isNewFlow: boolean = false) {
    try {
      let itemObj: Array<DataLayerViewItemType> = [];
      if (!searchRequest.IsSeason) {
        let outwardSelectedJourney: TravelSolutionModel = journeySummaryModel.SingleRouteModel;
        let returnSelectedJourney: TravelSolutionModel = journeySummaryModel.ReturnRouteModel;
        activeTab = returnSelectedJourney ? activeTab : 0;

        if (outwardSelectedJourney) {
          let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.SingleRouteModel);
          let selectItem = this.setGAObjectsForSelectItemServiceModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, false, activeTab, company, isCheckQuickBuy, true);
          itemObj.push(selectItem);
        }
        if (returnSelectedJourney) {
          let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.ReturnRouteModel);
          let selectItem = this.setGAObjectsForSelectItemServiceModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, true, activeTab, company, isCheckQuickBuy, true, 1);
          itemObj.push(selectItem);
        }
      } else {
        let NonSeasonSelectItem = this.setGAObjectsForSeasonOffersSelectItemModel(seasonOffers, searchRequest, index);
        itemObj.push(NonSeasonSelectItem);
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.selectItem,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory,
          sold_out_trains: this.getClosedTrainsCountForOutward(journeySummaryModel.SingleRouteModel?.TravelSolutions) + this.getClosedTrainsCountForReturn(journeySummaryModel.ReturnRouteModel?.RetTravelSolutions),
          cancelled_trains: this.getCancelledTrainsCount(journeySummaryModel.SingleRouteModel?.TravelSolutions) + this.getCancelledTrainsCount(journeySummaryModel.ReturnRouteModel?.RetTravelSolutions),
        }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: itemObj,
        }
      });
    } catch (error) { console.log(error); }
  }

  // to set the non-season select_item object
  setGAObjectsForSelectItemServiceModel(searchRequest: SearchRequestModel, outwardSelectedJourney: TravelSolutionModel, returnSelectedJourney: TravelSolutionModel, journeySummaryModel: JourneySummaryModel, isReturnCase: boolean, activeTab, company, isCheckQuickBuy?, isNewFlow: boolean = false, index = 0) {
    try {
       let email = localStorage.getItem('Email');
      let customerKey = localStorage.getItem('CustomerKey');
      if (customerKey == null) {
        customerKey = undefined;
      }
      const selectItemObj: DataLayerViewItemType = new DataLayerViewItemType();

      let selectedJourney = isReturnCase ? returnSelectedJourney : outwardSelectedJourney;
      let diffOfDates = Math.abs(this.calculateDiff(selectedJourney.DepartureDate));
      let [ticketRouteCode, ticketTypeCode] = this.getTicketRouteAndTypeCodeForSelectEvent(journeySummaryModel,isReturnCase, activeTab);


      selectItemObj.item_name = selectedJourney.DepartureTime.split('(').pop().split(')')[0] + `-` + selectedJourney.ArrivalTime.split('(').pop().split(')')[0];
      selectItemObj.item_id = this.getIdForEvents(selectedJourney, searchRequest, activeTab);
      selectItemObj.price = this.getPrice(isReturnCase, activeTab, journeySummaryModel);
      selectItemObj.item_brand = selectedJourney.Brand;
      selectItemObj.item_category = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase, activeTab);
      selectItemObj.item_category2 = isReturnCase ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
      selectItemObj.item_category3 = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase, activeTab);
      selectItemObj.item_category5 = this.ga4DatalayerConstantEnum.Fare;
      selectItemObj.item_category4 = this.getRailCardString(searchRequest);
      selectItemObj.item_variant = this.getVariant(selectedJourney);
      selectItemObj.item_list_name = this.ga4ItemListEnum.resultPageItemListName;
      selectItemObj.item_list_id = this.ga4ItemListEnum.resultsPageSelectionItemListId ;
      selectItemObj.index = index;
      selectItemObj.start_date = (new Date(`${selectedJourney.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      selectItemObj.end_date = (new Date(`${selectedJourney.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      selectItemObj.duration = this.getDurationTime(selectedJourney);
      selectItemObj.ticket_class = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
      selectItemObj.ticket_type = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
      selectItemObj.ticket_route_code = ticketRouteCode;
      selectItemObj.ticket_type_code = ticketTypeCode;
      selectItemObj.type = isReturnCase ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
      selectItemObj.single_or_return = (outwardSelectedJourney && returnSelectedJourney) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
      selectItemObj.number_of_changes = selectedJourney.Changes;
      selectItemObj.additional_information = isNewFlow ? this.getAdditionalInformation(selectedJourney, searchRequest) : this.isCheapestTravelSolution(selectedJourney);
      selectItemObj.days_in_advance = diffOfDates;
      selectItemObj.railcard_code = this.getRailCardCode(searchRequest);
      selectItemObj.railcard_used = this.isRailCardPresent;
      selectItemObj.adult_pax = searchRequest.Adult;
      selectItemObj.child_pax = searchRequest.Child;
      selectItemObj.total_pax = (searchRequest.Adult + searchRequest.Child);
      selectItemObj.start_time = selectedJourney.DepartureTime.split('(')[0].trim();
      selectItemObj.end_time = selectedJourney.ArrivalTime.split('(')[0].trim();
      selectItemObj.operator = company;
      selectItemObj.quick_buy = isCheckQuickBuy ? 'Yes' : 'No';
      if(isNewFlow){
        selectItemObj.column_index = !isReturnCase ? 1 : 2;
        selectItemObj.origin= searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
        selectItemObj.destination= searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        selectItemObj.available_classes = this.getFareMessage(selectedJourney?.NewFareList,
                                                            selectedJourney?.NewReturnFareList, selectedJourney, searchRequest);
        selectItemObj.search_source = this.enhancedSearchSourceTypeEnum?.searchResultSearchSource;
        selectItemObj.price_from = isReturnCase ? journeySummaryModel.ReturnSelectedFare.Price : journeySummaryModel.SingleSelectedFare.Price;
      }
      return selectItemObj;
    } catch (error) {
      console.log(error);
    }
  }

  getTicketRouteAndTypeCodeForSelectEvent(journeySummaryModel,isReturnCase, activeTab = '0'){
    let ticketRouteCode = '';
    let ticketTypeCode = '';
    if(isReturnCase && activeTab){
      if(journeySummaryModel.ReturnSelectedFare){
        ticketRouteCode = String(journeySummaryModel.ReturnSelectedFare.ServiceId).slice(-5);
        ticketTypeCode = journeySummaryModel.ReturnSelectedFare.TicketTypeCode;
      }
    }else{
      if(journeySummaryModel.SingleSelectedFare){
        ticketRouteCode = String(journeySummaryModel.SingleSelectedFare.ServiceId).slice(-5);
        ticketTypeCode = journeySummaryModel.SingleSelectedFare.TicketTypeCode;
      }
    }
    return [ticketRouteCode, ticketTypeCode];
  }

  // *** PICO-1870 For Season Select_Item Event *** 
  setGAObjectsForSeasonOffersSelectItemModel(seasonOffers, searchRequest, index) {
    try {
      const nonSeasonSelectItemObj: DataLayerViewItemType = new DataLayerViewItemType();

      let diffOfDates = Math.abs(this.calculateDiff(searchRequest.DepartureTimesStart));
      nonSeasonSelectItemObj.item_name = searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      nonSeasonSelectItemObj.item_id = undefined;
      nonSeasonSelectItemObj.price = seasonOffers.Price;
      nonSeasonSelectItemObj.item_brand = undefined;
      nonSeasonSelectItemObj.item_category = this.ga4DatalayerConstantEnum.Direct;
      nonSeasonSelectItemObj.item_variant = ('1:' + searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]);
      nonSeasonSelectItemObj.item_list_name = undefined;
      nonSeasonSelectItemObj.item_list_id = undefined;
      nonSeasonSelectItemObj.index = (index + 1).toString();
      nonSeasonSelectItemObj.start_date = new Date(searchRequest.DepartureTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
      nonSeasonSelectItemObj.end_date = new Date(seasonOffers.Expiry).toLocaleDateString(this.appConstantsService.LocaleDateString);
      nonSeasonSelectItemObj.duration = seasonOffers.DurationType;
      nonSeasonSelectItemObj.ticket_class = seasonOffers.TicketClass;
      nonSeasonSelectItemObj.ticket_type = seasonOffers.TicketType;
      nonSeasonSelectItemObj.ticket_route_code = String(seasonOffers.ServiceId).slice(-5);
      nonSeasonSelectItemObj.ticket_type_code = undefined;
      nonSeasonSelectItemObj.type = this.getJourneyType(searchRequest);
      nonSeasonSelectItemObj.single_or_return = this.travelSolutionJourneyTypeEnum.season;
      nonSeasonSelectItemObj.number_of_changes = undefined;
      nonSeasonSelectItemObj.additional_information = undefined;
      nonSeasonSelectItemObj.days_in_advance = diffOfDates;
      nonSeasonSelectItemObj.railcard_code = this.getRailCardCode(searchRequest);
      nonSeasonSelectItemObj.railcard_used = this.isRailCardPresent;
      nonSeasonSelectItemObj.adult_pax = searchRequest.Adult;
      nonSeasonSelectItemObj.child_pax = searchRequest.Child;
      nonSeasonSelectItemObj.total_pax = (searchRequest.Adult + searchRequest.Child);
      nonSeasonSelectItemObj.start_time = undefined;
      nonSeasonSelectItemObj.end_time = undefined;
      nonSeasonSelectItemObj.operator = undefined;
      return nonSeasonSelectItemObj;
    } catch (error) {
      console.log(error);
    }
  }

  // created method to get id for transaction event
  getIdForTransactionEvent(journey: JourneyDetail, type) {
    let id = "";
    if (journey) {
      if (type === this.travelSolutionJourneyTypeEnum.outward || type === this.travelSolutionJourneyTypeEnum.season) {
        id += `${journey.Departure.split('(').pop().split(')')[0]}-${journey.Arrival.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.DepartureDate.toString().split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -3)}`;
        id += depDateTimeStamp; // service departure timestamp
      } else {
        id += `${journey.Arrival.split('(').pop().split(')')[0]}-${journey.Departure.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.ReturnDepartureDate.toString().split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -3)}`;
        id += depDateTimeStamp; // service departure timestamp
      }

      id += `-${journey.Adult}`;
      id += `-${journey.Child}`;
      id += `-${((type === this.travelSolutionJourneyTypeEnum.season) ? this.travelSolutionJourneyTypeEnum.season.toLowerCase() : (journey.GAJourneyType && journey.GAJourneyType.toLowerCase()))}`;
    }
    return (id || undefined);
  }

  // created method to get id for journey extras
  getIdForJE_Services(service) {
    let id = "";
    if (service) {
      let direction = service.IsReturn ? '_return' : '_outward';
      if (service.Description === this.appConstantsService.bicycleReservation) {
        id += ("Bike" + direction);
      } else if (service.Description === this.appConstantsService.londonTravelcard) {
        let zone = service.ServiceName ? service.ServiceName.split(" ").slice(2, service.ServiceName.length).join("").toLowerCase() : "";
        id += ("Travelcard" + zone + direction);
      } else if (service.Description === this.appConstantsService.plusBus) {
        id += ("PlusBus" + direction);
      }
    }
    return id || undefined;
  }

  // created method to get item_varient for journey extras
  getVariantForJEService(service) {
    if (service && service.Description === this.appConstantsService.bicycleReservation || service.Description === this.appConstantsService.plusBus) {
      return service.IsReturn ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.outward;
    } else {
      return service.ServiceName;
    }
  }

  // created method to get duration for journey extras
  getGaDurationTime(gaDuration: string) {
    if (gaDuration && gaDuration.length) {
      let gaTime = gaDuration.split(':');
      if (gaTime.length > 1) {
        return `${gaTime[0]}:${gaTime[1]}`;
      } else {
        return `00:${gaTime[0]}`;
      }
    }
  }
  // created method for check count of railcard
  checkCounts(obj) {
    if (!this.railCardListFromStorage) {
      this.railCardListFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
    }
    if (this.railCardListFromStorage)
      this.railCardsList = this.railCardListFromStorage.Railcard;
    const counts = Object.create(null);
    obj.Fares.forEach(btn => {
      if (btn.Railcard && btn.Railcard != 'No Railcard') {
        counts[btn.Railcard] = counts[btn.Railcard] ? counts[btn.Railcard] + 1 : 1;
      }
    });
    return counts;
  }

  // created method to get rail cards for Outward & Return transaction event
  getRailCards(obj) {
    if (obj) {
      let counts = this.checkCounts(obj);
      let railCards = '';
      if (counts) {
        const entries = Object.entries(counts);
        entries.forEach(row => {
          railCards = railCards + (railCards == '' ? '' : '|') + this.railCardsList.filter(x => x.Name == row[0])[0].Code + ':' + row[1];
        });
        return railCards;
      }
      return '';
    }
    return '';
  }

  // created method to get rail cards for season transaction event
  getRailCardsForSeason(obj) {
    let seasonDetailRailCards = '';
    if (obj && obj.RailCard && obj.RailCard != 'No Railcard') {
      seasonDetailRailCards = this.railCardsSeasonList.filter(x => x.Name == obj.RailCard)[0].Code + ':1';
      return seasonDetailRailCards;
    }
    return '';
  }
  // created method of check Out & Return journey Obj detail
  getTransactionConfirmationDetailForJourney(obj, validatePaymentResponse, index, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, searchRequest, search_source?) {
    let outRetListItems = [];
    if (obj.OutwardDetail) {
      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      const outwardRailCards = this.getRailCards(obj.OutwardDetail);
      let company = this.getTravelSolutionOperatorForCompany(obj.OutwardDetail);
      let purchaseItem = this.getTransactionConfirmationModelForOutAndReturn(obj, validatePaymentResponse, index, daysInAdvance, outwardRailCards, false, company, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, searchRequest, 0, obj?.OutwardSeat, search_source);
      if (purchaseItem) {
        outRetListItems.push(purchaseItem);
      }
    }
    if (obj.ReturnDetail) {
      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.ReturnDepartureDate), 'days'));
      const returnDetailRailCards = this.getRailCards(obj.ReturnDetail);
      let company = this.getTravelSolutionOperatorForCompany(obj.ReturnDetail);
      let purchaseItem = this.getTransactionConfirmationModelForOutAndReturn(obj, validatePaymentResponse, index, daysInAdvance, returnDetailRailCards, true, company, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, searchRequest, 1, obj?.ReturnSeat, search_source);
      if (purchaseItem) {
        outRetListItems.push(purchaseItem);
      }
    }
    return outRetListItems;
  }
  // created method of check journey Extras Obj detail
  getTransactionConfirmationDetailForJourneyExtra(obj, index) {
    let outRetJourneyExtraListItems = [];
    if (obj.OutwardJourneyExtras && obj.OutwardJourneyExtras.length > 0 && obj.SeasonDeatil == null) {
      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      const outwardJourneyExtraRailCards = this.getRailCards(obj.OutwardDetail);
      let company = this.getTravelSolutionOperatorForCompany(obj.OutwardDetail);
      obj.OutwardJourneyExtras.forEach(service => {
        let modifiedService = { ...service, IsReturn: false, Description: service.JourneyExtraName };
        let purchaseItem = this.getTransactionModelForOutAndReturnJourneyExtra(obj, index, daysInAdvance, outwardJourneyExtraRailCards, false, modifiedService, company);
        if (purchaseItem) {
          outRetJourneyExtraListItems.push(purchaseItem);
        }
      })
    }
    if (obj.ReturnJourneyExtras && obj.ReturnJourneyExtras.length > 0) {
      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      const returnJourneyExtraRailCards = this.getRailCards(obj.ReturnDetail);
      let company = this.getTravelSolutionOperatorForCompany(obj.ReturnDetail);
      obj.ReturnJourneyExtras.forEach(service => {
        let modifiedService = { ...service, IsReturn: true, Description: service.JourneyExtraName };
        let purchaseItem = this.getTransactionModelForOutAndReturnJourneyExtra(obj, index, daysInAdvance, returnJourneyExtraRailCards, true, modifiedService, company);
        if (purchaseItem) {
          outRetJourneyExtraListItems.push(purchaseItem);
        }
      });
    }
    if (obj.OutwardJourneyExtras && obj.OutwardJourneyExtras.length > 0 && obj.SeasonDeatil) {
      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      const seasonJourneyExtraRailCards = this.getRailCardsForSeason(obj.SeasonDeatil);
      obj.OutwardJourneyExtras.forEach(service => {
        let modifiedService = { ...service, IsReturn: false, Description: service.JourneyExtraName };
        let purchaseItem = this.getTransactionModelForSeasonJourneyExtra(obj, index, daysInAdvance, seasonJourneyExtraRailCards, modifiedService);
        if (purchaseItem) {
          outRetJourneyExtraListItems.push(purchaseItem);
        }
      });
    }
    return outRetJourneyExtraListItems;
  }
  // created method of check journey detail
  checkPurchaseDetailObj(obj, validatePaymentResponse, _index, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, searchRequest, search_source?) {
    let purchaseItem: DataLayerTransactionType;
    let selectItems: Array<DataLayerTransactionType> = [];
    // for Outward & Retrun detail
    if (obj && !obj.SeasonDeatil) {
      let outRetListItem = this.getTransactionConfirmationDetailForJourney(obj, validatePaymentResponse, _index, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, searchRequest, search_source);
      if (outRetListItem) {
        selectItems.push(...outRetListItem);
      }
    }
    // for Season detail
    if (obj && obj.SeasonDeatil) {
      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      const seasonJourneyExtraRailCards = this.getRailCardsForSeason(obj.SeasonDeatil);
      purchaseItem = this.getTransactionConfirmationModelForSeasonDetail(obj, validatePaymentResponse, _index, daysInAdvance, seasonJourneyExtraRailCards);
      if (purchaseItem)
        selectItems.push(purchaseItem);
    }
    // for Outward & Retrun journey extra detail
    if (obj && !isNewFlow) {
      let outRetJourneyExtraListItem = this.getTransactionConfirmationDetailForJourneyExtra(obj, _index);
      if (outRetJourneyExtraListItem) {
        selectItems.push(...outRetJourneyExtraListItem);
      }
    }
    return selectItems;
  }
  // for check paymentModeName
  paymentMethodsCombine(paymentRecords) {
    let paymentMethod = '';
    if (paymentRecords && paymentRecords.length > 0) {
      paymentRecords.forEach(e => {
        if (e.PaymentMode) {
          paymentMethod += paymentMethod ? ' ,' + e.PaymentMode : e.PaymentMode;
        }
      });
    }
    return paymentMethod;
  }
  // created method to load transaction confirmaion model event
  loadGTMDataLayerPurchaseOnConfirmation(validatePaymentResponse: ValidatePaymentResponse, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, searchRequest?) {
    try {
      const selectItems: Array<DataLayerTransactionType> = [];
      let gaCouponCode;
      if(isNewFlow){
        gaCouponCode = [];
      } else {
        gaCouponCode = '';
      }
      let shipping: number = 0.00;
      let search_source;
      if (validatePaymentResponse && validatePaymentResponse.Journey && validatePaymentResponse.Journey.length > 0) {
        validatePaymentResponse.Journey.forEach((obj, _index) => {
          if(obj?.IsPromo){
            search_source = this.ga4DatalayeEventNameEnum?.partnershipSearchSource;
          } else {
            search_source = this.commonServices.checkNRE_StorageData(obj) ? this.ga4DatalayeEventNameEnum?.nreSearchSource : this.ga4DatalayeEventNameEnum?.bookingSearchSource;
          }
          shipping = shipping + obj.DeliveryDetail.reduce((sum, current) => sum + current.Price, 0);
          if(isNewFlow){
            if(obj.GACouponCode){
              gaCouponCode.push(obj.GACouponCode);
            }
          } else {
            gaCouponCode = obj.GACouponCode ? obj.GACouponCode : undefined;
          }
          let selectItemsList = this.checkPurchaseDetailObj(obj, validatePaymentResponse, _index, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, searchRequest, search_source)
          if (selectItemsList) {
            selectItems.push(...selectItemsList);
          }
        });
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.purchase,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
            category: this.pageTypeEnum.checkout,
            shipping: shipping
          }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          transaction_id: validatePaymentResponse.ReferenceNumber,
          value: (validatePaymentResponse.PaymentRecords ? (validatePaymentResponse.PaymentRecords.reduce((sum, current) => sum + current.Price, 0) - shipping) : 0),
          coupon: isNewFlow ? gaCouponCode?.length > 0 ? gaCouponCode.join(" | ") : undefined : gaCouponCode,
          payment_type: this.paymentMethodsCombine(validatePaymentResponse.PaymentRecords),
          items: selectItems,
        },
      });
    } catch (err) { console.log(err); }
  }

  // created method to get_varient for outward & return trasaction event
  getVarient(journey, isOutward) {
    if (isOutward) {
      if (journey && journey.OutwardDetail && journey.OutwardDetail.Changes == '0') {
        return '1:' + journey.Departure.split('(').pop().split(')')[0] + '-' + journey.Arrival.split('(').pop().split(')')[0];
      }
      return journey.OutwardDetail.CallingPointName;
    } else if (journey && journey.ReturnDetail && journey.ReturnDetail.Changes == '0') {
      return '1:' + journey.Departure.split('(').pop().split(')')[0] + '-' + journey.Arrival.split('(').pop().split(')')[0]
    }
    return journey.ReturnDetail.CallingPointName;
  }

  // for get item name 
  getItemNameForJourney(obj, isReturnCase: boolean) {
    try {
      if (obj) {
        if (isReturnCase) {
          return obj.Arrival.split('(').pop().split(')')[0] + '-' + obj.Departure.split('(').pop().split(')')[0];
        } else {
          return obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
        }
      }
      return undefined;
    } catch (error) { console.log(error); }
  }
  // for get fares price
  getFaresPrice(obj, isReturnCase: boolean) {
    try {
      if (obj) {
        if (isReturnCase) {
          return obj.ReturnDetail ? this.sharedService.formatPrice(obj.ReturnDetail.Fares.reduce((sum, current) => sum + current.Price, 0)) : undefined;
        } else {
          return obj.OutwardDetail ? this.sharedService.formatPrice(obj.OutwardDetail.Fares.reduce((sum, current) => sum + current.Price, 0)) : undefined;
        }
      }
      return undefined;
    } catch (error) { console.log(error); }
  }
  // for get brand name
  getBrandName(obj, isReturnCase: boolean) {
    try {
      if (obj) {
        if (isReturnCase) {
          return (obj.ReturnDetail && obj.ReturnDetail.Brand) ? obj.ReturnDetail.Brand : undefined;
        } else {
          return (obj.OutwardDetail && obj.OutwardDetail.Brand) ? obj.OutwardDetail.Brand : undefined;
        }
      }
      return undefined;
    } catch (error) { console.log(error); }
  }
  // for Outward & Return transaction confirmation model
  getTransactionConfirmationModelForOutAndReturn(obj, validatePaymentResponse, _index, daysInAdvance, railCards, isReturnCase: boolean, company = '', selectedJourneyDataForQuickBuyOrContiue, isNewFlow = false, searchRequest, columnIndex, seatDetail?, search_source?) {
    const selectItemList: DataLayerTransactionType = new DataLayerTransactionType();
    let getJourneyDetailObj = isReturnCase ? obj.ReturnDetail : obj.OutwardDetail;
    selectItemList.item_name = this.getItemNameForJourney(obj, isReturnCase);
    selectItemList.item_id = this.getIdForTransactionEvent(obj, (isReturnCase ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.outward));
    selectItemList.price = parseFloat(this.getFaresPrice(obj, isReturnCase));
    if(!isNewFlow){
      selectItemList.quantity = validatePaymentResponse.Journey.length;
    }
    selectItemList.discount = obj.DiscountedPrice;
    selectItemList.item_brand = this.getBrandName(obj, isReturnCase);
    selectItemList.item_category = getJourneyDetailObj.TicketClass ? getJourneyDetailObj.TicketClass : undefined;
    selectItemList.item_category2 = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.item_category3 = getJourneyDetailObj.TicketType ? getJourneyDetailObj.TicketType : undefined;
    selectItemList.item_category4 = isNewFlow ? this.getRailCardString(searchRequest) : undefined;
    selectItemList.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    selectItemList.item_variant = this.getVarient(obj, true);
    selectItemList.item_list_name = this.ga4ItemListEnum.transactionName;
    selectItemList.item_list_id = this.ga4ItemListEnum.transactionId;
    selectItemList.index = (_index + 1);
    selectItemList.origin = obj.Departure.split('(').pop().split(')')[0];
    selectItemList.destination = obj.Arrival.split('(').pop().split(')')[0];
    selectItemList.start_date = this.datePipe.transform(obj.DepartureDate, 'dd/MM/yy');
    selectItemList.end_date = this.datePipe.transform(obj.ArrivalDate, 'dd/MM/yy');
    selectItemList.duration = getJourneyDetailObj.Duration ? getJourneyDetailObj.Duration : undefined;
    selectItemList.ticket_class = getJourneyDetailObj.TicketClass ? getJourneyDetailObj.TicketClass : undefined;
    selectItemList.ticket_type = getJourneyDetailObj.TicketType ? getJourneyDetailObj.TicketType : undefined;
    selectItemList.ticket_route_code = this.getTicktRouteCode(getJourneyDetailObj, false);
    selectItemList.ticket_type_code = getJourneyDetailObj.TicketTypeCode ? getJourneyDetailObj.TicketTypeCode : undefined;
    selectItemList.type = isReturnCase ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    selectItemList.single_or_return = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.number_of_changes = getJourneyDetailObj.Changes;
    selectItemList.additional_information = undefined;
    selectItemList.days_in_advance = daysInAdvance;
    selectItemList.railcard_code = railCards ? railCards : undefined;
    selectItemList.railcard_used = this.getRailcardPresenceForReviewBuyData(getJourneyDetailObj);
    selectItemList.adult_pax = obj.Adult;
    selectItemList.child_pax = obj.Child;
    selectItemList.total_pax = (obj.Adult + obj.Child);
    selectItemList.start_time = getJourneyDetailObj.DepartureTimeStart ? getJourneyDetailObj.DepartureTimeStart : undefined;
    selectItemList.end_time = getJourneyDetailObj.ArrivalTimeStart ? getJourneyDetailObj.ArrivalTimeStart : undefined;
    selectItemList.operator = company;
    if(!isNewFlow){
      selectItemList.travel_extras = isReturnCase ? this.getSeatTypeForTravelExtras(obj.ReturnSeat) : this.getSeatTypeForTravelExtras(obj.OutwardSeat);
      selectItemList.discount_type = undefined;
      selectItemList.delivery_method = this.checkDeliveryMethod(obj);
    }
    this.addDataInSelectItemListForOutAndReturn(selectItemList, isReturnCase, obj, isNewFlow);
    this.getItemObjForQuickBuyValue(obj, selectedJourneyDataForQuickBuyOrContiue, selectItemList);
    if(isNewFlow){
      let coachList = seatDetail?.flatMap(os => os.Seat)?.map(s => s.CoachNumber)?.filter(c => c && c !== '*' && c !== '**')?.map(c => `Coach ${c}`);
      let uniqueCoachList = coachList ? Array.from(new Set(coachList)) : [];
      let coachstring = uniqueCoachList?.length > 0 ? uniqueCoachList?.join(", ") : undefined;
      let seatList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.Seat && s.Seat.trim() !== '' && s.Seat !== '*' && s.Seat !== '**' && s.Seat !== '***')?.map(s => `${s.CoachNumber}${s.Seat}`); 
      let seatNumber = seatList?.length > 0 ?seatList.join(", ") : undefined;
      let seatPositionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatPosition && s.SeatPosition.trim() !== '')?.map(s => `${s.SeatPosition}`); 
      let seatDirectionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatFacing && s.SeatFacing.trim() !== '')?.map(s => `${s.SeatFacing}`); 
      let visibleDeliveryModes = this.commonServices.setDeliveryModeLabel(obj?.DeliveryDetail[0]?.DeliveryModeType);
      selectItemList.available_classes = !isReturnCase ? obj.OutwardDetail?.TicketClass : obj.ReturnDetail?.TicketClass;
      selectItemList.coach = coachstring;
      selectItemList.seat_number = seatNumber;
      selectItemList.seat_position = seatPositionList?.length > 0 ? seatPositionList.join(", ") : undefined;
      selectItemList.seat_direction = seatDirectionList?.length > 0 ? seatDirectionList.join(", ") : undefined;
      selectItemList.seat_preferences = undefined;
      selectItemList.status = undefined;
      selectItemList.delivery_option = visibleDeliveryModes ? visibleDeliveryModes : undefined;
      selectItemList.shipping = obj?.DeliveryDetail[0]?.Price;
      selectItemList.coupon = obj?.GACouponCode ? obj?.GACouponCode : undefined;
      selectItemList.column_index = columnIndex;
      selectItemList.search_source = search_source ? search_source : undefined;
    }

    return selectItemList;
  }

  // Method to add data in selectItemList
  addDataInSelectItemListForOutAndReturn(selectItemList, isReturnCase, obj, isNewFlow = false) {
    let journeyExtra;
    if(isNewFlow){
      selectItemList.upsell_taken = isReturnCase ? this.commonServices?.getUpsellTakenObject(obj.ReturnJourneyExtras) : this.commonServices?.getUpsellTakenObject(obj.OutwardJourneyExtras);
      journeyExtra = isReturnCase ? this.commonServices?.getUpsellItemObject(obj.ReturnJourneyExtras) : this.commonServices?.getUpsellItemObject(obj.OutwardJourneyExtras);
      selectItemList.upsell_item = (selectItemList.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? journeyExtra : undefined;
    } else {
      selectItemList.upsell_taken = isReturnCase ? this.getUpsellTaken(obj.ReturnJourneyExtras) : this.getUpsellTaken(obj.OutwardJourneyExtras);
      journeyExtra = isReturnCase ? this.getUpsellItem(obj.ReturnJourneyExtras) : this.getUpsellItem(obj.OutwardJourneyExtras);
      selectItemList.upsell_item = (selectItemList.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? journeyExtra : undefined;
    }
  }
  // for check delivery method name
  checkDeliveryMethod(obj) {
    if (obj.DeliveryDetail) {
      return obj.DeliveryDetail[0].DeliveryModeName ? obj.DeliveryDetail[0].DeliveryModeName : undefined;
    }
  }

  // for Season transaction confirmation model
  getTransactionConfirmationModelForSeasonDetail(obj, validatePaymentResponse, _index, daysInAdvance, railCards) {
    const selectItemList: DataLayerTransactionType = new DataLayerTransactionType();
    selectItemList.item_name = obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
    selectItemList.item_id = this.getIdForTransactionEvent(obj, this.travelSolutionJourneyTypeEnum.season);
    selectItemList.price = obj.SeasonDeatil.Price;
    selectItemList.quantity = validatePaymentResponse.Journey.length;
    selectItemList.discount = obj.DiscountedPrice;
    selectItemList.item_brand = undefined
    selectItemList.item_category = obj.SeasonDeatil.TicketClass ? obj.SeasonDeatil.TicketClass : undefined;
    selectItemList.item_category2 = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.item_category3 = obj.SeasonDeatil.TicketType ? obj.SeasonDeatil.TicketType : undefined;
    selectItemList.item_category4 = undefined;
    selectItemList.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    selectItemList.item_variant = obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
    selectItemList.item_list_name = this.ga4ItemListEnum.transactionName;
    selectItemList.item_list_id = this.ga4ItemListEnum.transactionId;
    selectItemList.index = (_index + 1);
    selectItemList.origin = obj.Departure.split('(').pop().split(')')[0];
    selectItemList.destination = obj.Arrival.split('(').pop().split(')')[0];
    selectItemList.start_date = this.datePipe.transform(obj.SeasonDeatil.ValidFrom, 'dd/MM/yy');
    selectItemList.end_date = this.datePipe.transform(obj.SeasonDeatil.ValidTill, 'dd/MM/yy');
    selectItemList.duration = undefined
    selectItemList.ticket_class = obj.SeasonDeatil.TicketClass ? obj.SeasonDeatil.TicketClass : undefined;
    selectItemList.ticket_type = obj.SeasonDeatil.TicketType ? obj.SeasonDeatil.TicketType : undefined;
    selectItemList.ticket_route_code = undefined;
    selectItemList.ticket_type_code = obj.SeasonDeatil.TicketTypeCode ? obj.SeasonDeatil.TicketTypeCode : undefined;
    selectItemList.type = obj.SeasonDeatil.TravelType ? obj.SeasonDeatil.TravelType : undefined;
    selectItemList.single_or_return = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.number_of_changes = undefined;
    selectItemList.additional_information = undefined;
    selectItemList.days_in_advance = daysInAdvance;
    selectItemList.railcard_code = railCards ? railCards : undefined;
    selectItemList.railcard_used = ((obj && obj.SeasonDeatil && obj.SeasonDeatil.RailCard && obj.SeasonDeatil.RailCard != 'No Railcard') ? true : false);
    selectItemList.adult_pax = obj.Adult;
    selectItemList.child_pax = obj.Child;
    selectItemList.total_pax = (obj.Adult + obj.Child);
    selectItemList.start_time = obj.SeasonDeatil.DepartureTimeStart ? obj.SeasonDeatil.DepartureTimeStart : undefined;
    selectItemList.end_time = obj.SeasonDeatil.ArrivalTimeStart ? obj.SeasonDeatil.ArrivalTimeStart : undefined;
    selectItemList.operator = undefined;
    selectItemList.travel_extras = undefined;
    selectItemList.discount_type = undefined;
    selectItemList.delivery_method = this.checkDeliveryMethod(obj);
    selectItemList.upsell_taken = this.getUpsellTaken(obj.OutwardJourneyExtras);
    selectItemList.upsell_item = (selectItemList.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(obj.OutwardJourneyExtras) : undefined;
    return selectItemList;
  }
  // for Outward & Return JourneyExtra transaction confirmation model
  getTransactionModelForOutAndReturnJourneyExtra(obj, _index, daysInAdvance, railCards, isReturnCase: boolean, modifiedService = null, company = '') {
    const selectItemList: DataLayerTransactionType = new DataLayerTransactionType();
    let getJourneyExtraDetailObj = isReturnCase ? obj.ReturnDetail : obj.OutwardDetail;
    selectItemList.item_name = this.getItemNameForJourney(obj, isReturnCase);
    selectItemList.item_id = this.getIdForJE_Services(modifiedService);
    selectItemList.price = modifiedService.Price;
    selectItemList.quantity = modifiedService.Count;
    selectItemList.discount = obj.DiscountedPrice;
    selectItemList.item_brand = modifiedService.JourneyExtraName ? modifiedService.JourneyExtraName : undefined;
    selectItemList.item_category = getJourneyExtraDetailObj.TicketClass ? getJourneyExtraDetailObj.TicketClass : undefined;
    selectItemList.item_category2 = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.item_category3 = getJourneyExtraDetailObj.TicketType ? getJourneyExtraDetailObj.TicketType : undefined;
    selectItemList.item_category4 = undefined;
    selectItemList.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    selectItemList.item_variant = this.getVariantForJEService(modifiedService);
    selectItemList.item_list_name = this.ga4ItemListEnum.transactionName;
    selectItemList.item_list_id = this.ga4ItemListEnum.transactionId;
    selectItemList.index = (_index + 1);
    selectItemList.origin = obj.Departure.split('(').pop().split(')')[0];
    selectItemList.destination = obj.Arrival.split('(').pop().split(')')[0];
    selectItemList.start_date = this.datePipe.transform(obj.DepartureDate, 'dd/MM/yy')
    selectItemList.end_date = this.datePipe.transform(obj.ArrivalDate, 'dd/MM/yy');
    selectItemList.duration = this.getGaDurationTime(getJourneyExtraDetailObj.GADuration);
    selectItemList.ticket_class = getJourneyExtraDetailObj.TicketClass ? getJourneyExtraDetailObj.TicketClass : undefined;
    selectItemList.ticket_type = getJourneyExtraDetailObj.TicketType ? getJourneyExtraDetailObj.TicketType : undefined;
    selectItemList.ticket_route_code = this.getTicktRouteCode(getJourneyExtraDetailObj, false);
    selectItemList.ticket_type_code = getJourneyExtraDetailObj.TicketTypeCode ? getJourneyExtraDetailObj.TicketTypeCode : undefined;
    selectItemList.type = isReturnCase ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    selectItemList.single_or_return = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.number_of_changes = getJourneyExtraDetailObj.Changes;
    selectItemList.additional_information = undefined;
    selectItemList.days_in_advance = daysInAdvance;
    selectItemList.railcard_code = railCards ? railCards : undefined;
    selectItemList.railcard_used = this.getRailcardPresenceForReviewBuyData(getJourneyExtraDetailObj);
    selectItemList.adult_pax = obj.Adult;
    selectItemList.child_pax = obj.Child;
    selectItemList.total_pax = (obj.Adult + obj.Child);
    selectItemList.start_time = getJourneyExtraDetailObj.DepartureTimeStart ? getJourneyExtraDetailObj.DepartureTimeStart : undefined;
    selectItemList.end_time = getJourneyExtraDetailObj.ArrivalTimeStart ? getJourneyExtraDetailObj.ArrivalTimeStart : undefined;
    selectItemList.operator = company;
    selectItemList.travel_extras = isReturnCase ? this.getSeatTypeForTravelExtras(obj.ReturnSeat) : this.getSeatTypeForTravelExtras(obj.OutwardSeat);
    selectItemList.discount_type = undefined;
    selectItemList.delivery_method = this.checkDeliveryMethod(obj);
    selectItemList.upsell_taken = this.ga4DatalayerConstantEnum.Yes;
    selectItemList.upsell_item = this.getJourneyExtraName(modifiedService.JourneyExtraName);
    return selectItemList;
  }
  // for SeasonJourneyExtra transaction confirmation model
  getTransactionModelForSeasonJourneyExtra(obj, _index, daysInAdvance, railCards, modifiedService = null) {
    const selectItemList: DataLayerTransactionType = new DataLayerTransactionType();
    selectItemList.item_name = obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
    selectItemList.item_id = this.getIdForJE_Services(modifiedService);
    selectItemList.price = modifiedService.Price;
    selectItemList.quantity = modifiedService.Count;
    selectItemList.discount = obj.DiscountedPrice;
    selectItemList.item_brand = modifiedService.JourneyExtraName ? modifiedService.JourneyExtraName : undefined;
    selectItemList.item_category = obj.SeasonDeatil.TicketClass ? obj.SeasonDeatil.TicketClass : undefined;
    selectItemList.item_category2 = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.item_category3 = obj.SeasonDeatil.TicketType ? obj.SeasonDeatil.TicketType : undefined;
    selectItemList.item_category4 = undefined;
    selectItemList.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    selectItemList.item_variant = this.getVariantForJEService(modifiedService);
    selectItemList.item_list_name = this.ga4ItemListEnum.transactionName;
    selectItemList.item_list_id = this.ga4ItemListEnum.transactionId;
    selectItemList.index = (_index + 1);
    selectItemList.origin = obj.Departure.split('(').pop().split(')')[0];
    selectItemList.destination = obj.Arrival.split('(').pop().split(')')[0];
    selectItemList.start_date = this.datePipe.transform(obj.SeasonDeatil.ValidFrom, 'dd/MM/yy');
    selectItemList.end_date = this.datePipe.transform(obj.SeasonDeatil.ValidTill, 'dd/MM/yy');
    selectItemList.duration = undefined;
    selectItemList.ticket_class = obj.SeasonDeatil.TicketClass ? obj.SeasonDeatil.TicketClass : undefined;
    selectItemList.ticket_type = obj.SeasonDeatil.TicketType ? obj.SeasonDeatil.TicketType : undefined;
    selectItemList.ticket_route_code = undefined;
    selectItemList.ticket_type_code = obj.SeasonDeatil.TicketTypeCode ? obj.SeasonDeatil.TicketTypeCode : undefined;
    selectItemList.type = obj.SeasonDeatil.TravelType ? obj.SeasonDeatil.TravelType : undefined;
    selectItemList.single_or_return = obj.GAJourneyType ? obj.GAJourneyType : undefined;
    selectItemList.number_of_changes = undefined;
    selectItemList.additional_information = undefined;
    selectItemList.days_in_advance = daysInAdvance;
    selectItemList.railcard_code = railCards ? railCards : undefined;
    selectItemList.railcard_used = (obj && obj.SeasonDeatil && obj.SeasonDeatil.RailCard && obj.SeasonDeatil.RailCard != 'No Railcard') ? true : false;
    selectItemList.adult_pax = obj.Adult;
    selectItemList.child_pax = obj.Child;
    selectItemList.total_pax = (obj.Adult + obj.Child);
    selectItemList.start_time = obj.SeasonDeatil.DepartureTimeStart ? obj.SeasonDeatil.DepartureTimeStart : undefined;
    selectItemList.end_time = obj.SeasonDeatil.ArrivalTimeStart ? obj.SeasonDeatil.ArrivalTimeStart : undefined;
    selectItemList.operator = undefined;
    selectItemList.travel_extras = undefined;
    selectItemList.discount_type = undefined;
    selectItemList.delivery_method = this.checkDeliveryMethod(obj);
    selectItemList.upsell_taken = this.ga4DatalayerConstantEnum.Yes;
    selectItemList.upsell_item = this.getJourneyExtraName(modifiedService.JourneyExtraName);
    return selectItemList;
  }
  //  *** Add Payment Info ***
  loadGALayerForAddPaymentInfo(reviewBuyResponse: ReviewBuyResponse | EnhancedReviewBuyAndDeliveryResponse, paymentMethod: string, isVoucherUsed: boolean, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, totalPrice?) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.addPaymentInfo,
        ...(isNewFlow && {
            category: this.pageTypeEnum.checkout,
            website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow
          }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          ...(isNewFlow && {
            value: Number(totalPrice),
            coupon: reviewBuyResponse?.Journey?.map(j => j.DiscountCode)?.filter(d => d)?.join(' | '),
            payment_type: isVoucherUsed ? this.nativePaymentMethodEnum?.eVouchers : this.commonServices?.paymentMethodType(paymentMethod),
          }),
          items: this.addCartItemInDataLayerArray(reviewBuyResponse, this.ga4DatalayeEventNameEnum.addPaymentInfo , paymentMethod, isVoucherUsed, selectedJourneyDataForQuickBuyOrContiue, isNewFlow)
        }
      });
    } catch (error) { console.log(error); }
  }

  //  *** Add Delivery Option ***
  loadGALayerForAddDeliveryOption(searchRequest: SearchRequestModel, journeySummary: JourneySummaryModel, deliveryMode: string, allJEService) {
    try {
      const items: Array<DataLayerAddDeliveryOptionType> = [];
      if (searchRequest) {
        items.push(...this.addCartItemForAddDeliveryOption(searchRequest, journeySummary, deliveryMode, allJEService));
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.addDeliveryOption,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: items
        }
      });
    } catch (error) { console.log(error); }
  }

  addCartItemForAddDeliveryOptionForSeason(searchRequest, allJEService, deliveryMode, addDeliveryOptionItems) {
    const NonSeasonSelectItem: DataLayerAddDeliveryOptionType = new DataLayerAddDeliveryOptionType();
    Object.assign(NonSeasonSelectItem, { ...this.setGAObjectsForSeasonAddToCartModel(searchRequest, allJEService) });
    NonSeasonSelectItem.delivery_option = this.getTicketTypeName(deliveryMode);
    NonSeasonSelectItem.travel_extras = undefined;
    if (NonSeasonSelectItem) { addDeliveryOptionItems.push(NonSeasonSelectItem); }
  }

  // Method to fetch items for add delivery option event
  addCartItemForAddDeliveryOption(searchRequest: SearchRequestModel, journeySummary: JourneySummaryModel, deliveryMode: string, allJEService): Array<DataLayerAddDeliveryOptionType> {
    const AddDeliveryOptionItems: Array<DataLayerAddDeliveryOptionType> = [];

    if (searchRequest.IsSeason) {
      this.addCartItemForAddDeliveryOptionForSeason(searchRequest, allJEService, deliveryMode, AddDeliveryOptionItems);
    } else {
      const outwardSelectedJourney: TravelSolutionModel = journeySummary.SingleRouteModel || undefined;
      const returnSelectedJourney: TravelSolutionModel = journeySummary.ReturnRouteModel || undefined;
      let checkQuickBuyOrContinue = (localStorage.getItem(this.localStorageKeyEnum?.isQuickBuyOrContinue) == this.quickBuyEnum?.quickBuy) ? true : false;
      if (outwardSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummary.SingleRouteModel);
        let addItem: DataLayerAddDeliveryOptionType = new DataLayerAddDeliveryOptionType();
        Object.assign(addItem, { ... this.setGAObjectsForAddToCartServiceModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummary, false, company, allJEService, checkQuickBuyOrContinue) });
        addItem.delivery_option = this.getTicketTypeName(deliveryMode);
        addItem.travel_extras = this.getSeatPrefrenceType(this.sharedService?.createReservationRequest?.Preferences);
        if (addItem) AddDeliveryOptionItems.push(addItem);
      }

      if (returnSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummary.ReturnRouteModel);
        let addItem: DataLayerAddDeliveryOptionType = new DataLayerAddDeliveryOptionType();
        Object.assign(addItem, { ... this.setGAObjectsForAddToCartServiceModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummary, true, company, allJEService, checkQuickBuyOrContinue) });
        addItem.delivery_option = this.getTicketTypeName(deliveryMode);
        addItem.travel_extras = this.getSeatPrefrenceType(this.sharedService?.createReservationRequest?.Preferences);
        if (addItem) AddDeliveryOptionItems.push(addItem);
      }
    }

    return AddDeliveryOptionItems;
  }
  addCartItemForReviewAndBuy(items, journey, eventName, paymentMethod, isVoucherUsed, index, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, travelSolution?, search_source?) {
    if (journey) {
      if (eventName === this.ga4DatalayeEventNameEnum.addPaymentInfo) {
        items.push(...this.addCartItemForAddPaymentInfo(journey, index, paymentMethod, isVoucherUsed, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, search_source));
      }
      if (eventName === this.ga4DatalayeEventNameEnum.removeFromCart) {
        items.push(...this.addCartItemForRemoveFromCart(journey, index, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, travelSolution));
      }
      if (eventName === this.ga4DatalayeEventNameEnum.confirmOrderDetails) {
        items.push(...this.addCartItemInConfirmOrderDataLayerArray(journey, index, selectedJourneyDataForQuickBuyOrContiue));
      }
      if(eventName === this.ga4DatalayeEventNameEnum.viewCart){
        items.push(...this.addCartItemForViewCart(journey, index, selectedJourneyDataForQuickBuyOrContiue));
      }
    }
  }
  // Method to fetch items for add payment info event
  addCartItemInDataLayerArray(reviewBuyResponse: ReviewBuyResponse | EnhancedReviewBuyAndDeliveryResponse, eventName, paymentMethod?: string, isVoucherUsed?: boolean, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, travelSolution?) {
    if (reviewBuyResponse && reviewBuyResponse.Journey && reviewBuyResponse.Journey.length > 0) {
      let items = [];
      let search_source;
      for (let [index, journey] of reviewBuyResponse.Journey.entries()) {
        if(journey?.IsPromo){
          search_source = this.ga4DatalayeEventNameEnum?.partnershipSearchSource;
        } else {
          search_source = this.commonServices.checkNRE_StorageData(journey) ? this.ga4DatalayeEventNameEnum?.nreSearchSource : this.ga4DatalayeEventNameEnum?.bookingSearchSource;
        }
        this.addCartItemForReviewAndBuy(items, journey, eventName, paymentMethod, isVoucherUsed, index, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, travelSolution, search_source);
      }
      return items;
    }
  }

  // Method to get upsell item
  getUpsellItem(journeyExtras: JourneyExtrasDetail[]): string {
    let upsellItem = '';
    for (let journeyExtra of journeyExtras) {
      switch (journeyExtra.JourneyExtraName) {
        case this.appConstantsService.plusBus: upsellItem += (upsellItem) ? ` | Plusbus` : 'Plusbus';
          break;
        case this.appConstantsService.bicycleReservation: upsellItem += (upsellItem) ? ` | Bike Reservation` : 'Bike Reservation';
          break;
        case this.appConstantsService.londonTravelcard: upsellItem += (upsellItem) ? ` | London Travelcard` : 'London Travelcard';
          break;
      }
    }
    return upsellItem ? upsellItem : undefined;
  }

  // Method to get Single Journey Extra Name
  getJourneyExtraName(journeyExtraName: string) {
    switch (journeyExtraName) {
      case this.appConstantsService.plusBus: return 'Plusbus';
      case this.appConstantsService.bicycleReservation: return 'Bike Reservation';
      case this.appConstantsService.londonTravelcard: return 'London Travelcard';
    }
  }

  // Method to fetch items for add payment info event
  addCartItemForAddPaymentInfo(journey: JourneyDetail, index: number, paymentMethod: string, isVoucherUsed: boolean, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, search_source?): DataLayerAddPaymentInfoType[] {
    let items: DataLayerAddPaymentInfoType[] = [];

    const outwardJourneyDetail = journey.OutwardDetail || undefined;
    const returnJourneyDetail = journey.ReturnDetail || undefined;
    const seasonJourneyDetail = journey.SeasonDeatil || undefined;

    if (outwardJourneyDetail) {
      const item: DataLayerAddPaymentInfoType = new DataLayerAddPaymentInfoType();
      let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, outwardJourneyDetail, returnJourneyDetail, index, false, null, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, journey?.OutwardSeat, 1);
      Object.assign(item, { ...BasketItem });
      this.addAdditionalPropertiesForAddPaymentInfo(item, journey, this.travelSolutionJourneyTypeEnum.outward, paymentMethod, isVoucherUsed, isNewFlow, search_source);
      items.push(item);
    }

    if (returnJourneyDetail) {
      const item: DataLayerAddPaymentInfoType = new DataLayerAddPaymentInfoType();
      let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, returnJourneyDetail, returnJourneyDetail, index, true, null, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, journey?.ReturnSeat, 2);
      Object.assign(item, { ...BasketItem });
      this.addAdditionalPropertiesForAddPaymentInfo(item, journey, this.travelSolutionJourneyTypeEnum.return, paymentMethod, isVoucherUsed, isNewFlow, search_source);
      items.push(item);
    }

    if (seasonJourneyDetail) {
      const item: DataLayerAddPaymentInfoType = new DataLayerAddPaymentInfoType();
      let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, seasonJourneyDetail, returnJourneyDetail, index, false, true);
      Object.assign(item, { ...BasketItem });
      this.addAdditionalPropertiesForAddPaymentInfo(item, journey, this.travelSolutionJourneyTypeEnum.season, paymentMethod, isVoucherUsed, isNewFlow, search_source);
      items.push(item);
    }
    return items;
  }

  // Method to get Upsell taken property data
  getUpsellTaken(journeyExtras: JourneyExtrasDetail[]): string {
    return (journeyExtras && journeyExtras.length > 0) ? this.ga4DatalayerConstantEnum.Yes : this.ga4DatalayerConstantEnum.No;
  }

  // Method to add additional properties for Add Payment Info
  addAdditionalPropertiesForAddPaymentInfo(item, journey, journeyType, paymentMethod: string, isVoucherUsed: boolean, isNewFlow, search_source = undefined) {
    switch (journeyType) {
      case this.travelSolutionJourneyTypeEnum.outward:
        if(isNewFlow){
          item.upsell_taken = this.commonServices?.getUpsellTakenObject(journey.OutwardJourneyExtras);
          item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.commonServices?.getUpsellItemObject(journey.OutwardJourneyExtras) : undefined;
          item.search_source = search_source;
        } else {
          item.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
          item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
          item.travel_extras = this.getSeatTypeForTravelExtras(journey.OutwardSeat);
        }
        break;
      case this.travelSolutionJourneyTypeEnum.return:
        if(isNewFlow){
          item.upsell_taken = this.commonServices?.getUpsellTakenObject(journey.ReturnJourneyExtras);
          item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.commonServices?.getUpsellItemObject(journey.ReturnJourneyExtras) : undefined;
          item.search_source = search_source;
        } else {
          item.upsell_taken = this.getUpsellTaken(journey.ReturnJourneyExtras);
          item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.ReturnJourneyExtras) : undefined;
          item.travel_extras = this.getSeatTypeForTravelExtras(journey.ReturnSeat);
        }
        break;
      case this.travelSolutionJourneyTypeEnum.season:
        item.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
        item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
        item.travel_extras = undefined;
        break;
    }
    const voucherAdded: string = isVoucherUsed ? ', Evoucher' : '';
    if(!isNewFlow){
      item.payment_type = paymentMethod ? (paymentMethod.toLowerCase().replace('_', ' ') + voucherAdded) : undefined; // Payment Type 
    }
    item.discount = journey.DiscountedPrice;
    const journeyDeliveryDetail = (journey.DeliveryDetail && journey.DeliveryDetail.length > 0) ? journey.DeliveryDetail[0] : undefined;
    item.delivery_option = (journeyDeliveryDetail && journeyDeliveryDetail.DeliveryModeName) ? journeyDeliveryDetail.DeliveryModeName : undefined;
    item.item_list_name = this.ga4ItemListEnum.transactionName;
    item.item_list_id = this.ga4ItemListEnum.transactionId;
  }

  // Method to set travel extras
  setTravelExtrasToBasketItem(journey: JourneyDetail, type): string | undefined {
    const seat = (type === this.travelSolutionJourneyTypeEnum.outward) ? journey.OutwardSeat : journey.ReturnSeat;
    const journeySeat = (seat && seat.length > 0) ? seat[0] : undefined;
    const journeySeatAvaliable = (journeySeat && journeySeat.Seat && journeySeat.Seat.length > 0) ? journeySeat.Seat[0] : undefined;

    return journeySeatAvaliable ? journeySeatAvaliable.SeatPosition : undefined;
  }

  // Method to get item name
  getItemName(journey: JourneyDetail, isReturnJourney: boolean) {
    const journeyArrival = journey.Arrival ? journey.Arrival.split('(').pop().split(')')[0] : '';
    const journeyDeparture = journey.Departure ? journey.Departure.split('(').pop().split(')')[0] : '';
    const depCode = isReturnJourney ? journeyArrival : journeyDeparture;
    const arrivalCode = isReturnJourney ? journeyDeparture : journeyArrival;

    return (depCode && arrivalCode) ? (depCode + `-` + arrivalCode) : undefined;
  }

  // Method to get start date
  getStartAndEndDate(reservationDetail, isSeason: boolean) {
    let startDate = undefined;
    let endDate = undefined;
    if (isSeason) {
      startDate = reservationDetail.ValidFrom;
      endDate = reservationDetail.ValidTill;
    } else {
      startDate = reservationDetail.DepartureTime ? (new Date(`${reservationDetail.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
      endDate = reservationDetail.ArrivalTime ? (new Date(`${reservationDetail.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
    }

    return [startDate, endDate];
  }

  // Method to add data to properties of Basket Item Object
  getItemObjectProperties(journey: JourneyDetail, reservationDetail, item, isSeason, isNewFlow?) {
    if(!isNewFlow) {
      item.value = journey.JourneyTotalPrice || undefined;
    }
    item.item_brand = reservationDetail.Brand || undefined;
    item.item_category = reservationDetail.TicketClass || undefined;
    if(isNewFlow){
      item.item_category2 = journey?.OutwardDetail && journey?.ReturnDetail ? this.enhancedJourenyType?.return : journey?.OutwardDetail && journey?.OutwardDetail?.OpenReturnExpiryDate ? this.enhancedJourenyType?.openReturn : this.enhancedJourenyType?.outward;
    } else {
      item.item_category2 = reservationDetail.TicketType || undefined;
    }
    item.item_category4 = this.getRailCardString(this.sharedService?.searchRequest);
    item.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    item.ticket_class = reservationDetail.TicketClass || undefined;
    item.ticket_type_code = reservationDetail.TicketTypeCode || undefined;
    item.number_of_changes = reservationDetail.Changes;
    item.operator = isSeason ? undefined : this.getTravelSolutionOperatorForCompany(reservationDetail);
    if (!isSeason) {
      item.start_date = reservationDetail.DepartureTime ? (new Date(`${reservationDetail.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
      item.end_date = reservationDetail.ArrivalTime ? (new Date(`${reservationDetail.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
    } else {
      item.start_date = this.datePipe.transform(reservationDetail.ValidFrom, 'dd/MM/yy');
      item.end_date = this.datePipe.transform(reservationDetail.ValidTill, 'dd/MM/yy');
    }
  }

  // Method to add data to properties of Basket Item Object with season
  getItemObjectPropertiesWithSeason(journey, reservationDetail, item, returnJourneyDetail, isReturnJourney, isSeason) {
    const journeyType = isReturnJourney ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    item.price = (!isSeason) ? Number(reservationDetail.CojPrice) : (Number(reservationDetail.Price) || undefined);
    item.type = isSeason ? this.travelSolutionJourneyTypeEnum.season : journeyType;
    item.adult_pax = isSeason ? journey.Adult : reservationDetail.NoOfAdult || undefined;
    item.child_pax = isSeason ? journey.Child : reservationDetail.NoOfChild || undefined;
    this.getItemObjectPropertiesWithSeasonAdditionals(journey, reservationDetail, item, returnJourneyDetail, isReturnJourney, isSeason);
  }

  getItemObjectPropertiesWithSeasonAdditionals(journey, reservationDetail, item, returnJourneyDetail, isReturnJourney, isSeason) {
    const journeySingleOrReturn = (reservationDetail && returnJourneyDetail) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    item.item_id = isSeason ? this.getIdForTransactionEvent(journey, this.travelSolutionJourneyTypeEnum.season) : this.getJourneyIdForReviewBuyData(item.item_name, reservationDetail, journey, returnJourneyDetail);
    item.single_or_return = isSeason ? this.travelSolutionJourneyTypeEnum.season : journeySingleOrReturn;

    item.total_pax = (item.adult_pax || 0) + (item.child_pax || 0);
    item.duration = isSeason ? undefined : this.getDurationTime(reservationDetail);
    item.origin = (isReturnJourney ? journey.Arrival : journey.Departure) || undefined;
    item.destination = (isReturnJourney ? journey.Departure : journey.Arrival) || undefined;
  }

  getTicktRouteCode(journey, isSeason) {
    if (!isSeason && journey && journey.Fares && journey.Fares.length > 0) {
      return journey.Fares[0].ServiceId.toString().slice(-5);
    }
    return undefined;
  }

  // Method to get fetch the common data for basket item
  getItemObjectsOfTypeBasketItem(journey, reservationDetail, returnJourneyDetail, index: number, isReturnJourney = false, isSeason = false, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, seatDetail?, columnIndex?, travelSolution?): DataLayerBasketItemType {
    if (journey) {
      const item: DataLayerBasketItemType = new DataLayerBasketItemType();
      if(isNewFlow){
      let coachList = seatDetail?.flatMap(os => os.Seat)?.map(s => s.CoachNumber)?.filter(c => c && c !== '*' && c !== '**')?.map(c => `Coach ${c}`);
      let uniqueCoachList = coachList ? Array.from(new Set(coachList)) : [];
      let coachstring = uniqueCoachList?.length > 0 ? uniqueCoachList?.join(", ") : undefined;
      let seatList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.Seat && s.Seat.trim() !== '' && s.Seat !== '*' && s.Seat !== '**' && s.Seat !== '***')?.map(s => `${s.CoachNumber}${s.Seat}`); 
      let seatNumber = seatList?.length > 0 ?seatList.join(", ") : undefined;
      let seatPositionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatPosition && s.SeatPosition.trim() !== '')?.map(s => `${s.SeatPosition}`); 
      let seatDirectionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatFacing && s.SeatFacing.trim() !== '')?.map(s => `${s.SeatFacing}`);
      let visibleDeliveryModes = this.commonServices.setDeliveryModeLabel(journey?.DeliveryDetail[0]?.DeliveryModeType);
      let shipping: number = 0.00;
      shipping = shipping + journey?.DeliveryDetail?.reduce((sum, current) => sum + current.Price, 0)
      item.available_classes = reservationDetail?.TicketClass ? reservationDetail?.TicketClass : undefined;
      item.coach = coachstring;
      item.seat_number = seatNumber;
      item.seat_position = seatPositionList?.length > 0 ? seatPositionList.join(", ") : undefined;
      item.seat_direction = seatDirectionList?.length > 0 ? seatDirectionList.join(", ") : undefined;
      item.seat_preferences = undefined;
      item.status = !seatDetail[0]?.IsSeatPicker && this.commonServices.isSeatPickerNotAvaliable(seatDetail[0]) ? this.enhancedGA4DatalayerEventName?.unAvailableStatus : this.enhancedGA4DatalayerEventName?.availableStatus;
      item.delivery_option = visibleDeliveryModes ? visibleDeliveryModes : undefined;
      item.shipping = shipping ? shipping : undefined;
      item.column_index = columnIndex;
    }
      item.item_name = this.getItemName(journey, isReturnJourney);
      if(!isNewFlow){
        item.quantity = 1;
      }
      item.item_category3 = reservationDetail.TicketType; // ! TBC
      item.item_variant = this.getVariantForReviewBuyData(reservationDetail, item.item_name);
      item.index = (index + 1);
      item.ticket_type = this.getTicketTypeName(reservationDetail.TicketType);
      item.additional_information = isNewFlow ? this.getAdditionalInformation(journey, this.sharedService?.searchRequest) : undefined;
      item.days_in_advance = Math.abs(this.calculateDiff(reservationDetail.DepartureTime)) || undefined;
      item.railcard_used = this.getRailcardPresenceForReviewBuyData(reservationDetail, isSeason);
      item.railcard_code = item.railcard_used ? this.getRailcardsForReviewBuyData(reservationDetail, isSeason) : undefined;
      item.start_time = reservationDetail.DepartureTime ? this.datePipe.transform(reservationDetail.DepartureTime, 'HH:mm') : undefined;
      item.end_time = reservationDetail.ArrivalTime ? this.datePipe.transform(reservationDetail.ArrivalTime, 'HH:mm') : undefined;
      item.ticket_route_code = this.getTicktRouteCode(reservationDetail, isSeason);
      this.getItemObjectProperties(journey, reservationDetail, item, isSeason, isNewFlow);
      this.getItemObjectPropertiesWithSeason(journey, reservationDetail, item, returnJourneyDetail, isReturnJourney, isSeason);
      this.getItemObjForQuickBuyValue(journey, selectedJourneyDataForQuickBuyOrContiue, item);
      return item;
    }
  }

  // Method to generate the journey Id
  getJourneyIdForReviewBuyData(stnCode: string, reservationDetailOne: ReservationDetail, journey: JourneyDetail, returnJourneyDetail: ReservationDetail) {
    let id = '';
    if (stnCode && journey && reservationDetailOne) {
      id += stnCode;
      const depDate = reservationDetailOne.DepartureTime.split("T");
      const depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;
      id += depDateTimeStamp;
      id += `-${journey.Adult}-${journey.Child}`;
      const isReturnOrSingle = returnJourneyDetail ? '-return' : '-single';
      const journeyType = (journey.JourneyType.indexOf("Open Return journey") > -1) ? '-open_return' : isReturnOrSingle;
      id += journeyType;
      return id;
    }
    return undefined;
  }

  // Method to get variant
  getVariantForReviewBuyData(journeyDetail: ReservationDetail, name: string) {
    if (journeyDetail) {
      const changes = journeyDetail.Changes ? Number(journeyDetail.Changes) : 0;
      const journeyCallingPointName = journeyDetail.CallingPointName ? journeyDetail.CallingPointName : undefined;
      return (changes === 0) ? ('1:' + name) : journeyCallingPointName;
    }
    return undefined;
  }
  // Method to get If Railcard is present
  getRailcardPresenceForReviewBuyData(reservationDetail, isSeason = false) {
    if (isSeason) return reservationDetail.RailCard ? true : false;
    let isRailcardPresent = false;
    if (reservationDetail && reservationDetail.Fares && reservationDetail.Fares.length > 0) {
      reservationDetail.Fares.forEach(fare => {
        if (fare && fare.Railcard && (fare.Railcard !== "No Railcard")) {
          isRailcardPresent = true;
        }
      });
    }
    return isRailcardPresent;
  }

  getRailCardListFromStorage() {
    this.railCardListFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
  }

  // Method to extract railcard count
  getRailcardCountObj(journeyDetail: ReservationDetail) {
    const railcardsList = this.railCardListFromStorage.Railcard;
    const CountObj = {};
    journeyDetail.Fares.forEach(fare => {
      if (fare && fare.Railcard && (fare.Railcard !== "No Railcard")) {
        const cardDetail = railcardsList.filter(card => card.Name === fare.Railcard);
        const cardDetailCode = cardDetail[0].Code ? cardDetail[0].Code : fare.Railcard;
        const objectKey = (cardDetail && cardDetail.length > 0) ? cardDetailCode : fare.Railcard;
        CountObj[objectKey] = (CountObj[objectKey] ? (CountObj[objectKey] + 1) : 1);
      }
    });
    return CountObj;
  }
  // Method to extract railcard
  getRailcardsForReviewBuyData(reservationDetail, isSeason = false) {
    if (isSeason) return reservationDetail.RailCard || undefined;
    if (!this.railCardListFromStorage) this.getRailCardListFromStorage();
    let railcardsString = '';
    if (reservationDetail && this.railCardListFromStorage && this.railCardListFromStorage.Railcard && reservationDetail.Fares && reservationDetail.Fares.length > 0) {
      const CountObj = this.getRailcardCountObj(reservationDetail);
      Object.keys(CountObj).forEach(key => {
        railcardsString += ((railcardsString && railcardsString.length > 0) ? `|${key}:${CountObj[key]}` : `${key}:${CountObj[key]}`);
      });
    }
    return railcardsString;
  }

  // Method to get ticket type from enum
  getTicketTypeName(ticketType: string): string {
    if (ticketType) {
      switch (ticketType) {
        case this.appRouteEnum.DeliveryModeETicket: return this.deliveryModeEnum.ETicket;
        case this.appRouteEnum.DeliveryMode_TOD: return this.deliveryModeEnum.TOD;
        case this.appRouteEnum.DeliveryMode_FRTNEXTDAY: return this.deliveryModeEnum.NextDayDelivery;
        case this.appRouteEnum.DeliveryMode_NEXTDAYDELIVERY: return this.deliveryModeEnum.NextDayDelivery;
        case this.appRouteEnum.DeliveryMode_FRTFIRSTCLASS: return this.deliveryModeEnum.FirstClassPost;
        default: return ticketType;
      }
    }
    return undefined;
  }

  // PICO-2010 - Page_meta_data and virtual_page_view -- Ga4-datalayer event
  loadGA4DataLayerAllPages(IsPageMetaData, isNewFlow: boolean = false) {
    try {
      this.commonServices.getSessionId();
      let fullURL = window.location.href;
      let fullPath = fullURL.split(environment.qttDomain)[1];
      let arr = [];
      if (fullPath) {
        arr = fullPath.split('/');
      }
      let email = localStorage.getItem('Email');
      let customerKey = localStorage.getItem('CustomerKey');
      if (customerKey == null) {
        customerKey = undefined;
      }
      let loggedIn = (customerKey && email) ? 'Yes' : 'No';
      let pageType = this.getPageType(fullURL);
      let firstViewed = this.getFirstViewed(fullURL);
      let originalEmail = localStorage.getItem('OriginalEmail');
      let [city, country] = this.getCityAndCountry();
      let pageEvent = this.getPageEvent(IsPageMetaData)
      let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
      let [club_avanti_id, membership_type, current_points, points_needed] = this.getClubAvantiDetails(customerLoginResponse?.clubAvantiDetails);

      window.dataLayer = window.dataLayer || [];

      window.dataLayer.push({
        event: pageEvent,
        page: {
          type: pageType,
          country: this.appConstantsService.Country,
          environment: environment.gtmEnvironment,
          language: this.appConstantsService.Language,
          full_url: fullURL,
          full_path: '/' + fullPath,
          path_1: this.getPath(arr[0]),
          path_2: this.getPath(arr[1]),
          path_3: this.getPath(arr[2]),
          path_4: this.getPath(arr[3]),
          title: this.title.getTitle(),
          created_date: undefined,
          last_updated: undefined,
          author: undefined,
          version: this.appConstantsService.version,
          experiment_id: undefined,
          experiment_name: undefined,
          variant_id: undefined,
          variant_name: undefined,
          ga_tracking_id: environment.gaTrackingID,
          gtm_tracking_id: environment.gtmCode,
          first_viewed: firstViewed,
          website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow
        },
        user: {
          id: undefined,
          pico_id: customerKey,
          has_transacted: undefined,
          logged_in: loggedIn,
          segments: undefined,
          country: country ? country : undefined,
          city: city ? city : undefined,
          is_onboard_session: undefined,
          session_id: this.commonServices.SessionId,
          type: loggedIn ? 'Customer' : 'Guest',
          email_address_hashed: loggedIn ? convertToSha256(originalEmail) : undefined, // Convert to SHA256 Alogorithm
          email_address: (loggedIn && originalEmail) ? originalEmail : undefined,
          customer_type: undefined,
          club_avanti_id: this.setUndefinedForBlankValueInVariable(club_avanti_id),
          membership_type: this.setUndefinedForBlankValueInVariable(membership_type),
          current_points: this.setUndefinedForBlankValueInVariable(current_points),
          points_needed: this.setUndefinedForBlankValueInVariable(points_needed),
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  getPageEvent(IsPageMetaData){
    if(IsPageMetaData){
      return this.ga4DatalayeEventNameEnum.pageMetaData;
    }
    return this.ga4DatalayeEventNameEnum.virtualPageView;
  }

  getPath(arr) {
    if (arr) {
      return arr;
    }
    return undefined;
  }

  getPageType(fullURL){
    let pageType = '';
    if (fullURL.includes(this.appRouteEnum.MixingDeck) || fullURL.includes(this.appRouteEnum.SeasonSolutions) || fullURL.includes(this.appRouteEnum.ReviewBuy)) {
      pageType = this.pageTypeEnum.search;
    }
    else if (fullURL.includes(this.appRouteEnum.JourneyExtras) || fullURL.includes(this.appRouteEnum.DeliveryMode) || fullURL.includes(this.appRouteEnum.Payment)) {
      pageType = this.pageTypeEnum.checkout;
    }
    else if (fullURL.includes(this.appRouteEnum.Confirmation)) {
      pageType = this.pageTypeEnum.confirmation;
    }
    else if (fullURL.includes(this.appRouteEnum.ValidatePaymentDo)) {
      pageType = this.pageTypeEnum.validatePayment;
    }
    else {
      pageType = this.pageTypeEnum.account;
    }
    return pageType;
  }

  getCityAndCountry() {
    let city = "";
    let country = "";
    let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
    if (customerLoginResponse && customerLoginResponse.CustomerDetail && customerLoginResponse.CustomerDetail.Addresses) {
      let defaultAddress = customerLoginResponse.CustomerDetail.Addresses.filter(x => x.IsDefault);
      if (defaultAddress && defaultAddress.length > 0) {
        city = defaultAddress[0].Address.City;
        country = defaultAddress[0].Address.Country;
      }
    }
    return [city, country];
  }

  getFirstViewed(fullURL) {
    if (fullURL.includes(this.appRouteEnum.MixingDeck) || fullURL.includes(this.appRouteEnum.SeasonSolutions) || fullURL.includes(this.appRouteEnum.Login)) {
      return this.ga4DatalayerConstantEnum.Yes;
    } else {
      return this.ga4DatalayerConstantEnum.No;
    }
  }

  removeDuplicateJourneyExtras(journeyExtras): Array<any> {
    const offerIds = journeyExtras.map(o => o.OfferId)
    return journeyExtras.filter(({ OfferId }, index) => !offerIds.includes(OfferId, index + 1))
  }

  // Method to get upsell item
  getUpsellItemFromArray(journeyExtras, isReturnCase) {
    let upsellItem = '';
    let updatedJourneyExtras = isReturnCase ? journeyExtras.filter(obj => obj.IsReturn) : journeyExtras.filter(obj => !obj.IsReturn);
    updatedJourneyExtras = this.removeDuplicateJourneyExtras(updatedJourneyExtras);
    for (let journeyExtra of updatedJourneyExtras) {
      switch (journeyExtra.Description) {
        case this.appConstantsService.plusBus: upsellItem += (upsellItem) ? ` | Plusbus` : 'Plusbus';
          break;
        case this.appConstantsService.bicycleReservation: upsellItem += (upsellItem) ? ` | Bike Reservation` : 'Bike Reservation';
          break;
        case this.appConstantsService.londonTravelcard: upsellItem += (upsellItem) ? ` | London Travelcard` : 'London Travelcard';
          break;
      }
    }
    return upsellItem ? upsellItem : undefined;
  }
  // Method to get Upsell taken property data
  getUpsellTakenFromArray(journeyExtras, isReturnCase): string {
    let updatedJourneyExtras = isReturnCase ? journeyExtras.filter(obj => obj.IsReturn) : journeyExtras.filter(obj => !obj.IsReturn)
    return (updatedJourneyExtras && updatedJourneyExtras.length > 0) ? this.ga4DatalayerConstantEnum.Yes : this.ga4DatalayerConstantEnum.No;
  }
  //created method for get addToCart obj detail
  getAddToCartObjDetail(searchRequest: SearchRequestModel, journeySummaryModel: JourneySummaryModel, allJEService, isQuickBuyOrContinueJourney?, isNewFlow = false, outwardSeat?, returnSeat?, deliveryMode?, journeyDetail?) {
    const addCartItemObj: Array<DataLayerAddToCartItemType> = [];
    if (!searchRequest.IsSeason) {
      let outwardSelectedJourney: TravelSolutionModel = journeySummaryModel.SingleRouteModel;
      let returnSelectedJourney: TravelSolutionModel = journeySummaryModel.ReturnRouteModel;
      if (outwardSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.SingleRouteModel);
        let addItem = this.setGAObjectsForAddToCartServiceModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, false, company, allJEService, isQuickBuyOrContinueJourney, isNewFlow, outwardSeat, deliveryMode, 1, journeyDetail);
        if (addItem) { addCartItemObj.push(addItem); }
      }
      if (returnSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.ReturnRouteModel);
        let addItem = this.setGAObjectsForAddToCartServiceModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, true, company, allJEService, isQuickBuyOrContinueJourney, isNewFlow, returnSeat, deliveryMode, 2, journeyDetail);
        if (addItem) { addCartItemObj.push(addItem); }
      }
    } else {
      let NonSeasonSelectItem = this.setGAObjectsForSeasonAddToCartModel(searchRequest, allJEService);
      if (NonSeasonSelectItem) { addCartItemObj.push(NonSeasonSelectItem); }
    }
    return addCartItemObj;
  }
  // load addToCart event for delivery
  loadGALayerForAddToCartInfo(searchRequest: SearchRequestModel, journeySummaryModel, allJEService, isUpgrade?, isPayment?, totalUpgradePrice?, isQuickBuyOrContinueJourney?, isNewFlow = false, outwardSeat?, returnSeat?, deliveryMode?, journeyDetail?) {
    try {
      this.isUpgradeEvent = isUpgrade;
      const addItemObj: Array<DataLayerAddToCartItemType> = [];
      this.isBeginCheckoutEvent = isPayment;
      let returnPrice = journeySummaryModel?.ReturnSelectedFare ? Number(journeySummaryModel?.ReturnSelectedFare?.Price) : 0;
      let singlePrice = Number(journeySummaryModel?.SingleSelectedFare?.Price);
      let value = returnPrice + singlePrice;
      if (searchRequest) {
        let addToCartObjDetail;
        if(this.isUpgradeEvent){
          addToCartObjDetail = this.getAddToCartObjDetailToUpgrade(searchRequest, journeySummaryModel, allJEService, totalUpgradePrice);
        }else {
          addToCartObjDetail = this.getAddToCartObjDetail(searchRequest, journeySummaryModel, allJEService, isQuickBuyOrContinueJourney, isNewFlow, outwardSeat, returnSeat, deliveryMode, journeyDetail);
        }
        if (addToCartObjDetail) {
          addItemObj.push(...addToCartObjDetail);
        }
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: isPayment ? this.ga4DatalayeEventNameEnum.beginCheckout : this.ga4DatalayeEventNameEnum.addToCart,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory,
        }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          ...(isNewFlow && {
            value: value
          }),
          items: addItemObj,
        }
      });
      this.isUpgradeEvent = false;
      this.isBeginCheckoutEvent = false;
    } catch (error) { console.log(error); }
  }

  setGAObjectsForAddToCartServiceModel(searchRequest: SearchRequestModel, outwardSelectedJourney: TravelSolutionModel, returnSelectedJourney: TravelSolutionModel, journeySummaryModel: JourneySummaryModel, isReturnCase: boolean, company, allJEService, isQuickBuyOrContinueJourney?, isNewFlow = false, seatDetail?, deliveryMode?, columnIndex?, journeyDetail?) {
    const addToCartItemObj: DataLayerAddToCartItemType = new DataLayerAddToCartItemType();
    let selectedJourney = isReturnCase ? returnSelectedJourney : outwardSelectedJourney;
    let [ticketRouteCode, ticketTypeCode] = this.getTicketRouteAndTypeCodeForSelectEvent(journeySummaryModel,isReturnCase);
    let activeTab = isReturnCase ? 1 : 0;
    let diffOfDates = Math.abs(this.calculateDiff(selectedJourney.DepartureDate));
    let shipping : number = 0.00;
    shipping = shipping + journeyDetail?.DeliveryDetail?.reduce((sum, current) => sum + current.Price, 0);
    addToCartItemObj.item_name = selectedJourney.DepartureTime.split('(').pop().split(')')[0] + `-` + selectedJourney.ArrivalTime.split('(').pop().split(')')[0];
    addToCartItemObj.item_id = this.getIdForEvents(selectedJourney, searchRequest, activeTab);
    addToCartItemObj.price = isReturnCase ? journeySummaryModel.ReturnSelectedFare.Price : journeySummaryModel.SingleSelectedFare.Price;
    if(!isNewFlow){
      addToCartItemObj.quantity = 1;
      addToCartItemObj.value = (addToCartItemObj.price * addToCartItemObj.quantity);
    }
    addToCartItemObj.item_brand = selectedJourney.Brand ? selectedJourney.Brand : undefined;
    addToCartItemObj.item_category = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    addToCartItemObj.item_category2 = isReturnCase ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    addToCartItemObj.item_category3 = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    addToCartItemObj.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    addToCartItemObj.item_variant = this.getVariant(selectedJourney);
    addToCartItemObj.item_list_name = this.ga4ItemListEnum.cartName;
    addToCartItemObj.item_list_id = this.ga4ItemListEnum.cartId;
    addToCartItemObj.index = 1;
    addToCartItemObj.origin = searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
    addToCartItemObj.destination = searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
    addToCartItemObj.start_date = (new Date(`${selectedJourney.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
    addToCartItemObj.end_date = (new Date(`${selectedJourney.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
    addToCartItemObj.duration = this.getDurationTime(selectedJourney);
    addToCartItemObj.ticket_class = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    addToCartItemObj.ticket_type = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    addToCartItemObj.ticket_route_code = ticketRouteCode ? ticketRouteCode : undefined;
    addToCartItemObj.ticket_type_code = ticketTypeCode ? ticketTypeCode : undefined;
    addToCartItemObj.type = isReturnCase ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    addToCartItemObj.single_or_return = (outwardSelectedJourney && returnSelectedJourney) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    addToCartItemObj.number_of_changes = selectedJourney.Changes;
    addToCartItemObj.additional_information = isNewFlow ? this.getAdditionalInformation(selectedJourney, searchRequest) : undefined;
    addToCartItemObj.days_in_advance = diffOfDates;
    addToCartItemObj.railcard_code = this.getRailCardCode(searchRequest);
    addToCartItemObj.railcard_used = this.isRailCardPresent;
    addToCartItemObj.adult_pax = searchRequest.Adult;
    addToCartItemObj.child_pax = searchRequest.Child;
    addToCartItemObj.total_pax = (searchRequest.Adult + searchRequest.Child);
    addToCartItemObj.start_time = selectedJourney.DepartureTime.split('(')[0].trim();
    addToCartItemObj.end_time = selectedJourney.ArrivalTime.split('(')[0].trim();
    addToCartItemObj.operator = company;
    if(isNewFlow){
      let updatedJourneyExtras = isReturnCase ? allJEService.filter(obj => obj.IsReturn) : allJEService.filter(obj => !obj.IsReturn);
      addToCartItemObj.upsell_taken = this.commonServices?.getUpsellTakenObject(updatedJourneyExtras);
      addToCartItemObj.upsell_item = (addToCartItemObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.commonServices?.getUpsellItemObject(updatedJourneyExtras) : undefined;
    } else {
      addToCartItemObj.upsell_taken = this.getUpsellTakenFromArray(allJEService, isReturnCase);
      addToCartItemObj.upsell_item = (addToCartItemObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemFromArray(allJEService, isReturnCase) : undefined;
    }
    if(this.isUpgradeEvent){
      addToCartItemObj.feature = this.ga4DatalayeEventNameEnum.upgradeFeatureText
      addToCartItemObj.booking_reference = localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber)
    } else if(!isNewFlow) {
      addToCartItemObj.quick_buy = isQuickBuyOrContinueJourney ? 'Yes' : 'No';
    }
    if(isNewFlow){
      let coachList = seatDetail?.flatMap(os => os.Seat)?.map(s => s.CoachNumber)?.filter(c => c && c !== '*' && c !== '**')?.map(c => `Coach ${c}`);
      let uniqueCoachList = coachList ? Array.from(new Set(coachList)) : [];
      let coachstring = uniqueCoachList?.length > 0 ? uniqueCoachList?.join(", ") : undefined;
      let seatList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.Seat && s.Seat.trim() !== '' && s.Seat !== '*' && s.Seat !== '**' && s.Seat !== '***')?.map(s => `${s.CoachNumber}${s.Seat}`); 
      let seatNumber = seatList?.length > 0 ?seatList.join(", ") : undefined;
      let seatPositionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatPosition && s.SeatPosition.trim() !== '')?.map(s => `${s.SeatPosition}`); 
      let seatDirectionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatFacing && s.SeatFacing.trim() !== '')?.map(s => `${s.SeatFacing}`); 
      let visibleDeliveryModes = deliveryMode?.filter(dm => dm.IsHide === false)?.map(dm => this.commonServices.setDeliveryModeLabel(dm.DeliveryMode));
      addToCartItemObj.item_category4 = this.getRailCardString(searchRequest);
      addToCartItemObj.available_classes = this.getFareMessage(selectedJourney?.NewFareList, selectedJourney?.NewReturnFareList, selectedJourney, searchRequest);
      addToCartItemObj.coach = coachstring;
      addToCartItemObj.name = seatNumber;
      addToCartItemObj.seat_position = seatPositionList?.length > 0 ? seatPositionList.join(", ") : undefined;
      addToCartItemObj.seat_direction = seatDirectionList?.length > 0 ? seatDirectionList.join(", ") : undefined;
      addToCartItemObj.seat_preferences = undefined;
      addToCartItemObj.status = !seatDetail[0]?.IsSeatPicker && this.commonServices.isSeatPickerNotAvaliable(seatDetail[0]) ? this.enhancedGA4DatalayerEventName?.unAvailableStatus : this.enhancedGA4DatalayerEventName?.availableStatus ;
      addToCartItemObj.delivery_option = visibleDeliveryModes?.length > 0 ? visibleDeliveryModes.join(", ") : undefined;
      addToCartItemObj.shipping = shipping;
      addToCartItemObj.column_index = columnIndex;
    }
    return addToCartItemObj;
  }

  // For Season AddToCart Event *** 
  setGAObjectsForSeasonAddToCartModel(searchRequest, allJEService) {
    if (searchRequest) {
      const seasonAddCartSelectItemObj: DataLayerAddToCartItemType = new DataLayerAddToCartItemType();
      let diffOfDates = Math.abs(this.calculateDiff(searchRequest.DepartureTimesStart));
      seasonAddCartSelectItemObj.item_name = searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      seasonAddCartSelectItemObj.item_id = undefined;
      seasonAddCartSelectItemObj.price = (parseFloat((this.sharedService.calculateTotalAmount())));
      seasonAddCartSelectItemObj.quantity = 1;
      seasonAddCartSelectItemObj.value = (seasonAddCartSelectItemObj.price * seasonAddCartSelectItemObj.quantity);
      seasonAddCartSelectItemObj.item_brand = undefined;
      seasonAddCartSelectItemObj.item_category = undefined;
      seasonAddCartSelectItemObj.item_category2 = this.travelSolutionJourneyTypeEnum.season;
      seasonAddCartSelectItemObj.item_category3 = undefined;
      seasonAddCartSelectItemObj.item_category5 = this.ga4DatalayerConstantEnum.Fare;
      seasonAddCartSelectItemObj.item_variant = ('1:' + searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]);
      seasonAddCartSelectItemObj.item_list_name = this.ga4ItemListEnum.cartName;
      seasonAddCartSelectItemObj.item_list_id = this.ga4ItemListEnum.cartId;
      seasonAddCartSelectItemObj.index = 1;
      seasonAddCartSelectItemObj.origin = searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
      seasonAddCartSelectItemObj.destination = searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      seasonAddCartSelectItemObj.start_date = this.datePipe.transform(searchRequest.DepartureTimesStart, 'dd/MM/yy');
      seasonAddCartSelectItemObj.end_date = undefined
      seasonAddCartSelectItemObj.duration = undefined;
      seasonAddCartSelectItemObj.ticket_class = undefined;
      seasonAddCartSelectItemObj.ticket_type = undefined;
      seasonAddCartSelectItemObj.ticket_route_code = undefined;
      seasonAddCartSelectItemObj.ticket_type_code = undefined;
      seasonAddCartSelectItemObj.type = this.getJourneyType(searchRequest);
      seasonAddCartSelectItemObj.single_or_return = this.travelSolutionJourneyTypeEnum.season.toLowerCase();
      seasonAddCartSelectItemObj.number_of_changes = undefined;
      seasonAddCartSelectItemObj.additional_information = undefined;
      seasonAddCartSelectItemObj.days_in_advance = diffOfDates ? diffOfDates : undefined;
      seasonAddCartSelectItemObj.railcard_code = this.getRailCardCode(searchRequest);
      seasonAddCartSelectItemObj.railcard_used = this.isRailCardPresent;
      seasonAddCartSelectItemObj.adult_pax = searchRequest.Adult ? searchRequest.Adult : undefined;
      seasonAddCartSelectItemObj.child_pax = searchRequest.Child ? searchRequest.Child : undefined;
      seasonAddCartSelectItemObj.total_pax = (searchRequest.Adult + searchRequest.Child);
      seasonAddCartSelectItemObj.start_time = undefined;
      seasonAddCartSelectItemObj.end_time = undefined;
      seasonAddCartSelectItemObj.operator = undefined;
      seasonAddCartSelectItemObj.upsell_taken = this.getUpsellTakenFromArray(allJEService, null);
      seasonAddCartSelectItemObj.upsell_item = (seasonAddCartSelectItemObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemFromArray(allJEService, null) : undefined;
      return seasonAddCartSelectItemObj;
    }
  }

  // Remove From Cart
  public loadGALayerForReviewBuyRemoveCart(reviewBuyResponse: ReviewBuyResponse | EnhancedReviewBuyAndDeliveryResponse, isTravelExtra: boolean, searchRequest?, selectedJourneyExtra?, journeySummaryModel?, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, travelSolution?) {
    try {
      let basketItems = [];
      if (isTravelExtra) {
        if (!searchRequest.IsSeason) {
          let outwardSelectedJourney: TravelSolutionModel = journeySummaryModel.SingleRouteModel;
          let returnSelectedJourney: TravelSolutionModel = journeySummaryModel.ReturnRouteModel;
          basketItems.push(this.addCartItemForRemoveFromCartOnJourneyExtra(searchRequest, selectedJourneyExtra, journeySummaryModel, outwardSelectedJourney, returnSelectedJourney))
        } else {
          basketItems.push(this.addCartItemForRemoveFromCartOnJourneyExtraForSeason(searchRequest, selectedJourneyExtra))
        }
      } else {
        basketItems.push(...this.addCartItemInDataLayerArray(reviewBuyResponse, this.ga4DatalayeEventNameEnum.removeFromCart, null, null, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, travelSolution))
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.removeFromCart,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory,
        }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          value: reviewBuyResponse?.Journey[0]?.JourneyTotalPrice,
          items: basketItems
        }
      });
    } catch (error) { console.log(error); }
  }

  getBeginCheckoutDetail(searchRequest: SearchRequestModel, journeySummaryModel: JourneySummaryModel, allJEService, seatingPreferences, isQuickBuyOrContinueJourney?) {
    const addCheckoutItemObj: Array<DataLayerCheckoutItemType> = [];
    if (!searchRequest.IsSeason) {
      let outwardSelectedJourney: TravelSolutionModel = journeySummaryModel.SingleRouteModel;
      let returnSelectedJourney: TravelSolutionModel = journeySummaryModel.ReturnRouteModel;
      let journeyTypeParams = {
        outwardSelectedJourney: outwardSelectedJourney,
        returnSelectedJourney: returnSelectedJourney
      }
      if (outwardSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.SingleRouteModel);
        let addCheckout = this.setGAObjectsForCheckoutServiceModel(searchRequest, journeyTypeParams, journeySummaryModel, false, company, allJEService, seatingPreferences, isQuickBuyOrContinueJourney);
        if (addCheckout) { addCheckoutItemObj.push(addCheckout); }
      }
      if (returnSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.ReturnRouteModel);
        let addCheckout = this.setGAObjectsForCheckoutServiceModel(searchRequest, journeyTypeParams, journeySummaryModel, true, company, allJEService, seatingPreferences, isQuickBuyOrContinueJourney);
        if (addCheckout) { addCheckoutItemObj.push(addCheckout); }
      }
    } else {
      let NonSeasonCheckOutItem = this.setGAObjectsForSeasonCheckoutServiceModel(searchRequest, allJEService);
      if (NonSeasonCheckOutItem) { addCheckoutItemObj.push(NonSeasonCheckOutItem); }
    }
    return addCheckoutItemObj;
  }
  // load ga4 for begin_checkout event
  loadGALayerForBeginCheckout(searchRequest: SearchRequestModel, journeySummaryModel: JourneySummaryModel, allJEService, seatingPreferences, isQuickBuyOrContinueJourney?) {
    try {
      const addCheckoutItem: Array<DataLayerCheckoutItemType> = [];
      if (searchRequest) {
        let addCheckoutObjDetail = this.getBeginCheckoutDetail(searchRequest, journeySummaryModel, allJEService, seatingPreferences, isQuickBuyOrContinueJourney);
        if (addCheckoutObjDetail) {
          addCheckoutItem.push(...addCheckoutObjDetail);
        }
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.beginCheckout,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: addCheckoutItem,
        }
      });
    } catch (error) { console.log(error); }
  }

  addCartItemForRemoveFromCartOnJourneyExtra(searchRequest: SearchRequestModel, selectedJourneyExtra: JourneyExtraDetail[], journeySummaryModel: JourneySummaryModel, outwardSelectedJourney: TravelSolutionModel, returnSelectedJourney: TravelSolutionModel): DataLayerRemoveFromCartType {
    const item: DataLayerRemoveFromCartType = new DataLayerRemoveFromCartType();
    let selectedJourney = (selectedJourneyExtra[0].IsReturn) ? returnSelectedJourney : outwardSelectedJourney;
    let [ticketRouteCode, ticketTypeCode] = this.getTicketRouteAndTypeCodeForSelectEvent(journeySummaryModel,selectedJourneyExtra[0].IsReturn);
    let diffOfDates = Math.abs(this.calculateDiff(selectedJourney.DepartureDate));
    item.item_name = selectedJourney.DepartureTime.split('(').pop().split(')')[0] + `-` + selectedJourney.ArrivalTime.split('(').pop().split(')')[0];
    item.item_id = this.getIdForJE_Services(selectedJourneyExtra[0]);
    item.price = selectedJourneyExtra[0].Price;
    item.item_category = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, selectedJourneyExtra[0].IsReturn);
    item.item_variant = this.getVariantForJEService(selectedJourneyExtra[0]);
    item.quantity = selectedJourneyExtra[0].AvailableAmount;
    item.upsell_taken = this.ga4DatalayerConstantEnum.Yes;
    item.upsell_item = selectedJourneyExtra[0].Description;
    item.value = (item.price * item.quantity);
    item.item_brand = selectedJourney.Brand ? selectedJourney.Brand : undefined;
    item.item_category2 = selectedJourneyExtra[0].IsReturn ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    item.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    item.item_list_name = this.ga4ItemListEnum.cartName;
    item.item_list_id = this.ga4ItemListEnum.cartId;
    item.index = 1;
    item.origin = searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
    item.destination = searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
    item.duration = this.getDurationTime(selectedJourney);
    item.ticket_class = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, selectedJourneyExtra[0].IsReturn);
    item.ticket_type = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, selectedJourneyExtra[0].IsReturn);
    item.ticket_route_code = ticketRouteCode ? ticketRouteCode : undefined;
    item.ticket_type_code = ticketTypeCode ? ticketTypeCode : undefined;
    item.single_or_return = selectedJourneyExtra[0].IsReturn ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    item.type = selectedJourneyExtra[0].IsReturn ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    item.number_of_changes = selectedJourney.Changes;
    item.additional_information = undefined;
    item.days_in_advance = diffOfDates ? diffOfDates : undefined;
    item.railcard_code = this.getRailCardCode(searchRequest);
    item.railcard_used = this.isRailCardPresent;
    item.adult_pax = searchRequest.Adult;
    item.child_pax = searchRequest.Child;
    item.total_pax = (searchRequest.Adult + searchRequest.Child);
    item.start_time = selectedJourney.DepartureTime.split('(')[0].trim();
    item.end_time = selectedJourney.ArrivalTime.split('(')[0].trim();
    item.operator = this.getTravelSolutionOperatorForCompany(selectedJourney);
    item.quick_buy = 'No';
    if (selectedJourneyExtra[0].IsReturn) {
      item.start_date = (new Date(`${journeySummaryModel.ReturnRouteModel.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      item.end_date = (new Date(`${journeySummaryModel.ReturnRouteModel.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      item.item_category3 = journeySummaryModel.ReturnSelectedFare.TicketClass;
    } else {
      item.start_date = (new Date(`${journeySummaryModel.SingleRouteModel.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      item.end_date = (new Date(`${journeySummaryModel.SingleRouteModel.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      item.item_category3 = journeySummaryModel.SingleSelectedFare.TicketClass;
    }

    return item;
  }

  addCartItemForRemoveFromCartOnJourneyExtraForSeason(searchRequest, selectedJourneyExtra: JourneyExtraDetail[]) {
    if (searchRequest) {
      const item: DataLayerRemoveFromCartType = new DataLayerRemoveFromCartType();
      let diffOfDates = Math.abs(this.calculateDiff(searchRequest.DepartureTimesStart));
      item.item_name = searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      item.item_id = undefined;
      item.price = selectedJourneyExtra[0].Price;
      item.quantity = 1;
      item.value = (item.price * item.quantity);
      item.item_brand = undefined;
      item.item_category = undefined;
      item.item_category2 = this.travelSolutionJourneyTypeEnum.season;
      item.item_category3 = undefined;
      item.item_category5 = this.ga4DatalayerConstantEnum.Fare;
      item.item_variant = ('1:' + searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]);
      item.item_list_name = this.ga4ItemListEnum.cartName;
      item.item_list_id = this.ga4ItemListEnum.cartId;
      item.index = 1;
      item.origin = searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
      item.destination = searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      item.start_date = this.datePipe.transform(searchRequest.DepartureTimesStart, 'dd/MM/yy');
      item.end_date = undefined
      item.duration = undefined;
      item.ticket_class = undefined;
      item.ticket_type = undefined;
      item.ticket_route_code = undefined;
      item.ticket_type_code = undefined;
      item.type = this.getJourneyType(searchRequest);
      item.single_or_return = this.travelSolutionJourneyTypeEnum.season.toLowerCase();
      item.number_of_changes = undefined;
      item.additional_information = undefined;
      item.days_in_advance = diffOfDates ? diffOfDates : undefined;
      item.railcard_code = this.getRailCardCode(searchRequest);
      item.railcard_used = this.isRailCardPresent;
      item.adult_pax = searchRequest.Adult ? searchRequest.Adult : undefined;
      item.child_pax = searchRequest.Child ? searchRequest.Child : undefined;
      item.total_pax = (searchRequest.Adult + searchRequest.Child);
      item.start_time = undefined;
      item.end_time = undefined;
      item.operator = undefined;
      item.upsell_taken = this.getUpsellTakenFromArray(selectedJourneyExtra, null);
      item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemFromArray(selectedJourneyExtra, null) : undefined;
      return item;
    }
  }


  private addCartItemForRemoveFromCart(journey: JourneyDetail, index: number, selectedJourneyDataForQuickBuyOrContiue?, isNewFlow = false, travelSolution?) {
    let items: DataLayerRemoveFromCartType[] = [];
    const outwardJourneyDetail = journey.OutwardDetail || undefined;
    const returnJourneyDetail = journey.ReturnDetail || undefined;
    const seasonJourneyDetail = journey.SeasonDeatil || undefined;
    if (outwardJourneyDetail) {
      const outwardItem: DataLayerRemoveFromCartType = new DataLayerRemoveFromCartType();
      Object.assign(outwardItem, { ...this.getItemObjectsOfTypeBasketItem(journey, outwardJourneyDetail, returnJourneyDetail, index, false, false, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, journey?.OutwardSeat, 1, travelSolution?.selectedOutwardTravelSolution) });
      if(isNewFlow){
        outwardItem.upsell_taken = this.commonServices?.getUpsellTakenObject(journey.OutwardJourneyExtras);
        outwardItem.upsell_item = (outwardItem.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.commonServices?.getUpsellItemObject(journey.OutwardJourneyExtras) : undefined;
      } else {
        outwardItem.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
        outwardItem.upsell_item = (outwardItem.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
      }
      outwardItem.item_list_name = this.ga4ItemListEnum.cartName;
      outwardItem.item_list_id = this.ga4ItemListEnum.cartId;
      items.push(outwardItem);
    }
    if (returnJourneyDetail) {
      const returnItem: DataLayerRemoveFromCartType = new DataLayerRemoveFromCartType();
      Object.assign(returnItem, { ...this.getItemObjectsOfTypeBasketItem(journey, returnJourneyDetail, returnJourneyDetail, index, true, false, selectedJourneyDataForQuickBuyOrContiue, isNewFlow, journey?.ReturnSeat, 2, travelSolution?.selectedReturnTravelSolution) });
      if(isNewFlow){
        returnItem.upsell_taken = this.commonServices?.getUpsellTakenObject(journey.ReturnJourneyExtras);
        returnItem.upsell_item = (returnItem.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.commonServices?.getUpsellItemObject(journey.ReturnJourneyExtras) : undefined;
      } else {
        returnItem.upsell_taken = this.getUpsellTaken(journey.ReturnJourneyExtras);
        returnItem.upsell_item = (returnItem.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.ReturnJourneyExtras) : undefined;
      }
      returnItem.item_list_name = this.ga4ItemListEnum.cartName;
      returnItem.item_list_id = this.ga4ItemListEnum.cartId;
      items.push(returnItem);
    }
    if (seasonJourneyDetail) {
      const seasonItem: DataLayerRemoveFromCartType = new DataLayerRemoveFromCartType();
      Object.assign(seasonItem, { ...this.getItemObjectsOfTypeBasketItem(journey, seasonJourneyDetail, returnJourneyDetail, index, false, true) });
      seasonItem.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
      seasonItem.upsell_item = (seasonItem.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
      seasonItem.item_list_name = this.ga4ItemListEnum.cartName;
      seasonItem.item_list_id = this.ga4ItemListEnum.cartId;
      items.push(seasonItem);
    }
    return items;
  }
  setGAObjectsForCheckoutServiceModel(searchRequest: SearchRequestModel, journeyTypeParams, journeySummaryModel: JourneySummaryModel, isReturnCase: boolean, company, allJEService, seatingPreferences, isQuickBuyOrContinueJourney?) {
    const checkoutItemObj: DataLayerCheckoutItemType = new DataLayerCheckoutItemType();
    let selectedJourney = isReturnCase ? journeyTypeParams.returnSelectedJourney : journeyTypeParams.outwardSelectedJourney;
    let [ticketRouteCode, ticketTypeCode] = this.getTicketRouteAndTypeCodeForSelectEvent(journeySummaryModel,isReturnCase);
    let diffOfDates = Math.abs(this.calculateDiff(selectedJourney.DepartureDate));
    let activeTab = isReturnCase ? 1 : 0;
    checkoutItemObj.item_name = selectedJourney.DepartureTime.split('(').pop().split(')')[0] + `-` + selectedJourney.ArrivalTime.split('(').pop().split(')')[0];
    checkoutItemObj.item_id = this.getIdForEvents(selectedJourney, searchRequest, activeTab);
    checkoutItemObj.price = isReturnCase ? journeySummaryModel.ReturnSelectedFare.Price : journeySummaryModel.SingleSelectedFare.Price;
    checkoutItemObj.quantity = 1;
    checkoutItemObj.value = (checkoutItemObj.price && checkoutItemObj.quantity) ? (checkoutItemObj.price * checkoutItemObj.quantity) : undefined;
    checkoutItemObj.item_brand = selectedJourney.Brand ? selectedJourney.Brand : undefined;
    checkoutItemObj.item_category = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    checkoutItemObj.item_category2 = isReturnCase ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    checkoutItemObj.item_category3 = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    checkoutItemObj.item_category5 = this.ga4DatalayerConstantEnum.Fare;
    checkoutItemObj.item_variant = this.getVariant(selectedJourney);
    checkoutItemObj.item_list_name = this.ga4ItemListEnum.checkoutItemListName;
    checkoutItemObj.item_list_id = this.ga4ItemListEnum.checkoutItemListId;
    checkoutItemObj.index = 1;
    checkoutItemObj.origin = searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
    checkoutItemObj.destination = searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
    checkoutItemObj.start_date = (new Date(`${selectedJourney.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
    checkoutItemObj.end_date = (new Date(`${selectedJourney.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
    checkoutItemObj.duration = this.getDurationTime(selectedJourney);
    checkoutItemObj.ticket_class = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    checkoutItemObj.ticket_type = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase);
    checkoutItemObj.ticket_route_code = ticketRouteCode ? ticketRouteCode : undefined;
    checkoutItemObj.ticket_type_code = ticketTypeCode ? ticketTypeCode : undefined;
    checkoutItemObj.type = isReturnCase ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    checkoutItemObj.single_or_return = (journeyTypeParams.outwardSelectedJourney && journeyTypeParams.returnSelectedJourney) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    checkoutItemObj.number_of_changes = selectedJourney.Changes;
    checkoutItemObj.additional_information = undefined;
    checkoutItemObj.days_in_advance = diffOfDates ? diffOfDates : undefined;
    checkoutItemObj.railcard_code = this.getRailCardCode(searchRequest);
    checkoutItemObj.railcard_used = this.isRailCardPresent;
    checkoutItemObj.adult_pax = searchRequest.Adult;
    checkoutItemObj.child_pax = searchRequest.Child
    checkoutItemObj.total_pax = (searchRequest.Adult + searchRequest.Child);
    checkoutItemObj.start_time = selectedJourney.DepartureTime.split('(')[0].trim();
    checkoutItemObj.end_time = selectedJourney.ArrivalTime.split('(')[0].trim();
    checkoutItemObj.operator = company;
    checkoutItemObj.travel_extras = this.getSeatPrefrenceType(seatingPreferences);
    checkoutItemObj.delivery_method = undefined;
    checkoutItemObj.upsell_taken = this.getUpsellTakenFromArray(allJEService, isReturnCase);
    checkoutItemObj.upsell_item = (checkoutItemObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemFromArray(allJEService, isReturnCase) : undefined;
    checkoutItemObj.quick_buy = isQuickBuyOrContinueJourney ? 'Yes' : 'No';
    return checkoutItemObj;
  }
  // For Season BeginCheckout Event *** 
  setGAObjectsForSeasonCheckoutServiceModel(searchRequest, allJEService) {
    if (searchRequest) {
      const seasoncheckoutItemObj: DataLayerCheckoutItemType = new DataLayerCheckoutItemType();
      let diffOfDates = Math.abs(this.calculateDiff(searchRequest.DepartureTimesStart));
      seasoncheckoutItemObj.item_name = searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      seasoncheckoutItemObj.item_id = undefined;
      seasoncheckoutItemObj.price = (parseFloat((this.sharedService.calculateTotalAmount())));
      seasoncheckoutItemObj.quantity = 1;
      seasoncheckoutItemObj.value = (seasoncheckoutItemObj.price && seasoncheckoutItemObj.quantity) ? (seasoncheckoutItemObj.price * seasoncheckoutItemObj.quantity) : undefined;
      seasoncheckoutItemObj.item_brand = undefined;
      seasoncheckoutItemObj.item_category = undefined;
      seasoncheckoutItemObj.item_category2 = this.travelSolutionJourneyTypeEnum.season;
      seasoncheckoutItemObj.item_category3 = undefined;
      seasoncheckoutItemObj.item_category5 = this.ga4DatalayerConstantEnum.Fare;
      seasoncheckoutItemObj.item_variant = ('1:' + searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]);
      seasoncheckoutItemObj.item_list_name = this.ga4ItemListEnum.checkoutItemListName;
      seasoncheckoutItemObj.item_list_id = this.ga4ItemListEnum.checkoutItemListId;
      seasoncheckoutItemObj.index = 1;
      seasoncheckoutItemObj.origin = searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
      seasoncheckoutItemObj.destination = searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      seasoncheckoutItemObj.start_date = this.datePipe.transform(searchRequest.DepartureTimesStart, 'dd/MM/yy');
      seasoncheckoutItemObj.end_date = undefined
      seasoncheckoutItemObj.duration = undefined;
      seasoncheckoutItemObj.ticket_class = undefined;
      seasoncheckoutItemObj.ticket_type = undefined;
      seasoncheckoutItemObj.ticket_route_code = undefined;
      seasoncheckoutItemObj.ticket_type_code = undefined;
      seasoncheckoutItemObj.type = this.getJourneyType(searchRequest);
      seasoncheckoutItemObj.single_or_return = this.travelSolutionJourneyTypeEnum.season.toLowerCase();
      seasoncheckoutItemObj.number_of_changes = undefined;
      seasoncheckoutItemObj.additional_information = undefined;
      seasoncheckoutItemObj.days_in_advance = diffOfDates ? diffOfDates : undefined;
      seasoncheckoutItemObj.railcard_code = this.getRailCardCode(searchRequest);
      seasoncheckoutItemObj.railcard_used = this.isRailCardPresent;
      seasoncheckoutItemObj.adult_pax = searchRequest.Adult ? searchRequest.Adult : undefined;
      seasoncheckoutItemObj.child_pax = searchRequest.Child ? searchRequest.Child : undefined;
      seasoncheckoutItemObj.total_pax = (searchRequest.Adult + searchRequest.Child);
      seasoncheckoutItemObj.start_time = undefined;
      seasoncheckoutItemObj.end_time = undefined;
      seasoncheckoutItemObj.operator = undefined;
      seasoncheckoutItemObj.travel_extras = undefined;
      seasoncheckoutItemObj.delivery_method = undefined;
      seasoncheckoutItemObj.upsell_taken = this.getUpsellTakenFromArray(allJEService, null);
      seasoncheckoutItemObj.upsell_item = (seasoncheckoutItemObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemFromArray(allJEService, null) : undefined;
      return seasoncheckoutItemObj;
    }
  }

  //  *** Confirm Order Details ***
  loadGALayerForConfirmOrderDetailInfo(reviewBuyResponse: ReviewBuyResponse, selectedJourneyDataForQuickBuyOrContiue) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.confirmOrderDetails,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: this.addCartItemInDataLayerArray(reviewBuyResponse, this.ga4DatalayeEventNameEnum.confirmOrderDetails, null, null, selectedJourneyDataForQuickBuyOrContiue)
        }
      });
    } catch (error) { console.log(error); }
  }

  addCartItemInConfirmOrderDataLayerArray(journey: JourneyDetail, index: number, selectedJourneyDataForQuickBuyOrContiue?) {
    try {
      const items: DataLayerBasketItemTypeForConfirmOrder[] = [];

      const outwardJourneyDetail = journey.OutwardDetail || undefined;
      const returnJourneyDetail = journey.ReturnDetail || undefined;
      const seasonJourneyDetail = journey.SeasonDeatil || undefined;

      if (outwardJourneyDetail) {
        const item: DataLayerBasketItemTypeForConfirmOrder = new DataLayerBasketItemTypeForConfirmOrder();
        let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, outwardJourneyDetail, returnJourneyDetail, index, false, null, selectedJourneyDataForQuickBuyOrContiue);
        Object.assign(item, { ...BasketItem });
        this.addAdditionalPropertiesForConfirmOrderDetail(item,journey, this.travelSolutionJourneyTypeEnum.outward);
        items.push(item);
      }

      if (returnJourneyDetail) {
        const item: DataLayerBasketItemTypeForConfirmOrder = new DataLayerBasketItemTypeForConfirmOrder();
        let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, returnJourneyDetail, returnJourneyDetail, index, true, null, selectedJourneyDataForQuickBuyOrContiue);
        Object.assign(item, { ...BasketItem });
        this.addAdditionalPropertiesForConfirmOrderDetail(item,journey,this.travelSolutionJourneyTypeEnum.return);
        items.push(item);
      }
      
      if (seasonJourneyDetail) {
        const item: DataLayerBasketItemTypeForConfirmOrder = new DataLayerBasketItemTypeForConfirmOrder();
        let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, seasonJourneyDetail, returnJourneyDetail, index, false, true);
        Object.assign(item, { ...BasketItem });
        this.addAdditionalPropertiesForConfirmOrderDetail(item,journey,this.travelSolutionJourneyTypeEnum.season);
        items.push(item);
      }
      return items;
    } catch (error) { console.log(error); }
  }

  //  *** View Cart ***
  loadGALayerForViewBasket(reviewBuyResponse: ReviewBuyResponse, selectedJourneyDataForQuickBuyOrContiue) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.viewCart,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: this.addCartItemInDataLayerArray(reviewBuyResponse, this.ga4DatalayeEventNameEnum.viewCart, null, null, selectedJourneyDataForQuickBuyOrContiue)
        }
      });
    } catch (error) { console.log(error); }
  }

  // Method to fetch items for view cart event
  private addCartItemForViewCart(journey: JourneyDetail, index: number, selectedJourneyDataForQuickBuyOrContiue?): DataLayerViewCartType[] {
    let items: DataLayerViewCartType[] = [];

    const outwardJourneyDetail = journey.OutwardDetail || undefined;
    const returnJourneyDetail = journey.ReturnDetail || undefined;
    const seasonJourneyDetail = journey.SeasonDeatil || undefined;

    if (outwardJourneyDetail) {
      const item: DataLayerViewCartType = new DataLayerViewCartType();
      let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, outwardJourneyDetail, returnJourneyDetail, index, false, null, selectedJourneyDataForQuickBuyOrContiue);
      Object.assign(item, { ...BasketItem });
      this.addAdditionalPropertiesForViewCart(item, journey, this.travelSolutionJourneyTypeEnum.outward);
      items.push(item);
    }

    if (returnJourneyDetail) {
      const item: DataLayerViewCartType = new DataLayerViewCartType();
      let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, returnJourneyDetail, returnJourneyDetail, index, true, null, selectedJourneyDataForQuickBuyOrContiue);
      Object.assign(item, { ...BasketItem });
      this.addAdditionalPropertiesForViewCart(item, journey, this.travelSolutionJourneyTypeEnum.return);
      items.push(item);
    }

    if (seasonJourneyDetail) {
      const item: DataLayerViewCartType = new DataLayerViewCartType();
      let BasketItem: DataLayerBasketItemType = this.getItemObjectsOfTypeBasketItem(journey, seasonJourneyDetail, returnJourneyDetail, index, false, true, null);
      Object.assign(item, { ...BasketItem });
      this.addAdditionalPropertiesForViewCart(item, journey, this.travelSolutionJourneyTypeEnum.season);
      items.push(item);
    }
    return items;
  }

  // Method to add additional properties for view cart
  private addAdditionalPropertiesForViewCart(item, journey, journeyType) {
    if (journeyType == this.travelSolutionJourneyTypeEnum.outward || journeyType == this.travelSolutionJourneyTypeEnum.season) {
      item.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
      item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
    }
    if (journeyType == this.travelSolutionJourneyTypeEnum.return) {
      item.upsell_taken = this.getUpsellTaken(journey.ReturnJourneyExtras);
      item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.ReturnJourneyExtras) : undefined;

    }
    const journeyDeliveryDetail = (journey.DeliveryDetail && journey.DeliveryDetail.length > 0) ? journey.DeliveryDetail[0] : undefined;
    item.delivery_method = (journeyDeliveryDetail && journeyDeliveryDetail.DeliveryModeName) ? journeyDeliveryDetail.DeliveryModeName : undefined;
    item.item_list_name = this.ga4ItemListEnum.cartName;
    item.item_list_id = this.ga4ItemListEnum.cartId;
  }
  
  // Method to add additional properties for Confirm Order Details
  addAdditionalPropertiesForConfirmOrderDetail(item, journey, journeyType) {
    switch (journeyType) {
      case this.travelSolutionJourneyTypeEnum.outward:
        item.travel_extras = this.getSeatTypeForTravelExtras(journey.OutwardSeat);
        item.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
        item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
        break;
      case this.travelSolutionJourneyTypeEnum.return:
        item.upsell_taken = this.getUpsellTaken(journey.ReturnJourneyExtras);
        item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.ReturnJourneyExtras) : undefined;
        item.travel_extras = this.getSeatTypeForTravelExtras(journey.ReturnSeat);
        break;
      case this.travelSolutionJourneyTypeEnum.season:
        item.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
        item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
        item.travel_extras = undefined;
        break;
    }
    const journeyDeliveryDetail = (journey.DeliveryDetail && journey.DeliveryDetail.length > 0) ? journey.DeliveryDetail[0] : undefined;
    item.delivery_method = (journeyDeliveryDetail && journeyDeliveryDetail.DeliveryModeName) ? journeyDeliveryDetail.DeliveryModeName : undefined;
    item.item_list_name = this.ga4ItemListEnum.cartName;
    item.item_list_id = this.ga4ItemListEnum.cartId;
    item.discount = journey.DiscountedPrice;
  }
  // for concate seat Prefrences type by pipe
  concatSeatPrefrences(getSeatPrefrence, seatProperty) {
    if (getSeatPrefrence) {
      return ` | ${seatProperty}`;
    }
    return seatProperty;
  }
  // for getting seat Prefrences type Value
  getSeatPrefrenceTypeValue(seatingPreferences) {
    let getSeatPrefrence = '';
    for (let SeatPrefrence of seatingPreferences) {
      switch (SeatPrefrence) {
        case this.seatPrefrenceType.facingSeat: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.facingSeatName);
          break;
        case this.seatPrefrenceType.backSeat: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.backSeatName);
          break;
        case this.seatPrefrenceType.windowSeat: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.windowSeatName);
          break;
        case this.seatPrefrenceType.aislSeat: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.aislSeatName);
          break;
        case this.seatPrefrenceType.tableSeat: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.tableSeatName);
          break;
        case this.seatPrefrenceType.powerSocket: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.powerSocketName);
          break;
        case this.seatPrefrenceType.quietCoach: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.quietCoachName);
          break;
        case this.seatPrefrenceType.nearLuggageRack: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.nearLuggageRackName);
          break;
        case this.seatPrefrenceType.nearToilet: getSeatPrefrence += this.concatSeatPrefrences(getSeatPrefrence, this.seatPrefrenceType.nearToiletName);
          break;
      }
    }
    return getSeatPrefrence;
  }

  getSeatPrefrenceType(seatingPreferences) {
    let getSeatPrefrencesValue = '';
    if (seatingPreferences && seatingPreferences.length > 0) {
      getSeatPrefrencesValue = this.getSeatPrefrenceTypeValue(seatingPreferences);
    }
    return getSeatPrefrencesValue ? getSeatPrefrencesValue : undefined;
  }
  // created for push SeatCoach SeatPosition SeatFacing & SeatType into an array
  isCheckSeat(seattype) {
    let seatArray = [];
    seattype.Seat.forEach(seatprop => {
      seatprop.CoachType = this.getSeatCoachType(seatprop);
      if (seatprop.CoachType) seatArray.push(seatprop.CoachType);

      seatprop.SeatPosition = this.commonServices.getSeatPosition(seatprop);
      if (seatprop.SeatPosition) seatArray.push(seatprop.SeatPosition);

      seatprop.SeatFacing = this.commonServices.getSeatFacing(seatprop);
      if (seatprop.SeatFacing) seatArray.push(seatprop.SeatFacing);

      if (seatprop.SeatType !== "-" && seatprop.SeatType !== "") {
        let seatTypeString = "";
        seatprop.SeatType.split(",").forEach(x => {
          seatTypeString += (x.match(/[A-Z][a-z]+/g).join(" ") + "| ");
        });
        let seatTypeStringLength = seatTypeString.length;
        seatTypeString = seatTypeString.slice(0, seatTypeStringLength - 2);
        seatprop.SeatType = seatTypeString;
        if (seatprop.SeatType) {
          seatArray.push(seatprop.SeatType);
        }
      } else {
        seatprop.SeatType = "";
        if (seatprop.SeatType) {
          seatArray.push(seatprop.SeatType);
        }
      }
    });
    return seatArray;
  }
  // manipulate seats properties data by using pipe
  getSeatArrayValueByPipe(seatArrayType) {
    let seatTypeName = '';
    if (seatArrayType) {
      seatArrayType.forEach(seatArrayList => {
        seatTypeName += `${seatArrayList}|`;
      });
      seatTypeName = seatTypeName.slice(0, -1);
    }
    return seatTypeName;
  }
  // created method for get seatProperties
  getSeatTypeForTravelExtras(seatType) {
    let seatTypeNameValue = '';
    let seatArrayType = [];
    if (seatType && seatType.length > 0) {
      seatType.forEach(seattype => {
        if (seattype.Seat && seattype.Seat.length > 0) {
          let getSeatTypeList = this.isCheckSeat(seattype);
          if (getSeatTypeList) {
            seatArrayType.push(...getSeatTypeList);
          }
          seatTypeNameValue = this.getSeatArrayValueByPipe(seatArrayType);
        }
      });
      return seatTypeNameValue ? seatTypeNameValue : undefined;
    }
  }
  // for get coach type value
  getSeatCoachType(seat) {
    try {
      if (seat.CoachType && seat.CoachType !== "-") {
        if (seat.CoachType == this.seatPrefrenceType.quiet) {
          return `${seat.CoachType.match(/[A-Z][a-z]+/g).join(" ")} ${this.seatPrefrenceType.coachTxt}`
        }
        return (seat.CoachType == this.seatPrefrenceType.quietCoach) ? this.seatPrefrenceType.quietCoachName : seat.CoachType.match(/[A-Z][a-z]+/g).join(" ");
      }
      return "";
    } catch (error) {
      console.log(error);
    }
  }

  //#region Upgrade data layer
  
  // PICO-2836 for Product_Impressions event
  loadGA4UpgradeItem (upgradeItemObject, isProductClick = false) {
    try {
      this.isUpgradeEvent = true;
      this.selectedUpgrade = upgradeItemObject.selectedUpgrade;
      if(upgradeItemObject.onSelectedLeg){
        this.setListOfItemsWhenSelectsLegForUpgrade(upgradeItemObject);
      }else{
        this.setListOfItemsForNonSeasonJourneyForUpgrade(upgradeItemObject);
      }
      
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: isProductClick ? this.ga4DatalayeEventNameEnum.selectItem : this.ga4DatalayeEventNameEnum.viewItemList,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: this.Services,
        }
      });
      this.isReturnJourney = false;
      this.isUpgradeEvent = false;
    } catch (error) {
      console.log(error);
    }
  }

  //PICO-2836 -- for upgrade event

  loadGA4DataLayerOnUpgrade(searchRequest, bookingResponse ,ga4SearchEventParam) {
    try {
      localStorage.removeItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer);
      this.setRailCardListInLocalStorage(bookingResponse);
      let selectedDate = moment.utc(bookingResponse.OutwardDeparture).tz(this.appConstantsService.timeZone);
      let daysInAdvance = Math.abs(this.calculateDiff(selectedDate));
      let outboundDate = this.datePipe.transform(bookingResponse.OutwardDeparture, 'dd/MM/yy');
      let outboundTime = this.datePipe.transform(bookingResponse.OutwardDeparture, 'HH:mm');
      let returnDateAndTimeObject = this.setReturnDateAndTime(bookingResponse);
      let returnDate = returnDateAndTimeObject.returnDate;
      let returnTime = returnDateAndTimeObject.returnTime;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.upgrade,
        feature: this.ga4DatalayeEventNameEnum.upgradeFeatureText,
        search_term: searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + '-' + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        origin: searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
        destination: searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        journey_via: bookingResponse.ViaStation ? bookingResponse.ViaStation.split('(').pop().split(')')[0] : undefined,
        start_date: this.setUndefinedForBlankValueInVariable(outboundDate),
        end_date: returnDate ?  returnDate : this.setUndefinedForBlankValueInVariable(outboundDate),
        journey_avoid: bookingResponse.AvoidStation ? bookingResponse.AvoidStation.split('(').pop().split(')')[0] : undefined,
        outbound_time: outboundTime,
        outbound_timing: this.setUndefinedForBlankValueInVariable(searchRequest.Traveltype),
        return_time: returnTime ? returnTime : undefined,
        return_timing: this.setUndefinedForBlankValueInVariable(searchRequest.TraveltypeReturn),
        days_in_advance: this.setUndefinedForBlankValueInVariable(daysInAdvance),
        adult_pax: this.setUndefinedForBlankValueInVariable(searchRequest.Adult),
        child_pax: this.setUndefinedForBlankValueInVariable(searchRequest.Child),
        total_pax: (searchRequest.Adult + searchRequest.Child),
        success: ga4SearchEventParam.searchSuccess,
        search_source: ga4SearchEventParam.searchSource,
        search_error: this.setUndefinedForBlankValueInVariable(ga4SearchEventParam.searchError),
        duration: this.getDurationTime(bookingResponse.OutwardDetails) || undefined,
        type: this.setUndefinedForBlankValueInVariable(bookingResponse.OutwardDetails.TravelType),
        railcard_present: bookingResponse.TicketDetail.RailCardList && bookingResponse.TicketDetail.RailCardList?.length > 0 ? true : false,
        railcard_used: bookingResponse.TicketDetail ? this.getRailCardCode(bookingResponse.TicketDetail) : undefined,
        booking_reference: this.setUndefinedForBlankValueInVariable(bookingResponse.TicketDetail.BookingReferenceNumber)
      });
    } catch (error) {
      console.log(error);
    }
  }

  setUndefinedForBlankValueInVariable(value) {
    return value ? value : undefined;
  }

  setReturnDateAndTime(bookingResponse) {
    let returnObj =  {returnDate : '', returnTime : ''};
    if (bookingResponse.ReturnDetails) {
      returnObj.returnDate = this.datePipe.transform(bookingResponse.ReturnDeparture, 'dd/MM/yy');
      returnObj.returnTime = this.datePipe.transform(bookingResponse.ReturnDeparture, 'HH:mm');
    }
   return returnObj;
  }

  //created method for get addToCart obj detail - PICO-2836
  getAddToCartObjDetailToUpgrade(searchRequest: SearchRequestModel, journeySummaryModel, allJEService, totalUpgradePrice) {
    const addCartItemObj: Array<DataLayerAddToCartItemType> = [];
    if (!searchRequest.IsSeason) {
      let outwardSelectedJourney = journeySummaryModel.OutwardDetail;
      let returnSelectedJourney = journeySummaryModel.ReturnDetail;
      if (outwardSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.OutwardDetail);
        let addItem;
        if(this.isUpgradeEvent){
          addItem = this.setGAObjectsForAddToCartServiceModelToUpgrade(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, false, company, totalUpgradePrice);
        }else {
          addItem = this.setGAObjectsForAddToCartServiceModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, false, company, allJEService);
        }
        if (addItem) { addCartItemObj.push(addItem); }
      }
    } 
    return addCartItemObj;
  }

  checkForTravelSolutionInSearchResponse(travelSolutions) {
    return (!travelSolutions && travelSolutions[0].NewFareList.length > 0);
  }

  setReturnDateAndTimeForFareList(upgradeItemObject) {
    let returnObj = {returnDate: '', returnTime: ''};
    if(upgradeItemObject.returnJourneyResponse){
      returnObj.returnDate =  new Date(upgradeItemObject.returnJourneyResponse.TravelSolutions[0].ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString);
      returnObj.returnTime = upgradeItemObject.returnJourneyResponse.TravelSolutions[0].DepartureTime.split('(')[0].trim();
    }
    return returnObj;
  }

  checkForFareList(upgradeItemObject) {
    return this.selectedUpgrade  == '' || this.selectedUpgrade == undefined ?
    upgradeItemObject.searchResponse.TravelSolutions[0].NewFareList[0].FareList : upgradeItemObject.searchResponse.TravelSolutions[0].NewFareList[0].FareList.filter(item => item.TicketClass == this.selectedUpgrade);
  }

  setDiffOfDatesForFareListUpgradeEvent(upgradeItemObject) {
    return Math.abs(this.isReturnJourney ? this.calculateDiff(upgradeItemObject.returnJourneyResponse.TravelSolutions[0].DepartureDate) : this.calculateDiff(upgradeItemObject.singleJourneyResponse.TravelSolutions[0].DepartureDate));
  }

  SetJourneyResponseOnBasisOfJourneyType(returnJourneyResponse, singleJourneyResponse) {
    return this.isReturnJourney ? returnJourneyResponse : singleJourneyResponse;
  }

  setGA4ItemObjectForUpgrade(upgradeItemObject, fare, index, diffOfDates, ticketRoutecode, ticketTypeCode, dataObject) {
    let item = {
      item_name: this.getItemNameForUpgrade(this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse.TravelSolutions[0], upgradeItemObject.singleJourneyResponse.TravelSolutions[0])),
      item_id: this.getIdForEvents(this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse.TravelSolutions[0], upgradeItemObject.singleJourneyResponse.TravelSolutions[0]), upgradeItemObject.searchRequest, upgradeItemObject.activeTab),
      price: parseInt(this.sharedService?.formatPrice(this.setPriceOfUpgradeOnClassChange(fare.TicketClass, upgradeItemObject.singleJourneyResponse, upgradeItemObject.returnJourneyResponse, upgradeItemObject.isOutwardSelected, upgradeItemObject.isReturnSelected))),
      item_brand: this.setUndefinedForBlankValueInVariable(upgradeItemObject.searchResponse.TravelSolutions[0].Brand),
      item_category: this.getTicketClass(upgradeItemObject.outwardSelectedFare, upgradeItemObject.returnSelectedFare, this.isReturnJourney),
      item_category2: (upgradeItemObject.singleJourneyResponse && upgradeItemObject.returnJourneyResponse) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
      item_category3: this.getTicketType(upgradeItemObject.outwardSelectedFare, upgradeItemObject.returnSelectedFare, this.isReturnJourney),
      item_category5: this.ga4DatalayerConstantEnum.Fare,
      item_variant: this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse.TravelSolutions[0].CallingPointName, upgradeItemObject.singleJourneyResponse.TravelSolutions[0].CallingPointName),
      item_list_name:  undefined,
      item_list_id:  undefined,
      index: (index + 1),
      start_date: this.SetJourneyResponseOnBasisOfJourneyType(new Date(upgradeItemObject.returnJourneyResponse.TravelSolutions[0].DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString), new Date(upgradeItemObject.singleJourneyResponse.TravelSolutions[0].ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString)),
      end_date: dataObject.returnDate ? dataObject.returnDate : new Date(upgradeItemObject.singleJourneyResponse.TravelSolutions[0].DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
      duration: this.getDurationTime(this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse.TravelSolutions[0], upgradeItemObject.singleJourneyResponse.TravelSolutions[0])),
      ticket_class: this.setUndefinedForBlankValueInVariable(fare.TicketClass),
      ticket_type: this.setUndefinedForBlankValueInVariable(fare.TicketType),
      ticket_route_code: this.setUndefinedForBlankValueInVariable(ticketRoutecode),
      ticket_type_code: ticketTypeCode.includes('null') ? undefined : ticketTypeCode,
      type: (upgradeItemObject.singleJourneyResponse && upgradeItemObject.returnJourneyResponse) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
      single_or_return: (upgradeItemObject.returnJourneyResponse && upgradeItemObject.singleJourneyResponse) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
      number_of_changes: this.setUndefinedForBlankValueInVariable(upgradeItemObject.searchResponse.TravelSolutions[0].Changes),
      additional_information: this.isCheapestTravelSolution(upgradeItemObject.searchResponse.TravelSolutions[0]),
      days_in_advance: this.setUndefinedForBlankValueInVariable(diffOfDates),
      railcard_code: dataObject.railCardDetail ? this.getRailCardCode(dataObject.railCardDetail) : undefined,
      railcard_used: this.isRailCardPresent,
      adult_pax: this.setUndefinedForBlankValueInVariable(upgradeItemObject.searchRequest.Adult),
      child_pax: this.setUndefinedForBlankValueInVariable(upgradeItemObject.searchRequest.Child),
      total_pax: this.setUndefinedForBlankValueInVariable((upgradeItemObject.searchRequest.Adult + upgradeItemObject.searchRequest.Child)),
      start_time: this.isReturnJourney ? upgradeItemObject.returnJourneyResponse.TravelSolutions[0].DepartureTime.split('(')[0].trim() : upgradeItemObject.singleJourneyResponse.TravelSolutions[0].DepartureTime.split('(')[0].trim(),
      end_time: dataObject.returnTime ? dataObject.returnTime : upgradeItemObject.singleJourneyResponse.TravelSolutions[0].ArrivalTime.split('(')[0].trim() || undefined,
      operator: this.getTravelSolutionOperatorForCompany(upgradeItemObject.searchResponse.TravelSolutions[0]),
      feature: this.ga4DatalayeEventNameEnum.upgradeFeatureText,
      booking_reference: localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber)
    }
    this.Services.push(item);
  }

  getFareList(upgradeItemObject) {
    if (this.checkForTravelSolutionInSearchResponse(upgradeItemObject.searchResponse.TravelSolutions)) {
      return;
    }
    let dataObject;
    let returnDateAndTimeObject = this.setReturnDateAndTimeForFareList(upgradeItemObject);
    let returnDate = returnDateAndTimeObject.returnDate;
    let returnTime = returnDateAndTimeObject.returnTime;
    let ticketDetail : any = localStorage.getItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer);
    let railCardDetail = JSON.parse(ticketDetail);
    dataObject = {
      returnDate: returnDate,
      returnTime: returnTime,
      railCardDetail: railCardDetail
    }
    let fareList = this.checkForFareList(upgradeItemObject);
    fareList.forEach((fare, index) => {
      let diffOfDates = this.setDiffOfDatesForFareListUpgradeEvent(upgradeItemObject);
      let [ticketRoutecode, ticketTypeCode] = this.getTicketRouteAndTypeCode(upgradeItemObject.searchResponse.TravelSolutions[0]);
      this.setGA4ItemObjectForUpgrade(upgradeItemObject, fare, index, diffOfDates, ticketRoutecode, ticketTypeCode, dataObject);
    });
  }

  setPriceOfUpgradeOnClassChange(choosedUpgradeClass : string, singleJourneyResponse, returnJourneyResponse, isOutwardSelected, isReturnSelected) {
    let totalAmount = 0;
    let upgradeClassDataOutward = choosedUpgradeClass ? this.getUpgradeClassData(singleJourneyResponse, choosedUpgradeClass) : null;
    let upgradeClassDataReturn = choosedUpgradeClass ? this.getUpgradeClassData(returnJourneyResponse, choosedUpgradeClass) : null;
    let upgradeAmountOutward = upgradeClassDataOutward ? (upgradeClassDataOutward.Price - this.sharedService.upgradeOutwardPrice) : null;
    let upgradeAmountReturn = upgradeClassDataReturn ? (upgradeClassDataReturn.Price - this.sharedService.upgradeReturnPrice) : null;
    if(upgradeAmountOutward && isOutwardSelected) {
      totalAmount += upgradeAmountOutward;
    }
    if(upgradeAmountReturn && isReturnSelected) {
      totalAmount += upgradeAmountReturn;
    }
    return totalAmount;
  }

  getUpgradeClassData(JourneyResponse, choosedUpgradeClass: string) {
    let ClassData = null;
      if(JourneyResponse && JourneyResponse.TravelSolutions && JourneyResponse.TravelSolutions[0].NewFareList &&
        JourneyResponse.TravelSolutions[0].NewFareList.length > 0) {
        JourneyResponse.TravelSolutions[0].NewFareList[0].FareList.forEach(fare => {
           if(fare.TicketClass === choosedUpgradeClass) {
            ClassData = fare;
           }
        });
      }
      return ClassData;
  }

  getChangesOnSelectItemForUpgrade(upgradeItemObject) {
    if (upgradeItemObject && upgradeItemObject.searchResponse && upgradeItemObject.searchResponse.TravelSolutions.length > 0) {
      return upgradeItemObject.searchResponse.TravelSolutions[0].Changes ? upgradeItemObject.searchResponse.TravelSolutions[0].Changes : undefined;
    }
    return undefined;
  }

  setUpgradeDataLayerOnSelectItem(upgradeItemObject) {
    let index = 0;
    let ticketDetail : any = localStorage.getItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer);
    let railCardDetail = JSON.parse(ticketDetail);
    if (this.checkForTravelSolutionInSearchResponse(upgradeItemObject.searchResponse.TravelSolutions)) {
      return;
    }
    let ticketType  = upgradeItemObject.searchResponse.TravelSolutions[0].NewFareList[0].FareList.filter(e => e.TicketClass == upgradeItemObject.selectedUpgrade);
    let diffOfDates = this.setDiffOfDatesForFareListUpgradeEvent(upgradeItemObject);
    let [ticketRoutecode, ticketTypeCode] = this.getTicketRouteAndTypeCode(upgradeItemObject.searchResponse.TravelSolutions[0]);
    let returnDateAndTimeObject = this.setReturnDateAndTimeForFareList(upgradeItemObject);
    let returnDate = returnDateAndTimeObject.returnDate;
    let returnTime = returnDateAndTimeObject.returnTime;
      let item = {
        item_name: this.getItemNameForUpgrade(this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse?.TravelSolutions[0], upgradeItemObject.singleJourneyResponse?.TravelSolutions[0])),
        item_id: this.getIdForEvents(this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse?.TravelSolutions[0], upgradeItemObject.singleJourneyResponse?.TravelSolutions[0]), upgradeItemObject.searchRequest, upgradeItemObject.activeTab),
        price: parseInt(this.sharedService?.formatPrice(upgradeItemObject.totalPrice)) ? parseInt(this.sharedService?.formatPrice(upgradeItemObject.totalPrice)) : undefined,
        item_brand: this.setUndefinedForBlankValueInVariable(upgradeItemObject.searchResponse.TravelSolutions[0].Brand),
        item_category: this.getTicketClass(upgradeItemObject.outwardSelectedFare, upgradeItemObject.returnSelectedFare, this.isReturnJourney),
        item_category2: (upgradeItemObject.singleJourneyResponse && upgradeItemObject.returnJourneyResponse) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
        item_category3: this.getTicketType(upgradeItemObject.outwardSelectedFare, upgradeItemObject.returnSelectedFare, this.isReturnJourney),
        item_category5: this.ga4DatalayerConstantEnum.Fare,
        item_variant: this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse?.TravelSolutions[0].CallingPointName, upgradeItemObject.singleJourneyResponse?.TravelSolutions[0].CallingPointName),
        item_list_name:  undefined,
        item_list_id: undefined,
        index: this.Services.length > 1 ? (index + 1) : index,
        start_date: this.SetJourneyResponseOnBasisOfJourneyType(new Date(upgradeItemObject.returnJourneyResponse?.TravelSolutions[0].DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString), new Date(upgradeItemObject.singleJourneyResponse?.TravelSolutions[0].ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString)),
        end_date: returnDate ? returnDate : new Date(upgradeItemObject.singleJourneyResponse?.TravelSolutions[0].DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
        duration: this.getDurationTime(this.isReturnJourney ? upgradeItemObject.returnJourneyResponse?.TravelSolutions[0]:  upgradeItemObject.singleJourneyResponse?.TravelSolutions[0]),
        ticket_class: this.setUndefinedForBlankValueInVariable(upgradeItemObject.selectedUpgrade),
        ticket_type: this.setUndefinedForBlankValueInVariable(ticketType[0].TicketType),
        ticket_route_code: this.setUndefinedForBlankValueInVariable(ticketRoutecode),
        ticket_type_code: ticketTypeCode.includes('null') ? undefined : ticketTypeCode,
        type: (upgradeItemObject.singleJourneyResponse && upgradeItemObject.returnJourneyResponse) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
        single_or_return: (upgradeItemObject.isReturnSelected && upgradeItemObject.isOutwardSelected) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
        number_of_changes: this.getChangesOnSelectItemForUpgrade(upgradeItemObject),
        additional_information: this.isCheapestTravelSolution(upgradeItemObject.searchResponse.TravelSolutions[0]),
        days_in_advance: this.setUndefinedForBlankValueInVariable(diffOfDates),
        railcard_code: railCardDetail ? this.getRailCardCode(railCardDetail) : undefined,
        railcard_used: this.isRailCardPresent,
        adult_pax: this.setUndefinedForBlankValueInVariable(upgradeItemObject.searchRequest.Adult),
        child_pax: this.setUndefinedForBlankValueInVariable(upgradeItemObject.searchRequest.Child),
        total_pax: this.setUndefinedForBlankValueInVariable((upgradeItemObject.searchRequest.Adult + upgradeItemObject.searchRequest.Child)),
        start_time: this.SetJourneyResponseOnBasisOfJourneyType(upgradeItemObject.returnJourneyResponse?.TravelSolutions[0].DepartureTime.split('(')[0].trim(), upgradeItemObject.singleJourneyResponse?.TravelSolutions[0].DepartureTime.split('(')[0].trim()),
        end_time: returnTime ? returnTime : upgradeItemObject.singleJourneyResponse?.TravelSolutions[0].ArrivalTime.split('(')[0].trim() || undefined,
        operator: this.getTravelSolutionOperatorForCompany(upgradeItemObject.searchResponse.TravelSolutions[0]),
        feature: this.ga4DatalayeEventNameEnum.upgradeFeatureText,
        booking_reference: localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber)
      }
      this.Services.push(item);
  }

  getItemNameForUpgrade(upgradeItemObject) {
    try {
      if (upgradeItemObject) {
        return upgradeItemObject.DepartureTime.split('(').pop().split(')')[0] + '-' + upgradeItemObject.ArrivalTime.split('(').pop().split(')')[0];
      }
      return undefined;
    } catch (error) { console.log(error); }
  }

  getIdForEventForUpgrade(selectedJourney, searchRequest, activeTab) {
    try {
      if (selectedJourney && searchRequest) {
        let id = "";
        id += selectedJourney.CallingPointName.split(":")[1];

        let depDate = selectedJourney.DepartureTime.split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;

        id += depDateTimeStamp; // service departure timestamp
        id += `-${searchRequest.Adult}`;
        id += `-${searchRequest.Child}`;
        id += `-${this.getIdMethod(searchRequest, activeTab)}`;
        return id;
      }
    } catch (error) {
      console.log(error);
    }
  }

  setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, returnSelectedJourney, outwardSelectedJourney) {
    return isReturnCase ? returnSelectedJourney : outwardSelectedJourney;
  }

  setGAObjectsForAddToCartServiceModelToUpgrade(searchRequest: SearchRequestModel, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, isReturnCase: boolean, company, totalUpgradePrice) {
    const addToCartItemObj: DataLayerAddToCartItemType = new DataLayerAddToCartItemType();
    let ticketDetail : any = localStorage.getItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer);
    let railCardDetail = JSON.parse(ticketDetail);
    let selectedJourney = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, returnSelectedJourney, outwardSelectedJourney);
    let [ticketRouteCode, ticketTypeCode] = this.getTicketRouteAndTypeCodeForSelectEvent(journeySummaryModel,isReturnCase);
    let activeTab = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, 1 , 0);
    let diffOfDates = Math.abs(this.calculateDiff(selectedJourney.DepartureTime));
    let ticketDetailObj =  JSON.parse(ticketDetail);
    let endDate = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(returnSelectedJourney, (new Date(`${returnSelectedJourney.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),  (new Date(`${selectedJourney.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)));
    let endTime = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(returnSelectedJourney, this.datePipe.transform(returnSelectedJourney.DepartureTime, 'HH:mm' ), this.datePipe.transform(selectedJourney.ArrivalTime, 'HH:mm' ));
    addToCartItemObj.item_name = selectedJourney.CallingPointName.split(":")[1];
    addToCartItemObj.item_id = this.getIdForEventForUpgrade(selectedJourney, searchRequest, activeTab);
    addToCartItemObj.price = parseInt(this.sharedService?.formatPrice(totalUpgradePrice));
    addToCartItemObj.quantity = 1;
    addToCartItemObj.value = (addToCartItemObj.price * addToCartItemObj.quantity);
    addToCartItemObj.item_brand = this.setUndefinedForBlankValueInVariable(selectedJourney.Brand);
    addToCartItemObj.item_category = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, returnSelectedJourney.TicketClass, outwardSelectedJourney.TicketClass);
    addToCartItemObj.item_category2 = (returnSelectedJourney && outwardSelectedJourney) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    addToCartItemObj.item_category3 = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, returnSelectedJourney.TicketType, outwardSelectedJourney.TicketType);
    addToCartItemObj.item_category5 = this.setUndefinedForBlankValueInVariable(this.ga4DatalayerConstantEnum.Fare);
    addToCartItemObj.item_variant = selectedJourney.CallingPointName;
    addToCartItemObj.item_list_name =  undefined;
    addToCartItemObj.item_list_id = undefined;
    addToCartItemObj.index = 1;
    addToCartItemObj.origin = this.setUndefinedForBlankValueInVariable(this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, searchRequest.ArrivalLocationName.split('(').pop().split(')')[0], searchRequest.DepartureLocationName.split('(').pop().split(')')[0]));
    addToCartItemObj.destination = this.setUndefinedForBlankValueInVariable(this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, searchRequest.DepartureLocationName.split('(').pop().split(')')[0], searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]));
    addToCartItemObj.start_date = selectedJourney.DepartureTime ? (new Date(`${selectedJourney.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
    addToCartItemObj.end_date = this.setUndefinedForBlankValueInVariable(endDate);
    addToCartItemObj.duration = this.getDurationTime(selectedJourney);
    addToCartItemObj.ticket_class = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, returnSelectedJourney.TicketClass, outwardSelectedJourney.TicketClass);
    addToCartItemObj.ticket_type = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, returnSelectedJourney.TicketType, outwardSelectedJourney.TicketType);
    addToCartItemObj.ticket_route_code = this.setUndefinedForBlankValueInVariable(ticketRouteCode);
    addToCartItemObj.ticket_type_code = this.setUndefinedForBlankValueInVariable(ticketTypeCode);
    addToCartItemObj.type = (returnSelectedJourney && outwardSelectedJourney) ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    addToCartItemObj.single_or_return = (outwardSelectedJourney && returnSelectedJourney) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
    addToCartItemObj.number_of_changes = this.setUndefinedForBlankValueInVariable(selectedJourney.Changes);
    addToCartItemObj.additional_information = undefined;
    addToCartItemObj.days_in_advance = this.setUndefinedForBlankValueInVariable(diffOfDates);
    addToCartItemObj.railcard_code = railCardDetail ? this.getRailCardCode(railCardDetail) : undefined;
    addToCartItemObj.railcard_used =  this.checkIfRailCardListAvailableOrNot(ticketDetailObj);
    addToCartItemObj.adult_pax = this.setUndefinedForBlankValueInVariable(searchRequest.Adult);
    addToCartItemObj.child_pax = this.setUndefinedForBlankValueInVariable(searchRequest.Child);
    addToCartItemObj.total_pax = this.setUndefinedForBlankValueInVariable((searchRequest.Adult + searchRequest.Child));
    addToCartItemObj.start_time = selectedJourney.DepartureTime ? this.datePipe.transform(selectedJourney.DepartureTime, 'HH:mm') : undefined;
    addToCartItemObj.end_time = this.setUndefinedForBlankValueInVariable(endTime);
    addToCartItemObj.operator = company;
    if(this.isBeginCheckoutEvent){
      addToCartItemObj.travel_extras = isReturnCase ? this.getSeatTypeForTravelExtras(journeySummaryModel.ReturnSeat) : this.getSeatTypeForTravelExtras(journeySummaryModel.OutwardSeat);
      addToCartItemObj.discount_type = undefined;
      addToCartItemObj.delivery_method = this.checkDeliveryMethod(journeySummaryModel);
    }
    addToCartItemObj.upsell_taken = this.getUpsellTakenFromArray(this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, journeySummaryModel.ReturnJourneyExtras, journeySummaryModel.OutwardJourneyExtras), null);
    addToCartItemObj.upsell_item = (addToCartItemObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemFromArrayForUpgrade(this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, journeySummaryModel.ReturnJourneyExtras, journeySummaryModel.OutwardJourneyExtras), null) : undefined;
    if(this.isUpgradeEvent){
      addToCartItemObj.feature = this.ga4DatalayeEventNameEnum.upgradeFeatureText;
      addToCartItemObj.booking_reference = localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber);
    }
    return addToCartItemObj;
  }

  setListOfItemsForNonSeasonJourneyForUpgrade(upgradeItemObject) {
    this.Services = [];
    if (upgradeItemObject.searchResponse) {
      if(upgradeItemObject.singleJourneyResponse){
        this.isReturnJourney = false;
        this.outwardTravelSolIds = upgradeItemObject.searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
        if(upgradeItemObject.selectedUpgrade){
          this.setUpgradeDataLayerOnSelectItem(upgradeItemObject);
        }else{
          this.getFareList(upgradeItemObject);
        }
      }
      if (upgradeItemObject.returnJourneyResponse) {
        this.isReturnJourney = true;
        this.inwardTravelSolIds = upgradeItemObject.searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
        if(upgradeItemObject.selectedUpgrade){
          this.setUpgradeDataLayerOnSelectItem(upgradeItemObject);
        }
      }
    }
  }

  setListOfItemsWhenSelectsLegForUpgrade(upgradeItemObject){
    this.Services = [];
    if (upgradeItemObject.searchResponse) {
      if(upgradeItemObject.singleJourneyResponse && upgradeItemObject.isOutwardSelected){
        this.isReturnJourney = false;
        this.outwardTravelSolIds = upgradeItemObject.searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
        if(upgradeItemObject.selectedUpgrade){
          this.setUpgradeDataLayerOnSelectItem(upgradeItemObject);
        }else{
          this.getFareList(upgradeItemObject);
        }
      }
      if (upgradeItemObject.returnJourneyResponse && upgradeItemObject.isReturnSelected) {
        this.isReturnJourney = true;
        this.inwardTravelSolIds = upgradeItemObject.searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
        if(upgradeItemObject.selectedUpgrade){
          this.setUpgradeDataLayerOnSelectItem(upgradeItemObject);
        }
      }
    }
  }

  // created method to load transaction confirmaion model event
  loadGTMDataLayerPurchaseOnConfirmationForUpgrade(bookingDetailResponse: BookingDetailsResponseDto) {
    try {
      const selectItems: Array<DataLayerAddToCartItemType> = [];
      const finalItem : Array<DataLayerAddToCartItemType> = [];
      let gaCouponCode = '';
      let quantity = 1;
      let selectItemsList : any = [];
      if (bookingDetailResponse) {
        let outwardSelectedJourney = bookingDetailResponse.OutwardDetails;
        let returnSelectedJourney = bookingDetailResponse.ReturnDetails;
        gaCouponCode = bookingDetailResponse.TicketDetail?.DiscountCode ? bookingDetailResponse.TicketDetail?.DiscountCode : undefined;
        let company = this.getTravelSolutionOperatorForCompany(bookingDetailResponse.TicketDetail);
        selectItemsList = this.setGADataLayerPurchaseObjectForUpgrade(bookingDetailResponse, outwardSelectedJourney, returnSelectedJourney, false, company);
        if (selectItemsList) {
          selectItems.push(selectItemsList);
        }
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.purchase,
        ecommerce: {
          currency: this.appConstantsService.currency,
          transaction_id: bookingDetailResponse.TicketDetail.BookingReferenceNumber ? bookingDetailResponse.TicketDetail.BookingReferenceNumber : undefined,
          value: (quantity * bookingDetailResponse.TicketDetail.TotalAmountOut),
          coupon: gaCouponCode ? gaCouponCode : undefined,
          payment_type: bookingDetailResponse.PaymentMode ? bookingDetailResponse.PaymentMode : undefined,
          items: selectItems,
        },
      });
      localStorage.removeItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer);
    } catch (err) { console.log(err); }
  }

  setTicketClassForUpgradePurchaseEvent(ticketClass) {
    return ticketClass.includes("1st") ? "First" :  ticketClass;

  }

  setGADataLayerPurchaseObjectForUpgrade(bookingDetailResponse : BookingDetailsResponseDto, outwardSelectedJourney, returnSelectedJourney, isReturnCase: boolean, company) {
    let ticketDetail : any = localStorage.getItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer);
    let railCardDetail = JSON.parse(ticketDetail);
    const addToCartItemObj: DataLayerAddToCartItemType = new DataLayerAddToCartItemType();
    let ticketClass = this.setTicketClassForUpgradePurchaseEvent(bookingDetailResponse.TicketDetail.TicketClass);
    let selectedJourney = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, returnSelectedJourney, outwardSelectedJourney);
    let seatOfSelectedJourney = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, bookingDetailResponse.ReturnSeat[0], bookingDetailResponse.OutwardSeat[0]);
    let routeDetails = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, bookingDetailResponse.ReturnRouteDetails?.TravelChanges[0], bookingDetailResponse.OutwardRouteDetails?.TravelChanges[0]);
    let endTime = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(returnSelectedJourney, bookingDetailResponse.ReturnRouteDetails?.TravelChanges[0].DepartureTime, bookingDetailResponse.OutwardRouteDetails?.TravelChanges[0].ArrivalTime);
    let ticketDetailObj =  JSON.parse(ticketDetail);
    let endDate = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(returnSelectedJourney, (new Date(`${bookingDetailResponse.ReturnDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString)), (new Date(`${bookingDetailResponse.OutwardDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString))); 
    let diffOfDates = Math.abs(this.calculateDiff(this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, bookingDetailResponse.ReturnDeparture, bookingDetailResponse.OutwardDeparture)));
    addToCartItemObj.item_name = `${seatOfSelectedJourney.Departure.split('(').pop().split(')')[0]}:${seatOfSelectedJourney.Arrival.split('(').pop().split(')')[0]}`;
    addToCartItemObj.item_id =selectedJourney.RefundDetails.TravelId || undefined;
    addToCartItemObj.price = parseInt(this.sharedService?.formatPrice(bookingDetailResponse.TicketDetail.TotalAmount));
    addToCartItemObj.quantity = 1;
    addToCartItemObj.value = (1 * bookingDetailResponse.TicketDetail.TotalAmount);
    addToCartItemObj.item_brand = this.setUndefinedForBlankValueInVariable(selectedJourney.Brand);
    addToCartItemObj.item_category = this.setUndefinedForBlankValueInVariable(ticketClass);
    addToCartItemObj.item_category2 = (outwardSelectedJourney && returnSelectedJourney) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single || undefined;
    addToCartItemObj.item_category3 = this.setUndefinedForBlankValueInVariable(bookingDetailResponse.TicketDetail.TicketType);
    addToCartItemObj.item_category5 = this.setUndefinedForBlankValueInVariable(this.ga4DatalayerConstantEnum.Fare);
    addToCartItemObj.item_variant = `${seatOfSelectedJourney.Departure.split('(').pop().split(')')[0]}:${seatOfSelectedJourney.Arrival.split('(').pop().split(')')[0]}`;
    addToCartItemObj.item_list_name =  undefined;
    addToCartItemObj.item_list_id =  undefined;
    addToCartItemObj.index = 1;
    addToCartItemObj.origin = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, bookingDetailResponse.ArrivalLocationName.split('(').pop().split(')')[0], bookingDetailResponse.DepartureLocationName.split('(').pop().split(')')[0]) || undefined;
    addToCartItemObj.destination = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, bookingDetailResponse.DepartureLocationName.split('(').pop().split(')')[0], bookingDetailResponse.ArrivalLocationName.split('(').pop().split(')')[0]) || undefined;
    addToCartItemObj.start_date = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, (new Date(`${bookingDetailResponse.ReturnDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString)), (new Date(`${bookingDetailResponse.OutwardDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString))) ||undefined;
    addToCartItemObj.end_date = this.setUndefinedForBlankValueInVariable(endDate);
    addToCartItemObj.duration = this.getDurationTime(selectedJourney);
    addToCartItemObj.ticket_class = this.setUndefinedForBlankValueInVariable(ticketClass);
    addToCartItemObj.ticket_type = this.setUndefinedForBlankValueInVariable(bookingDetailResponse.TicketDetail.TicketType);
    addToCartItemObj.ticket_route_code = undefined;
    addToCartItemObj.ticket_type_code = this.setUndefinedForBlankValueInVariable(bookingDetailResponse.TicketDetail.TicketTypeCode);
    addToCartItemObj.type = bookingDetailResponse.OutwardDetails.TravelType;
    addToCartItemObj.single_or_return = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart((outwardSelectedJourney && returnSelectedJourney), this.travelSolutionJourneyTypeEnum.return, this.travelSolutionJourneyTypeEnum.single);
    addToCartItemObj.number_of_changes = selectedJourney.Changes || undefined;
    addToCartItemObj.additional_information = undefined;
    addToCartItemObj.days_in_advance = this.setUndefinedForBlankValueInVariable(diffOfDates);
    addToCartItemObj.railcard_code = railCardDetail ? this.getRailCardCode(railCardDetail) : undefined;
    addToCartItemObj.railcard_used = this.checkIfRailCardListAvailableOrNot(ticketDetailObj);
    addToCartItemObj.adult_pax = bookingDetailResponse.TicketDetail.NoOfAdult;
    addToCartItemObj.child_pax = bookingDetailResponse.TicketDetail.NoOfChild;
    addToCartItemObj.total_pax = (bookingDetailResponse.TicketDetail.NoOfAdult + bookingDetailResponse.TicketDetail.NoOfChild);
    addToCartItemObj.start_time = routeDetails.DepartureTime ? this.convertTo24HourFormat(routeDetails.DepartureTime) : undefined;
    addToCartItemObj.end_time = endTime ? this.convertTo24HourFormat(endTime) : undefined;
    addToCartItemObj.operator = company;
    addToCartItemObj.travel_extras = this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, this.getSeatTypeForTravelExtras(bookingDetailResponse.ReturnSeat), this.getSeatTypeForTravelExtras(bookingDetailResponse.OutwardSeat));
    addToCartItemObj.discount_type = undefined;
    addToCartItemObj.delivery_method = this.checkDeliveryMethod(bookingDetailResponse);
    addToCartItemObj.upsell_taken = this.getUpsellTakenFromArray(this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, bookingDetailResponse.ReturnJourneyExtras, bookingDetailResponse.OutwardJourneyExtras), null);
    addToCartItemObj.upsell_item = (addToCartItemObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemFromArrayForUpgrade(this.setItemTagValuesAccordingToJourneyForUpgradeAddToCart(isReturnCase, bookingDetailResponse.ReturnJourneyExtras, bookingDetailResponse.OutwardJourneyExtras), null) : undefined;
    addToCartItemObj.feature = this.ga4DatalayeEventNameEnum.upgradeFeatureText;
    addToCartItemObj.booking_reference = bookingDetailResponse.TicketDetail.BookingReferenceNumber;
    return addToCartItemObj;
  }

  // Method to get upsell item
  getUpsellItemFromArrayForUpgrade(journeyExtras, isReturnCase) {
    let upsellItem = '';
    let updatedJourneyExtras = isReturnCase ? journeyExtras.filter(obj => obj.IsReturn) : journeyExtras.filter(obj => !obj.IsReturn);
    updatedJourneyExtras = this.removeDuplicateJourneyExtras(updatedJourneyExtras);
    for (let journeyExtra of updatedJourneyExtras) {
      switch (journeyExtra.JourneyExtraName) {
        case this.appConstantsService.plusBus: upsellItem += (upsellItem) ? ` | Plusbus` : 'Plusbus';
          break;
        case this.appConstantsService.bicycleReservation: upsellItem += (upsellItem) ? ` | Bike Reservation` : 'Bike Reservation';
          break;
        case this.appConstantsService.londonTravelcard: upsellItem += (upsellItem) ? ` | London Travelcard` : 'London Travelcard';
          break;
      }
    }
    return upsellItem ? upsellItem : undefined;
  }

  convertTo24HourFormat(timeString) { 
    const [time, period] = timeString.split(' '); 
    const [hour, minute] = time.split(':'); 
    let formattedHour = parseInt(hour); 
  
    if (period === 'PM' && formattedHour != 12) { 
        formattedHour += 12; 
    } 
  
    return `${formattedHour}:${minute}`; 
  } 

  checkIfRailCardListAvailableOrNot(ticketDetailObj) {
    return ticketDetailObj && ticketDetailObj.RailCardList && ticketDetailObj.RailCardList.length > 0 ? true : false
  }

  setRailCardListInLocalStorage(bookingResponse) {
    if(bookingResponse && bookingResponse.TicketDetail && bookingResponse.TicketDetail.RailCardList && bookingResponse.TicketDetail.RailCardList.length > 0){
      localStorage.setItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer, JSON.stringify(bookingResponse.TicketDetail));
    }
  }

  //#endregion
  // load ga4 for change seat picker event
  loadGALayerForOpenChangeSeatPicker(featureUsed, booking_reference, action, errorMessage?) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.changeSeatPicket,
        _clear: true,
        data: this.loadGALayerEventForAllActionDuringOpenSeatPicker(action, featureUsed, booking_reference, errorMessage)
      });
    } catch (error) { console.log(error); }
  }

  loadGALayerEventForAllActionDuringOpenSeatPicker(action, featureUsed, booking_reference, errorMessage) {
    const allSeatPickerItemObj: DataLayerChangeSeatItemType = new DataLayerChangeSeatItemType();
    allSeatPickerItemObj.screen_name = (action == this.ga4ItemListEnum.cancelAction || action == this.ga4ItemListEnum.exitAction) ? this.ga4ItemListEnum.seatPickerScreenNameInCaseExitAndQuit : this.ga4ItemListEnum.seatPickerScreenName;
    allSeatPickerItemObj.action = action;
    allSeatPickerItemObj.feature = featureUsed;
    allSeatPickerItemObj.booking_reference = booking_reference ? booking_reference : undefined;
    if (errorMessage) {
      allSeatPickerItemObj.message = errorMessage ? errorMessage : undefined;
    }
    return allSeatPickerItemObj;
  }

  loadGALayerForSuccessfullySaveSeatSelection(featureUsed, booking_reference, updateReservationResponse, isOutWardJourney, journey) {
    try {

      const outwardJourneyDetail = journey.OutwardDetail || undefined;
      const returnJourneyDetail = journey.ReturnDetail || undefined;

      let journeyTypeParams = {
        outwardJourneyDetail: outwardJourneyDetail,
        returnJourneyDetail: returnJourneyDetail,
        featureUsed: featureUsed,
        booking_reference: booking_reference,
        isOutWardJourney: isOutWardJourney
      }
      let saveSelectionObjData = this.setGAObjectsForSaveSeatSelectionModel(journeyTypeParams, updateReservationResponse, journey);

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.changeSeatPicket,
        _clear: true,
        data: saveSelectionObjData
      });
    } catch (error) { console.log(error); }

  }

  setGAObjectsForSaveSeatSelectionModel(journeyTypeParams, updateReservationResponse: UpdateReservationResponseDto, journey: JourneyDetail) {
    if (journey) {
      const saveSelectionItemObj: DataLayerChangeSeatItemType = new DataLayerChangeSeatItemType();
      const seatFeaturesItemObj: SeatFeatures = new SeatFeatures();
      let selectedJourney = journeyTypeParams.isOutWardJourney ? journeyTypeParams.outwardJourneyDetail : journeyTypeParams.returnJourneyDetail;
      let [getCoachValue, getSeatValue] = this.getOriginalCoachAndSeat(updateReservationResponse);
      let [getNewCoachValue, getNewSeatValue] = this.getNewCoachAndSeat(updateReservationResponse);
      let [origin, destination] = this.getOriginAndDestinationForSaveSelectionSeatPicker(journeyTypeParams.isOutWardJourney, journey);
      saveSelectionItemObj.screen_name = this.ga4ItemListEnum.seatPickerScreenName;
        saveSelectionItemObj.action = this.ga4ItemListEnum.saveSelectionAction;
      saveSelectionItemObj.coach = getNewCoachValue;
      saveSelectionItemObj.seat = getNewSeatValue;
      saveSelectionItemObj.departure_date = selectedJourney.DepartureTime ? (new Date(`${selectedJourney.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
      saveSelectionItemObj.return_date = selectedJourney.ArrivalTime ? (new Date(`${selectedJourney.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
      saveSelectionItemObj.journey_duration = this.getDurationTime(selectedJourney);
      saveSelectionItemObj.origin = origin || undefined;
      saveSelectionItemObj.destination = destination || undefined;
      saveSelectionItemObj.travel_class = selectedJourney.TicketClass || undefined;
      saveSelectionItemObj.travel_type = selectedJourney.TicketType || undefined;
      saveSelectionItemObj.travel_route_code = this.getTicktRouteCode(selectedJourney, false);
      saveSelectionItemObj.travel_type_code = selectedJourney.TicketTypeCode || undefined;
      saveSelectionItemObj.journey_type = this.getJourneyTypeForInwardAndOutward(journeyTypeParams);
      saveSelectionItemObj.single_or_return = this.getSingleOrReturnValueForSeatPicker(journeyTypeParams);
      saveSelectionItemObj.number_of_changes = selectedJourney.Changes;
      saveSelectionItemObj.additional_information = undefined;
      saveSelectionItemObj.days_in_advance = Math.abs(this.calculateDiff(selectedJourney.DepartureTime)) || undefined;
      saveSelectionItemObj.railcard_used = this.getRailcardPresenceForReviewBuyData(selectedJourney, false);
      saveSelectionItemObj.railcard_code = saveSelectionItemObj.railcard_used ? this.getRailcardsForReviewBuyData(selectedJourney, false) : undefined;
      saveSelectionItemObj.adult_pax = selectedJourney.NoOfAdult;
      saveSelectionItemObj.child_pax = selectedJourney.NoOfChild;
      saveSelectionItemObj.total_pax = (selectedJourney.NoOfAdult + selectedJourney.NoOfChild);
      saveSelectionItemObj.original_coach = getCoachValue;
      saveSelectionItemObj.original_seat = getSeatValue;
      saveSelectionItemObj.price = journey.JourneyTotalPrice;

      this.getSeatPropertiesItemObj(seatFeaturesItemObj, journeyTypeParams, journey, saveSelectionItemObj);
      saveSelectionItemObj.seat_features = seatFeaturesItemObj;
      return saveSelectionItemObj;
    }
  }

  getOriginAndDestinationForSaveSelectionSeatPicker(isOutWardJourney, journey) {
    let origin = '';
    let destination = '';
    if (isOutWardJourney) {
      origin = journey.Departure.split('(').pop().split(')')[0];
      destination = journey.Arrival.split('(').pop().split(')')[0];
    } else {
      origin = journey.Arrival.split('(').pop().split(')')[0]
      destination = journey.Departure.split('(').pop().split(')')[0]
    }
    return [origin, destination];
  }

  getSingleOrReturnValueForSeatPicker(journeyTypeParams) {
    return (journeyTypeParams.outwardJourneyDetail && journeyTypeParams.returnJourneyDetail) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
  }

  getSeatPropertiesItemObj(seatFeaturesItemObj, journeyTypeParams, journey, saveSelectionItemObj) {
    let [SeatDirection, SeatPosition, SeatType] = journeyTypeParams.isOutWardJourney ? this.getOrganisedOutAndRetSeatInfo(journey.OutwardSeat) : this.getOrganisedOutAndRetSeatInfo(journey.ReturnSeat);
    seatFeaturesItemObj.seat_direction = SeatDirection ? SeatDirection : undefined;
    seatFeaturesItemObj.seat_type = SeatType ? SeatType : undefined;
    seatFeaturesItemObj.window_or_aisle = SeatPosition ? SeatPosition : undefined;
    seatFeaturesItemObj.other_seat_features = SeatType ? SeatType : undefined;
    saveSelectionItemObj.feature = journeyTypeParams.featureUsed;
    saveSelectionItemObj.booking_reference = journeyTypeParams.booking_reference ? journeyTypeParams.booking_reference : undefined;
  }

  getOrganisedOutAndRetSeatInfo(outOrReturnSeat) {
    let SeatDirection = '';
    let SeatPosition = '';
    let SeatType = '';
    if (outOrReturnSeat) {
      outOrReturnSeat.forEach(outwardSeat => {
        if (outwardSeat.Seat.length > 0) {
          outwardSeat.Seat.forEach(bookingSeat => {
            SeatDirection = this.commonServices.getSeatFacing(bookingSeat);
            SeatPosition = this.commonServices.getSeatPosition(bookingSeat);
            SeatType = this.commonServices.getSeatType(bookingSeat);
          });
        }
      });
      return [SeatDirection, SeatPosition, SeatType];
    }
  }

  getOriginalCoachAndSeat(updateReservationResponse) {
    let getCoachValue = '';
    let getSeatValue = '';
    if (updateReservationResponse && updateReservationResponse.Oldcoachar && updateReservationResponse.Oldcoachar.length > 0) {
      updateReservationResponse.Oldcoachar.forEach(originalCoach => {
        getCoachValue = getCoachValue === '' ? originalCoach : (getCoachValue + ", " + originalCoach);
      });
    }
    if (updateReservationResponse && updateReservationResponse.OldSeatAr && updateReservationResponse.OldSeatAr.length > 0) {
      updateReservationResponse.OldSeatAr.forEach(originalSeats => {
        getSeatValue = getSeatValue === '' ? originalSeats : (getSeatValue + ", " + originalSeats);
      });
    }
    return [getCoachValue, getSeatValue];
  }

  getNewCoachAndSeat(updateReservationResponse) {
    let getNewCoachValue = '';
    let getNewSeatValue = '';
    if (updateReservationResponse && updateReservationResponse.NewCoachAr && updateReservationResponse.NewCoachAr.length > 0) {
      updateReservationResponse.NewCoachAr.forEach(originalCoach => {
        getNewCoachValue = getNewCoachValue === '' ? originalCoach : (getNewCoachValue + ", " + originalCoach);
      });
    }
    if (updateReservationResponse && updateReservationResponse.NewseatAr && updateReservationResponse.NewseatAr.length > 0) {
      updateReservationResponse.NewseatAr.forEach(originalSeats => {
        getNewSeatValue = getNewSeatValue === '' ? originalSeats : (getNewSeatValue + ", " + originalSeats);
      });
    }
    return [getNewCoachValue, getNewSeatValue];
  }

  loadGALayerForSuccessfullySaveSeatSelForViewBooking(featureUsed, booking_reference, updateReservationResponse, isOutWardJourney, journey) {
    try {

      const outwardJourneyDetail = journey.OutwardDetails || undefined;
      const returnJourneyDetail = journey.ReturnDetails || undefined;

      let journeyTypeParams = {
        outwardJourneyDetail: outwardJourneyDetail,
        returnJourneyDetail: returnJourneyDetail,
        featureUsed: featureUsed,
        booking_reference: booking_reference,
        isOutWardJourney: isOutWardJourney
      }
      let saveSelectionObjData = this.setGAObjectsForSaveSeatSelForChangeSeat(journeyTypeParams, updateReservationResponse, journey);

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.changeSeatPicket,
        _clear: true,
        data: saveSelectionObjData
      });
    } catch (error) { console.log(error); }

  }

  setGAObjectsForSaveSeatSelForChangeSeat(journeyTypeParams, updateReservationResponse: UpdateReservationResponseDto, journey: BookingDetailsResponseDto) {
    if (journey) {
      const saveSelectionItemObj: DataLayerChangeSeatItemType = new DataLayerChangeSeatItemType();
      const seatFeaturesItemObj: SeatFeatures = new SeatFeatures();
      let selectedJourney = journeyTypeParams.isOutWardJourney ? journeyTypeParams.outwardJourneyDetail : journeyTypeParams.returnJourneyDetail;
      let [getCoachValue, getSeatValue] = this.getOriginalCoachAndSeat(updateReservationResponse);
      let [getNewCoachValue, getNewSeatValue] = this.getNewCoachAndSeat(updateReservationResponse);
      let [origin, destination] = this.getOriginAndDestinationForChangeSeat(journeyTypeParams.isOutWardJourney, journey);
      let return_date = this.getReturnDateForChangeSeat(journeyTypeParams, journey);
      saveSelectionItemObj.screen_name = this.ga4ItemListEnum.seatPickerScreenName;
        saveSelectionItemObj.action = this.ga4ItemListEnum.saveSelectionAction;
      saveSelectionItemObj.coach = getNewCoachValue;
      saveSelectionItemObj.seat = getNewSeatValue;
      saveSelectionItemObj.departure_date = journey.OutwardDeparture ? (new Date(`${journey.OutwardDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
      saveSelectionItemObj.return_date = return_date;
      saveSelectionItemObj.journey_duration = selectedJourney.Duration;
      saveSelectionItemObj.origin = origin || undefined;
      saveSelectionItemObj.destination = destination || undefined;
      saveSelectionItemObj.travel_class = journey.TicketDetail.TicketClass || undefined;
      saveSelectionItemObj.travel_type = journey.TicketDetail.TicketType || undefined;
      saveSelectionItemObj.travel_route_code = this.getTicktRouteCode(selectedJourney, false);
      saveSelectionItemObj.travel_type_code = journey.TicketDetail.TicketTypeCode || undefined;
      saveSelectionItemObj.journey_type = this.getJourneyTypeForInwardAndOutward(journeyTypeParams);
      saveSelectionItemObj.single_or_return = this.getSingleOrReturnValueForSeatPicker(journeyTypeParams);
      saveSelectionItemObj.number_of_changes = selectedJourney.Changes;
      saveSelectionItemObj.additional_information = undefined;
      saveSelectionItemObj.days_in_advance = Math.abs(this.calculateDiff(selectedJourney.DepartureTime)) || undefined;
      saveSelectionItemObj.railcard_code = this.getRailcardsForChangeSeatData(journey.TicketDetail);
      saveSelectionItemObj.railcard_used = this.getRailCardUsedValue(saveSelectionItemObj.railcard_code);
      saveSelectionItemObj.adult_pax = journey.TicketDetail.NoOfAdult || undefined;
      saveSelectionItemObj.child_pax = journey.TicketDetail.NoOfChild || undefined;
      saveSelectionItemObj.total_pax = (journey.TicketDetail.NoOfAdult + journey.TicketDetail.NoOfChild);
      saveSelectionItemObj.original_coach = getCoachValue;
      saveSelectionItemObj.original_seat = getSeatValue;
      saveSelectionItemObj.price = journey.TicketDetail.TotalAmount;

      this.getSeatPropertiesItemObj(seatFeaturesItemObj, journeyTypeParams, journey, saveSelectionItemObj);
      saveSelectionItemObj.seat_features = seatFeaturesItemObj;
      return saveSelectionItemObj;
    }
  }

  getReturnDateForChangeSeat(journeyTypeParams, journey) {
    if (journey) {
      return journeyTypeParams.returnJourneyDetail ? (new Date(`${journey.ReturnDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journey.OutwardDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
    }
  }

  getOriginAndDestinationForChangeSeat(isOutWardJourney, journey) {
    let origin = '';
    let destination = '';
    if (isOutWardJourney) {
      origin = journey.DepartureLocationName.split('(').pop().split(')')[0];
      destination = journey.ArrivalLocationName.split('(').pop().split(')')[0];
    } else {
      origin = journey.ArrivalLocationName.split('(').pop().split(')')[0]
      destination = journey.DepartureLocationName.split('(').pop().split(')')[0]
    }
    return [origin, destination];
  }

  getJourneyTypeForInwardAndOutward(journeyTypeParams) {
    return journeyTypeParams.isOutWardJourney ? this.travelSolutionJourneyTypeEnum.outward : this.travelSolutionJourneyTypeEnum.inward;
  }

  // Method to extract railcard
  getRailcardsForChangeSeatData(ticketDetail) {
    if (!this.railCardListFromStorage) this.getRailCardListFromStorage();
    let railcardsString = '';
    if (this.doesExistRailCardList(ticketDetail)) {
      const railcardsList = this.railCardListFromStorage.Railcard;
      ticketDetail.RailCardList.forEach(railCardList => {
        if (this.checkRailCardName(railCardList)) {
          const cardDetail = railcardsList.filter(card => card.Name === railCardList.RailCard);
          const cardDetailCode = this.getRailCardDetailCode(cardDetail, railCardList);
          const objectKey = this.checkCardDetailLength(cardDetail, cardDetailCode, railCardList)
          railcardsString += ((railcardsString && railcardsString.length > 0) ? `|${objectKey}:${railCardList.RailCardCount}` : `${objectKey}:${railCardList.RailCardCount}`);
        }
      });
    }
    return railcardsString ? railcardsString : undefined;
  }

  getRailCardString(searchRequest: SearchRequestModel){
    if (!this.railCardListFromStorage) this.getRailCardListFromStorage();
    let railCardCodeList = searchRequest.RailCardList.map(item => item.RailCard);
    let matchedRailCardName = this.railCardListFromStorage?.Railcard?.filter(item => railCardCodeList.includes(item.Code))
                                .map(item => item.Name);
    return matchedRailCardName.length > 0 ? matchedRailCardName.join(', ') : undefined;
  }

  checkCardDetailLength(cardDetail, cardDetailCode, railCardList) {
    return (cardDetail && cardDetail.length > 0) ? cardDetailCode : railCardList.RailCard;
  }

  getRailCardDetailCode(cardDetail, railCardList) {
    return cardDetail[0].Code ? cardDetail[0].Code : railCardList.RailCard;
  }

  doesExistRailCardList(ticketDetail) {
    return ticketDetail && this.railCardListFromStorage && this.railCardListFromStorage.Railcard && ticketDetail.RailCardList && ticketDetail.RailCardList.length > 0;
  }

  checkRailCardName(railCardList) {
    return railCardList && railCardList.RailCard && (railCardList.RailCard !== "No Railcard");
  }

  //  *** Refund Summary ***
  loadGALayerForRefundSummaryItems(refundDetailsResponse: RefundDetailsResponseDto, outwardRefundDetailsArray: RefundResponseDetails[], returnRefundDetailsArray: RefundResponseDetails[], eventName, bookingReferenceNumber, selectedAllPassangerParams, isConfirmRefund) {
    try {

      const outwardRefundDetail = refundDetailsResponse.OutwardDetails || undefined;
      const returnRefundDetail = refundDetailsResponse.ReturnDetails || undefined;

      let journeyTypeParams = {
        outwardRefundDetail: outwardRefundDetail,
        returnRefundDetail: returnRefundDetail,
        bookingReferenceNumber: bookingReferenceNumber,
        outwardRefundDetailsArray: outwardRefundDetailsArray,
        returnRefundDetailsArray: returnRefundDetailsArray,
        selectedAllPassangerParams: selectedAllPassangerParams,
        refundDetailsResponse: refundDetailsResponse
      }
      
      window.dataLayer = window.dataLayer || [];
      if (isConfirmRefund) {
        window.dataLayer.push({
          event: eventName,
          transaction_id: bookingReferenceNumber ? bookingReferenceNumber : undefined,
          value: (refundDetailsResponse && refundDetailsResponse.RefundSummary) ? (refundDetailsResponse.RefundSummary.RefundAmount - refundDetailsResponse.RefundSummary.AdminFee) * 1 : undefined,
          currency: this.appConstantsService.currency,
          coupon: refundDetailsResponse.GACouponCode ? refundDetailsResponse.GACouponCode : undefined,
          items: this.getRefundItemsObjForOutwardAndReturn(journeyTypeParams, isConfirmRefund)
        });
      } else {
        window.dataLayer.push({
          event: eventName,
          currency: this.appConstantsService.currency,
          coupon: refundDetailsResponse.GACouponCode ? refundDetailsResponse.GACouponCode : undefined,
          items: this.getRefundItemsObjForOutwardAndReturn(journeyTypeParams, isConfirmRefund)
        });
      }

    } catch (error) { console.log(error); }
  }

  getRefundItemsObjForOutwardAndReturn(journeyTypeParams, isConfirmRefund) {
    let refundItems: DataLayerRefundType[] = [];
    if (journeyTypeParams.outwardRefundDetail && journeyTypeParams.outwardRefundDetailsArray) {
      journeyTypeParams.outwardRefundDetailsArray.forEach((outwardRefundObj, index) => {
        if (outwardRefundObj.Selected) {
          const item: DataLayerRefundType = new DataLayerRefundType();
          let RefundItem: DataLayerTransactionType = this.getItemObjectsOfRefundJourneyDetails(journeyTypeParams.refundDetailsResponse, journeyTypeParams, false, outwardRefundObj, index);
          Object.assign(item, { ...RefundItem });
          this.addAdditionalPropertiesForRefundSummary(journeyTypeParams.refundDetailsResponse, outwardRefundObj, item, journeyTypeParams.selectedAllPassangerParams.IsOutwardAllPassengers, journeyTypeParams.selectedAllPassangerParams.IsReturnAllPassengers, isConfirmRefund, journeyTypeParams);
          refundItems.push(item);
        }
      });
    }

    if (journeyTypeParams.returnRefundDetail && journeyTypeParams.returnRefundDetailsArray) {
      journeyTypeParams.returnRefundDetailsArray.forEach((returnRefundObj, index) => {
        if (returnRefundObj.Selected) {
          const item: DataLayerRefundType = new DataLayerRefundType();
          let RefundItem: DataLayerTransactionType = this.getItemObjectsOfRefundJourneyDetails(journeyTypeParams.refundDetailsResponse, journeyTypeParams, true, returnRefundObj, index);
          Object.assign(item, { ...RefundItem });
          this.addAdditionalPropertiesForRefundSummary(journeyTypeParams.refundDetailsResponse, returnRefundObj, item, journeyTypeParams.selectedAllPassangerParams.IsOutwardAllPassengers, journeyTypeParams.selectedAllPassangerParams.IsReturnAllPassengers, isConfirmRefund, journeyTypeParams);
          refundItems.push(item);
        }
      });
    }
    return refundItems;
  }

  getActiveTabValue(isReturnJourney) {
    return isReturnJourney ? 1 : 0;
  }

  getEndDateForOutAndRetInCaseOfRefund(journeyTypeParams, selectedRefundJourney) {
    return journeyTypeParams.returnRefundDetail ? (new Date(`${journeyTypeParams.returnRefundDetail.ArrivalDateTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${selectedRefundJourney.ArrivalDateTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
  }

  getItemObjectsOfRefundJourneyDetails(refundDetailsResponse, journeyTypeParams, isReturnJourney: boolean, refundObj, _index) {
    const refundItemsObj: DataLayerTransactionType = new DataLayerTransactionType();
    let selectedRefundJourney = isReturnJourney ? journeyTypeParams.returnRefundDetail : journeyTypeParams.outwardRefundDetail;
    let [ticketRouteCode, ticketTypeCode] = this.getTicketRouteAndTypeCodeForRefundEvent(selectedRefundJourney);
    let activeTab = this.getActiveTabValue(isReturnJourney);
    refundItemsObj.item_name = this.getItemNameForDepartAndArrivalLocation(selectedRefundJourney);
    let endDate = this.getEndDateForOutAndRetInCaseOfRefund(journeyTypeParams, selectedRefundJourney);
    refundItemsObj.item_id = this.getIdForEventsForRefund(refundDetailsResponse, selectedRefundJourney, activeTab);
    refundItemsObj.price = this.getRefundTotalPrice(refundDetailsResponse);
    refundItemsObj.quantity = 1;
    refundItemsObj.discount = refundObj.Discount || undefined;
    refundItemsObj.item_brand = selectedRefundJourney.Brand || undefined;
    refundItemsObj.item_category = selectedRefundJourney.TicketClass || undefined;
    refundItemsObj.item_category2 = this.getJourneyTypeForSingleOrReturn(isReturnJourney);
    refundItemsObj.item_category3 = selectedRefundJourney.TicketType || undefined;
    refundItemsObj.item_category4 = undefined;
    refundItemsObj.item_category5 = refundObj.Price ? refundObj.Price : undefined;
    refundItemsObj.item_variant = ('1:' + selectedRefundJourney.DepartureLocationName.split('(').pop().split(')')[0] + '-' + selectedRefundJourney.ArrivalLocationName.split('(').pop().split(')')[0]);
    refundItemsObj.item_list_name = undefined;
    refundItemsObj.item_list_id = undefined;
    refundItemsObj.index = (_index + 1);
    refundItemsObj.origin = selectedRefundJourney.DepartureLocationName.split('(').pop().split(')')[0];
    refundItemsObj.destination = selectedRefundJourney.ArrivalLocationName.split('(').pop().split(')')[0];
    refundItemsObj.start_date = this.datePipe.transform(selectedRefundJourney.DepartureDateTime, 'dd/MM/yy');
    refundItemsObj.end_date = endDate ? endDate : undefined;
    refundItemsObj.duration = this.getDurationTime(selectedRefundJourney);
    refundItemsObj.ticket_route_code = ticketRouteCode || undefined;
    refundItemsObj.ticket_type_code = ticketTypeCode || undefined;
    refundItemsObj.type = isReturnJourney ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    refundItemsObj.single_or_return = this.getJourneyTypeForSingleOrReturn(isReturnJourney);
    refundItemsObj.number_of_changes = selectedRefundJourney.Changes;
    refundItemsObj.additional_information = undefined;
    refundItemsObj.days_in_advance = Math.abs(this.calculateDiff(selectedRefundJourney.DepartureDateTime)) || undefined;
    refundItemsObj.railcard_code = this.getRailcardsForChangeSeatData(selectedRefundJourney);
    refundItemsObj.railcard_used = this.getRailCardUsedValue(refundItemsObj.railcard_code);
    refundItemsObj.adult_pax = refundDetailsResponse.NoOfAdult;
    refundItemsObj.child_pax = refundDetailsResponse.NoOfChild;
    refundItemsObj.total_pax = (refundDetailsResponse.NoOfAdult + refundDetailsResponse.NoOfChild);
    refundItemsObj.operator = this.getTravelSolutionOperatorForCompany(selectedRefundJourney);
    refundItemsObj.travel_extras = this.getTravelExtraNameForRefund(refundObj.TravelExtraName);
    refundItemsObj.discount_type = undefined;
    refundItemsObj.delivery_method = refundDetailsResponse.DeliveryModeName || undefined;
    refundItemsObj.booking_reference = journeyTypeParams.bookingReferenceNumber;

    this.getSomePropertiesForRefundJourneyDetail(refundItemsObj, selectedRefundJourney);

    return refundItemsObj;
  }

  getSomePropertiesForRefundJourneyDetail(refundItemsObj, selectedRefundJourney) {
    refundItemsObj.start_time = selectedRefundJourney.DepartureTime;
    refundItemsObj.end_time = selectedRefundJourney.ArrivalTime ? selectedRefundJourney.ArrivalTime : undefined;
    refundItemsObj.ticket_class = selectedRefundJourney.TicketClass ? selectedRefundJourney.TicketClass : undefined;
    refundItemsObj.ticket_type = selectedRefundJourney.TicketType ? selectedRefundJourney.TicketType : undefined;
  }

  getTravelExtraNameForRefund(travelExtraName) {
    return travelExtraName ? travelExtraName : undefined;
  }

  getRailCardUsedValue(railcard_code) {
    return railcard_code ? true : false;
  }

  getRefundTotalPrice(refundDetailsResponse) {
    if (refundDetailsResponse && refundDetailsResponse.RefundSummary) {
      return refundDetailsResponse.RefundSummary.RefundAmount - refundDetailsResponse.RefundSummary.AdminFee;
    }
    return undefined;
  }

  getJourneyTypeForSingleOrReturn(isReturnJourney) {
    return isReturnJourney ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
  }

  getItemNameForDepartAndArrivalLocation(selectedRefundJourney) {
    if (selectedRefundJourney) {
      return selectedRefundJourney.DepartureLocationName.split('(').pop().split(')')[0] + `-` + selectedRefundJourney.ArrivalLocationName.split('(').pop().split(')')[0];
    }
    return undefined;
  }

  addAdditionalPropertiesForRefundSummary(refundDetailsResponse, refunedJourneyObj, item, IsOutwardAllPassangers, IsReturnAllPassangers, isConfirmRefund, journeyTypeParams) {
    item.refund_date = this.datePipe.transform(new Date(), 'dd/MM/yy');
    item.refund_type = this.getRefundTypeValue(IsOutwardAllPassangers, IsReturnAllPassangers, journeyTypeParams, refundDetailsResponse.ReturnDetails);
    item.refund_item = this.getValueOfRefundItems(refunedJourneyObj);

    if (isConfirmRefund) {
      item.refund_selected = undefined;
      item.fulfillment_type = refundDetailsResponse.DeliveryModeName || undefined;
      item.payment_type = refundDetailsResponse.PaymentMode || undefined;
    }
  }

  getRefundTypeValue(IsOutwardAllPassangers, IsReturnAllPassangers, journeyTypeParams, isReturnJourney) {
    if (isReturnJourney) {
      if (this.checkAllOutAndRetRefund(IsOutwardAllPassangers, IsReturnAllPassangers, journeyTypeParams)) {
        return this.travelSolutionJourneyTypeEnum.fullyRefunded;
      } else {
        return this.travelSolutionJourneyTypeEnum.partiallyRefunded;
      }
    } else {
      if ((IsOutwardAllPassangers) || (!journeyTypeParams.selectedAllPassangerParams.IsOutwardJourneyRefundable && journeyTypeParams.selectedAllPassangerParams.IsAllOutRefunded)) {
        return this.travelSolutionJourneyTypeEnum.fullyRefunded;
      } else {
        return this.travelSolutionJourneyTypeEnum.partiallyRefunded;
      }
    }
  }

  checkAllOutAndRetRefund(IsOutwardAllPassangers, IsReturnAllPassangers, journeyTypeParams) {
    return ((IsOutwardAllPassangers && IsReturnAllPassangers) || (!journeyTypeParams.selectedAllPassangerParams.IsOutwardJourneyRefundable && journeyTypeParams.selectedAllPassangerParams.IsAllOutRefunded) && (!journeyTypeParams.selectedAllPassangerParams.IsReturnJourneyRefundable && journeyTypeParams.selectedAllPassangerParams.IsAllRetRefunded) || (journeyTypeParams.selectedAllPassangerParams.IsReturnJourneyRefundable && journeyTypeParams.selectedAllPassangerParams.IsAllRetRefunded))
  }

  getValueOfRefundItems(refunedJourneyObj) {
    let refund_item = '';
    if (refunedJourneyObj) {
      if (refunedJourneyObj.TravelExtraName) {
        refund_item = refunedJourneyObj.TravelExtraName;
      }
      if (refunedJourneyObj.TravelExtraName && refunedJourneyObj.ReservedSeat) {
        refund_item = `${refund_item}|${refunedJourneyObj.ReservedSeat}`;
      } else if (refunedJourneyObj.ReservedSeat) {
        refund_item = refunedJourneyObj.ReservedSeat;
      }
    }
    return refund_item;
  }

  getTicketRouteAndTypeCodeForRefundEvent(journey) {
    let ticketRouteCode = '';
    let ticketTypeCode = '';
    if (journey) {
      ticketRouteCode = String(journey.ServiceId).slice(-5);
      ticketTypeCode = journey.TicketTypeCode;
    }
    return [ticketRouteCode, ticketTypeCode];
  }

  // for the Item_id property
  getIdForEventsForRefund(refundDetailsResponse, journey, activeTab) {
    try {
      if (journey && refundDetailsResponse) {
        let id = "";
        id += `${journey.DepartureLocationName.split('(').pop().split(')')[0]}-${journey.ArrivalLocationName.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.DepartureDateTime.split(" ");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;

        id += depDateTimeStamp; // service departure timestamp
        id += `-${refundDetailsResponse.NoOfAdult}`;
        id += `-${refundDetailsResponse.NoOfChild}`;
        id += `-${this.getIdMethodForRefund(journey, activeTab)}`;
        return id;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // for the Item_id property
  getIdMethodForRefund(journey, activeTab) {
    if (journey && journey.TravelType === this.bookPassangerAssistEnum.openReturn) {
      return this.travelSolutionJourneyTypeEnum.openReturn;
    } else {
      if (activeTab === 0) {
        return this.travelSolutionJourneyTypeEnum.single;
      }
      return this.travelSolutionJourneyTypeEnum.return;
    }
  }

  //  *** Purchase event on COJ Confirmation ticket ***
  loadGTMDataLayerPurchaseOnCojConfirmationTicket(bookingDetailsResponseDto: BookingDetailsResponseDto) {
    try {

      const outwardJourneyDetails = bookingDetailsResponseDto.OutwardDetails || undefined;
      const returnJourneyDetails = bookingDetailsResponseDto.ReturnDetails || undefined;

      const journeyDeliveryDetail = (bookingDetailsResponseDto.DeliveryDetail && bookingDetailsResponseDto.DeliveryDetail.length > 0) ? bookingDetailsResponseDto.DeliveryDetail[0] : undefined;

      let CojDetailsParams = {
        outwardJourneyDetails: outwardJourneyDetails,
        returnJourneyDetails: returnJourneyDetails,
        journeyDeliveryDetail: journeyDeliveryDetail
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.purchase,
        ecommerce: {
          currency: this.appConstantsService.currency,
          transaction_id: bookingDetailsResponseDto.TicketDetail.BookingReferenceNumber ? bookingDetailsResponseDto.TicketDetail.BookingReferenceNumber : undefined,
          value: (bookingDetailsResponseDto && bookingDetailsResponseDto.TicketDetail && bookingDetailsResponseDto.TicketDetail.TrainTickets) ? (bookingDetailsResponseDto.TicketDetail.TrainTickets) * 1 : undefined,
          coupon: bookingDetailsResponseDto.GACouponCode ? bookingDetailsResponseDto.GACouponCode : undefined,
          payment_type: bookingDetailsResponseDto.PaymentMode ? bookingDetailsResponseDto.PaymentMode : undefined,
          items: this.getOutAndRetObjForCojCOnfirmation(CojDetailsParams, bookingDetailsResponseDto)
        }
      });
    } catch (error) { console.log(error); }
  }

  getOutAndRetObjForCojCOnfirmation(CojDetailsParams, bookingDetailsResponseDto) {
    let purchasedItems: Array<DataLayerTransactionType> = [];
    if (CojDetailsParams.outwardJourneyDetails) {
      let purchaseEventObj = this.getpurchasedItemsObjForCojConfirmation(bookingDetailsResponseDto, CojDetailsParams, false);
      if (purchaseEventObj) purchasedItems.push(purchaseEventObj);
    }
    if (CojDetailsParams.returnJourneyDetails) {
      let purchaseEventObj = this.getpurchasedItemsObjForCojConfirmation(bookingDetailsResponseDto, CojDetailsParams, true);
      if (purchaseEventObj) purchasedItems.push(purchaseEventObj);
    }
    return purchasedItems;
  }

  getpurchasedItemsObjForCojConfirmation(journey, CojDetailsParams, isReturnCase) {
    const CojConfirmationItemsObj: DataLayerTransactionType = new DataLayerTransactionType();
    let selectedJourney = isReturnCase ? CojDetailsParams.returnJourneyDetails : CojDetailsParams.outwardJourneyDetails;
    let selectedJourneyDetail = isReturnCase ? journey.RetTicketDetail : journey.TicketDetail;
    let [startTime, endTime] = this.getStartAndEndTimeForOutAndRet(selectedJourney.TravelDate);
    let activeTab = this.getActiveTabValue(isReturnCase);
    CojConfirmationItemsObj.item_name = this.getItemNameForDepartAndArrivalLocation(journey);
    CojConfirmationItemsObj.item_id = this.getIdForEventsForCoj(journey, activeTab);
    CojConfirmationItemsObj.price = (journey.TicketDetail.TrainTickets * 1) || undefined;
    CojConfirmationItemsObj.quantity = 1;
    CojConfirmationItemsObj.discount = selectedJourneyDetail.DiscountPrice || undefined;
    CojConfirmationItemsObj.item_brand = selectedJourney.Brand || undefined;
    CojConfirmationItemsObj.item_category = selectedJourneyDetail.TicketClass || undefined;
    CojConfirmationItemsObj.item_category2 = this.getJourneyTypeForSingleOrReturn(isReturnCase);
    CojConfirmationItemsObj.item_category3 = selectedJourneyDetail.TicketType || undefined;
    CojConfirmationItemsObj.item_category4 = undefined;
    CojConfirmationItemsObj.item_variant = ('1:' + journey.DepartureLocationName.split('(').pop().split(')')[0] + '-' + journey.ArrivalLocationName.split('(').pop().split(')')[0]);
    CojConfirmationItemsObj.item_list_name = undefined;
    CojConfirmationItemsObj.item_list_id = undefined;
    CojConfirmationItemsObj.index = 1;
    CojConfirmationItemsObj.origin = isReturnCase ? journey.ArrivalLocationName.split('(').pop().split(')')[0] : journey.DepartureLocationName.split('(').pop().split(')')[0];
    CojConfirmationItemsObj.destination = isReturnCase ? journey.DepartureLocationName.split('(').pop().split(')')[0] : journey.ArrivalLocationName.split('(').pop().split(')')[0];
    CojConfirmationItemsObj.duration = selectedJourney.Duration || undefined;
    CojConfirmationItemsObj.single_or_return = this.getJourneyTypeForSingleOrReturn(isReturnCase);
    CojConfirmationItemsObj.number_of_changes = selectedJourney.Changes;
    CojConfirmationItemsObj.additional_information = undefined;
    CojConfirmationItemsObj.days_in_advance = Math.abs(this.calculateDiff(journey.OutwardDeparture)) || undefined;
    CojConfirmationItemsObj.railcard_code = this.getRailcardsForChangeSeatData(selectedJourneyDetail);
    CojConfirmationItemsObj.railcard_used = this.getRailCardUsedValue(CojConfirmationItemsObj.railcard_code);
    CojConfirmationItemsObj.adult_pax = selectedJourneyDetail.NoOfAdult;
    CojConfirmationItemsObj.child_pax = selectedJourneyDetail.NoOfChild;
    CojConfirmationItemsObj.total_pax = (selectedJourneyDetail.NoOfAdult + selectedJourneyDetail.NoOfChild);
    CojConfirmationItemsObj.start_time = startTime || undefined;
    CojConfirmationItemsObj.end_time = endTime || undefined;
    CojConfirmationItemsObj.operator = selectedJourneyDetail.Operator || undefined;

    this.getSomeAdditionalPropertiesForCojConfirmation(CojConfirmationItemsObj, isReturnCase, journey, CojDetailsParams, selectedJourneyDetail, selectedJourney);

    return CojConfirmationItemsObj;
  }

  getSomeAdditionalPropertiesForCojConfirmation(CojConfirmationItemsObj, isReturnCase, journey, CojDetailsParams, selectedJourneyDetail, selectedJourney) {
    let endDate = CojDetailsParams.returnJourneyDetails ? (new Date(`${journey.ReturnDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journey.OutwardDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
    CojConfirmationItemsObj.item_category5 = selectedJourneyDetail.TotalAmountOut || undefined;
    CojConfirmationItemsObj.start_date = isReturnCase ? (new Date(`${journey.ReturnDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journey.OutwardDeparture}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
    CojConfirmationItemsObj.end_date = endDate ? endDate : undefined;
    CojConfirmationItemsObj.type = isReturnCase ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
    CojConfirmationItemsObj.ticket_class = selectedJourneyDetail.TicketClass || undefined;
    CojConfirmationItemsObj.ticket_type = selectedJourneyDetail.TicketType || undefined;
    CojConfirmationItemsObj.travel_extras = this.getTravelExtrasForCoj(isReturnCase, journey);
    CojConfirmationItemsObj.discount_type = undefined;
    CojConfirmationItemsObj.delivery_method = this.getDeliveryModeForCoj(CojDetailsParams);
    CojConfirmationItemsObj.upsell_taken = isReturnCase ? this.getUpsellTaken(journey.ReturnJourneyExtras) : this.getUpsellTaken(journey.OutwardJourneyExtras);
    CojConfirmationItemsObj.upsell_item = (CojConfirmationItemsObj.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItemsForCojConfirmation(isReturnCase, journey) : undefined;
    CojConfirmationItemsObj.feature = this.ga4DatalayeEventNameEnum.changeOfJourney;
    CojConfirmationItemsObj.payment_type = this.getPaymentModeForCoj(journey);
    CojConfirmationItemsObj.booking_reference = selectedJourneyDetail.BookingReferenceNumber || undefined;
    CojConfirmationItemsObj.ticket_route_code = selectedJourney.ServiceId ? String(selectedJourney.ServiceId).slice(-5) : undefined;
    CojConfirmationItemsObj.ticket_type_code = selectedJourneyDetail.TicketTypeCode || undefined;
  }

  getUpsellItemsForCojConfirmation(isReturnCase, journey) {
    return (isReturnCase ? this.getUpsellItem(journey.ReturnJourneyExtras) : this.getUpsellItem(journey.OutwardJourneyExtras));
  }

  getTravelExtrasForCoj(isReturnCase, journey) {
    if (journey) {
      return isReturnCase ? this.getSeatTypeForTravelExtras(journey.ReturnSeat) : this.getSeatTypeForTravelExtras(journey.OutwardSeat);
    }
  }

  getDeliveryModeForCoj(CojDetailsParams) {
    return (CojDetailsParams.journeyDeliveryDetail && CojDetailsParams.journeyDeliveryDetail.DeliveryModeName) ? CojDetailsParams.journeyDeliveryDetail.DeliveryModeName : undefined;
  }

  getPaymentModeForCoj(journey) {
    return journey && journey.PaymentMode ? journey.PaymentMode : undefined;
  }

  // for the Item_id property
  getIdForEventsForCoj(journey, activeTab) {
    try {
      if (journey) {
        let id = "";
        id += `${journey.DepartureLocationName.split('(').pop().split(')')[0]}-${journey.ArrivalLocationName.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.OutwardDeparture.split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;

        id += depDateTimeStamp; // service departure timestamp
        id += `-${journey.TicketDetail.NoOfAdult}`;
        id += `-${journey.TicketDetail.NoOfChild}`;
        id += `-${this.getIdMethodForCoj(journey, activeTab)}`;
        return id;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // for the Item_id property
  getIdMethodForCoj(journey, activeTab) {
    if (journey && journey.JourneyStatus === this.bookPassangerAssistEnum.openReturn) {
      return this.travelSolutionJourneyTypeEnum.openReturn;
    } else {
      if (activeTab === 0) {
        return this.travelSolutionJourneyTypeEnum.single;
      }
      return this.travelSolutionJourneyTypeEnum.return;
    }
  }

  getStartAndEndTimeForOutAndRet(travelDate) {
    let startTime = '';
    let endTime = '';
    if (travelDate) {
      let depDate = travelDate.split(" ");
      let depDateTimeStamp = depDate[3].split("-");
      startTime = depDateTimeStamp[0];
      endTime = depDateTimeStamp[1];
    }
    return [startTime, endTime];
  }

  //  *** Add to cart ***
  loadGADataLayerAddToCartForCoj(CojReviewBuyResponseDto: CojReviewBuyResponse, isBeginCheckout) {
    try {
      let addCartItems: DataLayerViewCartType[] = [];

      if (CojReviewBuyResponseDto && CojReviewBuyResponseDto.Journey && CojReviewBuyResponseDto.Journey.length > 0) {
        for (let [index, journey] of CojReviewBuyResponseDto.Journey.entries()) {
          addCartItems.push(...this.addCartItemForCoj(journey, index, isBeginCheckout));
        }
      }
      window.dataLayer.push({
        event: isBeginCheckout ? this.ga4DatalayeEventNameEnum.beginCheckout : this.ga4DatalayeEventNameEnum.addToCart,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: addCartItems
        }
      });
    } catch (error) { console.log(error); }
  }

  // Method to fetch items for view cart event
  addCartItemForCoj(journey: JourneyDetail, index: number, isBeginCheckout): DataLayerViewCartType[] {
    let addCatrdItemsObjArr: DataLayerViewCartType[] = [];

    const outwardJourneyDetail = journey.OutwardDetail || undefined;
    const returnJourneyDetail = journey.ReturnDetail || undefined;

    let joruneyTypeParams = {
      outwardJourneyDetail: outwardJourneyDetail,
      returnJourneyDetail: returnJourneyDetail
    }

    if (outwardJourneyDetail) {
      const item: DataLayerViewCartType = new DataLayerViewCartType();
      let addCartItem: DataLayerBasketItemType = this.getItemObjectsOfAddCartItemForCoj(journey, joruneyTypeParams, index, false, isBeginCheckout);
      Object.assign(item, { ...addCartItem });
      item.upsell_taken = this.getUpsellTaken(journey.OutwardJourneyExtras);
      item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.OutwardJourneyExtras) : undefined;
      addCatrdItemsObjArr.push(item);
    }

    if (returnJourneyDetail) {
      const item: DataLayerViewCartType = new DataLayerViewCartType();
      let addCartItem: DataLayerBasketItemType = this.getItemObjectsOfAddCartItemForCoj(journey, joruneyTypeParams, index, true, isBeginCheckout);
      Object.assign(item, { ...addCartItem });
      item.upsell_taken = this.getUpsellTaken(journey.ReturnJourneyExtras);
      item.upsell_item = (item.upsell_taken === this.ga4DatalayerConstantEnum.Yes) ? this.getUpsellItem(journey.ReturnJourneyExtras) : undefined;
      addCatrdItemsObjArr.push(item);
    }

    return addCatrdItemsObjArr;
  }

  // Method to get fetch the common data for basket item
  getItemObjectsOfAddCartItemForCoj(journey, joruneyTypeParams, index: number, isReturnJourney, isBeginCheckout): DataLayerBasketItemType {
    if (journey) {
      const addCartItems: DataLayerBasketItemType = new DataLayerBasketItemType();
      let selectedJourney = isReturnJourney ? joruneyTypeParams.returnJourneyDetail : joruneyTypeParams.outwardJourneyDetail;
      let endDate = this.getEndDateForCojReviewBuy(journey, joruneyTypeParams);
      addCartItems.item_name = this.getItemName(journey, isReturnJourney);
      addCartItems.quantity = 1;
      addCartItems.item_category3 = selectedJourney.TicketType; // ! TBC
      addCartItems.item_variant = this.getVariantForReviewBuyData(selectedJourney, addCartItems.item_name);
      addCartItems.index = (index + 1);
      addCartItems.ticket_type = selectedJourney.TicketType;
      addCartItems.additional_information = undefined;
      addCartItems.days_in_advance = Math.abs(this.calculateDiff(selectedJourney.DepartureTime));
      addCartItems.railcard_used = this.getRailcardPresenceForReviewBuyData(selectedJourney, false);
      addCartItems.railcard_code = addCartItems.railcard_used ? this.getRailcardsForReviewBuyData(selectedJourney, false) : undefined;
      addCartItems.ticket_route_code = this.getTicktRouteCode(selectedJourney, false);
      addCartItems.item_brand = selectedJourney.Brand;
      addCartItems.item_category = selectedJourney.TicketClass;
      addCartItems.item_category2 = this.getJourneyTypeForSingleOrReturn(isReturnJourney);
      addCartItems.item_category5 = selectedJourney.CojPrice;
      addCartItems.ticket_class = selectedJourney.TicketClass;
      addCartItems.ticket_type_code = selectedJourney.TicketTypeCode;
      addCartItems.number_of_changes = selectedJourney.Changes;
      addCartItems.operator = this.getTravelSolutionOperatorForCompany(selectedJourney);
      addCartItems.start_date = selectedJourney.DepartureTime ? (new Date(`${selectedJourney.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
      addCartItems.end_date = endDate ? endDate : undefined;
      addCartItems.price = Number(journey.JourneyTotalPrice);
      addCartItems.item_id = this.getJourneyIdForReviewBuyData(addCartItems.item_name, joruneyTypeParams.outwardJourneyDetail, journey, (isReturnJourney ? joruneyTypeParams.returnJourneyDetail : ''));
      addCartItems.single_or_return = this.getJourneyTypeForSingleOrReturn(isReturnJourney);

      this.getSomePropertiesForAddToCartAndCheckout(addCartItems, journey, selectedJourney, isReturnJourney);

      if (isBeginCheckout) {
        this.additionalPropertiesForBeginCheckout(addCartItems, isReturnJourney, journey);
      }
      return addCartItems;
    }
  }

  getSomePropertiesForAddToCartAndCheckout(addCartItems, journey, selectedJourney, isReturnJourney) {
    addCartItems.value = journey.JourneyTotalPrice || undefined;
    addCartItems.start_time = selectedJourney.DepartureTime ? this.datePipe.transform(selectedJourney.DepartureTime, 'HH:mm') : undefined;
    addCartItems.end_time = selectedJourney.ArrivalTime ? this.datePipe.transform(selectedJourney.ArrivalTime, 'HH:mm') : undefined;
    addCartItems.adult_pax = journey.Adult;
    addCartItems.child_pax = journey.Child;
    addCartItems.total_pax = (journey.Adult) + (journey.Child);
    addCartItems.duration = this.getDurationTime(selectedJourney);
    addCartItems.origin = (isReturnJourney ? journey.Arrival : journey.Departure);
    addCartItems.destination = (isReturnJourney ? journey.Departure : journey.Arrival);
    addCartItems.feature = this.ga4DatalayeEventNameEnum.changeOfJourney;
    addCartItems.booking_reference = localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber);
    addCartItems.type = isReturnJourney ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
  }

  getEndDateForCojReviewBuy(journey, joruneyTypeParams) {
    return journey && journey.ReturnDetail ? (new Date(`${joruneyTypeParams.returnJourneyDetail.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${joruneyTypeParams.outwardJourneyDetail.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
  }

  additionalPropertiesForBeginCheckout(addCartItems, isReturnJourney, journey) {
    addCartItems.travel_extras = isReturnJourney ? this.getSeatTypeForTravelExtras(journey.ReturnSeat) : this.getSeatTypeForTravelExtras(journey.OutwardSeat);
    const journeyDeliveryDetail = (journey.DeliveryDetail && journey.DeliveryDetail.length > 0) ? journey.DeliveryDetail[0] : undefined;
    addCartItems.delivery_method = (journeyDeliveryDetail && journeyDeliveryDetail.DeliveryModeName) ? journeyDeliveryDetail.DeliveryModeName : undefined;
  }

  //#region COJ GA4 Data layer events

  loadGA4DataLayerOnCOJSearch(cojDataLayerSearchObject, activeTab, cheapestTravelSolutionIds, outwardSelectedFare, returnSelectedFare) {
    this.cheapestArr = cheapestTravelSolutionIds;
    let journetType = this.getJourneyType(cojDataLayerSearchObject.searchRequest);
    let viaAvoidStation =  this.getViaAvoidStation(cojDataLayerSearchObject.searchRequest);
    let currentdate = moment.utc(new Date()).tz('Europe/London');
    let selectedDate = moment.utc(cojDataLayerSearchObject.searchRequest.DepartureTimesStart).tz('Europe/London');
    let daysInAdvance = Math.abs(currentdate.diff(selectedDate, 'days'));
    let outboundDate = this.datePipe.transform(cojDataLayerSearchObject.searchRequest.DepartureTimesStart, 'dd/MM/yyyy');
    let outboundTime = this.datePipe.transform(cojDataLayerSearchObject.searchRequest.DepartureTimesStart, 'HH:mm');
    let [returnDate, returnTime] = this.getReturnDateAndTime(cojDataLayerSearchObject.searchRequest);
    let railCards = {};
    let searchTerm = `${cojDataLayerSearchObject.searchRequest.DepartureLocationName.split('(').pop().split(')')[0]}-${cojDataLayerSearchObject.searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]}`;
    if (cojDataLayerSearchObject.searchRequest && cojDataLayerSearchObject.searchRequest.RailCardList && cojDataLayerSearchObject.searchRequest.RailCardList.length > 0) {
      cojDataLayerSearchObject.searchRequest.RailCardList.forEach((obj, index) => {
        let type = 'type' + (index + 1);
        let quantity = 'quantity' + (index + 1);
        let railCardName = this.checkRailCardNameForCOJ(cojDataLayerSearchObject.searchRequest, obj);
        let obj_string = `{"` + type + `"` + ':' + `"` + railCardName + `"` + ',' + `"` + quantity + `"` + ':' + `"` + obj.RailCardCount + `"}`;
        let object = JSON.parse(obj_string);
        railCards = { ...railCards, ...object };
      });
    }
    let dataLayerItemsOnSearch = {
      journetType:journetType, viaAvoidStation:viaAvoidStation, daysInAdvance:daysInAdvance, outboundDate:outboundDate, outboundTime:outboundTime, returnDate:returnDate, returnTime:returnTime, searchTerm:searchTerm, railCards:railCards
    }
    //event for modify default
    this.setDataLayerOnCOJSearch(cojDataLayerSearchObject, dataLayerItemsOnSearch, outboundDate, returnDate);
    //event for view item list
    this.setListOfItemsForNonSeasonCOJ(cojDataLayerSearchObject.searchRequest, cojDataLayerSearchObject.searchResponse, activeTab, outwardSelectedFare, returnSelectedFare);
    window.dataLayer.push({
      event: this.ga4DatalayeEventNameEnum.viewItemList,
      ecommerce: {
        currency: this.appConstantsService.currency,
        items: this.Services,
      }
    });
  }

  setListOfItemsForNonSeasonCOJ(searchRequest, searchResponse, activeTab, outwardSelectedFare, returnSelectedFare) {
    this.Services = [];
    if(!this.isUpgradeEvent){
      this.isReturnJourney = false;
    }    
    if (searchResponse) {
      this.outwardTravelSolIds = searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
      this.getTicketForCOJ(searchResponse.TravelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare);
      

      if (searchResponse.RetTravelSolutions) {
        this.isReturnJourney = true;
        this.inwardTravelSolIds = searchResponse.RetTravelSolutions.map(solution => solution.TravelSolId);
        this.getTicketForCOJ(searchResponse.RetTravelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare);
      }
    }
  }

  getTicketForCOJ(travelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare) {
    if (!travelSolutions && travelSolutions.length > 0) {
      return;
    }
    travelSolutions.forEach((travelSolution, index) => {
      let diffOfDates = Math.abs(this.calculateDiff(travelSolution.DepartureDate));
      let [ticketRoutecode, ticketTypeCode] = this.getTicketRouteAndTypeCode(travelSolution);

      let item = {
        item_name: travelSolution.DepartureTime.split('(').pop().split(')')[0] + `-` + travelSolution.ArrivalTime.split('(').pop().split(')')[0],
        item_id: this.getIdForEvents(travelSolution, searchRequest, activeTab),
        price: this.getPriceForItem(travelSolution, activeTab),
        item_brand: this.setUndefinedForBlankValueInVariable(travelSolution.Brand),
        item_category: this.getTicketClass(outwardSelectedFare, returnSelectedFare, this.isReturnJourney),
        item_category2: this.getJourneyType(searchRequest),
        item_category3: this.getTicketType(outwardSelectedFare, returnSelectedFare, this.isReturnJourney),
        item_category5: this.ga4DatalayerConstantEnum.Fare,
        item_variant: this.getVariant(travelSolution),
        item_list_name: this.setUndefinedForBlankValueInVariable(this.ga4ItemListEnum.resultPageItemListName),
        item_list_id: this.setUndefinedForBlankValueInVariable(this.ga4ItemListEnum.resultPageImpressionItemListId),
        index: (index + 1),
        start_date: new Date(travelSolution.DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
        end_date: new Date(travelSolution.ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
        duration: this.getDurationTime(travelSolution),
        ticket_class: this.getTicketClass(outwardSelectedFare, returnSelectedFare, this.isReturnJourney),
        ticket_type: this.getTicketType(outwardSelectedFare, returnSelectedFare, this.isReturnJourney),
        ticket_route_code: this.setUndefinedForBlankValueInVariable(ticketRoutecode),
        ticket_type_code: this.setUndefinedForBlankValueInVariable(ticketTypeCode),
        type: this.getJourneyType(searchRequest),
        single_or_return: this.isReturnJourney ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
        number_of_changes: travelSolution.Changes,
        additional_information: this.isCheapestTravelSolution(travelSolution),
        days_in_advance: this.setUndefinedForBlankValueInVariable(diffOfDates),
        railcard_code: this.getRailCardCode(searchRequest),
        railcard_used: this.isRailCardPresent,
        adult_pax: searchRequest.Adult,
        child_pax: searchRequest.Child,
        total_pax: (searchRequest.Adult + searchRequest.Child),
        start_time: this.setUndefinedForBlankValueInVariable(travelSolution.DepartureTime.split('(')[0].trim()),
        end_time: this.setUndefinedForBlankValueInVariable(travelSolution.ArrivalTime.split('(')[0].trim()),
        operator: this.getTravelSolutionOperatorForCompany(travelSolution),
        feature: this.ga4DatalayeEventNameEnum.changeOfJourney,
        booking_reference: localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber)
      }
      this.Services.push(item);
    });
  }

  setDataLayerOnCOJSearch(cojDataLayerSearchObject, dataLayerItemsOnSearch, outboundDate, returnDate) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.eventNameOfSearchCOJ),
      feature: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.changeOfJourney),
      search_term: this.setUndefinedForBlankValueInVariable(dataLayerItemsOnSearch.searchTerm),
      origin: this.setUndefinedForBlankValueInVariable(cojDataLayerSearchObject.searchRequest.DepartureLocationName.split('(').pop().split(')')[0]),
      destination: this.setUndefinedForBlankValueInVariable(cojDataLayerSearchObject.searchRequest.ArrivalLocationName.split('(').pop().split(')')[0]),
      journey_via: this.setUndefinedForBlankValueInVariable(this.getJourneyViaAndAvoid(cojDataLayerSearchObject.searchRequest.PathConstraintType, 'VIA', dataLayerItemsOnSearch.viaAvoidStation)),
      journey_avoid: this.setUndefinedForBlankValueInVariable(this.getJourneyViaAndAvoid(cojDataLayerSearchObject.searchRequest.PathConstraintType, 'AVOID', dataLayerItemsOnSearch.viaAvoidStation)),
      outbound_time: this.setUndefinedForBlankValueInVariable(dataLayerItemsOnSearch.outboundTime),
      outbound_timing: this.setUndefinedForBlankValueInVariable(this.setOutBoundTimeAndReturnTime(cojDataLayerSearchObject.TravelType)),
      return_time: this.setUndefinedForBlankValueInVariable(dataLayerItemsOnSearch.returnTime),
      return_timing: this.setUndefinedForBlankValueInVariable(this.setOutBoundTimeAndReturnTime(cojDataLayerSearchObject.TravelType)),
      days_in_advance: this.setUndefinedForBlankValueInVariable(dataLayerItemsOnSearch.daysInAdvance),
      total_pax: (cojDataLayerSearchObject.searchRequest.Adult + cojDataLayerSearchObject.searchRequest.Child),
      adult_pax: cojDataLayerSearchObject.searchRequest.Adult,
      child_pax: cojDataLayerSearchObject.searchRequest.Child,
      search_source: this.setUndefinedForBlankValueInVariable(cojDataLayerSearchObject.ga4SearchEventParam.searchSource),
      success: this.setUndefinedForBlankValueInVariable(cojDataLayerSearchObject.ga4SearchEventParam.searchSuccess),
      search_error: this.setUndefinedForBlankValueInVariable(cojDataLayerSearchObject.ga4SearchEventParam.searchError),
      type: this.setUndefinedForBlankValueInVariable(dataLayerItemsOnSearch.journetType),
      railcard_present: this.getRailCardBookingValue(cojDataLayerSearchObject.searchRequest),
      railcard_used: this.setUndefinedForBlankValueInVariable(dataLayerItemsOnSearch.railCards),
      booking_reference: localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber),
      start_date: outboundDate,
      end_date: returnDate ? returnDate : outboundDate,
      duration: undefined
    });
  }

  getViaAvoidStation(searchRequest) {
    let viaAvoidStation = '';
    if (searchRequest.PathConstraintLocation && this.sharedService.locationMasterData != null
      && this.sharedService.locationMasterData.length > 0) {
      let location = this.sharedService.locationMasterData.filter(x => x.Id == searchRequest.PathConstraintLocation);
      if (location)
        viaAvoidStation = location[0].Name.split('(').pop().split(')')[0];
    }
    return viaAvoidStation;
  }

  // for get return date & return time
  getReturnDateAndTime(searchRequest) {
    let returnDate = '';
    let returnTime = '';
    if (searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.forward) {
      returnDate = this.datePipe.transform(searchRequest.ReturnTimesStart, 'dd/MM/yyyy');
      returnTime = this.datePipe.transform(searchRequest.ReturnTimesStart, 'HH:mm');
    }
    return [returnDate, returnTime];
  }

  // get the via or avoid station 
  getJourneyViaAndAvoid(pathConstraintType, viaAvoidstr, viaAvoidStation) {
    if (pathConstraintType == viaAvoidstr) {
      return viaAvoidStation;
    }
    return '';
  }

  checkRailCardNameForCOJ(searchRequest, obj) {
    let railCardName = null;
    if (searchRequest.hasOwnProperty(this.travelSolutionJourneyTypeEnum.isSeason)) {
      let railCardsSeasonList = this.railCardsSeasonList;
      railCardName = railCardsSeasonList.filter(x => x.Code == obj.RailCard).length > 0 ? railCardsSeasonList.filter(x => x.Code == obj.RailCard)[0].Name : obj.RailCard;
    }
    else {
      let railCardFromStorage = JSON.parse(localStorage.getItem(this.travelSolutionJourneyTypeEnum.railcardStationListText));
      if (railCardFromStorage)
        this.railCardsList = railCardFromStorage.Railcard;
      railCardName = this.railCardsList.filter(x => x.Code == obj.RailCard).length > 0 ? this.railCardsList.filter(x => x.Code == obj.RailCard)[0].Name : obj.RailCard;
    }
    return railCardName;
  }

  getRailCardBookingValue(searchRequest): boolean {
    if (searchRequest && searchRequest.RailCardList && searchRequest.RailCardList.length > 0) {
      return true;
    }
    return false;
  }

  // *** PICO-1870 For Select_Item Event *** 
  loadGA4selectItemForCOJ(journeySummaryModel: JourneySummaryModel, activeTab: number, searchRequest: SearchRequestModel) {
    try {
      let itemObj: Array<COJDataLayerSelectItemType> = [];
      let outwardSelectedJourney: TravelSolutionModel = journeySummaryModel.SingleChoosedTravelSolution;
      let returnSelectedJourney: TravelSolutionModel = journeySummaryModel.ReturnChoosedTravelSolution;
      activeTab = returnSelectedJourney ? activeTab : 0;

      if (outwardSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.SingleRouteModel);
        let selectItem = this.setGAObjectsForSelectItemServiceModelForCOJ(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, false, activeTab, company);
        itemObj.push(selectItem);
      }
      if (returnSelectedJourney) {
        let company = this.getTravelSolutionOperatorForCompany(journeySummaryModel.ReturnRouteModel);
        let selectItem = this.setGAObjectsForSelectItemServiceModelForCOJ(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, true, activeTab, company);
        itemObj.push(selectItem);
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.selectItem,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: itemObj,
        }
      });
    } catch (error) { console.log(error); }
  }

  setGAObjectsForSelectItemServiceModelForCOJ(searchRequest: SearchRequestModel, outwardSelectedJourney: TravelSolutionModel, returnSelectedJourney: TravelSolutionModel, journeySummaryModel: JourneySummaryModel, isReturnCase: boolean, activeTab, company) {
    try {
      const selectItemObj: COJDataLayerSelectItemType = new COJDataLayerSelectItemType();

      let selectedJourney = isReturnCase ? returnSelectedJourney : outwardSelectedJourney;
      let diffOfDates = Math.abs(this.calculateDiff(selectedJourney.DepartureDate));
      let [ticketRouteCode, ticketTypeCode] = this.getTicketRouteAndTypeCodeForSelectEvent(journeySummaryModel,isReturnCase, activeTab);


      selectItemObj.item_name = selectedJourney.DepartureTime.split('(').pop().split(')')[0] + `-` + selectedJourney.ArrivalTime.split('(').pop().split(')')[0];
      selectItemObj.item_id = this.getIdForEvents(selectedJourney, searchRequest, activeTab);
      selectItemObj.price = this.getPrice(isReturnCase, activeTab, journeySummaryModel);
      selectItemObj.item_brand = selectedJourney.Brand;
      selectItemObj.item_category = this.getTicketClass(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase, activeTab);
      selectItemObj.item_category2 = isReturnCase ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
      selectItemObj.item_category3 = this.getTicketType(journeySummaryModel.SingleSelectedFare, journeySummaryModel.ReturnSelectedFare, isReturnCase, activeTab);
      selectItemObj.item_category5 = this.ga4DatalayerConstantEnum.Fare;
      selectItemObj.item_variant = this.getVariant(selectedJourney);
      selectItemObj.item_list_name = this.ga4ItemListEnum.resultPageItemListName;
      selectItemObj.item_list_id = this.ga4ItemListEnum.resultsPageSelectionItemListId ;
      selectItemObj.index = undefined;
      selectItemObj.start_date = (new Date(`${selectedJourney.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      selectItemObj.end_date = (new Date(`${selectedJourney.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
      selectItemObj.duration = this.getDurationTime(selectedJourney);
      selectItemObj.ticket_route_code = this.setUndefinedForBlankValueInVariable(ticketRouteCode);
      selectItemObj.ticket_type_code = this.setUndefinedForBlankValueInVariable(ticketTypeCode);
      selectItemObj.type = isReturnCase ? this.travelSolutionJourneyTypeEnum.inward : this.travelSolutionJourneyTypeEnum.outward;
      selectItemObj.single_or_return = (outwardSelectedJourney && returnSelectedJourney) ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
      selectItemObj.number_of_changes = selectedJourney.Changes;
      selectItemObj.additional_information = undefined;
      selectItemObj.days_in_advance = this.setUndefinedForBlankValueInVariable(diffOfDates);
      selectItemObj.railcard_code = this.getRailCardCode(searchRequest);
      selectItemObj.railcard_used = this.isRailCardPresent;
      selectItemObj.adult_pax = searchRequest.Adult;
      selectItemObj.child_pax = searchRequest.Child;
      selectItemObj.total_pax = (searchRequest.Adult + searchRequest.Child);
      selectItemObj.start_time = selectedJourney.DepartureTime.split('(')[0].trim();
      selectItemObj.end_time = selectedJourney.ArrivalTime.split('(')[0].trim();
      selectItemObj.operator = this.setUndefinedForBlankValueInVariable(company);
      selectItemObj.feature= this.ga4DatalayeEventNameEnum.changeOfJourney;
      selectItemObj.booking_reference= localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber);
      return selectItemObj;
    } catch (error) {
      console.log(error);
    }
  }

  setOutBoundTimeAndReturnTime(value) {
    return value == this.travelSolutionJourneyTypeEnum.travelType ? this.travelSolutionJourneyTypeEnum.departTravelTypeText : this.travelSolutionJourneyTypeEnum.arriveByTravelTypeText;
  }
  //#endregion

  // PICO-3036 load GA4 data layer for Book Passenger assist on view booking & confirmation page
  loadGALayerForBookPassangerAssist(destinationUrl, currentUrl) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          category: this.ga4DatalayeEventNameEnum.passengerAssistCategory,
          action: this.ga4DatalayeEventNameEnum.outboundClick,
          cta_name: this.ga4DatalayeEventNameEnum.bookPassengerAssistCTA,
          cta_id: undefined,
          referring_page: currentUrl ? currentUrl : undefined,
          destination_page: destinationUrl ? destinationUrl : undefined,
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.passengerAssistEvent,
      });
    } catch (error) { console.log(error); }
  }

  // PICO-3039 load GA4 data layer for Club Avanti on registration page
  loadGALayerForClubAvanti(action, errorMessage?) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: this.loadGALayerEventForClubAvantiItemObj(action, errorMessage),
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.clubAvantiEvent,
      });
    } catch (error) { console.log(error); }
  }

  loadGALayerEventForClubAvantiItemObj(action, errorMessage) {
    const clubAvantiItemObj: DataLayerClubAvantiType = new DataLayerClubAvantiType();
    clubAvantiItemObj.action = action;
    clubAvantiItemObj.feature = this.ga4DatalayeEventNameEnum.clubAvantiFeature;
    if (errorMessage) {
      clubAvantiItemObj.message = errorMessage ? errorMessage : undefined;
    }
    return clubAvantiItemObj;
  }

  // PICO-3061 load GA4 data layer for Standalone bike reservation on view booking page
  loadGALayerForStandaloneBikeReservation(action, bookingReferenceNumber, collectionReferenceNo?) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: this.setGAObjForStandaloneBikeReservationItemObj(action, bookingReferenceNumber, collectionReferenceNo),
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.bikeReservation,
      });
    } catch (error) { console.log(error); }
  }

  setGAObjForStandaloneBikeReservationItemObj(action, bookingReferenceNumber, collectionReferenceNo) {
    const bikeReservationItemObj: DataLayerStandaloneBikeReservation = new DataLayerStandaloneBikeReservation();
    bikeReservationItemObj.action = action;
    bikeReservationItemObj.feature = this.ga4DatalayeEventNameEnum.featureBooking;
      bikeReservationItemObj.booking_reference = bookingReferenceNumber ? bookingReferenceNumber : undefined;
    if (collectionReferenceNo) {
      bikeReservationItemObj.collection_reference = collectionReferenceNo ? collectionReferenceNo : undefined;
    }
    return bikeReservationItemObj;
  }

  //#region Track My Train data layer events

  // PICO-3041 load GA4 data layer for track my train when user taps on the track my train button on booking list screen
  loadGALayerForTrackMyTrainClick(trackMyTrain, journeyDetail, ticketInfo, isReturnJourney){
    try {
      let diffOfDates = Math.abs(this.calculateDiff(isReturnJourney ? journeyDetail?.ReturnDepartureDate : journeyDetail?.DepartureDate));
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          name: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainCategoryName),
          id: undefined,
          category: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainCategoryName),
          status: this.statusOfTrain(trackMyTrain?.TrainLiveStatus),
          action: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainBtnOnClickAction),
          referring_page: undefined,
          destination_page : undefined,
          origin: this.setUndefinedForBlankValueInVariable(trackMyTrain?.TrainLiveInfo?.OriginStationName),
          destination: this.setUndefinedForBlankValueInVariable(trackMyTrain?.TrainLiveInfo?.DestinationStationName),
          start_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnDepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          end_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          days_in_advance: diffOfDates,
          adult_pax: ticketInfo?.AdultCount,
          child_pax: ticketInfo?.ChildCount,
          total_pax: ticketInfo?.AdultCount + ticketInfo?.ChildCount,
          start_time: ticketInfo?.DepartureTime,
          end_time: ticketInfo?.ArrivalTime,
          ticket_type: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketType),
          ticket_route_code: undefined,
          ticket_type_code: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketTypeCode),
          type: journeyDetail?.OutwardTicketInfo ? this.travelSolutionJourneyTypeEnum.outward : this.travelSolutionJourneyTypeEnum.inward,
          single_or_return: journeyDetail.ReturnTicketInfo ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
          number_of_changes: trackMyTrain?.TrackMyJourneyInfoList?.length - 1,
          message: this.setMessageInCaseOfDelayOrCancelTrain(trackMyTrain?.TrainLiveInfo)
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.trackYourTrainEventName,
      })
    }
    catch(error) {
      console.log(error);
    }
  }

  // PICO-3041 load GA4 data layer for track my train when user taps on the read more button when the user is in the TMT popup screen
  loadGA4LayerForTrackMyTrainReadMoreClick(trackMyTrain, journeyDetail, ticketInfo, isReturnJourney){
    try{
      let diffOfDates = Math.abs(this.calculateDiff(isReturnJourney ? journeyDetail?.ReturnDepartureDate : journeyDetail?.DepartureDate));
      window.dataLayer =  window.dataLayer || [];
      window.dataLayer.push({
        data : {
          name : this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainReadMoreBtnClickAction.replace(/^./, this.ga4DatalayeEventNameEnum.trackYourTrainReadMoreBtnClickAction[0].toUpperCase())),
          id: undefined,
          status: this.statusOfTrain(trackMyTrain?.TrainLiveStatus),
          action : this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainReadMoreBtnClickAction),
          category: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainCategoryName),
          referring_page : undefined,
          destination_page : undefined,
          origin: this.setUndefinedForBlankValueInVariable(trackMyTrain?.TrainLiveInfo?.OriginStationName),
          destination: this.setUndefinedForBlankValueInVariable(trackMyTrain?.TrainLiveInfo?.DestinationStationName),
          start_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnDepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          end_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          days_in_advance: diffOfDates,
          adult_pax: ticketInfo?.AdultCount,
          child_pax: ticketInfo?.ChildCount,
          total_pax: ticketInfo?.AdultCount + ticketInfo?.ChildCount,
          start_time: ticketInfo?.DepartureTime,
          end_time: ticketInfo?.ArrivalTime,
          ticket_type: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketType),
          ticket_route_code: undefined,
          ticket_type_code: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketTypeCode),
          type: journeyDetail?.OutwardTicketInfo ? this.travelSolutionJourneyTypeEnum.outward : this.travelSolutionJourneyTypeEnum.inward,
          single_or_return: journeyDetail.ReturnTicketInfo ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
          number_of_changes: trackMyTrain?.TrackMyJourneyInfoList?.length - 1,
          message: this.setMessageInCaseOfDelayOrCancelTrain(trackMyTrain?.TrainLiveInfo)
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.trackYourTrainEventName,
      })
    } catch(error) {
      console.log(error);
    }
  }

  // PICO-3041 load GA4 data layer for track my train when user taps on the read less button when the user is in the TMT popup screen
  loadGA4LayerForTrackMyTrainReadLessClick(trackMyTrain, journeyDetail, ticketInfo, isReturnJourney){
    try {
      let diffOfDates = Math.abs(this.calculateDiff(isReturnJourney ? journeyDetail?.ReturnDepartureDate : journeyDetail?.DepartureDate));
      window.dataLayer =  window.dataLayer || [];
      window.dataLayer.push({
        data: {
          name : this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainReadLessBtnClickAction.replace(/^./, this.ga4DatalayeEventNameEnum.trackYourTrainReadLessBtnClickAction[0].toUpperCase())),
          id: undefined,
          status: this.statusOfTrain(trackMyTrain?.TrainLiveStatus),
          action : this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainReadLessBtnClickAction),
          category: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainCategoryName),
          referring_page : undefined,
          destination_page : undefined,
          origin: this.setUndefinedForBlankValueInVariable(trackMyTrain?.TrainLiveInfo?.OriginStationName),
          destination: trackMyTrain?.TrainLiveInfo?.DestinationStationName ? trackMyTrain?.TrainLiveInfo?.DestinationStationName : undefined,
          start_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnDepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          end_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          days_in_advance: diffOfDates,
          adult_pax: ticketInfo?.AdultCount,
          child_pax: ticketInfo?.ChildCount,
          total_pax: ticketInfo?.AdultCount + ticketInfo?.ChildCount,
          start_time: ticketInfo?.DepartureTime,
          end_time: ticketInfo?.ArrivalTime,
          ticket_type: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketType),
          ticket_route_code: undefined,
          ticket_type_code: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketTypeCode),
          type: journeyDetail?.OutwardTicketInfo ? this.travelSolutionJourneyTypeEnum.outward : this.travelSolutionJourneyTypeEnum.inward,
          single_or_return: journeyDetail.ReturnTicketInfo ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
          number_of_changes: trackMyTrain?.TrackMyJourneyInfoList?.length - 1,
          message: this.setMessageInCaseOfDelayOrCancelTrain(trackMyTrain?.TrainLiveInfo)
      
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.trackYourTrainEventName
      })
    } catch(error) {
      console.log(error);
    }
  }

  // PICO-3041 load GA4 data layer for track my train when user taps on the close button when the user is in the TMT popup screen
  loadGA4LayerForCloseTrackMyTrainScreen(trackMyTrain, journeyDetail,ticketInfo, isReturnJourney){
    try {
      let diffOfDates = Math.abs(this.calculateDiff(isReturnJourney ? journeyDetail?.ReturnDepartureDate : journeyDetail?.DepartureDate));
      window.dataLayer =  window.dataLayer || [];
      window.dataLayer.push({
        data: {
          name : this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainCloseBtnClickAction.replace(/^./, this.ga4DatalayeEventNameEnum.trackYourTrainCloseBtnClickAction[0].toUpperCase())),
          id: undefined,
          status: this.statusOfTrain(trackMyTrain?.TrainLiveStatus),
          action : this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainCloseBtnClickAction),
          category: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.trackYourTrainCategoryName),
          referring_page : undefined,
          destination_page : undefined,
          origin: this.setUndefinedForBlankValueInVariable(trackMyTrain?.TrainLiveInfo?.OriginStationName),
          destination: this.setUndefinedForBlankValueInVariable(trackMyTrain?.TrainLiveInfo?.DestinationStationName),
          start_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnDepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.DepartureDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          end_date: isReturnJourney ? (new Date(`${journeyDetail?.ReturnArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${journeyDetail?.ArrivalDate}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
          days_in_advance: diffOfDates,
          adult_pax: ticketInfo?.AdultCount,
          child_pax: ticketInfo?.ChildCount,
          total_pax: ticketInfo?.AdultCount + ticketInfo?.ChildCount,
          start_time: ticketInfo?.DepartureTime,
          end_time: ticketInfo?.ArrivalTime,
          ticket_type: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketType),
          ticket_route_code: undefined,
          ticket_type_code: this.setUndefinedForBlankValueInVariable(ticketInfo?.TicketTypeCode),
          type: journeyDetail?.OutwardTicketInfo ? this.travelSolutionJourneyTypeEnum.outward : this.travelSolutionJourneyTypeEnum.inward,
          single_or_return: journeyDetail.ReturnTicketInfo ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
          number_of_changes: trackMyTrain?.TrackMyJourneyInfoList?.length - 1,
          message: this.setMessageInCaseOfDelayOrCancelTrain(trackMyTrain?.TrainLiveInfo)
      
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.trackYourTrainEventName
      })
    } catch(error) {
      console.log(error);
    }
  }

  statusOfTrain(trainStatus){
    let finalTrainStatus;
    if(trainStatus.IsCancelled){
      finalTrainStatus = this.trackMyTrainEnum.trainCancelledText;
    } else if(trainStatus.IsDelayed){
      finalTrainStatus = this.trackMyTrainEnum.trainDelayedText;
    } else{
      finalTrainStatus = this.trackMyTrainEnum.trainOnTimeText;
    }
    return finalTrainStatus ? finalTrainStatus : undefined;
  }

  setMessageInCaseOfDelayOrCancelTrain(trainLiveInfo){
    let message;
    if(trainLiveInfo.IsCancelled){
      trainLiveInfo.CancelReason.forEach(m => {
        if(trainLiveInfo.CancelReason.length > 1){
          message = message + `| ${m.DisruptionReason}`
        } else{
          message = `${m.DisruptionReason}`
        }
      });
    } else if(trainLiveInfo.IsDelayed){
      trainLiveInfo.DelayReason.forEach(m => {
        if(trainLiveInfo.DelayReason.length > 1){
          message = message + `| ${m.DisruptionReason}`
        } else{
          message = `${m.DisruptionReason}`
        }
      });
    }
    return message ? message : undefined;
  }

  //#endregion

  // PICO-3040 load GA4 data layer for Quick buy on search-results
  loadGALayerForQuickBuy(currentUrl) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          name: this.ga4DatalayeEventNameEnum.quickBuyCTA,
          id: undefined,
          category: this.ga4DatalayeEventNameEnum.quickBuyCTA,
          referring_page: currentUrl ? currentUrl : undefined,
          destination_page: `/` + this.appRouteEnum.ReviewBuy,
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.quickBuyEvent,
      });
    } catch (error) { console.log(error); }
  }

  checkToSetLocalForSoldOutClassOnSearchResults(searchRequest){
    return searchRequest.PathConstraintLocation && this.sharedService.locationMasterData
    && this.sharedService.locationMasterData.length > 0
  }

  loadGALayerForSoldOutClassOnSearchResults(searchRequest, searchResponse, soldOutJourneytype) {
    try {
      if (!searchRequest.IsSeason) {

        this.getListOfArraySoldOutTickets = [];
        let viaAvoidStation = '';
        if (this.checkToSetLocalForSoldOutClassOnSearchResults(searchRequest)) {
          let location = this.sharedService.locationMasterData.filter(x => x.Id == searchRequest.PathConstraintLocation);
          if (location)
            viaAvoidStation = location[0].Name.split('(').pop().split(')')[0];
        }
        let outboundDate = new Date(searchRequest.DepartureTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
        let outboundTime = this.datePipe.transform(searchRequest.DepartureTimesStart, 'HH:mm');
        let returnDate = '';
        let returnTime = '';
        if (searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.return) {
          returnDate = new Date(searchRequest.ReturnTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
          returnTime = this.datePipe.transform(searchRequest.ReturnTimesStart, 'HH:mm');
        }

        this.setListOfSoldOutItemsForNonSeasonJourney(searchRequest, searchResponse, outboundDate, returnDate, viaAvoidStation, outboundTime, returnTime);

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: this.ga4DatalayeEventNameEnum.soldOutClass,
          origin: searchRequest.DepartureLocationName.split('(')[0].trim(),
          destination: searchRequest.ArrivalLocationName.split('(')[0].trim(),
          journey_via: this.getJourneyViaOrAvoid(searchRequest.PathConstraintType, 'VIA', viaAvoidStation),
          start_date: this.setUndefinedForBlankValueInVariable(outboundDate),
          end_date: this.setUndefinedForBlankValueInVariable(returnDate),
          ticket_details: this.getListOfArraySoldOutTickets,
          journey_avoid: this.getJourneyViaOrAvoid(searchRequest.PathConstraintType, 'AVOID', viaAvoidStation),
          adult_pax: searchRequest.Adult,
          child_pax: searchRequest.Child,
          total_pax: (searchRequest.Adult + searchRequest.Child),
          type: this.getJourneyType(searchRequest),
          railcard_used: this.getRailCardCode(searchRequest),
          railcard_present: this.isRailCardPresent,
          error_message: this.setUndefinedForBlankValueInVariable(searchResponse.Message),
          availability: soldOutJourneytype ? this.ga4DatalayeEventNameEnum.fullSoldOut : this.ga4DatalayeEventNameEnum.partiallySoldOut
        });
      }

    } catch (error) { console.log(error); }
  }

  setListOfSoldOutItemsForNonSeasonJourney(searchRequest, searchResponse, outboundDate, returnDate, viaAvoidStation, outboundTime, returnTime) {
    if (!this.isUpgradeEvent) {
      this.isReturnJourney = false;
    }
    if (searchResponse) {
      this.getSearchTicket(searchResponse.TravelSolutions, searchRequest, outboundDate, returnDate, viaAvoidStation, outboundTime, returnTime);


      if (searchResponse.RetTravelSolutions) {
        this.isReturnJourney = true;
        this.inwardTravelSolIds = searchResponse.RetTravelSolutions.map(solution => solution.TravelSolId);
        this.getSearchTicket(searchResponse.RetTravelSolutions, searchRequest, outboundDate, returnDate, viaAvoidStation, outboundTime, returnTime);
      }
    }
  }

  getSearchTicket(travelSolutions, searchRequest, outboundDate, returnDate, viaAvoidStation, outboundTime, returnTime) {
    if (!travelSolutions && travelSolutions.length > 0) {
      return;
    }
    travelSolutions.forEach((travelSolution, index) => {
      if (travelSolution) {
        let diffOfDates = Math.abs(this.calculateDiff(travelSolution.DepartureDate));
        this.setSoldOutTicketArrayForNewFareList(travelSolution, travelSolutions, outboundTime, searchRequest, returnTime, diffOfDates);
        this.setSoldOutTicketArrayForNewRetunrFareList(travelSolution, travelSolutions, outboundTime, searchRequest, returnTime, diffOfDates);
      }
    });
  }

  getTicketDetailsForSoldOut(fareList, travelSolutions, outboundTime, searchRequest, returnTime, diffOfDates, travelSolution) {
    let item = {
      ticket_class: this.setUndefinedForBlankValueInVariable(fareList.TicketClass),
      ticket_type: this.setUndefinedForBlankValueInVariable(fareList.TicketType),
      outbound_time: this.setUndefinedForBlankValueInVariable(outboundTime),
      outbound_timing: this.setUndefinedForBlankValueInVariable(searchRequest.Traveltype),
      return_time: this.setUndefinedForBlankValueInVariable(returnTime),
      return_timing: this.setUndefinedForBlankValueInVariable(searchRequest.TraveltypeReturn),
      days_in_advance: this.setUndefinedForBlankValueInVariable(diffOfDates),
      duration: this.getDurationTime(travelSolution),
    }
    return item;
  }

  setSoldOutTicketArrayForNewFareList(travelSolution, travelSolutions, outboundTime, searchRequest, returnTime, diffOfDates){
    if (travelSolution.NewFareList) {
      travelSolution.NewFareList.forEach((newFareList) => {
        if (newFareList) {
          newFareList.FareList.forEach((fareList) => {
            if (fareList.IsSeatAvailable) {
              let getListOfSoldOutClassTickets = this.getTicketDetailsForSoldOut(fareList, travelSolutions, outboundTime, searchRequest, returnTime, diffOfDates, travelSolution);
              if (getListOfSoldOutClassTickets) {
                this.getListOfArraySoldOutTickets.push(getListOfSoldOutClassTickets);
              }
            }
          });
        }
      });
    }
  }

  setSoldOutTicketArrayForNewRetunrFareList(travelSolution, travelSolutions, outboundTime, searchRequest, returnTime, diffOfDates){
    if (travelSolution.NewReturnFareList) {
      travelSolution.NewReturnFareList.forEach((newReturnFareList) => {
        if (newReturnFareList) {
          newReturnFareList.FareList.forEach((fareList) => {
            if (fareList.IsSeatAvailable) {
              let getListOfSoldOutClassTickets = this.getTicketDetailsForSoldOut(fareList, travelSolutions, outboundTime, searchRequest, returnTime, diffOfDates, travelSolution);
              if (getListOfSoldOutClassTickets) {
                this.getListOfArraySoldOutTickets.push(getListOfSoldOutClassTickets);
              }
            }
          });
        }
      });
    }
  }

  // PICO-3549 load GA4 data layer for club avanti rewards and benefits
  loadGALayerForClubAvantiRewardsAndBenefits(currentUrl, selectedReward) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          category: this.clubAvantiEnum.clubAvantiRewardsAndBenefitsText,
          code_type: this.setUndefinedForBlankValueInVariable(selectedReward?.CodeType),
          code_category: this.setUndefinedForBlankValueInVariable(selectedReward?.RewardCategoryCode),
          code_subcategory: this.setUndefinedForBlankValueInVariable(selectedReward?.RewardSubCategoryCode),
          code_description: this.setUndefinedForBlankValueInVariable(selectedReward?.RewardCategoryCodeDescription),
          action: this.ga4DatalayeEventNameEnum.ctaClickEventGA4ClubAvanti,
          name: this.setUndefinedForBlankValueInVariable(selectedReward?.RewardCategoryCodeDescription),
          id: undefined,
          referring_page: this.setUndefinedForBlankValueInVariable(currentUrl),
          destination_page: undefined,
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.ctaClickEventGA4ClubAvanti,
      });
    } catch (error) { console.log(error); }
  }

  // PICO-3549 load GA4 data layer for club avanti view journey history
  loadGALayerForViewJourneyHistory(journeyList) {
    try {
      let [origin, destination, bookingReferenceNum, startDate, journeyPoints] = this.getDataForViewJourneyList(journeyList);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          category: this.clubAvantiEnum.clubAvantiViewJourneyHistoryText,
          action: this.clubAvantiEnum.viewJourneyHistoryText,
          origin: this.setUndefinedForBlankValueInVariable(origin),
          destination: this.setUndefinedForBlankValueInVariable(destination),
          start_date: this.setUndefinedForBlankValueInVariable(startDate),
          booking_reference: this.setUndefinedForBlankValueInVariable(bookingReferenceNum),
          journey_points: this.setUndefinedForBlankValueInVariable(journeyPoints),
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.viewJourneyHistory,
      });
    } catch (error) { console.log(error); }
  }

  getDataForViewJourneyList(journeyList) {
    let origin = '';
    let destination = '';
    let bookingReferenceNum = '';
    let startDate = '';
    let journeyPoints = '';
    if (journeyList) {
      journeyList.forEach(journey => {
        if (journeyList.length > 0) {
          origin += `${journey.FromStationName}|`
          destination += `${journey.ToStationName}|`
          bookingReferenceNum += `${journey.BookingRefrenceNumber}|`
          startDate += `${this.datePipe.transform(journey.DepartureTime, 'dd/MM/yyyy')}|`
          journeyPoints += `${journey.TripsCompleted}|`
        }
      });
      origin = origin.slice(0, -1);
      destination = destination.slice(0, -1);
      bookingReferenceNum = bookingReferenceNum.slice(0, -1);
      startDate = startDate.slice(0, -1);
      journeyPoints = journeyPoints.slice(0, -1);
    }
    return [origin, destination, bookingReferenceNum, startDate, journeyPoints];
  }

  // PICO-3549 load GA4 data layer for footer navigation
  loadGALayerForFooterNavigation(currentUrl, destination_page, ctaName) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          name: ctaName,
          id: undefined,
          category: this.ga4DatalayeEventNameEnum.clubAvantiFooter,
          referring_page: this.setUndefinedForBlankValueInVariable(currentUrl),
          destination_page: this.setUndefinedForBlankValueInVariable(destination_page),
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.footerNavigation,
      });
    } catch (error) { console.log(error); }
  }

  // PICO-3549 load GA4 data layer for club avanti navigation
  loadGA4DataLayerForClubAvantiNavigation(currentUrl, destinationUrl, header) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          name: this.setUndefinedForBlankValueInVariable(header),
          id: undefined,
          category: this.ga4DatalayeEventNameEnum.clubAvantiNaviagtionCategoryGa4,
          referring_page: this.setUndefinedForBlankValueInVariable(currentUrl),
          destination_page: this.setUndefinedForBlankValueInVariable(destinationUrl),
        },
        _clear: true,
        event: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.clubAvantiNavigation),
      });
    } catch (error) { console.log(error); }
  }

  // PICO-3549 load GA4 data layer for club avanti view journey history CTA
  loadGA4DataLayerForViewJourneyHistoryCTAClubAvanti(currentUrl) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          category: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.viewJourneyHistoryCategoryGA4ClubAvanti),
          action: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.viewJourneyHistoryActionGA4ClubAvanti),
          name: this.setUndefinedForBlankValueInVariable(this.capitalizeFirstLetter(this.ga4DatalayeEventNameEnum.viewJourneyHistoryActionGA4ClubAvanti)),
          id: undefined,
          referring_page: this.setUndefinedForBlankValueInVariable(currentUrl),
          destination_page: undefined,
        },
        _clear: true,
        event: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.ctaClickEventGA4ClubAvanti),
      });
    } catch (error) { console.log(error); }
  }

  // PICO-3549 load GA4 data layer for club avanti book ticket CTA
  loadGA4DataLayerForBookTicketCTAClubAvanti(currentUrl, destinationUrl){
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          category: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.bookNowCategoryGA4ClubAvanti),
          action: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.bookTicketActionGA4ClubAvanti),
          name: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.bookNowCtaNameGA4ClubAvanti),
          id: undefined,
          referring_page: this.setUndefinedForBlankValueInVariable(currentUrl),
          destination_page: this.setUndefinedForBlankValueInVariable(destinationUrl),
        },
        _clear: true,
        event: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.ctaClickEventGA4ClubAvanti),
      });
    } catch (error) { console.log(error); }
  }

  // PICO-3549 load GA4 data layer for club avanti technical error
  loadGA4DataLayerForClubAvantiTechnicalError(errorMessage){
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          category: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.technicalErrorCategoryGA4ClubAvanti),
          message: this.setUndefinedForBlankValueInVariable(errorMessage)
        },
        _clear: true,
        event: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum.technicalErrorEventGA4ClubAvanti),
      });
    } catch (error) { console.log(error); }
  }

  capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }
  getClubAvantiDetails(clubAvantiDetails) {
    try {
      let club_avanti_id;
      let membership_type;
      let current_points;
      let points_needed;
      if (clubAvantiDetails) {
        club_avanti_id = clubAvantiDetails?.ClubAvantiId;
        membership_type = clubAvantiDetails?.MemberShipType;
        current_points = clubAvantiDetails?.CurrentPoint;
        points_needed = clubAvantiDetails?.PointNeeded;
      }
      return [club_avanti_id, membership_type, current_points, points_needed]
    } catch (error) { console.log(error); }
  }

  // PICO-3879 load GA4 data layer on login success
  loadGA4DataLayerForLoginSuccess() {
    try {
      let email = localStorage.getItem('Email');
      let customerKey = localStorage.getItem('CustomerKey');
      let originalEmail = localStorage.getItem('OriginalEmail');
      let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
      let [club_avanti_id] = this.getClubAvantiDetails(customerLoginResponse?.clubAvantiDetails);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          status: this.ga4DatalayeEventNameEnum?.statusOnSuccess,
          user_id: customerKey,
          login_status: this.ga4DatalayeEventNameEnum?.loginStatus,
          member_id: this.setUndefinedForBlankValueInVariable(club_avanti_id),
          user_type: undefined,
          email_address_hashed: (email && customerKey) ? convertToSha256(originalEmail) : undefined, // Convert to SHA256 Alogorithm
          email_address: (originalEmail) ? originalEmail : undefined,
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum?.loginEventOnSuccess,
      });
    } catch (error) { console.log(error); }
  }

  // PICO-3879 load GA4 data layer on login failure
  loadGA4DataLayerForLoginFailure(userName, password) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        data: {
          status: this.ga4DatalayeEventNameEnum.statusOnFailure,
          message: this.checkValidateFieldForLogin(userName, password),
        },
        _clear: true,
        event: this.ga4DatalayeEventNameEnum.loginEventOnFailure,
      });
    } catch (error) { console.log(error); }
  }

  checkValidateFieldForLogin(userName, password) {
    if (!userName && password) return this.ga4DatalayeEventNameEnum.emailAddresstext
    else if (!password && userName) return this.ga4DatalayeEventNameEnum.passwordText
    else if (!userName && !password) return `${this.ga4DatalayeEventNameEnum.emailAddresstext};${this.ga4DatalayeEventNameEnum.passwordText}`
  }

  
  // PICO-3824 added property quick buy for all ga4 events
  getItemObjForQuickBuyValue(journey, quickBuyJourneyData, item) {
    try {
      if (journey && quickBuyJourneyData?.length > 0) {
        quickBuyJourneyData.forEach(quickBuyData => {
          if (this.checkOutDetailForSingleJourneyOnBooking(journey, quickBuyData, item) || this.checkOutAndReturnDetailForReturnJourneyOnBooking(journey, quickBuyData, item) || this.checkOutDetailForSingleJourneyOnCOnfirmation(journey, quickBuyData) || this.checkOutAndRetDetailForReturnourneyOnCOnfirmation(journey, quickBuyData)) {
            item.quick_buy = this.getValueForQuickBuyOrDefaultJourney(quickBuyData);
          }
        });
      }
    } catch (error) { console.log(error); }
  }
  checkOutDetailForSingleJourneyOnBooking(journey, quickBuyData, item) {
    return ((journey?.OutwardDetail && !journey?.ReturnDetail) && (journey?.Departure == quickBuyData?.departureStation && journey?.Arrival == quickBuyData?.arrivalStation) && (journey?.OutwardDetail?.DepartureTime == quickBuyData?.outDepartureDate && journey?.OutwardDetail?.ArrivalTime == quickBuyData?.outArrivalDate && journey?.OutwardDetail?.Duration == quickBuyData?.singleDuration && journey?.XmlId == quickBuyData?.XmlId && item?.total_pax == quickBuyData?.passengerCount));
  }
  checkOutAndReturnDetailForReturnJourneyOnBooking(journey, quickBuyData, item) {
    return ((journey?.OutwardDetail && journey?.ReturnDetail) && (journey?.Departure == quickBuyData?.departureStation && journey?.Arrival == quickBuyData?.arrivalStation) && (journey?.OutwardDetail?.DepartureTime == quickBuyData?.outDepartureDate && journey?.OutwardDetail?.ArrivalTime == quickBuyData?.outArrivalDate && journey?.OutwardDetail?.Duration == quickBuyData?.singleDuration) && (journey?.ReturnDetail?.DepartureTime == quickBuyData?.retDepartureDate && journey?.ReturnDetail?.ArrivalTime == quickBuyData?.retArrivalDate && journey?.ReturnDetail?.Duration == quickBuyData?.returnDuration && journey?.XmlId == quickBuyData?.XmlId && item?.total_pax == quickBuyData?.passengerCount));
  }
  checkOutDetailForSingleJourneyOnCOnfirmation(journey, quickBuyData) {
    return ((journey?.OutwardDetail && !journey?.ReturnDetail) && (journey?.Departure == quickBuyData?.departureStation && journey?.Arrival == quickBuyData?.arrivalStation) && (journey?.DepartureDate == quickBuyData?.outDepartureDate && journey?.ArrivalDate == quickBuyData?.outArrivalDate && journey?.OutwardDetail?.Price == quickBuyData?.singleTicketPrice && journey?.OutwardDetail?.Duration == quickBuyData?.singleDuration && journey?.XmlId == quickBuyData?.XmlId));
  }
  checkOutAndRetDetailForReturnourneyOnCOnfirmation(journey, quickBuyData) {
    return ((journey?.OutwardDetail && journey?.ReturnDetail) && (journey?.Departure == quickBuyData?.departureStation && journey?.Arrival == quickBuyData?.arrivalStation) && (journey?.DepartureDate == quickBuyData?.outDepartureDate && journey?.ArrivalDate == quickBuyData?.outArrivalDate && journey?.OutwardDetail?.Price == quickBuyData?.singleTicketPrice && journey?.OutwardDetail?.Duration == quickBuyData?.singleDuration) && (journey?.ReturnDepartureDate == quickBuyData?.retDepartureDate && journey?.ReturnArrivalDate == quickBuyData?.retArrivalDate && journey?.ReturnDetail?.Price == quickBuyData?.returnTicketPrice && journey?.ReturnDetail?.Duration == quickBuyData?.returnDuration && journey?.XmlId == quickBuyData?.XmlId));
  }
  getValueForQuickBuyOrDefaultJourney(quickBuyData) {
    return quickBuyData?.isCheckQuickBuy ? 'Yes' : 'No';
  }

  getFareMessage(newFareList: any[], newReturnFareList: any[], travelSolution, searchRequest): string {
    let classOrder = [this.classTypeEnum?.standardClass, this.classTypeEnum?.stdPremiumClass, this.classTypeEnum?.firstClass];
    let unavailableClasses : string[] = [];
    newFareList = searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn ? travelSolution?.FareList : newFareList;
    newReturnFareList = searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn ? travelSolution?.NewFareList : newReturnFareList;
    newFareList?.forEach(ticket => {
      ticket?.FareList?.forEach(fare => {
        let firstClass;
        firstClass = fare?.TicketClass == 'First' ? this.classTypeEnum?.firstClass : fare?.TicketClass;
        if (!fare?.IsSeatNotAvailable && fare?.TicketClass && !unavailableClasses?.includes(firstClass)) {
          unavailableClasses.push(firstClass);
        }
      });
    });

    newReturnFareList?.forEach(ticket => {
      ticket?.FareList?.forEach(fare => {
        let firstClass;
        firstClass = fare?.TicketClass == 'First' ? this.classTypeEnum?.firstClass : fare?.TicketClass;
        if (!fare?.IsSeatNotAvailable && fare?.TicketClass && !unavailableClasses?.includes(firstClass)) {
          unavailableClasses.push(firstClass);
        }
      });
    });

    if (
      !unavailableClasses.includes(this.classTypeEnum.standardClass) &&
      !unavailableClasses.includes(this.classTypeEnum.stdPremiumClass) &&
      !unavailableClasses.includes(this.classTypeEnum.firstClass)
    ) {
      return undefined;
    }

    // Return in required order
    let sortedResult = classOrder.filter(cls => unavailableClasses.includes(cls));

    let last = sortedResult.pop();
    let joined = sortedResult.length ? sortedResult.join(", ") + " and " + last : last;

    return `${joined} Class`;
  }

  filterGA4DataLayerEvent(searchRequest, ga4SearchEventParam, searchResponse, activeTab, cheapestTravelSolutionIds, outwardSelectedFare, returnSelectedFare, isNewFlow: boolean = false, filterObject) {
    try {
      let viaAvoidStation = '';
      this.cheapestArr = cheapestTravelSolutionIds;
      if (searchRequest.PathConstraintLocation != null && searchRequest.PathConstraintLocation != ''
        && searchRequest.PathConstraintLocation != undefined && this.sharedService.locationMasterData != null
        && this.sharedService.locationMasterData.length > 0) {
        let location = this.sharedService.locationMasterData.filter(x => x.Id == searchRequest.PathConstraintLocation);
        if (location != null)
          viaAvoidStation = location[0].Name.split('(').pop().split(')')[0];
      }
      let currentdate = moment.utc(new Date()).tz(this.appConstantsService.timeZone);
      let selectedDate = moment.utc(searchRequest.DepartureTimesStart).tz(this.appConstantsService.timeZone);
      let daysInAdvance = Math.abs(currentdate.diff(selectedDate, 'days'));
      let outboundDate = new Date(searchRequest.DepartureTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
      let outboundTime = this.datePipe.transform(searchRequest.DepartureTimesStart, 'HHmm');
      let returnDate = '';
      let returnTime = '';
      if (searchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.return) {
        returnDate = new Date(searchRequest.ReturnTimesStart).toLocaleDateString(this.appConstantsService.LocaleDateString);
        returnTime = this.datePipe.transform(searchRequest.ReturnTimesStart, 'HHmm');
      }
      this.setListOfItemsForNonSeasonJourneyInFilterEvent(searchRequest, searchResponse, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam);

      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.filterGA4EventNameText,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
          name: filterObject?.selectedFilter ? filterObject?.selectedFilter : undefined,
          status: filterObject?.filterStatus ? filterObject?.filterStatus : undefined,
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory,
          sold_out_trains: this.getClosedTrainsCountForOutward(searchResponse?.TravelSolutions) + this.getClosedTrainsCountForReturn(searchResponse.RetTravelSolutions),
          cancelled_trains: this.getCancelledTrainsCount(searchResponse?.TravelSolutions) + this.getCancelledTrainsCount(searchResponse?.RetTravelSolutions),
        }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: this.Services,
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  setListOfItemsForNonSeasonJourneyInFilterEvent(searchRequest, searchResponse, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam) {
    this.Services = [];
    if(!this.isUpgradeEvent){
      this.isReturnJourney = false;
    }    
    if (searchResponse) {
      this.outwardTravelSolIds = searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
      this.getFilterEventObject(searchResponse.TravelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, 1);
      

      if (searchResponse.RetTravelSolutions) {
        this.isReturnJourney = true;
        this.inwardTravelSolIds = searchResponse.RetTravelSolutions.map(solution => solution.TravelSolId);
        this.getFilterEventObject(searchResponse.RetTravelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, 2);
      }
    }
  }

  getFilterEventObject(travelSolutions, searchRequest, activeTab, outwardSelectedFare, returnSelectedFare, ga4SearchEventParam, column_index) {
    let email = localStorage.getItem('Email');
    let customerKey = localStorage.getItem('CustomerKey');
    if (customerKey == null) {
      customerKey = undefined;
    }
    if (!travelSolutions && travelSolutions.length > 0) {
      return;
    }
    travelSolutions.forEach((travelSolution, index) => {
      let diffOfDates = Math.abs(this.calculateDiff(travelSolution.DepartureDate));
      let [ticketRoutecode, ticketTypeCode] = this.getTicketRouteAndTypeCode(travelSolution);

      let item : any = {
        item_name: travelSolution.DepartureTime.split('(').pop().split(')')[0] + `-` + travelSolution.ArrivalTime.split('(').pop().split(')')[0],
        item_id: this.getIdForEvents(travelSolution, searchRequest, activeTab),
        price: this.getPriceForItem(travelSolution, activeTab),
        item_brand: travelSolution.Brand,
        item_category: this.getTicketClass(outwardSelectedFare, returnSelectedFare, this.isReturnJourney) ?? undefined,
        item_category2: this.getJourneyType(searchRequest) ?? undefined,
        item_category3: this.getTicketType(outwardSelectedFare, returnSelectedFare, this.isReturnJourney) ?? undefined,
        item_category5: this.ga4DatalayerConstantEnum.Fare,
        item_category4: this.getRailCardString(searchRequest),
        item_variant: this.getVariant(travelSolution),
        item_list_name: this.ga4ItemListEnum.resultPageItemListName,
        item_list_id: this.ga4ItemListEnum.resultPageImpressionItemListId,
        index: (index + 1),
        start_date: new Date(travelSolution.DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
        end_date: new Date(travelSolution.ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
        duration: this.getDurationTime(travelSolution),
        ticket_route_code: ticketRoutecode,
        ticket_type_code: ticketTypeCode,
        type: this.getJourneyType(searchRequest),
        single_or_return: this.isReturnJourney ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
        number_of_changes: travelSolution.Changes,
        additional_information: this.getAdditionalInformation(travelSolution, searchRequest),
        days_in_advance: diffOfDates,
        railcard_code: this.getRailCardCode(searchRequest),
        railcard_used: this.isRailCardPresent,
        adult_pax: searchRequest.Adult,
        child_pax: searchRequest.Child,
        total_pax: (searchRequest.Adult + searchRequest.Child),
        start_time: travelSolution.DepartureTime.split('(')[0].trim(),
        end_time: travelSolution.ArrivalTime.split('(')[0].trim(),
        operator: this.getTravelSolutionOperatorForCompany(travelSolution),
        column_index: column_index,
        origin: searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
        destination: searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
        available_classes: this.getFareMessage(travelSolution?.NewFareList, travelSolution?.NewReturnFareList, travelSolution, searchRequest),
        search_source: ga4SearchEventParam.searchSource ?? undefined,
        price_from: travelSolution?.SingleFare ?? undefined
      }
      this.Services.push(item);
    });
  }

  changeClassTabGA4DataLayerEvent(outwardSelectedJourney, returnSelectedJourney, searchRequest, ga4SearchEventParam, searchResponse, cheapestTravelSolutionIds, isNewFlow: boolean = false, filterObject, isReturnCase) {
    try {
      this.cheapestArr = cheapestTravelSolutionIds;
      this.setListOfItemsForNonSeasonJourneyInClassTabEvent(outwardSelectedJourney, returnSelectedJourney, searchRequest, searchResponse, ga4SearchEventParam, filterObject, isReturnCase);

      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.classTabGA4EventNameText,
        website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
        ...(isNewFlow && {
          name: filterObject?.selectedFilter ? filterObject?.selectedFilter : undefined,
          status: filterObject?.filterStatus ? filterObject?.filterStatus : undefined,
          category: this.enhancedGA4DatalayerEventName?.ga4CheckoutCategory,
          sold_out_trains: this.getClosedTrainsCountForOutward(searchResponse?.TravelSolutions) + this.getClosedTrainsCountForReturn(searchResponse.RetTravelSolutions),
          cancelled_trains: this.getCancelledTrainsCount(searchResponse?.TravelSolutions) + this.getCancelledTrainsCount(searchResponse?.RetTravelSolutions),
          price_from: filterObject?.cheapestFarePrice ? filterObject?.cheapestFarePrice : undefined
        }),
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: this.Services,
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  setListOfItemsForNonSeasonJourneyInClassTabEvent(outwardSelectedJourney, returnSelectedJourney, searchRequest, searchResponse, ga4SearchEventParam, filterObject, isReturnCase) {
    this.Services = [];
    if (!this.isUpgradeEvent) {
      this.isReturnJourney = false;
    }
    if (searchResponse?.TravelSolutions?.length > 0) {
      this.outwardTravelSolIds = searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
      this.getClassTabEventObject(outwardSelectedJourney, returnSelectedJourney, searchResponse.TravelSolutions, searchRequest, 0, ga4SearchEventParam, 1, filterObject, isReturnCase);
    }

    if (searchResponse?.RetTravelSolutions?.length > 0) {
      this.isReturnJourney = true;
      this.inwardTravelSolIds = searchResponse.RetTravelSolutions.map(solution => solution.TravelSolId);
      this.getClassTabEventObject(outwardSelectedJourney, returnSelectedJourney, searchResponse.RetTravelSolutions, searchRequest, 1, ga4SearchEventParam, 2, filterObject, isReturnCase);
    }
  }

  getClassTabEventObject(outwardSelectedJourney, returnSelectedJourney, travelSolutions, searchRequest, activeTab, ga4SearchEventParam, column_index, filterObject, isReturnCase) {
    let selectedTravelSolution = isReturnCase ? returnSelectedJourney : outwardSelectedJourney;

    let diffOfDates = Math.abs(this.calculateDiff(selectedTravelSolution?.DepartureDate));
    let [ticketRoutecode, ticketTypeCode] = this.getTicketRouteAndTypeCode(selectedTravelSolution);
    if (filterObject?.tabFares && filterObject?.tabFares.length > 0) {
      filterObject?.tabFares.forEach((fare, idx) => {
        let item: any = {
          item_name: selectedTravelSolution?.DepartureTime.split('(').pop().split(')')[0] + `-` + selectedTravelSolution?.ArrivalTime.split('(').pop().split(')')[0],
          item_id: this.getIdForEvents(selectedTravelSolution, searchRequest, activeTab),
          price: Number(this.sharedService?.formatPrice(fare?.Price)),
          item_brand: selectedTravelSolution?.Brand,
          item_category: fare?.TicketClass,
          item_category2: this.getJourneyType(searchRequest) ?? undefined,
          item_category3: fare?.TicketType,
          item_category4: this.getRailCardString(searchRequest),
          item_category5: this.ga4DatalayerConstantEnum?.Fare,
          item_variant: this.getVariant(selectedTravelSolution),
          item_list_name: this.ga4ItemListEnum.resultPageItemListName,
          item_list_id: this.ga4ItemListEnum?.resultsPageSelectionItemListId,
          index: filterObject?.tabIndex,
          column_index: column_index,
          start_date: new Date(selectedTravelSolution?.DepartureDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
          end_date: new Date(selectedTravelSolution?.ArrivalDate).toLocaleDateString(this.appConstantsService.LocaleDateString),
          duration: this.getDurationTime(selectedTravelSolution),
          ticket_route_code: ticketRoutecode,
          ticket_type_code: ticketTypeCode,
          type: this.getJourneyType(searchRequest),
          single_or_return: isReturnCase ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single,
          number_of_changes: selectedTravelSolution?.Changes,
          additional_information: this.getAdditionalInformation(selectedTravelSolution, searchRequest),
          days_in_advance: diffOfDates,
          railcard_code: this.getRailCardCode(searchRequest),
          railcard_used: this.isRailCardPresent,
          adult_pax: searchRequest.Adult,
          child_pax: searchRequest.Child,
          total_pax: (searchRequest.Adult + searchRequest.Child),
          start_time: selectedTravelSolution?.DepartureTime.split('(')[0].trim(),
          end_time: selectedTravelSolution?.ArrivalTime.split('(')[0].trim(),
          operator: this.getTravelSolutionOperatorForCompany(selectedTravelSolution),
          origin: searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
          destination: searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
          available_classes: this.getFareMessage(selectedTravelSolution?.NewFareList, selectedTravelSolution?.NewReturnFareList, selectedTravelSolution, searchRequest),
          search_source: ga4SearchEventParam.searchSource ?? undefined
        }
        this.Services.push(item);
      });
    }
  }
}
