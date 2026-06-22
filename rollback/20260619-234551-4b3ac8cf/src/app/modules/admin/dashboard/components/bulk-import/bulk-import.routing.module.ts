import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BulkImportComponent } from './bulk-import.component';
import { ProductsImportComponent } from './products-import/products-import.component';
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
       path : '',
       component : BulkImportComponent,
       data: {
        data : [permissionTask.bulkUploadAdd],
        title: 'Bulk Product Import', breadcrumb: [
          {
            label: 'Dashboard',
            url: '/admin/dashboard'
          },
          {
            label: 'Bulk Product Import',
            url: ''
          }
        ]
      }
    },
    {
      path : 'products-import',
      component : ProductsImportComponent,
      data: {
      data : [permissionTask.bulkUploadAdd],
       title: 'Bulk Product Import', breadcrumb: [
        {
          label: 'Dashboard',
          url: '/admin/dashboard'
        },
        {
          label: 'Bulk Product Import',
          url: '/admin/bulk-import'
        },
        {
          label: 'Products Import',
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
export class BulkImportRoutingModule { }
