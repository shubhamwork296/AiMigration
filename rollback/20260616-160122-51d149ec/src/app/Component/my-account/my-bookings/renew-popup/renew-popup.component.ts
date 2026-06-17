import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-renew-popup',
  templateUrl: './renew-popup.component.html',
  styleUrls: ['./renew-popup.component.css']
})
export class RenewPopupComponent {
  message:string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<RenewPopupComponent>
  ) {
    this.message = this.data.message;
   }

}
