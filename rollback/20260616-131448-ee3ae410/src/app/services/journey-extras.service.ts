import { Injectable } from '@angular/core';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';
import { CreateReservationRequest } from '../models/journey-extras/reservation.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { checkNameValidator, checkUserName} from '../utility/custom-validations/must-match-validation';

@Injectable({
  providedIn: 'root'
})
export class JourneyExtraService {
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService, private readonly formbulider: FormBuilder) { }
  seasonUserForm: FormGroup = this.formbulider.group({
    Title: [''],
    OtherTitle:[''],
    FirstName: ['', Validators.compose([
      Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)
    ])],
    LastName: ['', Validators.compose([
      Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)
    ])],
    PostCode: ['', Validators.compose([
      Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)
    ])],
    PhotoCardId: ['', Validators.compose([
      Validators.pattern('^[A-Z]{3}[0-9]{4}$')

      
    ])]
  }, 
  {
    validator: [checkNameValidator('FirstName'),checkNameValidator('LastName')]

  }
  );

  nreHandoffData(handOffDataRequest: any) {
    return this.httpClientService.HttpPostRequest(handOffDataRequest, this.apiPath.nreHandoffData);
  }
  getEvaluateResponse(evaluateTravelRequest: any) {
    return this.httpClientService.HttpPostRequest(evaluateTravelRequest, this.apiPath.evaluateRequestDetails);
  }
  getCojEvaluateResponse(evaluateTravelRequest: any) {
    return this.httpClientService.HttpPostRequest(evaluateTravelRequest, this.apiPath.CojevaluateRequestDetails);
  }
  fetchUpgradeEvaluate(evaluateTravelRequest: any) {
    return this.httpClientService.HttpPostRequest(evaluateTravelRequest, this.apiPath.UpgradeEvaluateRequestDetails);
  }

  PaymentprocessOrder(paymentRequest: any) {
    return this.httpClientService.HttpPostRequest(paymentRequest, this.apiPath.ProcessCojOrder);
  }

  postReservationData(createReservationRequest: CreateReservationRequest) {
    return this.httpClientService.HttpPostRequest(createReservationRequest, this.apiPath.createReservation);
  }
  initializeFormGroup() {
    this.seasonUserForm.get('PhotoCardId').markAsUntouched();
    this.seasonUserForm.setValue({
      Title: '',
      FirstName: '',
      LastName: '',
      PostCode: '',
      PhotoCardId: '',
      OtherTitle:''
    });
  }

  getCOJTravelExtras(evaluateTravelRequest: any) {
    return this.httpClientService.HttpPostRequest(evaluateTravelRequest, this.apiPath.GetCOJTravelExtra);
  }

  postQuickBuyServiceData(evaluateTravelRequest: any) {
    return this.httpClientService.HttpPostRequest(evaluateTravelRequest, this.apiPath.quickBuyService);
  }
}
