import { Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { FooterNavigationLinkEnum } from 'src/app/utility/app-constants.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent {
  ga4dataLayerService: GA4DatalayerService;
  router: Router;
  footerNavigationLinkEnum: FooterNavigationLinkEnum;
  currentYear;
  
  constructor(private readonly injector: Injector){
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.router = this.injector.get(Router);
    this.footerNavigationLinkEnum = this.injector.get(FooterNavigationLinkEnum);
  }

  ngOnInit() {
    try{
      this.currentYear = new Date().getFullYear();
    } catch (error){
      console.log(error);
    }
  }
  goToFooterNavigation(destination_page, ctaClickText) {
    this.ga4dataLayerService.loadGALayerForFooterNavigation(this.router.url, destination_page, ctaClickText);
  }


}
