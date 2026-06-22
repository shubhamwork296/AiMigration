import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';
import { SessionKeys } from 'src/app/core/constants/session-keys';
import { SessionService } from 'src/app/core/service/session.service';
import { Router } from '@angular/router';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
@Injectable({
  providedIn: 'root'
})

export class SettingService {
  constructor(private http: HttpService, private apiPath: ApiRouteService,private sessionService : SessionService,private broadcastService : BroadCasterService,private router : Router) { }

  addCurrency(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.currencyAddSetting);
    return this.http.post(url, data, false, false,null,false,true);
  }

  
  currencyList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.currencySettingList);
    return this.http.post(url, data, true, false);
  }

  changePassword(data : any) : Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.changePassword);
    return this.http.post(url, data, true, false);
  }

  getUserProfile(data : any) : Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.getUserProfile);
    return this.http.post(url, data, true, false);
  }

  updateProfile(data : any) : Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.profileUpdate);
    return this.http.post(url, data, true, false);
  }

  deletePrice(data: any) : Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.deletePrice);
    return this.http.post(url, data, true, false);
  }

  logout() {
    this.removeSession()
    this.router.navigate(["/admin/login"]); 
  }

  removeSession(){
    this.sessionService.deleteSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS)
    this.sessionService.deleteSession(SessionKeys.User.ADMIN_CURRENT_USER);
    this.sessionService.deleteSession("token");
    this.sessionService.deleteSession("refreshToken");
    this.broadcastService.broadcast('username', "");
    this.broadcastService.broadcast("token", "");
    this.broadcastService.broadcast("refreshToken", "");
    this.broadcastService.broadcast("currency", "");
    this.sessionService.clearSession();
  }
} 
