import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {

  mainHeading = "";
  subHeading = "";
  options: string[] = [];
  @Output() OnClose = new EventEmitter();
  isShow: boolean = false;
  title: string = "";
  buttonHeading1: string = "";
  buttonHeading2: string = "";
  constructor(public bsModalRef: BsModalRef) { }
 
  ngOnInit(): void {
    this.isShow = true;
  }

  close() {
    this.OnClose.next('');
    this.bsModalRef.hide();
  }

  onSubmit(action: any) {
    this.OnClose.next(action);
    this.bsModalRef.hide();
  }

}
