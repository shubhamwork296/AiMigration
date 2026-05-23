import { NgModule } from '@angular/core';
import { RoleMasterRoutingModule } from './role-master.routing.module';

import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { RoleMasterComponent } from './role-master.component';
import { AddRoleComponent } from './add-role/add-role.component';
@NgModule({
  declarations: [
    RoleMasterComponent,
    AddRoleComponent
  ],
  imports: [
    RoleMasterRoutingModule,
    SharedModule, 
    RouterModule,
    
  ],exports:[ 

  ]
}) 
export class RoleMasterModule { }
