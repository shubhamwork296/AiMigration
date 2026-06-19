
export class BillingDetailsResponse {
  Addresses: CustomerAddress[];
  Email: string;
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
