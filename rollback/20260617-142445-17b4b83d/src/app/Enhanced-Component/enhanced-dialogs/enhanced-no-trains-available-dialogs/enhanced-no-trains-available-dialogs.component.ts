import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';


@Component({
    selector: "enhanced-no-trains-available-dialogs",
    templateUrl: "./enhanced-no-trains-available-dialogs.component.html",
    styleUrls: ['./enhanced-no-trains-available-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})





export class EnhancedNoTrainAvailableDialogs implements OnInit{
  isMobile = false;
  headerTitle: string;
  errorMessage: string;
  footerBtnText: string;
  isNoTrain: boolean;
  readonly panelOpenState = signal(false);
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedNoTrainAvailableDialogs> ){
    
      console.log('constructor');
      if(data){
        this.headerTitle = this.data?.errorHeading;
        this.errorMessage = this.data?.errorMessage;
        this.footerBtnText = this.data?.footerBtnText;
        this.isNoTrain = this.data?.isNoTrain;
      }
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

  openEdit(){
    if(this.data?.hideCancelbutton){
      this.data?.hideCancelbutton();
    }
  }
   



}
