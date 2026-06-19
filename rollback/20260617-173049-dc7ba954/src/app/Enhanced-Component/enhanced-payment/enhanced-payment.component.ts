import { Component, Injector, OnInit, ElementRef, ChangeDetectorRef } from "@angular/core";
import { MatRadioButton } from "@angular/material/radio";
import { browserRefresh } from "src/app/app-component/app.component";
import { ResponseData } from "src/app/models/common/response.model";
import {
  Address,
  CustomerAddress,
} from "src/app/models/payment-details/billing-address-response.model";
import { EVouchersResponse } from "src/app/models/payment-details/eVouchers-response.model";
import { PaymentDetailRequest } from "src/app/models/payment-details/payment-details-request.model";
import {
  PaymentPageRequest,
  Voucher,
} from "src/app/models/payment-details/payment-request.model";
import { CommonServices } from "src/app/services/common.service";
import { EnhancedPaymentApiDataService } from "src/app/services/enhanced-payment-api-data.service";
import { PaymentDetailsService } from "src/app/services/payment-details.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { SharedServiceCache } from "src/app/services/SharedServiceCache.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import {
  EnhancedLocalOrSessionStorageKeysEnum,
  NativePaymentMethodEnum,
  LocalStorageKeyEnum,
  EnhancedPaymentMethodEnum,
  EnhancedDynamicClassesNameEnum,
  EnhancedPaymentPageMessageEnum,
  AppRouteEnum,
  EnhancedAppRouteEnum,
  EnhancedLoaderTextEnum,
} from "src/app/utility/app-constants.service";
import { NotificationService } from "src/app/utility/toastr-notification/toastr-notification.service";
import { environment } from "src/environments/environment";
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
} from "@angular/forms";
import {
  FareBreakdownModel,
  JourneyModel,
} from "src/app/models/mixing-deck/fare-breakdown.model";
import { CustomerInfoUpdate } from "src/app/models/customer/customer-address.model";
import { MatDialog } from "@angular/material/dialog";
import { EnhancedCommonConfirmationDialogComponent } from "../enhanced-dialogs/enhanced-common-confirmation-dialog/enhanced-common-confirmation-dialog.component";
import {
  EnhancedChangeReplaceResponseDto,
  EnhancedPaymentCard,
  EnhancedPaymentDetailResponse,
  EnhancedUpdatePaymentCardsDto,
} from "src/app/models/enhanced-payment-details/enhanced-payment-card-details-request.model";
import { PaymentResponse } from "src/app/models/payment-details/payment-response.model";
import { Router } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { EnhancedCommonErrorPopupComponent } from "../enhanced-dialogs/enhanced-common-error-popup/enhanced-common-error-popup.component";
import { Subscription } from "rxjs";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { PaymentService } from "src/app/services/payment-initiate.service";
import { JourneyExtraService } from "src/app/services/journey-extras.service";
import { EnhancedPaymentNotCompletedDialogComponent } from "../enhanced-dialogs/enhanced-payment-not-completed-dialog/enhanced-payment-not-completed-dialog.component";
import { MonetateService } from "src/app/utility/monetate/monetate.service";
declare var paypal: any;
declare var pca: any;

@Component({
    selector: "app-enhanced-payment",
    templateUrl: "./enhanced-payment.component.html",
    styleUrls: ["./enhanced-payment.component.css"],
    standalone: false
})
export class EnhancedPaymentComponent implements OnInit {
  sharedService: SharedService;
  customerKey: any;
  customerEmail: any;
  paymentDetailsRequest: PaymentDetailRequest;
  paymentDetailsResponse: EnhancedPaymentDetailResponse;
  enhancedPaymentApiDataService: EnhancedPaymentApiDataService;
  responseData: ResponseData;
  eVouchersResponse: EVouchersResponse;
  voucherDetails: any;
  voucherLength: any;
  Checked: any = [];
  isSingleUse: boolean = false;
  billingAddresses: CustomerAddress[];
  storedAddress: CustomerAddress[];
  paymentRequest: PaymentPageRequest;
  selectedAddressIndex: any = 0;
  tempPaymentAddress: Address;
  selectedCardOption: string;
  selectedCard: EnhancedPaymentCard;
  selectedCardNumber: string | null = null;
  commonServices: CommonServices;
  browserRefresh: boolean;
  storageDataService: StorageDataService;
  enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
  isUpgradeChange: boolean = false;
  isCoj: boolean = false;
  sharedServiceCache: SharedServiceCache;
  nativePaymentMethodEnum: NativePaymentMethodEnum;
  applePayTotalPrice: number;
  paymentDetailsService: PaymentDetailsService;
  notificationService: NotificationService;
  AuthToken: string;
  showWarning: boolean = true;
  selectedVouchers: any = [];
  payPalTotalPrice: number;
  totalPrice: string;
  isAddNewCard = new FormControl(false);
  paymentForSmartcard: any;
  addressForm: FormGroup;
  changeReplaceResponse: EnhancedChangeReplaceResponseDto;
  isSeason: boolean = false;
  localStorageKeyEnum: LocalStorageKeyEnum;
  enhancedPaymentMethodEnum: EnhancedPaymentMethodEnum;
  defaultVal: boolean = false;
  addressList = [
    "postCode",
    "address1",
    "address2",
    "address3",
    "city",
    "country",
  ];
  el: ElementRef;
  address: CustomerAddress;
  editIndex: number | null = null;
  isAddAddress: boolean = false;
  isAddressShow: boolean = false;
  isAdd: boolean = false;
  editableAddress: CustomerAddress;
  showAddAdress: boolean = true;
  customerInfoUpdateModel: CustomerInfoUpdate;
  isDelete: boolean = false;
  updatedAddressIndex: number | null = null;
  toastMessage: string | null = null;
  showCommonToast: boolean = false;
  enhancedDynamicClassesNameEnum: EnhancedDynamicClassesNameEnum;
  paymentCards: EnhancedPaymentCard[];
  savedCardToastMessage: string = "";
  showSavedCardToast: boolean = false;
  addressErrorMsg: string = "";
  enhancedPaymentPageMessageEnum: EnhancedPaymentPageMessageEnum;
  enhancedPaymentResponseData: ResponseData;
  enhancedPaymentResponse: PaymentResponse;
  router: Router;
  appRouteEnum: AppRouteEnum;
  spinnerService: NgxSpinnerService;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  searchRequest: EnhancedSearchRequestModel;
  selectedNewCardAriaLabel: string;
  selectedPayPalAriaLabel: string;
  selectedVoucherPrice: number = 0;
  fieldLabels = {
    postCode: "Postcode",
    address1: "First line",
    address2: "Second line",
    address3: "Third line",
    city: "City/Town",
    country: "Country",
  };
  isSuccess: boolean = false;
  postCodeValueChangeSubscription: Subscription;
  isErrorComingFromUpgradeChange: boolean = false;
  ga4dataLayerService: GA4DatalayerService;
  paymentService: PaymentService;
  journeyExtraService: JourneyExtraService;
  isLoaderActive: boolean = false;
  isUpadateInJourney: boolean = false;
  enhancedLoaderTextEnum: EnhancedLoaderTextEnum;
  monetateService: MonetateService;

