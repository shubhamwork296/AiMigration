import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class CategoryMasterService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  addCategory(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addCategory);
    return this.http.post(url, data, false, false,null,false,true);
  }

  categoryList(data : any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.categoryList);
    return this.http.post(url, data, true, false);
  }

  categoryListDropdown(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.categoryListDropdown);
    return this.http.post(url, data, true, false);
  }

  deleteCategory(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.categoryDelete);
    return this.http.post(url, data, true, false);
  } 
}
