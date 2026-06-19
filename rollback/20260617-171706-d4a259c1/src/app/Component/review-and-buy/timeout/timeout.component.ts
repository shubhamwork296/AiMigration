import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-timeout',
    templateUrl: './timeout.component.html',
    styleUrls: ['./timeout.component.css'],
    standalone: false
})
export class TimeoutComponent implements OnInit {

  timeoutMessage: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
   public dialogRef: MatDialogRef<TimeoutComponent>) {

  }

  ngOnInit() {
    this.timeoutMessage = this.data.Message;
  }

  onProceed()
  {
     this.dialogRef.close();
  }

}
