import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { AttributeMasterService } from 'src/app/core/service/attribute-master.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { forkJoin, Subject } from "rxjs";
import { debounceTime } from 'rxjs/operators';
import { HttpService } from 'src/app/core/service/http.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { permissionTask } from 'src/app/core/constants/permission-enum';
@Component({ 
  selector: 'app-attribute-master',
  templateUrl: './attribute-master.component.html',
  styleUrls: ['./attribute-master.component.scss']
})
export class AttributeMasterComponent implements OnInit {
  attributeData : any = []
  search_text: string = ''
  search_status: any = -1
  articleData : any = [] 
  article_search : any = 0
  itemsPerPage : number = 10
  page : number = 1
  attributesCount : any
  modelChanged: Subject<string> = new Subject<string>();
  AppConstants  : any  =  AppConstants
  permissionTask : any = permissionTask
  constructor(private router : Router,private articleMasterService : ArticleMasterService,private toastr : ToastrManager,private modalService : BsModalService,private attributeMasterService : AttributeMasterService,private httpService : HttpService) { 
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe(_searchText => {
        this.page = 1
        this.getAllAttributeMaster()
      });
  }

  ngOnInit(): void {
    this.httpService.getConfig().subscribe((config) => {
      this.itemsPerPage = config.itemPerPage;
    });
    this.getAllAttributeMaster()
    this.getArticleList(); 
  }

  editAttribute(attributeId : any)
  {
    this.router.navigate(['/admin/attribute-master/edit-attribute'],{ queryParams: {id: attributeId}})
  }

  getAllAttributeMaster()
  { 
    let get_image_views = this.attributeMasterService.imageViewList({"search": '',});
    let get_articles = this.articleMasterService.articleListDropdown({});
    forkJoin([get_image_views, get_articles]).subscribe(
      (res) => {
        let imageview_array: any = res[0];
        let article_array: any = res[1];
        this.getAttributeList(imageview_array?.data?.imageViews,article_array?.data?.articles)
    });
  }
 
  getAttributeList(image_view: any, article : any)
  {
    let request = {
      "page": this.page,
      "perPage": this.itemsPerPage,
      "search": this.search_text,
      "articleId": this.article_search, 
      "isActive": this.search_status
    }
    this.attributeMasterService.attributeList(request).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        this.attributeData = response?.data?.attributes;
        this.attributesCount = response?.data?.attributesCount
        
        this.attributeData.forEach((element : any)=> {
          element['ParentImageViewName'] = ''
          element['ParentArticleName'] = ''
        });
        this.attributeData.forEach((element : any)=> {
          article.forEach((parent_element : any)=> {
            if(element.ArticleId == parent_element.ArticleId)
            {
              element['ParentArticleName'] = parent_element.ArticleName
            }
          });
        
        });
        this.attributeData.forEach((element : any)=> {
          image_view.forEach((parent_element : any)=> {
            if(element.ImageViewId == parent_element.ImageViewId)
            {
              element['ParentImageViewName'] = parent_element.ImageViewName
            }
          });
        
        });

      
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }      
    })
  }

  deleteAttribute(attribute_id : any, attribute_name : any,articleId: any,IsConfigurable:any )
  {
    
    let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
      class: 'modal-sm' 
    }); 
    modalRef.content.mainHeading = AppConstants.DELETE_ATTRIBUTE;
    modalRef.content.subHeading = AppConstants.CONFIRM_DELETE_ATTRIBUTE;
    modalRef.content.buttonHeading1 = AppConstants.YES;
    modalRef.content.buttonHeading2 = AppConstants.NO;
    modalRef.content.title = attribute_name;
    modalRef.content.OnClose.subscribe((result: any) => {
      if (result == AppConstants.YES) {
        this.attributeMasterService.deleteAttribute({attributeId : attribute_id , articleId : articleId,isConfigurable:IsConfigurable}).subscribe(response=>{
          if(response && response.type == AppConstants.success)
          {
            let index = this.attributeData.findIndex((x : any) => x.AttributeId ==attribute_id);
            this.attributeData.splice(index,1)
            this.toastr.successToastr(AppConstants.ATTRIBUTE_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
          else 
          {
            this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
        })
      }
    });
}

getArticleList()
  {
    
    this.articleMasterService.articleListDropdown({}).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        if(response?.data?.articles.length > 0)
        {
          this.articleData = response?.data?.articles;
        }
        else 
        {
          this.articleData = []
        }
        
      }
      else 
      {
        this.articleData = []
      }      
    }) 
  } 

  searchByArticle(_event : any)
  {
    this.page = 1
    this.itemsPerPage = 5000
    this.getAllAttributeMaster()
  }

  searchByName(_value: any) {
    this.page = 1
    this.getAllAttributeMaster()
  }

  searchByStatus(_value: any) {
  this.page = 1
    this.getAllAttributeMaster()
  }

  prodcut_search(event: any) {
    this.modelChanged.next(event.target.value);

  }

  pageChanged(event: any)
  { 
    this.page = event
    this.getAllAttributeMaster()
  }


  drop(event: CdkDragDrop<string[]>) {
    if(this.article_search == 0 || this.article_search == undefined || this.article_search == '' || this.article_search == null)
    {
      this.toastr.errorToastr(AppConstants.SELECT_ARTICLE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      return;

    }
    
    if(event.previousContainer === event.container && this.attributeData && this.attributeData?.length > 1) {
      moveItemInArray(this.attributeData, event.previousIndex, event.currentIndex);
      let update_attribute_order : any = []
      this.attributeData?.forEach((element : any) => {
        update_attribute_order.push({
          articleId : element?.ArticleId,
          attributeId : element?.AttributeId
        })
      });
      this.updateOrder(update_attribute_order)
    }
  }

  updateOrder(attribute_order : any)
  {
    let request = {
      "attributesArray":attribute_order
    }
    this.attributeMasterService.updateAttributeOrder(request).subscribe((response : any)=>{
      if(response && response?.type == AppConstants.success)
      {
        return;
      }
    });
  }
}
