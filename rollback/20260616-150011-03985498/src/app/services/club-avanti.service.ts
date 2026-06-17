import { Injectable } from "@angular/core";
import { ApiRouteService } from "../utility/api-reference.service";
import { HttpClientService } from "../utility/http-client.service";
import { ClubAvantiMemberShipDetailsRequestDto, ClubAvantiRewardDetailRequestDto, RegisterToClubAvantiRequestDto } from "../models/account/club-avanti.model";

@Injectable({
    providedIn: 'root'
})

export class ClubAvantiService{
    constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService){
    }

    getClubAvantiMemberShipDetail(clubAvantiMemberShipDetailRequest: ClubAvantiMemberShipDetailsRequestDto) {
        return this.httpClientService.HttpPostRequest(clubAvantiMemberShipDetailRequest, this.apiPath.getClubAvanti);
    }

    registerToClubAvanti(registerToClubAvantiRequest: RegisterToClubAvantiRequestDto){
        return this.httpClientService.HttpPostRequest(registerToClubAvantiRequest,this.apiPath.registerToClubAvanti);
    }

    getClubAvantiJourneyList(clubAvantiRewardDetailRequest : ClubAvantiRewardDetailRequestDto){
        return this.httpClientService.HttpPostRequest(clubAvantiRewardDetailRequest, this.apiPath.getClubAvantiJourneyList);
    }
}
