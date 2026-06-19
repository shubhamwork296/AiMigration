import { ChangeDetectorRef, Component, ElementRef, Injector, OnInit, ViewChild} from '@angular/core';
import { ResponseData } from 'src/app/models/common/response.model';
import { PaymentVoucherDto, BillingAgreement, UpdatePaymentCardsDto, SmartCardDto, SmartCardDetails, OrderSmartCard, GeneralInformation, ConfirmSmartCardRequestDto, MySmartCardsStatus, TransferSmartCardRequestDto, TransferSmartCardUserResponseDto, TransferSmartCardDto, SmartCardData, LinkSmartCardDto, OrderSmartCardResponseDto, RegisterSmartCardDto, ChangeReplaceSmartCardDto, ChangeReplaceResponseDto, DeliveryDetail } from 'src/app/models/account/my-payment-vouchers.model';
import { MyAccountService } from 'src/app/services/my-account.service';
import { BookingTypeEnum, AppRouteEnum, PaymentAndVoucherCreditCardTypeEnum } from 'src/app/utility/app-constants.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatDatepicker } from '@angular/material/datepicker';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { CustomerRequest } from 'src/app/models/account/my-profile.model';
import { ConfirmPopupComponent } from '../../review-and-buy/confirm-popup/confirm-popup.component';
import { CommonServices } from 'src/app/services/common.service';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Address, CustomerLoginResponse, CustomerAddress } from 'src/app/models/customer/customer-login-response.model';
import { RequestSuccessfulComponent } from './request-successful/request-successful.component';
import { CustomerInfoUpdate } from 'src/app/models/account/my-preferences.model';
import { AddressService } from 'src/app/services/address.service';
import { ChangeSmartcardpopupComponent } from './change-smartcardpopup/change-smartcardpopup.component';
import { checkUserName, validateEmailRegex } from 'src/app/utility/custom-validations/must-match-validation';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { Subscription } from 'rxjs';
declare var pca: any;


export interface PeriodicElement {
  bookingdate: string;
  reference: string;
  status: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  { reference: 'WXBF97L8(1888296)', bookingdate: 'Thu 29 Oct, 2019', status: 'In progress' },
];

@Component({
    selector: 'app-payments-vouchers',
    templateUrl: './payments-vouchers.component.html',
    styleUrls: ['./payments-vouchers.component.css'],
    standalone: false
})
export class PaymentsVouchersComponent implements OnInit {
  @ViewChild('dp', {static:false}) dp;

  panelOpenState = false;
  responseData: ResponseData;
  paymentVoucherResponse: PaymentVoucherDto;
  paymentCards: BillingAgreement[];
  customerRequest: CustomerRequest;
  generalInfo: GeneralInformation;
  maxDate = new Date();
  minDate = this.maxDate 
  displayedColumns: string[] = ['bookingdate', 'reference', 'status', 'action'];
  dataSource = ELEMENT_DATA;
  confirmSmartCardForm: FormGroup;
  transferSmartCardForm: FormGroup;
  confirmSmartCardRequest: ConfirmSmartCardRequestDto;
  transferSmartCardRequest: TransferSmartCardRequestDto;
  transferSmartCardResponse: TransferSmartCardUserResponseDto;
  transferSmartCardConfirmRequest: TransferSmartCardDto;
  transferSmartCardConfirmResponse: TransferSmartCardUserResponseDto;
  linkSmartcard = false;
  orderSmartcard = false;
  buttonsSmartcard = false;
  replaceSmartcard = false;
  changeSmartcard = false;
  isShowChangeReplace: boolean = false;
  registerSmartcard = false;
  reportlostcard = false;
  purchasehistory = false;
  confirmSmartcardVisible = false;
  unlinkSmartcardVisible = false;
  transferSmartcardVisible = false;
  smartCard: SmartCardDto;
  unlinkSmartcardDetails: SmartCardData;
  myRequestData: MySmartCardsStatus;
  addressForm: FormGroup;
  changeReplaceForm: FormGroup;
  addressList = ["postCode", "address1", "address2", "address3", "city", "country"];
  addressListFc = ["postCode", "address1", "address2", "address3", "city", "country"];
  isAddAddress: boolean = false;
  isAdd: boolean = false;
  showAddAdress: boolean = true;
  isAddressShow: boolean = false;
  address: CustomerAddress;
  editableAddress: CustomerAddress;
  editIndex: number;
  customerInfoUpdateModel: CustomerInfoUpdate
  billingAddresses: CustomerAddress[];
  storedAddress: CustomerAddress[];
  isDelete: boolean = false;
  tempDeliveryAddress: Address;
  orderSmartCardRequest: OrderSmartCard;
  linkSmartcardConfirm: LinkSmartCardDto;
  orderSmartCardResponse: OrderSmartCardResponseDto;
  orderDisable = true;
  IsrnNumber = new FormControl();
  customerLoginResponse : CustomerLoginResponse;
  registerCardResponse : any;
  IsPopupHeaderHidden: boolean;
  changeReplaceRequest: ChangeReplaceSmartCardDto;
  changeReplaceResponse: ChangeReplaceResponseDto;
  changeReplaceAdminFee: number = 10;
  disableDatePicker: boolean = false;
  transferSmartcardDetails: SmartCardDetails;
  isCheckedTermsCondition: boolean = false;
  smartCardNo = new FormControl();
  oldSmartCard: string;
  isSingleUse: boolean = false;
  @ViewChild('emailForTransfer',{static: false}) emailForTransferField : ElementRef;
  @ViewChild('TitleSelectForAnchor',{static: false}) TitleSelectFieldAnchor : MatSelect;

