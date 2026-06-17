import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByIsHide'
})
export class FilterByIsHidePipe implements PipeTransform {
  transform(value: any[], ...args: any[]): any[] {
    return value.filter(item => item.IsHide === false && item.DeliveryMode.toUpperCase() !== 'FRT');
  }
}