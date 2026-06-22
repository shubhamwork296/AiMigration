import { Component, OnInit } from '@angular/core';
import { CategoryMasterService } from 'src/app/core/service/category-master.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { Router } from '@angular/router';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { forkJoin,Subject } from "rxjs";
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { permissionTask } from 'src/app/core/constants/permission-enum';
@Component({
  selector: 'app-category-master',
  templateUrl: './category-master.component.html',
  styleUrls: ['./category-master.component.scss']
})
export class CategoryMasterComponent implements OnInit {

  categoryData: any = []
  search_text: string = ''
  search_status: any = -1
  articleData : any = []
  article_search : any = 0
  itemsPerPage : number = 10
  page : number = 1
  modelChanged: Subject<string> = new Subject<string>();
  totalItemsCount  : any
  AppConstants  : any  =  AppConstants
  permissionTask : any = permissionTask
  constructor(private categorMasterService: CategoryMasterService, private toastr: ToastrManager, private router: Router, private modalService: BsModalService, private articleMasterService: ArticleMasterService,private httpService : HttpService) {
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe(_searchText => {
        this.page = 1
        this.getAllCategoryMaster()
      });
  }

  ngOnInit(): void {
    this.httpService.getConfig().subscribe((config) => {
      this.itemsPerPage = config.itemPerPage;
    });
    this.getAllCategoryMaster();
    this.getArticleList(); 
  }

  getAllCategoryMaster() {
    let get_categories = this.categorMasterService.categoryListDropdown({});
    let get_articles = this.articleMasterService.articleListDropdown({});
    forkJoin([get_categories, get_articles]).subscribe(
      (res) => {
        let category_array: any = res[0];
        let article_array: any = res[1];
        this.getCategoryList(category_array?.data?.categories, article_array?.data?.articles)
      });
  }

  getCategoryList(parent_category: any, parent_articles: any) {
    let request = {
      "page": this.page,
      "perPage": this.itemsPerPage,
      "search": this.search_text,
      "articleId": this.article_search,
      "isActive": this.search_status
    }
    this.categorMasterService.categoryList(request).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.categoryData = response?.data?.categories;
        this.totalItemsCount = response?.data?.categoriesCount
        this.categoryData.forEach((element: any) => {
          element['ParentCategoryName'] = ''
          element['ParentArticleName'] = ''
        });
        this.categoryData.forEach((element: any) => {
          parent_category.forEach((parent_element: any) => {
            if (element.ParentCategoryId == parent_element.CategoryId) {
              element['ParentCategoryName'] = parent_element.CategoryName
            }
          });
        });

        this.categoryData.forEach((element: any) => {
          parent_articles.forEach((parent_element: any) => {
            if (element.ArticleId == parent_element.ArticleId) {
              element['ParentArticleName'] = parent_element.ArticleName
            }
          });

        });
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  editCategory(categoryId: any) {
    this.router.navigate(['/admin/category-master/edit-category'], { queryParams: { id: categoryId } })
  }

  deleteCadtegory(category_id: any, category_name: any) {
    let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
      class: 'modal-sm'
    });
    modalRef.content.mainHeading = AppConstants.DELETE_CATEGORY;
    modalRef.content.subHeading = AppConstants.CONFIRM_DELETE_CATEGORY;
    modalRef.content.buttonHeading1 = AppConstants.YES;
    modalRef.content.buttonHeading2 = AppConstants.NO;
    modalRef.content.title = category_name;
    modalRef.content.OnClose.subscribe((result: any) => {
      if (result == AppConstants.YES) {
        this.categorMasterService.deleteCategory({ categoryId: category_id }).subscribe(response => {
          if (response && response.type == AppConstants.success) {
            let index = this.categoryData.findIndex((x: any) => x.CategoryId == category_id);
            this.categoryData.splice(index, 1)
            this.toastr.successToastr(AppConstants.CATEGORY_DELETED, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
          else {
            this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
        })
      }
    });
  }

  searchByName(_value: any) {
    this.page = 1
    this.getAllCategoryMaster()
  }

  searchByStatus(_value: any) {
    this.page = 1
    this.getAllCategoryMaster()
  }

  prodcut_search(event: any) {
    this.modelChanged.next(event.target.value);

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
    this.getAllCategoryMaster()
  }

  pageChanged(event: any)
  { 
    this.page = event
    this.getAllCategoryMaster()
  }
}
