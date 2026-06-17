import { Component, Injector, OnInit } from '@angular/core';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource  } from '@angular/material/table';
import { TicketInfoComponent } from 'src/app/Component/mixing-deck/ticket-info/ticket-info.component';
import { FareModel } from 'src/app/models/mixing-deck/fare.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { AppRouteEnum } from 'src/app/utility/app-constants.service';
import { Router } from '@angular/router';
import { MyAccountService } from 'src/app/services/my-account.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { SeatpickerPopupComponent } from 'src/app/Component/review-and-buy/seatpicker-popup/seatpicker-popup.component';
import { SeatPickerResponseDto } from 'src/app/models/review-buy/seat-picker-model';
import { TravelSolutionModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { EvaluateRequestDto, PrepareOrderRequestDto, ReserveSeatRequestDto, SearchSimilarForDateResponseDto } from 'src/app/models/account/my-bookings.model';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';
import { CojReviewBuyResponse, ReservationSeat } from 'src/app/models/review-buy/review-buy-model';
import { DatePickerPopupAmendSeatComponent } from './date-picker-popup-amend-seat/date-picker-popup-amend-seat.component';
import { browserRefresh } from '../../app-component/app.component';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { CommonServices } from 'src/app/services/common.service';
import { InfoPopupComponent } from '../mixing-deck/info-popup/info-popup.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
  selector: 'app-amend-seat-reservation',
  templateUrl: './amend-seat-reservation.component.html',
  styleUrls: ['./amend-seat-reservation.component.css']
})
export class AmendSeatReservationComponent implements OnInit {

  sharedService: SharedService;
  notificationService: NotificationService;
  commonService: CommonServices;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  appRouteEnum: AppRouteEnum;
  myAccountService: MyAccountService;
  searchSolutionService: SearchSolutionService;
  ga4datalayerService: GA4DatalayerService;
  
  constructor(private readonly router: Router, private readonly injector: Injector, public dialog: MatDialog,) {
    this.sharedService = this.injector.get(SharedService);
    this.notificationService = this.injector.get(NotificationService);
    this.commonService = this.injector.get(CommonServices);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.myAccountService = this.injector.get(MyAccountService);
    this.searchSolutionService = this.injector.get(SearchSolutionService);
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
  }


  columnsToDisplay = ['Operator', 'DepartureTime', 'ArrivalTime', 'Duration', 'Changes', 'statusOfSolution'];
  dataSource: MatTableDataSource<any> = null;
  searchSimilarResponse: SearchSimilarForDateResponseDto;
  searchSimilarResponseReturn: SearchSimilarForDateResponseDto;
  reserveSeatRequest: ReserveSeatRequestDto;
  initialReserveSeatRequest: ReserveSeatRequestDto;
  browserRefresh: boolean;
  responseData: ResponseData;
  isHideEarlier: boolean;
  isHideLater: boolean;
  evaluateRequest: EvaluateRequestDto;
  seatPickerResponse: SeatPickerResponseDto;
  disableContinueBtn: boolean = true;
  showJourneyType: string;
  selectedAmendLeg: ReservationSeat;
  expandedElement: TravelSolutionModel;
  sticky: boolean;
  dateOfJourneyShowText = "";
  ticketDetails: FareModel = null;
  showJourneyTypeReturn: string = "Return";
  dateOfJourneyShowTextReturn = "";
  expandedElementReturn: TravelSolutionModel;
  isReturnJourney: boolean;
  dataSourceReturn: MatTableDataSource<any> = null;
  isHideEarlierReturn: boolean;
  isHideLaterReturn: boolean;
  dayChangeMessage: string;
  isPartialReturnTypeTicket: boolean;

