import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class UserRoleMappingService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  getPermissions(): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.getPermissions);
    return this.http.get(url, true, false);
  }

   
  addUserRole(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addUser);
    return this.http.post(url, data, true, false);
  }

  usersList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.getUsers);
    return this.http.post(url, data, true, false);
  }


  deleteUser(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.deleteUser);
    return this.http.post(url, data, true, false);
  } 
} 