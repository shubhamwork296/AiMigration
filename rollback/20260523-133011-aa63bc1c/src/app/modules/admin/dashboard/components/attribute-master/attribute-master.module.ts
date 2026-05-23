import { NgModule } from '@angular/core';
import { AttributeMasterRoutingModule } from './attribute-master.routing.module';

import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { AttributeMasterComponent } from './attribute-master.component';
import { AddAttributeComponent } from './add-attribute/add-attribute.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
@NgModule({
  declarations: [
    AttributeMasterComponent,
    AddAttributeComponent
  ],
  imports: [
    AttributeMasterRoutingModule,
    SharedModule, 
    RouterModule,
    DragDropModule
  ],exports:[ 

  ]
}) 
export class AttributeMasterModule { }