  bookingTypeEnum: BookingTypeEnum;
  sharedService: SharedService;
  commonService: CommonServices;
  router: Router;
  appRouteEnum: AppRouteEnum;
  addressService: AddressService;
  myAccountService: MyAccountService;
  dataLayerService: DataLayerService;
  notificationservice: NotificationService;
  ga4dataLayerService: GA4DatalayerService;
  hideHeaderFlag : boolean = true;
  paymentAndVoucherHideHeaderFlag : boolean = true;
  changeReplaceAndTransferTooltip: boolean = false;
  public cardTypeEnum: PaymentAndVoucherCreditCardTypeEnum;
  postCodeValueChangeSubscription: Subscription;
  el: ElementRef;


  constructor(private readonly formbuilder: FormBuilder, private readonly injector: Injector, private readonly cd : ChangeDetectorRef, public dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.bookingTypeEnum = this.injector.get(BookingTypeEnum);
    this.sharedService = this.injector.get(SharedService);
    this.commonService = this.injector.get(CommonServices);
    this.router = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.addressService = this.injector.get(AddressService);
    this.myAccountService = this.injector.get(MyAccountService);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.notificationservice = this.injector.get(NotificationService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.cardTypeEnum = this.injector.get(PaymentAndVoucherCreditCardTypeEnum);


    this.customerRequest = new CustomerRequest();
    this.generalInfo = new GeneralInformation();
    this.orderSmartCardRequest = new OrderSmartCard();
    this.orderSmartCardRequest.DeliveryModeRequestDto = new DeliveryDetail();
    this.orderSmartCardRequest.DeliveryModeRequestDto.Address = new Address();
    this.orderSmartCardRequest.GeneralInformation = new GeneralInformation();
    this.billingAddresses = new Array<CustomerAddress>();
    this.storedAddress = new Array<CustomerAddress>();
    this.customerInfoUpdateModel = new CustomerInfoUpdate;
    this.customerInfoUpdateModel.Addresses = new Array<CustomerAddress>();
    this.changeReplaceRequest = new ChangeReplaceSmartCardDto();
    this.changeReplaceRequest.DeliveryModeRequestDto = new DeliveryDetail();
    this.changeReplaceRequest.DeliveryModeRequestDto.Address = new Address();
    this.changeReplaceRequest.GeneralInformation = new GeneralInformation();
    this.el = this.injector.get(ElementRef);
  }

  orderSmartcardForm: any = this.formbuilder.group({
    Title: ['', [Validators.required]],
    Name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    Surname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    SmartcardNickName: ['', [Validators.required]],
    DateOfBirth: ['', [Validators.required]],
    delPersonTitle: ['', [Validators.required]],
    delPersonName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    delPersonSurname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
    checked: new FormControl(false)
  }
  , {
    validator:  [ checkUserName('SmartcardNickName')]

  })

  ngOnInit() {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    this.getPaymentVouchers();
    this.bindForms();
    if(this.sharedService.showSmartcardMessage){
      this.notificationservice.success("Performed action completed. Please wait while we are redirecting you to Payment & Voucher section.");
      this.sharedService.showSmartcardMessage = false;
    }
    this.trimSpacesFromPostCodeFormControl();
    if (this.sharedService?.reviewBuyResponse != null && this.sharedService?.reviewBuyResponse != undefined) {
      this.sharedService.reviewBuyCache = this.sharedService.reviewBuyResponse.ReviewBuyCache;
      this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
    }
  }

  confirmsmartcardToggle(linkedSmartcard: SmartCardDetails, isCancel) {
    if(!this.confirmSmartcardVisible || isCancel){
      this.confirmSmartcardVisible = !this.confirmSmartcardVisible;
    }
    if(linkedSmartcard){
      this.oldSmartCard = linkedSmartcard.SmartCardNumber;
    }
    if(isCancel){
      this.confirmSmartCardForm.reset();
    }
  }

  bindForms() {
    this.confirmSmartCardForm = this.formbuilder.group({
      newSmartCard: new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.maxLength(18), Validators.minLength(18)])
    });
    this.transferSmartCardForm = this.formbuilder.group({
      email: new FormControl('', [Validators.maxLength(253)])
    },{
      validator: [validateEmailRegex('email')]
    });
    this.addressForm = this.formbuilder.group({
      address1: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      address2: new FormControl('', Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      address3: new FormControl('', Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      city: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      postCode: new FormControl('', [Validators.required, Validators.minLength(4)]),
      country: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)])
    });

    this.changeReplaceForm = this.formbuilder.group({
      Title: ['', [Validators.required]],
      Name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
      Surname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
      SmartcardNickName: ['', [Validators.required]],
      DateOfBirth: ['', [Validators.required]],
      delPersonTitle: ['', [Validators.required]],
      delPersonName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
      delPersonSurname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]],
      checked: new FormControl(false)
    }
    , {
      validator:  [checkUserName('SmartcardNickName')]

    })
  }


  onAddressCreated() {
    this.addressForm.markAllAsTouched();
    this.addressList.forEach(x => {
      let elementValue = document.getElementById(x)['value'];
      const ctrlValue = this.addressForm.controls[x];
      ctrlValue.setValue(elementValue);
    });

    for (const key of Object.keys(this.addressForm.controls)) {
      if (this.addressForm.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector('[formcontrolname="' + key + '"]');
        invalidControl.focus();
        return false;
      }
    }

    if (this.addressForm.valid) {
      this.address = new CustomerAddress();
      this.address.Address = new Address();
      this.address.Address.Address1 = this.addressForm.get('address1').value;
      this.address.Address.Address2 = this.addressForm.get('address2').value;
      this.address.Address.Address3 = this.addressForm.get('address3').value;
      this.address.Address.PostCode = this.addressForm.get('postCode').value;
      this.address.Address.City = this.addressForm.get('city').value;
      this.address.Address.Country = this.addressForm.get('country').value;
      if (this.isAddAddress) {
        this.address.AddressType = 'Address' + " " + (this.billingAddresses.length + 1).toString();
       
        let obj = Object.assign({}, this.address);
        this.billingAddresses.push(obj);
        
        this.isAddAddress = false;
        this.isAddressShow = false;
        this.isAdd = true;
      }
      else {
        this.address.Address.CountryCode = this.editableAddress.Address.CountryCode;
        this.address.AddressType = this.editableAddress.AddressType;
        this.address.IsDefault = this.editableAddress.IsDefault;
        this.billingAddresses[this.editIndex] = this.address;
        this.isAddressShow = false;
      }
      this.showAddAdress = true;
      this.customerInfoUpdateModel.Email = localStorage.getItem('Email');
      this.customerInfoUpdateModel.Addresses = this.billingAddresses;
      this.sendModifyAddress();
    }
    else {
      this.notificationservice.warn("Please fill all required data.");
    }
  }

  onClose() {
    this.isAddressShow = false;
    this.isAddAddress = false;
    this.showAddAdress = true;
  }

  addressmodal() {
    this.isAddAddress = true;
    this.isAddressShow = true;
    this.showAddAdress = false;
    this.initializeAddress(this.isAddAddress);
  }

  editAddress(index) {
    this.editableAddress = this.billingAddresses[index];
    this.editIndex = index;
    this.isAddressShow = true;
    this.isAddAddress = false;
    this.showAddAdress = false;
    this.initializeAddress(this.isAddAddress);
  }

  initializeAddress(isAdd) {
    pca.load();
    if (!isAdd) {
      this.addressForm.patchValue({
        address1: this.editableAddress.Address.Address1,
        address2: this.editableAddress.Address.Address2,
        address3: this.editableAddress.Address.Address3,
        city: this.editableAddress.Address.City,
        postCode: this.editableAddress.Address.PostCode,
        country: this.editableAddress.Address.Country
      });
    }
    else {
      this.addressForm.markAsUntouched();
      this.addressForm.patchValue({
        address1: null,
        address2: null,
        address3: null,
        city: null,
        postCode: null,
        country: null
      });
    }
  }

  onSelectAddress(index) {
    /* I have added this foreach loop code because when we select another address to make it as default, we need to set rest of the addresses isDefault key as false */
    this.billingAddresses.forEach((obj, i) => {
      if(i != index){
        obj.IsDefault = false;
      }else{
          obj.IsDefault = true;
      }
    });
    this.orderSmartCardRequest.DeliveryModeRequestDto.Address = this.billingAddresses[index].Address;
    this.changeReplaceRequest.DeliveryModeRequestDto.Address = this.billingAddresses[index].Address;
    this.tempDeliveryAddress = this.orderSmartCardRequest.DeliveryModeRequestDto.Address;
  }
  setBillingDeleteAddressIndex(index) {
    let temp;
    for (let i = index; i < this.billingAddresses.length - 1; i++) {
      temp = this.storedAddress[i].AddressType;
      this.billingAddresses[i + 1].AddressType = temp;
    }
    if (this.billingAddresses.length > 1) {
      if ((this.orderSmartCardRequest.DeliveryModeRequestDto.Address === this.billingAddresses[index].Address)
        || (this.changeReplaceRequest.DeliveryModeRequestDto.Address === this.billingAddresses[index].Address)) {
        this.orderSmartCardRequest.DeliveryModeRequestDto.Address = null;
        this.changeReplaceRequest.DeliveryModeRequestDto.Address = null;
      }
      this.billingAddresses.splice(index, 1);
    }
    else {
      this.billingAddresses.splice(index, 1);
      this.orderSmartCardRequest.DeliveryModeRequestDto.Address = null;
      this.changeReplaceRequest.DeliveryModeRequestDto.Address = null;
    }
    this.isDelete = true;
    this.customerInfoUpdateModel.Email = localStorage.getItem('Email');
    this.customerInfoUpdateModel.Addresses = this.billingAddresses;
    this.sendModifyAddress();
  }

  onDeleteAddresss(index) {
    if (this.billingAddresses.length == 1) {
      this.notificationservice.warn("You must have at least one postal address");
      return;
    }
    let dialogRef = this.dialog.open(ConfirmPopupComponent, {
      width: '500px',
      disableClose: false,
    });
    dialogRef.componentInstance.confirmMessage = "Are you sure you want to delete this address?";
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.setBillingDeleteAddressIndex(index);
      }
      else {
        return false;
      }
    });
  }
  
  getmodifiedAddressMsg() {
    let isDefaultAddressSelectedCount = 0;
    if (this.isDelete) {
      this.billingAddresses.forEach((obj,i) => {
        isDefaultAddressSelectedCount = obj.IsDefault ? isDefaultAddressSelectedCount + 1 : isDefaultAddressSelectedCount;
        if(isDefaultAddressSelectedCount == 0 && i == this.billingAddresses.length - 1) {
          this.billingAddresses[0].IsDefault = true;
        }
      });
      this.notificationservice.success('Address deleted successfully.');
    }
    else if (this.isAdd) {
      this.isAdd = false;
      this.notificationservice.success('Address added successfully.');
    }
    else {
      this.notificationservice.success('Address updated successfully.');
    }
    this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    this.storedAddress.forEach((obj) => {
      if (obj.IsDefault) {
        this.changeReplaceRequest.DeliveryModeRequestDto.Address = obj.Address;
      }
    });
  }

  sendModifyAddress() {
    this.addressService.modifyAddress(this.customerInfoUpdateModel).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data) {
              this.getmodifiedAddressMsg();
            }
            else {
              this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
              this.orderSmartCardRequest.DeliveryModeRequestDto.Address = this.tempDeliveryAddress;
              this.changeReplaceRequest.DeliveryModeRequestDto.Address = this.tempDeliveryAddress;
              this.notificationservice.error('Sorry, We are not able to update address this time. Please try again.');
            }
          }
          else {
            this.billingAddresses = this.storedAddress.slice(0);
            this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
            this.orderSmartCardRequest.DeliveryModeRequestDto.Address = this.tempDeliveryAddress;
            this.changeReplaceRequest.DeliveryModeRequestDto.Address = this.tempDeliveryAddress;
          }
          this.isAdd = false;
          this.isDelete = false;
        }
      });
  }

  onSubmitTransferSmartCard() {
    this.transferSmartCardRequest = new TransferSmartCardRequestDto();
    this.transferSmartCardRequest.SenderCustomerKey = localStorage.getItem("CustomerKey");
    this.transferSmartCardRequest.RecipientEmail = this.transferSmartCardForm.get('email').value.toLowerCase();
    this.transferSmartCardRequest.SmartCardNumber = this.transferSmartcardDetails.SmartCardNumber;
    this.myAccountService.transferSmartCard(this.transferSmartCardRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.transferSmartCardResponse = this.responseData.Data;
            if (this.transferSmartCardResponse.IsSmartCardTransfered) {
              this.onRequestSuccess(5, null);
              this.transferSmartcard(null, false);
            }else{
              this.notificationservice.error(this.transferSmartCardResponse.ResponseMessage);
            }

          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  getResOfTransferSmartCard() {
    if (this.transferSmartCardConfirmResponse.IsSmartCardRejectedOrAccepted) {
      if (this.transferSmartCardConfirmResponse.IsSmartCardTransfered) {
        this.notificationservice.success("Smartcard transfer request has been accepted succcessfully");
      }
      else {
        this.notificationservice.success("Smartcard transfer request has been rejected succcessfully");
      }
    } else {
      this.notificationservice.error(this.transferSmartCardConfirmResponse.ResponseMessage);
    }
  }

  onActionTransferSmartCard(smartCardDetails: SmartCardData, isAccepted) {
    this.transferSmartCardConfirmRequest = new TransferSmartCardDto();
    this.transferSmartCardConfirmRequest.CustomerKey = localStorage.getItem("CustomerKey");
    this.transferSmartCardConfirmRequest.Email = localStorage.getItem("Email");
    this.transferSmartCardConfirmRequest.SmartCardNumber = smartCardDetails.SmartCardNumber;
    this.transferSmartCardConfirmRequest.IsAccepted = isAccepted;
    this.myAccountService.transferSmartCardConfirm(this.transferSmartCardConfirmRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.transferSmartCardConfirmResponse = this.responseData.Data;
            this.getResOfTransferSmartCard();
            this.myRequestSection();
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  onSubmitConfirmSmartCard() {
    this.confirmSmartCardRequest = new ConfirmSmartCardRequestDto();
    this.confirmSmartCardRequest.Email = localStorage.getItem("Email");
    this.confirmSmartCardRequest.CustomerKey = localStorage.getItem("CustomerKey");
    this.confirmSmartCardRequest.OldSmartCard = this.oldSmartCard;
    this.confirmSmartCardRequest.NewSmartCard = this.confirmSmartCardForm.get('newSmartCard').value;
    this.confirmSmartCardRequest.LocationId = "";
    this.myAccountService.confirmSmartCard(this.confirmSmartCardRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.onRequestSuccess(1, null);
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  linkSmartcardtoggle() {
    this.linkSmartcard = !this.linkSmartcard;
    this.smartCardNo.reset();
  }
  transferSmartcard(linkedSmartcard, isTransferOpen) {
    if(linkedSmartcard){
      if(linkedSmartcard.hasOwnProperty("IsConfirmButtonAvailable")){
        linkedSmartcard.IsConfirmButtonAvailable = false;
      }
    }
    this.transferSmartcardVisible = !this.transferSmartcardVisible;
    if(isTransferOpen){
      this.transferSmartcardDetails = new SmartCardDetails();
      this.transferSmartcardDetails = linkedSmartcard;
    }
    else{
    this.transferSmartCardForm.reset();
  }
  if(this.transferSmartcardVisible){
    this.cd.detectChanges();
    this.emailForTransferField.nativeElement.focus();
  }
  }
  orderSmartcardtoggle() {
    this.isShowChangeReplace = false;
    this.orderSmartcard = !this.orderSmartcard;
    this.buttonsSmartcard = !this.buttonsSmartcard;
    this.orderSmartcardForm.reset();
    this.orderSmartcardForm.patchValue({
      Title : 'Mr',
      delPersonTitle : 'Mr'
    })
  }
  onTermConditionChange($event) {
    this.isCheckedTermsCondition = $event.checked
  }
  
  changeReplacetoggle(num, linkedSmartcard) {
    this.orderSmartcard = false;
    this.buttonsSmartcard = false;
    this.replaceSmartcard = false;
    this.changeSmartcard = false;
    if(linkedSmartcard.hasOwnProperty("IsConfirmButtonAvailable")){
      linkedSmartcard.IsConfirmButtonAvailable = false;
    }
    this.isShowChangeReplace = true;
    if(this.isShowChangeReplace) {
      this.cd.detectChanges();
      this.TitleSelectFieldAnchor.focus();
    }
    if (num == 1) {
      this.changeSmartcard = !this.changeSmartcard;
    }
    else if (num == 2) {
      this.replaceSmartcard = !this.replaceSmartcard;
    }

    if(linkedSmartcard != null){
      this.changeReplaceForm.get('DateOfBirth').setValue(moment(linkedSmartcard.DOB).format('DD/MM/YYYY'));
      this.changeReplaceForm.get('DateOfBirth').disable();
      this.disableDatePicker = true;
      this.changeReplaceRequest.SmartCardNumber = linkedSmartcard.SmartCardNumber;
      this.changeReplaceRequest.GeneralInformation.DateOfBirth = linkedSmartcard.DOB;
    }
    else {
      this.disableDatePicker = false;
      this.changeReplaceRequest.SmartCardNumber = null;
    }
    this.buttonsSmartcard = this.buttonsSmartcard ? this.buttonsSmartcard : false;
  }
  changeReplaceCanceltoggle(){
    this.changeReplaceForm.reset();
    this.changeReplaceForm.patchValue({
      Title: '',
      delPersonTitle: ''
    })
    this.isShowChangeReplace = false;
    this.buttonsSmartcard = this.buttonsSmartcard ? this.buttonsSmartcard : false;
    this.changeSmartcard = false;
    this.replaceSmartcard = false;
  }
  registerSmartcardtoggle() {
    this.registerSmartcard = !this.registerSmartcard;
    this.buttonsSmartcard = !this.buttonsSmartcard;
    this.IsrnNumber.reset();
  }
  reportlosttoggle() {
    this.reportlostcard = !this.reportlostcard;
  }
  purchasehistorytoggle() {
    this.purchasehistory = !this.purchasehistory;
    this.buttonsSmartcard = !this.buttonsSmartcard;
  }
  unlinkSmartcardToggle(linkedSmartcard: SmartCardData) {
    this.unlinkSmartcardVisible = !this.unlinkSmartcardVisible;
    this.unlinkSmartcardDetails = new SmartCardData();
    this.unlinkSmartcardDetails = linkedSmartcard;
  }

  filterSmartCard(smartCards: SmartCardDetails[]) {
    if (smartCards != undefined && smartCards != null) {
      let filteredSmartCard = smartCards.filter(x => x.Status === 'ISSUED');
      if (filteredSmartCard.length == 0) {
        return null;
      }
      else {
        return filteredSmartCard;
      }
    }
  }

  filterOrderStatus(smartCards: SmartCardDetails[]) {
    if (smartCards != undefined && smartCards != null) {
      return smartCards.filter(x => x.Status !== 'ISSUED');
    }
  }

  onTabChanged(event: MatTabChangeEvent) {
    if (event.index == 1) {
      this.myRequestSection();
    }
  }

  myRequestSection() {
    this.myRequestData = null;
    this.myAccountService.myRequest().subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.myRequestData = this.responseData.Data;
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  getPaymentVouchers() {
    this.customerRequest.Email = localStorage.getItem('Email');
    this.customerRequest.CustomerKey = localStorage.getItem("CustomerKey");
    this.myAccountService.getPaymentVouchers(this.customerRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.paymentVoucherResponse = this.responseData.Data;
            this.paymentCards = this.paymentVoucherResponse.PaymentCards;
            if (this.paymentVoucherResponse.Addresses != null && this.paymentVoucherResponse.Addresses.length > 0) {
              this.billingAddresses = this.paymentVoucherResponse.Addresses;
              this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
              let address = this.billingAddresses.filter(m => m.IsDefault);
              if (address != undefined && address.length != 0) {
                this.orderSmartCardRequest.DeliveryModeRequestDto.Address = address[0].Address;
                this.changeReplaceRequest.DeliveryModeRequestDto.Address = address[0].Address;
              }
              else {
                this.billingAddresses[0].IsDefault = true;
                this.orderSmartCardRequest.DeliveryModeRequestDto.Address = this.billingAddresses[0].Address;
                this.changeReplaceRequest.DeliveryModeRequestDto.Address = this.billingAddresses[0].Address;
              }
              this.tempDeliveryAddress = this.orderSmartCardRequest.DeliveryModeRequestDto.Address;
            }

            this.isSingleUse = this.checkVoucherUse(this.paymentVoucherResponse.Vouchers.Vouchers);
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }
 
  deleteCardMsg(i, status) {
    if (status) {
      this.paymentCards.splice(i, 1);
      this.notificationservice.success("Card deleted successfully.");
    }
    else {
      this.notificationservice.error("Something went wrong. Please try again later.");
    }
  }

  deleteCard(card: BillingAgreement) {
    let dialogRef = this.dialog.open(ConfirmPopupComponent, {
      width: '500px',
      disableClose: false,
    });
    dialogRef.componentInstance.confirmMessage = "Are you sure you want to delete this card?"
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let index = this.paymentCards.indexOf(card);
        let updatePaymentCards = new UpdatePaymentCardsDto();
        updatePaymentCards.CustomerKey = localStorage.getItem('CustomerKey');
        updatePaymentCards.PaymentCards = this.paymentCards.filter(m => m != card);
        this.dataLayerService.loadGTMDataLayerOnPageUpdate();
        // virtual_page_view -- Ga4-datalayer event
        this.ga4dataLayerService.loadGA4DataLayerAllPages(false);

        this.myAccountService.updatePaymentCards(updatePaymentCards).subscribe(
          res => {
            if (res != null) {
              this.responseData = res as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                let status = this.responseData.Data;
                this.deleteCardMsg(index,status);
              }
              else {
                console.log(this.responseData.ResponseMessage);
              }
            }
          });
      }
      else {
        return false;
      }
    });
  }

  setToLinkSmartCardNum(smartcard) {
    this.myAccountService.linkSmartCard(smartcard).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data.IsSmartCardLinked) {
              this.onRequestSuccess(2, null);
              this.linkSmartcardtoggle();
            }
            else {
              this.notificationservice.error(this.responseData.Data.ResponseMessage);
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    )
  }

  linkSmartCard() {
    let smartcard = new SmartCardDto();
    if (this.smartCardNo.value == null || this.smartCardNo.value.length == 0) {
      this.smartCardNo.setValidators([Validators.required]);
      this.notificationservice.warn('Smartcard No is required.');
      return false;
    }
    else {
      smartcard.SmartCardNumber = this.smartCardNo.value;
      this.setToLinkSmartCardNum(smartcard);
    }
  }

  linkedSmartcardConfirm(isAccepted, linkedSmartcard: SmartCardData) {
    this.linkSmartcardConfirm = new LinkSmartCardDto();
    this.linkSmartcardConfirm.IsAccepted = isAccepted;
    this.linkSmartcardConfirm.SmartCardNumber = linkedSmartcard.SmartCardNumber;
    this.myAccountService.linkSmartCardConfirm(this.linkSmartcardConfirm).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if(this.responseData.Data.IsSmartCardLinked){
              this.notificationservice.success("Smartcard link request has been accepted successfully");
            }
            else{
              this.notificationservice.success("Smartcard link request has been rejected successfully");
            }
            this.myRequestSection();
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    )
  }

  unlinkSmartCard(smartCardDetails: SmartCardData) {
    this.smartCard = new SmartCardDto();
    this.smartCard.SmartCardNumber = smartCardDetails.SmartCardNumber;
    if (smartCardDetails.CardOwnerCustomerKey == localStorage.getItem("CustomerKey")) {
      this.smartCard.IsUnlinkMySmartcard = true;
    }
    else {
      this.smartCard.IsUnlinkMySmartcard = false;
    }
    this.myAccountService.unLinkSmartCard(this.smartCard).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if(this.responseData.Data.IsUnlinkedSmartCard){
              this.onRequestSuccess(3, smartCardDetails);
              this.unlinkSmartcardToggle(smartCardDetails);
            }
            else{
              this.notificationservice.error(this.responseData.Data.ResponseMessage);
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    )
  }
 
  orderSmartCardRequestMethod() {
    this.myAccountService.orderSmartCard(this.orderSmartCardRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.orderSmartCardResponse = this.responseData.Data;
            if (this.orderSmartCardResponse.IsSmartcardOrdered) {
              this.orderSmartcardtoggle();
              this.orderSmartcardForm.reset();
              for (let name in this.orderSmartcardForm.controls) {
                this.orderSmartcardForm.controls[name].setErrors(null);
              }
              this.orderDisable = true;
              this.onRequestSuccess(6, null);
            }
            else {
              this.notificationservice.warn(this.orderSmartCardResponse.ResponseMessage);
            }
            this.isCheckedTermsCondition = false;
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    )

  }
  orderSmartCard() {
    if (!this.isCheckedTermsCondition) {
      this.notificationservice.error("Please accept terms and condtions first.");
      return false;
    }
    this.orderSmartCardRequest.DeliveryModeRequestDto.Title = this.orderSmartcardForm.get('delPersonTitle').value;
    this.orderSmartCardRequest.DeliveryModeRequestDto.Name = this.orderSmartcardForm.get('delPersonName').value;
    this.orderSmartCardRequest.DeliveryModeRequestDto.Surname = this.orderSmartcardForm.get('delPersonSurname').value;
    this.orderSmartCardRequest.Email = localStorage.getItem('Email');
    this.orderSmartCardRequest.CustomerKey = localStorage.getItem("CustomerKey");
    this.orderSmartCardRequest.IsAdult = false;
    this.orderSmartCardRequest.GeneralInformation.Name = this.orderSmartcardForm.get('Name').value;
    this.orderSmartCardRequest.GeneralInformation.Surname = this.orderSmartcardForm.get('Surname').value;
    this.orderSmartCardRequest.GeneralInformation.SmartcardNickName = this.orderSmartcardForm.get('SmartcardNickName').value;
    this.orderSmartCardRequest.GeneralInformation.Title = this.orderSmartcardForm.get('Title').value;
    this.orderSmartCardRequest.GeneralInformation.DateOfBirth = this.orderSmartcardForm.get('DateOfBirth').value;
    if (this.billingAddresses == null || this.billingAddresses.length == 0 || this.orderSmartCardRequest.DeliveryModeRequestDto.Address == null) {
      this.notificationservice.warn("Address is required.");
      return;
    }
    this.orderSmartCardRequestMethod();
  }

  registerSmartCard() {
    this.registerCardResponse = null;
    let registerSmartCard = new RegisterSmartCardDto();
    if (this.IsrnNumber.value == null || this.IsrnNumber.value.length == 0) {
      this.IsrnNumber.setValidators([Validators.required]);
      this.notificationservice.warn('Smartcard No is required.');
      return false;
    }
    else {
      registerSmartCard.IsrnNumber = this.IsrnNumber.value;
      registerSmartCard.CustomerKey = localStorage.getItem("CustomerKey");
      registerSmartCard.Email = localStorage.getItem("Email");
      registerSmartCard.FirstName = localStorage.getItem("FirstName");
      registerSmartCard.LastName = localStorage.getItem("LastName");
      registerSmartCard.IsAdult = false;
      this.customerLoginResponse = JSON.parse(localStorage.getItem("customerLoginResponse"));
      this.customerLoginResponse.CustomerDetail.Addresses.forEach(obj => {
        if (obj.IsDefault) {
          registerSmartCard.PostCode = obj.Address.PostCode;
        }
      });
      this.myAccountService.registerSmartCard(registerSmartCard).subscribe(
        res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.registerCardResponse = this.responseData.Data;
              this.onRequestSuccess(4, null);
            }
            else {
              console.log(this.responseData.ResponseMessage);
            }
          }
        }
      )
    }
  }

  onClickCheckbox(event: MatCheckboxChange) {
    if (event.checked) {
      this.orderDisable = false;
    }
    else {
      this.orderDisable = true;
    }
  }

  chosenYearHandler(normalizedYear: Moment) {
    const ctrlValue = this.orderSmartcardForm.controls['DateOfBirth'];
    ctrlValue.setValue(moment(this.minDate));
    ctrlValue.value.year(normalizedYear.year());
    ctrlValue.setValue(ctrlValue.value);
  }

  chosenMonthHandler(normalizedMonth: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.orderSmartcardForm.controls['DateOfBirth'];
    ctrlValue.setValue(moment(this.minDate));
    ctrlValue.value.month(normalizedMonth.month());
    ctrlValue.value.year(normalizedMonth.year());
    ctrlValue.setValue(ctrlValue.value);
    datepicker.close();
  }

  onRequestSuccess(number, smartCardDetails: SmartCardData) {
    if (number == 6) {
      this.IsPopupHeaderHidden=true;
    }
    let dialogRef = this.dialog.open(RequestSuccessfulComponent, {
      width: '680px',
      data: {
        num: number,
        unlinkDetails: smartCardDetails,
        IsPopupHeaderHidden: this.IsPopupHeaderHidden
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == 6|| result == 5) {
        this.getPaymentVouchers();
      }
      else if (result == 2 || result == 3 || result == 5) {
        this.myRequestSection();
      }
    });
  }
  changeReplaceSmartCard() {
    if(this.changeReplaceForm.invalid){
      return;
    }
    this.changeReplaceRequest.DeliveryModeRequestDto.Title = this.changeReplaceForm.get('delPersonTitle').value;
    this.changeReplaceRequest.DeliveryModeRequestDto.Name = this.changeReplaceForm.get('delPersonName').value;
    this.changeReplaceRequest.DeliveryModeRequestDto.Surname = this.changeReplaceForm.get('delPersonSurname').value;
    this.changeReplaceRequest.Email = localStorage.getItem('Email');
    this.changeReplaceRequest.CustomerKey = localStorage.getItem("CustomerKey");
    this.changeReplaceRequest.IsAdult = false;
    this.changeReplaceRequest.GeneralInformation.Name = this.changeReplaceForm.get('Name').value;
    this.changeReplaceRequest.GeneralInformation.Surname = this.changeReplaceForm.get('Surname').value;
    this.changeReplaceRequest.GeneralInformation.SmartcardNickName = this.changeReplaceForm.get('SmartcardNickName').value;
    this.changeReplaceRequest.GeneralInformation.Title = this.changeReplaceForm.get('Title').value;
    if (this.changeSmartcard) {
      this.changeReplaceRequest.IsChange = true;
      this.changeReplaceRequest.IsReplace = false;
    }
    else {
      this.changeReplaceRequest.IsChange = false;
      this.changeReplaceRequest.IsReplace = true;
    }
    let dialogRef = this.dialog.open(ChangeSmartcardpopupComponent, {
      width: '600px',
      data: {
        changeReplaceRequest: this.changeReplaceRequest,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        this.changeSmartCard();
      }
      else if (result === 2) {
        this.replaceSmartCard();
      }
    });
  }

  changeSmartCard() {
    this.myAccountService.changeSmartcardApi(this.changeReplaceRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.changeReplaceResponse = this.responseData.Data;
            localStorage.setItem("ChangeReplace", JSON.stringify(this.changeReplaceResponse));
            localStorage.setItem("isChangeReplace", "true");
             
            localStorage.removeItem("paymentForSmartcard");
            localStorage.setItem("paymentForSmartcard", "true");
            this.router.navigate([`./` + this.appRouteEnum.Payment]);
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    )
  }

  replaceSmartCard() {
    this.myAccountService.replaceSmartcardApi(this.changeReplaceRequest).subscribe(
      replaceSmartcardApiRes => {
        if (replaceSmartcardApiRes != null) {
          this.responseData = replaceSmartcardApiRes as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.changeReplaceResponse = this.responseData.Data;
            localStorage.setItem("ChangeReplace", JSON.stringify(this.changeReplaceResponse));
            localStorage.setItem("isChangeReplace", "true");
           
            localStorage.removeItem("paymentForSmartcard");
            localStorage.setItem("paymentForSmartcard", "true");
            this.router.navigate([`./` + this.appRouteEnum.Payment]);
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    )
  }

  checkVoucherUse(vouchers){
    let singleUse = vouchers.find(item => item.Usage !== "MultiUse" );
    if(singleUse == undefined){
      return false;
    }
    return true;
  }

  scrollTo(el: HTMLElement) {
    el.scrollIntoView({behavior:"smooth"});
  }

  convertDigitOfCardTypeIntoText (cardTypeInDigit) {
    let cardTypeObject = {
      '0' : 'Amex',
      '4' : 'Maestro',
      '6' : 'Visa',
      '7' : 'MasterCard'
    };
    return cardTypeObject[cardTypeInDigit];
  }

  convertCardExpirationMonthNumberIntoText (cardExpirationIndex) {
    let monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthArray[cardExpirationIndex - 1];
  }

  deleteAddress () {
    try {
      let selectedAddressIndex = this.billingAddresses.findIndex(x => x.AddressType == this.editableAddress.AddressType);
      if(selectedAddressIndex >= 0){
        this.isAddressShow = false;
        this.isAddAddress = false;
        this.showAddAdress = true;
        this.onDeleteAddresss(selectedAddressIndex);
      }
    } catch (error) {
      console.log(error);
    }
  }

  smartCardChangeReplaceAndTransferTooltip(object, smartCards, index) {
    smartCards.forEach((obj,i) => {
      if(i != index){
        if(obj.hasOwnProperty("IsConfirmButtonAvailable")){
          obj.IsConfirmButtonAvailable = false;
        }
      }
    });
    object.IsConfirmButtonAvailable = object.hasOwnProperty("IsConfirmButtonAvailable") ? !object.IsConfirmButtonAvailable : true;
  }
  
  scrollToElement(): void {
    setTimeout(() => {
      document.getElementById("confirmOrderStatusDiv").scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      });
    },200);
  }

  open($event) {
    if ($event.keyCode === 13) {
      this.dp.open();
    }
  }
  trimSpacesFromPostCodeFormControl(){
    this.postCodeValueChangeSubscription = this.addressForm.controls['postCode'].valueChanges
    .subscribe(x=>{
      if(x?.includes(' ')){
        this.addressForm.controls['postCode'].setValue(x.trim().replace(/\s/g, ""))
      }
    });
  }
  
  ngOnDestroy(){
    this.postCodeValueChangeSubscription.unsubscribe();
  }

  isCardExpired(cardExpirationMonth: number, cardExpirationYear: number) {
    try{
      if (!cardExpirationMonth || !cardExpirationYear) return false;
      
      let now = new Date();
      let currentMonth = now.getMonth() + 1;
      let currentYear = now.getFullYear();
      if (cardExpirationYear < currentYear) return true;
      if (cardExpirationYear === currentYear && cardExpirationMonth < currentMonth) return true;
      return false;
    } catch (error) { console.log(error); }
  }
}
