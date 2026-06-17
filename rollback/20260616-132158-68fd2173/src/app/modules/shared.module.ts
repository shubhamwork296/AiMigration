import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AccountFooterComponent } from "../Component/my-account/account-footer/account-footer.component";
import { AccountHeaderComponent } from "../Component/my-account/account-header/account-header.component";
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgxPaginationModule } from "ngx-pagination";
import { AngularMaterialModule } from "../material/material-module";
import { FooterComponent } from "../Component/layout/footer/footer.component";
import { HeaderComponent } from "../Component/layout/header/header.component";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { PreventKeyseDirective } from "../utility/custom-validations/no-space-allowed-validation";
import { TimeFormat } from "../pipes/convertTime12To24hrFormat.pipe";
import { GetStringToDateFormat } from "../pipes/stringToDateFormat.pipe";
import { PaymentDetailsComponent } from "../Component/payment-details/payment-details.component";
import { GetFirstWord } from "../pipes/firstword.pipe";
import { BasicDialogComponent } from "../Component/basic-dialog/basic-dialog.component";
import { ParkingPopupComponent } from "../Component/mixing-deck/parking-popup/parking-popup.component";
import { AmendSearchComponent } from "../Component/mixing-deck/amend-search/amend-search.component";
import { RouteDetailsComponent } from "../Component/mixing-deck/route-details/route-details.component";
import { CojSingleListComponent } from "../Component/coj-mixing-deck/Coj-Single-List/coj-single-list.component";
import { CojReturnListComponent } from "../Component/coj-mixing-deck/Coj-Return-List/coj-return-list.component";
import { TicketClassInfoPopupComponent } from "../Component/mixing-deck/ticket-class-info-popup/ticket-class-info-popup.component";
import { GetQuietIcon } from "../pipes/quietIcon.pipe";
import { ScrollSpyDirective } from "../Component/review-and-buy/seatpicker-popup/scroll-spy.directive";
import { SvgSanitizePipe } from "../Component/review-and-buy/seatpicker-popup/svg-sanitizer.pipe";
import { TicketNotFoundComponent } from "../Component/mixing-deck/ticket-not-found/ticket-not-found.component";
import { FareBreakdownComponent } from "../Component/mixing-deck/fare-breakdown/fare-breakdown.component";
import { InfoPopupComponent } from "../Component/mixing-deck/info-popup/info-popup.component";
import { SoldoutTicketInfoPopupComponent } from "../Component/mixing-deck/soldout-ticket-info-popup/soldout-ticket-info-popup.component";
import { USPBannerComponent } from "../Component/usp-banner/usp-banner.component";
import { MyProfileForgotPasswordComponent } from "../Component/my-account/my-profile/my-profile-forgot-password/my-profile-forgot-password.component";
import { CommonNotificationComponent } from "../Component/common-notification/common-notification.component";
import { TimeoutErrorComponent } from "../Component/mixing-deck/timeout-error/timeout-error.component";
import { EarlierLaterTimeoutErrorComponent } from "../Component/mixing-deck/earlierlater-timeout-error/earlierlater-timeout-error.component";
import { ValidateComponent } from "../Component/validate/validate.component";
import { ValidateEnrollmentComponent } from "../Component/validate/validate-enrollment/validate-enrollment.component";
import { LoginSearchComponent } from "../Component/login-page/login-search/login-search.component";
import { CapsLockDetectDirective } from "../utility/capslockDetect.directive";
import { VatReceiptPdfComponent } from "../Component/my-account/vat-receipt-pdf/vat-receipt-pdf.component";
import { EnhancedEditQTTComponent } from "../Enhanced-Component/enhanced-edit-qtt/enhanced-edit-qtt.component";
import { EnhancedFooterComponent } from "../Enhanced-Component/enhanced-footer/enhanced-footer.component";
import { EnhancedNavigationHeaderComponent } from "../Enhanced-Component/enhanced-navigation-header/enhanced-navigation-header.component";
import { EnhancedRailCardFilterPipe } from "../pipes/enhanced-railcard-filter.pipe";

@NgModule({
  declarations: [
    AccountFooterComponent,
    AccountHeaderComponent,
    HeaderComponent,
    PreventKeyseDirective,
    TimeFormat,
    GetStringToDateFormat,
    PaymentDetailsComponent,
    ValidateComponent,
    ValidateEnrollmentComponent,
    FooterComponent,
    GetFirstWord,
    BasicDialogComponent,
    ParkingPopupComponent,
    AmendSearchComponent,
    RouteDetailsComponent,
    CojSingleListComponent,
    CojReturnListComponent,
    TicketClassInfoPopupComponent,
    GetQuietIcon,
    ScrollSpyDirective,
    SvgSanitizePipe,
    TicketNotFoundComponent,
    FareBreakdownComponent,
    InfoPopupComponent,
    SoldoutTicketInfoPopupComponent,
    USPBannerComponent,
    MyProfileForgotPasswordComponent,
    CommonNotificationComponent,
    TimeoutErrorComponent,
    EarlierLaterTimeoutErrorComponent,
    LoginSearchComponent,
    CapsLockDetectDirective,
    VatReceiptPdfComponent,
    EnhancedNavigationHeaderComponent, 
    EnhancedFooterComponent,
    EnhancedEditQTTComponent,
    EnhancedRailCardFilterPipe
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    FlexLayoutModule,
    MatDialogModule,
    NgxPaginationModule,
    RouterModule
  ],
  exports: [
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    AngularMaterialModule,
    FlexLayoutModule,
    MatDialogModule,
    RouterModule,
    AccountFooterComponent,
    AccountHeaderComponent,
    HeaderComponent,
    FooterComponent,
    TimeFormat,
    NgxPaginationModule,
    PreventKeyseDirective,
    GetStringToDateFormat,
    PaymentDetailsComponent,
    ValidateComponent,
    ValidateEnrollmentComponent,
    GetFirstWord,
    BasicDialogComponent,
    ParkingPopupComponent,
    AmendSearchComponent,
    RouteDetailsComponent,
    CojSingleListComponent,
    CojReturnListComponent,
    TicketClassInfoPopupComponent,
    GetQuietIcon,
    ScrollSpyDirective,
    SvgSanitizePipe,
    TicketNotFoundComponent,
    FareBreakdownComponent,
    InfoPopupComponent,
    SoldoutTicketInfoPopupComponent,
    USPBannerComponent,
    MyProfileForgotPasswordComponent,
    CommonNotificationComponent,
    TimeoutErrorComponent,
    EarlierLaterTimeoutErrorComponent,
    LoginSearchComponent,
    CapsLockDetectDirective,
    VatReceiptPdfComponent,
    EnhancedNavigationHeaderComponent, 
    EnhancedFooterComponent,
    EnhancedEditQTTComponent,
    EnhancedRailCardFilterPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule {}