  constructor(
    private readonly injector: Injector,
    private readonly formbuilder: FormBuilder,
    public dialog: MatDialog,
    private readonly cd: ChangeDetectorRef
  ) {
    this.sharedService = this.injector.get(SharedService);
    this.enhancedPaymentApiDataService = this.injector.get(
      EnhancedPaymentApiDataService
    );
    this.commonServices = this.injector.get(CommonServices);
    this.storageDataService = this.injector.get(StorageDataService);
    this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(
      EnhancedLocalOrSessionStorageKeysEnum
    );
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.nativePaymentMethodEnum = this.injector.get(NativePaymentMethodEnum);
    this.paymentDetailsService = this.injector.get(PaymentDetailsService);
    this.notificationService = this.injector.get(NotificationService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.enhancedDynamicClassesNameEnum = this.injector.get(
      EnhancedDynamicClassesNameEnum
    );
    this.enhancedPaymentMethodEnum = this.injector.get(
      EnhancedPaymentMethodEnum
    );
    this.el = this.injector.get(ElementRef);
    this.customerInfoUpdateModel = new CustomerInfoUpdate();
    this.customerInfoUpdateModel.Addresses = new Array<CustomerAddress>();
    this.enhancedPaymentPageMessageEnum = this.injector.get(
      EnhancedPaymentPageMessageEnum
    );
    this.router = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.searchRequest = this.sharedService.searchRequest;
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.paymentService = this.injector.get(PaymentService);
    this.journeyExtraService = this.injector.get(JourneyExtraService);
    this.enhancedLoaderTextEnum = this.injector.get(EnhancedLoaderTextEnum);
    this.monetateService = this.injector.get(MonetateService);
  }

  ngOnInit(): void {
    this.searchRequest = this.sharedService.searchRequest;
    this.isCoj = JSON.parse(
      localStorage.getItem(
        this.enhancedLocalOrSessionStorageKeyEnum.isCOJChange
      )
    );
    this.emitBasketCount();
    // paypal messaging code
    this.loadPaypalPaymentScript(
      environment.paypalMessageUrl +
        environment.paypalClientId +
        "&components=messages"
    );
    this.loadApplePayAPIScript(environment.applePayScriptUrl);
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true, true);
    this.monetateService.setPageType();
    this.monetateService.flushEvents();
    this.isUpgradeChange = this.storageDataService.getSessionStorageData(
      this.enhancedLocalOrSessionStorageKeyEnum.isUpgradeChange,
      true
    );
    this.getSharedCacheDataOnLoad();
    //Get shared cache data
    this.customerKey = localStorage.getItem(
      this.localStorageKeyEnum.customerKey
    );
    this.customerEmail = localStorage.getItem(this.localStorageKeyEnum.email);
    this.paymentRequest = new PaymentPageRequest();
    this.paymentRequest.CustomerKey = this.customerKey;
    this.paymentRequest.Email = this.customerEmail;
    this.paymentRequest.PaymentMethod =
      this.enhancedPaymentMethodEnum.Nets_Online;
    this.paymentRequest.FirstName = localStorage.getItem(
      this.localStorageKeyEnum.firstName
    );
    this.paymentRequest.LastName = localStorage.getItem(
      this.localStorageKeyEnum.lastNameText
    );

    this.paymentForSmartcard = JSON.parse(
      localStorage.getItem(this.localStorageKeyEnum.paymentForSmartcard)
    );
    let isChangeReplace = JSON.parse(
      localStorage.getItem(this.localStorageKeyEnum.isChangeReplace)
    );

    if (isChangeReplace) {
      this.createForms();
      this.changeReplaceFunction();
    } else {
      this.buildPaymentDetailsRequest();
      this.getPaymentdetails(this.paymentDetailsRequest, true);
      if (this.isCoj || this.isUpgradeChange) {
        this.totalPrice = this.sharedService.totalPriceToPayReviewBuy;
        this.payPalTotalPrice = +this.totalPrice;
        this.applePayTotalPrice = +this.totalPrice;
        this.sharedService.getBasketCount.emit(0);
        if(this.isUpgradeChange) {
          this.ga4dataLayerService.loadGALayerForAddToCartInfo(this.sharedService.upgradeSearchRequest.SearchRequestDto, this.sharedService.reviewBuyResponse.Journey[0], this.commonServices.jourenyExtraForCheckout(),true, true, this.totalPrice);
        }
      } else {
        this.totalPrice = this.commonServices.getTotalJourneyAmount(this.sharedService);
        this.payPalTotalPrice = +this.totalPrice;
        this.applePayTotalPrice = +this.totalPrice;
      }
      this.createForms();

      this.doesSeasonDetailExist();

      // this.billingAddresses = new Array<CustomerAddress>();
      // this.storedAddress = new Array<CustomerAddress>();
    }
    this.setLocalStorageForSeasonJourney();
    this.checkPaymentUpgradeErrorFromvalidatePage();
    this.trimSpacesFromPostCodeFormControl();
  }

