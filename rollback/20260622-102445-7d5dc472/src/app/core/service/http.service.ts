import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, flatMap, map, switchMap } from 'rxjs/operators';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({ providedIn: 'root' })

export class HttpService {
  httpOptions: any;
  appSettings: any;
  configUrl: string = 'assets/config.json';
  apiEndPoint: string = '';

  constructor(private http: HttpClient) {
    this.httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json'})
    };
  }

  get(url: string, __showLoader = false, isAuthRequest = false, isBlob = false): Observable<any> {
    let options = { ...this.httpOptions };
    if (isBlob) {
      options = {
        responseType: 'blob' as 'json'
      }
    }
    return this.getConfig()
      .pipe(flatMap(appSettings => {
        //get full endpoint to post data
        this.appSettings = appSettings;
        this.setAPIEndPointURL(url, isAuthRequest);
        return this.http.get(this.apiEndPoint + url, options)
          .pipe(switchMap((resp) => {
            return of(resp)
          }),
            catchError((error : HttpErrorResponse) => {
              return of(this.handleError(error));
            })
          );
      }))
  }

  getResourceUrl(url: string, _showLoader = false, _isAuthRequest = false, isBlob = false): Observable<any> {
    let options = { ...this.httpOptions };
    if (isBlob) {
      options = {
        responseType: 'blob' as 'json'
      }
    }
    return this.http.get(url, options)
    .pipe(switchMap((resp) => {
      return of(resp)
    }),
      catchError((error : HttpErrorResponse) => {
        return of(this.handleError(error));
      })
    );
  }

  post(url: string, data: any, _showLoader = false, isAuthRequest = false, customHttpOptions: any = null, isBlob = false, hasFile = false): Observable<any> {
    return this.getConfig()
      .pipe(flatMap(appSettings => {
        let options = { ...this.httpOptions };
    
        
        if (isAuthRequest) {
          options = {
            headers: new HttpHeaders({
              'Content-Type': 'application/x-www-form-urlencoded'
            })
            , ...customHttpOptions
          };
        }

        options.observe = 'response';
        if (isBlob) {
          options.responseType = 'blob' as 'json'
        }
        if (hasFile) {
          options = new HttpHeaders({ "Content-Type": "multipart/form-data" })
        }
        //get full endpoint to post data
        this.appSettings = appSettings;
        this.setAPIEndPointURL(url, isAuthRequest);
        //show loader
        return this.http.post<any>(this.apiEndPoint + url, data, options)
          .pipe(switchMap((res: any) => { 
            //hide loader
            return of(res.body ?res.body : res);
          }),
            catchError((error : HttpErrorResponse) => {
              return of(this.handleError(error));
            }));
      }))
  }

  put(url: string, data: any, _showLoader = false, isAuthRequest = false, customHttpOptions: any = null, isBlob = false, hasFile = false): Observable<any> {
    return this.getConfig()
      .pipe(flatMap(appSettings => {
        let options = { ...this.httpOptions, ...customHttpOptions };
        options.observe = 'response';
        if (isBlob) {
          options.responseType = 'blob' as 'json'
        }
        if (hasFile) {
          options = new HttpHeaders({ "Content-Type": "multipart/form-data" })
        }
        this.appSettings = appSettings;
        this.setAPIEndPointURL(url, isAuthRequest);
        //show loader
        return this.http.put<any>(this.apiEndPoint + url, data, options)
          .pipe(map(value => {
            //hide loader
            return value;
          }),
            catchError((error : HttpErrorResponse) => {
              return of(this.handleError(error));
            }));
      }))
  }

  authPost(url: string, data: any, _showLoader = false, customHttpOptions: any = null): Observable<any> {
    return this.getConfig()
      .pipe(flatMap(appSettings => {
        let options = {
          headers: new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
          }), ...customHttpOptions
        };
        let params = new HttpParams({
          fromObject: { ...data }
        });
        options.observe = 'response' as 'body';
        //get full endpoint to post data
        this.appSettings = appSettings;
        this.setAPIEndPointURL(url, false);
        //show loader

        return this.http.post<any>(this.apiEndPoint + url, params, options)
          .pipe(switchMap((resp: any) => {
            //hide loader
            return of(resp.body)
          }),
            catchError((error : HttpErrorResponse) => {
              return of(this.handleError(error));
            }));
      }))
  }

  setAPIEndPointURL(_url: string, isAuthRequest: boolean) {
    this.apiEndPoint = isAuthRequest ? this.appSettings.baseUrl : this.appSettings.baseUrl + this.appSettings.apiBaseUrl;
  }

  handleError(error: HttpErrorResponse) {
    let respModel = {} as ResponseBaseModel<any>;
    respModel.success = false;
    respModel.message = this.getErrorMessage(error);
    return respModel;
  }

  public getErrorMessage(error: HttpErrorResponse) {
    let msg: string = '',
      errorURL = error?.url ?? "";
    // add custom message
    if (!msg) {
      switch (error.status) {
        case 500:
          msg = "Common.Errors.InternalServerError";//"Internal Server Error";
          break;
        case 404:
          msg = error?.error?.error ?? error?.error ?? "Common.Errors.NotFound";//"Not Found";
          break;
        case 403:
          if (errorURL.indexOf('usr/login') > -1) {
            if (error.error == "DEACTIVATED") msg = "Common.Errors.AccountDeactivated";
            else if (error.error == "LOCKED_OUT") msg = "Common.Errors.LockOut";
            else
              msg = "Common.Errors.InvalidLoginDetails";//"Login failed, check the username, password and case letters.";
          }
          break;
        case 401:
          msg = "Common.Errors.UnauthorizedUser";
          break;
        case 400:
          msg = error?.error?.error ?? error?.error ?? "Common.Errors.NotConnect";
          break;
        case undefined:
          msg =  'Common.Errors.SomeThingWentWrong';
          break;
        case null:
          msg =  'Common.Errors.SomeThingWentWrong';
          break;
        default:
          msg = "Common.Errors.NotConnect";
      }
    }
   
    return msg;
  }

  getConfig(): Observable<any> {
    if (this.appSettings) {
      return of(this.appSettings);
    }
    else {
      return this.http.get(this.configUrl)//.catch(this.handleError);
    }
  }

  //delete request 
  delete(url: string, _data: any, _showLoader = false, isAuthRequest = false, customHttpOptions: any = null, isBlob = false, hasFile = false): Observable<any> {
    return this.getConfig()
      .pipe(flatMap(appSettings => {
        let options = { ...this.httpOptions, ...customHttpOptions };
      
        options.observe = 'response';
        if (isBlob) {
          options.responseType = 'blob' as 'json'
        }
        if (hasFile) {
          options = new HttpHeaders({ "Content-Type": "multipart/form-data" })
        }
        //get full endpoint to post data
        this.appSettings = appSettings;
        this.setAPIEndPointURL(url, isAuthRequest);
        //show loader

        return this.http.delete<any>(this.apiEndPoint + url, options)
          .pipe(map(value => {
            //hide loader

            return value;
          }),
            catchError((error : HttpErrorResponse) => {
              return of(this.handleError(error));
            }));
      }))
  }

  //post api request
  userPost(url: string, data: any) {
    return this.http.post(this.apiEndPoint + url, data);
  }
  userPut(url: string, data: any) {
    return this.http.put(this.apiEndPoint + url, data);
  }

  getversion(): Observable<any> {
    if (this.appSettings) {
      return of(this.appSettings);
    } else {
      return this.http.get("/assets/config.json");
    }
  }
}