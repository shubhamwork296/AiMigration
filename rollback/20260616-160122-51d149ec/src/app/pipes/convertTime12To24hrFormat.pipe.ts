import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'convertFrom24To12Format' })
export class TimeFormat implements PipeTransform {
    transform(time: any): any {
        if (time != null) {
            let [timeFormat, AMPM] = time.split(' ');
            let [hours, minutes] = timeFormat.split(':')
            hours = Number(hours);
            minutes = Number(minutes);

            if (AMPM === "PM" && hours < 12) hours = hours + 12;
            if (AMPM === "AM" && hours === 12) hours = hours - 12;
            let sHours = hours.toString();
            let sMinutes = minutes.toString();
            if (hours < 10) sHours = "0" + sHours;
            if (minutes < 10) sMinutes = "0" + sMinutes;
            return (sHours + ":" + sMinutes);
        }
    }
}