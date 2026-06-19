
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Injectable, Injector } from '@angular/core';
import { tap, retry, catchError } from 'rxjs/operators';
import { NotificationService } from '../toastr-notification/toastr-notification.service';
import { throwError } from 'rxjs';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { AppRouteEnum, CommonIconImg, LocalStorageKeyEnum, NotificationErrorMsg } from '../app-constants.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonServices } from 'src/app/services/common.service';
import { ApiRouteService } from '../api-reference.service';
import { StorageDataService } from 'src/app/services/storage-data.service';

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {
  notificationErrorMsg: NotificationErrorMsg;
  commonServices: CommonServices;
  _notificationservice: NotificationService;
  customerServiceService: CustomerServiceService;
  spinnerService: NgxSpinnerService;
  sharedService: SharedService;
  appRouteEnum: AppRouteEnum;
  commonIconImg: CommonIconImg;
  errorObject = {
    isThisClubAvantiTechnicalError: false,
    errorMessage: ''
  };
  apiPath: ApiRouteService;
  storageDataService: StorageDataService;
  localStorageKeyEnum: LocalStorageKeyEnum;

  constructor(private readonly router: Router, private readonly dialog: MatDialog, private readonly injector: Injector) {
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
    this.commonServices = this.injector.get(CommonServices);
    this._notificationservice = this.injector.get(NotificationService);
    this.customerServiceService = this.injector.get(CustomerServiceService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.sharedService = this.injector.get(SharedService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonIconImg = this.injector.get(CommonIconImg);
    this.apiPath = this.injector.get(ApiRouteService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(req).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          if(event.url.includes(environment.fortressapiUrl)){
            return event;
          }
          if (event.body.ResponseCode === 200 && event.body.data !== null) {
            this.errorObject.isThisClubAvantiTechnicalError = false;
            this.errorObject.errorMessage = '';
            this.commonServices.clubAvantiTechnicalError.next(this.errorObject);
            return event;
          }
          else if (req.url.includes(this.apiPath.getClubAvanti) || req.url.includes(this.apiPath.registerToClubAvanti) || req.url.includes(this.apiPath.getClubAvantiJourneyList)){
            this.errorObject.isThisClubAvantiTechnicalError = true;
            this.errorObject.errorMessage = event.body.ResponseMessage;
            this.commonServices.clubAvantiTechnicalError.next(this.errorObject);
          } else {
            this.setErrorMessage(event);
          }
        }
        return event;
      }),
      retry(1),
      catchError((error: HttpErrorResponse) => {
        if (error.status == 401) {
          this.Handle401s();         
        }
        else if(req.url.includes(this.apiPath.getClubAvanti) || req.url.includes(this.apiPath.registerToClubAvanti) || req.url.includes(this.apiPath.getClubAvantiJourneyList)){
          this.errorObject.isThisClubAvantiTechnicalError= true,
          this.errorObject.errorMessage= error.message;
          this.commonServices.clubAvantiTechnicalError.next(this.errorObject);
        } else{
          this.router.navigateByUrl(this.appRouteEnum.Page500, { skipLocationChange: true });
        }
        return throwError(error);
      })
    );
  }

  private Handle401s() {
    this.customerServiceService.logout('');
    this.sharedService.getBasketCount.emit(0);
    this.router.navigateByUrl(this.appRouteEnum.Login).then(() => {
      const dialogExist = this.dialog.getDialogById('unauthorized-common-notification-dialog');

      if (this.dialog.openDialogs && this.dialog.openDialogs.length > 0 && dialogExist){
        return;
      } else if (this.dialog.openDialogs && this.dialog.openDialogs.length > 0 ) {
        this.dialog.closeAll();
      }
      let unauthorizedMsgObj = {
        notificationErrorMsg: this.notificationErrorMsg.loginToContinueMessage,
        notificationTitle: this.notificationErrorMsg.unauthorizedTitle,
      }
      this.commonServices.commonNotificationDialog('unauthorized-common-notification-dialog', unauthorizedMsgObj, this.commonIconImg.minorDisruptionIconImg, false, false);
    });
    this.spinnerService.hide();
  }

  setErrorMessage(event) {
    this.spinnerService.hide();
    if (!this.router.url.includes(this.appRouteEnum.MixingDeck)) {
      if (event.body.ResponseCode === 204) {
        this._notificationservice.info(event.body.ResponseMessage);
      }
      else if (event.body.ResponseCode === 201 || event.body.ResponseCode === 49) {
        this._notificationservice.warn(event.body.ResponseMessage);
      }
      else if (event.body.ResponseCode === 202) {
        this._notificationservice.info(event.body.ResponseMessage);
      }
      else if (event.body.ResponseCode === 501 && event.body.data !== null) {
        // A useNewDesign condition has been implemented to disable toaster messages for the new design in case of 501
        let useNewDesign = this.storageDataService.getSessionStorageData(this.localStorageKeyEnum.newDesignJourneyBookingFlow, false) === 'true';
        if(!useNewDesign || (useNewDesign && (this.router.url.includes(this.appRouteEnum.myAccountPrefix) || !this.commonServices.checkIsSeasonInLocalStorage()))){
          this._notificationservice.error(event.body.ResponseMessage);
        }
      }
      else if (event.body.ResponseCode === 400 && event.body.data !== null) {
        this._notificationservice.error(event.body.Error);
      }
      else if (event.body.ResponseCode === 401) {
        this.Handle401s();
      }
      else if (event.body.ResponseCode === 500) {
        this.router.navigateByUrl(this.appRouteEnum.Page500, { skipLocationChange: true });
      }
    }
  }
}
