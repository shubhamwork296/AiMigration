import { Component, Injector, OnInit } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import * as moment from 'moment';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { CommonServices } from 'src/app/services/common.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { railcardPerPassengerValidator } from 'src/app/utility/custom-validations/passenger-railcard-validation';
import { pastTimeValidator } from 'src/app/utility/custom-validations/past-time-validation';
import { passengerCountValidator } from 'src/app/utility/custom-validations/Passenger-count-validation';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { returnTimeValidator } from 'src/app/utility/custom-validations/return-time-validation';
import { Router } from '@angular/router';
import { adultValidator } from 'src/app/utility/custom-validations/adult-validation';
import { RailCardList } from 'src/app/models/master/railcard-master.model';
import { childValidator } from 'src/app/utility/custom-validations/child-validation';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import { NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { formatDate } from '@angular/common';
import { adultChildSetters } from 'src/app/utility/custom-validations/adult-child- count';
import { AppRouteEnum } from 'src/app/utility/app-constants.service';
import { stationNameValidator } from 'src/app/utility/custom-validations/station-name-validation';
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
    selector: 'app-amend-search',
    templateUrl: './amend-search.component.html',
    styleUrls: ['./amend-search.component.css'],
    providers: [
        { provide: DateAdapter, useClass: PickDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS }
    ],
    standalone: false
})

export class AmendSearchComponent implements OnInit {

  returnTravelType: string;
  routeOption: string = 'Via';
  timeList: any = [];
  startingTime: number = 0;
  medians: any = ['AM', 'PM'];
  minDate: Date = new Date();
  maxDate: Date = moment(this.minDate).add(6, 'months').toDate();
  maxDateSeason: Date = moment(this.minDate).add(14, 'days').toDate();
  minEndDate: Date;
  maxEndDate: Date;
  counts = Array.from(Array(10).keys());
  countsRailcard = Array.from(Array(9).keys()).map(i => i + 1);
  countsSeason = Array.from(Array(2).keys());
  countsSeasonRailcard = Array.from(Array(1).keys()).map(i => i + 1);
  prepopulatedTime: any;
  prepopulatedDate: any;
  prepopulatedTimeReturn: any;
  prepopulatedDateReturn: any;
  amendSearchRequest: SearchRequestModel;
  railCards = [{ code: 'TSU', name: '16-17 Saver' },
  { code: 'YNG', name: '16-25 Railcard' },
  { code: 'TST', name: '26-30 Railcard' },
  { code: 'NGC', name: 'Annual Gold Card' },
  { code: 'CRC', name: 'Cambrian Railcard' },
  { code: 'CTD', name: 'Cotswold Line Railcard' },
  { code: 'DRD', name: 'Dales Railcard' },
  { code: 'DCR', name: 'Devon & Cornwall Railcard' },
  { code: 'DIC', name: 'Disabled Child Railcard' },
  { code: 'DIS', name: 'Disabled Persons Railcard' },
  { code: 'EVC', name: 'Esk Valley Railcard' },
  { code: 'FAM', name: 'Family & Friends Railcard' },
  { code: 'GS3', name: 'GroupSave Discount' },
  { code: 'HOW', name: 'Heart of Wales Railcard' },
  { code: 'HRC', name: 'Highland Railcard : North Scotland' },
  { code: 'WHC', name: 'Highland Railcard : West Scotland' },
  { code: 'HMF', name: 'HM Forces Railcard' },
  { code: 'JCP', name: 'Jobcentre Plus Travel Discount' },
  { code: 'CUR', name: 'My Cumbria Card' },
  { code: 'NEW', name: 'Network Railcard' },
  { code: 'PBR', name: 'Pembrokeshire Railcard' },
  { code: 'STL', name: 'Season Loyalty Discount' },
  { code: 'SRN', name: 'Senior Railcard' },
  { code: 'SSP', name: 'South Yorkshire Student Pass' },
  { code: 'SYD', name: 'SY Concession Disabled' },
  { code: 'SYS', name: 'SY Concession Senior' },
  { code: '2TR', name: 'Two Together Railcard' },
  { code: 'VLS', name: 'Valleys Senior Railcard' },
  { code: 'VLC', name: 'Valleys Student Railcard' },
  { code: 'VET', name: 'Veterans Railcard' },
  { code: 'WYD', name: 'West Yorkshire Disabled Concessionary Discount' },
  { code: 'WYS', name: 'West Yorkshire Senior Concessionary Discount' },
  { code: 'WGC', name: 'WG Concession Bus Pass' },
  { code: 'WMS', name: 'WY Student Pass' },
  { code: 'SRY', name: 'Young Scot National Entitlement Card' },
  ];
  railCardsSeasonList = [
    { code: 'TSU', name: '16-17 Saver' },
  ];
  qttFormSingle: FormGroup;
  qttFormReturn: FormGroup;
  qttFormOpenReturn: FormGroup;
  qttFormSeason: FormGroup;
  qttFormFlexi: FormGroup;

  adultSingle: number = 0;
  childSingle: number = 0;
  railcardsSingle: FormArray;
  railcardsSeason: FormArray;
  adultReturn: number;
  childReturn: number;
  adultSeason: number;
  childSeason: number;
  railcardsReturn: FormArray;
  adultOpenReturn: number;
  childOpenReturn: number;
  tabIndex: number;
  checkReturnType: boolean = false;
  isTypeselectedSingle: boolean = true;
  railcardsOpenReturn: FormArray;
  isAmendFresh: boolean;
  isSeason: boolean = false;
  isFlexi: boolean = false;
  railCardList: RailCardList;
  isPluralAdultSingle: boolean = false;
  isPluralAdultReturn: boolean = false;
  isPluralAdultSeason: boolean = false;
  isPluralAdultOpenReturn: boolean = false;

  isPluralChildSingle: boolean = false;
  isPluralChildReturn: boolean = false;
  isPluralChildSeason: boolean = false;
  isPluralChildOpenReturn: boolean = false;
  seasonDisable: boolean = false;
  isCustomChecked: boolean = false;
  showEndDate: boolean = false;
  railcardBackup: RailCardModel[];
  totalRaicardCount: number = 0;
  totalRaicardCountReturn: number = 0;
  totalRaicardCountOpenReturn: number = 0;

  spinnerService: NgxSpinnerService;
  activeModal: NgbActiveModal;
  sharedService: SharedService;
  modalService: NgbModal;
  commonServices: CommonServices;
  router: Router;
  appRouteEnum: AppRouteEnum;
  dataLayerService: DataLayerService;
  ga4dataLayerService: GA4DatalayerService;


  constructor(private readonly formbuilder: FormBuilder, private readonly injector: Injector) {
    // Dependency Injection without using constructor's param
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.activeModal = this.injector.get(NgbActiveModal);
    this.sharedService = this.injector.get(SharedService);
    this.modalService = this.injector.get(NgbModal);
    this.commonServices = this.injector.get(CommonServices);
    this.router = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);

