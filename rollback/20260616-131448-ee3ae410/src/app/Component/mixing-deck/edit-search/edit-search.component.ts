import { Component, EventEmitter, Injector, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { ResponseData } from 'src/app/models/common/response.model';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { CommonServices } from 'src/app/services/common.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppRouteEnum } from 'src/app/utility/app-constants.service';
import { adultChildSetters } from 'src/app/utility/custom-validations/adult-child- count';
import { adultValidator } from 'src/app/utility/custom-validations/adult-validation';
import { childValidator } from 'src/app/utility/custom-validations/child-validation';
import { passengerCountValidator } from 'src/app/utility/custom-validations/Passenger-count-validation';
import { railcardPerPassengerValidator } from 'src/app/utility/custom-validations/passenger-railcard-validation';
import { stationNameValidator } from 'src/app/utility/custom-validations/station-name-validation';
import { StationSelectionPopupComponent } from '../station-selection-popup/station-selection-popup.component';
import { DatepickerPopupComponent } from '../datepicker-popup/datepicker-popup.component';
import { formatDate } from '@angular/common';
import { RailcardModel, RailcardStationMasterData } from 'src/app/models/master/railcard-station.model';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

export const PICK_FORMATS = {
  parse: { dateInput: { month: 'short', year: 'numeric', day: 'numeric' } },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' }
  }
};

export class PickDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      return formatDate(date, 'dd/MM/yyyy', this.locale);
    } else {
      return date.toDateString();
    }
  }
}

@Component({
  selector: 'app-edit-search',
  templateUrl: './edit-search.component.html',
  styleUrls: ['./edit-search.component.css'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS }
  ]
})
export class EditSearchComponent implements OnInit {
  list: any[];
  checkedList: any[];
  currentSelected: {};
  // select box
  count = 0;
  count2 = 0;
  railcardCount = 0;
  railcardAdult = 0;
  railcardChild = 0;
  newAmend: boolean = false;
  hideviaavoid: boolean = false;
  hiderailcard: boolean = false;
  filtershowhide: boolean = false;
  document: any;
  minDate: Date = new Date();
  maxDate: Date = moment(this.minDate).add(6, 'months').toDate();
  showDropDown: boolean;
  showDropDown2: boolean;
  showDropDown3: boolean;

  amendSearchRequest: SearchRequestModel;
  railcardStationData: RailcardStationMasterData;
  railCards: RailcardModel[];
  qttForm: FormGroup;
  adult: number;
  child: number;

  prepopulatedTime: any;
  prepopulatedDate: any;
  prepopulatedTimeReturn: any;
  prepopulatedDateReturn: any;
  isAmendFresh: boolean;

  locations: LocationMasterData[];
  responseData: ResponseData;

  railcards: FormArray;
  railcardBackup: RailCardModel[];
  totalRaicardCount: number = 0;
  returnTravelType: string;

  adultsForRailcards: number = 0;
  childsForRailcards: number = 0;
  adultForRailcardCount: number;
  childForRailcardCount: number;

  showRemove: boolean = false;
  isRailcardSelected: boolean = false;
  isRailcardCountSelected: boolean = false;
  isAdultRailcardSelected: boolean = false;
  isChildRailcardSelected: boolean = false;
  railcardCompleted: boolean = false;
  selectedAdultsRailcard: number = 0;
  selectedChildsRailcard: number = 0;
  currentRailcardIndex: number = 0;
  showPathConstraint: boolean = false;

  adultChildVisible: boolean = false;
  isShowAddMoreButton: boolean = false;
  isRailcardsCountErrorFree: boolean = false;
  isRailcardsAdultErrorFree: boolean = false;
  isRailcardsChildErrorFree: boolean = false;
  railcardForm: FormGroup;
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
  @Output("submitEdit") submitEdit: EventEmitter<any> = new EventEmitter();
  @ViewChild('operator', { static: true }) operatorFilter: MatSelect;
  @ViewChild('changesFil', { static: true }) changesFil: MatSelect;
  isOperatorFilterChoosed: boolean;
  isChangeFilterChoosed: boolean;
  railCardValueChange: boolean = false;
  continueDisabledWarnMsg: boolean = false;

  sharedService: SharedService;
  spinnerService: NgxSpinnerService;
  router: Router;
  appRouteEnum: AppRouteEnum;
  commonServices: CommonServices;
  storageDataService: StorageDataService;
  notificationService: NotificationService;
  dataLayerService: DataLayerService;
  ga4dataLayerService: GA4DatalayerService;


