import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppConstantsService {
  noReservation: string = 'NORESERVATION';
  required: string = 'REQUIRED';
  optional: string = 'OPTIONAL';
  unsupported: string = 'UNSUPPORTED';
  mandatory: string = 'MANDATORY';
  plusBus: string = 'PLUSBUS';
  bicycleReservation: string = 'Bicycle Reservation';
  londonTravelcard: string = 'London Travelcard';
  currencySymbol: string = '£'
  timeZone:string = "Europe/London";
  currency : string = 'GBP';
  LocaleDateString : string = 'en-GB';
  Country: string = 'gb';
  Language: string = 'en';
  version: number = 1;
  capsLock: string = 'CapsLock';
  plusBusText: string = 'Plusbus';
  bikeReservationText: string = 'Bike Reservation';
  bikeTxt: string = "Bike";
  travelCardTxt: string = "Travelcard";
  trainUpperCaseTxt: 'TRAIN';
  bikeReservationTxt: string =  'Bike reservation';
}

export class BookingTypeEnum {
  NonSeason: string = 'NonSeason';
  Season: string = 'Season';
  FlexiSeason: string = 'Flexi';
  voucherCodePaymentType: string = 'DiscountCode';
  railCardDiscountPaymentType: string = 'RailcardDiscount';
  trainTicketPaymentType: string = 'TrainTicket';
  deliveryPaymentType: string = 'Delivery';
  trainTicketText: string = 'train ticket';
  promotionDiscountPaymentType: string = 'PromotionDiscount';
  receipt: string = 'receipt';
  groupSaveDiscountPaymentType: string = 'GroupsaveDiscount';
}

export class DeliveryModeEnum {
  FirstClassPost: string = 'First Class Post';
  NextDayDelivery: string = 'Next Day Delivery';
  TOD: string = 'Collect your ticket from the station';
  ETicket: string = 'eTicket';
  SmartCard: string  = 'Smartcard';
  firstClassPostMsg: string = 'Post - First Class';
  nextDayDeliveryPostMsg: string = 'Post - Next day delivery';
  postMsg: string = 'Post';
}

export class AppRouteEnum {
  Payment: string = 'payment';
  Confirmation: string = 'booking-confirmation';
  JourneyExtras: string = 'travel-extras';
  ReviewBuy: string = 'shopping-basket';
  DeliveryMode: string = 'delivery-options';
  SeasonSolutions: string = 'season-search-results';
  MixingDeck: string = 'search-results';
  ValidatePaymentDo: string = 'validatePayment.do';
  ValidateEnrollmentDo: string = 'validateEnrollment.do';
  Register: string = 'register';
  ForgotPassword: string = 'forgotten-password';
  Account: string = 'account';
  ViewBooking: string = 'account-view-booking';
  Login: string = 'login';
  FlexiSolutions: string = 'flexi-search-results';
  MyBookings: string = 'account-my-bookings';
  RegistrationSuccess: string = 'registration-success';
  MyPreferences: string = 'account-my-preferences';
  MyProfile: string = 'account-my-profile';
  PaymentsAndVouchers: string = 'account-my-payments';
  Reset: string = 'reset-password';
  Page500: string='error-500';
  CojMixingDeck: string = 'account-view-booking/change-of-journey/search-results';
  CojReviewBuy: string = 'account-view-booking/change-of-journey/review-and-buy';
  CojPayment: string = 'account-view-booking/change-of-journey/payment';
  upgradeSelect: string = 'account-view-booking/upgrade/select';
  upgradeReviewBuy: string = 'account-view-booking/upgrade/review';
  upgradePayment: string = 'account-view-booking/upgrade/payment';
  amendSearchPage: string = 'account-view-booking/amend-seat';
  amendReviewBuyPage: string = 'account-view-booking/amend-review';
  //Start PICO-1171 declare fortress Content-Type & fortress Client-Type
  fortressContentType: string = 'application/x-www-form-urlencoded';
  fortressClientType: string = 'browser'
  //End
  // Start PICO-1792 declare for all deliveryMode
  DeliveryMode_TOD: string = 'TOD';
  DeliveryMode_ETicket: string = 'eTicket';
  DeliveryMode_Smart_Card: string = 'SMART_CARD';
  DeliveryMode_FRTFIRSTCLASS: string = 'FRTFIRSTCLASS';
  DeliveryMode_FRTNEXTDAY: string = 'FRTNEXTDAY';
  RefundBooking: string='account-view-booking/refund';
  DeliveryModeETicket: string = 'ETICKET';
  DeliveryMode_NEXTDAYDELIVERY: string = 'NEXTDAYDELIVERY';
  resetEmail: string = 'reset-email';
  verifyEmail: string = 'verify-email';
  groupSave: string = 'Groupsave';
  deliveryAndReviewbuy: string = 'delivery-and-reviewbuy';
  isBrowserBackButton: string = 'isBrowserBackButton';
  DeliveryMode_FIRSTCLASSPOST: string = 'FIRSTCLASSPOST';
  seasonRouteUrlForApp = 'my-seasons';
  refundableTicket: string = 'Refundable ticket';
  nonRefundableTicket: string = 'Non refundable ticket';
  clubAvanti: string  = 'account-club-avanti';
  setUpAnAlertClubAvanti: string = 'tickets-and-savings/ways-to-save/ticket-alerts'; 
  viewClubAvantiFAQ: string = 'tickets-and-savings/club-avanti#faqs';
  clubAvantiTermsAndCondition: string = 'tickets-and-savings/club-avanti#terms-and-conditions';
  clubAvantiToMyProfileFocusRoute: string = 'account-my-profile#mp-personal-form';
  clubAvantiToCommPrefrenceFocusRoute: string = 'account-my-preferences#mp-communication';
  clubAvantiBookNowURL: string = 'travel-information/plan-your-journey';
  DeliveryMode_NextDayDelivery: string = 'Next day delivery';
  DeliveryMode_TOD_Collect_At_Station: string = 'Collect at station';
  appRedirectedURLToMyProfileForChangeEmail: string = 'change-email';
  mpCommunicationFragmentId: string = 'mp-communication';
  mpPersonalFormFragmentId: string ='mp-personal-form';
  collect_at_any_stationText: string = 'Collect at station';
  newGroupSave: string = 'GroupSave';
  myAccountPrefix: string = 'account';
  newBookingFlowRailcardAppliedTxt: string  = 'Railcard(s) applied';
}

export class NativePaymentMethodEnum {
  netsPaypal : string = 'NETS_PAYPAL';
  netsApplePay : string = 'NETS_APPLEPAY';
  netsGooglePay : string = 'NETS_GOOGLEPAY';
  googlePayText: string = 'Google Pay';
  applePayeText: string = 'Apple Pay';
  cardText: string = 'Card';
  payPal: string = 'Pay pal';
  payPalText: string = 'PayPal';
  eVouchers: string = 'eVoucher';
}

export class ErrorMessageEnum {
  soldOutErrorMessage : string = 'Sorry, all services for your selected journey are sold out. Please amend your search to travel on a different date/at a different time to view available trains.';
  soldOutMessageOnPriceSummary : string = 'Sorry, all the services for your selected outbound or return times are sold out';
  removeBasketItemErrorMessage : string = 'You can not purchase a nonseason ticket while there are one or more season tickets in your basket. Please delete the tickets from your basket and try again.';
  commonErrorMessage : string = 'Please try again, and if it keeps happening, check back with us a little later.';
  isCompleteOrderAPIFail: string = `Sorry we are unable to complete your purchase at this time. Please try again in 24 hours or for <a href="https://www.avantiwestcoast.co.uk/payment-error" target="_blank" class="text-spark-dark payment-sorry-popup-link">more information</a>.`;
  nreApiFailedErrorMessage: string = 'Please choose your preferred train(s) on the train times page. All available tickets will be shown once you select a train time and try searching again.';
  restrictedReturnFareMessage: string = 'The return journey you’ve chosen isn’t Off-Peak. You can switch to an Anytime ticket for full flexibility, or please choose a different train for your return.';
}

