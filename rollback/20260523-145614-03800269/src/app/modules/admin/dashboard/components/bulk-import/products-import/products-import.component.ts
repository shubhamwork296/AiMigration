import { Component, OnInit } from '@angular/core';
import { CommonService } from 'src/app/core/service/common.service';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';
import { BulkImportService } from 'src/app/core/service/bulk-import.service';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { SessionService } from 'src/app/core/service/session.service';
import { debounceTime, Subject } from 'rxjs';
@Component({
  selector: 'app-products-import',
  templateUrl: './products-import.component.html',
  styleUrls: ['./products-import.component.scss']
})
export class ProductsImportComponent implements OnInit {

  matchingBandProducts : any = []
  imageData : any = []
  imageviewEmpty : any  = []
  attributeEmpty : any = []
  matchingBandEmpty : any  = []
  public productImportForm: FormGroup = this.fb.group({
    products: this.fb.array([]) 
  })
  validateResponse:any;
  recipeRecords = this?.productImportForm?.get('products') as FormArray;
  imageUrl: string = ''
  is_data_ready_to_import : any = 0
  defaultCurrency : any = AppConstants.DEFAULT_CURRENCY
  AppConstants : any  = AppConstants
  modelChanged: Subject<any> = new Subject<any>();
  initalFormValue : any;
  constructor(private commonService : CommonService ,private fb: FormBuilder,private router : Router,private toastr : ToastrManager,private bulkImportService : BulkImportService,private httpService : HttpService,private sessionService : SessionService) { 
    this.modelChanged.pipe(
      debounceTime(800))
      .subscribe((searchText : any) => {
        if(searchText?.type == AppConstants.FILE_TYPE_IMAGE)
        {
          let extension =  searchText?.value?.split('.')[1]
        
          if((extension == 'mp4' &&  searchText?.file_type == AppConstants.FILE_TYPE_IMAGE) || ((extension == 'png' || extension == 'jpg' || extension == 'jpeg' || extension == 'jfif') &&  searchText?.file_type == AppConstants.FILE_TYPE_VIDEO))
          {
            this.getImages(searchText?.index).controls[searchText?.form_index].get('front_error')?.setValue(AppConstants.NOT_VALID_FILE_TYPE)
          }
          else if(!extension)
          {
            this.getImages(searchText?.index).controls[searchText?.form_index].get('front_error')?.setValue(AppConstants.NOT_VALID_FILE_NAME)
          }
          else{
            this.getImages(searchText?.index).controls[searchText?.form_index].get('front_error')?.setValue('')
          }
        }
        
      })

      this.productImportForm.valueChanges.pipe(debounceTime(50)).subscribe((_newValue : any) => {
        if (this.isFormDirty()) {
          this.is_data_ready_to_import = 0
          this.productImportForm.markAsDirty();
        } else {
          this.productImportForm.markAsPristine();
        }
      });
  }
 
  ngOnInit(): void { 
 
    let requestData : any = this.commonService.getBulkUploadData();
    this.requestEmpty(requestData)
    requestData?.forEach((element : any) => {
      element['ischecked'] = false;
    });
    let newRequest : any = []
    if(requestData?.length  > 1)
    {
      newRequest = this.multipleFileDataRequest(requestData)
    }
    else if(requestData?.length == 1)
    {
      newRequest = this.singleFileDataRequest(requestData)
    }
    this.defaultCurrency = this.sessionService.getSession('currency');
    this.sendBulkDataRequest(newRequest)

  }

