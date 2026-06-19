import { Component, Injector, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CustomerBookingRequest, CustomerBookings, JourneyDetails, BuyAgainRequestDto, BuyAgainResponseDto, EticketRequestDto, RenewSmartcardReqDto, EticketResponseList, EticketResponse, VatRequestDTO, VatResponseDTO, StartVerifyEmailRequestDto, BookingFilterJourneyRequest } from 'src/app/models/account/my-bookings.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { MyAccountService } from 'src/app/services/my-account.service';
import { BookingTypeEnum, AppRouteEnum, JourneyTypeEnum, TabIndexValueEnum, LocalStorageKeyEnum, BookPassangerAssistEnum, TrackMyTrainEnum, NotificationErrorMsg, CommonIconImg, TravelSolutionJourneyTypeEnum } from 'src/app/utility/app-constants.service';
import { CompensationComponent } from './compensation/compensation.component';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { downloadFile } from 'src/app/utility/download-file';
import { LoginPageComponent } from '../../login-page/login-page.component';
import { browserRefresh } from 'src/app/app-component/app.component';
import { environment } from 'src/environments/environment';
import { CommonServices } from '../../../services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { RenewSmartcardComponent } from './renew-smartcard/renew-smartcard.component';
import { FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { Overlay } from '@angular/cdk/overlay';
import { ReviewBuyResponse } from 'src/app/models/review-buy/review-buy-model';
import { RenewPopupComponent } from './renew-popup/renew-popup.component';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { MyAccountTicketInfoPopupComponent } from '../my-account-ticket-info-popup/my-account-ticket-info-popup.component';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { CalendarService } from 'src/app/services/calendar.service';
import { TrackMyTrainComponent } from './track-my-train/track-my-train.component';
import { MyBookingsFilterDatepickerComponent } from './my-bookings-filter-datepicker/my-bookings-filter-datepicker.component';


@Component({
    selector: 'app-my-bookings',
    templateUrl: './my-bookings.component.html',
    styleUrls: ['./my-bookings.component.css'],
    standalone: false
})
export class MyBookingsComponent implements OnInit {
    responseData: ResponseData;
    customerBookingRequest: CustomerBookingRequest;
    customerBookingsResponse: CustomerBookings;
    renewSmartcardRequest:RenewSmartcardReqDto;
    journeyList: JourneyDetails[];
    itemPerPage: number = 10;
    currentPageNo: number = 1;
    totalItem: number = 0;
    pagingPreDisabled: boolean = true;
    isShowMoreJourneyDisabled: boolean = true;
    buyAgainResponseDto: BuyAgainResponseDto;
    eticketResponse: EticketResponseList;
    eticketRequestDto: EticketRequestDto;
    isSeason: boolean = false;
    bookingFilterOptions = [
        { text: "All Bookings", value: "All" },
        { text: "Upcoming Journey", value: "UpcomingJourney" },
        { text: "Past Journey", value: "PastJourney" }
    ];
    browserRefresh: boolean;
    tabIndex: number = 0;
    event: MatTabChangeEvent;
    entitlementId: string;
    reviewBuyResponse:ReviewBuyResponse;
    shoMultipleDownloadBtnBookingRef: string;
    shoMultipleDownloadBtnTravelSolutionId: number;
    bookingTypeEnum: BookingTypeEnum;
    sharedService: SharedService;
    spinnerService: NgxSpinnerService;
    commonService: CommonServices;
    myAccountService: MyAccountService;
    router: Router;
    storageDataService: StorageDataService;
    sharedServiceCache: SharedServiceCache;
    appRouteEnum: AppRouteEnum;
    datalayerService: DataLayerService;
    ga4dataLayerService: GA4DatalayerService;
    hideHeaderFlag : boolean = true;
    myBookingsHideHeaderFlag : boolean = true;
    defaultJourney : number = 2;
    passengerList : boolean = false;
    journeyTypeEnum: JourneyTypeEnum;
    tabIndexValueEnum: TabIndexValueEnum;
    showTicketOutsideArea : boolean = false;
    hideTicketOutsideArea : boolean = false;
    localStorageKeyEnum: LocalStorageKeyEnum;
    notificationService: NotificationService;
    calendarService : CalendarService;
    showMoreOptionOutsideArea : boolean = false;
    hideMoreOptionOutsideArea : boolean = false;
    bookPassangerAssistEnum: BookPassangerAssistEnum;
    trackMyTrainEnum : TrackMyTrainEnum;
    notificationErrorMsg : NotificationErrorMsg;
    commonIconImg : CommonIconImg;
    isDisplayVerifyEmail: boolean = false;
    startVerifyEmailRequestDto: StartVerifyEmailRequestDto;
    isUserVerified: boolean = true;
    bookingFilterJourneyRequest: BookingFilterJourneyRequest;
    showFilterByDateBtn: boolean = false;
    showClearFilterBtn: boolean = false;
    noBookingsForSelectedDate: boolean = false;
    noTripsForUpcoming: boolean = false;
    noTripsForPast: boolean = false;
    noTripsForSeason: boolean = false;
    travelSolutionEnum: TravelSolutionJourneyTypeEnum;

    constructor(private readonly injector: Injector, public dialog: MatDialog, public overlay: Overlay) {

        // Dependency Injection without using constructor's param
        this.bookingTypeEnum = this.injector.get(BookingTypeEnum);
        this.sharedService = this.injector.get(SharedService);
        this.spinnerService = this.injector.get(NgxSpinnerService);
        this.commonService = this.injector.get(CommonServices);
        this.myAccountService = this.injector.get(MyAccountService);
        this.router = this.injector.get(Router);
        this.storageDataService = this.injector.get(StorageDataService);
        this.sharedServiceCache = this.injector.get(SharedServiceCache);
        this.appRouteEnum = this.injector.get(AppRouteEnum);
        this.datalayerService = this.injector.get(DataLayerService);
        this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
        this.journeyTypeEnum = this.injector.get(JourneyTypeEnum);
        this.tabIndexValueEnum = this.injector.get(TabIndexValueEnum);
        this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
        this.notificationService = this.injector.get(NotificationService);
        this.calendarService = this.injector.get(CalendarService);
        this.bookPassangerAssistEnum = this.injector.get(BookPassangerAssistEnum);
        this.journeyList = new Array<JourneyDetails>();
        this.customerBookingRequest = new CustomerBookingRequest();
        this.eticketRequestDto = new EticketRequestDto();
        this.customerBookingRequest.BookingType = this.bookingTypeEnum.NonSeason;
        this.customerBookingRequest.CustomerKey = localStorage.getItem('CustomerKey');//'AWC:29';
        this.customerBookingRequest.PageNo = 1;
        this.trackMyTrainEnum = this.injector.get(TrackMyTrainEnum);
        this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
        this.commonIconImg = this.injector.get(CommonIconImg);
        this.bookingFilterJourneyRequest = new BookingFilterJourneyRequest();
        this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    }

    compensation() {
        this.dialog.open(CompensationComponent, {
            width: '676px',
        });
    }

    ngOnDestroy() {
        if (this.router.getCurrentNavigation().trigger == "popstate" && (this.router.url.includes(this.appRouteEnum.Register) || this.router.url.includes(this.appRouteEnum.RegistrationSuccess))) {
            this.router.navigateByUrl("/" + this.appRouteEnum.MyBookings);
        }
    }

    ngOnInit(): void {
        this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "false", false);
        this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "false", false);
        this.pullDownToRefreshInMobile();
        localStorage.setItem(this.localStorageKeyEnum.trackMyTrainFlowStrategy, "true"); // I'm passing true as a string bcz setItem only accept second parameter as a string
        this.customerBookingRequest.StatusFilter = this.journeyTypeEnum.upcomingJourney;
        this.datalayerService.loadGTMDataLayerOnPageUpdate();
        // Page_meta_data -- Ga4-datalayer event
        this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
        this.browserRefresh = browserRefresh;
        if (this.browserRefresh) {
            let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
            if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
                this.sharedService.ReservationCache = sharedSiblingRefresh.ReservationCache;
                this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
                this.sharedService.searchRequest = sharedSiblingRefresh.searchRequest;
                this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
            }
        }
        if (this.sharedService?.reviewBuyResponse) {
            this.sharedService.reviewBuyCache = this.sharedService.reviewBuyResponse.ReviewBuyCache;
            this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
        }
        let customerKey = localStorage.getItem('CustomerKey');
        let customerEmail = localStorage.getItem('Email');
        this.setCustomerBookingRequest();
        this.updateBookingListOrOpenLoginDialogueIfCustomerEmailIsNull(customerKey, customerEmail);
        this.setTMTObjectLastUpdatedTimeEventFired();
        this.hideVerifyEmailSectionAfterSuccess();
    }

    hideVerifyEmailSectionAfterSuccess() {
        this.sharedService.getIsVerifyEmailSection().subscribe(res => {
            if (res) {
                this.isDisplayVerifyEmail = res;
            }
        });
    }

    bindMyBookingData() {
        this.journeyList = this.journeyList.length > 0 ? [...this.journeyList, ...this.customerBookingsResponse.JourneyList] : this.customerBookingsResponse.JourneyList;
        this.totalItem = this.customerBookingsResponse.TotalJourney;
        this.isShowMoreJourneyDisabled = !(this.journeyList?.length == this.totalItem && this.defaultJourney > 2);
        if(localStorage.getItem(this.localStorageKeyEnum.journeyList)){
            localStorage.removeItem(this.localStorageKeyEnum.journeyList);
            localStorage.setItem(this.localStorageKeyEnum.journeyList, JSON.stringify(this.journeyList));
        }else{
            localStorage.setItem(this.localStorageKeyEnum.journeyList, JSON.stringify(this.journeyList));
        }
        if (!this.journeyList) {
            this.noTripsForUpcoming = true;
            this.noTripsForPast = true;
            this.noTripsForSeason = true;
        } else {
            this.showFilterByDateBtn = true;
            this.showClearFilterBtn = false;
        }
        this.bindLastUpdatedTime();
        this.updateJourneyPlatformNo();
    }

    bindLastUpdatedTime(){
        this.journeyList?.forEach(e =>{
            if(e.OutwardTicketInfo?.TrackMyTrain){
                e.OutwardTicketInfo.TrackMyTrain.LastUpdatedTime = this.getCurrentTime();
            }
            if(e.ReturnTicketInfo?.TrackMyTrain){
                e.ReturnTicketInfo.TrackMyTrain.LastUpdatedTime = this.getCurrentTime();
            }
        });
    }

    getCurrentTime() {
        let now = new Date();
        let hour = now.getHours();
        let minute = now.getMinutes();
        let seconds = now.getSeconds();
        return hour + ":" + minute + ":" + seconds;
      }

    onPageChange($event) {
        this.currentPageNo = $event;
        this.customerBookingRequest.PageNo = this.currentPageNo;
        this.getMyBookingList();
    }

    routeLinks: any[];
    compRef: any;

    onTabChanged(i) {
        this.journeyList = new Array<JourneyDetails>();
        this.defaultJourney = 2;
        this.currentPageNo = 1;
        this.customerBookingRequest.PageNo = this.currentPageNo;
        this.isShowMoreJourneyDisabled = true;
        if (i == this.tabIndexValueEnum.upcomingJourneyTabIndex) {
            this.customerBookingRequest.BookingType = this.bookingTypeEnum.NonSeason;
            this.customerBookingRequest.StatusFilter = this.journeyTypeEnum.upcomingJourney;
            this.isSeason = false;
            this.tabIndex = this.tabIndexValueEnum.upcomingJourneyTabIndex;
            localStorage.removeItem(this.localStorageKeyEnum.tabIndex);
        }
        else if (i == this.tabIndexValueEnum.pastJourneyTabIndex) {
            this.customerBookingRequest.BookingType = this.bookingTypeEnum.NonSeason;
            this.customerBookingRequest.StatusFilter = this.journeyTypeEnum.pastJourney;
            this.isSeason = false;
            this.tabIndex = this.tabIndexValueEnum.pastJourneyTabIndex;
            localStorage.setItem(this.localStorageKeyEnum.tabIndex, this.tabIndexValueEnum.pastJourneyTabIndex.toString());
        }
        else if (i == this.tabIndexValueEnum.seasonJourneyTabIndex) {
            this.customerBookingRequest.BookingType = this.bookingTypeEnum.Season;
            this.customerBookingRequest.StatusFilter = this.journeyTypeEnum.allForSeason;
            this.isSeason = true;
            this.tabIndex = this.tabIndexValueEnum.seasonJourneyTabIndex;
            localStorage.setItem(this.localStorageKeyEnum.tabIndex, this.tabIndexValueEnum.seasonJourneyTabIndex.toString());
        }
        else {
            this.isSeason = true;
            this.customerBookingRequest.BookingType = this.bookingTypeEnum.FlexiSeason;
        }
        this.showFilterByDateBtn = false;
        this.showClearFilterBtn = false;
        this.noTripsForUpcoming = false;
        this.noTripsForPast = false;
        this.noTripsForSeason = false;
        this.noBookingsForSelectedDate = false;
        this.getMyBookingList();
    }

    viewBooking(journey: JourneyDetails) {
        this.sharedService.journey = journey;       
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        this.router.navigate([`./` + this.appRouteEnum.ViewBooking]);
    }

    clickToCloseMoreOption() {
        this.journeyList.forEach(t => {
            t.ShowMoreOptions = false;
        });
    }

    clickToCloseDownloadOption() {
        this.journeyList.forEach(t => {
            t.ShowDownloadOptions = false;
        });
    }

    clickOnMoreOption(journey: JourneyDetails) {
        this.clickToCloseDownloadOption();
        if (journey.ShowMoreOptions) {
            this.showMoreOptionOutsideArea = false;
            this.hideMoreOptionOutsideArea = true;
            this.clickToCloseMoreOption();
        } else {
            this.clickToCloseMoreOption();
            for (let journeyList of this.journeyList) {
                if (journey.BookingId == journeyList.BookingId && journey.TravelSolutionId == journeyList.TravelSolutionId) {
                    journeyList.ShowMoreOptions = true;
                } else {
                    journeyList.ShowMoreOptions = false;
                }
            }
            this.showMoreOptionOutsideArea = true;
            this.hideMoreOptionOutsideArea = false;
        }
    }

    onClickOutSideToCloseDropdownList() {
        this.showTicketOutsideArea = false;
        this.hideTicketOutsideArea = true;
        this.showMoreOptionOutsideArea = false;
        this.hideMoreOptionOutsideArea = true;
        this.clickToCloseMoreOption();
        this.clickToCloseDownloadOption();
    }

    downloadTicket(journey: JourneyDetails) {
        this.clickToCloseMoreOption();
        if (journey.ShowDownloadOptions) {
            this.showTicketOutsideArea = false;
            this.hideTicketOutsideArea = true;
            this.clickToCloseDownloadOption();
        } else {
            this.clickToCloseDownloadOption();
            this.showTicketOutsideArea = true;
            this.hideTicketOutsideArea = false;
            this.eticketRequestDto.EntitlementId = journey.EntitlementId;
            this.eticketRequestDto.TravelId = journey.TravelId;
            this.eticketRequestDto.OrderId = parseInt(journey.BookingId);
            this.eticketRequestDto.TravelSolutionId = journey.TravelSolutionId;
            this.eticketRequestDto.IsPartialCoj = (journey.Status == "Outward Refunded" || journey.Status == "Return Refunded") ? true : false;
            this.shoMultipleDownloadBtnBookingRef = null;
            this.shoMultipleDownloadBtnTravelSolutionId = null;
            this.myAccountService.downloadTicket(this.eticketRequestDto).subscribe(
                res => {
                    if (res != null) {
                        this.responseData = res as ResponseData;
                        if (this.responseData.ResponseCode == '200') {
                            this.eticketResponse = this.responseData.Data;
                            this.setDownloadTicketResponse(journey);
                        }
                        else {
                            console.log(this.responseData.ResponseMessage);
                        }
                    }
                });
        }
    }

    setDownloadTicketResponse(journey: JourneyDetails) {
        if (this.eticketResponse?.Eticket?.length > 0) {
            if (this.eticketResponse.Eticket.length === 1) {
                this.downloadPassengerTicket(this.eticketResponse.Eticket[0]);
            } else {
                for (let journeyList of this.journeyList) {
                    if (journey.BookingId == journeyList.BookingId && journey.TravelSolutionId == journeyList.TravelSolutionId) {
                        journeyList.ShowDownloadOptions = true;
                    } else {
                        journeyList.ShowDownloadOptions = false;
                    }
                }
                this.eticketResponse.Eticket.forEach(t => {
                    t.DownloadedList = false;
                });
                this.shoMultipleDownloadBtnBookingRef = this.eticketRequestDto.OrderId.toString();
                this.shoMultipleDownloadBtnTravelSolutionId = this.eticketRequestDto.TravelSolutionId;
            }
        }
    }

    downloadPassengerTicket(eticket: EticketResponse) {
        this.eticketResponse.Eticket.forEach(t => {
            if (eticket.Name == t.Name && eticket.Text == t.Text) {
                t.DownloadedList = true;
            }
        });
        const byteArray = new Uint8Array(atob(eticket.Content).split('').map(char => char.charCodeAt(0)));
        downloadFile(byteArray, eticket.Name, 'application/pdf');
    }

    onRefund(journey: JourneyDetails, userEmailVerified) {
        if (userEmailVerified) {
            if (journey.IsInternalRefundable) {
                this.commonService.showOnlineRefundPopupForInternalRefundableJourney(journey);
            } else {
                localStorage.setItem("TravelId", journey.TravelId.toString());
                localStorage.setItem("TravelSolutionId", journey.TravelSolutionId.toString());
                localStorage.setItem("IsViewBooking", "false");
                localStorage.setItem("BookingReferenceNumber", journey.BookingId.toString());
                this.sharedService.journey = journey;
                //Set shared cache data
                this.sharedService.setSharedCache();
                this.storageDataService.clearStorageData("sharedSibling");
                this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
                this.router.navigate([`./` + this.appRouteEnum.RefundBooking]);
            }
        } else {
            let verifyEmailAddressMsgsObj = {
                notificationErrorMsg: this.notificationErrorMsg.verifyEmailNotificationMsgFromBooking,
                notificationTitle: this.notificationErrorMsg.verifyEmailAddressTitle,
            }
            this.commonService.commonNotificationDialog('verify-email-common-notification-dialog', verifyEmailAddressMsgsObj, this.commonIconImg.exclamationIConImg, false, true);
        }
    }

    refundUnavailable(journey: JourneyDetails) {
        this.entitlementId = journey.EntitlementId[0];
    }

    buyAgain(journey: JourneyDetails) {
        let buyAgainRequestDto = new BuyAgainRequestDto();
        buyAgainRequestDto.TravelId = journey.TravelId;
        buyAgainRequestDto.TravelSolutionId = journey.TravelSolutionId;
        this.commonService.loaderRequired = true;
        this.myAccountService.buyAgain(buyAgainRequestDto).subscribe(
            res => {
                if (res != null) {
                    this.responseData = res as ResponseData;
                    if (this.responseData.ResponseCode == '200') {
                        this.buyAgainResponseDto = this.responseData.Data;
                        this.setSearchRequest();
                    }
                    else {
                        this.spinnerService.hide();
                    }
                }
            });
    }

    setSearchRequest() {
        let searchRequestModel = new SearchRequestModel();
        searchRequestModel.RailCardList = new Array<RailCardModel>();
        if (this.buyAgainResponseDto != null) {
            searchRequestModel.DepartureLocation = this.buyAgainResponseDto.DepartLocationId;
            searchRequestModel.DepartureLocationName = this.buyAgainResponseDto.DepartLocationName;
            searchRequestModel.ArrivalLocation = this.buyAgainResponseDto.ArriveLocationId;
            searchRequestModel.ArrivalLocationName = this.buyAgainResponseDto.ArriveLocationName;
            searchRequestModel.Traveltype = "DEPARTAFTER";
            searchRequestModel.TraveltypeReturn = "DEPARTAFTER";
            searchRequestModel.TravelSolutionDirection = this.buyAgainResponseDto.TravelSolDirection;
            searchRequestModel.Adult = this.buyAgainResponseDto.travellerDetails.Adult;
            searchRequestModel.Child = this.buyAgainResponseDto.travellerDetails.Children;

            // Added Journeysearchtype missing from Buyagain Newsearch call 
            searchRequestModel.JourneySearchType = 'NEW';
            if (this.buyAgainResponseDto.RailCardList != null && this.buyAgainResponseDto.RailCardList.length > 0) {
                this.buyAgainResponseDto.RailCardList.forEach(railcard => {
                    let sRailcards = new RailCardModel();
                    sRailcards.RailCard = railcard.Name;
                    sRailcards.Adult = railcard.Adult;
                    sRailcards.Child = railcard.Children;
                    sRailcards.RailCardCount = 1;
                    searchRequestModel.RailCardList.push(sRailcards);
                })
            }
            if (this.customerBookingRequest.BookingType == this.bookingTypeEnum.NonSeason) {
                const departureDate = moment.utc(new Date()).add(3, 'hours');
                const remainder = 30 - (departureDate.minute() % 30);
                searchRequestModel.DepartureTimesStart = moment(departureDate).add(remainder, "minutes").format('YYYY-MM-DDTHH:mm');


                const returnDate = moment.utc(new Date()).add(5, 'hours');
                const remainderReturn = 30 - (returnDate.minute() % 30);
                searchRequestModel.ReturnTimesStart = moment(returnDate).add(remainderReturn, "minutes").format('YYYY-MM-DDTHH:mm');
                searchRequestModel.IsSeason = false;
                searchRequestModel.IsFlexi = false;
                this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
            }
            else if (this.customerBookingRequest.BookingType == this.bookingTypeEnum.Season) {
                searchRequestModel.IsSeason = true;
                searchRequestModel.IsFlexi = false;
                searchRequestModel.DepartureTimesStart = moment.utc(new Date()).add(1, "days").format('YYYY-MM-DDTHH:mm');

                searchRequestModel.IsWeekly = true;
                searchRequestModel.IsMonthly = true;
                searchRequestModel.IsYearly = true;
                this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
            }
            else if (this.customerBookingRequest.BookingType == this.bookingTypeEnum.FlexiSeason) {
                searchRequestModel.DepartureTimesStart = moment.utc(new Date()).add(1, "days").format('YYYY-MM-DDTHH:mm');
                searchRequestModel.IsFlexi = true;
            }
            searchRequestModel.TicketClassFilter = "";
            searchRequestModel.ChangesFilter = -1;
            searchRequestModel.OperaterFilter = 2;
            this.sharedService.isAmendSearchOpen = false;
            this.sharedService.searchRequest = searchRequestModel;
        }
    }

    onChangeBookingFilter(event) {
        this.currentPageNo = 1;
        this.customerBookingRequest.PageNo = 1;
        this.customerBookingRequest.StatusFilter = event.value;
        this.getMyBookingList();
    }

    getMyBookingList() {
        this.totalItem = 0;

        this.myAccountService.getMyBookings(this.customerBookingRequest).subscribe(
            res => {
                if (res != null) {
                    this.responseData = res as ResponseData;
                    if (this.responseData.ResponseCode == '200') {
                        this.setCustomerBookingResponse();
                        localStorage.setItem(this.localStorageKeyEnum.customerBookingsResponse, JSON.stringify(this.responseData));
                    }
                    else {
                        console.log(this.responseData.ResponseMessage);
                    }
                }
            });
    }

    setCustomerBookingResponse(){
        this.customerBookingsResponse = this.responseData.Data;
        this.isUserVerified = this.customerBookingsResponse.IsUserVerified;
        this.bindMyBookingData();
    }

    buyNow() {
        window.location.href = environment.qttUrl;
    }

    buyNowForSeason() {
        window.location.href = `${environment.qttUrl}${environment.seasonQttUrl}`;
    }

    renewTicket(journey:JourneyDetails) {
      let dialogRef = this.dialog.open(RenewSmartcardComponent, {
          width: '600px'
        });
        dialogRef.afterClosed().subscribe(result =>{
            if(result){
                this.renewSmartcardRequest = new RenewSmartcardReqDto();
                this.renewSmartcardRequest.TravelId = journey.TravelId;
                this.renewSmartcardRequest.TravelSolutionId = journey.TravelSolutionId;
                this.myAccountService.renewSmartcard(this.renewSmartcardRequest).subscribe(
                    res => {
                    if (res != null) {
                      this.responseData = res as ResponseData;
                      if (this.responseData.ResponseCode == '200') {
                        this.setRenewTickerResponse();
                      }
                      else if (this.responseData.ResponseCode == '203') {
                        
                        this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
                      }
                      else {
                        console.log(this.responseData.ResponseMessage);
                      }
                    }
                  })
                }
            })

        }

    setRenewTickerResponse() {
        if (!this.responseData.Data.IsRenewSmartcard) {
            this.dialog.open(RenewPopupComponent, {
                panelClass: 'renew-info',
                data: {
                    message: this.responseData.Data.Error
                }
            })
            return;
        }
        this.reviewBuyResponse = this.responseData.Data;
        this.sharedServiceCache.reviewBuyResponse = this.responseData.Data;

        //Set shared cache data
        this.sharedService.setSharedService();
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        if (this.responseData.Data.IsRenewSmartcard) {
            this.router.navigate([`./` + this.appRouteEnum.ReviewBuy]);
        }
    }

    seeMoreJourneys() {
        if (Math.abs(this.totalItem - this.defaultJourney) <= 10) {
            this.isShowMoreJourneyDisabled = this.journeyList.length == this.totalItem ? false : true;
        }
        this.defaultJourney = this.defaultJourney == 2 ? this.defaultJourney + 8 : this.defaultJourney + 10;
        if (this.defaultJourney > 10 && this.journeyList.length != this.totalItem) {
            this.currentPageNo++;
            this.customerBookingRequest.PageNo = this.currentPageNo;
            this.getMyBookingList();
        }
    }

    seeLessJourneys() {
        if (this.defaultJourney != 2 && this.defaultJourney > 2) {
            this.defaultJourney = 2;
            this.currentPageNo = 1;
            this.isShowMoreJourneyDisabled = true;
        }
    }

    ticketInfo(ticketTypeCode: string, ticketType: string, ticketDescription: string, ticketInformation: string, ticketRestriction: string, journeyType: string) {
        this.dialog.open(MyAccountTicketInfoPopupComponent, {
            width: '600px',
            disableClose: false,
            panelClass: 'common-popup-theme',
            autoFocus: false, 
            restoreFocus: false,
            data: {
                ticketType: ticketType.trim(),
                ticketTypeCode: ticketTypeCode,
                ticketDescription: ticketDescription,
                ticketInformation: ticketInformation,
                ticketRestriction: ticketRestriction,
                journeyType: journeyType
            }
        });
    }

    getPassangerCount(journey) {
        let adultCount = '';
        let childCount = '';
        if (journey) {
            if (journey.AdultCount) {
                adultCount = (journey.AdultCount > 1) ? journey.AdultCount + ' Adults' : journey.AdultCount + ' Adult';
            }
            if (journey.ChildCount != 0) {
                childCount = journey.ChildCount > 1 ? journey.ChildCount + ' Children' : journey.ChildCount + ' Child';
            }
            return `${adultCount} ${childCount}`;
        }
    }

    calendarClick(journey) {
        try {
            let events = [];
            if (journey) {
                if (journey.OutwardTicketInfo) {
                    let outwardDetailObj = this.creatingOutAndRetJourneyEventDetail(true, journey, journey.TODReferenceNumber);
                    events.push(outwardDetailObj);
                }
                if (journey.ReturnTicketInfo) {
                    let returnDetailObj = this.creatingOutAndRetJourneyEventDetail(false, journey, journey.TODReferenceNumber);
                    events.push(returnDetailObj);
                }
                let content = this.calendarService.createEvent(events);
                if (content) {
                    let fileName = environment.addToCalendarFileName + "-" + this.calendarService.formattingDateForCalendar(new Date(journey.DepartureDate), true) + ".ics";
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

    creatingOutAndRetJourneyEventDetail(isOutwardOrReturn: boolean, journey: any, collectionReferenceNumber: any) {
        let selectedJourney = isOutwardOrReturn ? journey.OutwardTicketInfo : journey.ReturnTicketInfo;
        let arrivalTime = isOutwardOrReturn ? new Date(journey.ArrivalDate) : new Date(journey.ReturnArrivalDate);
        let departureTime = isOutwardOrReturn ? new Date(journey.DepartureDate) : new Date(journey.ReturnDepartureDate);
        let location = selectedJourney.DepartureStationName;
        let arrival = selectedJourney.ArrivalStationName;
        let train = isOutwardOrReturn ? this.commonService.setTrainNo(journey.OutwardSeat) : this.commonService.setTrainNo(journey.ReturnSeat); // I have used here index as 0 bcz train no remains same for all seats
        let dataObject;
        if (isOutwardOrReturn) {
            dataObject = this.creatingCalendarFileData(true, location, journey, arrival, train, collectionReferenceNumber);
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
            let outwardJourneyInformation = { location: location, arrival: arrival, train: train, journeyDetail: journey.OutwardTicketInfo, coach: obj.coach, seats: obj.seats, collectionReferenceNumber: collectionReferenceNumber };
            description = this.creatingCalendarDescriptionString(outwardJourneyInformation);
        } else {
            obj = this.commonService.setCoachAndSeatForCalendarFile(journey.ReturnSeat)
                ;
            let returnJourneyInformation = { location: location, arrival: arrival, train: train, journeyDetail: journey.ReturnTicketInfo, coach: obj.coach, seats: obj.seats, collectionReferenceNumber: collectionReferenceNumber }
            description = this.creatingCalendarDescriptionString(returnJourneyInformation);
        }
        let journeySummary = { location: location, arrival: arrival, train: train, coach: obj.coach, seats: obj.seats, collectionReferenceNumber: collectionReferenceNumber }
        let summary = this.commonService.creatingCalendarSummaryString(journeySummary);
        return { description: description, summary: summary };
    }

    creatingCalendarDescriptionString(journeyInformation: any) {
        let descriptionWithOutCollectionReference = `${journeyInformation.location}-${journeyInformation.arrival}; Train ${journeyInformation.train} , departing from ${journeyInformation.location} Hours: ${journeyInformation.journeyDetail.DepartureTime}; arriving at ${journeyInformation.arrival} Hours: ${journeyInformation.journeyDetail.ArrivalTime}
        Coach ${journeyInformation.coach}, Seat(s) ${journeyInformation.seats}`;
        let descriptionWithCollectionReference = `${journeyInformation.location}-${journeyInformation.arrival}; Train ${journeyInformation.train} , departing from ${journeyInformation.location} Hours: ${journeyInformation.journeyDetail.DepartureTime}; arriving at ${journeyInformation.arrival} Hours: ${journeyInformation.journeyDetail.ArrivalTime}
        Coach ${journeyInformation.coach}, Seat(s) ${journeyInformation.seats}; Collection reference number ${journeyInformation.collectionReferenceNumber}`;
        return journeyInformation.collectionReferenceNumber ? descriptionWithCollectionReference : descriptionWithOutCollectionReference;
    }

    isOpenReturnJourney(journey) {
        if ((journey?.OutwardTicketInfo && (journey.OutwardTicketInfo.TravelType == this.bookPassangerAssistEnum.openReturn) && (journey.ReturnTicketInfo == null))) {
            return true;
        }
        return false;
    }

    downloadVatReceipt(journeyDetail : JourneyDetails){
        let vatReceiptRequest = new VatRequestDTO();
        let vatReceiptResponse = new VatResponseDTO();
        vatReceiptRequest.BookingDate = journeyDetail.BookingDate.toString();
        vatReceiptRequest.BookingReferenceNumber = journeyDetail.BookingId.toString();
        vatReceiptRequest.Price = journeyDetail.BookingPrice;
        this.myAccountService.vatReceiptDataRequest(vatReceiptRequest).subscribe((res : any) => {
            vatReceiptResponse = res.Data;
            this.sharedService.isDownloadVatReceiptBtnClicked.next(vatReceiptResponse);
        }, err => {
            console.log(err);
        })
    }
    
    openTrackMyTrain(trackMyTrain: any, journetType: any, journeyDetail: any, ticketInfo: any, isReturn: boolean) {
        this.updateJourneyPlatformNo();
        let errorMsgClass = trackMyTrain?.TrackMyTrain?.ErrorMsgHeading ? 'track-my-train-info-popup' : '';
        let classToHideSeatReservationBlock = !trackMyTrain?.TrackMyTrain.TrainLiveInfo.IsCancelled && 
        !trackMyTrain?.TrackMyTrain.ErrorMsgHeading && !trackMyTrain?.TrackMyTrain.ErrorMsgText ? 'track-my-train-new-popup-width' : '';
        this.ga4dataLayerService.loadGALayerForTrackMyTrainClick(trackMyTrain?.TrackMyTrain, journeyDetail, ticketInfo, isReturn);
        let dialogRef = this.dialog.open(TrackMyTrainComponent, {
            width: '915px',
            disableClose: false,
            autoFocus: false,
            panelClass: ['common-popup-theme', 'track-my-train-popup',classToHideSeatReservationBlock, errorMsgClass],
            data: {
                trainLiveInfo: trackMyTrain?.TrackMyTrain.TrainLiveInfo,
                trackMyTrain: trackMyTrain?.TrackMyTrain,
                lastUpdatedTrackMyTrainTime: trackMyTrain?.TrackMyTrain.LastUpdatedTime,
                journetType: journetType,
                journeyDetail: journeyDetail,
                ticketInfo: ticketInfo,
                isReturnJourney: isReturn
              }
        });
        dialogRef.afterClosed().subscribe(re =>{
            if (window.screen.width <= 767 && (localStorage.getItem(this.localStorageKeyEnum.tmtBookingIdForPullDown) || localStorage.getItem(this.localStorageKeyEnum.tmtIsReturnJourneyForPullDown))) {
                localStorage.removeItem(this.localStorageKeyEnum.tmtBookingIdForPullDown);
                localStorage.removeItem(this.localStorageKeyEnum.tmtIsReturnJourneyForPullDown);
            }
            this.ga4dataLayerService.loadGA4LayerForCloseTrackMyTrainScreen(trackMyTrain?.TrackMyTrain, journeyDetail,ticketInfo, isReturn);
        })
    }

    displayTrackMyTrainBtn() {
        if (localStorage.getItem(this.localStorageKeyEnum.trackMyTrainFlowStrategy) == "true") {
          return true;
        }
        return false;
      }

    //PICO-3141 call method for user verification email
    isUserVerificationEmail() {
        this.startVerifyEmailRequestDto = new StartVerifyEmailRequestDto();
        this.startVerifyEmailRequestDto.UserEmail = localStorage.getItem('OriginalEmail');
        this.myAccountService.sentRequestToVerifyEmail(this.startVerifyEmailRequestDto);
    }

    pullDownToRefreshInMobile(){
        if(window.screen.width <= 767 && localStorage.getItem(this.localStorageKeyEnum.tmtBookingIdForPullDown)){
            let bookingIDStoredInLocalStorage = localStorage.getItem(this.localStorageKeyEnum.tmtBookingIdForPullDown);
            let isReturnJourney : any = localStorage.getItem(this.localStorageKeyEnum.tmtIsReturnJourneyForPullDown);
            let journeyList : JourneyDetails[]  = JSON.parse(localStorage.getItem(this.localStorageKeyEnum.journeyList));
            let journeyDetail : JourneyDetails[] = journeyList?.filter(m => m.BookingId == bookingIDStoredInLocalStorage);
            
            let trackMyTrain =  isReturnJourney == "true" ? journeyDetail[0]?.ReturnTicketInfo : journeyDetail[0]?.OutwardTicketInfo;
            
            let journetType =   isReturnJourney == "true" ?  this.journeyTypeEnum.returnOnlyText : this.journeyTypeEnum.outwardOnlyText;

            isReturnJourney = isReturnJourney  == "true" ? true : false;
        
            this.openTrackMyTrain(trackMyTrain, journetType, journeyDetail[0],trackMyTrain,isReturnJourney);
        }
    }

    
    setTMTObjectLastUpdatedTimeEventFired(){
        this.myAccountService.trackMyTrainLastUpdatedTimeSubject$.subscribe(data => {
            if(data.journeyType == 'Outward'){
                this.journeyList?.forEach(el => {
                    el.OutwardTicketInfo?.TrackMyTrain?.TrackMyJourneyInfoList?.forEach(li => {
                        data?.trackMyTrain?.TrackMyJourneyInfoList?.forEach(re => {
                            if(li.TrainUid == re.TrainUid){
                                el.OutwardTicketInfo.TrackMyTrain = Object.assign(el.OutwardTicketInfo.TrackMyTrain,data.trackMyTrain);
                            }
                        })
                    })
                })
            }else{
                this.journeyList?.forEach(el => {
                    el.ReturnTicketInfo?.TrackMyTrain?.TrackMyJourneyInfoList?.forEach(li => {
                        data?.trackMyTrain?.TrackMyJourneyInfoList?.forEach(re => {
                            if(li.TrainUid == re.TrainUid){
                                el.ReturnTicketInfo.TrackMyTrain = Object.assign(el.ReturnTicketInfo.TrackMyTrain, data.trackMyTrain);
                            }
                        })
                    })
                })
            }
        });
    }

    updateBookingListOrOpenLoginDialogueIfCustomerEmailIsNull(customerKey, customerEmail){
        if (customerKey != null && customerEmail != null && localStorage.getItem(this.localStorageKeyEnum.tmtBookingIdForPullDown) == null) {
            this.getMyBookingList();
        } else if(window.screen.width <= 767 && localStorage.getItem(this.localStorageKeyEnum.tmtBookingIdForPullDown)){
            this.totalItem = 0;
            this.responseData = JSON.parse(localStorage.getItem(this.localStorageKeyEnum.customerBookingsResponse)) as ResponseData;
            this.setCustomerBookingResponse();
        }
        else {
            const dialogConfig = new MatDialogConfig();
            dialogConfig.disableClose = false;
            dialogConfig.autoFocus = true;
            dialogConfig.width = "60%";
            dialogConfig.panelClass = 'class-dialog1';
            dialogConfig.data = { isLoginFromAccount: true };
            this.dialog.open(LoginPageComponent, dialogConfig);
        }
    }
    
    setCustomerBookingRequest(){
        this.setTabIndexForSeasonUrlInApp();
        if (+(localStorage.getItem(this.localStorageKeyEnum.tabIndex))) {
            this.tabIndex = +(localStorage.getItem(this.localStorageKeyEnum.tabIndex));
            if (this.tabIndex == this.tabIndexValueEnum.pastJourneyTabIndex) {
                this.customerBookingRequest.BookingType = this.bookingTypeEnum.NonSeason;
                this.customerBookingRequest.StatusFilter = this.journeyTypeEnum.pastJourney;
                this.isSeason = false;
            }
            if (this.tabIndex == this.tabIndexValueEnum.seasonJourneyTabIndex) {
                this.customerBookingRequest.BookingType = this.bookingTypeEnum.Season;
                this.customerBookingRequest.StatusFilter = this.journeyTypeEnum.allForSeason;
                this.isSeason = true;
            }
        }
    }

    filterByDateJourney(journeyType: string) {
        let dialogRef = this.dialog.open(MyBookingsFilterDatepickerComponent, {
            disableClose: false,
            panelClass: ['datepicker-info', 'filter-range-datepicker-popup'],
            data: {
                isMyBooking: true,
                journeyType: journeyType,
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.journeyList = [];
                this.bookingFilterJourneyRequest.StartDate = moment(new Date(result.fromDate)).format('YYYY-MM-DDT00:00');
                this.bookingFilterJourneyRequest.EndDate = moment(new Date(result.toDate)).format('YYYY-MM-DDT23:59');
                this.bookingFilterJourneyRequest.CustomerKey = localStorage.getItem('CustomerKey');
                this.bookingFilterJourneyRequest.BookingType = this.isSeason ? this.bookingTypeEnum.Season : this.bookingTypeEnum.NonSeason;
                this.myAccountService.getFilteredJourney(this.bookingFilterJourneyRequest).subscribe(
                    res => {
                        if (res != null) {
                            this.responseData = res as ResponseData;
                            this.setFilteredJourneyResponse(this.responseData);
                        }
                    });
            }
        });
    }

    clearJourneyFilter() {
        let customerKey = localStorage.getItem('CustomerKey');
        let customerEmail = localStorage.getItem('Email');
        this.journeyList = [];
        this.noBookingsForSelectedDate = false;
        this.updateBookingListOrOpenLoginDialogueIfCustomerEmailIsNull(customerKey, customerEmail);
    }

    setFilteredJourneyResponse(responseData){
        if (responseData.ResponseCode == '200') {
            this.setCustomerBookingResponse();
            this.showFilterByDateBtn = false;
            this.showClearFilterBtn = true;
            if (!this.journeyList) {
                this.noBookingsForSelectedDate = true;
                this.noTripsForUpcoming = false;
                this.noTripsForPast = false;
                this.noTripsForSeason = false;
            }
        } else {
            console.log(responseData.ResponseMessage);
        }
    }
    
    setTabIndexForSeasonUrlInApp(){
        if(this.router.url.includes(this.appRouteEnum.seasonRouteUrlForApp.toLowerCase())){
            localStorage.setItem(this.localStorageKeyEnum.tabIndex, this.tabIndexValueEnum.seasonJourneyTabIndex.toString());
        }
    }

    bindPlatformNoOnTmtButton(platformNo: string){
        return platformNo == 'Platform not ready' || platformNo == 'not ready' ? 'Platform not ready' : `Platform ${platformNo}`;
    }
    
    updateJourneyPlatformNo(){
        try{
            if(JSON.parse(localStorage.getItem(this.localStorageKeyEnum.platformNoInfoOfCustomerBookingResponse))){
                let platformNoTmtArrayOjbect = JSON.parse(localStorage.getItem(this.localStorageKeyEnum.platformNoInfoOfCustomerBookingResponse));
                platformNoTmtArrayOjbect?.forEach(e=>{
                    this.journeyList?.forEach(journey => {
                        if(e?.BookingId === journey?.BookingId){
                            if(journey?.OutwardTicketInfo && e?.OutwardTicketInfo){
                                if(journey?.OutwardTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress && !e?.OutwardTicketInfo?.IsPlatformSuppress && e?.OutwardTicketInfo?.PlateformNo.toLowerCase() !== 'not ready'){
                                    journey.OutwardTicketInfo.TrackMyTrain.TrainLiveStatus.PlateformNo = e?.OutwardTicketInfo?.PlateformNo;
                                    journey.OutwardTicketInfo.TrackMyTrain.TrainLiveStatus.IsPlatformSuppress = e?.OutwardTicketInfo?.IsPlatformSuppress;
                                    journey.OutwardTicketInfo.TrackMyTrain.TrainLiveInfo.TrainLegList.forEach(trainLeg => {
                                        trainLeg.CallingPointList.forEach(callinPoint => {
                                            if(callinPoint.IsJourneyOriginStation){
                                                callinPoint.PlateFormNo = e?.OutwardTicketInfo?.PlateformNo;
                                                callinPoint.IsPlatformSuppress = e?.OutwardTicketInfo?.IsPlatformSuppress;
                                            }
                                        });
                                    });
                                }   
                            }
                            if(journey?.ReturnTicketInfo && e?.ReturnTicketInfo){
                                if(journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress && !e?.OutwardTicketInfo?.IsPlatformSuppress && e?.ReturnTicketInfo?.PlateformNo.toLowerCase() !== 'not ready'){
                                    journey.ReturnTicketInfo.TrackMyTrain.TrainLiveStatus.PlateformNo = e?.ReturnTicketInfo?.PlateformNo;
                                    journey.ReturnTicketInfo.TrackMyTrain.TrainLiveStatus.IsPlatformSuppress = e?.ReturnTicketInfo?.IsPlatformSuppress;
                                    journey.ReturnTicketInfo.TrackMyTrain.TrainLiveInfo.TrainLegList.forEach(trainLeg => {
                                        trainLeg.CallingPointList.forEach(callinPoint => {
                                            if(callinPoint.IsJourneyOriginStation){
                                                callinPoint.PlateFormNo = e?.ReturnTicketInfo?.PlateformNo;
                                                callinPoint.IsPlatformSuppress = e?.ReturnTicketInfo?.IsPlatformSuppress;
                                            }
                                        });
                                    });
                                }
                            }
                        }
                    });
                });
                let dataObject = this.createAndUpdateCustomerJourneyPlatformNoObjectInLocalStorage();
                let uniqueJourneyList = [];
                uniqueJourneyList = this.checkForUniqueJourneyToStoreInLocalStorageInCaseofTMT(dataObject, platformNoTmtArrayOjbect);
                platformNoTmtArrayOjbect = platformNoTmtArrayOjbect?.length > 0 ? [...platformNoTmtArrayOjbect, ...uniqueJourneyList] : uniqueJourneyList;
                localStorage.removeItem(this.localStorageKeyEnum.platformNoInfoOfCustomerBookingResponse);
                localStorage.setItem(this.localStorageKeyEnum.platformNoInfoOfCustomerBookingResponse, JSON.stringify(platformNoTmtArrayOjbect));
            }else{
                let dataObject;
                dataObject = this.createAndUpdateCustomerJourneyPlatformNoObjectInLocalStorage();
                if(dataObject?.length > 0){
                    localStorage.setItem(this.localStorageKeyEnum.platformNoInfoOfCustomerBookingResponse, JSON.stringify(dataObject));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    checkForUniqueJourneyToStoreInLocalStorageInCaseofTMT(dataObject, platformNoTmtArrayOjbect){
        try{
            let uniqueJourneyList = [];
            dataObject.forEach(arr => {
                let data = platformNoTmtArrayOjbect.map((temp) => temp['BookingId']).indexOf(arr.BookingId);
                if(data == -1){
                    uniqueJourneyList.push(arr);
                }
            });
            return uniqueJourneyList;
        } catch (error) {
            console.log(error);
        }
    }

    createAndUpdateCustomerJourneyPlatformNoObjectInLocalStorage(){
        try{
            let customerJourneyPlaftormNoArrayObjectTmt = [];
            this.journeyList?.forEach(journey => {
                let dataObject = {};
                if(this.checkIsPlatformSuppressInCaseOfOutwardJourney(journey)){
                    dataObject['OutwardTicketInfo'] = {};
                    dataObject['OutwardTicketInfo']['PlateformNo'] = journey?.OutwardTicketInfo?.TrackMyTrain?.TrainLiveStatus?.PlateformNo;
                    dataObject['OutwardTicketInfo']['IsPlatformSuppress'] = journey?.OutwardTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress;
                }
                if(this.checkIsPlatformSuppressInCaseOfReturnJourney(journey)){
                    dataObject['ReturnTicketInfo'] = {};
                    dataObject['ReturnTicketInfo']['PlateformNo'] = journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus?.PlateformNo;
                    dataObject['ReturnTicketInfo']['IsPlatformSuppress'] = journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress;
                }
                if(Object.keys(dataObject).length > 0){
                    dataObject['BookingId'] = journey?.BookingId;
                    customerJourneyPlaftormNoArrayObjectTmt.push(dataObject);
                }
            });
            return customerJourneyPlaftormNoArrayObjectTmt;
        } catch (error) {
            console.log(error);
        }
    }

    checkIsPlatformSuppressInCaseOfOutwardJourney(journey){
        return journey?.OutwardTicketInfo?.TrackMyTrain?.TrainLiveStatus && journey?.OutwardTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress !== null && !journey?.OutwardTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress;
    }

    checkIsPlatformSuppressInCaseOfReturnJourney(journey){
        return journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus && journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress !== null && !journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress;
    }

    checkIsTrainLegInfoAvailableOrNot(journeyLeg){
        return journeyLeg?.TrainLegList && !journeyLeg?.TrainLegList[0]?.IsTrainDepartedFromJourneyOrigin;
    }

    checkToShownDownloadReceiptButtonForPastJourney(customerBookingsResponse, pastJourney) {
        if (customerBookingsResponse && pastJourney && customerBookingsResponse?.IsVatReceiptEnabled && pastJourney?.VatReceiptDetails?.PDFBytes && !(pastJourney?.IsRefundable || pastJourney?.IsInternalRefundable && pastJourney?.Status != this.journeyTypeEnum.refundedJourney)) {
            return true;
        }
        return false;
    }

}


