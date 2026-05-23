import { Component, OnInit, Injector, ViewContainerRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleMasterService } from 'src/app/core/service/article-master.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { AttributeMasterService } from 'src/app/core/service/attribute-master.service';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { ImageViewMasterService } from 'src/app/core/service/image-view-master.service';
import { ConfirmationDialogComponent } from 'src/app/modules/dialog-box/confirmation-dialog/confirmation-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
@Component({
  selector: 'app-add-attribute',
  templateUrl: './add-attribute.component.html',
  styleUrls: ['./add-attribute.component.scss']
})
export class AddAttributeComponent implements OnInit {
  submitted: boolean = false;
  AddAttributeForm!: FormGroup;
  id: any = 0
  articleData: any = []
  imageViewData: any = []
  attributeDetailImages: any = []
  imageUrl: string = ''
  delete_index: any = 0
  articleMasterService!: ArticleMasterService
  attributeMasterService!: AttributeMasterService
  imageViewMasterService!: ImageViewMasterService
  httpService!: HttpService
  modalService!: BsModalService
  is_for_showing: any = 0
  AppConstants: any = AppConstants
  public color: any = [];
  public secondryColor: any = [];
  showColorInput: boolean = false;
  hideUploadImgOpt: boolean = false;
  isConfigurable: any = 0;
  articleId: any = 0;
  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private toastr: ToastrManager, private router: Router, private injector: Injector, public vcRef: ViewContainerRef) {
    this.articleMasterService = injector.get<ArticleMasterService>(ArticleMasterService);
    this.attributeMasterService = injector.get<AttributeMasterService>(AttributeMasterService);
    this.imageViewMasterService = injector.get<ImageViewMasterService>(ImageViewMasterService);
    this.httpService = injector.get<HttpService>(HttpService);
    this.modalService = injector.get<BsModalService>(BsModalService);
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.id = params['id']
      }
    });
    this.AddAttributeForm = this.formBuilder.group({
      attributeId: [this.id ? this.id : 0],
      articleId: ['', [Validators.required]],
      attributeName: ['', [Validators.required]],
      imageViewId: [''],
      isActive: [1, [Validators.required]],
      attributeDetails: this.formBuilder.array([]),
      isConfigurable: [false],
      is_specification: [false],
      is_product_details: [true],
      is_default: [false],
      engravable: [false],
    });
  }


  ngOnInit(): void {
    this.getArticleList()
    this.setEnableDisableArticle()
    if (this.id == 0)
      this.addAttributeDetailForm()

    this.httpService.getConfig().subscribe((config) => {
      this.imageUrl = config.imageUrl;
    })
  }

  addAttributeDetailForm() {
    let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
    let form = this.formBuilder.group({
      attributeDetailId: [0],
      attributeValue: ['', [Validators.required]],
      isActive: [1, [Validators.required]],
      base64_image_url: [''],
      color: ['', []],
      secondryColor: ['', []],
      isDelete: [(control.length > 0) ? 1 : 0],
      filename: [''],
      engrav_base64_image_url: [''],
      engrav_file_name: ['']
    });
    control.push(form);
  }
  // convenience getter for easy access to form fields
  get f() { return this.AddAttributeForm.controls; }

  // check error
  public hasError = (controlName: string, errorName: string) => {
    return this.AddAttributeForm.controls[controlName].hasError(errorName);
  }

  onSubmit() {
    this.submitted = true;
    this.is_for_showing = false;
    if (this.AddAttributeForm.controls['attributeName'].value.toLowerCase().includes(AppConstants.METAL_COLOR)) {
      this.SetMetalColorValidation()
    }

    if (this.AddAttributeForm.invalid) {
      return;
    }

    if (this.id == 0) {
      let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
        class: 'modal-sm'
      });
      modalRef.content.mainHeading = AppConstants.ADD_ATTRIB;
      modalRef.content.subHeading = AppConstants.ADD_ATTRIB_CONFRIMATION;
      modalRef.content.buttonHeading1 = AppConstants.YES;
      modalRef.content.buttonHeading2 = AppConstants.NO;
      modalRef.content.OnClose.subscribe((result: any) => {
        if (result == AppConstants.YES) {
          this.addAttribute();
        }
      });
    } else {
      this.addAttribute();
    }
  }

  checkDuplicateValue(attributeDetails: any) {

    const unique: any = [];

    attributeDetails.map((x: any) => unique.filter((a: any) => a.PrAttrDtlId == x.PrAttrDtlId && a.attributeValue?.toLowerCase()?.trim() == x.attributeValue?.toLowerCase()?.trim()).length > 0 ? null : unique.push(x));

    return unique;
  }

  addAttribute() {
    this.AddAttributeForm.controls['attributeId']?.setValue(this.id ? this.id : 0);
    this.AddAttributeForm.controls['articleId']?.setValue(this.AddAttributeForm.get('articleId')?.value ? this.AddAttributeForm.get('articleId')?.value : 0);
    let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
    let attributeDetails: any = this.addAttributesDetails(control)
    attributeDetails = this.checkDuplicateValue(attributeDetails)
    let displayIn = this.updateDisplayIn()

    let data: any = {
      'attributeId': this.AddAttributeForm.get('attributeId')?.value,
      'articleId': this.AddAttributeForm.get('articleId')?.value,
      "attributeName": this.AddAttributeForm.get('attributeName')?.value,
      "imageViewId": (this.AddAttributeForm.get('imageViewId')?.value == '') ? 0 : this.AddAttributeForm.get('imageViewId')?.value,
      "isActive": this.AddAttributeForm.get('isActive')?.value,
      "isConfigurable": (this.AddAttributeForm.get('isConfigurable')?.value) ? 1 : 0,
      "isEngravable": (this.AddAttributeForm.get('engravable')?.value) ? 1 : 0,
      "attributeDetails": attributeDetails,
      "displayIn": displayIn,
      "isDefault": 0
    }
    this.attributeMasterService.addAttribute(data).subscribe(res => {
      if (res && res?.type == AppConstants.success) {
        this.submitted = false;
        this.toastr.successToastr((this.id > 0 ? AppConstants.ATTRIBUTE_UPDATE : AppConstants.ATTRIBUTE_ADDED), AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.router.navigate(['/admin/attribute-master'])
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  updateDisplayIn(): any {
    let displayIn = ''
    if (this.AddAttributeForm.get('is_product_details')?.value && !this.AddAttributeForm.get('is_specification')?.value) {
      this.is_for_showing = 0
      displayIn = AppConstants.PRODUCT_DETAIL
    }
    else if (!this.AddAttributeForm.get('is_product_details')?.value && this.AddAttributeForm.get('is_specification')?.value) {
      this.is_for_showing = 0
      displayIn = AppConstants.SPECIFICATION
    }
    else if (this.AddAttributeForm.get('is_product_details')?.value && this.AddAttributeForm.get('is_specification')?.value) {
      this.is_for_showing = 0
      displayIn = AppConstants.PORDUCT_DETAIL_AND_SPECIFICATION
    }

    return displayIn
  }

  addAttributesDetails(control: any): any {
    let attributeDetails = []
    if (control.controls && control.controls.length > 0) {
      for (let i = 0; i < this.AddAttributeForm.get('attributeDetails')?.value.length; i++) {
        attributeDetails.push({
          attributeDetailId: this.AddAttributeForm.get('attributeDetails')?.value[i].attributeDetailId,
          attributeValue: this.AddAttributeForm.get('attributeDetails')?.value[i].attributeValue,
          isActive: this.AddAttributeForm.get('attributeDetails')?.value[i].isActive,
          attributeImage: this.AddAttributeForm.get('attributeDetails')?.value[i].filename,
          attributeDetailEngravImg: this.AddAttributeForm.get('attributeDetails')?.value[i].engrav_file_name ? this.AddAttributeForm.get('attributeDetails')?.value[i].engrav_file_name : '',
          color: this.AddAttributeForm.get('attributeDetails')?.value[i].color,
          secondryColor: this.AddAttributeForm.get('attributeDetails')?.value[i].secondryColor,
        })
      }
    }

    return attributeDetails
  }


  getArticleList() {
    this.articleMasterService.articleListDropdown({}).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        if (response?.data?.articles.length > 0) {
          this.articleData = response?.data?.articles;
          this.getImageView(this.articleData)
        }
        else {
          this.router.navigate(['/admin/article-master/add-article']);
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message, AppConstants.ADD_ATRICLE), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      }
      else {
        this.articleData = []
        this.router.navigate(['/admin/article-master/add-article']);
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message, AppConstants.ADD_ATRICLE), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  cancel() {
    this.router.navigate(['/admin/attribute-master'])
  }

  getAttributeList(id: any, articleData: any, imageView: any) {
    this.attributeMasterService.attributeList({ attributeId: id, "search": '' }).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.AddAttributeForm.controls['attributeId']?.setValue(response?.data?.attributes[0].AttributeId);
        this.AddAttributeForm.controls['attributeName']?.setValue(response?.data?.attributes[0].AttributeName);
        this.AddAttributeForm.controls['isActive']?.setValue(response?.data?.attributes[0].IsActive);
        this.AddAttributeForm.controls['isConfigurable']?.setValue((response?.data?.attributes[0].IsConfigurable == 1) ? true : false);
        this.AddAttributeForm.controls['engravable']?.setValue((response?.data?.attributes[0].IsEngravable == 1) ? true : false);
        this.AddAttributeForm.controls['is_default']?.setValue((response?.data?.attributes[0].IsDefault == 1) ? true : false);
        this.isConfigurable = response?.data?.attributes[0].IsConfigurable;
        this.articleId = response?.data?.attributes[0].ArticleId;
        this.setDisplayIn(response)
        this.setAttributesAndImageView(articleData, imageView, response)
        this.updateAttributeList(response)
      }

    })
  }

  updateAttributeList(response: any) {
    if (response?.data?.attributes[0]?.attributeDetails && response?.data?.attributes[0]?.attributeDetails.length > 0) {
      response?.data?.attributes[0]?.attributeDetails.forEach((element: any) => {
        let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
        let form = this.formBuilder.group(this.setAttributeDetailFormValue(element));
        control.push(form);
      });
      if (this.AddAttributeForm.controls['attributeName'].value.toLowerCase().includes(AppConstants.METAL_COLOR)) {
        this.SetMetalColorValidation()
      }
    }
    else {
      this.addAttributeDetailForm()
    }
  }

  setAttributeDetailFormValue(element: any) {
    this.color.push(element.color);
    this.secondryColor.push(element.SecondryColor);
    return {
      attributeDetailId: [element.AttributeDetailId],
      attributeValue: [element.AttributeDetailValue, [Validators.required]],
      isActive: [element?.IsActive, [Validators.required]],
      base64_image_url: [element.AttributeDetailImage ? this.imageUrl + AppConstants.ATTRIBUTE_IMAGE_FOLDER_NAME + element.AttributeDetailImage : ''],
      color: [element.color ? element.color : ''],
      secondryColor: [element.SecondryColor ? element.SecondryColor : ''],
      isDelete: [1],
      filename: [element.AttributeDetailImage],
      engrav_base64_image_url: [element?.AttributeDetailEngravImg ? this.imageUrl + AppConstants.ATTRIBUTE_ENGRAVE_FOLDER_NAME + element.AttributeDetailEngravImg : ''],
      engrav_file_name: [element?.AttributeDetailEngravImg]

    }
  }

  setAttributesAndImageView(articleData: any, imageView: any, response: any) {
    let article_idx = articleData.findIndex(
      (x: any) => x.ArticleId === response?.data?.attributes[0].ArticleId
    );
    if (article_idx != -1) {
      this.AddAttributeForm.controls['articleId'].setValue(response?.data?.attributes[0].ArticleId);

    }
    else {
      this.AddAttributeForm.controls['articleId'].setValue('');
    }
    let imageView_idx = imageView.findIndex(
      (x: any) => x.ImageViewId === response?.data?.attributes[0].ImageViewId
    );
    if (imageView_idx != -1) {
      this.AddAttributeForm.controls['imageViewId'].setValue(response?.data?.attributes[0].ImageViewId);
    }
    else {
      this.AddAttributeForm.controls['imageViewId'].setValue('');
    }
  }


  setDisplayIn(response: any) {
    if (response?.data?.attributes[0].DisplayIn?.includes(',')) {
      this.AddAttributeForm.controls['is_product_details'].setValue(true);
      this.AddAttributeForm.controls['is_specification'].setValue(true);
    }
    else if (response?.data?.attributes[0].DisplayIn == AppConstants.PRODUCT_DETAIL) {
      this.AddAttributeForm.controls['is_product_details'].setValue(true);
      this.AddAttributeForm.controls['is_specification'].setValue(false);

    }
    else if (response?.data?.attributes[0].DisplayIn == AppConstants.SPECIFICATION) {
      this.AddAttributeForm.controls['is_product_details'].setValue(false);
      this.AddAttributeForm.controls['is_specification'].setValue(true);
    }
    else {
      this.AddAttributeForm.controls['is_product_details'].setValue(false);
      this.AddAttributeForm.controls['is_specification'].setValue(false);
    }
  }

  getImageView(articleData: any) {
    this.imageViewMasterService.imageViewListDropdown({}).subscribe((response: any) => {
      if (response && response.type == AppConstants.success) {
        this.imageViewData = response?.data?.imageViews;
        if (this.id > 0) {
          this.getAttributeList(this.id, articleData, this.imageViewData)
        }
      }
    })
  }

  get addAttributeDetailFormArray(): FormArray {

    return this?.AddAttributeForm?.get("attributeDetails") as FormArray
  }

  uploadAttachment($event: any, index: any, type: any) {
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
        const URL = window.URL || window.webkitURL;
        const Img = new Image();

        const filesToUpload = ($event.target.files);
        Img.src = URL.createObjectURL(filesToUpload[0]);

        Img.onload = (e: any) => {
          let image_path = e.path || (e.composedPath && e.composedPath());
          const height = image_path[0].height;
          const width = image_path[0].width;
          this.checkImageSizeValidation(filesToUpload, height, width, $event.target.files, index, type)
        }

      }
      else {
        this.toastr.errorToastr(AppConstants.VALID_IMAGE_NAME, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });

      }
    } else {
      this.toastr.errorToastr(AppConstants.WRONG_FILE_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    }
  }

  checkImageSizeValidation(filesToUpload: any, height: any, width: any, files: any, index: any, type: any) {
    if (this.AddAttributeForm.get('attributeName')?.value && (this.AddAttributeForm.get('attributeName')?.value?.toLocaleLowerCase() == AppConstants.WEIGHT || this.AddAttributeForm.get('attributeName')?.value?.toLocaleLowerCase() == AppConstants.BRACELETE_STYLE)) {

      if ((filesToUpload[0].size / 1024 / 1024) <= 2 && (height <= 400 && width <= 800)) {
        this.uploadImage(files, index, type)
      }
      else {
        this.toastr.errorToastr(AppConstants.ATTRIBUTEIMAGE_2NDSTEP_VALIDATION, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    }
    else {

      if ((filesToUpload[0].size / 1024 / 1024) <= 2 && (height <= 600 && width <= 600)) {
        this.uploadImage(files, index, type)
      }
      else {
        this.toastr.errorToastr(AppConstants.ATTRIBUTEIMAGE_VALIDATION, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    }
  }


  uploadImage(files: any, index: any, type: any) {
    if (files && files[0]) {
      let formData = new FormData()
      if (type == 'engrav_image') {
        formData.append('attributeDetailEngravImg', files[0])
      }
      else {
        formData.append('attributeDetailImage', files[0])
      }
      this.attributeMasterService.uploadFile(formData).subscribe((res: any) => {
        if (res && res.type == AppConstants.success) {
          const reader = new FileReader();
          reader.onload = (element: any) => {
            let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
            this.setImageData(control, type, index, element, res)

          };

          reader.readAsDataURL(files[0]);
        }
        else {
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      });

    }
  }

  setImageData(control: any, type: any, index: any, element: any, res: any) {
    if (type == 'engrav_image') {
      control.controls[index].get('engrav_base64_image_url')?.setValue(element.target.result)
      control.controls[index].get('engrav_file_name')?.setValue(res?.data?.uploadedFiles[0].filename)

    }
    else {
      control.controls[index].get('base64_image_url')?.setValue(element.target.result)
      control.controls[index].get('filename')?.setValue(res?.data?.uploadedFiles[0].filename)
    }
  }

  deleteAttribute(index: any, attribute_value_name: any, attribute_id: any) {

    let modalRef: any = this.modalService.show(ConfirmationDialogComponent, {
      class: 'modal-sm'
    });
    modalRef.content.mainHeading = AppConstants.DELETE_ATTRIBUTE_VALUE;
    modalRef.content.subHeading = AppConstants.CONFIRM_DELETE_VALUE;
    modalRef.content.buttonHeading1 = AppConstants.YES;
    modalRef.content.buttonHeading2 = AppConstants.NO;
    modalRef.content.title = attribute_value_name;
    modalRef.content.OnClose.subscribe((result: any) => {
      if (result == AppConstants.YES) {
        if (attribute_id) {
          this.deleteAttributeSubmit(attribute_id, index)
        }
        else {
          let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
          control.removeAt(index);
          this.color[index] = ''
          if (control.controls.length == 0)
            this.addAttributeDetailForm()
          this.toastr.successToastr(AppConstants.ATTRIBUTE_VALUE_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
      }
    });


  }

  deleteAttributeSubmit(attribute_id: any, index: any) {

    this.attributeMasterService.deleteAttributeValue({ articleId: this.articleId, isConfigurable: this.isConfigurable, attributeDetailId: attribute_id, attrId: this.AddAttributeForm.value.attributeId }).subscribe(response => {
      if (response && response.type == AppConstants.success) {
        let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
        control.removeAt(index);
        if (control.controls.length == 0)
          this.addAttributeDetailForm()
        this.toastr.successToastr(AppConstants.ATTRIBUTE_VALUE_DELETE, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
      else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      }
    })
  }

  deleteImage(index: any, type: any) {
    let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
    if (type == 'normal_image') {
      control.controls[index].get('base64_image_url')?.setValue('')
      control.controls[index].get('filename')?.setValue('')
    }
    else {
      control.controls[index].get('engrav_base64_image_url')?.setValue('')
      control.controls[index].get('engrav_file_name')?.setValue('')
    }
  }
  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      return false;
    }
    return true;
  }

  drop(event: CdkDragDrop<string[]>) {
    this.moveItemInFormArray(
      this.addAttributeDetailFormArray,
      event.previousIndex,
      event.currentIndex
    );
  }

  resetEngraveImage(event: any) {
    if (!event.target.checked) {
      let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
      for (const element of control.controls) {
        element.get('engrav_base64_image_url')?.setValue('')
        element.get('engrav_file_name')?.setValue('')
      }
    }
  }


  moveItemInFormArray(
    formArray: FormArray,
    fromIndex: number,
    toIndex: number
  ): void {
    const dir = toIndex > fromIndex ? 1 : -1;

    const item = formArray.at(fromIndex);
    for (let i = fromIndex; i * dir < toIndex * dir; i = i + dir) {
      const current = formArray.at(i + dir);
      formArray.setControl(i, current);
    }
    formArray.setControl(toIndex, item);
  }

  setEnableDisableArticle() {
    if (this.id > 0) {
      this.AddAttributeForm.get('articleId')?.disable();
      this.AddAttributeForm.get('isConfigurable')?.disable();
    }
    else {
      this.AddAttributeForm.get('articleId')?.enable();
      this.AddAttributeForm.get('isConfigurable')?.enable();
    }
  }

  onEventLog(data: any, index: any, type: number): void {
    let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
    if (control.controls && control.controls.length > 0) {
      if (type === 1) {
        control.controls[index].get('color')?.setValue(data);
        this.hideUploadImgOpt = true;
      }
      if (type === 2) {
        control.controls[index].get('secondryColor')?.setValue(data);
        this.hideUploadImgOpt = false;
      }
    }
  }
  SetMetalColorValidation() {
    let control = <FormArray>this?.AddAttributeForm?.controls['attributeDetails'];
    if (control.controls && control.controls.length > 0) {
      for (let i = 0; i < this.AddAttributeForm.get('attributeDetails')?.value.length; i++) {
        if (this.AddAttributeForm.controls['attributeName'].value.toLowerCase().includes(AppConstants.METAL_COLOR)) {
          control.controls[i].get('color')?.setValidators([Validators.required])
          control.controls[i].get('color')?.updateValueAndValidity();
        }
        else {
          control.controls[i].get('color')?.setValidators([])
          control.controls[i].get('color')?.updateValueAndValidity();
        }
      }
    }
  }
}
