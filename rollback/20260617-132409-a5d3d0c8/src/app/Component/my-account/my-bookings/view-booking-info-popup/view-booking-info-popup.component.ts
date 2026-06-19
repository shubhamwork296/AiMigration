import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-view-booking-info-popup',
    templateUrl: './view-booking-info-popup.component.html',
    styleUrls: ['./view-booking-info-popup.component.css'],
    standalone: false
})
export class ViewBookingInfoPopupComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ViewBookingInfoPopupComponent>,) { }

}
