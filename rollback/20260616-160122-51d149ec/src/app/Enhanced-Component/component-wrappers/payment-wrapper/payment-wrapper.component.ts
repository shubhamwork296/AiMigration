import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DynamicComponentLoaderService } from 'src/app/services/dynamic-component-loader.service';
import { ComponentNameEnum, FilePathEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-payment-wrapper',
    template: `<ng-container #container></ng-container>`
  })
  export class PaymentWrapperComponent implements OnInit {
    @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;
  
    constructor(
      private readonly loaderService: DynamicComponentLoaderService,
      private readonly filePathEnum: FilePathEnum,
      private readonly componentNameEnum: ComponentNameEnum
    ) {}

    ngOnInit(): void {
      (async () => {
        const component = await this.loaderService.loadComponent(
          () => import('../../../Component/payment-details/payment-details.component'),
          this.componentNameEnum.legacyPaymentDetailComponent,
          () => import('../../enhanced-payment/enhanced-payment.component'),
          this.componentNameEnum.enhancedPaymentDetailComponent
        );
        this.container.createComponent(component);
      })();
    }
  }