import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, throwError } from 'rxjs';
import { PaymentDetailRequest } from '../models/payment-details/payment-details-request.model';
import { ResponseData } from '../models/common/response.model';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';
import { SearchStateService } from './search-state.service';
import { EnhancedPaymentDetailResponse } from '../models/enhanced-payment-details/enhanced-payment-card-details-request.model';
import { LocalStorageKeyEnum } from '../utility/app-constants.service';
import { CommonServices } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class EnhancedPaymentApiDataService {
  searchStateService: SearchStateService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  commonServices: CommonServices;
  private readonly paymentDataSubject = new BehaviorSubject<any | null>(JSON.parse(localStorage.getItem('paymentData')));
  paymentData$ = this.paymentDataSubject.asObservable();

  constructor(private readonly injector: Injector, private readonly http: HttpClientService, private readonly apiPath: ApiRouteService) {
    this.searchStateService = this.injector.get(SearchStateService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.commonServices = this.injector.get(CommonServices);
   }

  fetchPaymentData(request: PaymentDetailRequest): Observable<EnhancedPaymentDetailResponse> {
    
    if (this.paymentDataSubject.value) {
      return of(this.paymentDataSubject.value);
    }

    return this.http.HttpPostRequest(request, this.apiPath.enhancedPaymentDetails).pipe(
      map((res: ResponseData) => {
        if (res?.ResponseCode == '200') {
          let data = res.Data as EnhancedPaymentDetailResponse;
          localStorage.setItem(this.localStorageKeyEnum.paymentData, JSON.stringify(data));
          this.paymentDataSubject.next(data); // cache update
          return data;
        } else {
          this.commonServices.showEnhancedCommonErrorPopup();
          throw new Error(res?.ResponseMessage || 'Payment details fetch failed');
        }
      }),
      catchError((err) => {
        console.error('Payment API error:', err);
        return throwError(() => err);
      })
    );
  }

   enhancedModifyAddress(customerInfoUpdateModel) {
    return this.http.HttpPostRequest(customerInfoUpdateModel, this.apiPath.enhancedReviewBuyModifyAddress);
  }

   EnhancedUpdatePaymentCards(updatePaymentCard: any) {
    return this.http.HttpPostRequest(updatePaymentCard, this.apiPath.enhancedUpdatePaymentCards);
  }

  enhancedInitiatePayment(paymentRequest:any) {
    return this.http.HttpPostRequest(paymentRequest, this.apiPath.enhancedPaymentInitiate);
  }

  clearData() {
    this.paymentDataSubject.next(null);
    localStorage.removeItem(this.localStorageKeyEnum.paymentData);
  }
}
