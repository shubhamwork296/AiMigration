export class JourneyExtrasResponse {
  EvaluateTravelCache: string;
  OutwardReservation: string;
  ReturnReservation: string;
  Detail:JourneyExtraDetail[];
  IsSuccess: boolean;
  IsReviewMergedFlowEnabled: boolean;
  XmlId: string;
  }

  export class JourneyExtraDetail
  {
    Depature: string;
    Price:number;
    Currency:string;
    Type:string;
    Description:string;
    ServiceName: string;
    ServiceId:number;
    OfferId:number;
    AvailableAmount:number;
    IsReturn: boolean;
    StartValidity: Date;
    EndValidity: Date;
    SolutionNodeRef: string;
    MaxPrice :number;
    MinPrice :number;
    NumberOfAdult:string ;
    NumberOfChild :string;
    IsAvailableForCOJ: boolean;
    Selected: boolean;
    OldSolutionNodeRef: string;
  }

export class CojTravelExtraResponse extends JourneyExtrasResponse
{
  TravelExtraTotal: number;
  TrainTicketTotal: number;
  JourneyTotal: number;
}

