import { SearchRequestModel } from '../mixing-deck/search-request.model';

export class ConfigurationSettings{
  addReturnTabIndex: any;
  fare: any;
  fareReturn: any;
  totalFare:number;
  isReturnCase:boolean;
  isSingleReturnCase:boolean;
  isLogin:boolean = false;
  mixingDeckUrl: string;
  isAmendSearchOpen:boolean = false;
  customerFirstName: string;
  customerLastName: string;
  reviewBuyCache: string;
  basketCount:number = 0;
  fareBreakDownTotalFare:number = 0;
  ReservationCache: string;
  paymentResponse: PaymentResponse;
  isReturnLoaderCase:boolean = false;
  fareBreakDownTotalDiscount:number = 0;
  searchRequest: SearchRequestModel;
 }
