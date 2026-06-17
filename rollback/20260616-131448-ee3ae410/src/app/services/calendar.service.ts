import { Injectable, Injector} from '@angular/core';
import { NotificationService } from '../utility/toastr-notification/toastr-notification.service';
import {v4 as uuid} from 'uuid';
@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    notificationService: NotificationService;
    constructor (private readonly injector: Injector) {
        this.notificationService = this.injector.get(NotificationService);
    }

    createEvent = (events: {
        start: Date,
        end?: Date,
        summary: string,
        description?: string,
        location?: string, url?: string
      }[]) => {
        let formattedCalendardata = this.formattingCalendarData(events);
        if(formattedCalendardata){
            return formattedCalendardata;
        } else{
            this.notificationService.error("Something went wrong. Please try again later.");
        }
    }

    formattingCalendarData (events: {
        start: Date,
        end?: Date,
        summary: string,
        description?: string,
        location?: string, url?: string
      }[]) {
        let calendarData =
        "BEGIN:VCALENDAR\n" +
        "CALSCALE:GREGORIAN\n" +
        "METHOD:PUBLISH\n" +
        "PRODID:-//Booking Cal//EN\n" +
        "VERSION:2.0\n" 
        for (const event of events) {
          const timeStamp = this.formattingDateForCalendar(event.start, false);
          const data = "BEGIN:VEVENT\n" +
          "DTSTAMP;VALUE=DATETIME:" +
          timeStamp +
          "\n" +
          "UID:" +
          this.generateUUID() +
          "\n" +
          "DTSTART;VALUE=DATETIME:" +
          this.formattingDateForCalendar(event.start, false) +
          "\n" +
          "DTEND;VALUE=DATETIME:" +
          this.formattingDateForCalendar(event.end, false) +
          "\n" +
          "LOCATION:" +
          event.location +
          "\n" +
          "SUMMARY:" +
          event.summary +
          "\n" +
          "DESCRIPTION:" +
          event.description +
          "\n" +
          "END:VEVENT\n"
          calendarData += data
        }
        calendarData += "END:VCALENDAR";
        return calendarData;
    }

    formattingDateForCalendar (date: Date, isThisForFileName): string {
        let monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        if (!date) {
          return ''
        }
        // don't use date.toISOString() here, it will be always one day off (cause of the timezone)
        const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
        let month = (date.getMonth() < 9) ? '0' + (date.getMonth()+1) : (date.getMonth()+1);
        let monthFileNameIndex = date.getMonth();
        let monthFileName = '';
        if (isThisForFileName) {
            monthFileName = monthName[monthFileNameIndex];
        }
        const year = date.getFullYear();
        const hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
        const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return isThisForFileName ? `${day}${monthFileName}${year}` : `${year}${month}${day}T${hour}${minutes}${seconds}`;
    }

    download(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        if (typeof element.download === 'undefined') {
            element.setAttribute('target', '_blank');
        }
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    generateUUID (){
        return uuid();
    }
}