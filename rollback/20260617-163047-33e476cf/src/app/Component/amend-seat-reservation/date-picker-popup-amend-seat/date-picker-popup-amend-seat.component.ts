import { Component, Inject, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared-sibling.service';
import * as moment from 'moment';
import { NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

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
    selector: 'app-date-picker-popup-amend-seat',
    templateUrl: './date-picker-popup-amend-seat.component.html',
    styleUrls: ['./date-picker-popup-amend-seat.component.css'],
    standalone: false
})
export class DatePickerPopupAmendSeatComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly formbuilder: FormBuilder, public dialogRef: MatDialogRef<DatePickerPopupAmendSeatComponent>, private readonly sharedService: SharedService) {
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
  minDate: Date =null;
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
  tempTimeList: string[] = []; 
  isReturnJourney: boolean;

  ngOnInit() {
    this.tempTimeList = this.timeList.filter(_x => true);
    this.minDate= new Date(moment(this.data.StartValidity).toISOString().slice(0,-1));
    this.ngbMinDate = new NgbDate(this.minDate.getFullYear(), this.minDate.getMonth() + 1, this.minDate.getDate());
    this.maxDate = new Date(moment(this.data.EndValidity).toISOString().slice(0,-1));
    this.ngbMaxDate = new NgbDate(this.maxDate.getFullYear(), this.maxDate.getMonth() + 1, this.maxDate.getDate());
    this.TraveltypeReturn = this.data.TraveltypeReturn;
    this.ReturnTimesStart = this.getCorrectedDate(moment.utc(this.data.ReturnTimesStart).format());
    this.DepartureTimesStart = this.getCorrectedDate(moment.utc(this.data.DepartureTimesStart).format());
    this.Traveltype = this.data.Traveltype;
    this.isOutwardLeg = this.data.isOutwardLeg;
    this.IsOpenReturn = this.data.IsOpenReturn;
    let requestedTime = moment.utc(this.DepartureTimesStart).format("HH:mm:ss");
    let tempTime = requestedTime.split(':');
    this.prepopulatedTime = tempTime[0] + ':' + tempTime[1];

    if (this.ReturnTimesStart) {
      let requestedTimeReturn = moment.utc(this.ReturnTimesStart).format("HH:mm:ss");
      let tempTimeReturn = requestedTimeReturn.split(':');
      this.prepopulatedTimeReturn = tempTimeReturn[0] + ':' + tempTimeReturn[1];
    }
    this.prepopulatedDate = new Date(this.DepartureTimesStart.slice(0,-1));
    this.prepopulatedDateReturn = this.ReturnTimesStart ? new Date(this.ReturnTimesStart.slice(0,-1)): null;
    this.createForm();
    this.initializeForm();
    if(this.IsOpenReturn){
      this.tabIndex = 1;
    }
    this.sharedService.railcardStationMasterData = JSON.parse(localStorage.getItem('railcardStationList'));
  this.isReturnJourney = this.data.isReturnJourney;
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
      this.dateTimeForm.patchValue({
        travelType: this.TraveltypeReturn ? this.TraveltypeReturn : 'DEPARTAFTER',
        travelTime: this.prepopulatedTimeReturn ? this.prepopulatedTimeReturn : "00:00"
      });
      this.model = new NgbDate(this.prepopulatedDateReturn.getFullYear(), this.prepopulatedDateReturn.getMonth() + 1, this.prepopulatedDateReturn.getDate());
    }
    // time filter
   this.filterTimeSlots();
  }

  onSelectDate(model){
    if(model == null){
      return;
    }
    this.filterTimeSlots();
  }

  filterTimeSlots() {
    this.tempTimeList  = this.timeList.filter(_x => true);
    let choosedDate = moment.utc(new Date(this.model.year, this.model.month - 1, this.model.day)).toDate();
    let prepopulatedStartTimeSlot = this.prepopulatedTime ? this.prepopulatedTime : this.prepopulatedTimeReturn;

    let endTime = this.getCorrectedDate(moment.utc(this.data.EndValidity).format());
    let requestedEndTime = moment.utc(endTime).format("HH:mm:ss").split(':');
    let prepopulatedEndTimeSlot = requestedEndTime[0] + ':' + requestedEndTime[1];

    if(this.minDate.toDateString() === choosedDate.toDateString()) {
      this.tempTimeList = this.filterTimeSlotUtil(this.timeList, prepopulatedStartTimeSlot, false);
    } 

    if(this.maxDate.toDateString() === choosedDate.toDateString()) {
      if(this.minDate.toDateString() === choosedDate.toDateString()) {
      this.tempTimeList = this.filterTimeSlotUtil(this.tempTimeList, prepopulatedEndTimeSlot, true);
      } else {
      this.tempTimeList = this.filterTimeSlotUtil(this.timeList, prepopulatedEndTimeSlot, true);
      }
    }

    if(this.dateTimeForm.get('travelTime').value && this.tempTimeList.indexOf(this.dateTimeForm.get('travelTime').value) < 0) {
      this.dateTimeForm.patchValue({
        travelTime: this.tempTimeList[0]
      });
    }
  }

  filterTimeSlotUtil(list: string[], timeSlot: string, isEndValidityDate: boolean) {
    let slotIndex = list.indexOf(timeSlot);

    if(isEndValidityDate) {
      return list.filter((_x,index) => {
        return (index <= slotIndex);
      })
    } else {
      return list.filter((_x,index) => {
        return (index >= slotIndex);
      })
    }
}
  applyChanges(){
      this.dialogRef.close({
        travelDate: new Date(this.model.year, this.model.month - 1, this.model.day),
        travelType: this.dateTimeForm.get('travelType').value,
        travelTime: this.dateTimeForm.get('travelTime').value,
        isOpen: false,
        isReturnCase: this.data.isReturnJourney
      });
  }

  onclose(){
    this.dialogRef.close(null);
  }


  getCorrectedDate(isoDate: string) {
    if(moment(isoDate).isValid()) {
      let time = isoDate.split("T")[1].split(":");
      let [approxHour,approxMinute] = [+time[0], +time[1]];
    if(approxMinute > 0 && approxMinute < 30) {
      approxMinute = 0;
    } else if(approxMinute > 30){
      approxMinute = 30;
    }
    return moment.utc(isoDate).hours(approxHour).minutes(approxMinute).toISOString();
    }
    
  }

}
