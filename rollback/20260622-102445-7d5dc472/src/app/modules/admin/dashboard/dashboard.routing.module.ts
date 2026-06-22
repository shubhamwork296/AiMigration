import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component'
import { MyDashboardComponent } from './components/my-dashboard/my-dashboard.component'
import { AddProductComponent } from './components/add-product/add-product.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { MyProfileComponent } from './components/my-profile/my-profile.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { GenerateQrComponent } from './components/generate-qr/generate-qr.component';
import { AuthGuardChild } from 'src/app/core/guard/auth.gurad.child';
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
        path: '', 
        component: DashboardComponent,
        canActivateChild : [AuthGuardChild],
        children :[
          { 
            path : 'dashboard',
            component : MyDashboardComponent,
            
          },
          {
            path : 'add-product',
            component : AddProductComponent,
            data: {
              data : [permissionTask.productsAdd],
              title: 'Add Product', breadcrumb: [
                {
                  label: 'Dashboard',
                  url: '/admin/dashboard'
                },
                {
                  label: 'Add Product',
                  url: ''
                }
              ],
          
            }
          },
          {
            path : 'edit-product',
            component : AddProductComponent,
            data: {
              data : [permissionTask.productsEdit],
              title: 'Edit Product', breadcrumb: [
                {
                  label: 'Dashboard',
                  url: '/admin/dashboard'
                },
                {
                  label: 'Edit Product',
                  url: ''
                }
              ]
            }
          },
          {
            path : 'edit-profile',
            component : EditProfileComponent,
            data: {
              title: 'Edit Profile', breadcrumb: [
                {
                  label: 'Dashboard',
                  url: '/admin/dashboard'
                },
                {
                  label: 'Edit Profile',
                  url: ''
                }
              ]
            }
          },
          {
            path : 'my-profile',
            component : MyProfileComponent,
            data: {
              title: 'My Profile', breadcrumb: [
                {
                  label: 'Dashboard',
                  url: '/admin/dashboard'
                },
                {
                  label: 'My Profile',
                  url: ''
                }
              ]
            }
          },
          {
            path : 'change-password',
            component : ChangePasswordComponent,
            data: {
              title: 'Change Password', breadcrumb: [
                {
                  label: 'Dashboard',
                  url: '/admin/dashboard'
                },
                {
                  label: 'Change Password',
                  url: ''
                }
              ]
            }
          },
          {
            path : 'manage-setting',
            component : SettingsComponent,
            data: {
              title: 'Setting', breadcrumb: [
                {
                  label: 'Dashboard',
                  url: '/admin/dashboard'
                },
                {
                  label: 'Manage Settings',
                  url: ''
                }
              ]
            }
          },
          {
            path: 'article-master',
            loadChildren: () =>
              import('src/app/modules/admin/dashboard/components/article-master/article-master.module').then(m => m.ArticleMasterModule)
          },
          {
            path: 'category-master',
            loadChildren: () =>
              import('src/app/modules/admin/dashboard/components/category-master/category-master.module').then(m => m.CategoryMasterModule)
          },
          {
            path: 'attribute-master',
            loadChildren: () =>
              import('src/app/modules/admin/dashboard/components/attribute-master/attribute-master.module').then(m => m.AttributeMasterModule)
          },
          {
            path: 'image-view-master',
            loadChildren: () =>
            import('src/app/modules/admin/dashboard/components/image-view-master/image-view.module').then(m => m.ImageViewMasterModule)
          },
          {
            path: 'bulk-import',
            loadChildren: () =>
              import('src/app/modules/admin/dashboard/components/bulk-import/bulk-import.module').then(m => m.BulkImportModule)
          },
          {
            path: 'role-module-permission',
            loadChildren: () =>
              import('src/app/modules/admin/dashboard/components/role-master/role-master.module').then(m => m.RoleMasterModule)
          },
          {
            path: 'user-role-mapping',
            loadChildren: () =>
              import('src/app/modules/admin/dashboard/components/user-role-mapping/user-role-mapping.module').then(m => m.UserRoleMappingMasterModule)
          },
          {
            path : 'generate-qr',
            component : GenerateQrComponent,
            data: {
              data : [permissionTask.generateQrView],
              title: 'Setting', breadcrumb: [
                {
                  label: 'Dashboard',
                  url: '/admin/dashboard'
                },
                {
                  label: 'Generate QR',
                  url: ''
                }
              ]
            }
          },
        ] 
        
    } 
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
