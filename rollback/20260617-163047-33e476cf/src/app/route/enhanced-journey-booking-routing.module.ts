import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EnhancedMixingDeckTicketTypeAndClassComponent } from "../Enhanced-Component/enhanced-ticket-type-and-class/enhanced-ticket-type-and-class.component";
import { EnhancedSeatPreferencesComponent } from "../Enhanced-Component/enhanced-seat-preferences/enhanced-seat-preferences.component";

const routes: Routes = [
  { pathMatch: "full", path: "select-ticket-and-class", component: EnhancedMixingDeckTicketTypeAndClassComponent },
  { pathMatch: "full", path: "seat-preferences", component: EnhancedSeatPreferencesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EnhancedJourneyBookingRoutingModule {}