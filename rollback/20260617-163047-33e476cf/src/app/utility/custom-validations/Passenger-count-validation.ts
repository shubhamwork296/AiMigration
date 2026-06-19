import { ValidatorFn, AbstractControl } from "@angular/forms";

 export function passengerCountValidator(adultCount: number, childCount: number): ValidatorFn {
    return (_control: AbstractControl): { [key: string]: boolean } | null => {
        if ((adultCount + childCount) < 1) {
            return { 'passengerCount': true };
        }
        return null;
    };
}