    let halfHourlyDivisionOfDays = 24 * 2;
    for (let i = 0; i < halfHourlyDivisionOfDays; i++) {
      let hh = Math.floor(this.startingTime / 60);
      let mm = (this.startingTime % 60);
      this.timeList[i] = ("0" + hh).slice(-2) + ':' + ("0" + mm).slice(-2);
      this.startingTime += 30;
    }
  }

  filteredDeparturesSingle: Observable<LocationMasterData[]>;
  filteredArrivalsSingle: Observable<LocationMasterData[]>;
  filteredStationsSingle: Observable<LocationMasterData[]>;

  filteredDeparturesReturn: Observable<LocationMasterData[]>;
  filteredArrivalsReturn: Observable<LocationMasterData[]>;
  filteredStationsReturn: Observable<LocationMasterData[]>;

  filteredDeparturesOpenReturn: Observable<LocationMasterData[]>;
  filteredArrivalsOpenReturn: Observable<LocationMasterData[]>;
  filteredStationsOpenReturn: Observable<LocationMasterData[]>;

  filteredDeparturesSeason: Observable<LocationMasterData[]>;
  filteredArrivalsSeason: Observable<LocationMasterData[]>;
  filteredStationsSeason: Observable<LocationMasterData[]>;

  filteredDeparturesFlexi: Observable<LocationMasterData[]>;
  filteredArrivalsFlexi: Observable<LocationMasterData[]>;

  responseData: ResponseData;
  locations: LocationMasterData[];


  status: boolean = false;
  clickEvent() {
    this.status = !this.status;
  }

  passengersCountSingle: any;
  passengersCountReturn: any;
  passengersCountOpenReturn: any;
  passengersCountSeason: any;

  ngOnInit() {
    this.railcardBackup = this.amendSearchRequest.RailCardList;
    this.totalRaicardCount = this.amendSearchRequest.RailCardList.length;
    this.totalRaicardCountReturn = this.totalRaicardCount;
    this.totalRaicardCountOpenReturn = this.totalRaicardCount;
    this.isAmendFresh = this.sharedService.isAmendFresh;
    this.commonServices.loaderRequired = false;
    if (this.amendSearchRequest.TravelSolutionDirection == "SEASON") {
      this.isSeason = true;
      if (this.amendSearchRequest.IsCustom) {
        this.minEndDate = moment(this.amendSearchRequest.DepartureTimesStart).add(1, 'days').add(1, 'months').toDate();
        this.maxEndDate = moment(this.amendSearchRequest.DepartureTimesStart).add(12, 'months').toDate();
        this.showEndDate = true;
      }
    }
    else if (this.amendSearchRequest.TravelSolutionDirection == "FLEXI") {
      this.isFlexi = true;
    }

    this.ngOnInitNotSeasonAndNotFlexi();

    this.createForms();

    if (!this.isSeason && !this.isFlexi) {
      this.railcardsSingle = this.qttFormSingle.get('railcardsSingle') as FormArray;
      this.railcardsReturn = this.qttFormReturn.get('railcardsReturn') as FormArray;
      this.railcardsOpenReturn = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    }
    if (this.sharedService.locationMasterData.length > 0) {
      this.locations = this.sharedService.locationMasterData;
      this.initializeFormData();
    }
    else {

      this.getLocations();
    }
  }

  ngOnInitNotSeasonAndNotFlexi() {
    if (!this.isSeason && !this.isFlexi) {
      if (this.amendSearchRequest.TravelSolutionDirection == "ONE_WAY") {
        if (this.sharedService.addReturnTabIndex) {
          this.tabIndex = 1;
          this.sharedService.addReturnTabIndex = null;
        }
        else {
          this.tabIndex = 0;
        }
      }
      else if (this.amendSearchRequest.TravelSolutionDirection == "RETURN") {
        this.tabIndex = 1;
      }
      else {
        this.tabIndex = 2;
      }
      this.adultSingle = this.amendSearchRequest.Adult;
      this.childSingle = this.amendSearchRequest.Child;
      this.adultReturn = this.amendSearchRequest.Adult;
      this.childReturn = this.amendSearchRequest.Child;
      this.adultOpenReturn = this.amendSearchRequest.Adult;
      this.childOpenReturn = this.amendSearchRequest.Child;
      this.returnTravelType = this.amendSearchRequest.TraveltypeReturn ? this.amendSearchRequest.TraveltypeReturn : 'DEPARTAFTER';

      //For railcards
      this.adultsForRailcards = this.adultSingle;
      this.adultForRailcardCount = this.adultsForRailcards;
      this.childsForRailcards = this.childSingle;
      this.childForRailcardCount = this.childsForRailcards;
      this.adultsForRailcardsReturn = this.adultReturn;
      this.adultForRailcardCountReturn = this.adultsForRailcardsReturn;
      this.childsForRailcardsReturn = this.childReturn;
      this.childForRailcardCountReturn = this.childsForRailcardsReturn;
      this.adultsForRailcardsOpenReturn = this.adultOpenReturn;
      this.adultForRailcardCountOpenReturn = this.adultsForRailcardsOpenReturn;
      this.childsForRailcardsOpenReturn = this.childOpenReturn;
      this.childForRailcardCountOpenReturn = this.childsForRailcardsOpenReturn;

      let requestedTime = moment(this.amendSearchRequest.DepartureTimesStart).format("HH:mm:ss");
      let tempTime = requestedTime.split(':');
      this.prepopulatedTime = tempTime[0] + ':' + tempTime[1];

      if (this.amendSearchRequest.IsReturnRequest) {
        let requestedTimeReturn = moment(this.amendSearchRequest.ReturnTimesStart).format("HH:mm:ss");
        let tempTimeReturn = requestedTimeReturn.split(':');
        this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
      }
      this.prepopulatedDate = moment(this.amendSearchRequest.DepartureTimesStart).format('YYYY-MM-DD');
      this.prepopulatedDateReturn = moment(this.amendSearchRequest.ReturnTimesStart).format('YYYY-MM-DD');
      this.passengersCountSingle = this.adultSingle + this.childSingle;
      this.passengersCountReturn = this.adultReturn + this.childReturn;
      this.passengersCountOpenReturn = this.adultOpenReturn + this.childOpenReturn;
    }
  }

  onDateChangeSingle(event) {
    this.qttFormSingle.get('startTimeSingle').setValidators([Validators.required, pastTimeValidator(event.target.value)]);
    this.qttFormSingle.get('startTimeSingle').updateValueAndValidity();
  }
  onDateChangeReturn(event) {
    this.qttFormReturn.get('startTimeReturn').setValidators([Validators.required, pastTimeValidator(event.target.value)]);
    this.qttFormReturn.get('startTimeReturn').updateValueAndValidity();
    this.qttFormReturn.get('returnTimeReturn').setValidators([Validators.required, pastTimeValidator(this.qttFormReturn.get('returnDateReturn').value), returnTimeValidator(this.qttFormReturn.get('returnDateReturn').value, event.target.value, this.qttFormReturn.get('startTimeReturn').value)]);
    this.qttFormReturn.get('returnTimeReturn').updateValueAndValidity();
  }
  onDateChangeOpenReturn(event) {
    this.qttFormOpenReturn.get('startTimeOpenReturn').setValidators([Validators.required, pastTimeValidator(event.target.value)]);
    this.qttFormOpenReturn.get('startTimeOpenReturn').updateValueAndValidity();
  }
  onReturnDateChangeReturn(event) {
    this.qttFormReturn.get('returnTimeReturn').setValidators([Validators.required, pastTimeValidator(event.target.value), returnTimeValidator(event.target.value, this.qttFormReturn.get('startDateReturn').value, this.qttFormReturn.get('startTimeReturn').value)]);
    this.qttFormReturn.get('returnTimeReturn').updateValueAndValidity();
  }
  onStartTimeReturnChange(event) {
    this.qttFormReturn.get('returnTimeReturn').setValidators([Validators.required, pastTimeValidator(this.qttFormReturn.get('returnDateReturn').value), returnTimeValidator(this.qttFormReturn.get('returnDateReturn').value, this.qttFormReturn.get('startDateReturn').value, event.value)]);
    this.qttFormReturn.get('returnTimeReturn').updateValueAndValidity();
  }
  onReturnTimeReturnChange() {
    this.qttFormReturn.get('returnTimeReturn').setValidators([Validators.required, pastTimeValidator(this.qttFormReturn.get('returnDateReturn').value), returnTimeValidator(this.qttFormReturn.get('returnDateReturn').value, this.qttFormReturn.get('startDateReturn').value, this.qttFormReturn.get('startTimeReturn').value)]);
    this.qttFormReturn.get('returnTimeReturn').updateValueAndValidity();
  }
  onStartDateChangeSeason() {
    this.minEndDate = moment(this.qttFormSeason.get('startDateSeason').value).add(1, 'days').add(1, 'months').toDate();
    this.maxEndDate = moment(this.qttFormSeason.get('startDateSeason').value).add(12, 'months').toDate();
    this.qttFormSeason.get('endDateSeason').patchValue(this.minEndDate);
    this.onEndDateChangeSeason();
  }
  onEndDateChangeSeason() {
    if (this.qttFormSeason.get('startDateSeason').value >= this.qttFormSeason.get('endDateSeason').value &&
      this.qttFormSeason.get('seasonType.custom').value) {
      this.isCustomChecked = true;
      this.seasonDisable = true;
    }
    else {
      this.isCustomChecked = false;
      this.seasonDisable = false;
    }
  }
  createForms() {
    if (this.isSeason) {
      this.qttFormSeason = this.formbuilder.group({
        seasonType: new FormGroup({
          weekly: new FormControl(''),
          flexi: new FormControl(''),
          monthly: new FormControl(''),
          annual: new FormControl(''),
          custom: new FormControl(''),
        }, [Validators.required]),
        departureSeason: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        arrivalSeason: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        pathConstraintTypeSeason: new FormControl(''),
        pathConstraintLocationSeason: new FormControl({ value: "", disabled: this.isAmendFresh }),
        startDateSeason: new FormControl('', [Validators.required]),
        endDateSeason: new FormControl({ value: "", disabled: this.amendSearchRequest.IsCustom ? false : true }),
        passengerSeason: new FormControl('', [Validators.required]),
        railcardsSeason: new FormControl({ value: "", disabled: this.amendSearchRequest.Child == 0 ? false : true })
      });
    }
    else if (this.isFlexi) {
      this.qttFormFlexi = this.formbuilder.group({
        departureFlexi: new FormControl('', [Validators.required]),
        arrivalFlexi: new FormControl('', [Validators.required]),
        passengerFlexi: new FormControl('', [Validators.required])
      });
    }
    else {
      this.qttFormSingle = this.formbuilder.group({
        departureLocationNameSingle: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        arrivalLocationNameSingle: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        pathConstraintTypeSingle: new FormControl(''),
        pathConstraintLocationSingle: new FormControl({ value: "", disabled: this.isAmendFresh }, [stationNameValidator(this.sharedService.locationMasterData)]),
        startDateSingle: new FormControl('', [Validators.required]),
        travelTypeSingle: new FormControl('', [Validators.required]),
        startTimeSingle: new FormControl('', [Validators.required, pastTimeValidator(this.prepopulatedDate)]),
        adultCountSingle: new FormControl('', [passengerCountValidator(this.adultSingle, this.childSingle)]),
        childCountSingle: new FormControl('', [passengerCountValidator(this.adultSingle, this.childSingle)]),
        railcardsSingle: this.formbuilder.array([this.createRailcardGroupSingle()])
      });

      this.qttFormReturn = this.formbuilder.group({
        departureLocationNameReturn: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        arrivalLocationNameReturn: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        pathConstraintTypeReturn: new FormControl(''),
        pathConstraintLocationReturn: new FormControl({ value: "", disabled: this.isAmendFresh }, [stationNameValidator(this.sharedService.locationMasterData)]),
        startDateReturn: new FormControl('', [Validators.required]),
        travelTypeReturn: new FormControl('', [Validators.required]),
        startTimeReturn: new FormControl('', [Validators.required, pastTimeValidator(this.prepopulatedDate)]),
        adultCountReturn: new FormControl('', [passengerCountValidator(this.adultReturn, this.childReturn)]),
        childCountReturn: new FormControl('', [passengerCountValidator(this.adultReturn, this.childReturn)]),
        railcardsReturn: this.formbuilder.array([this.createRailcardGroupReturn()]),
        returnDateReturn: new FormControl('', [Validators.required]),
        returnTravelTypeReturn: new FormControl('', [Validators.required]),
        returnTimeReturn: new FormControl('', [Validators.required, pastTimeValidator(this.prepopulatedDateReturn), returnTimeValidator(this.prepopulatedDateReturn, this.prepopulatedDate, this.prepopulatedTime)])
      });

      this.qttFormOpenReturn = this.formbuilder.group({
        departureLocationNameOpenReturn: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        arrivalLocationNameOpenReturn: new FormControl('', [Validators.required, stationNameValidator(this.sharedService.locationMasterData)]),
        pathConstraintTypeOpenReturn: new FormControl(''),
        pathConstraintLocationOpenReturn: new FormControl({ value: "", disabled: this.isAmendFresh }, [stationNameValidator(this.sharedService.locationMasterData)]),
        startDateOpenReturn: new FormControl('', [Validators.required]),
        travelTypeOpenReturn: new FormControl('', [Validators.required]),
        startTimeOpenReturn: new FormControl('', [Validators.required, pastTimeValidator(this.prepopulatedDate)]),
        adultCountOpenReturn: new FormControl('', [passengerCountValidator(this.adultOpenReturn, this.childOpenReturn)]),
        childCountOpenReturn: new FormControl('', [passengerCountValidator(this.adultOpenReturn, this.childOpenReturn)]),
        railcardsOpenReturn: this.formbuilder.array([this.createRailcardGroupOpenReturn()])
      });

    }
  }

  initializeForms() {
    if (this.isSeason) {
      this.qttFormSeason.get('seasonType').patchValue({
        weekly: this.amendSearchRequest.IsWeekly,
        flexi: this.amendSearchRequest.IsFlexi,
        monthly: this.amendSearchRequest.IsMonthly,
        annual: this.amendSearchRequest.IsAnnual,
        custom: this.amendSearchRequest.IsCustom
      });
      this.qttFormSeason.patchValue({
        departureSeason: this.findLocation(this.amendSearchRequest.DepartureLocation),
        arrivalSeason: this.findLocation(this.amendSearchRequest.ArrivalLocation),
        pathConstraintTypeSeason: this.amendSearchRequest.PathConstraintType,
        pathConstraintLocationSeason: this.findLocation(this.amendSearchRequest.PathConstraintLocation),
        startDateSeason: moment(this.amendSearchRequest.DepartureTimesStart).format('YYYY-MM-DD'),
        endDateSeason: this.amendSearchRequest.IsCustom ? moment(this.amendSearchRequest.TravelEndDate).format('YYYY-MM-DD') : "",
        passengerSeason: this.amendSearchRequest.Adult ? "Adult" : "Child",
        railcardsSeason: this.amendSearchRequest.RailCardList.length ? this.amendSearchRequest.RailCardList[0].RailCard : ""
      });


    }
    else if (this.isFlexi) {
      this.qttFormFlexi.patchValue({
        departureFlexi: this.findLocation(this.amendSearchRequest.DepartureLocation),
        arrivalFlexi: this.findLocation(this.amendSearchRequest.ArrivalLocation),
        passengerFlexi: this.amendSearchRequest.Adult ? "Adult" : "Child"
      });
    }
    else {
      this.initializeFormsNotSeasonAndNotFlexi();
    }
  }

  initializeFormsNotSeasonAndNotFlexi() {
    this.qttFormSingle.patchValue({
      departureLocationNameSingle: this.findLocation(this.amendSearchRequest.DepartureLocation),
      arrivalLocationNameSingle: this.findLocation(this.amendSearchRequest.ArrivalLocation),
      pathConstraintTypeSingle: this.amendSearchRequest.PathConstraintType,
      pathConstraintLocationSingle: this.findLocation(this.amendSearchRequest.PathConstraintLocation),
      travelTypeSingle: this.amendSearchRequest.Traveltype,
      startTimeSingle: this.prepopulatedTime,
      startDateSingle: this.prepopulatedDate,
      adultCountSingle: this.amendSearchRequest.Adult,
      childCountSingle: this.amendSearchRequest.Child,
    });

    //Railcard for Single initialize
    let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
    if (this.amendSearchRequest.RailCardList.length != 0) {
      arrayControl.clear();
      this.amendSearchRequest.RailCardList.forEach(railcard => {
        arrayControl.push(this.formbuilder.group({
          railcardName: railcard.RailCard,
          railcardCount: railcard.RailCardCount,
          railcardAdult: railcard.Adult,
          railcardChild: railcard.Child
        }));
        this.showAdultChildField(railcard.RailCard);
      });
      if (this.railcardsSingle.length >= 1) {
        this.showRemoveSingle = true;
        this.isRailcardSelectedSingle = true;
        this.isAdultRailcardSelected = true;
        this.isChildRailcardSelected = true;
        this.isRailcardCountSelectedSingle = true;
        this.railcardCompleted = true;
        this.currentRailcardIndex = this.amendSearchRequest.RailCardList.length - 1;
        this.selectedAdultsRailcard = this.amendSearchRequest.RailCardList[this.currentRailcardIndex].Adult;
        this.selectedChildsRailcard = this.amendSearchRequest.RailCardList[this.currentRailcardIndex].Child;
        this.hideShowAddMoreButton(1);
      }
    }

    this.qttFormReturn.patchValue({
      departureLocationNameReturn: this.findLocation(this.amendSearchRequest.DepartureLocation),
      arrivalLocationNameReturn: this.findLocation(this.amendSearchRequest.ArrivalLocation),
      pathConstraintTypeReturn: this.amendSearchRequest.PathConstraintType,
      pathConstraintLocationReturn: this.findLocation(this.amendSearchRequest.PathConstraintLocation),
      travelTypeReturn: this.amendSearchRequest.Traveltype,
      startTimeReturn: this.prepopulatedTime,
      startDateReturn: this.prepopulatedDate,
      adultCountReturn: this.amendSearchRequest.Adult,
      childCountReturn: this.amendSearchRequest.Child,
      returnDateReturn: this.prepopulatedDateReturn == "Invalid date" ? null : this.prepopulatedDateReturn,
      returnTravelTypeReturn: this.amendSearchRequest.TraveltypeReturn,
      returnTimeReturn: this.prepopulatedTimeReturn,
    });

    //Railcard for Return Initialize
    let arrayControlReturn = this.qttFormReturn.get('railcardsReturn') as FormArray;
    if (this.amendSearchRequest.RailCardList.length != 0) {
      arrayControlReturn.clear();
      this.amendSearchRequest.RailCardList.forEach(railcard => {
        arrayControlReturn.push(this.formbuilder.group({
          railcardName: railcard.RailCard,
          railcardCount: railcard.RailCardCount,
          railcardAdult: railcard.Adult,
          railcardChild: railcard.Child
        }));
        this.showAdultChildFieldReturn(railcard.RailCard);
      });
      if (this.railcardsReturn.length >= 1) {
        this.showRemoveReturn = true;
        this.isRailcardSelectedReturn = true;
        this.isAdultRailcardSelectedReturn = true;
        this.isChildRailcardSelectedReturn = true;
        this.isRailcardCountSelectedReturn = true;
        this.railcardCompletedReturn = true;
        this.currentRailcardIndexReturn = this.amendSearchRequest.RailCardList.length - 1;
        this.selectedAdultsRailcardReturn = this.amendSearchRequest.RailCardList[this.currentRailcardIndexReturn].Adult;
        this.selectedChildsRailcardReturn = this.amendSearchRequest.RailCardList[this.currentRailcardIndexReturn].Child;
        this.hideShowAddMoreButton(2);
      }
    }

    this.qttFormOpenReturn.patchValue({
      departureLocationNameOpenReturn: this.findLocation(this.amendSearchRequest.DepartureLocation),
      arrivalLocationNameOpenReturn: this.findLocation(this.amendSearchRequest.ArrivalLocation),
      pathConstraintTypeOpenReturn: this.amendSearchRequest.PathConstraintType,
      pathConstraintLocationOpenReturn: this.findLocation(this.amendSearchRequest.PathConstraintLocation),
      travelTypeOpenReturn: this.amendSearchRequest.Traveltype,
      startTimeOpenReturn: this.prepopulatedTime,
      startDateOpenReturn: this.prepopulatedDate,
      adultCountOpenReturn: this.amendSearchRequest.Adult,
      childCountOpenReturn: this.amendSearchRequest.Child
    });

    //Railcard for Open Return Initialize
    let arrayControlOpenReturn = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    if (this.amendSearchRequest.RailCardList.length != 0) {
      arrayControlOpenReturn.clear();
      this.amendSearchRequest.RailCardList.forEach(railcard => {
        arrayControlOpenReturn.push(this.formbuilder.group({
          railcardName: railcard.RailCard,
          railcardCount: railcard.RailCardCount,
          railcardAdult: railcard.Adult,
          railcardChild: railcard.Child
        }));
        this.showAdultChildFieldOpenReturn(railcard.RailCard);
      });
      if (this.railcardsOpenReturn.length >= 1) {
        this.showRemoveOpenReturn = true;
        this.isRailcardSelectedOpenReturn = true;
        this.isAdultRailcardSelectedOpenReturn = true;
        this.isChildRailcardSelectedOpenReturn = true;
        this.isRailcardCountSelectedOpenReturn = true;
        this.railcardCompletedOpenReturn = true;
        this.currentRailcardIndexOpenReturn = this.amendSearchRequest.RailCardList.length - 1;
        this.selectedAdultsRailcardOpenReturn = this.amendSearchRequest.RailCardList[this.currentRailcardIndexOpenReturn].Adult;
        this.selectedChildsRailcardOpenReturn = this.amendSearchRequest.RailCardList[this.currentRailcardIndexOpenReturn].Child;
        this.hideShowAddMoreButton(3);
      }
    }
  }

  isRailcardSelectedSingle: boolean = false;
  isRailcardCountSelectedSingle: boolean = false;
  numOfRailcardsSingle: number = 0;
  isRailcardSelectedReturn: boolean = false;
  isRailcardCountSelectedReturn: boolean = false;
  numOfRailcardsReturn: number = 0;
  isRailcardSelectedOpenReturn: boolean = false;
  isRailcardCountSelectedOpenReturn: boolean = false;
  numOfRailcardsOpenReturn: number = 0;
  isRailcardSelectedSeason: boolean = false;
  isRailcardCountSelectedSeason: boolean = false;
  numOfRailcardsSeason: number = 0;
  showGroupTravelLinkSingle: boolean = false;
  showGroupTravelLinkReturn: boolean = false;
  showGroupTravelLinkOpenReturn: boolean = false;


  createRailcardGroupSingle(): FormGroup {
    return this.formbuilder.group({
      railcardName: new FormControl(''),
      railcardCount: new FormControl({ value: 0, disabled: true }),
      railcardAdult: new FormControl({ value: 0, disabled: true }),
      railcardChild: new FormControl({ value: 0, disabled: true })
    });
  }
  createRailcardGroupReturn(): FormGroup {
    return this.createRailcardGroupSingle();
  }
  createRailcardGroupOpenReturn(): FormGroup {
    return this.createRailcardGroupSingle();
  }

  addRailcardSingle(): void {
    this.isRailcardSelectedSingle = false;
    this.isRailcardCountSelectedSingle = false;
    this.isAdultRailcardSelected = false;
    this.isChildRailcardSelected = false;
    this.isRailcardsCountErrorFree = false;
    this.isRailcardsAdultErrorFree = false;
    this.isRailcardsChildErrorFree = false;
    this.railcardsSingle = this.qttFormSingle.get('railcardsSingle') as FormArray;
    this.railcardsSingle.push(this.createRailcardGroupSingle());
  }
  addRailcardReturn(): void {
    this.isRailcardSelectedReturn = false;
    this.isRailcardCountSelectedReturn = false;
    this.isAdultRailcardSelectedReturn = false;
    this.isChildRailcardSelectedReturn = false;
    this.isRailcardsCountErrorFreeReturn = false;
    this.isRailcardsAdultErrorFreeReturn = false;
    this.isRailcardsChildErrorFreeReturn = false;
    this.railcardsReturn = this.qttFormReturn.get('railcardsReturn') as FormArray;
    this.railcardsReturn.push(this.createRailcardGroupReturn());
  }
  addRailcardOpenReturn(): void {
    this.isRailcardSelectedOpenReturn = false;
    this.isRailcardCountSelectedOpenReturn = false;
    this.isAdultRailcardSelectedOpenReturn = false;
    this.isChildRailcardSelectedOpenReturn = false;
    this.isRailcardsCountErrorFreeOpenReturn = false;
    this.isRailcardsAdultErrorFreeOpenReturn = false;
    this.isRailcardsChildErrorFreeOpenReturn = false;
    this.railcardsOpenReturn = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    this.railcardsOpenReturn.push(this.createRailcardGroupOpenReturn());
  }

  removeRailcardSingle(index) {
    let railcardToRemove = this.qttFormSingle.get(['railcardsSingle', index, 'railcardCount']).value;
    let railcardAdultToRemove = this.qttFormSingle.get(['railcardsSingle', index, 'railcardAdult']).value;
    let railcardChildToRemove = this.qttFormSingle.get(['railcardsSingle', index, 'railcardChild']).value;
    let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
    if (this.railcardsSingle.length > 1) {
      this.numOfRailcardsSingle -= railcardToRemove;
      this.adultForRailcardCount += railcardAdultToRemove;
      this.adultsForRailcardAdult += railcardAdultToRemove;
      this.childForRailcardCount += railcardChildToRemove;
      this.childForRailcardChild += railcardChildToRemove;
      this.railcardsSingle.removeAt(index);
    }
    else {
      this.numOfRailcardsSingle -= railcardToRemove;
      this.adultForRailcardCount += railcardAdultToRemove;
      this.adultsForRailcardAdult += railcardAdultToRemove;
      this.childForRailcardCount += railcardChildToRemove;
      this.childForRailcardChild += railcardChildToRemove;
      this.qttFormSingle.controls.railcardsSingle['controls'][index].patchValue({
        railcardName: '',
        railcardCount: 0,
        railcardAdult: 0,
        railcardChild: 0
      });

      arrayControl.controls[index].get('railcardCount').disable();
      arrayControl.controls[index].get('railcardAdult').disable();
      arrayControl.controls[index].get('railcardChild').disable();

      this.isRailcardSelectedSingle = false;
      this.isRailcardCountSelectedSingle = false;
      this.isAdultRailcardSelected = false;
      this.isChildRailcardSelected = false;
      this.isRailcardsCountErrorFree = false;
      this.isRailcardsAdultErrorFree = false;
      this.isRailcardsChildErrorFree = false;
      this.showRemoveSingle = false;
    }
    this.hideShowAddMoreButton(1);
    this.railcardCompleted = true;
    if (arrayControl.controls[0].get('railcardName').value != '') {
      this.totalRaicardCount = arrayControl.length;
    }
    else {
      this.totalRaicardCount = 0;
    }

  }
  removeRailcardReturn(index) {
    let railcardToRemove = this.qttFormReturn.get(['railcardsReturn', index, 'railcardCount']).value;
    let railcardAdultToRemove = this.qttFormReturn.get(['railcardsReturn', index, 'railcardAdult']).value;
    let railcardChildToRemove = this.qttFormReturn.get(['railcardsReturn', index, 'railcardChild']).value;
    let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
    if (this.railcardsReturn.length > 1) {
      this.numOfRailcardsReturn -= railcardToRemove;
      this.adultForRailcardCountReturn += railcardAdultToRemove;
      this.adultsForRailcardAdultReturn += railcardAdultToRemove;
      this.childForRailcardCountReturn += railcardChildToRemove;
      this.childForRailcardChildReturn += railcardChildToRemove;
      this.railcardsReturn.removeAt(index);
    }
    else {
      this.numOfRailcardsReturn -= railcardToRemove;
      this.adultForRailcardCountReturn += railcardAdultToRemove;
      this.adultsForRailcardAdultReturn += railcardAdultToRemove;
      this.childForRailcardCountReturn += railcardChildToRemove;
      this.childForRailcardChildReturn += railcardChildToRemove;
      this.qttFormReturn.controls.railcardsReturn['controls'][index].patchValue({
        railcardName: '',
        railcardCount: 0,
        railcardAdult: 0,
        railcardChild: 0
      });

      arrayControl.controls[index].get('railcardCount').disable();
      arrayControl.controls[index].get('railcardAdult').disable();
      arrayControl.controls[index].get('railcardChild').disable();

      this.isRailcardSelectedReturn = false;
      this.isRailcardCountSelectedReturn = false;
      this.isAdultRailcardSelectedReturn = false;
      this.isChildRailcardSelectedReturn = false;
      this.isRailcardsCountErrorFreeReturn = false;
      this.isRailcardsAdultErrorFreeReturn = false;
      this.isRailcardsChildErrorFreeReturn = false;
      this.showRemoveReturn = false;
    }
    this.hideShowAddMoreButton(2);
    this.railcardCompletedReturn = true;
    if (arrayControl.controls[0].get('railcardName').value != '') {
      this.totalRaicardCountReturn = arrayControl.length;
    }
    else {
      this.totalRaicardCountReturn = 0;
    }
  }
  removeRailcardOpenReturn(index) {
    let railcardToRemove = this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardCount']).value;
    let railcardAdultToRemove = this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardAdult']).value;
    let railcardChildToRemove = this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardChild']).value;
    let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    if (this.railcardsOpenReturn.length > 1) {
      this.numOfRailcardsOpenReturn -= railcardToRemove;
      this.adultForRailcardCountOpenReturn += railcardAdultToRemove;
      this.adultsForRailcardAdultOpenReturn += railcardAdultToRemove;
      this.childForRailcardCountOpenReturn += railcardChildToRemove;
      this.childForRailcardChildOpenReturn += railcardChildToRemove;
      this.railcardsOpenReturn.removeAt(index);
    }
    else {
      this.numOfRailcardsOpenReturn -= railcardToRemove;
      this.adultForRailcardCountOpenReturn += railcardAdultToRemove;
      this.adultsForRailcardAdultOpenReturn += railcardAdultToRemove;
      this.childForRailcardCountOpenReturn += railcardChildToRemove;
      this.childForRailcardChildOpenReturn += railcardChildToRemove;
      this.qttFormOpenReturn.controls.railcardsOpenReturn['controls'][index].patchValue({
        railcardName: '',
        railcardCount: 0,
        railcardAdult: 0,
        railcardChild: 0
      });

      arrayControl.controls[index].get('railcardCount').disable();
      arrayControl.controls[index].get('railcardAdult').disable();
      arrayControl.controls[index].get('railcardChild').disable();

      this.isRailcardSelectedOpenReturn = false;
      this.isRailcardCountSelectedOpenReturn = false;
      this.isAdultRailcardSelectedOpenReturn = false;
      this.isChildRailcardSelectedOpenReturn = false;
      this.isRailcardsCountErrorFreeOpenReturn = false;
      this.isRailcardsAdultErrorFreeOpenReturn = false;
      this.isRailcardsChildErrorFreeOpenReturn = false;
      this.showRemoveOpenReturn = false;
    }
    this.hideShowAddMoreButton(3);
    this.railcardCompletedOpenReturn = true;
    if (arrayControl.controls[0].get('railcardName').value != '') {
      this.totalRaicardCountOpenReturn = arrayControl.length;
    }
    else {
      this.totalRaicardCountOpenReturn = 0;
    }
  }

  onRailcardActionChangeSingle(index) {
    this.isRailcardSelectedSingle = true;
    let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
    arrayControl.controls[index].get('railcardCount').enable();
    this.selectedAdultsRailcard = 0;
    this.selectedChildsRailcard = 0;
    this.isAdultRailcardSelected = false;
    this.isChildRailcardSelected = false;
    this.currentRailcardIndex = index;
    if (this.railcardsSingle.length >= 1) {
      this.showRemoveSingle = true;
    }
    this.totalRaicardCount = arrayControl.length;
    if (!this.showAdultChildField(arrayControl.controls[index].get('railcardName').value)) {
      let railcard = adultChildSetters(arrayControl.controls[index].get('railcardName').value, arrayControl.controls[index].get('railcardCount').value, this.railCards);
      this.selectedAdultsRailcard = railcard[0];
      this.selectedChildsRailcard = railcard[1];
      arrayControl.controls[index].patchValue({
        railcardAdult: railcard[0],
        railcardChild: railcard[1]
      });
      this.adultChangeRailcards(index, null, false);
      this.childChangeRailcards(index, null, false);
    }
  }
  onRailcardActionChangeReturn(index) {
    this.isRailcardSelectedReturn = true;
    let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
    arrayControl.controls[index].get('railcardCount').enable();
    this.selectedAdultsRailcardReturn = 0;
    this.selectedChildsRailcardReturn = 0;
    this.isAdultRailcardSelectedReturn = false;
    this.isChildRailcardSelectedReturn = false;
    this.currentRailcardIndexReturn = index;
    if (this.railcardsReturn.length >= 1) {
      this.showRemoveReturn = true;
    }
    this.totalRaicardCountReturn = arrayControl.length;
    if (!this.showAdultChildFieldReturn(arrayControl.controls[index].get('railcardName').value)) {
      let railcard = adultChildSetters(arrayControl.controls[index].get('railcardName').value, arrayControl.controls[index].get('railcardCount').value, this.railCards);
      this.selectedAdultsRailcardReturn = railcard[0];
      this.selectedChildsRailcardReturn = railcard[1];
      arrayControl.controls[index].patchValue({
        railcardAdult: railcard[0],
        railcardChild: railcard[1]
      });
      this.adultChangeRailcardsReturn(index, null, false);
      this.childChangeRailcardsReturn(index, null, false);
    }


  }
  onRailcardActionChangeOpenReturn(index) {
    this.isRailcardSelectedOpenReturn = true;
    let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    arrayControl.controls[index].get('railcardCount').enable();
    this.selectedAdultsRailcardOpenReturn = 0;
    this.selectedChildsRailcardOpenReturn = 0;
    this.isAdultRailcardSelectedOpenReturn = false;
    this.isChildRailcardSelectedOpenReturn = false;
    this.currentRailcardIndexOpenReturn = index;
    if (this.railcardsOpenReturn.length >= 1) {
      this.showRemoveOpenReturn = true;
    }
    this.totalRaicardCountOpenReturn = arrayControl.length;
    if (!this.showAdultChildFieldOpenReturn(arrayControl.controls[index].get('railcardName').value)) {
      let railcard = adultChildSetters(arrayControl.controls[index].get('railcardName').value, arrayControl.controls[index].get('railcardCount').value, this.railCards);
      this.selectedAdultsRailcardOpenReturn = railcard[0];
      this.selectedChildsRailcardOpenReturn = railcard[1];
      arrayControl.controls[index].patchValue({
        railcardAdult: railcard[0],
        railcardChild: railcard[1]
      });
      this.adultChangeRailcardsOpenReturn(index, null, false);
      this.childChangeRailcardsOpenReturn(index, null, false);
    }
  }

  getRemainingAdults(index, num): number {
    let remainingAdults = 0;
    this.setSearchRequestRailcards(num);
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      let count = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        if (index != count) {
          totalAdults = totalAdults + m.Adult;
        }
        count++;
      });
      if (num == 1) {
        remainingAdults = this.adultSingle - totalAdults;
      }
      else if (num == 2) {
        remainingAdults = this.adultReturn - totalAdults;
      }
      else if (num == 3) {
        remainingAdults = this.adultOpenReturn - totalAdults;
      }
      else if (num == 4) {
        remainingAdults = this.adultSeason - totalAdults;
      }
    }
    return remainingAdults;
  }

  getRemainingChilds(index, num): number {
    let remainingChilds = 0;
    this.setSearchRequestRailcards(num);
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalChilds = 0;
      let count = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        if (index != count) {
          totalChilds = totalChilds + m.Child;
          count++;
        }
      });

      if (num == 1) {
        remainingChilds = this.childSingle - totalChilds;
      }
      else if (num == 2) {
        remainingChilds = this.childReturn - totalChilds;
      }
      else if (num == 3) {
        remainingChilds = this.childOpenReturn - totalChilds;
      }
      else if (num == 4) {
        remainingChilds = this.childSeason - totalChilds;
      }
    }
    return remainingChilds;
  }

  setRemainingRailcards(num) {
    this.setSearchRequestRailcards(num);

    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      let totalChilds = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalAdults = totalAdults + m.Adult;
        totalChilds = totalChilds + m.Child;
      });
      if (num == 1) {
        this.adultForRailcardCount = this.adultSingle - totalAdults;
        this.adultsForRailcardAdult = this.adultSingle - totalAdults;
        this.childForRailcardCount = this.childSingle - totalAdults;
        this.childForRailcardChild = this.childSingle - totalAdults;
      }
      else if (num == 2) {
        this.adultForRailcardCount = this.adultReturn - totalAdults;
        this.adultsForRailcardAdult = this.adultReturn - totalAdults;
        this.childForRailcardCount = this.childReturn - totalAdults;
        this.childForRailcardChild = this.childReturn - totalAdults;
      }
      else if (num == 3) {
        this.adultForRailcardCount = this.adultOpenReturn - totalAdults;
        this.adultsForRailcardAdult = this.adultOpenReturn - totalAdults;
        this.childForRailcardCount = this.childOpenReturn - totalAdults;
        this.childForRailcardChild = this.childOpenReturn - totalAdults;
      }
    }
  }

  tempSingle: any;
  tempReturn: any;
  tempOpenReturn: any;
  tempSeason: any;
  prevAdults: number;
  prevChilds: number;
  prevAdultsReturn: number;
  prevChildsReturn: number;
  prevAdultsOpenReturn: number;
  prevChildsOpenReturn: number;
  prevAdultsSeason: number;
  prevChildsSeason: number;
  adultForRailcardCount: number;
  childForRailcardCount: number;
  adultForRailcardCountReturn: number;
  childForRailcardCountReturn: number;
  adultForRailcardCountOpenReturn: number;
  childForRailcardCountOpenReturn: number;
  adultForRailcardCountSeason: number;
  childForRailcardCountSeason: number;
  showRemoveSingle: boolean = false;
  showRemoveReturn: boolean = false;
  showRemoveOpenReturn: boolean = false;
  showRemoveSeason: boolean = false;
  adultChildVisible: boolean = false;
  adultChildVisibleReturn: boolean = false;
  adultChildVisibleOpenReturn: boolean = false;

  showAdultChildField(railcardName) {
    if (railcardName == 'NGC' || railcardName == 'DIC' || railcardName == 'DIS' || railcardName == 'FAM' || railcardName == 'HMF' || railcardName == 'NEW'
      || railcardName == 'DRD' || railcardName == 'EVC' || railcardName == 'GS3' || railcardName == 'HOW' || railcardName == 'HRC' || railcardName == 'WHC'
      || railcardName == 'STL' || railcardName == 'VET') {
      this.adultChildVisible = true;
      return true;
    }
    this.adultChildVisible = false;
    return false;
  }
  showAdultChildFieldReturn(railcardName) {
    if (railcardName == 'NGC' || railcardName == 'DIC' || railcardName == 'DIS' || railcardName == 'FAM' || railcardName == 'HMF' || railcardName == 'NEW'
      || railcardName == 'DRD' || railcardName == 'EVC' || railcardName == 'GS3' || railcardName == 'HOW' || railcardName == 'HRC' || railcardName == 'WHC'
      || railcardName == 'STL' || railcardName == 'VET') {
      this.adultChildVisibleReturn = true;
      return true;
    }
    this.adultChildVisibleReturn = false;
    return false;
  }

  showAdultChildFieldOpenReturn(railcardName) {
    if (railcardName == 'NGC' || railcardName == 'DIC' || railcardName == 'DIS' || railcardName == 'FAM' || railcardName == 'HMF' || railcardName == 'NEW'
      || railcardName == 'DRD' || railcardName == 'EVC' || railcardName == 'GS3' || railcardName == 'HOW' || railcardName == 'HRC' || railcardName == 'WHC'
      || railcardName == 'STL' || railcardName == 'VET') {
      this.adultChildVisibleOpenReturn = true;
      return true;
    }
    this.adultChildVisibleOpenReturn = false;
    return false;
  }


  onRailcardCountChangeSingle(index, event) {
    this.railcardCompleted = false;
    let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
    arrayControl.controls[index].get('railcardAdult').enable();
    arrayControl.controls[index].get('railcardChild').enable();
    let currentRailcardCount = event.value;
    let selectedRailcardName = arrayControl.controls[index].get('railcardName').value;
    this.adultForRailcardCount = this.getRemainingAdults(index, 1);
    this.childForRailcardCount = this.getRemainingChilds(index, 1);
    //this is moved to upper to handel this.selectedAdultsRailcard and this.selectedChildsRailcard as they are set again in adultChangeRailcards and childChangeRailcards
    if (!this.showAdultChildField(selectedRailcardName)) {
      let railcard = adultChildSetters(selectedRailcardName, currentRailcardCount, this.railCards);
      this.selectedAdultsRailcard = railcard[0];
      this.selectedChildsRailcard = railcard[1];
      arrayControl.controls[index].patchValue({
        railcardAdult: railcard[0],
        railcardChild: railcard[1]
      });
      this.adultChangeRailcards(index, null, false);
      this.childChangeRailcards(index, null, false);
    }
    // check ends
    if (!this.isRailcardCountSelectedSingle) {
      this.isRailcardCountSelectedSingle = true;
      this.tempSingle = event.value;
      this.prevAdults = this.adultForRailcardCount;
      this.prevChilds = this.childForRailcardCount;
      arrayControl.controls[index].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsSingle, this.adultForRailcardCount, this.childForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
      arrayControl.controls[index].get('railcardCount').updateValueAndValidity();
    }
    else {
      this.numOfRailcardsSingle -= this.tempSingle;
      this.tempSingle = event.value
      if (this.isAdultRailcardSelected) {
        arrayControl.controls[index].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.adultForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
        arrayControl.controls[index].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelected) {
        arrayControl.controls[index].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.childForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
        arrayControl.controls[index].get('railcardChild').updateValueAndValidity();
      }
      arrayControl.controls[index].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsSingle, this.adultForRailcardCount, this.childForRailcardCount, selectedRailcardName, currentRailcardCount, this.railCards)]);
      arrayControl.controls[index].get('railcardCount').updateValueAndValidity();
    }
    this.numOfRailcardsSingle += event.value;

    if (this.qttFormSingle.get(['railcardsSingle', index, 'railcardCount']).errors == null
      && this.qttFormSingle.get(['railcardsSingle', index, 'railcardAdult']).errors == null
      && this.qttFormSingle.get(['railcardsSingle', index, 'railcardChild']).errors == null) {
      this.railcardCompleted = true;
    }
    this.hideShowAddMoreButton(1);
  }
  onRailcardCountChangeReturn(index, event) {
    this.railcardCompletedReturn = false;
    let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
    arrayControl.controls[index].get('railcardAdult').enable();
    arrayControl.controls[index].get('railcardChild').enable();
    let currentRailcardCount = event.value;
    let selectedRailcardName = arrayControl.controls[index].get('railcardName').value;
    this.adultForRailcardCountReturn = this.getRemainingAdults(index, 2);
    this.childForRailcardCountReturn = this.getRemainingChilds(index, 2);
    if (!this.showAdultChildFieldReturn(selectedRailcardName)) {
      let railcard = adultChildSetters(selectedRailcardName, currentRailcardCount, this.railCards);
      this.selectedAdultsRailcardReturn = railcard[0];
      this.selectedChildsRailcardReturn = railcard[1];
      arrayControl.controls[index].patchValue({
        railcardAdult: railcard[0],
        railcardChild: railcard[1]
      });
      this.adultChangeRailcardsReturn(index, null, false);
      this.childChangeRailcardsReturn(index, null, false);
    }
    // check end
    if (!this.isRailcardCountSelectedReturn) {
      this.isRailcardCountSelectedReturn = true;
      this.tempReturn = event.value;
      this.prevAdultsReturn = this.adultForRailcardCountReturn;
      this.prevChildsReturn = this.childForRailcardCountReturn;
      arrayControl.controls[index].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsReturn, this.adultForRailcardCountReturn, this.childForRailcardCountReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
      arrayControl.controls[index].get('railcardCount').updateValueAndValidity();
    }
    else {
      this.numOfRailcardsReturn -= this.tempReturn;
      this.tempReturn = event.value
      if (this.isAdultRailcardSelectedReturn) {
        arrayControl.controls[index].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardReturn, this.adultForRailcardCountReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
        arrayControl.controls[index].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelectedReturn) {
        arrayControl.controls[index].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardReturn, this.childForRailcardCountReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
        arrayControl.controls[index].get('railcardChild').updateValueAndValidity();
      }
      arrayControl.controls[index].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsReturn, this.adultForRailcardCountReturn, this.childForRailcardCountReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
      arrayControl.controls[index].get('railcardCount').updateValueAndValidity();
    }
    this.numOfRailcardsReturn += event.value;

    if (this.qttFormReturn.get(['railcardsReturn', index, 'railcardCount']).errors == null
      && this.qttFormReturn.get(['railcardsReturn', index, 'railcardAdult']).errors == null
      && this.qttFormReturn.get(['railcardsReturn', index, 'railcardChild']).errors == null) {
      this.railcardCompletedReturn = true;
    }
    this.hideShowAddMoreButton(2);
  }
  onRailcardCountChangeOpenReturn(index, event) {
    this.railcardCompletedOpenReturn = false;
    let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    arrayControl.controls[index].get('railcardAdult').enable();
    arrayControl.controls[index].get('railcardChild').enable();
    let currentRailcardCount = event.value;
    let selectedRailcardName = arrayControl.controls[index].get('railcardName').value;
    this.adultForRailcardCountOpenReturn = this.getRemainingAdults(index, 3);
    this.childForRailcardCountOpenReturn = this.getRemainingChilds(index, 3);
    if (!this.showAdultChildFieldOpenReturn(selectedRailcardName)) {
      let railcard = adultChildSetters(selectedRailcardName, currentRailcardCount, this.railCards);
      this.selectedAdultsRailcardOpenReturn = railcard[0];
      this.selectedChildsRailcardOpenReturn = railcard[1];
      arrayControl.controls[index].patchValue({
        railcardAdult: railcard[0],
        railcardChild: railcard[1]
      });
      this.adultChangeRailcardsOpenReturn(index, null, false);
      this.childChangeRailcardsOpenReturn(index, null, false);
    }
    //check end
    if (!this.isRailcardCountSelectedOpenReturn) {
      this.isRailcardCountSelectedOpenReturn = true;
      this.tempOpenReturn = event.value;
      this.prevAdultsOpenReturn = this.adultForRailcardCountOpenReturn;
      this.prevChildsOpenReturn = this.childForRailcardCountOpenReturn;
      arrayControl.controls[index].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsOpenReturn, this.adultForRailcardCountOpenReturn, this.childForRailcardCountOpenReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
      arrayControl.controls[index].get('railcardCount').updateValueAndValidity();
    }
    else {
      this.numOfRailcardsOpenReturn -= this.tempOpenReturn;
      this.tempOpenReturn = event.value
      if (this.isAdultRailcardSelectedOpenReturn) {
        arrayControl.controls[index].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardOpenReturn, this.adultForRailcardCountOpenReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
        arrayControl.controls[index].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelectedOpenReturn) {
        arrayControl.controls[index].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardOpenReturn, this.childForRailcardCountOpenReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
        arrayControl.controls[index].get('railcardChild').updateValueAndValidity();
      }
      arrayControl.controls[index].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsOpenReturn, this.adultForRailcardCountOpenReturn, this.childForRailcardCountOpenReturn, selectedRailcardName, currentRailcardCount, this.railCards)]);
      arrayControl.controls[index].get('railcardCount').updateValueAndValidity();
    }
    this.numOfRailcardsOpenReturn += event.value;

    if (this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardCount']).errors == null
      && this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardAdult']).errors == null
      && this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardChild']).errors == null) {
      this.railcardCompletedOpenReturn = true;
    }
    this.hideShowAddMoreButton(3);
  }

  selectedAdultsRailcard: number = 0;
  selectedChildsRailcard: number = 0;
  selectedAdultsRailcardReturn: number = 0;
  selectedChildsRailcardReturn: number = 0;
  selectedAdultsRailcardOpenReturn: number = 0;
  selectedChildsRailcardOpenReturn: number = 0;
  selectedAdultsRailcardSeason: number = 0;
  selectedChildsRailcardSeason: number = 0;
  isAdultRailcardSelected: boolean = false;
  isChildRailcardSelected: boolean = false;
  isAdultRailcardSelectedReturn: boolean = false;
  isChildRailcardSelectedReturn: boolean = false;
  isAdultRailcardSelectedOpenReturn: boolean = false;
  isChildRailcardSelectedOpenReturn: boolean = false;
  isAdultRailcardSelectedSeason: boolean = false;
  isChildRailcardSelectedSeason: boolean = false;
  currentAdultRailcard: number = 0;
  currentChildRailcard: number = 0;
  adultsForRailcardAdult: number = 0;
  childForRailcardChild: number = 0;
  adultsForRailcardAdultReturn: number = 0;
  childForRailcardChildReturn: number = 0;
  adultsForRailcardAdultOpenReturn: number = 0;
  childForRailcardChildOpenReturn: number = 0;
  adultsForRailcardAdultSeason: number = 0;
  childForRailcardChildSeason: number = 0;
  remainingAdult: number;
  remainingChild: number;
  railcardCompleted: boolean = false;
  railcardCompletedReturn: boolean = false;
  railcardCompletedOpenReturn: boolean = false;
  railcardCompletedSeason: boolean = false;
  currentRailcardIndex: number = 0;
  currentRailcardIndexReturn: number = 0;
  currentRailcardIndexOpenReturn: number = 0;
  currentRailcardIndexSeason: number = 0;
  isRailcardsCountErrorFree: boolean = false;
  isRailcardsAdultErrorFree: boolean = false;
  isRailcardsChildErrorFree: boolean = false;
  isRailcardsCountErrorFreeReturn: boolean = false;
  isRailcardsAdultErrorFreeReturn: boolean = false;
  isRailcardsChildErrorFreeReturn: boolean = false;
  isRailcardsCountErrorFreeOpenReturn: boolean = false;
  isRailcardsAdultErrorFreeOpenReturn: boolean = false;
  isRailcardsChildErrorFreeOpenReturn: boolean = false;
  isRailcardsCountErrorFreeSeason: boolean = false;
  isRailcardsAdultErrorFreeSeason: boolean = false;
  isRailcardsChildErrorFreeSeason: boolean = false;

  adultChangeRailcards(index, event, isShowAdultChild) {
    this.railcardCompleted = false;
    if (isShowAdultChild) {
      this.selectedAdultsRailcard = event.value;
    }
    if (!this.isAdultRailcardSelected) {
      this.adultsForRailcardAdult = this.adultForRailcardCount;
      this.isAdultRailcardSelected = true;
    }
    let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
    let selectedRailcard = arrayControl.controls[index].get('railcardName').value;
    let selectedRailcardCount = arrayControl.controls[index].get('railcardCount').value;
    arrayControl.controls[index].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.adultsForRailcardAdult, selectedRailcard, selectedRailcardCount, this.railCards)]);
    arrayControl.controls[index].get('railcardAdult').updateValueAndValidity();
    this.adultsForRailcardAdult = this.getRemainingAdults(index, 1);
    if (this.qttFormSingle.get(['railcardsSingle', index, 'railcardCount']).errors == null
      && this.qttFormSingle.get(['railcardsSingle', index, 'railcardAdult']).errors == null
      && this.qttFormSingle.get(['railcardsSingle', index, 'railcardChild']).errors == null) {
      this.railcardCompleted = true;
    }
    this.hideShowAddMoreButton(1);
  }
  adultChangeRailcardsReturn(index, event, isShowAdultChild) {
    this.railcardCompletedReturn = false;
    if (isShowAdultChild) {
      this.selectedAdultsRailcardReturn = event.value;
    }
    if (!this.isAdultRailcardSelectedReturn) {
      this.adultsForRailcardAdultReturn = this.adultForRailcardCountReturn;
      this.isAdultRailcardSelectedReturn = true;
    }
    let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
    let selectedRailcard = arrayControl.controls[index].get('railcardName').value;
    let selectedRailcardCount = arrayControl.controls[index].get('railcardCount').value;
    arrayControl.controls[index].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardReturn, this.adultsForRailcardAdultReturn, selectedRailcard, selectedRailcardCount, this.railCards)]);
    arrayControl.controls[index].get('railcardAdult').updateValueAndValidity();
    this.adultsForRailcardAdultReturn = this.getRemainingAdults(index, 2);
    if (this.qttFormReturn.get(['railcardsReturn', index, 'railcardCount']).errors == null
      && this.qttFormReturn.get(['railcardsReturn', index, 'railcardAdult']).errors == null
      && this.qttFormReturn.get(['railcardsReturn', index, 'railcardChild']).errors == null) {
      this.railcardCompletedReturn = true;
    }
    this.hideShowAddMoreButton(2);
  }
  adultChangeRailcardsOpenReturn(index, event, isShowAdultChild) {
    this.railcardCompletedOpenReturn = false;
    if (isShowAdultChild) {
      this.selectedAdultsRailcardOpenReturn = event.value;
    }
    if (!this.isAdultRailcardSelectedOpenReturn) {
      this.adultsForRailcardAdultOpenReturn = this.adultForRailcardCountOpenReturn;
      this.isAdultRailcardSelectedOpenReturn = true;
    }
    let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    let selectedRailcard = arrayControl.controls[index].get('railcardName').value;
    let selectedRailcardCount = arrayControl.controls[index].get('railcardCount').value;
    arrayControl.controls[index].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardOpenReturn, this.adultsForRailcardAdultOpenReturn, selectedRailcard, selectedRailcardCount, this.railCards)]);
    arrayControl.controls[index].get('railcardAdult').updateValueAndValidity();
    this.adultsForRailcardAdultOpenReturn = this.getRemainingAdults(index, 3);
    if (this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardCount']).errors == null
      && this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardAdult']).errors == null
      && this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardChild']).errors == null) {
      this.railcardCompletedOpenReturn = true;
    }
    this.hideShowAddMoreButton(3);
  }


  childChangeRailcards(index, event, isShowAdultChild) {
    this.railcardCompleted = false;
    let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
    if (isShowAdultChild) {
      this.selectedChildsRailcard = event.value;
    }
    if (!this.isChildRailcardSelected) {
      this.childForRailcardChild = this.childForRailcardCount;
      this.isChildRailcardSelected = true;
    }
    let selectedRailcard = arrayControl.controls[index].get('railcardName').value;
    let selectedRailcardCount = arrayControl.controls[index].get('railcardCount').value;
    arrayControl.controls[index].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.childForRailcardChild, selectedRailcard, selectedRailcardCount, this.railCards)]);
    arrayControl.controls[index].get('railcardChild').updateValueAndValidity();
    this.childForRailcardChild = this.getRemainingChilds(index, 1);
    if (this.qttFormSingle.get(['railcardsSingle', index, 'railcardCount']).errors == null
      && this.qttFormSingle.get(['railcardsSingle', index, 'railcardAdult']).errors == null
      && this.qttFormSingle.get(['railcardsSingle', index, 'railcardChild']).errors == null) {
      this.railcardCompleted = true;
    }
    this.hideShowAddMoreButton(1);
  }
  childChangeRailcardsReturn(index, event, isShowAdultChild) {
    this.railcardCompletedReturn = false;
    let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
    if (isShowAdultChild) {
      this.selectedChildsRailcardReturn = event.value;
    }
    if (!this.isChildRailcardSelectedReturn) {
      this.childForRailcardChildReturn = this.childForRailcardCountReturn;
      this.isChildRailcardSelectedReturn = true;
    }
    let selectedRailcard = arrayControl.controls[index].get('railcardName').value;
    let selectedRailcardCount = arrayControl.controls[index].get('railcardCount').value;
    arrayControl.controls[index].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardReturn, this.childForRailcardChildReturn, selectedRailcard, selectedRailcardCount, this.railCards)]);
    arrayControl.controls[index].get('railcardChild').updateValueAndValidity();
    this.childForRailcardChildReturn = this.getRemainingChilds(index, 2);
    if (this.qttFormReturn.get(['railcardsReturn', index, 'railcardCount']).errors == null
      && this.qttFormReturn.get(['railcardsReturn', index, 'railcardAdult']).errors == null
      && this.qttFormReturn.get(['railcardsReturn', index, 'railcardChild']).errors == null) {
      this.railcardCompletedReturn = true;
    }
    this.hideShowAddMoreButton(2);
  }
  childChangeRailcardsOpenReturn(index, event, isShowAdultChild) {
    this.railcardCompletedOpenReturn = false;
    let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
    if (isShowAdultChild) {
      this.selectedChildsRailcardOpenReturn = event.value;
    }
    if (!this.isChildRailcardSelectedOpenReturn) {
      this.childForRailcardChildOpenReturn = this.childForRailcardCountOpenReturn;
      this.isChildRailcardSelectedOpenReturn = true;
    }
    let selectedRailcard = arrayControl.controls[index].get('railcardName').value;
    let selectedRailcardCount = arrayControl.controls[index].get('railcardCount').value;
    arrayControl.controls[index].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardOpenReturn, this.childForRailcardChildOpenReturn, selectedRailcard, selectedRailcardCount, this.railCards)]);
    arrayControl.controls[index].get('railcardChild').updateValueAndValidity();
    this.childForRailcardChildOpenReturn = this.getRemainingChilds(index, 3);
    if (this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardCount']).errors == null
      && this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardAdult']).errors == null
      && this.qttFormOpenReturn.get(['railcardsOpenReturn', index, 'railcardChild']).errors == null) {
      this.railcardCompletedOpenReturn = true;
    }
    this.hideShowAddMoreButton(3);
  }


  isAdultActionFresh: boolean = true;
  isChildActionFresh: boolean = true;
  isAdultActionFreshReturn: boolean = true;
  isChildActionFreshReturn: boolean = true;
  isAdultActionFreshOpenReturn: boolean = true;
  isChildActionFreshOpenReturn: boolean = true;
  isAdultActionFreshSeason: boolean = true;
  isChildActionFreshSeason: boolean = true;
  adultsForRailcards: number = 0;
  childsForRailcards: number = 0;
  adultsForRailcardsReturn: number = 0;
  childsForRailcardsReturn: number = 0;
  adultsForRailcardsOpenReturn: number = 0;
  childsForRailcardsOpenReturn: number = 0;
  adultsForRailcardsSeason: number = 0;
  childsForRailcardsSeason: number = 0;
  checkForAddAdult: boolean = false;
  isTotalAdultsLess: boolean = false;
  isTotalChildrenLess: boolean = false;
  isTotalAdultsLessReturn: boolean = false;
  isTotalChildrenLessReturn: boolean = false;
  isTotalAdultsLessOpenReturn: boolean = false;
  isTotalChildrenLessOpenReturn: boolean = false;
  adultChangeActionSingle(event) {
    if (!this.isAdultActionFresh && this.currentRailcardIndex !== 0) {
      this.adultsForRailcards += (event.value - this.adultSingle);
    }
    else {
      if (this.isAdultActionFresh) {
        this.adultsForRailcardAdult = event.value;
      }
      else {
        this.adultsForRailcardAdult += (event.value - this.adultSingle);
      }
      this.adultsForRailcards = event.value;

    }
    if (this.isAdultActionFresh) {
      this.isAdultActionFresh = false;
    }

    this.adultSingle = event.value;
    if (event.value < 2) {
      this.isPluralAdultSingle = false;
    }
    else {
      this.isPluralAdultSingle = true;
    }
    this.passengersCountSingle = this.adultSingle + this.childSingle;
    if (this.passengersCountSingle > 9) {
      this.showGroupTravelLinkSingle = true;
      this.qttFormSingle.get('adultCountSingle').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCountSingle < 1) {
      this.qttFormSingle.get('adultCountSingle').setValidators([passengerCountValidator(this.adultSingle, this.childSingle)]);
      this.qttFormSingle.get('adultCountSingle').updateValueAndValidity();
      this.qttFormSingle.get('childCountSingle').setValidators(null);
      this.qttFormSingle.get('childCountSingle').setErrors(null);
    }
    else {
      this.showGroupTravelLinkSingle = false;
      this.qttFormSingle.get('adultCountSingle').setErrors(null);
      this.qttFormSingle.get('childCountSingle').setErrors(null);
    }

    this.adultChangeActionSingleForRailcards();
  }

  adultChangeActionSingleForRailcards() {
    //For Railcards
    this.hideShowAddMoreButton(1);
    this.isTotalAdultsLess = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalAdults = totalAdults + m.Adult;
      });
      if (this.adultSingle < totalAdults) {
        this.isTotalAdultsLess = true;
        let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
        arrayControl.controls[this.currentRailcardIndex].get('railcardAdult').setErrors({ 'adultValid': true });
      }

    }
    this.adultForRailcardCount = this.adultsForRailcards;
    if ((this.isAdultRailcardSelected || this.isChildRailcardSelected || this.isRailcardCountSelectedSingle) && !this.isTotalAdultsLess) {
      this.railcardCompleted = false;
      let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
      let selectedRailcard = arrayControl.controls[this.currentRailcardIndex].get('railcardName').value;
      let currentRailcardCount = arrayControl.controls[this.currentRailcardIndex].get('railcardCount').value;
      if (this.isAdultRailcardSelected) {
        arrayControl.controls[this.currentRailcardIndex].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.adultsForRailcards, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndex].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelected) {
        arrayControl.controls[this.currentRailcardIndex].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.prevChilds, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndex].get('railcardChild').updateValueAndValidity();
      }
      if (this.isRailcardCountSelectedSingle) {
        arrayControl.controls[this.currentRailcardIndex].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsSingle, this.adultsForRailcards, this.prevChilds, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndex].get('railcardCount').updateValueAndValidity();
      }
      if (this.qttFormSingle.get(['railcardsSingle', this.currentRailcardIndex, 'railcardCount']).errors == null
        && this.qttFormSingle.get(['railcardsSingle', this.currentRailcardIndex, 'railcardAdult']).errors == null
        && this.qttFormSingle.get(['railcardsSingle', this.currentRailcardIndex, 'railcardChild']).errors == null) {
        this.railcardCompleted = true;
      }
    }
  }

  adultChangeActionReturn(event) {
    if (!this.isAdultActionFreshReturn && this.currentRailcardIndexReturn !== 0) {
      this.adultsForRailcardsReturn += (event.value - this.adultReturn);
    }
    else {
      if (this.isAdultActionFreshReturn) {
        this.adultsForRailcardAdultReturn = event.value;
      }
      else {
        this.adultsForRailcardAdultReturn += (event.value - this.adultReturn);
      }
      this.adultsForRailcardsReturn = event.value;

    }
    if (this.isAdultActionFreshReturn) {
      this.isAdultActionFreshReturn = false;
    }
    this.adultReturn = event.value;
    if (event.value < 2) {
      this.isPluralAdultReturn = false;
    }
    else {
      this.isPluralAdultReturn = true;
    }
    this.passengersCountReturn = this.adultReturn + this.childReturn;
    if (this.passengersCountReturn > 9) {
      this.showGroupTravelLinkReturn = true;
      this.qttFormReturn.get('adultCountReturn').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCountReturn < 1) {
      this.qttFormReturn.get('adultCountReturn').setValidators([passengerCountValidator(this.adultReturn, this.childReturn)]);
      this.qttFormReturn.get('adultCountReturn').updateValueAndValidity();
      this.qttFormReturn.get('childCountReturn').setValidators(null);
      this.qttFormReturn.get('childCountReturn').setErrors(null);
    }
    else {
      this.showGroupTravelLinkReturn = false;
      this.qttFormReturn.get('adultCountReturn').setErrors(null);
      this.qttFormReturn.get('childCountReturn').setErrors(null);
    }

    this.adultChangeActionReturnForRailCards();

  }

  adultChangeActionReturnForRailCards() {
    //For Railcards
    this.hideShowAddMoreButton(2);
    this.isTotalAdultsLessReturn = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalAdults = totalAdults + m.Adult;
      });
      if (this.adultReturn < totalAdults) {
        this.isTotalAdultsLessReturn = true;
        let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardAdult').setErrors({ 'adultValid': true });
      }

    }
    this.adultForRailcardCountReturn = this.adultsForRailcardsReturn;
    if ((this.isAdultRailcardSelectedReturn || this.isChildRailcardSelectedReturn || this.isRailcardCountSelectedReturn) && !this.isTotalAdultsLessReturn) {
      this.railcardCompletedReturn = false;
      let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
      let selectedRailcard = arrayControl.controls[this.currentRailcardIndexReturn].get('railcardName').value;
      let currentRailcardCount = arrayControl.controls[this.currentRailcardIndexReturn].get('railcardCount').value;
      if (this.isAdultRailcardSelectedReturn) {
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardReturn, this.adultsForRailcardsReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelectedReturn) {
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardReturn, this.prevChildsReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardChild').updateValueAndValidity();
      }
      if (this.isRailcardCountSelectedReturn) {
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsReturn, this.adultsForRailcardsReturn, this.prevChildsReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardCount').updateValueAndValidity();
      }
      this.railcardCompletedReturn = true;
    }
  }

  adultChangeActionOpenReturn(event) {
    if (!this.isAdultActionFreshOpenReturn && this.currentRailcardIndexOpenReturn !== 0) {
      this.adultsForRailcardsOpenReturn += (event.value - this.adultOpenReturn);
    }
    else {
      if (this.isAdultActionFreshOpenReturn) {
        this.adultsForRailcardAdultOpenReturn = event.value;
      }
      else {
        this.adultsForRailcardAdultOpenReturn += (event.value - this.adultOpenReturn);
      }
      this.adultsForRailcardsOpenReturn = event.value;

    }
    if (this.isAdultActionFreshOpenReturn) {
      this.isAdultActionFreshOpenReturn = false;
    }
    this.adultOpenReturn = event.value;
    if (event.value < 2) {
      this.isPluralAdultOpenReturn = false;
    }
    else {
      this.isPluralAdultOpenReturn = true;
    }
    this.passengersCountOpenReturn = this.adultOpenReturn + this.childOpenReturn;

    if (this.passengersCountOpenReturn > 9) {
      this.showGroupTravelLinkOpenReturn = true;
      this.qttFormOpenReturn.get('adultCountOpenReturn').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCountOpenReturn < 1) {
      this.qttFormOpenReturn.get('adultCountOpenReturn').setValidators([passengerCountValidator(this.adultOpenReturn, this.childOpenReturn)]);
      this.qttFormOpenReturn.get('adultCountOpenReturn').updateValueAndValidity();
      this.qttFormOpenReturn.get('childCountOpenReturn').setValidators(null);
      this.qttFormOpenReturn.get('childCountOpenReturn').setErrors(null);
    }
    else {
      this.showGroupTravelLinkOpenReturn = false;
      this.qttFormOpenReturn.get('adultCountOpenReturn').setErrors(null);
      this.qttFormOpenReturn.get('childCountOpenReturn').setErrors(null);
    }

    this.adultChangeActionOpenReturnForRailcards();
    
  }

  adultChangeActionOpenReturnForRailcards() {
    //For Railcards
    this.hideShowAddMoreButton(3);
    this.isTotalAdultsLessOpenReturn = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalAdults = totalAdults + m.Adult;
      });
      if (this.adultOpenReturn < totalAdults) {
        this.isTotalAdultsLessOpenReturn = true;
        let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardAdult').setErrors({ 'adultValid': true });
      }

    }
    this.adultForRailcardCountOpenReturn = this.adultsForRailcardsOpenReturn;
    if ((this.isAdultRailcardSelectedOpenReturn || this.isChildRailcardSelectedOpenReturn || this.isRailcardCountSelectedOpenReturn) && !this.isTotalAdultsLessOpenReturn) {
      this.railcardCompletedOpenReturn = false;
      let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
      let selectedRailcard = arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardName').value;
      let currentRailcardCount = arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardCount').value;
      if (this.isAdultRailcardSelectedOpenReturn) {
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardOpenReturn, this.adultsForRailcardsOpenReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelectedOpenReturn) {
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardOpenReturn, this.prevChildsOpenReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardChild').updateValueAndValidity();
      }
      if (this.isRailcardCountSelectedOpenReturn) {
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsOpenReturn, this.adultsForRailcardsOpenReturn, this.prevChildsOpenReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardCount').updateValueAndValidity();
      }
      this.railcardCompletedOpenReturn = true;
    }
  }

  passengerChangeActionSeason(event) {
    if (event.value == "Adult") {
      this.qttFormSeason.get('railcardsSeason').enable();
    }
    else {
      this.qttFormSeason.get('railcardsSeason').setValue("");
      this.qttFormSeason.get('railcardsSeason').disable();
    }
  }
  childChangeActionSingle(event) {
    if (event.value < 2) {
      this.isPluralChildSingle = false;
    }
    else {
      this.isPluralChildSingle = true;
    }

    if (!this.isChildActionFresh && this.currentRailcardIndex !== 0) {
      this.childsForRailcards += (event.value - this.childSingle);
    }
    else {
      if (this.isChildActionFresh) {
        this.childForRailcardChild = event.value;
      }
      else {
        this.childForRailcardChild += (event.value - this.childSingle);
      }
      this.childsForRailcards = event.value;
    }
    if (this.isChildActionFresh) {
      this.isChildActionFresh = false;
    }

    this.childSingle = event.value;
    this.passengersCountSingle = this.adultSingle + this.childSingle;
    if (this.passengersCountSingle > 9) {
      this.showGroupTravelLinkSingle = true;
      this.qttFormSingle.get('childCountSingle').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCountSingle < 1) {
      this.qttFormSingle.get('childCountSingle').setValidators([passengerCountValidator(this.adultSingle, this.childSingle)]);
      this.qttFormSingle.get('childCountSingle').updateValueAndValidity();
      this.qttFormSingle.get('adultCountSingle').setValidators(null);
      this.qttFormSingle.get('adultCountSingle').setErrors(null);
    }
    else {
      this.showGroupTravelLinkSingle = false;
      this.qttFormSingle.get('childCountSingle').setErrors(null);
      this.qttFormSingle.get('adultCountSingle').setErrors(null);
    }

    this.childChangeActionSingleForRailcards();    

  }

  childChangeActionSingleForRailcards() {
    //For Railcard
    this.hideShowAddMoreButton(1);
    this.isTotalChildrenLess = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalChildren = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalChildren = totalChildren + m.Child;
      });
      if (this.childSingle < totalChildren) {
        this.isTotalChildrenLess = true;
        let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
        arrayControl.controls[this.currentRailcardIndex].get('railcardChild').setErrors({ 'childValid': true });
      }

    }
    this.childForRailcardCount = this.childsForRailcards;
    if ((this.isAdultRailcardSelected || this.isChildRailcardSelected || this.isRailcardCountSelectedSingle) && !this.isTotalChildrenLess) {
      let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
      let selectedRailcard = arrayControl.controls[this.currentRailcardIndex].get('railcardName').value;
      let currentRailcardCount = arrayControl.controls[this.currentRailcardIndex].get('railcardCount').value;
      if (this.isAdultRailcardSelected) {
        arrayControl.controls[this.currentRailcardIndex].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcard, this.prevAdults, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndex].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelected) {
        arrayControl.controls[this.currentRailcardIndex].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcard, this.childsForRailcards, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndex].get('railcardChild').updateValueAndValidity();
      }
      if (this.isRailcardCountSelectedSingle) {
        arrayControl.controls[this.currentRailcardIndex].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsSingle, this.prevAdults, this.childsForRailcards, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndex].get('railcardCount').updateValueAndValidity();
      }
    }
  }

  childChangeActionReturn(event) {
    if (event.value < 2) {
      this.isPluralChildReturn = false;
    }
    else {
      this.isPluralChildReturn = true;
    }
    if (!this.isChildActionFreshReturn && this.currentRailcardIndexReturn !== 0) {
      this.childsForRailcardsReturn += (event.value - this.childReturn);
    }
    else {
      if (this.isChildActionFreshReturn) {
        this.childForRailcardChildReturn = event.value;
      }
      else {
        this.childForRailcardChildReturn += (event.value - this.childReturn);
      }
      this.childsForRailcardsReturn = event.value;
    }
    if (this.isChildActionFreshReturn) {
      this.isChildActionFreshReturn = false;
    }
    this.childReturn = event.value;
    this.passengersCountReturn = this.adultReturn + this.childReturn;

    if (this.passengersCountReturn > 9) {
      this.showGroupTravelLinkReturn = true;
      this.qttFormReturn.get('childCountReturn').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCountReturn < 1) {
      this.qttFormReturn.get('childCountReturn').setValidators([passengerCountValidator(this.adultReturn, this.childReturn)]);
      this.qttFormReturn.get('childCountReturn').updateValueAndValidity();
      this.qttFormReturn.get('adultCountReturn').setValidators(null);
      this.qttFormReturn.get('adultCountReturn').setErrors(null);
    }
    else {
      this.showGroupTravelLinkReturn = false;
      this.qttFormReturn.get('childCountReturn').setErrors(null);
      this.qttFormReturn.get('adultCountReturn').setErrors(null);
    }

    this.childChangeActionReturnForRailcards();
    
  }

  childChangeActionReturnForRailcards() {
    //For Railcard
    this.hideShowAddMoreButton(2);
    this.isTotalChildrenLessReturn = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalChildren = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalChildren = totalChildren + m.Child;
      });
      if (this.childReturn < totalChildren) {
        this.isTotalChildrenLessReturn = true;
        let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardChild').setErrors({ 'childValid': true });
      }

    }
    this.childForRailcardCountReturn = this.childsForRailcardsReturn;
    if ((this.isAdultRailcardSelectedReturn || this.isChildRailcardSelectedReturn || this.isRailcardCountSelectedReturn) && !this.isTotalChildrenLessReturn) {
      let arrayControl = this.qttFormReturn.get('railcardsReturn') as FormArray;
      let selectedRailcard = arrayControl.controls[this.currentRailcardIndexReturn].get('railcardName').value;
      let currentRailcardCount = arrayControl.controls[this.currentRailcardIndexReturn].get('railcardCount').value;
      if (this.isAdultRailcardSelectedReturn) {
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardReturn, this.prevAdultsReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelectedReturn) {
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardReturn, this.childsForRailcardsReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardChild').updateValueAndValidity();
      }
      if (this.isRailcardCountSelectedReturn) {
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsReturn, this.prevAdultsReturn, this.childsForRailcardsReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexReturn].get('railcardCount').updateValueAndValidity();
      }
    }
  }

  childChangeActionOpenReturn(event) {
    if (event.value < 2) {
      this.isPluralChildOpenReturn = false;
    }
    else {
      this.isPluralChildOpenReturn = true;
    }
    if (!this.isChildActionFreshOpenReturn && this.currentRailcardIndexOpenReturn !== 0) {
      this.childsForRailcardsOpenReturn += (event.value - this.childOpenReturn);
    }
    else {
      if (this.isChildActionFreshOpenReturn) {
        this.childForRailcardChildOpenReturn = event.value;
      }
      else {
        this.childForRailcardChildOpenReturn += (event.value - this.childOpenReturn);
      }
      this.childsForRailcardsOpenReturn = event.value;
    }
    if (this.isChildActionFreshOpenReturn) {
      this.isChildActionFreshOpenReturn = false;
    }
    this.childOpenReturn = event.value;
    this.passengersCountOpenReturn = this.adultOpenReturn + this.childOpenReturn;

    if (this.passengersCountOpenReturn > 9) {
      this.showGroupTravelLinkOpenReturn = true;
      this.qttFormOpenReturn.get('childCountOpenReturn').setErrors({ 'incorrect': true });
    }
    else if (this.passengersCountOpenReturn < 1) {
      this.qttFormOpenReturn.get('childCountOpenReturn').setValidators([passengerCountValidator(this.adultOpenReturn, this.childOpenReturn)]);
      this.qttFormOpenReturn.get('childCountOpenReturn').updateValueAndValidity();
      this.qttFormOpenReturn.get('adultCountOpenReturn').setValidators(null);
      this.qttFormOpenReturn.get('adultCountOpenReturn').setErrors(null);
    }
    else {
      this.showGroupTravelLinkOpenReturn = false;
      this.qttFormOpenReturn.get('childCountOpenReturn').setErrors(null);
      this.qttFormOpenReturn.get('adultCountOpenReturn').setErrors(null);
    }

    this.childChangeActionOpenReturnForRailcards();
    
  }

  childChangeActionOpenReturnForRailcards() {
    //For Railcard
    this.hideShowAddMoreButton(3);
    this.isTotalChildrenLessOpenReturn = false;
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalChildren = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalChildren = totalChildren + m.Child;
      });
      if (this.childOpenReturn < totalChildren) {
        this.isTotalChildrenLessOpenReturn = true;
        let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardChild').setErrors({ 'childValid': true });
      }

    }
    this.childForRailcardCountOpenReturn = this.childsForRailcardsOpenReturn;
    if ((this.isAdultRailcardSelectedOpenReturn || this.isChildRailcardSelectedOpenReturn || this.isRailcardCountSelectedOpenReturn) && !this.isTotalChildrenLessOpenReturn) {
      let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
      let selectedRailcard = arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardName').value;
      let currentRailcardCount = arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardCount').value;
      if (this.isAdultRailcardSelectedOpenReturn) {
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardAdult').setValidators([adultValidator(this.selectedAdultsRailcardOpenReturn, this.prevAdultsOpenReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardAdult').updateValueAndValidity();
      }
      if (this.isChildRailcardSelectedOpenReturn) {
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardChild').setValidators([childValidator(this.selectedChildsRailcardOpenReturn, this.childsForRailcardsOpenReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardChild').updateValueAndValidity();
      }
      if (this.isRailcardCountSelectedOpenReturn) {
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardCount').setValidators([railcardPerPassengerValidator(this.numOfRailcardsOpenReturn, this.prevAdultsOpenReturn, this.childsForRailcardsOpenReturn, selectedRailcard, currentRailcardCount, this.railCards)]);
        arrayControl.controls[this.currentRailcardIndexOpenReturn].get('railcardCount').updateValueAndValidity();
      }
    }
  }

  onCancel(num) {
    if (num == 1) {
      let arrayControl = this.qttFormSingle.get('railcardsSingle') as FormArray;
      arrayControl.clear();
      this.railcardsSingle.clear();
      this.railcardsSingle = this.qttFormSingle.get('railcardsSingle') as FormArray;
      this.railcardsSingle.push(this.createRailcardGroupSingle());
      this.isAdultRailcardSelected = false;
      this.isChildRailcardSelected = false;
      this.isRailcardSelectedSingle = false;
      this.isRailcardCountSelectedSingle = false;
      this.showRemoveSingle = false;
    }
    if (num == 2) {
      let arrayControl = this.qttFormReturn.get('railcardsSingle') as FormArray;
      arrayControl.clear();
      this.railcardsReturn.clear();
      this.railcardsReturn = this.qttFormReturn.get('railcardsSingle') as FormArray;
      this.railcardsReturn.push(this.createRailcardGroupReturn());
      this.isAdultRailcardSelectedReturn = false;
      this.isChildRailcardSelectedReturn = false;
      this.isRailcardSelectedReturn = false;
      this.isRailcardCountSelectedReturn = false;
      this.showRemoveReturn = false;
    }
    if (num == 3) {
      let arrayControl = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
      arrayControl.clear();
      this.railcardsOpenReturn.clear();
      this.railcardsOpenReturn = this.qttFormOpenReturn.get('railcardsOpenReturn') as FormArray;
      this.railcardsOpenReturn.push(this.createRailcardGroupOpenReturn());
      this.isAdultRailcardSelectedOpenReturn = false;
      this.isChildRailcardSelectedOpenReturn = false;
      this.isRailcardSelectedOpenReturn = false;
      this.isRailcardCountSelectedOpenReturn = false;
      this.showRemoveOpenReturn = false;
    }
  }

  onChangeStationsSearchSingle() {
    let departurLocation = this.qttFormSingle.get('departureLocationNameSingle').value;
    let arrivalLocation = this.qttFormSingle.get('arrivalLocationNameSingle').value;
    this.qttFormSingle.patchValue({
      departureLocationNameSingle: arrivalLocation,
      arrivalLocationNameSingle: departurLocation
    });
  }
  onChangeStationsSearchReturn() {
    let departurLocation = this.qttFormReturn.get('departureLocationNameReturn').value;
    let arrivalLocation = this.qttFormReturn.get('arrivalLocationNameReturn').value;
    this.qttFormReturn.patchValue({
      departureLocationNameReturn: arrivalLocation,
      arrivalLocationNameReturn: departurLocation
    });
  }
  onChangeStationsSearchOpenReturn() {
    let departurLocation = this.qttFormOpenReturn.get('departureLocationNameOpenReturn').value;
    let arrivalLocation = this.qttFormOpenReturn.get('arrivalLocationNameOpenReturn').value;
    this.qttFormOpenReturn.patchValue({
      departureLocationNameOpenReturn: arrivalLocation,
      arrivalLocationNameOpenReturn: departurLocation
    });
  }

  isShowAddMoreButton: boolean = false;
  isShowAddMoreButtonReturn: boolean = false;
  isShowAddMoreButtonOpenReturn: boolean = false;
  isShowAddMoreButtonSeason: boolean = false;

  hideShowAddMoreButton(num) {

    this.setSearchRequestRailcards(num);
    if (this.amendSearchRequest.RailCardList.length > 0) {
      let totalAdults = 0;
      let totalChilds = 0;
      this.amendSearchRequest.RailCardList.forEach(m => {
        totalAdults = totalAdults + m.Adult;
        totalChilds = totalChilds + m.Child;
      });

      switch (num) {
        case 1: this.hideShowAddMoreButtonNum1(totalAdults, totalChilds);
          break;
        case 2: this.hideShowAddMoreButtonNum2(totalAdults, totalChilds);
          break;
        case 3: this.hideShowAddMoreButtonNum3(totalAdults, totalChilds);
          break;
        case 4: this.hideShowAddMoreButtonNum4(totalAdults, totalChilds);
          break;
      }
    }
  }
  
  hideShowAddMoreButtonNum1(totalAdults: number, totalChilds: number) {
    // for num 1
    if (this.adultSingle > totalAdults || this.childSingle > totalChilds) {
      this.isShowAddMoreButton = true;
    } else {
      this.isShowAddMoreButton = false;
    }
  }

  hideShowAddMoreButtonNum2(totalAdults: number, totalChilds: number) {
    // for num 2
    if (this.adultReturn > totalAdults || this.childReturn > totalChilds) {
      this.isShowAddMoreButtonReturn = true;
    } else {
      this.isShowAddMoreButtonReturn = false;
    }
  }

  hideShowAddMoreButtonNum3(totalAdults: number, totalChilds: number) {
    // for num 3
    if (this.adultOpenReturn > totalAdults || this.childOpenReturn > totalChilds) {
      this.isShowAddMoreButtonOpenReturn = true;
    } else {
      this.isShowAddMoreButtonOpenReturn = false;
    }
  }

  hideShowAddMoreButtonNum4(totalAdults: number, totalChilds: number) {
    // for num 4
    if (this.adultSeason > totalAdults || this.childSeason > totalChilds) {
      this.isShowAddMoreButtonSeason = true;
    } else {
      this.isShowAddMoreButtonSeason = false;
    }
  }

  setSearchRequestRailcards(num) {
    this.amendSearchRequest.RailCardList = new Array<RailCardModel>();
    let formName;
    if (num == 1) {
      formName = this.railcardsSingle;
    }
    else if (num == 2) {
      formName = this.railcardsReturn;
    }
    else if (num == 3) {
      formName = this.railcardsOpenReturn;
    }
    else if (num == 4) {
      formName = this.railcardsSeason;
    }
    formName.controls.forEach(controls => {
      let railcardModel = new RailCardModel();
      railcardModel.Child = controls.get('railcardChild').value;
      railcardModel.RailCard = controls.get('railcardName').value;
      railcardModel.RailCardCount = controls.get('railcardCount').value;
      railcardModel.Adult = controls.get('railcardAdult').value;
      this.amendSearchRequest.RailCardList.push(railcardModel);
    });

  }


  onChangeStations() {
    if (this.isSeason) {
      let departurLocation = this.qttFormSeason.get('departureSeason').value;
      let arrivalLocation = this.qttFormSeason.get('arrivalSeason').value;
      this.qttFormSeason.patchValue({
        departureSeason: arrivalLocation,
        arrivalSeason: departurLocation
      });
    }
    else if (this.isFlexi) {
      let departurLocation = this.qttFormFlexi.get('departureFlexi').value;
      let arrivalLocation = this.qttFormFlexi.get('arrivalFlexi').value;
      this.qttFormFlexi.patchValue({
        departureFlexi: arrivalLocation,
        arrivalFlexi: departurLocation
      });
    }
  }

  onClickCustom(event) {
    if (event.checked) {
      this.showEndDate = true;
      this.qttFormSeason.get('endDateSeason').enable();
      this.qttFormSeason.get('endDateSeason').setValidators([Validators.required]);
      this.qttFormSeason.get('endDateSeason').updateValueAndValidity();
      this.minEndDate = moment(this.qttFormSeason.get('startDateSeason').value).add(1, 'days').add(1, 'months').toDate();
      this.maxEndDate = moment(this.qttFormSeason.get('startDateSeason').value).add(12, 'months').toDate();
      this.qttFormSeason.get('endDateSeason').patchValue(this.minEndDate);
      if (this.qttFormSeason.get('endDateSeason').value != "") {
        this.onEndDateChangeSeason();
      }
    }
    else {
      this.showEndDate = false;
      this.qttFormSeason.get('endDateSeason').disable();
      this.qttFormSeason.get('endDateSeason').setValidators(null);
      this.qttFormSeason.get('endDateSeason').setErrors(null);
      this.isCustomChecked = false;
    }
  }

  onClose() {
    if (this.railcardBackup.length == 0) {
      this.amendSearchRequest.RailCardList = new Array<RailCardModel>();
    }
    else {
      this.amendSearchRequest.RailCardList = this.railcardBackup;
    }
    if (this.sharedService.isAmendSearchOpen) {
      if (this.commonServices.doesDeliveryPageSkipped()) {
        this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
      } else {
        this.router.navigate([`./` + this.appRouteEnum.ReviewBuy]);
      }
      this.modalService.dismissAll();
    }
    else {
      this.modalService.dismissAll();
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

  findLocationCode(value) {
    if (value !== null && value !== '' && value !== undefined && value !== 0) {
      let station = this.locations.filter(m => m.Name == value);
      return station[0].Id;
    }
    else {
      return 0;
    }
  }
  onPathConstraintChange(event, num) {
    if (num == 1) {
      if (event.value != "") {
        this.qttFormSingle.get('pathConstraintLocationSingle').setValidators([Validators.required, stationNameValidator(this.sharedService.locationMasterData)]);
        this.qttFormSingle.get('pathConstraintLocationSingle').updateValueAndValidity();
        this.qttFormSingle.get('pathConstraintLocationSingle').enable();
      }
      else {
        this.qttFormSingle.get('pathConstraintLocationSingle').setValidators(null);
        this.qttFormSingle.get('pathConstraintLocationSingle').setErrors(null);
        this.qttFormSingle.get('pathConstraintLocationSingle').setValue('');
        this.qttFormSingle.get('pathConstraintLocationSingle').disable();
      }
    }
    if (num == 2) {
      if (event.value != "") {
        this.qttFormReturn.get('pathConstraintLocationReturn').setValidators([Validators.required, stationNameValidator(this.sharedService.locationMasterData)]);
        this.qttFormReturn.get('pathConstraintLocationReturn').updateValueAndValidity();
        this.qttFormReturn.get('pathConstraintLocationReturn').enable();
      }
      else {
        this.qttFormReturn.get('pathConstraintLocationReturn').setValidators(null);
        this.qttFormReturn.get('pathConstraintLocationReturn').setErrors(null);
        this.qttFormReturn.get('pathConstraintLocationReturn').setValue('');
        this.qttFormReturn.get('pathConstraintLocationReturn').disable();
      }
    }
    
    this.onPathConstraintChangeNextStep(event, num);
  }

  onPathConstraintChangeNextStep(event, num) {
    if (num == 3) {
      if (event.value != "") {
        this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').setValidators([Validators.required, stationNameValidator(this.sharedService.locationMasterData)]);
        this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').updateValueAndValidity();
        this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').enable();
      }
      else {
        this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').setValidators(null);
        this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').setErrors(null);
        this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').setValue('');
        this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').disable();
      }
    }
    if (num == 4) {
      if (event.value != "") {
        this.qttFormSeason.get('pathConstraintLocationSeason').setValidators([Validators.required, stationNameValidator(this.sharedService.locationMasterData)]);
        this.qttFormSeason.get('pathConstraintLocationSeason').updateValueAndValidity();
        this.qttFormSeason.get('pathConstraintLocationSeason').enable();
      }
      else {
        this.qttFormSeason.get('pathConstraintLocationSeason').setValidators(null);
        this.qttFormSeason.get('pathConstraintLocationSeason').setErrors(null);
        this.qttFormSeason.get('pathConstraintLocationSeason').setValue('');
        this.qttFormSeason.get('pathConstraintLocationSeason').disable();
      }
    }
  }

  convertDateTime(queryDate: any, queryTime: any) {
    let actualTime = queryTime.split(':');
    let dateString;
    dateString = moment(queryDate).add(actualTime[0], 'hours').add(actualTime[1], 'minutes').format('YYYY-MM-DDTHH:mm');
    return dateString;
  }

  isSubmitted: boolean = false;
  result: SearchRequestModel = new SearchRequestModel();

  onClickSubmit(group) {
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
    if (this.sharedService != undefined) {
      this.sharedService.secondTravelSolDepartureTime = "";
      this.sharedService.firstTravelSolDepartureTime = "";

    }
    if (group === this.qttFormSingle) {
      this.onClickSubmitForQttFormSingle();
    }
    else if (group === this.qttFormReturn) {
      this.onClickSubmitForQttFormReturn();      
    }
    else {
      this.onClickSubmitForQttFormOpenReturn();
    }

  }

  onClickSubmitForQttFormSingle() {
    if (this.qttFormSingle.valid) {
      this.isSubmitted = true;
      this.result.DepartureLocationName = this.qttFormSingle.get('departureLocationNameSingle').value;
      this.result.DepartureLocation = this.findLocationCode(this.qttFormSingle.get('departureLocationNameSingle').value);
      this.result.ArrivalLocationName = this.qttFormSingle.get('arrivalLocationNameSingle').value;
      this.result.ArrivalLocation = this.findLocationCode(this.qttFormSingle.get('arrivalLocationNameSingle').value);
      this.result.DepartureTimesStart = this.convertDateTime(this.qttFormSingle.get('startDateSingle').value, this.qttFormSingle.get('startTimeSingle').value);
      this.result.Adult = this.qttFormSingle.get('adultCountSingle').value;
      this.result.Child = this.qttFormSingle.get('childCountSingle').value;
      let pathConstraint = this.qttFormSingle.get('pathConstraintTypeSingle').value;
      if (pathConstraint != "" && pathConstraint != undefined) {
        this.result.PathConstraintLocation = this.findLocationCode(this.qttFormSingle.get('pathConstraintLocationSingle').value);
        this.result.PathConstraintType = this.qttFormSingle.get('pathConstraintTypeSingle').value;
        this.sharedService.isAmendFresh = false;
      }
      else {
        this.result.PathConstraintLocation = 0;
        this.result.PathConstraintType = "";
        this.sharedService.isAmendFresh = true;
      }
      this.result.Traveltype = this.qttFormSingle.get('travelTypeSingle').value;
      this.result.IsReturnRequest = false;
      this.result.TravelSolutionDirection = 'ONE_WAY';
      this.result.ReturnTimesStart = "";
      this.railcardsSingle.controls.forEach(railcardsSingleControl => {
        let railcardModel = new RailCardModel();
        railcardModel.Child = railcardsSingleControl.get('railcardChild').value;
        railcardModel.RailCard = railcardsSingleControl.get('railcardName').value;
        railcardModel.RailCardCount = railcardsSingleControl.get('railcardCount').value;
        railcardModel.Adult = railcardsSingleControl.get('railcardAdult').value;
        if (railcardModel.Adult != 0 || railcardModel.Child != 0) {
          this.result.RailCardList.push(railcardModel);
        }
      });
      this.activeModal.close(this.result);
    }
  }

  onClickSubmitForQttFormReturn() {
    if (this.qttFormReturn.valid) {
      this.isSubmitted = true;
      this.sharedService.firstTravelSolDepartureTimeAmend = "";
      this.sharedService.secondTravelSolDepartureTimeAmend = "";

      this.result.DepartureLocationName = this.qttFormReturn.get('departureLocationNameReturn').value;
      this.result.DepartureLocation = this.findLocationCode(this.qttFormReturn.get('departureLocationNameReturn').value);
      this.result.ArrivalLocationName = this.qttFormReturn.get('arrivalLocationNameReturn').value;
      this.result.ArrivalLocation = this.findLocationCode(this.qttFormReturn.get('arrivalLocationNameReturn').value);
      this.result.DepartureTimesStart = this.convertDateTime(this.qttFormReturn.get('startDateReturn').value, this.qttFormReturn.get('startTimeReturn').value);
      this.result.Adult = this.qttFormReturn.get('adultCountReturn').value;
      this.result.Child = this.qttFormReturn.get('childCountReturn').value;
      let pathConstraintReturn = this.qttFormReturn.get('pathConstraintTypeReturn').value;
      if (pathConstraintReturn != "" && pathConstraintReturn != undefined) {
        this.result.PathConstraintLocation = this.findLocationCode(this.qttFormReturn.get('pathConstraintLocationReturn').value);
        this.result.PathConstraintType = this.qttFormReturn.get('pathConstraintTypeReturn').value;
        this.sharedService.isAmendFresh = false;
      }
      else {
        this.result.PathConstraintLocation = 0;
        this.result.PathConstraintType = "";
        this.sharedService.isAmendFresh = true;
      }
      this.result.Traveltype = this.qttFormReturn.get('travelTypeReturn').value;
      this.result.TraveltypeReturn = this.qttFormReturn.get('returnTravelTypeReturn').value;
      this.result.IsReturnRequest = true;
      this.result.TravelSolutionDirection = 'RETURN';
      this.result.ReturnTimesStart = this.convertDateTime(this.qttFormReturn.get('returnDateReturn').value, this.qttFormReturn.get('returnTimeReturn').value);
      this.railcardsReturn.controls.forEach(controls => {
        let railcardModel = new RailCardModel();
        railcardModel.Child = controls.get('railcardChild').value;
        railcardModel.RailCard = controls.get('railcardName').value;
        railcardModel.RailCardCount = controls.get('railcardCount').value;
        railcardModel.Adult = controls.get('railcardAdult').value;
        if (railcardModel.Adult != 0 || railcardModel.Child != 0) {
          this.result.RailCardList.push(railcardModel);
        }
      });
      this.activeModal.close(this.result);
    }
  }

  onClickSubmitForQttFormOpenReturn() {
    if (this.qttFormOpenReturn.valid) {
      this.isSubmitted = true;
      this.result.DepartureLocationName = this.qttFormOpenReturn.get('departureLocationNameOpenReturn').value;
      this.result.DepartureLocation = this.findLocationCode(this.qttFormOpenReturn.get('departureLocationNameOpenReturn').value);
      this.result.ArrivalLocationName = this.qttFormOpenReturn.get('arrivalLocationNameOpenReturn').value;
      this.result.ArrivalLocation = this.findLocationCode(this.qttFormOpenReturn.get('arrivalLocationNameOpenReturn').value);
      this.result.DepartureTimesStart = this.convertDateTime(this.qttFormOpenReturn.get('startDateOpenReturn').value, this.qttFormOpenReturn.get('startTimeOpenReturn').value);
      this.result.Adult = this.qttFormOpenReturn.get('adultCountOpenReturn').value;
      this.result.Child = this.qttFormOpenReturn.get('childCountOpenReturn').value;
      let pathConstraintOpen = this.qttFormOpenReturn.get('pathConstraintTypeOpenReturn').value;
      if (pathConstraintOpen != "" && pathConstraintOpen != undefined) {
        this.result.PathConstraintLocation = this.findLocationCode(this.qttFormOpenReturn.get('pathConstraintLocationOpenReturn').value);
        this.result.PathConstraintType = this.qttFormOpenReturn.get('pathConstraintTypeOpenReturn').value;
        this.sharedService.isAmendFresh = false;
      }
      else {
        this.result.PathConstraintLocation = 0;
        this.result.PathConstraintType = "";
        this.sharedService.isAmendFresh = true;
      }
      this.result.Traveltype = this.qttFormOpenReturn.get('travelTypeOpenReturn').value;
      this.result.IsReturnRequest = false;
      this.result.TravelSolutionDirection = 'OPEN_RETURN';
      this.railcardsOpenReturn.controls.forEach(control => {
        let railcardModel = new RailCardModel();
        railcardModel.Child = control.get('railcardChild').value;
        railcardModel.RailCard = control.get('railcardName').value;
        railcardModel.RailCardCount = control.get('railcardCount').value;
        railcardModel.Adult = control.get('railcardAdult').value;
        if (railcardModel.Adult != 0 || railcardModel.Child != 0) {
          this.result.RailCardList.push(railcardModel);
        }
      });
      this.activeModal.close(this.result);
    }
  }

  onClickSubmitForm(group) {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);
    this.sharedService.isAmendSearchOpen = false;
    this.result = this.amendSearchRequest;
    this.result.RailCardList = new Array<RailCardModel>();
    if (group == this.qttFormSeason) {
      this.onClickSubmitFormForQttFormSeason();
    }
    else {
      this.result = this.amendSearchRequest;
      this.result.DepartureLocationName = this.qttFormFlexi.get('departureFlexi').value;
      this.result.DepartureLocation = this.findLocationCode(this.qttFormFlexi.get('departureFlexi').value);
      this.result.ArrivalLocationName = this.qttFormFlexi.get('arrivalFlexi').value;
      this.result.ArrivalLocation = this.findLocationCode(this.qttFormFlexi.get('arrivalFlexi').value);
      if (this.qttFormFlexi.get('passengerFlexi').value == "Adult") {
        this.result.Adult = 1;
        this.result.Child = 0;
      }
      else {
        this.result.Adult = 0;
        this.result.Child = 1;
      }
      this.activeModal.close(this.result);
    }
  }

  onClickSubmitFormForQttFormSeason() {
    if (this.qttFormSeason.valid) {
      this.isSubmitted = true;
      if (!this.qttFormSeason.get('seasonType.weekly').value &&
        !this.qttFormSeason.get('seasonType.flexi').value &&
        !this.qttFormSeason.get('seasonType.monthly').value &&
        !this.qttFormSeason.get('seasonType.annual').value &&
        !this.qttFormSeason.get('seasonType.custom').value) {
        this.result.IsWeekly = true;
        this.result.IsFlexi = true;
        this.result.IsMonthly = true;
        this.result.IsAnnual = true;
        this.result.IsCustom = false;
      }
      else {
        this.result.IsWeekly = this.qttFormSeason.get('seasonType.weekly').value;
        this.result.IsFlexi = this.qttFormSeason.get('seasonType.flexi').value;
        this.result.IsMonthly = this.qttFormSeason.get('seasonType.monthly').value;
        this.result.IsAnnual = this.qttFormSeason.get('seasonType.annual').value;
        this.result.IsCustom = this.qttFormSeason.get('seasonType.custom').value;
      }
      this.result.DepartureLocationName = this.qttFormSeason.get('departureSeason').value;
      this.result.DepartureLocation = this.findLocationCode(this.qttFormSeason.get('departureSeason').value);
      this.result.ArrivalLocationName = this.qttFormSeason.get('arrivalSeason').value;
      this.result.ArrivalLocation = this.findLocationCode(this.qttFormSeason.get('arrivalSeason').value);
      this.result.DepartureTimesStart = moment(this.qttFormSeason.get('startDateSeason').value).format('YYYY-MM-DDTHH:mm');
      if (this.result.IsCustom) {
        this.result.TravelEndDate = moment(this.qttFormSeason.get('endDateSeason').value).format('YYYY-MM-DDTHH:mm');
      }
      if (this.qttFormSeason.get('passengerSeason').value == "Adult") {
        this.result.Adult = 1;
        this.result.Child = 0;
      }
      else {
        this.result.Adult = 0;
        this.result.Child = 1;
      }
      this.onClickSubmitFormForQttFormSeasonNextStep();
    
    }
  }

  onClickSubmitFormForQttFormSeasonNextStep() {
    let pathConstraint = this.qttFormSeason.get('pathConstraintTypeSeason').value;
    if (pathConstraint != "" && pathConstraint != undefined) {
      this.result.PathConstraintLocation = this.findLocationCode(this.qttFormSeason.get('pathConstraintLocationSeason').value);
      this.result.PathConstraintType = this.qttFormSeason.get('pathConstraintTypeSeason').value;
      this.sharedService.isAmendFresh = false;
    }
    else {
      this.result.PathConstraintLocation = 0;
      this.result.PathConstraintType = "";
      this.sharedService.isAmendFresh = true;
    }
    this.result.IsReturnRequest = false;
    this.result.TravelSolutionDirection = this.amendSearchRequest.TravelSolutionDirection;
    if (this.qttFormSeason.get('railcardsSeason').value != "" && this.qttFormSeason.get('railcardsSeason').value != undefined) {
      let railcardModel = new RailCardModel();
      railcardModel.Child = 0;
      railcardModel.RailCard = this.qttFormSeason.get('railcardsSeason').value;
      railcardModel.RailCardCount = 1;
      railcardModel.Adult = 1;
      if (railcardModel.Adult != 0 || railcardModel.Child != 0) {
        this.result.RailCardList.push(railcardModel);
      }
    }
    this.result.IsSeason = true;
    this.activeModal.close(this.result);
  }

  private _filterLocations(value: string): LocationMasterData[] {
    const filterValue = value.toLowerCase();
    // load more filtered station
    let suggestedLocations = this.commonServices.getFilteredStation(this.locations, filterValue);
    suggestedLocations = this.commonServices.getMoreFilteredStations(suggestedLocations, filterValue);

    return suggestedLocations.length ? suggestedLocations : [{ Id: null, Name: 'No results found' }];

  }
  _allowSelection(option: string): { [className: string]: boolean } {
    return {
      'no-data': option === 'No results found',
    }
  }

  getLocations() {
    this.commonServices.loaderRequired = true;
    this.commonServices.getLocations().subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.sharedService.locationMasterData = this.responseData.Data;
            this.locations = this.responseData.Data;
            this.initializeFormData();
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });

  }


  initializeFormData() {
    this.initializeForms();
  }

  matchStations(num) {
    if (num == 1) {
      if (this.qttFormSingle.get('departureLocationNameSingle').value == this.qttFormSingle.get('arrivalLocationNameSingle').value) {
        this.qttFormSingle.get('departureLocationNameSingle').setErrors({ 'stationMatch': true });
      }
      else {
        this.qttFormSingle.get('departureLocationNameSingle').setErrors(null);
      }
    }
    if (num == 2) {
      if (this.qttFormReturn.get('departureLocationNameReturn').value == this.qttFormReturn.get('arrivalLocationNameReturn').value) {
        this.qttFormReturn.get('departureLocationNameReturn').setErrors({ 'stationMatch': true });
      }
      else {
        this.qttFormReturn.get('departureLocationNameReturn').setErrors(null);
      }
    }
   
    this.matchStationsNextStep(num);
  }

  matchStationsNextStep(num){
    if (num == 3) {
      if (this.qttFormOpenReturn.get('departureLocationNameOpenReturn').value == this.qttFormOpenReturn.get('arrivalLocationNameOpenReturn').value) {
        this.qttFormOpenReturn.get('departureLocationNameOpenReturn').setErrors({ 'stationMatch': true });
      }
      else {
        this.qttFormOpenReturn.get('departureLocationNameOpenReturn').setErrors(null);
      }
    }
    if (num == 4) {
      if (this.qttFormSeason.get('departureSeason').value == this.qttFormSeason.get('arrivalSeason').value) {
        this.qttFormSeason.get('departureSeason').setErrors({ 'stationMatch': true });
      }
      else {
        this.qttFormSeason.get('departureSeason').setErrors(null);
      }
    }
  }

  onLocationChanges(num, count) {
    if (num == 1) {
      this.onLocationChangesForNum1(count);
    }

    if (num == 2) {
      this.onLocationChangesForNum2(count);
    }

    if(num == 3){
      this.onLocationChangesForNum3(count);
    }

    if (num == 4) {
      this.onLocationChangesForNum4(count);
    }
    
    if(num == 5){
      this.onLocationChangesForNum5(count);
    }
    
  }

  onLocationChangesForNum1(count) {
    //Single form
    if (count == 11) {
      this.filteredDeparturesSingle = this.qttFormSingle.get("departureLocationNameSingle").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 12) {
      this.filteredArrivalsSingle = this.qttFormSingle.get("arrivalLocationNameSingle").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 13) {
      this.filteredStationsSingle = this.qttFormSingle.get("pathConstraintLocationSingle").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
  }

  onLocationChangesForNum2(count) {
    //Return Form
    if (count == 21) {
      this.filteredDeparturesReturn = this.qttFormReturn.get("departureLocationNameReturn").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 22) {
      this.filteredArrivalsReturn = this.qttFormReturn.get("arrivalLocationNameReturn").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 23) {
      this.filteredStationsReturn = this.qttFormReturn.get("pathConstraintLocationReturn").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
  }

  onLocationChangesForNum3(count) {
    //Open Return Form
    if (count == 31) {
      this.filteredDeparturesOpenReturn = this.qttFormOpenReturn.get("departureLocationNameOpenReturn").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 32) {
      this.filteredArrivalsOpenReturn = this.qttFormOpenReturn.get("arrivalLocationNameOpenReturn").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 33) {
      this.filteredStationsOpenReturn = this.qttFormOpenReturn.get("pathConstraintLocationOpenReturn").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
  }

  onLocationChangesForNum4(count) {
    //Season form
    if (count == 41) {
      this.filteredDeparturesSeason = this.qttFormSeason.get("departureSeason").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 42) {
      this.filteredArrivalsSeason = this.qttFormSeason.get("arrivalSeason").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 43) {
      this.filteredStationsSeason = this.qttFormSeason.get("pathConstraintLocationSeason").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
  }

  onLocationChangesForNum5(count) {
    //Flexi form
    if (count == 51) {
      this.filteredDeparturesFlexi = this.qttFormFlexi.get("departureFlexi").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
    if (count == 52) {
      this.filteredArrivalsFlexi = this.qttFormFlexi.get("arrivalFlexi").valueChanges
        .pipe(
          startWith(''),
          map(location => location.length >= 2 ? this._filterLocations(location) : [])
        );
    }
  }

}
