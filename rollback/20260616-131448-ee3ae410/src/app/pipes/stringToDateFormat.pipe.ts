import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'stringToDateFormat'
  })
  export class GetStringToDateFormat implements PipeTransform {
    transform(expiryDate): string {
        const [date, month, year] = expiryDate.split('/');
        return new DatePipe('en').transform(new Date(year, month, date), 'dd/MM/yy');
    }
  }