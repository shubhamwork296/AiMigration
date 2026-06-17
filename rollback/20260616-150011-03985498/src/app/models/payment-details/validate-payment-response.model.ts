import { JourneyDetail } from '../review-buy/review-buy-model';
import { CustomerAddress } from './payment-details-response.model';

export class ValidatePaymentResponse {
    OrderStatus: string;
    ReferenceNumber: string;
    JourneyReferenceNumber: string;
    PaymentRecords: Payment[];
    Journey: JourneyDetail[];
    PaymentStatus: string;
    StatusMessage: string;
    EvoucherCode: string;
    // coj param
    TravelId: number;
    TravelSolutionId: number;
    OrderId: number;
    IsSuccess: boolean;
    // coj param
    Addresses: CustomerAddress;
    PaymentDetailsWithModeList: string[];
}

export class SmartCardValidateResponse {
    OrderStatus: string;
    IsSuccess: boolean;
    PaymentStatus: string;
    StatusMessage: string;
}

export class Payment {
    PaymentMode: string;
    Price: number;
    Currency: string;
    CardNumber: string;
}

// Start PICO-1171 for fortress Integration
export class FortressValidateRequest {
    id: string;
    transactionIdentifier: string;
    clubId: number;
    total: number;
    produts: Array<Products> = [];
}

export class Products {
    productName: string;
    productPrice: string;
    productQuantity: string;
    productSKU: string;
    brand: string;
    category: string;
    category1: string;
    variant: string;
    metric1: string;
    metric2: string;
    metric3: string;
    dimension1: string;
    dimension2: string;
    dimension3: string;
    dimension4: string;
    dimension5: string;
    dimension6: string;
    dimension7: string;
}
//End

export class DataLayerTransactionType {
    item_name: string | undefined;
    item_id: string | undefined;
    price: number | undefined;
    quantity: number | undefined;
    discount: string | undefined;
    item_brand: string | undefined;
    item_category: string | undefined;
    item_category2: string | undefined;
    item_category3: string | undefined;
    item_category4: string | undefined;
    item_category5: string | undefined;
    item_variant: string | undefined;
    item_list_name: string | undefined;
    item_list_id: number | undefined;
    index: number | undefined;
    origin: string | undefined;
    destination: string | undefined;
    start_date: string | undefined;
    end_date: string | undefined;
    duration: string | undefined;
    ticket_class: string | undefined;
    ticket_type: string | undefined;
    ticket_route_code: string | undefined;
    ticket_type_code: string | undefined;
    type: string | undefined;
    single_or_return: string | undefined;
    number_of_changes: number | undefined;
    additional_information: string | undefined;
    days_in_advance: number | undefined;
    railcard_code: string | undefined;
    railcard_used: boolean | undefined;
    adult_pax: number | undefined;
    child_pax: number | undefined;
    total_pax: number | undefined;
    start_time: string | undefined;
    end_time: string | undefined;
    operator: string | undefined;
    travel_extras: string | undefined;
    discount_type: string | undefined;
    delivery_method: string | undefined;
    upsell_taken : string | undefined;
    upsell_item : string | undefined;
    booking_reference : string | undefined;
    feature : string | undefined;
    payment_type : string | undefined;
    column_index: number | undefined;
    available_classes: string | undefined = undefined;
    coach: string | undefined;
    seat_number: string | undefined;
    seat_position: string | undefined;
    seat_direction: string | undefined;
    seat_preferences: string | undefined;
    status: string | undefined;
    delivery_option: string | undefined;
    shipping: string | undefined;
    coupon: string | undefined;
    search_source: string | undefined;
  }

// start PassengerAssist Details information
export class PassengerAssistRequest {
    PassengerDetail: PassengerDetail;
    OutwardJourneyDetails: PassengerJourneyDetails;
    ReturnJourneyDetails: PassengerJourneyDetails;
    BookingReference: string;
    Companion: string;
    ReturnJourney: string;
}

export class PassengerDetail {
    Title: string;
    FirstName: string;
    LastName: string;
    AddressLine1: string;
    AddressLine2: string;
    City: string;
    Country: string;
    Postcode: string;
    Email: string;
    ContactNumber: string;
}

export class PassengerJourneyDetails {
    Origin: string;
    Destination: string;
    DepartureDate: string;
    DepartureTime: string;
    Via: string;
    ReservationDetails: PassengerReservationDetails;
}

export class PassengerReservationDetails {
    CoachNumber: string;
    SeatNumber: string;
}

export class PassengerAssistResponse {
    ResponseStatus: string;
    URL: string;
    ErrorMessage: string;
}

// End
export class DataLayerRefundType extends DataLayerTransactionType {
    refund_date: string | undefined;
    refund_type: string | undefined;
    refund_item: string | undefined;
    refund_selected: string | undefined;
    fulfillment_type: string | undefined;
    payment_type: string | undefined;
}
