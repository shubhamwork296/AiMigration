import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from './core/guard/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    redirectTo: 'admin/login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./customer/customer.module').then(m => m.CustomerModule),
    data: {
      role: 'ROLE_USER'
    },
    canActivate: [RoleGuard]
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('src/app/modules/admin/admin.module').then(m => m.AdminModule),
    data: {
      role: 'ROLE_ADMIN'
    },
    canActivate: [RoleGuard]
  },
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
