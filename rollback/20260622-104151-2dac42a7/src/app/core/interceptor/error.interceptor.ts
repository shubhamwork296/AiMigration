import { Injectable } from '@angular/core'
import { HttpRequest, HttpHandler, HttpInterceptor, HttpErrorResponse } from '@angular/common/http'
import { catchError } from 'rxjs/operators';
import { ToastrManager } from 'ng6-toastr-notifications';
import { throwError } from 'rxjs';
import { SessionService } from 'src/app/core/service/session.service';
import { SessionKeys } from 'src/app/core/constants/session-keys';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import {  Router } from '@angular/router';
import { AppConstants } from '../constants/app-constants';
@Injectable(
    { providedIn: 'root' }
)
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private toastr : ToastrManager,private sessionService: SessionService,private broadcastService : BroadCasterService,private router : Router) { }

    intercept(request: HttpRequest<any>, next: HttpHandler) : any {
        return next.handle(request).pipe(
            catchError(err => {
                if(err?.status == '401'){
                   
                    setTimeout(() => {
                        this.sessionService.deleteSession(SessionKeys.User.ADMIN_CURRENT_USER);
                        this.sessionService.deleteSession("token");
                        this.sessionService.deleteSession("refreshToken");
                        this.broadcastService.broadcast('username', "");
                        this.broadcastService.broadcast("token", "");
                        this.broadcastService.broadcast("refreshToken", "");
                        this.broadcastService.broadcast("currency", "");
                        this.sessionService.clearSession();
                        this.router.navigate(["/admin/login"]);
                    }, 800);
                }

                if (err instanceof ErrorEvent) {
                    this.toastr.warningToastr(AppConstants.CLIENT_SIDE_ERROR + err?.error?.message, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    
                }

                if(err instanceof HttpErrorResponse)
                {
                    return throwError(err)
                }
                else{
                    return  throwError(() => AppConstants.TRY_AGAIN_LETER);
                }
              
            })
        )
    }

}