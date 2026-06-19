import { ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";

 export function railcardPerPassengerValidator(_railcardCounts: number, adultCount: number, childCount: number, selectedRailcard: string, currentRailcardCount: number, railCards:any): ValidatorFn {

    return (_control: AbstractControl): ValidationErrors  | null => {
       
        let railcard = railCards.find(item => {
            if (item.Code === selectedRailcard) {
              return true;
            }
          });
          if(railcard != undefined){
            if(railcard.Code === 'DIC'){
                let minChild = railcard.MinChild*currentRailcardCount;

                if( childCount < minChild){
                return { 'disableChildValid': true, 'childCount': minChild };
                }
            }
            else{
                let minAdult = railcard.MinAdult*currentRailcardCount, 
                maxAdult = railcard.MaxAdult*currentRailcardCount;

                if( adultCount < minAdult){
                return { 'railcardValid': true, 'minValue': minAdult, 'maxValue': maxAdult  };
                }
            }
          }

          return null;
          
    };
}

