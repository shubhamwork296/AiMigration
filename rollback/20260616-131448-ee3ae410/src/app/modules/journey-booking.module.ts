import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { JourneyBookingRoutingModule } from "../route/journey-booking-routing.module";
import { AngularMaterialModule } from "../material/material-module";
import { SharedModule } from "./shared.module";
import { ReactiveFormsModule } from "@angular/forms";
import { SeasonSolutionsComponent } from "../Component/season-flexi/season-solutions/season-solutions.component";
import { JourneyExtrasComponent } from "../Component/journey-extras/journey-extras.component";
import { MixingDeckComponent } from "../Component/mixing-deck/mixing-deck.component";
import { MixingDeckListComponent } from "../Component/mixing-deck/mixing-deck-list/mixing-deck-list.component";
import { MixingDeckReturnListComponent } from "../Component/mixing-deck/mixing-deck-return-list/mixing-deck-return-list.component";
import { EditSearchComponent } from "../Component/mixing-deck/edit-search/edit-search.component";
import { DeliveryModeComponent } from "../Component/delivery-mode/delivery-mode.component";
import { ReviewAndBuyComponent } from "../Component/review-and-buy/review-and-buy.component";
import { BookingConfirmationComponent } from "../Component/booking-confirmation/booking-confirmation.component";
import { EnhancedMixingDeckCombinedListComponent } from "../Enhanced-Component/enhanced-mixing-deck-combined-list/enhanced-mixing-deck-combined-list.component";
import { EnhancedTravelExtraAndReviewByDeliveryComponent } from "../Enhanced-Component/enhanced-travel-extra-reviewBy-delivery-merge/enhanced-travelExtra-and-reviewByDelivery.component";
import { MixingDeckWrapperComponent } from "../Enhanced-Component/component-wrappers/mixing-deck-wrapper/mixing-deck-wrapper.component";
import { ReviewBuyAndDeliveryComponent } from "../Component/review-and-buy/review-buy-and-delivery/review-buy-and-delivery.component";
import { EnhancedPaymentComponent } from "../Enhanced-Component/enhanced-payment/enhanced-payment.component";
import { EnhancedBookingConfirmationComponent } from "../Enhanced-Component/enhanced-booking-confirmation/enhanced-booking-confirmation.component";
import { PaymentWrapperComponent } from "../Enhanced-Component/component-wrappers/payment-wrapper/payment-wrapper.component";
import { BookingConfirmationWrapperComponent } from "../Enhanced-Component/component-wrappers/booking-confirmation-wrapper/booking-confirmation-wrapper.component";
import { TravelExtraReviewByAndDeliveryWrapperComponent } from "../Enhanced-Component/component-wrappers/travelExtra-reviewByAndDelivery-wrapper/travelExtra-reviewByAndDelivery-wrapper.component";
import { EnhancedLoginPopupComponent } from "../Enhanced-Component/enhanced-login-page/enhanced-login-popup.component";
import { EnhancedEditQttSelectedDetailsComponent } from "../Enhanced-Component/enhanced-edit-qtt-selected-details/enhanced-edit-qtt-selected-details.component";
import { EnhancedMixingDeckTicketTypeAndClassComponent } from "../Enhanced-Component/enhanced-ticket-type-and-class/enhanced-ticket-type-and-class.component";
import { FilterByIsHidePipe } from "../pipes/filterDeliveryModes.pipe";
import { EnhancedValidateComponent } from "../Enhanced-Component/enhanced-validate/enhanced-validate.component";
import { EnhancedCommonLoaderComponent } from "../Enhanced-Component/enhanced-loader/enhanced-loader.component";
import { EnhancedValidateEnrollmentComponent } from "../Enhanced-Component/enhanced-validate/enhanced-validate-enrollment/enhanced-validate-enrollment.component";
@NgModule({
  declarations: [
    MixingDeckComponent,
    MixingDeckListComponent,
    MixingDeckReturnListComponent,
    EditSearchComponent,
    JourneyExtrasComponent,
    SeasonSolutionsComponent,
    DeliveryModeComponent,
    ReviewAndBuyComponent,
    BookingConfirmationComponent,
    EnhancedMixingDeckCombinedListComponent,
    EnhancedTravelExtraAndReviewByDeliveryComponent,
    MixingDeckWrapperComponent,
    TravelExtraReviewByAndDeliveryWrapperComponent,
    ReviewBuyAndDeliveryComponent,
    EnhancedPaymentComponent,
    EnhancedBookingConfirmationComponent,
    PaymentWrapperComponent,
    BookingConfirmationWrapperComponent,
    EnhancedLoginPopupComponent,
    EnhancedEditQttSelectedDetailsComponent,
    EnhancedMixingDeckTicketTypeAndClassComponent,
    FilterByIsHidePipe,
    EnhancedValidateComponent,
    EnhancedCommonLoaderComponent,
    EnhancedValidateEnrollmentComponent
  ],
  imports: [
    CommonModule,
    JourneyBookingRoutingModule,
    AngularMaterialModule,
    SharedModule,
    ReactiveFormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class JourneyBookingModule {}
