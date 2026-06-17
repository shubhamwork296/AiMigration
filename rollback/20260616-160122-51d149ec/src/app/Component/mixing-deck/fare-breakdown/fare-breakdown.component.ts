import { Component, Injector, OnInit } from '@angular/core';
import { FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppConstantsService, AppRouteEnum } from 'src/app/utility/app-constants.service';
import { browserRefresh } from '../../../app-component/app.component';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { CommonServices } from 'src/app/services/common.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-fare-breakdown',
  templateUrl: './fare-breakdown.component.html',
  styleUrls: ['./fare-breakdown.component.css']
})
export class FareBreakdownComponent implements OnInit {
  fareBreakdownModelData: FareBreakdownModel[];
  totalFare: string;
  totalDiscount: number = 0;
  browserRefresh: boolean;
  isSeason: boolean;
  isPromo: boolean = false;
  headerTitle: string = "Fare breakdown";
  appRouteEnum: AppRouteEnum;
  commonService: CommonServices;
  totalPrice: string;
  router: Router;

  constructor(public sharedSibling: SharedService, public appConstantsService: AppConstantsService
    , private readonly storageDataService: StorageDataService, private readonly injector: Injector) {
    this.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonService = this.injector.get(CommonServices);
    this.router = this.injector.get(Router);
  }
  ngOnInit() {
    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined)
        this.sharedSibling.searchRequest = sharedSiblingRefresh.searchRequest;
    }
    this.getFareBreakDownData();
  }

  getFareBreakDownData() {
    if (this.sharedSibling?.reviewBuyResponse?.IsRenewSmartcard) {
      this.isSeason = true;
      this.sharedSibling.searchRequest = undefined;
    }
    if (this.sharedSibling.searchRequest != undefined) {
      this.isSeason = this.sharedSibling.searchRequest.TravelSolutionDirection == 'SEASON';
    }
    this.fareBreakdownModelData = this.sharedSibling.fareBreakdownModelData;
    this.totalFare = this.sharedSibling.calculateTotalAmount();
    this.totalDiscount = this.sharedSibling.fareBreakDownTotalDiscount;

    this.fareBreakdownModelData.forEach(element => {
      this.isPromo = element.OutWardJourney.some((item) => item.RailCard.toLowerCase().includes('1 promotion applied'));
    });

    // added fare break down price for review buy
    this.totalPrice = this.commonService.calculateJourneyTotalAmount(this.sharedSibling);

  }

}
