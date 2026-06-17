import { Injectable } from '@angular/core';
import { HttpClientService } from '../utility/http-client.service';
import { ApiRouteService } from '../utility/api-reference.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentDetailsService {
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) { }

  paymentDetails(paymentDetailsRequest :any) {
    return this.httpClientService.HttpPostRequest(paymentDetailsRequest, this.apiPath.paymentDetails);
  }

  appleValidateMerchant(validationUrl: any) {
    return this.httpClientService.HttpPostRequest(validationUrl, this.apiPath.validateMerchant);
  }
}
