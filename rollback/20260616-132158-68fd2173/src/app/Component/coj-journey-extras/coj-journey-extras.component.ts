import { Component, Inject, Injector, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResponseData } from 'src/app/models/common/response.model';
import { CojEvaluateTravelRequest } from 'src/app/models/journey-extras/evaluate-request.model';
import { CojTravelExtraResponse, JourneyExtraDetail, JourneyExtrasResponse } from 'src/app/models/journey-extras/journey-extras-response.model';
import { JourneyExtras } from 'src/app/models/journey-extras/reservation.model';
import { JourneyExtraService } from 'src/app/services/journey-extras.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppConstantsService, TravelSolutionDirectionEnum } from 'src/app/utility/app-constants.service';

@Component({
  selector: 'app-coj-journey-extras',
  templateUrl: './coj-journey-extras.component.html',
  styleUrls: ['./coj-journey-extras.component.css']
})
export class CojJourneyExtrasComponent implements OnInit {
  responseData: ResponseData;
  cojEvaluateTravelRequest: CojEvaluateTravelRequest;
  cojTravelExtraResponse: CojTravelExtraResponse;
  journeyExtrasResponse: JourneyExtrasResponse;
  TravelExtraTotal: number;
  TrainTicketTotal: number;
  JourneyTotal: number;
  OutTravelExtrasDetails: JourneyExtraDetail[];
  RetTravelExtrasDetails: JourneyExtraDetail[];
  TravelExtraPrice: number = 0;
  JourneyExtras: JourneyExtras[] = [];
  OutBikeReservationNotAvailable: boolean = false;
  RetBikeReservationNotAvailable: boolean = false;
  OutTravelCardNotAvailable: boolean = false;
  RetTravelCardNotAvailable: boolean = false;
  IsTravelExtraNotAvailable: boolean = false;
  isReturnJourney: boolean; // added parameter for check pure return journey
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;

  constructor(public dialogRef: MatDialogRef<CojJourneyExtrasComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly journeyExtraService: JourneyExtraService, public appConstantsService: AppConstantsService,
    public sharedService: SharedService, private readonly injector: Injector) {
    this.cojEvaluateTravelRequest = this.data ? this.data.cojEvaluateTravelRequest : null;
    this.isReturnJourney = this.data ? this.data.isReturnJourney : null;
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
  }

  ngOnInit() {
    this.getCOJWithTravelExtraData();
  }

  filterCojTravelExtraResponseDetails(){
    if (this.cojTravelExtraResponse.Detail.filter(x => !x.IsReturn).length > 0) {
      this.OutTravelExtrasDetails = this.cojTravelExtraResponse.Detail.filter(x => !x.IsReturn).sort(y => y.OfferId);
      this.OutBikeReservationNotAvailable = this.cojTravelExtraResponse.Detail.filter(x => !x.IsReturn && x.Description == this.appConstantsService.bicycleReservation && !x.IsAvailableForCOJ).length > 0 ? true : false;
      this.OutTravelCardNotAvailable = this.cojTravelExtraResponse.Detail.filter(x => !x.IsReturn && x.Description == this.appConstantsService.londonTravelcard && !x.IsAvailableForCOJ).length > 0 ? true : false;
    }
    if (this.cojTravelExtraResponse.Detail.filter(x => x.IsReturn).length > 0) {
      this.RetTravelExtrasDetails = this.cojTravelExtraResponse.Detail.filter(x => x.IsReturn).sort(y => y.OfferId);
      this.RetBikeReservationNotAvailable = this.cojTravelExtraResponse.Detail.filter(x => x.IsReturn && x.Description == this.appConstantsService.bicycleReservation && !x.IsAvailableForCOJ).length > 0 ? true : false;
      this.RetTravelCardNotAvailable = this.cojTravelExtraResponse.Detail.filter(x => x.IsReturn && x.Description == this.appConstantsService.londonTravelcard && !x.IsAvailableForCOJ).length > 0 ? true : false;
    }
  }

  cojTravelExtraResponseDetail() {
    if (this.cojTravelExtraResponse?.Detail?.length > 0) {
      this.JourneyTotal = this.cojTravelExtraResponse.JourneyTotal;
      this.TravelExtraTotal = this.cojTravelExtraResponse.TravelExtraTotal;
      this.TrainTicketTotal = this.cojTravelExtraResponse.TrainTicketTotal;
      this.cojTravelExtraResponse.Detail.forEach(t => {
        if (t.IsAvailableForCOJ)
          t.Selected = true;
      });
      this.IsTravelExtraNotAvailable = this.cojTravelExtraResponse.Detail.filter(x => !x.IsAvailableForCOJ).length > 0 ? true : false;
      this.filterCojTravelExtraResponseDetails();
    }
    else {
      this.closeDialog(false, this.responseData.ResponseMessage, false, null, null);
    }
  }

