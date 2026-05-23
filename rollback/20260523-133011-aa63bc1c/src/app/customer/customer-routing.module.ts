import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponent } from './customer.component';
import { ProductConfiguratorDetailComponent } from './product-configurator-detail/product-configurator-detail.component';
import { CategoryComponent } from './category/category.component';
const routes: Routes = [
  {
    path: '',
    component: CustomerComponent,
    children: [
      {
        path: '',
        redirectTo: 'category',
        pathMatch: 'full'
      },
      { path: 'category', component: CategoryComponent, data: { title: 'Product Category', role: 'ROLE_USER' } },
      { path: 'product', component: ProductConfiguratorDetailComponent, data: { title: 'Product Configurator', role: 'ROLE_USER' } },
    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
