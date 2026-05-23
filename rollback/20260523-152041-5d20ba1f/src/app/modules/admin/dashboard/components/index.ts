// IMPORT COMPONENTS
import { MyDashboardComponent } from './my-dashboard/my-dashboard.component';
import { AddProductComponent } from './add-product/add-product.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { SettingsComponent } from './settings/settings.component';
import { GenerateQrComponent } from './generate-qr/generate-qr.component';

// SET COMPONENTS INTO ARRAY
export const components: any[] =
    [
        MyDashboardComponent,
        AddProductComponent,
        MyProfileComponent,
        ChangePasswordComponent,
        EditProfileComponent,
        SettingsComponent,
        GenerateQrComponent
    ];
    
//EXPORT COMPONENTS
// export * from './my-dashboard/my-dashboard.component';
// export * from './add-product/add-product.component';