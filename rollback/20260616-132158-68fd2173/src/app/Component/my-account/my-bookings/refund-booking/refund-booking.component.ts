import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PostSaleData, ProcessOrderRequestDto, ProcessOrderResponseDto, RefundDetailsRequestDto, RefundDetailsResponseDto, RefundResponseDetails } from 'src/app/models/account/refund-booking';
import { ResponseData } from 'src/app/models/common/response.model';
import { CommonServices } from 'src/app/services/common.service';
import { MyAccountService } from 'src/app/services/my-account.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppConstantsService, AppRouteEnum, Ga4DatalayeEventNameEnum } from 'src/app/utility/app-constants.service';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
@Component({
  selector: 'app-refund-booking',
  templateUrl: './refund-booking.component.html',
  styleUrls: ['./refund-booking.component.css']
})
export class RefundBookingComponent implements OnInit {
  hideHeaderFlag: boolean = true;
  refundDetailsRequest: RefundDetailsRequestDto;
  refundDetailsResponse: RefundDetailsResponseDto;
  processOrderRequest: ProcessOrderRequestDto;
  responseData: ResponseData;
  AdminFee: number;
  RefundAmount: number;
  TotalRefundAmount: number;
  NonRefundableAmount: number;
  TravelId: number;
  TravelSolutionId: number;
  BookingReferenceNumber: number;
  IsViewBooking: boolean = false;
  CustomerKey: string;
  Email: string;
  TravelExtraOfferId: number;
  //Parameter to check refund available for any passenger in outward leg
  IsOutwardJourneyRefundable: boolean = false;
  //Parameter to check refund available for any passenger in return leg
  IsReturnJourneyRefundable: boolean = false;
  //Array for non refunded passengers in outward leg
  OutwardRefundDetails: RefundResponseDetails[];
  //Array for non refunded passengers in return leg
  ReturnRefundDetails: RefundResponseDetails[];
  PostSaleData: PostSaleData[] = [];
  //Parameter to show All passengers outward leg check box checked/unchecked
  IsOutwardAllPassengers: boolean = false;
  //Parameter to show All passengers return leg check box checked/unchecked
  IsReturnAllPassengers: boolean = false;
  confirmRefundResponse: ProcessOrderResponseDto;
  refundErrorMessage: string = "Sorry, your ticket(s) could not be cancelled. Please try again later.";
  //Parameter to count outward leg available adults for refund
  OutAdultsForRefund: number = 0;
  //Parameter to count outward leg available child for refund
  OutChildForRefund: number = 0;
  //Parameter to count return leg available adults for refund
  RetAdultsForRefund: number = 0;
  //Parameter to count return leg available child for refund
  RetChildForRefund: number = 0;
  //Parameter to count outward leg selected adults for refund
  OutSelectedAdultsForRefund: number = 0;
  //Parameter to count outward leg selected child for refund
  OutSelectedChildForRefund: number = 0;
  //Parameter to count return leg selected adults for refund
  RetSelectedAdultsForRefund: number = 0;
  //Parameter to count return leg selected child for refund
  RetSelectedChildForRefund: number = 0;
  //Parameter to count outward leg selected travel extras for refund
  OutSelectedTravelExtraForRefund: number = 0;
  //Parameter to count return leg selected travel extras for refund
  RetSelectedTravelExtraForRefund: number = 0;
  //Parameter to check outward leg is full refunded
  IsAllOutRefunded: boolean;
  //Parameter to check return leg is full refunded
  IsAllRetRefunded: boolean;
  //Parameter to enable and disable confirm refund button
  IsDisabledConfirmRefund: boolean = false;
  datalayerService: DataLayerService;
  ga4datalayerService: GA4DatalayerService;
  appConstantsService: AppConstantsService;
  ga4DatalayeEventNameEnum: Ga4DatalayeEventNameEnum;

  constructor(private readonly myAccountService: MyAccountService, public commonService: CommonServices, private readonly router: Router,
    private readonly appRouteEnum: AppRouteEnum, public sharedService: SharedService,
    private readonly injector: Injector, public notificationService: NotificationService) {
      this.datalayerService = this.injector.get(DataLayerService);
      this.ga4datalayerService = this.injector.get(GA4DatalayerService);
      this.appConstantsService = this.injector.get(AppConstantsService);
      this.ga4DatalayeEventNameEnum = this.injector.get(Ga4DatalayeEventNameEnum);
     }

