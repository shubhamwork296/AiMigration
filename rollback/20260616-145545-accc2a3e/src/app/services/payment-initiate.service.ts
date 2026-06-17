import { Injectable } from '@angular/core';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) {}

  initiatePayment(paymentRequest:any) {
    return this.httpClientService.HttpPostRequest(paymentRequest, this.apiPath.paymentInitiate);
  }

  initiatePaymentSmartCard(paymentRequest:any) {
    return this.httpClientService.HttpPostRequest(paymentRequest, this.apiPath.paymentInitiateSmartCard);
  }

}
