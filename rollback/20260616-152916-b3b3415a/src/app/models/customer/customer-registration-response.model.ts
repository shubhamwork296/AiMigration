export class CustomerRegisterResponse {
    CustomerKey : string;
    IsRegistered: boolean;
    IsEmailExist: boolean;
    consentrictoken:string;
    ConcentricUrl:string;
    ConcentricCitizenId:string;
    IsConcentricRegistered:boolean;
    CustomerEmail:string;
    CustomerPassword:string;
    ResponseMessage:string;
    EnrolledForLoyality: boolean;
    EnrolmentFailureMessage: string;
  }
