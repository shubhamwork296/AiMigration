import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-cookie-alert-dialog',
  templateUrl: './cookie-alert-dialog.component.html',
  styleUrls: ['./cookie-alert-dialog.component.scss']
})
export class CookieAlertDialogComponent implements OnInit {

  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit(): void {
    // to do someting
  }

  close() {
    this.bsModalRef.hide();
  }
}
