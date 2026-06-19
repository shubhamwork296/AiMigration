import { Injectable } from '@angular/core';
import { COJSearchRequestModel } from '../models/mixing-deck/search-request.model';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';

@Injectable({
  providedIn: 'root'
})
export class UpgradeTicketService {

  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService, ) { }

  fetchUpgradeData(Request: COJSearchRequestModel) {
    return this.httpClientService.HttpPostRequest(Request, this.apiPath.upgrade);
  }
}
