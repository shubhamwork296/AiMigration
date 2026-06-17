import { Component, EventEmitter, Input, Output, TemplateRef } from "@angular/core";
import { CustomerServiceService } from "src/app/services/customer-service.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-basic-dialog",
  templateUrl: "./basic-dialog.component.html",
  styleUrls: ['./basic-dialog.component.css']
})
export class BasicDialogComponent {
  @Input()
  public dialogTitle: string;

  @Input()
  public iconClose: boolean = true;

  @Input()
  public dialogFooter: TemplateRef<any>;

  @Input()
  public buttonCancel: string | TemplateRef<any>;

  @Input()
  public buttonAcceptTitle: string;

  @Output()
  public onComplete: EventEmitter<any> = new EventEmitter<any>(true);

  @Input()
  public sentEmailSuccessCheck: boolean = false;

  @Input() public commonDisplayedIcon: string;

  @Input() public showIdleTimer: string;

  @Input() public changeEmailIcon: string;

  @Input() public trainLiveStatusIcon: boolean = false;

  @Input() public trackMyTrainInfoIcon: boolean = false;

  @Input()
  public isShowFooter: boolean = true;

  @Input()
  public verifyEmailError: boolean = false;

  @Input()
  clubAvantiTrainTicketIcon: boolean = false;

  @Input()
  clubAvantiRewardHotDrinkIcon: boolean = false;

  @Input()
  clubAvantiPreviousJourney: boolean = false;

  @Input()
  discountCodeIconInCaseOfCOJ: boolean = false;

  @Input()
  public accountClosureCloseBtn: boolean = false;
  constructor(private readonly customerServiceService: CustomerServiceService){

  }

  public handleCancel() {
    this.onComplete.emit(false);
  }

  public cancelButtonType() {
    if (this.buttonCancel instanceof TemplateRef) {
        return 'template';
      }
      return 'string';
  }

  public handleAccept() {
    this.onComplete.emit(true);
  }

  closeAccount() {
      this.customerServiceService.logout('');
      window.location.href = environment.qttUrl;
  }
}