import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttributeMasterComponent } from './attribute-master.component';
import { AddAttributeComponent } from './add-attribute/add-attribute.component';
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
       path : '',
       component : AttributeMasterComponent,
       data: {
        data : [permissionTask.attributeView],
        title: 'Attribute Master', breadcrumb: [
          {
            label: 'Dashboard',
            url: '/admin/dashboard'
          },
          {
            label: 'Attribute Master',
            url: ''
          }
        ]
      }
    },
    {
        path : 'add-attribute',
        component : AddAttributeComponent,
        data: {
          data : [permissionTask.attributeAdd],
         title: 'Add Attribute', breadcrumb: [
           {
             label: 'Dashboard',
             url: '/admin/dashboard'
           },
           {
             label: 'Attribute Master',
             url: '/admin/attribute-master'
           },
           {
             label: 'Add Attribute',
             url: ''
           }
         ]
       }
    },
    {
      path : 'edit-attribute',
      component : AddAttributeComponent,
      data: {
        data : [permissionTask.attributeEdit],
       title: 'Edit Attribute', breadcrumb: [
         {
           label: 'Dashboard',
           url: '/admin/dashboard'
         },
         {
           label: 'Attribute Master',
           url: '/admin/attribute-master'
         },
         {
           label: 'Edit Attribute',
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
export class AttributeMasterRoutingModule { }
