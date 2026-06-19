import { Component, EventEmitter, HostListener, Injector, Input, OnDestroy, OnInit, Output, Renderer2, ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { EnhancedSearchJourneyStationDialogs } from "../enhanced-dialogs/enhanced-search-journey-station-dialogs/enhanced-search-journey-station-dialogs.component";
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { SharedService } from "src/app/services/shared-sibling.service";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { EnhancedRailCardModel, EnhancedRailcardStationMasterData, EnhancedRailCardStationModel } from "src/app/models/enhanced-mixing-deck/enhanced-railcard.model";
import * as moment from "moment";
import { LocationMasterData } from "src/app/models/master/location-master.model";
import { ResponseData } from "src/app/models/common/response.model";
import { CommonServices } from "src/app/services/common.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import { passengerCountValidator } from "src/app/utility/custom-validations/Passenger-count-validation";
import { NgxSpinnerService } from "ngx-spinner";
import { NotificationService } from "src/app/utility/toastr-notification/toastr-notification.service";
import { Router } from "@angular/router";
import { AppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedPathConstraintTypeEnum, EnhancedSearchTypeEnum, EnhancedTravelSolutionTypesEnum, EnhancedTravelTypeEnum } from "src/app/utility/app-constants.service";
import { EnhancedAddRailcardDialogs } from "../enhanced-dialogs/enhanced-add-railcard-dialogs/enhanced-add-railcard-dialogs.component";
import { EnhancedDatepickerPopupComponent } from "../enhanced-dialogs/enhanced-datepicker-popup-dialogs/enhanced-datepicker-popup-dialogs.component";
import { adultValidator } from "src/app/utility/custom-validations/adult-validation";
import { childValidator } from "src/app/utility/custom-validations/child-validation";
import { railcardPerPassengerValidator } from "src/app/utility/custom-validations/passenger-railcard-validation";
import { adultChildSetters } from "src/app/utility/custom-validations/adult-child- count";
import { BehaviorSubject, Subscription } from "rxjs";
import { EnhancedRxjsSubjectsCommonService } from "src/app/services/enhanced-rxjs-subject.service";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { MonetateService } from "src/app/utility/monetate/monetate.service";

@Component({
    selector: 'app-enhanced-edit-qtt',
    templateUrl: './enhanced-edit-qtt.component.html',
    styleUrls: ['./enhanced-edit-qtt.component.css'],
    encapsulation: ViewEncapsulation.ShadowDom,
    standalone: false
})
export class EnhancedEditQTTComponent implements OnInit, OnDestroy {
  @Output("submitEdit") submitEdit: EventEmitter<any> = new EventEmitter();
  qttForm: FormGroup;
  sharedService: SharedService;
  continueDisabledWarnMsg: boolean = false;
  amendSearchRequest: EnhancedSearchRequestModel;
  railcardStationData: EnhancedRailcardStationMasterData;
  railCards: EnhancedRailCardStationModel[];
  TraveltypeReturn: string;
  ReturnTimesStart: string;
  DepartureTimesStart: string;
  Traveltype: string;
  IsOpenReturn: boolean;
  DepartureLocation: number;
  ArrivalLocation: number;
  DepartureLocationName: string;
  ArrivalLocationName: string;
  PathConstraintLocation: number;
  PathConstraintLocationBackUp: number;
  railcardBackup: EnhancedRailCardModel[];
  totalRaicardCount: number = 0;
  adult: number;
  child: number;
  isAmendFresh: boolean;
  returnTravelType: string;
  count = 0;
  count2 = 0;
  adultsForRailcards: number = 0;
  childsForRailcards: number = 0;
  adultForRailcardCount: number;
  childForRailcardCount: number;
  isOperatorFilterChoosed: boolean;
  isChangeFilterChoosed: boolean;
  prepopulatedTime: any;
  prepopulatedDate: any;
  prepopulatedTimeReturn: any;
  prepopulatedDateReturn: any;
  formbuilder: FormBuilder;
  railcards: FormArray;
  locations: LocationMasterData[];
  railcardForm: FormGroup;
  responseData: ResponseData;
  commonServices: CommonServices;
  storageDataService: StorageDataService;
  isPluralAdult: boolean = false;
  isPluralChild: boolean = false;
  showPathConstraint: boolean = false;
  adultChildVisible: boolean = false;
  showRemove: boolean = false;
  isRailcardSelected: boolean = false;
  isRailcardCountSelected: boolean = false;
  isAdultRailcardSelected: boolean = false;
  isChildRailcardSelected: boolean = false;
  isRailcardsCountErrorFree: boolean = false;
  isRailcardsAdultErrorFree: boolean = false;
  isRailcardsChildErrorFree: boolean = false;
  railcardCompleted: boolean = false;
  selectedAdultsRailcard: number = 0;
  selectedChildsRailcard: number = 0;
  currentRailcardIndex: number = 0;
  isShowAddMoreButton: boolean = false;
  spinnerService: NgxSpinnerService;
  notificationService: NotificationService;
  pastDepart: boolean = false;
  pastReturn: boolean = false;
  isReturnExceedStart: boolean = false;
  result: EnhancedSearchRequestModel = new EnhancedSearchRequestModel();
  isSubmitted: boolean = false;
  router: Router;
  appRouteEnum: AppRouteEnum;
  isAdultActionFresh: boolean = true;
  isChildActionFresh: boolean = true;
  adultsForRailcardAdult: number = 0;
  childForRailcardChild: number = 0;
  passengersCount: any;
  showGroupTravelLink: boolean = false;
  isTotalChildrenLess: boolean = false;
  isTotalAdultsLess: boolean = false;
  prevChilds: number;
  prevAdults: number;
  numOfRailcards: number = 0;
  hiderailcard: boolean = false;
  railcardCount = 0;
  railcardAdult = 0;
  railcardChild = 0;
  isArrayAdded: boolean = false;
  railCardValueChange = new BehaviorSubject<boolean>(false);
  temp: any;
  public adultChildVisible$ = new BehaviorSubject<boolean>(false);
  backupPathConstraintType: string;
  backupPathConstraintLocation: string;
  private subscription!: Subscription;
  bannerAnimationClass: string = '';
  enhancedDynamicClassNameEnum : EnhancedDynamicClassesNameEnum;
  @Input() isCancelVisible: boolean = true;
  isDepartureSameAsArrival: boolean = false;
  isArrivalLocationSameAsDeparture: boolean = false;
  enhancedTravelSolutionTypesEnum: EnhancedTravelSolutionTypesEnum;
  enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
  enhancedTravelTypeEnum: EnhancedTravelTypeEnum;
  enhancedPathConstraintTypeEnum: EnhancedPathConstraintTypeEnum;
  ga4dataLayerService: GA4DatalayerService;
  enhancedSearchTypeEnum: EnhancedSearchTypeEnum;
  headingText: string;
  journeyRemovedClass: boolean = false;
  monetateService: MonetateService;
  @Input() isBackToHomeBtnVisible: boolean = false;
  railcardAnnouncement: string;
  passengerLiveMessage = '';
  isQuantityButtonClick = false;

  constructor(public dialog: MatDialog, private readonly injector: Injector, public enhancedRxjsService: EnhancedRxjsSubjectsCommonService, private readonly renderer: Renderer2){
    
    this.sharedService = this.injector.get(SharedService);
    this.formbuilder = this.injector.get(FormBuilder);
    this.commonServices = this.injector.get(CommonServices);
    this.storageDataService = this.injector.get(StorageDataService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.notificationService = this.injector.get(NotificationService);
    this.router = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.enhancedDynamicClassNameEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
    this.enhancedTravelSolutionTypesEnum = this.injector.get(EnhancedTravelSolutionTypesEnum);
    this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
    this.enhancedTravelTypeEnum = this.injector.get(EnhancedTravelTypeEnum);
    this.enhancedPathConstraintTypeEnum =  this.injector.get(EnhancedPathConstraintTypeEnum);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.enhancedSearchTypeEnum = this.injector.get(EnhancedSearchTypeEnum);
    this.monetateService = this.injector.get(MonetateService);
  }
    ngOnInit(): void {
      this.sharedService.journeyModeTxt$.subscribe(isAddAnotherJourney => {
        this.headingText = isAddAnotherJourney ? this.enhancedSearchTypeEnum.addAnotherJourneyTxt : this.enhancedSearchTypeEnum.customYourSearchTxt;
      });
      this.sharedService.isJourneyRemoved$.subscribe(isRemovedJourney => {
        if (isRemovedJourney) this.journeyRemovedClass = true;
      });
      this.renderer.addClass(document.body, 'your-custom-class');
       this.sharedService.getIsDisabledContinue().subscribe(res => {
             this.continueDisabledWarnMsg = res;
           })
           this.amendSearchRequest = structuredClone(this.sharedService.amendSearchRequest);
           this.railcardStationData = JSON.parse(localStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum?.railcardStationList));
           this.railCards = this.railcardStationData.Railcard;
           this.DepartureTimesStart = this.amendSearchRequest?.DepartureTimesStart;
           this.ReturnTimesStart = this.amendSearchRequest?.ReturnTimesStart;
           this.TraveltypeReturn = this.amendSearchRequest?.TraveltypeReturn;
           this.Traveltype = this.amendSearchRequest?.Traveltype;
           this.IsOpenReturn = this.amendSearchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn ? true : false;
           this.DepartureLocation = this.amendSearchRequest?.DepartureLocation;
           this.DepartureLocationName = this.amendSearchRequest?.DepartureLocationName;
           this.ArrivalLocation = this.amendSearchRequest?.ArrivalLocation;
           this.ArrivalLocationName = this.amendSearchRequest?.ArrivalLocationName;
           this.PathConstraintLocationBackUp = this.PathConstraintLocation = this.amendSearchRequest?.PathConstraintLocation;
           this.railcardBackup = this.amendSearchRequest?.RailCardList;
           this.totalRaicardCount = this.amendSearchRequest?.RailCardList.length;
           this.isAmendFresh = this.sharedService?.isAmendFresh;
           this.adult = this.amendSearchRequest?.Adult;
           this.child = this.amendSearchRequest?.Child;
           this.returnTravelType = this.amendSearchRequest?.TraveltypeReturn ? this.amendSearchRequest?.TraveltypeReturn : this.enhancedTravelTypeEnum?.departAfter;
           this.count = this.amendSearchRequest?.Adult;
           this.count2 = this.amendSearchRequest?.Child;
           this.isOperatorFilterChoosed = this.amendSearchRequest?.OperaterFilter === 1;
           this.isChangeFilterChoosed = this.amendSearchRequest?.ChangesFilter === 0;
           //For railcards
           this.adultsForRailcards = this.adult;
           this.adultForRailcardCount = this.adultsForRailcards;
           this.childsForRailcards = this.child;
           this.childForRailcardCount = this.childsForRailcards;
       
       
           let requestedTime = moment(this.amendSearchRequest?.DepartureTimesStart).format("HH:mm:ss");
           let tempTime = requestedTime.split(':');
           this.prepopulatedTime = tempTime[0] + ':' + tempTime[1];
           this.prepopulatedDate = moment(this.amendSearchRequest?.DepartureTimesStart).format('DD/MM/YYYY');
       
           if (this.amendSearchRequest?.IsReturnRequest) {
             let requestedTimeReturn = moment(this.amendSearchRequest?.ReturnTimesStart).format("HH:mm:ss");
             let tempTimeReturn = requestedTimeReturn.split(':');
             this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
             this.prepopulatedDateReturn = moment(this.amendSearchRequest?.ReturnTimesStart).format('DD/MM/YYYY');
           }
       
           this.createForms();
       
           this.railcards = this.railcardsFormArray;
       
           if (this.sharedService.locationMasterData?.length > 0) {
             this.locations = this.sharedService.locationMasterData;
             this.initializeForms();
           }
           else {
             this.getLocations();
           }
           this.getDisableDates();
           this.setReturnDateDetail();
           this.bannerAnimationClass = this.enhancedDynamicClassNameEnum?.openEditQTTAnimationClass;
    }

    setReturnDateDetail(){
      this.subscription = this.enhancedRxjsService.sharedData$.subscribe(data => {
        if(data && Object.keys(data).length > 0){
          if (data?.isDepart) {
            this.setDatesForDepartAfter(data?.result);
          } else {
            this.setDatesForArriveBy(data?.result);
          }
        }
      });
    }

    initializeForms() {
      this.qttForm.patchValue({
        departureLocationName: this.findLocation(this.amendSearchRequest?.DepartureLocation),
        arrivalLocationName: this.findLocation(this.amendSearchRequest?.ArrivalLocation),
        pathConstraintType: this.amendSearchRequest?.PathConstraintType == undefined ? this.enhancedPathConstraintTypeEnum?.Via?.toUpperCase() : this.amendSearchRequest?.PathConstraintType,
        pathConstraintLocation: this.findLocation(this.amendSearchRequest?.PathConstraintLocation),
        startDateTime: this.prepopulatedDate + ', ' + this.prepopulatedTime,
        adultCount: this.amendSearchRequest?.Adult,
        childCount: this.amendSearchRequest?.Child,
        returnDateTime: this.getReturnDateTime(),
        operaterFilter: this.isOperatorFilterChoosed ? "1" : "0",
        changesFilter: this.isChangeFilterChoosed ? "0" : "1",
        ticketClassFilter: this.amendSearchRequest?.TicketClassFilter,
      });
  
      if (this.amendSearchRequest?.Adult < 2) {
        this.isPluralAdult = false;
      }
      else {
        this.isPluralAdult = true;
      }
  
      if (this.amendSearchRequest?.Child < 2) {
        this.isPluralChild = false;
      }
      else {
        this.isPluralChild = true;
      }
  
      if (this.amendSearchRequest?.PathConstraintLocation && this.amendSearchRequest?.PathConstraintLocation != 0) {
        this.showPathConstraint = true;
      }
      //Railcard for Return Initialize
      let arrayControl = this.railcardsFormArray;
      if (this.amendSearchRequest?.RailCardList.length != 0) {
        arrayControl.clear();
        this.amendSearchRequest?.RailCardList?.forEach(railcard => {
          arrayControl.push(this.formbuilder.group({
            railcardName: railcard.RailCard,
            railcardFullName: this.findRailcardName(railcard.RailCard),
            railcardCount: railcard.RailCardCount,
            railcardAdult: railcard.Adult,
            railcardChild: railcard.Child,
            showRemoveRailcard: true
          }));
          this.showAdultChildField(railcard.RailCard);
        });
        if (this.railcards.length >= 1) {
          this.showRemove = true;
          this.isRailcardSelected = true;
          this.isAdultRailcardSelected = true;
          this.isChildRailcardSelected = true;
          this.isRailcardCountSelected = true;
          this.railcardCompleted = true;
          this.currentRailcardIndex = this.amendSearchRequest?.RailCardList?.length - 1;
          this.selectedAdultsRailcard = this.amendSearchRequest?.RailCardList[this.currentRailcardIndex]?.Adult;
          this.selectedChildsRailcard = this.amendSearchRequest?.RailCardList[this.currentRailcardIndex]?.Child;
          this.hideShowAddMoreButton();
        }
      }
      else {
        this.isShowAddMoreButton = true;
      }
  
    }

    findRailcardName(value) {
      let name;
      this.railCards.forEach(item => {
        if (item.Code === value) {
          name = item.Name;
        }
      });
      return name;
    }

    showAdultChildField(railcardName) {
      let railcard = this.railCards.find(item => {
        if (item.Code === railcardName) {
          return true;
        }
      });
      if (railcard != undefined) {
        if (railcard.IsAdultChildShow) {
          this.adultChildVisible = true;
          this.adultChildVisible$.next(this.adultChildVisible);
          return true;
        }
      }
      this.adultChildVisible = false;
      this.adultChildVisible$.next(this.adultChildVisible);
      return false;
  
    }

    hideShowAddMoreButton() {
      this.setSearchRequestRailcards();
      if (this.amendSearchRequest?.RailCardList.length > 0) {
        let totalAdults = 0;
        let totalChilds = 0;
        this.amendSearchRequest?.RailCardList.forEach(m => {
          totalAdults = totalAdults + m.Adult;
          totalChilds = totalChilds + m.Child;
        });
        if (this.adult > totalAdults || this.child > totalChilds) {
          this.isShowAddMoreButton = true;
        }
        else {
          this.isShowAddMoreButton = false;
        }
      }
    }

    setSearchRequestRailcards() {
        this.amendSearchRequest.RailCardList = new Array<EnhancedRailCardModel>();
        let formName;
        formName = this.railcards;
    
        formName.controls.forEach(controls => {
          let railcardModel = new EnhancedRailCardModel();
          railcardModel.Child = controls.get('railcardChild').value;
          railcardModel.RailCard = controls.get('railcardName').value;
          railcardModel.RailCardCount = controls.get('railcardCount').value;
          railcardModel.Adult = controls.get('railcardAdult').value;
          this.amendSearchRequest?.RailCardList.push(railcardModel);
        });
    
    }

    createForms() {
        this.qttForm = this.formbuilder.group({
          departureLocationName: new FormControl('', [
            Validators.required]),
          arrivalLocationName: new FormControl('', [Validators.required]),
          pathConstraintType: new FormControl(''),
          pathConstraintLocation: new FormControl(''),
          startDateTime: new FormControl('', [Validators.required]),
          adultCount: new FormControl('', [passengerCountValidator(this.adult, this.child)]),
          childCount: new FormControl('', [passengerCountValidator(this.adult, this.child)]),
    
          railcards: this.formbuilder.array([this.createRailcardGroup()]),
          returnDateTime: new FormControl(''),
          operaterFilter: new FormControl(''),
          changesFilter: new FormControl(''),
          ticketClassFilter: new FormControl(''),
        });
        this.railcardForm = this.createRailcardGroup();
    }

    createRailcardGroup(): FormGroup {
      return this.formbuilder.group({
        railcardName: new FormControl(''),
        railcardFullName: new FormControl(''),
        railcardCount: new FormControl({ value: 0, disabled: true }),
        railcardAdult: new FormControl({ value: 0, disabled: true }),
        railcardChild: new FormControl({ value: 0, disabled: true }),
        showRemoveRailcard: new FormControl(false)
      });
    }

    findLocation(value) {
      if (value !== null && value !== '' && value !== undefined && value !== 0) {
        let station = this.locations.filter(m => m.Id == value);
        return station[0].Name;
      }
      else {
        return '';
      }
    }

    getReturnDateTime(){
      if(!Boolean(this.amendSearchRequest?.IsReturnRequest)){
        if(this.amendSearchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn){
          return 'Open return'
        }else{
          return null;
        }
      }else{
          return (this.prepopulatedDateReturn + ', ' + this.prepopulatedTimeReturn);
      }
    }

    getLocations() {
        this.commonServices.getLocations().subscribe(
          res => {
            if (res != null) {
              this.responseData = res as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                this.sharedService.locationMasterData = this.responseData.Data;
                this.locations = this.responseData.Data;
                this.initializeForms();
              }
              else {
                console.log(this.responseData.ResponseMessage);
              }
            }
          });
    
    }

    getDisableDates() {
      let disabledates = this.storageDataService.getStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.disableDates, true);
      if (disabledates === null || disabledates === undefined || disabledates === false) {
        this.spinnerService.hide();
        this.getRailcardStations();
      }
    }

    getRailcardStations() {
      this.commonServices.getRailcardStations().subscribe(
        res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              let disableDataFromApi = this.responseData.Data;
              let disabledDates = [];
              if (disableDataFromApi?.DisabledDates) {
                for (let date of disableDataFromApi.DisabledDates) {
                  const dt = new Date(date).getTime();
                  disabledDates.push(dt);
                }
              }
              localStorage.setItem(this.enhancedLocalOrSessionStorageKeyEnum?.disableDates, JSON.stringify(disabledDates));
            }
            else {
              this.notificationService.error(this.responseData.ResponseMessage);
            }
          }
        });
    }


    onClick(){
      this.submitEdit.emit(true);
    }

    increment() {
      this.isQuantityButtonClick = true;
      this.count++;
      this.qttForm.get('adultCount').setValue(this.count);
      this.adultChangeAction(this.count);

      if (this.count === 10) {
        this.passengerLiveMessage = `Adults (16+) maximum value reached, ${this.count}`;
        this.resetQuantityButtonClick();
        return;
      }
      this.passengerLiveMessage = `Adults (16+) ${this.count}`;
      this.resetQuantityButtonClick();
    }
    decrement() {
      this.isQuantityButtonClick = true;
      if (this.count != 0){
        this.count--;
        this.qttForm.get('adultCount').setValue(this.count);
        this.adultChangeAction(this.count);
      }
      if (this.count === 0) {
          this.passengerLiveMessage = `Adults (16+) minimum value reached, ${this.count}`;
          this.resetQuantityButtonClick();
          return;
      }
          this.passengerLiveMessage = `Adults (16+) ${this.count}`;
          this.resetQuantityButtonClick();
    }
    // End Adults 

  EnhancedSearchJourneyStationDialogs(isDeparture, isViaAvoid) {
    let isArriveSelected = !isDeparture && !isViaAvoid;
      let dialogRef = this.dialog.open(EnhancedSearchJourneyStationDialogs, {
        disableClose: true,
        panelClass: [this.enhancedDynamicClassNameEnum?.commonPopupPanelClass, this.enhancedDynamicClassNameEnum?.stationPopupPanelClass, this.enhancedDynamicClassNameEnum?.commonfullPanelPopupClass],
        autoFocus: false,
        data: {
          DepartureLocation: this.DepartureLocation,
          DepartureLocationName: this.DepartureLocationName,
          ArrivalLocation: this.ArrivalLocation,
          ArrivalLocationName: this.ArrivalLocationName,
          PathConstraintLocation: this.PathConstraintLocation,
          locations: this.locations,
          isDeparture: isDeparture,
          isArrving: isArriveSelected,
          isViaAvoid: isViaAvoid,
          isVia: this.qttForm.get('pathConstraintType').value === this.enhancedPathConstraintTypeEnum?.Via?.toUpperCase(),
          popularStations: this.railcardStationData.PopularStation
        },
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if(result){
          this.DepartureLocationName = result.DepartureLocationName;
          this.DepartureLocation = result.DepartureLocation;
          this.PathConstraintLocation = result.PathConstraintLocation;
          this.ArrivalLocationName = result.ArrivalLocationName;
          this.ArrivalLocation = result.ArrivalLocation;
          if (isDeparture && !isViaAvoid) {
            this.qttForm.get('departureLocationName').setValue(this.DepartureLocationName);
            if(this.conditionToCheckDepartureAndArrivalLocation()){
              this.isDepartureSameAsArrival = true;
            } else if (this.isDepartureSameAsArrival || this.isArrivalLocationSameAsDeparture) {
              this.isDepartureSameAsArrival = false;
              this.isArrivalLocationSameAsDeparture = false;
            }
          }
          else if (!isDeparture && isViaAvoid) {
            this.showPathConstraint = true;
            this.amendSearchRequest.PathConstraintType = result?.PathConstraintType;
            this.qttForm.get('pathConstraintLocation').setValue(this.findLocation(this.PathConstraintLocation));
            this.amendSearchRequest.PathConstraintLocation = this.findLocationCode(this.qttForm.get('pathConstraintLocation').value);
          }
          else {
            if(this.conditionToCheckDepartureAndArrivalLocation()){
              this.isArrivalLocationSameAsDeparture = true;
            } else if(this.isArrivalLocationSameAsDeparture || this.isDepartureSameAsArrival) {
              this.isArrivalLocationSameAsDeparture = false;
              this.isDepartureSameAsArrival = false;
            }
            this.qttForm.get('arrivalLocationName').setValue(this.ArrivalLocationName);
          }
        }
      });
  }

  conditionToCheckDepartureAndArrivalLocation(){
    return this.ArrivalLocationName.toLowerCase() === this.DepartureLocationName.toLowerCase();
  }

  handleKeyup($event, value: string) {
    if ($event.keyCode === 32) { // spacebar
      if (value === 'goingTo') this.EnhancedSearchJourneyStationDialogs(false, false)
      else if (value === 'leaveFrom') this.EnhancedSearchJourneyStationDialogs(true, false)
      else if (value === 'return') this.showDatepickerPopup(false)
      else if (value === 'station') this.EnhancedSearchJourneyStationDialogs(false, true)
      else this.showDatepickerPopup(true);
    }
  }

  showDatepickerPopup(isDepart) {
      let dialogRef = this.dialog.open(EnhancedDatepickerPopupComponent, {
        disableClose: true,
        autoFocus: false,
        panelClass: this.enhancedDynamicClassNameEnum?.enhancedDatePickerPanelClass,
        data: {
          DepartureTimesStart: this.DepartureTimesStart,
          ReturnTimesStart: this.ReturnTimesStart,
          TraveltypeReturn: this.TraveltypeReturn,
          Traveltype: this.Traveltype,
          isDepart: isDepart,
          IsOpenReturn: this.IsOpenReturn
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (isDepart) {
            this.setDatesForDepartAfter(result);
          }
          else {
            this.setDatesForArriveBy(result);
          }
        }
      });
    }

    setDatesForDepartAfter(result) {
        this.pastDepart = false;
        if (this.checkPastTime(result.travelDate, result.travelTime)) {
          this.pastDepart = true;
        }
        else {
          if (this.qttForm != undefined && this.qttForm.get('returnDateTime').value != "" && this.qttForm.get('returnDateTime').value != undefined && this.qttForm.get('returnDateTime').value != null && this.qttForm.get('returnDateTime').value !== "Open return") {
            this.isReturnExceedStart = false;
            let stDate = this.qttForm.get('returnDateTime').value.split(', ');
            if (this.returntimeValidator(result.travelDate, result.travelTime, stDate[0], stDate[1], true)) {
              this.isReturnExceedStart = true;
            }
          }
          this.DepartureTimesStart = this.convertDateTime(result.travelDate, result.travelTime);
          this.Traveltype = result.travelType;
        }
        this.qttForm.get('startDateTime').setValue(moment(result.travelDate).format('DD/MM/YYYY') + ', ' + result.travelTime);
      }
    
      setDatesForArriveBy(result) {
        if (!result.isOpen) {
          this.pastReturn = false;
          if (this.checkPastTime(result.travelDate, result.travelTime)) {
            this.pastReturn = true;
          }
          else {
            this.isReturnExceedStart = false;
            let stDate = this.qttForm.get('startDateTime').value.split(', ');
            if (this.returntimeValidator(stDate[0], stDate[1], result.travelDate, result.travelTime, false)) {
              this.isReturnExceedStart = true;
            }
            this.ReturnTimesStart = this.convertDateTime(result.travelDate, result.travelTime);
            this.TraveltypeReturn = result.travelType;
          }
          this.qttForm.get('returnDateTime').setValue(moment(result.travelDate).format('DD/MM/YYYY') + ', ' + result.travelTime);
        }
        else {
          this.IsOpenReturn = true;
          this.pastReturn = false;
          this.isReturnExceedStart = false;
          this.qttForm.get('returnDateTime').setValue('Open return');
        }
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

        convertDateTime(queryDate: any, queryTime: any) {
            let actualTime = queryTime?.split(':');
            let dateString;
            dateString = moment(queryDate).add(actualTime[0], 'hours').add(actualTime[1], 'minutes').format('YYYY-MM-DDTHH:mm');
            return dateString;
          }

          onChangeStationsSearch() {
            let departurLocation = this.qttForm.get('departureLocationName').value;
            let arrivalLocation = this.qttForm.get('arrivalLocationName').value;
            this.qttForm.patchValue({
              departureLocationName: arrivalLocation,
              arrivalLocationName: departurLocation
            });
            this.DepartureLocation = arrivalLocation;
            this.DepartureLocationName = arrivalLocation;
        
            this.ArrivalLocation = departurLocation;
            this.ArrivalLocationName = departurLocation;
        
          }

          applyChanges() {
              this.sharedService.isJourneySuccessfullyRemoved(false);
              this.sharedService.isDisabledContinue.next(false);
              this.sharedService.clearAmendSearch();
              /* virtual_page_view GA4 datalayer event */
              this.ga4dataLayerService.loadGA4DataLayerAllPages(true, true);
              this.monetateService.setPageType();
              this.monetateService.flushEvents();
              this.sharedService.isAmendSearchOpen = false;
              this.result = new EnhancedSearchRequestModel();
              this.result.RailCardList = new Array<EnhancedRailCardModel>();
              this.result.Searchtype = "";
              this.result.SearchCache = "";
              this.result.SearchIndex = 0;
              this.result.TravelSolCount = 0;
              this.sharedService.isFilterClicked = false;
          
              if (this.sharedService != undefined) {
                this.sharedService.secondTravelSolDepartureTime = "";
                this.sharedService.firstTravelSolDepartureTime = "";
              }
          
              if (this.qttForm.valid && this.railcardForm.valid) {
                this.isSubmitted = true;
                this.setDepartDateData();
                this.setReturnDateData();
                if (this.result.IsReturnRequest) {
                  this.sharedService.firstTravelSolDepartureTimeAmend = "";
                  this.sharedService.secondTravelSolDepartureTimeAmend = "";
                }
          
                this.result.retainedSingleDepartureTimeStart = "";
                this.result.DepartureLocationName = this.qttForm.get('departureLocationName').value;
                this.result.DepartureLocation = this.findLocationCode(this.qttForm.get('departureLocationName').value);
                this.result.ArrivalLocationName = this.qttForm.get('arrivalLocationName').value;
                this.result.ArrivalLocation = this.findLocationCode(this.qttForm.get('arrivalLocationName').value);
                this.result.Adult = this.qttForm.get('adultCount').value;
                this.result.Child = this.qttForm.get('childCount').value;
                this.result.TicketClassFilter = this.qttForm.get('ticketClassFilter').value;
                this.result.OperaterFilter = +this.qttForm.get('operaterFilter').value;
                this.result.ChangesFilter = +this.qttForm.get('changesFilter').value;
                this.result.PathConstraintType = this.amendSearchRequest.PathConstraintType;
                this.result.PathConstraintLocation = this.amendSearchRequest.PathConstraintLocation;
                this.result.PromotionCode = this.amendSearchRequest?.PromotionCode;
                this.railcards.controls.forEach(controls => {
                  let railcardModel = new EnhancedRailCardModel();
                  railcardModel.Child = controls.get('railcardChild').value;
                  railcardModel.RailCard = controls.get('railcardName').value;
                  railcardModel.RailCardCount = controls.get('railcardCount').value;
                  railcardModel.Adult = controls.get('railcardAdult').value;
                  if (railcardModel.Adult != 0 || railcardModel.Child != 0) {
                    this.result.RailCardList.push(railcardModel);
                  }
                });
                this.commonServices.setSearchQueryString(this.result);
                if (this.router.url.includes(this.appRouteEnum.ReviewBuy) || this.router.url.includes(this.appRouteEnum.deliveryAndReviewbuy)) {
                  this.sharedService.searchRequest = this.result;
                  this.sharedService.isAmendSearchOpen = false;
                  this.sharedService.showEdit = false;
                  this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
                }
                else {
                  this.sharedService.amendSearchRequest = structuredClone(this.result);
                  this.submitEdit.emit(true);
                }
              }
            }

            setDepartDateData() {
              if (this.qttForm.get('startDateTime') != null) {
                this.result.DepartureTimesStart = this.DepartureTimesStart != undefined ? this.DepartureTimesStart : this.result.DepartureTimesStart;
                //Added a property so on earlier/later editQtt input dates do not change
                this.sharedService.editQttDepartureTimeStart = this.DepartureTimesStart != undefined ? this.DepartureTimesStart : this.result.DepartureTimesStart;
                this.result.Traveltype = this.Traveltype != undefined ? this.Traveltype : this.result.Traveltype;
                this.result.IsReturnRequest = false;
                this.result.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.oneWay;
              }
            }

            setReturnDateData() {
              if (this.qttForm.get('returnDateTime').value != null && this.qttForm.get('returnDateTime').value !== "") {
                if (this.qttForm.get('returnDateTime').value == "Open return") {
                  this.result.IsReturnRequest = false;
                  this.result.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.openReturn;
                }
                else {
                  this.result.ReturnTimesStart = this.ReturnTimesStart != undefined ? this.ReturnTimesStart : this.result.ReturnTimesStart;
                  //Added a property so on earlier/later editQtt input dates do not change
                  this.sharedService.editQttReturnTimeStart = this.ReturnTimesStart != undefined ? this.ReturnTimesStart : this.result.ReturnTimesStart;
                  this.result.TraveltypeReturn = this.TraveltypeReturn != undefined ? this.TraveltypeReturn : this.result.TraveltypeReturn;
                  this.result.IsReturnRequest = true;
                  this.result.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.return;
                }
              }
              else {
                this.result.IsReturnRequest = false;
                this.result.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.oneWay;
              }
            }
          
            findLocationCode(value) {
              if (value !== null && value !== '' && value !== undefined && value !== 0) {
                let station = this.locations.filter(m => m.Name == value);
                return station[0].Id;
              }
              else {
                return 0;
              }
            }

            onClose() {
                this.sharedService.isStationListAPILoaderRequired = false;
                this.sharedService.isDisabledContinue.next(false);
                this.sharedService.isFilterClicked = false;
                this.amendSearchRequest.PathConstraintLocation = this.PathConstraintLocationBackUp;
                if (this.amendSearchRequest?.PathConstraintLocation == 0) {
                  this.showPathConstraint = false;
                }
                if (this.railcardBackup.length == 0) {
                  this.amendSearchRequest.RailCardList = new Array<EnhancedRailCardModel>();
                }
                else {
                  this.amendSearchRequest.RailCardList = this.railcardBackup;
                }
                if (this.router.url.includes(this.appRouteEnum.ReviewBuy) || this.router.url.includes(this.appRouteEnum.deliveryAndReviewbuy)) {
                  this.sharedService.showEdit = false;
                }
                else {
                  this.submitEdit.emit(false);
                }
                this.bannerAnimationClass = this.enhancedDynamicClassNameEnum?.closeEditQTTAnimationClass;
                this.enhancedRxjsService.setSharedData(null);
              }

  EnhancedAddRailcardDialogs() {
     const dialogRef = this.dialog.open(EnhancedAddRailcardDialogs, {
      disableClose: true,
      panelClass: [this.enhancedDynamicClassNameEnum?.commonPopupPanelClass, this.enhancedDynamicClassNameEnum?.addRailCardPopupPanelClass],
      autoFocus: false,
      data: {
        railcardForm: this.railcardForm,
        railCardsModel: this.railCards,
        railcardCount: this.railcardCount,
        railcardAdult: this.railcardAdult,
        railcardChild: this.railcardChild,
        adultChildVisible: this.adultChildVisible,
        railCardValueChange$: this.railCardValueChange,
        railCardFormArray: this.railcards,
        onRailcardChange: (i : any) => this.onRailcardActionChange(i),
        onRailCardIncrement: () => this.incrementRailcardCount(),
        onRailCardDecrement: () => this.decrementRailcardCount(),
        showAdultChildField: (railCardName: any) => this.showAdultChildField(railCardName),
        incrementRailcardAdult: () => this.incrementRailcardAdult(),
        decrementRailcardAdult: () => this.decrementRailcardAdult(),
        incrementRailcardChild: () => this.incrementRailcardChild(),
        decrementRailcardChild: () => this.decrementRailcardChild(),
        adultChildVisible$: this.adultChildVisible$,
        addRailcardToList: () => this.addRailcardToList(),
        onCancelRailcard: () => this.onCancelRailcard()
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'added') {
        this.addRailcardToList();
      }
      let lastIndex = this.qttForm.get('railcards')!.value.length - 1;
      let railcardName = this.qttForm.get(['railcards', lastIndex, 'railcardFullName'])?.value;
      let quantity = this.qttForm.get(['railcards', lastIndex, 'railcardCount'])?.value;
      this.announceRailcardAdded(railcardName, quantity);
    });
  }

  onCancelRailcard() {
    if (this.isArrayAdded) {
      this.railcards.removeAt(this.railcards.length - 1);
      this.isArrayAdded = false;
    }
    this.railcardForm.patchValue({
      railcardName: '',
      railcardFullName: '',
      railcardCount: 0,
      railcardAdult: 0,
      railcardChild: 0,
      showRemoveRailcard: false
    });
    this.hiderailcard = !this.hiderailcard;
    this.railcardForm.get('railcardAdult').setErrors(null);
    this.railcardForm.get('railcardChild').setErrors(null);
    this.railcardForm.updateValueAndValidity();
  }

  increment2() {
    this.isQuantityButtonClick = true;
    this.count2++;
    this.qttForm.get('childCount').setValue(this.count2);
    this.childChangeAction(this.count2);

    if (this.count2 === 10) {
      this.passengerLiveMessage = `Children (5 to 15) maximum value reached, ${this.count2}`;
      this.resetQuantityButtonClick();
      return;
    }
    this.passengerLiveMessage = `Children (5 to 15) ${this.count2}`;
    this.resetQuantityButtonClick();
  }
  decrement2() {
    this.isQuantityButtonClick = true;
    if (this.count2 != 0){
      this.count2--;
      this.qttForm.get('childCount').setValue(this.count2);
      this.childChangeAction(this.count2);
    } 
    if (this.count2 === 0) {
      this.passengerLiveMessage = `Children (5 to 15) minimum value reached, ${this.count2}`;
      this.resetQuantityButtonClick();
      return;
    }
    this.passengerLiveMessage = `Children (5 to 15) ${this.count2}`;
    this.resetQuantityButtonClick();
  }

  adultChangeAction(adultCount) {
    if (this.conditionToCheckIsAdultActionFreshAndRailcardIndex()) {
      this.adultsForRailcards += (adultCount - this.adult);
    }
    else {
      if (this.isAdultActionFresh) {
        this.adultsForRailcardAdult = adultCount;
      }
      else {
        this.adultsForRailcardAdult += (adultCount - this.adult);
      }
      this.adultsForRailcards = adultCount;

    }
    if (this.isAdultActionFresh) {
      this.isAdultActionFresh = false;
    }
    this.adult = adultCount;
    this.setIsPluralAdultOrNot(adultCount);
    this.passengersCount = this.adult + this.child;
    if (this.passengersCount > 9) {
      this.showGroupTravelLink = true;
      this.qttForm.get('adultCount').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCount < 1) {
      this.qttForm.get('adultCount').setValidators([passengerCountValidator(this.adult, this.child)]);
      this.qttForm.get('adultCount').updateValueAndValidity();
      this.qttForm.get('childCount').setValidators(null);
      this.qttForm.get('childCount').setErrors(null);
    }
    else {
      this.showGroupTravelLink = false;
      this.qttForm.get('adultCount').setErrors(null);
      this.qttForm.get('childCount').setErrors(null);
    }


    //For Railcards
    this.hideShowAddMoreButton();
    this.isTotalAdultsLess = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      let totalChildren = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalAdults = totalAdults + m.Adult;
        totalChildren = totalChildren + m.Child;
      });
      if (this.adult < totalAdults) {
        this.isTotalAdultsLess = true;
        this.railcardForm.get('railcardAdult').enable();
        this.railcardForm.get('railcardAdult').setErrors({ 'adultValid': true });
        this.qttForm.get('adultCount').setErrors({ 'adultValid': true });
      }
      if(this.child < totalChildren){
        this.qttForm.get('childCount').setErrors({ 'childValid': true });
      }
    }
    this.adultForRailcardCount = this.adultsForRailcards;
    this.setAdultRailCardData();
  }

  setAdultRailCardData() {
      if ((this.isAdultRailcardSelected || this.isChildRailcardSelected || this.isRailcardCountSelected) && !this.isTotalAdultsLess) {
        this.railcardCompleted = false;
        let selectedRailcard = this.railcardForm.get('railcardName').value;
        let currentRailcardCount = this.railcardForm.get('railcardCount').value;
        if (this.isAdultRailcardSelected) {
          this.railcardForm.get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.adultsForRailcards, selectedRailcard, currentRailcardCount, this.railCards)]);
          this.railcardForm.get('railcardAdult').updateValueAndValidity();
        }
        if (this.isChildRailcardSelected) {
          this.railcardForm.get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.prevChilds, selectedRailcard, currentRailcardCount, this.railCards)]);
          this.railcardForm.get('railcardChild').updateValueAndValidity();
        }
        if (this.isRailcardCountSelected) {
          this.railcardForm.get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcards, this.adultsForRailcards, this.prevChilds, selectedRailcard, currentRailcardCount, this.railCards)]);
          this.railcardForm.get('railcardCount').updateValueAndValidity();
        }
        this.railcardCompleted = true;
      }
  }

  childChangeAction(childCount) {
    this.setIsPluralChildOrNot(childCount);
    if (this.conditionToCheckIsChildActionFreshAndRailcardIndex()) {
      this.childsForRailcards += (childCount - this.child);
    }
    else {
      if (this.isChildActionFresh) {
        this.childForRailcardChild = childCount;
      }
      else {
        this.childForRailcardChild += (childCount - this.child);
      }
      this.childsForRailcards = childCount;
    }
    if (this.isChildActionFresh) {
      this.isChildActionFresh = false;
    }
    this.child = childCount;
    this.passengersCount = this.adult + this.child;

    if (this.passengersCount > 9) {
      this.showGroupTravelLink = true;
      this.qttForm.get('childCount').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCount < 1) {
      this.qttForm.get('childCount').setValidators([passengerCountValidator(this.adult, this.child)]);
      this.qttForm.get('childCount').updateValueAndValidity();
      this.qttForm.get('adultCount').setValidators(null);
      this.qttForm.get('adultCount').setErrors(null);
    }
    else {
      this.showGroupTravelLink = false;
      this.qttForm.get('childCount').setErrors(null);
      this.qttForm.get('adultCount').setErrors(null);
    }


    //For Railcard
    this.hideShowAddMoreButton();
    this.isTotalChildrenLess = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalChildren = 0;
      let totalAdult = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalChildren = totalChildren + m.Child;
        totalAdult = totalAdult + m.Adult;
      });
      if (this.child < totalChildren) {
        this.isTotalChildrenLess = true;
        this.railcardForm.get('railcardChild').enable();
        this.railcardForm.get('railcardChild').setErrors({ 'childValid': true });
        this.qttForm.get('childCount').setErrors({ 'childValid': true });
      }
      if(this.adult < totalAdult){
        this.qttForm.get('adultCount').setErrors({ 'adultValid': true });
      }
    }
    this.childForRailcardCount = this.childsForRailcards;
    this.setChildRailCardData();
  }

  setChildRailCardData() {
    if ((this.isAdultRailcardSelected || this.isChildRailcardSelected || this.isRailcardCountSelected) && !this.isTotalChildrenLess) {
      let selectedRailcard = this.railcardForm.get('railcardName').value;
      let currentRailcardCount = this.railcardForm.get('railcardCount').value;
      if (this.isAdultRailcardSelected) {
        this.railcardForm.get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.railcardForm.get('railcardAdult').value, selectedRailcard, currentRailcardCount, this.railCards)]);
        this.railcardForm.get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelected) {
        this.railcardForm.get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.childsForRailcards, selectedRailcard, currentRailcardCount, this.railCards)]);
        this.railcardForm.get('railcardChild').updateValueAndValidity();
      }
      if (this.isRailcardCountSelected) {
        this.railcardForm.get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcards, this.railcardForm.get('railcardAdult').value, this.childsForRailcards, selectedRailcard, currentRailcardCount, this.railCards)]);
        this.railcardForm.get('railcardCount').updateValueAndValidity();
      }
    }
  }

  showrailcard() {
    this.hiderailcard = !this.hiderailcard;
    this.railcardForm.patchValue({
      railcardName: '',
      railcardFullName: '',
      railcardCount: 0,
      railcardAdult: 0,
      railcardChild: 0,
      showRemoveRailcard: false
    });
    this.railcardCount = 0;
    this.railcardAdult = 0;
    this.railcardChild = 0;
    this.railcardForm.get('railcardCount').setValue(this.railcardCount);
    this.railcardForm.get('railcardAdult').setValue(this.railcardAdult);
    this.railcardForm.get('railcardChild').setValue(this.railcardAdult);
    this.railcardForm.get('railcardAdult').setErrors(null);
    this.railcardForm.get('railcardChild').setErrors(null);
    this.railcardForm.get('railcardCount').setErrors(null);
    this.addRailcard();
  }

  addRailcard(): void {
    this.isRailcardSelected = false;
    this.isRailcardCountSelected = false;
    this.isAdultRailcardSelected = false;
    this.isChildRailcardSelected = false;
    this.isRailcardsCountErrorFree = false;
    this.isRailcardsAdultErrorFree = false;
    this.isRailcardsChildErrorFree = false;
    if (this.amendSearchRequest.RailCardList.length != 0) {
      this.railcards = this.railcardsFormArray;
      this.railcards.push(this.createRailcardGroup());
      this.isArrayAdded = true;
    }
    this.EnhancedAddRailcardDialogs();
  }

  addRailcardToList() {
    let arrayControl = this.railcardsFormArray;
    arrayControl.controls[this.railcards.length - 1].patchValue({
      railcardName: this.railcardForm.get('railcardName').value,
      railcardFullName: this.findRailcardName(this.railcardForm.get('railcardName').value),
      railcardCount: this.railcardForm.get('railcardCount').value,
      railcardAdult: this.railcardForm.get('railcardAdult').value,
      railcardChild: this.railcardForm.get('railcardChild').value,
      showRemoveRailcard: true
    });
    this.isRailcardSelected = false;
    this.isRailcardCountSelected = false;
    this.isAdultRailcardSelected = false;
    this.isChildRailcardSelected = false;
    this.isRailcardsCountErrorFree = false;
    this.isRailcardsAdultErrorFree = false;
    this.isRailcardsChildErrorFree = false;
    this.hideShowAddMoreButton();
    this.hiderailcard = !this.hiderailcard;
  }

  checkCountOfAdultAndChild(selectedRailcardName, AdultValue, ChildValue) {
    this.railCards.forEach(item => {
      if (item.Code === selectedRailcardName) {
        if (this.showAdultChildField(this.railcardForm.get('railcardName').value)) {
          if ((item.MinAdult <= AdultValue && item.MinChild <= ChildValue) && ((item.MaxAdult * this.railcardCount) >= AdultValue && (item.MaxChild * this.railcardCount) >= ChildValue)) {
            this.railCardValueChange.next(false);
          } else {
            this.railCardValueChange.next(true);
          }
        } else {
          this.railCardValueChange.next(false);
        }
      }
    });
  }

  removeRailcard(index) {
    let railcardToRemove = this.qttForm.get(['railcards', index, 'railcardCount']).value;
    let railcardAdultToRemove = this.qttForm.get(['railcards', index, 'railcardAdult']).value;
    let railcardChildToRemove = this.qttForm.get(['railcards', index, 'railcardChild']).value;
    let arrayControl = this.railcardsFormArray;
    if (this.railcards.length > 1) {
      this.numOfRailcards -= railcardToRemove;
      this.adultForRailcardCount += railcardAdultToRemove;
      this.adultsForRailcardAdult += railcardAdultToRemove;
      this.childForRailcardCount += railcardChildToRemove;
      this.childForRailcardChild += railcardChildToRemove;
      this.railcards.removeAt(index);
    }
    else {
      this.numOfRailcards -= railcardToRemove;
      this.adultForRailcardCount += railcardAdultToRemove;
      this.adultsForRailcardAdult += railcardAdultToRemove;
      this.childForRailcardCount += railcardChildToRemove;
      this.childForRailcardChild += railcardChildToRemove;
      this.qttForm.controls.railcards['controls'][index].patchValue({
        railcardName: '',
        railcardFullName: '',
        railcardCount: 0,
        railcardAdult: 0,
        railcardChild: 0,
        showRemoveRailcard: false
      });

      arrayControl.controls[index].get('railcardCount').disable();
      arrayControl.controls[index].get('railcardAdult').disable();
      arrayControl.controls[index].get('railcardChild').disable();

      this.isRailcardSelected = false;
      this.isRailcardCountSelected = false;
      this.isAdultRailcardSelected = false;
      this.isChildRailcardSelected = false;
      this.isRailcardsCountErrorFree = false;
      this.isRailcardsAdultErrorFree = false;
      this.isRailcardsChildErrorFree = false;
      this.showRemove = false;
    }

    this.railcardForm.get('railcardAdult')?.setErrors(null);
    this.railcardForm.get('railcardChild')?.setErrors(null);

    this.setOrRemoveErrorFromAdultOrChildCount()
    
    
    this.railcardForm.controls[index]?.setErrors(null);

    this.hideShowAddMoreButton();
    this.railcardCompleted = true;
    if (arrayControl.controls[0].get('railcardName').value != '') {
      this.totalRaicardCount = arrayControl.length;
    }
    else {
      this.totalRaicardCount = 0;
    }
  }

  onRailcardActionChange(index) {
      this.isRailcardSelected = true;
      let arrayControl = this.railcardsFormArray;
      this.selectedAdultsRailcard = 0;
      this.selectedChildsRailcard = 0;
      this.railcardCount = 0;
      this.railcardAdult = 0;
      this.railcardChild = 0;
      this.isAdultRailcardSelected = false;
      this.isChildRailcardSelected = false;
      this.currentRailcardIndex = index;
      this.railcardForm.patchValue({
        railcardCount: 0,
        railcardAdult:0,
        railcardChild:0
      });
      if (this.railcards.length >= 1) {
        this.showRemove = true;
      }
      this.totalRaicardCount = arrayControl.length;
      if (!this.showAdultChildField(this.railcardForm.get('railcardName').value)) {
        let railcard = adultChildSetters(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardCount').value, this.railCards);
        this.selectedAdultsRailcard = railcard[0];
        this.selectedChildsRailcard = railcard[1];
        this.railcardForm.patchValue({
          railcardAdult: railcard[0],
          railcardChild: railcard[1]
        });
        this.adultChangeRailcards(index, null, false);
        this.childChangeRailcards(index, null, false);
      }
      this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardForm.get('railcardChild').value);
    }

    adultChangeRailcards(index, railcardAdultValue, isShowAdultChild) {
      this.railcardCompleted = false;
      if (isShowAdultChild) {
        this.selectedAdultsRailcard = railcardAdultValue;
      }
      if (!this.isAdultRailcardSelected) {
        this.adultsForRailcardAdult = this.adultForRailcardCount;
        this.isAdultRailcardSelected = true;
      }
      let selectedRailcard = this.railcardForm.get('railcardName').value;
      let selectedRailcardCount = this.railcardForm.get('railcardCount').value;
      this.railcardForm.get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.adultsForRailcardAdult, selectedRailcard, selectedRailcardCount, this.railCards)]);
      this.railcardForm.get('railcardAdult').updateValueAndValidity();
      this.adultsForRailcardAdult = this.getRemainingAdults(index);
      if (this.railcardForm.get('railcardCount').errors == null
        && this.railcardForm.get('railcardAdult').errors == null
        && this.railcardForm.get('railcardChild').errors == null) {
        this.railcardCompleted = true;
      }
      this.hideShowAddMoreButton();
    }
  
    childChangeRailcards(index, railcardChildValue, isShowAdultChild) {
      this.railcardCompleted = false;
      if (isShowAdultChild) {
        this.selectedChildsRailcard = railcardChildValue;
      }
      if (!this.isChildRailcardSelected) {
        this.childForRailcardChild = this.childForRailcardCount;
        this.isChildRailcardSelected = true;
      }
      let selectedRailcard = this.railcardForm.get('railcardName').value;
      let selectedRailcardCount = this.railcardForm.get('railcardCount').value;
      this.railcardForm.get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.childForRailcardChild, selectedRailcard, selectedRailcardCount, this.railCards)]);
      this.railcardForm.get('railcardChild').updateValueAndValidity();
      this.childForRailcardChild = this.getRemainingChilds(index);
      if (this.railcardForm.get('railcardCount').errors == null
        && this.railcardForm.get('railcardAdult').errors == null
        && this.railcardForm.get('railcardChild').errors == null) {
        this.railcardCompleted = true;
      }
      this.hideShowAddMoreButton();
    }

    getRemainingAdults(index): number {
      let remainingAdults = 0;
      this.setSearchRequestRailcards();
      if (this.amendSearchRequest.RailCardList.length > 0) {
        let totalAdults = 0;
        let count = 0;
        this.amendSearchRequest.RailCardList.forEach(m => {
          if (index != count) {
            totalAdults = totalAdults + m.Adult;
          }
          count++;
        });
  
        remainingAdults = this.adult - totalAdults;
      }
      return remainingAdults;
    }

    getRemainingChilds(index): number {
      let remainingChilds = 0;
      this.setSearchRequestRailcards();
      if (this.amendSearchRequest.RailCardList.length > 0) {
        let totalChilds = 0;
        let count = 0;
        this.amendSearchRequest.RailCardList.forEach(m => {
          if (index != count) {
            totalChilds = totalChilds + m.Child;
            count++;
          }
        });
  
        remainingChilds = this.child - totalChilds;
      }
      return remainingChilds;
    }

    incrementRailcardCount() {
      this.railcardCount++;
      this.railcardForm.get('railcardCount').setValue(this.railcardCount);
      this.onRailcardCountChange(this.railcards.length - 1, this.railcardCount);
      this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
    }
    decrementRailcardCount() {
      if (this.railcardCount != 0){
        this.railcardCount--;
        this.railcardForm.get('railcardCount').setValue(this.railcardCount);
        this.onRailcardCountChange(this.railcards.length - 1, this.railcardCount);
      }
      this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
    }

    onRailcardCountChange(index, railcardCountValue) {
      this.railcardCompleted = false;
      this.railcardForm.get('railcardAdult').enable();
      this.railcardForm.get('railcardChild').enable();
      let currentRailcardCount = railcardCountValue;
      let selectedRailcardName = this.railcardForm.get('railcardName').value;
      this.adultForRailcardCount = this.getRemainingAdults(index);
      this.childForRailcardCount = this.getRemainingChilds(index);
      if (!this.showAdultChildField(selectedRailcardName)) {
        let railcard = adultChildSetters(selectedRailcardName, currentRailcardCount, this.railCards);
        this.selectedAdultsRailcard = railcard[0];
        this.selectedChildsRailcard = railcard[1];
        this.railcardForm.patchValue({
          railcardAdult: railcard[0],
          railcardChild: railcard[1]
        });
        this.adultChangeRailcards(index, null, false);
        this.childChangeRailcards(index, null, false);
      }
      // check end
      if (!this.isRailcardCountSelected) {
        this.isRailcardCountSelected = true;
        this.temp = railcardCountValue;
        this.prevAdults = this.adultForRailcardCount;
        this.prevChilds = this.childForRailcardCount;
        this.railcardForm.get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcards, this.adultForRailcardCount, this.childForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
        this.railcardForm.get('railcardCount').updateValueAndValidity();
      }
      else {
        this.numOfRailcards -= this.temp;
        this.temp = railcardCountValue;
        if (this.isAdultRailcardSelected) {
          this.railcardForm.get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.adultForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
          this.railcardForm.get('railcardAdult').updateValueAndValidity();
        }
        if (this.isChildRailcardSelected) {
          this.railcardForm.get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.childForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
          this.railcardForm.get('railcardChild').updateValueAndValidity();
        }
        this.railcardForm.get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcards, this.adultForRailcardCount, this.childForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
        this.railcardForm.get('railcardCount').updateValueAndValidity();
      }
      this.numOfRailcards += railcardCountValue;
  
      if (this.railcardForm.get('railcardCount').errors == null
        && this.railcardForm.get('railcardAdult').errors == null
        && this.railcardForm.get('railcardChild').errors == null) {
        this.railcardCompleted = true;
      }
      this.hideShowAddMoreButton();
    }

    incrementRailcardAdult() {
      this.railcardAdult++;
      this.railcardForm.get('railcardAdult').setValue(this.railcardAdult);
      this.adultChangeRailcards(this.railcards.length - 1, this.railcardAdult, true);
      this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
    }
    decrementRailcardAdult() {
      if (this.railcardAdult != 0){
        this.railcardAdult--;
        this.railcardForm.get('railcardAdult').setValue(this.railcardAdult);
        this.adultChangeRailcards(this.railcards.length - 1, this.railcardAdult, true);
      }
      this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
    }

    incrementRailcardChild() {
      this.railcardChild++;
      this.railcardForm.get('railcardChild').setValue(this.railcardChild);
      this.childChangeRailcards(this.railcards.length - 1, this.railcardChild, true);
      this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
    }
    decrementRailcardChild() {
      if (this.railcardChild != 0){
        this.railcardChild--;
        this.railcardForm.get('railcardChild').setValue(this.railcardChild);
        this.childChangeRailcards(this.railcards.length - 1, this.railcardChild, true);
        this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
      }
    }

    showviaavoid() {
      this.EnhancedSearchJourneyStationDialogs(false,true);
    }

    removePathConstraint() {
      this.amendSearchRequest.PathConstraintLocation = 0;
      this.amendSearchRequest.PathConstraintType = undefined;
      this.showPathConstraint = false;
    }

    showViaOrAvoidText(pathConstraintType){
      if(pathConstraintType){
        pathConstraintType = pathConstraintType == this.enhancedPathConstraintTypeEnum?.Via?.toUpperCase() ? this.enhancedPathConstraintTypeEnum?.Via : this.enhancedPathConstraintTypeEnum?.Avoid;
      }
      return pathConstraintType;
    }

    hasRailcardFullName(): boolean {
      const railcards = this.railcardsFormArray;
      return railcards.controls.some((control: AbstractControl) => {
        const railcardFullName = control.get('railcardFullName')?.value;
        return !!railcardFullName && railcardFullName.trim() !== '';
      });
    }
    
    isNotEmptyRailcardFullName(control: AbstractControl): boolean {
      const railcardFullName = control.get('railcardFullName')?.value;
      return !!railcardFullName && railcardFullName.trim() !== '';
    }

    get railcardsFormArray(): FormArray {
      return this.qttForm.get('railcards') as FormArray;
    }

  customizeAdultOrChildCount(count) {
    if (count > 9) {
      return `10+`;
    } else {
      return count;
    }
  }

    clearDate() {
      const ctrlValue = this.qttForm.controls['returnDateTime'];
      ctrlValue.setValue(null);
      this.isReturnExceedStart = false;
      this.pastReturn = false;
      this.enhancedRxjsService.setSharedData(null);
    }

    conditionToDisabledFindTimeAndPrice(){
      return this.isArrivalLocationSameAsDeparture || this.isDepartureSameAsArrival ||  this.showGroupTravelLink || this.pastDepart || this.pastReturn || this.isReturnExceedStart || !this.qttForm.valid;
    }

    setOrRemoveErrorFromAdultOrChildCount(){
    let railcardsArray = this.qttForm.get('railcards') as FormArray;

    let totalRailcardAdult = railcardsArray.controls.reduce((total, group) => {
      let count = group.get('railcardAdult')?.value;
      return total + Number(count);
    }, 0);

    let totalRailcardChild = railcardsArray.controls.reduce((total, group) => {
      let count = group.get('railcardChild')?.value;
      return total + Number(count);
    }, 0);

    if(this.adult < totalRailcardAdult){
      this.qttForm.get('adultCount')?.setErrors({ 'adultValid': true });
    } else {
      this.qttForm.get('adultCount')?.setErrors(null);
    }

    if(this.child < totalRailcardChild){
      this.qttForm.get('childCount')?.setErrors({ 'childValid': true });
    } else {
      this.qttForm.get('childCount')?.setErrors(null);
    }
  }

  backToHome(){
    this.commonServices?.backToHomePage();
  }

  conditionToCheckIsAdultActionFreshAndRailcardIndex(){
    return !this.isAdultActionFresh && this.currentRailcardIndex !== 0;
  }

  setIsPluralAdultOrNot(adultCount){
    if (adultCount < 2) {
      this.isPluralAdult = false;
    }
    else {
      this.isPluralAdult = true;
    }
  }

  setIsPluralChildOrNot(childCount){
    if (childCount < 2) {
      this.isPluralChild = false;
    }
    else {
      this.isPluralChild = true;
    }
  }

  conditionToCheckIsChildActionFreshAndRailcardIndex(){
    return !this.isChildActionFresh && this.currentRailcardIndex !== 0;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  getRemoveRailcardAriaLabel(index: number): string {
    try {
    let name = this.qttForm.get(["railcards", index, "railcardFullName"])?.value || "";
    let count = this.qttForm.get(["railcards", index, "railcardCount"])?.value || 0;
    return `Remove ${name}. Quantity ${count}`;
    } catch (error) { console.log(error); }
  }

  announceRailcardAdded(name: string, quantity: number): void {
    try {
    this.railcardAnnouncement = "";
    this.railcardAnnouncement = `${name}, Quantity ${quantity}. Added`;
    } catch (error) { console.log(error); }
  }
  

  getFocusLabel(value: number, type: "plus" | "minus"): string {
    try {
      if (this.isQuantityButtonClick) {
       return null;
      }
    let action = type === "plus" ? "Press plus button to increase" : "Press minus button to decrease";
    return `Quantity selector, current value: ${value}. ${action}`;
    } catch (error) { console.log(error); }
  }

  resetQuantityButtonClick() {
    setTimeout(() => {
      this.isQuantityButtonClick = false;
    });
  }




}   