// enum for Itemlistname and itemlistid ga4 datalyer
export class Ga4ItemListEnum {
  cartName: string = 'cart';
  cartId: number = 4;
  transactionName: string = 'sale';
  transactionId: number = 6;
  resultPageItemListName: string = 'results page';
  resultPageImpressionItemListId: number = 1;
  resultsPageSelectionItemListId: number = 3;
  travelExtraItemListName: string = 'travel extras';
  travelExtraItemListId: number = 2;
  checkoutItemListName: string = 'checkout';
  checkoutItemListId: number = 5;
  seatPickerScreenName: string = 'seat picker - change seat';
  seatPickerScreenNameInCaseExitAndQuit: string = 'seat picker - quit';
  saveSelectionAction: string = 'save_selection_success';
  journeyDetailsAction: string = 'journey_details';
  seatPickerAction: string = 'seat_picker_features';
  openedSeatPickerFromBooking: string = 'Booking';
  openedSeatPickerFromCoj: string = 'Change of Journey';
  openedSeatPickerFromUpgrade: string = 'Upgrade';
  openedSeatPickerFromChangeSeat: string = 'Amend Seat';
  openAction: string = 'open';
  closeAction: string = 'closed';
  exitAction: string = 'exit';
  cancelAction: string = 'quit';
  journeyDetailsSeeMoreAction: string = 'journey_details_see_more';
  journeyDetailsSeeLessAction: string = 'journey_details_see_less';
  seatPickerFeatureSeeMoreAction: string = 'seat_picker_features_see_more';
  seatPickerFeatureSeeLessAction: string = 'seat_picker_features_see_less';
  saveSelectionAttemptAction: string = 'save_selection_attempted';
  saveSelectionFailedAction: string = 'save_selection_failed';
  saveSeatPickerOpenFailedAction: string = 'seat_picker_open_failed';
  upgradeProductImpressionListName: string = 'Product Impression';
  upgradeProductClickListName: string = 'Product Click';
  upgradeProductItemListId: number = 7;
  bikeSpaceAvailable: string = 'BIKE';
}
export class Ga4DatalayeEventNameEnum {
  search : string = 'search';
  viewItemList : string = 'view_item_list';
  viewItem : string = 'view_item';
  selectItem : string = 'select_item';
  purchase : string = 'purchase';
  addPaymentInfo : string = 'add_payment_info';
  addDeliveryOption : string = 'add_delivery_option';
  removeFromCart : string = 'remove_from_cart';
  confirmOrderDetails : string = 'confirm_order_details';
  viewCart : string = 'view_cart';
  pageMetaData : string = 'page_meta_data';
  virtualPageView : string = 'virtual_page_view';
  addToCart : string = 'add_to_cart';
  beginCheckout : string = 'begin_checkout';
  upgrade: string = 'upgrade_default';
  upgradeFeatureText = 'upgrade';
  changeSeatPicket : string = 'seat_picker';
  refundSummaryEvent : string = 'refund_summary';
  refundCancelledEvent : string = 'refund_cancelled';
  refundConfirmationEvent : string = 'refund';
  eventNameOfSearchCOJ: string = 'modify_default';
  changeOfJourney : string = 'change_of_journey';
  passengerAssistCategory : string = 'Passenger Assist';
  outboundClick : string = 'outbound_click';
  passengerAssistEvent : string = 'passenger_assist';
  bookPassengerAssistCTA : string = 'Book passenger assist';
  sucessfullyAccCreatedForClubAvanti : string = 'account_created';
  accountFailedForClubAvanti : string = 'account_failed';
  clubAvantiFeature : string = 'Club Avanti';
  clubAvantiEvent : string = 'club_avanti';
  bikeReservation : string = 'bike_reservation';
  featureBooking : string = 'Booking';
  addBikeReservation : string = 'add';
  outwardBikeReservation : string = 'outward';
  returnBikeReservation : string = 'return';
  confirmationForBikeReservation : string = 'confirmation';
  trackYourTrainEventName: string = 'track_your_train';
  trackYourTrainCategoryName: string = 'Track your train';
  trackYourTrainBtnOnClickAction: string = 'open';
  trackYourTrainReadMoreBtnClickAction: string = 'read more';
  trackYourTrainReadLessBtnClickAction: string = 'read less';
  trackYourTrainCloseBtnClickAction: string = 'close';
  quickBuyCTA : string = 'Quick buy';
  quickBuyEvent : string = 'quick_buy';
  soldOutClass : string = 'sold_out_class';
  partiallySoldOut : string = 'Partially Sold Out';
  fullSoldOut : string = 'Full Sold Out';
  clubAvantiNavigation: string = 'club_avanti_navigation';
  viewJourneyHistory : string = 'view_journey_history';
  clubAvantiFooter : string = 'club Avanti - Footer';
  viewJourneyHistoryActionGA4ClubAvanti: string = 'view journey history';
  ctaClickEventGA4ClubAvanti: string = 'cta_click';
  bookTicketActionGA4ClubAvanti: string = 'book ticket';
  technicalErrorEventGA4ClubAvanti: string = 'technical_error';
  technicalErrorCategoryGA4ClubAvanti: string = 'club Avanti - technical error';
  bookNowCategoryGA4ClubAvanti: string = 'club Avanti - book now';
  viewJourneyHistoryCategoryGA4ClubAvanti: string = 'club Avanti - view journey history';
  bookNowCtaNameGA4ClubAvanti: string = 'Book now';
  footerNavigation : string = 'footer_navigation';
  clubAvantiNaviagtionCategoryGa4 : string = 'club Avanti - Header';
  loginEventOnSuccess: string = 'login';
  statusOnSuccess: string = 'Submit Success';
  loginEventOnFailure: string = 'login_fail';
  statusOnFailure: string = 'Submit Fail';
  loginStatus: string = 'Logged In';
  emailAddresstext: string = 'Email Address';
  passwordText: string = 'Password';
  filterGA4EventNameText: string = 'filter';
  classTabGA4EventNameText: string = 'class_tab';
  changeSeatEventNameForNewFlow: string = 'change_Seat';
  discountCodeAppliedEventName: string = 'discount_applied';
  changeSeatPreferenceEventNameForNewFlow: string = 'change_seat_preference';
  bookingSearchSource: string = 'Booking';
  nreSearchSource: string = 'NRE';
  partnershipSearchSource: string = 'Partnerships';
}

export class TravelSolutionOperatorEnum {
  avantiOnly: string = 'Avanti only';
  multipleOperators: string = 'Multiple operators';
  avantiPlus: string = 'Avanti Plus';
  all: string = 'All';
  lumo: string = "Lumo";
}

export class TravelSolutionDirectionEnum {
  oneWay : string = 'ONE_WAY';
  return : string = 'RETURN';
  openReturn : string = 'OPEN_RETURN';
  season : string = 'SEASON';
  forward: string = 'FORWARD';
  earlier: string = 'EARLIER';
  later: string = 'LATER';
  both: string = 'Both';
  outward_Leg: string = 'Outward_Leg';
  return_Leg: string = 'Return_Leg';
  flexi: string = 'FLEXI';
}

export class Ga4DatalayerConstantEnum {
  Direct : string = 'Direct';
  Fare : string = 'Fare';
  Service : string = 'Service';
  Yes : string = 'Yes';
  No : string = 'No'; 
}

export class TravelSolutionJourneyTypeEnum {
  single : string = 'Single';
  return : string = 'Return';
  anytimeReturn : string = 'Anytime_Return';
  season : string = 'Season'; 
  openReturn : string = 'Open_return';
  flexiSeason : string = 'Flexi Season';
  daySeason : string = 'Day Season';
  inward : string = 'Inward';
  outward : string = 'Outward';
  fullyRefunded : string = 'Full Refund';
  partiallyRefunded : string = 'Partial Refund';
  travelType : string = 'DEPARTAFTER';
  departTravelTypeText: string = 'Depart After';
  arriveByTravelTypeText: string = 'Arrive By';
  railcardStationListText: string = 'railcardStationList';
  isSeason: string = 'IsSeason';
  outwardString: string = 'outward';
  returnString: string = 'return';
  openReturnText: string = 'Open-Return';
  isUpgrade: string = 'isUpgrade';
  isCOJ : string  = 'isCOJ';
}

export class PageTypeEnum {
  search : string = 'search';
  checkout : string = 'checkout';
  confirmation : string = 'confirmation';
  validatePayment : string = 'validatePayment';
  account : string = 'account';
  selectTicketAndClass : string = 'selectTicketAndClass';
}

export class TicketTypeEnum {
  familyPlus: string = 'Family Plus';
  advanceSingle: string = "Advance Single";
  offPeakSingle: string = "Off-Peak Single";
  superOffPeakSingle: string = "Super Off-Peak Single";
  anytimeReturn: string = "Anytime Return";
  advanceReturn: string = "Advance Return";
  offPeakReturn: string = "Off-Peak Return";
  superOffPeakReturn: string = "Super Off-Peak Return";
  anytimeDaySingle: string = "Anytime Day Single";
  familyRefundable: string = "Family Refundable";
  earlyBirdAnytimeSingle : string = "Early Bird Anytime Single";
  anytimeSingle : string = "Anytime Single";
  firstClassTicketType : string = "1st";
  anytimeDayReturn : string = "Anytime Day Return";
  partnerOffer : string = "partner offer";
  advanceTicket : string = "advance";
  familyTicket : string = "family";
  partnerOfferPremium : string = "Partner Promo";
  familyAdvance : string = "Family Advance";
}

