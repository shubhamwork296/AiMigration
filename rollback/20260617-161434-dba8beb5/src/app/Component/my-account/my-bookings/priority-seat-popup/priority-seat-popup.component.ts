import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-priority-seat-popup',
    templateUrl: './priority-seat-popup.component.html',
    styleUrls: ['./priority-seat-popup.component.css'],
    standalone: false
})
export class PrioritySeatPopupComponent {

  constructor(public dialogRef: MatDialogRef<PrioritySeatPopupComponent>) { }

  confirm(){
    this.dialogRef.close(true);
  }
  onClose(){
    this.dialogRef.close(false);
  }

}
