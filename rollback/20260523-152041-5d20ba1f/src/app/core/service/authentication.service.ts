import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { SessionKeys } from '../constants/session-keys';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';
import { UserModel } from 'src/app/shared/models/user';
import { SessionService } from './session.service';
import { ApiRouteService } from '../constants/api-end-points';
import { AppConstants } from '../constants/app-constants';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private http: HttpService, private sessionService: SessionService,
    private apiPath: ApiRouteService) { }

  login(data: any): Observable<any> {
    return this.http.authPost(this.apiPath.login, data, true, false)
      .pipe(map(response => {
        let respModel = {} as ResponseBaseModel<any>;
        if (response.type == "success") {
          respModel.success = true;
          respModel.error = '';
          respModel.data = response.data
        }
        else if(response.type == 'error')
        {
          respModel.success = false;
          respModel.error = response?.data?.errorType
          respModel.message = response.message;
        }
        else {
          if(response.message == 'Common.Errors.NotConnect')
          { 
            respModel.success = false;
            respModel.error = '';
            respModel.message = AppConstants.SOMETING_WRONG;
          }
          else{
            respModel.success = false;
            respModel.error = '';
            respModel.message = response.message;
          }
         
        }
        return respModel;
      }));
  }

  //method to get current logged in user
  getLoggedInUser(): UserModel {
    let user = this.sessionService.getSession(SessionKeys.User.ADMIN_CURRENT_USER);
    return user ?? null;
  }

  getLoggedInFrontUser(): UserModel {
    let user = this.sessionService.getSession(SessionKeys.User.CURRENT_USER);
    return user ?? null;
  }

  isLoggedIn() {
    if (this.getLoggedInUser()) {
      return true;
    }
    return false;
  }
  
  isUserLggedIn()
  {
    if (this.getLoggedInFrontUser()) {
      return true;
    }
    return false;
  }
  register(data: any): Observable<any> {
    return this.postRequest(this.apiPath.register,data)
  }

  

  forgot(data: any): Observable<any> {
    return this.postRequest(this.apiPath.forgotPassword,data)
  }

  resetPass(data: any): Observable<any> {
    return this.postRequest(this.apiPath.resetPassword,data)
  }


  postRequest(apiPath : any,data : any)
  {
    return this.http.post(apiPath, data, true, false)
    .pipe(map((response : any) => {
      
      let respModel = {} as ResponseBaseModel<any>;
      if (response.type == "success") {
        respModel.success = true;
      }
      else {
        respModel.success = false;
        respModel.message = response.error ?? response.message ?? "Please check your email & username to proceed.";
      }
      return response;
    }))
  }


  
}
