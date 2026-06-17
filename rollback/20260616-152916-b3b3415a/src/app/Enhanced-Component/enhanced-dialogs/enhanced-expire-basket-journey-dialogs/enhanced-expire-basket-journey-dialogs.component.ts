import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";


@Component({
  selector: "enhanced-expire-basket-journey-dialogs",
  
  templateUrl: "./enhanced-expire-basket-journey-dialogs.component.html",
  styleUrls: ['./enhanced-expire-basket-journey-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
@HostListener('window:resize')
export class EnhancedExpireBasketJourneyDialogsComponent{
  headerTitle: string = 'Your journey in the basket will expire in 5 minutes';
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedExpireBasketJourneyDialogsComponent> ){
  }
}
