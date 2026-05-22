import { Component, OnInit, Injector } from '@angular/core';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CategoryMasterService } from 'src/app/core/service/category-master.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from 'src/app/core/service/product.service';
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { HttpService } from 'src/app/core/service/http.service';
import { AttributeMasterService } from 'src/app/core/service/attribute-master.service';
import { ImageViewMasterService } from 'src/app/core/service/image-view-master.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { debounceTime, Subject } from 'rxjs';


interface Country {
  id: number;
  country_name: string;
  country_code: string;
}


@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit {
  is_image_upload: boolean = false;
  is_video_upload: boolean = false;
  product_base64_images: any = []
  productForm!: FormGroup;
  MatchingBandForm!: FormGroup;
  submitted: boolean = false;
  product_video: any = []
  videoUrl: any;
  id: any = 0;
  imageUrl: string = ''
  imageViewData: any = []
  updatedImageViewData: any = []
  updateAttributeData: any = []
  is_addmore_image_submit: boolean = false;
  is_attribute_add: boolean = false;
  is_copy_product: boolean = false;
  modelChanged: Subject<any> = new Subject<any>();
  articleMasterService!: ArticleMasterService
  attributeMasterService!: AttributeMasterService
  imageViewMasterService!: ImageViewMasterService
  productService!: ProductService
  categoryMasterService!: CategoryMasterService
  matchingBandSkuSubject: Subject<any> = new Subject<any>();
  AppConstants: any = AppConstants
  parentAttributeDtl: any = {};
  childAttribute: any = []
  matchingBandPodcuts: any = []
  countryData: Country[] = [];
  constructor(private toastr: ToastrManager, private formBuilder: FormBuilder, private router: Router, private route: ActivatedRoute, private httpService: HttpService, private modalService: BsModalService, private injector: Injector) {
    this.attributeMasterService = injector.get<AttributeMasterService>(AttributeMasterService);
    this.articleMasterService = injector.get<ArticleMasterService>(ArticleMasterService);
    this.imageViewMasterService = injector.get<ImageViewMasterService>(ImageViewMasterService);
    this.categoryMasterService = injector.get<CategoryMasterService>(CategoryMasterService);
    this.productService = injector.get<ProductService>(ProductService);
    this.route.queryParams.subscribe(params => {

      if (params['id']) {
        this.id = params['id']
      }
    });

    this.MatchingBandForm = this.formBuilder.group({
      isMatchingBand: [false],
    });

    this.productForm = this.formBuilder.group({
      productId: [0],
      productSKU: ['', [Validators.required]],
      jewelexSKU: ['', [Validators.required]],
      parentSKU: ['', [Validators.required]],
      isEngravable: [false],
      ProductName: ['', [Validators.required]],
      Prices: this.formBuilder.array([], [Validators.required]),
      incrementalFactor: ['', [Validators.required]],
      ArticleId: ['', [Validators.required]],
      CategoryId: ['', [Validators.required]],
      Description: ['', [Validators.required]],
      IsActive: [1, [Validators.required]],
      productType: ['Simple', [Validators.required]],
      matchingBandsDetails: this.formBuilder.array([]),
    });

    this.matchingBandSkuSubject.pipe(
      debounceTime(800))
      .subscribe(searchText => {

        if (searchText) {
          if (searchText?.sku) {

            if (this.getAtributeDisplayNameAt(searchText?.index)?.errors?.duplicateName) {
              return;
            }
            this.vlidateSku(searchText?.sku, searchText?.index)
          }
          else {
            this.resetProductSku(searchText?.index)
          }
        }
        else {
          this.resetProductSku(searchText?.index)
        }
      });
  }

  categoryData: any = []
  articleData: any = []
  attributeData: any = []
  configurableData: any = []
  attributeDetailData: any = []
  updateAttributeArrayData: any = []
  updateImageViewArrayData: any = []

  ngOnInit(): void {
    this.getArticleList();
    this.setEnableDisableArticle()
    this.getCountryList();
    this.httpService.getConfig().subscribe((config) => {
      this.imageUrl = config.imageUrl;
    })
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe(searchText => {
        this.attributeData.forEach((element: any, attributeindex: any) => {
          if (attributeindex == searchText?.index) {
            const index = element?.attributeDetails.findIndex((item: any) => {
              let value = item.AttributeDetailValue
              let search_value = searchText.value
              return value.toLowerCase() == search_value.toLowerCase()
            });
            if (index !== -1) {
              let input: any = document?.getElementById('attribute_input-' + searchText?.index)
              input.value = ''
              this.toastr.errorToastr(AppConstants.VALIE_EXISTS, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
            }
            else {
              element.attributeValue = searchText?.value
              element.selected_attribute_value = ''
              element?.attributeDetails?.forEach((sub_element: any) => {
                sub_element.is_checked = 0
              });
            }
          }
        });

      });
  }
  // convenience getter for easy access to form fields
  get f() { return this.productForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.productForm.controls[controlName].hasError(errorName);
  }

  checkWeightSelectedOrNot(): boolean {
    let is_select: boolean = false;
    let perentattrId = this.configurableData.find((attribute: any) => attribute.AttributeId == this.childAttribute?.PrAttrId);
    if (perentattrId) {
      let index = perentattrId.attributeDetails.findIndex((elememt: any) => elememt.is_checked == 1)
      if (index > -1) {
        let parent_attribute_id = perentattrId.attributeDetails[index].AttributeDetailId
        let childAttribute = this.childAttribute.attributeDetails.filter((elememt: any) => elememt.PrAttrDtlId == parent_attribute_id)
        is_select = this.checkChildAttribute(childAttribute);
      }
      else {
        let attribute_index = this.childAttribute.attributeDetails.findIndex((elememt: any) => elememt.is_checked == 1)
        if (attribute_index > -1) {
          this.toastr.errorToastr("Please select " + perentattrId.AttributeName, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          is_select = true;
        }
      }
    }
    return is_select;
  }

  get priceArray(): FormArray {
    return this.productForm.get('Prices') as FormArray;
  }

  getCountryList() {
    this.productService.getCountryList().subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.countryData = response.data;
        const formArray = this.productForm.get('Prices') as FormArray;
        this.countryData.forEach((element: Country) => {
          formArray.push(new FormGroup({
            id: new FormControl(element.id, [Validators.required]),
            price: new FormControl('', [Validators.required]),
            country_code: new FormControl(element.country_code, [Validators.required]),
          }));
        });
      }
    })
  };


  checkChildAttribute(childAttribute: any): boolean {
    let is_select = false;
    if (childAttribute && childAttribute.length > 0) {
      let index = childAttribute.findIndex((elememt: any) => elememt.is_checked == 1)
      if (index == -1) {
        this.toastr.errorToastr("Please select " + this.childAttribute.AttributeName, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        is_select = true;
      }
    }

    return is_select;
  }

  onSubmit() {
    this.is_video_upload = false;
    this.is_image_upload = false;
    this.submitted = true;
    this.matchingBandPodcuts = []
    let is_matching_band_errors = this.getMatchingBandDetails()
    let productDetails: any = this.getProdDetails();
    let configAttribs: any = this.getConfigProdDetails();
    this.checkProductsDetailsAdded(productDetails, configAttribs)
    if (this.productForm.invalid || this.is_image_upload || (productDetails?.length == 0 && this.attributeData?.length > 0) || (configAttribs?.length == 0 && this.configurableData?.length > 0) || (is_matching_band_errors == 1) || this.checkWeightSelectedOrNot()) {

      return;
    }

    let request = {
      productId: (this.productForm?.get('productId')?.value ? this.productForm?.get('productId')?.value : 0),
      productSKU: this.productForm?.get('productSKU')?.value,
      jewelexSKU: this.productForm?.get('jewelexSKU')?.value,
      parentSKU: this.productForm?.get('parentSKU')?.value,
      "isEngravable": (this.productForm.get('isEngravable')?.value) ? 1 : 0,
      "ArticleId": (this.productForm.get('ArticleId')?.value),
      "isMatchingBand": (this.MatchingBandForm.get('isMatchingBand')?.value) ? 1 : 0,
      'productName': this.productForm?.get('ProductName')?.value,
      'categoryId': this.productForm?.get('CategoryId')?.value,
      'description': this.productForm?.get('Description')?.value,
      'price': this.productForm?.get('Prices')?.value,
      'incrementalFactor': this.productForm?.get('incrementalFactor')?.value,
      'isActive': this.productForm?.get('IsActive')?.value,
      'productType': this.productForm?.get('productType')?.value,
      'fileDetails': this.getFileDetails(),
      'productDetails': productDetails ? productDetails : [],
      'ConfigAttribs': configAttribs ? configAttribs : [],
      matchingBandProducts: this.matchingBandPodcuts
    }
    this.addProductSubmit(request)
  }

  getMatchingBandDetails() {
    let is_matching_band_errors = 0
    if (this.MatchingBandForm.get('isMatchingBand')?.value) {
      let control: any = this.MatchingBandFormArray
      for (let i = 0; i < control?.controls?.length; i++) {
        if (control?.controls[i]?.controls?.errors?.value) {
          is_matching_band_errors = 1
          break;
        }
      }
      this.matchingBandPodcuts = this.updateMatchingBandRequest(control);
    }

    return is_matching_band_errors;
  }

  updateMatchingBandRequest(control: any): any {
    let matchingBandPodcuts = []
    for (let i = 0; i < control?.controls?.length; i++) {
      if (control?.controls[i]?.controls?.matchingBandId?.value) {
        matchingBandPodcuts.push({
          matchingProductId: control?.controls[i]?.controls?.matchingBandId?.value
        })
      }
    }
    return matchingBandPodcuts;
  }

  checkProductsDetailsAdded(productDetails: any, configAttribs: any) {
    if ((productDetails?.length > 0) || this.attributeData?.length == 0) {
      this.is_attribute_add = false;
    }
    else {
      this.is_attribute_add = true
    }
    if ((configAttribs?.length > 0) || this.configurableData?.length == 0) {
      this.is_attribute_add = false;
    }
    else {
      this.is_attribute_add = true
    }
  }

  addProductSubmit(request: any) {
    this.productService.addProduct(request).subscribe(response => {
      if (response && response?.type == AppConstants.success) {
        this.submitted = false;
        this.toastr.successToastr((this.id > 0 ? AppConstants.PRODUCT_UPDATE : AppConstants.PRODUCT_ADD), AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/dashboard'])
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  getConfigProdDetails(): any {
    let productDetails: any = []
    this.configurableData?.forEach((element: any) => {
      if (element?.IsConfigurable == 1) {
        element?.attributeDetails?.forEach((sub_element: any) => {
          if (sub_element?.is_checked == 1) {
            productDetails.push(
              {
                "attributeId": element?.AttributeId,
                "attributeDetailId": sub_element?.AttributeDetailId,
                "attributeValue": ''
              })
          }
        });
      }

    });

    return productDetails
  }

  getProdDetails(): any {
    let productDetails: any = []

    this.attributeData?.forEach((element: any) => {
      if (element?.IsConfigurable == 0) {
        let attribute_checked = element?.attributeDetails?.findIndex(
          (x: any) => x.is_checked == 1
        );
        if (attribute_checked !== -1) {
          productDetails.push(
            {
              "attributeId": element?.AttributeId,
              "attributeDetailId": element?.attributeDetails?.[attribute_checked]?.AttributeDetailId,
              "attributeValue": ''
            }
          )
        }
        else {
          productDetails.push(
            {
              "attributeId": element?.AttributeId,
              "attributeDetailId": 0,
              "attributeValue": element?.attributeValue
            }
          )
        }
      }

    });

    return productDetails
  }

  getFileDetails(): any {
    let fileDetails: any = []
    this.imageViewData?.forEach((element: any) => {
      if (element?.base64_image_url) {
        fileDetails.push({
          fileName: element?.filename,
          mimeType: element?.mimeType,
          fileType: 'image',
          imageViewId: element?.ImageViewId
        })
      }
    });

    if (this.product_base64_images && this.product_base64_images.length > 0) {
      this.product_base64_images.forEach((element: any) => {
        fileDetails.push(this.videoObject(element))
      });
    }

    if (this.product_video && this.product_video.length > 0) {

      this.product_video.forEach((element: any) => {
        fileDetails.push(this.videoObject(element))
      });
    }

    return fileDetails
  }

  videoObject(element: any) {
    return {
      fileName: element.fileName,
      mimeType: element.mimeType,
      fileType: element.fileType,
      imageViewId: element.imageViewId
    }
  }

  uploadAttachment($event: any, type: any) {
    if (($event.target.files).length === 0) {
      return;
    }
    let mimeType = $event.target.files[0].type;
    let file_type = mimeType.split('/')[0]
    if (mimeType.match(/image\/*/) != null && type == AppConstants.FILE_TYPE_IMAGE) {
      let files = $event.target.files;

      this.uploadImageAttachment(files, file_type)

    }
    else if ((mimeType.match(/video\/*/) != null && type == AppConstants.FILE_TYPE_VIDEO)) {
      const files = $event.target.files;
      if (!AppConstants.checkVideoExtensionAllowed($event.target.files[0].name)) {
        this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        return
      }
      this.uploadVideoAttachment(files, file_type)
    }
    else {

      this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });

    }
  }

  uploadImageAttachment(files: any, file_type: any) {
    const numberOfFiles = files.length;
    for (let i = 0; i < numberOfFiles; i++) {
      if (files[i].name.indexOf(' ') == -1 && AppConstants.checkImageExtensionAllowed(files[i].name)) {
        const URL = window.URL || window.webkitURL;
        const Img = new Image();
        Img.src = URL.createObjectURL(files[i]);
        let formData = new FormData()
        formData.append('productImage', files[i])
        this.attributeMasterService.uploadFile(formData).subscribe((res: any) => {
          if (res && res.type == AppConstants.success) {
            this.is_image_upload = false;
            const reader = new FileReader();
            reader.onload = (element: any) => {
              this.product_base64_images.push({
                base64Value: element.target.result,
                fileName: res?.data?.uploadedFiles[0].filename,
                mimeType: res?.data?.uploadedFiles[0].mimetype,
                fileType: file_type,
                imageViewId: 0
              })
            };
            reader.readAsDataURL(files[i]);
          }
          else {
            this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          }
        });
      }
    }
  }


  uploadVideoAttachment(files: any, file_type: any) {
    if (files) {
      let formData = new FormData()
      formData.append('productVideo', files[0])
      this.attributeMasterService.uploadFile(formData).subscribe((res: any) => {
        if (res && res.type == AppConstants.success) {
          this.is_video_upload = false;
          for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              this.updateVide(file, e, res, file_type)
            };
            reader.readAsDataURL(file);
          }
        }
        else {
          if (res.message == 'Common.Errors.NotConnect') {
            this.toastr.errorToastr(AppConstants.ONLY_MP4_ALLOW, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });

          }
          else {
            this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });

          }
        }
      });
    }
  }

  updateVide(file: any, e: any, res: any, file_type: any) {
    if (file.type.indexOf("video") > -1) {
      this.product_video = []
      this.videoUrl = e.target.result
      this.product_video.push({
        base64Value: e.target.result,
        fileName: res?.data?.uploadedFiles[0].filename,
        mimeType: res?.data?.uploadedFiles[0].mimetype,
        fileType: file_type,
        imageViewId: 0
      })
    }
  }

  deleteImage(index: any) {
    this.product_base64_images.splice(index, 1);
  }

  deleteVideo() {
    this.product_video.splice(0, 1);
    this.videoUrl = '';
  }


  numbersOnly(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      return false;
    }
    return true;
  }

  getEvent(event: any) {

    if (event?.target?.value) {
      return event?.target?.value;
    }
    return event;
  }

  getCategoryByArticle(event: any) {
    return new Promise((resolve) => {
      let id = this.getEvent(event)
      if (id && id?.isTrusted) {
        this.categoryData = []
        this.attributeData = []
      }
      else {
        this.categoryMasterService.categoryListDropdown({ articleId: id }).subscribe((response: any) => {
          if (response && response.type == AppConstants.success && response?.data?.categories && response?.data?.categories.length > 0) {
            this.categoryData = response?.data?.categories;
            resolve(this.categoryData)
          }
          else {
            this.categoryData = []
            this.productForm.controls['ArticleId'].setValue('');

          }
        })
        if (this.id == 0) {
          this.getAttributeByArticleId(id)
        }
      }
    });
  }

  getArticleList() {
    this.articleMasterService.articleListDropdown({}).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        if (response?.data?.articles && response?.data?.articles.length > 0) {
          this.articleData = response?.data?.articles;
          this.getImageView();
        }
        else {
          this.articleData = []

          this.router.navigate(['/admin/article-master/add-article']);
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message, AppConstants.ADD_ATRICLE), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      }
      else {
        if (response?.message !== 'Common.Errors.UnauthorizedUser') {
          this.articleData = []
          this.router.navigate(['/admin/article-master/add-article']);
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message, AppConstants.ADD_ATRICLE), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      }
    })
  }

  get addImageViewFormArray(): FormArray {

    return this?.productForm?.get("imageViewDetails") as FormArray
  }

  get addProductDetailFormArray(): FormArray {

    return this?.productForm?.get("productDetails") as FormArray
  }

  uploadImageView($event: any, image_view_id: any) {
    if (($event.target.files).length === 0) {
      return;
    }
    let mimeType = $event.target.files[0].type;
    if (mimeType.match(/image\/*/) != null) {

      if ($event.target.files[0].name.indexOf(' ') == -1) {
        if (!AppConstants.checkImageExtensionAllowed($event.target.files[0].name)) {
          this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          return
        }
        this.validateFileNameAndUpload($event, image_view_id)
      }
      else {
        this.toastr.errorToastr(AppConstants.VALID_IMAGE_NAME, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }


    } else {
      this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    }
  }

  validateFileNameAndUpload($event: any, image_view_id: any) {
    const URL = window.URL || window.webkitURL;
    const Img = new Image();
    const filesToUpload = ($event.target.files);
    Img.src = URL.createObjectURL(filesToUpload[0]);
    Img.onload = (e: any) => {
      let path = e.path || (e.composedPath && e.composedPath());
      const height = path[0].height;
      const width = path[0].width;
      if ($event.target.files[0].size / 1024 / 1024 <= 2 && (height <= 600 && width <= 600)) {
        let files = $event.target.files;
        this.updateImageView(files, image_view_id)
      }
      else {
        this.toastr.errorToastr(AppConstants.ATTRIBUTEIMAGE_VALIDATION, 'Oops!', { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    };
  }

  updateImageView(files: any, image_view_id: any) {
    if (files && files[0]) {
      let formData = new FormData()
      formData.append('productImage', files[0])
      this.attributeMasterService.uploadFile(formData).subscribe((res: any) => {
        if (res && res.type == AppConstants.success) {
          const reader = new FileReader();
          reader.onload = (el: any) => {
            this.imageViewData?.forEach((element: any) => {
              if (element?.ImageViewId == image_view_id) {
                element.base64_image_url = el?.target?.result;
                element.filename = res?.data?.uploadedFiles[0].filename;
                element.mimeType = res?.data?.uploadedFiles[0].mimetype;
              }
            });
          };

          reader.readAsDataURL(files[0]);
        }
        else {
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      });


    }
  }

  deleteImageViews(ImageViewId: any) {
    this.imageViewData?.forEach((element: any) => {
      if (element?.ImageViewId == ImageViewId) {
        element['base64_image_url'] = ''
        element['filename'] = ''
        element['mimeType'] = ''
      }
    });

  }

  deleteImageView(index: any) {
    let control = <FormArray>this?.productForm?.controls['imageViewDetails'];
    if ((control?.controls.length - 1) == index && control?.controls.length > 1) {
      if (control.controls[index - 1].get('is_edit_field')?.value == 0) {
        control.controls[index - 1].get('imageViewId')?.enable();
      }
    }
    let image_view_id = control?.controls[index].get('imageViewId')?.value
    this.updatedImageViewData = []
    if (image_view_id) {
      this.imageViewData.forEach((element: any) => {
        if (element.ImageViewId == image_view_id) {
          element.is_selected = 0
        }
      });


      this.update_image_view_data()
    }
    this.updateImageViewArrayData = []
    control.removeAt(index);
    for (let i = 0; i < control?.controls.length; i++) {
      if (control?.controls[i].get('is_edit_field')?.value == 0) {
        if (control?.controls[i].get('imageViewId')?.value) {
          this.updateImageViewArrayData = control.controls[i].get('imageViewData')?.value
          this.updatedImageViewData.filter((x: any) => this.updateImageViewArrayData.indexOf(x) === -1).forEach((element: any) => {
            this.updateImageViewArrayData.push(element)
          });
          control.controls[i].get('imageViewData')?.setValue(this.updateImageViewArrayData)
        }
        else {
          control.controls[i].get('imageViewData')?.setValue(this.updatedImageViewData)
        }
      }
    }

  }

  getImageView() {
    this.imageViewMasterService.imageViewListDropdown({}).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.imageViewData = response?.data?.imageViews;
        this.imageViewData.forEach((element: any) => {
          element['is_selected'] = 0
          element['base64_image_url'] = ''
          element['filename'] = ''
          element['mimeType'] = ''
        });
        if (this.id > 0) {
          this.getProductDetails()
        }
      }
    })
  }

  selectImageView(event: any) {
    this.imageViewData.forEach((element: any) => {
      element.is_selected = 0
    });
    let control = <FormArray>this?.productForm?.controls['imageViewDetails'];
    control?.controls?.forEach((index: any) => {
      this.imageViewData.forEach((element_data: any) => {
        if (element_data.ImageViewId == control.controls[index].get('imageViewId')?.value) {
          element_data.is_selected = 1
        }
      });
    })
    this.imageViewData.forEach((element: any) => {
      if (element.ImageViewId == event?.target?.value) {
        element.is_selected = 1
      }
    });
    this.updatedImageViewData = []
    this.update_image_view_data()
  }

  getAttributeByArticleId(article_id: any) {
    return new Promise((resolve) => {
      this.attributeMasterService.attributeList({ articleId: article_id, search: '', isActive: 1 }).subscribe((response: any) => {
        if (response && response.type == AppConstants.success) {
          this.configurableData = response.data.attributes.filter((element: any) => element.IsConfigurable == 1);
          this.updateConfigurableAttributeDetail()
          this.updateAttributesDetails(response)
          this.attributeData = response?.data?.attributes.filter((element: any) => element.IsConfigurable == 0);
          resolve(this.attributeData)
        }

      });

    });

  }

  updateConfigurableAttributeDetail() {
    this.configurableData.forEach((element: any) => {
      if (element.AttributeId) {
        for (let i = 0; i < element?.attributeDetails?.length; i++) {
          const sub_sub_element = element.attributeDetails[i];
          sub_sub_element.is_show = 1;
          if ((element.AttributeName.toLowerCase().includes('styles')) && (i == 0)) {
            this.parentAttributeDtl.parentAttributeId = element?.AttributeId
            this.parentAttributeDtl.parentAttributeDtlId = sub_sub_element.AttributeDetailId
          }
          if (element?.PrAttrId == this.parentAttributeDtl?.parentAttributeId) {
            this.childAttribute = element;
            if (sub_sub_element?.PrAttrDtlId == this.parentAttributeDtl?.parentAttributeDtlId) {
              sub_sub_element.is_show = 1;
            } else {
              sub_sub_element.is_show = 0;
            }
          }
        }
      }
    });
  }

  getConfigAttributeByArticleId(article_id: any) {
    return new Promise((resolve) => {
      this.attributeMasterService.attributeList({ articleId: article_id, search: '', isActive: 1 }).subscribe((response: any) => {
        if (response && response.type == AppConstants.success) {
          this.configurableData = response.data.attributes.filter((element: any) => element.IsConfigurable == 1);
          this.updateAttributesDetails(response)
          resolve(this.configurableData)
        }

      });

    });

  }

  updateAttributesDetails(response: any) {
    response?.data?.attributes.forEach((element: any) => {
      if (element?.IsConfigurable == 0) {
        element['attributeValue'] = ''
        element['selected_attribute_value'] = ''

      }

      if (element?.attributeDetails?.length > 0) {
        element['is_show'] = 1;
        element?.attributeDetails?.forEach((sub_element: any) => {
          sub_element['is_checked'] = 0
          sub_element.AttributeDetailEngravImg = (sub_element?.AttributeDetailEngravImg) ? this.imageUrl + AppConstants.ATTRIBUTE_ENGRAVE_FOLDER_NAME + sub_element?.AttributeDetailEngravImg : ''
          sub_element.AttributeDetailImage = (sub_element?.AttributeDetailImage) ? this.imageUrl + AppConstants.ATTRIBUTE_IMAGE_FOLDER_NAME + sub_element?.AttributeDetailImage : ''
        });
      }
      else {
        element['is_show'] = 0;
      }
    });
  }


  selectAttributeValues(event: any, index: any, parent_index: any) {
    if (event.target.checked) {
      this.is_attribute_add = false;
      this.configurableData.forEach((element: any, attributeindex: any) => {
        if (attributeindex == parent_index) {

          this.updateAttributeDetailByParent(element, index)
        }

      });
    }

  }

  updateAttributeDetailByParent(element: any, index: any) {
    element?.attributeDetails?.forEach((sub_element: any, sub_index: any) => {
      if (sub_index == index) {
        sub_element.is_checked = 1
        if (element.AttributeId == this.parentAttributeDtl.parentAttributeId) {
          this.parentAttributeDtl.parentAttributeDtlId = sub_element?.AttributeDetailId
          this.ChangeWeightForBraceletStyle();
        }
      }
      else {
        sub_element.is_checked = 0
      }
    });
  }

  updateAttributeSelection(index: any, parent_index: any) {
    this.attributeData.forEach((element: any, attributeindex: any) => {
      if (attributeindex == parent_index) {

        element?.attributeDetails?.forEach((sub_element: any, sub_index: any) => {
          if (sub_index == index) {
            sub_element.is_checked = 1
          }
          else {
            sub_element.is_checked = 0
          }
        });
      }

    });
  }

  ChangeWeightForBraceletStyle() {
    this.childAttribute?.attributeDetails?.forEach((sub_sub_element: any) => {
      if (sub_sub_element?.PrAttrDtlId == this.parentAttributeDtl?.parentAttributeDtlId) {
        sub_sub_element.is_show = 1;
      } else {
        sub_sub_element.is_show = 0;
      }
    });
  }

  getProductDetails() {
    this.productService.productList({ productId: this.id, search: '' }).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.productForm.controls['productId'].setValue(response?.data?.products[0].ProductId);
        this.productForm.controls['ProductName'].setValue(response?.data?.products[0].ProductName);
        (this.productForm.get('Prices') as FormArray).controls.forEach((control: any) => {
          const matchedData = response?.data?.products[0].price.find(
            (x: { country_code: string }) => x.country_code === control.get('country_code').value
          );
          if (matchedData) {
            control.patchValue({
              price: matchedData.price, // Set price value
              // Add other fields if necessary
            });
          } else {
            console.log(
              `No matching data found for country_code: ${control.get('country_code').value}`
            );
          }
        });

        this.productForm.controls['incrementalFactor'].setValue(response?.data?.products[0].IncrementalFactor);
        this.productForm.controls['ArticleId'].setValue(response?.data?.products[0].ArticleId);
        this.productForm.controls['Description'].setValue(response?.data?.products[0].Description);
        this.productForm.controls['IsActive'].setValue(response?.data?.products[0].IsActive);
        this.productForm.controls['productType'].setValue(response?.data?.products[0].ProductType ? response?.data?.products[0].ProductType : '');
        this.productForm.controls['productSKU'].setValue(response?.data?.products[0].ProductSKU);
        this.productForm.controls['jewelexSKU'].setValue(response?.data?.products[0].JewelexSKU);
        this.productForm.controls['parentSKU'].setValue(response?.data?.products[0].parent_sku);
        this.productForm.controls['isEngravable'].setValue((response?.data?.products[0].IsEngravable == 1) ? true : false);
        this.getCategoryByArticle(response?.data?.products[0].ArticleId).then((category: any) => {
          let category_idx = category.findIndex(
            (x: any) => x.CategoryId === response?.data?.products[0].CategoryId
          );
          if (category_idx != -1) {
            this.productForm.controls['CategoryId'].setValue(response?.data?.products[0].CategoryId);
          }
        })
        this.updateAttributeDetails(response)
        this.updateFileDetails(response)
        this.updateMatchingBandDetails(response)
      }
    })
  }

  updateAttributeDetails(response: any) {
    this.getAttributeByArticleId(response?.data?.products[0].ArticleId).then((attribute: any) => {
      response?.data?.products[0].productDetails.forEach((element: any) => {
        if (element.AttributeId) {
          attribute?.forEach((sub_element: any) => {
            if (sub_element?.AttributeId == element?.AttributeId) {
              sub_element?.attributeDetails?.forEach((sub_sub_element: any) => {
                if (sub_sub_element?.AttributeDetailId == element?.AttributeDetailId) {
                  sub_sub_element.is_checked = 1
                }
              })
            }
          });
        }
      });
      this.checkAttributeConfigurable(attribute)
      this.updateConfigurableAttributeByArticleDetail(response)
    });

  }

  updateConfigurableAttributeByArticleDetail(response: any) {
    this.configurableData.forEach((element: any) => {
      if (element.AttributeId) {
        element?.attributeDetails?.forEach((sub_sub_element: any) => {
          sub_sub_element.is_show = 1;
          let expression: any = [];
          expression.push({
            key: 'atr_' + element.AttributeId,
            operation: 'equal',
            value: sub_sub_element.AttributeDetailId
          })
          const attributeFound = response?.data?.products[0]?.ConfigAttribs.filter((item: any) => expression.every((expr: any) => AppConstants.evaluateExpression(expr, item)))
          if (attributeFound && attributeFound.length > 0) {
            sub_sub_element.is_checked = 1
            if (element.AttributeName.toLowerCase().includes('styles')) {
              this.parentAttributeDtl.parentAttributeId = element?.AttributeId
              this.parentAttributeDtl.parentAttributeDtlId = sub_sub_element?.AttributeDetailId
            }
          } else {
            sub_sub_element.is_checked = 0;
          }
        });
      }
    });
  }

  checkParentAttributeIsAvaialbe(element: any, sub_sub_element: any) {
    if (element?.PrAttrId == this.parentAttributeDtl?.parentAttributeId) {
      if (sub_sub_element?.PrAttrDtlId == this.parentAttributeDtl?.parentAttributeDtlId) {
        sub_sub_element.is_show = 1;
      } else {
        sub_sub_element.is_show = 0;
      }
    }
  }

  checkAttributeConfigurable(attribute: any) {
    attribute?.forEach((element: any) => {
      if (element?.IsConfigurable == 0) {
        element?.attributeDetails?.forEach((sub_element: any) => {
          if (sub_element?.is_checked == 1) {
            element.selected_attribute_value = sub_element?.AttributeDetailValue
            element.attributeValue = sub_element?.attributeValue
          }
        });
      }

    });

  }

  updateFileDetails(response: any) {
    if (response?.data?.products[0]?.fileDetails && response?.data?.products[0]?.fileDetails.length > 0) {
      response?.data?.products[0]?.fileDetails.forEach((element: any) => {
        if (element.ImageViewId > 0) {
          this.updateImageViewData(element)
        }
        else {
          this.updateVideoDetails(element)
        }
      });
    }
  }

  updateVideoDetails(element: any) {
    if (element.FileType == 'video') {
      this.product_video.push({
        base64Value: (element.Uri ? this.imageUrl + AppConstants.PRODUCT_IMAGE_FOLDER_NAME + element.Uri : ''),
        fileName: element.Uri,
        mimeType: element.Mimetype,
        fileType: element.FileType,
        imageViewId: element.ImageViewId
      })
      this.videoUrl = (element.Uri ? this.imageUrl + AppConstants.PRODUCT_IMAGE_FOLDER_NAME + element.Uri : '')
    }
    else {
      this.product_base64_images.push(
        {
          base64Value: (element.Uri ? this.imageUrl + AppConstants.PRODUCT_IMAGE_FOLDER_NAME + element.Uri : ''),
          fileName: element.Uri,
          mimeType: element.Mimetype,
          fileType: element.FileType,
          imageViewId: element.ImageViewId

        }
      )
    }
  }

  updateImageViewData(element: any) {
    this.imageViewData?.forEach((sub_element: any) => {
      if (element?.ImageViewId == sub_element.ImageViewId) {
        sub_element.base64_image_url = (element.Uri ? this.imageUrl + AppConstants.PRODUCT_IMAGE_FOLDER_NAME + element.Uri : '')
        sub_element.filename = element.Uri
        sub_element.mimeType = element.FileType
      }
    });
  }

  copy_product(event: any) {
    if (event?.target?.checked) {
      this.is_copy_product = event?.target?.checked
      let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
        class: 'modal-sm',
        backdrop: 'static'
      });
      modalRef.content.mainHeading = AppConstants.COPY_PRODUCT;
      modalRef.content.subHeading = AppConstants.CONFIRM_COPY;
      modalRef.content.buttonHeading1 = AppConstants.YES;
      modalRef.content.buttonHeading2 = AppConstants.NO;
      modalRef.content.title = '';
      modalRef.content.OnClose.subscribe((result: any) => {
        if (result == AppConstants.YES) {
          this.is_copy_product = false;
          let request = {
            productId: this.id,
            ArticleId: this.productForm.get('ArticleId')?.value
          }
          this.copyCurrentProduct(request)
        }
        else {
          this.is_copy_product = false;
        }
      });
    }
  }

  copyCurrentProduct(data: any) {
    this.productService?.copyProduct(data).subscribe((response: any) => {
      if (response && response?.type == AppConstants.success) {
        window.location.reload();
        this.toastr.successToastr(AppConstants.PROUDCT_COPIED, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  no_cofig_attribute(event: any, parent_index: any) {
    this.is_attribute_add = false;
    if (event && event?.AttributeDetailId) {
      this.attributeData.forEach((element: any, attributeindex: any) => {
        if (attributeindex == parent_index) {
          let input: any = document?.getElementById('attribute_input-' + parent_index)
          input.value = ''
          element.attributeValue = ''
          element?.attributeDetails?.forEach((sub_element: any) => {
            if (event?.AttributeDetailId == sub_element?.AttributeDetailId) {
              sub_element.is_checked = 1
            }
            else {
              sub_element.is_checked = 0
            }
          });
        }
      });

    }
    else {
      this.attributeData.forEach((element: any, attributeindex: any) => {
        if (attributeindex == parent_index) {
          let input: any = document?.getElementById('attribute_input-' + parent_index)
          input.value = ''
          element.attributeValue = ''
          element?.attributeDetails?.forEach((sub_element: any) => {
            sub_element.is_checked = 0
          });
        }
      });
    }

  }

  add_attributeValue(event: any, parent_index: any) {
    let request = {
      index: parent_index,
      value: event.target.value
    }
    this.modelChanged.next(request);
  }

  update_image_view_data() {
    this.imageViewData.forEach((element: any) => {
      if (element.is_selected == 0) {
        this.updatedImageViewData.push(element)
      }
    });
  }


  get MatchingBandFormArray(): FormArray {
    return this?.productForm?.get("matchingBandsDetails") as FormArray
  }

  updateMatchingBandDetails(response: any) {
    if (response?.data?.products[0]?.matchingBandProducts && response?.data?.products[0]?.matchingBandProducts.length > 0) {
      this.MatchingBandForm.controls['isMatchingBand'].setValue((response?.data?.products[0].IsMatchingBand == 1) ? true : false);
      response?.data?.products[0]?.matchingBandProducts.forEach((element: any) => {
        let control = <FormArray>this?.productForm?.controls['matchingBandsDetails'];
        const index = this.MatchingBandFormArray ? this.MatchingBandFormArray.length : 0;
        let form = this.formBuilder.group({
          matchingBandId: [element.MatchingBandProductId],
          matchingBandSku: [element.ProductSKU, [Validators.required, this.validateUniq(index)]],
          isDelete: [1]
        });
        control.push(form);
      });
    }
    else {
      this.MatchingBandForm.controls['isMatchingBand'].setValue(false);
    }
  }

  addMatchingBandForm() {
    const index = this.MatchingBandFormArray ? this.MatchingBandFormArray.length : 0;
    let control = <FormArray>this?.productForm?.controls['matchingBandsDetails'];
    let form = this.formBuilder.group({
      matchingBandId: [0],
      matchingBandSku: ['', [Validators.required, this.validateUniq(index)]],
      isDelete: [(control.length > 0) ? 1 : 0],
      errors: []
    });
    control.push(form);
  }

  deleteMatchingBand(index: any, attribute_value_name: any) {

    let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
      class: 'modal-sm'
    });
    modalRef.content.mainHeading = AppConstants.DELETE_MATCHING_BAND;
    modalRef.content.subHeading = AppConstants.CONFIRM_MATCHING_BAND;
    modalRef.content.buttonHeading1 = AppConstants.YES;
    modalRef.content.buttonHeading2 = AppConstants.NO;
    modalRef.content.title = attribute_value_name;
    modalRef.content.OnClose.subscribe((result: any) => {
      if (result == AppConstants.YES) {
        let control = <FormArray>this?.productForm?.controls['matchingBandsDetails'];
        control.removeAt(index);
        if (control.controls.length == 0)
          this.addMatchingBandForm()
        this.toastr.successToastr(AppConstants.MATCHING_BAND_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    });


  }

  validUserName(event: any, index: any) {

    let obj = {
      sku: event.target.value?.trim(),
      index: index
    }
    this.matchingBandSkuSubject.next(obj);
  }

  vlidateSku(sku: any, index: any) {
    let reuqest = {}
    if (this.productForm.get('productId')?.value == 0) {
      reuqest = {
        productSKU: sku
      }
    }
    else {
      reuqest = {
        productId: this.productForm.get('productId')?.value,
        productSKU: sku
      }
    }


    this.productService.verifyProduct(reuqest).subscribe((response: any) => {
      let control: any = this.MatchingBandFormArray
      if (response && response?.type == AppConstants.success) {
        control?.controls[index]['controls']?.matchingBandId.setValue(response?.data?.product?.ProductId)
        control?.controls[index]['controls']?.errors?.setValue('')
      }
      else {
        control?.controls[index]['controls']?.matchingBandId?.setValue(0)
        control?.controls[index]['controls']?.errors?.setValue(response?.message)
      }

    })

  }

  resetProductSku(index: any) {
    let control: any = this.MatchingBandFormArray

    control?.controls[index]['controls']?.matchingBandId?.setValue('')
    control?.controls[index]['controls']?.errors?.setValue('')
  }


  validateUniq(index: any) {
    return (control: AbstractControl) => {
      if (control.value) {
        const formArray = control.parent
          ? (control?.parent?.parent as FormArray)
          : null;
        if (formArray) {
          const attributes = formArray.value.map((x: any) => x.matchingBandSku);
          return attributes.indexOf(control.value) >= 0 && attributes.indexOf(control.value) < index
            ? { duplicateName: true }
            : null;
        }
      }
    };
  }

  checkDuplicacy(index: any) {
    this.MatchingBandFormArray.controls.forEach((x, i) => {
      if (index != i)
        (x as FormGroup)?.get('matchingBandSku')?.updateValueAndValidity()
    })
  }
  getAtributeDisplayNameAt(index: number) {
    return this.MatchingBandFormArray
      ? (this.MatchingBandFormArray?.at(index)?.get('matchingBandSku') as FormControl)
      : null;
  }


  changeProductType(event: any) {
    if (event?.target?.value == 'MatchingBand') {
      this.MatchingBandForm.get('isMatchingBand')?.setValue(false);
      while (this.MatchingBandFormArray.length !== 0) {
        this.MatchingBandFormArray.removeAt(0)
      }
    }
  }

  AddDeleteMatchingBand(event: any) {
    if (event.target.checked && this.MatchingBandFormArray.length == 0) {
      this.addMatchingBandForm()
    }
    else {
      while (this.MatchingBandFormArray.length !== 0) {
        this.MatchingBandFormArray.removeAt(0)
      }
    }
  }

  checkModelVal() {
    return this.productForm.get('productSKU')?.value !== this.productForm.get('jewelexSKU')?.value;
  }


  setEnableDisableArticle() {
    if (this.id > 0) {
      this.productForm.get('ArticleId')?.disable();
    }
    else {
      this.productForm.get('ArticleId')?.enable();
    }
  }
}
