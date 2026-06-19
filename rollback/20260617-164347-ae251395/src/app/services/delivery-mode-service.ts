import { Injectable } from '@angular/core';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryModeService {
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) { }


  getDeliveryMode(deliveryModeRequest: any) {
    return this.httpClientService.HttpPostRequest(deliveryModeRequest, this.apiPath.getDeliveryModeData);
  }

  updateDeliveryModeData(deliveryModeRequest : any){
    return this.httpClientService.HttpPostRequest(deliveryModeRequest, this.apiPath.updateDeliveryModeData);
  }

  saveDeliveryModeData(deliveryModeRequest: any) {
    return this.httpClientService.HttpPostRequest(deliveryModeRequest, this.apiPath.saveDeliveryModeData);
  }
  addSmartCard(addSmartCardRequest: any) {
    return this.httpClientService.HttpPostRequest(addSmartCardRequest, this.apiPath.addSmartCard);
  }

}
