import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";


@Component({
  selector: "enhanced-change-delivery-option-dialogs",
  
  templateUrl: "./enhanced-change-delivery-option-dialogs.component.html",
  styleUrls: ['./enhanced-change-delivery-option-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
@HostListener('window:resize')
export class EnhancedChangeDeliveryOptionDialogsComponent{
  headerTitle: string = 'Are you sure you want to change your delivery option?';
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedChangeDeliveryOptionDialogsComponent> ){
  }

  proceed(){
    this.dialogRef.close(true);
  }
}
