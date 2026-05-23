import { Component, OnInit } from '@angular/core';
import { SettingService } from 'src/app/core/service/setting.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { HttpService } from 'src/app/core/service/http.service';
@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit {

  userProfileData : any;
  imageUrl : string = ''
  user_image: any;
  constructor(private settingService : SettingService,private httpService : HttpService) { }

  ngOnInit(): void { 
   
    this.httpService.getConfig().subscribe((config) => {
      this.imageUrl = config.imageUrl;
      this.getUserProfile()
    })

  }

  getUserProfile()
  {
    this.settingService.getUserProfile({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        this.userProfileData =  response?.data?.userProfile
        this.user_image = this.userProfileData?.Image ?  (this.imageUrl+AppConstants.PROFILE_IMAGE_FOLDER_NAME+this.userProfileData?.Image): '';
        
        
      }
    })
  }
} 
