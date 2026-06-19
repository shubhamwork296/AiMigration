import { Component, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { JourneyList } from 'src/app/models/account/club-avanti.model';
import { AppRouteEnum, ClubAvantiViewPreviousJourneyEnum } from 'src/app/utility/app-constants.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-view-previous-journey-dialog',
    templateUrl: './view-previous-journey-dialog.component.html',
    styleUrls: ['./view-previous-journey-dialog.component.css'],
    standalone: false
})
export class ViewPreviousJourneyDialogComponent{
    headerTitle: string = 'Journey history';
    previousJourneyList: JourneyList[];
    notValidTripTextShow: boolean = false;
    clubAvantiPreviousJourney: boolean = true;
    appRouteEnum: AppRouteEnum;
    clubAvantiViewPreviousJourneyEnum: ClubAvantiViewPreviousJourneyEnum;
    // dialogFooter: string;
  
    constructor(@Inject(MAT_DIALOG_DATA) public data:any, public dialogRef: MatDialogRef<ViewPreviousJourneyDialogComponent>,
    private readonly injector: Injector) { 
      this.appRouteEnum = this.injector.get(AppRouteEnum);
      this.clubAvantiViewPreviousJourneyEnum = this.injector.get(ClubAvantiViewPreviousJourneyEnum);
      if(data){
        this.previousJourneyList = this.data.previousJourneyList;
        this.previousJourneyList?.forEach(e => e['notValidTripTextShow'] = false);
      }
    }

    setQualifyingJourneyText(tripsCompleted){
      if(tripsCompleted == 0 || tripsCompleted == null){
        return 0;
      } else {
        return `+ ${tripsCompleted}`;
      }
    }

    showNotValidJourneyText(journey, selectedIndex){
      this.previousJourneyList?.forEach((e, index) => {
        if(e.BookingRefrenceNumber == journey.BookingRefrenceNumber && index == selectedIndex){ // change booking refrence no with index
          e['notValidTripTextShow'] = !e['notValidTripTextShow'];
        }
      });
    }

    checkNullOrZeroTrips(journey){
      return journey?.TripsCompleted == 0 || journey?.TripsCompleted == null;
    }

    onClickOnTermsAndCondition(){
      window.open(`${environment.qttUrl}${this.appRouteEnum.clubAvantiTermsAndCondition}`, '_blank');
    }
}