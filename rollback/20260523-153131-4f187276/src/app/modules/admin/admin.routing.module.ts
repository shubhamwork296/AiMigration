
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { GuestGuard } from 'src/app/core/guard/guest.guard';
import { AuthGuard } from 'src/app/core/guard/auth.guard';
const routes: Routes = [
  
  {
    path : '',
    component : AdminComponent,
    children :[
     {
        path: '', 
        loadChildren: () =>
          import('./auth/auth.module').then(m => m.AuthModule),
        canActivate : [GuestGuard]
    },
    {
      path : '',
      loadChildren: () =>
      import('./dashboard/dashboard.module').then(m => m.DashboardModule),
      data: {
        role: 'ROLE_ADMIN'
      },
      canActivate :[AuthGuard]
    }
    ]
  }
   
];
 
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
