import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImageViewMasterComponent } from './image-view-master.component';
import { AddImageViewComponent } from './add-image-view/add-image-view.component';
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
       path : '',
       component : ImageViewMasterComponent,
       data: {
        data : [permissionTask.imageViewView],
        title: 'Image View Master', breadcrumb: [
          {
            label: 'Dashboard',
            url: '/admin/dashboard'
          },
          {
            label: 'Image View Master',
            url: ''
          }
        ]
      }
    },
    {
        path : 'add-image-view',
        component : AddImageViewComponent,
        data: {
          data : [permissionTask.imageViewAdd],
         title: 'Add Image View', breadcrumb: [
           {
             label: 'Dashboard',
             url: '/admin/dashboard'
           },
           {
             label: 'Image View Master',
             url: '/admin/image-view-master'
           },
           {
             label: 'Add Image View',
             url: ''
           }
         ]
       }
    },
    {
      path : 'edit-image-view',
      component : AddImageViewComponent,
      data: {
        data : [permissionTask.imageViewEdit],
       title: 'Edit Image View', breadcrumb: [
         {
           label: 'Dashboard',
           url: '/admin/dashboard'
         },
         {
          label: 'Image View Master',
          url: '/admin/image-view-master'
        },
        {
          label: 'Edit Image View',
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
export class ImageViewMasterRoutingModule { }
