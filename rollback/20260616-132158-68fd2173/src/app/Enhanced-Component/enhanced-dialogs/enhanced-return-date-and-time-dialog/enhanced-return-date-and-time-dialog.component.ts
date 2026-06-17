import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';

@Component({
  selector: "enhanced-return-date-and-time-dialog",
  templateUrl: "./enhanced-return-date-and-time-dialog.component.html",
  styleUrls: ['./enhanced-return-date-and-time-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class EnhancedReturnDateAndTimeDialog implements OnInit{
  isMobile = false;
    headerTitle: string = `Return date and time`;
    readonly panelOpenState = signal(false);
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedReturnDateAndTimeDialog> ){
      
        console.log('constructor');
    }
    
    ngOnInit(): void {
      this.checkMobile();
    }

    @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
   
}