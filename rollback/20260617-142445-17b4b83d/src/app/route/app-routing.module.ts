import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { Page500Component } from "../Component/error/page500/page500.component";
import { Page404Component } from "../Component/error/page404/page404.component";

const ReDesign_JOURNEY_BOOKING_MODULE = "reDesignJourneyBookingFlow";

let newDesignJourneyBookingModule = localStorage.getItem(ReDesign_JOURNEY_BOOKING_MODULE) === "true";

const routes: Routes = [
  {
    path: "",
    loadChildren: () =>
      import("../modules/journey-booking.module").then((m) => m.JourneyBookingModule)
  },
  {
    path: "",
    loadChildren: () =>
      import("../modules/my-account.module").then((m) => m.MyAccountModule),
  },
  {
    path: "",
    loadChildren: () =>
      import("../modules/login-sign-up.module").then((m) => m.LoginSignUpModule)
  },
  {
    path: "",
    loadChildren: () => 
      import("../modules/enhanced-journey-booking.module").then((m) => m.EnhancedJourneyBookingModule)
  },
  { path: "error-500", component: Page500Component },
  { path: "**", component: Page404Component },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
