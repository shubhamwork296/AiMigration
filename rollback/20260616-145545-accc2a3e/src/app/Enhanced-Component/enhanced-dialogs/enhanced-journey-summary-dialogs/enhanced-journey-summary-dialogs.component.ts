import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';
import { EnhancedAppRouteEnum, EnhancedGa4DatalayeEventNameEnum, TravelSolutionStatusEnum } from "src/app/utility/app-constants.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "enhanced-journey-summary-dialogs",
  templateUrl: "./enhanced-journey-summary-dialogs.component.html",
  styleUrls: ['./enhanced-journey-summary-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class EnhancedJourneySummaryDialogsComponent implements OnInit{
    headerTitle: string;
    readonly panelOpenState = signal(false);
    isSaleable: boolean = false;
    travelSolutionStatusEnum: TravelSolutionStatusEnum;
    enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
    enhancedGA4DataLayerEnum: EnhancedGa4DatalayeEventNameEnum;
    enhancedAppRouteEnum: EnhancedAppRouteEnum;
    currentSelectedPageUrl: string;
    
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly injector: Injector,public dialogRef: MatDialogRef<EnhancedJourneySummaryDialogsComponent> ){
      this.travelSolutionStatusEnum = this.injector.get(TravelSolutionStatusEnum);
      this.enhancedGA4DataLayerService = this.injector.get(EnhancedGA4DatalayerService);
      this.enhancedGA4DataLayerEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
      this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
      if(data){
        this.isSaleable = this.data?.isSaleable
      }
    }
    ngOnInit(): void {
      this.currentSelectedPageUrl = `${environment.qttUrl}${this.enhancedAppRouteEnum?.searchResult}`;
      this.enhancedGA4DataLayerService.loadGA4DataLayerInformationModalEvent(this.enhancedGA4DataLayerEnum?.whysThatModalTypeText, this.currentSelectedPageUrl);
      this.headerTitle = this.isSaleable ? this.travelSolutionStatusEnum?.noFareAvailable : this.travelSolutionStatusEnum?.soldOutText;
    }

   
   
}