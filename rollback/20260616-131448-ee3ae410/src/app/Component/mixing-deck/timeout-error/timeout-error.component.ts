import { Component, EventEmitter, Output } from '@angular/core';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { SharedService } from 'src/app/services/shared-sibling.service';

@Component({
  selector: 'app-timeout-error',
  templateUrl: './timeout-error.component.html',
  styleUrls: ['./timeout-error.component.css']
})
export class TimeoutErrorComponent {
  @Output("openEdit") openEdit: EventEmitter<any> = new EventEmitter();
  searchRequest: SearchRequestModel;
  constructor( public sharedSibling:SharedService ) { }
  
  openAmendSearch() {
    this.openEdit.emit();
  }

}
