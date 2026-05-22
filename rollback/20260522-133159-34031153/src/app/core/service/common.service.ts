import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiRouteService } from '../constants/api-end-points';
import { HttpService } from './http.service';
import { SessionService } from 'src/app/core/service/session.service';
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private compareProductSubject = new Subject<any>();
  private removeComapreProductSubject = new Subject<any>();
  public bulkUploadData:any;

  constructor(private apiPath: ApiRouteService, private http: HttpService, private sessionService :SessionService) { }

  setBulkUploadData(data:any){
    this.bulkUploadData = data;
  }

  getBulkUploadData(){
    return this.bulkUploadData;
  }
  validateAPIResponse(response: any) {
    if (!response) {
      return false;
    }
    else if (!response.success ) {
     
      return false;
    }
    else if (response.success) {
      return true;
    }
    else if (response.ok) {
      return true;
    }
    return false;
  }

  stripslashes(str: any) {
    return (str + '').replace(/\\(.?)/g, function (_s, n1) {
      switch (n1) {
        case '\\':
          return '\\';
        case '0':
          return '\u0000';
        case '':
          return '';
        default:
          return n1;
      }
    });
  } 

  secondsToHms(d: any) {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);
    let hDisplay = h > 0 ? h : "00";
    let mDisplay = m > 0 ? m : "00";
    let sDisplay = s > 0 ? s : "00";
    return hDisplay + ':' + mDisplay + ':' + sDisplay;
  }

  sendCompareProduct(message: any) {
    this.compareProductSubject.next( message );
  }

  getComapreProduct(): Observable<any> {
      return this.compareProductSubject.asObservable();
  }
  sendRemoveProduct(message: any) {
    this.removeComapreProductSubject.next( message );
  }

  getRemoveProduct(): Observable<any> {
      return this.removeComapreProductSubject.asObservable();
  }
 
}
