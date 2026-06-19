import { VoucherDetail } from '../payment-details/eVouchers-response.model';
import { PaymentDetailResponse } from '../payment-details/payment-details-response.model';
import { Address, CustomerAddress } from '../customer/customer-login-response.model';

export class PaymentVoucherDto {
    Vouchers: Vouchers;
    PaymentCards: BillingAgreement[];
    SmartCardDetails: SmartCardDetails[];
    Addresses :CustomerAddress[];
}

export class SmartCardDetails{
 SmartCardNumber: string;
 Owner:string;
 Status:string;
 Id : number;
 IsConfirm : boolean;
 OrderDate : Date;
 IsAlreadySelected:boolean;
 DOB : Date;
 Type:string;
 RecipientCustomerKey:string;
 SenderCustomerKey:string;
 IsAdult: boolean;
 passengerIndex: number;
}

export class Vouchers {
    Vouchers: VoucherDetail[];
    VoucherMessage: string;
}

export class BillingAgreement {
    billingAgreementId: string;
    maskedPan: string;
    businessCard:string;
    cardType: string;
    expirationMonth:number;
    expirationYear:number;
}

export class UpdatePaymentCardsDto
{
    CustomerKey:string;
    PaymentCards: BillingAgreement[];
}

export class SmartCardDto
{
    SmartCardNumber: string;
    IsUnlinkMySmartcard: boolean;
}

export class OrderSmartCard{
    Email: string;
    CustomerKey: string;
    IsAdult: boolean;
    DeliveryModeRequestDto: DeliveryDetail;
    GeneralInformation: GeneralInformation;
}

export class OrderSmartCardResponseDto
{
    IsSmartcardOrdered: boolean;
    ResponseMessage: string;
}
export class DeliveryDetail{
      Title: string;
      Name: string;
      Surname: string;
      Address: Address;
      CustomerKey: string;
}

export class GeneralInformation{
    Title: string;
    Name: string;
    Surname: string;
    SmartcardNickName: string;
    DateOfBirth: Date | string;
    LoadSation:string;
}


export class ConfirmSmartCardRequestDto
{
    Email: string;
    CustomerKey: string;
    NewSmartCard: string;
    OldSmartCard: string;
    LocationId: string;
}

export class MySmartCardsStatus
{
    SentRequests: SmartCardData[];
    RecievedRequests: SmartCardData[];
}

export class SmartCardData
{
    SmartCardNumber: string;
    CardOwnerCustomerKey: string;
    Owner: string;
    RequestDate: Date;
    Status: string;
    Id: number;
    Type: string;
}

export class TransferSmartCardRequestDto
{
    RecipientEmail: string;
    SenderCustomerKey: string;
    SmartCardNumber: string;
}

export class TransferSmartCardUserResponseDto
{
    IsSmartCardTransfered: boolean;
    ResponseMessage: string;
    IsSmartCardRejectedOrAccepted: boolean;
}

export class TransferSmartCardDto
{
    Email: string;
    CustomerKey: string;
    SmartCardNumber: string;
    IsAccepted: boolean;
}


export class LinkSmartCardDto
{
    SmartCardNumber: string;
    IsAccepted: boolean;
}

export class LinkSmartCardUserResponseDto
{
  IsSmartCardLinked:boolean;
  ResponseMessage:string;
}

export class RegisterSmartCardDto
{
    IsrnNumber: string;
    CustomerKey: string;
    Email: string;
    PostCode: string;
    FirstName: string;
    LastName: string;
    IsAdult: boolean;
}

export class ChangeReplaceSmartCardDto
{
    Email: string;
    CustomerKey: string;
    IsAdult: boolean;
    IsChange: boolean;
    IsReplace: boolean;
    SmartCardNumber: string;
    DeliveryModeRequestDto: DeliveryDetail;
    GeneralInformation: GeneralInformation;
}

export class ChangeReplaceResponseDto
{
    PaymentDetailResponse: PaymentDetailResponse;
    AdminFee: AdminFee;
    EvaluateCache: string;
}

export class AdminFee
{
    Amount: number;
    Currency: number;
}
