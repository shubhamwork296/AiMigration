import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-ticket-class-info-popup',
  templateUrl: './ticket-class-info-popup.component.html',
  styleUrls: ['./ticket-class-info-popup.component.css']
})
export class TicketClassInfoPopupComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<TicketClassInfoPopupComponent>) { }

  tabIndex = 0;
  ngOnInit() {
    this.tabIndex = this.getTabIndex();
  }

  getTabIndex() {
    if (this.data.ticketClassType == 'Standard') {
      return 0;
    } else if (this.data.ticketClassType == 'StandardPremium') {
      return 1;
    }
    return 2;
  }
}

