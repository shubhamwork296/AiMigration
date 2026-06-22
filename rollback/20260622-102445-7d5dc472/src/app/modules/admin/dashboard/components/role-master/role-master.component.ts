import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { RoleMasterService } from 'src/app/core/service/role-master.service';
import { SessionService } from 'src/app/core/service/session.service';
import { permissionTask } from 'src/app/core/constants/permission-enum';
@Component({
  selector: 'app-role-master',
  templateUrl: './role-master.component.html',
  styleUrls: ['./role-master.component.scss']
})
export class RoleMasterComponent implements OnInit {

  page : number = 1;
  roleData : any = []
  search_text : string  = ''
  search_status : any = -1
  itemsPerPage : number = 10
  totalItemsCount  : any
  modelChanged: Subject<string> = new Subject<string>();
  AppConstants  : any  =  AppConstants
  permissionTask : any = permissionTask
  constructor(private router : Router,private roleMasterService : RoleMasterService,private toastr : ToastrManager,private modalService : BsModalService,private httpService: HttpService,private sessionService : SessionService ) { 
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe(_searchText => {
        this.page = 1
        this.getRoleList()
      });
  }

  ngOnInit(): void {
    this.httpService.getConfig().subscribe((config) => {
      this.itemsPerPage = config.itemPerPage;
    });
    this.getRoleList()
  } 

  editRole(roleId : any)
  {
    this.router.navigate(['/admin/role-module-permission/edit-role-module'],{ queryParams: {id: roleId}})
  }

  getRoleList()
  {
    let request = {
      "page": this.page,
      "perPage": this.itemsPerPage,
      "search": this.search_text,
      "isActive": this.search_status
    }
    this.roleMasterService.roleList(request).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        response?.data?.roles?.forEach((element : any) => {
          if(element.RoleId == AppConstants.defaultAdminRoleId)
          {
            element['action'] = 0
          }
          else{
            element['action'] = 1
          }
        });
        this.roleData = response?.data?.roles; 
        this.totalItemsCount =  response?.data?.rolesCount
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }      
    })
  }

  deleteRole(article_id : any, role_name : any)
    {
      let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
        class: 'modal-sm' 
      }); 
      modalRef.content.mainHeading = AppConstants.DELETE_ROLE;
      modalRef.content.subHeading = AppConstants.CONFIRM_ROLE;
      modalRef.content.buttonHeading1 = AppConstants.YES;
      modalRef.content.buttonHeading2 = AppConstants.NO;
      modalRef.content.title = role_name;
      modalRef.content.OnClose.subscribe((result: any) => {
        if (result == AppConstants.YES) {
          this.roleMasterService.deleteRole({roleId : article_id}).subscribe(response=>{
            if(response && response.type == AppConstants.success)
            {
              let index = this.roleData.findIndex((x : any) => x.RoleId ==article_id);
              this.roleData.splice(index,1)
              this.toastr.successToastr(AppConstants.ROLE_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
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
    this.getRoleList()
  }

  searchByName(_value : any)
  {
    this.page = 1
    this.getRoleList()
  }

  searchByStatus(_value :any)
  {
    this.page = 1
    this.getRoleList()
  }

  prodcut_search(event : any) { 
    this.modelChanged.next(event.target.value);

  }

}
