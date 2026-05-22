import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { CustomerComponent } from './customer.component';
import { ProductConfiguratorDetailComponent } from './product-configurator-detail/product-configurator-detail.component';
import { ComponentsharedModule } from './componentshared/componentshared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { RedZoomModule } from 'ngx-red-zoom';
import { CookieService } from 'ngx-cookie-service';
import { PinchZoomModule } from "ngx-pinch-zoom";
import { WheelDirective } from "../shared/directives/wheel.directive"
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { CategoryComponent } from './category/category.component';
import { RingSizePopUpComponent } from './ring-size-pop-up/ring-size-pop-up.component';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    CustomerComponent,
    CategoryComponent,
    ProductConfiguratorDetailComponent,
    WheelDirective,
    RingSizePopUpComponent
  ],
  imports: [
    CommonModule,
    CustomerRoutingModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    SlickCarouselModule,
    ScrollingModule,
    FormsModule,
    ComponentsharedModule,
    RedZoomModule,
    PinchZoomModule,
    NgSelectModule,
    NgOptionHighlightModule
  ],
  providers: [
    CookieService
  ]
})
export class CustomerModule { }
