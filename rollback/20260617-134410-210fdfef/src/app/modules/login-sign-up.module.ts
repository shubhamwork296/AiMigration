import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { AngularMaterialModule } from "../material/material-module";
import { SharedModule } from "./shared.module";
import { LoginSignUpRoutingModule } from "../route/login-sign-up-routing-module";
import { LoginComponent } from "../Component/login-page/login/login.component";
import { ForgotComponent } from "../Component/forgot/forgot.component";
import { RegistrationComponent } from "../Component/registration/registration.component";
import { ResetPasswordComponent } from "../Component/reset-password/reset-password.component";

@NgModule({
    declarations: [LoginComponent, ForgotComponent, RegistrationComponent, ResetPasswordComponent],
    imports: [CommonModule, LoginSignUpRoutingModule,AngularMaterialModule, SharedModule, ReactiveFormsModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginSignUpModule {

}