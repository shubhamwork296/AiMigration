import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs';
import { AuthenticationService } from '../service/authentication.service';
import { SettingService } from '../service/setting.service';
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authenticationService: AuthenticationService,private settingService : SettingService) {
  }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authenticationService.isLoggedIn()) {
      // logged in so return true
      if (state.url.includes('/admin/login')) {
        this.router.navigate(['admin/mydashboard']);
        return true;
      }
      return true;
    }
    else{
      this.settingService.removeSession();
      this.router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
      return false;  
    }
  }
}