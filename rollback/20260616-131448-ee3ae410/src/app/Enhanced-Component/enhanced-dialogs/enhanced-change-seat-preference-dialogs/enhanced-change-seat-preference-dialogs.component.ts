import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation, Injector } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';
import { ResponseData } from "src/app/models/common/response.model";
import { EnhancedReviewBuyAndDeliveryResponse } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";
import { JourneyDetail, ReservationSeat } from "src/app/models/review-buy/review-buy-model";
import { UpdateReservationRequestDto, UpdateReservationResponseDto } from "src/app/models/review-buy/seat-picker-model";
import { CommonServices } from "src/app/services/common.service";
import { EnhancedReviewBuyAndDeliveryService } from "src/app/services/enhanced-review-buy-and-delivery.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import { LocalStorageKeyEnum, SeatPrefrenceType } from "src/app/utility/app-constants.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";

@Component({
  selector: "enhanced-change-seat-preference-dialogs",
  templateUrl: "./enhanced-change-seat-preference-dialogs.component.html",
  styleUrls: ['./enhanced-change-seat-preference-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})


export class EnhancedChangeSeatPreferenceDialogs implements OnInit{
    headerTitle: string = 'Change seat preferences';
    readonly panelOpenState = signal(false);
    seatingPreferences = [];
    tableSeat: boolean = false;
    quietCoach: boolean = false;
    powerSocket: boolean = false;
    facing: string;
    position: string;
    preferredCoach: string;
    positionRadioVal: any;
    airlineStyle: boolean = false;
    directionRadioVal: any;
    nearLuggageRack: boolean = false;
    nearToilet: boolean = false;
    updateReservationRequestDto: UpdateReservationRequestDto;
    updateReservationResponseDto: UpdateReservationResponseDto;
    journey: JourneyDetail;
    seatInfo: ReservationSeat;
    isOutWardJourney: boolean;
    prevSelectedSeat: any;
    enhancedReviewBuyAndDelivery: EnhancedReviewBuyAndDeliveryService;
    responseData: ResponseData;
    sharedService: SharedService;
    isPostSale: boolean = false;
    enhancedReviewBuyAndDeliveryResponse: EnhancedReviewBuyAndDeliveryResponse;
    commonServices: CommonServices;
    storageDataService: StorageDataService;
    localStorageEnum: LocalStorageKeyEnum;
    seatPrefrenceType: SeatPrefrenceType;
    ga4DatalayerService: EnhancedGA4DatalayerService;
    
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedChangeSeatPreferenceDialogs>, private readonly injector: Injector) {
    this.enhancedReviewBuyAndDelivery = this.injector.get(EnhancedReviewBuyAndDeliveryService);
    this.updateReservationRequestDto = new UpdateReservationRequestDto();
    this.sharedService = this.injector.get(SharedService);
    this.journey = new JourneyDetail();
    this.seatInfo = new ReservationSeat();
    this.journey = data.journey;
    this.seatInfo = data.seatInfo;
    this.isOutWardJourney =  data.isOutWardJourney;
    this.isPostSale = data.isPostSale;
    this.commonServices = this.injector.get(CommonServices);
    this.storageDataService = this.injector.get(StorageDataService);
    this.localStorageEnum = this.injector.get(LocalStorageKeyEnum);
    this.seatPrefrenceType = this.injector.get(SeatPrefrenceType);
    this.ga4DatalayerService = this.injector.get(EnhancedGA4DatalayerService);
  }

  ngOnInit(): void {
    this.prevSelectedSeat = this.seatInfo?.Seat?.slice();

  }

  onPositionRadioClick(event: Event, value: string) {
    event.preventDefault();

    if (!this.positionRadioVal || this.positionRadioVal !== value) {
      this.positionRadioVal = value;
      this.position = this.positionRadioVal;
      return;
    }

    if (this.positionRadioVal === value) {
      this.positionRadioVal = undefined;
      this.position = undefined;
    }
  }

  public isPositionRadioChecked(value: any) {
    return (this.positionRadioVal === value);
  }

  onSeatTypeToggle(event: any, value: string) {
    if (event.checked) {
      if (value == this.seatPrefrenceType?.tableSeat) {
        this.seatingPreferences = this.seatingPreferences.filter(x => x != this.seatPrefrenceType?.AirlSeat);
        this.airlineStyle = false;
      }
      else if (value == this.seatPrefrenceType?.AirlSeat) {
        this.seatingPreferences = this.seatingPreferences.filter(x => x != this.seatPrefrenceType?.tableSeat);
        this.tableSeat = false;
      }
      this.seatingPreferences.push(value);
    }
    if (!event.checked) {
      let index = this.seatingPreferences.indexOf(value);
      if (index > -1) {
        this.seatingPreferences.splice(index, 1);
      }
    }
  }

  onDirectionRadioClick(event: Event, value: string) {
    event.preventDefault();

    if (!this.directionRadioVal || this.directionRadioVal !== value) {
      this.directionRadioVal = value;
      this.facing = this.directionRadioVal;
      return;
    }

    if (this.directionRadioVal === value) {
      this.directionRadioVal = undefined;
      this.facing = undefined;
    }
  }

  public isDirectionRadioChecked(value: any) {
    return (this.directionRadioVal === value);
  }

  saveSeatPreferences() {
    try {
      this.setSeatingPrefrences();
      this.updateReservationRequestDto.JourneyCreationDate = this.journey?.CreationDate;
      this.updateReservationRequestDto.IsOutward = this.isOutWardJourney;
      this.updateReservationRequestDto.ArrivalLocation = this.seatInfo.ArrivalLocation;
      this.updateReservationRequestDto.DepartureLocation = this.seatInfo.DepartureLocation;
      this.updateReservationRequestDto.IsUpdatePreferences = true;
      this.updateReservationRequestDto.Preferences = this.seatingPreferences;
      this.updateReservationRequestDto.ReviewBuyCache = this.sharedService.enhancedReviewBuyResponse.ReviewBuyCache;
      this.updateReservationRequestDto.IsPostSale = this.isPostSale;
      this.updateReservationRequestDto.Operator = this.isOutWardJourney ? this.journey?.OutwardDetail?.Operator : this.journey?.ReturnDetail?.Operator;
      this.updateReservationRequestDto.Title = this.storageDataService.getStorageData(this.localStorageEnum?.titleText, false);
      this.updateReservationRequestDto.Name = this.storageDataService.getStorageData(this.localStorageEnum?.firstName, false);
      this.updateReservationRequestDto.Surname = this.storageDataService.getStorageData(this.localStorageEnum?.lastNameText, false);
      this.updateReservationRequestDto.IsAdult = this.isExistAdultValue();

      for (let selectedSeat of this.prevSelectedSeat) {
        let oldCoach = selectedSeat.CoachNumber;
        let oldSeat = selectedSeat.Seat;

        this.updateReservationRequestDto.oldCoachAr.push(oldCoach);
        this.updateReservationRequestDto.oldSeatAr.push(oldSeat);
      }

      this.enhancedReviewBuyAndDelivery.enhancedUpdateSeatPreferences(this.updateReservationRequestDto).subscribe(
        res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.updateReservationResponseDto = this.responseData.Data;
              let reservationResponse = this.responseData.Data?.ReservationResponseDto;
              let deliveryAndBasketJourneyResponse = this.responseData?.Data?.DeliveryAndBasketJourneyResponse;
              this.enhancedReviewBuyAndDeliveryResponse = deliveryAndBasketJourneyResponse?.BasketJourneyResponse || this.responseData?.Data;
              this.sharedService.enhancedReviewBuyResponse = deliveryAndBasketJourneyResponse ? this.enhancedReviewBuyAndDeliveryResponse : this.responseData?.Data;
              this.sharedService.enhancedReviewBuyResponse.ReviewBuyCache = this.enhancedReviewBuyAndDeliveryResponse.ReviewBuyCache;
              this.commonServices.cacheSharedData();
              this.ga4DatalayerService.loadGA4DataLayerForSuccessfullyChangeSeat(this.data.bookingReferenceNumber, this.responseData.Data?.ReservationResponseDto, this.data.isOutWardJourney, this.data.journey, true, '', this.seatingPreferences, this.sharedService.searchRequest, this.prevSelectedSeat);
              this.dialogRef.close({
                IsSuccess: reservationResponse?.IsSuccess,
                fromChangeSeat: true,
                msg: reservationResponse?.Message
              });
            } else {
              console.log(this.responseData.ResponseMessage);
            }
          }
        });
    } catch (error) { console.log(error); }
  }

  setSeatingPrefrences() {
    if (this.facing != undefined) {
      this.seatingPreferences.push(this.facing);
    }
    if (this.position != undefined) {
      this.seatingPreferences.push(this.position);
    }
    if (this.preferredCoach != undefined) {
      this.seatingPreferences.push(this.preferredCoach);
    }
    this.seatingPreferences = this.seatingPreferences.filter(x => x != "0");
  }

  isExistAdultValue() {
    if (this.sharedService.searchRequest.Adult > 0) {
      return true;
    } else {
      return false;
    }
  }

  isSaveDisabled(): boolean {
    // radio groups
    let hasPosition = !!this.position;
    let hasFacing = !!this.facing;

    // checkboxes
    let hasTable = !!this.tableSeat;
    let hasQuiet = !!this.quietCoach;
    let hasPower = !!this.powerSocket;

    // return true (disable) if nothing is selected
    return !(hasPosition || hasFacing || hasTable || hasQuiet || hasPower);
  }
   
}