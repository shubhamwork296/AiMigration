import { ChangeDetectionStrategy, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "enhanced-timeout-dialogs",
    templateUrl: "./enhanced-timeout-dialogs.component.html",
    styleUrls: ['./enhanced-timeout-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
@HostListener('window:resize')
export class EnhancedTimeoutDialogsComponent implements OnInit{
  headerTitle: string = 'Timeout';
  timeoutMessage: string;
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedTimeoutDialogsComponent> ){
  }
    
  ngOnInit() {
    this.timeoutMessage = this.data.Message;
  }

  onProceed() {
    this.dialogRef.close();
  }

}
