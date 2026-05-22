import { NgModule } from '@angular/core';
import { DashboardRoutingModule } from './dashboard.routing.module';

import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardComponent } from './dashboard.component'
import { NgSelectModule } from '@ng-select/ng-select';
import * as dashboardComponents from './components/index';
import { QRCodeModule } from 'angularx-qrcode';
import { UserIdleModule} from 'angular-user-idle';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
@NgModule({
  declarations: [
    DashboardComponent,
    ...dashboardComponents.components
  ],
  imports: [
    DashboardRoutingModule,
    SharedModule, 
    RouterModule,
    NgSelectModule,
    QRCodeModule,
    UserIdleModule,
    NgOptionHighlightModule
  ],exports:[ 

  ] 
}) 
export class DashboardModule { }
