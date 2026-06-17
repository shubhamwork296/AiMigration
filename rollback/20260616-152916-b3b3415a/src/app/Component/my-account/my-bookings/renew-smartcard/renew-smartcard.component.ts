import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-renew-smartcard',
  templateUrl: './renew-smartcard.component.html',
  styleUrls: ['./renew-smartcard.component.css']
})
export class RenewSmartcardComponent {

  constructor(public dialogRef:MatDialogRef<RenewSmartcardComponent>) { }

}
