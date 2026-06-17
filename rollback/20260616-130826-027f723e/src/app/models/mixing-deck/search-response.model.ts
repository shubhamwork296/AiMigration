import { TravelSolutionModel } from './travel-solution.model';
import { SearchRequestModel } from './search-request.model';

export class SearchResponseModel {
  TravelSolutionCache: string;
  TravelSolutions: TravelSolutionModel[];
  RetTravelSolutions: TravelSolutionModel[];
  HideEarlier:boolean;
  HideLater:boolean;
  IsShowPopup:boolean;
  Message:string;
  Request: SearchRequestModel;
  Date:Date;
  IsPromo: boolean;
  IsWeekendService: boolean;
  IsReviewMergedFlowEnabled: boolean;
  OutwordDiscountCodeStatus: string;
  ReturnDiscountCodeStatus: string;
  IsDiscountCodeAvailable: boolean;
  IsDiscountCodeAvailableOnOriginalJourney: boolean;
  IsComplimentaryDiscountApplied: boolean;
  }




export class UpdateSearchResponseModel{
  SingleTravel:SearchResponseModel;
  ReturnTravel:SearchResponseModel;
}
// PICO-2212, PICO-2213 & PICO-2215 created model for quick buy response
export class QuickBuyServiceResponse {
  IsBlock: boolean;
  IsCurrentJourneyValid: boolean;
  IsNreBasket: boolean;
  IsValidSelection: boolean;
  ReservationMessage: string;
  ReviewBuyCache: string;
  IsNewJourney: boolean;
  IsReviewMergedFlowEnabled: boolean;
  IsSeasonTicket: boolean;
  PreviousCache: string;
  ReservationCache: string;
  XmlId: string;
}
