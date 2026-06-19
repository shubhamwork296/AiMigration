import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-loyalty-signup-popup',
    templateUrl: './loyalty-signup-popup.component.html',
    styleUrls: ['./loyalty-signup-popup.component.css'],
    standalone: false
})
export class LoyaltySignupPopupComponent {
  constructor(public dialogRef: MatDialogRef<LoyaltySignupPopupComponent>) { }

  onClosePopup() {
    this.dialogRef.close({ gotItFlag: true });
  }

}
