import { CustomerAddress } from '../payment-details/billing-address-response.model';

export class  CustomerDetailResponse{
    Title: string;
    FirstName: string;
    LastName: string;
    CustomerKey: string;
    Email: string;
    MobileNumber: string;
    DateOfBirth: string;
    Id: number;
    PhotoCardId: string;
    Addresses: CustomerAddress[]; 
    IsChangeEmailEnabled: boolean;
}
 

export class  PersonalDetails{
    Title: string;
    FirstName: string;
    LastName: string;
    Email: string;
    MobileNumber: string;
    DateOfBirth: string;
    PhotoCardId: string;
}

export class  ModifyPersonalDetailRequest{
    Title: string;
    FirstName: string;
    LastName: string;
    ExistingEmail: string;
    NewEmail: string;
    MobileNumber: string;
    DateOfBirth: string;
    PhotoCardId: string;
}

export class  ChangePasswordRequest{
    UserName: string;
    OldPassword: string;
    NewPassword: string;
}
export class  ChangePasswordResponse{
    IsPasswordChanged: boolean;
    ResponseMessage: string;
}

export class CustomerRequest {
    Email: string;
    CustomerKey: string;
}

export class ChangePersonalDetailsResponse {
    IsSuccess: boolean;
    ResponseMessage: string;
    DateOfBirth: string;
}


