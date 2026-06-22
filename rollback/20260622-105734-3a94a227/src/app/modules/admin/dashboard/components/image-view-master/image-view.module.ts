import { NgModule } from '@angular/core';
import { ImageViewMasterRoutingModule } from './image-view.routing.module';

import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { ImageViewMasterComponent } from './image-view-master.component';
import { AddImageViewComponent } from './add-image-view/add-image-view.component';
@NgModule({
  declarations: [
    ImageViewMasterComponent,
    AddImageViewComponent
  ],
  imports: [
    ImageViewMasterRoutingModule,
    SharedModule, 
    RouterModule,
    
  ],exports:[ 

  ]
}) 
export class ImageViewMasterModule { }
