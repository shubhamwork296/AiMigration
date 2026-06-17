export class MyPreferencesResponse {
    PaymentModeType: string;
    FavouriteStationsList: string[];
    UserDeliveryMode: string;
    UserRailCard: RailCard;
    PaymentMode: string[];
    DeliveryModeList: string[];
    RailCardList: RailCard[];
    StationsList: StationLocation[];
    Addresses: CustomerAddress[];
    IsRegisteredToLoyality: boolean;
    IsRegistrationInProgress: boolean;
}

export class RailCard {
    Code: string;
    Description: string;
}

export class StationLocation {
    Id: number;
    Name: string;
}

export class CustomerAddress {
    Address: Address;
    AddressType: string;
    IsDefault: boolean;
}

export class Address {
    Address1: string;
    Address2: string;
    Address3: string;
    PostCode: string;
    CountryCode: string;
    City: string;
    Country: string;
}

export class ConcentricTokenResponse {
    ConsentricGetPreferencesUrl: string;
    ConsentricToken: string;
    IsSuccess: boolean;
}

export class GetPreferencesRequest {
    CustomerKey: string;
    Email: string;
    IsMasterData: boolean;
    IsMyPreferencesPage: boolean;
}

export class MyPreferencesRequest {
    CustomerKey: string;
    PayMentModeType: string;
    FavouriteStations: string[];
    DeliveryMode: CustomerAttributeRequest;
    RailCard: CustomerAttributeRequest;
    CustomerInfoUpdate: CustomerInfoUpdate;
    RegisterToLoyality: boolean;
}

export class SavePreferencesRespons {
    IsPreferencesSaveSuccess: boolean;
    ResponseMessage: string;
    EnrolledForLoyality: boolean;
    EnrolmentFailureMessage: string;
}

export class CustomerAttributeRequest {
    Name: string;
    DisplayName: string;
    Value: string;
}

export class CustomerInfoUpdate {
    Email: string;
    Addresses: CustomerAddress[];
    FirstName: string;
}

