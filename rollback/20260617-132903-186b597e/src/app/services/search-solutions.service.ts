import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SearchRequestModel } from '../models/mixing-deck/search-request.model';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';

@Injectable({
  providedIn: 'root'
})
export class SearchSolutionService {

  promotionalBannerData = new Subject();
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) {}

  setPromotionalBannerData(data) {
    this.promotionalBannerData.next(data);
  }

  getPromotionalBannerData() : Observable<any> {
    return this.promotionalBannerData.asObservable();
  }

  getPromotionalDataAction() : Observable<any> {
     return this.promotionalBannerData.asObservable();
  }

  setPromotionalDataAction(data){
     this.promotionalBannerData.next(data);
  }

  getSolutions(searchRequestModel:SearchRequestModel) {
  // earlierLater Changes
    if(searchRequestModel.JourneySearchType != 'NEW' || searchRequestModel.JourneySearchTypeReturn != 'NEW'){
      return this.httpClientService.HttpPostRequest(searchRequestModel, this.apiPath.travelSolutionEarlierLaterSearch);
    }else{
      return this.httpClientService.HttpPostRequest(searchRequestModel, this.apiPath.travelSolutionSearch);
    }
  }

  getChangeDateTimeSolutions(searchRequestModel:any) {
    return this.httpClientService.HttpPostRequest(searchRequestModel, this.apiPath.changeDateTimetravelSolutionSearch);
  }

  getReturnSolutions(searchRequestModel:any) {
    return this.httpClientService.HttpPostRequest(searchRequestModel, this.apiPath.travelSolutionReturnSearch);
  }

  getRouteDetails(routeDetailsRequest:any, isViewBooking : boolean) {
    let routeDetailApi = isViewBooking ? this.apiPath.travelSolutionViewBookingRouteDetails : this.apiPath.travelSolutionRouteDetails; 
    return this.httpClientService.HttpPostRequest(routeDetailsRequest, routeDetailApi);
  }

  getSeasonFlexiDetails(searchRequestModel:any) {
    return this.httpClientService.HttpPostRequest(searchRequestModel, this.apiPath.seasonFlexiSearch);
  }

  nreHandOffTravelSolutionData(handOffDataReqDto: any) {
    return this.httpClientService.HttpPostRequest(handOffDataReqDto, this.apiPath.nreHandoffTravelSolutionData);
  }

  fetchAmendEvaluate(evaluateRequest: any) {
    return this.httpClientService.HttpPostRequest(evaluateRequest, this.apiPath.amendEvaluate);
  }

  fetchAmendEvaluateReturn(evaluateRequest: any) {
    return this.httpClientService.HttpPostRequest(evaluateRequest, this.apiPath.amendEvaluateReturn);
  }

  ticketInformationSolutions(ticketInfo: any) {
    return this.httpClientService.HttpPostRequest(ticketInfo, this.apiPath.ticketInfoSearch);
  }

}
