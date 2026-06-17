import { Address } from './customer-login-response.model';

export class CustomerRegisterRequest {
    Title: string;
    FirstName: string;
    LastName: string;
    Email: string;
    Mobile:string;
    Password: string;
    DateOfBirth: string;
    Address: Address;
    EnrolForLoyality: boolean;
}

export class DataLayerClubAvantiType {
    action: string | undefined;
    feature: string | undefined;
    message: string | undefined;
}