export class SeatPrefrenceType {
  facingSeat: string = 'FACE';
  backSeat: string = 'BACK';
  windowSeat: string = 'WIND';
  aislSeat: string = 'AISL';
  tableSeat: string = 'TABL';
  powerSocket: string = 'POWE';
  quietCoach: string = 'QUIE';
  nearLuggageRack: string = 'LUGG';
  nearToilet: string = 'NRWC';
  facingSeatName: string = 'Forward facing seat';
  backSeatName: string = 'Backward facing seat';
  windowSeatName: string = 'Window seat';
  aislSeatName: string = 'Aisle seat';
  tableSeatName: string = 'Table seat';
  powerSocketName: string = 'Power socket';
  quietCoachName: string = 'Quiet coach';
  nearLuggageRackName: string = 'Near Luggage Rack';
  nearToiletName: string = 'Near toilet';
  noPreference: string = 'NoPreference';
  facingSeatTxt: string = 'facing seat';
  seatTxt: string = 'seat';
  coachTxt: string = 'Coach';
  quiet: string = 'Quiet';
  AirlSeat: string = 'AIRL';
}

export class BookPassangerAssistEnum {
  single: string = 'Single';
  openReturn : string = 'Open Return';
}

export class AccountHeaderLabelEnum {
  bookings: string = 'My Bookings';
  preferences: string = 'My Preferences';
  paymentsAndVouchers: string = 'Payments & Vouchers';
  profile: string = 'My Profile';
  clubAvanti: string = 'Club Avanti';
}

export class PaymentAndVoucherCreditCardTypeEnum {
  amexCard: string = '0';
  maestroCard: string = '4';
  visaCard: string = '6';
  masterCard: string = '7';
}
// PICO-2212, PICO-2213 & PICO-2215 created enum for showing continue & review buy button on search results page
export class QuickBuyEnum {
  default: string = "DEFAULT";
  quickBuy: string = "QUICK_BUY";
}
// PICO-2212, PICO-2213 & PICO-2215 set key in localstorage for quick buy
export class LocalStorageKeyEnum {
  checkoutFlowStrategy: string = 'checkoutFlowStrategy';
  isQuickBuyOrContinue: string = 'isQuickBuyOrContinue';
  reviewMergedFlow: string = 'reviewMergedFlow';
  reviewMergedFlowAppSetting: string = 'reviewMergedFlowAppSetting';
  version: string = 'version';
  tabIndex: string = 'tabIndex'
  bookingRefrenceNumber: string = 'BookingRefrence';
  railCardListForUpgradeDataLayer = 'railCardListForUpgradeDataLayer';
  trackMyTrainFlowStrategy: string = 'trackMyTrainFlowStrategy';
  tmtBookingIdForPullDown: string = 'tmtBookingId';
  tmtIsReturnJourneyForPullDown: string = 'tmtIsReturnJourney';
  journeyList: string = 'journeyList';
  customerBookingsResponse: string = 'customerBookingsResponse';
  locationAndSiteCoreCacheDataCreationDate: string = 'locationAndSiteCoreCacheDataCreationDate';
  upgradeAboveFold: string = 'upgradeAboveFold';
  customerKey: string = 'CustomerKey';
  firstName: string = 'FirstName';
  loyaltyPortalShow: string = 'loyaltyPortalShow';
  myProfileFromClubAvanti: string = 'myProfileFromClubAvanti';
  myPreferencesFromClubAvanti: string = 'myPreferencesFromClubAvanti';
  prepareOrderId: string = 'PrepareOrderId';
  platformNoInfoOfCustomerBookingResponse = 'platformNoInfoOfCustomerBookingResponse';
  nreDataResponse: string = 'nreDataResponse';
  handOffRequestId: string = 'handOffRequestId';
  newDesignJourneyBookingFlow: string = 'newBookingFlowControl';
  selectedTicketFareDetail: string = 'selectedTicketFareDetail';
  titleText: string = 'Title';
  lastNameText: string = 'LastName';
  sharedSiblingText: string = 'sharedSibling';
  isReturnFromPaymentOrBasket: string = 'IsReturnFromPaymentOrBasket';
  isBrowserBackButton: string = 'isBrowserBackButton';
  getDeliveryAndBasketJourneyResponse: string = 'getDeliveryAndBasketJourneyResponse';
  enhancedGetDeliveryAndBasketJourneyRequest: string = 'enhancedGetDeliveryAndBasketJourneyRequest';
  originalEmailText: string = 'OriginalEmail';
  email: string = 'Email';
  paymentForSmartcard: string = 'paymentForSmartcard';
  isChangeReplace: string = 'isChangeReplace';
  paymentData: string = 'paymentData';
  viewOtherTrainTimesFromReturn: string = 'viewOtherTrainTimesFromReturn';
  viewOtherTrainTimesFromOutward: string = 'viewOtherTrainTimesFromOutward';
  JourneyValidforPayment: string = 'JourneyValidforPayemnt';
  validatePaymentResponseText: string = 'enhancedValidatePaymentResponse';
  fortCidText: string = 'fortcid';
  fortClubText: string = 'fortclub';
  isRedirectFromValidateDo: string = 'isRedirectFromValidateDo';
}
export class JourneyTypeEnum {
  upcomingJourney: string = 'UpcomingJourney';
  pastJourney: string = 'PastJourney';
  allForSeason: string = 'All'
  refundedJourney: string = 'Refunded';
  outwardRefunded: string = 'Outward Refunded';
  returnRefunded: string = 'Return Refunded';
  pastJourneyType: string = 'Past Journey';
  outwardOnlyText: string = 'Outward';
  returnOnlyText: string = 'return';
  outboundOnlyText: string = 'outbound';
  outboundAndReturnOnlyText: string = 'outbound and return';
  journeyText: string = 'Journey';
  paymentTypeText: string = 'PaymentType';
}
export class TabIndexValueEnum {
  upcomingJourneyTabIndex: number = 0;
  pastJourneyTabIndex: number = 1;
  seasonJourneyTabIndex: number = 2;
}

export class ForgotPasswordMsgEnum {
  sentEmailMessage: string = 'If the E-mail address was valid, a password reset link will be sent. If you do not receive an email in the next few minutes then please check your junk email or try re-entering your email address';
  resetEmailErrorMessage: string = 'Hmm… we don’t recognise this email address. Please check it’s the same email address you registered with.';
  resetEmailSuccessMessage: string = 'If the E-mail address was valid, a password reset link will be sent';
  captionTxtForResetPassword: string = 'Enter the email address associated with your account, and we’ll email you a link to reset your password.';
  resetEmailVerificationLinkMsg: string = 'If the E-mail address was valid, a verification link will be sent. If you do not receive an email in the next few minutes then please check your junk email or try re-entering your email address.';
}

