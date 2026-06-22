import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class ProductService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  addProduct(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addProduct);
    return this.http.post(url, data, false, false, null, false, true);
  }

  getCountryList() {
    let url = encodeURI(this.apiPath.countryList);
    return this.http.get(url, true, false);
  }

  productList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.prouductList);
    return this.http.post(url, data, true, false);
  }

  productListDropdown(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.productListDropdown);
    return this.http.post(url, data, true, false);
  }

  deleteProduct(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.productDelete);
    return this.http.post(url, data, true, false);
  }

  copyProduct(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.copyProduct);
    return this.http.post(url, data, true, false);
  }

  verifyProduct(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.verifyProduct);
    return this.http.post(url, data, true, false);
  }
}
