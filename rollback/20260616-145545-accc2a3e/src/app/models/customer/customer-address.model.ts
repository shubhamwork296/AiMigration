import { CustomerAddress } from '../payment-details/billing-address-response.model';

export class CustomerInfoUpdate {
    Email: string;
    Addresses: CustomerAddress[];
  }
