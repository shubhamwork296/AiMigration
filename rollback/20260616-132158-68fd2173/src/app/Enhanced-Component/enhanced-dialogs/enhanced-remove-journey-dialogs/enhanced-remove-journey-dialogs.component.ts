import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";


@Component({
  selector: "enhanced-remove-journey-dialogs",
  
  templateUrl: "./enhanced-remove-journey-dialogs.component.html",
  styleUrls: ['./enhanced-remove-journey-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
@HostListener('window:resize')
export class EnhancedRemoveJourneyDialogsComponent{
  headerTitle: string = 'Remove this journey?';
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedRemoveJourneyDialogsComponent> ){
  }
}
