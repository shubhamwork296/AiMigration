import { Component, Injector, OnInit } from '@angular/core';
import { BasketJourneyRequestDto, CojReviewBuyResponse, ReservationDetail, ReservationSeat } from 'src/app/models/review-buy/review-buy-model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { browserRefresh} from '../../app-component/app.component';
import * as moment from 'moment';
import { SeatpickerPopupComponent } from '../review-and-buy/seatpicker-popup/seatpicker-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { EvaluateRequestDto, PrepareOrderRequestDto } from 'src/app/models/account/my-bookings.model';
import { SeatPickerRequestDto, SeatPickerResponseDto } from 'src/app/models/review-buy/seat-picker-model';
import { MyAccountService } from 'src/app/services/my-account.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { Router } from '@angular/router';
import { AppRouteEnum } from 'src/app/utility/app-constants.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';
import { ReviewBuyService } from 'src/app/services/review-buy.service';
import { CommonServices } from 'src/app/services/common.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
    selector: 'app-amend-review-buy',
    templateUrl: './amend-review-buy.component.html',
    styleUrls: ['./amend-review-buy.component.css'],
    standalone: false
})
export class AmendReviewBuyComponent implements OnInit {

  browserRefresh: boolean;
  reviewBuyResponseData: CojReviewBuyResponse;
  journeyName: string;
  isOutwardJourneyExist: boolean;
  isReturnJourneyExist: boolean;
  arrivalLocation: string;
  departureLocation: string;
  adultOnReviewBuy: number;
  childOnReviewBuy: number;
  outwardDetail: ReservationDetail = null;
  outwardDuration: string;
  outwardChanges: number;
  outwardTicketType: string;
  outwardTicketClass: string;
  outwardTicketRestriction: string;
  outwardTicketDescription: string;
  outwardLegs = [];
  OperatorOutward: number;
  OperatorChangeOutward: number;
  saleCompanyOutward:string;
  DepartureDate: string;
  DepartureTimeOutward: string;
  ArrivalTimeOutward: string;
  returnDetail: ReservationDetail = null;
  returnDuration: string;
  returnChanges: number;
  returnTicketType: string;
  returnTicketClass: string;
  returnTicketRestriction: string;
  returnTicketDescription: string;
  returnLegs= [];
  OperatorReturn: number;
  OperatorChangeReturn: number;
  saleCompanyReturn: string;
  ArrivalDate: string;
  DepartureTimeReturn: string;
  ArrivalTimeReturn: string;
  journeyText: string;
  isOpenSeatpicker: boolean = false;
  isLegChoosed: boolean = false;
  choosedTrainLeg: ReservationSeat;
  isOutwardLegChoosed: boolean;
  responseData: ResponseData; 
  step = 0;
  evaluateRequest: EvaluateRequestDto;
  seatPickerResponse: SeatPickerResponseDto;
  sticky: boolean;
  isNonRefundableTicketOutward = false;
  isNonRefundableTicketReturn = false;
  EvaluateCache: string;

  sharedService: SharedService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  myAccountService: MyAccountService;
  appRouteEnum: AppRouteEnum;
  notificationService: NotificationService;
  searchSolutionService: SearchSolutionService;
  reviewBuyService: ReviewBuyService;
  commonService: CommonServices;
  ga4datalayerService: GA4DatalayerService;

  constructor(private readonly router: Router, private readonly injector: Injector, private readonly dialog: MatDialog) {
    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.myAccountService = this.injector.get(MyAccountService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.notificationService = this.injector.get(NotificationService);
    this.searchSolutionService = this.injector.get(SearchSolutionService);
    this.reviewBuyService = this.injector.get(ReviewBuyService);
    this.commonService = this.injector.get(CommonServices);
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
  }

  ngOnInit() {
    let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
        this.sharedService.reserveSeatRequest= sharedSiblingRefresh.reserveSeatRequest;
        this.sharedService.journey = sharedSiblingRefresh.journey;
        this.sharedService.selectedAmendLeg = sharedSiblingRefresh.selectedAmendLeg;
        this.sharedService.reserveSeatRequestDate = sharedSiblingRefresh.reserveSeatRequestDate;
        this.sharedService.IsReturnTypeTicket = sharedSiblingRefresh.IsReturnTypeTicket;
        this.sharedService.IsRetReservationAvailable = sharedSiblingRefresh.IsRetReservationAvailable;
        this.sharedService.IsOutReservationAvailable = sharedSiblingRefresh.IsOutReservationAvailable;
        this.sharedService.amendReviewBuyData = sharedSiblingRefresh.amendReviewBuyData;
        this.sharedService.amendReviewBuyEvaluateRequest = sharedSiblingRefresh.amendReviewBuyEvaluateRequest; 
        this.sharedService.IsPartialReturnTypeTicket = sharedSiblingRefresh.IsPartialReturnTypeTicket;       
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
      }
      this.reviewBuyResponseData = null;
      if(this.sharedService.amendReviewBuyEvaluateRequest) {
        this.fetchAmendReviewBuyData();
      }
    } else {
      this.reviewBuyResponseData = this.sharedService.amendReviewBuyData;
      this.EvaluateCache = this.reviewBuyResponseData.COJData.COJEvaluateCache;
    }
    this.evaluateRequest = this.sharedService.amendReviewBuyEvaluateRequest;
    this.bindJourneyData();

