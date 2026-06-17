import { Injectable, Injector } from "@angular/core";
import { EnhancedSearchRequestModel } from "../models/enhanced-mixing-deck/enhanced-search-request.model";
import { HttpClientService } from "../utility/http-client.service";
import { ApiRouteService } from "../utility/api-reference.service";
import { EnhancedSearchTypeEnum } from "../utility/app-constants.service";

@Injectable({
  providedIn: 'root'
})
export class EnhancedSearchSolutionService {
  enhancedSearchTypeEnum: EnhancedSearchTypeEnum;
constructor(private readonly injector: Injector, private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) {
  this.enhancedSearchTypeEnum = this.injector.get(EnhancedSearchTypeEnum);
}
enhancedGetSolutions(searchRequestModel: EnhancedSearchRequestModel) {
    // earlierLater Changes
      let types = [this.enhancedSearchTypeEnum.earilier, this.enhancedSearchTypeEnum.later];
      if((types.includes(searchRequestModel.JourneySearchType?.toUpperCase()) || types.includes(searchRequestModel.JourneySearchTypeReturn?.toUpperCase()))){
        return this.httpClientService.HttpPostRequest(searchRequestModel, this.apiPath.enhancedTravelSolutionEarlierLaterSearch);
      }else{
        return this.httpClientService.HttpPostRequest(searchRequestModel, this.apiPath.enhancedTravelSolutionSearch);
      }
    }

  enhancedGetRouteDetails(routeDetailsRequest: any) {
    return this.httpClientService.HttpPostRequest(routeDetailsRequest, this.apiPath.enhancedTravelSolutionRouteDetails);
  }

  enhancedTicketInformationSolutions(ticketInfo: any) {
    return this.httpClientService.HttpPostRequest(ticketInfo, this.apiPath.enhancedTicketInfoSearch);
  }


}