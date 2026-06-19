import { Injectable, Type } from '@angular/core';
import { DesignSelectorService } from './design-selector-service.service';

@Injectable({ providedIn: 'root' })
export class DynamicComponentLoaderService {
    constructor(private readonly selector: DesignSelectorService){}

    async loadComponent<T>(
        legacyComponentImport: () => Promise<{ [key: string]: Type<any> }>,
        legacyComponentKey: string,
        enhancedComponentImport: () => Promise<{ [key: string]: Type<any> }>,
        enhancedComponentKey: string
      ): Promise<Type<T>> {
        const shouldUseNewDesign = this.selector.shouldLoadNewDesign();
    
        if (shouldUseNewDesign) {
          const componentModule = await enhancedComponentImport();
          return componentModule[enhancedComponentKey];
        } else {
          const componentModule = await legacyComponentImport();
          return componentModule[legacyComponentKey];
        }
      }
}