export class NotificationErrorMsg {
  loginToContinueMessage: string = 'Please log in to continue booking.';
  unauthorizedTitle: string = 'Sorry, you can’t access this currently';
  changePassTitle: string = 'Password has been changed';
  changePassMessage: string = 'The password has been successfully changed, please <b>log in</b> to continue.';
  upgradeUnavailableTitle: string = 'Sorry, online upgrade unavailable';
  upgradeUnavailableMsg: string = 'All the reservable seats in the next class up are taken, but don’t worry. We have unreserved seating on all our trains so you can upgrade onboard (subject to availability). Just take an unreserved seat in the class of travel <b>you’d like to upgrade to and our Train Manager will sort the rest.</b>';
  cojUnavailableTitle: string = 'Sorry, this ticket can’t be amended here';
  cojUnavailableMsg: string = 'Amending this type of ticket currently isn’t possible on the website, but we’re working on it. Your ticket has flexibility built-in (view the terms and conditions in your booking summary) but, if you still need to change it, just download <a href="https://www.avantiwestcoast.co.uk/tickets-and-savings/download-our-app" target="_blank" class="dark-spark f-16 lh-22 underline text-underline-offset-4">our app.</a>';
  passwordResetLinkTitle: string = 'Password reset link sent!';
  emailVarificationLinkTitle: string = 'Verification link sent!';
  backToSearchPageMsgFromReviewBuy: string = 'Are you sure you want to go back? Your selected journey is still saved. Please recheck your basket before checkout.';
  backToSearchPageTitleFromReviewBuy: string = 'Going back?';
  verifyEmailAddressTitle: string = 'Verify your email address';
  verifyEmailNotificationMsgFromBooking: string = 'To use your post-purchase experiences, please verify your email!';
  noDeliveryModeInformation: string = 'We apologise for the inconvenience, but it appears that none of the ticket delivery options are currently available for your selected journey. Please choose another journey. Thank you for your understanding and patience.'
  deliveryModesUnavailabitilyTitle: string = 'Delivery options unavailable';
  noDeliveryModeSelected: string = 'No delivery modes added for your selected journey(s). Please add delivery modes or remove this journey.'
  noDeliveryModeSelectedTitle: string = 'Delivery options';
  confirmedGoldCardTiltle: string = "Gold record card confirmed";
  confirmedGoldCardMessage: string = "A Gold Record Card will be sent to your registered address within 7 days.";
  expiredJourneyNotificationTitle: string = "Oops! Your seat reservation has expired";
  expiredJourneyNotificationMessage: string = "We noticed that the seat reservation in your basket has expired. Unfortunately, this means that we have removed your journey from the basket and the seat is no longer available.";
  onlineRefundForSmartCardNotificationErrorMsg: string = 'Unfortunately, online refunds are not available for tickets purchased using smartcard as the delivery method. To request a refund, please contact our Customer Support team. We apologise for any inconvenience and appreciate your understanding.';
  onlineRefundForTODNotificationErrorMsg: string = 'Regrettably, online refunds for tickets cannot be processed once they have been collected at the station. To request a refund, kindly contact our Customer Support team. We apologise for any inconvenience and appreciate your understanding.';
  onlineRefundForPostNotificationErrorMsg: string = 'Unfortunately, online refunds are not available for tickets purchased using post as the delivery method. To request a refund, please contact our Customer Support team. We apologise for any inconvenience and appreciate your understanding.';
  onlineRefundErrorTitle: string = 'Online refund is not possible';
  changeDeliveryMethodInfoMsg : string = 'You cannot change the ticket delivery method for this journey. To amend the delivery method, please remove this journey and book it again.';
  bikeReservationSuccessTitle : string = 'Your bike reservation is now confirmed';
  bikeReservationFailureTitle : string = 'Something went wrong!';
  bikeReservationFailureInfoMsg : string = 'Our apologies for the inconvenience. We’re working behind the scenes to get things back on track. Thank you for your patience and understanding. Please try again later.';
  registerClubAvantiFailureTitle : string = 'Something went wrong!';
  registerClubAvantiFailureInfoMsg : string = 'Our apologies for the inconvenience. We’re working behind the scenes to get things back on track. Thank you for your patience and understanding. Please try again later.';
  clubAvantiErrorMessageForBlankResponse: string = 'Something went wrong!';
  deleteAddressConfirmationMessage: string = 'Are you sure you want to delete this address? Once removed, it can’t be recovered.';
  deleteCardConfirmationMessage: string = 'Are you sure you want to delete this card? Once removed, it can’t be recovered.';
}

export class CommonIconImg {
  minorDisruptionIconImg: string = 'assets/images/minor_disruption.png';
  goodServiceIconImg: string = 'assets/images/good_service.png';
  exclamationIConImg: string = 'assets/images/exclamation-mark-icon.svg';
  exclamationIConImgForNoDelivery: string = 'assets/images/exclamation_icon.svg';
  changeEmailIconImage: string = 'assets/images/change-email.svg';
  exclamationWarningIconImg: string = 'assets/images/exclamation_warning.svg';
  successWhiteCheckIconImg: string = 'assets/images/success-white-check.svg';
}

export class SessionTimeOutEnum {
  sessionTimeOutTitle: string = 'Your session has expired';
  sessionTimeOutWarningTitle: string = 'Your session is going to time out';
  backToHomePageCTA: string = 'Back to home page';
  extendMySessionCTA: string = 'Extend my session';
  signInCTA: string = 'Sign in';
}

export class TitleListEnum {
  Mr: string = 'Mr';
  Ms: string = 'Ms';
  Mrs: string = 'Mrs';
  Miss: string = 'Miss';
  Dr: string = 'Dr';
  Rev: string = 'Rev';
  Lady: string = 'Lady';
  Lord: string = 'Lord';
  Sir: string = 'Sir';
  Mx: string = 'Mx';
  Dame: string = 'Dame';
  Other: string = 'Other';
}

export class TrackMyTrainEnum {
  someSeatLevelText:  string = 'Some seats';
  manySeatLevelText: string = 'Many seats';
  noSeatLevelText: string = 'No seats';
  trainCoachTypeText: string = '- 1st class';
  someSeatsCoachColor: string = '#F4CA40';
  manySeatsCoachColor: string = '#6CAF35';
  noSeatsCoachColor: string = '#E42B00';
  noCoachAvailable: string = '#C5CFD9';
  dayTimeRepresentationText: string = ' a.m.';
  nightTimeRepresentationText: string = ' p.m.';
  busReplacementOperatorText: string = 'Bus replacement';
  avantiTrainOperatorText: string = 'Avanti';
  trackYourTrainButtonHeadinText: string = 'Track my train';
  trainOnTimeText : string = 'On time';
  trainDelayedText: string = 'Delayed';
  trainCancelledText: string = 'Cancelled';
  trainRailReplacementText: string = 'Rail replacement';
  trainPartiallyCancelledText: string = 'Partially cancelled';
}

export class SeatPickerMsgsEnum {
  coachOverlayText: string = "Sorry, this coach is not available for your ticket type";
  seatPickerOverlayText: string = "Sorry, the seat picker for the current train is not available.";
  successMessage: string = "Your Seat has been successfully changed.";
  failedMessage: string = "Sorry, this seat is no longer avaialble. Please select an alternate seat.";
  unreservableCoachesMessage: string = "There are no reservable seats in this carriage";
  unavailableCoachMessage: string = "Sorry, this coach is currently unavailable in seat picker";
  unreservedCoachesAndSeatsMessage: string = "Sorry, this is an unreserved coach and seats cannot be booked in advance of travel.";
  splitCoachOverlayCoachMessage: string = 'This area is not available for your ticket type';
  unreservedAreaSeatsMessageForSplitCoach: string = "Sorry, this is an unreserved area and seats cannot be booked in advance of travel.";
}

export class ClubAvantiEnum{
  tierText= 'Tier';
  myProgressSilverTierStartAwayRewardHeadingText = 'Rewards starts straight away, with tier Silver you’ll get';
  myProgressSilverTierNearlyAtGoldTierRewardHeadingText = 'You are nearly at Tier Gold level where you could earn';
  myProgressTierHotDrinkRewardText= 'A free hot drink onboard';
  myProgressTierStandardReturnRewardText= '10% off your next journey';
  myProgressTierFoodAndDrinkRewardText= '10% off food and drink on every trip';
  myProgressTierFirstClassLoungeRewardText= 'Free First Class Lounge pass';
  showAllTierBtnText= 'Show all tiers';
  showLessTierBtnText= 'Show less tiers';
  myProgressTierStandardPremiumRewardText= 'Free Standard Premium Return';
  myProgressGoldTierWelcomeRewardHeadingText = 'Welcome to Tier Gold. You have earned';
  myProgessGoldTierNearlyAtPlatinumRewardHeadingText = 'You are nearly at Tier Platinum level where you could earn';
  myProgressTierFirstClassRewardText= 'Free First Class Return';
  myProgressPlatinumTierWelcomeRewardHeadingText = 'Welcome to Tier Platinum. You have earned';
  tenPercentLoyaltyRewardText = '10% off food & drink onboard';
  freeHotDrinkOnBoardRewardText = 'Free hot drink onboard';
  clubAvantiRewardsAndBenefitsText = 'club Avanti - your rewards & your always on benefits';
  clubAvantiViewJourneyHistoryText = 'club Avanti - view journey history';
  viewJourneyHistoryText = 'view journey history';
}

export class ClubAvantiTierEnum{
  silverTier = 'Silver';
  goldTier = 'Gold';
  platinumTier = 'Platinum';
}

export class RewardButtonStatusEnum{
  active = 'Redeem now';
  expired = 'Expired';
  redeemed = 'Redeemed';
}

export class RewardCodeTypesEnum{
  tenPercentDiscount = 'Loyalty - 10% discount';
  freeCoffee = 'Loyalty - Free Coffee';
  stdPrem = 'COMPSTDPREM';
  compFirstClass = 'COMP1ST';
  eCom = '10ECOM';
  compFirstClassLounge= 'COMP1STLOUNGEPASS';
}

export class ClubAvantiTierMaxAndMinJourneyEnum{
  maxJourneyForSilver = 8;
  minJourneyForGold = 9;
  maxJourneyForGold = 20;
  minJourneyForPlatinum = 21;
}

export class RewardSubCategoryEnum {
  atTheStationRewardSubCategory = 'At the station & onboard';
  travelDiscountRewardSubCategory = 'Travel discount';
}

export class RewardCategoryEnum {
  rewardCategory = 'Reward';
  benefitCategory = 'Benefit';
}

