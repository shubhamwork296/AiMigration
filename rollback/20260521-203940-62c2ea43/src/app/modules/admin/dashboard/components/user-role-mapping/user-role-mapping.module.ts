import { NgModule } from '@angular/core';
import { UserRoleMappingComponent } from './user-role-mapping.component';
import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { AddUserRoleMappingComponent } from './add-user-role-mapping/add-user-role-mapping.component';
import { UserRoleMappingMasterRoutingModule } from './user-role-mapping.routing.module';
@NgModule({
  declarations: [
    UserRoleMappingComponent,
    AddUserRoleMappingComponent
  ],
  imports: [
    UserRoleMappingMasterRoutingModule,
    SharedModule, 
    RouterModule,
    
  ],exports:[ 

  ]
}) 
export class UserRoleMappingMasterModule { }
