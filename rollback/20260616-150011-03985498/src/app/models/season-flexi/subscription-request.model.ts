import { RailCardModel } from '../mixing-deck/railcard.model';

export class SubscriptionRequest {
    DepartureTimesStart: string; // Travel Start Date
    DepartureLocation: number;
    ArrivalLocation: number;
    PathConstraintLocation: number;
    Adult: number;
    Child: number;
    PathConstraintType: string;
    RailCardList: RailCardModel[];
    TravelEndDate: string;
    IsWeekly: boolean;
    IsMonthly: boolean;
    IsAnnual: boolean;
    IsCustom: boolean;
    IsSeason: boolean;
    IsFlexi: boolean;
}