  createForms() {
    this.addressForm = this.formbuilder.group({
      address1: new FormControl("", [
        Validators.required,
        Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/),
      ]),
      address2: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      address3: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      city: new FormControl("", [
        Validators.required,
        Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/),
      ]),
      postCode: new FormControl("", [
        Validators.required,
        Validators.minLength(4),
      ]),
      country: new FormControl("", [
        Validators.required,
        Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/),
      ]),
    });
  }

  emitBasketCount() {
    if (this.sharedService?.enhancedReviewBuyResponse) {
      this.sharedService.getBasketCount.emit(
        this.sharedService.enhancedReviewBuyResponse.BasketCount
      );
    }
  }

  getSharedCacheDataOnLoad() {
    this.browserRefresh = browserRefresh;
    if (!this.browserRefresh) return;
    //Get shared cache data
    let cachedData = this.setSharedSiblingRefresh();
    if (!cachedData) return;

    this.searchRequest = cachedData.searchRequest;
    this.sharedService.searchRequest = cachedData.searchRequest;
    this.sharedService.ReservationCache = cachedData.ReservationCache;
    if (this.checkPostSaleValue(cachedData)) {
      this.sharedService.postSaleReviewBuyCache =
        cachedData.postSaleReviewBuyCache;
    } else {
      this.sharedService.reviewBuyCache = cachedData.reviewBuyCache;
    }
    this.sharedService.enhancedReviewBuyResponse =
      cachedData.enhancedReviewBuyResponse;
    if (this.sharedService?.enhancedReviewBuyResponse) {
      this.sharedService.getBasketCount.emit(
        this.sharedService?.enhancedReviewBuyResponse?.BasketCount
      );
    }
    this.sharedService.searchRequest = cachedData.searchRequest;
    this.sharedService.fareBreakdownModelData =
      cachedData.fareBreakdownModelData;
    this.sharedService.reviewBuyResponse = cachedData.reviewBuyResponse;
    if (this.sharedService?.reviewBuyResponse) {
      this.sharedService.getBasketCount.emit(
        this.sharedService.reviewBuyResponse.BasketCount
      );
    }
    this.sharedService.locationMasterData = cachedData.locationMasterData;
    this.sharedService.totalPriceToPayReviewBuy =
      cachedData.totalPriceToPayReviewBuy;
    this.sharedService.journey = cachedData.journey;
    this.sharedService.CojSearchRequest = cachedData.CojSearchRequest;
    this.sharedService.COJjourneySummaryModel =
      cachedData.COJjourneySummaryModel;
    this.sharedService.journeySummaryModel = cachedData.journeySummaryModel;
    this.sharedService.CojReviewBuyRequest = cachedData.CojReviewBuyRequest;
    this.sharedService.createReservationRequest =
      cachedData.createReservationRequest;
    this.sharedService.selectedJourneyDataForQuickBuyOrContiue =
      cachedData?.selectedJourneyDataForQuickBuyOrContiue;
    if (this.isUpgradeChange === true) {
      this.sharedService.upgradeSearchRequest = cachedData.upgradeSearchRequest;
      this.sharedService.upgradeReviewBuyRequest =
        cachedData.upgradeReviewBuyRequest;
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearSessionStorageData(
        this.localStorageKeyEnum.sharedSiblingText
      );
      this.storageDataService.setSessionStorageData(
        this.localStorageKeyEnum.sharedSiblingText,
        this.sharedServiceCache,
        true
      );
      //Set shared cache data
    } else {
      //Set shared cache data
      this.commonServices.cacheSharedData();
      //Set shared cache data
    }
  }

  setSharedSiblingRefresh() {
    return this.isUpgradeChange
      ? this.storageDataService.getSessionStorageData(
          this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling,
          true
        )
      : this.storageDataService.getStorageData(
          this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling,
          true
        );
  }

  checkPostSaleValue(sharedService) {
    if (
      this.isCoj ||
      this.isUpgradeChange ||
      sharedService?.enhancedReviewBuyResponse?.IsRenewSmartcard
    ) {
      return true;
    }
    return false;
  }

  private buildPaymentDetailsRequest() {
    this.paymentDetailsRequest = new PaymentDetailRequest();
    this.paymentDetailsRequest.CustomerKey = this.customerKey;
    this.paymentDetailsRequest.Email = this.customerEmail;
    if (this.checkPostSaleValue(this.sharedService)) {
      this.paymentDetailsRequest.ReviewBuyCache =
        this.sharedService.postSaleReviewBuyCache;
    } else {
      this.paymentDetailsRequest.ReviewBuyCache =
        this.sharedService.reviewBuyCache;
    }
    this.paymentDetailsRequest.IsPostSale =
      !!this.sharedService?.enhancedReviewBuyResponse?.IsRenewSmartcard;
  }

  getPaymentdetails(paymentDetailsRequest, isPageLoadRequired) {
    try {
      this.isLoaderActive = isPageLoadRequired;
      this.enhancedPaymentApiDataService
        .fetchPaymentData(paymentDetailsRequest)
        .subscribe({
          next: (data) => {
            this.commonServices.loaderRequired = false;
            this.spinnerService.hide();
            setTimeout(() => {
                this.isLoaderActive = false;
                this.paymentDetailsResponse = data;
                this.bindPaymentResponse();
            }, 2000);
          },
          error: (err) => {
            this.isLoaderActive = false;
            this.commonServices.loaderRequired = false;
            console.error("Payment API failed", err);
          },
        });
    } catch (error) { console.log(error); }
  }

  bindPaymentResponse() {
    //For Evouchers
    this.eVouchersResponse = new EVouchersResponse();
    if (this.paymentDetailsResponse.Vouchers) {
      this.eVouchersResponse.Vouchers = this.paymentDetailsResponse.Vouchers;
      this.eVouchersResponse.VoucherMessage =
        this.paymentDetailsResponse.VoucherMessage;
      if (this.eVouchersResponse.Vouchers) {
        this.voucherDetails = this.eVouchersResponse.Vouchers;
        this.voucherLength = Object.keys(this.voucherDetails).length;
        this.voucherDetails.forEach(() => this.Checked.push(false));
      }
      this.isSingleUse = this.checkVoucherUse(
        this.paymentDetailsResponse.Vouchers
      );
    }
    //For Billing Adresses
    if (this.paymentDetailsResponse?.BillingAddress?.Addresses) {
      this.billingAddresses =
        this.paymentDetailsResponse.BillingAddress.Addresses;
      this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
      if (this.billingAddresses?.length > 0) {
        let address = this.billingAddresses.filter((m) => m.IsDefault);
        let addressindex = this.billingAddresses.findIndex((m) => m.IsDefault);
        if (address != undefined && address?.length != 0) {
          this.paymentRequest.BillingAddress = address[0].Address;
          this.selectedAddressIndex = addressindex;
        } else {
          this.billingAddresses[0].IsDefault = true;
          this.paymentRequest.BillingAddress = this.billingAddresses[0].Address;
        }
        this.tempPaymentAddress = this.paymentRequest.BillingAddress;
      } else {
        // Show form if no addresses
        this.isAddressShow = true;
        this.isAddAddress = true;
      }
    }
    if (this.paymentDetailsResponse?.PaymentCards?.length > 0) {
      this.selectedCardOption = null;
      this.selectedCard = null;
      this.selectedCardNumber = null;
      this.paymentCards = this.paymentDetailsResponse?.PaymentCards;
    } else {
      this.selectedCardOption = this.enhancedPaymentMethodEnum.newPaymentCard;
    }
    this.cd.detectChanges();
  }

  checkVoucherUse(vouchers) {
    let singleUse = vouchers?.find(
      (item) => item.Usage !== this.enhancedPaymentMethodEnum.MultiUse
    );
    if (singleUse == undefined) {
      return false;
    }
    return true;
  }

  onGpayClick() {
    this.selectedCardNumber = null;
    this.selectedCardOption = this.nativePaymentMethodEnum.netsGooglePay;
    if (!this.checkBillingAddressForNativePay(this.selectedCardOption)) {
      return;
    }
    this.onPayNow();
  }

  // apple pay implemetaion -- start
  onApplePayClick() {
    this.selectedCardNumber = null;
    this.selectedCardOption = this.nativePaymentMethodEnum.netsApplePay;
    if (!this.checkBillingAddressForNativePay(this.selectedCardOption)) {
      return;
    }
    // Define ApplePayPaymentRequest
    const request = {
      countryCode: "GB",
      currencyCode: "GBP",
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["visa", "masterCard", "amex", "discover"],
      total: {
        label: environment.applePayLabel,
        type: "final",
        amount: this.applePayTotalPrice.toFixed(2),
      },
    };
    // Create ApplePaySession
    const session = new (window as any).ApplePaySession(3, request);
    session.onvalidatemerchant = async (event: any) => {
      // Call your own server to request a new merchant session.
      let validationUrl = {
        validationURL:
          event.validationURL ||
          "https://apple-pay-gateway-cert.apple.com/paymentservices/paymentSession",
      };

      this.paymentDetailsService.appleValidateMerchant(validationUrl).subscribe(
        (merchantSession) => {
          session.completeMerchantValidation(merchantSession);
        },
        (err) => {
        console.log(err);
          this.openCommonPaymentErrorPopup();
          this.resetPaymentRequest();
        }
      );
    };
    session.onpaymentauthorized = (event: any) => {
      // Define ApplePayPaymentAuthorizationResult
      try {
        //apple pay token
        let applePayToken = event.payment;
        const result = {
          status: (window as any).ApplePaySession.STATUS_SUCCESS,
        };
        session.completePayment(result);
        this.AuthToken = JSON.stringify(applePayToken);
        this.onPayNow();
      } catch (error) {
        const result = {
          status: (window as any).ApplePaySession.STATUS_FAILURE,
        };
        session.completePayment(result);
        this.openCommonPaymentErrorPopup();
        this.resetPaymentRequest();
      }
    };
    session.oncancel = () => {
      this.openCommonPaymentErrorPopup();
      this.resetPaymentRequest();
    };
    session.begin();
  }
  // apple pay implemetaion- end

  resetPaymentRequest() {
    if (!this.paymentRequest) {
      this.paymentRequest = new PaymentPageRequest();
      this.paymentRequest.CustomerKey = this.customerKey;
      this.paymentRequest.Email = this.customerEmail;
      this.paymentRequest.FirstName = localStorage.getItem(
        this.localStorageKeyEnum.firstName
      );
      this.paymentRequest.LastName = localStorage.getItem(
        this.localStorageKeyEnum.lastNameText
      );
    }
    this.paymentRequest.PaymentMethod =
      this.enhancedPaymentMethodEnum.Nets_Online;
    this.selectedCardOption = this.enhancedPaymentMethodEnum.oldPaymentCard;
  }

  handleKeyup($event, radio: MatRadioButton) {
    if ($event.keyCode === 32) {
      // spacebar
      radio.checked = true;
    }
  }

  showPaymentWarning(isCard, card: EnhancedPaymentCard) {
    try {
      if (isCard) {
        this.showWarning = true;
        if (card != undefined) {
          this.selectedCard = card;
          this.selectedCardNumber = this.selectedCard.CardNumber;
          this.selectedCardOption = this.enhancedPaymentMethodEnum.oldPaymentCard;
        } else {
          this.selectedCardNumber = null;
          this.selectedCardOption = this.enhancedPaymentMethodEnum.newPaymentCard;
        }
      } else {
        this.showWarning = false;
        this.selectedCardNumber = null;
        this.selectedCardOption = this.enhancedPaymentMethodEnum.payPal;
      }
    } catch (error) { console.log(error); }
  }

  selectVoucher(index) {
    try {
      if (!this.Checked[index]) {
        this.selectedVouchers.push(this.voucherDetails[index]);
        this.Checked[index] = true;
      } else {
        this.selectedVouchers = this.selectedVouchers.filter(
          (obj) => obj !== this.voucherDetails[index]
        );
        this.Checked[index] = false;
      }
      this.payPalTotalPrice = +this.totalPrice;
      this.applePayTotalPrice = +this.totalPrice;
      let totalVoucherPrice = 0;
      if (this.selectedVouchers.length > 0) {
        this.selectedVouchers.forEach((selectedVouchers) => {
          totalVoucherPrice = +(totalVoucherPrice + selectedVouchers.Price);
        });
      }
      this.selectedVoucherPrice = totalVoucherPrice;
      const appliedVoucherPrice = Math.min(+this.totalPrice, this.selectedVoucherPrice);
      
      this.payPalTotalPrice = +(this.payPalTotalPrice - appliedVoucherPrice);
      this.applePayTotalPrice = +(this.applePayTotalPrice - appliedVoucherPrice);
      if (this.sharedService.fareBreakdownModelData?.length) {
      this.sharedService.fareBreakdownModelData[0].EvoucherPrice = appliedVoucherPrice;
      }

      setTimeout(() => {
        this.paypalMessage();
      }, 100);
    } catch (error) { console.log(error); }
  }

  paypalMessage() {
    paypal
      .Messages({
        amount: this.payPalTotalPrice,
        placement: "payment",
        style: {
          layout: "text",
          logo: { type: "inline" },
        },
      })
      .render("#pp-pay-later-message");
  }

  // paypal messaging code
  public loadPaypalPaymentScript(url: string) {
    const body = <HTMLDivElement>document.body;
    const script = document.createElement("script");
    script.onload = () => {
      this.paypalMessage();
    };
    script.src = url;
    body.appendChild(script);
  }

  public loadApplePayAPIScript(url: string) {
    const head = <HTMLDivElement>document.head;
    const script = document.createElement("script");
    script.src = url;
    head.appendChild(script);
  }

  changeReplaceFunction() {
    let data = localStorage.getItem("ChangeReplace");
    this.changeReplaceResponse = JSON.parse(data);
    this.paymentDetailsResponse =
      this.changeReplaceResponse.PaymentDetailResponse;
    this.totalPrice = this.changeReplaceResponse.AdminFee.Amount.toString();
    this.payPalTotalPrice = +this.totalPrice;
    this.applePayTotalPrice = +this.totalPrice;
    this.bindPaymentResponse();
    this.paymentRequest.EvaluateCache =
      this.changeReplaceResponse.EvaluateCache;
    this.bindFarebreakupChangeReplace();
  }

  doesSeasonDetailExist() {
    if (
      this.sharedService.enhancedReviewBuyResponse?.Journey[0]?.SeasonDeatil !=
        null &&
      this.sharedService.enhancedReviewBuyResponse?.Journey[0]?.SeasonDeatil !=
        undefined
    ) {
      this.isSeason = true;
      this.isCoj = false;
      this.isUpgradeChange = false;
    } else {
      this.isSeason = false;
    }
  }

  bindFarebreakupChangeReplace() {
    this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.sharedService.fareBreakDownTotalDiscount = 0;
    let fareBreakdownModel = new FareBreakdownModel();
    fareBreakdownModel.OutWardJourney = new Array<JourneyModel>();
    let outJourney = new JourneyModel();
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

  onPaypalPayment() {
    this.selectedCardOption = this.enhancedPaymentMethodEnum.payPal;
    this.selectedCardNumber = null;
  }

  onPaymentModeChange(event: any) {
    let selectedValue = event.value;
    if (selectedValue === this.enhancedPaymentMethodEnum.newPaymentCard) {
      this.showPaymentWarning(true, undefined);
      this.selectedCardNumber = null;
    } else if (selectedValue === this.enhancedPaymentMethodEnum.payPal) {
      this.onPaypalPayment();
    }
  }

  DefaultSelected(event) {
    this.defaultVal = event.checked;
  }

  private focusFirstRequiredField() {
    let priority = ['postCode', 'address1', 'city', 'country'];

    for (let field of priority) {
      let control = this.addressForm.get(field);
      if (control && control.invalid) {
        let el = document.getElementById(field);
        if (el) {
          el.focus();
        }
        break;
      }
    }
  }

  onAddressCreated() {
    

    try {
      this.addressForm.markAllAsTouched();
      this.addressList.forEach((x) => {
        const elementValue = (document.getElementById(x) as HTMLInputElement)
          .value;
        const ctrlValue = this.addressForm.controls[x];
        ctrlValue.setValue(elementValue);
      });
      for (const key of Object.keys(this.addressForm.controls)) {
        if (this.addressForm.controls[key].invalid) {
          const invalidControl = this.el.nativeElement.querySelector(
            '[formcontrolname="' + key + '"]'
          );
          invalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          invalidControl.focus();
          const describedBy = invalidControl.getAttribute('aria-describedby');
          if (describedBy) {
            const errorElement = document.getElementById(describedBy);
            if (errorElement) {
              errorElement.setAttribute('role', 'alert');
            }
          }
          this.focusFirstRequiredField();
          return false;
        }
      }
      if (this.addressForm.valid) {
        this.address = new CustomerAddress();
        this.address.Address = new Address();
        this.address.Address.Address1 = this.addressForm.get("address1").value;
        this.address.Address.Address2 = this.addressForm.get("address2").value;
        this.address.Address.Address3 = this.addressForm.get("address3").value;
        this.address.Address.PostCode = this.addressForm.get("postCode").value;
        this.address.Address.City = this.addressForm.get("city").value;
        this.address.Address.Country = this.addressForm.get("country").value;
        if (this.defaultVal) {
          this.address.IsDefault = true;
        }
        this.createdAddressFormData();

        this.showAddAdress = true;
        this.customerInfoUpdateModel.Email = localStorage.getItem("Email");
        this.customerInfoUpdateModel.Addresses = this.billingAddresses;
        this.sendModifyAddress();
      }
    } catch (error) { console.log(error); }
  }

  createdAddressFormData() {
    if (this.isAddAddress) {
      if (this.billingAddresses == null) {
        this.billingAddresses = new Array<CustomerAddress>();
      }
      this.address.AddressType =
        "Address" + " " + (this.billingAddresses.length + 1).toString();

      if (this.defaultVal) {
        this.billingAddresses.forEach((address) => (address.IsDefault = false));
        this.address.IsDefault = true;
      }

      let obj = Object.assign({}, this.address);
      this.billingAddresses.push(obj);

      this.isAddAddress = false;
      this.isAddressShow = false;
      this.isAdd = true;
    } else {
      if (this.defaultVal)
        this.billingAddresses.forEach((address) => (address.IsDefault = false));

      this.address.Address.CountryCode =
        this.editableAddress.Address.CountryCode;
      this.address.AddressType = this.editableAddress.AddressType;
      this.billingAddresses[this.editIndex].Address.Address1 =
        this.address.Address.Address1;
      this.billingAddresses[this.editIndex].Address.Address2 =
        this.address.Address.Address2;
      this.billingAddresses[this.editIndex].Address.Address3 =
        this.address.Address.Address3;
      this.billingAddresses[this.editIndex].Address.PostCode =
        this.address.Address.PostCode;
      this.billingAddresses[this.editIndex].Address.City =
        this.address.Address.City;
      this.billingAddresses[this.editIndex].Address.Country =
        this.address.Address.Country;
      this.billingAddresses[this.editIndex].IsDefault = this.address.IsDefault;
      this.selectedAddressIndex = this.address.IsDefault;
      this.isAddressShow = false;
    }
  }

  editAddress(index) {
    this.defaultVal = false;
    this.editableAddress = this.billingAddresses[index];
    this.editIndex = index;
    this.isAddressShow = true;
    this.isAddAddress = false;
    this.showAddAdress = false;
    if (this.editableAddress?.IsDefault) {
      this.defaultVal = true;
    }
    setTimeout(() => {
      document
        .querySelector("#addressForm2")
        .scrollIntoView({ block: "center" });
    }, 0);
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
        country: this.editableAddress.Address.Country,
      });
    } else {
      this.addressForm.markAsUntouched();
      this.addressForm.patchValue({
        address1: null,
        address2: null,
        address3: null,
        city: null,
        postCode: null,
        country: null,
      });
    }
  }

  onSelectAddress(index) {
    if (index == null || index < 0 || index >= this.billingAddresses.length) {
       return;
    }
    this.selectedAddressIndex = index;
    this.paymentRequest.BillingAddress = this.billingAddresses[index].Address;
    this.tempPaymentAddress = this.paymentRequest.BillingAddress;
  }

  cancelEdit() {
    this.editIndex = null;
    this.isAddAddress = false;
    this.isAddressShow = false;
    this.selectedAddressIndex = this.billingAddresses.findIndex(addr => addr?.IsDefault) ?? 0;
  }

  addNewAddress() {
    this.isAddAddress = true;
    this.editIndex = null;
    this.isAddressShow = true;
    this.defaultVal = false;
    this.initializeAddress(this.isAddAddress);
  }

  onDeleteAddresss(_index) {
    try {
      if (this.billingAddresses.length == 1) {
      this.dialog.open(EnhancedCommonErrorPopupComponent, {
        disableClose: true,
        panelClass: [
          this.enhancedDynamicClassesNameEnum
            ?.enhancedFooterAlertCommonPanelClass,
          this.enhancedDynamicClassesNameEnum
            ?.enhancedRailcardNotAppliedPanelClass,
        ],
        width: "45rem",
        autoFocus: false,
        data: {
          Message: this.enhancedPaymentPageMessageEnum?.deleteOneAddressMessage,
          headerTitle:
            this.enhancedPaymentPageMessageEnum?.deleteOneAddressTitle,
        },
      });
        return;
      }

      let deleteAddressTitle = `${
        this.enhancedPaymentPageMessageEnum.deleteAddressTxt
      } ${_index + 1}`;

      let dialogRef = this.dialog.open(
        EnhancedCommonConfirmationDialogComponent,
        {
          width: "45rem",
          autoFocus: false,
          disableClose: true,
          panelClass: [
            this.enhancedDynamicClassesNameEnum
              ?.enhancedFooterAlertCommonPanelClass,
            this.enhancedDynamicClassesNameEnum
              ?.enhancedRailcardNotAppliedPanelClass,
          ],
          data: {
            headerTitle: deleteAddressTitle,
            isDeleteAddress: true,
          },
        }
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          let temp;
          for (
            let i = this.editIndex;
            i < this.billingAddresses.length - 1;
            i++
          ) {
            temp = this.storedAddress[i].AddressType;
            this.billingAddresses[i + 1].AddressType = temp;
          }
          if (this.billingAddresses.length > 1) {
            if (
              this.paymentRequest.BillingAddress ===
              this.billingAddresses[this.editIndex].Address
            ) {
              this.paymentRequest.BillingAddress = null;
            }
            this.billingAddresses.splice(this.editIndex, 1);
          } else {
            this.billingAddresses.splice(this.editIndex, 1);
            this.paymentRequest.BillingAddress = null;
          }
          this.isDelete = true;
          this.customerInfoUpdateModel.Email = localStorage.getItem(
            this.localStorageKeyEnum.email
          );
          this.customerInfoUpdateModel.Addresses = this.billingAddresses;
          this.sendModifyAddress(deleteAddressTitle);
        } else {
          return false;
        }
      });
    } catch (error) { console.log(error); }
  }

  sendModifyAddress(addressTitle?) {
    try {
      this.isUpadateInJourney = true;
      this.enhancedPaymentApiDataService
        .enhancedModifyAddress(this.customerInfoUpdateModel)
        .subscribe((res) => {
          if (res != null) {
            this.isUpadateInJourney = false;
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == "200") {
              if (this.responseData.Data) {
                this.setModifiedAddressData();
              } else {
                this.billingAddresses = JSON.parse(
                  JSON.stringify(this.storedAddress)
                );
                this.paymentRequest.BillingAddress = this.tempPaymentAddress;
                if (addressTitle) {
                  this.addressErrorMsg = `Sorry, we couldn't delete ${addressTitle}. ${this.enhancedPaymentPageMessageEnum.deleteCardErrorMsg}`;
                } else {
                  this.addressErrorMsg = `${this.enhancedPaymentPageMessageEnum.updateAddressFailureMsg}`;
                }
                setTimeout(() => {
                  this.addressErrorMsg = null;
                }, 10000);
              }
            } else {
              this.billingAddresses = this.storedAddress.slice(0);
              this.billingAddresses = JSON.parse(
                JSON.stringify(this.storedAddress)
              );
              this.paymentRequest.BillingAddress = this.tempPaymentAddress;
              this.addressErrorMsg = this.responseData?.ResponseMessage;
                setTimeout(() => {
                    this.addressErrorMsg = null;
                }, 10000);
            }
            this.isAdd = false;
            this.isDelete = false;
          } else {
            this.isUpadateInJourney = false;
          }
        });
    } catch (error) {
       this.isUpadateInJourney = false;
      }
  }

  setModifiedAddressData() {
    try {
      this.showCommonToast = false;
      this.updatedAddressIndex = null;
      this.toastMessage = null;
      if (this.isDelete) {
        this.toastMessage = `${this.enhancedPaymentPageMessageEnum.addressTxt} ${
          this.editIndex + 1
        } ${this.enhancedPaymentPageMessageEnum.addressDeletedSuccessfully}`;
        this.showCommonToast = true;
      } else if (this.isAdd) {
        this.toastMessage = `${this.enhancedPaymentPageMessageEnum.addressAddedSuccessfully}`;
        this.showCommonToast = true;
      } else {
        this.updatedAddressIndex = this.editIndex;
        this.toastMessage = `${this.enhancedPaymentPageMessageEnum.addressTxt} ${
          this.editIndex + 1
        } ${this.enhancedPaymentPageMessageEnum.addressUpdatedSuccessfully}`;
        this.showCommonToast = false;
      }
      this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
      this.billingAddresses = JSON.parse(JSON.stringify(this.storedAddress));
      if (!this.isDefaultAvailable(this.billingAddresses)) {
       this.billingAddresses[0].IsDefault = true;
      }
      this.commonServices.updateUserAddressesInLocalStorage(this.billingAddresses);

      this.paymentDetailsResponse.BillingAddress.Addresses = [...this.billingAddresses];

      localStorage.setItem(this.localStorageKeyEnum.paymentData, JSON.stringify({...this.paymentDetailsResponse}));
      this.onClose();
      this.formClose();
      this.getPaymentdetails(this.paymentDetailsRequest, false);
      this.commonServices.cacheSharedData();

      if (this.toastMessage) {
        setTimeout(() => {
          this.updatedAddressIndex = null;
          this.toastMessage = null;
          this.showCommonToast = false;
        }, 10000);
      }
    } catch (error) { console.log(error); }
  }

  onClose() {
    this.isAddressShow = false;
    this.isAddAddress = false;
    this.showAddAdress = true;
  }

  formClose() {
    this.addressForm.reset();
  }

  isCardExpired(cardExpiry: string) {
    try{
      if (!cardExpiry) return false;

      let [month, year] = cardExpiry.split(",").map(Number);
      let now = new Date();
      let currentMonth = now.getMonth() + 1;
      let currentYear = now.getFullYear();
      if (year < currentYear) return true;
      if (year === currentYear && month < currentMonth) return true;
      return false;
    } catch (error) { console.log(error); }
  }

  deleteCard(card: EnhancedPaymentCard) {
    try {
      this.isUpadateInJourney = true;
      let filteredCards: any[] = [];
      let lastFourDigits = card.CardNumber?.slice(-4);
      let dialogRef = this.dialog.open(
        EnhancedCommonConfirmationDialogComponent,
        {
          width: "45rem",
          autoFocus: false,
          disableClose: true,
          panelClass: [
            this.enhancedDynamicClassesNameEnum
              ?.enhancedFooterAlertCommonPanelClass,
            this.enhancedDynamicClassesNameEnum
              ?.enhancedRailcardNotAppliedPanelClass,
          ],
          data: {
            headerTitle: `${this.enhancedPaymentPageMessageEnum.deleteCardTxt} ${lastFourDigits}`,
            isDeleteCard: true,
          },
        }
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          let index = this.paymentCards.indexOf(card);
          let updatePaymentCards = new EnhancedUpdatePaymentCardsDto();
          updatePaymentCards.CustomerKey = localStorage.getItem(
            this.localStorageKeyEnum.customerKey
          );
          this.paymentCards.forEach((paymentCard) => {
            if (paymentCard !== card) {
              filteredCards.push({
                BillingAgreementId: paymentCard?.BillingAgreementId,
                BusinessCard: paymentCard?.BusinessCard,
                CardType: paymentCard?.CardTypeNumber,
                ExpirationMonth: paymentCard?.ExpirationMonth,
                ExpirationMonthSpecified: paymentCard?.ExpirationMonthSpecified,
                ExpirationYear: paymentCard?.ExpirationYear,
                ExpirationYearSpecified: paymentCard?.ExpirationYearSpecified,
                maskedPan: paymentCard?.CardNumber,
                Par: paymentCard?.Par || null,
                TraceChainId: paymentCard?.TraceChainId || null,
                TranslatedFundingPan: paymentCard?.TranslatedFundingPan || null,
              });
            }
          });
          updatePaymentCards.PaymentCards = filteredCards;
          this.enhancedPaymentApiDataService
            .EnhancedUpdatePaymentCards(updatePaymentCards)
            .subscribe((res) => {
              if (res != null) {
                this.isUpadateInJourney = false;
                this.responseData = res as ResponseData;
                let cardType = card.CardType?.charAt(0).toUpperCase() + card.CardType?.slice(1).toLowerCase();
                if (this.responseData.ResponseCode == "200") {
                  let status = this.responseData.Data;
                  this.deleteCardMsg(index, status, card, lastFourDigits, cardType);
                } else {
                  this.savedCardToastMsgInCaseOfError(cardType, lastFourDigits);
                  this.showSavedCardToast = true;
                  setTimeout(() => {
                    this.showSavedCardToast = false;
                    this.savedCardToastMessage = "";
                  }, 10000);
                  console.log(this.responseData.ResponseMessage);
                }
              }
            });
        } else {
          this.isUpadateInJourney = false;
          return false;
        }
      });
    } catch (error) { console.log(error); }
  }

  deleteCardMsg(i: number, status: boolean, card: EnhancedPaymentCard, last4, cardType) {
    try {
      let expiry = card.CardExpiryWithMonthName;
      let getExpireTxt = this.isCardExpired(card?.CardExpiry) ? `${this.enhancedPaymentPageMessageEnum.expired}`.toLowerCase() : `${this.enhancedPaymentPageMessageEnum.expires}`.toLowerCase();
      if (status) {
        this.paymentCards.splice(i, 1);
         // Get existing data from localStorage
         let existingPaymentDataStr = JSON.parse(localStorage.getItem(this.localStorageKeyEnum.paymentData));
         existingPaymentDataStr.PaymentCards = this.paymentCards;
         localStorage.setItem(this.localStorageKeyEnum.paymentData, JSON.stringify(existingPaymentDataStr));

        this.savedCardToastMessage = `${cardType} ending ${last4} (${getExpireTxt} on ${expiry}) removed.`;
        this.isSuccess = true;
      } else {
        this.savedCardToastMsgInCaseOfError(cardType, last4);
      }
      this.showSavedCardToast = true;
      setTimeout(() => {
        this.showSavedCardToast = false;
        this.savedCardToastMessage = "";
      }, 10000);
    } catch (error) { console.log(error); }
  }

  onPayNow() {
    try {
      if (!this.onSubmitPaymentStep1() && this.onSubmitPaymentStep1() !== undefined) {
        return false;
      }
      if (this.selectedCardOption == "payPal") {
        this.paymentRequest.PaymentMethod = this.nativePaymentMethodEnum.netsPaypal;
      }
      //For google pay, adding payment method in payment request
      if (this.selectedCardOption == this.nativePaymentMethodEnum.netsGooglePay) {
        this.paymentRequest.PaymentMethod = this.nativePaymentMethodEnum.netsGooglePay;
      }
      //For apple pay, adding token and payment method in payment request
      if (this.selectedCardOption == this.nativePaymentMethodEnum.netsApplePay) {
        this.paymentRequest.PaymentMethod = this.nativePaymentMethodEnum.netsApplePay;
        this.paymentRequest.AuthToken = this.AuthToken;
      }
      this.paymentRequest.UserName = localStorage.getItem("UserName");
      let isChangeReplace = JSON.parse(localStorage.getItem("isChangeReplace"));
      let isCOJChange = this.isCoj;
      this.ga4dataLayerService.loadGALayerForAddPaymentInfo(this.sharedService.enhancedReviewBuyResponse, this.paymentRequest.PaymentMethod,this.selectedVouchers.length > 0, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue, true, this.totalPrice);
      this.paymentRequest.IsPostSale = this.checkPostSaleValue(this.sharedService) ? true : false;
      if (isChangeReplace) {
        this.smartCardPaymentInitiate(this.paymentRequest);
      }
      else if (isCOJChange || (this.isUpgradeChange === true)) {
        // call api postsale controller ProcessCojOrder with IsCOJ parameter true
        this.commonServices.loaderRequired = true;
        this.paymentRequest.IsCOJ = true;
        this.paymentRequest.IsRenewSeason = false;
        this.paymentRequest.EvaluateCache = this.sharedService.reviewBuyResponse.COJData.COJEvaluateCache;
        this.paymentInitiatedForPostSaleData();
      }
      else {
        this.paymentInitiate(this.paymentRequest);
      }
    } catch (error) { console.log(error); }
  }

  onSubmitPaymentStep1() {
    try {
      this.paymentRequest.ReviewBuyCache =
        this.paymentDetailsResponse.ReviewBuyCache;
      if (
        (this.selectedVouchers == null || this.selectedVouchers.length == 0) &&
        (this.selectedCardOption == "" || this.selectedCardOption == null)
      ) {
        this.notificationService.warn(
          "Please select at least one payment method."
        );
        return false;
      }

      if (this.selectedVouchers.length != 0) {
        this.paymentRequest.Vouchers = this.selectedVouchers.map(
          ({ VoucherId, FraudCode, Price, Currency }) => ({
            VoucherId,
            FraudCode,
            Amount: Price,
            Currency,
          })
        );
      } else {
        this.paymentRequest.Vouchers = new Array<Voucher>();
      }
      if (
        this.billingAddresses == null ||
        this.billingAddresses.length == 0 ||
        this.paymentRequest.BillingAddress == null ||
        this.paymentRequest.BillingAddress.PostCode.trim() == ""
      ) {
        this.addressErrorMsg = `${this.enhancedPaymentPageMessageEnum.paymentInValidAddressMessage}`;
        setTimeout(() => {
          this.addressErrorMsg = null;
        }, 10000);
        return false;
      }
      if (this.selectedCardOption == "oldPaymentCard") {
        this.paymentRequest.BillingAgreementId =
          this.selectedCard.BillingAgreementId;
      }
      this.paymentRequest.SaveCard = this.isAddNewCard.value;
      if (
        this.sharedService.enhancedReviewBuyResponse != undefined &&
        this.sharedService.enhancedReviewBuyResponse != null
      ) {
        this.paymentRequest.IsRenewSeason =
          this.sharedService.enhancedReviewBuyResponse.IsRenewSmartcard !=
          undefined;
      }
    } catch (error) { console.log(error); }
  }

  paymentInitiate(paymentRequest: PaymentPageRequest) {
    try {
      this.commonServices.loaderRequired = true;
      this.enhancedPaymentApiDataService
        .enhancedInitiatePayment(paymentRequest)
        .subscribe((res) => {
          if (res != null) {
            this.enhancedPaymentResponseData = res as ResponseData;
            if (this.enhancedPaymentResponseData.ResponseCode == "200") {
              this.enhancedPaymentResponse =
                this.enhancedPaymentResponseData.Data;
              if (this.checkPostSaleValue(this.sharedService)) {
                this.sharedService.postSaleReviewBuyCache =
                  this.enhancedPaymentResponse?.ReviewBuyCache;
              } else {
                this.sharedService.reviewBuyCache =
                  this.enhancedPaymentResponse?.ReviewBuyCache;
              }
              this.sharedService.enhancedReviewBuyResponse.ReviewBuyCache =
                this.enhancedPaymentResponse?.ReviewBuyCache;
              //Set shared cache data
              this.sharedService.setSharedCache();
              this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
              this.storageDataService.setStorageData(
                this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling,
                this.sharedServiceCache,
                true
              );
              //Set shared cache data

              if (this.enhancedPaymentResponse?.IsBasketJourneyValid) {
                localStorage.setItem(
                  this.localStorageKeyEnum.prepareOrderId,
                  String(this.enhancedPaymentResponse?.OrderId)
                );
                this.redirectToNets();
              } else {
                localStorage.setItem("JourneyValidforPayemnt", "true");
                this.timeoutpopup();
                this.spinnerService.hide();
                this.commonServices.loaderRequired = false;
              }
            } else {
              console.log(this.enhancedPaymentResponseData?.ResponseMessage);
              this.commonServices.showEnhancedCommonErrorPopup();
            }
          }
        });
    } catch (error) { console.log(error); }
  }

  redirectToNets() {
    if (this.enhancedPaymentResponse.AuthorizationUrl) {
      window.location.href = this.enhancedPaymentResponse.AuthorizationUrl;
    } else {
      if (this.isAddNewCard.value) {
        this.router.navigate([`./` + this.appRouteEnum.ValidateEnrollmentDo]);
      } else {
        this.router.navigate([`./` + this.enhancedAppRouteEnum.enhancedValidatePaymentDo]);
      }
    }
  }

  timeoutpopup() {
    try {
      let dialogRef = this.dialog.open(EnhancedCommonErrorPopupComponent, {
        disableClose: true,
        panelClass: [
          this.enhancedDynamicClassesNameEnum
            ?.enhancedFooterAlertCommonPanelClass,
          this.enhancedDynamicClassesNameEnum
            ?.enhancedRailcardNotAppliedPanelClass,
        ],
        width: "45rem",
        autoFocus: false,
        data: {
          Message: this.enhancedPaymentResponse?.BasketJourneyMessage,
          headerTitle: "Timeout",
        },
      });
      dialogRef.afterClosed().subscribe(() => {
        if (
          (!this.isCoj || this.isCoj === null || this.isCoj === undefined) &&
          (!this.isUpgradeChange ||
            this.isUpgradeChange === null ||
            this.isUpgradeChange === undefined)
        ) {
          if (this.commonServices.doesDeliveryPageSkipped()) {
            this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
          } else {
            this.router.navigate([
              `./` + this.enhancedAppRouteEnum.deliveryAndReviewBy,
            ]);
          }
        }
      });
    } catch (error) { console.log(error); }
  }

  ngOnDestroy() {
    if (
      this.router.getCurrentNavigation().trigger == "popstate" &&
      this.router.url.includes(this.appRouteEnum.ValidatePaymentDo)
    ) {
      localStorage.setItem(
        this.localStorageKeyEnum.isReturnFromPaymentOrBasket,
        "true"
      );
      if (this.isCoj || this.isUpgradeChange) {
        this.router.navigateByUrl("/" + this.appRouteEnum.CojReviewBuy);
      } else {
        if (this.commonServices.doesDeliveryPageSkipped()) {
          this.router.navigateByUrl(
            "/" + this.appRouteEnum.deliveryAndReviewbuy
          );
        } else {
          this.router.navigateByUrl(
            "/" + this.enhancedAppRouteEnum?.deliveryAndReviewBy
          );
        }
      }
    } else if (
      (this.router.getCurrentNavigation().trigger == "popstate" &&
        this.router.url.includes(
          this.enhancedAppRouteEnum?.deliveryAndReviewBy
        )) ||
      this.router.url.includes(this.appRouteEnum.deliveryAndReviewbuy)
    ) {
      localStorage.setItem(
        this.localStorageKeyEnum.isReturnFromPaymentOrBasket,
        "true"
      );
      this.enhancedPaymentApiDataService.clearData();
    }
    this.postCodeValueChangeSubscription.unsubscribe();
  }

  getPaymentModeAriaLabel(paymentMode: string, isSelected: boolean): string {
    try {
      if (paymentMode === this.enhancedPaymentMethodEnum.newPaymentCard) {
        return `${this.enhancedPaymentPageMessageEnum.selectedNewCardAriaLabel}`;
      }
      if (paymentMode === this.enhancedPaymentMethodEnum.payPal) {
        return `${this.enhancedPaymentPageMessageEnum.paypalPaymentModeText} ${this.sharedService.currencySymbol("")}${this.payPalTotalPrice} ${this.enhancedPaymentPageMessageEnum.paypalExternalLinkText}`;
      }
      return "";
    } catch (error) { console.log(error); }
  }

  getSaveCheckboxAriaLabel() {
    try {
      return `${this.enhancedPaymentPageMessageEnum?.savedCardCheckboxChecked}`;
    } catch (error) { console.log(error); }
  }

  goBackToEnhanceReviewBuy() {
    this.router.navigate([
      `./` + this.enhancedAppRouteEnum.deliveryAndReviewBy,
    ]);
  }

  getCardAriaLabel(card: any): string {
    try {
      if (!card) return "";

      let cardType = card?.CardType[0] + card?.CardType.slice(1).toLowerCase(); // First letter capital
      let lastFour = card?.CardNumber?.slice(-4); // last 4 digits
      let expiry = card?.CardExpiryWithMonthName;
      let getExpireTxt = this.isCardExpired(card?.CardExpiry)
        ? `${this.enhancedPaymentPageMessageEnum.expired}`
        : `${this.enhancedPaymentPageMessageEnum.expires}`;
      return `${cardType} ending ${lastFour}, ${getExpireTxt} on ${expiry}`;
    } catch (error) { console.log(error); }
  }

  getDeleteCardAriaLabel(card: any): string {
    try {
      if (!card) return "";

      let cardType = card?.CardType[0] + card?.CardType.slice(1).toLowerCase(); // First letter capital
      let lastFour = card?.CardNumber?.slice(-4); // last 4 digits
      let expiry = card?.CardExpiryWithMonthName;
      let getExpireTxt = this.isCardExpired(card?.CardExpiry)
        ? `${this.enhancedPaymentPageMessageEnum.expired}`
        : `${this.enhancedPaymentPageMessageEnum.expires}`;
      return `Delete ${cardType} ending ${lastFour}, ${getExpireTxt} on ${expiry}`;
    } catch (error) { console.log(error); }
  }

  getVoucherAriaLabel(voucher: any, index: number): string {
    try {
      if (!voucher) return "";

      let voucherName = `${this.enhancedPaymentPageMessageEnum.eVoucher} ${index + 1}`;
      let price = this.sharedService.formatPrice(voucher?.Price);
      let fraudCode = voucher?.FraudCode ? ` ${voucher?.FraudCode}` : "";
      let expiry = voucher?.ExpiryDate;
      let isChecked = this.Checked[index];
      let status = isChecked ? this.enhancedPaymentPageMessageEnum.selected.toLowerCase() : this.enhancedPaymentPageMessageEnum.notSelected.toLowerCase();

      return `${voucherName}, ${this.sharedService.currencySymbol("")}${price}, ${voucher?.VoucherId}${fraudCode}.Valid until ${expiry}`;
    } catch (error) { console.log(error); }
  }

  getAddressAriaLabel(field: string, placeholder: string): string {
    try {
      let control = this.addressForm.get(field);
      let label = this.fieldLabels[field] || field;
      if (label.toLowerCase() === this.enhancedPaymentPageMessageEnum.cityTownText) {
        label = this.enhancedPaymentPageMessageEnum.cityOrTownText;
      }
      let isRequired = control?.hasValidator(Validators.required)
        ? ", required"
        : "not required";

      if (control?.value && control?.value?.length > 0) {
        return `${label}, Edit text ${isRequired}, ${control?.value}`;
      }
      // Default aria-label
      return `${label}, Edit text${isRequired}, ${placeholder}`;
    } catch (error) { console.log(error); }
  }

  getSavedAddressAriaLabel(address: any, index: number): string {
    try {
      if (!address || !address?.Address) return "";

      let addr = address?.Address;
      let parts = [
        address?.AddressType,
        addr?.Address1,
        addr?.Address2,
        addr?.Address3,
        addr?.PostCode,
        addr?.City,
        addr?.Country,
        addr?.CountryCode,
      ].filter(Boolean);

      let selectedState = this.selectedAddressIndex === index ? `${this.enhancedPaymentPageMessageEnum.selected}` : `${this.enhancedPaymentPageMessageEnum.notSelected}`;

      return `Radio button, ${selectedState}, ${parts.join(', ')}`;
    } catch (error) { console.log(error); }
  }

  isDefaultAvailable(addressarray): boolean {
    for(let address of addressarray){
      if (address.IsDefault) return true;
    }
    return false;
  }

  private checkBillingAddressForNativePay(paymentMethod: string): boolean {
  if (
    (paymentMethod === this.nativePaymentMethodEnum.netsGooglePay ||
      paymentMethod === this.nativePaymentMethodEnum.netsApplePay) &&
    (!this.billingAddresses || this.billingAddresses.length === 0)
  ) {
    this.dialog.open(EnhancedCommonErrorPopupComponent, {
      disableClose: true,
      panelClass: [
        this.enhancedDynamicClassesNameEnum?.enhancedFooterAlertCommonPanelClass,
        this.enhancedDynamicClassesNameEnum?.enhancedRailcardNotAppliedPanelClass,
      ],
      width: "45rem",
      autoFocus: false,
      data: {
        Message: `${this.enhancedPaymentPageMessageEnum.selectPaymentModeWithoutAddress}`,
        headerTitle: `${this.enhancedPaymentPageMessageEnum?.addBillingAddress}`,
      },
    });
    return false;
  }
  return true;
}

    isPayNowDisabled(): boolean {
     try{
        // 1. Check if there is at least one billing address selected/available
        let isAddressSelected = this.billingAddresses && this.billingAddresses.length > 0;
        // 2. Define which payment methods are considered valid for enabling "Pay Now"
        let validPaymentMethods = [
            this.enhancedPaymentMethodEnum.newPaymentCard,
            this.enhancedPaymentMethodEnum.payPal,
        ];
        // 3. Check if a valid payment method is selected OR if a saved card is selected (via card number)
        let isPaymentSelected = validPaymentMethods.includes(this.selectedCardOption) || !!this.selectedCardNumber;

        // 4. Check if any voucher is selected
        let isVoucherSelected = this.selectedVouchers && this.selectedVouchers.length > 0;

        let totalPrice = Number(this.totalPrice) || 0; // journey total price
        let totalVoucherPrice = Number(this.selectedVoucherPrice) || 0; // selected voucher total value

       // 5 If address is not selected → Disable
       if (!isAddressSelected) return true;

       // 6 If no payment method and no voucher selected → Disable
       if (!isPaymentSelected && !isVoucherSelected) return true;

       // 7 If only voucher is selected
      if (isVoucherSelected && !isPaymentSelected) {
        // If voucher covers or exceeds total price → Enable
        if (totalVoucherPrice >= totalPrice) {
          return false;
        }
        // If voucher is partial → Disable
        return true;
      }
       // 8 If payment method selected → Enable
       return false;
      } catch (error) { console.log(error); }
    }

    trimSpacesFromPostCodeFormControl(){
        this.postCodeValueChangeSubscription = this.addressForm.controls['postCode'].valueChanges
        .subscribe(x=>{
          if(x && x.includes(' ')){
            this.addressForm.controls['postCode'].setValue(x.trim().replace(/\s/g, ""))
          }
        });
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

  openCommonPaymentErrorPopup() {
    this.dialog.open(EnhancedPaymentNotCompletedDialogComponent, {
      disableClose: true,
      panelClass: [
        this.enhancedDynamicClassesNameEnum?.enhancedLogoutPopup,
        this.enhancedDynamicClassesNameEnum?.enhancedLogoutStylePopup,
      ],
      width: '22.688rem',
      autoFocus: false,
      data: {
        Message: this.enhancedPaymentPageMessageEnum?.paymentErrorMessage,
        headerTitle: this.enhancedPaymentPageMessageEnum?.paymentErrorTitle,
      },
    });
  }

  setLocalStorageForSeasonJourney(){
    if (localStorage.getItem('IsSeason')) {
      localStorage.removeItem('IsSeason');
    }
    if (this.isSeason) {
      localStorage.setItem('IsSeason', 'true');
    }
  }

  smartCardPaymentInitiate(paymentRequest: PaymentPageRequest) {
    try {
    this.paymentService.initiatePaymentSmartCard(paymentRequest).subscribe(
      res => {
        if (res != null) {
          this.enhancedPaymentResponseData = res as ResponseData;
          if (this.enhancedPaymentResponseData.ResponseCode == '200') {
            this.enhancedPaymentResponse = this.enhancedPaymentResponseData.Data;
            this.setSharedServiceReviewBuyCacheForPostSalePaymentResponse();
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
            this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
            //Set shared cache data
            this.redirectToNets();
          }
          else {
            console.log(this.enhancedPaymentResponseData.ResponseMessage);
          }
        }
      });
      } catch (error) { console.log(error); }
  }

  setSharedServiceReviewBuyCacheForPostSalePaymentResponse() {
    if (this.checkPostSaleValue(this.sharedService)) {
      this.sharedService.postSaleReviewBuyCache = this.enhancedPaymentResponse.ReviewBuyCache;
    } else {
      this.sharedService.reviewBuyCache = this.enhancedPaymentResponse.ReviewBuyCache;
    }
  }

   paymentInitiatedForPostSaleData() {
    try {
    this.journeyExtraService.PaymentprocessOrder(this.paymentRequest).subscribe(res => {
      if (res != null) {
        this.enhancedPaymentResponseData = res as ResponseData;
        if (this.enhancedPaymentResponseData.ResponseCode == '200') {
          this.enhancedPaymentResponse = this.enhancedPaymentResponseData.Data.PaymentResponse;
          this.handleSuccessfulPaymentResponse();
        }
        else {
          console.log(this.enhancedPaymentResponseData.ResponseMessage);
        }
      }
    });
    } catch (error) { console.log(error); }
  }
  getRadioTabIndex(index: number): number {
    try {
      // If a card is selected → only selected card gets focusable (tabindex=0)
      if (this.selectedCardNumber) {
        const selectedIndex =
          this.paymentDetailsResponse?.PaymentCards?.findIndex(
            (c) => c.CardNumber === this.selectedCardNumber
          );
        return index === selectedIndex ? 0 : -1;
      }

      // If no card selected → only first card focusable
      return index === 0 ? 0 : -1;
    } catch (error) { console.log(error); }
  }

  getDeleteTabIndex(index: number): number {
    try {
      // If a card is selected → only its delete button focusable
      if (this.selectedCardNumber) {
        const selectedIndex =
          this.paymentDetailsResponse?.PaymentCards?.findIndex(
            (c) => c.CardNumber === this.selectedCardNumber
          );
        return index === selectedIndex ? 0 : -1;
      }

      return index === 0 ? 0 : -1;
    } catch (error) { console.log(error); }
  } 

  ngAfterViewChecked() {
    const payPalContainer = document.getElementById(this.enhancedPaymentPageMessageEnum.payPalLaterMessageTxt);
    if (payPalContainer) {
      const iframe = payPalContainer.querySelector(this.enhancedPaymentPageMessageEnum.iframeTxt);
      if (iframe) {
        if (this.selectedCardOption === this.enhancedPaymentMethodEnum.payPal) {
          // Allow tabbing inside iframe only if PayPal selected
          iframe.removeAttribute(this.enhancedPaymentPageMessageEnum.tabindex);
          iframe.removeAttribute(this.enhancedPaymentPageMessageEnum.ariaHidden);
        } else {
          // Skip iframe when not selected
          iframe.setAttribute(this.enhancedPaymentPageMessageEnum.tabindex, '-1');
          iframe.setAttribute(this.enhancedPaymentPageMessageEnum.ariaHidden, 'true');
        }
      }
    }
  }

  savedCardToastMsgInCaseOfError(cardType, last4){
    this.savedCardToastMessage = `Sorry, we couldn't delete ${cardType} ending ${last4}. ${this.enhancedPaymentPageMessageEnum.deleteCardErrorMsg}`;
    this.isSuccess = false;
  }

  handleSuccessfulPaymentResponse(){
    this.setSharedServiceReviewBuyCacheForPostSalePaymentResponse();
    this.sharedService.reviewBuyResponse.ReviewBuyCache = this.enhancedPaymentResponse.ReviewBuyCache;
    if (this.isUpgradeChange === true) {
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
      this.storageDataService.setSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
      //Set shared cache data
    } else {
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
      this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
      //Set shared cache data
    }
    if (this.enhancedPaymentResponse.IsBasketJourneyValid) {
      localStorage.setItem(this.localStorageKeyEnum.prepareOrderId, String(this.enhancedPaymentResponse.OrderId));
      this.redirectToNets();
    }
    else {
      localStorage.setItem(this.localStorageKeyEnum.JourneyValidforPayment, 'true');
      this.timeoutpopup();
      this.spinnerService.hide();
      this.commonServices.loaderRequired = false;
    }
  }

  ngAfterViewInit(){
     setTimeout(() => {
      this.loadPaypalPaymentScript(
      environment.paypalMessageUrl +
        environment.paypalClientId +
        "&components=messages"
    );
  }, 2000);
  this.cd.detectChanges();
  }

}
