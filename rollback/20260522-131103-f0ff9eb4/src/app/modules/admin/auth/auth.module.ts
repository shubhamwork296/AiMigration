import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing.module';

//COMPONENTS
import * as authComponents from './components/index';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ...authComponents.components,
  ],
  imports: [
    AuthRoutingModule,
    SharedModule, 
    //  NgxCaptchaModule
  ],exports:[
    // NgxCaptchaModule
  ]
})
export class AuthModule { }
