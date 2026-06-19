export class CustomerSendMailRequst
{
    UserEmail:string;
}

export class ChangeEmailRequest {
    ProspectId: string;
    CustomerKey: string;
    CurrentEmail: string;
    Password: string;
    NewEmail: string;
}

export class CustomerResetEmailResponse {
    IsEmailChangeVerificationMailSent: boolean;
    IsEmailChanged: boolean;
    IsInvalidCredentials: boolean;
    ResponseMessage: string;
    IsOldPasswordUpdatedWithNewUser: boolean;
    InfoMessage: string;
}
