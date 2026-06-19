import { ChangeDetectionStrategy, Component, Inject, OnInit, ViewEncapsulation, HostListener, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from '@angular/router';
import * as moment from 'moment';
import { StartVerifyEmailRequestDto, StartVerifyEmailResponseDto } from 'src/app/models/account/my-bookings.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { CommonServices } from 'src/app/services/common.service';
import { MyAccountService } from 'src/app/services/my-account.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppRouteEnum, LocalStorageKeyEnum, NotificationErrorMsg } from 'src/app/utility/app-constants.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';


@Component({
    selector: "enhanced-common-notification-dialogs",
    templateUrl: "./enhanced-common-notification-dialogs.component.html",
    styleUrls: ['./enhanced-common-notification-dialogs.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
@HostListener('window:resize')
export class EnhancedCommonNotificationDialogsComponent {
  headerTitle: string;
  appRouteEnum: AppRouteEnum;
  router: Router;
  sharedSibling: SharedService;
  searchRequest: SearchRequestModel;
  commonServices: CommonServices;
  responseData: ResponseData;
  notificationService: NotificationService;
  notificationErrorMsg: NotificationErrorMsg;
  startVerifyEmailRequestDto: StartVerifyEmailRequestDto;
  startVerifyEmailResponseDto: StartVerifyEmailResponseDto;
  myAccountService: MyAccountService;
  localStorageEnum: LocalStorageKeyEnum;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedCommonNotificationDialogsComponent>, private readonly injector: Injector) {
    this.headerTitle = this.data.headerTitle;
    this.router = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.sharedSibling = this.injector.get(SharedService);
    this.searchRequest = new SearchRequestModel();
    this.searchRequest.RailCardList = new Array<RailCardModel>();
    this.commonServices = this.injector.get(CommonServices);
    this.notificationService = this.injector.get(NotificationService);
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
    this.myAccountService = this.injector.get(MyAccountService);
    this.localStorageEnum = this.injector.get(LocalStorageKeyEnum);
  }

  goToSearchResult() {
    this.dialogRef.close();
    this.getSearchRequestAgain();
  }

  getSearchRequestAgain() {
    let searchRequestModel = new SearchRequestModel();
    searchRequestModel.RailCardList = new Array<RailCardModel>();

    this.searchRequest = this.sharedSibling.searchRequest;

    if (this.checkIsSearchRequestAvailableOrNot()) {
      searchRequestModel.DepartureLocation = this.searchRequest.DepartureLocation;
      searchRequestModel.DepartureLocationName = this.searchRequest.DepartureLocationName;
      searchRequestModel.ArrivalLocation = this.searchRequest.ArrivalLocation;
      searchRequestModel.ArrivalLocationName = this.searchRequest.ArrivalLocationName;
      searchRequestModel.Traveltype = "DEPARTAFTER";
      searchRequestModel.TraveltypeReturn = "DEPARTAFTER";
      searchRequestModel.TravelSolutionDirection = this.searchRequest.TravelSolutionDirection;
      searchRequestModel.Adult = this.searchRequest.Adult;
      searchRequestModel.Child = this.searchRequest.Child;

      // Added Journeysearchtype missing from Buyagain Newsearch call 
      searchRequestModel.JourneySearchType = 'NEW';
      if (this.checkSearchRequestRailCardListAvailableOrNot()) {
        this.searchRequest.RailCardList.forEach(railcard => {
          let sRailcards = new RailCardModel();
          sRailcards.RailCard = railcard.RailCard;
          sRailcards.Adult = railcard.Adult;
          sRailcards.Child = railcard.Child;
          sRailcards.RailCardCount = railcard.RailCardCount;
          searchRequestModel.RailCardList.push(sRailcards);
        })
      }
      if (!this.searchRequest.IsSeason) {

        if (new Date().getTime() <= new Date(this.searchRequest.DepartureTimesStart).getTime()) {
          const departureDate = new Date(this.searchRequest.DepartureTimesStart);
          searchRequestModel.DepartureTimesStart = moment(departureDate).format('YYYY-MM-DDTHH:mm');
        } else {
          const departureDate = moment.utc(new Date()).add(3, 'hours');
          const remainder = 30 - (departureDate.minute() % 30);
          searchRequestModel.DepartureTimesStart = moment(departureDate).add(remainder, "minutes").format('YYYY-MM-DDTHH:mm');
        }
        if (new Date().getTime() <= new Date(this.searchRequest.ReturnTimesStart).getTime()) {
          const departureDate = new Date(this.searchRequest.ReturnTimesStart);
          searchRequestModel.ReturnTimesStart = moment(departureDate).format('YYYY-MM-DDTHH:mm');
        } else {
          const returnDate = moment.utc(new Date()).add(5, 'hours');
          const remainderReturn = 30 - (returnDate.minute() % 30);
          searchRequestModel.ReturnTimesStart = moment(returnDate).add(remainderReturn, "minutes").format('YYYY-MM-DDTHH:mm');
        }

        searchRequestModel.IsSeason = false;
        searchRequestModel.IsFlexi = false;
        this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
      } else {
        searchRequestModel.IsSeason = true;
        searchRequestModel.IsFlexi = false;
        searchRequestModel.DepartureTimesStart = moment.utc(new Date()).add(1, "days").format('YYYY-MM-DDTHH:mm');

        searchRequestModel.IsWeekly = true;
        searchRequestModel.IsMonthly = true;
        searchRequestModel.IsYearly = true;
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
      }
      searchRequestModel.OperaterFilter = this.searchRequest.OperaterFilter;
      searchRequestModel.TicketClassFilter = this.searchRequest.TicketClassFilter;
      searchRequestModel.ChangesFilter = this.searchRequest.ChangesFilter;
      searchRequestModel.IsReturnRequest = this.searchRequest.IsReturnRequest;
      searchRequestModel.FirstTrainArrivalTimesStart = this.searchRequest.FirstTrainArrivalTimesStart;
      searchRequestModel.FirstTrainDepartureTimesStart = this.searchRequest.FirstTrainDepartureTimesStart;
      searchRequestModel.JourneySearchTypeReturn = this.searchRequest.JourneySearchTypeReturn;
      searchRequestModel.LastTrainArrivalTimesStart = this.searchRequest.LastTrainArrivalTimesStart;
      searchRequestModel.LastTrainDepartureTimesStart = this.searchRequest.LastTrainDepartureTimesStart;
      searchRequestModel.PathConstraintLocation = this.searchRequest.PathConstraintLocation;
      searchRequestModel.PromotionCode = this.searchRequest.PromotionCode;
      searchRequestModel.Searchtype = this.searchRequest.Searchtype;
      searchRequestModel.SearchtypeReturn = this.searchRequest.SearchtypeReturn;
      this.sharedSibling.isAmendSearchOpen = false;
      this.sharedSibling.searchRequest = searchRequestModel;
    }
  }

  //PICO-3141 call method for user verification email
  isUserVerificationEmail() {
    this.startVerifyEmailRequestDto = new StartVerifyEmailRequestDto();
    this.startVerifyEmailRequestDto.UserEmail = localStorage.getItem(this.localStorageEnum?.originalEmailText);
    this.myAccountService.sentRequestToVerifyEmail(this.startVerifyEmailRequestDto);
    this.dialogRef.close();
  }

  checkIsSearchRequestAvailableOrNot() {
    return this.sharedSibling?.searchRequest;
  }

  checkSearchRequestRailCardListAvailableOrNot() {
    return this.searchRequest.RailCardList != null && this.searchRequest.RailCardList.length > 0;
  }
}
