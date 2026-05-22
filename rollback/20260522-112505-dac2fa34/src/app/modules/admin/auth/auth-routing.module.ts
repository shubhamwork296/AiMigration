import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ForgetPasswordComponent } from './components/forget-password/forget-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
const routes: Routes = [
  {
    path: 'login', component: LoginComponent,
    data: {
      title: 'Home', breadcrumb: [
        {
          label: 'Home',
          url: '/home/login'
        },
        {
          label: 'Login',
          url: ''
        }
      ]
    }
  },
  {
    path: 'forget-password', component: ForgetPasswordComponent,
    data: {
      title: 'Home', breadcrumb: [
        {
          label: 'Home',
          url: '/home/login'
        },
        {
          label: 'Forget Password',
          url: ''
        }
      ]
    }
  },
  {
    path: 'reset-password/:string/:string/:string', component: ResetPasswordComponent,
    data: {
      title: 'Home', breadcrumb: [
        {
          label: 'Home',
          url: '/home/login'
        },
        {
          label: 'Reset Password',
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
export class AuthRoutingModule { }
