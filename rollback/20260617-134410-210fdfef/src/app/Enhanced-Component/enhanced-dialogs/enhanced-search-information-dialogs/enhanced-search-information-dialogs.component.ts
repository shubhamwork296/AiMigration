import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';


@Component({
    selector: "enhanced-search-information-dialogs",
    templateUrl: "./enhanced-search-information-dialogs.component.html",
    styleUrls: ['./enhanced-search-information-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
@HostListener('window:resize')
export class EnhancedSearchInformationDialogs implements OnInit{
  isMobile = false;
  headerTitle: string;
  readonly panelOpenState = signal(false);
  message: string;
  isReturn: boolean = false;
  footerBtnText: string = 'Back to tickets';
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedSearchInformationDialogs> ){
  }
    
  ngOnInit(): void {
    if(this.data){
      this.message = this.data?.Message;
      this.isReturn = this.data?.isReturn;
      this.footerBtnText = this.data?.heading ? 'OK' : this.footerBtnText;
      this.headerTitle = this.data?.heading ? this.data?.heading : `Something went wrong with your search`;
    }
    this.checkMobile();
  }

    
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
   



}
