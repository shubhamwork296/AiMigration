import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, Injector, ChangeDetectorRef } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { ResponseData } from "src/app/models/common/response.model";
import { EnhancedRouteDetailsRequest } from "src/app/models/enhanced-mixing-deck/enhanced-route-details-request.model";
import { EnhancedRouteDetailsResponse, EnhancedTravelChange } from "src/app/models/enhanced-mixing-deck/enhanced-route-details-response.model";
import { CommonServices } from "src/app/services/common.service";
import { EnhancedSearchSolutionService } from "src/app/services/enhanced-search-solution.service";
import { SearchSolutionService } from "src/app/services/search-solutions.service";
import { EnhancedAppRouteEnum, EnhancedGa4DatalayeEventNameEnum } from "src/app/utility/app-constants.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { environment } from "src/environments/environment";

@Component({
    selector: "app-enhanced-journey-details-and-itinerary-dialogs",
    templateUrl: "./enhanced-journey-details-and-itinerary-dialogs.component.html",
    styleUrls: ['./enhanced-journey-details-and-itinerary-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})

export class EnhancedJourneyDetailsAndItineraryDialogsComponent implements OnInit{
    headerTitle: string = `Journey details and itinerary`;
    searchSolutionService: SearchSolutionService;
    enhancedRouteDetailsRequest: EnhancedRouteDetailsRequest;
    enhancedRouteDetailsResponse: EnhancedRouteDetailsResponse;
    enhancedSearchSolutionService: EnhancedSearchSolutionService;
    responseData: ResponseData;
    changes: string;
    duration: string;
    enhancedTravelChanges: EnhancedTravelChange[];
    darwinText: [];
    callingPointsLength: number;
    enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
    enhancedGA4DataLayerEnum: EnhancedGa4DatalayeEventNameEnum;
    router: Router;
    enhancedAppRouteEnum: EnhancedAppRouteEnum;
    currentSelectedPageUrl: string;
    commonServices: CommonServices;

    constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedJourneyDetailsAndItineraryDialogsComponent>, private readonly cd : ChangeDetectorRef ){
      this.searchSolutionService = this.injector.get(SearchSolutionService);
      this.enhancedSearchSolutionService = this.injector.get(EnhancedSearchSolutionService);
      this.enhancedRouteDetailsRequest = new EnhancedRouteDetailsRequest;
      this.enhancedGA4DataLayerService = this.injector.get(EnhancedGA4DatalayerService);
      this.enhancedGA4DataLayerEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
      this.router = this.injector.get(Router);
      this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
      this.commonServices = this.injector.get(CommonServices);
    }
  ngOnInit(): void {
    this.currentSelectedPageUrl = `${environment.qttUrl}${this.enhancedAppRouteEnum?.searchResult}`;
    this.enhancedGA4DataLayerService.loadGA4DataLayerInformationModalEvent(this.enhancedGA4DataLayerEnum?.journeyDetailsAndItinearyModalTypeText, this.currentSelectedPageUrl);
    this.enhancedRouteDetailsRequest.TravelSolutionCache = this.data?.TravelSolutionCache;
    this.enhancedRouteDetailsRequest.TravelSolutionId = this.data?.TravelSolutionId;
    this.enhancedRouteDetailsRequest.SaleCompanyId = this.data?.SaleCompanyId;
    this.enhancedRouteDetailsRequest.SearchCustomCache = this.data?.SearchCustomCache;
    if (this.data.IsOutward)
      this.enhancedRouteDetailsRequest.IsOutward = this.data.IsOutward;
    this.changes = this.data.Changes;
    this.duration = this.data.Duration;
    this.getEnhancedRouteDetailsData();

  }

  getEnhancedRouteDetailsData() {
    try {
      this.enhancedSearchSolutionService.enhancedGetRouteDetails(this.enhancedRouteDetailsRequest).subscribe(
        res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.enhancedRouteDetailsResponse = this.responseData.Data as EnhancedRouteDetailsResponse;
              this.enhancedTravelChanges = this.enhancedRouteDetailsResponse?.TravelChanges;
              this.darwinText = this.enhancedRouteDetailsResponse.DarwinText;
              this.cd.detectChanges();
            }
            else {
              console.log(this.responseData.ResponseMessage);
              this.commonServices.showEnhancedCommonErrorPopup();
            }
          }
        });
    } catch (error) { console.log(error); }
  }

  getRouteWiseDataSource(route) {
    try {
      if (this.enhancedTravelChanges && this.enhancedTravelChanges?.length > 0) {
        let callingPoints = this.enhancedTravelChanges.filter(m => m == route)[0].CallingPoints;
        callingPoints.forEach((m, i) => {
          m.IsRouteLocation = true
          if (callingPoints.length == (i + 1)) {
            m.DepartureTime = m.ArrivalTime;
          }
        });
        this.callingPointsLength = callingPoints.length;
        return callingPoints;
      }
    } catch (error) { console.log(error); }
  }

  showStops(routeCallingPoints) {
    try {
      if (routeCallingPoints?.CallingPoints?.length > 2) {
        let stopCount = routeCallingPoints?.CallingPoints?.length - 2;
        return `${stopCount} stop${stopCount > 1 ? 's' : ''}`;
      }
      return '';
    } catch (error) { console.log(error); }
  }

  convertToAmPm(time24: string): string {
    try {
      const [hourStr, minuteStr] = time24.split(':');
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const amPm = hour >= 12 ? 'PM' : 'AM';
      return `${hour}:${minute.toString().padStart(2, '0')} ${amPm}`;
    } catch (error) { console.log(error); }
  }

  getDuration(startTime: string, endTime: string, isCheck): string {
    try {
      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      let durationMinutes = toMinutes(endTime) - toMinutes(startTime);
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      const hourLabel = isCheck ? ' h' : ' hours';
      const minuteLabel = isCheck ? ' mins' : ' minutes';

      return `${hours > 0 ? hours + hourLabel : ''} ${minutes}${minuteLabel}`;
    } catch (error) { console.log(error); }
  }

  toggleFacilityPanel(route, expanded: boolean): void {
    try {
      if (route) {
        route.isOpen = expanded;
      }
    } catch (error) { console.log(error); }
  }

  onJourneyStopsOpened(route: any, expanded: boolean): void {
    route.isExpanded = expanded;
  }

  getAriaLabelOnStops(isExpanded, route) {
    const stops = this.showStops(route);
    return `Button ${isExpanded ? 'Hide' : 'Show'} ${stops} stops, ${isExpanded ? 'Expanded' : 'Collapsed'}, Press enter to ${isExpanded ? 'collapse' : 'expand'}`;
  }

}