  constructor(private readonly formbuilder: FormBuilder, private readonly injector: Injector, public dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.router = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonServices = this.injector.get(CommonServices);
    this.storageDataService = this.injector.get(StorageDataService);
    this.notificationService = this.injector.get(NotificationService);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);

    this.list =
      [
        { name: 'India', checked: false },
        { name: 'US', checked: false },
        { name: 'China', checked: false },
        { name: 'France', checked: false }
      ]
  }

  ngOnInit() {
    this.sharedService.getIsDisabledContinue().subscribe(res => {
      this.continueDisabledWarnMsg = res;
    })
    this.amendSearchRequest = this.sharedService.amendSearchRequest;
    this.railcardStationData = JSON.parse(localStorage.getItem('railcardStationList'));
    this.railCards = this.railcardStationData.Railcard;
    this.DepartureTimesStart = this.amendSearchRequest.DepartureTimesStart;
    this.ReturnTimesStart = this.amendSearchRequest.ReturnTimesStart;
    this.TraveltypeReturn = this.amendSearchRequest.TraveltypeReturn;
    this.Traveltype = this.amendSearchRequest.Traveltype;
    this.IsOpenReturn = this.amendSearchRequest.TravelSolutionDirection == 'OPEN_RETURN' ? true : false;
    this.DepartureLocation = this.amendSearchRequest.DepartureLocation;
    this.DepartureLocationName = this.amendSearchRequest.DepartureLocationName;
    this.ArrivalLocation = this.amendSearchRequest.ArrivalLocation;
    this.ArrivalLocationName = this.amendSearchRequest.ArrivalLocationName;
    this.PathConstraintLocation = this.amendSearchRequest.PathConstraintLocation;
    this.railcardBackup = this.amendSearchRequest.RailCardList;
    this.totalRaicardCount = this.amendSearchRequest.RailCardList.length;
    this.isAmendFresh = this.sharedService.isAmendFresh;
    this.adult = this.amendSearchRequest.Adult;
    this.child = this.amendSearchRequest.Child;
    this.returnTravelType = this.amendSearchRequest.TraveltypeReturn ? this.amendSearchRequest.TraveltypeReturn : 'DEPARTAFTER';
    this.count = this.amendSearchRequest.Adult;
    this.count2 = this.amendSearchRequest.Child;
    this.isOperatorFilterChoosed = (this.amendSearchRequest.OperaterFilter === 1) ? true : false;
    this.isChangeFilterChoosed = (this.amendSearchRequest.ChangesFilter === 0) ? true : false;
    //For railcards
    this.adultsForRailcards = this.adult;
    this.adultForRailcardCount = this.adultsForRailcards;
    this.childsForRailcards = this.child;
    this.childForRailcardCount = this.childsForRailcards;


    let requestedTime = moment(this.amendSearchRequest.DepartureTimesStart).format("HH:mm:ss");
    let tempTime = requestedTime.split(':');
    this.prepopulatedTime = tempTime[0] + ':' + tempTime[1];
    this.prepopulatedDate = moment(this.amendSearchRequest.DepartureTimesStart).format('DD/MM/YYYY');

    if (this.amendSearchRequest.IsReturnRequest) {
      let requestedTimeReturn = moment(this.amendSearchRequest.ReturnTimesStart).format("HH:mm:ss");
      let tempTimeReturn = requestedTimeReturn.split(':');
      this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
      this.prepopulatedDateReturn = moment(this.amendSearchRequest.ReturnTimesStart).format('DD/MM/YYYY');
    }

    this.createForms();

    this.railcards = this.qttForm.get('railcards') as FormArray;

    if (this.sharedService.locationMasterData.length > 0) {
      this.locations = this.sharedService.locationMasterData;
      this.initializeForms();
    }
    else {
      this.getLocations();
    }
    this.getDisableDates();
  }
  getDisableDates() {
    let disabledates = this.storageDataService.getStorageData("disableDates", true);
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
            localStorage.setItem("disableDates", JSON.stringify(disabledDates));
          }
          else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  ngAfterViewInit() {
    if (this.operatorFilter) {
      this.operatorFilter._elementRef.nativeElement.children[0].ariaHidden = false;
    }
    if (this.changesFil) {
      this.changesFil._elementRef.nativeElement.children[0].ariaHidden = false;
    }

  }

  createForms() {
    this.qttForm = this.formbuilder.group({
      departureLocationName: new FormControl('', [Validators.required]),
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

  initializeForms() {
    this.qttForm.patchValue({
      departureLocationName: this.findLocation(this.amendSearchRequest.DepartureLocation),
      arrivalLocationName: this.findLocation(this.amendSearchRequest.ArrivalLocation),
      pathConstraintType: this.amendSearchRequest.PathConstraintType == undefined ? 'VIA' : this.amendSearchRequest.PathConstraintType,
      pathConstraintLocation: this.findLocation(this.amendSearchRequest.PathConstraintLocation),
      startDateTime: this.prepopulatedDate + ', ' + this.prepopulatedTime,
      adultCount: this.amendSearchRequest.Adult,
      childCount: this.amendSearchRequest.Child,
      returnDateTime: this.getReturnDateTime(),
      operaterFilter: this.isOperatorFilterChoosed ? "1" : "0",
      changesFilter: this.isChangeFilterChoosed ? "0" : "1",
      ticketClassFilter: this.amendSearchRequest.TicketClassFilter,
    });

    if (this.amendSearchRequest.Adult < 2) {
      this.isPluralAdult = false;
    }
    else {
      this.isPluralAdult = true;
    }

    if (this.amendSearchRequest.Child < 2) {
      this.isPluralChild = false;
    }
    else {
      this.isPluralChild = true;
    }

    if (this.amendSearchRequest.PathConstraintLocation != 0) {
      this.showPathConstraint = true;
    }
    //Railcard for Return Initialize
    let arrayControl = this.qttForm.get('railcards') as FormArray;
    if (this.amendSearchRequest.RailCardList.length != 0) {
      arrayControl.clear();
      this.amendSearchRequest.RailCardList.forEach(railcard => {
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
        this.currentRailcardIndex = this.amendSearchRequest.RailCardList.length - 1;
        this.selectedAdultsRailcard = this.amendSearchRequest.RailCardList[this.currentRailcardIndex].Adult;
        this.selectedChildsRailcard = this.amendSearchRequest.RailCardList[this.currentRailcardIndex].Child;
        this.hideShowAddMoreButton();
      }
    }
    else {
      this.isShowAddMoreButton = true;
    }

  }

  getReturnDateTime(){
    if(!Boolean(this.amendSearchRequest.IsReturnRequest)){
      if(this.amendSearchRequest.TravelSolutionDirection == 'OPEN_RETURN'){
        return 'Open Return'
      }else{
        return null;
      }
    }else{
        return (this.prepopulatedDateReturn + ', ' + this.prepopulatedTimeReturn);
    }
  }

  onOperatorFilterClick() {
    this.isOperatorFilterChoosed = !this.isOperatorFilterChoosed;
    this.qttForm.patchValue({
      operaterFilter: this.isOperatorFilterChoosed ? "1" : "0",
    });
  }

  onChangeFilterClick() {
    this.isChangeFilterChoosed = !this.isChangeFilterChoosed;
    this.qttForm.patchValue({
      changesFilter: this.isChangeFilterChoosed ? "0" : "1"
    });
  }

  addPathConstraint() {
    this.amendSearchRequest.PathConstraintLocation = this.findLocationCode(this.qttForm.get('pathConstraintLocation').value);
    this.amendSearchRequest.PathConstraintType = this.qttForm.get('pathConstraintType').value;
    this.showPathConstraint = true;
    this.hideviaavoid = !this.hideviaavoid;
  }

  removePathConstraint() {
    this.amendSearchRequest.PathConstraintLocation = 0;
    this.amendSearchRequest.PathConstraintType = undefined;
    this.qttForm.get('pathConstraintType').setValue('VIA');
    this.qttForm.get('pathConstraintLocation').setValue('');
    this.showPathConstraint = false;
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
      this.railcards = this.qttForm.get('railcards') as FormArray;
      this.railcards.push(this.createRailcardGroup());
      this.isArrayAdded = true;
    }
  }

  addRailcardToList() {
    let arrayControl = this.qttForm.get('railcards') as FormArray;
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
  }

  isArrayAdded: boolean = false;
  adultsForRailcardAdult: number = 0;
  childForRailcardChild: number = 0;
  numOfRailcards: number = 0;
  isAdultActionFresh: boolean = true;
  isChildActionFresh: boolean = true;
  isPluralAdult: boolean = false;
  isPluralChild: boolean = false;
  passengersCount: any;
  showGroupTravelLink: boolean = false;
  isTotalAdultsLess: boolean = false;
  prevChilds: number;
  isTotalChildrenLess: boolean = false;
  prevAdults: number;
  temp: any;
  isSubmitted: boolean = false;
  result: SearchRequestModel = new SearchRequestModel();
  backupPathConstraintType: string;
  backupPathConstraintLocation: string;

  counts = Array.from(Array(10).keys());
  countsRailcard = Array.from(Array(9).keys()).map(i => i + 1);

  findRailcardName(value) {
    let name;
    this.railCards.forEach(item => {
      if (item.Code === value) {
        name = item.Name;
      }
    });
    return name;
  }
  removeRailcard(index) {
    let railcardToRemove = this.qttForm.get(['railcards', index, 'railcardCount']).value;
    let railcardAdultToRemove = this.qttForm.get(['railcards', index, 'railcardAdult']).value;
    let railcardChildToRemove = this.qttForm.get(['railcards', index, 'railcardChild']).value;
    let arrayControl = this.qttForm.get('railcards') as FormArray;
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

    this.railcardForm.get('railcardAdult').setErrors(null);
    this.railcardForm.get('railcardChild').setErrors(null);
    this.railcardForm.controls[index].setErrors(null);

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
    let arrayControl = this.qttForm.get('railcards') as FormArray;
    this.selectedAdultsRailcard = 0;
    this.selectedChildsRailcard = 0;
    this.isAdultRailcardSelected = false;
    this.isChildRailcardSelected = false;
    this.currentRailcardIndex = index;
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

  onCancel() {
    let arrayControl = this.qttForm.get('railcards') as FormArray;
    arrayControl.clear();
    this.railcards.clear();
    this.railcards = this.qttForm.get('railcards') as FormArray;
    this.railcards.push(this.createRailcardGroup());
    this.isAdultRailcardSelected = false;
    this.isChildRailcardSelected = false;
    this.isRailcardSelected = false;
    this.isRailcardCountSelected = false;
    this.showRemove = false;
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

  showAdultChildField(railcardName) {
    let railcard = this.railCards.find(item => {
      if (item.Code === railcardName) {
        return true;
      }
    });
    if (railcard != undefined) {
      if (railcard.IsAdultChildShow) {
        this.adultChildVisible = true;
        return true;
      }
    }
    this.adultChildVisible = false;
    return false;

  }

  hideShowAddMoreButton() {
    this.setSearchRequestRailcards();
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      let totalChilds = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
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
    this.amendSearchRequest.RailCardList = new Array<RailCardModel>();
    let formName;
    formName = this.railcards;

    formName.controls.forEach(controls => {
      let railcardModel = new RailCardModel();
      railcardModel.Child = controls.get('railcardChild').value;
      railcardModel.RailCard = controls.get('railcardName').value;
      railcardModel.RailCardCount = controls.get('railcardCount').value;
      railcardModel.Adult = controls.get('railcardAdult').value;
      this.amendSearchRequest.RailCardList.push(railcardModel);
    });

  }

  adultChangeAction(adultCount) {
    if (!this.isAdultActionFresh && this.currentRailcardIndex !== 0) {
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
    if (adultCount < 2) {
      this.isPluralAdult = false;
    }
    else {
      this.isPluralAdult = true;
    }
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
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalAdults = totalAdults + m.Adult;
      });
      if (this.adult < totalAdults) {
        this.isTotalAdultsLess = true;
        this.railcardForm.get('railcardAdult').enable();
        this.railcardForm.get('railcardAdult').setErrors({ 'adultValid': true });
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
    if (childCount < 2) {
      this.isPluralChild = false;
    }
    else {
      this.isPluralChild = true;
    }
    if (!this.isChildActionFresh && this.currentRailcardIndex !== 0) {
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
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalChildren = totalChildren + m.Child;
      });
      if (this.child < totalChildren) {
        this.isTotalChildrenLess = true;
        this.railcardForm.get('railcardChild').enable();
        this.railcardForm.get('railcardChild').setErrors({ 'childValid': true });
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

  onClickLocation(isDeparture, isViaAvoid) {
    let dialogRef = this.dialog.open(StationSelectionPopupComponent, {
      disableClose: true,
      panelClass: ['station-selection', 'old-flow-station-selection-popup'],
      data: {
        DepartureLocation: this.DepartureLocation,
        DepartureLocationName: this.DepartureLocationName,
        ArrivalLocation: this.ArrivalLocation,
        ArrivalLocationName: this.ArrivalLocationName,
        PathConstraintLocation: this.PathConstraintLocation,
        locations: this.locations,
        isDeparture: isDeparture,
        isViaAvoid: isViaAvoid,
        isVia: this.qttForm.get('pathConstraintType').value === 'VIA' ? true : false,
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
        }
        else if (!isDeparture && isViaAvoid) {
          this.qttForm.get('pathConstraintLocation').setValue(this.findLocation(this.PathConstraintLocation));
        }
        else {
          this.qttForm.get('arrivalLocationName').setValue(this.ArrivalLocationName);
        }
      }
    });
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

  onPathConstraintChange(event, _num) {
    if (event.value != "") {
      this.qttForm.get('pathConstraintLocation').setValidators([Validators.required, stationNameValidator(this.sharedService.locationMasterData)]);
      this.qttForm.get('pathConstraintLocation').updateValueAndValidity();
      this.qttForm.get('pathConstraintLocation').enable();
    }
    else {
      this.qttForm.get('pathConstraintLocation').setValidators(null);
      this.qttForm.get('pathConstraintLocation').setErrors(null);
      this.qttForm.get('pathConstraintLocation').setValue('');
      this.qttForm.get('pathConstraintLocation').disable();
    }
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

  onClose() {
    this.sharedService.isDisabledContinue.next(false);
    this.sharedService.isFilterClicked = false;
    if (this.railcardBackup.length == 0) {
      this.amendSearchRequest.RailCardList = new Array<RailCardModel>();
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
  }

  closeRailcard() {
    this.railcardForm.get('railcardAdult').setErrors(null);
    this.railcardForm.get('railcardChild').setErrors(null);
    this.hiderailcard = !this.hiderailcard;
  }

  applyChanges() {
    this.sharedService.isDisabledContinue.next(false);
    this.sharedService.clearAmendSearch()
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);
    this.sharedService.isAmendSearchOpen = false;
    this.result = this.amendSearchRequest;
    this.result.RailCardList = new Array<RailCardModel>();
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
      this.railcards.controls.forEach(controls => {
        let railcardModel = new RailCardModel();
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
        this.sharedService.amendSearchRequest = this.result;
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
      this.result.TravelSolutionDirection = 'ONE_WAY';
    }
  }

  setReturnDateData() {
    if (this.qttForm.get('returnDateTime').value != null && this.qttForm.get('returnDateTime').value !== "") {
      if (this.qttForm.get('returnDateTime').value == "Open Return") {
        this.result.IsReturnRequest = false;
        this.result.TravelSolutionDirection = 'OPEN_RETURN';
      }
      else {
        this.result.ReturnTimesStart = this.ReturnTimesStart != undefined ? this.ReturnTimesStart : this.result.ReturnTimesStart;
        //Added a property so on earlier/later editQtt input dates do not change
        this.sharedService.editQttReturnTimeStart = this.ReturnTimesStart != undefined ? this.ReturnTimesStart : this.result.ReturnTimesStart;
        this.result.TraveltypeReturn = this.TraveltypeReturn != undefined ? this.TraveltypeReturn : this.result.TraveltypeReturn;
        this.result.IsReturnRequest = true;
        this.result.TravelSolutionDirection = 'RETURN';
      }
    }
    else {
      this.result.IsReturnRequest = false;
      this.result.TravelSolutionDirection = 'ONE_WAY';
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

  convertDateTime(queryDate: any, queryTime: any) {
    let actualTime = queryTime.split(':');
    let dateString;
    dateString = moment(queryDate).add(actualTime[0], 'hours').add(actualTime[1], 'minutes').format('YYYY-MM-DDTHH:mm');
    return dateString;
  }

  shownewamnd() {
    this.newAmend = !this.newAmend;
  }
  hidenewamnd() {
    this.newAmend = !this.newAmend;
  }

  showviaavoid() {
    this.hideviaavoid = !this.hideviaavoid;
    this.showPathConstraint = false;
    this.backupPathConstraintType = this.qttForm.get('pathConstraintType').value;
    this.backupPathConstraintLocation = this.qttForm.get('pathConstraintLocation').value;
  }

  onCloseViaAvoid() {
    this.hideviaavoid = !this.hideviaavoid;
    this.qttForm.get('pathConstraintType').setValue(this.backupPathConstraintType);
    this.qttForm.get('pathConstraintLocation').setValue(this.backupPathConstraintLocation);
    this.amendSearchRequest.PathConstraintLocation = this.findLocationCode(this.backupPathConstraintLocation);
    if (this.amendSearchRequest.PathConstraintLocation != 0) {
      this.showPathConstraint = true;
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

  pastDepart: boolean = false;
  pastReturn: boolean = false;
  isReturnExceedStart: boolean = false;
  showDatepickerPopup(isDepart) {
    let dialogRef = this.dialog.open(DatepickerPopupComponent, {
      disableClose: false,
      panelClass: ['datepicker-info', 'old-flow-datepicker-info-popup'],
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
      if (result != null) {
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
      if (this.qttForm != undefined && this.qttForm.get('returnDateTime').value != "" && this.qttForm.get('returnDateTime').value != undefined && this.qttForm.get('returnDateTime').value != null && this.qttForm.get('returnDateTime').value !== "Open Return") {
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
      this.qttForm.get('returnDateTime').setValue('Open Return');
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

  // select box
  getSelectedValue(status: boolean, value: string) {
    if (status) {
      this.checkedList.push(value);
    } else {
      let index = this.checkedList.indexOf(value);
      this.checkedList.splice(index, 1);
    }

    this.currentSelected = { checked: status, name: value };
  }
  
  shareIndividualCheckedList(item: {}) {
    console.log(item);
  }
  // select box


  increment() {
    this.count++;
    this.qttForm.get('adultCount').setValue(this.count);
    this.adultChangeAction(this.count);
  }
  decrement() {
    if (this.count != 0){
      this.count--;
      this.qttForm.get('adultCount').setValue(this.count);
      this.adultChangeAction(this.count);
    }
  }
  increment2() {
    this.count2++;
    this.qttForm.get('childCount').setValue(this.count2);
    this.childChangeAction(this.count2);
  }
  decrement2() {
    if (this.count2 != 0){
      this.count2--;
      this.qttForm.get('childCount').setValue(this.count2);
      this.childChangeAction(this.count2);
    }
  }

  checkCountOfAdultAndChild(selectedRailcardName, AdultValue, ChildValue) {
    this.railCards.forEach(item => {
      if (item.Code === selectedRailcardName) {
        if (this.showAdultChildField(this.railcardForm.get('railcardName').value)) {
          if ((item.MinAdult <= AdultValue && item.MinChild <= ChildValue) && ((item.MaxAdult * this.railcardCount) >= AdultValue && (item.MaxChild * this.railcardCount) >= ChildValue)) {
            this.railCardValueChange = false;
          } else {
            this.railCardValueChange = true;
          }
        } else {
          this.railCardValueChange = false;
        }
      }
    });
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
    this.railcardForm.get('railcardChild').setValue(this.railcardAdult);
    this.childChangeRailcards(this.railcards.length - 1, this.railcardChild, true);
    this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
  }
  decrementRailcardChild() {
    if (this.railcardChild != 0){
      this.railcardChild--;
      this.railcardForm.get('railcardChild').setValue(this.railcardAdult);
      this.childChangeRailcards(this.railcards.length - 1, this.railcardChild, true);
      this.checkCountOfAdultAndChild(this.railcardForm.get('railcardName').value, this.railcardForm.get('railcardAdult').value, this.railcardChild);
    }
  }
  clearDate() {
    const ctrlValue = this.qttForm.controls['returnDateTime'];
    ctrlValue.setValue(null);
    this.isReturnExceedStart = false;
    this.pastReturn = false;
  }

  //keyboard navigation
  handleKeyup($event, value: string) {
    if ($event.keyCode === 32) { // spacebar
      if (value === 'goingTo') this.onClickLocation(false, false)
      else if (value === 'leaveFrom') this.onClickLocation(true, false)
      else if (value === 'return') this.showDatepickerPopup(false)
      else if (value === 'station') this.onClickLocation(false, true)
      else this.showDatepickerPopup(true);
    }
  }
}
