import { NgModule } from '@angular/core';

//COMPONENTS
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin.routing.module';
import { AdminComponent } from './admin.component';
import { AuthGuardChild } from 'src/app/core/guard/auth.gurad.child';
@NgModule({
  declarations: [
    AdminComponent
  ], 
  imports: [
    AdminRoutingModule,
    SharedModule,
    RouterModule

  ],
  providers : [
    AuthGuardChild
  ]
})
export class AdminModule { }  