export class FooterNavigationLinkEnum {
  trainTimes = "https://www.avantiwestcoast.co.uk/travel-information/train-times";
  londonToManchester = "https://www.avantiwestcoast.co.uk/travel-information/train-times/london-euston/manchester-piccadilly";
  manchesterToLondon = "https://www.avantiwestcoast.co.uk/travel-information/train-times/manchester-piccadilly/london-euston";
  londonToBirmingham = "https://www.avantiwestcoast.co.uk/travel-information/train-times/london-euston/birmingham-new-street";
  birminghamToLondon = "https://www.avantiwestcoast.co.uk/travel-information/train-times/birmingham-new-street/london-euston";
  londonToGlasgow = "https://www.avantiwestcoast.co.uk/travel-information/train-times/london-euston/glasgow-central";
  glasgowToLondon = "https://www.avantiwestcoast.co.uk/travel-information/train-times/glasgow-central/london-euston";
  londonToLiverpool = "https://www.avantiwestcoast.co.uk/travel-information/train-times/london-euston/liverpool-lime-street";
  viewAllTrainTimes = "https://www.avantiwestcoast.co.uk/travel-information/train-times";
  topDestinations = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides";
  trainsToLondon = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides/london";
  trainsToManchester = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides/manchester";
  trainsToEdinburgh = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides/edinburgh";
  trainsToBirmingham = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides/birmingham";
  trainsToLiverpool = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides/liverpool";
  trainsToGlasgow = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides/glasgow";
  trainsToBlackpool = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides/blackpool";
  viewOurDestinationGuides = "https://www.avantiwestcoast.co.uk/where-we-go/destination-guides";
  trainTickets = "https://picouat.avantiwestcoast.co.uk/tickets-and-savings";
  bestFareFinder = "https://www.avantiwestcoast.co.uk/tickets-and-savings/ways-to-save/best-fare-finder";
  offPeakTickets = "https://www.avantiwestcoast.co.uk/tickets-and-savings/ticket-types/off-peak-tickets";
  advanceTickets = "https://www.avantiwestcoast.co.uk/tickets-and-savings/ticket-types/advance";
  seasonTickets = "https://www.avantiwestcoast.co.uk/tickets-and-savings/ticket-types/season-tickets";
  childTickets = "https://www.avantiwestcoast.co.uk/tickets-and-savings/ticket-types/child-tickets";
  familyTickets = "https://www.avantiwestcoast.co.uk/tickets-and-savings/ticket-types/family-tickets";
  railcards = "https://www.avantiwestcoast.co.uk/tickets-and-savings/ways-to-save/railcards";
  offersAndRewards = "https://www.avantiwestcoast.co.uk/tickets-and-savings/offers-and-rewards/2for1-offers";
  planYourJourney = "https://www.avantiwestcoast.co.uk/travel-information/plan-your-journey";
  aboutUs = "https://www.avantiwestcoast.co.uk/about-us";
  careers = "https://www.avantiwestcoast.co.uk/about-us/careers";
  sustainability = "https://www.avantiwestcoast.co.uk/about-us/sustainability";
  privacyPolicy = "https://www.avantiwestcoast.co.uk/about-us/policies-and-procedures/privacy-policy";
  termsAndConditions = "https://www.avantiwestcoast.co.uk/about-us/policies-and-procedures/terms-and-conditions";
  passengerCharter = "https://www.avantiwestcoast.co.uk/about-us/policies-and-procedures/passenger-charter";
  mediaRoom = "http://newsdesk.avantiwestcoast.co.uk/";
  statementOnModernSlavery = "https://www.avantiwestcoast.co.uk/about-us/policies-and-procedures/statement-on-modern-slavery";
  sitemap = "https://www.avantiwestcoast.co.uk/help-and-support/sitemap";
  instagram = "https://instagram.com/avantiwestcoast";
  twitter = "https://twitter.com/avantiwestcoast";
  youTube = "https://www.youtube.com/channel/UCbphnYzZZpqB3vnIrL292LA";
  facebook = "https://facebook.com/avantiwestcoastrail";
  shawTrust = "https://www.accessibility-services.co.uk/certificates/avanti-west-coast-2/";
  trainTimesTxt: string = 'Train Times';
  londonToManchesterTxt: string = 'London to Manchester';
  manchesterToLondonTxt: string = 'Manchester to London';
  londonToBirminghamTxt: string = 'London to Birmingham';
  birminghamToLondonTxt: string = 'Birmingham to London';
  londonToGlasgowTxt: string = 'London to Glasgow';
  glasgowToLondonTxt: string = 'Glasgow to London';
  londonToLiverpoolTxt: string = 'London to Liverpool';
  viewAllTrainTimesTxt: string = 'View All Train Times';
  topDestinationsTxt: string = 'Top Destinations';
  trainsToLondonTxt: string = 'Trains to London';
  trainsToManchesterTxt: string = 'Trains to Manchester';
  trainsToEdinburghTxt: string = 'Trains to Edinburgh';
  trainsToBirminghamTxt: string = 'Trains to Birmingham';
  trainsToLiverpoolTxt: string = 'Trains to Liverpool';
  trainsToGlasgowTxt: string = 'Trains to Glasgow';
  trainsToBlackpoolTxt: string = 'Trains to Blackpool';
  viewOurDestinationGuidesTxt: string = 'View our destination guides';
  trainTicketsTxt: string = 'Train Tickets';
  bestFareFinderTxt: string = 'Best Fare Finder';
  offPeakTicketsTxt: string = 'Off Peak Tickets';
  advanceTicketsTxt: string = 'Advance Tickets';
  seasonTicketsTxt: string = 'Season Tickets';
  childTicketsTxt: string = 'Child Tickets';
  familyTicketsTxt: string = 'Family Tickets';
  railcardsTxt: string = 'Railcards';
  offersAndRewardsTxt: string = '2FOR1 Offers';
  planYourJourneyTxt: string = 'Plan your journey';
  aboutUsTxt: string = 'About Us';
  careersTxt: string = 'Careers';
  sustainabilityTxt: string = 'Sustainability';
  privacyPolicyTxt: string = 'Privacy Policy';
  termsAndConditionsTxt: string = 'Terms & Conditions';
  passengerCharterTxt: string = 'Passenger’s Charter';
  mediaRoomTxt: string = 'Media room';
  statementOnModernSlaveryTxt: string = 'Statement on Modern Slavery';
  sitemapTxt: string = 'Sitemap';
  instagramTxt: string = 'Avanti on Instagram';
  twitterTxt: string = 'Avanti on Twitter';
  youTubeTxt: string = 'Avanti on YouTube';
  facebookTxt: string = 'Avanti on Facebook';
  shawTrustTxt: string = 'shawtrust';
}

export class ClubAvantiViewPreviousJourneyEnum{
  viewPreviousWhysLinkLabelForScreenReader = 'To qualify your journey must be: 75 miles or more, using a ticket valid for travel on Avanti West Coast services. In the case of a multi-stage journey, it must include a stage that is 75 miles or more on an Avanti West Coast service. Booked direct either via the Avanti website or app. Booked using the email address registered to your Club Avanti account.';
}

export class DiscountCodePopupEnum {
  discountCodeActiveTitle: string  = 'Your discount code is still active';
  discountCodeExpiredTitle: string = 'Your discount code has already expired';
  noDiscountCodeFaresAvailableTitle : string = 'No discounted fares available';
  discountCodeIssuesTitle : string = 'Issues found changing your journey';  
}

export class DiscountCodeStatusEnum {
  active: string = 'ACTIVE';
  expired: string = 'EXPIRED';
  noFares: string = 'NOFARES';
}

export class NreOjpNationalRaiURLEnum {
  TocBaseUrl: string = "avantiwestcoast.co.uk"
}

export class FilePathEnum {
  newDesignGlobalCssPath: string = 'assets/css/enhanced-styles.css';
  oldDesignGlobalCssPath: string = 'styles.css';
  legacyReviewAndDeliveryComponentPath: string = '../../../Component/review-and-buy/review-buy-and-delivery/review-buy-and-delivery.component';
  enhancedReviewTravelExtraAndDeliveryComponentPath: string = '../../travel-extra-reviewBy-delivery-merge/travelExtra-and-reviewByDelivery.component';
  legacyPaymentDetailComponent: string = '../../../Component/payment-details/payment-details.component';
  enhancedPaymentDetailComponent: string = '../../enhanced-payment/enhanced-payment.component';
  legacyMixingDeckComponent: string = '../../../Component/mixing-deck/mixing-deck.component';
  enhancedMixingDeckCombinedListComponent: string = '../../mixing-deck-combined-list/mixing-deck-combined-list.component';
  legacyBookingConfirmationComponent: string = '../../../Component/booking-confirmation/booking-confirmation.component';
  enhancedBookingConfirmationComponent: string = '../../enhanced-booking-confirmation/enhanced-booking-confirmation.component';
}

