import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { AppRouteEnum } from '../app-constants.service';
import { ApiRouteService } from '../api-reference.service';
import { HttpClientService } from 'src/app/utility/http-client.service';
import { catchError, map } from "rxjs/operators";
import { CommonServices } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private readonly authenticationService: CustomerServiceService, private readonly appRouteEnum: AppRouteEnum,
        private readonly apiPath: ApiRouteService, private readonly commonService: CommonServices,
        private readonly httpClientService: HttpClientService, private readonly customerServiceService: CustomerServiceService) { }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return from(this.handleAccess(req, next)).pipe(
            map(resp => {
                return resp;
            }),
            catchError(err => {
                if (err != null && err.status != null && err.status == 401) {
                    return from(this.handleAccess(req, next))
                }
                if (err != null && err.status != null && err.status == 500 && err.url.indexOf("CustomerLogin") > 0) {
                    return from(this.handleAccess(req, next))
                }
                else {
                    console.log(err)
                }
            }));

    }


    private async handleAccess(request: HttpRequest<any>, next: HttpHandler):
        Promise<HttpEvent<any>> {
        if (!request.url.includes("Refresh")) {
            let res = await this.checkAuth(request);
            this.commonService.updateRefreshTokenAuthData(res);
        }
        const headerSettings: { [name: string]: string | string[]; } = {};

        headerSettings['Content-Type'] = 'application/json';

        if (localStorage.getItem('Email')) {
            headerSettings['useremail'] = localStorage.getItem('Email');
        }
        if (localStorage.getItem('CustomerKey')) {
            headerSettings['customerkey'] = localStorage.getItem('CustomerKey');
        }
        if (localStorage.getItem('UserName')) {
            headerSettings['username'] = localStorage.getItem('UserName');
        }
        if (localStorage.getItem('SokenId')) {
            headerSettings['sokenid'] = localStorage.getItem('SokenId');
        }

        headerSettings['clientstamp'] = environment.clientstamp;
        headerSettings['noncestamp'] = environment.noncestamp;

        const newHeader = new HttpHeaders(headerSettings);

        let changedRequest = request.clone({
            headers: newHeader
        });

        return next.handle(changedRequest).toPromise();
    }

    async checkAuth(_request): Promise<any> {

        let loginResStr = localStorage.getItem('customerLoginResponse');

        if (loginResStr) {
            let loginResObj = JSON.parse(loginResStr);

            if (loginResObj && loginResObj.Expiration) {
                let currentUkTime = new Date((new Date()).toLocaleString('en-US', { timeZone: 'Europe/London' }));
                let tokenExpiryTime = new Date(loginResObj.Expiration);
                return this.callRefreshTokenAPI(tokenExpiryTime, currentUkTime, loginResObj, loginResStr);
            }
        }
    }

    callRefreshTokenAPI(tokenExpiryTime, currentUkTime, loginResObj, loginResStr) {
        if (tokenExpiryTime > currentUkTime) {
            //good to go
            this.commonService.loaderRequired = true;
            let key = localStorage.getItem('CustomerKey');
            return this.httpClientService.HttpGetRequest(this.apiPath.CustomerRefresh + "?customerKey=" + key).toPromise();
        }
        else {
            if (loginResObj.Refresh && loginResObj.Refresh.TokenExpiry) {
                let refreshTokenExpiryTime = new Date(loginResObj.Refresh.TokenExpiry);
                if (refreshTokenExpiryTime > currentUkTime) {
                    let key = localStorage.getItem('CustomerKey');

                    if (loginResStr) {
                        return this.httpClientService.HttpGetRequest(this.apiPath.CustomerRefresh + "?customerKey=" + key).toPromise();
                    }
                } else {
                    this.customerServiceService.logout('');
                }
            } else {
                this.customerServiceService.logout('');
            }
        }
    }
}
