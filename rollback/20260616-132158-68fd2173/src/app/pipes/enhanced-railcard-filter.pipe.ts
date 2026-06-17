import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Pipe({
  name: 'railcardFilter'
})
export class EnhancedRailCardFilterPipe implements PipeTransform {
  transform(items: AbstractControl[], callback: (item: AbstractControl) => boolean): AbstractControl[] {
    return items.filter(callback);
  }
}