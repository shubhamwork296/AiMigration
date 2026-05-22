import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class ArticleMasterService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  addArticle(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addArticle);
    return this.http.post(url, data, true, false);
  }

  articleList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.articleList);
    return this.http.post(url, data, true, false);
  }

  articleListDropdown(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.articleListDropdown);
    return this.http.post(url, data, true, false);
  } 

  deleteArticle(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.articleDelete);
    return this.http.post(url, data, true, false);
  } 

}
