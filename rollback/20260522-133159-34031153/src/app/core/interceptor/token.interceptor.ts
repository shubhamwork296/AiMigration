import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionService } from '../service/session.service';
import { BroadCasterService } from '../service/broad-caster.service';

@Injectable({ providedIn: 'root' })
export class TokenInterceptor implements HttpInterceptor {

    token: any
    clientToken : any
    constructor(private sessionService: SessionService, private broadcastService: BroadCasterService
    ) {
        this.token = this.sessionService.getSession("token");
         
        this.broadcastService.on('token').subscribe(cic => {
            this.token = String(cic);
        });

        this.broadcastService.on('client_token').subscribe(token=>{
            this.clientToken = String(token)
        })
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // add authorization header with token/user key if available
        let isLogin  = request.url.indexOf('/login') > -1;
        let isCart  = request.url.indexOf('/cubix/cartproduct/post') > -1;
        if (!isLogin) {
            request = request.clone({
                setHeaders: {
                    Authorization:this.token ?  `Bearer ${this.token}` : '',
                }
            });
        }
        
        if(isCart)
        {
            request = request.clone({
                setHeaders: {
                    Authorization:this.clientToken ?  `Bearer ${this.clientToken}` : '',
                }
            });
        }
        return next.handle(request);
    }
}