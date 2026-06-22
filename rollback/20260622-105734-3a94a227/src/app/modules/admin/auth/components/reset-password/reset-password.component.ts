import { Component, OnInit } from '@angular/core';
import  { AppConstants } from '../../../../../core/constants/app-constants'
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AuthenticationService } from 'src/app/core/service/authentication.service';
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  RestPasswordForm! : FormGroup;
  submitted = false;
  verifyString : any = ''
  id : any = 0
  tid : any = 0
  token : any = 0
  is_password_match : boolean = false;
  AppConstants : any = AppConstants
  constructor(private router : Router,private formBuilder : FormBuilder,private authenticationService : AuthenticationService,protected toastr : ToastrManager) {
    this.verifyString = this.router.url.split('admin/reset-password/')[1].split('/');
    this.id = this.verifyString[0]
    this.tid = this.verifyString[1]
    this.token = this.verifyString[2]
    if((this.verifyString == null || this.verifyString == '' || this.verifyString == undefined) || (this.id == null || this.id == '' || this.id == undefined) || (this.tid == null || this.tid == '' || this.tid == undefined) || (this.token == null || this.token == '' || this.token == undefined))
    {
      this.router.navigate(['/admin/login'])
    }
   }

  ngOnInit(): void {
    

    let request = {
      "id": this.id,
      "tid": this.tid,
      "token": this.token,
      "type": AppConstants.RESET_PASSWORD_PRE,
      "password": ""
    }
    
    this.updateResetPassword(request)

    this.RestPasswordForm = this.formBuilder.group({ 
      password: ['', [Validators.required,Validators.minLength(8),Validators.pattern(AppConstants.PASSWORD_VALIDATOR)]],
      confirm_password: ['', [Validators.required,Validators.minLength(8),Validators.pattern(AppConstants.PASSWORD_VALIDATOR)]],
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.RestPasswordForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.RestPasswordForm.controls[controlName].hasError(errorName);
  }

  onSubmit() {

    this.submitted = true;
    this.is_password_match = false;
    if (this.RestPasswordForm.invalid) { 
      return;
    }
    this.RestPasswordForm.controls['password']?.setValue(this.RestPasswordForm.get('password')?.value?.trim());
    this.RestPasswordForm.controls['confirm_password']?.setValue(this.RestPasswordForm.get('confirm_password')?.value?.trim());

    if(this.RestPasswordForm.get('password')?.value == this.RestPasswordForm.get('confirm_password')?.value)
    {
      this.is_password_match = false;
    }
    else 
    {
      this.is_password_match = true;
    }

    if(this.is_password_match)
    {
      return
    }

    let request = {
      "id": this.id,
      "tid": this.tid,
      "token": this.token,
      "type": AppConstants.RESET_PASSWORD_POST,
      "password": this.RestPasswordForm.get('confirm_password')?.value
    }

    this.authenticationService.resetPass(request).subscribe(response=>{
      if(response && response.type == AppConstants.success)
      {
        this.submitted = false;
        this.toastr.successToastr(AppConstants.PASSWORD_UPDATE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/login'])
      }
      else
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }
  
  updateResetPassword(data : any)
  {
    this.authenticationService.resetPass(data).subscribe(response=>{
      if(response && response.type == AppConstants.success)
      {
        return;
      }
      else
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/login'])
      }
    });
  }
} 
