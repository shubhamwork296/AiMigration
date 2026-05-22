import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class DashboardService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  getCourseList(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.myCourse);
    return this.http.post(url, data, true, false);
  }

  getDashboardStatistics(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.dashboardStatistics);
    return this.http.post(url, data, true, false);
  }

}
