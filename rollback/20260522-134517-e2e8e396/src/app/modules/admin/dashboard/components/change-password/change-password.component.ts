import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import  { AppConstants } from '../../../../../core/constants/app-constants';
import { SettingService } from 'src/app/core/service/setting.service';
import { ToastrManager } from 'ng6-toastr-notifications';
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent{
  submitted: boolean = false; 
  changetPasswordForm!: FormGroup;
  is_password_match : boolean = false;
  AppConstants : any = AppConstants
  constructor(private formBuilder : FormBuilder,private settingService : SettingService,private toastr : ToastrManager) { 
    this.changetPasswordForm = this.formBuilder.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required,Validators.minLength(8),Validators.pattern(AppConstants.PASSWORD_VALIDATOR)]],
      confirmPassword: ['', [Validators.required,Validators.minLength(8),Validators.pattern(AppConstants.PASSWORD_VALIDATOR)]],
    });
  }

   // convenience getter for easy access to form fields
   get f() { return this.changetPasswordForm.controls; }

   // check error
   public hasError = (controlName: string, errorName: string) => {
     return this.changetPasswordForm.controls[controlName].hasError(errorName);
   }
 
   onSubmit() {
    this.is_password_match = false;
   
    if(this.changetPasswordForm.get('newPassword')?.value == this.changetPasswordForm.get('confirmPassword')?.value)
    {
      this.is_password_match = false;
    } 
    else 
    {
      this.is_password_match = true;
    }
     this.submitted = true;
     if (this.changetPasswordForm.invalid || this.is_password_match) { 
       return;
     }

     let request = {
      currentPassword : this.changetPasswordForm.get('oldPassword')?.value,
      password : this.changetPasswordForm.get('confirmPassword')?.value
     }


     this.settingService.changePassword(request).subscribe((response : any)=>{
       if(response && response.type == AppConstants.success)
       {
        this.submitted = false;
        this.toastr.successToastr(AppConstants.PASSWORD_UPDATE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.settingService.logout();
      }
       else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
       }
     })
   }

}
  