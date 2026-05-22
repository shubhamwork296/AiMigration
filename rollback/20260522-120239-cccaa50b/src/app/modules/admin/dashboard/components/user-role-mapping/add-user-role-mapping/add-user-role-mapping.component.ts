import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { RoleMasterService } from 'src/app/core/service/role-master.service';
import { UserRoleMappingService } from 'src/app/core/service/user-role-mapping.service';
@Component({
  selector: 'app-add-user-role-mapping',
  templateUrl: './add-user-role-mapping.component.html',
  styleUrls: ['./add-user-role-mapping.component.scss']
})
export class AddUserRoleMappingComponent implements OnInit {
  submitted: boolean = false;
  AddUserRoleForm!: FormGroup;
  id: any = 0
  AppConstants: any = AppConstants
  roleData : any = []
  is_password_match : boolean = false;
  currentEmailId : string = ''
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private articleMasterService: ArticleMasterService, private toastr: ToastrManager, private router: Router,private roleMasterService : RoleMasterService,private userRoleMappingService : UserRoleMappingService) {
    this.route.queryParams.subscribe(params => {

      if (params['id']) {
        this.id = params['id']
      }
    });
    this.AddUserRoleForm = this.formBuilder.group({
      userId: [this.id ? this.id : 0],
      userName: [{value : '',disabled : false},[Validators.required,Validators.maxLength(50)]],
      first_name : ['',[Validators.required,Validators.maxLength(50)]],
      last_name : ['',[Validators.required,Validators.maxLength(50)]], 
      email : [{value : '',disabled : false},[Validators.required,Validators.email,Validators.maxLength(100),Validators.pattern(AppConstants.EMAIL_REJEX)]],
      roleId : ['',[Validators.required]],
      isActive: [1, [Validators.required]],
      newPassword: ['', [Validators.required,Validators.minLength(8),Validators.pattern(AppConstants.PASSWORD_VALIDATOR)]],
      confirmPassword: ['', [Validators.required,Validators.minLength(8),Validators.pattern(AppConstants.PASSWORD_VALIDATOR)]],
    });
  } 

  ngOnInit(): void {
    this.getRoleList();
    
  }

  // convenience getter for easy access to form fields
  get f() { return this.AddUserRoleForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.AddUserRoleForm.controls[controlName].hasError(errorName);
  }

  onSubmit() {
    
    this.is_password_match = false;
    if(this.AddUserRoleForm.get('newPassword')?.value == this.AddUserRoleForm.get('confirmPassword')?.value)
    {
      this.is_password_match = false;
    } 
    else 
    {
      this.is_password_match = true;
    }
    this.submitted = true;
    this.AddUserRoleForm.controls['userId'].setValue(this.id ? this.id : 0);
    if (this.AddUserRoleForm.invalid || this.is_password_match) {
      return;
    }
   
    this.addUser()
   
  }

  addUser() {

    let request = {
      userId : this.AddUserRoleForm.get('userId')?.value,
      userName : this.AddUserRoleForm.get('userName')?.value,
      firstName : this.AddUserRoleForm.get('first_name')?.value,
      lastName : this.AddUserRoleForm.get('last_name')?.value,
      userEmail : this.AddUserRoleForm.get('email')?.value,
      roleId : this.AddUserRoleForm.get('roleId')?.value,
      password : this.AddUserRoleForm.get('confirmPassword')?.value,
      status : this.AddUserRoleForm.get('isActive')?.value,
      isEmail : AppConstants.checkUserChangeTheriEmail(this.currentEmailId,this.AddUserRoleForm.get('email')?.value) ? 1 : 0
    }
    if(this.id > 0){
      delete request.password
    }

    this.userRoleMappingService.addUserRole(request).subscribe(res => {
      if (res && res?.type == AppConstants.success) {
        this.submitted = false;
        this.toastr.successToastr((this.id > 0 ? AppConstants.USER_UPDATE : AppConstants.USER_ADD), AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/user-role-mapping'])
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  } 
  

  getUserList(id: any) {
    this.userRoleMappingService.usersList({ userId: id, "search": '',"roleId" : "0" }).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.AddUserRoleForm.controls['userId'].setValue(response?.data?.users[0].UserId);
        this.AddUserRoleForm.controls['userName'].setValue(response?.data?.users[0].UserName);
        this.AddUserRoleForm.controls['isActive'].setValue(response?.data?.users[0].IsActive);
        this.AddUserRoleForm.controls['email'].setValue(response?.data?.users[0].Email);
        this.currentEmailId = response?.data?.users[0].Email
        this.AddUserRoleForm.controls['first_name'].setValue(response?.data?.users[0].FirstName);
        this.AddUserRoleForm.controls['last_name'].setValue(response?.data?.users[0].LastName);
        
        let idx = this.roleData.findIndex(
          (x : any) => x.RoleId == response?.data?.users[0].RoleId
        );
        
        // if we do not have index set slot to not available
        if (idx != -1) {
          this.AddUserRoleForm.controls['roleId'].setValue(response?.data?.users[0].RoleId);
        }
        else 
        {
          this.AddUserRoleForm.controls['roleId'].setValue('');
        }
      }
    })
  }

  cancel() {
    this.router.navigate(['/admin/user-role-mapping'])
  }


  getRoleList()
  {
    
    this.roleMasterService.roleListDropdown({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        if(response?.data?.roles.length > 0)
        {
          this.roleData = response?.data?.roles;
          if (this.id > 0) {
            this.AddUserRoleForm.controls['newPassword']?.setValidators([])
            this.AddUserRoleForm.controls['newPassword']?.updateValueAndValidity();
            this.AddUserRoleForm.controls['confirmPassword']?.setValidators([])
            this.AddUserRoleForm.controls['confirmPassword']?.updateValueAndValidity();
            this.AddUserRoleForm.get('userName')?.disable();
            this.AddUserRoleForm.controls['userName']?.setValidators([])
            this.AddUserRoleForm.controls['userName']?.updateValueAndValidity();
            this.getUserList(this.id)
          }
        }
        else 
        {
          this.roleData = []
        }
        
      }
      else 
      {
        this.roleData = []
      }      
    }) 
  } 


 
}
