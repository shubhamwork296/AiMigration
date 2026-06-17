import { CUSTOM_ELEMENTS_SCHEMA, NgModule, OnInit } from "@angular/core";
import { MyAccountRoutingModule } from "../route/my-account-routing.module";
import { PaymentsVouchersComponent } from "../Component/my-account/payments-vouchers/payments-vouchers.component";
import { SharedModule } from "./shared.module";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { AngularMaterialModule } from "../material/material-module";
import { MyPreferencesComponent } from "../Component/my-account/my-preferences/my-preferences.component";
import { MyBookingsComponent } from "../Component/my-account/my-bookings/my-bookings.component";
import { AmendReviewBuyComponent } from "../Component/amend-review-buy/amend-review-buy.component";
import { AmendSeatReservationComponent } from "../Component/amend-seat-reservation/amend-seat-reservation.component";
import { CojMixingDeckComponent } from "../Component/coj-mixing-deck/coj-mixing-deck.component";
import { CojReviewAndBuyComponent } from "../Component/coj-review-and-buy/coj-review-and-buy.component";
import { RefundBookingComponent } from "../Component/my-account/my-bookings/refund-booking/refund-booking.component";
import { ViewBookingComponent } from "../Component/my-account/my-bookings/view-booking/view-booking.component";
import { MyProfileComponent } from "../Component/my-account/my-profile/my-profile.component";
import { OrderSmartcardComponent } from "../Component/my-account/payments-vouchers/order-smartcard/order-smartcard.component";
import { ReplaceSmartcardComponent } from "../Component/my-account/payments-vouchers/replace-smartcard/replace-smartcard.component";

import { UpgradeTicketsComponent } from "../Component/upgrade-tickets/upgrade-tickets.component";
import { MyAccountTicketInfoPopupComponent } from "../Component/my-account/my-account-ticket-info-popup/my-account-ticket-info-popup.component";
import { ChangeEmailModalComponent } from "../Component/my-account/my-profile/change-email-modal/change-email-modal.component";
import { ResetEmailComponent } from "../Component/my-account/my-profile/reset-email/reset-email.component";
import { VerifyEmailComponent } from "../Component/my-account/my-bookings/verify-email/verify-email.component";
import { MyBookingsFilterDatepickerComponent } from "../Component/my-account/my-bookings/my-bookings-filter-datepicker/my-bookings-filter-datepicker.component";
import { ClubAvantiComponent } from "../Component/my-account/club-avanti/club-avanti.component";
import { ClubAvantiBasicDialogComponent } from "../Component/my-account/club-avanti/club-avanti-basic-dialog/club-avanti-basic-dialog.component";
import { ViewPreviousJourneyDialogComponent } from "../Component/my-account/club-avanti/view-previous-journey-dialog/view-previous-journey-dialog.component";
import { NgxBarcode6Module } from 'ngx-barcode6';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { StyleSwitcherService } from "../services/style-Switcher-Service.service";
import { FilePathEnum } from "../utility/app-constants.service";
@NgModule({
    declarations: [MyBookingsComponent, MyPreferencesComponent, PaymentsVouchersComponent, OrderSmartcardComponent, ReplaceSmartcardComponent
    ,MyProfileComponent, ViewBookingComponent, CojMixingDeckComponent, CojReviewAndBuyComponent, UpgradeTicketsComponent, CojReviewAndBuyComponent, 
    AmendSeatReservationComponent, AmendReviewBuyComponent, RefundBookingComponent, MyAccountTicketInfoPopupComponent, ChangeEmailModalComponent, ResetEmailComponent, VerifyEmailComponent, MyBookingsFilterDatepickerComponent,
    ClubAvantiComponent,ClubAvantiBasicDialogComponent,
    ViewPreviousJourneyDialogComponent],
    imports: [CommonModule,MyAccountRoutingModule,AngularMaterialModule, SharedModule, ReactiveFormsModule,NgxBarcode6Module,MatProgressBarModule]
    ,schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MyAccountModule implements OnInit {
    constructor(private readonly styleSwitcher: StyleSwitcherService,
        private readonly filePathEnum: FilePathEnum
    ){

    }
    ngOnInit() {
        this.styleSwitcher.addStyle(this.filePathEnum.oldDesignGlobalCssPath);
    }


}