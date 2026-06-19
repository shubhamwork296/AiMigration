import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DynamicComponentLoaderService } from 'src/app/services/dynamic-component-loader.service';
import { ComponentNameEnum, FilePathEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-validate-enrollment-wrapper',
    template: `<ng-container #container></ng-container>`,
    standalone: false
})
export class ValidateEnrollmentWrapperComponent implements OnInit {
  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;

  constructor(
    private readonly loaderService: DynamicComponentLoaderService,
    private readonly filePathEnum: FilePathEnum,
    private readonly componentNameEnum: ComponentNameEnum
  ) {}

  ngOnInit(): void {
    (async () => {
      const component = await this.loaderService.loadComponent(
        () => import('../../../Component/validate/validate-enrollment/validate-enrollment.component'),
        this.componentNameEnum.legacyValidateEnrollmentComponent,
        () => import('../../../Enhanced-Component/enhanced-validate/enhanced-validate-enrollment/enhanced-validate-enrollment.component'),
        this.componentNameEnum.enhancedValidateEnrollmentComponent,
    );
    this.container.createComponent(component);
    })();
  }
}
