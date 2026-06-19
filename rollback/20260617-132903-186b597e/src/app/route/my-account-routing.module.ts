import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { PaymentsVouchersComponent } from "../Component/my-account/payments-vouchers/payments-vouchers.component";
import { MyPreferencesComponent } from "../Component/my-account/my-preferences/my-preferences.component";
import { MyBookingsComponent } from "../Component/my-account/my-bookings/my-bookings.component";
import { OrderSmartcardComponent } from "../Component/my-account/payments-vouchers/order-smartcard/order-smartcard.component";
import { ReplaceSmartcardComponent } from "../Component/my-account/payments-vouchers/replace-smartcard/replace-smartcard.component";
import { MyProfileComponent } from "../Component/my-account/my-profile/my-profile.component";
import { ViewBookingComponent } from "../Component/my-account/my-bookings/view-booking/view-booking.component";
import { AmendReviewBuyComponent } from "../Component/amend-review-buy/amend-review-buy.component";
import { AmendSeatReservationComponent } from "../Component/amend-seat-reservation/amend-seat-reservation.component";
import { CojMixingDeckComponent } from "../Component/coj-mixing-deck/coj-mixing-deck.component";
import { CojReviewAndBuyComponent } from "../Component/coj-review-and-buy/coj-review-and-buy.component";
import { RefundBookingComponent } from "../Component/my-account/my-bookings/refund-booking/refund-booking.component";
import { PaymentDetailsComponent } from "../Component/payment-details/payment-details.component";
import { UpgradeTicketsComponent } from "../Component/upgrade-tickets/upgrade-tickets.component";
import { ValidateComponent } from "../Component/validate/validate.component";
import { ValidateEnrollmentComponent } from "../Component/validate/validate-enrollment/validate-enrollment.component";
import { ResetEmailComponent } from "../Component/my-account/my-profile/reset-email/reset-email.component";
import { AuthGuard } from "../guards/auth.guard";
import { VerifyEmailComponent } from "../Component/my-account/my-bookings/verify-email/verify-email.component";
import { VatReceiptPdfComponent } from "../Component/my-account/vat-receipt-pdf/vat-receipt-pdf.component";
import { ClubAvantiComponent } from "../Component/my-account/club-avanti/club-avanti.component";
import { ValidatePaymentWrapperComponent } from "../Enhanced-Component/component-wrappers/validate-payment-wrapper/validate-payment-wrapper.component";
import { ValidateEnrollmentWrapperComponent } from "../Enhanced-Component/component-wrappers/validate-enrollment-wrapper/validate-enrollment-wrapper.component";

const routes: Routes = [
  {
    pathMatch: "full",
    path: "account-view-booking/change-of-journey/payment",
    component: PaymentDetailsComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-my-bookings",
    component: MyBookingsComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-my-preferences",
    component: MyPreferencesComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-my-payments",
    component: PaymentsVouchersComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "order-smartcard",
    component: OrderSmartcardComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "replace-smartcard",
    component: ReplaceSmartcardComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-my-profile",
    component: MyProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking",
    component: ViewBookingComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/change-of-journey/search-results",
    component: CojMixingDeckComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/change-of-journey/review-and-buy",
    component: CojReviewAndBuyComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/upgrade/select",
    component: UpgradeTicketsComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/upgrade/review",
    component: CojReviewAndBuyComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/upgrade/payment",
    component: PaymentDetailsComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/amend-seat",
    component: AmendSeatReservationComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/amend-review",
    component: AmendReviewBuyComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-view-booking/refund",
    component: RefundBookingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "validatePayment.do",
    component: ValidatePaymentWrapperComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "validateEnrollment.do",
    component: ValidateEnrollmentWrapperComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "reset-email",
    component: ResetEmailComponent,
  },
  {
    pathMatch: "full",
    path: "verify-email",
    component: VerifyEmailComponent,
  },
  {
    pathMatch: "full",
    path: "vat-receipt",
    component: VatReceiptPdfComponent,
  },
  {
    pathMatch: "full",
    path: "account-my-bookings/my-seasons",
    component: MyBookingsComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-club-avanti",
    component: ClubAvantiComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "account-my-profile/change-email",
    component: MyProfileComponent,
    canActivate: [AuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyAccountRoutingModule {}
