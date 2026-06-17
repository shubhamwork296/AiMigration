import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { EVouchersResponse } from 'src/app/models/payment-details/eVouchers-response.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { CustomerAddress, Address } from 'src/app/models/payment-details/billing-address-response.model';
import { PaymentPageRequest, Voucher } from 'src/app/models/payment-details/payment-request.model';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioButton } from '@angular/material/radio';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { PaymentService } from 'src/app/services/payment-initiate.service';
import { PaymentResponse } from 'src/app/models/payment-details/payment-response.model';
import { FareBreakdownComponent } from '../mixing-deck/fare-breakdown/fare-breakdown.component';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { PaymentDetailRequest } from 'src/app/models/payment-details/payment-details-request.model';
import { PaymentDetailResponse, PaymentCard } from 'src/app/models/payment-details/payment-details-response.model';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { browserRefresh } from '../../app-component/app.component';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { CustomerInfoUpdate } from 'src/app/models/customer/customer-address.model';
import { AddressService } from 'src/app/services/address.service';
import { AppRouteEnum, LocalStorageKeyEnum, NativePaymentMethodEnum } from 'src/app/utility/app-constants.service';
import { ReviewBuyResponse } from 'src/app/models/review-buy/review-buy-model';
import { ConfirmPopupComponent } from '../review-and-buy/confirm-popup/confirm-popup.component';
import { TimeoutComponent } from '../review-and-buy/timeout/timeout.component';
import { CommonServices } from 'src/app/services/common.service';
import { ChangeReplaceResponseDto } from 'src/app/models/account/my-payment-vouchers.model';
import { FareBreakdownModel, JourneyModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { JourneyExtraService } from 'src/app/services/journey-extras.service';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { environment } from 'src/environments/environment';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { Subscription } from 'rxjs';
declare var pca: any;
declare var paypal:any;




@Component({
  selector: 'app-payment-details',
  templateUrl: './payment-details.component.html',
  styleUrls: ['./payment-details.component.css']
})
export class PaymentDetailsComponent implements OnInit {
  responseData: ResponseData;
  paymentResponseData: ResponseData;
  paymentDetailsRequest: PaymentDetailRequest;
  paymentDetailsResponse: PaymentDetailResponse;
  eVouchersResponse: EVouchersResponse;
  paymentResponse: PaymentResponse;
  billingAddresses: CustomerAddress[];
  customerKey: any;
  customerEmail: any;
  voucherDetails: any;
  selectedVouchers: any = [];
  Checked: any = []
  isLoyaltyPoints: boolean = false;
  paymentRequest: PaymentPageRequest;
  totalPrice: string;
  payPalTotalPrice: number;
  applePayTotalPrice: number;
  voucherLen: any;
  addressForm: FormGroup;
  isAddAddress: boolean = false;
  isAdd: boolean = false;
  showAddAdress: boolean = true;
  isAddressShow: boolean = false;
  address: CustomerAddress;
  editableAddress: CustomerAddress;
  editIndex: number;
  addressList = ["postCode", "address1", "address2", "address3", "city", "country"];
  browserRefresh: boolean;
  //For address
  customerInfoUpdateModel: CustomerInfoUpdate;
  storedAddress: CustomerAddress[];
  isDelete: boolean = false;
  selected = 'option';
  selectedCard: PaymentCard;
  selectedCardOption: string = 'oldPaymentCard';
  isAddNewCard = new FormControl(false);
  reviewBuyResponse: ReviewBuyResponse;
  reviewBuyCache: string;
  isSeason: boolean = false;
  showWarning: boolean = true;
  tempPaymentAddress: Address;
  changeReplaceResponse: ChangeReplaceResponseDto;
  paymentForSmartcard: any;
  isSingleUse: boolean = false;
  isCoj: boolean = false;
  isUpgradeChange: boolean = false;
  isErrorComingFromUpgradeChange: boolean = false;
  selectedCardNumber: any;
  selectedAddressIndex: any = 0;
  onNectarCardFocus:boolean = false;
  step = 0;
  defaultindex:number;
  defaultVal:boolean=false;
  mobile: boolean = false;
  AuthToken:string; 
  paymentDetailsService: PaymentDetailsService;
   sharedService: SharedService;
  paymentService: PaymentService;
  router: Router;
  notificationService: NotificationService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  addressService: AddressService;
  appRouteEnum: AppRouteEnum;
  nativePaymentMethodEnum: NativePaymentMethodEnum;
  commonService: CommonServices;
  spinnerService: NgxSpinnerService;
  journeyExtraService: JourneyExtraService;
  dataLayerService: DataLayerService;
  el: ElementRef;
  ga4dataLayerService: GA4DatalayerService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  isShowHeader: boolean = false;
  postCodeValueChangeSubscription: Subscription;
  constructor(private readonly formbuilder: FormBuilder, private readonly injector: Injector, public dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.paymentDetailsService = this.injector.get(PaymentDetailsService);
    this.sharedService = this.injector.get(SharedService);
    this.paymentService = this.injector.get(PaymentService);
    this.router = this.injector.get(Router);
    this.notificationService = this.injector.get(NotificationService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.addressService = this.injector.get(AddressService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.nativePaymentMethodEnum = this.injector.get(NativePaymentMethodEnum);
    this.commonService = this.injector.get(CommonServices);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.journeyExtraService = this.injector.get(JourneyExtraService);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.el = this.injector.get(ElementRef);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.reviewBuyResponse = new ReviewBuyResponse;
    this.reviewBuyResponse = this.sharedService.reviewBuyResponse;
    if (this.reviewBuyResponse != null && this.reviewBuyResponse != undefined) {
      this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;

    }
  }


  showFarebreakdown() {
    this.dialog.open(FareBreakdownComponent, {
      width: '600px',
      disableClose: false,
      panelClass: ['farebreak', 'common-popup-theme'],
    });
  }
  @ViewChild('tooltip2', { static: false }) tooltip2: any;
  quickPay() {
    this.tooltip2.toggle();
  }

  ngOnDestroy() {
    if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.ValidatePaymentDo)) {     
        localStorage.setItem(this.localStorageKeyEnum.isReturnFromPaymentOrBasket, 'true'); 
      if (this.isCoj || this.isUpgradeChange) {
        this.router.navigateByUrl('/' + this.appRouteEnum.CojReviewBuy);
      }
      else {
        if (this.commonService.doesDeliveryPageSkipped()) {
          this.router.navigateByUrl('/' + this.appRouteEnum.deliveryAndReviewbuy);
        } else {
          this.router.navigateByUrl('/' + this.appRouteEnum.ReviewBuy);
        }
      }
    }
    else if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.ReviewBuy) || this.router.url.includes(this.appRouteEnum.deliveryAndReviewbuy)) {
      localStorage.setItem(this.localStorageKeyEnum.isReturnFromPaymentOrBasket, 'true');
    }
    this.postCodeValueChangeSubscription.unsubscribe();
  }

  ngOnInit() {
    this.isCoj = JSON.parse(localStorage.getItem('isCOJChange'));
    this.emitBasketCount();
    // paypal messaging code
    this.loadPaypalPaymentScript( environment.paypalMessageUrl + environment.paypalClientId + "&components=messages");
    this.loadApplePayAPIScript( environment.applePayScriptUrl);
    if (window.screen.width <= 767) { // 768px portrait
      this.mobile = true;
    }
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);

    this.isUpgradeChange = this.storageDataService.getSessionStorageData("isUpgradeChange", true);
    this.getSharedCacheDataOnLoad();
    
    //Get shared cache data
      this.customerKey = localStorage.getItem('CustomerKey');
      this.customerEmail = localStorage.getItem('Email');
      this.paymentRequest = new PaymentPageRequest;
      this.paymentRequest.CustomerKey = this.customerKey;
      this.paymentRequest.Email = this.customerEmail;
      this.paymentRequest.PaymentMethod = "NETS_ONLINE";
      this.paymentRequest.FirstName = localStorage.getItem('FirstName');
      this.paymentRequest.LastName = localStorage.getItem('LastName');


      this.paymentDetailsRequest = new PaymentDetailRequest;
      this.paymentDetailsRequest.CustomerKey = this.customerKey;
      this.paymentDetailsRequest.Email = this.customerEmail;
    if (this.checkPostSaleValue(this.sharedService)) {
      this.paymentDetailsRequest.ReviewBuyCache = this.sharedService.postSaleReviewBuyCache;
    } else {
      this.paymentDetailsRequest.ReviewBuyCache = this.sharedService.reviewBuyCache;
    }

      this.paymentForSmartcard = JSON.parse(localStorage.getItem("paymentForSmartcard"));
      let isChangeReplace = JSON.parse(localStorage.getItem('isChangeReplace'));
      
      if (isChangeReplace) {
        this.createForms();
        this.changeReplaceFunction();
      }
      else {
      this.paymentDetailsRequest.IsPostSale = this.checkPostSaleValue(this.sharedService) ? true : false;
      this.getPaymentdetails(this.paymentDetailsRequest);
      if(this.isCoj || this.isUpgradeChange) {
        this.totalPrice = this.sharedService.totalPriceToPayReviewBuy;
        this.payPalTotalPrice = +this.totalPrice;
        this.applePayTotalPrice = +this.totalPrice;
        this.sharedService.getBasketCount.emit(0);
        if(this.isUpgradeChange) {
          this.ga4dataLayerService.loadGALayerForAddToCartInfo(this.sharedService.upgradeSearchRequest.SearchRequestDto, this.sharedService.reviewBuyResponse.Journey[0], this.commonService.jourenyExtraForCheckout(),true, true, this.totalPrice);
        }
      }
      else {
        this.totalPrice = this.commonService.calculateJourneyTotalAmount(this.sharedService);
        this.payPalTotalPrice = +this.totalPrice;
        this.applePayTotalPrice = +this.totalPrice;
      }
      this.createForms();

      this.doesSeasonDetailExist();
      
      this.billingAddresses = new Array<CustomerAddress>();
      this.storedAddress = new Array<CustomerAddress>();
      }

      this.setLocalStorageForSeasonJourney();

    //For address
    this.customerInfoUpdateModel = new CustomerInfoUpdate;
    this.customerInfoUpdateModel.Addresses = new Array<CustomerAddress>();
    this.checkPaymentUpgradeErrorFromvalidatePage(); 
