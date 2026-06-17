import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'firstWord'
  })
  export class GetFirstWord implements PipeTransform
  {
    transform(value: string): string {
        if (!value) { return ''; }
        return value.split(' ')[0];
      }
  }