import { GeneralInformation, SmartCardDetails } from '../account/my-payment-vouchers.model';
import { DeliveryOption } from '../delivery-modes/delivery-modes.model';
import { LocationMasterData } from '../master/location-master.model';
import { Address, CustomerAddress} from '../payment-details/billing-address-response.model';

export class EnhancedDeliveryModeRequest {
  DeliveryCache :string;
  reviewBuyCache : string;
  DeliveryMode: string;
  DeliveryType: string;
  CollectStationId: number;
  ReservationCache:string;
  UserEmail:string;
  PreviousCache:string;
  isSeason:boolean;
  Address: Address;
  Name: string;
  Surname: string;
  Title: string;
  CustomerKey:string;
  IsNreBasket: boolean;
  SmartCardDelivery: EnhancedSmartCardInfo[];
  GeneralInformation: GeneralInformation;
  IsFlexi: boolean;
  journeyCreationDate : Date;
  IsAdult: boolean; //PICO-2150 added a property for check passanger added to smart card adult or child
  LatestJourneyCache: string;
}

export class EnhancedSmartCardInfo
{
  SmartCardNumber:string;
  SmartCardNumberText:string;
  SmartCardNumberSelectedOption:string;
  LocationId:string;
  LocationName:string;
  IsAdult:boolean;
  IsAddedSmartcard:boolean;
  IsLoadStationAvailable:boolean;
}

export class EnhancedDeliveryMode {
  TotalPrice:string;
  Currency:string;
  DeliveryCache :string;
  DeliveryMode: DeliveryOption[];
  CollectFromStation: LocationMasterData[];
  Addresses :CustomerAddress[];
  IsNreBasket: boolean;
  SmartCardLocation: LocationMasterData[];
  SmartCardDetails :SmartCardDetails[];
  IsOrderSmartCard:boolean;
  IsTvmAvailableForTod: boolean; //PICO-1741 added a property for TOD to display available TVM on delivery page
  IsSmartCardAvailable: boolean;
  IsDeliveryModesAvailable: boolean;
  IsGoldCardAvailable: boolean;
  XmlId: string;
}