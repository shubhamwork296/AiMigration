import { Component, OnInit } from '@angular/core';
import { SettingService } from 'src/app/core/service/setting.service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrManager } from 'ng6-toastr-notifications';
import  { AppConstants } from '../../../../../core/constants/app-constants'
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import { SessionService } from 'src/app/core/service/session.service';
import { AttributeMasterService } from 'src/app/core/service/attribute-master.service';
import { HttpService } from 'src/app/core/service/http.service';
import { permissionTask } from 'src/app/core/constants/permission-enum';
import { SessionKeys } from 'src/app/core/constants/session-keys';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  
  settingForm! : FormGroup
  AddMetalRatesForm! : FormGroup
  currency : any = AppConstants.currencyOptions;
  currencyData : any = []
  submitted : boolean = false;
  metal_submitted : boolean= false;
  logo_base64_images : any =''
  logo_image : any = []
  is_image_upload : boolean = false;
  imageUrl : string = ''
  AppConstants : any =  AppConstants
  default_tab : string = 'first_tab'
  permissionTask : any = permissionTask;
  modules : any = []
  markupRecords :any;
  constructor(private settingService : SettingService,private formBuilder : FormBuilder,private toastr : ToastrManager,
    private broadcastService : BroadCasterService,private sessionService : SessionService,private attributeMasterService : AttributeMasterService,private httpService : HttpService) { 
    this.settingForm = this.formBuilder.group({
      currency : [''],
      is_currency_active : [0],
      currecny_setting_id : [],
      logo_setting_id : [],
      is_logo_active : [0],
      base_gold_price_id : [],
      base_gold_price: ['', Validators.required],
      base_platinum_price_id : [],
      base_platinum_price: ['', Validators.required],
    });


    this.AddMetalRatesForm = this.formBuilder.group({
      current_gold_rate_id : [],
      current_gold_rate: ['', Validators.required],
      current_platinum_rate_id : [],
      current_platinum_rate: ['', Validators.required],
      price_usd_to_id : [],
      price_usd_to_pound: ['',Validators.required],
      markup_in_price_id : [],
      markup_in_price: ['',Validators.required],
      price_roundoff_value_id : [],
      price_roundoff_value: ['',Validators.required],
      markup_price: this.formBuilder.array([]) 
    });

    this.markupRecords = this?.AddMetalRatesForm?.get('markup_price') as FormArray;
  } 

  addMarkUpRecords(id?: any,min_price? : any,max_price?: any,markup_percent? : any)
  {
    return this.formBuilder.group({
      id : [(id !== '' &&  id!== null && id !== undefined) ?  id : this.markupRecords.length+1],
      min_price : [(min_price !== '' &&  min_price!== null && min_price !== undefined) ? min_price : '',[Validators.required]],
      max_price : [(max_price !== '' &&  max_price!== null && max_price !== undefined) ? max_price : '',[Validators.required]],
      markup_percent : [(markup_percent !== '' &&  markup_percent!== null && markup_percent !== undefined) ?markup_percent : '',[Validators.required]],
    });

  }

  addNewMarkUpControl()
  {
    const markupCntrl = this?.AddMetalRatesForm?.get('markup_price') as FormArray;
  
    markupCntrl.push(this.addMarkUpRecords());
  }

  ngOnInit(): void {
    this.modules = this.sessionService.getSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS) || [];
    this.httpService.getConfig().subscribe((config) => {
      this.imageUrl = config.imageUrl;
      this.getCurrencyList()
    });
    this.checkEditPermission()
  } 
  // convenience getter for easy access to form fields
  get f() { return this.settingForm.controls; }
  get m() { return this.AddMetalRatesForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.settingForm.controls[controlName].hasError(errorName);
  }

  getCurrencyList()
  {
    this.settingService.currencyList({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        this.currencyData = response?.data?.settings
        this.currencyData.forEach((element : any) => {
          if(element.SettingKey == AppConstants.CURRENCY_SETTING_KEY)
          {
            this.settingForm.controls['currency'].setValue(element?.SettingValue);
            this.settingForm.controls['is_currency_active'].setValue(1);
            this.settingForm.controls['currecny_setting_id'].setValue(element?.SettingId);
            this.settingForm.get('currency')?.setValidators([Validators.required]);
            this.settingForm.get('currency')?.updateValueAndValidity();
          }
          else if(element.SettingKey == AppConstants.BASE_GOLD_PRICE_SETTING_KEY)
          {
            this.settingForm.controls['base_gold_price_id'].setValue(element?.SettingId);
            this.settingForm.controls['base_gold_price']?.setValue(element?.SettingValue);
          }
          else if(element.SettingKey ==AppConstants.BASE_PLATINUM_PRICE_SETTING_KEY)
          {
            this.settingForm.controls['base_platinum_price_id'].setValue(element?.SettingId);
            this.settingForm.controls['base_platinum_price']?.setValue(element?.SettingValue);
          }
          else if(element.SettingKey ==AppConstants.CURRENT_GOLD_RATE_SETTING_KEY)
          {
            this.AddMetalRatesForm.controls['current_gold_rate_id'].setValue(element?.SettingId);
            this.AddMetalRatesForm.controls['current_gold_rate']?.setValue(element?.SettingValue);
          }
          else if(element.SettingKey == AppConstants.CURRENT_PLATINUM_RATE_SETTING_KEY)
          {
            this.AddMetalRatesForm.controls['current_platinum_rate_id'].setValue(element?.SettingId);
            this.AddMetalRatesForm.controls['current_platinum_rate']?.setValue(element?.SettingValue);
          }
          else if(element.SettingKey == AppConstants.PRICE_USD_TO_POUND_SETTING_KEY)
          {
            this.AddMetalRatesForm.controls['price_usd_to_id'].setValue(element?.SettingId);
            this.AddMetalRatesForm.controls['price_usd_to_pound']?.setValue(element?.SettingValue);
          }
          else if(element.SettingKey == AppConstants.MARKUP_IN_PRICE)
          {
            this.AddMetalRatesForm.controls['markup_in_price_id'].setValue(element?.SettingId);
            this.AddMetalRatesForm.controls['markup_in_price']?.setValue(element?.SettingValue);
          }
          else if(element.SettingKey ==AppConstants.PRICE_ROUND_OFF)
          {
            this.AddMetalRatesForm.controls['price_roundoff_value_id'].setValue(element?.SettingId);
            this.AddMetalRatesForm.controls['price_roundoff_value']?.setValue(element?.SettingValue);
          }
        });

        this.checkMarkUpRecords(response)

      }
    })
  } 

  checkMarkUpRecords(response : any)
  {
    if(response?.data?.metalPriceData && response?.data?.metalPriceData?.length > 0)
    {
      const markupCntrl = this?.AddMetalRatesForm?.get('markup_price') as FormArray;

      response?.data?.metalPriceData.forEach((element : any) => {
        markupCntrl.push(this.addMarkUpRecords(element.id,element.min_price,element.max_price,element.markup_percent));
      });
    }
  }
  onSubmit()
  {
    this.submitted = true
   
   
    if(this.settingForm.invalid) {
      return;
    }
    
    let data : any = {
    }
    data = this.append_data()

    this.updateSettings(data,1)
  }

  updateSettings(data : any,is_curreny_update : any)
  {
    this.settingService.addCurrency(data).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {

        this.submitted = false;
        this.metal_submitted = false;
        if(is_curreny_update == 1){
          this.sessionService.setSession("currency",this.settingForm.get('currency')?.value);
          this.broadcastService.broadcast("currency",this.settingForm.get('currency')?.value);
        }
       
        this.toastr.successToastr(AppConstants.SETTINGS_UPDATE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }


  onMetalRateSubmit(){
    this.metal_submitted = true
   
    if(this.AddMetalRatesForm.invalid) {
      return;
    }

    let request : any = {
      "settingsData" : [
      {
        id : this.AddMetalRatesForm.get('current_gold_rate_id')?.value,
        value : this.AddMetalRatesForm?.get('current_gold_rate')?.value
      },
      {
        id : this.AddMetalRatesForm.get('current_platinum_rate_id')?.value,
        value : this.AddMetalRatesForm?.get('current_platinum_rate')?.value
      },
      {
        id : this.AddMetalRatesForm.get('price_usd_to_id')?.value,
        value : this.AddMetalRatesForm?.get('price_usd_to_pound')?.value
      },
      {
        id : this.AddMetalRatesForm.get('markup_in_price_id')?.value,
        value : this.AddMetalRatesForm?.get('markup_in_price')?.value
      },
      {
        id : this.AddMetalRatesForm.get('price_roundoff_value_id')?.value,
        value : this.AddMetalRatesForm?.get('price_roundoff_value')?.value
      }
    ],
    "is_metal_price" : 1
  }

    let markUpData : any  = []
    const markupCntrl : any = this?.AddMetalRatesForm?.get('markup_price') as FormArray;
    for (const fromcontrol of markupCntrl.controls) {
        markUpData.push({
          id : fromcontrol['controls'].id.value,
          min_price : fromcontrol['controls'].min_price.value,
          max_price : fromcontrol['controls'].max_price.value,
          markup_percent : fromcontrol['controls'].markup_percent.value
        })
    }

    request["metalPriceData"] = markUpData
    this.updateSettings(request,0)
  }

  check_image_length() : boolean 
  {
    if(this.logo_image && this.logo_image.length > 0)
    {
      return false;
    }
    else 
    {
      return true
    }
  }
  append_data() : any
  {
    let data : any = {
      "settingsData" :[
        {
          id : this.settingForm.get('base_gold_price_id')?.value,
          value : this.settingForm?.get('base_gold_price')?.value
        },
        {
          id : this.settingForm.get('base_platinum_price_id')?.value,
          value : this.settingForm?.get('base_platinum_price')?.value
        }
      ],
      "metalPriceData" : [],
    "is_metal_price" : 0
    }
    if(this.settingForm.get('is_currency_active') && this.settingForm.get('is_currency_active')?.value && this.settingForm.get('is_currency_active')?.value == 1)
    {
      data.settingsData.push({
        id : this.settingForm.get('currecny_setting_id')?.value,
        value :this.settingForm.get('currency')?.value
      })
    }

    return data;
  }

 

  uploadAttachment($event: any) {
    if (($event.target.files).length === 0) { 
      return; 
    }
    let  mimeType = $event.target.files[0].type;
    if (mimeType.match(/image\/*/) != null) {
      
      this.logo_base64_images = ''
      this.logo_image = []
      let files = $event.target.files;

      if(!AppConstants.checkImageExtensionAllowed($event.target.files[0].name))
      {
        this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        return
      }
      const Img = new Image();
      
      const filesToUpload = ($event.target.files);
      Img.src = URL.createObjectURL(filesToUpload[0]);
      
      Img.onload = (e: any) => {
        let image_path = e.path || (e.composedPath && e.composedPath());
        const height = image_path[0].height;
        const width = image_path[0].width;     
        if ((filesToUpload[0].size / 1024 / 1024) <= 2  && (height <= 300 && width <=600))
        {
          this.uploadLogo(files)
        }
        else{
          this.toastr.errorToastr(AppConstants.CATEGORYIMAGE_VALIDATION, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      }
    
     
      
    } else {
        this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    }
  }

  uploadLogo(files : any)
  {
    let formData = new FormData()
    formData.append('webLogo', files[0])
    this.attributeMasterService.uploadFile(formData).subscribe((res: any) => {
      if (res && res.type == AppConstants.success) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.logo_base64_images = e.target.result;
        };
        reader.readAsDataURL(files[0]);
        this.is_image_upload = false;
        this.logo_image.push(res?.data?.uploadedFiles[0].filename)
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    });
  }



  resetImage()
  {
    this.logo_base64_images = ''
    this.logo_image =[]
  }

  numbersOnly(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      return false;
    }
    return true;
  }

  checkEditPermission()
  {
    if(!AppConstants.checkPermssionAvalible([permissionTask.manageBaseRateEdit],this.modules))
    {
      this.settingForm.get('base_gold_price')?.disable();
      this.settingForm.get('base_platinum_price')?.disable();
      this.settingForm.get('currency')?.disable();
      
    }
    
    if(!AppConstants.checkPermssionAvalible([permissionTask.manageMetalRateEdit],this.modules))
    {
      this.AddMetalRatesForm.get('current_gold_rate')?.disable();
      this.AddMetalRatesForm.get('current_platinum_rate')?.disable();
      this.AddMetalRatesForm.get('price_usd_to_pound')?.disable();
      this.AddMetalRatesForm.get('markup_in_price')?.disable();
      this.AddMetalRatesForm.get('price_roundoff_value')?.disable();
    }

    if(AppConstants.checkPermssionAvalible([permissionTask.manageBaseRateView],this.modules))
    {
      this.default_tab = 'first_tab'
    }
    else if(AppConstants.checkPermssionAvalible([permissionTask.manageMetalRateView],this.modules))
    {
      this.default_tab = 'second_tab'
    }
  }


  deleteMarkUp(index : any)
  {
    this.markupRecords.removeAt(index)
  }

 
}