export class ComponentNameEnum {
  legacyBookingConfirmationComponent: string = 'BookingConfirmationComponent';
  enhancedBookingConfirmationComponent: string = 'EnhancedBookingConfirmationComponent';
  legacyMixingDeckComponent: string =  'MixingDeckComponent';
  enhancedMixingDeckCombinedListComponent: string = 'EnhancedMixingDeckCombinedListComponent';
  legacyPaymentDetailComponent: string = 'PaymentDetailsComponent';
  enhancedPaymentDetailComponent: string = 'EnhancedPaymentComponent';
  legacyReviewAndDeliveryComponent: string = 'ReviewBuyAndDeliveryComponent';
  enhancedReviewTravelExtraAndDeliveryComponent: string = 'EnhancedTravelExtraAndReviewByDeliveryComponent';
  enhancedSeatPreferencesComponent: string = 'EnhancedSeatPreferencesComponent';
  legacyValidateComponent: string =  'ValidateComponent';
  enhancedValidateComponent: string = 'EnhancedValidateComponent';
  legacyValidateEnrollmentComponent: string =  'ValidateEnrollmentComponent';
  enhancedValidateEnrollmentComponent: string = 'EnhancedValidateEnrollmentComponent';
}

export class MixingDeckCombineListEnum {
  isRedirectFromHomePage: string = 'isRedirectFromHomePage';
}

export class TravelSolutionStatusEnum {
  soldOutText: string = 'Tickets sold out online';
  departedText: string = 'Service departed';
  oneWayText: string = 'One way from';
  cancelledText: string = 'Cancelled';
  noFareAvailable: string = 'No fares available';
  openReturnCardText: string = 'Outward & return from';
}

export class EnhancedDynamicClassesNameEnum {
  openEditQTTAnimationClass: string = 'slide-down-banner-edit-qtt';
  closeEditQTTAnimationClass: string = 'slide-up-banner-edit-qtt';
  addRailCardPopupPanelClass: string = 'add-railcard-popup';
  commonPopupPanelClass: string = 'new-common-popup';
  commonfullPanelPopupClass: string = 'full-width-mobile';
  stationPopupPanelClass: string = 'stations-popup';
  mobileFilterPanelClass: string = 'Filter-modal';
  filterRangePanelClass: string ='filter-range-datepicker-popup';
  enhancedDatePickerPanelClass: string = 'enhanced-datepicker-info';
  enhancedCommonPopupPanelClass: string = 'enhanced-common-popup-container';
  journeyDetailItinearyPanelClass: string = 'journey-details-itinerary-popup';
  enhancedCommonPopupThemePanelClass: string = 'enhanced-common-popup-theme';
  enhancedSignInDialogPopupPanelClass: string = 'enhanced-sign-in-dialog';
  enhancedStepperNavigationDisabledCircleClass: string = 'stepper-navigation-disabled-circle';
  enhancedStepperNavigationActiveCircleClass: string = 'stepper-navigation-active-circle';
  enhancedStepperNavigationCompletedCircleClass: string = 'stepper-navigation-completed-circle';
  enhancedStepperNavigationDisabledText: string = 'stepper-navigation-disabled-txt';
  enhancedStepperNavigationActiveText: string = 'stepper-navigation-active-txt';
  enhancedFooterPriceBreakDownPanelClass: string = 'EnhancedPriceBreakdownDialogs';
  enhancedFooterAlertCommonPanelClass: string = 'alert-common';
  enhancedPopupFullWidthPanelClass: string = 'ticket-detail-mobile'; 
  enhancedClassDetailPanelClass: string = 'class-detail-popup';
  enhancedReviewTravelExtrasDisabledBtn: string = 'review-travel-extras-disabled-btn';
  enhancedReviewTravelExtrasActiveBtn: string = 'review-travel-extras-active-btn';
  enhancedCommonInfoPopup: string = 'enhanced-common-info-popup';
  enhancedRemoveJourneyDialog: string = 'enhanced-remove-journey-dialog';
  enhancedGoBackDialog: string = 'enhanced-go-back-dialog';
  enhancedFieldSuccessWithIcon: string = 'enhanced-field-success enhanced-field-success-with-icon';
  enhancedFieldError: string = 'enhanced-field-error';
  enhancedNoSeatAvailableDialogPanelClass: string = 'enhanced-no-seats-available-dialog';
  enhancedSeatPreferenceDialogPanelClass: string = 'enchanced-seat-preferences-popup';
  enhancedRailcardNotAppliedPanelClass: string ='enhanced-railcard-not-applied-popup';
  enhancedLogoutPopup: string ='logout-popup';
  enhancedLogoutStylePopup: string ='logout-style-popup';
}

export class ClassTypeEnum {
  standardClass: string = 'Standard';
  firstClass: string = 'First';
  stdPremiumClass: string = 'Standard Premium';
  first: string = 'First Class';
  standard: string = 'Standard Class';
}

export class EnhancedMixingDeckPopupMessageEnum {
  noResultFoundFilterMsg: string = `It won't be applied to your search. You can keep browsing the current results.`;
  selectDifferentReturnTimeMsg: string = 'To make sure your journey works properly, your return train should leave after your outward train. Please pick a later return time.';
  somethingWentWrongErrorMessage: string = 'Please try your search again. If the error persists, please try selecting a different date and time, or check back with us shortly.';
  noTrainsAvailableMessage: string = 'Sorry, there are no trains available for your selected date and time. Please try searching for another day and time.';
  outwardAndReturnDateUpdatedMsg: string = 'Your outward and return dates have changed. The results now show trains available on the nearest available dates.'
}

export class EnhancedMixingDeckPopupHeadingEnum {
  outwardDateUpdated: string = 'Outward date updated';
  returnDateUpdated: string = 'Return date updated';
  noResultWithFilter: string = `No results found with this filter`;
  selectDifferentReturnTime: string = 'Please select a different return train';
  somethingWentWronhErrorHeading: string = `We're sorry - something went wrong`;
  noTrainsAvailableHeading: string = 'No trains available';
  outWardAndReturnDateUpdate: string = 'Outward and return date updated';
  somethingWentWrongNreErrorTitle: string = 'Something went wrong with your search';
}

export class EnhancedNavigationHeaderEnum{
  selectOutwardTrainTxt: string = 'Select outward';
  selectReturnTrainTxt: string = 'Select return';
  selectOpenReturnTrainTxt: string = 'Select open-return';
  reviewBuyPageHeaderTxtInMobile: string = 'Review';
  paymentPageHeaderTxtInMobile: string = 'Payment';
}

export class EnhancedAppRouteEnum{
  searchResult: string = 'search-results';
  selectTicketAndClass: string = 'select-ticket-and-class';
  deliveryAndReviewBy: string = 'delivery-and-reviewbuy';
  payment: string = 'payment';
  enhancedValidatePaymentDo: string = 'validatePayment.do';
}

export class EnhancedMixingDeckConsoleErrorMessage {
  onInitConcoleErrorMessage: string = 'Error during ngOnInit initialization:';
  queryStringConsoleErrorMessage: string = 'Failed to parse query string or populate search request:';
}

export class EnhancedJourneyFilterText {
  avantiFilter: string = 'Avanti';
  directFilter: string = 'Direct';
  bothFilter: string = 'Both';
}

export class EnhancedFooterButtonText {
  selectReturnTrainText: string = 'Select return train';
  selectTicketAndClassText: string = 'Select ticket & class';
}

export class EnhancedTravelSolutionTypesEnum {
  openReturn : string = 'OPEN_RETURN';
  return : string = 'RETURN';
  oneWay: string = 'ONE_WAY';
  forward: string = 'FORWARD';
  single: string = 'single';
  anytimeReturn : string = 'Anytime_Return';
  season : string = 'Season'; 
  inward: string = 'INWARD';
  outward: string = 'OUTWARD';
  pureReturn: string = 'pure return';
}

export class EnhancedSearchTypeEnum {
  earilier: string = 'EARLIER';
  later: string = 'LATER';
  new: string = 'NEW';
  outwardDateAndTime: string = 'Outward date and time';
  returnDateAndTime: string = 'Return date and time';
  addAnotherJourneyTxt: string = 'Add another journey';
  customYourSearchTxt: string = 'Customise your search';
}

export class EnhancedTravelTypeEnum {
  departAfter: string = 'DEPARTAFTER';
  arriveBy: string = 'ARRIVEBY';
}

export class EnhancedLocalOrSessionStorageKeysEnum {
  isUpgradeChange: string = 'isUpgradeChange';
  sharedSibling: string = 'sharedSibling';
  isCOJChange: string = 'isCOJChange';
  disableDates: string = 'disableDates';
  railcardStationList: string = 'railcardStationList';
  searchQueryString: string = 'searchQueryString';
  pageReloaded: string = 'pageReloaded';
  getDataFromNRE: string = 'getDataFromNRE';
}

