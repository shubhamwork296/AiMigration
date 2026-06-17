import { ChangeDetectorRef, Component, ElementRef, Injector, OnInit } from "@angular/core";
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import {
  CustomerAddress,
  Address,
} from "src/app/models/payment-details/billing-address-response.model";
import { CustomerInfoUpdate } from "src/app/models/customer/customer-address.model";
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { NotificationService } from "src/app/utility/toastr-notification/toastr-notification.service";
import { ResponseData } from "src/app/models/common/response.model";
import {
  CustomerDetailResponse,
  PersonalDetails,
  ModifyPersonalDetailRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CustomerRequest,
  ChangePersonalDetailsResponse,
} from "src/app/models/account/my-profile.model";
import { MyAccountService } from "src/app/services/my-account.service";
import { ConfirmModelComponent } from "./confirm-model/confirm-model.component";
import { StorageDataService } from "src/app/services/storage-data.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { browserRefresh } from "src/app/app-component/app.component";
import {
  MustMatch,
  NotMatch,
  checkMobileValidation,
  CheckForLetterPresence,
  CheckMonth,
  CheckYear,
  validateEmailRegex
} from "src/app/utility/custom-validations/must-match-validation";
import { MatDatepicker } from "@angular/material/datepicker";
import * as moment from "moment";
import { Moment } from "moment";
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from "@angular/material-moment-adapter";
import { CustomerLoginResponse } from "src/app/models/customer/customer-login-response.model";
import { ConfirmPopupComponent } from "../../review-and-buy/confirm-popup/confirm-popup.component";
import { DataLayerService } from "src/app/utility/dataLayers/data-layer.service";
import { ActivatedRoute, Router } from "@angular/router";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { CommonServices } from "src/app/services/common.service";
import { CustomerSendMailRequst } from "src/app/models/customer/customer-send-mail-request.model";
import { CustomerForgotPasswordResponse } from "src/app/models/customer/customer-reset-password-request.model";
import { AppRouteEnum, CommonIconImg, ForgotPasswordMsgEnum, LocalStorageKeyEnum, NotificationErrorMsg } from "src/app/utility/app-constants.service";
import { CustomerServiceService } from "src/app/services/customer-service.service";
import { ChangeEmailModalComponent } from "./change-email-modal/change-email-modal.component";
import { Subscription } from "rxjs";
declare var pca: any;
declare let seamless: any;

