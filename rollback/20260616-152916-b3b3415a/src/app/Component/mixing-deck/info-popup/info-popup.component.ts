import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.css']
})
export class InfoPopupComponent {

  message: string;
  ctaText: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<InfoPopupComponent>) {
    this.message = this.data.Message;
    this.ctaText = this.data.CTAText;
  }


  confirm() {
    this.dialogRef.close();
  }
}
