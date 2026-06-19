export class CustomerResetPasswordRequst {
    IdToken: string;
    Token: string;
    NewPassword: string;
}

export class CustomerForgotPasswordResponse {
    ResponseMessage: string;
}

export class CustomerResetPasswordResponse {
    IsPasswordReset: boolean;
    ResponseMessage: string;
}
