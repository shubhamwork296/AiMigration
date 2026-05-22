import { Component, OnInit, Injector } from '@angular/core';
import { SessionService } from 'src/app/core/service/session.service';
import { SessionKeys } from 'src/app/core/constants/session-keys';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/core/service/authentication.service';
import { CommonService } from 'src/app/core/service/common.service';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AppConstants } from 'src/app/core/constants/app-constants';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit{
  returnUrl!: string;
  submitted: boolean = false; 
  loginForm!: FormGroup;
  authenticationService!  : AuthenticationService
  commonService! : CommonService
  AppConstants : any  = AppConstants
  constructor(private sessionService : SessionService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private broadcastService: BroadCasterService,
    private toastr : ToastrManager,private injector : Injector) {
      this.authenticationService = injector.get<AuthenticationService>(AuthenticationService);
      this.commonService = injector.get<CommonService>(CommonService);
      this.loginForm = this.formBuilder.group({
        username: ['', Validators.required],
        password: ['', Validators.required],
      });
    
  }
 
  ngOnInit(): void {
    this.returnUrl = "";
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
  } 

    // convenience getter for easy access to form fields
    get f() { return this.loginForm.controls; }

    // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.loginForm.controls[controlName].hasError(errorName);
  }
  // on sign in button click
  onSubmit() {

    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
   
    this.authenticationService.login(this.loginForm.value)
      .subscribe(
        response => {
          if (this.commonService.validateAPIResponse(response)) {
            this.doLogin(response.data);
          }
          else {
            this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
            this.submitted = false;
          }
        } 
      )
  }

  // login
  doLogin(user: any) {
    this.sessionService.setSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS,user.modules)
    this.sessionService.setSession(SessionKeys.User.ADMIN_CURRENT_USER, user.userData);
    this.sessionService.setSession("token",user.token);
    this.sessionService.setSession("refreshToken", user.refreshToken);
    this.broadcastService.broadcast('username', this.createUserName(user));
    this.broadcastService.broadcast('token',user.token)
    this.broadcastService.broadcast("refreshToken", user.refreshToken);
    if (this.returnUrl) {
      this.router.navigate([this.returnUrl]);
    }
    else {
      this.router.navigate(["/admin/dashboard"]);
    }
  }

  createUserName(user : any)
  {
    if(user.userData?.FirstName || user.userData?.LastName)
    {
      let FirstName = user.userData?.FirstName;
      let LastName = ' '
      if(user.userData?.LastName)
      {
        LastName += user.userData?.LastName
      }

      return FirstName+LastName
    }
  }

}
