import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';
import { TravelSolutionModel } from "src/app/models/mixing-deck/travel-solution.model";
import { ClassTypeEnum, EnhancedAppRouteEnum, EnhancedGa4DatalayeEventNameEnum } from "src/app/utility/app-constants.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "enhanced-class-details-dialogs",
  templateUrl: "./enhanced-class-details-dialogs.component.html",
  styleUrls: ['./enhanced-class-details-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class EnhancedClassDetailsDialogsComponent implements OnInit{
  isMobile = false;
    headerTitle: string = `Three ways to travel`;
    readonly panelOpenState = signal(false);
    activeClass: string;
    selectedTabIndex: number = 0;
    classTypeEnum: ClassTypeEnum;
    selectedFareData: TravelSolutionModel;
    enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
    enhancedGA4DataLayerEnum: EnhancedGa4DatalayeEventNameEnum;
    currentSelectedPageUrl: string;
    enhancedAppRouteEnum: EnhancedAppRouteEnum;
    
  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedClassDetailsDialogsComponent>) {
    this.classTypeEnum = this.injector.get(ClassTypeEnum);
    this.enhancedGA4DataLayerService = this.injector.get(EnhancedGA4DatalayerService);
    this.enhancedGA4DataLayerEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
  }
    
  ngOnInit(): void {
    if (this.data) {
      this.activeClass = this.data?.classType;
      this.selectedFareData = this.data?.selectedFareData;
      this.headerTitle = this.getAvailableClassCountText();
    }
    this.checkMobile();
    if(this.isMobile)
    this.setSelectedTabIndex();
    this.currentSelectedPageUrl = `${environment.qttUrl}${this.enhancedAppRouteEnum?.selectTicketAndClass}`;
    this.enhancedGA4DataLayerService.loadGA4DataLayerInformationModalEvent(this.activeClass, this.currentSelectedPageUrl);
  }

    @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 1023;
  }

  setSelectedTabIndex() {
    switch (this.activeClass) {
      case this.classTypeEnum?.standardClass:
        this.selectedTabIndex = 0;
        break;
      case this.classTypeEnum?.stdPremiumClass:
        this.selectedTabIndex = 1;
        break;
      case this.classTypeEnum?.firstClass:
        this.selectedTabIndex = 2;
        break;
      default:
        this.selectedTabIndex = 0;
    }
  }

  getAvailableClassCountText(): string {
    try {
      let availableClassCount = [this.selectedFareData?.IsStandardFare, this.selectedFareData?.IsStandardPremiumFare, this.selectedFareData?.IsFirstClassFare]
        .filter(Boolean).length;

      let travelWays = [
        'One way to travel',
        'Two ways to travel',
        'Three ways to travel'
      ];

      return travelWays[availableClassCount - 1] || 'Three ways to travel';
    }
    catch (error) {
      console.log(error);
      return 'Three ways to travel';
    }
  }
}