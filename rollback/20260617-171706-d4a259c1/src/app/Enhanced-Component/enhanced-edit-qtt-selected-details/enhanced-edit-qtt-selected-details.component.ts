import { Component, Injector, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DeviceDetectorService } from "ngx-device-detector";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { EnhancedSearchResponseModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-response.model";
import { CommonServices } from "src/app/services/common.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { EnhancedAppRouteEnum } from "src/app/utility/app-constants.service";

@Component({
    selector: "enhanced-edit-qtt-selected-details",
    templateUrl: "./enhanced-edit-qtt-selected-details.component.html",
    styleUrls: ["./enhanced-edit-qtt-selected-details.component.css"],
    standalone: false
})

export class EnhancedEditQttSelectedDetailsComponent implements OnInit {
    deviceService: DeviceDetectorService;
    commonServices: CommonServices;
    isMobile: boolean = false;
    isTablet: boolean = false;
    @Input() searchRequest: EnhancedSearchRequestModel;
    @Input() searchResponse: EnhancedSearchResponseModel;
    @Input() searchReturnResponse: EnhancedSearchResponseModel;
    @Input() sharedService: SharedService;
    @Input() selectedTravelSolDataForOutward;
    @Input() selectedTravelSolDataForReturn;
    router: Router;
    enhancedAppRouteEnum: EnhancedAppRouteEnum;
    @Input() isReturn!: boolean;
    
    constructor(private readonly injector: Injector){
        this.deviceService = this.injector.get(DeviceDetectorService);
        this.commonServices = this.injector.get(CommonServices);
        this.router = this.injector.get(Router);
        this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    }

    ngOnInit(){
        this.isMobile = this.deviceService.isMobile() && window.screen.width < 1024;
        this.isTablet = (this.deviceService.isTablet() || this.commonServices.checkIsiPad(navigator.userAgent)) && window.screen.width < 1024;
    }

    getTotalRailCardCount(): number {
        return this.searchRequest?.RailCardList?.reduce((total, railcard) => {
        return total + (railcard?.RailCardCount || 0);
        }, 0) || 0;
    }

    showNoRailCardMessage() {
        return !this.searchResponse?.IsPromo && !this.searchReturnResponse?.IsPromo && this.getTotalRailCardCount() < 1;
    }

    showRailCardAsLabelIfOpted(){
        let data =  !this.searchResponse?.IsPromo && 
            !this.searchReturnResponse?.IsPromo && 
            this.searchRequest?.RailCardList?.length > 0 && 
            (this.sharedService.journeySummaryModel?.RailCards != null);
        return data;
    }

    isShowingEditQTTInMobile() {
        if ((this.router?.url == '/' + this.enhancedAppRouteEnum?.selectTicketAndClass) && (this.isMobile || this.isTablet)) {
            return true;
        } else {
            return false;
        }
    }

    getDepartureDate(): string {
        try {
            let departureTime = '';

            if (this.isReturn) {
                departureTime = this.selectedTravelSolDataForReturn?.DepartureTime || '';
            } else {
                departureTime = this.selectedTravelSolDataForOutward?.DepartureTime || '';
            }

            return departureTime ? departureTime.split(' ')[0] : '';
        } catch (error) { console.log(error); }
    }

    getArrivalDate(): string {
        try {
            let arrivalTime = '';

            if (this.isReturn) {
                arrivalTime = this.selectedTravelSolDataForReturn?.ArrivalTime || '';
            } else {
                arrivalTime = this.selectedTravelSolDataForOutward?.ArrivalTime || '';
            }

            return arrivalTime ? arrivalTime.split(' ')[0] : '';
        } catch (error) { console.log(error); }
    }

    getDurationAndChangesText(): string {
        try {
            let changesText = '';
            let data = this.isReturn ? this.selectedTravelSolDataForReturn : this.selectedTravelSolDataForOutward;

            if (!data) {
                return '';
            }
            let duration = data.Duration || '';

            if (data.Changes === 0) {
                changesText = 'Direct';
            } else if (data.Changes === 1) {
                changesText = `${data.Changes} change`;
            } else {
                changesText = `${data.Changes} changes`;
            }

            return `${duration}, ${changesText}`;
        } catch (error) { console.log(error); }
    }

}