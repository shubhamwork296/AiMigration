import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DynamicComponentLoaderService } from 'src/app/services/dynamic-component-loader.service';
import { ComponentNameEnum, FilePathEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-booking-confirmation-wrapper',
    template: `<ng-container #container></ng-container>`,
    standalone: false
})
  export class BookingConfirmationWrapperComponent implements OnInit {
    @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;
  
    constructor(
      private readonly loaderService: DynamicComponentLoaderService,
      private readonly filePathEnum: FilePathEnum,
      private readonly componentNameEnum: ComponentNameEnum
    ) {}

    ngOnInit(): void {
      (async () => {
        const component = await this.loaderService.loadComponent(
          () => import('../../../Component/booking-confirmation/booking-confirmation.component'),
          this.componentNameEnum.legacyBookingConfirmationComponent,
          () => import('../../enhanced-booking-confirmation/enhanced-booking-confirmation.component'),
          this.componentNameEnum.enhancedBookingConfirmationComponent
        );
        this.container.createComponent(component);
      })();
    } 
  }