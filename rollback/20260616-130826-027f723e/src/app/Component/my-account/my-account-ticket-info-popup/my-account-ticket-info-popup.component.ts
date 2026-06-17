import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResponseData } from 'src/app/models/common/response.model';
import { TicketInfoModel } from 'src/app/models/mixing-deck/search-request.model';
import { CommonServices } from 'src/app/services/common.service';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';

class TicketInformation {
  discounts: string;
  child: string;
  railCard: string;
  breakOfJourney: string;
  bookingDeadline: string;
  refundableTicket: string;
  nonRefundableTicket: string;
  nonRefundableTicketForFamily: string;

  forSeasonTicketTypeDescription: string;
  trainOperator: string;
  seasonTicketTypeRefunds: string;
  changeTravelPlan: string;
  conditions: string;
  isAvailability: string;
  isValidity: string;
  seasonBookingDeadline: string;
  seasonBreakOfJourney: string;
  forSeasonChild: string;
}
@Component({
  selector: 'app-my-account-ticket-info-popup',
  templateUrl: './my-account-ticket-info-popup.component.html',
  styleUrls: ['./my-account-ticket-info-popup.component.css']
})
export class MyAccountTicketInfoPopupComponent implements OnInit {

  responseData: ResponseData;
  ticketInfoModel: TicketInfoModel;
  ticketInformation: TicketInformation;
  headerTitle: string = "Ticket Information";
  isAdvanceTicket: boolean = false;
  isFamilyTicket: boolean = false;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public commonService: CommonServices, public searchSolutionService: SearchSolutionService) { }

  ngOnInit() {
    if(this.data.journeyType !== 'season'){
    this.isTicketTypeAdvance(this.data.ticketType);
    this.isTicketTypeFamily(this.data.ticketType);
    this.ticketInfoFunction();
    }else{
      this.seasonTicketInfo();
      }
  }

  isTicketTypeAdvance(ticketType: string) {
    if (ticketType != undefined && ticketType != "") {
      ticketType = ticketType.toLowerCase();
      if (ticketType.indexOf('advance') != -1) {
        this.isAdvanceTicket = true;
      }
      else {
        this.isAdvanceTicket = false;
      }
    }
    else {
      this.isAdvanceTicket = false;
    }
  }

  isTicketTypeFamily(ticketType: string) {
    if (ticketType.indexOf("Family") > -1) {
      this.isFamilyTicket = true;
    }
    else {
      this.isFamilyTicket = false;
    }
  }

  ticketInfoFunction() {
    this.ticketInformation = new TicketInformation();
    this.ticketInfoModel = new TicketInfoModel();
    this.ticketInfoModel.ticketTypeCode = this.data.ticketTypeCode;
    this.searchSolutionService.ticketInformationSolutions(this.ticketInfoModel).subscribe((res) => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          if (this.responseData.Data) {
            let ticketTypeInfoData = this.responseData.Data.TicketTypeDescription;
            this.setTicketInfoData(ticketTypeInfoData);
          }
        }
      }
    });
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
      if (ticketInfo?.BreakOfJourney?.OutwardNote) {
        this.ticketInformation.breakOfJourney = ticketInfo.BreakOfJourney.OutwardNote;
      }
      if (ticketInfo.ChangesToTravelPlans) {
        this.ticketInformation.changeTravelPlan = ticketInfo.ChangesToTravelPlans;
      }
      this.setTicketInfoForStripTags();
    }
  }

  setTicketInfoForStripTags() {
    if (this.ticketInformation.child) {
      this.ticketInformation.child = this.commonService.stripTags(this.ticketInformation.child);
    }
    if (this.ticketInformation.refundableTicket) {
      this.ticketInformation.refundableTicket = this.commonService.stripTags(this.ticketInformation.refundableTicket);
    }
    if (this.ticketInformation.breakOfJourney) {
      this.ticketInformation.breakOfJourney = this.commonService.stripTags(this.ticketInformation.breakOfJourney).replace('()', '');
    }
    if (this.ticketInformation.railCard) {
      this.ticketInformation.railCard = this.commonService.stripTags(this.ticketInformation.railCard).replace(/&nbsp;/g, '');
    }
    if (this.ticketInformation.bookingDeadline) {
      this.ticketInformation.bookingDeadline = this.commonService.stripTags(this.ticketInformation.bookingDeadline);
    }
  }

  checkTicketInfoDiscountForChildNullOrNot(ticketInfo) {
    return ticketInfo?.Discount?.Child?.Note;
  }

  checkTicketInfoDiscountForRailcardNullOrNot(ticketInfo) {
    return ticketInfo?.Discount?.RailCard?.Note;
  }

  seasonTicketInfo(){
    this.ticketInformation = new TicketInformation();
    this.ticketInformation.trainOperator = "Most train operating companies";
    this.ticketInformation.seasonTicketTypeRefunds = "Refund may be available for unused period of ticket subject to conditions. Contact your retailer.";
    this.ticketInformation.changeTravelPlan = "If the Season ticket held does not cover the journey in full, has been left at home or is for Standard accommodation when travelling in First Class, the appropriate additional ticket must be purchased at the ticket office before travel.";
    this.ticketInformation.isAvailability = "Available on most journeys";
    this.ticketInformation.isValidity = "Any day and up to 04:29 after expiry date on ticket.";
    this.ticketInformation.seasonBookingDeadline = "No deadline";
    this.ticketInformation.seasonBreakOfJourney = "Break of Journey may not be allowed on all permitted routes.";
    this.ticketInformation.forSeasonChild = "";
    this.ticketInformation.conditions = "Season ticket holders' names and addresses are recorded. You may be contacted for survey purposes about the journeys you make with your Season ticket.";
    this.ticketInformation.forSeasonTicketTypeDescription = "Season tickets allow unlimited travel between two stations for a specified period of time. Flexi Season tickets provide customers with 8 days of travel in 28 days . The other season tickets are usually available for periods of seven days, or for any period from one month to one year. Season tickets offer great savings for regular travellers and where savings can usually be made even if travelling fewer than 5 days a week. An Annual Season ticket offers 52 weeks' travel for the price of 40 already-discounted Weekly Season tickets.";
  }

}
