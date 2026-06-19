import { AbstractControl, ValidatorFn } from "@angular/forms";
import * as moment from 'moment';
import 'moment-timezone';


export function pastTimeValidator(selectedDate): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
      let date = moment(new Date()).format('YYYY-MM-DD');
      selectedDate = moment(selectedDate).format('YYYY-MM-DD');
    
    if (selectedDate <= date) {
      if (control.value != "" && control.value != undefined) {
        let selectedTime = control.value;
        let time = selectedTime.split(':');
        let requestedTime = moment.utc(new Date()).tz('Europe/London').format("HH:mm:ss");
        let tempTime = requestedTime.split(':');
        if ((parseInt(time[0]) < parseInt(tempTime[0]))) {
          return { 'validTime': true };
        }
        else if((parseInt(time[0]) == parseInt(tempTime[0]))){
          if((parseInt(time[1]) < parseInt(tempTime[1]))){
            return { 'validTime': true };
          }
        }
      }
    }
    return null;
  };
}
