import { Component, Inject, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared-sibling.service';
import * as moment from 'moment';
import { NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { environment } from 'src/environments/environment';
import { DeviceDetectorService } from 'ngx-device-detector';


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
  selector: 'app-datepicker-popup',
  templateUrl: './datepicker-popup.component.html',
  styleUrls: ['./datepicker-popup.component.css'],
})
export class DatepickerPopupComponent implements OnInit {
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly formbuilder: FormBuilder, public dialogRef: MatDialogRef<DatepickerPopupComponent>, private readonly sharedService: SharedService, private readonly storageDataService: StorageDataService, private readonly deviceDetectorService: DeviceDetectorService) {
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
  deviceInfo: boolean;
  ngOnInit() {
    this.deviceInfo = this.deviceDetectorService.isMobile();
    this.TraveltypeReturn = this.data.TraveltypeReturn;
    this.ReturnTimesStart = this.data.ReturnTimesStart;
    this.DepartureTimesStart = this.data.DepartureTimesStart;
    this.Traveltype = this.data.Traveltype;
    this.isDeparture = this.data.isDepart;
    this.IsOpenReturn = this.data.IsOpenReturn;
    let requestedTime = moment(this.DepartureTimesStart).format("HH:mm:ss");
    let tempTime = requestedTime.split(':');
    tempTime[1] = tempTime[1] < '15' ? '00' : '30';
    this.prepopulatedTime = tempTime[0] + ':' + tempTime[1];

    if (this.ReturnTimesStart != undefined && this.ReturnTimesStart != null && this.ReturnTimesStart != '') {
      let requestedTimeReturn = moment(this.ReturnTimesStart).format("HH:mm:ss");
      let tempTimeReturn = requestedTimeReturn.split(':');
      tempTimeReturn[1] = tempTimeReturn[1] < '15' ? '00' : '30';
      this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
    }else{
      // if returnDate is undefined null & empty from home page
      if (this.DepartureTimesStart) {
        let returnTimeStartInDateFormat = new Date(this.DepartureTimesStart);
        returnTimeStartInDateFormat.setHours(new Date(returnTimeStartInDateFormat).getHours() + 3);
        let requestedTimeReturn = moment(returnTimeStartInDateFormat).format("HH:mm:ss");
        let tempTimeReturn = requestedTimeReturn.split(':');
        tempTimeReturn[1] = tempTimeReturn[1] < '15' ? '00' : '30';
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

}
