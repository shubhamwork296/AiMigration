import { Component, Inject, LOCALE_ID, OnInit, Injector } from '@angular/core';
import { HttpService } from 'src/app/core/service/http.service';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { CategoryMasterService } from 'src/app/core/service/category-master.service';
import { ProductService } from 'src/app/core/service/product.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import { SessionService } from 'src/app/core/service/session.service';
import {  debounceTime } from 'rxjs/operators';
import {  Subject } from 'rxjs';
import { DashboardService } from 'src/app/core/service/dashboard.service';
import { formatCurrency } from '@angular/common';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { permissionTask } from 'src/app/core/constants/permission-enum';
import { SessionKeys } from 'src/app/core/constants/session-keys';
@Component({
  selector: 'app-my-dashboard',
  templateUrl: './my-dashboard.component.html',
  styleUrls: ['./my-dashboard.component.scss']
})
export class MyDashboardComponent implements OnInit {
  productData : any = []
  defaultCurrency : any = AppConstants.DEFAULT_CURRENCY
  categoryData : any = []
  search_text : string  = ''
  search_status : any = -1
  category_search : any  = 0
  page : number = 1;
  itemsPerPage : number = 10
  totalItemsCount  : any
  modelChanged: Subject<string> = new Subject<string>();
  articlesCount : any;
  attributesCount : any; 
  categoriesCount : any;
  productsCount : any; 
  is_copy_product  : boolean = false;
  categoryMasterService! :  CategoryMasterService
  dashboardService! : DashboardService
  productService!  : ProductService
  sessionService! : SessionService
  AppConstants  : any  =  AppConstants
  permissionTask : any =  permissionTask
  modules : any= []
  constructor(private httpService: HttpService, private modalService: BsModalService,private router : Router,private injector : Injector,private toastr : ToastrManager,private broadCastService : BroadCasterService,@Inject(LOCALE_ID) public locale: string) { 
      this.categoryMasterService = injector.get<CategoryMasterService>(CategoryMasterService);
      this.dashboardService = injector.get<DashboardService>(DashboardService);
      this.productService = injector.get<ProductService>(ProductService);
      this.sessionService = injector.get<SessionService>(SessionService);
      this.broadCastService.on('currency').subscribe(cic => {
        this.defaultCurrency = String(cic);
      });
      this.modelChanged.pipe(
        debounceTime(800))
        .subscribe(_searchText => {
          this.page = 1
          this.getProductList(this.categoryData)
        });

      if(this.sessionService.getSession('current_page'))
      {
        this.page = this.sessionService.getSession('current_page')
        this.sessionService.deleteSession('current_page')
      } 
    }

  ngOnInit(): void {
    this.httpService.getConfig().subscribe((config) => {
      this.itemsPerPage = config.itemPerPage;
    });
    this.defaultCurrency = this.sessionService.getSession('currency');
    this.modules = this.sessionService.getSession(SessionKeys.User.ADMIN_MODULES_PERMISSIONS) || [];
    if(AppConstants.checkPermssionAvalible([permissionTask.productsView],this.modules))
    {
      this.getAllCategoryMaster();
    }
    this.getCounter();
  }
  

  deleteProduct(product_id : any, product_name : any,articel_id :any)
  {
    let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
      class: 'modal-sm' 
    }); 
    modalRef.content.mainHeading = AppConstants.DELETE_PRODUCT;
    modalRef.content.subHeading = AppConstants.CONFIRM_DELETE_PRODUCT;
    modalRef.content.buttonHeading1 = AppConstants.YES;
    modalRef.content.buttonHeading2 = AppConstants.NO;
    modalRef.content.title = product_name;
    modalRef.content.OnClose.subscribe((result: any) => {
      if (result == AppConstants.YES) {
        this.productService.deleteProduct({productId : product_id,articleId :articel_id}).subscribe(response=>{
          if(response && response.type == AppConstants.success)
          {
            this.getAllCategoryMaster();
            this.getCounter()
            this.toastr.successToastr(AppConstants.PRODUCT_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
          else 
          {
            this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
        })
      }
    });
  }

  editProduct(prouductId : any)
  {
    this.sessionService.setSession("current_page",this.page);
    this.router.navigate(['/admin/edit-product'],{ queryParams: {id: prouductId}})
  }

  getProductList(category_list: any)
  {
    let request = {
      "search": (this.search_text ? this.search_text : ''),
      "isActive": this.search_status,
      "categoryId": this.category_search,
      "page": this.page,
      "perPage": this.itemsPerPage
    }
    this.productService.productList(request).subscribe((res : any)=>{
      if(res && res.type == AppConstants.success)
      {
        this.productData = res?.data?.products
        this.totalItemsCount = res?.data?.productsCount
        this.productData.forEach((element : any)=> {
          element['ParentCategoryName'] = ''
        });

        this.productData.forEach((element : any)=> {
          category_list.forEach((parent_element : any)=> {
            if(element.CategoryId == parent_element.CategoryId)
            {
              element['ParentCategoryName'] = parent_element.CategoryName
            }
          });
        });
      }
    })
  }

  getAllCategoryMaster()
  {
    this.categoryMasterService.categoryListDropdown({}).subscribe((res : any) => {
      if(res && res.type == AppConstants.success)
      {
        this.categoryData = res?.data?.categories;
        this.getProductList(res?.data?.categories)
      }
      else 
      {
        this.categoryData = []
      } 
    }); 
  }
  


  searchByCategory(_event : any)
  {
    this.page = 1
    this.getProductList(this.categoryData)
  }

  searchByName(_value  : any){
    this.page = 1
    this.getProductList(this.categoryData)
  }

  prodcut_search(event : any) { 
    this.modelChanged.next(event.target.value);

  }

  pageChanged(event: any) 
  {
    this.page = event
    this.getAllCategoryMaster()
  }

  getCounter()
  {
    this.dashboardService.getDashboardStatistics({}).subscribe((response : any)=>{
      if(response && response?.type == AppConstants.success)
      {
        this.articlesCount = response?.data?.articlesCount
        this.attributesCount = response?.data?.attributesCount
        this.categoriesCount = response?.data?.categoriesCount
        this.productsCount = response?.data?.productsCount

      }
    })
  }

  copy_product(ProductId : any,name : any, ArticleId: any)
  {
    if(ProductId)
    {
      let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
        class: 'modal-sm',
        backdrop : 'static'
      }); 
      modalRef.content.mainHeading = AppConstants.COPY_PRODUCT;
      modalRef.content.subHeading = AppConstants.CONFIRM_COPY1;
      modalRef.content.buttonHeading1 = AppConstants.YES;
      modalRef.content.buttonHeading2 = AppConstants.NO;
      modalRef.content.title = name;
      modalRef.content.OnClose.subscribe((result: any) => {
        if (result == AppConstants.YES) {
          this.is_copy_product = false;
          let request = {
            productId : ProductId,
            ArticleId: ArticleId
          }
          this.copyCurrentProduct(request)
        }
        else 
        {
          this.is_copy_product = false;
        }
      });
    }
  }

  copyCurrentProduct(data : any)
  {
    this.productService?.copyProduct(data).subscribe((response : any)=>{
      if(response && response?.type == AppConstants.success)
      {
        this.getAllCategoryMaster();
        this.getCounter();
        this.toastr.successToastr(AppConstants.PRODUCT_COPIED, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
      else 
      {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  setDefaultCurrency(currency : any,price : any)
  {
    let update_currency : any = ''
    update_currency = formatCurrency(price,this.locale, currency).split(currency)[1]  
    return update_currency;
  }

  
} 
