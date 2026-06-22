// loader.interceptors.ts
import { Injectable } from '@angular/core';
import {
    HttpResponse,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoaderService } from '../service/loader.service';
import { SessionService } from 'src/app/core/service/session.service';
import { SessionKeys } from 'src/app/core/constants/session-keys';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import {  Router } from '@angular/router';
import { CommonService } from 'src/app/core/service/common.service';
@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
    private requests: HttpRequest<any>[] = [];

    constructor(private loaderService: LoaderService,private sessionService :SessionService,private broadcastService: BroadCasterService,private router :Router,private commonService : CommonService) { }

    removeRequest(req: HttpRequest<any>) {
        const i = this.requests.indexOf(req);
        if (i >= 0) {
            this.requests.splice(i, 1);
        }
     
        if(req.url.split('/')[req.url.split('/')?.length-1] !== 'threeSixtyViewImages' && req.url.split('/')[req.url.split('/')?.length-1] !== 'similar' && req.url.split('/')[req.url.split('/')?.length-1] !== 'matchingBands'  && req.url.split('/')[req.url.split('/')?.length-2] !== 'category')
        {
            if(req.url.split('/')[req.url.split('/')?.length-1] !== 'cartProduct'){ 
              this.loaderService.isLoading.next(this.requests.length > 0);
            }
        }
        else{    
            this.loaderService.isLoading.next(false);
        }
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.requests.push(req);
        if(req.url.split('/')[req.url.split('/')?.length-1] !== 'threeSixtyViewImages' && req.url.split('/')[req.url.split('/')?.length-1] !== 'similar'&& req.url.split('/')[req.url.split('/')?.length-1] !== 'matchingBands'  && req.url.split('/')[req.url.split('/')?.length-2] !== 'category')
        {
        this.loaderService.isLoading.next(true);
        }
        else{
            this.loaderService.isLoading.next(false);
        }
        return Observable.create((observer: any) => {
            const subscription = next.handle(req)
                .subscribe(
                    event => {
                        if (event instanceof HttpResponse) {
                            this.removeRequest(req);
                            observer.next(event);
                        }
                    },
                    err => {
                        if(err.status == 401 || err.status == 403)
                        {                        
                            this.sessionService.deleteSession(SessionKeys.User.ADMIN_CURRENT_USER);
                            this.sessionService.deleteSession("token");
                            this.sessionService.deleteSession("refreshToken");
                            this.broadcastService.broadcast('username', "");
                            this.broadcastService.broadcast("token", "");
                            this.broadcastService.broadcast("refreshToken", "");
                            this.broadcastService.broadcast("currency", "");
                            this.sessionService.clearSession();
                            this.router.navigate(["/admin/login"]);
                        }
                        this.removeRequest(req);
                        observer.error(err);
                    },
                    () => {
                        this.removeRequest(req);
                        observer.complete();
                    });
            // remove request from queue when cancelled
            return () => {
                this.removeRequest(req);
                subscription.unsubscribe();
            };
        });
    }
}
