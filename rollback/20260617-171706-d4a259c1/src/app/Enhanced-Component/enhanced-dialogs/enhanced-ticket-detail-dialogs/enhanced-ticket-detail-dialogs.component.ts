import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, Injector, ChangeDetectorRef } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';
import { ResponseData } from "src/app/models/common/response.model";
import { EnhancedTicketInfoModel, EnhancedTicketInformation } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { CommonServices } from "src/app/services/common.service";
import { EnhancedSearchSolutionService } from "src/app/services/enhanced-search-solution.service";
import { EnhancedAppRouteEnum, EnhancedGa4DatalayeEventNameEnum } from "src/app/utility/app-constants.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { environment } from "src/environments/environment";

@Component({
    selector: "enhanced-ticket-detail-dialogs",
    templateUrl: "./enhanced-ticket-detail-dialogs.component.html",
    styleUrls: ['./enhanced-ticket-detail-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})

export class EnhancedTicketDetailsDialogsComponent implements OnInit{
    headerTitle: string = `Ticket details`;
    readonly panelOpenState = signal(false);
    isAdvanceTicket: boolean = false;
    isFamilyTicket: boolean = false;
    ticketInformation: EnhancedTicketInformation;
    ticketInfoModel: EnhancedTicketInfoModel;
    enhancedSearchSolutionService: EnhancedSearchSolutionService;
    responseData: ResponseData;
    commonService: CommonServices;
    enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
    enhancedGA4DataLayerEnum: EnhancedGa4DatalayeEventNameEnum;
    currentSelectedPageUrl: string;
    enhancedAppRouteEnum: EnhancedAppRouteEnum;

    constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedTicketDetailsDialogsComponent>, private readonly cd : ChangeDetectorRef ){
       this.enhancedSearchSolutionService = this.injector.get(EnhancedSearchSolutionService);
       this.commonService = this.injector.get(CommonServices);
       this.enhancedGA4DataLayerService = this.injector.get(EnhancedGA4DatalayerService);
       this.enhancedGA4DataLayerEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
       this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    }
    ngOnInit(): void {
      this.currentSelectedPageUrl = `${environment.qttUrl}${this.enhancedAppRouteEnum?.selectTicketAndClass}`;
      this.enhancedGA4DataLayerService.loadGA4DataLayerInformationModalEvent(this.enhancedGA4DataLayerEnum?.ticketDetailText, this.currentSelectedPageUrl);
      if (this.data.TicketType !== 'season') {
        this.isExistTicketTypeAdvance(this.data.TicketType);
        this.isExistTicketTypeFamily(this.data.TicketType);
        this.ticketInfoFunction();
      }
    }

  isExistTicketTypeAdvance(ticketType: string) {
    if (ticketType && ticketType != "") {
      ticketType = ticketType.toLowerCase();
      if (ticketType.indexOf('advance') != -1) {
        this.isAdvanceTicket = true;
      } else { this.isAdvanceTicket = false; }
    } else { this.isAdvanceTicket = false; }
  }

  isExistTicketTypeFamily(ticketType: string) {
    if (ticketType.indexOf("Family") > -1) {
      this.isFamilyTicket = true;
    } else { this.isFamilyTicket = false; }
  }

  ticketInfoFunction() {
    try {
      this.ticketInformation = new EnhancedTicketInformation();
      this.ticketInfoModel = new EnhancedTicketInfoModel();
      if (this.data.isSearchResults) {
        this.ticketInfoModel.ticketTypeCode = this.data.ticketTypeCode;
      }
      this.enhancedSearchSolutionService.enhancedTicketInformationSolutions(this.ticketInfoModel).subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data) {
              let ticketTypeInfoData = this.responseData.Data.TicketTypeDescription;
              this.setTicketInfoData(ticketTypeInfoData);
              this.cd.detectChanges();
            }
          } else {
            console.log(this.responseData.ResponseMessage);
            this.commonService.showEnhancedCommonErrorPopup();
          }
        }
      });
    } catch (error) { console.log(error); }
  }

  setTicketInfoData(ticketInfo) {
    this.ticketInformation.discounts = "";
    this.ticketInformation.nonRefundableTicket = "Non-refundable";
    this.ticketInformation.nonRefundableTicketForFamily = "Family tickets are non-refundable";
    if (ticketInfo) {
      if (this.checkTicketInfoDiscountForChildNullOrNot(ticketInfo)) {
        this.ticketInformation.child = ticketInfo.Discount.Child.Note;
      }
      if (this.checkTicketInfoDiscountForRailcardNullOrNot(ticketInfo)) {
        this.ticketInformation.railCard = ticketInfo.Discount.RailCard.Note;
      }
      if (ticketInfo.Refunds) {
        this.ticketInformation.refundableTicket = ticketInfo.Refunds;
      }
      if (ticketInfo.BookingDeadlines) {
        this.ticketInformation.bookingDeadline = ticketInfo.BookingDeadlines;
      }
      if (ticketInfo.BreakOfJourney) {
        this.ticketInformation.breakOfJourneyOutward = ticketInfo.BreakOfJourney.OutwardNote || '';
        this.ticketInformation.breakOfJourneyReturn = ticketInfo.BreakOfJourney.ReturnNote || '';
      }
      if (ticketInfo.ChangesToTravelPlans) {
        this.ticketInformation.changeTravelPlan = ticketInfo.ChangesToTravelPlans;
      }
      if (ticketInfo.Validity) {
      this.ticketInformation.validityDayOutward = ticketInfo?.Validity?.DayOutward || '';
      this.ticketInformation.validityDayReturn = ticketInfo?.Validity?.DayReturn || '';
      this.ticketInformation.validityTimeOutward = ticketInfo?.Validity?.TimeOutward || '';
      this.ticketInformation.validityTimeReturn = ticketInfo?.Validity?.TimeReturn || '';
      }
      this.setTicketInfoForStripTags();
    }
  }

  checkTicketInfoDiscountForChildNullOrNot(ticketInfo) {
    return ticketInfo?.Discount?.Child?.Note;
  }

  checkTicketInfoDiscountForRailcardNullOrNot(ticketInfo) {
    return ticketInfo?.Discount?.RailCard?.Note;
  }

  setTicketInfoForStripTags() {
    if (this.ticketInformation.child) {
      this.ticketInformation.child = this.commonService.stripTags(this.ticketInformation.child);
    }
    if (this.ticketInformation.refundableTicket) {
      this.ticketInformation.refundableTicket = this.commonService.stripTags(this.ticketInformation.refundableTicket);
    }
    if (this.ticketInformation.breakOfJourneyOutward) {
      this.ticketInformation.breakOfJourneyOutward = this.commonService.stripTags(this.ticketInformation?.breakOfJourneyOutward).replace('()', '');
    }
    if (this.ticketInformation.breakOfJourneyReturn) {
    this.ticketInformation.breakOfJourneyReturn = this.commonService.stripTags(this.ticketInformation?.breakOfJourneyReturn).replace('()', '');
    }
    if (this.ticketInformation.railCard) {
      this.ticketInformation.railCard = this.commonService.stripTags(this.ticketInformation.railCard).replace(/&nbsp;/g, '');
    }
    if (this.ticketInformation.bookingDeadline) {
      this.ticketInformation.bookingDeadline = this.commonService.stripTags(this.ticketInformation.bookingDeadline);
    }
    if (this.ticketInformation.validityDayOutward) {
    this.ticketInformation.validityDayOutward = this.commonService.stripTags(this.ticketInformation?.validityDayOutward).trim();
    }

    if (this.ticketInformation.validityDayReturn) {
      this.ticketInformation.validityDayReturn = this.commonService.stripTags(this.ticketInformation?.validityDayReturn).trim();
    }

    if (this.ticketInformation.validityTimeOutward) {
      this.ticketInformation.validityTimeOutward = this.commonService.stripTags(this.ticketInformation?.validityTimeOutward).trim();
    }

    if (this.ticketInformation.validityTimeReturn) {
      this.ticketInformation.validityTimeReturn = this.commonService.stripTags(this.ticketInformation?.validityTimeReturn).trim();
    }

  }

  showBreakOfJourneySection(): boolean {
  return (
    (this.ticketInformation?.breakOfJourneyOutward && this.ticketInformation?.breakOfJourneyOutward.trim() !== '') ||
    (this.ticketInformation?.breakOfJourneyReturn && this.ticketInformation?.breakOfJourneyReturn.trim() !== '')
    );
  }

  showValiditySection(): boolean {
    return (
      (this.ticketInformation?.validityDayOutward && this.ticketInformation?.validityDayOutward !== '') ||
      (this.ticketInformation?.validityDayReturn && this.ticketInformation?.validityDayReturn !== '') ||
      (this.ticketInformation?.validityTimeOutward && this.ticketInformation?.validityTimeOutward !== '') ||
      (this.ticketInformation?.validityTimeReturn && this.ticketInformation?.validityTimeReturn !== '')
    );
  }


   
}