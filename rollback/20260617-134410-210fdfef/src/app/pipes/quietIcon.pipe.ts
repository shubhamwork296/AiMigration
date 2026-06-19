import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'quietIcon',
    standalone: false
})
  export class GetQuietIcon implements PipeTransform
  {
    transform(Facilities) {
     return Facilities.findIndex( (facility)=> {
          if(facility.Name === 'Quiet'){
            return true;
          }
      } )
      }
  }
