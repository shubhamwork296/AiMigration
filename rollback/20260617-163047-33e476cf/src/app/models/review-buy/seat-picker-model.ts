import { PrepareOrderAmendResponse } from "../account/my-bookings.model";

export class SeatPickerRequestDto {
  ReviewBuyCache:string;
  JourneyCreationDate:Date;
  Departure:string;
  Arrival:string;
  Traveldate:string;
  DepartureLocation:number;
  ArrivalLocation:number;
  IsOutward:boolean;
  EvaluateCache: string;
  IsDateChange: boolean;
  IsReturnTypeTicket: boolean;
  IsPostSale: boolean;
}

export class SeatPickerResponseDto {
  TravelCache:string;
  JourneyCreationDate : Date;
  TravelDirection:string;
  DefaultSeat:string;
  DefaultCoach:string;
  Departure:string;
  Arrival:string;
  Traveldate:string;
  Seat: SeatData[];
  Coaches:CoachData[];
  SvgCoaches:SvgCoach[];
  TrainFacilities: FacilityData[];
  AmendEvaluateCache: string;
  AmendRequest: SeatPickerRequestDto;
  IsPrioritySeat: boolean;
  IsSuccess: boolean;
  ErrorMessage: string;
  IsNonAvanti: boolean;
  PrepareOrderResponse: PrepareOrderAmendResponse;
}

export class SvgCoach {
  CoachIndex:string;
  SvgLayout:string;
  AvailableSeats:string[];
  TotalQuantity:number;
  AvailableQuantity:number;
  IsSelectedSeat:boolean;
}

export class FacilityData {
  Name:string;
  Icon:string;
  Description:string;
}

export class SeatData {
  Seat:string;
  Coach:string;
  CoachType:string;
}

export class CoachData {
  Coach:string;
  Facilities: CoachFacility[];
  CoachType:string;
}

export class CoachFacility {
  Name:string;
  Icon: string;
  Description:string;
}

export class UpdateReservationRequestDto {
  ReviewBuyCache:string;
  JourneyCreationDate:Date;
  TravelCache:string;
  OldSeat: string;
  OldCoach:string;
  NewSeat:string;
  NewCoach:string;
  DepartureLocation:number;
  ArrivalLocation:number;
  IsOutward:boolean;
  UpdateCount:number;
  UpdateCountAmend:number;
  TravellerId: string;
  IsDateChange: boolean;
  EvaluateCache: string;
  oldCoachAr = [];
  oldSeatAr = [];
  newCoachAr = [];
  newSeatAr = [];
  IsReturnTypeTicket: boolean;
  IsPostSale: boolean;
  ReopenCache: string;
  IsUpdatePreferences?: boolean;
  Preferences?: any;
  Operator?: number;
  Title?: string;
  Name?: string;
  Surname?: string;
  IsAdult?: boolean;
}

export class UpdateReservationResponseDto {
  ReviewBuyCache:string;
  TravelCache:string;
  SelectedSeat: string;
  SelectedCoach:string;
  IsSuccess:boolean;
  Message:string;
  UpdateCount:number;
  UpdateCountAmend: number;
  EvaluateCache: string;
  Oldcoachar = [];
  OldSeatAr = [];
  NewCoachAr = [];
  NewseatAr = [];
  HeaderMessage: string;
}

export class DataLayerChangeSeatItemType {
  screen_name: string | undefined;
  action: string | undefined;
  feature: string | undefined;
  booking_reference: string | undefined;
  coach: string | undefined;
  seat: string | undefined;
  seat_features: SeatFeatures;
  departure_date: string | undefined;
  return_date: string | undefined;
  journey_duration: string | undefined;
  origin: string | undefined;
  destination: string | undefined;
  travel_class: string | undefined;
  travel_type: string | undefined;
  travel_route_code: string | undefined;
  travel_type_code: string | undefined;
  journey_type: string | undefined;
  single_or_return: string | undefined;
  number_of_changes: string | undefined;
  additional_information: string | undefined;
  days_in_advance: number | undefined;
  railcard_code: string | undefined;
  railcard_used: boolean | undefined;
  adult_pax: number | undefined;
  child_pax: number | undefined;
  total_pax: number | undefined;
  original_coach: string | undefined;
  original_seat: string | undefined;
  price: number | undefined;
  message: string | undefined;
}

export class SeatFeatures {
  seat_direction: string;
  window_or_aisle: string;
  seat_type: string;
  other_seat_features: string;
}



