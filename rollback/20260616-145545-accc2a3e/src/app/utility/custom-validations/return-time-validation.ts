import { AbstractControl, ValidatorFn } from "@angular/forms";
import * as moment from 'moment';
import 'moment-timezone';


export function returnTimeValidator(selectedDate, outwardDate, outwardTime): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
        selectedDate = moment(selectedDate).format('YYYY-MM-DD');
        outwardDate = moment(outwardDate).format('YYYY-MM-DD'); 
        if (selectedDate < outwardDate) {
            return { 'validReturnTime': true };
        }
        else if (selectedDate == outwardDate) {
            if (control.value != "" && control.value != undefined) {
                let selectedTime = control.value;
                let time = selectedTime.split(':');
                let selectedTimeOutward = outwardTime;
                let timeOutward = selectedTimeOutward.split(':');
                if ((parseInt(time[0]) < parseInt(timeOutward[0]))) {
                    return { 'validReturnTime': true };
                }
                else if ((parseInt(time[0]) == parseInt(timeOutward[0]))) {
                    if ((parseInt(time[1]) <= parseInt(timeOutward[1]))) {
                        return { 'validReturnTime': true };
                    }
                }

            }
        }
        return null;
    };
}
