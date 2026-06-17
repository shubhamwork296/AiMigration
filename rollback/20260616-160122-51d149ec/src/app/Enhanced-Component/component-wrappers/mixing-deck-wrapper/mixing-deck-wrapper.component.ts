import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DynamicComponentLoaderService } from 'src/app/services/dynamic-component-loader.service';
import { ComponentNameEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-mixing-deck-wrapper',
    template: `<ng-container #container></ng-container>`
  })
  export class MixingDeckWrapperComponent implements OnInit {
    @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;
  
    constructor(
      private readonly loaderService: DynamicComponentLoaderService,
      private readonly componentNameEnum: ComponentNameEnum
    ) {}

    ngOnInit(): void {
      (async () => {
        const component = await this.loaderService.loadComponent(
          () => import('../../../Component/mixing-deck/mixing-deck.component'),
          this.componentNameEnum.legacyMixingDeckComponent,
          () => import('../../enhanced-mixing-deck-combined-list/enhanced-mixing-deck-combined-list.component'),
          this.componentNameEnum.enhancedMixingDeckCombinedListComponent
        );
        this.container.createComponent(component);
      })();
    }
  }