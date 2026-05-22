import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { RoleMasterService } from 'src/app/core/service/role-master.service';
import { UserRoleMappingService } from 'src/app/core/service/user-role-mapping.service';
@Component({
  selector: 'app-add-role',
  templateUrl: './add-role.component.html',
  styleUrls: ['./add-role.component.scss']
})
export class AddRoleComponent implements OnInit {
  submitted: boolean = false;
  AddRoleForm!: FormGroup;
  id: any = 0
  AppConstants: any = AppConstants
  IsVisible: boolean = false;
  modules :any = []
  permission_ids : any  = []
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private roleMasterService: RoleMasterService, private toastr: ToastrManager, private router: Router,private userRoleMappingService : UserRoleMappingService) {
    this.route.queryParams.subscribe(params => {

      if (params['id']) {
        this.id = params['id']
      }
    });
    this.AddRoleForm = this.formBuilder.group({
      roleId: [this.id ? this.id : 0],
      roleName: ['', Validators.required],
      isActive: [1, [Validators.required]],
      permissions : []
    });
  }

  ngOnInit(): void {
    this.getAllPermissions()
   
  }

  // convenience getter for easy access to form fields
  get f() { return this.AddRoleForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.AddRoleForm.controls[controlName].hasError(errorName);
  }

  onSubmit() {
    this.submitted = true;
    this.AddRoleForm.controls['roleId'].setValue(this.id ? this.id : 0);
    this.AddRoleForm.controls['permissions'].setValue(this.permission_ids);
    if (this.AddRoleForm.invalid) {
      return;
    }
    
    this.addRole()
  }

  addRole() { 
    this.roleMasterService.addRole(this.AddRoleForm.value).subscribe(res => {
      if (res && res?.type == AppConstants.success) {
        this.submitted = false;
        this.toastr.successToastr((this.id > 0 ? AppConstants.ROLE_UPDATE : AppConstants.ROLE_ADD), AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/role-module-permission'])
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  getRoleList(id: any) {
    this.roleMasterService.roleList({ roleId: id, "search": '' }).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.AddRoleForm.controls['roleId'].setValue(response?.data?.roles[0].RoleId);
        this.AddRoleForm.controls['roleName'].setValue(response?.data?.roles[0].RoleName);
        this.AddRoleForm.controls['isActive'].setValue(response?.data?.roles[0].IsActive);
        this.permission_ids = response?.data?.permissions
        this.updatePermissionDetails(response?.data?.permissions)
      }
    })
  }

  updatePermissionDetails(permissions : any)
  {
    permissions.forEach((element : any) => {
      this.modules.forEach((modules : any,index : any) => {
        modules.permission.forEach((permission: any) => {
          if(permission.id == element)
          {
            permission.is_checked = 1
            this.checkViewPermision(index)
          }
        });
      });
    });
  }

  cancel() {
    this.router.navigate(['/admin/role-module-permission'])
  }

  getAllPermissions()
  {
    this.userRoleMappingService.getPermissions().subscribe((response: any)=>{
      if(response && response.type == AppConstants.success)
      {
        response?.data?.modules?.forEach((element : any) => {
          element?.permission?.forEach((sub_element : any) => {
            sub_element['is_checked'] = 0;
            sub_element['is_disabled'] = 0;
          });  
        });
        this.modules = response?.data?.modules;
        if (this.id > 0) {
          this.getRoleList(this.id)
        }
      }
      else{
        this.modules = []
      }
    })
  } 

  checkPermissionBySlug(slug : any,permissions : any){
    let is_permission_available : boolean = false;
    let permission = permissions.findIndex((ele : any)=>ele.permission_slug == slug)
    if(permission > -1)
    {
      is_permission_available = true;
    }
    
    return is_permission_available;
  }

  getCheckedPermission(slug : any,permissions: any)
  {
    let is_checked : any = 0;
    let permission = permissions.find((ele : any)=>ele.permission_slug == slug)
    if(permission)
    {
      is_checked = permission.is_checked
    }
    return is_checked;
  }

  getDisabledPermission(slug : any,permissions: any)
  {
    let is_disabled : any = 0;
    let permission = permissions.find((ele : any)=>ele.permission_slug == slug)
    if(permission)
    {
      is_disabled = permission.is_disabled
    }
    return is_disabled;
  }

  getPermissions(event : any,slug : any,permissions: any,index : any)
  {
    let permission = permissions.find((ele : any)=>ele.permission_slug == slug)
    if(permission)
    {
      permission.is_checked = (event.target.checked ? 1 : 0);
      if(event.target.checked)
      {
        this.permission_ids.push(permission.id)
      }
      else{
        let permission_index =  this.permission_ids.findIndex((element : any)=> element == permission.id)
        this.permission_ids.splice(permission_index,1);
      }
    }

    this.checkViewPermision(index)
  }

  checkViewPermision(index : any)
  {
    let module_permission =  this.modules[index]
    let chekedPermission =  module_permission.permission.find((element : any)=>((element.permission_slug ==  AppConstants.PERMISSION_ADD_SLUG && element.is_checked == 1) || (element.permission_slug ==  AppConstants.PERMISSION_EDIT_SLUG && element.is_checked == 1)|| (element.permission_slug ==  AppConstants.PERMISSION_DELETE_SLUG && element.is_checked == 1)))
    if(chekedPermission){
    let view_permission_checked = module_permission.permission.find((sub_element : any)=>(sub_element.permission_slug ==  AppConstants.PERMISSION_VIEW_SLUG))
    if(view_permission_checked)
    {
      view_permission_checked.is_checked = 1;
      view_permission_checked.is_disabled = 1;
      let permission =  this.permission_ids.findIndex((element : any)=> element == view_permission_checked.id)
  
      if(permission == -1)
      {
        this.permission_ids.push(view_permission_checked.id)
      }
    }
    }
    else{
    let view_permission_disabled = module_permission.permission.find((sub_element : any)=>(sub_element.permission_slug ==  AppConstants.PERMISSION_VIEW_SLUG && sub_element.is_disabled == 1))
    if(view_permission_disabled)
    {
      view_permission_disabled.is_disabled = 0;
    }
    }
    
  }
}
 