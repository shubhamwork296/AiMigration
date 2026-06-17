import { ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";

export function childValidator( childCount: number, childRemaining: number, selectedRailcard: string, currentRailcardCount: number, railCards:any): ValidatorFn {
    return (_control: AbstractControl): ValidationErrors | null => {
        
        let railcard = railCards.find(item => {
            if (item.Code === selectedRailcard) {
              return true;
            }
          });
          if(railcard != undefined){
            if(railcard.IsAdultChildShow){                
                
                let  minChild = railcard.MinChild * currentRailcardCount, maxChild = railcard.MaxChild * currentRailcardCount;
                if ( childCount > childRemaining) {
                    return { 'childValid': true };
                }
                else if ( childCount < minChild || childCount > maxChild) {
                    return { 'childValidIn': true, 'minValue': minChild, 'maxValue': maxChild };
                }              
            }
            else{
                if ( childCount > 0) {
                    return { 'childValid': true };
                }  
            }
            
          }

          return null;

        
    };
}