  // Get purchased and new journey travel extras
  getCOJWithTravelExtraData() {
    if (this.cojEvaluateTravelRequest) {
      this.journeyExtraService.getCOJTravelExtras(this.cojEvaluateTravelRequest).subscribe(
        res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.cojTravelExtraResponse = this.responseData.Data;
              this.cojTravelExtraResponseDetail();    
            }
            else {
              this.closeDialog(false, this.responseData.ResponseMessage, false, null, null);
            }
          }
          else {
            this.closeDialog(false, this.responseData.ResponseMessage, false, null, null);
          }
        });
    }
  }

  // Method when add or remove travel extras of outward and return
  onTravelExtraChange(added, journeyExtraDetail: JourneyExtraDetail) {
    if (journeyExtraDetail.IsReturn) {
      this.RetTravelExtrasDetails.forEach(x => {
        if (x.OfferId == journeyExtraDetail.OfferId && x.ServiceId == journeyExtraDetail.ServiceId && x.SolutionNodeRef == journeyExtraDetail.SolutionNodeRef) {
          x.Selected = added;
        }
      });
    }
    else {
      this.OutTravelExtrasDetails.forEach(TravelExtra => {
        if (TravelExtra.OfferId == journeyExtraDetail.OfferId && TravelExtra.ServiceId == journeyExtraDetail.ServiceId && TravelExtra.SolutionNodeRef == journeyExtraDetail.SolutionNodeRef) {
          TravelExtra.Selected = added;
        }
      });
    }
    this.calculateAmount();
  }

  // Method to calculate travel extra price and journey total
  calculateAmount() {
    this.TravelExtraPrice = 0;
    if (this.OutTravelExtrasDetails) {
      this.OutTravelExtrasDetails.forEach((obj) => {
        if (obj.Selected) {
          this.TravelExtraPrice += obj.Price;
        }
      });
    }
    if (this.RetTravelExtrasDetails) {
      this.RetTravelExtrasDetails.forEach((ReturnTravelExtra) => {
        if (ReturnTravelExtra.Selected) {
          this.TravelExtraPrice += ReturnTravelExtra.Price;
        }
      });
    }
    this.TravelExtraTotal = this.TravelExtraPrice;
    this.JourneyTotal = (this.TravelExtraPrice + this.TrainTicketTotal);
  }

  // Method to continue and trasfer travel extras
  onContinue() {
    this.JourneyExtras = [];
    this.journeyExtrasResponse = new JourneyExtrasResponse();
    if (this.OutTravelExtrasDetails) {
      this.OutTravelExtrasDetails.forEach((x) => {
        if (x.Selected) {
          this.JourneyExtras.push({
            OfferId: x.OfferId,
            ServiceId: x.ServiceId,
            SolutionNodeRef: x.SolutionNodeRef,
            SelectCount: x.AvailableAmount,
            IsReturn: x.IsReturn,
            OldSolutionNodeRef: x.OldSolutionNodeRef
          });
        }
      });
    }
    if (this.RetTravelExtrasDetails) {
      this.RetTravelExtrasDetails.forEach((y) => {
        if (y.Selected) {
          this.JourneyExtras.push({
            OfferId: y.OfferId,
            ServiceId: y.ServiceId,
            SolutionNodeRef: y.SolutionNodeRef,
            SelectCount: y.AvailableAmount,
            IsReturn: y.IsReturn,
            OldSolutionNodeRef: y.OldSolutionNodeRef
          });
        }
      });
    }
    this.journeyExtrasResponse.EvaluateTravelCache = this.cojTravelExtraResponse.EvaluateTravelCache;
    this.journeyExtrasResponse.OutwardReservation = this.cojTravelExtraResponse.OutwardReservation;
    this.journeyExtrasResponse.ReturnReservation = this.cojTravelExtraResponse.ReturnReservation;
    this.journeyExtrasResponse.IsSuccess = this.cojTravelExtraResponse.IsSuccess;
    this.closeDialog(true, '', true, this.JourneyExtras, this.journeyExtrasResponse);
  }

  // Method to close popup dialog
  closeDialog(success, message, procced, journeyExtras, journeyExtrasResponse) {
    let result = { success: success, message: message, procced: procced, journeyExtras: journeyExtras, journeyExtrasResponse: journeyExtrasResponse };
    this.dialogRef.close(result);
  }

  getDescSummary(journeyExtraDetail: JourneyExtraDetail){
    if(journeyExtraDetail.Description == this.appConstantsService.bicycleReservation){
      return "Bicycle reservation"
    } else if(journeyExtraDetail.Description == this.appConstantsService.plusBus){
        return 'PlusBus'
    }else if(journeyExtraDetail.Description == this.appConstantsService.londonTravelcard){
        return 'London Travelcard'
    }
    return ''
  }

 
  getPassengers(journeyExtraDetail: JourneyExtraDetail){
    const isAdultOrAdults:string = (+journeyExtraDetail.NumberOfAdult > 1 ? " Adults" : " Adult");
    const isChildOrChildren:string = (+journeyExtraDetail.NumberOfChild > 1 ? ' Children' :
    ' Child');
    const addChildrenAlso:string = +journeyExtraDetail.NumberOfChild > 0 ? (", " + journeyExtraDetail.NumberOfChild + isChildOrChildren) : "";
    
    return journeyExtraDetail.NumberOfAdult + isAdultOrAdults + addChildrenAlso;
  } 

  // Method to create travel extra summary with passengers and price
  createTravelExtraSummary(journeyExtraDetail: JourneyExtraDetail) {
    const desc = this.getDescSummary(journeyExtraDetail);
    const passengers = this.getPassengers(journeyExtraDetail);
    const isBikeSpaceOrSpaces = journeyExtraDetail.AvailableAmount > 1 ? " bike spaces: Free" : " bike space: Free";
    const pricetext = (journeyExtraDetail.Description == this.appConstantsService.bicycleReservation) ? (journeyExtraDetail.AvailableAmount + isBikeSpaceOrSpaces) : (" " + passengers + ": " + this.sharedService.currencySymbol('') + this.sharedService.formatPrice(journeyExtraDetail.Price));

    return desc + " - " + pricetext;
  }

  // Method to create london travelcard summary with zone and peak
  createTravelCardSummary(journeyExtraDetail: JourneyExtraDetail) {
    let arrayOfServiceName = journeyExtraDetail.ServiceName.split(' ');
    return (journeyExtraDetail.IsReturn ? "Return, " : "Outbound, ") + arrayOfServiceName[1].charAt(0) + arrayOfServiceName[1].slice(1).toLowerCase() + " " + arrayOfServiceName[2] + ", " + arrayOfServiceName[3];
  }
}
