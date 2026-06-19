import { Component, EventEmitter, Injector, Output } from '@angular/core';
import { Router } from '@angular/router';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppRouteEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-earlierlater-timeout-error',
    templateUrl: './earlierlater-timeout-error.component.html',
    styleUrls: ['./earlierlater-timeout-error.component.css'],
    standalone: false
})
export class EarlierLaterTimeoutErrorComponent {
  @Output("openEdit") openEdit: EventEmitter<any> = new EventEmitter();
  searchRequest: SearchRequestModel;
  appRouteEnum: AppRouteEnum;

  constructor(public sharedSibling: SharedService, private readonly router: Router, private readonly injector: Injector) { 
    this.appRouteEnum = this.injector.get(AppRouteEnum);
  }

  openAmendSearch() {
    this.openEdit.emit();
  }

  onGoBack() {
    this.router.navigate(["./"+ this.appRouteEnum.ViewBooking]);
  }  

}
