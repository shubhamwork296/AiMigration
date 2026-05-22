import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleMasterService } from 'src/app/core/service/role-master.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { permissionTask } from 'src/app/core/constants/permission-enum';
import { UserRoleMappingService } from 'src/app/core/service/user-role-mapping.service';
@Component({
  selector: 'app-user-role-mapping',
  templateUrl: './user-role-mapping.component.html',
  styleUrls: ['./user-role-mapping.component.scss']
})
export class UserRoleMappingComponent implements OnInit {
 
  page : number = 1;
  userData : any = []
  search_text : string  = ''
  search_status : any = -1
  itemsPerPage : number = 10
  totalItemsCount  : any
  modelChanged: Subject<string> = new Subject<string>();
  AppConstants  : any  =  AppConstants
  roleData : any = []
  role_search : any = 0
  permissionTask: any = permissionTask
  userRoleMappingService! : UserRoleMappingService
  roleMasterSevice! : RoleMasterService
  constructor(private router : Router,private toastr : ToastrManager,private modalService : BsModalService,private httpService: HttpService,private injector : Injector) { 
    this.userRoleMappingService = injector.get<UserRoleMappingService>(UserRoleMappingService);
    this.roleMasterSevice = injector.get<RoleMasterService>(RoleMasterService);
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe(_searchText => {
        this.page = 1
        this.getUserList()
      }); 
  }

  ngOnInit(): void {
    this.httpService.getConfig().subscribe((config) => {
      this.itemsPerPage = config.itemPerPage;
    });
    
    this.getRoleList()
  } 

  editRole(articleId : any)
  {
    this.router.navigate(['/admin/user-role-mapping/edit-user-role'],{ queryParams: {id: articleId}})
  }

  getUserList()
  {
    let request = {
      "page": this.page,
      "perPage": this.itemsPerPage,
      "search": this.search_text,
      "isActive": this.search_status,
      "roleId" : this.role_search
    }
    this.userRoleMappingService.usersList(request).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        response?.data?.users.forEach((parent_element : any)=> {
          let role =  this.roleData.find((element : any)=>parent_element.RoleId == element.RoleId)
          if(role)
          {
            parent_element['roleName'] = role.RoleName
          }
          else{
            parent_element['roleName'] = ''
          }

          if(role.RoleId == AppConstants.defaultAdminRoleId)
          {
            parent_element['action'] = 0
          }
          else{
            parent_element['action'] = 1
          }
        });
       
        this.userData = response?.data?.users;
        this.totalItemsCount =  response?.data?.userCount

       
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }      
    })
  }

  deleteRole(user_id : any, user_name : any)
    {
      let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
        class: 'modal-sm' 
      }); 
      modalRef.content.mainHeading = AppConstants.DELETE_USER;
      modalRef.content.subHeading = AppConstants.CONFIRM_USER;
      modalRef.content.buttonHeading1 = AppConstants.YES;
      modalRef.content.buttonHeading2 = AppConstants.NO;
      modalRef.content.title = user_name;
      modalRef.content.OnClose.subscribe((result: any) => {
        if (result == AppConstants.YES) {
          this.userRoleMappingService.deleteUser({userId : user_id}).subscribe(response=>{
            if(response && response.type == AppConstants.success)
            {
              let index = this.userData.findIndex((x : any) => x.UserId ==user_id);
              this.userData.splice(index,1)
              this.toastr.successToastr(AppConstants.USER_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
            }
            else 
            {
              this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
            }
          })
        }
      });
  }
  
  pageChanged(event: any)
  { 
    this.page = event
    this.getUserList()
  }

  searchByName(_value : any)
  {
    this.page = 1
    this.getUserList()
  }

  searchByStatus(_value :any)
  {
    this.page = 1
    this.getUserList()
  }

  searchByRole(_event : any)
  {
    this.page = 1
 
    this.getUserList()
  }

  prodcut_search(event : any) { 
    this.modelChanged.next(event.target.value);

  }

  getRoleList()
  {
    
    this.roleMasterSevice.roleListDropdown({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        if(response?.data?.roles.length > 0)
        {
          this.roleData = response?.data?.roles;
          this.getUserList()
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
