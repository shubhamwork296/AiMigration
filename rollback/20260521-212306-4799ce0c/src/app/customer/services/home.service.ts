import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../core/service/http.service';
import { ApiRouteService } from '../../core/constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';
import { AttributeMapData } from '../product-configurator-detail/configuration.model';

@Injectable({
  providedIn: 'root'
})

export class HomeService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  getCategory(): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.showcategoryList);
    return this.http.get(url, true, false);
  }
  getCategoryList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.showcategoryList);
    return this.http.post(url, data, true, false);
  }

  fetchAttributeListSteps(data: any): Observable<ResponseBaseModel<AttributeMapData>> {
    let url = encodeURI(this.apiPath.showAttributeListSteps);
    return this.http.post(url, data, true, false);
  }
  getCustomerSettings(): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.customerSettings);
    return this.http.post(url, {}, true, false);
  }


}
