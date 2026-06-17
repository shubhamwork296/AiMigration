import { Injectable } from '@angular/core';
import { HttpClientService } from '../utility/http-client.service';
import { ApiRouteService } from '../utility/api-reference.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentModeService {
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) { }

  getPaymentModeResponse() {
    return this.httpClientService.HttpPostRequest(null, this.apiPath.paymentMode);
  }
}
