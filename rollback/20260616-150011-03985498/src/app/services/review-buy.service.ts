import { Injectable } from '@angular/core';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';

@Injectable({
    providedIn: 'root'
  })
  export class ReviewBuyService {
    constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) {}

    removejourney(removeJourneyRequest:any) {
      return this.httpClientService.HttpPostRequest(removeJourneyRequest, this.apiPath.removeJourney);
    }

    addDiscountCode(addDiscount:any) {
      return this.httpClientService.HttpPostRequest(addDiscount, this.apiPath.addDiscount);
    }

    getBasketJourney(basketJourneyRequest:any) {
      return this.httpClientService.HttpPostRequest(basketJourneyRequest, this.apiPath.getBasketJourney);
    }

    getDeliveryAndBasketJourney(deliveryAndBasketJourneyRequest:any){
      return this.httpClientService.HttpPostRequest(deliveryAndBasketJourneyRequest, this.apiPath.getDeliveryAndBasketJourney);
    }   

    removeTravelExtras(travelExtrasRequest:any){
      return this.httpClientService.HttpPostRequest(travelExtrasRequest, this.apiPath.removeTravelExtras);
    }

    viewSeatPicker(seatPickerRequestDto:any) {
      return this.httpClientService.HttpPostRequest(seatPickerRequestDto, this.apiPath.viewSeatPicker);
    }

    UpdateReservation(updateReservationRequestDto:any) {
      return this.httpClientService.HttpPostRequest(updateReservationRequestDto, this.apiPath.updateReservation);
    }

    UpdateReservationAmend(updateReservationRequestDto:any) {
      return this.httpClientService.HttpPostRequest(updateReservationRequestDto, this.apiPath.updateReservationAmend);
    }

  cancelSelectedOrderSmartCard(cancelOrderSmartCard: any) {
    return this.httpClientService.HttpPostRequest(cancelOrderSmartCard, this.apiPath.cancelOrderSmartCard);
  } 
  }
