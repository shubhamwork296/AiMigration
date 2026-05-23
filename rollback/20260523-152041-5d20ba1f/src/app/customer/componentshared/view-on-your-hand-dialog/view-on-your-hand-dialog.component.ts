import { Component, EventEmitter, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppConstants } from 'src/app/core/constants/app-constants';

@Component({
  selector: 'app-view-on-your-hand-dialog',
  templateUrl: './view-on-your-hand-dialog.component.html',
  styleUrls: ['./view-on-your-hand-dialog.component.scss']
})
export class ViewOnYourHandDialogComponent  {

  opacity : any = 0
  ring_url = ''
  currentSection : any = 'home'
  upload_hand_bas64_image : string = ''
  @Output() OnClose = new EventEmitter();
  zoomInOut : any = 0
  ringOnFingure : string  = 'two_ring'
  imageRings: any = ['first_ring','two_ring','three_ring','four_ring']
  AppConstants : any  =AppConstants
  constructor(public bsModalRef: BsModalRef) { 
  }

 

  pitch(event: any) {
    this.opacity = event.value
  }
  close() {
    this.OnClose.next('');
    this.bsModalRef.hide();
  }

  zoom()
  {
    if(this.zoomInOut == 0)
    {
      this.zoomInOut = 1
    }
    else {
      this.zoomInOut = 0
    }
  }

  setRing(value : string)
  {
    this.ringOnFingure = value
  }
}
