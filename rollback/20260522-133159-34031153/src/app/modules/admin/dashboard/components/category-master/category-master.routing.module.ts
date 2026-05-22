import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddCategoryComponent } from './add-category/add-category.component';
import { CategoryMasterComponent } from './category-master.component'
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
       path : '',
       component : CategoryMasterComponent,
       data: {
        data : [permissionTask.categoryView],
        title: 'Category Master', breadcrumb: [
          {
            label: 'Dashboard',
            url: '/admin/dashboard'
          },
          {
            label: 'Category Master',
            url: ''
          }
        ]
      }
    },
    {
        path : 'add-category',
        component : AddCategoryComponent,
        data: {
          data : [permissionTask.categoryAdd],
         title: 'Add Category', breadcrumb: [
           {
             label: 'Dashboard',
             url: '/admin/dashboard'
           },
           {
             label: 'Category Master',
             url: '/admin/category-master'
           },
           {
             label: 'Add Category',
             url: ''
           }
         ]
       }
    },
    {
      path : 'edit-category',
      component : AddCategoryComponent,
      data: {
        data : [permissionTask.categoryEdit],
       title: 'Edit Category', breadcrumb: [
         {
           label: 'Dashboard',
           url: '/admin/dashboard'
         },
         {
           label: 'Category Master',
           url: '/admin/category-master'
         },
         {
           label: 'Edit Category',
           url: ''
         }
       ]
     }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CategoryMasterRoutingModule { }
