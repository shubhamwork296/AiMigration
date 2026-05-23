import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { Router } from '@angular/router';
import { SafeUrl } from '@angular/platform-browser';
import { SettingService } from 'src/app/core/service/setting.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { permissionTask } from 'src/app/core/constants/permission-enum';
import { SessionService } from 'src/app/core/service/session.service';
import { SessionKeys } from 'src/app/core/constants/session-keys';
@Component({
  selector: 'app-generate-qr',
  templateUrl: './generate-qr.component.html',
  styleUrls: ['./generate-qr.component.scss']
})
export class GenerateQrComponent implements OnInit {
  submitted: boolean = false;
  GenerateQrForm!: FormGroup;
  AppConstants: any = AppConstants
  public myAngularxQrCode: string = "";
  public qrCodeDownloadLink: SafeUrl = "";
  public qrCodeDownloadSvg: SafeUrl = ''
  permissionTask : any = permissionTask;
  modules : any = []
  constructor(private formBuilder: FormBuilder,private router : Router,private settingService : SettingService,private toastr : ToastrManager,private sessionService : SessionService) {
    this.GenerateQrForm = this.formBuilder.group({
      url_id : [],
      url: ['', [Validators.required,Validators.pattern(AppConstants.URL_VALIDATION)]],
    });
   }

  ngOnInit(): void {
    
    this.modules = this.sessionService.getSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS) || [];
    this.getCurrencyList()
    this.checkEditPermission()
  }

    // convenience getter for easy access to form fields
    get f() { return this.GenerateQrForm.controls; }
 

  onSubmit()
  {
    this.submitted = true

    if(this.GenerateQrForm.invalid)
    {
      return
    }
    this.submitted = false;
 
    let request : any = {
      "settingsData" : [
        {
          id : this.GenerateQrForm.get('url_id')?.value,
          value : this.GenerateQrForm?.get('url')?.value
        }
        
      ],
      "metalPriceData" : [],
      "is_metal_price" : 0
    }
    this.updateSettings(request)
  }


  updateSettings(data : any)
  {
    this.settingService.addCurrency(data).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        this.submitted = false;
        this.myAngularxQrCode =  this.GenerateQrForm.get('url')?.value;
        this.toastr.successToastr(AppConstants.QR_CODE_GENERETED, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  getCurrencyList()
  {
    this.settingService.currencyList({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
         response?.data?.settings?.forEach((element : any) => {
          if(element.SettingKey == AppConstants.GENERATE_QR_SETTING_KEY)
          {
            this.GenerateQrForm.controls['url_id'].setValue(element?.SettingId);
            this.GenerateQrForm.get('url')?.setValue(element?.SettingValue ? element?.SettingValue : '');
            this.myAngularxQrCode = element?.SettingValue ? element?.SettingValue : '';
          }
         
        });
      }
    })
  } 

  onChangeURL(url: SafeUrl) {
    this.qrCodeDownloadLink = url;
  }

  onSvgChangeUr(url: SafeUrl)
  {
    this.qrCodeDownloadSvg = url;
  }

  cancel() {
    this.router.navigate(['/admin/dashboard'])
  }

  checkEditPermission()
  {
    if(!AppConstants.checkPermssionAvalible([permissionTask.generateQrAdd],this.modules))
    {
      this.GenerateQrForm.get('url')?.disable();
    }
  }
}
 