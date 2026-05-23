import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class AttributeMasterService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  addAttribute(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addAttribute);
    return this.http.post(url, data, true, false);
  }
 
  attributeList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.attributeList);
    return this.http.post(url, data, true, false);
  }
  parentAttributeListDropdown(data:any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.parentAttributeListDropdown);
    return this.http.post(url, data, true, false);
  }

  attributeListDropdown(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.attributeListDropdown);
    return this.http.post(url, data, true, false);
  } 

  deleteAttribute(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.attributeDelete);
    return this.http.post(url, data, true, false);
  } 

  
  imageViewList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.imageViewList);
    return this.http.post(url, data, true, false);
  } 


  uploadFile(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.uploadFile);
    return this.http.post(url, data, false, false,null,false,true);
  }

  updateAttributeOrder(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.attributeOrder);
    return this.http.post(url, data, false, false,null,false,true);
  }
  
  deleteAttributeValue(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.attributeValueDelete);
    return this.http.post(url, data, true, false);
  } 
} 
