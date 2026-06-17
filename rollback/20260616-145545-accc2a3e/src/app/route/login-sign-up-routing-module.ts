import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from "../Component/login-page/login/login.component";
import { ForgotComponent } from "../Component/forgot/forgot.component";
import { RegistrationComponent } from "../Component/registration/registration.component";
import { ResetPasswordComponent } from "../Component/reset-password/reset-password.component";

const routes : Routes = [
    { pathMatch: "full", path: "login", component: LoginComponent },
    { pathMatch: "full", path: "forgotten-password", component: ForgotComponent },
    { pathMatch: "full" ,path: "register", component: RegistrationComponent },
    { pathMatch: "full" , path: "reset-password", component: ResetPasswordComponent },
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LoginSignUpRoutingModule {

}