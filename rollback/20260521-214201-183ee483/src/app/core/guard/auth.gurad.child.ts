import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot,CanActivateChild } from '@angular/router';
import { SessionService } from '../service/session.service';
import { AuthenticationService } from '../service/authentication.service';
import { SessionKeys } from '../constants/session-keys';
import { SettingService } from '../service/setting.service';
import { AppConstants } from '../constants/app-constants';
@Injectable()
export class AuthGuardChild implements CanActivateChild {

    constructor(private sessionService: SessionService, private router: Router, private authenticationService: AuthenticationService,private settingService : SettingService) { }
    canActivateChild(route: ActivatedRouteSnapshot): boolean {
        let loggedInUser = this.authenticationService.isLoggedIn();
        if (loggedInUser) {
            let modules = this.sessionService.getSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS) || [];
            let routeData = this.parseRouteData(route);
            let allowedModules =  AppConstants.checkModulePermissions(routeData,modules); 
            return this.checkPermissionAllowed(routeData,allowedModules)
        } 
        else {
            return this.removeCurrentSession()
        }
    }
    parseRouteData(route: ActivatedRouteSnapshot) {
        let arr = [];
       
        for (let key in route.data.data) {
            if (route.data.data.hasOwnProperty(key)) {
                arr.push(route.data.data[key]);
            }
        }
        
        return arr;
    }

    removeCurrentSession()
    {
        this.settingService.removeSession();
        this.router.navigate(['/admin/login']);
        return false;
    }

    checkPermissionAllowed(routeData : any,allowedModules : any){
        if (routeData.length == 0 || (allowedModules && allowedModules.length > 0)) {
            return true;
        }
        else {
            return this.removeCurrentSession()
        }
    }
}
