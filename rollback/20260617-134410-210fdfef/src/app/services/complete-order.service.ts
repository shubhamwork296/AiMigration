import { Injectable } from '@angular/core';
import { HttpClientService } from '../utility/http-client.service';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpHeaders } from '@angular/common/http';
import { AppRouteEnum } from '../utility/app-constants.service';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CompleteOrderService {
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService, private readonly appRouteEnum:AppRouteEnum) { }
  
  // Start PICO-1171 generating HttpHeaders for fortress request
  httpOptions = {
    headers: new HttpHeaders({
        'clienttype': this.appRouteEnum.fortressClientType,
        'Content-Type':  this.appRouteEnum.fortressContentType,
        'Accept': '*/*',
        'Access-Control-Allow-Origin': environment.qttDomain
    })
  };
  // End
  
  getCompleteOrderResponse(validatePaymentRequest: any, isCoj) {
    let apiPath = isCoj ? this.apiPath.CojCompleteOrder : this.apiPath.completeOrder;
    return this.httpClientService.HttpPostRequest(validatePaymentRequest, apiPath);
  }

  getSmartCardCompleteOrderResponse(validatePaymentRequest: any) {
    return this.httpClientService.HttpPostRequest(validatePaymentRequest, this.apiPath.completeOrderSmartCard);
  }

  validateEnrollment(validatePaymentRequest: any) {
    return this.httpClientService.HttpPostRequest(validatePaymentRequest, this.apiPath.validateEnrollment);
  }

  validateSmartCardEnrollment(validatePaymentRequest: any) {
    return this.httpClientService.HttpPostRequest(validatePaymentRequest, this.apiPath.validateSmartCardEnrollment);
  }
 
  // Start PICO-1171 generating HTTP Post request for fortress End Point  
  fortressEndPoint(fortressRequest: any) {
    return this.httpClientService.HttpPostRequestFortress(fortressRequest,this.apiPath.fortressPath, this.httpOptions);
  }
  // End

  bookPassangerAssist(passengerAssistRequest: any) {
    return this.httpClientService.HttpPostRequest(passengerAssistRequest, this.apiPath.bookPassangerAssist);
  }
}
