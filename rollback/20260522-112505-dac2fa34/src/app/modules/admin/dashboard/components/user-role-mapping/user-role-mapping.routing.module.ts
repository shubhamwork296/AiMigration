import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserRoleMappingComponent } from './user-role-mapping.component';
import { AddUserRoleMappingComponent } from './add-user-role-mapping/add-user-role-mapping.component';
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
       path : '',
       component : UserRoleMappingComponent,
       data: {
        data :[permissionTask.userRoleMappingView],
        title: 'User Role Mapping', breadcrumb: [
          {
            label: 'Dashboard',
            url: '/admin/dashboard'
          },
          {
            label: 'User Role Mapping',
            url: ''
          }
        ]
      }
    },
    {
        path : 'add-user-role',
        component : AddUserRoleMappingComponent,
        data: {
          data :[permissionTask.userRoleMappingAdd],
         title: 'Add User Role', breadcrumb: [
           {
             label: 'Dashboard',
             url: '/admin/dashboard'
           },
           {
             label: 'User Management',
             url: ''
           },
           {
            label: 'User & Role Mapping',
            url: '/admin/user-role-mapping'
            },
           {
             label: 'Add User Role',
             url: ''
           }
         ]
       }
    },
    {
      path : 'edit-user-role',
      component : AddUserRoleMappingComponent,
      data: {
        data :[permissionTask.userRoleMappingEdit],
       title: 'Edit User Role', breadcrumb: [
         {
           label: 'Dashboard',
           url: '/admin/dashboard'
         },
         {
           label: 'User Management',
           url: ''
         },
         {
          label: 'User & Role Mapping',
          url: '/admin/user-role-mapping'
          },
         {
           label: 'Edit User Role',
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
export class UserRoleMappingMasterRoutingModule { }
