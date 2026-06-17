import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { EnhancedRxjsSubjectsCommonService } from "src/app/services/enhanced-rxjs-subject.service";
import { EnhancedJourneyFilterText, TravelSolutionJourneyTypeEnum } from "src/app/utility/app-constants.service";


@HostListener('window:resize')
@Component({
  selector: "enhanced-filter-mobile-dialogs",
  
  templateUrl: "./enhanced-filter-mobile-dialogs.component.html",
  styleUrls: ['./enhanced-filter-mobile-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
}) 

export class EnhancedFilterMobileDialogs implements OnInit{
    isMobile = false;
    headerTitle: string = `Filter`;
    readonly panelOpenState = signal(false);
    isAvantiFilter;
    isDirectFilter;
    selectedToggleText: string = '';
    travelSolutionEnum: TravelSolutionJourneyTypeEnum;
    enhancedJourneyFilterText: EnhancedJourneyFilterText;
    constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedFilterMobileDialogs>,public enhancedRxjsService: EnhancedRxjsSubjectsCommonService ){
        if(data){
          this.isAvantiFilter = data?.isAvantiSelected;
          this.isDirectFilter = data?.isDirectSelected;
        }
        this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
        this.enhancedJourneyFilterText = this.injector.get(EnhancedJourneyFilterText);
    }
    
    ngOnInit(): void {
      this.checkMobile();
    }

    onResize() {
      this.checkMobile();
    }

    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
    }

    selectedToggle(name, event: MatSlideToggleChange){
      if(event.checked){
        this.selectedToggleText = name;
      }
    }

    showFilterData(){
      let selectedFilter = this.isAvantiFilter && this.isDirectFilter ? 'Both' : this.selectedToggleText;
      this.enhancedRxjsService.triggerEvent({selectedFilter: selectedFilter});
    }

    getToggleAriaLabel(type: "Avanti" | "Direct"): string {
      try {
        let journeyType = this.data?.isReturn ? this.travelSolutionEnum.return : this.travelSolutionEnum.outward;
        let filterText = type === this.enhancedJourneyFilterText.avantiFilter ? this.enhancedJourneyFilterText.avantiFilter : this.enhancedJourneyFilterText.directFilter;
        return `${journeyType} journey search filter Show ${filterText} trains only`;
      } catch (error) { console.log(error); }
    }

}
