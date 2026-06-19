import { Injectable, Injector } from "@angular/core";
import { AppConstantsService, BookingFlowTypeEnum, EnhancedAdditionalInformationEnum, EnhancedGa4DatalayeEventNameEnum, EnhancedGA4SearchSourceEnum, EnhancedPathConstraintTypeEnum, EnhancedRailcardTypeEnum, EnhancedTravelSolutionTypesEnum, Ga4DatalayeEventNameEnum, Ga4DatalayerConstantEnum, Ga4ItemListEnum, TravelSolutionJourneyTypeEnum, TravelSolutionOperatorEnum } from "../app-constants.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import * as moment from "moment";
import { DatePipe } from "@angular/common";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { DataLayerViewItemType } from "src/app/models/mixing-deck/search-request.model";
import { TravelSolutionModel } from "src/app/models/mixing-deck/travel-solution.model";
import { DataLayerChangeSeatItemType, SeatFeatures, UpdateReservationResponseDto } from "src/app/models/review-buy/seat-picker-model";
import { EnhancedJourneyDetail } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";
import { ReservationDetail } from "src/app/models/review-buy/review-buy-model";
import { CommonServices } from "src/app/services/common.service";
import { EnhancedDataLayerChangeSeatItemType } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-seat-picker.model";

@Injectable({
  providedIn: 'root'
})
export class EnhancedGA4DatalayerService {
ga4DatalayeEventNameEnum: Ga4DatalayeEventNameEnum;
    enhancedGA4DataLayerEnum: EnhancedGa4DatalayeEventNameEnum;
    sharedService: SharedService;
    appConstantsService: AppConstantsService;
    datePipe: DatePipe;
    enhancedTravelSolutionDirectionEnum: EnhancedTravelSolutionTypesEnum;
    isRailCardPresent: boolean = false;
    bookingFlowTypeEnum: BookingFlowTypeEnum;
    enhancedPathConstraintTypeEnum: EnhancedPathConstraintTypeEnum;
    railCardListFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
    commonServices: CommonServices;
    travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
    enhancedRailcardTypeEnum: EnhancedRailcardTypeEnum;
    ga4ItemListEnum: Ga4ItemListEnum;
    travelSolutionOperatorEnum: TravelSolutionOperatorEnum;
    ga4DatalayerConstantEnum: Ga4DatalayerConstantEnum;
  services: any[];
  enhancedSearchSourceTypeEnum: EnhancedGA4SearchSourceEnum;
  enhancedAdditionalInformationEnum: EnhancedAdditionalInformationEnum;
    
    constructor(private readonly injector: Injector){
        this.ga4DatalayeEventNameEnum = this.injector.get(Ga4DatalayeEventNameEnum);
        this.enhancedGA4DataLayerEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
        this.sharedService = this.injector.get(SharedService);
        this.appConstantsService = this.injector.get(AppConstantsService);
        this.datePipe = this.injector.get(DatePipe);
        this.enhancedTravelSolutionDirectionEnum = this.injector.get(EnhancedTravelSolutionTypesEnum);
        this.bookingFlowTypeEnum = this.injector.get(BookingFlowTypeEnum);
        this.enhancedPathConstraintTypeEnum = this.injector.get(EnhancedPathConstraintTypeEnum);
        this.commonServices = this.injector.get(CommonServices);
        this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
        this.enhancedRailcardTypeEnum = this.injector.get(EnhancedRailcardTypeEnum);
        this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
        this.travelSolutionOperatorEnum = this.injector.get(TravelSolutionOperatorEnum);
        this.ga4DatalayerConstantEnum = this.injector.get(Ga4DatalayerConstantEnum);
        this.enhancedSearchSourceTypeEnum = this.injector.get(EnhancedGA4SearchSourceEnum);
        this.enhancedAdditionalInformationEnum = this.injector.get(EnhancedAdditionalInformationEnum);
    }
    loadGA4DataLayerOnCheckoutClickOrAttempt(cta_name?, action?, current_page?, destination_page?, isNewFlow: boolean = false, isEditClick: boolean = false) {
        try {
            window.dataLayer = window.dataLayer || [];
            let dataObj: any = {
            category: this.setUndefinedForBlankValueInVariable(this.enhancedGA4DataLayerEnum?.ga4CheckoutCategory),
            action: this.setUndefinedForBlankValueInVariable(action),
            name: this.setUndefinedForBlankValueInVariable(cta_name),
            id: undefined,
            website_type: isNewFlow ? this.bookingFlowTypeEnum?.newBookingFlow : this.bookingFlowTypeEnum?.oldBookingFlow,
            };
            if (!isEditClick) {
              dataObj.referring_page = this.setUndefinedForBlankValueInVariable(current_page),
              dataObj.destination_page = this.setUndefinedForBlankValueInVariable(destination_page);
            }
            window.dataLayer.push({
                data: dataObj,
                _clear: true,
                event: this.setUndefinedForBlankValueInVariable(this.ga4DatalayeEventNameEnum?.ctaClickEventGA4ClubAvanti),
            });
        } catch (error) { console.log(error); }
    }

