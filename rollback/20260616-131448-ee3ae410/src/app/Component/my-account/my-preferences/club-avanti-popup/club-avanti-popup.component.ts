import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-club-avanti-popup',
  templateUrl: './club-avanti-popup.component.html',
  styleUrls: ['./club-avanti-popup.component.css']
})
export class ClubAvantiPopupComponent {
  Success: boolean;
  Message: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ClubAvantiPopupComponent>) {
    this.Success = this.data.Success;
    this.Message = this.data.Message;
  }

  updatePreferences() {
    this.dialogRef.close();
  }
}