  multipleFileDataRequest(requestData : any): any
  {  
    let newRequest  = []
    let attributeData : any = []
    let imageData : any = []
    let matchingBandProducts: any = []
    
    for(let i=0;i<requestData.length-1;i++)
      {
        attributeData = []
        imageData = []
        matchingBandProducts = []
        this.imageData = []
        this.matchingBandProducts = []
        if(!requestData[i].ischecked)
        {
          for(let j=i+1;j<requestData.length;j++)
          {
            if(requestData[i].ProductSKU == requestData[j].ProductSKU)
            {
              imageData = this.updateImageData(requestData,i,j)
              attributeData.push( {
                "AttributeName" : requestData[i].AttributeName,
                "AttributeDetailValue": requestData[i].AttributeDetailValue,
                "AttributeDetailImage" : requestData[i].AttributeDetailImage
              })
              attributeData.push({
                "AttributeName" : requestData[j].AttributeName,
                "AttributeDetailValue": requestData[j].AttributeDetailValue,
                "AttributeDetailImage" : requestData[j].AttributeDetailImage
              })
              matchingBandProducts = this.updateMatchingBandData(requestData,i,j)
              requestData[j]['ischecked'] =true
            } 
          }
          
          attributeData = this.isAttributeEmpty(attributeData,requestData,i)
          imageData = this.isImageEmpty(imageData,requestData,i)
          matchingBandProducts = this.isMatchingBandEmpty(matchingBandProducts,requestData,i)
          const uniqueAttributeArray = attributeData.filter((thing : any, index : any) => {
            const _thing = JSON.stringify(thing);
            return index === attributeData.findIndex((obj : any) => {
              return JSON.stringify(obj) === _thing;
            });
          }); 
          
          const uniqueMatchingBandArray = matchingBandProducts.filter((thing : any, index : any) => {
            const _thing = JSON.stringify(thing);
            return index === matchingBandProducts.findIndex((obj : any) => {
              return JSON.stringify(obj) === _thing;
            });
          });
          const uniqueImageViewArray = imageData.filter((thing : any, index : any) => {
            const _thing = JSON.stringify(thing);
            return index === imageData.findIndex((obj : any) => {
              return JSON.stringify(obj) === _thing;
            });
          });
          
          newRequest.push(this.createBulKRequest(requestData,i,uniqueAttributeArray,uniqueMatchingBandArray,uniqueImageViewArray))
        }
    }

    return newRequest;
  }

  sendBulkDataRequest(newRequest : any)
  {
    if(newRequest && newRequest.length > 0)
    {
      let bulk_report = {
        products :newRequest 
      }
      this.checkBulkImportValidation(bulk_report)
    }
  }

  requestEmpty(requestData : any)
  {
    if(!requestData || requestData.length == 0)
    {
      this.router.navigate(['/admin/bulk-import'])
    }
  }

  isAttributeEmpty(attributeData : any,requestData : any,i : any) : any
  {
    this.attributeEmpty = []
    if(attributeData.length == 0)
    {
      this.attributeEmpty.push({
        "AttributeName" : requestData[i].AttributeName,
        "AttributeDetailValue": requestData[i].AttributeDetailValue,
        "AttributeDetailImage" : requestData[i].AttributeDetailImage
      })
    }
    return (this.attributeEmpty && this.attributeEmpty.length > 0) ?this.attributeEmpty :attributeData ;
  }

  isImageEmpty(imageData: any, requestData : any, i : any)
  {
    
    this.imageviewEmpty = []
    if(imageData.length == 0 && (requestData[i].Uri !== '' && requestData[i].Uri !== null && requestData[i].Uri !== undefined))
    {
      this.imageviewEmpty.push({
        "Uri": requestData[i].Uri,
        "FileType": requestData[i].FileType,
        "Mimetype": requestData[i].Mimetype,
        "ImageViewNameProdImage" : requestData[i].ImageViewNameProdImage
      })
    }

    return (this.imageviewEmpty && this.imageviewEmpty?.length > 0) ? this.imageviewEmpty : imageData
  }
  isMatchingBandEmpty(matchingBandProducts: any, requestData : any, i : any)
  {
    this.matchingBandEmpty = []
    if(matchingBandProducts.length == 0 && requestData[i]?.MatchingBand?.toLowerCase() == 'yes' && (requestData[i].MatchingBandProductSKU !== '' && requestData[i].MatchingBandProductSKU!== null && requestData[i].MatchingBandProductSKU!== undefined))
    {
      this.matchingBandEmpty.push({
        
        "MatchingProductSKU": requestData[i].MatchingBandProductSKU,

      })
    }

    return (this.matchingBandEmpty && this.matchingBandEmpty?.length > 0) ? this.matchingBandEmpty : matchingBandProducts
  }

