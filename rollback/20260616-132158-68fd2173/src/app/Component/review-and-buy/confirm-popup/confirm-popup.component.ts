import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-popup',
  templateUrl: './confirm-popup.component.html',
  styleUrls: ['./confirm-popup.component.css']
})
export class ConfirmPopupComponent {

  constructor(public dialogRef: MatDialogRef<ConfirmPopupComponent>) { }

  public confirmMessage: string;
  public confirmTitle : string;
  public isMyProfilePopUp : boolean = false;
}
