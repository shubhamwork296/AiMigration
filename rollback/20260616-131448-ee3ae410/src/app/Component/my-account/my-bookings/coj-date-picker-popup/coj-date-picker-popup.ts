import { Component, Inject, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared-sibling.service';
import * as moment from 'moment';
import { NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
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
  selector: 'app-change-time-date-date-picker',
  templateUrl: './coj-date-picker-popup.html',
  styleUrls: ['./coj-date-picker-popup.css']
})
export class CojDatePickerPopupComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly formbuilder: FormBuilder, public dialogRef: MatDialogRef<CojDatePickerPopupComponent>, private readonly sharedService: SharedService, private readonly deviceDetectorService: DeviceDetectorService) {
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
  isDisabled = (date: NgbDate, _current: {month: number}) => {
    let d = new Date(date.year, date.month - 1, date.day)
    let v = d.getTime();
    return this.DisabledDates.indexOf(v) > -1 ? true : false;
  };
  ngbMinDate = null;
  maxDate: Date = null;
  ngbMaxDate = null;
  isOutwardLeg: boolean;
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
  DisabledDates: number[] = [];
  dateStringToShow: string = "";
  deviceInfo: boolean;
  ngOnInit() {
    this.deviceInfo = this.deviceDetectorService.isMobile();
    this.TraveltypeReturn = this.data.TraveltypeReturn;
    this.ReturnTimesStart = this.getCorrectedDate(moment.utc(this.data.ReturnTimesStart).format());
    this.DepartureTimesStart = this.getCorrectedDate(moment.utc(this.data.DepartureTimesStart).format());
    this.Traveltype = this.data.Traveltype;
    this.isOutwardLeg = this.data.isOutwardLeg;
    this.IsOpenReturn = this.data.IsOpenReturn;
    let requestedTime = moment.utc(this.DepartureTimesStart).format("HH:mm:ss");
    let tempTime = requestedTime.split(':');
    this.prepopulatedTime = tempTime[0] + ':' + tempTime[1];

    if (this.ReturnTimesStart != undefined && this.ReturnTimesStart != null && this.ReturnTimesStart != '') {
      let requestedTimeReturn = moment.utc(this.ReturnTimesStart).format("HH:mm:ss");
      let tempTimeReturn = requestedTimeReturn.split(':');
      this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
    }
    this.prepopulatedDate = new Date(this.DepartureTimesStart.slice(0,-1));
    this.prepopulatedDateReturn = new Date(this.ReturnTimesStart.slice(0,-1));
    this.setMaxDate();
    this.createForm();
    this.initializeForm();
    if(this.IsOpenReturn){
      this.tabIndex = 1;
    }
    this.sharedService.railcardStationMasterData = JSON.parse(localStorage.getItem('railcardStationList'));
  this.dateStringToShow = this.getFormattedDateString(this.isOutwardLeg);
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
    if (this.isOutwardLeg) {
      this.dateTimeForm.patchValue({
        travelType: this.Traveltype ? this.Traveltype : `DEPARTAFTER`,
        travelTime: this.prepopulatedTime ? this.prepopulatedTime : "00:00"
      });
      this.model = new NgbDate(this.prepopulatedDate.getFullYear(), this.prepopulatedDate.getMonth() + 1, this.prepopulatedDate.getDate());
    }
    else {
      // PICO-1753 for selected return journey date before the initial outbound date.
      // this.minDate = this.prepopulatedDate;
      // this.ngbMinDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate());
      this.dateTimeForm.patchValue({
        travelType: this.TraveltypeReturn ? this.TraveltypeReturn : 'DEPARTAFTER',
        travelTime: this.prepopulatedTimeReturn ? this.prepopulatedTimeReturn : "00:00"
      });
      this.model = new NgbDate(this.prepopulatedDateReturn.getFullYear(), this.prepopulatedDateReturn.getMonth() + 1, this.prepopulatedDateReturn.getDate());
    }
  }

  onSelectDate(model){
    if(model == null){
      return;
    }
  }
  applyChanges(){
      this.dialogRef.close({
        travelDate: new Date(this.model.year, this.model.month - 1, this.model.day),
        travelType: this.dateTimeForm.get('travelType').value,
        travelTime: this.dateTimeForm.get('travelTime').value,
        isOpen: false
      });
  }

  onclose(){
    this.dialogRef.close(null);
  }


  getCorrectedDate(isoDate: string) {
    let date  = new Date(isoDate);
    let approxMinute = date.getMinutes();
    let approxHour = date.getHours();
    if(approxMinute > 0 && approxMinute < 30) {
      approxMinute = 30;
    } else if(approxMinute > 30){
        approxHour = (approxHour + 1) % 24;
        approxMinute = 0;
    }
    return new Date(date.setHours(approxHour,approxMinute)).toISOString();
  }

  getFormattedDateString(isOutwardLeg: boolean) {
      if(isOutwardLeg) {
        let dateMomentObj = moment(this.data.DepartureTimesStart);
        return `${dateMomentObj.format("ddd DD MMM")}, Depart ${dateMomentObj.format("HH:mm")}`;
      }
      else {
        let dateMomentObj = moment(this.data.ReturnTimesStart);
        return `${dateMomentObj.format("ddd DD MMM")}, Depart ${dateMomentObj.format("HH:mm")}`;
      }
}
}
