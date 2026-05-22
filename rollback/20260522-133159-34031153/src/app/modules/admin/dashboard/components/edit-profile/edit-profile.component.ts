import { Component, OnInit } from '@angular/core';
import { ToastrManager } from 'ng6-toastr-notifications';
import {  FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingService } from 'src/app/core/service/setting.service';
import { SessionService } from 'src/app/core/service/session.service';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import { AttributeMasterService } from 'src/app/core/service/attribute-master.service';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { SessionKeys } from 'src/app/core/constants/session-keys';
@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {
  user_image : any =[]
  user_base64_images : any =''
  EditProfileForm! : FormGroup
  submitted : boolean = false
  is_image_upload  : boolean = false;
  imageUrl : string = ''
  is_image_edit : boolean = false;
  AppConstants: any = AppConstants
  currentEmailId : string = ''
  constructor(private toastr : ToastrManager,private formBuilder : FormBuilder,private settingService : SettingService,
    private sessionService : SessionService,private broadCastService : BroadCasterService,private attributeMasterService : AttributeMasterService,private httpService : HttpService) { 
    this.EditProfileForm = this.formBuilder.group({
      user_name : [{value : '',disabled : true}],
      first_name : ['',[Validators.required,Validators.maxLength(50)]],
      last_name : ['',[Validators.required,Validators.maxLength(50)]], 
      email : [{value : '',disabled : false},[Validators.required,Validators.email,Validators.maxLength(50),Validators.pattern(AppConstants.EMAIL_REJEX)]],
      phone_number : ['',[Validators.required,Validators.minLength(10),Validators.maxLength(10)]]
    });
  } 

  ngOnInit(): void { 
    this.httpService.getConfig().subscribe((config) => {
      this.imageUrl = config.imageUrl;
      this.getUserProfile()
    });
 
  }

  // convenience getter for easy access to form fields
  get f() { return this.EditProfileForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.EditProfileForm.controls[controlName].hasError(errorName);
  }


  uploadAttachment($event: any) {
    if (($event.target.files).length === 0) { 
      return; 
    }
    let mimeType = $event.target.files[0].type;
    if (mimeType.match(/image\/*/) != null) {
      let files = $event.target.files;
      const Img = new Image();
      Img.src = URL.createObjectURL(files[0]);
      Img.onload = (e: any) => {
        let image_path = e.path || (e.composedPath && e.composedPath());
        const height = image_path[0].height;
        const width = image_path[0].width;     
        if ((files[0].size / 1024 / 1024) <= 2  && (height <= 600 && width <=600))
        {
          this.uploadUserImage(files)
        }
        else
        {
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(AppConstants.VALID_IMAGE_SIZE), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      }
    } else {
        this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    }
  }

  uploadUserImage(files : any)
  {
    let formData = new FormData()
    formData.append('profileImage', files[0])
    this.attributeMasterService.uploadFile(formData).subscribe((res: any) => {
      if (res && res.type == AppConstants.success) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.user_base64_images = e.target.result;
        };
        reader.readAsDataURL(files[0]);
        this.is_image_upload = false;
        this.is_image_edit = true;
        this.user_image.push(res?.data?.uploadedFiles[0].filename)
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    });
  }

  onSubmit()
  {
    this.submitted = true
    if(this.EditProfileForm.invalid ) {
      return;
    }
    let request = {
      firstName : this.EditProfileForm.get('first_name')?.value,
      lastName : this.EditProfileForm.get('last_name')?.value,
      phone : this.EditProfileForm.get('phone_number')?.value,
      profileImage : this.user_image[0],
      email : this.EditProfileForm.get('email')?.value,
      isEmail : AppConstants.checkUserChangeTheriEmail(this.currentEmailId,this.EditProfileForm.get('email')?.value) ? 1 : 0
    }
    this.settingService.updateProfile(request).subscribe((response : any)=>{
      if(response && response.type ==AppConstants.success)
      {
        this.submitted = false;
        this.is_image_edit = false;
        let userSession = this.sessionService.getSession(SessionKeys.User.ADMIN_CURRENT_USER)
        userSession.FirstName = this.EditProfileForm.get('first_name')?.value
        userSession.LastName = this.EditProfileForm.get('last_name')?.value 
        userSession.Email = this.EditProfileForm.get('email')?.value 
        if(this.user_image[0])
        {
          userSession.Image = this.user_image[0]
        }
        this.sessionService.setSession(SessionKeys.User.ADMIN_CURRENT_USER,userSession)
        this.broadCastService.broadcast('updateprofile',userSession)
        this.broadCastService.broadcast('updateProfileImage',(this.user_image[0] ?this.user_image[0] : ''))
        this.toastr.successToastr(AppConstants.PROFILE_UPDATE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
      else  
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  numberOnly(event : any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      return false;
    }
    return true;
  }

  resetImage()
  {
    this.user_base64_images = ''
    this.user_image =[]
  }

  getUserProfile()
  {
    this.settingService.getUserProfile({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        this.EditProfileForm.controls['email'].setValue(response?.data?.userProfile?.Email);
        this.currentEmailId = response?.data?.userProfile?.Email
        this.EditProfileForm.controls['phone_number'].setValue(response?.data?.userProfile?.Phone);
        this.EditProfileForm.controls['first_name'].setValue(response?.data?.userProfile?.FirstName);
        this.EditProfileForm.controls['user_name'].setValue(response?.data?.userProfile?.UserName);
        this.EditProfileForm.controls['last_name'].setValue(response?.data?.userProfile?.LastName);
        this.user_base64_images = (response?.data?.userProfile?.Image) ? this.imageUrl+AppConstants.PROFILE_IMAGE_FOLDER_NAME+response?.data?.userProfile?.Image : ''
      }
    })
  }
}
 