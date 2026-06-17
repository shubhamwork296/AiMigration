import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ticket-not-found',
  templateUrl: './ticket-not-found.component.html',
  styleUrls: ['./ticket-not-found.component.css']
})
export class TicketNotFoundComponent {
  message:string;
  @Output("openAmend") openAmend: EventEmitter<any> = new EventEmitter();
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<TicketNotFoundComponent>) {
    this.message=this.data.message;
   }

  close(){
    this.openAmend.emit();
    this.dialogRef.close();
  }

}