    loadGA4DataLayerInformationModalEvent(modalType, fullCurrentUrl) {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: this.setUndefinedForBlankValueInVariable(this.enhancedGA4DataLayerEnum?.informationModalEventText),
                category: this.setUndefinedForBlankValueInVariable(this.enhancedGA4DataLayerEnum?.ga4CheckoutCategory),
                modal_type: this.setUndefinedForBlankValueInVariable(modalType),
                full_url: this.setUndefinedForBlankValueInVariable(fullCurrentUrl)
            });
        } catch (error) { console.log(error); }
    }

    loadGA4DataLayerSearchEventOnApplyChangesInQTT(searchRequest, ga4SearchEventParam){
      try {
        let viaAvoidStation = '';
        if (searchRequest?.PathConstraintLocation != null && searchRequest?.PathConstraintLocation != ''
            && searchRequest?.PathConstraintLocation != undefined && this.sharedService?.locationMasterData != null
            && this.sharedService?.locationMasterData?.length > 0) {
            let location = this.sharedService?.locationMasterData?.filter(x => x.Id == searchRequest.PathConstraintLocation);
            if (location != null)
            viaAvoidStation = location[0].Name.split('(').pop().split(')')[0];
        }
        let currentdate = moment.utc(new Date()).tz(this.appConstantsService.timeZone);
        let selectedDate = moment.utc(searchRequest?.DepartureTimesStart).tz(this.appConstantsService.timeZone);
        let daysInAdvance = Math.abs(currentdate.diff(selectedDate, 'days'));
        let outboundDate = this.datePipe.transform(searchRequest.DepartureTimesStart, 'yyyyMMdd');
        let outboundTime = this.datePipe.transform(searchRequest.DepartureTimesStart, 'HHmm');
        let returnDate = '';
        let returnTime = '';
        if (searchRequest.TravelSolutionDirection == this.enhancedTravelSolutionDirectionEnum.return) {
          returnDate = this.datePipe.transform(searchRequest.ReturnTimesStart, 'yyyyMMdd');
          returnTime = this.datePipe.transform(searchRequest.ReturnTimesStart, 'HHmm');
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            search_term: searchRequest?.DepartureLocationName?.split('(').pop().split(')')[0] + '-' + searchRequest?.ArrivalLocationName?.split('(').pop().split(')')[0],
            origin: searchRequest?.DepartureLocationName?.split('(').pop().split(')')[0],
            destination: searchRequest?.ArrivalLocationName?.split('(').pop().split(')')[0],
            journey_via: this.getJourneyViaOrAvoid(searchRequest?.PathConstraintType, this.enhancedPathConstraintTypeEnum?.Via?.toUpperCase(), viaAvoidStation),
            start_date: outboundDate,
            end_date: returnDate,
            journey_avoid: this.getJourneyViaOrAvoid(searchRequest?.PathConstraintType, this.enhancedPathConstraintTypeEnum?.Avoid?.toUpperCase(), viaAvoidStation),
            outbound_Time: outboundTime,
            outbound_timing: searchRequest?.Traveltype,
            return_Time: returnTime,
            return_timing: searchRequest?.TraveltypeReturn,
            days_in_advance: daysInAdvance,
            adult_pax: searchRequest?.Adult,
            child_pax: searchRequest?.Child,
            total_pax: (searchRequest?.Adult + searchRequest?.Child),
            success: ga4SearchEventParam.searchSuccess,
            search_source: ga4SearchEventParam.searchSource,
            search_error: ga4SearchEventParam.searchError ?? undefined,
            duration: undefined,
            type: this.getJourneyType(searchRequest),
            railcard_present: this.isRailCardPresent,
            railcard_used: this.getRailCardCode(searchRequest),
            event: this.ga4DatalayeEventNameEnum.search
        });
      } catch (error) {
        console.log(error);
      }
        
    }

    getJourneyViaOrAvoid(pathConstraintType, viaAvoidstr, viaAvoidStation) {
        if (pathConstraintType == viaAvoidstr) {
        return viaAvoidStation;
        } else {
        return undefined;
        }
    }

    setUndefinedForBlankValueInVariable(value) {
        return (value === null || value === undefined || value === '') ? undefined : value;
    }

    getJourneyType(searchRequest: EnhancedSearchRequestModel) {
      try {
        if (searchRequest && searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionDirectionEnum.oneWay) {
          return this.enhancedTravelSolutionDirectionEnum.single;
        } else if (searchRequest && searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionDirectionEnum.return) {
          return this.enhancedTravelSolutionDirectionEnum.return;
        } else if (searchRequest && searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionDirectionEnum.openReturn) {
          return this.enhancedTravelSolutionDirectionEnum.anytimeReturn;
        } else if (searchRequest && searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionDirectionEnum.season) {
          return this.enhancedTravelSolutionDirectionEnum.season;
        }
        return undefined;
      } catch (error) {
        console.log(error);
      }
    }

    getRailCardCode(searchRequest: EnhancedSearchRequestModel) {
      try{
        let railCards = '';
        if (searchRequest?.RailCardList && searchRequest?.RailCardList?.length > 0) {
          this.isRailCardPresent = true;
          searchRequest?.RailCardList?.forEach((obj, _index) => {
            railCards += `${obj.RailCard}:${obj.RailCardCount}|`;
          });
          railCards = railCards.slice(0, -1);
          return railCards;
        }
        return undefined;
      } catch (error) {
        console.log(error);
      }
    }

    loadGA4DataLayerForSuccessfullyChangeSeat(booking_reference, updateReservationResponse, isOutWardJourney, journey, isthisSeatPreference = false, featureUsed = '', preferences, searchRequest, seatInfo?){
      try{
          
        let outwardJourneyDetail = journey.OutwardDetail || undefined;
        let returnJourneyDetail = journey.ReturnDetail || undefined;

        let journeyTypeParams = {
          outwardJourneyDetail: outwardJourneyDetail,
          returnJourneyDetail: returnJourneyDetail,
          featureUsed: featureUsed,
          booking_reference: booking_reference,
          isOutWardJourney: isOutWardJourney
        }
        let saveSelectionObjData = this.setGAObjectsForSaveSeatSelectionModel(journeyTypeParams, 0, updateReservationResponse, journey,0,isthisSeatPreference, preferences, searchRequest, seatInfo);
              window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: isthisSeatPreference ? this.ga4DatalayeEventNameEnum?.changeSeatPreferenceEventNameForNewFlow : this.ga4DatalayeEventNameEnum?.changeSeatEventNameForNewFlow,
          category: this.enhancedGA4DataLayerEnum?.ga4CheckoutCategory,
          website_type: this.bookingFlowTypeEnum?.newBookingFlow,
          ecommerce: {
            currency: this.appConstantsService.currency,
            items: saveSelectionObjData
          }
        });
      } catch (error){
        console.log(error);
      }
    }

    setGAObjectsForSaveSeatSelectionModel(journeyTypeParams, index, updateReservationResponse: UpdateReservationResponseDto, journey: EnhancedJourneyDetail, column_index, isSeatPreference, preferences, searchRequest, seatInfo?) {
      if (journey) {
        let saveSelectionItemObj: EnhancedDataLayerChangeSeatItemType = new EnhancedDataLayerChangeSeatItemType();
        let seatFeaturesItemObj: SeatFeatures = new SeatFeatures();
        let selectedJourney = journeyTypeParams.isOutWardJourney ? journeyTypeParams.outwardJourneyDetail : journeyTypeParams.returnJourneyDetail;
        let seatDetail = seatInfo ? seatInfo : journeyTypeParams.isOutWardJourney ? journey.OutwardSeat : journey.ReturnSeat;
        let seatPositionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatPosition && s.SeatPosition.trim() !== '')?.map(s => `${s.SeatPosition}`); 
        let seatDirectionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatFacing && s.SeatFacing.trim() !== '')?.map(s => `${s.SeatFacing}`); 
        let isReturn = journeyTypeParams.isOutWardJourney ? false : true;
        let [getNewCoachValue, getNewSeatValue] = this.getNewCoachAndSeat(updateReservationResponse);
        let [origin, destination] = this.getOriginAndDestinationForSaveSelectionSeatPicker(journeyTypeParams.isOutWardJourney, journey);
        let endDate = this.getEndDateForCojReviewBuy(journey, journeyTypeParams);
        saveSelectionItemObj.item_name = this.getItemName(journey, isReturn);
        saveSelectionItemObj.item_id = this.getJourneyIdForReviewBuyData(saveSelectionItemObj.item_name, journeyTypeParams.outwardJourneyDetail, journey, (isReturn ? journeyTypeParams.returnJourneyDetail : ''));
        saveSelectionItemObj.item_brand = selectedJourney.Brand;
        saveSelectionItemObj.item_category = selectedJourney.TicketClass;
        saveSelectionItemObj.item_category2 = this.getJourneyTypeForSingleOrReturn(isReturn);
        saveSelectionItemObj.item_category3 = selectedJourney.TicketType;
        saveSelectionItemObj.item_category4 = this.getRailCardString(journey);
        saveSelectionItemObj.item_category5 = this.ga4DatalayerConstantEnum?.Fare;
        saveSelectionItemObj.item_variant = this.getVariantForReviewBuyData(selectedJourney, saveSelectionItemObj.item_name);
        saveSelectionItemObj.item_list_id = this.ga4ItemListEnum?.checkoutItemListId,
        saveSelectionItemObj.item_list_name = this.ga4ItemListEnum?.checkoutItemListName,
        saveSelectionItemObj.index = (index + 1);
        saveSelectionItemObj.column_index = column_index;
        saveSelectionItemObj.start_date = selectedJourney.DepartureTime ? (new Date(`${selectedJourney.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
        saveSelectionItemObj.end_date = endDate ? endDate : undefined;
        saveSelectionItemObj.duration = this.getDurationTime(selectedJourney);;
        saveSelectionItemObj.operator = this.getTravelSolutionOperatorForCompany(selectedJourney);
        saveSelectionItemObj.action = this.ga4ItemListEnum.saveSelectionAction;
        saveSelectionItemObj.coach = getNewCoachValue ? getNewCoachValue : undefined;
        saveSelectionItemObj.seat_number = getNewSeatValue ? getNewSeatValue : undefined;
        saveSelectionItemObj.departure_date = selectedJourney.DepartureTime ? (new Date(`${selectedJourney.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
        saveSelectionItemObj.return_date = selectedJourney.ArrivalTime ? (new Date(`${selectedJourney.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : undefined;
        saveSelectionItemObj.origin = origin || undefined;
        saveSelectionItemObj.destination = destination || undefined;
        saveSelectionItemObj.ticket_class = selectedJourney.TicketClass || undefined;
        saveSelectionItemObj.ticket_type = selectedJourney.TicketType || undefined;
        saveSelectionItemObj.ticket_route_code = this.getTicktRouteCode(selectedJourney, false);
        saveSelectionItemObj.ticket_type_code = selectedJourney.TicketTypeCode || undefined;
        saveSelectionItemObj.type = this.getJourneyTypeForInwardAndOutward(journeyTypeParams);
        saveSelectionItemObj.single_or_return = this.getSingleOrReturnValueForSeatPicker(journeyTypeParams);
        saveSelectionItemObj.number_of_changes = selectedJourney.Changes;
        saveSelectionItemObj.additional_information = this.getAdditionalInformation(journey, searchRequest);
        saveSelectionItemObj.days_in_advance = Math.abs(this.calculateDiff(selectedJourney.DepartureTime));
        saveSelectionItemObj.railcard_used = this.getRailcardPresenceForReviewBuyData(selectedJourney, false);
        saveSelectionItemObj.railcard_code = saveSelectionItemObj.railcard_used ? this.getRailcardsForReviewBuyData(selectedJourney, false) : undefined;
        saveSelectionItemObj.adult_pax = selectedJourney.NoOfAdult;
        saveSelectionItemObj.child_pax = selectedJourney.NoOfChild;
        saveSelectionItemObj.total_pax = (selectedJourney.NoOfAdult + selectedJourney.NoOfChild);
        saveSelectionItemObj.price = journey.JourneyTotalPrice;
        if(isSeatPreference){
          saveSelectionItemObj.status = updateReservationResponse?.IsSuccess ? this.enhancedGA4DataLayerEnum?.availableStatus : this.enhancedGA4DataLayerEnum?.unAvailableStatus;
        }
        saveSelectionItemObj.seat_direction = seatDirectionList?.length > 0 ? seatDirectionList.join(", ") : undefined;
        saveSelectionItemObj.seat_position = seatPositionList?.length > 0 ? seatPositionList.join(", ") : undefined;
        saveSelectionItemObj.seat_preferences = preferences?.join(', ');
        saveSelectionItemObj.start_time= selectedJourney.DepartureTime ? this.datePipe.transform(selectedJourney.DepartureTime, 'HH:mm') : undefined;;
        saveSelectionItemObj.end_time= selectedJourney.ArrivalTime ? this.datePipe.transform(selectedJourney.ArrivalTime, 'HH:mm') : undefined;
        saveSelectionItemObj.available_classes = selectedJourney?.TicketClass ? selectedJourney?.TicketClass : undefined;
        return saveSelectionItemObj;
      }
    }

    getOriginalCoachAndSeat(updateReservationResponse) {
      try{
        let getCoachValue = '';
        let getSeatValue = '';
        if (updateReservationResponse?.Oldcoachar && updateReservationResponse?.Oldcoachar?.length > 0) {
          updateReservationResponse?.Oldcoachar?.forEach(originalCoach => {
            getCoachValue = getCoachValue === '' ? originalCoach : (getCoachValue + ", " + originalCoach);
          });
        }
        if (updateReservationResponse?.OldSeatAr && updateReservationResponse?.OldSeatAr?.length > 0) {
          updateReservationResponse?.OldSeatAr?.forEach(originalSeats => {
            getSeatValue = getSeatValue === '' ? originalSeats : (getSeatValue + ", " + originalSeats);
          });
        }
        return [getCoachValue, getSeatValue];
      } catch (error) {
        console.log(error);
      }
    }

    getNewCoachAndSeat(updateReservationResponse) {
      try {
        let getNewCoachValue = '';
        let getNewSeatValue = '';
        if (updateReservationResponse?.NewCoachAr && updateReservationResponse?.NewCoachAr?.length > 0) {
          updateReservationResponse?.NewCoachAr?.forEach(originalCoach => {
            getNewCoachValue = getNewCoachValue === '' ? originalCoach : (getNewCoachValue + ", " + originalCoach);
          });
        }
        if (updateReservationResponse?.NewseatAr && updateReservationResponse?.NewseatAr?.length > 0) {
          updateReservationResponse?.NewseatAr?.forEach(originalSeats => {
            getNewSeatValue = getNewSeatValue === '' ? originalSeats : (getNewSeatValue + ", " + originalSeats);
          });
        }
        return [getNewCoachValue, getNewSeatValue];
      } catch (error){
        console.log(error);
      }
    }

    getOriginAndDestinationForSaveSelectionSeatPicker(isOutWardJourney, journey) {
      let origin = '';
      let destination = '';
      if (isOutWardJourney) {
        origin = journey?.Departure?.split('(').pop().split(')')[0];
        destination = journey?.Arrival?.split('(').pop().split(')')[0];
      } else {
        origin = journey?.Arrival?.split('(').pop().split(')')[0]
        destination = journey?.Departure?.split('(').pop().split(')')[0]
      }
      return [origin, destination];
    }

    getDurationTime(obj) {
      try {
        if (obj?.Duration?.indexOf('h') > -1) {
          return `${+(obj?.Duration?.split('h')[0]) >= 10 ? obj?.Duration?.split('h')[0] : '0' + obj?.Duration?.split('h')[0]}:${+(obj?.Duration?.split('h')[1].split('m')[0].trim()) >= 10 ? obj?.Duration?.split('h')[1].split('m')[0].trim() : '0' + obj?.Duration?.split('h')[1].split('m')[0].trim()}`
        }
        else {
          return `00:${+(obj?.Duration?.slice(0, -1)) >= 10 ? obj?.Duration?.slice(0, -1) : '0' + obj?.Duration?.slice(0, -1)}`;
        }
      } catch (error) {
        console.log(error);
      }
    }

    getTicktRouteCode(journey, isSeason) {
      if (!isSeason && journey?.Fares && journey?.Fares?.length > 0) {
        return journey?.Fares[0]?.ServiceId.toString().slice(-5);
      }
      return undefined;
    }

    getJourneyTypeForInwardAndOutward(journeyTypeParams) {
      return journeyTypeParams?.isOutWardJourney ? this.travelSolutionJourneyTypeEnum?.outward : this.travelSolutionJourneyTypeEnum?.inward;
    }

    getSingleOrReturnValueForSeatPicker(journeyTypeParams) {
      return (journeyTypeParams?.outwardJourneyDetail && journeyTypeParams?.returnJourneyDetail) ? this.travelSolutionJourneyTypeEnum?.return : this.travelSolutionJourneyTypeEnum?.single;
    }

    calculateDiff(dateSent) {
      let currentDate = new Date();
      dateSent = new Date(dateSent);

      return Math.floor((Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) - Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate())) / (1000 * 60 * 60 * 24));
    }

    getRailcardPresenceForReviewBuyData(reservationDetail, isSeason = false) {
      if (isSeason) return !!reservationDetail?.RailCard;
      let isRailcardPresent = false;
      if (reservationDetail?.Fares && reservationDetail?.Fares?.length > 0) {
        reservationDetail?.Fares?.forEach(fare => {
          if (fare?.Railcard && (fare.Railcard !== this.enhancedRailcardTypeEnum?.noRailcardText?.replace(/r/, (match) => match.toUpperCase()))) {
            isRailcardPresent = true;
          }
        });
      }
      return isRailcardPresent;
    }

    getRailcardsForReviewBuyData(reservationDetail, isSeason = false) {
      if (isSeason) return reservationDetail?.RailCard || undefined;
      if (!this.railCardListFromStorage) this.getRailCardListFromStorage();
      let railcardsString = '';
      if (reservationDetail && this.railCardListFromStorage?.Railcard && reservationDetail?.Fares && reservationDetail?.Fares?.length > 0) {
        let CountObj = this.getRailcardCountObj(reservationDetail);
        Object.keys(CountObj).forEach(key => {
          railcardsString += ((railcardsString && railcardsString.length > 0) ? `|${key}:${CountObj[key]}` : `${key}:${CountObj[key]}`);
        });
      }
      return railcardsString;
    }

    getRailCardListFromStorage() {
      this.railCardListFromStorage = JSON.parse(localStorage.getItem(this.travelSolutionJourneyTypeEnum?.railcardStationListText));
    }

    getRailcardCountObj(journeyDetail: ReservationDetail) {
      let railcardsList = this.railCardListFromStorage.Railcard;
      let CountObj = {};
      journeyDetail.Fares.forEach(fare => {
        if (fare?.Railcard && (fare.Railcard !== this.enhancedGA4DataLayerEnum?.noRailcard)) {
          let cardDetail = railcardsList.filter(card => card.Name === fare.Railcard);
          let cardDetailCode = cardDetail[0].Code ? cardDetail[0].Code : fare.Railcard;
          let objectKey = (cardDetail && cardDetail.length > 0) ? cardDetailCode : fare.Railcard;
          CountObj[objectKey] = (CountObj[objectKey] ? (CountObj[objectKey] + 1) : 1);
        }
      });
      return CountObj;
    }

    getSeatPropertiesItemObj(seatFeaturesItemObj, journeyTypeParams, journey, saveSelectionItemObj) {
      let [SeatDirection, SeatPosition] = journeyTypeParams.isOutWardJourney ? this.getOrganisedOutAndRetSeatInfo(journey.OutwardSeat) : this.getOrganisedOutAndRetSeatInfo(journey.ReturnSeat);
      seatFeaturesItemObj.seat_direction = this.setUndefinedForBlankValueInVariable(SeatDirection);
      seatFeaturesItemObj.seat_position = this.setUndefinedForBlankValueInVariable(SeatPosition);
    }

    getOrganisedOutAndRetSeatInfo(outOrReturnSeat) {
      let SeatDirection = '';
      let SeatPosition = '';
      let SeatType = '';
      if (outOrReturnSeat) {
        outOrReturnSeat?.forEach(outwardSeat => {
          if (outwardSeat.Seat.length > 0) {
            outwardSeat.Seat.forEach(bookingSeat => {
              SeatDirection =this.commonServices?.getSeatFacing(bookingSeat);
              SeatPosition =this.commonServices?.getSeatPosition(bookingSeat);
              SeatType =this.commonServices?.getSeatType(bookingSeat);
            });
          }
        });
        return [SeatDirection, SeatPosition, SeatType];
      }
    }

    getItemName(journey: EnhancedJourneyDetail, isReturnJourney: boolean) {
      let journeyArrival = journey?.Arrival ? journey?.Arrival?.split('(').pop().split(')')[0] : '';
      let journeyDeparture = journey?.Departure ? journey?.Departure?.split('(').pop().split(')')[0] : '';
      let depCode = isReturnJourney ? journeyArrival : journeyDeparture;
      let arrivalCode = isReturnJourney ? journeyDeparture : journeyArrival;
  
      return (depCode && arrivalCode) ? (depCode + `-` + arrivalCode) : undefined;
    }

    getJourneyIdForReviewBuyData(stnCode: string, reservationDetailOne: ReservationDetail, journey: EnhancedJourneyDetail, returnJourneyDetail: ReservationDetail) {
        let id = '';
        if (stnCode && journey && reservationDetailOne) {
          id += stnCode;
          let depDate = reservationDetailOne.DepartureTime.split("T");
          let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;
          id += depDateTimeStamp;
          id += `-${journey.Adult}-${journey.Child}`;
          let isReturnOrSingle = returnJourneyDetail ? '-return' : '-single';
          let journeyType = (journey.JourneyType.indexOf(this.enhancedGA4DataLayerEnum?.openReturnJourneyText) > -1) ? `-${this.enhancedGA4DataLayerEnum?.openReturn}` : isReturnOrSingle;
          id += journeyType;
          return id;
        }
        return undefined;
      }
    
  getJourneyTypeForSingleOrReturn(isReturnJourney) {
    return isReturnJourney ? this.travelSolutionJourneyTypeEnum.return : this.travelSolutionJourneyTypeEnum.single;
  }

  getVariantForReviewBuyData(journeyDetail, name: string) {
    if (journeyDetail) {
      let changes = journeyDetail?.Changes ? Number(journeyDetail.Changes) : 0;
      let journeyCallingPointName = journeyDetail?.CallingPointName ? journeyDetail?.CallingPointName : undefined;
      return (changes === 0) ? ('1:' + name) : journeyCallingPointName;
    }
    return undefined;
  }

  getEndDateForCojReviewBuy(journey, joruneyTypeParams) {
    return journey?.ReturnDetail ? (new Date(`${joruneyTypeParams.returnJourneyDetail.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${joruneyTypeParams.outwardJourneyDetail.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString));
  }

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

  getRailCardString(searchRequest){
    if (!this.railCardListFromStorage) this.getRailCardListFromStorage();
    let railCardCodeList = searchRequest.RailCardList.map(item => item.RailCard);
    let matchedRailCardName = this.railCardListFromStorage?.Railcard?.filter(item => railCardCodeList.includes(item.Name))
                                .map(item => item.Name);
    return matchedRailCardName.length > 0 ? matchedRailCardName.join(', ') : undefined;
  }

  loadGA4DataLayerForDiscountAppliedOrBeginCheckout(searchRequest, journeyDetail, isDiscountApplied, totalJourneyPrice) {
    try {
      this.setListOfItemsForNonSeasonJourney(searchRequest, journeyDetail, isDiscountApplied);

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: isDiscountApplied ? this.ga4DatalayeEventNameEnum?.discountCodeAppliedEventName : this.ga4DatalayeEventNameEnum.beginCheckout,
        website_type: this.bookingFlowTypeEnum?.newBookingFlow,
        category: this.enhancedGA4DataLayerEnum?.ga4CheckoutCategory,
        ecommerce: {
          currency: this.appConstantsService.currency,
          value: totalJourneyPrice,
          items: this.services,
        }
      });
    } catch (error) {
      console.log(error);
    }

  }

  setListOfItemsForNonSeasonJourney(searchRequest, journeyDetail, isDiscountApplied) {
    this.services = [];
    if (journeyDetail) {
      journeyDetail?.forEach((travelSolution, index) => {
        index = index +1;
        if(travelSolution?.OutwardDetail){
          this.setGA4DataForDiscountedJourneyAndBeginCheckout(searchRequest, travelSolution, false, isDiscountApplied, index);
        }
        if(travelSolution?.ReturnDetail){
          index = index + 1;
          this.setGA4DataForDiscountedJourneyAndBeginCheckout(searchRequest, travelSolution, true, isDiscountApplied, index);
        }
      });
    }
  }

  setGA4DataForDiscountedJourneyAndBeginCheckout(searchRequest, travelSolution, isReturnJourney, isDiscountApplied, index){
    let journeyExtra = !isReturnJourney ? travelSolution?.OutwardJourneyExtras : travelSolution?.ReturnJourneyExtras
    let seatDetail = !isReturnJourney ? travelSolution?.OutwardSeat : travelSolution?.ReturnSeat;
    let coachList = seatDetail?.flatMap(os => os.Seat)?.map(s => s.CoachNumber)?.filter(c => c && c !== '*' && c !== '**')?.map(c => `Coach ${c}`);
    let uniqueCoachList = coachList ? Array.from(new Set(coachList)) : [];
    let coachstring = uniqueCoachList?.length > 0 ? uniqueCoachList?.join(", ") : undefined;
    let seatList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.Seat && s.Seat.trim() !== '' && s.Seat !== '*' && s.Seat !== '**' && s.Seat !== '***')?.map(s => `${s.CoachNumber}${s.Seat}`); 
    let seatNumber = seatList?.length > 0 ?seatList.join(", ") : undefined;
    let seatPositionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatPosition && s.SeatPosition.trim() !== '')?.map(s => `${s.SeatPosition}`); 
    let seatDirectionList = seatDetail?.flatMap(os => os.Seat)?.filter(s => s.SeatFacing && s.SeatFacing.trim() !== '')?.map(s => `${s.SeatFacing}`); 
    let visibleDeliveryModes = this.commonServices.setDeliveryModeLabel(travelSolution?.DeliveryDetail[0]?.DeliveryModeType);
    let departure = !isReturnJourney ? searchRequest.DepartureLocationName.split('(').pop().split(')')[0] : searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
    let arrival = !isReturnJourney ? searchRequest.ArrivalLocationName.split('(').pop().split(')')[0] : searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
    let shipping: number = 0.00;
    shipping = shipping + travelSolution?.DeliveryDetail?.reduce((sum, current) => sum + current.Price, 0)

    let itemObj = {
      item_name: this.setUndefinedForBlankValueInVariable(departure + '-' + arrival),
      item_id: !isReturnJourney ? this.getIdForEvents(travelSolution?.OutwardDetail, searchRequest) : this.getIdForEvents(travelSolution?.ReturnDetail, searchRequest),
      price: !isReturnJourney ? travelSolution?.OutwardDetail?.Price : travelSolution?.ReturnDetail?.Price,
      item_brand: !isReturnJourney ? travelSolution?.OutwardDetail?.Brand : travelSolution?.ReturnDetail?.Brand,
      item_category: !isReturnJourney ? travelSolution?.OutwardDetail?.TicketClass : travelSolution?.ReturnDetail?.TicketClass,
      item_category2: this.getJourneyTypeForBeginCheckout(travelSolution),
      item_category3: !isReturnJourney ? travelSolution?.OutwardDetail?.TicketType : travelSolution?.ReturnDetail?.TicketType,
      item_category4: this.getRailCardString(travelSolution),
      item_category5: this.ga4DatalayerConstantEnum.Fare,
      item_variant: this.getVariantForReviewBuyData(travelSolution, this.setUndefinedForBlankValueInVariable(departure + '-' + arrival)),
      item_list_name: this.ga4ItemListEnum?.checkoutItemListName,
      item_list_id: this.ga4ItemListEnum?.checkoutItemListId,
      index: (index + 1),
      column_index: isReturnJourney ? 2 : 1,
      start_date:  !isReturnJourney ? (new Date(`${travelSolution?.OutwardDetail?.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${travelSolution?.ReturnDetail?.DepartureTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
      end_date: !isReturnJourney ? (new Date(`${travelSolution?.OutwardDetail?.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)) : (new Date(`${travelSolution?.ReturnDetail?.ArrivalTime}`).toLocaleDateString(this.appConstantsService.LocaleDateString)),
      duration: !isReturnJourney ? this.getDurationTime(travelSolution.OutwardDetail) : this.getDurationTime(travelSolution.ReturnDetail),
      ticket_class: !isReturnJourney ? travelSolution?.OutwardDetail?.TicketClass : travelSolution?.ReturnDetail?.TicketClass,
      ticket_type: !isReturnJourney ? travelSolution?.OutwardDetail?.TicketType : travelSolution?.ReturnDetail?.TicketType,
      ticket_route_code: !isReturnJourney ? this.getTicktRouteCode(travelSolution?.OutwardDetail, false) : this.getTicktRouteCode(travelSolution?.ReturnDetail, false),
      ticket_type_code: !isReturnJourney ? travelSolution?.OutwardDetail?.TicketTypeCode : travelSolution?.ReturnDetail?.TicketTypeCode,
      type: this.getJourneyTypeForBeginCheckout(travelSolution),
      single_or_return: travelSolution?.OutwardDetail && travelSolution?.ReturnDetail ? this.travelSolutionJourneyTypeEnum?.return : this.travelSolutionJourneyTypeEnum?.single,
      number_of_changes: !isReturnJourney ? travelSolution?.OutwardDetail?.Changes : travelSolution?.ReturnDetail?.Changes,
      additional_information: undefined,
      days_in_advance: !isReturnJourney ? Math.abs(this.calculateDiff(travelSolution?.OutwardDetail?.DepartureTime)) : Math.abs(this.calculateDiff(travelSolution?.ReturnDetail?.DepartureTime)),
      railcard_code: this.getRailcardsForChangeSeatData(travelSolution),
      railcard_used: this.getRailCardUsedValue(this.getRailcardsForChangeSeatData(travelSolution)),
      adult_pax: travelSolution?.Adult,
      child_pax: travelSolution?.Child,
      total_pax: travelSolution?.Adult + travelSolution?.Child,
      start_time: !isReturnJourney ? travelSolution?.OutwardDetail?.DepartureTime.split('(')[0].trim() : travelSolution?.ReturnDetail?.DepartureTime.split('(')[0].trim(),
      end_time: !isReturnJourney ? travelSolution?.OutwardDetail?.ArrivalTime.split('(')[0].trim() : travelSolution?.ReturnDetail?.ArrivalTime.split('(')[0].trim(),
      operator: !isReturnJourney ? this.getTravelSolutionOperatorForCompany(travelSolution?.OutwardDetail) : this.getTravelSolutionOperatorForCompany(travelSolution?.ReturnDetail),
      origin: !isReturnJourney ? travelSolution?.Departure?.split('(').pop().split(')')[0] : travelSolution?.Arrival?.split('(').pop().split(')')[0],
      destination: !isReturnJourney ? travelSolution?.Arrival?.split('(').pop().split(')')[0] : travelSolution?.Departure?.split('(').pop().split(')')[0],
      available_classes: !isReturnJourney ? travelSolution?.OutwardDetail?.TicketClass : travelSolution?.ReturnDetail?.TicketClass,
      coach: coachstring,
      seat_number: seatNumber,
      seat_position: seatPositionList?.length > 0 ? seatPositionList.join(", ") : undefined,
      seat_direction: seatDirectionList?.length > 0 ? seatPositionList.join(", ") : undefined,
      seat_preferences: undefined,
      status: !seatDetail[0]?.IsSeatPicker && this.commonServices.isSeatPickerNotAvaliable(seatDetail[0]) ? this.enhancedGA4DataLayerEnum?.unAvailableStatus : this.enhancedGA4DataLayerEnum?.availableStatus,
      delivery_option: visibleDeliveryModes ? visibleDeliveryModes : undefined,
      shipping: shipping ? shipping : undefined,
      discount: travelSolution?.DiscountedPrice,
      coupon: this.setUndefinedForBlankValueInVariable(travelSolution?.DiscountCode),
      upsell_taken: this.commonServices?.getUpsellTakenObject(journeyExtra),
      Upsell_item: (this.commonServices?.getUpsellTakenObject(journeyExtra) === this.ga4DatalayerConstantEnum.Yes) ? this.commonServices?.getUpsellItemObject(travelSolution.OutwardJourneyExtras) : undefined,
    }
    this.services.push(itemObj);
  }

  getIdForEvents(journey: TravelSolutionModel, searchRequest: EnhancedSearchRequestModel) {
    try {
      if (journey && searchRequest) {
        let id = "";
        id += `${journey.DepartureTime.split('(').pop().split(')')[0]}-${journey.ArrivalTime.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.DepartureTime.split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;

        id += depDateTimeStamp; // service departure timestamp
        id += `-${searchRequest.Adult}`;
        id += `-${searchRequest.Child}`;
        id += `-${this.getIdMethod(journey)}`;
        return id;
      }
    } catch (error) {
      console.log(error);
    }
  }

  getIdMethod(journey) {
    if (journey?.OutwardDetail?.OpenReturnExpiryDate) {
      return this.travelSolutionJourneyTypeEnum.openReturn;
    } else if (journey?.OutwardDetail && !journey?.ReturnDetail) {
      return this.travelSolutionJourneyTypeEnum.single;
    } else {
      return this.travelSolutionJourneyTypeEnum.return;
    }
  }

  getJourneyTypeForBeginCheckout(journey) {
    if (journey?.OutwardDetail?.OpenReturnExpiryDate) {
      return this.travelSolutionJourneyTypeEnum.openReturn.replace(/_/g, ' ');
    } else if (journey?.OutwardDetail && !journey?.ReturnDetail) {
      return this.travelSolutionJourneyTypeEnum.single;
    } else {
      return this.travelSolutionJourneyTypeEnum.return;
    }
  }

  getUpsellTaken(journeyExtras): string {
    return (journeyExtras?.length > 0) ? this.ga4DatalayerConstantEnum?.Yes : this.ga4DatalayerConstantEnum?.No;
  }

  loadGA4ViewItem(travelSolution, searchRequest, isReturnJourney) {
    try {
      let items: Array<DataLayerViewItemType> = [];
      let viewItem = this.setJObjectsWithExpandedServiceModel(searchRequest, travelSolution, isReturnJourney);
      if (viewItem) {
        items.push(viewItem);
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: this.ga4DatalayeEventNameEnum.viewItem,
        website_type: this.bookingFlowTypeEnum?.newBookingFlow,
        category: this.enhancedGA4DataLayerEnum?.ga4CheckoutCategory,
        ecommerce: {
          currency: this.appConstantsService.currency,
          items: items,
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  setJObjectsWithExpandedServiceModel(searchRequest, travelSolution, isReturnJourney) {
    try {
      let item: DataLayerViewItemType = new DataLayerViewItemType();

      // Helper to safely get outward/return detail
      let detail = !isReturnJourney ? travelSolution?.OutwardDetail : travelSolution?.ReturnDetail;

      let departureName = searchRequest?.DepartureLocationName?.split('(').pop()?.split(')')[0];
      let arrivalName = searchRequest?.ArrivalLocationName?.split('(').pop()?.split(')')[0];

      let formatDate = (dateStr: string) =>
        dateStr ? new Date(dateStr).toLocaleDateString(this.appConstantsService.LocaleDateString) : undefined;

      let formatTime = (dateStr: string) =>
        dateStr?.split("T")[1].slice(0, 5) || undefined;

      let formatLocation = (locationStr: string) =>
        locationStr?.split('(').pop()?.split(')')[0] || undefined;

      // Map all fields
      Object.assign(item, {
        item_name: this.setUndefinedForBlankValueInVariable(`${departureName}-${arrivalName}`),
        item_id: this.getIdForEvents(detail, searchRequest),
        price: detail?.Price,
        item_brand: detail?.Brand,
        item_category: detail?.TicketClass,
        item_category2: this.getJourneyTypeForBeginCheckout(travelSolution),
        item_category3: detail?.TicketType,
        item_category4: this.getRailCardString(travelSolution),
        item_category5: this.ga4DatalayerConstantEnum.Fare,
        item_variant: this.getVariantForReviewBuyData(travelSolution, `${departureName}-${arrivalName}`),
        item_list_name: this.ga4ItemListEnum?.checkoutItemListName,
        item_list_id: this.ga4ItemListEnum?.checkoutItemListId,
        index: 1,
        column_index: isReturnJourney ? 2 : 1,
        start_date: formatDate(detail?.DepartureTime),
        end_date: formatDate(detail?.ArrivalTime),
        duration: detail ? this.getDurationTime(detail) : undefined,
        ticket_class: detail?.TicketClass,
        ticket_type: detail?.TicketType,
        ticket_route_code: detail ? this.getTicktRouteCode(detail, false) : undefined,
        ticket_type_code: detail?.TicketTypeCode,
        type: this.getJourneyTypeForBeginCheckout(travelSolution),
        single_or_return: travelSolution?.OutwardDetail && travelSolution?.ReturnDetail ? this.travelSolutionJourneyTypeEnum?.return : this.travelSolutionJourneyTypeEnum?.single,
        number_of_changes: detail?.Changes,
        additional_information: this.getAdditionalInformation(travelSolution, searchRequest),
        days_in_advance: detail ? Math.abs(this.calculateDiff(detail?.DepartureTime)) : undefined,
        railcard_code: this.getRailcardsForChangeSeatData(travelSolution),
        railcard_used: this.getRailCardUsedValue(this.getRailcardsForChangeSeatData(travelSolution)),
        adult_pax: travelSolution?.Adult,
        child_pax: travelSolution?.Child,
        total_pax: travelSolution?.Adult + travelSolution?.Child,
        start_time: formatTime(detail?.DepartureTime),
        end_time: formatTime(detail?.ArrivalTime),
        operator: detail ? this.getTravelSolutionOperatorForCompany(detail) : undefined,
        origin: !isReturnJourney ? formatLocation(travelSolution?.Departure) : formatLocation(travelSolution?.Arrival),
        destination: !isReturnJourney ? formatLocation(travelSolution?.Arrival) : formatLocation(travelSolution?.Departure),
        available_classes: detail?.TicketClass ? detail?.TicketClass : undefined,
        search_source: this.enhancedSearchSourceTypeEnum?.reviewBuyAndDelivery
      });

      return item;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

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

  doesExistRailCardList(ticketDetail) {
    return ticketDetail && this.railCardListFromStorage && this.railCardListFromStorage.Railcard && ticketDetail.RailCardList && ticketDetail.RailCardList.length > 0;
  }

  checkRailCardName(railCardList) {
    return railCardList && railCardList.RailCard && (railCardList.RailCard !== this.enhancedGA4DataLayerEnum?.noRailcard);
  }

  getRailCardDetailCode(cardDetail, railCardList) {
    return cardDetail[0].Code ? cardDetail[0].Code : railCardList.RailCard;
  }

  checkCardDetailLength(cardDetail, cardDetailCode, railCardList) {
    return (cardDetail && cardDetail.length > 0) ? cardDetailCode : railCardList.RailCard;
  }

  getRailCardUsedValue(railcard_code) {
    return railcard_code ? true : false;
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
  
}
