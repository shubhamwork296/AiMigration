import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DynamicComponentLoaderService } from 'src/app/services/dynamic-component-loader.service';
import { ComponentNameEnum, FilePathEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-travel-extra-reviewby-delivery-wrapper',
    template: `<ng-container #container></ng-container>`,
    standalone: false
})
  export class TravelExtraReviewByAndDeliveryWrapperComponent implements OnInit {
    @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;
  
    constructor(
      private readonly loaderService: DynamicComponentLoaderService,
      private readonly filePathEnum: FilePathEnum,
      private readonly componentNameEnum: ComponentNameEnum
    ) {}

    ngOnInit(): void {
      (async () => {
        const component = await this.loaderService.loadComponent(
          () => import('../../../Component/review-and-buy/review-buy-and-delivery/review-buy-and-delivery.component'),
          this.componentNameEnum.legacyReviewAndDeliveryComponent,
          () => import('../../enhanced-travel-extra-reviewBy-delivery-merge/enhanced-travelExtra-and-reviewByDelivery.component'),
          this.componentNameEnum.enhancedReviewTravelExtraAndDeliveryComponent
        );
        this.container.createComponent(component);
      })();
    }
  }