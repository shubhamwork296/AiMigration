import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BroadCasterService } from '../service/broad-caster.service';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../service/authentication.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router, private authenticationService: AuthenticationService,private broadCastService : BroadCasterService) {
  }

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authenticationService.isLoggedIn()) {
      
        if(route.data.role =='ROLE_USER')
        {
            this.router.navigate(['admin/dashboard'])
            return false;
        }
        return true;
    }
    
    return true;
  }
}