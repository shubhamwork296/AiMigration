import { Component, OnInit } from '@angular/core';
import { ToastrManager } from 'ng6-toastr-notifications';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { CategoryMasterService } from 'src/app/core/service/category-master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit {
  is_image_upload : boolean = false;
  category_image : any =[]
  product_base64_images : any = ''
  categoryForm!: FormGroup;
  submitted :  boolean = false;
  articleData : any = []
  categoryData : any = []
  id : any = 0
  articleId : any = '';
  parentCategoryId : any = '';
  imageUrl : any = ''
  AppConstants : any  = AppConstants
  constructor(private toastr : ToastrManager,private formBuilder : FormBuilder,private articleMasterService : ArticleMasterService,private categoryMasterService : CategoryMasterService,private router : Router,private route : ActivatedRoute,private httpService : HttpService) { 
    this.route.queryParams.subscribe(params => {

      if (params['id']) { 
        this.id = params['id']
      }
    }); 
    this.categoryForm = this.formBuilder.group({
      categoryId : [this.id ? this.id : 0],
      categoryName: ['', Validators.required],
      articleId : ['', Validators.required],
      parentCategoryId : [0],
      categoryDescription : ['', [Validators.required]],
      isActive : [1,[Validators.required]]
    });
  }

  ngOnInit(): void { 
    this.httpService.getConfig().subscribe((config) => {
      this.imageUrl = config.imageUrl;
    })
    this.getArticleList();
   
    this.setEnableDisableArticle()
  }

    // convenience getter for easy access to form fields
    get f() { return this.categoryForm.controls; }

    // check error
    public hasError = (controlName: string, errorName: string) => {
      return this.categoryForm.controls[controlName].hasError(errorName);
    }

    onSubmit() {
      this.is_image_upload = false;
      if(this.id > 0)
      {
        if(this.product_base64_images == "" && this.category_image.length == 0)
        {
          this.is_image_upload  = this.check_image_length();
        }
      }
      else 
      {
        this.is_image_upload  = this.check_image_length();
      }
      this.submitted = true;
    
      if (this.categoryForm.invalid || this.is_image_upload) {
        return;
      }
      this.categoryForm.controls['articleId'].setValue(this.categoryForm.get('articleId')?.value ?this.categoryForm.get('articleId')?.value : 0);
      this.categoryForm.controls['categoryId'].setValue(this.id ?this.id : 0);
      this.addCategorySubmit()

    }

    addCategorySubmit()
    {
      const formData = new FormData;
      formData.append('categoryId',this.categoryForm?.get('categoryId')?.value)
      formData.append('categoryName',this.categoryForm?.get('categoryName')?.value)
      formData.append('categoryDescription',this.categoryForm?.get('categoryDescription')?.value)
      formData.append('articleId',this.categoryForm?.get('articleId')?.value)
      formData.append('parentCategoryId',this.categoryForm?.get('parentCategoryId')?.value)
      formData.append('isActive',this.categoryForm?.get('isActive')?.value)
      if(this.category_image.length > 0)
      {
        formData.append('categoryImage',this.category_image[0])
      }

      this.categoryMasterService.addCategory(formData).subscribe(res=>{
        if(res && res?.type == AppConstants.success)
        { 
          this.submitted = false;
          this.toastr.successToastr((this.id > 0 ? AppConstants.CATEGORY_UPDATED: AppConstants.CATEGORY_ADD), AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          this.router.navigate(['/admin/category-master'])
        }
        else 
        {
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      })
    }

    check_image_length() : boolean {
      if(this.category_image.length > 0)
      {
        return false;
      }
      else
      {
        return true;
      }
    }

    uploadAttachment($event: any) {
      if (($event.target.files).length === 0) {
        return; 
      }
      let mimeType = $event.target.files[0].type;
      if (mimeType.match(/image\/*/) != null) { 
        if(!AppConstants.checkImageExtensionAllowed($event.target.files[0].name))
        {
          this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          return
        }
        
        if($event.target.files[0].name.indexOf(' ') == -1)
        {
          const URL = window.URL || window.webkitURL;
          const Img = new Image();
      
          const filesToUpload = ($event.target.files);
          Img.src = URL.createObjectURL(filesToUpload[0]);
          Img.onload = (e: any) => {
            this.uploadFile(filesToUpload,e,$event.target.files)
          }
          
        }
        else 
        {
          this.toastr.errorToastr(AppConstants.VALID_IMAGE_NAME, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      } else {
          this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    }



    uploadFile(filesToUpload : any,e : any,file: any)
    {
      let image_path = e.path || (e.composedPath && e.composedPath());
      const height = image_path[0].height;
      const width = image_path[0].width;     
      if ((filesToUpload[0].size / 1024 / 1024) <= 2  && (height <= 300 && width <=600))
      {
        let files = file;
        if (files && files[0]) { 
      
          const reader = new FileReader();
          reader.onload = (element: any) => {
            this.product_base64_images = element.target.result;
          };
          reader.readAsDataURL(files[0]);
        
        }
        this.is_image_upload = false;
        this.category_image.push(files[0])
      }
      else{
        this.toastr.errorToastr(AppConstants.CATEGORYIMAGE_VALIDATION, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    } 


    

    deleteImage(index: any)
    {
      this.product_base64_images ='';
      if(this.category_image.length > 0)
      {
        this.category_image.splice(index, 1);
      }
    }

    getArticleList()
    {
      this.articleMasterService.articleListDropdown({}).subscribe((response : any)=>{
        if(response && response.type == AppConstants.success)
        {
          if(response?.data?.articles.length > 0)
          {
            this.articleData = response?.data?.articles;
            this.getCategoryList(this.articleData);
          }
          else 
          {
            this.router.navigate(['/admin/article-master/add-article']);
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message,AppConstants.ADD_ATRICLE), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
          
        }
        else 
        {
          this.articleData = []
          this.router.navigate(['/admin/article-master/add-article']);
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message,AppConstants.ADD_ATRICLE), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }      
      }) 
    } 

    getCategoryList(articleData : any)
    {
      this.categoryMasterService.categoryListDropdown({}).subscribe((response : any)=>{
        if(response && response.type == AppConstants.success)
        {
          this.categoryData = response?.data?.categories;
          if(this.id > 0)
          {
            this.getCategoryListById(this.id,this.categoryData,articleData);
          }
        }
        else 
        {
          this.categoryData = []
        }      
      })
    }

    getCategoryListById(id : any, category_data : any,articleData : any)
    { 
      this.categoryMasterService.categoryList({categoryId : id,"search": ""}).subscribe((response : any)=>{
        if(response && response.type == AppConstants.success)
        {
          this.categoryForm.controls['categoryId'].setValue(response?.data?.categories[0].CategoryId);
          let article_idx = articleData.findIndex(
            (x : any) => x.ArticleId === response?.data?.categories[0].ArticleId
          );
          if (article_idx != -1) {
            this.categoryForm.controls['articleId'].setValue(response?.data?.categories[0].ArticleId);
          }
          else 
          {
            this.categoryForm.controls['articleId'].setValue('');
          }
          let idx = category_data.findIndex(
            (x : any) => x.CategoryId === response?.data?.categories[0].ParentCategoryId
          );
          // if we do not have index set slot to not available
          if (idx != -1) {
            this.categoryForm.controls['parentCategoryId'].setValue(response?.data?.categories[0].ParentCategoryId);
          }
          else 
          {
            this.categoryForm.controls['parentCategoryId'].setValue(0);
          }
         
          this.categoryForm.controls['categoryName'].setValue(response?.data?.categories[0].CategoryName);
          this.categoryForm.controls['categoryDescription'].setValue(response?.data?.categories[0].CategoryDescription);
          this.categoryForm.controls['isActive'].setValue(response?.data?.categories[0].IsActive);
          if(response?.data?.categories[0].Image)
          {
            this.product_base64_images = this.imageUrl+AppConstants.CATEGORY_IMAGE_FOLDER_NAME+response?.data?.categories[0].Image;
          }
          else 
          {
            this.product_base64_images = ''
          }

        }  
      })
    }
    cancle()
    {
      this.router.navigate(['/admin/category-master'])
    }

    setEnableDisableArticle()
    {
      if(this.id > 0)
      {
        this.categoryForm.get('articleId')?.disable();
      }
      else 
      {
        this.categoryForm.get('articleId')?.enable();
      }
    }
}
 