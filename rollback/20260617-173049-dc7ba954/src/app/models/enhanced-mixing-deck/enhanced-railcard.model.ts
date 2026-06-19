import { LocationMasterData } from "../master/location-master.model";

export class EnhancedRailcardStationMasterData {
    PopularStation: LocationMasterData[];
    Railcard: EnhancedRailCardStationModel[];
    DisabledDates: Date[];
    DisabledDatesinString: string[];
}

export class EnhancedRailCardModel {
    RailCard: string;
    Adult: number;
    Child: number;
    RailCardCount: number;
}

export class EnhancedRailCardStationModel {
    Code: string;
    Name: string;
    MinChild: number;
    MaxChild: number;
    MinAdult: number;
    MaxAdult: number;
    IsAdultChildShow: boolean;
}
  