    // page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
  }

  bindJourneyData() {
    if(this.reviewBuyResponseData) {
      if(this.reviewBuyResponseData.Journey && this.reviewBuyResponseData.Journey.length > 0) {
        this.isOutwardJourneyExist = !!this.reviewBuyResponseData?.Journey?.[0]?.OutwardDetail;
        this.isReturnJourneyExist = !!this.reviewBuyResponseData?.Journey?.[0]?.ReturnDetail;
        this.arrivalLocation = this.reviewBuyResponseData.Journey[0].Arrival;
        this.departureLocation = this.reviewBuyResponseData.Journey[0].Departure;
        this.adultOnReviewBuy = this.reviewBuyResponseData.Journey[0].Adult;
        this.childOnReviewBuy = this.reviewBuyResponseData.Journey[0].Child;
        this.journeyText = this.reviewBuyResponseData.Journey[0].Journey;
        this.bindOutwardJourneyData(this.isOutwardJourneyExist);
        this.bindReturnJourneyData(this.isReturnJourneyExist);
      }
    }
  }

  bindOutwardJourneyData(isOutwardJourneyExist : boolean) {
    if(isOutwardJourneyExist) {
      this.outwardDetail = this.reviewBuyResponseData.Journey[0].OutwardDetail;
      this.outwardDuration = this.reviewBuyResponseData.Journey[0].OutwardDetail.Duration;
      this.outwardChanges = +this.reviewBuyResponseData.Journey[0].OutwardDetail.Changes;
      this.outwardTicketType = this.reviewBuyResponseData.Journey[0].OutwardDetail.TicketType;
      this.outwardTicketClass = this.reviewBuyResponseData.Journey[0].OutwardDetail.TicketClass;
      this.outwardTicketRestriction = this.reviewBuyResponseData.Journey[0].OutwardDetail.TicketRestriction;
      this.outwardTicketDescription = this.reviewBuyResponseData.Journey[0].OutwardDetail.TicketDescription;
      this.outwardLegs = this.reviewBuyResponseData.Journey[0].OutwardSeat;
      this.OperatorOutward = this.reviewBuyResponseData.Journey[0].OutwardDetail.Operator;
      this.OperatorChangeOutward = this.reviewBuyResponseData.Journey[0].OutwardDetail.OperatorChange;
      this.saleCompanyOutward = this.reviewBuyResponseData.Journey[0].OutwardDetail.SaleCompany;
      this.DepartureDate = this.getFormattedDate(this.outwardDetail.DepartureTime);
      this.DepartureTimeOutward = moment(this.outwardDetail.DepartureTime).format("HH:mm");
      this.ArrivalTimeOutward = moment(this.outwardDetail.ArrivalTime).format("HH:mm");
      this.isNonRefundableTicketOutward = this.checkRefundableTicketOrNot(this.outwardTicketType);

    }
  }

  bindReturnJourneyData(isReturnJourneyExist: boolean) {
    if(isReturnJourneyExist) {
      this.returnDetail = this.reviewBuyResponseData.Journey[0].ReturnDetail;
      this.returnDuration = this.reviewBuyResponseData.Journey[0].ReturnDetail.Duration;
      this.returnChanges = +this.reviewBuyResponseData.Journey[0].ReturnDetail.Changes;
      this.returnTicketType = this.reviewBuyResponseData.Journey[0].ReturnDetail.TicketType;
      this.returnTicketClass = this.reviewBuyResponseData.Journey[0].ReturnDetail.TicketClass;
      this.returnTicketRestriction = this.reviewBuyResponseData.Journey[0].ReturnDetail.TicketRestriction;
      this.returnTicketDescription = this.reviewBuyResponseData.Journey[0].ReturnDetail.TicketDescription;
      this.returnLegs = this.reviewBuyResponseData.Journey[0].ReturnSeat;
      this.OperatorReturn = this.reviewBuyResponseData.Journey[0].ReturnDetail.Operator;
      this.OperatorChangeReturn = this.reviewBuyResponseData.Journey[0].ReturnDetail.OperatorChange;
      this.saleCompanyReturn = this.reviewBuyResponseData.Journey[0].ReturnDetail.SaleCompany;
      this.ArrivalDate = this.getFormattedDate(this.returnDetail.DepartureTime);
      this.DepartureTimeReturn = moment(this.returnDetail.DepartureTime).format("HH:mm");
      this.ArrivalTimeReturn = moment(this.returnDetail.ArrivalTime).format("HH:mm");
      this.isNonRefundableTicketReturn = this.checkRefundableTicketOrNot(this.returnTicketType);
    }
  }

  fetchAmendReviewBuyData() {
    this.evaluateRequest = this.sharedService.amendReviewBuyEvaluateRequest;
    this.searchSolutionService.fetchAmendEvaluateReturn(this.evaluateRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.reviewBuyResponseData = this.responseData.Data;
            this.EvaluateCache = this.reviewBuyResponseData.COJData.COJEvaluateCache;
            this.sharedService.amendReviewBuyData = this.reviewBuyResponseData;
            
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data

            this.bindJourneyData();
          }
          else {
            this.notificationService.warn(this.responseData.ResponseMessage);

          }
        }
      }); 
  }


