export class EnhancedFareBreakdownModel {
    JourneyType: string;
    IsReturnJourney: boolean;
    OutWardJourney: EnhancedJourneyModel[];
    ReturnJourney: EnhancedJourneyModel[];
    SeasonJourney: EnhancedJourneyModel;
    FlexiJourney: EnhancedJourneyModel;
    OutwardJourneyExtras: EnhancedJourneyModel[];
    ReturnJourneyExtras: EnhancedJourneyModel[];
    DeliveryDetails: EnhancedJourneyModel[];
    DiscountPrice: number = 0;
    DiscountPercent:string;
    DiscountType: string;
    JourneyTotalPrice?: number;
    Adult?: number;
    Child?: number;
    EvoucherPrice?: number;
    XmlId?: string;
    OutwardJourneyExtrasPerPassenger: EnhancedJourneyModel[];
    ReturnJourneyExtrasPerPassenger: EnhancedJourneyModel[];
  }
  
  export class EnhancedJourneyModel {
    Passenger: string;
    RailCard: string;
    PricePerPerson: number;
    TotalPrice: number;
    IsCheck: boolean;
    JourneyExtrasTitle: string;
    JourneyDeliveryTitle: string;
    ServiceId:number;
    OfferId:number;
    SolutionNodeRef: string;
  }
  
  
  
  