  ngOnInit() {
    let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      this.setSharedSiblingDataOnNgOnit(sharedSiblingRefresh);
    } else {
      this.handleSearchSimilarResponse();
    }
    // page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
  }

  setInitialData() {
    this.searchSimilarResponse = this.sharedService.searchSimilarResponse;
    this.searchSimilarResponseReturn = this.sharedService?.searchSimilarResponse?.retSearchSimilarForDateResponseDto;
    this.reserveSeatRequest = this.sharedService.reserveSeatRequest;
    this.reserveSeatRequest.IsDatePickerDate = false;
    this.initialReserveSeatRequest = JSON.parse(JSON.stringify(this.reserveSeatRequest));
    this.selectedAmendLeg = this.sharedService.selectedAmendLeg;
    this.isReturnJourney = !!this.sharedService?.IsReturnTypeTicket;
    this.isPartialReturnTypeTicket = !!this.sharedService?.IsPartialReturnTypeTicket;
  }

  checkJourneyType(isReturnJourney) {
    try {
      if (isReturnJourney) {
        if (this.isPartialReturnTypeTicket) {
          if (this.searchSimilarResponse?.IsOutWard) {
            return 'Out';
          }
          return 'Return';
        }
        return 'Out';
      } else {
        if (this.searchSimilarResponse?.IsOutWard) {
          return 'Out';
        }
        return 'Return';
      }
    } catch (error) {
      console.log(error);
    }
  }

  bindSearchSimilarData() {
    this.dataSource = new MatTableDataSource(this.searchSimilarResponse.TravelSolutionListToView);
    this.isHideEarlier = this.searchSimilarResponse.HideEarlier;
    this.isHideLater = this.searchSimilarResponse.HideLater;
    this.showJourneyType = this.checkJourneyType(this.isReturnJourney);
    this.dateOfJourneyShowText = this.getFormattedDate(this.searchSimilarResponse.Date);
    this.ticketDetails = this.searchSimilarResponse.FareList ? this.searchSimilarResponse.FareList[0] : null;
  }

  bindSearchSimilarDataReturn(isReturnJourney) {
    if (isReturnJourney && this.searchSimilarResponseReturn) {
      this.dataSourceReturn = new MatTableDataSource(this.searchSimilarResponseReturn.TravelSolutionListToView);
      this.isHideEarlierReturn = this.searchSimilarResponseReturn.HideEarlier;
      this.isHideLaterReturn = this.searchSimilarResponseReturn.HideLater;
      this.dateOfJourneyShowTextReturn = this.getFormattedDate(this.searchSimilarResponseReturn.Date);
    }
  }

  getFormattedDate(DateString: string) {
    if (moment(DateString).isValid()) {
      let finalDate = ((DateString.indexOf('z') > -1) || (DateString.indexOf('Z') > -1)) ? DateString.slice(0, -1) : DateString;
      let [weekday, month, date, year] = new Date(finalDate).toDateString().split(" ");
      [month, date] = [date, month];
      return `${weekday}, ${month} ${date} ${year}`;
    }
    return "";
  }

  showDatepickerPopup(isReturnCase: boolean) {
    let StartValidity = null;
    let EndValidity = null;
    if (isReturnCase) {
      StartValidity = this.searchSimilarResponseReturn.StartValidity;
      EndValidity = this.searchSimilarResponseReturn.EndValidity;
    } else {
      StartValidity = this.searchSimilarResponse.StartValidity;
      EndValidity = this.searchSimilarResponse.EndValidity;
    }
    let dialogRef = this.dialog.open(DatePickerPopupAmendSeatComponent, {
      disableClose: false,
      panelClass: 'datepicker-info',
      data: {
        DepartureTimesStart: moment.utc(StartValidity).toISOString(),
        ReturnTimesStart: '',
        TraveltypeReturn: '',
        Traveltype: `DEPARTAFTER`,
        IsOpenReturn: false,
        isOutwardLeg: true,
        StartValidity: StartValidity,
        EndValidity: EndValidity,
        isReturnJourney: isReturnCase
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let dt = moment.utc(this.convertDateTime(result.travelDate, result.travelTime)).tz('Europe/London').toDate();
        this.reserveSeatRequest.IsDateChange = true;
        this.reserveSeatRequest.IsDatePickerDate = true;
        this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
        if (result.isReturnCase) {
          this.reserveSeatRequest.IsOutWard = false;
          this.dataSourceReturn = null;
          this.expandedElementReturn = null;
          this.reserveSeatRequest.retChangeDate = dt;
        } else {
          this.dataSource = null;
          this.expandedElement = null;
          if (this.reserveSeatRequest.IsOutWard)
            this.reserveSeatRequest.ChangeDate = dt;
          else
            this.reserveSeatRequest.retChangeDate = dt;
        }
        this.reserveSeatRequest.ReopenTravelCache = this.searchSimilarResponse.ReopenTravelCache;
        this.callChangeDate(result.isReturnCase, false);
      }
    });
  }

  convertDateTime(queryDate: any, queryTime: any) {
    let actualTime = queryTime.split(':');
    let dateString;
    dateString = moment(queryDate).add(actualTime[0], 'hours').add(actualTime[1], 'minutes').format('YYYY-MM-DDTHH:mm') + 'Z';
    return dateString;
  }

  checkTicketType(isReturnTypeTicket) {
    try {
      if (isReturnTypeTicket) {
        if (this.sharedService.IsPartialReturnTypeTicket) {
          return false;
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }

  callChangeDate(isReturnCase: boolean, isFreshCallToApi: boolean) {
    this.disableContinueBtn = true;
    let isReturnTypeTicket = this.sharedService.IsReturnTypeTicket;
    this.reserveSeatRequest.IsPartialReturnTypeTicket = !!this.sharedService?.IsPartialReturnTypeTicket;
    isReturnTypeTicket = this.checkTicketType(isReturnTypeTicket);
    this.myAccountService.fetchChangeDate(this.reserveSeatRequest, isReturnTypeTicket).subscribe(
      res => {
        this.reserveSeatRequest.IsDatePickerDate = false;
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (isFreshCallToApi) {
              this.searchSimilarResponse = this.responseData.Data;
              this.searchSimilarResponseReturn = this.responseData.Data.retSearchSimilarForDateResponseDto;
              this.bindSearchSimilarData();
              this.bindSearchSimilarDataReturn(this.isReturnJourney);
              this.dayChangeMessage = (this.searchSimilarResponse?.Message || this.searchSimilarResponseReturn?.Message);
            } else {
              this.isNotFreshCallToApi(isReturnCase);
            }
            this.showDayChangeMessagePopup(this.dayChangeMessage);
          }
          else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  isNotFreshCallToApi(isReturnCase: boolean) {
    if (isReturnCase) {
      this.searchSimilarResponseReturn = this.responseData.Data.retSearchSimilarForDateResponseDto;
      this.bindSearchSimilarDataReturn(this.isReturnJourney);
      this.dayChangeMessage = this.searchSimilarResponseReturn.Message;
    } else {
      let datamaintain = null;
      if (this.sharedService.IsPartialReturnTypeTicket)
        datamaintain = this.searchSimilarResponse;
      this.searchSimilarResponse = this.responseData.Data;
      if (this.sharedService.IsPartialReturnTypeTicket && datamaintain) {
        if (this.searchSimilarResponse.IsOutWard) {
          this.searchSimilarResponse.RetTravelSolutionId = datamaintain.RetTravelSolutionId;
          this.searchSimilarResponse.RetReopenTravelCache = datamaintain.RetReopenTravelCache;
          this.searchSimilarResponse.retSearchchSimilarResponseCache = datamaintain.retSearchchSimilarResponseCache;
        }
        else {
          this.searchSimilarResponse.RetTravelSolutionId = datamaintain.RetTravelSolutionId;
          this.searchSimilarResponse.ReopenTravelCache = this.searchSimilarResponse.RetReopenTravelCache;
          this.searchSimilarResponse.SearchchSimilarResponseCache = this.searchSimilarResponse.retSearchchSimilarResponseCache;
          this.searchSimilarResponse.RetReopenTravelCache = datamaintain.RetReopenTravelCache;
          this.searchSimilarResponse.retSearchchSimilarResponseCache = datamaintain.retSearchchSimilarResponseCache;
        }
      }
      this.bindSearchSimilarData();
      this.dayChangeMessage = this.searchSimilarResponse.Message;
    }
  }

  showDayChangeMessagePopup(msg: string) {
    if (msg && msg.length > 0) {
      let dialogRef = this.dialog.open(InfoPopupComponent, {
        width: '500px',
        disableClose: false,
        data: {
          Message: msg
        }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.router.navigate(["./" + this.appRouteEnum.ViewBooking]);
      });
    }

  }

  onClickGetEarlierSearch(isReturnCase: boolean) {
    if (isReturnCase) {
      this.dataSourceReturn = null;
      this.expandedElementReturn = null;
      this.reserveSeatRequest.IsOutWard = false;
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto = this.searchSimilarResponseReturn.NewSearchEarlierLaterRequestDto;
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto.SearchType = "EARLIER";
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto.SearchchSimilarResponseCache = this.searchSimilarResponseReturn.retSearchchSimilarResponseCache;
      if (this.searchSimilarResponseReturn.IsDateChangeEL) {
        this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto = null;
        this.reserveSeatRequest.retChangeDate = moment.utc(this.searchSimilarResponseReturn.Date).tz('Europe/London').toDate();
      }
    } else {
      this.dataSource = null;
      this.expandedElement = null;
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto = null;
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = this.searchSimilarResponse.NewSearchEarlierLaterRequestDto;
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto.SearchType = "EARLIER";
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto.SearchchSimilarResponseCache = this.searchSimilarResponse.SearchchSimilarResponseCache;
      if (this.searchSimilarResponse.IsDateChangeEL) {
        this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
        this.reserveSeatRequest.ChangeDate = moment.utc(this.searchSimilarResponse.Date).tz('Europe/London').toDate();
      }
    }
    this.callChangeDate(isReturnCase, false);
  }

  onClickGetLaterSearch(isReturnCase: boolean) {
    if (isReturnCase) {
      this.dataSourceReturn = null;
      this.expandedElementReturn = null;
      this.reserveSeatRequest.IsOutWard = false;
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto = this.searchSimilarResponseReturn.NewSearchEarlierLaterRequestDto;
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto.SearchType = "LATER";
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto.SearchchSimilarResponseCache = this.searchSimilarResponseReturn.retSearchchSimilarResponseCache;
      if (this.searchSimilarResponseReturn.IsDateChangeEL) {
        this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto = null;
        this.reserveSeatRequest.retChangeDate = moment.utc(this.searchSimilarResponseReturn.Date).tz('Europe/London').toDate();
      }
    } else {
      this.dataSource = null;
      this.expandedElement = null;
      this.reserveSeatRequest.retNewSearchEarlierLaterRequestDto = null;
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = this.searchSimilarResponse.NewSearchEarlierLaterRequestDto;
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto.SearchType = "LATER";
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto.SearchchSimilarResponseCache = this.searchSimilarResponse.SearchchSimilarResponseCache;
      if (this.searchSimilarResponse.IsDateChangeEL) {
        this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
        this.reserveSeatRequest.ChangeDate = moment.utc(this.searchSimilarResponse.Date).tz('Europe/London').toDate();
      }
    }
    this.callChangeDate(isReturnCase, false);
  }
  checkPastTime(selectedDate, timeSelected) {
    let date = moment(new Date()).format('YYYY-MM-DD');
    selectedDate = moment(selectedDate).format('YYYY-MM-DD');
    if (selectedDate <= date) {
      if (timeSelected != "" && timeSelected != undefined) {
        let selectedTime = timeSelected;
        let time = selectedTime.split(':');
        let requestedTime = moment.utc(new Date()).tz('Europe/London').format("HH:mm:ss");
        let tempTime = requestedTime.split(':');
        if ((parseInt(time[0]) < parseInt(tempTime[0]))) {
          return true;
        }
        else if ((parseInt(time[0]) == parseInt(tempTime[0]))) {
          if ((parseInt(time[1]) < parseInt(tempTime[1]))) {
            return true;
          }
        }
      }
    }
    else {
      return false;
    }
  }

  returntimeValidator(outwardDate, outwardTime, selectedDate, returnTime, isCheckOutward) {
    if (isCheckOutward) {
      outwardDate = moment(outwardDate).format('YYYY-MM-DD');
      let dateArr = selectedDate.split('/');
      let temp = dateArr[0];
      dateArr[0] = dateArr[2];
      dateArr[2] = temp;
      selectedDate = dateArr.join('-');
    }
    else {
      selectedDate = moment(selectedDate).format('YYYY-MM-DD');
      let dateArr = outwardDate.split('/');
      let temp = dateArr[0];
      dateArr[0] = dateArr[2];
      dateArr[2] = temp;
      outwardDate = dateArr.join('-');
    }
    if (selectedDate < outwardDate) {
      return true;
    }
    else if (selectedDate == outwardDate) {
      if (returnTime != "" && returnTime != undefined) {
        let selectedTime = returnTime;
        let time = selectedTime.split(':');
        let selectedTimeOutward = outwardTime;
        let timeOutward = selectedTimeOutward.split(':');
        if ((parseInt(time[0]) < parseInt(timeOutward[0]))) {
          return true;
        }
        else if ((parseInt(time[0]) == parseInt(timeOutward[0]))) {
          if ((parseInt(time[1]) <= parseInt(timeOutward[1]))) {
            return true;
          }
        }

      }
    }
    return false;
  }

  ticketInfo(ticketType: string, fare: FareModel) {
    let ticketTypeCode = fare.TicketTypeCode;
    this.dialog.open(TicketInfoComponent, {
      disableClose: false,
      panelClass: 'ticket-info',
      data: {
        TicketType: ticketType.trim(),
        fare: fare,
        ticketTypeCode: ticketTypeCode
      }
    });
  }

  goBack() {
    this.router.navigate(["./" + this.appRouteEnum.ViewBooking]);
  }

  callEvaluate() {
    this.evaluateRequest = this.createEvaluateRequest();
    let isReturnTypeTicket = this.sharedService.IsReturnTypeTicket;
    if (!isReturnTypeTicket) {
      this.callEvaluateFetchAmendEvaluate();
     
    } else {
      this.callEvaluateIsReturnTypeTicket();
      // make call for review buy data
    }
  }

  callEvaluateFetchAmendEvaluate(){
    this.searchSolutionService.fetchAmendEvaluate(this.evaluateRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.seatPickerResponse = this.responseData.Data;
            if (this.seatPickerResponse.IsNonAvanti) {
              this.callEvaluateIfIsNonAvanti();
            } else {
              this.callEvaluateIfIsAvanti();
            }
          }
          else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  callEvaluateIfIsNonAvanti() {
    let prepareOrderAmendResponse = this.seatPickerResponse.PrepareOrderResponse;
    if (prepareOrderAmendResponse.IsSuccess) {
      this.storageDataService.setSessionStorageData('AmendReserveResponse', prepareOrderAmendResponse, true);
      this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isAmend: true } });
    }
  }

  callEvaluateIfIsAvanti() {
    if (this.seatPickerResponse.IsSuccess) {
      this.sharedService.isFromAmendReservation = true;
      this.sharedService.seatPickerResponseAmend = this.seatPickerResponse;
      this.seatPickerPopup(this.sharedService.journey, this.selectedAmendLeg, this.reserveSeatRequest.IsOutWard);
    } else {
      this.handleSeatPickerErrorMessageResponse();
    }
  }

  callEvaluateIsReturnTypeTicket() {
    this.searchSolutionService.fetchAmendEvaluateReturn(this.evaluateRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            let amendReviewBuyData: CojReviewBuyResponse = this.responseData.Data;
            this.handleAmendReviewBuyDataSuccessResponse(amendReviewBuyData);
          }
          else {
            this.notificationService.warn(this.responseData.ResponseMessage);

          }
        }
      });
  }

  createEvaluateRequest() {
    let evaluateRequest = new EvaluateRequestDto();
    if (this.sharedService.IsPartialReturnTypeTicket) {
      evaluateRequest.Departure = this.searchSimilarResponse.SearchRequestDto.DepartureLocationName;
      evaluateRequest.Arrival = this.searchSimilarResponse.SearchRequestDto.ArrivalLocationName;
      evaluateRequest.DepartureLocation = this.searchSimilarResponse.SearchRequestDto.DepartureLocation;
      evaluateRequest.ArrivalLocation = this.searchSimilarResponse.SearchRequestDto.ArrivalLocation;
      evaluateRequest.IsPartialReturnTypeTicket = this.sharedService.IsPartialReturnTypeTicket;
      evaluateRequest.IsOutward = this.reserveSeatRequest.IsOutWard;
      evaluateRequest.TravelId = this.reserveSeatRequest.TravelId;
      evaluateRequest.TravelSolutionId = this.reserveSeatRequest.TravelSolutionId;
      if (this.reserveSeatRequest.IsOutWard) {
        evaluateRequest.ReopenTravelResponseCache = this.searchSimilarResponse.ReopenTravelCache;
        evaluateRequest.SearchchSimilarResponseCache = this.searchSimilarResponse.SearchchSimilarResponseCache;
        evaluateRequest.IsReturnTicketType = this.sharedService.IsReturnTypeTicket;
        evaluateRequest.OutwardTravelSolId = this.expandedElement.TravelSolId;
        evaluateRequest.ReturnTravelSolId = this.searchSimilarResponse.RetTravelSolutionId;
        evaluateRequest.returnOfferId = this.searchSimilarResponse.ReturnOfferId;
        evaluateRequest.outwardOfferId = this.searchSimilarResponse.OutwardOfferId;
        evaluateRequest.returnCatlogServiceId = this.searchSimilarResponse.ReturnCatlogServiceId;
        evaluateRequest.outwardCatlogServiceId = this.searchSimilarResponse.OutwardCatlogServiceId;
        evaluateRequest.ReturnSearchchSimilarResponseCache = this.searchSimilarResponse.retSearchchSimilarResponseCache;
        evaluateRequest.ReturnTravelSolutionCache = this.searchSimilarResponse.RetReopenTravelCache;
      }
      else {
        evaluateRequest.ReopenTravelResponseCache = this.searchSimilarResponse.ReopenTravelCache;
        evaluateRequest.SearchchSimilarResponseCache = this.searchSimilarResponse.SearchchSimilarResponseCache;
        evaluateRequest.IsReturnTicketType = this.sharedService.IsReturnTypeTicket;
        evaluateRequest.OutwardTravelSolId = this.searchSimilarResponse.RetTravelSolutionId;
        evaluateRequest.ReturnTravelSolId = this.expandedElement.TravelSolId;
        evaluateRequest.returnOfferId = this.searchSimilarResponse.OutwardOfferId;
        evaluateRequest.outwardOfferId = this.searchSimilarResponse.ReturnOfferId;
        evaluateRequest.returnCatlogServiceId = this.searchSimilarResponse.OutwardCatlogServiceId;
        evaluateRequest.outwardCatlogServiceId = this.searchSimilarResponse.ReturnCatlogServiceId;
        evaluateRequest.ReturnSearchchSimilarResponseCache = this.searchSimilarResponse.retSearchchSimilarResponseCache;
        evaluateRequest.ReturnTravelSolutionCache = this.searchSimilarResponse.RetReopenTravelCache;
      }
    }
    else {
      evaluateRequest.Departure = this.searchSimilarResponse.SearchRequestDto.DepartureLocationName;
      evaluateRequest.Arrival = this.searchSimilarResponse.SearchRequestDto.ArrivalLocationName;
      evaluateRequest.DepartureLocation = this.searchSimilarResponse.SearchRequestDto.DepartureLocation;
      evaluateRequest.ArrivalLocation = this.searchSimilarResponse.SearchRequestDto.ArrivalLocation;
      evaluateRequest.ReopenTravelResponseCache = this.searchSimilarResponse.ReopenTravelCache;
      evaluateRequest.SearchchSimilarResponseCache = this.reserveSeatRequest.IsOutWard ? this.searchSimilarResponse.SearchchSimilarResponseCache : this.searchSimilarResponse.retSearchchSimilarResponseCache;
      evaluateRequest.IsOutward = this.isReturnJourney ? true : this.reserveSeatRequest.IsOutWard;
      evaluateRequest.TravelId = this.reserveSeatRequest.TravelId;
      evaluateRequest.TravelSolutionId = this.reserveSeatRequest.TravelSolutionId;
      evaluateRequest.IsReturnTicketType = this.sharedService.IsReturnTypeTicket;
      evaluateRequest.OutwardTravelSolId = this.expandedElement.TravelSolId;
      if (!this.isReturnJourney) {
        evaluateRequest.Operator = this.expandedElement.Operator.toString();
      }

      if (this.isReturnJourney) {
        evaluateRequest.ReturnTravelSolId = this.expandedElementReturn.TravelSolId;
        evaluateRequest.returnOfferId = this.searchSimilarResponse.ReturnOfferId;
        evaluateRequest.outwardOfferId = this.searchSimilarResponse.OutwardOfferId;
        evaluateRequest.returnCatlogServiceId = this.searchSimilarResponse.ReturnCatlogServiceId;
        evaluateRequest.outwardCatlogServiceId = this.searchSimilarResponse.OutwardCatlogServiceId;
        evaluateRequest.SearchchSimilarResponseCache = this.searchSimilarResponse.SearchchSimilarResponseCache;
        evaluateRequest.ReturnSearchchSimilarResponseCache = this.searchSimilarResponseReturn.retSearchchSimilarResponseCache;
        evaluateRequest.ReturnTravelSolutionCache = this.searchSimilarResponseReturn.RetReopenTravelCache;
      }
    }
    return evaluateRequest;
  }

  seatPickerPopup(journey: any, seatInfo: any, isOutWardJourney: boolean) {
    let dialogRef = this.dialog.open(SeatpickerPopupComponent, {
      disableClose: true,
      panelClass: 'seat-picker',
      data: {
        seatInfo: seatInfo,
        journey: journey,
        isOutWardJourney: isOutWardJourney,
        isDateChange: true,
        IsReturnTypeTicket: this.sharedService.IsReturnTypeTicket,
        noOfAdult: this.sharedService.noOfAdultAmend,
        noOfChild: this.sharedService.noOfChildAmend,
      }
    });

     // To prevent page refresh on seat picker popup open added this class on html and body tag
     document.getElementsByTagName('html')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
     document.getElementsByTagName('body')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');

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

      let prepareOrderRequest = this.getPrepareOrderRequest();

      // changes needed for preventing extra calls to fetchDataPostSeatpickerAmend - start
      this.sharedService.reviewBuyCache = null;
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      // changes needed for preventing extra calls to fetchDataPostSeatpickerAmend - end
      this.commonService.loaderRequired = true;
      this.myAccountService.fetchDataPostSeatpickerAmend(prepareOrderRequest).subscribe(
        res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              let prepareOrderAmendResponse = this.responseData.Data;
              if (prepareOrderAmendResponse.IsSuccess) {
                this.storageDataService.setSessionStorageData('AmendReserveResponse', prepareOrderAmendResponse, true);
                this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isAmend: true } });
              }
            }
            else {
              this.notificationService.error(this.responseData.ResponseMessage);
            }
          }
        });
    });

  }
  getPrepareOrderRequest() {
    let request: PrepareOrderRequestDto = new PrepareOrderRequestDto();
    request.Email = localStorage.getItem('Email');
    request.EvaluateCache = this.sharedService.seatPickerResponseAmend.AmendEvaluateCache;
    request.UpdateReservationResponseCache = this.sharedService.reviewBuyCache;
    request.IsOutward = this.reserveSeatRequest.IsOutWard;
    return request;
  }

  onChoosingTicketSolution(travelSolution: TravelSolutionModel) {
    this.expandedElement = travelSolution;
    this.disableContinueBtn = this.checkDisableContinueBtn();
  }

  onChoosingTicketSolutionReturn(travelSolution: TravelSolutionModel) {
    this.expandedElementReturn = travelSolution;
    this.disableContinueBtn = this.checkDisableContinueBtn();
  }
  checkDisableContinueBtn() {
    if (this.isReturnJourney) {
      if (this.isPartialReturnTypeTicket)
        return !this.expandedElement;
      else
        return !(this.expandedElement && this.expandedElementReturn);
    } else {
      return !this.expandedElement;
    }
  }

  onContinueBtn() {
    this.checkTravelDatesValidity();
  }

  setOriginalReserveSeatRequest() {
    this.reserveSeatRequest = this.initialReserveSeatRequest;
    this.sharedService.reserveSeatRequest = this.reserveSeatRequest;
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
  }

  checkTravelDatesValidity() {
    if (this.isReturnJourney && !this.isPartialReturnTypeTicket) {
      let outJourneyDateTimestamp = new Date(this.expandedElement.ArrivalDate).getTime();
      let retJourneyDateTimestamp = new Date(this.expandedElementReturn.DepartureDate).getTime();
      if (retJourneyDateTimestamp > outJourneyDateTimestamp) {
        this.setOriginalReserveSeatRequest();
        this.callEvaluate();
      } else {
        this.notificationService.warn("Return service should not be before departing service.")
      }
    } else {
      this.setOriginalReserveSeatRequest();
      this.callEvaluate();
    }
  }

  handleSeatPickerErrorMessageResponse(){
    if (this.seatPickerResponse.ErrorMessage != null) {
      let respMsg = this.seatPickerResponse.ErrorMessage;
      let newMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service.`;
      let oldMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service. You can buy this ticket without reservations or you can change your service or ticket selection and try again.`;
      let modifiedMsg = respMsg.replace(oldMsg, newMsg);

      this.dialog.open(InfoPopupComponent, {
        width: '500px',
        disableClose: false,
        data: {
          Message: modifiedMsg
        }
      });
    }
  }

  setSharedSiblingDataOnNgOnit(sharedSiblingRefresh){
    if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
      this.sharedService.searchSimilarResponse = sharedSiblingRefresh.searchSimilarResponse;
      this.sharedService.reserveSeatRequest = sharedSiblingRefresh.reserveSeatRequest;
      this.sharedService.journey = sharedSiblingRefresh.journey;
      this.sharedService.selectedAmendLeg = sharedSiblingRefresh.selectedAmendLeg;
      this.sharedService.reserveSeatRequestDate = sharedSiblingRefresh.reserveSeatRequestDate;
      this.sharedService.IsReturnTypeTicket = sharedSiblingRefresh.IsReturnTypeTicket;
      this.sharedService.IsRetReservationAvailable = sharedSiblingRefresh.IsRetReservationAvailable;
      this.sharedService.IsOutReservationAvailable = sharedSiblingRefresh.IsOutReservationAvailable;
      this.sharedService.noOfAdultAmend = sharedSiblingRefresh.noOfAdultAmend;
      this.sharedService.noOfChildAmend = sharedSiblingRefresh.noOfChildAmend;
      this.sharedService.IsPartialReturnTypeTicket = sharedSiblingRefresh.IsPartialReturnTypeTicket;
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.setInitialData();
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
      this.reserveSeatRequest.ChangeDate = this.sharedService.reserveSeatRequestDate;
      this.callChangeDate(null, true);
    }
  }

  handleSearchSimilarResponse(){
    if (this.sharedService.searchSimilarResponse) {
      this.setInitialData();
      this.bindSearchSimilarData();
      this.bindSearchSimilarDataReturn(this.isReturnJourney);
    } else {
      this.setInitialData();
      this.reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
      this.reserveSeatRequest.ChangeDate = this.sharedService.reserveSeatRequestDate;
      this.callChangeDate(null, true);
    }
  }

  handleAmendReviewBuyDataSuccessResponse(amendReviewBuyData){
    if (amendReviewBuyData.IsSuccess) {
      this.sharedService.amendReviewBuyData = amendReviewBuyData;
      this.sharedService.amendReviewBuyEvaluateRequest = this.evaluateRequest;
      this.sharedService.searchSimilarResponse = null;
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data

      this.router.navigate(["./" + this.appRouteEnum.amendReviewBuyPage]);
    } else if (amendReviewBuyData.ErrorMessage != null) {
        this.handleAmendReviewBuyDataErrorMessage(amendReviewBuyData);
    }
  }

  handleAmendReviewBuyDataErrorMessage(amendReviewBuyData){
    let respMsg = amendReviewBuyData.ErrorMessage;
    let newMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service.`;
    let oldMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service. You can buy this ticket without reservations or you can change your service or ticket selection and try again.`;
    let modifiedMsg = respMsg.replace(oldMsg, newMsg);

    this.dialog.open(InfoPopupComponent, {
      width: '500px',
      disableClose: false,
      data: {
        Message: modifiedMsg
      }
    });
  }
}
