import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleMasterComponent } from './role-master.component';
import { AddRoleComponent } from './add-role/add-role.component';
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
       path : '',
       component : RoleMasterComponent,
       data: {
        data : [permissionTask.roleModulePermissionView],
        title: 'Role Module Permission', breadcrumb: [
          {
            label: 'Dashboard',
            url: '/admin/dashboard'
          },
          {
            label: 'User Management',
            url: ''
          },
          {
            label: 'Role Module Permission',
            url: ''
          }
        ]
      }
    },
    {
        path : 'add-role-module',
        component : AddRoleComponent,
        data: {
          data : [permissionTask.roleModulePermissionAdd],
         title: 'Add Role Module', breadcrumb: [
           {
             label: 'Dashboard',
             url: '/admin/dashboard'
           },
           {
             label: 'User Management',
             url: ''
           },
           {
            label: 'Role Module Permission',
            url: '/admin/role-module-permission'
            },
           {
             label: 'Add Role Module',
             url: ''
           }
         ]
       }
    },
    {
      path : 'edit-role-module',
      component : AddRoleComponent,
      data: {
        data : [permissionTask.roleModulePermissionEdit],
       title: 'Edit Role Module', breadcrumb: [
         {
           label: 'Dashboard',
           url: '/admin/dashboard'
         },
         {
           label: 'User Management',
           url: ''
         },
         {
          label: 'Role Module Permission',
          url: '/admin/role-module-permission'
          },
         {
           label: 'Edit Role Module',
           url: ''
         }
       ]
     }
    }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RoleMasterRoutingModule { }