  ngOnInit() {
    this.TravelId = +localStorage.getItem('TravelId');
    this.TravelSolutionId = +localStorage.getItem('TravelSolutionId');
    this.CustomerKey = localStorage.getItem('CustomerKey');
    this.IsViewBooking = JSON.parse(localStorage.getItem('IsViewBooking'));
    this.BookingReferenceNumber = +localStorage.getItem('BookingReferenceNumber');
    this.Email = localStorage.getItem('Email');
    this.TravelExtraOfferId = +localStorage.getItem('TravelExtraOfferId');
    this.getBookingRefundDetails();

    // Page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
  }

  // Method to get IsReturnJourneyRefundable
  getIsReturnJourneyRefundable(){
    try {
      if(this.refundDetailsResponse.IsReturnJourney){
        return this.IsOutwardJourneyRefundable;
      }else if (this.refundDetailsResponse.RefundDetails.filter(x => !x.IsOutward && !x.IsRefunded && x.IsRefundable).length > 0){
        return true;
      }
      return false;      
    } catch (error) { console.log(error); }
  }

  // Method to get refund details for journey
  getBookingRefundDetails() {
    this.refundDetailsRequest = new RefundDetailsRequestDto();
    this.refundDetailsRequest.TravelId = this.TravelId;
    this.refundDetailsRequest.TravelSolutionId = this.TravelSolutionId;
    this.refundDetailsRequest.CustomerKey = this.CustomerKey;
    this.refundDetailsRequest.BookingReferenceNumber = this.BookingReferenceNumber;
    this.myAccountService.getBookingRefundDetails(this.refundDetailsRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.refundDetailsResponse = this.responseData.Data;
            this.setRefundData(); 
          }
          else {
            try {
              this.datalayerService.loadGTMDataLayerOnRefundPopup(this.responseData.Data, 'Failure', this.responseData.ResponseMessage, this.BookingReferenceNumber, (this.OutAdultsForRefund + this.RetAdultsForRefund), (this.OutChildForRefund + this.RetChildForRefund));
            } catch (error) {
            }
            this.router.navigateByUrl("/" + (this.IsViewBooking ? this.appRouteEnum.ViewBooking : this.appRouteEnum.MyBookings)).then(() => {
              this.notificationService.error(this.refundErrorMessage);
            });
          }
        }
      });
  }

  setRefundData() {
    if (this.refundDetailsResponse?.RefundSummary) {
      this.AdminFee = this.refundDetailsResponse.RefundSummary.AdminFee;
      this.RefundAmount = this.refundDetailsResponse.RefundSummary.RefundAmount;
      this.NonRefundableAmount = this.refundDetailsResponse.RefundSummary.NonRefundablePrice;
      this.TotalRefundAmount = this.RefundAmount - this.AdminFee - this.NonRefundableAmount;
      this.setRefundElementsSelected();
      this.setOutwardRefundData();
      this.setReturnRefundData();
      this.enableDisabledConfirmRefund();
      this.calculateRefundedAmount();
      let selectedAllPassangerParams = {
        IsOutwardAllPassengers: this.IsOutwardAllPassengers,
        IsReturnAllPassengers: this.IsReturnAllPassengers,
        IsOutwardJourneyRefundable: this.IsOutwardJourneyRefundable,
        IsAllOutRefunded: this.IsAllOutRefunded,
        IsReturnJourneyRefundable: this.IsReturnJourneyRefundable,
        IsAllRetRefunded: this.IsAllRetRefunded
      }
     this.ga4datalayerService.loadGALayerForRefundSummaryItems(this.refundDetailsResponse, this.OutwardRefundDetails, this.ReturnRefundDetails, this.ga4DatalayeEventNameEnum.refundSummaryEvent, this.BookingReferenceNumber, selectedAllPassangerParams, false);
    }
    else {
      this.router.navigateByUrl("/" + (this.IsViewBooking ? this.appRouteEnum.ViewBooking : this.appRouteEnum.MyBookings)).then(() => {
        this.notificationService.error(this.refundErrorMessage);
      });
    }
    try {
      this.datalayerService.loadGTMDataLayerOnRefundPopup(this.refundDetailsResponse, 'Success', '', this.BookingReferenceNumber, (this.OutAdultsForRefund + this.RetAdultsForRefund), (this.OutChildForRefund + this.RetChildForRefund));
    } catch (error) {
    }
  }

  setRefundElementsSelected() {
    if (this.TravelExtraOfferId != 0) {
      this.refundDetailsResponse.RefundDetails.forEach(t => {
        if (!t.IsRefunded && t.IsRefundable && t.OfferServiceId == this.TravelExtraOfferId)
          t.Selected = true;
      });
    }
    else {
      this.refundDetailsResponse.RefundDetails.forEach(t => {
        if (!t.IsRefunded && t.IsRefundable)
          t.Selected = true;
      });
    }
  }

  setOutwardRefundData() {
    this.IsOutwardJourneyRefundable = this.refundDetailsResponse.RefundDetails.filter(x => x.IsOutward && !x.IsRefunded && x.IsRefundable).length > 0 ? true : false;
    if (this.refundDetailsResponse.IsReturnJourney) {
      this.OutwardRefundDetails = this.refundDetailsResponse.RefundDetails;
      this.OutwardRefundDetails.sort(y => y.OfferId);
    }
    else {
      this.OutwardRefundDetails = this.refundDetailsResponse.RefundDetails.filter(x => x.IsOutward).sort(y => y.OfferId);
    }
    this.IsOutwardAllPassengers = this.IsOutwardJourneyRefundable && this.TravelExtraOfferId == 0;
    this.OutAdultsForRefund = this.refundDetailsResponse.RefundDetails.filter(x => x.IsOutward && !x.IsTravelExtraExists && !x.IsRefunded && x.IsRefundable && x.IsAdult).length;
    this.OutChildForRefund = this.refundDetailsResponse.RefundDetails.filter(x => x.IsOutward && !x.IsTravelExtraExists && !x.IsRefunded && x.IsRefundable && !x.IsAdult).length;
    this.OutSelectedAdultsForRefund = this.TravelExtraOfferId != 0 ? 0 : this.OutAdultsForRefund;
    this.OutSelectedChildForRefund = this.TravelExtraOfferId != 0 ? 0 : this.OutChildForRefund;
    this.OutSelectedTravelExtraForRefund = this.refundDetailsResponse.RefundDetails.filter(x => x.IsOutward && x.IsTravelExtraExists && !x.IsRefunded && x.IsRefundable).length;
    this.IsAllOutRefunded = this.refundDetailsResponse.RefundDetails.filter(x => x.IsOutward).every(y => y.IsRefunded) ? true : false;
  }

  setReturnRefundData() {
    if (this.refundDetailsResponse.ReturnDetails) {
      this.IsReturnJourneyRefundable = this.getIsReturnJourneyRefundable();
      if (!this.refundDetailsResponse.IsReturnJourney) {
        this.ReturnRefundDetails = this.refundDetailsResponse.RefundDetails.filter(x => !x.IsOutward).sort(y => y.OfferId);
      }
      this.IsReturnAllPassengers = this.refundDetailsResponse.IsReturnJourney ? false : this.IsReturnJourneyRefundable && this.TravelExtraOfferId == 0;
      this.RetAdultsForRefund = this.refundDetailsResponse.RefundDetails.filter(x => !x.IsOutward && !x.IsTravelExtraExists && !x.IsRefunded && x.IsRefundable && x.IsAdult).length;
      this.RetChildForRefund = this.refundDetailsResponse.RefundDetails.filter(x => !x.IsOutward && !x.IsTravelExtraExists && !x.IsRefunded && x.IsRefundable && !x.IsAdult).length;
      this.RetSelectedAdultsForRefund = this.TravelExtraOfferId != 0 ? 0 : this.RetAdultsForRefund;
      this.RetSelectedChildForRefund = this.TravelExtraOfferId != 0 ? 0 : this.RetChildForRefund;
      this.RetSelectedTravelExtraForRefund = this.refundDetailsResponse.RefundDetails.filter(x => !x.IsOutward && x.IsTravelExtraExists && !x.IsRefunded && x.IsRefundable).length;
      this.IsAllRetRefunded = this.refundDetailsResponse.RefundDetails.filter(x => !x.IsOutward).every(y => y.IsRefunded) ? true : false;
    }
  }

  // Method to redirected to my bookings page
  redirectToMyBooking() {
    this.router.navigate([`./` + this.appRouteEnum.MyBookings]);
  }

  // Method on click of cancel button
  cancelRefund() {
    let selectedAllPassangerParams = {
      IsOutwardAllPassengers: this.IsOutwardAllPassengers,
      IsReturnAllPassengers: this.IsReturnAllPassengers,
      IsOutwardJourneyRefundable: this.IsOutwardJourneyRefundable,
      IsAllOutRefunded: this.IsAllOutRefunded,
      IsReturnJourneyRefundable: this.IsReturnJourneyRefundable,
      IsAllRetRefunded: this.IsAllRetRefunded
    }
    this.ga4datalayerService.loadGALayerForRefundSummaryItems(this.refundDetailsResponse, this.OutwardRefundDetails, this.ReturnRefundDetails, this.ga4DatalayeEventNameEnum.refundCancelledEvent, this.BookingReferenceNumber, selectedAllPassangerParams, false);
    this.router.navigateByUrl("/" + (this.IsViewBooking ? this.appRouteEnum.ViewBooking : this.appRouteEnum.MyBookings));
  }

  // Method to proceed for refund journey
  processOrderRefund() {
    this.createProcessOrderRequest();
    this.myAccountService.processOrderRefund(this.processOrderRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.confirmRefundResponse = this.responseData.Data;

            this.getProcessOrderResponse();
            
            try {
              this.datalayerService.loadGTMDataLayerOnRefundConfirmation(this.refundDetailsResponse, (this.OutSelectedAdultsForRefund + this.RetSelectedAdultsForRefund), (this.OutSelectedChildForRefund + this.RetSelectedChildForRefund), this.TotalRefundAmount, this.BookingReferenceNumber, 'Success', '');
            } catch (error) {
            }
          }
          else {
            this.notificationService.error(this.refundErrorMessage);
            try {
              this.datalayerService.loadGTMDataLayerOnRefundConfirmation(this.refundDetailsResponse, (this.OutSelectedAdultsForRefund + this.RetSelectedAdultsForRefund), (this.OutSelectedChildForRefund + this.RetSelectedChildForRefund), this.TotalRefundAmount, this.BookingReferenceNumber, 'Failure', this.responseData.ResponseMessage);
            } catch (error) {
            }
          }
        }
      });
  }

  getProcessOrderResponse() {
    if (this.confirmRefundResponse) {
      localStorage.removeItem("TravelId");
      localStorage.removeItem("TravelSolutionId");
      localStorage.removeItem("IsViewBooking");
      localStorage.removeItem("BookingReferenceNumber");
      localStorage.removeItem("TravelExtraOfferId");
      localStorage.setItem("RefundedTravelId", this.confirmRefundResponse.TravelId.toString());
      localStorage.setItem("RefundedTravelSolutionId", this.confirmRefundResponse.TravelSolutionId.toString());
      localStorage.setItem("RefundedTicketStatus", this.confirmRefundResponse.TicketStatus);
      this.commonService.loaderRequired = true;
      this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isRefunded: true } });
      if (this.IsOutwardAllPassengers) {
        this.IsOutwardJourneyRefundable = false;
        this.IsAllOutRefunded = true;
      }
      if (this.IsReturnAllPassengers) {
        this.IsReturnJourneyRefundable = false;
        this.IsAllRetRefunded = true;
      }
      let selectedAllPassangerParams = {
        IsOutwardAllPassengers: this.IsOutwardAllPassengers,
        IsReturnAllPassengers: this.IsReturnAllPassengers,
        IsOutwardJourneyRefundable: this.IsOutwardJourneyRefundable,
        IsAllOutRefunded: this.IsAllOutRefunded,
        IsReturnJourneyRefundable: this.IsReturnJourneyRefundable,
        IsAllRetRefunded: this.IsAllRetRefunded
      }
      this.ga4datalayerService.loadGALayerForRefundSummaryItems(this.refundDetailsResponse, this.OutwardRefundDetails, this.ReturnRefundDetails, this.ga4DatalayeEventNameEnum.refundConfirmationEvent, this.BookingReferenceNumber, selectedAllPassangerParams, true);
    }
    else {
      this.notificationService.error(this.refundErrorMessage);
    }
  }

  createProcessOrderRequest() {
    this.commonService.loaderRequired = true;
    this.processOrderRequest = new ProcessOrderRequestDto();
    this.processOrderRequest.Email = this.Email;
    this.processOrderRequest.CustomerKey = this.CustomerKey;
    this.processOrderRequest.TravelId = this.TravelId;
    this.processOrderRequest.TravelSolutionId = this.TravelSolutionId;
    this.processOrderRequest.IsReturnJourney = this.refundDetailsResponse.IsReturnJourney;
    this.processOrderRequest.PartialRefund = true;
    if (this.processOrderRequest.PartialRefund) {
      this.PostSaleData = [];
      if (this.OutwardRefundDetails) {
        this.OutwardRefundDetails.forEach(x => {
          if (x.Selected) {
            this.PostSaleData.push({
              OfferId: x.OfferId,
              RetOfferId: x.RetOfferId,
              TravelId: x.TravelId,
              TravelSolutionId: x.TravelSolutionId,
              BikeOfferServiceId: x.BikeOfferServiceId,
              RetBikeOfferServiceId: x.RetBikeOfferServiceId
            });
          }
        });
      }
      if (this.ReturnRefundDetails) {
        this.ReturnRefundDetails.forEach(y => {
          if (y.Selected) {
            this.PostSaleData.push({
              OfferId: y.OfferId,
              RetOfferId: y.RetOfferId,
              TravelId: y.TravelId,
              TravelSolutionId: y.TravelSolutionId,
              BikeOfferServiceId: y.BikeOfferServiceId,
              RetBikeOfferServiceId: y.RetBikeOfferServiceId
            });
          }
        });
      }
      this.processOrderRequest.PostSaleData = this.PostSaleData;
    }
  }

  // Method when change passenger checkbox of outward and return
  onPassengerChange(checked, refundResponseDetails: RefundResponseDetails) {
    if (refundResponseDetails.IsOutward) {
      this.OutwardRefundDetails.forEach(x => {
        if (x.OfferId == refundResponseDetails.OfferId && x.TravelId == refundResponseDetails.TravelId && x.TravelSolutionId == refundResponseDetails.TravelSolutionId) {
          x.Selected = checked;
        }
      });
    }
    else {
      this.ReturnRefundDetails.forEach(y => {
        if (y.OfferId == refundResponseDetails.OfferId && y.TravelId == refundResponseDetails.TravelId && y.TravelSolutionId == refundResponseDetails.TravelSolutionId) {
          y.Selected = checked;
        }
      });
    }
    this.updateAllComplete(refundResponseDetails.IsOutward);
    this.calculateRefundedAmount();
    this.updateSelectedPassengers();
    this.enableDisabledConfirmRefund();
  }

  // Method when change All passenger checkbox of outward and return
  onAllPassengerChange(checked, isOutward: boolean) {
    if (isOutward) {
      this.IsOutwardAllPassengers = checked;
      this.OutwardRefundDetails.forEach(t => {
        if (!t.IsRefunded && t.IsRefundable)
          t.Selected = checked
      });
    }
    else {
      this.IsReturnAllPassengers = checked;
      this.ReturnRefundDetails.forEach(t => {
        if (!t.IsRefunded && t.IsRefundable)
          t.Selected = checked
      });
    }
    this.calculateRefundedAmount();
    this.updateSelectedPassengers();
    this.enableDisabledConfirmRefund();
  }

  // Method to update All passengers variables of outward and return
  updateAllComplete(isOutward: boolean) {
    if (isOutward)
      this.IsOutwardAllPassengers = this.OutwardRefundDetails?.filter(t => !t.IsRefunded && t.IsRefundable).every(x => x.Selected);
    else
      this.IsReturnAllPassengers = this.ReturnRefundDetails?.filter(t => !t.IsRefunded && t.IsRefundable).every(y => y.Selected);
  }

  // Method to calculate refunded price with delivery and admin fee
  calculateRefundedAmount() {
    this.AdminFee = 0;
    this.RefundAmount = 0;
    this.NonRefundableAmount = 0;
    if (this.OutwardRefundDetails) {
      this.OutwardRefundDetails.forEach((obj) => {
        if (obj.Selected) {
          this.AdminFee += obj.AdminFee;
          this.RefundAmount += obj.Price;
          this.NonRefundableAmount += obj.NonRefundablePrice;
        }
      });
    }
    if (this.ReturnRefundDetails) {
      this.ReturnRefundDetails.forEach((returnRefundDetail) => {
        if (returnRefundDetail.Selected) {
          this.AdminFee += returnRefundDetail.AdminFee;
          this.RefundAmount += returnRefundDetail.Price;
          this.NonRefundableAmount += returnRefundDetail.NonRefundablePrice;
        }
      });
    }
    this.TotalRefundAmount = (this.RefundAmount - this.AdminFee - this.NonRefundableAmount);
  }

  //Method to calculate selected adult and child for outward and return
  updateSelectedPassengers() {
    if (this.OutwardRefundDetails) {
      this.OutSelectedAdultsForRefund = this.OutwardRefundDetails.filter(x => x.IsOutward && x.Selected && x.IsAdult && !x.IsTravelExtraExists).length;
      this.OutSelectedChildForRefund = this.OutwardRefundDetails.filter(x => x.IsOutward && x.Selected && !x.IsAdult && !x.IsTravelExtraExists).length;
      this.OutSelectedTravelExtraForRefund = this.OutwardRefundDetails.filter(x => x.IsOutward && x.Selected && x.IsTravelExtraExists).length;
    }
    if (this.ReturnRefundDetails) {
      this.RetSelectedAdultsForRefund = this.ReturnRefundDetails.filter(x => !x.IsOutward && x.Selected && x.IsAdult && !x.IsTravelExtraExists).length;
      this.RetSelectedChildForRefund = this.ReturnRefundDetails.filter(x => !x.IsOutward && x.Selected && !x.IsAdult && !x.IsTravelExtraExists).length;
      this.RetSelectedTravelExtraForRefund = this.ReturnRefundDetails.filter(x => !x.IsOutward && x.Selected && x.IsTravelExtraExists).length;
    }
  }

  // Method to create child and adult count summary text
  createAdultChildSummaryText(adultCount: number, childCount: number) {
    return "(" + adultCount + this.isAdultOrAdults(adultCount) + this.isChildAvailable(childCount) +
    this.isChildOrChildren(childCount) + ")";
  }

  // Method to check count and text of Adult
  isAdultOrAdults(adultCount):string{
    if(adultCount > 1) return " Adults";
    return " Adult";
  }

  // Method to check Child is available or not
  isChildAvailable(childCount):string{
    if(childCount > 0) return ", " + childCount;
    return "";
  }

  // Method to check count and text of Child
  isChildOrChildren(childCount):string{
    if(childCount == 0) return "";
    else if(childCount > 1) return ' Children';
    return ' Child';
  }

  // Method to enable and disable confirm refund button
  enableDisabledConfirmRefund() {
    let isOutTEExists = this.getisOutTEExists();
    let isRetTEExists = this.getisRetTEExists();
    if (isOutTEExists || isRetTEExists)
      this.IsDisabledConfirmRefund = true;
    else
      this.IsDisabledConfirmRefund = false;
  }

  // Method to check travel extra exists in outward refund details 
  getisOutTEExists(){
    if(this.OutwardRefundDetails && this.OutwardRefundDetails.filter(x => x.Selected && x.BikeOfferServiceId != 0).length > 0) return true;
    return false;
  }

  // Method to check travel extra exists in return refund details 
  getisRetTEExists(){
    if (this.refundDetailsResponse.IsReturnJourney) { 
      if (this.OutwardRefundDetails && this.OutwardRefundDetails.filter(x => x.Selected && x.RetBikeOfferServiceId != 0).length > 0) return true;
      return false;
    }
    else {
      if (this.ReturnRefundDetails && this.ReturnRefundDetails.filter(x => x.Selected && x.BikeOfferServiceId != 0).length > 0) return true;
      return false;
    }    
  } 
  
  getRefundTypeText(refundDetail: RefundResponseDetails) {
    if (refundDetail.IsTravelExtraExists) {
      if (refundDetail.TravelExtraName === this.appConstantsService.plusBus) {
        return "PlusBus";
      }
      else {
        return refundDetail.TravelExtraName;
      }
    }
    else {
      return refundDetail.IsAdult ? 'Adult' : 'Child';
    }
  }

  getTravelExtraType(refundDetail: RefundResponseDetails) {
    if (refundDetail.IsTravelExtraExists) {
      if (this.refundDetailsResponse.IsReturnJourney) {
        return refundDetail.IsOutward ? "Outward " : "Return ";
      }
    }
  }
}