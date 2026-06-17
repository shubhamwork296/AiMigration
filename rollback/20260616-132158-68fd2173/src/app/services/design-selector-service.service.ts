import { Injectable, Injector } from "@angular/core";
import { Router } from "@angular/router";
import { LocalStorageKeyEnum, TravelSolutionJourneyTypeEnum } from "../utility/app-constants.service";
import { StorageDataService } from "./storage-data.service";

@Injectable({ providedIn: 'root' })
export class DesignSelectorService {
    route : Router;
    localStorageKeyEnum: LocalStorageKeyEnum;
    storageDataService: StorageDataService;
    travelSolutionEnum: TravelSolutionJourneyTypeEnum;
    constructor(private readonly injector: Injector){
        this.route = this.injector.get(Router);
        this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
        this.storageDataService = this.injector.get(StorageDataService);
        this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    }
  isQubitEnabled(): boolean {
    return sessionStorage.getItem(this.localStorageKeyEnum.newDesignJourneyBookingFlow) === 'true';
  }

  isSeasonBooking(): boolean {
    // Your logic to determine season (e.g., based on date or flags)
    return this.storageDataService.getStorageData(this.travelSolutionEnum.isSeason.charAt(0).toLowerCase() + this.travelSolutionEnum.isSeason.slice(1), false) == 'true'; // Or API, etc.
  }

  isUpgradeBooking(): boolean {
    return this.storageDataService.getStorageData(this.travelSolutionEnum.isUpgrade, false) == 'true'; // Or API, etc.
  }

  isCOJ(): boolean {
    return this.storageDataService.getStorageData(this.travelSolutionEnum.isCOJ, false) == 'true'; // Or API, etc.
  }

  shouldLoadNewDesign(): boolean {
    let isQubit = this.isQubitEnabled();
    let isSeason = this.isSeasonBooking();
    let isUpgrade = this.isUpgradeBooking();
    let isCOJ = this.isCOJ();

    if (!isQubit) return false;            // Qubit false => always old
    if (isQubit && isSeason) return false; // Qubit true + Season => old
    if (isQubit && isUpgrade) return false;
    if (isQubit && isCOJ) return false;
    return true;                           // Qubit true + Non-season => new
  }
}