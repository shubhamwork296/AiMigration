import { Component, ElementRef, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import { ToastrManager } from 'ng6-toastr-notifications';
import { CommonService } from 'src/app/core/service/common.service';
import { Router } from '@angular/router';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { BulkImportService } from 'src/app/core/service/bulk-import.service';
import { FileHandle } from '../../../../../shared/directives/dragDrop.directive';

@Component({
  selector: 'app-bulk-import',
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.scss']
})
export class BulkImportComponent {
  excelName: string = "";
  @ViewChild('fileInput') fileInput!: ElementRef;
  public payload: Array<any> = [];
  public disablesubmit: boolean = false;
  AppConstants: any =AppConstants;
  constructor(private toastr : ToastrManager,private commonService : CommonService,private router : Router,private bulkImportService : BulkImportService) { }
  

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    let file = event.target.files[0];
    let fileFormat = (file?.name).toString();
    let fileExt = fileFormat?.split('.')[fileFormat?.split('.').length - 1];
    // || fileExt == "xlsm" || fileExt == "xlsb" || fileExt == "xltx"
    
    if (fileExt == "xlsx" || fileExt == "xls" ) {
      if (event.target.files[0].size / 1024 <= 400) {
        this.excelName = file.name;
        if (target.files.length !== 1) {
          this.toastr.errorToastr(AppConstants.NOT_USE_MULTIPLE_FILE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
        const reader: FileReader = new FileReader();
        reader.readAsBinaryString(target.files[0]);
        this.excelReader(reader);
      }
      else  
      {
        this.toastForFileSizeExceed() 
      }
    }
    else 
    {
      this.toastForInvalidFile()
    }
   
  }
  
  excelReader(reader : any)
  {
    reader.onload = (e: any) => {
      /* create workbook */
      const binarystr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(binarystr, { type: 'binary', cellDates: true, dateNF: 'yyyy/mm/dd;@' });
      /* selected the first sheet */
        const wsname: string = wb.SheetNames[0];
        
        if (wsname == "Product Info" || wsname == "Products") {
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];

          /* save data */
          const data = XLSX.utils.sheet_to_json(ws, { raw: true, dateNF: 'yyyy/mm/dd' }); // to get 2d array pass 2nd parameter as object {header: 1}

          //for checking header columns should same 
          let header: any = XLSX.utils.sheet_to_json(ws, { header: 1 })[0];

          if(this.checkHeaderContet(header) || this.checkColums(header))
          {
            return
          }
     
          this.createData(data)
        }
        else{
          this.toastr.errorToastr(AppConstants.CORRECT_FORMAT, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          this.disablesubmit = true;
          this.fileInput.nativeElement.value = "";
          this.excelName = '';
        }
    }
  }

  checkColums(header : any) : any
  {
    if(header.length !== AppConstants.EXCEL_KEYWORD.length)
    {
      this.toastr.errorToastr(AppConstants.NOT_DEFINE_OPTION, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      this.fileInput.nativeElement.value = "";
      this.excelName = "";
      return true;
    }
  }

  checkHeaderContet(header : any) : any
  {
    for (const head of header) {
      if (AppConstants.EXCEL_KEYWORD?.indexOf(head) == -1) {
        this.toastr.errorToastr(AppConstants.NOT_DEFINE_OPTION, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        this.fileInput.nativeElement.value = "";
        this.excelName = "";
        return true;
      }
    }
  }

  createData(data : any)
  {
    let is_error : any = 0
    if (data != null && data.length > 0) {
      for(const element of data)
      {
        if(this.checkForErrors(element) ||  this.checkForMatchingBand(element))
        {
          is_error = 1
          break
        }
      }

      if(is_error == 1)
      {
        return
      }
      let temp = data.map((t: any) => {   
          return this.createDataFromExcel(t);
      });
        this.disablesubmit = false;
        this.payload = temp.filter((value : any) => Object.keys(value).length !== 0);
        if(this.checkMatchingBandSkuDuplicates(this.payload))
        {
          this.toastr.errorToastr(AppConstants.MATCHING_BAND_SKU_UNIQE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
          this.disablesubmit = true;
          this.fileInput.nativeElement.value = "";
          this.excelName = '';
          return
        }
    
        this.commonService.setBulkUploadData(this.payload);
    }
    else{
      this.toastr.errorToastr(AppConstants.FILE_EMPTY, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      this.disablesubmit = true;
      this.fileInput.nativeElement.value = "";
      this.excelName = '';
    }
  }

  createDataFromExcel(t : any) : any
  {
    let obj: any = {
      "ProductSKU": t["ProductSKU*"],
      "ProductType" : t["ProductType*"],
      "ProductName" :t["ProductName*"],
      "CategoryName" :t["CategoryName*"],
      "CategoryDescription" :t["CategoryDescription*"],
      "ArticleName" :t["ArticleName*"],
      "Description" :t["Description"] ? t["Description"] : '',
      "Price" :t["Price*"],
      "IncrementalFactor" :t["IncrementalFactor*"],
      "FileType" : this.getFileTypeValue(t),
      "Uri": t["Uri"] ? t["Uri"]: '' ,
      "ImageViewNameProdImage" : t["ImageViewNameProdImage"] ? t["ImageViewNameProdImage"] : '',
      "Mimetype" :this.getMimeTypeValue(t),
      "AttributeName" : t["AttributeName*"],
      "AttributeDetailValue" : t["AttributeDetailValue*"],
      "AttributeDetailImage" : t["AttributeDetailImage"],
      "Engravable" : t["Engravable*"],
      "JewelexSKU": t["JewelexSKU*"],
      "MatchingBand": t["MatchingBand*"] ? t["MatchingBand*"]: '' ,
      "MatchingBandProductSKU": t["MatchingBandProductSKU"] ? t["MatchingBandProductSKU"]: '' ,

    }

    return obj;
  }

  getFileTypeValue(t : any) : any
  {
    if( t["Uri"])
    {
      if(t["Mimetype"])
      {
        return t["Mimetype"]?.split('/')[0]
      }
      else 
      {
        return ''
      }
    }
    else 
    {
      return ''
    }
  }

  getFileExtensionValue(t : any) : any
  {
    if( t["Uri"])
    {
      if(t["Mimetype"])
      {
        return t["Mimetype"]?.split('/')[1]
      }
      else 
      {
        return ''
      }
    }
    else 
    {
      return ''
    }
  }
  getMimeTypeValue(t : any) : any
  {
    if(t["Uri"])
    {
      if( t["Mimetype"])
      {
        return  t["Mimetype"]
      }
      else 
      { 
        return ''
      }
    }
    else 
    {
      return ''
    }
  }

  
  
  checkForErrors(t: any) : any
  {
    if (t["ProductSKU*"] == undefined) {
      this.toastr.errorToastr(AppConstants.FILL_PRODUCT_SKU, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      this.disablesubmit = true;
      this.fileInput.nativeElement.value = "";
      this.excelName = '';
      return {};
    }

    if (t["ProductType*"] == undefined) {
      this.toastr.errorToastr(AppConstants.FILL_PRODUCT_TYPE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      this.disablesubmit = true;
      this.fileInput.nativeElement.value = "";
      this.excelName = '';
      return {};
    }
    
  if (t["ProductName*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_PRODUCT_NAME, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }
  if (t["CategoryName*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_CATEGORY_NAME, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }
  
  if (t["ArticleName*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_ARTICLE_NAME, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

  if (t["Price*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_PRICE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

  if (t["IncrementalFactor*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_INCREMENTAL_FACTOR, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }
  
 
  if (isNaN(Number(t["Price*"]))) {
    this.toastr.errorToastr(AppConstants.NUMERIC_FILE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

  if (isNaN(Number(t["IncrementalFactor*"]))) {
    this.toastr.errorToastr(AppConstants.NUMERIC_INCREMENTAL_FACTOR, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

  if (Number(t["Price*"]) < 0) {
    this.toastr.errorToastr(AppConstants.NOT_NEGATIVE_FILE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

  
  if (Number(t["IncrementalFactor*"]) < 0) {
    this.toastr.errorToastr(AppConstants.NOT_NEGATIVE_INCREMENTAL_FACTOR_FILE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

  if (t["AttributeName*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_ATTRIBUTE_NAME, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }
 

  if (t["AttributeDetailValue*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_ATTRIBUTE_VALUE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

 


  }

  checkForMatchingBand(t : any)
  {
    
  if (t["Uri"] !== undefined && t["Uri"] !== '' && t["Uri"] !== null) {
 
    if (t["Mimetype"] == undefined) {
      
      this.toastr.errorToastr(AppConstants.FILL_MIME_TYPE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      this.disablesubmit = true;
      this.fileInput.nativeElement.value = "";
      this.excelName = '';
      return {};
    }

    if(t["Uri"].split('.')[1] !== this.getFileExtensionValue(t))
    {
      this.toastr.errorToastr(AppConstants.FILE_TYPE_MISMATCH, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      this.disablesubmit = true;
      this.fileInput.nativeElement.value = "";
      this.excelName = '';
      return {};
    }
    
  }

  if (t["MatchingBand*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_MATCHING_BAND, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }

  if(t["MatchingBand*"]?.toLowerCase() == 'yes')
  {
    if (t["MatchingBandProductSKU"] == undefined) {
      this.toastr.errorToastr(AppConstants.FILL_MATCHING_BAND_SKU, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
      this.disablesubmit = true;
      this.fileInput.nativeElement.value = "";
      this.excelName = '';
      return {};
    }
  }

  if (t["Engravable*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_ENGRAVE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }
  
  if (t["JewelexSKU*"] == undefined) {
    this.toastr.errorToastr(AppConstants.FILL_JEWELEX_SKU, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.disablesubmit = true;
    this.fileInput.nativeElement.value = "";
    this.excelName = '';
    return {};
  }
  }

  onSubmit()
  {
    if(!this.payload || this.disablesubmit)
    {
      return
    }
    
    this.router.navigate(['/admin/bulk-import/products-import'])
  }

  importExecl()
  { 
    this.bulkImportService.importFormatExcel().subscribe((response : any)=>{
        if(response && response?.type == AppConstants.success)
        {
          this.download(response?.data?.sampleFileUrl,'Sample_Excel')
        }
        else{
          this.toastr.errorToastr(AppConstants.getErrorMessagesByStatus(response?.message), AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
    })
  }

  download(dataurl : any, filename : any) {
    const link = document.createElement("a");
    link.href = dataurl;
    link.download = filename;
    link.click();
  } 

  filesDropped(files: FileHandle[]): void {
    let file = files[0].file
    let fileFormat = (file.name).toString();
    let fileExt = fileFormat?.split('.')[fileFormat?.split('.').length - 1];
    if (fileExt == "xlsx" || fileExt == "xls" ) {
      
      if (file.size / 1024 <= 400) {
        this.excelName = file.name;
        if (files.length !== 1) {
          this.toastr.errorToastr(AppConstants.NOT_USE_MULTIPLE_FILE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
        }
        const reader: FileReader = new FileReader();
        reader.readAsBinaryString(file);
        this.excelReader(reader);
      }
      else  
      {
        this.toastForFileSizeExceed()   
      }
    }
    else 
    {
      this.toastForInvalidFile()
    }
  } 
  

  checkMatchingBandSkuDuplicates(data : any) : any
  {
    let valueArr : any = data.map(function(item : any){ 
      if(item.MatchingBand.toLowerCase() == 'yes')
      {
        return item.MatchingBandProductSKU 
      }
    });
    return valueArr.some(function(item : any, idx : any){ 
      if(item)
      {
        return valueArr.indexOf(item) != idx
      }
      else 
      {
        return false
      }
    });   
  }

  toastForInvalidFile(){
    this.toastr.errorToastr(AppConstants.INAVALID_FILE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.fileInput.nativeElement.value = ""; 
    this.excelName = '';
    this.disablesubmit = true
  }

  toastForFileSizeExceed()
  {
    this.toastr.errorToastr(AppConstants.EXCEED_FILE_SIZE, AppConstants.OOPS, { position: 'bottom-right', showCloseButton: true, animate: 'slideFromTop' });
    this.fileInput.nativeElement.value = "";   
    this.excelName = '';
    this.disablesubmit = true   
  }
}
