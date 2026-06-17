import { Injectable } from "@angular/core";
import { HttpClientService } from "../utility/http-client.service";
import { ApiRouteService } from "../utility/api-reference.service";

@Injectable({
    providedIn: 'root'
})

export class EnhancedCompleteOrderService{
    constructor(private readonly httpClientService: HttpClientService, 
        private readonly apiRouteService: ApiRouteService){}

    enhancedCompleteOrderResponse(enhancedValidatePaymentRequest: any, isCoj){
        let apiPath = isCoj ? this.apiRouteService.CojCompleteOrder : this.apiRouteService.enhancedCompleteOrder;
        return this.httpClientService.HttpPostRequest(enhancedValidatePaymentRequest, apiPath);
    }

    getSmartCardCompleteOrderResponse(validatePaymentRequest: any) {
      return this.httpClientService.HttpPostRequest(validatePaymentRequest, this.apiRouteService.completeOrderSmartCard);
    }

    enhancedValidateEnrollment(enhancedValidatePaymentRequest: any) {
      return this.httpClientService.HttpPostRequest(enhancedValidatePaymentRequest, this.apiRouteService.enhancedValidateEnrollment);
    }

    validateSmartCardEnrollment(validatePaymentRequest: any) {
      return this.httpClientService.HttpPostRequest(validatePaymentRequest, this.apiRouteService.validateSmartCardEnrollment);
    }

    enhancedDownloadTicket(eticketRequestDto: any) {
    return this.httpClientService.HttpPostRequest(eticketRequestDto, this.apiRouteService.enhancedDownloadTicket);
    }

    enhancedBookPassangerAssist(passengerAssistRequest: any) {
    return this.httpClientService.HttpPostRequest(passengerAssistRequest, this.apiRouteService.enhancedBookPassangerAssist);
  }

}