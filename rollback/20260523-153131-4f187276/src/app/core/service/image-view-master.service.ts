import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class ImageViewMasterService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  addImageView(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.addImageView);
    return this.http.post(url, data, true, false);
  }


  imageViewListDropdown(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.imageViewListDropdown);
    return this.http.post(url, data, true, false);
  }

  deleteImageView(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.imageViewDelete);
    return this.http.post(url, data, true, false);
  }
  ImageViewOrder(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.imageViewOrder);
    return this.http.post(url, data, true, false);
  }

}
