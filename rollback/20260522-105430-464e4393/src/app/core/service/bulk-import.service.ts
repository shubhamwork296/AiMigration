import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiRouteService } from '../constants/api-end-points';
import { ResponseBaseModel } from 'src/app/shared/models/response-base-model';

@Injectable({
  providedIn: 'root'
})

export class BulkImportService {
  constructor(private http: HttpService, private apiPath: ApiRouteService) { }

  bulkImportValidation(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.bulkUploadValidation);
    return this.http.post(url, data, true, false);
  }

  saveBulkImport(data: any): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.saveBulkUpload);
    return this.http.post(url, data, true, false);
  }

  importFormatExcel(): Observable<ResponseBaseModel<any[]>> {
    let url = encodeURI(this.apiPath.importFormatExcel);
    return this.http.get(url, true, false);
  }

}
