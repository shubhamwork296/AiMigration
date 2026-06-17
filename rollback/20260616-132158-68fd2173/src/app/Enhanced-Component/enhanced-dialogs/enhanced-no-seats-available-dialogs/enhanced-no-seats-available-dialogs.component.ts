import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import * as moment from "moment";
import { EnhancedRailCardModel } from "src/app/models/enhanced-mixing-deck/enhanced-railcard.model";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { CommonServices } from "src/app/services/common.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { EnhancedAppRouteEnum, EnhancedReviewBuyAndDeliveryPopUpHeaderEnum } from "src/app/utility/app-constants.service";


@Component({
  selector: "enhanced-no-seats-available-dialogs",
  templateUrl: "./enhanced-no-seats-available-dialogs.component.html",
  styleUrls: ['./enhanced-no-seats-available-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
@HostListener('window:resize')
export class EnhancedNoSeatsAvailableDialogsComponent implements OnInit {
  headerTitle: string;
  message: string;
  ctaText: string;
  enhancedReviewBuyAndDeliveryPopUpHeaderEnum: EnhancedReviewBuyAndDeliveryPopUpHeaderEnum;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  router: Router;

  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedNoSeatsAvailableDialogsComponent> ){
    this.message = this.data.Message;
    this.ctaText = this.data.CTAText;
    this.enhancedReviewBuyAndDeliveryPopUpHeaderEnum = this.injector.get(EnhancedReviewBuyAndDeliveryPopUpHeaderEnum);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.router = this.injector.get(Router);
  }

  ngOnInit(): void {
    if(this.data?.bikeNotAvailable){
      this.headerTitle = this.enhancedReviewBuyAndDeliveryPopUpHeaderEnum?.noBikeAvailableForReservation;
    } else{
      this.headerTitle = this.enhancedReviewBuyAndDeliveryPopUpHeaderEnum?.noSeatAvailableForReservation;
    }
  }

  backToSerch() {
    this.dialogRef.close(true);
  }

   onSelectAnotherTicket() {
    this.dialogRef.close();
    this.router.navigate([`./` + this.enhancedAppRouteEnum.selectTicketAndClass]);
  }


}
