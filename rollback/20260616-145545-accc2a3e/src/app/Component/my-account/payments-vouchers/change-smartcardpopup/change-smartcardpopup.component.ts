import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-change-smartcardpopup',
  templateUrl: './change-smartcardpopup.component.html',
  styleUrls: ['./change-smartcardpopup.component.css']
})
export class ChangeSmartcardpopupComponent implements OnInit {


  isChange: boolean;
  isReplace: boolean;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ChangeSmartcardpopupComponent>) { }

  ngOnInit() {
    this.isChange= this.data.changeReplaceRequest.IsChange;
    this.isReplace = this.data.changeReplaceRequest.IsReplace;
  }

  onContinue(num){
    this.dialogRef.close(num);
  }
}
