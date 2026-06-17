import { Injectable } from '@angular/core';
import { ResponseData } from '../models/common/response.model';
import { AccountModelDetail} from '../models/account/account.model';
import { HttpClientService } from '../utility/http-client.service';
import { ApiRouteService } from '../utility/api-reference.service';

@Injectable({
  providedIn: 'root'
})
@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService) { }
  public trips: AccountModelDetail[];
  public seasons: AccountModelDetail[];
  filterOptions: any[];
  responsedata: ResponseData;

  updateAddress(customerInfoUpdateModel) {
    return this.httpClientService.HttpPostRequest(customerInfoUpdateModel, this.apiPath.updateAddress);
  }
  getCustomerDetails(_customerRequest) {
    return this.httpClientService.HttpPostRequest(null, this.apiPath.getCustomerDetails);
  }
  updatePersonalDetail(modifyPersonalDetailRequest){
    return this.httpClientService.HttpPostRequest(modifyPersonalDetailRequest, this.apiPath.updatePersonalDetail);
  }
  callChangePassword(changePasswordRequest){
    return this.httpClientService.HttpPostRequest(changePasswordRequest, this.apiPath.changePassword);
  }
  deleteAccount(_customerRequest){
    return this.httpClientService.HttpPostRequest(null, this.apiPath.deleteAccount);
  }
}
