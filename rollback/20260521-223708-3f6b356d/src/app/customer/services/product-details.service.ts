import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../core/service/http.service';
import { ApiRouteService } from '../../core/constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';
import { HttpClient } from '@angular/common/http';
import { AttributeData, Product } from '../product-configurator-detail/configuration.model';
@Injectable({
  providedIn: 'root'
})

export class ProductDetailsService {


  constructor(private http: HttpService, private apiPath: ApiRouteService, private httpClient: HttpClient) { }

  getProductDetail(data: any): Observable<ResponseBaseModel<Product>> {
    let url = encodeURI(this.apiPath.productDetails);
    return this.http.post(url, data, true, false);
  }

  getProductBySku(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.getProductBySku);
    return this.http.post(url, data, true, false)
  }

  getProducPlanDetail(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.productPlanDetails);
    return this.http.post(url, data, true, false);
  }

  getAllAttributeList(data: any): Observable<ResponseBaseModel<AttributeData>> {
    let url = encodeURI(this.apiPath.productAttributeList);
    return this.http.post(url, data, true, false);
  }

  getProductForCompare(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.productCompare);
    return this.http.post(url, data, true, false);
  }

  getSimilarProducts(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.similarProducts);
    return this.http.post(url, data, true, false);
  }

  getProductDetailTest(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.productDetailTest);
    return this.http.post(url, data, true, false);
  }

  getMatchingBandDetailByProductId(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.matchingBandDetails);
    return this.http.post(url, data, true, false);
  }
  getProduct360ViewImages(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.get360Images);
    return this.http.post(url, data, true, false);
  }

  getSimilarProductCofigAttributeDetails(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.getSimilarCofigAttrDetails);
    return this.http.post(url, data, true, false);
  }

  addProductInCart(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addProductInCart);
    return this.http.post(url, data, true, false);
  }

}
