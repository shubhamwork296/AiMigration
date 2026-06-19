import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MixingDeckComponent } from "../Component/mixing-deck/mixing-deck.component";
import { SeasonSolutionsComponent } from "../Component/season-flexi/season-solutions/season-solutions.component";
import { JourneyExtrasComponent } from "../Component/journey-extras/journey-extras.component";
import { DeliveryModeComponent } from "../Component/delivery-mode/delivery-mode.component";
import { AuthGuard } from "../guards/auth.guard";
import { ReviewAndBuyComponent } from "../Component/review-and-buy/review-and-buy.component";
import { ValidateComponent } from "../Component/validate/validate.component";
import { ValidateEnrollmentComponent } from "../Component/validate/validate-enrollment/validate-enrollment.component";
import { MixingDeckWrapperComponent } from "../Enhanced-Component/component-wrappers/mixing-deck-wrapper/mixing-deck-wrapper.component";
import { TravelExtraReviewByAndDeliveryWrapperComponent } from "../Enhanced-Component/component-wrappers/travelExtra-reviewByAndDelivery-wrapper/travelExtra-reviewByAndDelivery-wrapper.component";
import { PaymentWrapperComponent } from "../Enhanced-Component/component-wrappers/payment-wrapper/payment-wrapper.component";
import { BookingConfirmationWrapperComponent } from "../Enhanced-Component/component-wrappers/booking-confirmation-wrapper/booking-confirmation-wrapper.component";
import { ValidatePaymentWrapperComponent } from "../Enhanced-Component/component-wrappers/validate-payment-wrapper/validate-payment-wrapper.component";
import { EnhancedValidateEnrollmentComponent } from "../Enhanced-Component/enhanced-validate/enhanced-validate-enrollment/enhanced-validate-enrollment.component";
import { ValidateEnrollmentWrapperComponent } from "../Enhanced-Component/component-wrappers/validate-enrollment-wrapper/validate-enrollment-wrapper.component";

const routes: Routes = [
  { pathMatch: "full", path: "search-results", component: MixingDeckWrapperComponent },
  {
    pathMatch: "full",
    path: "season-search-results",
    component: SeasonSolutionsComponent,
  },
  { pathMatch: "full", path: "mixingdeck", component: MixingDeckComponent },
  {
    pathMatch: "full",
    path: "travel-extras",
    component: JourneyExtrasComponent,
  },
  {
    pathMatch: "full",
    path: "delivery-options",
    component: DeliveryModeComponent,
    canActivate: [AuthGuard],
  },
  {
    pathMatch: "full",
    path: "shopping-basket",
    component: ReviewAndBuyComponent,
    canActivate: [AuthGuard],
  },
  {
        pathMatch: "full",
        path: "delivery-and-reviewbuy",
        component: TravelExtraReviewByAndDeliveryWrapperComponent,
        canActivate: [AuthGuard]
  },
  {
      path: "payment",
      component: PaymentWrapperComponent,
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
      path: "booking-confirmation",
      component: BookingConfirmationWrapperComponent,
      canActivate: [AuthGuard],
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JourneyBookingRoutingModule {}
