import { SubscriptionRequest } from './subscription-request.model';

export class SubscriptionResponse {
  FlexiEligibleOffers: EligibleOffers[];
  SeasonEligibleOffers: SeasonEligibleOffers[];
  Request: SubscriptionRequest;
  CheapestOffer: EligibleOffers;
  TravelSolutionCache: string;
  IsReviewMergedFlowEnabled: boolean;
}

export class SeasonEligibleOffers {
  WeeklyOffers: EligibleOffers;
  MonthlyOffers: EligibleOffers;
  YearlyOffers: EligibleOffers;
  CustomOffers: EligibleOffers;
  FlexiOffers: EligibleOffers;
}

export class EligibleOffers {
  DurationType: string;
  OfferId: number;
  ServiceId: number;
  TravelSolutionId: number;
  Price: number;
  Currency: string;
  Expiry: string;
  TicketType: string;
  TicketClass: string;
  Description: string;
  BasePrice: number;
  IsCheck: boolean;
  SourceStation: string;
  DestinationStation: string;
  TicketCount: string;
}
