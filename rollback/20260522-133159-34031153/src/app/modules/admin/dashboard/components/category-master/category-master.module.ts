import { NgModule } from '@angular/core';
import { CategoryMasterRoutingModule } from './category-master.routing.module';

import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { CategoryMasterComponent } from './category-master.component'
import { AddCategoryComponent } from './add-category/add-category.component';


@NgModule({
  declarations: [
    AddCategoryComponent,
    CategoryMasterComponent,
  ],
  imports: [
    CategoryMasterRoutingModule,
    SharedModule, 
    RouterModule,
    
  ],exports:[ 

  ]
}) 
export class CategoryMasterModule { }
