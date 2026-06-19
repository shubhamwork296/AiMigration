import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})

export class EnhancedRxjsSubjectsCommonService {
    returnDatePickerDataSubject = new BehaviorSubject<any>({});

    // Expose as observable to prevent direct mutation
    sharedData$: Observable<any> = this.returnDatePickerDataSubject.asObservable();
    eventSubject = new Subject<any>();
    // Observable for parent to subscribe
    event$ = this.eventSubject.asObservable();

    // Update shared data
    setSharedData(data: any) {
        this.returnDatePickerDataSubject.next(data);
    }

    // Optionally get latest value
    get currentData(): any {
        return this.returnDatePickerDataSubject.getValue();
    }

    // Method for children/dialog to emit
    triggerEvent(data?: any) {
        this.eventSubject.next(data);
    }
}