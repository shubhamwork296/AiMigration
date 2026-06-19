import { DeliveryMode } from '../delivery-modes/delivery-modes.model';

export class CustomerLoginResponse {
  IsAuthenticated: boolean;
  DeliveryCache: string;
  CustomerDetail: CustomerDetail;
  DeliveryModes: DeliveryMode;
  ResponseMessage: string;
  Expiration: Date;
  Refresh: RefreshTokenInfo;
  SokenId: string;
  clubAvantiDetails: ClubAvantiDetails;
  IsClubAvantiEnabled: boolean;
}
export class CustomerDetail {
  Title: string;
  FirstName: string;
  LastName: string;
  UserName:string;
  CustomerKey: string;
  Email: string;
  OriginalEmail: string;
  DateOfBirth: string;
  Id: number;
  Addresses: CustomerAddress[];
  PhotoCardId: string;
  MobileNumber: string;
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
  FullAddress?: string;
}
export class RefreshTokenInfo {
  TokenExpiry: string;
  CreatedOn: string;
}

export class ClubAvantiDetails {
  ClubAvantiId: number;
  CurrentPoint: number;
  MemberShipType: string;
  PointNeeded: number;
}
