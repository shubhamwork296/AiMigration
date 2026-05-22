import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../services/home.service';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
@Component({
  selector: 'webapp-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  constructor(private homeService: HomeService, private httpService: HttpService, private broadCastService: BroadCasterService) { }

  ngOnInit(): void {
    this.getSettings()
  }

  getSettings() {
    this.homeService.getCustomerSettings().subscribe((response: any) => {
      if (!(response && response?.type === AppConstants.success && response?.data?.settings?.length)) return;

      const settingMap: { [key: string]: string } = {
        [AppConstants.CURRENCY_SETTING_KEY]: 'currency',
        [AppConstants.DISCOUNT_START_DATE_KEY]: 'start_date',
        [AppConstants.DISCOUNT_END_DATE_KEY]: 'end_date',
        [AppConstants.DISCOUNT_PERCENT]: 'discount_percent'
      };

      response.data.settings.forEach((element: any) => {
        const broadcastKey = settingMap[element?.SettingKey];
        if (broadcastKey) {
          this.broadCastService.broadcast(broadcastKey, element?.SettingValue);
        }
      });
    });
  }




}
