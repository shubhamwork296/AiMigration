import { Injectable } from "@angular/core";
import { HttpClientService } from "../utility/http-client.service";
import { ApiRouteService } from "../utility/api-reference.service";

@Injectable({
    providedIn: 'root'
})

export class EnhancedReviewBuyAndDeliveryService{
    constructor(private readonly httpClientService: HttpClientService, 
        private readonly apiRouteService: ApiRouteService){}

    enhancedSaveAndGetDeliveryAndBasketJourney(enhancedDeliveryAndBasketJourneyRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedDeliveryAndBasketJourneyRequest, this.apiRouteService.enhancedReviewBuySaveAndGeDeliveryAndBasketDetails);
    }

    enhancedAddRemoveTravelExtras(enhancedTravelExtraRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedTravelExtraRequest, this.apiRouteService.enhancedReviewBuyAddRemoveTravelExtras);
    }

    enhancedGetDeliveryAndBasketJourney(enhancedGetDeliveryAndBasketJourneyRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedGetDeliveryAndBasketJourneyRequest, this.apiRouteService.enhancedReviewBuyGetDeliveryAndBasketJourney);
    }

    enhancedUpdateDeliveryModes(enhancedUpdateDeliveryModesRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedUpdateDeliveryModesRequest, this.apiRouteService.enhancedReviewBuyUpdateDeliveryMode);
    }

    enhancedAddDiscounCode(enhancedAddDiscountCodeRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedAddDiscountCodeRequest, this.apiRouteService.enhancedReviewBuyAddDiscountCode);
    }

    enhancedRemovejourney(enhancedRemoveJourneyRequest:any) {
        return this.httpClientService.HttpPostRequest(enhancedRemoveJourneyRequest, this.apiRouteService.enhancedReviewBuyRemoveJourney);
    }

    enhancedViewSeatPicker(enhancedSeatPickerRequestDto:any) {
        return this.httpClientService.HttpPostRequest(enhancedSeatPickerRequestDto, this.apiRouteService.enhancedViewSeatPicker);
    }

    enhancedUpdateReservation(enhancedUpdateReservationRequestDto:any) {
        return this.httpClientService.HttpPostRequest(enhancedUpdateReservationRequestDto, this.apiRouteService.enhancedReviewBuyUpdateReservation);
    }

    enhancedUpdatePrefrencesForNonAvanti(enhancedUpdatePrefrencesForNonAvantiRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedUpdatePrefrencesForNonAvantiRequest, this.apiRouteService.enhancedReviewBuyUpdatePreferenceForNonAvanti);
    }

    enhancedGetTicketTermsDescription(enhancedGetTicketTermsDescriptionRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedGetTicketTermsDescriptionRequest, this.apiRouteService.enhancedReviewBuyGetTicketTermsDescription);
    }

    enhancedModifyAddress(enhancedModifyAddressRequest: any){
        return this.httpClientService.HttpPostRequest(enhancedModifyAddressRequest, this.apiRouteService.enhancedReviewBuyModifyAddress);
    }

    enhancedAddSmartCard(enhancedAddSmartCardRequest: any) {
    return this.httpClientService.HttpPostRequest(enhancedAddSmartCardRequest, this.apiRouteService.enhancedSmartCardValidation);
  }

    enhancedUpdateSeatPreferences(enhancedUpdateSeatPreferencesRequestDto: any) {
        return this.httpClientService.HttpPostRequest(enhancedUpdateSeatPreferencesRequestDto, this.apiRouteService.enhancedReviewBuyUpdateSeatPreferences);
    }
}