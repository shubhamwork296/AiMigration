import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, ViewChild, Injector } from "@angular/core";
import { FormBuilder, FormGroup, FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NgbDate, NgbDatepicker, NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import * as moment from 'moment'; 
import { DeviceDetectorService } from "ngx-device-detector";
import { environment } from "../../../../environments/environment";
import { DatepickerPopupComponent } from "../../../Component/mixing-deck/datepicker-popup/datepicker-popup.component";
import { SharedService } from "../../../services/shared-sibling.service";
import { StorageDataService } from "../../../services/storage-data.service";
import { MatTabGroup } from "@angular/material/tabs";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { EnhancedSearchTypeEnum } from "src/app/utility/app-constants.service";
import { CommonServices } from "src/app/services/common.service";


@Component({
    selector: "EnhancedDatepickerPopupComponent",
    templateUrl: "./enhanced-datepicker-popup-dialogs.component.html",
    styleUrls: ['./enhanced-datepicker-popup-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})

export class EnhancedDatepickerPopupComponent implements OnInit{
  @ViewChild('dp') datePicker: NgbDatepicker;
  isMobile: boolean = false;
    headerTitle: string;
    readonly panelOpenState = signal(false);
    displayMonths = 2;
    enhancedSearchTypeEnum: EnhancedSearchTypeEnum;
    commonServices: CommonServices;
    constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, private readonly formbuilder: FormBuilder, public dialogRef: MatDialogRef<DatepickerPopupComponent>, private readonly sharedService: SharedService, private readonly storageDataService: StorageDataService, private readonly deviceDetectorService: DeviceDetectorService, private readonly breakpointObserver: BreakpointObserver) {
      let halfHourlyDivisionOfDays = 24 * 2;
      for (let i = 0; i < halfHourlyDivisionOfDays; i++) {
        let hh = Math.floor(this.startingTime / 60);
        let mm = (this.startingTime % 60);
        this.timeList[i] = ("0" + hh).slice(-2) + ':' + ("0" + mm).slice(-2);
        this.startingTime += 30;
      }

      this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
        if (result) {
          this.displayMonths = result.matches ? 1 : 2;
        }
      });
      this.enhancedSearchTypeEnum =  this.injector.get(EnhancedSearchTypeEnum);
      this.commonServices = this.injector.get(CommonServices);
    }
  
    startingTime: number = 0;
    timeList: any = [];
    minDate: Date = new Date();
    isDisabled = (date: NgbDate, _current: { month: number }) => {
      let d = new Date(date.year, date.month - 1, date.day)
      let v = d.getTime();
      return this.DisabledDates.indexOf(v) > -1 ? true : false;
    };
    ngbMinDate = null;
    maxDate: Date = null;
    ngbMaxDate = null;
    isDeparture: boolean;
    dateTimeForm: FormGroup;
    prepopulatedTime: any;
    prepopulatedDate: any;
    prepopulatedTimeReturn: any;
    prepopulatedDateReturn: any;
    model: NgbDateStruct;
    tabIndex: number = 0;
    date: any;
    TraveltypeReturn: string;
    ReturnTimesStart: string;
    DepartureTimesStart: string;
    Traveltype: string;
    IsOpenReturn: boolean;
    DisabledDates: number[];
    tabLabel: string = 'Specific Date';
    isTablet: boolean = false;
    @ViewChild('tabGroup') tabGroup!: MatTabGroup;
    ngOnInit() {
      this.displayMonths = window.innerWidth < 768 ? 1 : 2;
      this.isMobile = this.deviceDetectorService.isMobile();
      this.isTablet = this.deviceDetectorService.isTablet();
      this.TraveltypeReturn = this.data.TraveltypeReturn;
      this.ReturnTimesStart = this.data.ReturnTimesStart;
      this.DepartureTimesStart = this.data.DepartureTimesStart;
      this.Traveltype = this.data.Traveltype;
      this.isDeparture = this.data.isDepart;
      this.IsOpenReturn = this.data.IsOpenReturn;
      let requestedTime = moment(this.DepartureTimesStart).format("HH:mm:ss");
      let tempTime = requestedTime.split(':');
      tempTime[1] = this.returnMinutes(tempTime[1]);
      this.prepopulatedTime = tempTime[0] + ':' + tempTime[1];
  
      if (this.commonServices.isNonEmpty(this.ReturnTimesStart)) {
        let requestedTimeReturn = moment(this.ReturnTimesStart).format("HH:mm:ss");
        let tempTimeReturn = requestedTimeReturn.split(':');
        tempTimeReturn[1] = this.returnMinutes(tempTimeReturn[1]);
        this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
      }else{
        // if returnDate is undefined null & empty from home page
        if (this.DepartureTimesStart) {
          let returnTimeStartInDateFormat = new Date(this.DepartureTimesStart);
          returnTimeStartInDateFormat.setHours(new Date(returnTimeStartInDateFormat).getHours() + 3);
          let requestedTimeReturn = moment(returnTimeStartInDateFormat).format("HH:mm:ss");
          let tempTimeReturn = requestedTimeReturn.split(':');
          tempTimeReturn[1] = this.returnMinutes(tempTimeReturn[1]);
          this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
          this.ReturnTimesStart = returnTimeStartInDateFormat.toString();
        }
      }
      this.prepopulatedDate = new Date(this.DepartureTimesStart);
      this.prepopulatedDateReturn = new Date(this.ReturnTimesStart);
      this.setMaxDate();
      this.createForm();
      this.initializeForm();
      if (this.IsOpenReturn) {
        this.tabIndex = 1;
      }
      let disabledates = this.storageDataService.getStorageData("disableDates", true);
      if (disabledates && disabledates.length > 0) {
        this.DisabledDates = disabledates.map(x => new Date(x).getTime());
      }
      else {
        this.DisabledDates = [];
      }
      this.headerTitle = this.isDeparture ? this.enhancedSearchTypeEnum?.outwardDateAndTime : this.enhancedSearchTypeEnum?.returnDateAndTime;
    }

    ngAfterViewInit() {
      // Get the selected tab label on page load
      this.tabLabel = this.tabGroup._tabs.toArray()[this.tabGroup.selectedIndex]?.textLabel;
    }

    // PICO-2127 created method for 3 months dates are visible from the current date in booking flow.
    setMaxDate() {
      this.ngbMinDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate());
      if (environment.maxDateByMonth) {
        this.maxDate = moment(this.minDate).add(environment.MaxDateByCount, 'months').toDate();
      } else {
        this.maxDate = moment(this.minDate).add(environment.MaxDateByCount, 'days').toDate();
      }
      this.ngbMaxDate = new NgbDate(this.maxDate.getFullYear(), this.maxDate.getMonth() + 1, this.maxDate.getDate());
    }
    createForm() {
      this.dateTimeForm = this.formbuilder.group({
        travelType: new FormControl('', [Validators.required]),
        travelTime: new FormControl('', [Validators.required]),
      });
    }
  
    initializeForm() {
      if (this.isDeparture) {
        this.dateTimeForm.patchValue({
          travelType: this.Traveltype,
          travelTime: this.prepopulatedTime
        });
        this.model = new NgbDate(this.prepopulatedDate.getFullYear(), this.prepopulatedDate.getMonth() + 1, this.prepopulatedDate.getDate());
      }
      else {
        this.minDate = this.prepopulatedDate;
        this.ngbMinDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate());
        this.model = new NgbDate(this.prepopulatedDateReturn.getFullYear(), this.prepopulatedDateReturn.getMonth() + 1, this.prepopulatedDateReturn.getDate());
        this.dateTimeForm.patchValue({
          travelType: this.TraveltypeReturn == undefined ? 'DEPARTAFTER' : this.TraveltypeReturn,
          travelTime: this.prepopulatedTimeReturn == undefined ? "00:00" : this.prepopulatedTimeReturn
        });
      }
      setTimeout(() => {
        if (this.datePicker) {
          this.navigateToSelectedDate();
        }
      }, 0);
    }
  
    onSelectDate(model) {
      if (model == null) {
        return;
      }
    }
    applyChanges() {
      this.dialogRef.close({
        travelDate: new Date(this.model.year, this.model.month - 1, this.model.day),
        travelType: this.dateTimeForm.get('travelType').value,
        travelTime: this.dateTimeForm.get('travelTime').value,
        isOpen: false
      });
    }
  
    onclose() {
      this.dialogRef.close(null);
    }
  
    openReturn() {
      this.dialogRef.close({
        isOpen: true
      });
    }
  
    onTabChange(event: any): void {
      this.tabLabel = event.tab.textLabel;
    }

  navigateToSelectedDate() {
    try {
      let selectedMonth = this.model?.month;
      let selectedYear = this.model?.year;
      if (this.isMobile || this.isTablet) {
        this.datePicker?.navigateTo({
          year: selectedYear,
          month: selectedMonth
        });
      } else {
        let navMonth = selectedMonth - 1;
        let navYear = selectedYear;
        if (navMonth === 0) {
          navMonth = 12;
          navYear -= 1;
        }
        this.datePicker?.navigateTo({ year: navYear, month: navMonth });
      }
    } catch (error) { console.log(error); }
  }
  
  returnMinutes(value){
    return value < '15' ? '00' : '30';
  }
}