export class EnhancedAccessbilityMessageEnum {
  outwardAndRetSelected: string = 'Outward train selected. Next, select return train.';
  openReturnSelected: string = 'Outward train selected Enjoy flexible open returns. Choose your option next and travel on any eligible train.';
  outwardSelected: string = 'Outward train selected. Ticket types, classes, and pricing details will be available on the next page.';
  bothJourneySelected: string = 'Outward and return trains selected. Ticket types, classes, and pricing details will be available on the next page.';
  avantiTrainOperator: string = 'Avanti West Coast train';
  otherTrainOperator: string = 'Avanti West Coast and other train operators';
  standardClassSelected: string = 'Standard class';
  standardPremiumClassSelected: string = 'Standard Premium class';
  firstClassSelected: string = 'First class';
  outTicketSelected: string = 'Outward ticket selected';
  retTicketSelected: string = 'Return ticket selected';
  nextSelectReturnString: string = 'Next, select return ticket.';
  checkPriceBreakDownOrContinueString: string = 'Check price breakdown or Continue to review your booking';
  singleTicketSelected: string = 'Outward ticket selected';
  standardClassLegendTxt: string = 'With us, comfort comes as standard';
  standardPremiumClassLegendTxt: string = 'Enjoy more space and a guaranteed table';
  firstClassLegendTxt: string = 'Our most premium experience';
  minValueMsg: string = 'minimum value reached';
  maxValueMsg: string = 'maximum value reached. Railcards passenger number cannot be higher than overall passenger number.';
  childMinValueMsg: string = 'Minimum value reached. To use your railcard, number of children must be between';
  adultMinValueMsg: string = 'Minimum value reached. To use your railcard, number of adults must be between';
}
export class EnhancedPathConstraintTypeEnum {
  Via: string = 'Via';
  Avoid: string = 'Avoid';
}

export class EnhancedGa4DatalayeEventNameEnum {
  ga4CheckoutCategory: string  = 'checkout';
  ctaClickAttemptActionText: string = 'attempt';
  ctaClickActionText: string = 'click';
  informationModalEventText: string = 'information_modal';
  journeyDetailsAndItinearyModalTypeText: string = 'Journey details and itinerary';
  whysThatModalTypeText: string = `Why’s that?`;
  ticketDetailText: string = 'Ticket details';
  priceBreakDown: string = 'Price breakdown';
  noRailcard: string = 'No Railcard';
  openReturnJourneyText: string = 'Open Return journey';
  openReturn: string = 'open_return';
  availableStatus: string = 'available';
  unAvailableStatus: string = 'unavailable';
  editActionName: string = 'click';
  editNameText: string = 'edit';
}

export class EnhancedDesignBtnText {
  ticketAndClassText: string = 'Next: Select ticket & class';
  selectReturnTrainText: string = 'Next: Select return train';
  reviewBuyText: string = 'Next: Review';
  paymentText: string = 'Next: Payment';
}

export class EnhancedLoginStatus {
  loggedInText: string = 'Logged In';
  loggedOutText: string = 'Logged Out';
}
export class EnhancedActiveClassTypeEnum {
  activeClass: string = 'activeClass';
  returnActiveClass: string = 'returnActiveClass';
}

export class EnhancedTabIndexTypeEnum {
  selectedTabIndex: string = 'selectedTabIndex';
  returnSelectedTabIndex: string = 'returnSelectedTabIndex';
}

export class EnhancedPassangerTypeEnum {
  ChildText: string = 'Child';
  adultText: string = 'Adult';
  ChildrenText: string = 'Children';
}

export class EnhancedRailcardTypeEnum {
  promotionAppliedText: string = 'Promotion applied';
  noRailcardText: string = 'No railcard';
  noRailCardAppliedText: string = 'no railcard applied';
}

export class EnhancedGA4SearchSourceEnum {
  editQTTSource: string = 'EditQTT';
  homepageSearchSource: string = 'Homepage';
  searchResultSearchSource: string = 'search result';
  selectTicketAndClass: string = 'select ticket & class';
  reviewBuyAndDelivery: string = 'review & delivery';
}

export class BookingFlowTypeEnum {
  newBookingFlow: string = 'new';
  oldBookingFlow: string = 'old';
}
export class EnhancedModalFooterTextEnum {
  editSearchTxt: string = 'Edit search';
  searchAgainTxt: string = 'Search again';
}

export class EnhancedReviewBuyAndDeliveryPageEnum {
  newNoMoreSeatAvailableMessage: string = 'There are no more seats available to reserve for your chosen ticket on the outward/return service.';
  oldNoMoreSeatAvailableMessage: string = 'There are no more seats available to reserve for your chosen ticket on the outward/return service. You can buy this ticket without reservations or you can change your service or ticket selection and try again.';
  invalidDiscountMessage: string = 'The discount code is not applicable to the selected train or ticket type.';
  discountCodeInfoMessage: string = 'Some codes can only be used once. If an issue appears, check the discount codes applied to your journeys in the basket.';
}

export class EnhancedTravelExtrasTextEnum {
  bikeOutward: string = 'bikeOutward';
  bikeReturn: string = 'bikeReturn';
  plusBusOutward: string = 'plusBusOutward';
  plusBusReturn: string = 'plusBusReturn';
  travelcardOutward: string = 'travelcardOutward';
  travelcardReturn: string = 'travelcardReturn';
  bikeTxt: string = 'bike';
  plusBusTxt: string = 'plusbus';
  travelCardTxt: string = 'travelcard';
  isBikeSaved: string = 'isBikeSaved';
  isPlusBusSaved: string = 'isPlusBusSaved';
  isLondonTravelSaved: string = 'isLondonTravelSaved';
  outwardPlusBusReservePrice: string = 'outwardPlusBusReservePrice';
  returnPlusBusReservePrice: string = 'returnPlusBusReservePrice';
  totalPlusBusReservePrice: string = 'totalPlusBusReservePrice';
  outwardBicycleReservation: string = 'outwardBicycleReservation';
  returnBicycleReservation: string = 'returnBicycleReservation';
  isBikeOutsaved: string = 'isBikeOutsaved';
  isBikeRetsaved: string = 'isBikeRetsaved';
  outwardLondonTravelReservePrice: string = 'outwardLondonTravelReservePrice';
  returnLondonTravelReservePrice: string = 'returnLondonTravelReservePrice';
  showDiscountMessage: string = 'showDiscountMessage';
  IsInvalid: string = 'IsInvalid';
  DiscountMessage: string = 'DiscountMessage';
  disableAddButton: string = 'disableAddButton';
  RemoveJourneyOnInvalidDiscount: string = 'RemoveJourneyOnInvalidDiscount';
  selectedBicycle: string = 'selectedBicycle';
  selectedBicycleReturn: string = 'selectedBicycleReturn';
  showDiscountError: string = 'showDiscountError';
} 
export class EnhancedSeeEarlierAndLaterTrainTextEnum {
  seeEarlierTrains: string = 'See earlier trains';
  seeLaterTrains: string = 'See later trains';
}

export class EnhancedAdditionalInformationEnum {
  fastest: string = 'Fastest';
  cheapest: string = 'Cheapest';
  limited: string = 'Limited';
}

export class EnhancedReviewBuyAndDeliveryReservationMessageEnum {
  seatReservedForAvantiFlexibleTicket: string = 'Seats are only reserved on your chosen train. You may choose to travel on a different train based on the restrictions of your ticket and take any available seat in your class of travel or change your reservation in My Account before your journey.';
  seatReservedForNonAvantiFlexibleTicket: string = 'Seats are only reserved on your chosen train. You may choose to travel on a different train based on the restrictions of your ticket and take any available seat in your class of travel.';
  noSeatReservationForAllTOCFlexibleTicket: string = 'On any train your ticket’s valid for, in the right class of travel.';
  seatReservedForAllTOCNonFlexibleTicket: string = 'Take your seat on the train you’ve booked.';
  noSeatReservedForAllTOCNonFlexibleTicket: string = 'On the train you’ve booked, in the right class of travel.';
  noSeatReservationChangedMsg: string = 'Seats are available, but not all preferences can be matched due to limited availability.';
  sucessfullySeatReservationChangedMsg: string = 'Seat reservation updated successfully.';
}

export class EnhancedPrefixOfTicketTypeEnum{
  offPeak: string = 'Off-Peak';
  anytime: string = 'Anytime'
}

