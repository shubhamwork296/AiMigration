import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/core/service/authentication.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/core/constants/app-constants';
@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss']
})
export class ForgetPasswordComponent {
  submitted: boolean = false; 
  forgetPasswordForm!: FormGroup;
  AppConstants : any = AppConstants
  constructor(private formBuilder : FormBuilder,private authService : AuthenticationService,
    private toastr : ToastrManager,private router : Router) {
    this.forgetPasswordForm = this.formBuilder.group({
      username: ['', Validators.required],
    });
   }

  // convenience getter for easy access to form fields
  get f() { return this.forgetPasswordForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.forgetPasswordForm.controls[controlName].hasError(errorName);
  }

  onSubmit() {

    this.submitted = true;
    if (this.forgetPasswordForm.invalid) { 
      return;
    }

    this.authService.forgot(this.forgetPasswordForm.value).subscribe(response=>{
      if(response && response.type == AppConstants.success)
      {
        this.submitted = false;
        this.toastr.successToastr(response.message, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/login'])
      }
      else
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }
}
