import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";


@Component({
    selector: "enhanced-expired-journey-dialogs",
    templateUrl: "./enhanced-expired-journey-dialogs.component.html",
    styleUrls: ['./enhanced-expired-journey-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
@HostListener('window:resize')
export class EnhancedExpiredJourneyDialogsComponent{
  headerTitle: string = 'Your journey has expired';
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedExpiredJourneyDialogsComponent> ){
  }
}