export const MY_FORMATS = {
  parse: {
    dateInput: "LL",
  },
  display: {
    dateInput: "LL",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
};

@Component({
  selector: "app-my-profile",
  templateUrl: "./my-profile.component.html",
  styleUrls: ["./my-profile.component.css"],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class MyProfileComponent implements OnInit {
  notificationService: NotificationService;
  myAccountService: MyAccountService;
  storageDataService: StorageDataService;
  sharedService: SharedService;
  dataLayerService: DataLayerService;
  route: ActivatedRoute;
  ga4dataLayerService: GA4DatalayerService;
  commonService: CommonServices;

  resetPswSection: boolean = false;
  customerSendMailRequst: CustomerSendMailRequst;
  isSubmitted: boolean = false;
  customerForgotPasswordResponse: CustomerForgotPasswordResponse;
  forgotPasswordMsgEnum: ForgotPasswordMsgEnum;
  customerServiceService: CustomerServiceService;
  appRouteEnum: AppRouteEnum;
  notificationErrorMsg: NotificationErrorMsg;
  commonIconImg: CommonIconImg;
  isOldPswCapsLock: number;
  isNewPswCapsLock: number;
  isConfrmPswCapsLock: number;
  postCodeValueChangeSubscription: Subscription;
  el: ElementRef;
  localStorageKeyEnum: LocalStorageKeyEnum;

  constructor(
    private readonly formbuilder: FormBuilder,
    private readonly injector: Injector,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly cd: ChangeDetectorRef
  ) {
    // Dependency Injection without using constructor's param
    this.notificationService = this.injector.get(NotificationService);
    this.myAccountService = this.injector.get(MyAccountService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedService = this.injector.get(SharedService);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.route = this.injector.get(ActivatedRoute);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.commonService = this.injector.get(CommonServices);
    this.forgotPasswordMsgEnum = this.injector.get(ForgotPasswordMsgEnum);
    this.customerServiceService = this.injector.get(CustomerServiceService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
    this.commonIconImg = this.injector.get(CommonIconImg);

    this.customerDetailResponse = new CustomerDetailResponse();
    this.customerRequest = new CustomerRequest();
    this.customerLoginResponse = new CustomerLoginResponse();
    this.el = this.injector.get(ElementRef);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  }
  showPersonalDetails = false;
  showPasswordSection = false;
  showAccountClosure = false;
  billingAddresses: CustomerAddress[];
  storedAddress: CustomerAddress[];
  isDelete: boolean = false;
  isAddAddress: boolean = false;
  isAdd: boolean = false;
  showAddAdress: boolean = true;
  isAddressShow: boolean = false;
  address: CustomerAddress;
  editableAddress: CustomerAddress;
  editIndex: number;
  addressList = [
    "postCode",
    "address1",
    "address2",
    "address3",
    "city",
    "country",
  ];
  addressListFc = [
    "postCodeFc",
    "address1Fc",
    "address2Fc",
    "address3Fc",
    "cityFc",
    "countryFc",
  ];
  customerInfoUpdateModel: CustomerInfoUpdate;
  addressForm: FormGroup;
  personalDetail: FormGroup;
  passwordForm: FormGroup;
  responseData: ResponseData;
  customerDetailResponse: CustomerDetailResponse;
  personalDetailModel: PersonalDetails;
  modifyPersonalDetailRequest: ModifyPersonalDetailRequest;
  changePasswordRequest: ChangePasswordRequest;
  changePasswordResponse: ChangePasswordResponse;
  checked: boolean = false;
  browserRefresh: boolean;
  maxDate = new Date();
  minDate = this.maxDate.setFullYear(this.maxDate.getFullYear() - 15);
  oldPasswordFieldTextType: boolean = false;
  newPasswordFieldTextType: boolean = false;
  confirmPasswordFieldTextType: boolean = false;
  customerRequest: CustomerRequest;
  customerLoginResponse: CustomerLoginResponse;
  changePersonalDetailsResponse: ChangePersonalDetailsResponse;
  showMonth: string = "";
  showYear: string = "";
  isDisableDelete: boolean = false;
  message: string;
  //PICO 1944 Provide quick link for app to account closure information
  isfromAppValue: string;
  hideHeaderFlag: boolean = true;
  myProfileHideHeaderFlag: boolean = true;
  addressCount: number = 0;
  titleRegex =
    "[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð]+(([' -][a-zA-Z ])?[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð]*)*";
  resetPasswordForm: FormGroup;
  fragment: string;


  changeTitle() {
    const otherTitleControl = this.personalDetail.controls["otherTypeField"];
    if (this.personalDetail.get("title").value != "Other") {
      otherTitleControl.markAsUntouched();
      otherTitleControl.setErrors(null);
    } else if (
      otherTitleControl.value == "" &&
      this.personalDetail.get("title").value == "Other"
    ) {
      otherTitleControl.setValidators([
        Validators.required,
        Validators.pattern(this.titleRegex),
      ]);
      otherTitleControl.updateValueAndValidity();
    }
  }

  convertMonth() {
    let monthVal = this.personalDetail.get("dobMonth").value;
    if (monthVal.length === 1) {
      monthVal = `0${monthVal}`;
      this.personalDetail.patchValue({ dobMonth: monthVal });
    }
  }

  checkBothDobField() {
    let dobmonth = this.personalDetail.get("dobMonth").value;
    let dobyear = this.personalDetail.get("dobYear").value;
    if (!dobmonth && dobyear) {
      this.personalDetail.get("dobMonth").setErrors({ monthError: true });
    } else if (dobmonth && !dobyear) {
      this.personalDetail.get("dobYear").setErrors({ yearError: true });
    }
  }

  editPersonalDetails() {
    this.convertMonth();
    this.checkBothDobField();
    if (!this.showPersonalDetails) {
      this.initializePersonalDetails(this.personalDetailModel);
      this.showPersonalDetails = !this.showPersonalDetails;
    } else {
      if (this.personalDetail.valid) {
        this.modifyPersonalDetailRequest = new ModifyPersonalDetailRequest();
        if (this.personalDetail.get("title").value == "Other") {
          this.modifyPersonalDetailRequest.Title =
            this.personalDetail.get("otherTypeField").value;
        } else {
          this.modifyPersonalDetailRequest.Title =
            this.personalDetail.get("title").value;
        }
        this.modifyPersonalDetailRequest.FirstName =
          this.personalDetail.get("firstname").value;
        this.modifyPersonalDetailRequest.LastName =
          this.personalDetail.get("surname").value;
        this.modifyPersonalDetailRequest.MobileNumber =
          this.personalDetail.get("mobile").value;
        let sendDOB = `${this.personalDetail.get("dobMonth").value}/${
          this.personalDetail.get("dobYear").value
        }`;
        this.modifyPersonalDetailRequest.DateOfBirth =
          sendDOB.length === 7 ? sendDOB : "";
        this.modifyPersonalDetailRequest.NewEmail =
          this.personalDetail.get("email").value;
        this.modifyPersonalDetailRequest.ExistingEmail =
          this.personalDetailModel.Email;
        this.modifyPersonalDetailRequest.PhotoCardId =
          this.personalDetail.get("photocardid").value;
        this.showYear = "";
        this.showMonth = "";
        this.updatePersonalDetail(this.modifyPersonalDetailRequest);

        this.showPersonalDetails = !this.showPersonalDetails;
      }
    }
  }
  setMaxDate() {
    let currentDate = new Date();
    let date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    ).getDate();
    let month = currentDate.getMonth() - 1;
    let year = currentDate.getFullYear() - 15;
    let maxDate = new Date(
      new Date(new Date(new Date().setFullYear(year)).setMonth(month)).setDate(
        date
      )
    );
    this.maxDate = maxDate;
  }
  changePassword() {
    if (this.showPasswordSection) {
      if (this.passwordForm.valid) {
        this.changePasswordRequest = new ChangePasswordRequest();
        this.changePasswordRequest.OldPassword =
          this.passwordForm.get("oldPassword").value;
        this.changePasswordRequest.NewPassword =
          this.passwordForm.get("newPasword").value;
        this.changePasswordRequest.UserName = this.personalDetailModel.Email;
        this.callChangePassword(this.changePasswordRequest);
        this.showPasswordSection = !this.showPasswordSection;
      }
    } else {
      this.showPasswordSection = !this.showPasswordSection;
    }
  }

  accountclosour() {
    this.deleteAccount();
  }

  confirmclosour() {
    this.dialog.open(ConfirmModelComponent, {
      width: "600px",
      panelClass: 'common-popup-theme',
      disableClose: true,
      autoFocus: false,
    });
  }

  ngOnInit() {
    this.sharedService.capsLockOn.subscribe((res) => {
      if (res.id == 'mp-password-old-input' || res.id == 'mp-password-old-visible-btn-span') {
        this.isOldPswCapsLock = res.value;
        this.isNewPswCapsLock = 2;
        this.isConfrmPswCapsLock = 2;
      } else if (res.id == 'mp-password-new-input' || res.id == 'mp-password-new-visible-span') {
        this.isNewPswCapsLock = res.value;
        this.isOldPswCapsLock = 2;
        this.isConfrmPswCapsLock = 2;
      } else if (res.id == 'mp-password-confirm-input' || res.id == 'mp-password-confirm-visible-span') {
        this.isConfrmPswCapsLock = res.value;
        this.isNewPswCapsLock = 2;
        this.isOldPswCapsLock = 2;
      } else { // when clicks on another fields passwordfield's caps lock message should be hide.
        this.isConfrmPswCapsLock = 2; 
        this.isNewPswCapsLock = 2;
        this.isOldPswCapsLock = 2;
      }
    });
    this.myAccountService.hideForgotPasswordSection$.subscribe(forgotPassword => {
      this.resetPswSection = forgotPassword;
    });
    this.myAccountService.showChangePasswordSection$.subscribe(changePassword => {
      this.showPasswordSection = changePassword;
    });
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    this.customerRequest.CustomerKey = localStorage.getItem("CustomerKey");
    this.customerRequest.Email = localStorage.getItem("Email");
    this.browserRefresh = browserRefresh;
    this.setMaxDate();
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData(
        "sharedSibling",
        true
      );
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
        this.sharedService.reviewBuyResponse =
          sharedSiblingRefresh.reviewBuyResponse;
        this.sharedService.locationMasterData =
          sharedSiblingRefresh.locationMasterData;
      }
    }
    if (
      this.sharedService?.reviewBuyResponse != null &&
      this.sharedService?.reviewBuyResponse != undefined
    ) {
      this.sharedService.reviewBuyCache =
        this.sharedService.reviewBuyResponse.ReviewBuyCache;
      this.sharedService.getBasketCount.emit(
        this.sharedService.reviewBuyResponse.BasketCount
      );
    }
    this.createForms();
    this.billingAddresses = new Array<CustomerAddress>();
    this.storedAddress = new Array<CustomerAddress>();
    this.customerInfoUpdateModel = new CustomerInfoUpdate();
    this.customerInfoUpdateModel.Addresses = new Array<CustomerAddress>();
    this.getCustomerDetails();
    this.trimSpacesFromPostCodeFormControl();
    this.route.fragment.subscribe(fragment => { this.fragment = fragment; });
  }

  redirectFromAppToChangeEmail(){
    this.editPersonalDetails();
    this.changeEmail();
  }

  ngAfterViewInit(): void {
    try {
    if(this.fragment == this.appRouteEnum.mpPersonalFormFragmentId){
      this.scrollIntoViewOnPersonalDetailForm();
    }
    } catch (e) { console.log(e); }
  }

  scrollIntoViewOnPersonalDetailForm() {
    document.querySelector('#mp-personal-form').scrollIntoView();
  }

  createForms() {
    this.addressForm = this.formbuilder.group({
      address1: new FormControl("", [Validators.required,Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      address2: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      address3: new FormControl("", Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)),
      city: new FormControl("", [Validators.required,Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
      postCode: new FormControl("", [Validators.required, Validators.minLength(4)]),
      country: new FormControl("", [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
    });

    this.personalDetail = this.formbuilder.group(
      {
        title: new FormControl(""),
        otherTypeField: new FormControl(""),
        firstname: new FormControl("", [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
        surname: new FormControl("", [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
        email: new FormControl("", [Validators.required, Validators.maxLength(253)]),
        mobile: new FormControl(""),
        date: new FormControl(""),
        dobMonth: [""],
        dobYear: [""],
        photocardid: new FormControl(
          "",
          Validators.pattern("^[A-Z]{3}[0-9]{4}$")
        ),
      },
      {
        validator: [
          checkMobileValidation("mobile"),
          CheckMonth("dobMonth"),
          CheckYear("dobYear", "dobMonth"),
          validateEmailRegex('email')
        ],
      }
    );
    this.passwordForm = this.formbuilder.group(
      {
        oldPassword: new FormControl("", Validators.required),
        newPasword: new FormControl("", [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!,-_.@;:$%^[\]?=>/<])[A-Za-z\d!,-_.@;:$%^[\]?=>/<]{10,}$/
          ),
        ]),
        confirmPassword: new FormControl("", Validators.required),
      },
      {
        validator: [
          MustMatch("newPasword", "confirmPassword", false),
          NotMatch("oldPassword", "newPasword"),
        ],
      }
    );

    this.resetPasswordForm = this.formbuilder.group({
      email: new FormControl("", [Validators.required, Validators.maxLength(253)]),
    },{
      validator: [validateEmailRegex('email')]
    });

  }

  initializePersonalDetails(personalDetailData: PersonalDetails) {
    this.personalDetail.patchValue({
      title: personalDetailData.Title,
      firstname: personalDetailData.FirstName,
      surname: personalDetailData.LastName,
      email: personalDetailData.Email,
      mobile: personalDetailData.MobileNumber,
      dobMonth: personalDetailData.DateOfBirth.slice(0, 2),
      dobYear: personalDetailData.DateOfBirth.slice(3),
      photocardid: personalDetailData.PhotoCardId,
    });
    if (
      this.commonService.titleListArrayWithOutOther.indexOf(personalDetailData.Title) < 0 &&
      personalDetailData.Title != ""
    ) {
      this.personalDetail.patchValue({
        title: "Other",
        otherTypeField: personalDetailData.Title,
      });
    }
  }

  onAddressCreated() {
    this.addressForm.markAllAsTouched();
    this.addressList.forEach((x) => {
      let elementValue = document.getElementById(x)["value"];
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
      this.address.Address.Address1 = this.addressForm.get("address1").value;
      this.address.Address.Address2 = this.addressForm.get("address2").value;
      this.address.Address.Address3 = this.addressForm.get("address3").value;
      this.address.Address.PostCode = this.addressForm.get("postCode").value;
      this.address.Address.City = this.addressForm.get("city").value;
      this.address.Address.Country = this.addressForm.get("country").value;
      if (this.isAddAddress) {
        this.address.AddressType =
          "Address" + " " + (this.billingAddresses.length + 1).toString();
        let obj = Object.assign({}, this.address);
        this.billingAddresses.push(obj);
        this.isAddAddress = false;
        this.isAddressShow = false;
        this.isAdd = true;
      } else {
        this.address.Address.CountryCode =
          this.editableAddress.Address.CountryCode;
        this.address.AddressType = this.editableAddress.AddressType;
        this.address.IsDefault = this.editableAddress.IsDefault;
        this.billingAddresses[this.editIndex] = this.address;
        this.isAddressShow = false;
      }
      this.showAddAdress = true;
      this.customerInfoUpdateModel.Email = localStorage.getItem("Email");
      this.customerInfoUpdateModel.Addresses = this.billingAddresses;
      this.sendModifyAddress();
    } else {
      this.notificationService.warn("Please fill all required data.");
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
    this.scrollToElement("addEditAddressDiv");
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
        country: this.editableAddress.Address.Country,
      });
    } else {
      this.addressForm.markAsUntouched();
      this.addressForm.setErrors(null);
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

  onDeleteAddresss(index) {
    if (this.billingAddresses.length == 1) {
      this.notificationService.warn("You must have at least one address");
      return;
    }
    let dialogRef = this.dialog.open(ConfirmPopupComponent, {
      width: "500px",
      disableClose: true,
    });
    dialogRef.componentInstance.confirmMessage =
      "This action will delete this address permanently. You cannot undo this action.";
    dialogRef.componentInstance.confirmTitle =
      "Are you sure you want to delete this address ?";
    dialogRef.componentInstance.isMyProfilePopUp = true;
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let temp;
        for (let i = index; i < this.billingAddresses.length - 1; i++) {
          temp = this.storedAddress[i].AddressType;
          this.billingAddresses[i + 1].AddressType = temp;
        }
        this.billingAddresses.splice(index, 1);
        this.isDelete = true;
        this.customerInfoUpdateModel.Email = localStorage.getItem("Email");
        this.customerInfoUpdateModel.Addresses = this.billingAddresses;
        this.sendModifyAddress();
      } else {
        return false;
      }
    });
  }

  sendModifyAddress() {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);
    this.myAccountService
      .updateAddress(this.customerInfoUpdateModel)
      .subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            if (this.responseData.Data) {
              if (this.isDelete) {
                this.onClose();
                this.notificationService.success(
                  "Address deleted successfully."
                );
              } else if (this.isAdd) {
                this.hideAddressList();
                this.notificationService.success("Address added successfully.");
              } else {
                this.notificationService.success(
                  "Address updated successfully."
                );
              }
              this.storedAddress = JSON.parse(
                JSON.stringify(this.billingAddresses)
              );
              this.commonService.updateUserAddressesInLocalStorage(
                this.billingAddresses
              );
            } else {
              this.billingAddresses = JSON.parse(
                JSON.stringify(this.storedAddress)
              );
              this.notificationService.error(
                "Sorry, We are not able to update address this time. Please try again."
              );
            }
          } else {
            this.billingAddresses = this.storedAddress.slice(0);
            this.billingAddresses = JSON.parse(
              JSON.stringify(this.storedAddress)
            );
          }
          this.isAdd = false;
          this.isDelete = false;
        }
      });
  }

  CheckLetterPresence(e: KeyboardEvent) {
    if (this.personalDetail.get("mobile").hasError("letterError")) {
      CheckForLetterPresence(e, this.personalDetail.get("mobile"));
    }
  }

  getDobFromResponse(customerResponseDOB: any) {
    if (
      customerResponseDOB !== "" &&
      customerResponseDOB !== null &&
      customerResponseDOB !== undefined
    ) {
      this.showMonth = moment(customerResponseDOB).format("MMMM");
      this.showYear = moment(customerResponseDOB).format("YYYY");
    } else {
      this.showYear = "";
      this.showMonth = "";
    }
  }

  setCustomerDetails(_customerDetailResponse: CustomerDetailResponse) {
    if (this.customerDetailResponse.Addresses != null) {
      this.billingAddresses = this.customerDetailResponse.Addresses;
      this.storedAddress = JSON.parse(JSON.stringify(this.billingAddresses));
    }
    this.personalDetailModel = new PersonalDetails();
    this.personalDetailModel.Title = this.customerDetailResponse.Title;
    this.personalDetailModel.FirstName = this.customerDetailResponse.FirstName;
    this.personalDetailModel.LastName = this.customerDetailResponse.LastName;
    this.personalDetailModel.Email = this.customerDetailResponse.Email;
    this.personalDetailModel.MobileNumber =
      this.customerDetailResponse.MobileNumber;
    let respString = this.customerDetailResponse.DateOfBirth
      ? this.customerDetailResponse.DateOfBirth.toString()
      : "";
    this.personalDetailModel.DateOfBirth = respString
      ? `${respString.slice(5, 7)}/${this.showYear}`
      : "";
    this.personalDetailModel.PhotoCardId =
      this.customerDetailResponse.PhotoCardId;
  }

  getCustomerDetails() {
    this.myAccountService
      .getCustomerDetails(this.customerRequest)
      .subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            if (this.responseData.Data) {
              this.customerDetailResponse = this.responseData.Data;
              this.getDobFromResponse(this.customerDetailResponse.DateOfBirth);
              this.setCustomerDetails(this.customerDetailResponse);
            }
            this.openClosureAccountDetails();
            if(this.fragment == this.appRouteEnum.mpPersonalFormFragmentId){
              this.scrollIntoViewOnPersonalDetailForm();
            }
            if(this.router.url.includes(this.appRouteEnum?.appRedirectedURLToMyProfileForChangeEmail)){
              this.redirectFromAppToChangeEmail();
            }
          } else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  updatePersonalDetail(modifyPersonalDetailRequest) {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);
    this.myAccountService
      .updatePersonalDetail(modifyPersonalDetailRequest)
      .subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            this.changePersonalDetailsResponse = this.responseData.Data;
            if (this.changePersonalDetailsResponse.IsSuccess) {
              this.personalDetailModel.Title =
                this.modifyPersonalDetailRequest.Title;
              this.personalDetailModel.FirstName =
                this.modifyPersonalDetailRequest.FirstName;
              this.personalDetailModel.LastName =
                this.modifyPersonalDetailRequest.LastName;
              this.personalDetailModel.Email =
                this.modifyPersonalDetailRequest.NewEmail;
              this.personalDetailModel.MobileNumber =
                this.modifyPersonalDetailRequest.MobileNumber;
              this.personalDetailModel.DateOfBirth =
                this.modifyPersonalDetailRequest.DateOfBirth;
              this.personalDetailModel.PhotoCardId =
                this.modifyPersonalDetailRequest.PhotoCardId;
              this.customerDetailResponse.Title =
                this.modifyPersonalDetailRequest.Title;
              this.customerDetailResponse.FirstName =
                this.modifyPersonalDetailRequest.FirstName;
              this.customerDetailResponse.LastName =
                this.modifyPersonalDetailRequest.LastName;
              this.customerDetailResponse.Email =
                this.modifyPersonalDetailRequest.NewEmail;
              this.customerDetailResponse.MobileNumber =
                this.modifyPersonalDetailRequest.MobileNumber;
              this.customerDetailResponse.DateOfBirth =
                this.changePersonalDetailsResponse.DateOfBirth;

              this.customerDetailResponse.PhotoCardId =
                this.modifyPersonalDetailRequest.PhotoCardId;
              this.initializePersonalDetails(this.personalDetailModel);
              this.setCustomerLoginData();
              if (this.customerDetailResponse.DateOfBirth) {
                this.getDobFromResponse(
                  this.customerDetailResponse.DateOfBirth
                );
              } else {
                this.getDobFromResponse("");
              }

              localStorage.setItem(
                "Title",
                this.modifyPersonalDetailRequest.Title
              );

              localStorage.setItem(
                "FirstName",
                this.modifyPersonalDetailRequest.FirstName
              );
              localStorage.setItem(
                "LastName",
                this.modifyPersonalDetailRequest.LastName
              );
              this.sharedService.sendCustomerData(
                this.customerLoginResponse.CustomerDetail.FirstName,
                this.customerLoginResponse.CustomerDetail.LastName
              );
              this.notificationService.success(
                "Personal Details updated successfully."
              );
            } else {
              this.notificationService.error(
                this.changePersonalDetailsResponse.ResponseMessage
              );
            }
          } else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  callChangePassword(changePasswordRequest) {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);
    this.myAccountService
      .callChangePassword(changePasswordRequest)
      .subscribe((res) => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == "200") {
            this.changePasswordResponse = this.responseData.Data;
            debugger;
            if (this.changePasswordResponse.IsPasswordChanged) {
              this.customerServiceService.logout('');
              this.resetChangePasswordForm();
              let changePasswordMsgsObj = {
                notificationErrorMsg: this.notificationErrorMsg.changePassMessage,
                notificationTitle: this.notificationErrorMsg.changePassTitle,
              }
              let dialogRef = this.commonService.commonNotificationDialog('change-password-common-notification-dialog', changePasswordMsgsObj, this.commonIconImg.goodServiceIconImg, false, false);
              dialogRef.afterClosed().subscribe(()=>{this.router.navigateByUrl(this.appRouteEnum.Login);});
            } else {
              this.notificationService.error(
                this.changePasswordResponse.ResponseMessage
              );
            }
          } else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  deleteAccount() {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(false);
    this.myAccountService.deleteAccount().subscribe((res) => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == "200") {
          if (this.responseData.Data) {
            this.confirmclosour();
          } else {
            this.notificationService.warn(
              "Sorry, We were unable to process this request."
            );
          }
        } else {
          console.log(this.responseData.ResponseMessage);
        }
      }
    });
  }

  clickHere() {
    this.isDisableDelete = false; 
    this.showAccountClosure = true; 
  }

  cancelPersonalDetails() {
    const otherTitleControl = this.personalDetail.controls["otherTypeField"];
    otherTitleControl.setErrors(null);
    this.initializePersonalDetails(this.personalDetailModel);
    this.showPersonalDetails = !this.showPersonalDetails;
    this.personalDetail.patchValue({
      dobYear: "",
      dobMonth: "",
    });
    this.personalDetail.get("dobMonth").markAsUntouched();
    this.personalDetail.get("dobYear").markAsUntouched();
  }

  resetChangePasswordForm() {
    this.passwordForm.setValue({
      oldPassword: "",
      newPasword: "",
      confirmPassword: "",
    });
  }
  cancelPasswordUpdate() {
    this.passwordForm.reset();
  }

  resetPasswordUpdate() {
    this.resetPasswordForm.reset();
  }

  chosenYearHandler(normalizedYear: Moment) {
    const ctrlValue = this.personalDetail.controls["date"];
    ctrlValue.setValue(moment(this.minDate));
    ctrlValue.value.year(normalizedYear.year());
    ctrlValue.setValue(ctrlValue.value);
  }

  chosenMonthHandler(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Moment>
  ) {
    const ctrlValue = this.personalDetail.controls["date"];
    ctrlValue.setValue(moment(this.minDate));
    ctrlValue.value.month(normalizedMonth.month());
    ctrlValue.value.year(normalizedMonth.year());
    ctrlValue.value.date(normalizedMonth.daysInMonth());
    ctrlValue.setValue(ctrlValue.value);
    datepicker.close();
  }
  clearDate() {
    const ctrlValue = this.personalDetail.controls["date"];
    ctrlValue.setValue(null);
  }

  openClosureAccountDetails() {
    //PICO 1944 Provide quick link for app to account closure information
    this.route.queryParamMap.subscribe((params) => {
      this.isfromAppValue = params.get("fromApp");
      if (this.isfromAppValue == "close") {
        document.querySelector("#aClosure").scrollIntoView(true);
        this.showAccountClosure = false; 
      }
    });
  }

  setCustomerLoginData() {
    this.customerLoginResponse = this.storageDataService.getLocalStorageData(
      "customerLoginResponse",
      true
    );
    if (this.customerLoginResponse != null) {
      this.customerLoginResponse.CustomerDetail.Title =
        this.modifyPersonalDetailRequest.Title;
      this.customerLoginResponse.CustomerDetail.FirstName =
        this.modifyPersonalDetailRequest.FirstName;
      this.customerLoginResponse.CustomerDetail.LastName =
        this.modifyPersonalDetailRequest.LastName;
      this.customerLoginResponse.CustomerDetail.MobileNumber =
        this.modifyPersonalDetailRequest.MobileNumber;
      this.customerLoginResponse.CustomerDetail.DateOfBirth =
        this.customerDetailResponse.DateOfBirth;
      this.customerLoginResponse.CustomerDetail.PhotoCardId =
        this.modifyPersonalDetailRequest.PhotoCardId;
      this.storageDataService.clearLocalStorageData("customerLoginResponse");
      this.storageDataService.setLocalStorageData(
        "customerLoginResponse",
        this.customerLoginResponse,
        true
      );
    }
  }

  seeAllAddresses() {
    this.addressCount = this.billingAddresses.length;
  }

  hideAddressList() {
    this.addressCount = 0;
    this.scrollToElement("addressListDiv");
  }

  scrollToElement(divId): void {
    setTimeout(() => {
      document.getElementById(divId).scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 200);
  }

  onClickSentEmailBtn() {
    if (this.resetPasswordForm.get('email').valid) {
      let sendMailToResetPasswordFormData = this.resetPasswordForm.get('email').value;
      this.customerSendMailRequst = new CustomerSendMailRequst();
      this.customerSendMailRequst.UserEmail = sendMailToResetPasswordFormData;
      this.myAccountService.sendEmailToResetPassword(this.customerSendMailRequst, true, this.resetPasswordForm);
    }
    this.isSubmitted = true;
  }

  changeEmail() {
    let dialogRef = this.dialog.open(ChangeEmailModalComponent, {
      width: '600px',
      disableClose: false,
      autoFocus: false,
      panelClass: 'common-popup-theme',
    });

    dialogRef.afterClosed().subscribe((flag) => {
      if (flag) {
        if (!this.resetPswSection && !this.showPasswordSection) {
          this.resetPswSection = !this.resetPswSection;
          this.showPasswordSection = !this.showPasswordSection;
        } else if (!this.resetPswSection && this.showPasswordSection) {
          this.resetPswSection = !this.resetPswSection;
        }
        let dom = document.querySelector('#changePassword');
        seamless.elementScrollIntoView(dom, {
          block: "center",
          scroll: "smooth"
        });
      }
    });
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

}

