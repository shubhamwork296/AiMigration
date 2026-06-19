import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';


@Component({
    selector: "enhanced-Railcard-restrictions-dialogs",
    templateUrl: "./enhanced-Railcard-restrictions-dialogs.component.html",
    styleUrls: ['./enhanced-Railcard-restrictions-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})





export class EnhancedRailcardRestrictionsDialogs implements OnInit{
  isMobile = false;
    headerTitle: string = `Railcard not applied`;
    readonly panelOpenState = signal(false);
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedRailcardRestrictionsDialogs> ){
      
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
