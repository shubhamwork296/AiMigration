import { Component, Inject, Injectable, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared-sibling.service';
import * as moment from 'moment';
import { NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { environment } from 'src/environments/environment';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ResponseData } from 'src/app/models/common/response.model';
import { JourneyTypeEnum, BookingTypeEnum } from 'src/app/utility/app-constants.service';


@Injectable()
export class CustomAdapter extends NgbDateAdapter<string> {
  readonly DELIMITER = "-";

  fromModel(value: string | null): NgbDateStruct | null {
    if (value) {
      let date = value.split(this.DELIMITER);
      return {
        day: parseInt(date[2], 10),
        month: parseInt(date[1], 10),
        year: parseInt(date[0], 10)
      };
    }
    return null;
  }

  toModel(date: NgbDateStruct | null): string | null {
    return date
      ? date.day + this.DELIMITER + date.month + this.DELIMITER + date.year
      : null;
  }
}

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */
@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
  readonly DELIMITER = "-";

  parse(parseValue: string): NgbDateStruct | null {
    if (parseValue) {
      let date = parseValue.split(this.DELIMITER);
      return {
        day: parseInt(date[2], 10),
        month: parseInt(date[1], 10),
        year: parseInt(date[0], 10)
      };
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    return date
      ? date.day + this.DELIMITER + date.month + this.DELIMITER + date.year
      : "";
  }
}
@Component({
    selector: 'app-my-bookings-filter-datepicker',
    templateUrl: './my-bookings-filter-datepicker.component.html',
    styleUrls: ['./my-bookings-filter-datepicker.component.css'],
    standalone: false
})
export class MyBookingsFilterDatepickerComponent implements OnInit {
  responseData: ResponseData;
  journeyTypeEnum: JourneyTypeEnum;
  bookingTypeEnum: BookingTypeEnum;

  constructor(public formatter: NgbDateParserFormatter, private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, private readonly formbuilder: FormBuilder, public dialogRef: MatDialogRef<MyBookingsFilterDatepickerComponent>, private readonly sharedService: SharedService, private readonly storageDataService: StorageDataService, private readonly deviceDetectorService: DeviceDetectorService) {
    this.journeyTypeEnum = this.injector.get(JourneyTypeEnum);
    this.bookingTypeEnum = this.injector.get(BookingTypeEnum);

    let halfHourlyDivisionOfDays = 24 * 2;
    for (let i = 0; i < halfHourlyDivisionOfDays; i++) {
      let hh = Math.floor(this.startingTime / 60);
      let mm = (this.startingTime % 60);
      this.timeList[i] = ("0" + hh).slice(-2) + ':' + ("0" + mm).slice(-2);
      this.startingTime += 30;
    }
  }

  startingTime: number = 0;
  timeList: any = [];
  minDate: Date = new Date();
  
  ngbMinDate = null;
  maxDate: Date = null;
  ngbMaxDate = null;
  dateTimeForm: FormGroup;
  model: NgbDateStruct;
  tabIndex: number = 0;
  date: any;
  DisabledDates: number[];
  deviceInfo: boolean;
  diffOfCurrentYearForPast = this.minDate.getFullYear() - 2020; // PICO-2367 getting difference between current year & 2020 year
  diffOfCurrentMonthForPast = this.minDate.getMonth() - 1;
  diffOfCurrentDateForPast = this.minDate.getDate() - 1;
  yearsArray: Array<number> = [];
  defaultSelectedCurrentYear: number;
  isDateSelectedOrNot: boolean = false;

  hoveredDate: NgbDate | null = null;
	fromDate: NgbDate
	toDate: NgbDate | null
  startedMonthOnChangeYear: any

  ngOnInit() {
    this.deviceInfo = this.deviceDetectorService.isMobile();

    this.setMaxDate();
    this.createForm();

    let disabledates = this.storageDataService.getStorageData("disableDates", true);
    if (disabledates && disabledates.length > 0) {
      this.DisabledDates = disabledates.map(x => new Date(x).getTime());
    }
    else {
      this.DisabledDates = [];
    }
    this.getYears();
    this.defaultSelectedCurrentYear = this.minDate.getFullYear();
  }

  getYears() {
    let currentYear = new Date().getFullYear();
    let startYear = 2020;
    for (let i = startYear; i <= currentYear; i++) {
      this.yearsArray.push(startYear);
      startYear++;
    }
    return this.yearsArray;
  }

  // PICO-2367 created method for set calendar dates & months for upcoming, past & season journey
  setMaxDate() {
    // for date set to upcoming calendar
    if (this.data.journeyType == this.journeyTypeEnum.upcomingJourney) {
      this.ngbMinDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate());

      this.addMonthOrDaysInCurrentDate();

      this.ngbMaxDate = new NgbDate(this.maxDate.getFullYear(), this.maxDate.getMonth() + 1, this.maxDate.getDate());

    } // for date set to past calendar
    else if (this.data.journeyType == this.journeyTypeEnum.pastJourney) {
      this.ngbMinDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() - this.diffOfCurrentMonthForPast, this.minDate.getDate() - this.diffOfCurrentDateForPast);
      
      this.addMonthOrDaysInCurrentDate();

      this.ngbMaxDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate() - 1);

    } // for date set to season calendar
    else {
      this.ngbMinDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() - this.diffOfCurrentMonthForPast, this.minDate.getDate() - this.diffOfCurrentDateForPast);
      
      this.addMonthOrDaysInCurrentDate();

      this.ngbMaxDate = new NgbDate(this.maxDate.getFullYear(), this.maxDate.getMonth() + 1, this.maxDate.getDate());
    }
  }
  createForm() {
    this.dateTimeForm = this.formbuilder.group({
      travelType: new FormControl('', [Validators.required]),
      travelTime: new FormControl('', [Validators.required]),
    });
  }

  applyChanges() {
    if (this.isDateSelectedOrNot) {
      if (this.fromDate && !this.toDate) {
        this.toDate = this.fromDate;
      }
      this.dialogRef.close({
        fromDate: new Date(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day),
        toDate: new Date(this.toDate.year, this.toDate.month - 1, this.toDate.day),
        travelType: this.dateTimeForm.get('travelType').value,
        travelTime: this.dateTimeForm.get('travelTime').value,
        isOpen: false
      });
    }
  }

  onclose() {
    this.dialogRef.close(null);
  }

  onYearChange(event) {
    this.startedMonthOnChangeYear = {
      "year": event.value,
      "month": new Date().getMonth() + 1,
      "day": ''
    };
    this.fromDate = null;
    this.toDate = null;
    this.isDateSelectedOrNot = false;
    let selectedYear = event.value;
    let getDiffbetweenMonths = 12 - this.minDate.getMonth();
    let getMonthDate = this.minDate.getMonth() + getDiffbetweenMonths;
    let checkDate = new Date(selectedYear, getMonthDate, 0).getDate(); // getting the number of days in the month
    // for date set to past calendar when select year in dropdown
    if (this.data.journeyType == this.journeyTypeEnum.pastJourney) {
      this.ngbMinDate = new NgbDate(selectedYear, this.minDate.getMonth() - this.diffOfCurrentMonthForPast, this.minDate.getDate() - this.diffOfCurrentDateForPast);
      
      this.addMonthOrDaysInCurrentDate();

      if (selectedYear != this.minDate.getFullYear()) {
        this.ngbMaxDate = new NgbDate(selectedYear, this.minDate.getMonth() + getDiffbetweenMonths, checkDate);
      } else {
        this.ngbMaxDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate() - 1);
      }

    } // for date set to season calendar when select year in dropdown
    else if (this.data.journeyType == this.bookingTypeEnum.Season) {
      this.ngbMinDate = new NgbDate(selectedYear, this.minDate.getMonth() - this.diffOfCurrentMonthForPast, this.minDate.getDate() - this.diffOfCurrentDateForPast);
      
      this.addMonthOrDaysInCurrentDate();
      
      if (selectedYear != this.minDate.getFullYear()) {
        this.ngbMaxDate = new NgbDate(selectedYear, this.minDate.getMonth() + getDiffbetweenMonths, checkDate);
      } else {
        this.ngbMaxDate = new NgbDate(selectedYear, this.maxDate.getMonth() + 1, this.maxDate.getDate());
      }
    }
  }

  addMonthOrDaysInCurrentDate() {
    if (environment.maxDateByMonth) {
      this.maxDate = moment(this.minDate).add(environment.MaxDateByCount, 'months').toDate();
    } else {
      this.maxDate = moment(this.minDate).add(environment.MaxDateByCount, 'days').toDate();
    }
  }

  onDateSelection(date: NgbDate) {
    this.isDateSelectedOrNot = true;
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
    if (date == null) {
      return;
    }
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }

  // created method to add css for check hover date is after from date or not
  checkHoverDateBeforeFromDate() {
    if (this.hoveredDate.after(this.fromDate)) {
      return true;
    }
  }

}
