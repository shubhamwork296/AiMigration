import { Injectable } from '@angular/core';
import { JourneyExtraDetail, JourneyExtrasResponse } from 'src/app/models/journey-extras/journey-extras-response.model';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { JourneySummaryModel, TravelSolutionModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { CommonServices, convertToSha256 } from 'src/app/services/common.service';
import { FareBreakdownModel, JourneyModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { JourneyDetail, ReservationDetail, ReviewBuyResponse } from 'src/app/models/review-buy/review-buy-model';
import { ValidatePaymentResponse } from 'src/app/models/payment-details/validate-payment-response.model';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { RefundDetailsResponseDto } from 'src/app/models/account/refund-booking';
import { Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { AppRouteEnum } from '../app-constants.service';
import { Guid } from 'guid-typescript';

declare global {
  interface Window { dataLayer: any[]; }
}

enum upsellsPushArrayEnum {
  impressionArray = 0,
  addToCartArray = 1,
  checkoutStep1Array = 2,
  checkoutStep2Array = 3,
  reviewBuyRemoveCartArray = 4,
  productDetailArray = 5,
  transactionConfirmationArray = 6
}
interface ObjectToPushType {
  name: any;
  id: any;
  price: any;
  brand: any;
  category: any;
  variant: any;
  list: any;
  position: any;
  quantity: any;
  dimension1: any;
  dimension2: any;
  dimension3: any;
  dimension4: any;
  dimension5: any;
  dimension6: any;
  dimension7: any;
  dimension8: any;
  dimension9: any;
  dimension10: any;
  dimension11: any;
  dimension12: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataLayerService {
  railCardListFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
  name: string;
  id: string;
  price: number;
  brand: string;
  category: string;
  variant: string;
  list: string;
  position: number;
  quantity: number;
  dimension1: string;
  dimension2: string;
  dimension3: string;
  dimension4: string;
  dimension5: string;
  dimension6: string;
  dimension7: string;
  dimension8: string;
  dimension9: string;
  dimension10: string;
  dimension11: boolean;
  dimension12: string;
  dimension39: string;
  dimension40: string;
  dimension41: string;
  dimension44: string;
  dimension45: string;
  dimension46: string;
  metric10: number;
  metric11: number;
  metric1: number;
  metric2: number;
  metric3: number;
  coupon: string;

  impressionArray: any[];
  addToCartArray: any[];
  checkoutStep1Array: any[];
  checkoutStep2Array: any[];
  reviewBuyRemoveCartArray: any[];
  productDetailArray: any[];
  TransactionConfirmationArray: any[];
  SessionId: string;

  constructor(private readonly commonServices: CommonServices, private readonly datePipe: DatePipe, private readonly title: Title,
    private readonly storageDataService: StorageDataService, private readonly appRouteEnum: AppRouteEnum) { }

  loadGALayerForProductImpressionUpsells(searchRequest: SearchRequestModel, _isSuccess: boolean, _error: string, responseData: JourneyExtrasResponse, journeySummaryModel: JourneySummaryModel) {
    try {
      this.impressionArray = [];
      this.initialisationOfParameters();
      let journeyExtrasResponse: JourneyExtrasResponse = responseData;
      if (journeyExtrasResponse) {
        this.setJEImpressionObjects(searchRequest, journeyExtrasResponse, journeySummaryModel);
      }
      // apply condition In season case there are no travel extras for some journey
      if (this.impressionArray && this.impressionArray.length > 0) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'productImpression',
          ecommerce: {
            currencyCode: 'GBP',
            impressions: this.impressionArray,
          }
        });
      }

    } catch (error) {
      console.log(error);
    }
  }

  loadGALayerForAddToCart(journeySummaryModel: JourneySummaryModel, activeTab: number, searchRequest: SearchRequestModel, fastestTravelSolutionIds: number[], fastestTravelSolutionIdsReturn: number[], cheapestTravelSolutionIds: number[], cheapestTravelSolutionIdsReturn: number[]) {
    try {
      this.addToCartArray = [];
      this.initialisationOfParameters();
      if (journeySummaryModel) {
        this.setAddToCartObjectsOnSearchPage(journeySummaryModel, activeTab, searchRequest, fastestTravelSolutionIds, fastestTravelSolutionIdsReturn, cheapestTravelSolutionIds, cheapestTravelSolutionIdsReturn);
      }


      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'addToCart',
        ecommerce: {
          currencyCode: 'GBP',
          add: {
            products: this.addToCartArray,
          }
        }
      });

    } catch (error) {
      console.log(error);
    }
  }

  loadGALayerForAddToCartUpsells(searchRequest: SearchRequestModel, selectedService: JourneyExtraDetail[], journeySummaryModel: JourneySummaryModel, quantity: number, isRemoveCartEvent: boolean) {
    try {
      this.addToCartArray = [];
      this.initialisationOfParameters();
      if (journeySummaryModel) {
        this.setAddToCartUpsellsObjects(searchRequest, selectedService, journeySummaryModel, quantity);
      }
      let eventName = isRemoveCartEvent ? 'removeFromCart' : 'addToCart';
      let objParamName = isRemoveCartEvent ? 'remove' : 'add';


      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ecommerce: {
          currencyCode: 'GBP',
          [objParamName]: {
            products: this.addToCartArray,
          }
        }
      });

    } catch (error) {
      console.log(error);
    }
  }

  loadGALayerForCheckoutStep1(searchRequest: SearchRequestModel, fareBreakdownModel: FareBreakdownModel, allJEService: JourneyExtraDetail[], journeySummaryModel: JourneySummaryModel) {
    try {
      this.checkoutStep1Array = [];
      this.initialisationOfParameters();
      let activeTab = 0;

      if (journeySummaryModel) {
        if (searchRequest.IsReturnRequest && !journeySummaryModel.ReturnSelectedFare) {
          activeTab = 1;
        }
        let checkoutStepParmsObj = {
          journeySummaryModel: journeySummaryModel,
          activeTab: activeTab,
          searchRequest: searchRequest
        }
        this.setDeliveryPageCheckoutStepObjects(checkoutStepParmsObj, [], [], [], [], fareBreakdownModel, allJEService);
      }


      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "checkout",
        ecommerce: {
          currencyCode: 'GBP',
          checkout: {
            actionField: {
              step: 1,
              option: 'Delivery'
            },
            products: this.checkoutStep1Array,
          }
        }
      });

    } catch (error) {
      console.log(error);
    }
  }

  loadGALayerForCheckoutStep2(reviewBuyResponse: ReviewBuyResponse) {
    try {
      this.checkoutStep2Array = [];
      this.initialisationOfParameters();

      if (reviewBuyResponse && reviewBuyResponse.Journey && reviewBuyResponse.Journey.length > 0) {
        this.setReviewBuyCheckoutStepObjects(reviewBuyResponse, upsellsPushArrayEnum.checkoutStep2Array);
      }


      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "checkout",
        ecommerce: {
          currencyCode: 'GBP',
          checkout: {
            actionField: {
              step: 2,
              option: undefined
            },
            products: this.checkoutStep2Array,
          }
        }
      });

    } catch (error) {
      console.log(error);
    }
  }

  loadGALayerForReviewBuyRemoveCart(reviewBuyResponse: ReviewBuyResponse) {
    try {
      this.reviewBuyRemoveCartArray = [];
      this.initialisationOfParameters();

      if (reviewBuyResponse && reviewBuyResponse.Journey && reviewBuyResponse.Journey.length > 0) {
        this.setReviewBuyCheckoutStepObjects(reviewBuyResponse, upsellsPushArrayEnum.reviewBuyRemoveCartArray);
      }


      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "removeFromCart",
        ecommerce: {
          currencyCode: 'GBP',
          "remove": {
            products: this.reviewBuyRemoveCartArray,
          }
        }
      });

    } catch (error) {
      console.log(error);
    }
  }

  loadGTMDataLayerOnExpandingTravelSolution(journey, searchRequest, index, activeTab, journeyTypeForD6: string, selectedFare) {
    try {
      if (!journey || journey === null || journey === undefined) {
        return;
      }
      this.commonServices.Price = [];
      if (searchRequest.TravelSolutionDirection == 'OPEN_RETURN') {
        this.commonServices.getFareList(journey.NewFareList);
      } else {
        this.commonServices.getFareList(journey.NewFareList);
        this.commonServices.getFareList(journey.NewReturnFareList);
      }

      let viewItemParams = {
        index: index,
        activeTab: activeTab,
        journeyTypeForD6: journeyTypeForD6,
        selectedFare: selectedFare
      }

      this.loadGAProductDetail(journey, searchRequest, viewItemParams, this.commonServices.Price, this.commonServices.cheapestArr);
    }
    catch (error) {
      console.log(error);
      console.log("oops, something went wrong");
    }
  }

  getJourneyType(searchRequest: SearchRequestModel) {
    try {
      if (searchRequest && searchRequest.TravelSolutionDirection == 'ONE_WAY') return 'Single';
      else if (searchRequest && searchRequest.TravelSolutionDirection == 'RETURN') return 'Return';
      else if (searchRequest && searchRequest.TravelSolutionDirection == 'OPEN_RETURN') return 'Anytime_Return';
      else if (searchRequest && searchRequest.TravelSolutionDirection == 'SEASON') return 'Season';
      return '';
    } catch (error) {
      console.log(error);
    }
  }

  getCompany(obj) {
    if (obj.Operator == '1') return 'Avanti only';
    else if (obj.Operator == '4') return 'Multiple operators';
    else if (obj.Operator == '3') return obj.SaleCompany;
    else if (obj.Operator == '2') return 'Avanti Plus';
    return 'All';
  }

  loadGAProductDetail(journey, searchRequest, viewItemParams, Price, cheapestArr) {
    this.productDetailArray = [];
    this.initialisationOfParameters();

    let journeyType = this.getJourneyType(searchRequest);
    let company = this.getCompany(journey);
    let diffOfDates = Math.abs(this.calculateDiff(journey.DepartureDate));
    let railCards = '';
    let isRailCardPresent = false;
    if (searchRequest && searchRequest.RailCardList && searchRequest.RailCardList.length > 0) {
      isRailCardPresent = true;
      searchRequest.RailCardList.forEach((obj, _index) => {
        railCards += `${obj.RailCard}:${obj.RailCardCount}|`;
      });
    }
    railCards = railCards.slice(0, -1);

    let TicketClass = viewItemParams.selectedFare && viewItemParams.selectedFare.TicketClass;
    let TicketType = viewItemParams.selectedFare && viewItemParams.selectedFare.TicketType;
    let productParmsObj = {
      TicketClass: TicketClass,
      TicketType: TicketType,
      journeyType: journeyType,
      diffOfDates: diffOfDates,
      isRailCardPresent: isRailCardPresent,
      railCards: railCards,
      company: company,
      cheapestArr: cheapestArr
    }
    this.setJObjectsWithExpandedServiceModel(searchRequest, viewItemParams.activeTab, journey, viewItemParams.index, viewItemParams.selectedFare, viewItemParams.journeyTypeForD6, productParmsObj);
    this.pushToArray(upsellsPushArrayEnum.productDetailArray);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'productDetail',
      journeyPrices: Price,
      ecommerce: {
        currencyCode: 'GBP',
        detail: {
          products: this.productDetailArray,
        }
      }
    });

  }
  // created method for check count of railcard
  checkCounts(obj) {
    if (!this.railCardListFromStorage) {
      this.railCardListFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
    }
    if (this.railCardListFromStorage)
      this.commonServices.railCardsList = this.railCardListFromStorage.Railcard;
    let counts = Object.create(null);
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
        let entries = Object.entries(counts);
        entries.forEach(row => {
          railCards = railCards + (railCards == '' ? '' : '|') + this.commonServices.railCardsList.filter(x => x.Name == row[0])[0].Code + ':' + row[1];
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
      seasonDetailRailCards = this.commonServices.railCardsSeasonList.filter(x => x.Name == obj.RailCard)[0].Code + ':1';
      return seasonDetailRailCards;
    }
    return '';
  }
// created method of check Out & Return journey Obj detail
  getTransactionConfirmationDetailForJourney(obj, validatePaymentResponse, gaCouponCode) {
    if (obj.OutwardDetail) {

      this.initialisationOfParameters();

      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      let outwardRailCards = this.getRailCards(obj.OutwardDetail);
      let company = this.getCompany(obj.OutwardDetail);
      this.setJObjectsWithTransactionConfirmationModel(obj, validatePaymentResponse, gaCouponCode, daysInAdvance, outwardRailCards, 1, company);
      this.pushToArray(upsellsPushArrayEnum.transactionConfirmationArray);

    }
    if (obj.ReturnDetail) {

      this.initialisationOfParameters();

      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.ReturnDepartureDate), 'days'));
      let returnDetailRailCards = this.getRailCards(obj.ReturnDetail);
      let company = this.getCompany(obj.ReturnDetail);
      this.setJObjectsWithTransactionConfirmationModel(obj, validatePaymentResponse, gaCouponCode, daysInAdvance, returnDetailRailCards, 2, company);
      this.pushToArray(upsellsPushArrayEnum.transactionConfirmationArray);
    }
  }
 // created method of check journey Extras Obj detail
  getTransactionConfirmationDetailForJourneyExtra(obj, gaCouponCode) {
    if (obj.OutwardJourneyExtras && obj.OutwardJourneyExtras.length > 0) {

      this.initialisationOfParameters();

      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      let outwardJourneyExtraRailCards = this.getRailCards(obj.OutwardDetail);
      let company = this.getCompany(obj.OutwardDetail);
      obj.OutwardJourneyExtras.forEach(service => {

        let modifiedService = { ...service, IsReturn: false, Description: service.JourneyExtraName };

        this.setJObjectsWithTransactionConfirmationModelForJourneyExtra(obj, gaCouponCode, daysInAdvance, outwardJourneyExtraRailCards, 4, company, modifiedService);
        this.pushToArray(upsellsPushArrayEnum.transactionConfirmationArray);
      })
    }

    if (obj.ReturnJourneyExtras && obj.ReturnJourneyExtras.length > 0) {

      this.initialisationOfParameters();

      let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
      let returnJourneyExtraRailCards = this.getRailCards(obj.ReturnDetail);
      let company = this.getCompany(obj.ReturnDetail);
      obj.ReturnJourneyExtras.forEach(service => {

        let modifiedService = { ...service, IsReturn: true, Description: service.JourneyExtraName };

        this.setJObjectsWithTransactionConfirmationModelForJourneyExtra(obj, gaCouponCode, daysInAdvance, returnJourneyExtraRailCards, 5, company, modifiedService);
        this.pushToArray(upsellsPushArrayEnum.transactionConfirmationArray);
      });
    }
  }

  loadGTMDataLayerOnTransactionConfirmation(validatePaymentResponse: ValidatePaymentResponse) {
    try {
      let gaCouponCode = '';
      let shipping: number = 0.00;
      if (validatePaymentResponse.Journey.length > 0) {            
        this.TransactionConfirmationArray = [];

        validatePaymentResponse.Journey.forEach((obj, _index) => {
          shipping = shipping + obj.DeliveryDetail.reduce((sum, current) => sum + current.Price, 0);
          gaCouponCode = this.getGACouponCode(obj.GACouponCode);

          this.getTransactionConfirmationDetailForJourney(obj, validatePaymentResponse, gaCouponCode);
          if (obj.SeasonDeatil) {

            this.initialisationOfParameters();

            let daysInAdvance = Math.abs(moment.utc(obj.BookingDate).diff(moment.utc(obj.DepartureDate), 'days'));
            let seasonDetailRailCards = this.getRailCardsForSeason(obj.SeasonDeatil);

            this.setJObjectsWithTransactionConfirmationModel(obj, validatePaymentResponse, gaCouponCode, daysInAdvance, seasonDetailRailCards, 3);
            this.pushToArray(upsellsPushArrayEnum.transactionConfirmationArray);
          }
          this.getTransactionConfirmationDetailForJourneyExtra(obj, gaCouponCode);
        });
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'transaction',
        ecommerce: {
          currencyCode: 'GBP',
          purchase: {
            actionField: {
              id: validatePaymentResponse.ReferenceNumber,
              affiliation: 'Online Store',
              revenue: (validatePaymentResponse.PaymentRecords ? (validatePaymentResponse.PaymentRecords.reduce((sum, current) => sum + current.Price, 0) - shipping).toString() : "0"),
              tax: '0.00',
              shipping: shipping.toString(),
              coupon: gaCouponCode ? gaCouponCode : undefined,
              paymentMethod: this.commonServices.paymentMethodsCombine(validatePaymentResponse.PaymentRecords),
            },
            products: this.TransactionConfirmationArray
          }
        },
      });
    } catch (err) {
      console.log(err);
      console.log("oops, something went wrong");
    }
  }

  loadGTMDataLayerOnResetPassword(resetSource, resetSuccess, resetError) {

    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: 'passwordReset',
      password: {
        resetSource: resetSource,
        resetSuccess: resetSuccess,
        resetError: resetError,
      }
    });

  }

  loadGTMDataLayerOnRefundPopup(refundDetailsResponse: RefundDetailsResponseDto, ResponseStatus: string, ErrorMsg: string,bookingReferenceNumber,NoOfAdult,NoOfChild) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      data: {
        step: 'Summary',
        status: ResponseStatus,
        error_message: ResponseStatus === 'Success' ? undefined : ErrorMsg,
        booking_reference: bookingReferenceNumber,
        departure_date: this.commonServices.getAllJourneyDepartureDatesForRefund(refundDetailsResponse),
        return_date: this.commonServices.getAllJourneyArrivalDatesForRefund(refundDetailsResponse),
        journey_duration: this.commonServices.getAllJourneyDurationForRefund(refundDetailsResponse),
        ticket_class: this.commonServices.getAllTicketsClassForRefund(refundDetailsResponse),
        ticket_type: this.commonServices.getAllTicketsTypeForRefund(refundDetailsResponse),
        single_or_return: this.commonServices.isSingleJourneyForRefund(refundDetailsResponse),
        number_of_changes: this.commonServices.getAllTrainChangesForRefund(refundDetailsResponse),
        adult_pax: (refundDetailsResponse) ? NoOfAdult : undefined,
        child_pax: (refundDetailsResponse) ? NoOfChild : undefined,
        refund_amount: (refundDetailsResponse && refundDetailsResponse.RefundSummary) ? refundDetailsResponse.RefundSummary.RefundAmount : undefined,
        payment_type: refundDetailsResponse ? refundDetailsResponse.PaymentMode : undefined,
        toc: this.commonServices.getOperatorForRefund(refundDetailsResponse),
        journey: this.commonServices.getStationCodesForRefund(refundDetailsResponse),
        fulfillment_type: refundDetailsResponse ? refundDetailsResponse.DeliveryModeName : undefined,
        refund_date: moment(new Date()).format('DD/MM/YY'),
      },
      _clear: 'true',
      event: 'refund',
    });

  }

  loadGTMDataLayerOnRefundConfirmation(refundDetailsResponse: any, adult_pax, child_pax, totalRefundAmount, bookingReferenceNumber,  ResponseStatus: string, ErrorMsg: string) {
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      data: {
        step: 'Confirmation',
        status: ResponseStatus,
        error_message: ResponseStatus === 'Success' ? undefined : ErrorMsg,
        booking_reference: bookingReferenceNumber,
        departure_date: this.commonServices.getAllJourneyDepartureDatesForRefund(refundDetailsResponse),
        return_date: this.commonServices.getAllJourneyArrivalDatesForRefund(refundDetailsResponse),
        journey_duration: this.commonServices.getAllJourneyDurationForRefund(refundDetailsResponse),
        ticket_class: this.commonServices.getAllTicketsClassForRefund(refundDetailsResponse),
        ticket_type: this.commonServices.getAllTicketsTypeForRefund(refundDetailsResponse),
        single_or_return: this.commonServices.isSingleJourneyForRefund(refundDetailsResponse),
        number_of_changes: this.commonServices.getAllTrainChangesForRefund(refundDetailsResponse),
        adult_pax: adult_pax,
        child_pax: child_pax,
        refund_amount: parseFloat(totalRefundAmount).toFixed(2),
        payment_type: refundDetailsResponse ? refundDetailsResponse.PaymentMode : undefined,
        toc: this.commonServices.getOperatorForRefund(refundDetailsResponse),
        journey: this.commonServices.getStationCodesForRefund(refundDetailsResponse),
        fulfillment_type: refundDetailsResponse ? refundDetailsResponse.DeliveryModeName : undefined,
        refund_date: moment(new Date()).format('DD/MM/YY'),
      },
      _clear: 'true',
      event: 'refund',
    });
  }

  loadGTMDataLayerOnPageUpdate() {
    this.getSessionId();
    let fullURL = window.location.href;
    let fullPath = fullURL.split(environment.qttDomain)[1];
    let arr = fullPath.split('/');
    let email = localStorage.getItem('Email');
    let customerKey = localStorage.getItem('CustomerKey');    
    if (customerKey == null)
      customerKey = '';
    let loggedIn = (customerKey != null && email != null) ? true : false;
    let pageType = this.getPageType(fullURL);
    let firstViewed = false;
    if (fullURL.includes(this.appRouteEnum.MixingDeck) || fullURL.includes(this.appRouteEnum.SeasonSolutions) || fullURL.includes(this.appRouteEnum.Login)) {
      firstViewed = true;
    }
    let originalEmail = localStorage.getItem('OriginalEmail');
    let [city, country] = this.getCityAndCountry();
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: 'virtual_page_view',
      page: {
        type: pageType,
        country: 'gb',
        environment: environment.gtmEnvironment,
        language: 'en',
        full_url: fullURL,
        full_path: '/' + fullPath,
        path_1: (arr[0] == undefined ? undefined : arr[0]),
        path_2: (arr[1] == undefined ? undefined : arr[1]),
        path_3: (arr[2] == undefined ? undefined : arr[2]),
        path_4: (arr[3] == undefined ? undefined : arr[3]),
        title: this.title.getTitle(),
        created_date: undefined,
        last_updated: undefined,
        author: undefined,
        version: '1',
        experiment_id: undefined,
        experiment_name: undefined,
        variant_id: undefined,
        variant_name: undefined,
        ga_tracking_id: environment.gaTrackingID,
        gtm_tracking_id: environment.gtmCode,
        first_viewed: firstViewed,
      },
      user: {
        id: customerKey,
        pico_id: customerKey,
        has_transacted: '',
        logged_in: loggedIn,
        segments: undefined,
        country: country ? country : undefined,
        city: city ? city : undefined,
        is_onboard_session: '',
        session_id: this.SessionId,
        type: loggedIn ? 'Customer' : 'Guest',
        email_address_hashed: loggedIn ? convertToSha256(originalEmail) : undefined, // Convert to SHA256 Alogorithm
        email_address: this.getEmailAddress(loggedIn, originalEmail),
        customer_type: undefined
      }
    });

  }

  getPageType(fullURL) {
    let pageType = '';
    if (fullURL.includes(this.appRouteEnum.MixingDeck) || fullURL.includes(this.appRouteEnum.SeasonSolutions) || fullURL.includes(this.appRouteEnum.ReviewBuy)) {
      pageType = 'search';
    }
    else if (fullURL.includes(this.appRouteEnum.JourneyExtras) || fullURL.includes(this.appRouteEnum.DeliveryMode) || fullURL.includes(this.appRouteEnum.Payment)) {
      pageType = 'checkout';
    }
    else if (fullURL.includes(this.appRouteEnum.Confirmation)) {
      pageType = 'confirmation';
    }
    else {
      pageType = 'account';
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

  getEmailAddress(loggedValue, text) {
    if (loggedValue) {
      if (text) return text;
      return undefined;
    }
    return undefined;
  }

  setJObjectsWithTransactionConfirmationModel(obj, validatePaymentResponse, gaCouponCode, daysInAdvance, railCards, flag: number, company = '') {

    if (flag === 1) {
      this.name = obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
      this.id = this.commonServices.getIdForTransactionEvent(obj, true);
      this.price = obj.OutwardDetail.Fares.reduce((sum, current) => sum + current.Price, 0).toString();
      this.brand = obj.OutwardDetail.Brand;
      this.category = this.getCategory(obj.OutwardDetail);
      this.variant = (obj.OutwardDetail.Changes == '0' ? ('1:' + obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0]) : obj.OutwardDetail.CallingPointName);
      this.quantity = validatePaymentResponse.Journey.length.toString();
      this.coupon = this.getGACouponCode(gaCouponCode);
      this.dimension1 = this.datePipe.transform(obj.DepartureDate, 'dd/MM/yy');
      this.dimension2 = this.datePipe.transform(obj.ArrivalDate, 'dd/MM/yy');
      this.dimension3 = this.commonServices.getGaDurationTime(obj.OutwardDetail.GADuration);
      this.dimension4 = obj.OutwardDetail.TicketClass;
      this.dimension5 = obj.OutwardDetail.TicketType;
      this.dimension6 = obj.OutwardDetail.TravelType;
      this.dimension7 = obj.GAJourneyType;
      this.dimension8 = obj.OutwardDetail.Changes.toString();
      this.dimension9 = undefined;
      this.dimension10 = daysInAdvance.toString();
      this.dimension11 = this.isRailcardPresentForTransaction(obj.OutwardDetail);
      this.dimension12 = this.getRailcardsForTransaction(railCards);
      this.metric1 = obj.Adult.toString();
      this.metric2 = obj.Child.toString();
      this.metric3 = (obj.Adult + obj.Child).toString();
      this.dimension39 = obj.OutwardDetail.DepartureTimeStart;
      this.dimension40 = obj.OutwardDetail.ArrivalTimeStart;
      this.dimension41 = company;
    }

    else if (flag === 2) {
      this.name = obj.Arrival.split('(').pop().split(')')[0] + '-' + obj.Departure.split('(').pop().split(')')[0];
      this.id = this.commonServices.getIdForTransactionEvent(obj, false);
      this.price = obj.ReturnDetail.Fares.reduce((sum, current) => sum + current.Price, 0).toString();
      this.brand = obj.ReturnDetail.Brand;
      this.category = this.getCategory(obj.ReturnDetail);
      this.variant = (obj.ReturnDetail.Changes == '0' ? ('1:' + obj.Arrival.split('(').pop().split(')')[0] + '-' + obj.Departure.split('(').pop().split(')')[0]) : obj.ReturnDetail.CallingPointName);
      this.quantity = validatePaymentResponse.Journey.length.toString();
      this.coupon = this.getGACouponCode(gaCouponCode);
      this.dimension1 = this.datePipe.transform(obj.ReturnDepartureDate, 'dd/MM/yy');
      this.dimension2 = this.datePipe.transform(obj.ReturnArrivalDate, 'dd/MM/yy');
      this.dimension3 = this.commonServices.getGaDurationTime(obj.ReturnDetail.GADuration);
      this.dimension4 = obj.ReturnDetail.TicketClass;
      this.dimension5 = obj.ReturnDetail.TicketType;
      this.dimension6 = obj.ReturnDetail.TravelType;
      this.dimension7 = obj.GAJourneyType;
      this.dimension8 = obj.ReturnDetail.Changes.toString();
      this.dimension9 = undefined;
      this.dimension10 = daysInAdvance.toString();
      this.dimension11 = this.isRailcardPresentForTransaction(obj.ReturnDetail);
      this.dimension12 = this.getRailcardsForTransaction(railCards);
      this.metric1 = obj.Adult.toString();
      this.metric2 = obj.Child.toString();
      this.metric3 = (obj.Adult + obj.Child).toString();
      this.dimension39 = obj.ReturnDetail.DepartureTimeStart;
      this.dimension40 = obj.ReturnDetail.ArrivalTimeStart;
      this.dimension41 = company;
    }

    else if (flag === 3) {
      this.name = obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
      this.id = this.commonServices.getIdForTransactionEvent(obj, true);
      this.price = obj.SeasonDeatil.Price.toString();
      this.brand = undefined;
      this.category = '0';
      this.variant = obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
      this.quantity = validatePaymentResponse.Journey.length.toString();
      this.coupon = this.getGACouponCode(gaCouponCode);
      this.dimension1 = this.datePipe.transform(obj.SeasonDeatil.ValidFrom, 'dd/MM/yy');
      this.dimension2 = this.datePipe.transform(obj.SeasonDeatil.ValidTill, 'dd/MM/yy');
      this.dimension3 = this.commonServices.getGaDurationTime(obj.SeasonDeatil.GADuration);
      this.dimension4 = obj.SeasonDeatil.TicketClass;
      this.dimension5 = obj.SeasonDeatil.TicketType;
      this.dimension6 = undefined;
      this.dimension7 = obj.GAJourneyType;
      this.dimension8 = '0';
      this.dimension9 = undefined;
      this.dimension10 = daysInAdvance.toString();
      this.dimension11 = ((obj.SeasonDeatil.RailCard != null && obj.SeasonDeatil.RailCard != undefined && obj.SeasonDeatil.RailCard != '' && obj.SeasonDeatil.RailCard != 'No Railcard') ? true : false); //Railcard Present
      this.dimension12 = this.getRailcardsForTransaction(railCards);
      this.metric1 = obj.Adult.toString();
      this.metric2 = obj.Child.toString();
      this.metric3 = (obj.Adult + obj.Child).toString();
    }

  }

  setJObjectsWithTransactionConfirmationModelForJourneyExtra(obj, gaCouponCode, daysInAdvance, railCards, flag: number, company = '', modifiedService = null) {
    if (flag === 4) {
      this.name = obj.Departure.split('(').pop().split(')')[0] + '-' + obj.Arrival.split('(').pop().split(')')[0];
      this.id = this.commonServices.getIdForJE_Services(modifiedService);
      this.price = modifiedService.Price.toString();
      this.brand = modifiedService.JourneyExtraName;
      this.category = "Upsells";
      this.variant = this.commonServices.getVariantForJEService(modifiedService);
      this.quantity = modifiedService.Count.toString();
      this.coupon = this.getGACouponCode(gaCouponCode);
      this.dimension1 = this.datePipe.transform(obj.DepartureDate, 'dd/MM/yy');
      this.dimension2 = this.datePipe.transform(obj.ArrivalDate, 'dd/MM/yy');
      this.dimension3 = this.commonServices.getGaDurationTime(obj.OutwardDetail.GADuration);
      this.dimension4 = obj.OutwardDetail.TicketClass;
      this.dimension5 = obj.OutwardDetail.TicketType;
      this.dimension6 = obj.OutwardDetail.TravelType;
      this.dimension7 = obj.GAJourneyType;
      this.dimension8 = obj.OutwardDetail.Changes.toString();
      this.dimension9 = undefined;
      this.dimension10 = daysInAdvance.toString();
      this.dimension11 = this.isRailcardPresentForTransaction(obj.OutwardDetail);
      this.dimension12 = this.getRailcardsForTransaction(railCards);
      this.metric1 = obj.Adult.toString();
      this.metric2 = obj.Child.toString();
      this.metric3 = (obj.Adult + obj.Child).toString();
      this.dimension39 = obj.OutwardDetail.DepartureTimeStart;
      this.dimension40 = obj.OutwardDetail.ArrivalTimeStart;
      this.dimension41 = company;
    }
    else if (flag === 5) {
      this.name = obj.Arrival.split('(').pop().split(')')[0] + '-' + obj.Departure.split('(').pop().split(')')[0];
      this.id = this.getIdForJE_Services(modifiedService);
      this.price = modifiedService.Price.toString();
      this.brand = modifiedService.JourneyExtraName;
      this.category = "Upsells";
      this.variant = this.getVariantForJEService(modifiedService);
      this.quantity = modifiedService.Count.toString();
      this.coupon = this.getGACouponCode(gaCouponCode);
      this.dimension1 = this.datePipe.transform(obj.ReturnDepartureDate, 'dd/MM/yy');
      this.dimension2 = this.datePipe.transform(obj.ReturnArrivalDate, 'dd/MM/yy');
      this.dimension3 = this.commonServices.getGaDurationTime(obj.ReturnDetail.GADuration);
      this.dimension4 = obj.ReturnDetail.TicketClass;
      this.dimension5 = obj.ReturnDetail.TicketType;
      this.dimension6 = obj.ReturnDetail.TravelType;
      this.dimension7 = obj.GAJourneyType;
      this.dimension8 = obj.ReturnDetail.Changes.toString();
      this.dimension9 = undefined;
      this.dimension10 = daysInAdvance.toString();
      this.dimension11 = this.isRailcardPresentForTransaction(obj.ReturnDetail);
      this.dimension12 = this.getRailcardsForTransaction(railCards);
      this.metric1 = obj.Adult.toString();
      this.metric2 = obj.Child.toString();
      this.metric3 = (obj.Adult + obj.Child).toString();
      this.dimension39 = obj.ReturnDetail.DepartureTimeStart;
      this.dimension40 = obj.ReturnDetail.ArrivalTimeStart;
      this.dimension41 = company;
    }
  }

  getCategory(outOrRetDetail) {
    if (outOrRetDetail.Changes == '0') {
      return 'Direct';
    } else {
      return 'Connection';
    }
  }

  isRailcardPresentForTransaction(outOrRetDetails) {
    let railcardCount = outOrRetDetails.Fares.filter(x => (x.Railcard != 'No Railcard' && x.Railcard != null && x.Railcard != undefined && x.Railcard != '')).length;
    if (railcardCount > 0) {
      return true;
    } else {
      return false;
    }

  }

  getRailcardsForTransaction(railcards){
    if(railcards){
      return railcards;
    }
    return undefined;
  }

  getGACouponCode(gaCouponCode){
    if(gaCouponCode){
      return gaCouponCode;
    }
    return undefined;
  }

  setJEImpressionObjects(searchRequest: SearchRequestModel, journeyExtrasResponse: JourneyExtrasResponse, journeySummaryModel: JourneySummaryModel) {
    if (searchRequest && journeyExtrasResponse.Detail && journeyExtrasResponse.Detail.length > 0) {
      let outwardJourney: TravelSolutionModel = journeySummaryModel && journeySummaryModel.SingleRouteModel;
      let returnJourney: TravelSolutionModel = journeySummaryModel && journeySummaryModel.ReturnRouteModel;
      journeyExtrasResponse.Detail.forEach((service, _index) => {
        this.setObjectFieldsWithUpsellService(service, searchRequest, journeySummaryModel, outwardJourney, returnJourney, upsellsPushArrayEnum.impressionArray);
      })
    }
  }
  setAddToCartObjectsOnSearchPage(journeySummaryModel: JourneySummaryModel, activeTab: number, searchRequest: SearchRequestModel, fastestTravelSolutionIds: number[], fastestTravelSolutionIdsReturn: number[], cheapestTravelSolutionIds: number[], cheapestTravelSolutionIdsReturn: number[]) {
    let outwardSelectedJourney: TravelSolutionModel = journeySummaryModel.SingleRouteModel;
    let returnSelectedJourney: TravelSolutionModel = journeySummaryModel.ReturnRouteModel;
    activeTab = returnSelectedJourney ? activeTab : 0;
    let addToCartParmsObj = {
      activeTab: activeTab,
      fastestTravelSolutionIdsReturn: fastestTravelSolutionIdsReturn,
      fastestTravelSolutionIds: fastestTravelSolutionIds,
      cheapestTravelSolutionIdsReturn: cheapestTravelSolutionIdsReturn
    }
    if (outwardSelectedJourney) {
      this.setJourneyObjectsWithSummeryModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, false, cheapestTravelSolutionIds, addToCartParmsObj);
      this.pushToArray(upsellsPushArrayEnum.addToCartArray);
    }
    if (returnSelectedJourney) {
      this.setJourneyObjectsWithSummeryModel(searchRequest, outwardSelectedJourney, returnSelectedJourney, journeySummaryModel, true, cheapestTravelSolutionIds, addToCartParmsObj);
      this.pushToArray(upsellsPushArrayEnum.addToCartArray);
    }
  }
  setAddToCartUpsellsObjects(searchRequest: SearchRequestModel, selectedService: JourneyExtraDetail[], journeySummaryModel: JourneySummaryModel, quantity: number) {
    if (searchRequest && selectedService && selectedService.length > 0) {
      let outwardJourney: TravelSolutionModel = journeySummaryModel && journeySummaryModel.SingleRouteModel;
      let returnJourney: TravelSolutionModel = journeySummaryModel && journeySummaryModel.ReturnRouteModel;
      this.quantity = quantity;
      this.setObjectFieldsWithUpsellService(selectedService[0], searchRequest, journeySummaryModel, outwardJourney, returnJourney, upsellsPushArrayEnum.addToCartArray);
    }
  }

  checkOutReturnJE_Service(outwardReturnJE_Services, searchRequest, journeySummaryModel, outwardSelectedJourney, returnSelectedJourney) {
    if (outwardReturnJE_Services) {
      outwardReturnJE_Services.forEach(outReturnService => {
        // setting quantity field - start
        if (outReturnService.Description !== 'Bicycle Reservation') {
          this.quantity = outReturnService.AvailableAmount;
        } else {
          this.quantity = outReturnService.quantity;
        }
        // setting quantity field - end

        this.setMetricField(searchRequest);
        this.setObjectFieldsWithUpsellService(outReturnService, searchRequest, journeySummaryModel, outwardSelectedJourney, returnSelectedJourney, upsellsPushArrayEnum.checkoutStep1Array);
      })
    }
  }
  setDeliveryPageCheckoutStepObjects(checkoutStepParmsObj, fastestTravelSolutionIds: number[], fastestTravelSolutionIdsReturn: number[], cheapestTravelSolutionIds: number[], cheapestTravelSolutionIdsReturn: number[], fareBreakdownModel: FareBreakdownModel, allJEService: JourneyExtraDetail[]) {
    let outwardSelectedJourney: TravelSolutionModel = checkoutStepParmsObj.journeySummaryModel.SingleRouteModel;
    let returnSelectedJourney: TravelSolutionModel = checkoutStepParmsObj.journeySummaryModel.ReturnRouteModel;
    checkoutStepParmsObj.activeTab = returnSelectedJourney ? checkoutStepParmsObj.activeTab : 0;
    let outwardJE_Services = fareBreakdownModel && this.getJE_Services(fareBreakdownModel.OutwardJourneyExtras, allJEService, false);
    let returnJE_Services = fareBreakdownModel && this.getJE_Services(fareBreakdownModel.ReturnJourneyExtras, allJEService, true);
    let deliveryPageCheckoutParmsObj = {
      activeTab: checkoutStepParmsObj.activeTab,
      fastestTravelSolutionIdsReturn: fastestTravelSolutionIdsReturn,
      fastestTravelSolutionIds: fastestTravelSolutionIds,
      cheapestTravelSolutionIdsReturn: cheapestTravelSolutionIdsReturn
    }
    if (outwardSelectedJourney) {
      this.setJourneyObjectsWithSummeryModel(checkoutStepParmsObj.searchRequest, outwardSelectedJourney, returnSelectedJourney, checkoutStepParmsObj.journeySummaryModel, false, cheapestTravelSolutionIds, deliveryPageCheckoutParmsObj);
      this.pushToArray(upsellsPushArrayEnum.checkoutStep1Array);
      this.checkOutReturnJE_Service(outwardJE_Services, checkoutStepParmsObj.searchRequest, checkoutStepParmsObj.journeySummaryModel, outwardSelectedJourney, returnSelectedJourney);
      
    }
    if (returnSelectedJourney) {
      this.setJourneyObjectsWithSummeryModel(checkoutStepParmsObj.searchRequest, outwardSelectedJourney, returnSelectedJourney, checkoutStepParmsObj.journeySummaryModel, true, cheapestTravelSolutionIds, deliveryPageCheckoutParmsObj);
      this.pushToArray(upsellsPushArrayEnum.checkoutStep1Array);
      this.checkOutReturnJE_Service(returnJE_Services, checkoutStepParmsObj.searchRequest, checkoutStepParmsObj.journeySummaryModel, outwardSelectedJourney, returnSelectedJourney);
    }
  }
  setReviewBuyCheckoutStepObjects(reviewBuyResponse: ReviewBuyResponse, pushArrayNumber: number) {
    reviewBuyResponse.Journey.forEach(journey => {
      let outwardJourneyDetail = journey.OutwardDetail;
      let returnJourneyDetail = journey.ReturnDetail;
      let outwardJourneyExtras = journey.OutwardJourneyExtras;
      let returnJourneyExtras = journey.ReturnJourneyExtras;

      if (outwardJourneyDetail) {
        this.setJourneyObjectsWithReviewBuyData(journey, outwardJourneyDetail, returnJourneyDetail, false);
        this.pushToArray(pushArrayNumber);
        if (outwardJourneyExtras && outwardJourneyExtras.length > 0) {
          outwardJourneyExtras.forEach(service => {
            this.price = service.Price;
            this.brand = service.JourneyExtraName;
            this.category = "Upsells";
            this.quantity = service.Count;

            let modifiedService = { ...service, IsReturn: false, Description: service.JourneyExtraName };
            this.id = this.getIdForJE_Services(modifiedService);
            this.variant = this.getVariantForJEService(modifiedService);
            this.setMetricField(journey);
            this.pushToArray(pushArrayNumber);
          })
        }
      }
      if (returnJourneyDetail) {
        this.setJourneyObjectsWithReviewBuyData(journey, returnJourneyDetail, outwardJourneyDetail, true);
        this.pushToArray(pushArrayNumber);
        if (returnJourneyExtras && returnJourneyExtras.length > 0) {
          returnJourneyExtras.forEach(service => {
            this.price = service.Price;
            this.brand = service.JourneyExtraName;
            this.category = "Upsells";
            this.quantity = service.Count;

            let modifiedService = { ...service, IsReturn: true, Description: service.JourneyExtraName };
            this.id = this.getIdForJE_Services(modifiedService);
            this.variant = this.getVariantForJEService(modifiedService);
            this.setMetricField(journey);
            this.pushToArray(pushArrayNumber);
          })
        }
      }

    })
  }

  initialisationOfParameters() {
    this.id = undefined;
    this.name = undefined;
    this.price = undefined;
    this.category = undefined;
    this.variant = undefined;
    this.brand = undefined;
    this.list = undefined;
    this.position = undefined;
    this.dimension1 = undefined;
    this.dimension2 = undefined;
    this.dimension3 = undefined;
    this.dimension4 = undefined;
    this.dimension5 = undefined;
    this.dimension6 = undefined;
    this.dimension7 = undefined;
    this.dimension8 = undefined;
    this.dimension9 = undefined;
    this.dimension10 = undefined;
    this.dimension11 = undefined;
    this.dimension12 = undefined;
    this.dimension39 = undefined;
    this.dimension40 = undefined;
    this.dimension41 = undefined;
    this.dimension44 = undefined;
    this.dimension45 = undefined;
    this.dimension46 = undefined;
    this.metric10 = undefined;
    this.metric11 = undefined;
    this.metric1 = undefined;
    this.metric2 = undefined;
    this.metric3 = undefined;
    this.quantity = undefined;
    this.coupon = undefined;
  }
  pushToArray(pushArrayEnumNumber: number) {
    let objectToPush: ObjectToPushType = {
      name: this.name,
      id: this.id,
      price: this.price,
      brand: this.brand,
      category: this.category,
      variant: this.variant,
      list: this.list,
      position: this.position,
      quantity: this.quantity,
      dimension1: this.dimension1,
      dimension2: this.dimension2,
      dimension3: this.dimension3,
      dimension4: this.dimension4,
      dimension5: this.dimension5,
      dimension6: this.dimension6,
      dimension7: this.dimension7,
      dimension8: this.dimension8,
      dimension9: this.dimension9,
      dimension10: this.dimension10,
      dimension11: this.dimension11,
      dimension12: this.dimension12,
    };
    switch (pushArrayEnumNumber) {
      case upsellsPushArrayEnum.impressionArray:
        delete objectToPush.quantity;
        this.impressionArray.push(objectToPush);
        break;
      case upsellsPushArrayEnum.addToCartArray:
        delete objectToPush.list;
        delete objectToPush.position;
        this.addToCartArray.push(objectToPush);
        break;
      case upsellsPushArrayEnum.reviewBuyRemoveCartArray:
        delete objectToPush.list;
        delete objectToPush.position;
        this.reviewBuyRemoveCartArray.push(objectToPush);
        break;
      case upsellsPushArrayEnum.checkoutStep1Array:
        {
          let checkoutObj: any = {};
          if (objectToPush.category === "Direct" || objectToPush.category === "Connection") {
            objectToPush.dimension6 = this.dimension7;
            objectToPush.dimension7 = this.dimension9;
            objectToPush.dimension8 = this.dimension10;
            objectToPush.dimension9 = this.dimension11;
            objectToPush.dimension10 = this.dimension12;
            delete objectToPush.dimension11;
            delete objectToPush.dimension12;
          } else {
            checkoutObj.metric1 = this.metric1;
            checkoutObj.metric2 = this.metric2;
            checkoutObj.metric3 = this.metric3;
            checkoutObj.coupon = this.coupon;
          }
          delete objectToPush.list;
          delete objectToPush.position;
          checkoutObj = { ...objectToPush, ...checkoutObj }
          this.checkoutStep1Array.push(checkoutObj);
          break;
        }
      case upsellsPushArrayEnum.checkoutStep2Array:
        {
          let checkoutObj: any = {};
          if (objectToPush.category === "Upsells") {
            checkoutObj.metric1 = this.metric1;
            checkoutObj.metric2 = this.metric2;
            checkoutObj.metric3 = this.metric3;
            checkoutObj.coupon = this.coupon;
          }
          delete objectToPush.list;
          delete objectToPush.position;
          checkoutObj = { ...objectToPush, ...checkoutObj };
          this.checkoutStep2Array.push(checkoutObj);
          break;
        }
      case upsellsPushArrayEnum.productDetailArray:
        {
          delete objectToPush.list;
          delete objectToPush.quantity;

          let checkoutObj: any = {};

          checkoutObj.dimension39 = this.dimension39;
          checkoutObj.dimension40 = this.dimension40;
          checkoutObj.dimension41 = this.dimension41;

          checkoutObj = { ...objectToPush, ...checkoutObj };
          this.productDetailArray.push(checkoutObj);
          break;
        }
      case upsellsPushArrayEnum.transactionConfirmationArray:
        {
          delete objectToPush.list;
          delete objectToPush.position;

          let checkoutObj: any = {};

          checkoutObj.coupon = this.coupon;
          checkoutObj.metric1 = this.metric1;
          checkoutObj.metric2 = this.metric2;
          checkoutObj.metric3 = this.metric3;
          if (objectToPush.category === 'Direct' || objectToPush.category === 'Connection' || objectToPush.category === 'Upsells') {
            checkoutObj.dimension39 = this.dimension39;
            checkoutObj.dimension40 = this.dimension40;
            checkoutObj.dimension41 = this.dimension41;
          }

          checkoutObj = { ...objectToPush, ...checkoutObj };
          this.TransactionConfirmationArray.push(checkoutObj);
          break;
        }
    }
  }

  setObjectFieldsWithUpsellService(service, searchRequest, journeySummaryModel, outwardJourney, returnJourney, enumArray) {
    if (service.IsReturn) {
      this.name = searchRequest.ArrivalLocationName.split('(').pop().split(')')[0] + `-` + searchRequest.DepartureLocationName.split('(').pop().split(')')[0];
      this.id = this.getIdForJE_Services(service);
      this.price = service.Price;
      this.brand = service.Description;
      this.category = 'Upsells'; // hardcoded value
      this.variant = this.getVariantForJEService(service);
      this.list = 'Upsells'; // hardcoded value
      this.position = this.getPositionOfUpsellsService(service);
      this.coupon = undefined;
      this.dimension1 = (new Date(`${returnJourney.DepartureDate}`).toLocaleDateString("en-GB"));
      this.dimension2 = (new Date(`${returnJourney.ArrivalDate}`).toLocaleDateString("en-GB"));
      this.dimension3 = this.commonServices.getDurationTime(returnJourney);
      this.dimension4 = this.getTicketClass(journeySummaryModel, service.IsReturn);
      this.dimension5 = this.getTicketType(journeySummaryModel, service.IsReturn);
      this.dimension6 = 'Inward';
      this.dimension7 = (outwardJourney && returnJourney) ? 'Return' : 'Single';
      this.dimension8 = returnJourney.Changes.toString();
      this.dimension9 = undefined;
      this.dimension10 = Math.abs(this.commonServices.calculateDiff(returnJourney.DepartureDate)).toString() || undefined;
      this.dimension11 = this.isRailCardPresent(searchRequest);
      this.dimension12 = this.getRailCard(searchRequest, this.dimension11);
    } else {
      this.name = searchRequest.DepartureLocationName.split('(').pop().split(')')[0] + `-` + searchRequest.ArrivalLocationName.split('(').pop().split(')')[0];
      this.id = this.getIdForJE_Services(service);
      this.price = service.Price;
      this.brand = service.Description;
      this.category = 'Upsells'; // hardcoded value
      this.variant = this.getVariantForJEService(service);
      this.list = 'Upsells';
      this.position = this.getPositionOfUpsellsService(service);
      this.coupon = undefined;
      // apply condition In season case there are no DepartureDate & ArrivalDate
      if (outwardJourney && !searchRequest.IsSeason) {
        this.dimension1 = (new Date(`${outwardJourney.DepartureDate}`).toLocaleDateString("en-GB"));
        this.dimension2 = (new Date(`${outwardJourney.ArrivalDate}`).toLocaleDateString("en-GB"));
        this.dimension3 = this.commonServices.getDurationTime(outwardJourney);
        this.dimension4 = this.getTicketClass(journeySummaryModel, service.IsReturn);
        this.dimension5 = this.getTicketType(journeySummaryModel, service.IsReturn);
        this.dimension6 = 'Outward';
        this.dimension7 = returnJourney ? 'Return' : 'Single';
        this.dimension8 = outwardJourney.Changes.toString();
        this.dimension10 = Math.abs(this.commonServices.calculateDiff(outwardJourney.DepartureDate)).toString() || undefined;        
      }
      else if(searchRequest.IsSeason){
        this.dimension1 = (new Date(`${service.StartValidity}`).toLocaleDateString("en-GB"));
        this.dimension2 = (new Date(`${service.EndValidity}`).toLocaleDateString("en-GB"));
        this.dimension3 = undefined;
        this.dimension4 = undefined;
        this.dimension5 = undefined;
        this.dimension6 = 'Season';
        this.dimension7 = 'Season';
        this.dimension8 = undefined;
        this.dimension10 = Math.abs(this.commonServices.calculateDiff(service.StartValidity)).toString() || undefined;
      }
      this.dimension9 = undefined;
      this.dimension11 = this.isRailCardPresent(searchRequest);
      this.dimension12 = this.getRailCard(searchRequest, this.dimension11);
    }
    this.pushToArray(enumArray);
  }
  setJourneyObjectsWithReviewBuyData(journey: JourneyDetail, reservationDetail: ReservationDetail, returnJourneyDetail: ReservationDetail, isReturnCase: boolean) {
    let depCode = isReturnCase ? journey.Arrival.split('(').pop().split(')')[0] : journey.Departure.split('(').pop().split(')')[0];
    let arrivalCode = isReturnCase ? journey.Departure.split('(').pop().split(')')[0] : journey.Arrival.split('(').pop().split(')')[0];

    this.name = depCode + `-` + arrivalCode;
    this.id = this.getJourneyIdForReviewBuyData(this.name, reservationDetail, journey, returnJourneyDetail);
    this.price = Number(reservationDetail.CojPrice);
    this.brand = reservationDetail.Brand;
    this.category = Number(reservationDetail.Changes) !== 0 ? 'Connection' : 'Direct'
    this.variant = this.getVariantForReviewBuyData(reservationDetail, this.name);
    this.quantity = (journey.Adult + journey.Child);
    this.dimension1 = (new Date(`${reservationDetail.DepartureTime}`).toLocaleDateString("en-GB"));
    this.dimension2 = (new Date(`${reservationDetail.ArrivalTime}`).toLocaleDateString("en-GB"));
    this.dimension3 = this.commonServices.getDurationTime(reservationDetail);
    this.dimension4 = reservationDetail.TicketClass;
    this.dimension5 = reservationDetail.TicketType;
    this.dimension6 = isReturnCase ? 'Inward' : 'Outward';
    this.dimension7 = (reservationDetail && returnJourneyDetail) ? 'Return' : 'Single';
    this.dimension8 = reservationDetail.Changes.toString();
    this.dimension9 = undefined;
    this.dimension10 = Math.abs(this.commonServices.calculateDiff(reservationDetail.DepartureTime)).toString() || undefined;
    this.dimension11 = this.getRailcardPresenceForReviewBuyData(reservationDetail);
    this.dimension12 = this.dimension11 ? this.getRailcardsForReviewBuyData(reservationDetail) : undefined;
    this.coupon = undefined;
  }
  setJourneyObjectsWithSummeryModel(searchRequest: SearchRequestModel, outwardSelectedJourney: TravelSolutionModel, returnSelectedJourney: TravelSolutionModel, journeySummaryModel: JourneySummaryModel, isReturnCase: boolean, cheapestTravelSolutionIds, itemsObj) {
    let selectedJourney = isReturnCase ? returnSelectedJourney : outwardSelectedJourney;
    let cheapestTravelIds = isReturnCase ? itemsObj.cheapestTravelSolutionIdsReturn : cheapestTravelSolutionIds;
    let fastestTravelIds = isReturnCase ? itemsObj.fastestTravelSolutionIdsReturn : itemsObj.fastestTravelSolutionIds;

    this.name = selectedJourney.DepartureTime.split('(').pop().split(')')[0] + `-` + selectedJourney.ArrivalTime.split('(').pop().split(')')[0];
    this.id = this.commonServices.getIdForEvents(selectedJourney, searchRequest, itemsObj.activeTab);
    this.price = this.getPrice(isReturnCase, itemsObj.activeTab, journeySummaryModel);
    this.brand = selectedJourney.Brand;
    this.category = selectedJourney.Changes !== 0 ? 'Connection' : 'Direct'
    this.variant = this.getVariant(selectedJourney);
    this.quantity = (searchRequest.Adult + searchRequest.Child);
    this.dimension1 = (new Date(`${selectedJourney.DepartureDate}`).toLocaleDateString("en-GB"));
    this.dimension2 = (new Date(`${selectedJourney.ArrivalDate}`).toLocaleDateString("en-GB"));
    this.dimension3 = this.commonServices.getDurationTime(selectedJourney);
    this.dimension4 = this.getTicketClass(journeySummaryModel, isReturnCase);
    this.dimension5 = this.getTicketType(journeySummaryModel, isReturnCase);
    this.dimension6 = isReturnCase ? 'Inward' : 'Outward';
    this.dimension7 = (outwardSelectedJourney && returnSelectedJourney) ? 'Return' : 'Single';
    this.dimension8 = selectedJourney.Changes.toString();
    this.dimension9 = this.getCheapestAndFastestTagsWithActiveTab(selectedJourney, cheapestTravelIds, fastestTravelIds, itemsObj.activeTab, isReturnCase);
    this.dimension10 = Math.abs(this.commonServices.calculateDiff(selectedJourney.DepartureDate)).toString() || undefined;
    this.dimension11 = this.isRailCardPresent(searchRequest);
    this.dimension12 = this.getRailCard(searchRequest, this.dimension11);
  }
  
  getPriceForItem(journey: TravelSolutionModel, activeTab) {
    if (activeTab === 0) return journey.SingleFare;
    else if (activeTab === 1) return journey.ReturnFare;
    return undefined;
  }

  setJObjectsWithExpandedServiceModel(searchRequest: SearchRequestModel, activeTab, journey, index, _selectedFare, journeyTypeForD6, productParmsObj) {

    this.name = journey.DepartureTime.split('(').pop().split(')')[0] + `-` + journey.ArrivalTime.split('(').pop().split(')')[0];
    this.id = this.getIdForEvents(journey, searchRequest, activeTab);
    this.price = this.getPriceForItem(journey, activeTab);
    this.brand = journey.Brand;
    this.category = journey.Changes !== `Direct` ? 'Connection' : 'Direct';
    this.variant = journey.Changes == '0' ? ('1:' + journey.DepartureTime.split('(').pop().split(')')[0] + '-' + journey.ArrivalTime.split('(').pop().split(')')[0]) : journey.CallingPointName;
    this.position = (index + 1).toString();
    this.dimension1 = new Date(journey.DepartureDate).toLocaleDateString("en-GB");
    this.dimension2 = new Date(journey.ArrivalDate).toLocaleDateString("en-GB");
    this.dimension3 = this.getDurationTime(journey);
    this.dimension4 = productParmsObj.TicketClass;
    this.dimension5 = productParmsObj.TicketType;
    this.dimension6 = journeyTypeForD6;
    this.dimension7 = productParmsObj.journeyType;
    this.dimension8 = journey.Changes.toString();
    this.dimension9 = this.isCheapestTravelSolution(journey, productParmsObj.cheapestArr);
    this.dimension10 = productParmsObj.diffOfDates.toString();
    this.dimension11 = productParmsObj.isRailCardPresent.toString();
    this.dimension12 = productParmsObj.railCards ? `'` + productParmsObj.railCards + `'` : undefined;
    this.dimension39 = journey.DepartureTime.split('(')[0].trim();
    this.dimension40 = journey.ArrivalTime.split('(')[0].trim();
    this.dimension41 = productParmsObj.company;

  }
  
  getIdMethod(searchRequest: SearchRequestModel, activeTab) {
    if (searchRequest && searchRequest.TravelSolutionDirection === 'OPEN_RETURN') return 'open_return';
    else if (activeTab === 0) return 'single';
    return 'return';
  }

  getIdForEvents(journey: TravelSolutionModel, searchRequest: SearchRequestModel, activeTab) {
    if (journey && searchRequest) {
      let id = "";
      id += `${journey.DepartureTime.split('(').pop().split(')')[0]}-${journey.ArrivalTime.split('(').pop().split(')')[0]}`; // stn codes

      let depDate = journey.DepartureDate.split("T");
      let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;

      id += depDateTimeStamp; // service departure timestamp
      id += `-${searchRequest.Adult}`;
      id += `-${searchRequest.Child}`;
      id += `-${this.getIdMethod(searchRequest,activeTab)}`;
      return id;
    }
  }

  getDurationTime(obj) {
    if (obj.Duration.indexOf('h') > -1) {
      return `${+(obj.Duration.split('h')[0]) >= 10 ? obj.Duration.split('h')[0] : '0' + obj.Duration.split('h')[0]}:${+(obj.Duration.split('h')[1].split('m')[0].trim()) >= 10 ? obj.Duration.split('h')[1].split('m')[0].trim() : '0' + obj.Duration.split('h')[1].split('m')[0].trim()}`
    }
    else {
      return `00:${+(obj.Duration.slice(0, -1)) >= 10 ? obj.Duration.slice(0, -1) : '0' + obj.Duration.slice(0, -1)}`;
    }
  }

  getPrice(isReturnCase: boolean, activeTab: number, journeySummaryModel: JourneySummaryModel) {
    if (isReturnCase) {
      return ((activeTab === 0) ? journeySummaryModel.ReturnSelectedFare.Price : 0);
    } else {
      return (journeySummaryModel.SingleSelectedFare.Price);
    }
  }

  getJEServicesDetailObj(services, allJEService, isReturnJEservice) {
    let res = [];
    services.forEach(serviceItem => {
      allJEService.forEach(service => {
        if (isReturnJEservice) {
          if (service.IsReturn && serviceItem.OfferId === service.OfferId && serviceItem.ServiceId === service.ServiceId) {
            res.push({ ...service, quantity: parseInt(serviceItem.Passenger) });
          }
        } else {
          if (!service.IsReturn && serviceItem.OfferId === service.OfferId && serviceItem.ServiceId === service.ServiceId) {
            res.push({ ...service, quantity: parseInt(serviceItem.Passenger) });
          }
        }

      });
    });
    return res;
  }
  getJE_Services(services: JourneyModel[], allJEService: JourneyExtraDetail[], isReturnJEservice: boolean) {
    let res = [];
    if (services && services.length > 0) {
      let journeyExtraObj = this.getJEServicesDetailObj(services, allJEService, isReturnJEservice);
      if (journeyExtraObj) {
        res.push(...journeyExtraObj);
      }
    }
    return res;
  }
  setMetricField(searchRequest) {
    this.metric1 = searchRequest.Adult;
    this.metric2 = searchRequest.Child;
    this.metric3 = (searchRequest.Adult + searchRequest.Child);
  }
  getJourneyIdForReviewBuyData(stnCode: string, ReservationDetailOne: ReservationDetail, journey: JourneyDetail, returnJourneyDetail: ReservationDetail) {
    let id = "";
    if (stnCode) {
      id += stnCode;
      let depDate = ReservationDetailOne.DepartureTime.split("T");
      let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;
      id += depDateTimeStamp;
      id += `-${journey.Adult}-${journey.Child}`;
      const isReturnOrSingle = (ReservationDetailOne && returnJourneyDetail) ? '-return' : '-single';
      let journeyType = (journey.JourneyType.indexOf("Open Return journey") > -1) ? '-open_return' : isReturnOrSingle;
      id += journeyType;
      return id;
    }
  }
  isRailCardPresent(searchRequest: SearchRequestModel) {
    let isRailCardPresent = false;
    if (searchRequest && searchRequest.RailCardList && searchRequest.RailCardList.length > 0) {
      isRailCardPresent = true;
    }
    return isRailCardPresent;
  }
  getRailCard(searchRequest: SearchRequestModel, isRailCardPresent: boolean) {
    if (isRailCardPresent) {
      let railCards = '';
      searchRequest.RailCardList.forEach(obj => {
        railCards += `${obj.RailCard}:${obj.RailCardCount}|`;
      });
      railCards = railCards.slice(0, -1);
      return railCards || undefined;
    }
  }
  getOperator(journey: TravelSolutionModel) {
    if (journey) {
      return this.getCompany(journey);
    }
  }
  getVariant(journey: TravelSolutionModel) {
    return (journey.Changes === 0 ? ('1:' + journey.DepartureTime.split('(').pop().split(')')[0] + '-' + journey.ArrivalTime.split('(').pop().split(')')[0]) : journey.CallingPointName);
  }
  getVariantForReviewBuyData(journeyDetail: ReservationDetail, name) {
    let changes = Number(journeyDetail.Changes);
    return (changes === 0 ? ('1:' + name) : journeyDetail.CallingPointName);
  }
  getCheapestAndFastestTagsWithActiveTab(journey: TravelSolutionModel, cheapestArr: any[], fastestArr: any[], activeTab: number, isReturnCase: boolean) {
    let tags = "";
    if (activeTab === 1 && isReturnCase) {
      if (this.getIfFastest(fastestArr, journey)) {
        tags = 'Fastest';
      }
    } else {
      if (this.getIfCheapest(cheapestArr, journey)) {
        tags += 'Cheapest';
      }
      if (this.getIfFastest(fastestArr, journey)) {
        tags += (tags.length > 0) ? '|Fastest' : 'Fastest';
      }
    }
    return (tags || undefined);
  }

  getIfFastest(fastestArr : any[], journey : TravelSolutionModel){
    return (fastestArr && (fastestArr.length > 0) && (fastestArr.indexOf(journey.TravelSolId) > -1) && (Number(journey.Operator) === 1 || Number(journey.Operator) === 2));
  }
  getIfCheapest(cheapestArr : any[], journey : TravelSolutionModel){
    return (cheapestArr && (cheapestArr.length > 0) && (cheapestArr.indexOf(journey.TravelSolId) > -1) && (Number(journey.Operator) === 1 || Number(journey.Operator) === 2));
  }
  getVariantForJEService(service) {
    if (service.Description === 'Bicycle Reservation' || service.Description === 'PLUSBUS') {
      return service.IsReturn ? 'Return' : 'Outward';
    } else {
      return service.ServiceName;
    }
  }
  getTicketClass(journeySummaryModel: JourneySummaryModel, isReturnCase: boolean) {
    if (isReturnCase) {
      return (journeySummaryModel.ReturnSelectedFare) ? journeySummaryModel.ReturnSelectedFare.TicketClass : journeySummaryModel.SingleSelectedFare.TicketClass;
    } else {
      return journeySummaryModel.SingleSelectedFare.TicketClass;
    }
  }
  getTicketType(journeySummaryModel: JourneySummaryModel, isReturnCase: boolean) {
    if (isReturnCase) {
      return (journeySummaryModel.ReturnSelectedFare) ? journeySummaryModel.ReturnSelectedFare.TicketType : journeySummaryModel.SingleSelectedFare.TicketType;
    } else {
      return journeySummaryModel.SingleSelectedFare.TicketType;
    }
  }
  getIdForJE_Services(service) {
    let id = "";
    if (service) {
      let direction = service.IsReturn ? '_return' : '_outward';
      if (service.Description === "Bicycle Reservation") {
        id += ("Bike" + direction);
      } else if (service.Description === "London Travelcard") {
        let zone = service.ServiceName ? service.ServiceName.split(" ").slice(2, service.ServiceName.length).join("").toLowerCase() : "";
        id += ("Travelcard" + zone + direction);
      } else if (service.Description === "PLUSBUS") {
        id += ("PlusBus" + direction);
      }
    }
    return id || undefined;
  }

  getRailcardCountObj(journeyDetail: ReservationDetail, railCardFromStorage) {
    let railcardsList = railCardFromStorage.Railcard;
    let CountObj = {};
    journeyDetail.Fares.forEach(fare => {
      if (fare.Railcard && fare.Railcard !== "No Railcard") {
        let cardDetail = railcardsList.filter(card => card.Name === fare.Railcard);
        let key = (cardDetail && cardDetail.length > 0) ? cardDetail[0].Code : fare.Railcard;
        CountObj[key] = (CountObj[key] ? (CountObj[key] + 1) : 1);
      }
    });
    return CountObj;
  }
  getRailcardsForReviewBuyData(journeyDetail: ReservationDetail) {
    let railCardFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
    let railcardsString = '';
    if (railCardFromStorage && railCardFromStorage.Railcard && journeyDetail.Fares && journeyDetail.Fares.length > 0) {
      let CountObj = this.getRailcardCountObj(journeyDetail, railCardFromStorage);
      Object.keys(CountObj).forEach(key => {
        railcardsString += ((railcardsString.length > 0) ? `|${key}:${CountObj[key]}` : `${key}:${CountObj[key]}`);
      });
      return railcardsString || undefined;
    }
  }
  getRailcardPresenceForReviewBuyData(journeyDetail: ReservationDetail) {
    let isRailcardPresent = false;
    if (journeyDetail.Fares && journeyDetail.Fares.length > 0) {
      journeyDetail.Fares.forEach(fare => {
        if (fare.Railcard && fare.Railcard !== "No Railcard") {
          isRailcardPresent = true;
        }
      });
    }
    return isRailcardPresent;
  }
  getPositionOfUpsellsService(service) {
    if (service && service.Description) {
      let description = service.Description;
      let position = undefined;
      if (description === "PLUSBUS") {
        position = 1;
      } else if (description === "Bicycle Reservation") {
        position = 2;
      } else if (description === "London Travelcard") {
        position = 3;
      }
      return position;
    }
  }

  calculateDiff(dateSent) {
    let currentDate = new Date();
    dateSent = new Date(dateSent);

    return Math.floor((Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) - Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate())) / (1000 * 60 * 60 * 24));
  }

  isCheapestTravelSolution(currentTravelSolution, cheapestArr) {
    if (cheapestArr != null && cheapestArr != undefined) {
      if ((cheapestArr.indexOf(currentTravelSolution.TravelSolId) > -1) && (currentTravelSolution.Operator === 1 || currentTravelSolution.Operator === 2)) {
        return "Cheapest";
      }
      else {
        return undefined;
      }
    }
  }

  getSessionId() {
    try {
      let Id = sessionStorage.getItem('SessionId');
      if (Id) {
        this.SessionId = Id;
      }
      else {
        this.storageDataService.setSessionStorageData('SessionId', Guid.create(), false);
        this.SessionId = sessionStorage.getItem('SessionId');
      }
    }
    catch (err) {
      console.log(err);
    }
  }
}
