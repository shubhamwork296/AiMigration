import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '../service/authentication.service';

@Injectable()
export class GuestGuard implements CanActivate {

    constructor(private router: Router, private authenticationService: AuthenticationService) { }

    canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
       
        if (this.authenticationService.isLoggedIn()) {
            // logged in so return true
            this.router.navigate(['/admin/dashboard']);
        }
        return true;
    }
}
