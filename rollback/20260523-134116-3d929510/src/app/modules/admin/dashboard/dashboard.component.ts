import { Component, OnInit } from '@angular/core';
import { SessionService } from 'src/app/core/service/session.service';
import { SessionKeys } from 'src/app/core/constants/session-keys';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import { NavigationEnd, Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { SettingService } from 'src/app/core/service/setting.service';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { permissionTask } from 'src/app/core/constants/permission-enum';
import { UserIdleService } from 'angular-user-idle';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
}) 
export class DashboardComponent implements OnInit {
  userName: string = ""; 
  currentUrl : any;
  is_sidebar_opean : boolean = false;
  deviceType : string = 'web'
  user_image : any = ''
  imageUrl : string = ''
  permissionTask : any = permissionTask;
  modules : any = [] 
  RoleName : string = ''
  constructor(private sessionService : SessionService,private broadcastService : BroadCasterService,private router : Router, private deviceService: DeviceDetectorService,private settingService : SettingService,private httpService : HttpService,private userIdle :UserIdleService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = this.router.url.split('/')[2];
      }
    });

   
   }

  ngOnInit(): void {
    this.modules = this.sessionService.getSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS) || [];
    this.httpService.getConfig().subscribe((config) => {
      this.imageUrl = config.imageUrl;
      let user = this.sessionService.getSession(SessionKeys.User.ADMIN_CURRENT_USER);
      this.userName =this.createUserName(user)
      this.user_image =(user &&  user?.Image) ?  (this.imageUrl+AppConstants.PROFILE_IMAGE_FOLDER_NAME+user?.Image): '';
      this.RoleName = user?.RoleName
    })

    this.broadcastService.on('username').subscribe(cic => {
      this.userName = String(cic);
    });

    this.broadcastService.on('updateProfileImage').subscribe(response=>{
      if(response)
      {
        this.user_image =this.imageUrl+AppConstants.PROFILE_IMAGE_FOLDER_NAME+response;
      }
    })
    
    this.broadcastService.on('updateprofile').subscribe(cic => {
      this.userName = this.createUserName(cic)
    });
    this.getDeviceType();
    this.getCurrencyList()
    this.userIdle.setConfigValues({idle : 60*30,timeout : 1,ping : 30})
    this.userIdle.startWatching();
    this.userIdle.onTimerStart().subscribe(() => {/* CHECK TIMOUT */});
    this.userIdle.onTimeout().subscribe(() => {
      this.settingService.logout();
      this.userIdle.stopTimer();
      this.userIdle.stopWatching();
    });
  }

  createUserName(user : any) : any
  {
    if(user?.FirstName || user?.LastName)
    {
      let FirstName = user?.FirstName;
      let LastName = ' '
      if(user?.LastName)
      {
        LastName += user?.LastName
      }

      return FirstName+LastName
    }
  }
  
  userLogout() {
    this.settingService.logout()
  }

  getDeviceType()
  {
    const isDesktopDevice = this.deviceService.isDesktop();
    
    if (isDesktopDevice) {
      this.deviceType = "web"
    } else {
      this.deviceType = "mobile"
    }
  }

  closeSideBar(){
    if(this.deviceType == 'mobile')
    {
      this.is_sidebar_opean = false      
    } 
  }

  
  getCurrencyList()
  {
    this.settingService.currencyList({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        if(response?.data?.settings && response?.data?.settings.length > 0)
        {
          response?.data?.settings.forEach((element : any) => {
            if(element.SettingKey == AppConstants.CURRENCY_SETTING_KEY)
            {
              this.sessionService.setSession("currency",element.SettingValue);
              this.broadcastService.broadcast("currency",element.SettingValue);
            }
          });
        }
        else 
        {
          this.sessionService.setSession("currency",AppConstants.DEFAULT_CURRENCY);
          this.broadcastService.broadcast("currency",AppConstants.DEFAULT_CURRENCY);
        }
      }
    });
  }

  checkUserManagementPermissions()
  {
    if(AppConstants.checkPermssionAvalible([permissionTask.roleModulePermissionView],this.modules) || AppConstants.checkPermssionAvalible([permissionTask.userRoleMappingView],this.modules))
    {
      return true;
    }
    else{
      return false;
    }
  }

  checkManageSettingsPermissions()
  {
    if(AppConstants.checkPermssionAvalible([permissionTask.manageMetalRateView],this.modules) || AppConstants.checkPermssionAvalible([permissionTask.manageBaseRateView],this.modules))
    {
      return true;
    }
    else{
      return false;
    }
  }
}
