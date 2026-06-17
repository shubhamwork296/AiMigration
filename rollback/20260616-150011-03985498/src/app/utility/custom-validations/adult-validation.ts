import { ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";

export function adultValidator(adultCount: number, adultRemaining: number, selectedRailcard: string, currentRailcardCount: number, railCards:any): ValidatorFn {
    return (_control: AbstractControl):ValidationErrors | null => {
       
        let railcard = railCards.find(item => {
            if (item.Code === selectedRailcard) {
              return true;
            }
          });
          if(railcard != undefined){
            let minAdult = railcard.MinAdult * currentRailcardCount, maxAdult = railcard.MaxAdult * currentRailcardCount;
            if (adultCount > adultRemaining ) {
                return { 'adultValid': true };
            }
            else if (adultCount < minAdult || adultCount > maxAdult ) {
                return { 'adultValidIn': true, 'minValue': minAdult, 'maxValue': maxAdult };
            }
          }

          return null;
       
    };
}
