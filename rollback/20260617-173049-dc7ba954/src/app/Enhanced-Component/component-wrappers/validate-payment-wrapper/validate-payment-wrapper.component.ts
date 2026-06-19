import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DynamicComponentLoaderService } from 'src/app/services/dynamic-component-loader.service';
import { ComponentNameEnum, FilePathEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-validate-payment-wrapper',
    template: `<ng-container #container></ng-container>`,
    standalone: false
})
export class ValidatePaymentWrapperComponent implements OnInit {
  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;

  constructor(
    private readonly loaderService: DynamicComponentLoaderService,
    private readonly filePathEnum: FilePathEnum,
    private readonly componentNameEnum: ComponentNameEnum
  ) {}

  ngOnInit(): void {
    (async () => {
      const component = await this.loaderService.loadComponent(
        () => import('../../../Component/validate/validate.component'),
        this.componentNameEnum.legacyValidateComponent,
        () => import('../../../Enhanced-Component/enhanced-validate/enhanced-validate.component'),
        this.componentNameEnum.enhancedValidateComponent,
    );
    this.container.createComponent(component);
    })();
  }
}
