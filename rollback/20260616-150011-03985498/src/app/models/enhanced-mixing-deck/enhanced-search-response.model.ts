import { TravelSolutionModel } from "../mixing-deck/travel-solution.model";
import { EnhancedSearchRequestModel } from "./enhanced-search-request.model";


export class EnhancedSearchResponseModel {
  TravelSolutionCache: string;
  TravelSolutions: TravelSolutionModel[];
  RetTravelSolutions: TravelSolutionModel[];
  HideEarlier:boolean;
  HideLater:boolean;
  IsShowPopup:boolean;
  Message:string;
  Request: EnhancedSearchRequestModel;
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