export class EnhancedReviewBuyAndDeliveryErrorMessageEnum{
  validPassengerTypeOfSmartCard: string = 'please select valid passenger types of smartcard.';
  enterSmartcardDetailForAllPassengers: string = 'Please enter smartcard details for all the passengers otherwise choose other delivery mode.';
  enterValidLoadStation: string = 'please enter a valid load station details.';
  allPassengerLoadStationDetails: string = 'Please fill all the passenger smartcard load station details.';
  allPassengerSmartcardNumberDetails: string = 'Please fill all the passenger smartcard number details.';
  allPassengerSmartcardTypeDetails: string = 'Please fill all the passenger smartcard type details.';
  fillSmartCardLoadStationDetails: string = 'Please fill smartcard load station details.';
  pleaseAcceptTermsAndConditionFirst: string = 'Please accept the Smartcard terms and conditions to continue.';
  selectValidPassengerType: string = 'please select valid passenger type.';
  addressDeletedSuccessfully: string = 'Address deleted successfully.';
  addressAddedSuccessfully: string = 'New address added successfully.';
  addressUpdatedSuccessfully: string = 'has been updated';
  inValidAddressMessage: string = 'Please provide a valid delivery address to continue.';
  nonSeasonBasketErrorMsg: string = 'Non-season tickets can’t be purchased with a season ticket in your basket. Please remove the season ticket to continue.';
  offPeakDayTravelCardInfo: string = 'Travel after 09:30 on weekdays, or at any time on weekends and bank holidays, before 04:30 the following day.';
  anyTimeDayTravelCardInfo: string = 'Travel at any time before 04:30 the following day.';
}

export class EnhancedJourneyType{
  openReturn: string = 'Open return';
  outward: string = 'Single';
  return: string = 'Return';
}

export class EnhancedReviewBuyAndDeliveryBtnTextEnum{
  removeThisJourney: string = 'Remove this journey';
  addAnotherJourney: string = 'Add another journey';
  outViewChangeSeat: string = 'View change seat for outward service';
  retViewChangeSeat: string = 'View change seat for return service';
  ticketDetailForOut: string = 'Ticket details for outward service';
  ticketDetailForRet: string = 'Ticket details for return service';
  increase: string = 'increase';
  decrease: string = 'decrease';
  plus: string = 'plus';
  minus: string = 'minus';
  bikeReservations: string = 'bike reservations';
  minimumValue: string = 'Minimum value reached';
  maxValue: string = 'Maximum value reached';
  anyTimeDayTravelCard: string = 'Anytime Day Travelcard';
  offPeakDayTravelCard: string = 'Off-Peak Day Travelcard';
  returnPlusBusTicket: string = 'Return PlusBus ticket';
  outwardPlusBusTicket: string = 'Outward PlusBus ticket';
  viewPriceBreakDown: string = 'View price breakdown';
}

export class EnhancedReviewBuyReservedOrNonReservedMessageHeading{
  seatReserved: string = 'Your seat’s reserved';
  noSeatReserved: string = 'No seat reservation';
}

export class EnhancedOperatorNamesEnum{
  avanti: string = 'Avanti West Coast';
}
export class EnhancedFilterStatusEnum{
  updateText: string = 'update';
  finalText: string = 'final';
}

export class EnhancedReviewBuyAndDeliveryIdsEnum {
  selectedDeliveryModeId: string = 'idselectedDeliveryModeDiv';
  deliveryModeExpansionPanelId: string = 'deliveryModeExpansionPanel';
}

export class EnhancedReviewBuyAndDeliveryPopUpHeaderEnum{
  noSeatAvailableForReservation: string = 'No seats available for reservation';
  noBikeAvailableForReservation: string = 'No bike reservations available';
}

export class EnhancedPaymentMethodEnum{
  oldPaymentCard: string = 'oldPaymentCard';
  newPaymentCard: string = 'newPaymentCard';
  payPal: string = 'payPal';
  MultiUse: string = 'MultiUse';
  Nets_Online: string = 'NETS_ONLINE';
}

export class EnhancedPaymentPageMessageEnum {
  addressAddedSuccessfully: string = 'New address added successfully.';
  addressDeletedSuccessfully: string = 'has been removed.';
  addressUpdatedSuccessfully: string = 'has been updated.';
  deleteCardErrorMsg: string = 'Try again or remove it from your account after purchase.';
  deleteCardTxt: string = 'Delete card ending';
  addressTxt: string = 'Address';
  deleteAddressTxt: string = 'Delete address';
  defaultNewCardAriaLabel: string = "Radio button. Not Selected. Credit or debit card. Provide card details on the next page. We accept Visa, Mastercard, Maestro, and American Express cards.";
  selectedNewCardAriaLabel: string = "Credit or debit card. Provide card details on the next page. We accept Visa, Mastercard, Maestro, and American Express cards.";
  savedCardCheckboxChecked: string = 'Save this card for faster checkout next time';
  selectPaymentModeWithoutAddress: string = 'Sorry, we can’t take you to the payment page without an address. Please add one before proceeding with any payment method.';
  addBillingAddress: string = 'Please add a billing address';
  updateAddressFailureMsg: string = 'Sorry, We are not able to update address this time. Please try again.';
  paymentInValidAddressMessage: string = 'Please provide a valid billing address to continue.';
  deleteOneAddressTitle: string = 'Sorry, we can’t delete your address';
  deleteOneAddressMessage: string = 'Every Avanti account needs at least one address. If any information is incorrect, please update your current address instead of deleting it.';
  selected: string = 'Selected';
  notSelected: string = 'Not Selected';
  expired: string = 'Expired';
  expires: string = 'Expires';
  eVoucher: string = 'eVoucher';
  paypalPaymentModeText: string = 'Paypal. Pay in 3 interest-free payment of';
  paypalExternalLinkText: string = 'with Paypal. cards. Link: Visit this external site to learn more.';
  paymentErrorTitle: string = 'Payment not completed';
  paymentErrorMessage: string = 'Your payment has not gone through. Please try again.';
  cityTownText: string = 'city/town';
  cityOrTownText: string = 'city or town';
  payPalLaterMessageTxt: string = 'pp-pay-later-message';
  iframeTxt: string = 'iframe';
  tabindex: string = 'tabindex';
  ariaHidden: string = 'aria-hidden';
  cardAlreadyExistTitle: string = 'Card already exists';
}

export class ShowAndHideTextDetailEnum {
  showDetail: string = 'Show seat details';
  hideDetail: string = 'Hide seat details';
}

export class EnhancedConfirmationPageEnum {
   calendar: string = 'calendar';
   viewAccount: string = 'viewAccount';
   download: string = 'download';
   addToCalendarTxt: string = 'Add to calendar for your journey';
   viewAccountTxt: string = 'View in your account, more details available for your journey';
   downloadEticketTxt: string = 'Download e-tickets for your journey';
   paymentSummaryTxt: string = 'Payment summary';
   externalSiteTxt: string = 'Visit this external site to check more information about';
   hideSeatDetailTxt: string = 'Hide seat details button';
   showSeatDetailTxt: string = 'Show seat details';
   expandedTxt: string = 'expanded';
   collapsedTxt: string = 'collapsed';
   downloadEticketMenuTxt: string = 'Download e-ticket for your jounrey';
   downloadButtonTxt: string = 'download';
   manageBookingBtnTxt: string = 'Manage booking';
   railcardTxt: string = 'Railcard';
   plusBusInfo = "https://www.plusbus.info/";
   travelCardInfo = "https://tfl.gov.uk/fares/how-to-pay-and-where-to-buy-tickets-and-oyster/travelcards-and-group-tickets";
}

export class PermissionTextEnum {
  yesText: string = 'Yes';
  noText: string = 'No';
}

export class EnhancedLoaderTextEnum {
  mixingDeckLoaderHeading : string  = 'Searching trains';
  mixingDeckLoaderDescription: string = 'Please wait while we find the quickest and best-value options for your journey';
  ticketAndTypeLoaderHeading: string = 'Train selected, searching tickets';
  ticketAndTypeLoaderDescription: string = 'Loading ticket types, classes, and pricing details';
  reviewBuyLoaderHeading: string = 'Preparing your journey summary';
  reviewBuyLoaderDescription: string = 'Loading your seat reservations, travel extras, and delivery options';
  basketJourenyLoaderDescription: string = 'Updating your basket';
  updateJourneyLoaderDescription: string = 'Updating your journey details';
  paymentLoaderDescription: string = 'Select a method to complete your booking';
  validateDoLoaderheading: string = 'Almost done! We’re processing your payment';
  validateDoLoaderDescription: string = 'Please don’t refresh or leave this page. We’re just finishing up your payment.';
  gettingPaymentMethodHeading: string = 'Getting payment options ready';
  updatingAPI_LoaderTitle: string = 'Just a moment';
  updatingAPI_LoaderMessage: string = `We’re getting things ready`;
}

export class EnhancedMonetatePageEventNameEnum {
  setPageTypeTxt: string = 'setPageType';
  addTrainSearchTxt: string = 'addTrainSearch';
  addTrainReviewTxt: string = 'addTrainReview';
  addTrainBookingTxt: string =  'addTrainBooking';
  addFlightSearchTxt: string = 'addFlightSearch';
  addFlightReviewTxt: string = 'addFlightReview';
  addFlightBookingTxt: string = 'addFlightBooking';
  trackDataTxt: string = 'trackData';
  addPurchaseRowsTxt: string = 'addPurchaseRows';
}


