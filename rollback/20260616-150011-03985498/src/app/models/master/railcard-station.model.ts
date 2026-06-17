import { LocationMasterData } from "./location-master.model";

export class RailcardStationMasterData {
    PopularStation: LocationMasterData[];
    Railcard: RailcardModel[];
    DisabledDates: Date[];
    DisabledDatesinString: string[];
}

export class RailcardModel {
    Code: string;
    Name: string;
    MinChild: number;
    MaxChild: number;
    MinAdult: number;
    MaxAdult: number;
    IsAdultChildShow: boolean;
}
