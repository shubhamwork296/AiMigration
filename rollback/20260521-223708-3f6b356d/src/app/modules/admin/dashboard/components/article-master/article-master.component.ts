import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants'; 
import { permissionTask } from 'src/app/core/constants/permission-enum';
@Component({
  selector: 'app-article-master',
  templateUrl: './article-master.component.html',
  styleUrls: ['./article-master.component.scss']
})
export class ArticleMasterComponent implements OnInit {
  page : number = 1;
  articleData : any = []
  search_text : string  = ''
  search_status : any = -1
  itemsPerPage : number = 10
  totalItemsCount  : any
  modelChanged: Subject<string> = new Subject<string>();
  AppConstants  : any  =  AppConstants
  permissionTask : any = permissionTask
  constructor(private router : Router,private route : ActivatedRoute,private articleMasterService : ArticleMasterService,private toastr : ToastrManager,private modalService : BsModalService,private httpService: HttpService) { 
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe(_searchText => {
        this.page = 1
        this.getArticleList()
      });
  }

  ngOnInit(): void {
    this.httpService.getConfig().subscribe((config) => {
      this.itemsPerPage = config.itemPerPage;
    });
    this.getArticleList()
  } 

  editArticle(articleId : any)
  {
    this.router.navigate(['/admin/article-master/edit-article'],{ queryParams: {id: articleId}})
  }

  getArticleList()
  {
    let request = {
      "page": this.page,
      "perPage": this.itemsPerPage,
      "search": this.search_text,
      "isActive": this.search_status
    }
    this.articleMasterService.articleList(request).subscribe((response : any)=>{
      if(response && response.type == AppConstants.success)
      {
        this.articleData = response?.data?.articles;
        this.totalItemsCount =  response?.data?.articlesCount
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }      
    })
  }

  deleteArticle(article_id : any, article_name : any)
    {
      let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
        class: 'modal-sm' 
      }); 
      modalRef.content.mainHeading = AppConstants.DELETE_ARTICLE;
      modalRef.content.subHeading = AppConstants.CONFIRM_DELETE;
      modalRef.content.buttonHeading1 = AppConstants.YES;
      modalRef.content.buttonHeading2 = AppConstants.NO;
      modalRef.content.title = article_name;
      modalRef.content.OnClose.subscribe((result: any) => {
        if (result == AppConstants.YES) {
          this.articleMasterService.deleteArticle({articleId : article_id}).subscribe(response=>{
            if(response && response.type == AppConstants.success)
            {
              let index = this.articleData.findIndex((x : any) => x.ArticleId ==article_id);
              this.articleData.splice(index,1)
              this.toastr.successToastr(AppConstants.ARTICLE_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
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
    this.getArticleList()
  }

  searchByName(_value : any)
  {
    this.page = 1
    this.getArticleList()
  }

  searchByStatus(_value :any)
  {
    this.page = 1
    this.getArticleList()
  }

  prodcut_search(event : any) { 
    this.modelChanged.next(event.target.value);

  }
}