  singleFileDataRequest(requestData : any) : any
  {
    let newRequest : any = []
    let attributeData : any = []
    let imageData : any = []
    let matchingBandProducts: any = []
    for (const bulk_data_report of requestData) {
      if(bulk_data_report.Uri !== '' && bulk_data_report.Uri !== null && bulk_data_report.Uri !== undefined)
          {
            imageData.push({
            
              "Uri": bulk_data_report.Uri,
              "FileType": bulk_data_report.FileType,
              "Mimetype": bulk_data_report.Mimetype,
              "ImageViewNameProdImage" : bulk_data_report.ImageViewNameProdImage
            })
          }

        attributeData.push( {
          "AttributeName" : bulk_data_report.AttributeName,
          "AttributeDetailValue": bulk_data_report.AttributeDetailValue,
          "AttributeDetailImage" : bulk_data_report.AttributeDetailImage
        })

        if(bulk_data_report?.MatchingBand?.toLowerCase() == 'yes')
        {
          
          if(bulk_data_report.MatchingBandProductSKU !== '' && bulk_data_report.MatchingBandProductSKU !== null && bulk_data_report.MatchingBandProductSKU !==undefined)
          {
            matchingBandProducts.push({
          
              "MatchingProductSKU": bulk_data_report.MatchingBandProductSKU,
  
            })
          }
        }
        
        newRequest.push({
          ProductType : bulk_data_report.ProductType,
          ProductSKU : bulk_data_report.ProductSKU,
          JewelexSKU : bulk_data_report.JewelexSKU,
          ProductName : bulk_data_report.ProductName,
          CategoryName : bulk_data_report.CategoryName,
          ArticleName : bulk_data_report.ArticleName,
          Description : bulk_data_report.Description,
          Price : bulk_data_report.Price,
          IncrementalFactor : bulk_data_report.IncrementalFactor,
          AttributeDetails: attributeData,
          Engravable : bulk_data_report.Engravable.toLowerCase() == 'yes' ? 1 : 0,
          MatchingBand : bulk_data_report.MatchingBand.toLowerCase() == 'yes' ? 1 : 0,
          ImageViewDetails : imageData,
          MatchingBandProducts : matchingBandProducts
        })
    }

    return newRequest
  }

  updateImageData(requestData : any ,i : any ,j : any) : any
  {
    if(requestData[i].Uri !== '' && requestData[i].Uri !== null && requestData[i].Uri !== undefined)
              {
                this.imageData.push({
                
                  "Uri": requestData[i].Uri,
                  "FileType": requestData[i].FileType,
                  "Mimetype": requestData[i].Mimetype,
                  "ImageViewNameProdImage" : requestData[i].ImageViewNameProdImage
                })
    }
    if(requestData[j].Uri !== '' && requestData[j].Uri !== null && requestData[j].Uri !== undefined)
    {
      this.imageData.push({
        
        "Uri": requestData[j].Uri,
        "FileType": requestData[j].FileType,
        "Mimetype": requestData[j].Mimetype,
        "ImageViewNameProdImage" : requestData[j].ImageViewNameProdImage
      })
    }

    return this.imageData
  }

  updateMatchingBandData(requestData : any ,i : any ,j : any) : any
  {

    if(requestData[i]?.MatchingBand?.toLowerCase() == 'yes')
    {
      if(requestData[i].MatchingBandProductSKU !== '' && requestData[i].MatchingBandProductSKU !== null && requestData[i].MatchingBandProductSKU !==undefined)
      {
        this.matchingBandProducts.push({
      
          "MatchingProductSKU": requestData[i].MatchingBandProductSKU,

        })
      }
    } 
    if(requestData[j]?.MatchingBand?.toLowerCase() == 'yes')
    {
      if(requestData[j].MatchingBandProductSKU !== '' && requestData[j].MatchingBandProductSKU !== null && requestData[j].MatchingBandProductSKU !==undefined)
      {
        this.matchingBandProducts.push({
          
          "MatchingProductSKU": requestData[j].MatchingBandProductSKU,

        })  
      }
    }
      

    
    return this.matchingBandProducts
  }

