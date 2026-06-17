import { Component, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-soldout-ticket-info-popup',
  templateUrl: './soldout-ticket-info-popup.component.html',
  styleUrls: []
})
export class SoldoutTicketInfoPopupComponent{
  ticketType: string = '';
  headerTitle: string = `Why's that?`;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SoldoutTicketInfoPopupComponent>) {
    if(data?.ticketType){
      this.ticketType = data.ticketType.split(' ')[0];
    }
   }

  closeSoldOutPopup(){
    this.dialogRef.close();
  }

}
