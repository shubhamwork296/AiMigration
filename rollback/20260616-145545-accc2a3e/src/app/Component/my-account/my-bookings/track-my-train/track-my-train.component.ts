import { DatePipe } from '@angular/common';
import { Component, Inject, Injector, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { RefreshTrackMyTrainRequest, TrackMyTrain, TrainLiveInfo } from 'src/app/models/account/my-bookings.model';
import { CommonServices } from 'src/app/services/common.service';
import { MyAccountService } from 'src/app/services/my-account.service';
import { LocalStorageKeyEnum, TrackMyTrainEnum } from 'src/app/utility/app-constants.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
const toMilliseconds = (hrs,min,sec) => (hrs*60*60+min*60+sec)*1000;
@Component({
  selector: 'app-track-my-train',
  templateUrl: './track-my-train.component.html',
  styleUrls: ['./track-my-train.component.css']
})

export class TrackMyTrainComponent implements OnInit {
  trainLiveInfo: TrainLiveInfo;
  trackingHeaderTitle: string;
  noOfCoachesAvailable;
  isReadMoreShow: boolean = true;
  timeCounterFunctionId: any;
  isClickedOnShowEarlierOrLaterCallingPoint  = '';
  isFooterAvailable: boolean = false;
  trainLiveStatusIcon: boolean = true;
  lastAPICallTime: string = '';
  currentAPICallingTime: string = '';
  lastUpdatedTimeText : string = '';
  myAccountService: MyAccountService;
  trackMyTrainArrayObject : TrackMyTrain;
  refreshTrackMyTrainRequest :RefreshTrackMyTrainRequest;
  datePipe: DatePipe;
  lastClickTimestamp = 0;
  lastUpdatedTimerId;
  journeyType : string;
  trackMyTrainEnum : TrackMyTrainEnum;
  trackMyTrainInfoIcon : boolean = false;
  ga4dataLayerService: GA4DatalayerService;
  journeyDetail: any;
  isReturnJourney: boolean
  ticketInfo: any;
  localStorageKeyEnum: LocalStorageKeyEnum;
  currentTimeStamp = 0;
  tmtBookingListTime: string = '';
  commonService: CommonServices;
  spinnerService: NgxSpinnerService;
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly injector: Injector) {
    this.myAccountService = this.injector.get(MyAccountService);
    this.datePipe = this.injector.get(DatePipe);
    this.trackMyTrainEnum = this.injector.get(TrackMyTrainEnum);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.commonService = this.injector.get(CommonServices);
    this.spinnerService = this.injector.get(NgxSpinnerService);
   }
  ngOnInit(): void {
    if(this.data.trackMyTrain){
      this.trainLiveInfo = this.data.trainLiveInfo;
      this.trackMyTrainArrayObject = this.data.trackMyTrain;
      this.journeyDetail =  this.data.journeyDetail;
      this.isReturnJourney = this.data.isReturnJourney;
      this.ticketInfo = this.data.ticketInfo;
      this.setTrainDynamicInfo();      
      this.tmtBookingListTime =  this.data.lastUpdatedTrackMyTrainTime;
      this.lastAPICallTime = this.getCurrentTime();
      if(this.lastAPICallTime){
        this.calculateTimeDifference(this.tmtBookingListTime, this.lastAPICallTime);
        if(this.lastUpdatedTimeText != 'now'){
          const valueStart = this.lastAPICallTime.split(':');
          const valueEnd = this.tmtBookingListTime.split(':');
          this.lastClickTimestamp = toMilliseconds(+valueEnd[0], +valueEnd[1], +valueEnd[2]);
          this.currentTimeStamp = toMilliseconds(+valueStart[0], +valueStart[1], +valueStart[2]);
          this.callAPIIfIntervalAchieved(false);
        }else{
          this.lastClickTimestamp = toMilliseconds(+this.lastAPICallTime.split(':')[0], +this.lastAPICallTime.split(':')[1], +this.lastAPICallTime.split(':')[2])
          this.lastUpdatedTimerId = setInterval(() => {
            this.calculateTimeDifference(this.lastAPICallTime, this.getCurrentTime());
          }, 100);
        }
      }
      this.journeyType = this.data.journetType;
      if (window.screen.width <= 767) {
        localStorage.setItem(this.localStorageKeyEnum.tmtBookingIdForPullDown, this.journeyDetail.BookingId);
        localStorage.setItem(this.localStorageKeyEnum.tmtIsReturnJourneyForPullDown, this.isReturnJourney.toString()); 
      }
    }
  }
  setTrainDynamicInfo() {
    this.data.trainLiveInfo?.TrainLegList?.forEach(element => {
      let journeyOriginIndex = element.CallingPointList.findIndex(e => e.IsJourneyOriginStation);
      let journeyDestinationIndex = element.CallingPointList.findIndex(e => e.IsJourneyDestinationStation);
      element['showEarlierCallingPointBtnTxt'] = 'Show earlier calling points';
      element['showLaterCallingPointBtnTxt'] = 'Show later calling points';
      element.CallingPointList.forEach((data, index) => {
        data['isEarlierStation'] = journeyOriginIndex > index;
        data['isLaterStation'] = journeyDestinationIndex < index;
      });
    });
    if(this.data?.trackMyTrain?.ErrorMsgHeading && this.data?.trackMyTrain?.ErrorMsgText){
      this.isFooterAvailable = true;
      this.trainLiveStatusIcon = false;
      this.trackMyTrainInfoIcon = true;
      this.trackingHeaderTitle = this.data?.trackMyTrain?.ErrorMsgHeading;
    }else {
      this.isFooterAvailable = false;
      this.trainLiveStatusIcon = true;
      this.trackMyTrainInfoIcon = false;
      this.trackingHeaderTitle = `${this.data?.trainLiveInfo?.OriginStationName} to ${this.data?.trainLiveInfo?.DestinationStationName}`;
    }
  }
  displayTextIfFirstClassAvailable(isfirstClass : boolean) {
    return isfirstClass ? this.trackMyTrainEnum.trainCoachTypeText : "";
  }
  setCoachColour(seatLevel : any) {
    if(seatLevel == this.trackMyTrainEnum.someSeatLevelText){
      return this.trackMyTrainEnum.someSeatsCoachColor;
    }else if(seatLevel == this.trackMyTrainEnum.manySeatLevelText){
      return this.trackMyTrainEnum.manySeatsCoachColor;
    }else if(seatLevel == this.trackMyTrainEnum.noSeatLevelText) {
      return this.trackMyTrainEnum.noSeatsCoachColor;
    }else {
      return this.trackMyTrainEnum.noCoachAvailable;
    }
  }
  showReadMoreAndLessPara() {
    if(this.isReadMoreShow){
      this.ga4dataLayerService.loadGA4LayerForTrackMyTrainReadMoreClick(this.trackMyTrainArrayObject,  this.journeyDetail, this.ticketInfo, this.isReturnJourney);
    }else {
      this.ga4dataLayerService.loadGA4LayerForTrackMyTrainReadLessClick(this.trackMyTrainArrayObject,  this.journeyDetail, this.ticketInfo, this.isReturnJourney);
    }
    this.isReadMoreShow = !this.isReadMoreShow;
  }
  showNextTrainTimeInMinutes(nextTrainInminutes) {
    let hours   = Math.floor(nextTrainInminutes / 60);
    let minutes : any = Math.floor((nextTrainInminutes - ((hours * 3600)) / 60));
    let seconds : any = Math.floor((nextTrainInminutes * 60) - (hours * 3600) - (minutes * 60));
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+' mins : '+seconds+' secs';
  }
  addSecondLastClass(trainLegCallingPoint: any) {
    let secondLastIndexOfJourneyDestination = trainLegCallingPoint.findIndex(e => e.IsJourneyDestinationStation);
    secondLastIndexOfJourneyDestination = secondLastIndexOfJourneyDestination - 1;
    return secondLastIndexOfJourneyDestination;
  }
  addClassBeforeJourneyOriginStation(trainLegCallingPoint: any, currentStationIndex){
    let trainOriginIndex = trainLegCallingPoint.findIndex(e => e.IsTrainOrigin);
    let journeyOriginIndex = trainLegCallingPoint.findIndex(e => e.IsJourneyOriginStation);
    return (currentStationIndex > trainOriginIndex && currentStationIndex < journeyOriginIndex) ? true : false
  }
  showEarlierAndLaterCallingPoints(eventClicked) {
    if(this.isClickedOnShowEarlierOrLaterCallingPoint == ''){
      this.isClickedOnShowEarlierOrLaterCallingPoint = eventClicked;
    }else {
      this.isClickedOnShowEarlierOrLaterCallingPoint = '';
    }
  }
  showEarlierStation(trainLegIndex){
    this.data?.trainLiveInfo?.TrainLegList?.forEach((element,index) => {
      if(index == trainLegIndex){
        element.showEarlierCallingPointBtnTxt = element.showEarlierCallingPointBtnTxt.includes('Show') ? 'Hide earlier calling points' : 'Show earlier calling points';
        let journeyOriginIndex = element.CallingPointList.findIndex(e => e.IsJourneyOriginStation);
        element.CallingPointList.forEach((data, index) => {
          if(journeyOriginIndex > index){
            data.isEarlierStation = !data.isEarlierStation;
          }
        });
      }
    });
  }
  showLaterStation(trainLegIndex){
    this.data?.trainLiveInfo?.TrainLegList?.forEach((element,index) => {
      if(index == trainLegIndex){
        element.showLaterCallingPointBtnTxt = element.showLaterCallingPointBtnTxt.includes('Show') ? 'Hide later calling points' : 'Show later calling points';
        let journeyDestinationIndex = element.CallingPointList.findIndex(e => e.IsJourneyDestinationStation);
        element.CallingPointList.forEach((data, index) => {
          if(journeyDestinationIndex < index){
            data.isLaterStation = !data.isLaterStation;
          }
        });
      }
    })
  }
  addDynamicNonMiddleBottomClass(isJourneyDestinationStation, isTrainDestination, callingPointList, currentIndex) {
    let lastJourneyStationIndex = callingPointList.findIndex(e => e.IsJourneyDestinationStation);
    if(!isJourneyDestinationStation && isTrainDestination){
      return true;
    }
    if (lastJourneyStationIndex < currentIndex) {
      return true;
    }
  }
  checkToHideEarlierStation(trainLegCallingPoint: any) {
    let journeyOriginIndex;
    if(this.isClickedOnShowEarlierOrLaterCallingPoint == ''){
      journeyOriginIndex = trainLegCallingPoint.findIndex(e => e.IsJourneyOriginStation);
    } 
    return journeyOriginIndex;
  }
  checkToHideLaterStation(trainLegCallingPoint: any) {
    let journeyDestinationStationIndex;
    if(this.isClickedOnShowEarlierOrLaterCallingPoint == ''){
      journeyDestinationStationIndex = trainLegCallingPoint.findIndex(e => e.IsJourneyDestinationStation);
    }
    return journeyDestinationStationIndex;
  }
  callAPIIfIntervalAchieved(isButtonClicked) {
    let currentTime = this.getCurrentTime();
    this.currentTimeStamp = isButtonClicked ? toMilliseconds(+currentTime.split(':')[0], +currentTime.split(':')[1], +currentTime.split(':')[2]) : this.currentTimeStamp; 
    if(this.currentTimeStamp - this.lastClickTimestamp > 60000){
      this.lastClickTimestamp = this.currentTimeStamp;
      this.callAPIForLastUpdatedTrackMyTrainInfo();
      this.currentTimeStamp = 0;
    }
  }
  callAPIForLastUpdatedTrackMyTrainInfo() {
    this.currentAPICallingTime = this.getCurrentTime();
    this.refreshTrackMyTrainRequest = new RefreshTrackMyTrainRequest();
    this.refreshTrackMyTrainRequest.LastUpdatedTime = this.currentAPICallingTime;
    this.refreshTrackMyTrainRequest.TrackMyJourneyInfoList = this.trackMyTrainArrayObject.TrackMyJourneyInfoList;
    this.getUpdatedTrainInfo(this.refreshTrackMyTrainRequest);
  }
  getCurrentTime() {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let seconds = now.getSeconds();
    return hour + ":" + minute + ":" + seconds;
  }
  getUpdatedTrainInfo(refreshTrackMyTrainRequest : RefreshTrackMyTrainRequest){
    this.myAccountService.getTrackMyTrainInfo(refreshTrackMyTrainRequest).subscribe((res : any)=> {
      if(res){
        
        let currentTimeStamp = this.getCurrentTime();
        if(this.lastUpdatedTimerId){
          clearInterval(this.lastUpdatedTimerId);
        }
        this.trackMyTrainArrayObject = res.Data;
        this.trackMyTrainArrayObject.LastUpdatedTime = currentTimeStamp;
        this.data.trackMyTrain = Object.assign({}, this.trackMyTrainArrayObject);
        this.data.trainLiveInfo = Object.assign({},this.trackMyTrainArrayObject.TrainLiveInfo);
        this.trainLiveInfo = this.data.trainLiveInfo;
        this.lastAPICallTime = currentTimeStamp;
        this.lastClickTimestamp = toMilliseconds(+currentTimeStamp.split(':')[0], +currentTimeStamp.split(':')[1], +currentTimeStamp.split(':')[2]);
        this.updateJourneyPlatformNo();
        this.updateTmtDataInBookingList();
        this.lastUpdatedTimerId = setInterval(() => {
          this.calculateTimeDifference(this.lastAPICallTime, this.getCurrentTime());
        }, 100);
        
        this.setTrainDynamicInfo();
      }
    },(err) => {
      console.log(err);
    })
  }


  calculateTimeDifference(lastTime, currentTime) {
    if(currentTime == ''){
      currentTime = lastTime;
    }
    const timeStart = new Date()
    const timeEnd = new Date()
    const valueStart = lastTime.split(':')
    const valueEnd = currentTime.split(':')
    timeStart.setHours(+valueStart[0], +valueStart[1], +valueStart[2], 0)
    timeEnd.setHours(+valueEnd[0], +valueEnd[1], +valueEnd[2], 0)
    const difference = timeEnd.getTime() - timeStart.getTime();
    let diffInMinutes = this.millisToMinutes(Math.abs(difference));
    if(diffInMinutes <= 15 && diffInMinutes != 0){
      this.lastUpdatedTimeText = diffInMinutes == 1 ? `${diffInMinutes} minute ago` : `${diffInMinutes} minutes ago`;
    } else if(diffInMinutes > 15){
      let amPmFormat = parseInt(valueStart[0]) >= 12 ? this.trackMyTrainEnum.nightTimeRepresentationText : this.trackMyTrainEnum.dayTimeRepresentationText;
      let hour = valueStart[0] ? valueStart[0] : 12;
      let minutes = valueStart[1] < 10 ? '0' + valueStart[1] : valueStart[1];
      this.lastUpdatedTimeText = hour + ':' + minutes + amPmFormat;
    } else {
      this.lastUpdatedTimeText = "now";
    }
  }
  millisToMinutesAndSeconds(millis) {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (parseInt(seconds) < 10 ? '0' : '') + seconds;
  }
  millisToMinutes(millis){
    let minutes = Math.floor(millis / 60000);
    return minutes;
  }
  ngOnDestroy() {
    if(this.lastUpdatedTimerId){
      clearInterval(this.lastUpdatedTimerId);
    }
  }

  updateTmtDataInBookingList(){
    let finalEmitTimeToRefreshAPI = this.currentAPICallingTime ? this.currentAPICallingTime : this.lastAPICallTime;
    let trackMyTrainDataObject = {
      finalEmitTimeToRefreshAPI: finalEmitTimeToRefreshAPI,
      trackMyTrain: this.trackMyTrainArrayObject,
      journeyType: this.journeyType
    }
    this.myAccountService.trackMyTrainLastUpdatedTimeSubject.next(trackMyTrainDataObject);
  }

  hideWorkingTimeInCaseOfDelayJourney(callingPoint: any){
    if(callingPoint.IsDelayed){
      if(callingPoint.IsJourneyDestinationStation || callingPoint.IsJourneyOriginStation){
        return false;
      }
    }
    return true;
  }

  filterSeatReservationLevelByTrainId(trainId){
    return this.data?.trainLiveInfo?.SeatReservationLevelList?.filter(m => m.TrainId == trainId);
  }

  filterAvailableCoachesLength(seatReservation){
    return seatReservation?.CoachInfoList?.length;
  }

  cssForLiveLocation(callingPoint, callingPointList, currentCallingPointIndex){
    let firstCssDigitForLiveLocation = 6; //6 because css starts like this -> tmt-mt-6
    let secondLastStationCssDigit = 10; //10 because css starts like this -> tmt-mt-10
    let cssName='';
    if(callingPoint.LiveLocationIndex > 0){
      let indexOfLiveLocationCss;
      if((callingPointList.length == 2 && currentCallingPointIndex == 0) || (this.addSecondLastClass(callingPointList) == currentCallingPointIndex && callingPointList.length > 2)){
        indexOfLiveLocationCss = secondLastStationCssDigit * callingPoint.LiveLocationIndex;
      }else{
        indexOfLiveLocationCss = firstCssDigitForLiveLocation * callingPoint.LiveLocationIndex;
      }
      cssName = `tmt-mt-${indexOfLiveLocationCss}`;
    }
    return cssName;
  }

  updateJourneyPlatformNo(){
    try {
      if(JSON.parse(localStorage.getItem(this.localStorageKeyEnum.platformNoInfoOfCustomerBookingResponse))){
        let platformNoTmtArrayOjbect = JSON.parse(localStorage.getItem(this.localStorageKeyEnum.platformNoInfoOfCustomerBookingResponse));
        platformNoTmtArrayOjbect?.forEach(e=>{
          if(e?.BookingId === this.journeyDetail?.BookingId){
            if(this.trackMyTrainArrayObject?.TrainLiveStatus && e?.OutwardTicketInfo){
                if(this.trackMyTrainArrayObject?.TrainLiveStatus?.IsPlatformSuppress && !e?.OutwardTicketInfo?.IsPlatformSuppress && e?.OutwardTicketInfo?.PlateformNo.toLowerCase() !== 'not ready'){
                  this.trackMyTrainArrayObject.TrainLiveStatus.PlateformNo = e?.OutwardTicketInfo?.PlateformNo;
                  this.trackMyTrainArrayObject.TrainLiveStatus.IsPlatformSuppress = e?.OutwardTicketInfo?.IsPlatformSuppress;
                  this.data.trainLiveInfo.TrainLegList[0].CallingPointList.forEach(callingPoint=>{
                    if(callingPoint.IsJourneyOriginStation){
                      callingPoint.PlateFormNo = e?.OutwardTicketInfo?.PlateformNo;
                      callingPoint.IsPlatformSuppress = e?.OutwardTicketInfo?.IsPlatformSuppress;
                    }
                  }); 
                }
            }
            if(this.trackMyTrainArrayObject?.TrainLiveStatus && e?.ReturnTicketInfo){
              if(this.trackMyTrainArrayObject?.TrainLiveStatus?.IsPlatformSuppress && !e?.OutwardTicketInfo?.IsPlatformSuppress && e?.ReturnTicketInfo?.PlateformNo.toLowerCase() !== 'not ready'){
                this.trackMyTrainArrayObject.TrainLiveStatus.PlateformNo = e?.ReturnTicketInfo?.PlateformNo;
                this.trackMyTrainArrayObject.TrainLiveStatus.IsPlatformSuppress = e?.ReturnTicketInfo?.IsPlatformSuppress;
                this.data.trainLiveInfo.TrainLegList[0].CallingPointList.forEach(callingPoint=>{
                  if(callingPoint.IsJourneyOriginStation){
                    callingPoint.PlateFormNo = e?.ReturnTicketInfo?.PlateformNo;
                    callingPoint.IsPlatformSuppress = e?.ReturnTicketInfo?.IsPlatformSuppress;
                  }
                });
              }
            }
          }
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
        let dataObject = {};
        if(!this.isReturnJourney && this.checkIsPlatformSuppressInCaseOfOutwardJourney(this.trackMyTrainArrayObject)){
            dataObject['OutwardTicketInfo'] = {};
            dataObject['OutwardTicketInfo']['PlateformNo'] = this.trackMyTrainArrayObject?.TrainLiveStatus?.PlateformNo;
            dataObject['OutwardTicketInfo']['IsPlatformSuppress'] = this.trackMyTrainArrayObject?.TrainLiveStatus?.IsPlatformSuppress;
        }
        if(this.isReturnJourney && this.checkIsPlatformSuppressInCaseOfReturnJourney(this.trackMyTrainArrayObject)){
            dataObject['ReturnTicketInfo'] = {};
            dataObject['ReturnTicketInfo']['PlateformNo'] = this.trackMyTrainArrayObject?.TrainLiveStatus?.PlateformNo;
            dataObject['ReturnTicketInfo']['IsPlatformSuppress'] = this.trackMyTrainArrayObject?.TrainLiveStatus?.IsPlatformSuppress;
        }
        if(Object.keys(dataObject).length > 0){
            dataObject['BookingId'] = this.journeyDetail?.BookingId;
            customerJourneyPlaftormNoArrayObjectTmt.push(dataObject);
        }    
        return customerJourneyPlaftormNoArrayObjectTmt;
      } catch (error) {
        console.log(error);
      }
    }

    checkIsPlatformSuppressInCaseOfOutwardJourney(journey){
      return journey?.TrainLiveStatus && journey?.TrainLiveStatus?.IsPlatformSuppress !== null && !journey?.TrainLiveStatus?.IsPlatformSuppress;
    }

    checkIsPlatformSuppressInCaseOfReturnJourney(journey){
        return journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus && journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress !== null && !journey?.ReturnTicketInfo?.TrackMyTrain?.TrainLiveStatus?.IsPlatformSuppress;
    }
}