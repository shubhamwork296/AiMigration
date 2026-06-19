import { JourneyExtrasResponse } from './journey-extras-response.model';
import { SearchRequestModel } from '../mixing-deck/search-request.model';
import { FareDetails } from '../mixing-deck/fare.model';
import { CreateReservationRequest } from './reservation.model';
import { TravelSolutionModel } from '../mixing-deck/travel-solution.model';

export class NreJourneyExtrasResponse {
    IsBasket:boolean;
    JourneyCount: number;
    Journey:number;
    BasketCache:string;
    JourneyExtras :JourneyExtrasResponse;
    TotalPrice: number;
    OutwardFares: FareDetails[];
    ReturnFares: FareDetails[];
    SearchRequest: SearchRequestModel
    ReservationCache: string;
    ReservationMessage: string;
    TravelSolutions: TravelSolutionModel;
    ReturnTravelSolutions: TravelSolutionModel;
    IsReviewMergedFlowEnabled: boolean;
    RequestMetaData: RequestMetaData;
}


export class HandOffDataReqDto {
    Journey:number;
    requestId:string;
    BasketCache :string;
    ReservationRequest: CreateReservationRequest;
    ReservationCache: string;
}

export class NreTravelSolutionResponse {
    Message:string;
    Request: SearchRequestModel
}

export class RequestMetaData {
    Browser: string;
    Device: string;
    HttpUserAgent: string;
    OJPChannel: string;
    OS: string;
}
