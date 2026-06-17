import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SmartCardData } from 'src/app/models/account/my-payment-vouchers.model';

@Component({
  selector: 'app-request-successful',
  templateUrl: './request-successful.component.html',
  styleUrls: ['./request-successful.component.css']
})
export class RequestSuccessfulComponent implements OnInit {

  isConfirm : boolean = false;
  isLink : boolean = false;
  isUnlink : boolean = false;
  isRegister : boolean = false;
  isTransfer : boolean = false;
  isOrder : boolean = false;
  unlinkDetails : SmartCardData;
  isMySmartcard : boolean;
  count : number;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<RequestSuccessfulComponent>) { }

  ngOnInit() {
    this.count = this.data.num;
    if(this.count == 1){
      this.isConfirm = true;
    }
    else if(this.count == 2){
      this.isLink = true;
    }
    else if(this.count == 3){
      this.isUnlink = true;
      this.unlinkDetails = this.data.unlinkDetails;
      if(this.data.unlinkDetails.CardOwnerCustomerKey == localStorage.getItem("CustomerKey")){
        this.isMySmartcard = true;
      }
      else{
        this.isMySmartcard = false;
      }
    }
    else if(this.count == 4){
      this.isRegister = true;
    }
    else if(this.count == 5){
      this.isTransfer = true;
    }
    else if(this.count == 6){
      this.isOrder = true;
    }
  }

  onclickOkay(){
    this.dialogRef.close(this.count);
  }

}
