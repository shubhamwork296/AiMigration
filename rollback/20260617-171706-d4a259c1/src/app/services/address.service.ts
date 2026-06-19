import { Injectable } from '@angular/core';
import { HttpClientService } from '../utility/http-client.service';
import { ApiRouteService } from '../utility/api-reference.service';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) { }

  modifyAddress(customerInfoUpdateModel) {
    return this.httpClientService.HttpPostRequest(customerInfoUpdateModel, this.apiPath.modifyAddress);
  }
}
