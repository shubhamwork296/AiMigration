import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, HostListener, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import * as moment from "moment";
import { EnhancedRailCardModel } from "src/app/models/enhanced-mixing-deck/enhanced-railcard.model";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { CommonServices } from "src/app/services/common.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { EnhancedAppRouteEnum } from "src/app/utility/app-constants.service";


@Component({
    selector: "enhanced-go-back-dialogs",
    templateUrl: "./enhanced-go-back-dialogs.component.html",
    styleUrls: ['./enhanced-go-back-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
@HostListener('window:resize')
export class EnhancedGoBackDialogsComponent {
  headerTitle: string = 'Are you sure you want to go back?';
  searchRequest: EnhancedSearchRequestModel;
  sharedSibling: SharedService;
  commonServices: CommonServices;
  router: Router;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;

  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedGoBackDialogsComponent> ){
     this.searchRequest = new EnhancedSearchRequestModel();
     this.searchRequest.RailCardList = new Array<EnhancedRailCardModel>();
     this.sharedSibling = this.injector.get(SharedService);
     this.commonServices = this.injector.get(CommonServices);
     this.router = this.injector.get(Router);
     this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
  }
    
  goToSearchResult() {
    this.dialogRef.close();
    this.getSearchRequestAgain();
  }

  getSearchRequestAgain() {
    let enhancedSearchRequestModel = new EnhancedSearchRequestModel();
    enhancedSearchRequestModel.RailCardList = new Array<EnhancedRailCardModel>();

    this.searchRequest = this.sharedSibling.searchRequest;

    if (this.checkIsSearchRequestAvailableOrNot()) {
      enhancedSearchRequestModel.DepartureLocation = this.searchRequest.DepartureLocation;
      enhancedSearchRequestModel.DepartureLocationName = this.searchRequest.DepartureLocationName;
      enhancedSearchRequestModel.ArrivalLocation = this.searchRequest.ArrivalLocation;
      enhancedSearchRequestModel.ArrivalLocationName = this.searchRequest.ArrivalLocationName;
      enhancedSearchRequestModel.Traveltype = "DEPARTAFTER";
      enhancedSearchRequestModel.TraveltypeReturn = "DEPARTAFTER";
      enhancedSearchRequestModel.TravelSolutionDirection = this.searchRequest.TravelSolutionDirection;
      enhancedSearchRequestModel.Adult = this.searchRequest.Adult;
      enhancedSearchRequestModel.Child = this.searchRequest.Child;

      // Added Journeysearchtype missing from Buyagain Newsearch call 
      enhancedSearchRequestModel.JourneySearchType = 'NEW';
      if (this.checkSearchRequestRailCardListAvailableOrNot()) {
        this.searchRequest.RailCardList.forEach(railcard => {
          let sRailcards = new EnhancedRailCardModel();
          sRailcards.RailCard = railcard.RailCard;
          sRailcards.Adult = railcard.Adult;
          sRailcards.Child = railcard.Child;
          sRailcards.RailCardCount = railcard.RailCardCount;
          enhancedSearchRequestModel.RailCardList.push(sRailcards);
        })
      }
      if (!this.searchRequest.IsSeason) {

        if (new Date().getTime() <= new Date(this.searchRequest.DepartureTimesStart).getTime()) {
          const departureDate = new Date(this.searchRequest.DepartureTimesStart);
          enhancedSearchRequestModel.DepartureTimesStart = moment(departureDate).format('YYYY-MM-DDTHH:mm');
        } else {
          const departureDate = moment.utc(new Date()).add(3, 'hours');
          const remainder = 30 - (departureDate.minute() % 30);
          enhancedSearchRequestModel.DepartureTimesStart = moment(departureDate).add(remainder, "minutes").format('YYYY-MM-DDTHH:mm');
        }
        if (new Date().getTime() <= new Date(this.searchRequest.ReturnTimesStart).getTime()) {
          const departureDate = new Date(this.searchRequest.ReturnTimesStart);
          enhancedSearchRequestModel.ReturnTimesStart = moment(departureDate).format('YYYY-MM-DDTHH:mm');
        } else {
          const returnDate = moment.utc(new Date()).add(5, 'hours');
          const remainderReturn = 30 - (returnDate.minute() % 30);
          enhancedSearchRequestModel.ReturnTimesStart = moment(returnDate).add(remainderReturn, "minutes").format('YYYY-MM-DDTHH:mm');
        }

        enhancedSearchRequestModel.IsSeason = false;
        enhancedSearchRequestModel.IsFlexi = false;
        this.sharedSibling.showEdit = false;
        this.sharedSibling.isJourneySuccessfullyRemoved(false);
        this.router.navigate([`./` + this.enhancedAppRouteEnum.searchResult]);
      }
      enhancedSearchRequestModel.OperaterFilter = this.searchRequest.OperaterFilter;
      enhancedSearchRequestModel.TicketClassFilter = this.searchRequest.TicketClassFilter;
      enhancedSearchRequestModel.ChangesFilter = this.searchRequest.ChangesFilter;
      enhancedSearchRequestModel.IsReturnRequest = this.searchRequest.IsReturnRequest;
      enhancedSearchRequestModel.FirstTrainArrivalTimesStart = this.searchRequest.FirstTrainArrivalTimesStart;
      enhancedSearchRequestModel.FirstTrainDepartureTimesStart = this.searchRequest.FirstTrainDepartureTimesStart;
      enhancedSearchRequestModel.JourneySearchTypeReturn = this.searchRequest.JourneySearchTypeReturn;
      enhancedSearchRequestModel.LastTrainArrivalTimesStart = this.searchRequest.LastTrainArrivalTimesStart;
      enhancedSearchRequestModel.LastTrainDepartureTimesStart = this.searchRequest.LastTrainDepartureTimesStart;
      enhancedSearchRequestModel.PathConstraintLocation = this.searchRequest.PathConstraintLocation;
      enhancedSearchRequestModel.PromotionCode = this.searchRequest.PromotionCode;
      enhancedSearchRequestModel.Searchtype = this.searchRequest.Searchtype;
      enhancedSearchRequestModel.SearchtypeReturn = this.searchRequest.SearchtypeReturn;
      this.sharedSibling.isAmendSearchOpen = false;
      this.sharedSibling.searchRequest = enhancedSearchRequestModel;
    }
  }

  checkIsSearchRequestAvailableOrNot() {
    return this.sharedSibling?.searchRequest;
  }

  checkSearchRequestRailCardListAvailableOrNot() {
    return this.searchRequest?.RailCardList?.length > 0;
  }

}
