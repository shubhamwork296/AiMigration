import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class RoleMasterService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  addRole(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addRole);
    return this.http.post(url, data, true, false);
  }

  roleList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.roleList);
    return this.http.post(url, data, true, false);
  }

  roleListDropdown(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.roleListDropdown);
    return this.http.post(url, data, true, false);
  } 

  deleteRole(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.roleDelete);
    return this.http.post(url, data, true, false);
  } 

}