  createBulKRequest(requestData: any,i: any,uniqueAttributeArray: any,uniqueMatchingBandArray: any,uniqueImageViewArray: any)
  {
    return {
      ProductType : requestData[i].ProductType,
      ProductSKU : requestData[i].ProductSKU,
      JewelexSKU : requestData[i].JewelexSKU,
      ProductName : requestData[i].ProductName,
      CategoryName : requestData[i].CategoryName,
      ArticleName : requestData[i].ArticleName,
      Description : requestData[i].Description,
      Price : requestData[i].Price,
      IncrementalFactor : requestData[i].IncrementalFactor,
      AttributeDetails: uniqueAttributeArray,
      Engravable : requestData[i].Engravable.toLowerCase() == 'yes' ? 1 : 0,
      MatchingBand : uniqueMatchingBandArray?.length > 0? 1 : 0,
      ImageViewDetails : uniqueImageViewArray,
      MatchingBandProducts : uniqueMatchingBandArray
    }
  }

  getProductsBulkListing() {
    const productCtrl = this?.productImportForm?.get('products') as FormArray;
    
    if (productCtrl.length > 0) productCtrl.clear();
    let count = 0;    
    this.validateResponse?.forEach((product: any) => {
     
      let newProduct:any =  this.newProduct(product)
      let control = < FormArray > newProduct.controls['AttributeDetails'];
      let image_control = < FormArray > newProduct.controls['ImageViewDetails'];
      let matching_band_control = < FormArray > newProduct.controls['MatchingBandsDetails'];
      if(product?.AttributeDetails && product?.AttributeDetails?.length > 0)
      {
        product?.AttributeDetails?.forEach((element : any)=>{
          
          control.push(this.updateAttributeDetails(element,control)); 
        });
      } 
      if(product?.ImageViewDetails && product?.ImageViewDetails?.length > 0)
      {
        product?.ImageViewDetails?.forEach((element : any)=>{
        
          image_control.push(this.updateImageViewDetails(element)); 
        });
      }
      if(product?.MatchingBandProducts && product?.MatchingBandProducts?.length > 0)
      {
        product?.MatchingBandProducts?.forEach((element : any) => {
          
          matching_band_control.push(this.updateMatchingBand(element,matching_band_control)); 
        });
      }
     
      let someErrors = Object.values(product.error).some((e : any) => e.length);
      if(someErrors)
      {
        count ++
      }
      productCtrl.push(newProduct);
    });
    if(count == 0){
      this.is_data_ready_to_import = 1
      this.initalFormValue = this.productImportForm.value;
      this.toastr.successToastr(AppConstants.DATA_READY_SUCSSES, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    }
    
  }


  updateAttributeDetails(element: any,control: any)
  {
    return this.fb.group({        
      AttributeName:  new FormControl(element.AttributeName ?element.AttributeName: '',[Validators.required]),
      AttributeDetailValue:  new FormControl(element.AttributeDetailValue ?element.AttributeDetailValue: '' ,[Validators.required]),
      attribute_error : new FormControl(element?.error?.AttributeName ? element?.error?.AttributeName: ''),
      detail_value_error : new FormControl(element?.error?.AttributeDetailValue ? element?.error?.AttributeDetailValue: ''),
      isDelete: [(control.length > 0) ? 1 : 0],
      AttributeDetailImage : new FormControl(element.AttributeDetailImage ?element.AttributeDetailImage: ''),
      OriginalAttributeDetailImage : new FormControl(element.OriginalAttributeDetailImage ?element.OriginalAttributeDetailImage: ''),
      AttributeDetailImageError : new FormControl(element?.error?.AttributeDetailImage ? element?.error?.AttributeDetailImage: '')
    }); 
  }

  updateImageViewDetails(element: any)
  {
    return this.fb.group({        
      Uri:  new FormControl(element.Uri ?element.Uri: ''),
      FileType:  new FormControl(element.FileType ?element.FileType: ''),
      MimeType : new FormControl(element.Mimetype ? element.Mimetype : ''),
      ImageViewNameProdImage : new FormControl(element.ImageViewNameProdImage ? element.ImageViewNameProdImage : ''),
      originalUri : new FormControl(element.originalUri ? element?.originalUri : ''),
      error : new FormControl(element?.error?.Uri ? element?.error?.Uri : ''),
      front_error : new FormControl('')
    }); 
  }

  updateMatchingBand(element : any,matching_band_control : any)
  {
    return this.fb.group({        
      MatchingProductSKU:  [element.MatchingProductSKU ?element.MatchingProductSKU: '',[Validators.required,this.validateMatchingBandUniq(matching_band_control ? matching_band_control?.length : 0)]],
      error : new FormControl(element?.error?.matchingProductSKU ? element?.error?.matchingProductSKU: '')
    });     
  }
  newProduct(data:any){
    return this.fb.group({
      ProductType : [data?.ProductType ? data?.ProductType : '',[Validators.required]],
      ProductSKU : [data?.ProductSKU ? data?.ProductSKU : '',[Validators.required]],
      JewelexSKU : [data?.JewelexSKU ? data?.JewelexSKU : '',[Validators.required]],
      ProductName : new FormControl(data?.ProductSKU ? data?.ProductName : '',[Validators.required]),
      CategoryName : new FormControl(data?.CategoryName ? data?.CategoryName : '',[Validators.required]),
      ArticleName : new FormControl(data?.CategoryName ? data?.ArticleName : '',[Validators.required]),
      Price : new FormControl(data?.Price ? data?.Price : '',[Validators.required]),
      IncrementalFactor : new FormControl(data?.IncrementalFactor ? data?.IncrementalFactor : '',[Validators.required]),
      Description : new FormControl(data?.Description ? data?.Description : '',[Validators.required]),
      Engravable : new FormControl(data?.Engravable == 1 ? true :  false),
      MatchingBand : new FormControl(data?.MatchingBand == 1 ? true :  false),
      AttributeDetails: new FormArray([]),
      ImageViewDetails: new FormArray([]),
      MatchingBandsDetails: new FormArray([]),
      IsOpen : new FormControl(data?.is_open)
    });
  }


  discardRecord(i:number){
    this.recipeRecords.removeAt(i);
    this.validateResponse.splice(i,1);
    if(this.getFormArray().controls.length == 0)
    {
      this.router.navigate(['/admin/bulk-import'])
    }
  }
  validateErrors(){
    let control  : any= this.getFormArray()
    let is_valid = 0 
    let is_attribute_error = 0
    let is_image_error = 0
    let is_matching_band_error = 0
    is_attribute_error =this.checkForAttribute(control);
    for(let i=0;i<control.controls.length;i++)
    {
      is_image_error = this.validateImageView(control,i)
      
      for (const matchingBand of control.controls[i]['controls'].MatchingBandsDetails.value) {
        if(matchingBand.error)
        {
          is_matching_band_error = 1
          break;
        }
      }
    } 
   
    is_valid = this.deleteErrors(is_attribute_error,is_image_error,is_matching_band_error)
    if(is_valid == 1 || is_attribute_error == 1 || is_image_error == 1 )
    {
      return
    }

    this.validateBulkData(control)
    
  }

  validateImageView(control : any, i : any )
  {
    let is_image_error = 0
    for (const imageView of control.controls[i]['controls'].ImageViewDetails.value) {
      if(imageView.error || imageView.front_error)
      {
        is_image_error = 1
        break;
      }
    }
    return is_image_error;
  }
  
  checkForAttribute(control : any)
  {
    let is_attribute_error = 0
    for(const element of control.controls)
    {
      for (const attribute of element['controls'].AttributeDetails.value) {
        if(attribute.attribute_error || attribute.detail_value_error)
        {
          is_attribute_error = 1
          break;
        }
      }
    }
    return is_attribute_error
  }
  

  deleteErrors(is_attribute_error: any,is_image_error:any,is_matching_band_error : any) : any
  {
    let is_valid = 0 
    if(is_attribute_error == 0)
    {
      for (const validate of this.validateResponse) {
        let prop : any= 'AttributeDetails'
        let error: any  = validate?.error
        delete error[prop]
      }
    }
    
    if(is_image_error == 0)
    {
      for (const validate of this.validateResponse) {
        let prop : any= 'ImageViewDetails'
        let error: any  = validate?.error
        delete error[prop]
      }
    }
  
    if(is_matching_band_error == 0)
    {
      for (const validate of this.validateResponse) {
        let prop : any = 'MatchingBandProducts'
        let error: any  = validate?.error
        delete error[prop]
      }
    }

    if(this.validateResponse)
    {
      for (const validate of this.validateResponse) {
        let someErrors = Object.values(validate.error).some((e : any) => e.length);
        if(someErrors)
        {
          is_valid = 1
          break;
        }
      }
      
    }

    return is_valid
  }
 
  validateBulkData(control : any)
  {
    let requestData:any = [];
    for (const fromcontrol of control.controls) {
      let attributes = []
      let images = []
      let matchingBand : any = []
      
      for (const attribute of fromcontrol['controls'].AttributeDetails.value) {
        attributes.push({
          AttributeName : attribute.AttributeName,
          AttributeDetailValue : attribute.AttributeDetailValue,
          AttributeDetailImage : attribute.OriginalAttributeDetailImage
        })
      }

      for (const imageview of fromcontrol['controls'].ImageViewDetails.value) {
        images.push({
          Uri : imageview.originalUri,
          FileType : imageview.FileType,
          Mimetype : imageview.MimeType,
          ImageViewNameProdImage : imageview.ImageViewNameProdImage
        })
      }
      if(fromcontrol['controls'].MatchingBand?.value)
      {
        
        for (const matchingband of fromcontrol['controls'].MatchingBandsDetails.value) {
          if(matchingband.MatchingProductSKU)
          {
            matchingBand.push({
              MatchingProductSKU : matchingband.MatchingProductSKU
            })
          }

        }
       
      }
     
      requestData.push(this.createRequest(fromcontrol,attributes,images,matchingBand))
    }
    
    let bulk_report = {
      products : requestData
    }
    this.checkBulkImportValidation(bulk_report)
    
  }

  checkBulkImportValidation(bulk_report: any)
  {
    this.bulkImportService.bulkImportValidation(bulk_report).subscribe({
      next: this.handleUpdateResponse.bind(this),
      error: this.handleError.bind(this)
   });
  }

  handleError(_error : any)
  {
    this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(_error.message,AppConstants.SOMETING_WRONG), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
  }

  handleUpdateResponse(response: any)
  {
    if(response?.type == AppConstants.success)
    {
     this.UpdateData(response)
    }
    else {
      this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    }
  }

  UpdateData(response : any)
  {
    this.httpService.getConfig().subscribe((config) => {
          
      this.imageUrl = config.imageUrl;
      response?.data?.products.forEach((element : any,index : any) => {
        this.updateImageDetails(element)

        if(index == 0)
        {
          element['is_open'] =1
        }
        else 
        {
          element['is_open'] = 0
        }
      });
      this.validateResponse = response?.data?.products;   
      this.getProductsBulkListing();
      
    })
  }

  updateImageDetails(element : any)
  {
    element?.ImageViewDetails?.forEach((images : any) => {
      images.originalUri = images.Uri
      if(!images?.Uri?.includes(this.imageUrl))
      {
        images.Uri = (images.Uri ? this.imageUrl+AppConstants.PRODUCT_IMAGE_FOLDER_NAME+images.Uri : '')
      }
    });

    element?.AttributeDetails?.forEach((attribute : any)=>{
      attribute.OriginalAttributeDetailImage = attribute?.AttributeDetailImage
      if(!attribute?.Uri?.includes(this.imageUrl))
      {
        attribute.AttributeDetailImage = (attribute.AttributeDetailImage ? this.imageUrl + AppConstants.ATTRIBUTE_IMAGE_FOLDER_NAME + attribute.AttributeDetailImage : '')
      }
    })
  }
  
  import(){
    let requestData:any = [];
    let control  : any= this.getFormArray()
    
    for (const fromcontrol of control.controls) {
      let attributes = []
      let images : any= []
      let matchingBand :any= []
      
      for (const attribute of fromcontrol['controls'].AttributeDetails.value) {
        attributes.push({
          AttributeName : attribute.AttributeName,
          AttributeDetailValue : attribute.AttributeDetailValue,
          AttributeDetailImage : attribute.OriginalAttributeDetailImage
        })
      }

      images = this.updateImageRecords(fromcontrol)
      
     if(fromcontrol['controls'].MatchingBand?.value)
      {
        
        for (const matchingband of fromcontrol['controls'].MatchingBandsDetails.value) {
          matchingBand.push({
            MatchingProductSKU : matchingband.MatchingProductSKU
          })
        }
       
      }
    
      requestData.push(this.createRequest(fromcontrol,attributes,images,matchingBand))
    }
    
    let bulk_report = {
      products : requestData
    }
  
    this.bulkImportService.saveBulkImport(bulk_report).subscribe((res:any)=>{
      if(res?.type == AppConstants.success){ 
        this.toastr.successToastr(AppConstants.DATA_IMPORT_SUCCESS, AppConstants.SUCCESS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(res.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    
      }
    });
  }

  updateImageRecords(fromcontrol : any)
  {
    let images : any  = []
    for (const imageview of fromcontrol['controls'].ImageViewDetails.value) {
      if(imageview.originalUri)
      {
        images.push({
          Uri : imageview.originalUri,
          FileType : imageview.FileType,
          Mimetype : imageview.MimeType,
          ImageViewNameProdImage : imageview.ImageViewNameProdImage
        })
      }

    }
    return images;
  }

  createRequest(fromcontrol : any,attributes : any,images : any,matchingBand : any) : any
  {
    return {
      ProductType : fromcontrol['controls'].ProductType.value,
      ProductSKU  : fromcontrol['controls'].ProductSKU.value,
      JewelexSKU : fromcontrol['controls'].JewelexSKU.value,
      ProductName  : fromcontrol['controls'].ProductName.value,
      CategoryName  : fromcontrol['controls'].CategoryName.value,
      ArticleName  : fromcontrol['controls'].ArticleName.value,
      Description  : fromcontrol['controls'].Description.value,
      Price  : fromcontrol['controls'].Price.value,
      IncrementalFactor : fromcontrol['controls'].IncrementalFactor.value,
      AttributeDetails  : attributes,
      ImageViewDetails : images,
      Engravable : fromcontrol['controls'].Engravable.value ? 1: 0,
      MatchingBand : fromcontrol['controls'].MatchingBand.value ? 1 : 0,
      MatchingBandProducts : fromcontrol['controls'].MatchingBand.value ? matchingBand : []
    }

  }

  getFormArray(): FormArray {
    return this?.productImportForm?.get('products') as FormArray;
  }



  getAttribute(empIndex:number) : FormArray {
    return this.getFormArray()?.at(empIndex)?.get("AttributeDetails") as FormArray
  }

  getImages(empIndex:number) : FormArray {
    return this.getFormArray()?.at(empIndex)?.get("ImageViewDetails") as FormArray
  }

  discardProductRecord(index: any,product_index: any)
  {
    this.getAttribute(index).removeAt(product_index);
    this.productImportForm.markAsTouched()
    this.markFormAsTouched()
  }

  discardImageRecord(index: any,image_index: any)
  {
    this.getImages(index).removeAt(image_index);
    this.markFormAsTouched()
  }
  discardMatchingBandRecord(index : any,band_index : any)
  {
    this.getMatchingBands(index).removeAt(band_index)
    this.markFormAsTouched()
  }

  markFormAsTouched()
  {
    this.productImportForm.markAsTouched()
  }

  getMatchingBands(empIndex:number) : FormArray {
    return this.getFormArray()?.at(empIndex)?.get("MatchingBandsDetails") as FormArray
  }

  resetFormArrayError(index : any,form_index: any,type : string,file_type?: any,event? : any)
  {

    if(type == 'image')
    {
      let object = {
        index : index,
        form_index : form_index,
        type : type,
        file_type : file_type,
        value : event?.target?.value,
      }
      
      this.modelChanged.next(object);
      this.getImages(index).controls[form_index].get('error')?.setValue('')
    }

    if(type == 'attribute_name')
    {
      this.getAttribute(index).controls[form_index].get('attribute_error')?.setValue('');
    }

    if(type == 'attribute_value')
    {
      this.getAttribute(index).controls[form_index].get('detail_value_error')?.setValue('');
    }
    if(type == 'attribute_image')
    {
      this.getAttribute(index).controls[form_index].get('AttributeDetailImageError')?.setValue('');
    }
    if(type == 'matchingband')
    {
      this.getMatchingBands(index).controls[form_index].get('error')?.setValue('')
      this.changeMatchingBand(index)
    }
    
  }

  checkForError(index:any,field:any) : string{


    if(this.validateResponse && this.validateResponse[index]?.MatchingBandProducts && this.validateResponse[index]?.MatchingBandProducts?.length > 0 && field == 'MatchingBandProducts') 
    {
      return '' 
    }
    let product = this.validateResponse[index];
    return   product.error[field]
  }

  resetErrors(index:any,field:any)
  {
    let product = this.validateResponse[index];
    delete product.error[field]
  }

  toggle(index : any)
  {
    if(this.getFormArray().controls[index].get('IsOpen')?.value == 1)
    {
      this.getFormArray().controls[index].get('IsOpen')?.setValue(0);
    } 
    else {
      this.getFormArray().controls[index].get('IsOpen')?.setValue(1)
    }   
  }


  numbersOnly(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      return false;
    }
    return true;
  }

  setProductHasError(index : any) : boolean
  {
    if(this.validateResponse)
    {
        return Object.values(this.validateResponse[index].error).some((e : any) => e.length)
    }
    return false;
  }
  

  changeMatchingBand(index : any)
  {
    let product = this.validateResponse[index];
    let prop : any= 'MatchingBandProducts'
    let error  : any = product?.error;
    delete error[prop]
    
  }  


  validateMatchingBandUniq(index : any) {
    return (control: AbstractControl) => {
      if (control.value) {
        const formArray = control.parent
          ? (control?.parent?.parent as FormArray)
          : null;
        if (formArray) {
          const attributes = formArray.value.map((x :any) => x.MatchingProductSKU);
          return attributes.indexOf(control.value)>=0 && attributes.indexOf(control.value)<index
            ? { duplicateName: true }
            : null;
        }
      }
    };
  }

  checkMatchingBandDuplicacy(index : any,sub_index : any) {
    this.getMatchingBands(index).controls.forEach((x,i)=>{
      if (sub_index!=i)
        (x as FormGroup)?.get('MatchingProductSKU')?.updateValueAndValidity()
    })
  }

  getMatchingBandDisplayNameAt(index: number,sub_index : any) {
    return this.getMatchingBands(index)
      ? (this.getMatchingBands(index)?.at(sub_index)?.get('MatchingProductSKU') as FormControl)
      : null;
  }

  validateProductSkuUniq(index : any) {
    return (control: AbstractControl) => {
      if (control.value) {
        const formArray = control.parent
          ? (control?.parent?.parent as FormArray)
          : null;
        if (formArray) {
          const attributes = formArray.value.map((x :any) => x.ProductSKU);
          return attributes.indexOf(control.value)>=0 && attributes.indexOf(control.value)<index
            ? { duplicateName: true }
            : null;
        }
      }
    };
  }

  checkProductSkuDuplicacy(index : any) {
    this.getFormArray().controls.forEach((x,i)=>{
      if (index!=i)
        (x as FormGroup)?.get('ProductSKU')?.updateValueAndValidity()
    })
  }

  getProductSkuDisplayNameAt(index: number) {
    return this.getFormArray()
      ? (this.getFormArray()?.at(index)?.get('ProductSKU') as FormControl)
      : null;
  }


  validateJewelexSkuUniq(index : any) {
    return (control: AbstractControl) => {
      if (control.value) {
        const formArray = control.parent
          ? (control?.parent?.parent as FormArray)
          : null;
        if (formArray) {
          const attributes = formArray.value.map((x :any) => x.JewelexSKU);
          return attributes.indexOf(control.value)>=0 && attributes.indexOf(control.value)<index
            ? { duplicateName: true }
            : null;
        }
      }
    };
  }

  checkJewelexSkuDuplicacy(index : any) {
    this.getFormArray().controls.forEach((x,i)=>{
      if (index!=i)
        (x as FormGroup)?.get('JewelexSKU')?.updateValueAndValidity()
    })
  }

  getJewelexSkuDisplayNameAt(index: number) {
    return this.getFormArray()
      ? (this.getFormArray()?.at(index)?.get('JewelexSKU') as FormControl)
      : null;
  }

  checkModelVal(index: any) {
    return  this.getFormArray().controls[index].get('ProductSKU')?.value !== this.getFormArray().controls[index].get('JewelexSKU')?.value ;
  }
 
  
  isFormDirty(): boolean {
    return (
      JSON.stringify(this.initalFormValue) !== JSON.stringify(this.productImportForm.value)
    );
  }
}