getFormattedDate(passedDate: string) {
    let dateArr =  new Date(passedDate).toDateString().split(' ');
    let day = dateArr[0];
    let month = dateArr[1];
    let dateOfMonth = dateArr[2];
    let year = dateArr[3];
    return `${day}, ${dateOfMonth} ${month} ${year}`;
}
formattedSeatType(SeatTypes: string) {
  let seatTypeString= "";
  if(SeatTypes) {
    seatTypeString = ", ";
    SeatTypes.split(",").forEach(seatType => {
      seatTypeString+= (seatType.match(/[A-Z][a-z]+/g).join(" ")+", ");
     });
    seatTypeString= seatTypeString.slice(0,-2);
  }
  return seatTypeString;
}

formattedSeat(SeatFacing: string, SeatPosition: string) {
  let seatString= "";
  if(SeatFacing && SeatFacing!=="-" && SeatFacing!=="") {
    seatString+= SeatFacing.match(/[A-Z][a-z]+/g).join(" ") + ', ';
  }
  if(SeatPosition && SeatPosition!=="-" && SeatPosition!=="") {
    seatString+= SeatPosition.match(/[A-Z][a-z]+/g).join(" ");
  }
  return seatString;
}

 
onClosingTrainLegs() {
    this.isOpenSeatpicker = false;
    this.isLegChoosed = false;
    this.choosedTrainLeg = null;
  }
  