// PICO-2212, PICO-2213 & PICO-2215 method is called to check which button is click for showing header on payment page
    this.isShowHeader = this.commonService.isCheckForQuickBuyOrContinue();

    this.trimSpacesFromPostCodeFormControl();
  }

  doesSeasonDetailExist() {
    if (this.sharedService.reviewBuyResponse.Journey[0].SeasonDeatil != null && this.sharedService.reviewBuyResponse.Journey[0].SeasonDeatil != undefined) {
      this.isSeason = true;
      this.isCoj = false;
      this.isUpgradeChange = false;
    }
    else {
      this.isSeason = false;
    }
  }

  getSharedCacheDataOnLoad() {
    this.browserRefresh = browserRefresh;
    //Get shared cache data
    if (this.browserRefresh) {

      let sharedSiblingRefresh = null;
      sharedSiblingRefresh = this.setSharedSiblingRefresh();

      if (this.nullOrUndefinedCheckForSharedSiblingRefresh(sharedSiblingRefresh)) {
        this.sharedService.ReservationCache = sharedSiblingRefresh.ReservationCache;
        if (this.checkPostSaleValue(sharedSiblingRefresh)) {
          this.sharedService.postSaleReviewBuyCache = sharedSiblingRefresh.postSaleReviewBuyCache;
        } else {
          this.sharedService.reviewBuyCache = sharedSiblingRefresh.reviewBuyCache;
        }
        this.sharedService.searchRequest = sharedSiblingRefresh.searchRequest;
        this.sharedService.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse == undefined ? null : this.sharedService.reviewBuyResponse.BasketCount);
        this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
        this.sharedService.totalPriceToPayReviewBuy = sharedSiblingRefresh.totalPriceToPayReviewBuy;
        this.sharedService.journey = sharedSiblingRefresh.journey;
        this.sharedService.CojSearchRequest = sharedSiblingRefresh.CojSearchRequest;
        this.sharedService.COJjourneySummaryModel = sharedSiblingRefresh.COJjourneySummaryModel;
        this.sharedService.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
        this.sharedService.CojReviewBuyRequest = sharedSiblingRefresh.CojReviewBuyRequest;
        this.sharedService.createReservationRequest = sharedSiblingRefresh.createReservationRequest;
        this.sharedService.selectedJourneyDataForQuickBuyOrContiue = sharedSiblingRefresh?.selectedJourneyDataForQuickBuyOrContiue;
        if (this.isUpgradeChange === true) {
          this.sharedService.upgradeSearchRequest = sharedSiblingRefresh.upgradeSearchRequest;
          this.sharedService.upgradeReviewBuyRequest = sharedSiblingRefresh.upgradeReviewBuyRequest;
          //Set shared cache data
          this.sharedService.setSharedCache();
          this.storageDataService.clearSessionStorageData("sharedSibling");
          this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
          //Set shared cache data
        } else {
          //Set shared cache data
          this.sharedService.setSharedCache();
          this.storageDataService.clearStorageData("sharedSibling");
          this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
          //Set shared cache data
        }
      }
    }
  }

    // paypal messaging code
  public loadPaypalPaymentScript(url: string) {
    const body = <HTMLDivElement> document.body;
    const script = document.createElement('script');
    script.onload = () => {
      this.paypalMessage();
    }
    script.src = url;
    body.appendChild(script);
  }

  checkPaymentUpgradeErrorFromvalidatePage() {
    if(this.isUpgradeChange === true) {
      let isError = this.storageDataService.getSessionStorageData("isErrorComingFromUpgradeChange",true);
      if(isError === true) {
        this.isErrorComingFromUpgradeChange = true;
        this.storageDataService.setSessionStorageData('isErrorComingFromUpgradeChange', false, true);
      } else {
        this.isErrorComingFromUpgradeChange = false;
      }
    }
  }

  selectVoucher(index) {
    if (!this.Checked[index]) {
      this.selectedVouchers.push(this.voucherDetails[index]);
      this.Checked[index] = true;
    }
    else {
      this.selectedVouchers = this.selectedVouchers.filter(obj => obj !== this.voucherDetails[index]);
      this.Checked[index] = false;
    }
    this.payPalTotalPrice = +this.totalPrice;
    this.applePayTotalPrice = +this.totalPrice;
    let totalVoucherPrice = 0;
    if(this.selectedVouchers.length > 0){
      this.selectedVouchers.forEach( selectedVouchers => {
        totalVoucherPrice = +(totalVoucherPrice + selectedVouchers.Price);
      });
    }
      this.payPalTotalPrice = +(this.payPalTotalPrice - totalVoucherPrice);
      this.applePayTotalPrice = +(this.applePayTotalPrice - totalVoucherPrice);

      setTimeout(() => {
        this.paypalMessage();
      },100);      
  }

  createForms() {
    this.addressForm = this.formbuilder.group({
      address1: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      address2: new FormControl('', Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      address3: new FormControl('', Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      city: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      postCode: new FormControl('', [Validators.required, Validators.minLength(4)]),
      country: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)])
    });

  }

  setStep(step) {
    this.step = step;
  }

  createdAddressFormData() {
    if (this.isAddAddress) {
      if (this.billingAddresses == null) {
        this.billingAddresses = new Array<CustomerAddress>();
      }
      this.address.AddressType = 'Address' + " " + (this.billingAddresses.length + 1).toString();

      if (this.defaultVal) {
        this.billingAddresses.forEach(address => address.IsDefault = false)
        this.address.IsDefault = true;
      }

      let obj = Object.assign({}, this.address);
      this.billingAddresses.push(obj);

      this.isAddAddress = false;
      this.isAddressShow = false;
      this.isAdd = true;
    }
    else {
      if (this.defaultVal)
        this.billingAddresses.forEach(address => address.IsDefault = false)

      this.address.Address.CountryCode = this.editableAddress.Address.CountryCode;
      this.address.AddressType = this.editableAddress.AddressType;
      this.billingAddresses[this.editIndex].Address.Address1 = this.address.Address.Address1;
      this.billingAddresses[this.editIndex].Address.Address2 = this.address.Address.Address2;
      this.billingAddresses[this.editIndex].Address.Address3 = this.address.Address.Address3;
      this.billingAddresses[this.editIndex].Address.PostCode = this.address.Address.PostCode;
      this.billingAddresses[this.editIndex].Address.City = this.address.Address.City;
      this.billingAddresses[this.editIndex].Address.Country = this.address.Address.Country;
      this.billingAddresses[this.editIndex].IsDefault = this.address.IsDefault;
      this.selectedAddressIndex = this.address.IsDefault;
      this.isAddressShow = false;
    }
  }
  onAddressCreated() {

    this.addressForm.markAllAsTouched();
    this.addressList.forEach(x => {
      const elementValue = (document.getElementById(x) as HTMLInputElement).value;
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
      if (this.defaultVal) {
        this.address.IsDefault = true;
      }
      this.createdAddressFormData();

      this.showAddAdress = true;
      this.customerInfoUpdateModel.Email = localStorage.getItem('Email');
      this.customerInfoUpdateModel.Addresses = this.billingAddresses;
      this.sendModifyAddress();

    }
    else {
      this.notificationService.warn("Please fill all required data.");
    }
  }
  DefaultSelected(event) {
    this.defaultVal=event.checked
  }
  
  onClose() {
    this.isAddressShow = false;
    this.isAddAddress = false;
    this.showAddAdress = true;
  }

  addressmodal() {
    this.defaultVal=false;
    this.isAddAddress = true;
    this.isAddressShow = true;
    this.showAddAdress = false;//header
    this.step = 0;
    setTimeout(() => {
      document.querySelector('#addressForm2').scrollIntoView({ block: 'center' });
    },0);
    this.initializeAddress(this.isAddAddress);
  }

  editAddress(index) {
   this.defaultVal=false;
    this.editableAddress = this.billingAddresses[index];
    this.editIndex = index;
    this.isAddressShow = true;
    this.isAddAddress = false;
    this.showAddAdress = false;
    setTimeout(() => {
      document.querySelector('#addressForm2').scrollIntoView({ block: 'center' });
    },0);
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
    
    this.selectedAddressIndex = index;
    this.paymentRequest.BillingAddress = this.billingAddresses[index].Address;
    this.tempPaymentAddress = this.paymentRequest.BillingAddress;
  }

  onDeleteAddresss(_index) {
    if(this.billingAddresses.length==1)
    {
      this.notificationService.warn("You must have at least one postal address");
      return;
    }
    let dialogRef = this.dialog.open(ConfirmPopupComponent, {
      width: '500px',
      disableClose: false,
    });
     dialogRef.componentInstance.confirmMessage = "Are you sure you want to delete this address?"
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let temp;
        for (let i = this.editIndex; i < this.billingAddresses.length - 1; i++) {
          temp = this.storedAddress[i].AddressType;
          this.billingAddresses[i + 1].AddressType = temp;
        }
        if (this.billingAddresses.length > 1) {
          if (this.paymentRequest.BillingAddress === this.billingAddresses[this.editIndex].Address) {
            this.paymentRequest.BillingAddress = null;
          }
          this.billingAddresses.splice(this.editIndex, 1);
        }
        else {
          this.billingAddresses.splice(this.editIndex, 1);
          this.paymentRequest.BillingAddress = null;
        }
        this.isDelete = true;
        this.customerInfoUpdateModel.Email = localStorage.getItem('Email');
        this.customerInfoUpdateModel.Addresses = this.billingAddresses;
        this.sendModifyAddress();
      }
      else {
        return false;
      }
    });
  }
  formClose()
  {
    this.addressForm.reset();
  }
  sendModifyAddress() {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);

    this.addressService.modifyAddress(this.customerInfoUpdateModel).subscribe(res => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          if (this.responseData.Data) {
            this.setModifiedAddressData();
          }
          else {
            this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
            this.paymentRequest.BillingAddress = this.tempPaymentAddress;
            this.notificationService.error('Sorry, We are not able to update address this time. Please try again.');
          }
        }
        else {
          this.billingAddresses = this.storedAddress.slice(0);
          this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
          this.paymentRequest.BillingAddress = this.tempPaymentAddress;
        }
        this.isAdd = false;
        this.isDelete = false;
      }
    });
  }

  setModifiedAddressData() {
    if (this.isDelete) {
      this.notificationService.success('Address deleted successfully.');
    }
    else if (this.isAdd) {
      this.notificationService.success('Address added successfully.');
    }
    else {
      this.notificationService.success('Address updated successfully.');
    }
    if (window.screen.width <= 767) { // 768px portrait
      this.mobile = true;
    }
    this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    this.commonService.updateUserAddressesInLocalStorage(this.billingAddresses);
    this.onClose();
    this.formClose();
    this.getPaymentdetails(this.paymentDetailsRequest);
  }
 
  onSubmitPaymentStep1() {
    this.paymentRequest.ReviewBuyCache = this.paymentDetailsResponse.ReviewBuyCache;
    if ((this.selectedVouchers == null || this.selectedVouchers.length == 0) && (this.selectedCardOption == "" || this.selectedCardOption == null)) {
      this.notificationService.warn("Please select at least one payment method.");
      return false;
    }

    if (this.selectedVouchers.length != 0) {
      this.paymentRequest.Vouchers = this.selectedVouchers.map(({ VoucherId, FraudCode, Price, Currency }) => ({ VoucherId, FraudCode, Amount: Price, Currency }));
    }
    else {
      this.paymentRequest.Vouchers = new Array<Voucher>();
    }
    if (this.billingAddresses == null || this.billingAddresses.length == 0 || this.paymentRequest.BillingAddress == null || this.paymentRequest.BillingAddress.PostCode.trim() == "") {
      this.notificationService.warn("Address is required.");
      return false;
    }
    if (this.selectedCardOption == "oldPaymentCard") {
      this.paymentRequest.BillingAgreementId = this.selectedCard.BillingAgreementId;
    }
    this.paymentRequest.SaveCard = this.isAddNewCard.value;
    if (this.sharedService.reviewBuyResponse != undefined && this.sharedService.reviewBuyResponse != null) {
      this.paymentRequest.IsRenewSeason = this.sharedService.reviewBuyResponse.IsRenewSmartcard != undefined;
    }
  }

  paymentInitiatedForPostSaleData() {
    this.journeyExtraService.PaymentprocessOrder(this.paymentRequest).subscribe(res => {
      if (res != null) {
        this.paymentResponseData = res as ResponseData;
        if (this.paymentResponseData.ResponseCode == '200') {
          this.paymentResponse = this.paymentResponseData.Data.PaymentResponse;
          this.setSharedServiceReviewBuyCacheForPostSalePaymentResponse();
          this.sharedService.reviewBuyResponse.ReviewBuyCache = this.paymentResponse.ReviewBuyCache;
          if (this.isUpgradeChange === true) {
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearSessionStorageData("sharedSibling");
            this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
          } else {
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
          }

          if (this.paymentResponse.IsBasketJourneyValid) {
            localStorage.setItem(this.localStorageKeyEnum.prepareOrderId, String(this.paymentResponse.OrderId));
            this.redirectToNets();
          }
          else {
            localStorage.setItem('JourneyValidforPayemnt', 'true');
            this.timeoutpopup();
            this.spinnerService.hide();
            this.commonService.loaderRequired = false;
          }
        }
        else {
          console.log(this.paymentResponseData.ResponseMessage);
        }
      }
    }
    )
  }
  onSubmitPayment() {
    if (!this.onSubmitPaymentStep1() && this.onSubmitPaymentStep1() !== undefined) {
      return false;
    }
    if (this.selectedCardOption == 'payPal') {
      this.paymentRequest.PaymentMethod = this.nativePaymentMethodEnum.netsPaypal;
    }
    //For google pay, adding payment method in payment request
    if (this.selectedCardOption == this.nativePaymentMethodEnum.netsGooglePay) {
      this.paymentRequest.PaymentMethod = this.nativePaymentMethodEnum.netsGooglePay;
    }
    //For apple pay, adding token and payment method in payment request
    if(this.selectedCardOption == this.nativePaymentMethodEnum.netsApplePay){
      this.paymentRequest.PaymentMethod = this.nativePaymentMethodEnum.netsApplePay;
      this.paymentRequest.AuthToken = this.AuthToken;
    }
    this.paymentRequest.UserName = localStorage.getItem('UserName');
    let isChangeReplace = JSON.parse(localStorage.getItem('isChangeReplace'));
    let isCOJChange = this.isCoj;
    try {
      this.ga4dataLayerService.loadGALayerForAddPaymentInfo(this.sharedService.reviewBuyResponse, this.paymentRequest.PaymentMethod,this.selectedVouchers.length > 0, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
    } catch (error) { console.log(error); }
    this.paymentRequest.IsPostSale = this.checkPostSaleValue(this.sharedService) ? true : false;
    if (isChangeReplace) {
      this.smartCardPaymentInitiate(this.paymentRequest);
    }
    else if (isCOJChange || (this.isUpgradeChange === true)) {
      // call api postsale controller ProcessCojOrder with IsCOJ parameter true
      this.commonService.loaderRequired = true;
      this.paymentRequest.IsCOJ = true;
      this.paymentRequest.IsRenewSeason = false;
      this.paymentRequest.EvaluateCache = this.sharedService.reviewBuyResponse.COJData.COJEvaluateCache;
      this.paymentInitiatedForPostSaleData();
    }
    else {
      this.paymentInitiate(this.paymentRequest);
    }
  }

  onPaypalPayment() {
    this.selectedCardOption = 'payPal';
    this.onSubmitPayment();
  }

  paymentInitiate(paymentRequest: PaymentPageRequest) {
    this.commonService.loaderRequired = true;
    this.paymentService.initiatePayment(paymentRequest).subscribe(
      res => {
        if (res != null) {
          this.paymentResponseData = res as ResponseData;
          if (this.paymentResponseData.ResponseCode == '200') {
            this.paymentResponse = this.paymentResponseData.Data;
            if (this.checkPostSaleValue(this.sharedService)) {
              this.sharedService.postSaleReviewBuyCache = this.paymentResponse.ReviewBuyCache;
            } else {
              this.sharedService.reviewBuyCache = this.paymentResponse.ReviewBuyCache;
            }
            this.sharedService.reviewBuyResponse.ReviewBuyCache = this.paymentResponse.ReviewBuyCache;
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data

            if (this.paymentResponse.IsBasketJourneyValid) {
              localStorage.setItem(this.localStorageKeyEnum.prepareOrderId, String(this.paymentResponse.OrderId));
              this.redirectToNets();
            }
            else {
              localStorage.setItem('JourneyValidforPayemnt', 'true');
              this.timeoutpopup();
              this.spinnerService.hide();
              this.commonService.loaderRequired = false;
            }
          }
          else {
            console.log(this.paymentResponseData.ResponseMessage);
          }
        }
      }
    );
  }

  redirectToNets(){
    if (this.paymentResponse.AuthorizationUrl) {
      window.location.href = this.paymentResponse.AuthorizationUrl;
    }
    else {
      if (this.isAddNewCard.value) {
        this.router.navigate([`./` + this.appRouteEnum.ValidateEnrollmentDo]);
      }
      else {
        this.router.navigate([`./` + this.appRouteEnum.ValidatePaymentDo]);
      }
    }
  }

  smartCardPaymentInitiate(paymentRequest: PaymentPageRequest) {
    this.paymentService.initiatePaymentSmartCard(paymentRequest).subscribe(
      res => {
        if (res != null) {
          this.paymentResponseData = res as ResponseData;
          if (this.paymentResponseData.ResponseCode == '200') {
            this.paymentResponse = this.paymentResponseData.Data;
            this.setSharedServiceReviewBuyCacheForPostSalePaymentResponse();
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            this.redirectToNets();
          }
          else {
            console.log(this.paymentResponseData.ResponseMessage);
          }
        }
      }
    );
  }

  getPaymentdetails(paymentDetailsRequest) {
    this.paymentDetailsService.paymentDetails(paymentDetailsRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.paymentDetailsResponse = this.responseData.Data;
            this.bindPaymentResponse();
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  bindPaymentResponse() {
    
    //For Evouchers
    this.eVouchersResponse = new EVouchersResponse;
    if (this.paymentDetailsResponse.Vouchers != null) {
      this.eVouchersResponse.Vouchers = this.paymentDetailsResponse.Vouchers;
      this.eVouchersResponse.VoucherMessage = this.paymentDetailsResponse.VoucherMessage;
      if (this.eVouchersResponse.Vouchers) {
        this.voucherDetails = this.eVouchersResponse.Vouchers;
        this.voucherLen = Object.keys(this.voucherDetails).length;        
        this.voucherDetails.forEach(()=> this.Checked.push(false));
      }
      this.isSingleUse = this.checkVoucherUse(this.paymentDetailsResponse.Vouchers);
    }

    

    //For Billing Adresses

    if (this.paymentDetailsResponse.BillingAddress != null && this.paymentDetailsResponse.BillingAddress.Addresses != null) {
      this.billingAddresses = this.paymentDetailsResponse.BillingAddress.Addresses;
      this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
      if (this.billingAddresses != null) {
        let address = this.billingAddresses.filter(m => m.IsDefault);
        let addressindex=this.billingAddresses.findIndex(m => m.IsDefault);
        if (address != undefined && address.length != 0) {
          this.paymentRequest.BillingAddress = address[0].Address;
          this.selectedAddressIndex=addressindex
        }
        else {
          this.billingAddresses[0].IsDefault = true;
          this.paymentRequest.BillingAddress = this.billingAddresses[0].Address;
        }
        this.tempPaymentAddress = this.paymentRequest.BillingAddress;
      }
    }

    if (this.paymentDetailsResponse.PaymentCards != null && this.paymentDetailsResponse.PaymentCards.length > 0) {
      this.selectedCardOption = "oldPaymentCard"
      this.selectedCard = this.paymentDetailsResponse.PaymentCards[0];
      this.selectedCardNumber = this.selectedCard.CardNumber;
    }
    else {
      this.selectedCardOption = "newPaymentCard"
    }
  }

  checkVoucherUse(vouchers){
    let singleUse = vouchers.find(item => item.Usage !== "MultiUse" );
    
    if(singleUse == undefined){
      return false;
    }
    return true;
  }

  bindFarebreakupChangeReplace(){
    this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.sharedService.fareBreakDownTotalDiscount = 0;
    let fareBreakdownModel = new FareBreakdownModel;
    fareBreakdownModel.OutWardJourney = new Array<JourneyModel>();
    let outJourney = new JourneyModel;
    outJourney.TotalPrice = this.changeReplaceResponse.AdminFee.Amount;
    outJourney.PricePerPerson = this.changeReplaceResponse.AdminFee.Amount;
    fareBreakdownModel.OutWardJourney.push(outJourney);
    fareBreakdownModel.ReturnJourney = null;
    fareBreakdownModel.OutwardJourneyExtras = null;
    fareBreakdownModel.ReturnJourneyExtras = null;
    fareBreakdownModel.DeliveryDetails = null;
    fareBreakdownModel.JourneyType = null;
    fareBreakdownModel.DiscountPrice = null;
    fareBreakdownModel.DiscountPercent = null;
    fareBreakdownModel.SeasonJourney = null;
    fareBreakdownModel.FlexiJourney = null;
    this.sharedService.fareBreakdownModelData.push(fareBreakdownModel);

  }

  changeReplaceFunction() {
    let data = localStorage.getItem("ChangeReplace");
    this.changeReplaceResponse = JSON.parse(data);
    this.paymentDetailsResponse = this.changeReplaceResponse.PaymentDetailResponse;
    this.totalPrice = this.changeReplaceResponse.AdminFee.Amount.toString();
    this.payPalTotalPrice = +this.totalPrice;
    this.applePayTotalPrice = +this.totalPrice;
    this.bindPaymentResponse();
    this.paymentRequest.EvaluateCache = this.changeReplaceResponse.EvaluateCache;
    this.bindFarebreakupChangeReplace();
  }

  timeoutpopup() {
    let dialogRef = this.dialog.open(TimeoutComponent, {
      disableClose: false,
      width: '600px',
      data: {
        Message: this.paymentResponse.BasketJourneyMessage
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      if ((!this.isCoj || this.isCoj === null || this.isCoj === undefined) &&
        (!this.isUpgradeChange || this.isUpgradeChange === null || this.isUpgradeChange === undefined)) {
          if (this.commonService.doesDeliveryPageSkipped()) {
          this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
        } else {
          this.router.navigate([`./` + this.appRouteEnum.ReviewBuy]);
        }
      }
    });
  }

  showPaymentWarning(isCard, card: PaymentCard) {
    if (isCard) {
      this.showWarning = true;
      if (card != undefined) {
        this.selectedCard = card;
        this.selectedCardNumber = this.selectedCard.CardNumber;
        this.selectedCardOption = "oldPaymentCard";
      } else {
        this.selectedCardNumber = null;
        this.selectedCardOption = "newPaymentCard";
      }
    }
    else {
      this.showWarning = false;
      this.selectedCardNumber = null;
      this.selectedCardOption = "payPal";
    }
  }

  getOneThirdPrice() {
    return this.sharedService.currencySymbol('') + this.sharedService.formatPrice(Number.parseFloat(this.totalPrice) / 3)
  }

  isShowPayLater() {
    return (Number.parseFloat(this.totalPrice) > 30 && Number.parseFloat(this.totalPrice) <= 2000)
  }


  goBack() {
    if(this.isUpgradeChange === true) {
      this.router.navigate(["./" + this.appRouteEnum.upgradeReviewBuy]);
    }
  }
  closeErrorMsg() {
    this.isErrorComingFromUpgradeChange = false;
  }

  handleKeyup($event, radio: MatRadioButton) {
    if($event.keyCode === 32) { // spacebar
       radio.checked = true;
    }
 }

  paypalMessage() {
    paypal.Messages({
      amount: this.payPalTotalPrice,
      placement: "payment",
      style: {
        layout: "text",
        logo: { type: "inline" }
      }
    }).render("#pp-pay-later-message");
  }
  // GOOGLEPAY CODE - start
  onGpayClick()
  {
    this.selectedCardOption = this.nativePaymentMethodEnum.netsGooglePay;
    this.onSubmitPayment();
  }
  // GOOGLEPAY CODE -end

  public loadApplePayAPIScript(url: string) {
    const head = <HTMLDivElement> document.head;
    const script = document.createElement('script');
    script.src = url;
    head.appendChild(script);
  }

  // apple pay implemetaion -- start
  onApplePayClick() {
    this.selectedCardOption = this.nativePaymentMethodEnum.netsApplePay;
    // Define ApplePayPaymentRequest
    const request = {
      "countryCode": "GB",
      "currencyCode": "GBP",
      "merchantCapabilities": [
        "supports3DS"
      ],
      "supportedNetworks": [
        "visa",
        "masterCard",
        "amex",
        "discover"
      ],
      "total": {
        "label": environment.applePayLabel,
        "type": "final",
        "amount": this.applePayTotalPrice.toFixed(2)
      }
    };
    // Create ApplePaySession
    const session = new (window as any).ApplePaySession(3, request);
    session.onvalidatemerchant = async (event: any) => {
      // Call your own server to request a new merchant session.
      let validationUrl;
      if(event.validationURL){
         validationUrl = { "ValidationURL": event.validationURL};
      }else{
         validationUrl = { "ValidationURL": "https://apple-pay-gateway-cert.apple.com/paymentservices/paymentSession" };
      }
      this.paymentDetailsService.appleValidateMerchant(validationUrl).subscribe(
        merchantSession => {
          session.completeMerchantValidation(merchantSession);
        }, err => {
          console.log(err);
          this.notificationService.warn('The Payment has not gone through. Please Try Again.');
          this.resetPaymentRequest();
        });
    };
    session.onpaymentauthorized = (event: any) => {
      // Define ApplePayPaymentAuthorizationResult
      try {
        //apple pay token 
        let applePayToken = event.payment;
        const result = {
          "status": (window as any).ApplePaySession.STATUS_SUCCESS
        };
        session.completePayment(result);
        this.AuthToken = JSON.stringify(applePayToken);
        this.onSubmitPayment();
      }
      catch (error) {
        const result = {
          "status": (window as any).ApplePaySession.STATUS_FAILURE
        };
        session.completePayment(result);
        this.notificationService.warn('The Payment has not gone through. Please Try Again.');
        this.resetPaymentRequest();
      }
    };
    session.oncancel = () => {
      this.notificationService.warn('The Payment has not gone through. Please Try Again.');
      this.resetPaymentRequest();
    };
    session.begin();
  }
    // apple pay implemetaion- end

  resetPaymentRequest() {
    if (!this.paymentRequest) {
      this.paymentRequest = new PaymentPageRequest;
      this.paymentRequest.CustomerKey = this.customerKey;
      this.paymentRequest.Email = this.customerEmail;
      this.paymentRequest.FirstName = localStorage.getItem('FirstName');
      this.paymentRequest.LastName = localStorage.getItem('LastName');
    }
    this.paymentRequest.PaymentMethod = "NETS_ONLINE";
    this.selectedCardOption = 'oldPaymentCard';  
  }

  setLocalStorageForSeasonJourney(){
    if (localStorage.getItem('IsSeason')) {
      localStorage.removeItem('IsSeason');
    }
    if (this.isSeason) {
      localStorage.setItem('IsSeason', 'true');
    }
  }
 
  emitBasketCount(){
    if (this.sharedService && this.sharedService.reviewBuyResponse) {
      this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
    }
  }

  checkPostSaleValue(sharedService) {
    if (this.isCoj || this.isUpgradeChange || sharedService?.reviewBuyResponse?.IsRenewSmartcard) {
      return true;
    }
    return false;
  }

  nullOrUndefinedCheckForSharedSiblingRefresh(sharedSiblingRefresh){
    return sharedSiblingRefresh != null && sharedSiblingRefresh != undefined;
  }

  setSharedSiblingRefresh(){
    let sharedSiblingRefresh = null;
    if (this.isUpgradeChange === true) {
      sharedSiblingRefresh = this.storageDataService.getSessionStorageData("sharedSibling", true);
    } else {
      sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    }
    return sharedSiblingRefresh;
  }

  setSharedServiceReviewBuyCacheForPostSalePaymentResponse() {
    if (this.checkPostSaleValue(this.sharedService)) {
      this.sharedService.postSaleReviewBuyCache = this.paymentResponse.ReviewBuyCache;
    } else {
      this.sharedService.reviewBuyCache = this.paymentResponse.ReviewBuyCache;
    }
  }

  reDirectionAfterPaymentResponse(){
    if (this.paymentResponse.AuthorizationUrl) {
      window.location.href = this.paymentResponse.AuthorizationUrl;
    }
    else {
      if (this.isAddNewCard.value) {
        this.router.navigate([`./` + this.appRouteEnum.ValidateEnrollmentDo]);
      }
      else {
        this.router.navigate([`./` + this.appRouteEnum.ValidatePaymentDo]);
      }
    }
  }
  
  trimSpacesFromPostCodeFormControl(){
    this.postCodeValueChangeSubscription = this.addressForm.controls['postCode'].valueChanges
    .subscribe(x=>{
      if(x && x.includes(' ')){
        this.addressForm.controls['postCode'].setValue(x.trim().replace(/\s/g, ""))
      }
    });
  }
}
