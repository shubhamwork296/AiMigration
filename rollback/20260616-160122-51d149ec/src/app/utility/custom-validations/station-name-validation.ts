import { ValidatorFn, AbstractControl } from "@angular/forms";
import { LocationMasterData } from 'src/app/models/master/location-master.model';

 export function stationNameValidator(locations: LocationMasterData[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
        const filterValue = control.value.toLowerCase();
        let station = locations.filter(location => location.Name.toLowerCase().includes(filterValue));
        if (locations.length > 0 && station.length == 0) {
            return { 'validStation': true };
        }
        return null;
    };
}