onTrainLegClick(trainLeg, isOutwardLegChoosed: boolean) {
    if(trainLeg.IsSeatPicker) {
      this.isLegChoosed = true;
      this.choosedTrainLeg = trainLeg;
      this.isOutwardLegChoosed = isOutwardLegChoosed;
    }
  }

  onModifySeatBtnClick() {
    this.isOpenSeatpicker = true;
    this.isLegChoosed = false;
    this.isOutwardLegChoosed = false;
    this.choosedTrainLeg = null;
    setTimeout(() => {
      document.querySelector('#selectTrainLegsDiv').scrollIntoView({ block: 'center' });
    },0);
  }
  onSelectTrainClick() {
    let changeOtherSeatRequestDto = this.getChangeOtherSeatRequestDto();

    this.myAccountService.fetchViewSeatPickerPostSale(changeOtherSeatRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.seatPickerResponse = this.responseData.Data;
            this.sharedService.seatPickerResponseAmend = this.seatPickerResponse;

            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            this.sharedService.isFromAmendReservation = true;
            this.openSeatpicker(this.choosedTrainLeg, this.reviewBuyResponseData.Journey[0], this.isOutwardLegChoosed);
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  openSeatpicker(selectedAmendLeg, Journey, isOutWardLeg) {
    let dialogRef = this.dialog.open(SeatpickerPopupComponent, {
      disableClose: true,
      panelClass: 'seat-picker',
      data: {
        seatInfo: selectedAmendLeg,
        journey: Journey,
        isOutWardJourney: isOutWardLeg,
        isAmendReviewBuyData: true,
        isDateChange: true,
        IsReturnTypeTicket: this.sharedService.IsReturnTypeTicket,
      }
    });

     // To prevent page refresh on seat picker popup open added this class on html and body tag
     document.getElementsByTagName('html')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
     document.getElementsByTagName('body')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');

    this.isLegChoosed = false;
    this.choosedTrainLeg = null;

    dialogRef.afterClosed().subscribe(() => {
      this.sharedService.isFromAmendReservation = false;
       // on seat picker popup close removed this class from html and body tag
       document.getElementsByTagName('html')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
       document.getElementsByTagName('body')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.getBasketJourney();
    });
  }

  checkRefundableTicketOrNot(ticketType: string) {
    if(ticketType && (ticketType.toLowerCase().indexOf('advance') !== -1 || ticketType.toLowerCase().indexOf('family') !== -1)) {
      return true;
    }
    else {
      return false;
    }
  }

  getBasketJourney() {
    let basketJourneyRequestDto = new BasketJourneyRequestDto();
    if(this.sharedService.reviewBuyCache) {
      basketJourneyRequestDto.IsNreBasket = false;
      basketJourneyRequestDto.IsSeason = false;
      basketJourneyRequestDto.ReviewBuyCache = this.sharedService.reviewBuyCache;
      basketJourneyRequestDto.IsAmendChangeDate = true;
      basketJourneyRequestDto.IsChangeDate = true;
      basketJourneyRequestDto.IsPostSale = false;

      this.reviewBuyService.getBasketJourney(basketJourneyRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          let ResponseCode = +this.responseData.ResponseCode;
          if (ResponseCode === 200) {
            this.reviewBuyResponseData = this.responseData.Data;
            this.bindJourneyData();
            this.sharedService.reviewBuyCache = this.reviewBuyResponseData.ReviewBuyCache;
          } else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
    });
  }
  }

  onContinue() {
    
        if (this.conditionToCheckReviewBuyResponseDataOnContinue()) {
          this.notificationService.error("Please add a journey first.");
          return;
        }
        
        this.sharedService.isFromAmendReservation = false;
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data

        let prepareOrderRequest = this.getPrepareOrderRequest();

        this.sharedService.reviewBuyCache = null;
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data

          this.commonService.loaderRequired = true;
          this.myAccountService.fetchDataPostSeatpickerAmend(prepareOrderRequest).subscribe(
            res => {
              if (res != null) {
                this.responseData = res as ResponseData;
                if (this.responseData.ResponseCode == '200') {
                  let prepareOrderAmendResponse = this.responseData.Data;
                  if(prepareOrderAmendResponse.IsSuccess) {
                    this.storageDataService.setSessionStorageData('AmendReserveResponse', prepareOrderAmendResponse, true);
                     this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isAmend: true }});
                  }
                }
                else {
                  this.notificationService.error(this.responseData.ResponseMessage);
                }
              }
            });
  }

  getPrepareOrderRequest() {
    let request:PrepareOrderRequestDto = new PrepareOrderRequestDto();  
    request.Email = localStorage.getItem('Email');
    request.EvaluateCache = this.EvaluateCache;
    request.UpdateReservationResponseCache = this.sharedService.reviewBuyCache;
    request.IsOutward = this.isOutwardLegChoosed;
    return request;
  }

  goBack(){
    this.router.navigate(["./"+ this.appRouteEnum.amendSearchPage]);
  }

  getChangeOtherSeatRequestDto() {
    let changeOtherSeatRequestDto = new SeatPickerRequestDto();
    changeOtherSeatRequestDto.Arrival = this.choosedTrainLeg.Arrival;
    changeOtherSeatRequestDto.ArrivalLocation = this.choosedTrainLeg.ArrivalLocation;
    changeOtherSeatRequestDto.Departure = this.choosedTrainLeg.Departure;
    changeOtherSeatRequestDto.DepartureLocation = this.choosedTrainLeg.DepartureLocation;
    changeOtherSeatRequestDto.IsOutward = this.isOutwardLegChoosed;
    changeOtherSeatRequestDto.IsDateChange = true;
    changeOtherSeatRequestDto.IsReturnTypeTicket = true;
    changeOtherSeatRequestDto.Traveldate = this.isOutwardLegChoosed ? this.outwardDetail.TravelDate : this.returnDetail.TravelDate;
    changeOtherSeatRequestDto.ReviewBuyCache = this.sharedService?.reviewBuyCache ? this.sharedService.reviewBuyCache : null;
    changeOtherSeatRequestDto.EvaluateCache = this.EvaluateCache;
    return changeOtherSeatRequestDto;
  }

  conditionToCheckReviewBuyResponseDataOnContinue(){
    return !this.reviewBuyResponseData?.Journey?.length;
  }

}
