import { NgModule } from '@angular/core';
import { BulkImportRoutingModule } from './bulk-import.routing.module';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { BulkImportComponent } from './bulk-import.component';
import { ProductsImportComponent } from './products-import/products-import.component';
@NgModule({
  declarations: [
    BulkImportComponent,
    ProductsImportComponent
  ],
  imports: [
    BulkImportRoutingModule,
    SharedModule, 
    RouterModule
  ],exports:[ 

  ]
}) 
export class BulkImportModule { }
