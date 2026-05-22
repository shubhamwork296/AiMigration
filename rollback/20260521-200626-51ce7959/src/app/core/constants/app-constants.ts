
export class AppConstants {
  //grid settings
  public static pageSizeOptions: any = [5, 10, 25, 100];
  public static showFirstLastButtons: boolean = false;
  public static currencyOptions: any = ['INR', 'USD', 'GBP']
  //date constants

  //TITTLE CONSTANT
  JEWELEX_CWP_TITLE: string = ' | Diamond Heaven';
  public static JEWELEX_CWP_TITLE_NO_BAR: string = 'Diamond Heaven';
  public static PASSWORD_VALIDATOR = "(?=[A-Za-z0-9@#$%^&+!=]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=])(?=.{8,}).*$"
  public static RESET_PASSWORD_PRE: string = 'pre';
  public static URL_VALIDATION = "^(https?|ftp):\/\/(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/?$"
  public static EMAIL_REJEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  public static RESET_PASSWORD_POST: string = 'post';
  public static CATEGORY_IMAGE_FOLDER_NAME: string = 'categories/';
  public static ATTRIBUTE_IMAGE_FOLDER_NAME: string = 'attributes/';
  public static PRODUCT_IMAGE_FOLDER_NAME: string = 'products/';
  public static PROFILE_IMAGE_FOLDER_NAME: string = 'profiles/';
  public static WEB_LOGO_IMAGE_FOLDER_NAME: string = 'logos/';
  public static ATTRIBUTE_ENGRAVE_FOLDER_NAME: string = 'engrav/';
  public static PRODUCT_THUMBNAIL_IMAGE_FOLDER_NAME: string = 'thumbnail/';
  public static LOGO_SETTING_KEY: string = 'webLogo'
  public static CURRENCY_SETTING_KEY: string = 'defaultCurrency'
  public static DISCOUNT_START_DATE_KEY: string = 'discount_start_date'
  public static DISCOUNT_END_DATE_KEY: string = 'discount_end_date'
  public static DISCOUNT_PERCENT: string = 'discount_percent'
  public static BASE_GOLD_PRICE_SETTING_KEY: string = 'base_gold_price'
  public static BASE_PLATINUM_PRICE_SETTING_KEY: string = 'base_platinum_price'
  public static CURRENT_GOLD_RATE_SETTING_KEY: string = 'current_gold_rate'
  public static CURRENT_PLATINUM_RATE_SETTING_KEY: string = 'current_platinum_rate'
  public static MARKUP_IN_PRICE: string = 'markup_in_price'
  public static PRICE_ROUND_OFF: string = 'price_roundoff_value'
  public static GENERATE_QR_SETTING_KEY: string = 'generate_qr'
  public static PRICE_USD_TO_POUND_SETTING_KEY: string = 'price_usd_to_pound'
  public static PRODUCT_DETAIL: string = '1'
  public static SPECIFICATION: string = '2'
  public static PORDUCT_DETAIL_AND_SPECIFICATION: string = '1,2'
  public static ON_HAND_RING_NAME: string = 'try on'
  public static TRY_ON_NAME: string = 'try on'
  public static ON_VIDEOTHUMBNAIL_NAME: string = 'video thumbnail'
  public static MATCHING_BAND_NAME: string = 'matching band'
  public static DEFAULT_CURRENCY: string = 'GBP'
  public static FILE_TYPE_IMAGE: string = 'image'
  public static FILE_TYPE_VIDEO: string = 'video'
  public static SUCCESS: string = 'Success!'
  public static OOPS: string = 'Oops!'
  public static YES: string = 'YES'
  public static NO: string = 'NO'
  public static NO_PLAN: string = 'NO PLAN'
  public static success: string = 'success'
  public static BRACELETE_STYLE: string = "style"
  public static WEIGHT: string = 'weight'
  public static SHAPE: string = 'shape'
  public static METAL_COLOR: string = 'metal'
  public static MENSARTICAL: string = 'men'
  public static METAL_SINGLE_TONE: string = 'metal single tone'
  public static METAL_DUAL_TONE: string = 'metal dual tone'
  public static RING_SIZE: string = 'size'
  public static DEVIDE_SHAPE: string = 'shape'
  public static METAL_VALUE_1: string = 'platinum'
  public static METAL_VALUE_2: string = '950'
  public static PERMISSION_VIEW_SLUG: string = 'view'
  public static PERMISSION_ADD_SLUG: string = 'add'
  public static PERMISSION_EDIT_SLUG: string = 'edit'
  public static PERMISSION_DELETE_SLUG: string = 'delete'
  public static USER_ADMIN: string = 'admin'
  public static ATTRIBUTE_DESIGN: string = 'DESIGN'
  public static ATTRIBUTE_SETTNG: string = 'SETTING'
  public static ATTRIBUTE_PROFILE: string = 'PROFILE'
  public static ATTRIBUTE_STONE_SPREAD: string = 'STONE SPREAD'
  public static ATTRIBUTE_DIMANOND_CUT: string = 'DIAMOND CUT'
  public static ATTRIBUTE_STONE_CUT: string = 'STONE CUT'
  public static config: Object;
  public static defaultAdminRoleId: any = 1;
  public static CARAT_WEIGHT_ID: any = 35;
  public static RING_ATTRIBUTES: number[] = [27, 26, 29]
  public static convertToPlain(html: any) {

    // Create a new div element
    let tempDivElement = document.createElement("div");

    // Set the HTML content with the given value
    tempDivElement.innerHTML = html;

    // Retrieve the text property of the element
    return tempDivElement.textContent || tempDivElement.innerText || "";
  }

  public static evaluateExpression(expression: any, obj: any) {
    const { key, operation, value } = expression;
    const propValue = obj[key]
    switch (operation) {
      case "greater_than": return propValue > value;
      case "less_than": return propValue < value;
      case "contains": return new RegExp(value + "").test(propValue + "")
      case "starts_with": return new RegExp("^" + value + "").test(propValue + "")
      case "equal": return propValue == value;
      default:
        return propValue == value;
    }
  }


  public static checkAttributeComibinationFound(element: any, sub_sub_element: any, ConfigAttribs: any) {
    let expression: any = [];
    expression.push({
      key: 'atr_' + element.AttributeId,
      operation: 'equal',
      value: sub_sub_element.AttributeDetailId
    })
    const attributeFound = ConfigAttribs.filter((item: any) => expression.every((expr: any) => AppConstants.evaluateExpression(expr, item)));
    if (attributeFound && attributeFound.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }


  public static checkImageExtensionAllowed(fileName: any): boolean {
    let is_extension_allowed: boolean = false;
    let extension = fileName.split('.')[1];
    if (((extension.toLowerCase() == "png") || (extension.toLowerCase() == "jpg") || (extension.toLowerCase() == "jpeg") || (extension.toLowerCase() == "jfif")) && fileName.split('.').length == 2) {
      is_extension_allowed = true
    }

    return is_extension_allowed;
  }

  public static checkVideoExtensionAllowed(fileName: any): boolean {
    let is_extension_allowed: boolean = false;
    let extension = fileName.split('.')[1];
    if ((extension.toLowerCase() == "mp4") && fileName.split('.').length == 2) {
      is_extension_allowed = true
    }

    return is_extension_allowed;
  }

  public static checkName(name: string): boolean {
    if ((name.toLocaleLowerCase() == AppConstants.TRY_ON_NAME) || (name.toLocaleLowerCase() == AppConstants.MATCHING_BAND_NAME)) {
      return true
    }
    else {
      return false
    }
  }

  public static checkPermssionAvalible(permission: any, modules: any) {
    let permissionAvailbale = this.checkModulePermissions(permission, modules)
    if (permissionAvailbale.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  public static checkModulePermissions(moduleName: any, modules: any) {
    return moduleName.filter((mn: any) => {
      if (mn?.split('_')[1]) {
        const arr = mn.split("_");
        let moduleInfo = { module: arr[0], permission: arr[1] };
        let module = modules.find((m: any) => m.module_slug == moduleInfo.module);
        let isAllow = module?.permission.findIndex((p: any) => p.permission_slug == moduleInfo.permission);
        if (isAllow > -1) {
          return mn
        }
      }
      else {
        let isAllow = modules.findIndex((m: any) => m.module_slug == mn);
        if (isAllow > -1) {
          return mn
        }
      }
    });
  }

  public static getErrorMessagesByStatus(message: any, original_message?: any) {
    if (message == 'Common.Errors.InternalServerError' || message == 'Common.Errors.SomeThingWentWrong') {
      return this.TRY_AGAIN_LETER
    }
    else if (message == 'Common.Errors.NotFound') {
      return 'Request URL not found. Please check with correct url.'
    }
    else if (message == 'Common.Errors.AccountDeactivated') {
      return 'Your account is deactivated, Please connect with administrator.'
    }
    else if (message == 'Common.Errors.InvalidLoginDetails') {
      return 'You enter invalid login details, Please retry with correct login credentials.'
    }
    else if (message == 'Common.Errors.UnauthorizedUser') {
      return 'You are not authorized to access this resource, Please connect with administrator.'
    }
    else if (message == 'Common.Errors.NotConnect') {
      return 'There is some connectivity issues, Please check your internet connection and try again.'
    }
    else {
      let error_message = message ? message : ''
      return (original_message ? original_message : error_message)
    }
  }

  public static checkUserChangeTheriEmail(old_email: any, newEmail: any): boolean {
    if (old_email == newEmail) {
      return false;
    }
    else {
      return true;
    }
  }

  public static EXCEL_KEYWORD: any = [
    'ProductSKU*',
    'ProductType*',
    'ProductName*',
    'CategoryName*',
    'ArticleName*',
    'Description',
    'Price*',
    'IncrementalFactor*',
    'Uri',
    'ImageViewNameProdImage',
    'Mimetype',
    'AttributeName*',
    'AttributeDetailValue*',
    'AttributeDetailImage',
    'Engravable*',
    'JewelexSKU*',
    'MatchingBand*',
    'MatchingBandProductSKU',
  ]

  public static PRODUCT_ADD = "Product added successfully!"
  public static PRODUCT_UPDATE = "Product has been updated successfully!"
  public static PROUDCT_COPIED = "Product copied successfully!"
  public static MATCHING_BAND_DELETE = "'Matching band sku deleted successfully!'"
  public static ARTICLE_DELETE = "Article deleted successfully!"
  public static ARTICLE_UPDATE = 'Article updated successfully!'
  public static ARTICLE_ADD = 'Article added successfully!'
  public static ATTRIBUTE_DELETE = 'Attribute deleted successfully!'
  public static ATTRIBUTE_UPDATE = 'The Attribute has been updated successfully!'
  public static ATTRIBUTE_ADDED = 'The Attribute has been created successfully!'
  public static ATTRIBUTE_VALUE_DELETE = 'Attribute Value deleted successfully!'
  public static DATA_READY_SUCSSES = 'Data Ready for import, please click import button to Initialize import'
  public static DATA_IMPORT_SUCCESS = 'Data imported successfully!'
  public static CATEGORY_DELETED = 'Category deleted successfully!'
  public static CATEGORY_UPDATED = 'The category has been updated successfully!'
  public static CATEGORY_ADD = 'The category has been created successfully!'
  public static PASSWORD_UPDATE = 'Password has been updated successfully!'
  public static PROFILE_UPDATE = 'Profile updated successfully!'
  public static IMAGE_VIEW_DELETE = 'Image view deleted successfully!'
  public static IMAGE_VIEW_ADD = 'Image view added successfully!'
  public static IMAGE_VIEW_UPDATE = 'Image view updated successfully!'
  public static PRODUCT_DELETE = 'Product deleted successfully!'
  public static PRODUCT_COPIED = 'Product copied successfully!'
  public static SETTINGS_UPDATE = 'Settings updated successfully!'
  public static QR_CODE_GENERETED = "QR code generated successfully!"
  public static VALIE_EXISTS = 'Value already exists, Please select it from dropdown options.'
  public static WRONG_FILE_FORMAT = 'File type is not valid, please upload correct file type'
  public static ADD_ATRICLE = 'Please add article first!'
  public static VALID_IMAGE_NAME = 'Image name contains space, please check valid image name!'
  public static VALID_IMAGE_SIZE = 'Image size should be less than or equal to 2 MB and Dimension should be 600 x 600 px!'
  public static SELECT_ARTICLE = 'Please select article first, which you want to reorder the attributes!'
  public static SELECT_OPTION = 'Please select atleast one or both option in between Product Details or Specification!'
  public static NOT_USE_MULTIPLE_FILE = 'Cannot use multiple files!'
  public static EXCEED_FILE_SIZE = 'File size exceeds the maximum limit, Please reduce the records.'
  public static INAVALID_FILE = 'Invalid file type. Kindly select an excel file to upload the data!'
  public static CORRECT_FORMAT = 'Please upload sheet in correct format!'
  public static NOT_DEFINE_OPTION = 'The selected file is not containing the defined columns, please check the file and try again!'
  public static FILE_EMPTY = 'The selected file is not containing data to upload!'
  public static FILL_PRODUCT_SKU = 'Please fill the data in ProductSKU and upload the excel again.'
  public static FILL_PRODUCT_TYPE = 'Please fill the data in Product type and upload the excel again.'
  public static FILL_PRODUCT_NAME = 'Please fill the data in ProductName and upload the excel again.'
  public static FILL_CATEGORY_NAME = 'Please fill the data in CategoryName and upload the excel again.'
  public static FILL_ARTICLE_NAME = 'Please fill the data in ArticleName and upload the excel again.'
  public static FILL_PRICE = 'Please fill the data in Price and upload the excel again.'
  public static FILL_INCREMENTAL_FACTOR = 'Please fill the data in Incremental Factor and upload the excel again.'
  public static NUMERIC_FILE = 'Price should be contain numeric value!'
  public static NUMERIC_INCREMENTAL_FACTOR = 'Incremental Factor should be contain numeric value!'
  public static NOT_NEGATIVE_FILE = 'Price should not be contain negative value!'
  public static NOT_NEGATIVE_INCREMENTAL_FACTOR_FILE = 'Incremental Factor should not be contain negative value!'
  public static FILL_ATTRIBUTE_NAME = 'Please fill the data in AttributeName and upload the excel again.'
  public static FILL_ATTRIBUTE_VALUE = 'Please fill the data in AttributeDetailValue and upload the excel again.'
  public static FILL_MIME_TYPE = 'Please fill the data in Mimetype and upload the excel again.'
  public static FILL_MATCHING_BAND = 'Please fill the data in MatchingBand and upload the excel again.'
  public static FILL_MATCHING_BAND_SKU = 'Please fill the data in MatchingBandProductSKU and upload the excel again.'
  public static FILL_ENGRAVE = 'Please fill the data in Engravable and upload the excel again.'
  public static FILL_JEWELEX_SKU = 'Please fill the data in JewelexSKU and upload the excel again.'
  public static SOMETING_WRONG = 'Something went wrong please try aftersometime!'
  public static ONLY_MP4_ALLOW = 'Only .mp4 format allowed!'
  public static MATCHING_BAND_SKU_UNIQE = "MatchingBandProductSKU should be contain unique value please check data and upload the excel again."
  public static FILE_TYPE_MISMATCH = "Please check image extension type is mismatch in uri or mime type please verify correct the type."
  public static COPY_PRODUCT = 'Copy Product'
  public static CONFIRM_COPY = 'Are you sure you want to copy this product?'
  public static DELETE_MATCHING_BAND = 'Delete Matching Band'
  public static CONFIRM_MATCHING_BAND = 'Are you sure you want to delete this matching band SKU'
  public static DELETE_ARTICLE = 'Delete Article'
  public static CONFIRM_DELETE = 'Are you sure you want to delete this article '
  public static DELETE_ATTRIBUTE = 'Delete Attribute'
  public static CONFIRM_DELETE_ATTRIBUTE = 'Are you sure you want to delete this attribute '
  public static DELETE_ATTRIBUTE_VALUE = 'Delete Attribute Value'
  public static CONFIRM_DELETE_VALUE = "Are you sure you want to delete this attribute value"
  public static DELETE_CATEGORY = "Delete Category"
  public static CONFIRM_DELETE_CATEGORY = "Are you sure you want to delete this category "
  public static DELETE_IMAGEVIEW = 'Delete Image View'
  public static CONFIRM_DELETE_IMAGEVIEW = "Are you sure you want to delete this image view"
  public static DELETE_PRODUCT = 'Delete Product'
  public static CONFIRM_DELETE_PRODUCT = "Are you sure you want to delete this product "
  public static CONFIRM_COPY1 = "Are you sure you want to copy this product "
  public static TRY_AGAIN_LETER = "Something went wrong. Please try again later."
  public static CLIENT_SIDE_ERROR = "Client Side Error: "

  public static ATRICLE_NAME_REQIURED = "Article name field is required."
  public static ARTICLE_STATUS_REQUIRED = "Article status field is required."
  public static ABOUT_ARTICLE_REQUIRED = "About article field is required."
  public static PRODUCT_NAME_REQUIRED = "Product name field is required."
  public static CATEGORY_IMAGE_REQUIRED = 'Category image is required.'
  public static CATEGORY_NAME_REQUIRED = "Category name field is required."
  public static ARTICLE_FIELE_REQUIRED = "Article field is required."
  public static CATEGORY_STATUS_REQUIRED = "Category status field is required."
  public static ABOUT_CATEGORY_REQUIRED = "About category field is required."
  public static IMAGE_VIEW_NAME_REQUIRED = "Image View name field is required."
  public static IMAGE_VIEW_STATUS_REQUIRED = "Image view status field is required."
  public static ATTRIBUTE_NAME_FIELD_REQUIRED = "Attribute name field is required."
  public static ARTICLE_REQUIRED = "Article field is required."
  public static PARENT_ATTRIBUTE_REQUIRED = "Parent Attribute field is required."
  public static PARENT_ATTRIBUTE_VALUE_REQUIRED = "Parent Attribute value field is required."
  public static IMAGE_VIEW_REQUIRED = "Image view field is required."
  public static ATTRIBUTE_STATUS_REQUIRED = "Attribute status field is required."
  public static SELECT_ONE_OPTION = "Please select atleast one or both option in between Product Details or Specification!"
  public static REQUIRED_FIELD = "This field is required."
  public static PRODUCT_SKU_REQUIRED = "Product SKU field is required."
  public static JEWELEX_SKU_REQUIRED = "Jewelex SKU field is required."
  public static PARENT_SKU_REQUIRED = "Parent SKU field is required."
  public static PRODUCT_PRICE_REQUIRED = "Product price field is required."
  public static INCREMENTAL_FACTOR_REQUIRED = "Incremental fector field is required."
  public static ARTICLE_FIELD_REQUIRED = "Article field is required."
  public static PRODUCT_CATEGORY_REQUIRED = "Product category field is required."
  public static PRODUCT_STATUS_REQUIRED = "Product status field is required."
  public static PRODUCT_TYPE_REQUIRED = "Product type field is required."
  public static ABOUTE_PRODUCT_REQUIRED = "About product field is required."
  public static PRODUCT_VIDEO_REQUIRED = "Product video is required."
  public static SELECT_ATTRIBUTE_VALUE = "Please select attribute values."
  public static MATCHING_BAND_SKU_REQUIRED = "Matching band sku is required."
  public static MATCHING_BAND_SKU_DUPLICATE = "Matching band sku can not contains duplicate value."
  public static UPDATE = "Update"
  public static SUBMIT = "Submit"
  public static REQUIRED_LOGO = "Logo image is required."
  public static CURRENCY_REQUIRED = "Please select currency."
  public static PRODUCT_SKU_DUPLICATE = "Product SKU can not contains duplicate value."
  public static SKU_DIFFERENT = "Product SKU and Jewelex SKU should be different"
  public static SKUS_DIFFERENT = "Jewelex SKU and Product SKU should be different"
  public static JEWELEXT_SKU_NOT_DUPLICATE = "Jewelex SKU can not contains duplicate value."
  public static PRICE_REQUIRED = "Price field is required."
  public static DESCRIPTION_REQUIRED = "Description field is required."
  public static MATCHING_BAND_REQUIRED = "Matching band details required"
  public static ATTRIBUTE_NAME_REQUIRED = "Attribute name is required."
  public static ATTRIBUTE_VAUE_NAME_REQUIRED = "Attribute value name is required."
  public static USER_IMAGE_REQUIRED = "User image is required."
  public static REQUIRED_FIRST_NAME = "First name field is required."
  public static FIRST_NAME_LENGTH = "First name maximumm length is 50."
  public static LAST_NAME_REQUIRED = "Last name field is required."
  public static LAST_NAME_LENGTH = "Last name maximumm length is 50."
  public static REQUIRED_EMAIL = "Email field is required."
  public static ENTER_VALID_EMAIL = "Please enter valid email address."
  public static PHONE_NUMBER_REQUIRED = "Phone number field is required."
  public static RING_ON_HAND_NOTE = "Please click on finger to try band."
  public static USERNAME_EMAIL_REQUIRED = "Username or e-mail address field is required."
  public static LOGIN = "Login"
  public static BACK_TO = "Back to"
  public static PASSWORD_REUIRED = "Password field is required."
  public static FORGOT_PASSWORD = "Forgot Password?"
  public static CONFIRM_PASSWORD_REQUIRED = "Confirm password field is required."
  public static PASSWORD_LIMIT = "Password must be at least 8 characters."
  public static CONFIRM_PASSWORD_LIMIT = "Confirm password must be at least 8 characters."
  public static PASSWORD_SYNTAX = "Password must have be a combination of at least min 1 uppercase 1 lowercase 1 number 1 special character and only contains symbols from the alphabet, num."
  public static CONFIRM_PASSWORD_SYNTAX = "Confirm password must have be a combination of at least min 1 uppercase 1 lowercase 1 number 1 special character and only contains symbols from the alphabet, num."
  public static PASSWROD_NOT_MATCH = "Password and Confirm Password don't match would be shown."
  public static PROUDCT_ARRIVING_NOTE = "This item will take slightly longer to dispatch. Please allow an additional 10 - 12 business days."
  public static PRODUCT_INTERACTION_NOTIFICATION = "Members Only: Warehouse pick up is available for this item and standard delivery time will apply. Please note, only the bill-to credit card addressee may pickup the product. Valid state or government-issued photo ID is required at the time of pick up."
  public static GUARANTEE_NOTE = "We guarantee that all diamonds supplied by Jewelex Wholesale are as follows:"
  public static BETTER_NOTE = "or better as outlined on the industry grading guide."
  public static COPY_RIGHT_NOTE = "© 2023 Jewelex Group. All rights reserved."
  public static NO_RECORD_FOUND = "No records found."
  public static SELECT_STATUS = "Select status"
  public static STATUS_ACTIVE = "Active"
  public static STATUS_INACTIVE = "Inactive"
  public static PRODUCT_TYPE_SIMPLE = "Simple"
  public static PRODUCT_TYPE_MATCHING_BAND = "Matching Band"
  public static SERIAL_NUMBER = "SR.No."
  public static FREE_DELIVERY_NOTE = "Free Standard Delivery on orders over"
  public static DAYS_RETURN = "30 day returns"
  public static TRUSTED_JEWELLER = "Most Trusted Jeweller 2022"
  public static NOT_VALID_FILE_TYPE = "File type not valid!"
  public static NOT_VALID_FILE_NAME = "File name not valid!"
  public static ADD_ARTICLE = "Add Article"
  public static ADD_ATTRIB = "Add Attribute"
  public static ADD_ARTICLE_CONFRIMATION = "You can not undo this steps, Are you sure you want to add this article?"
  public static ADD_ATTRIB_CONFRIMATION = "You can not undo this steps, Are you sure you want to add this attribute?"
  public static CATEGORYIMAGE_VALIDATION = "Image size should be less than or equal to 2 MB and Dimension should be 600 x 300 px!"
  public static ATTRIBUTEIMAGE_2NDSTEP_VALIDATION = "Image size should be less than or equal to 2 MB and Dimension should be 800 x 400 px!"
  public static ATTRIBUTEIMAGE_VALIDATION = "Image size should be less than or equal to 2 MB and Dimension should be 600 x 600 px!"
  public static CONFIRM_PASSWORD_TEXT = "Confirm Password"
  public static NEW_PASSWORD_TESXT = "New Password"
  public static OLD_PASSWORD_TESXT = "Old Password"
  public static NEW_PASSWORD_REQUIRED = " New password field is required"
  public static NEW_PASSWORD_LENGTH = "New password must be at least 8 characters."
  public static NEW_PASSWORD_VALIDATION = "New password must have be a combination of at least min 1 uppercase 1 lowercase 1 number 1 special character and only contains symbols from the alphabet, num."
  public static CHANGE_PASSWORD_SUBMIT = "Change Password"
  public static CHANGE_PASSWORD_CANCEL = "Cancel"
  public static BASE_GOLD_PRICE_REQUIRED = "Base gold price field is required."
  public static BASE_PLATINUM_PRICE_REQUIRED = "Base platinum price field is required."
  public static BASE_PRICE_UPDATE = 'Base price updated successfully!'
  public static BASE_PRICE_ADD = 'Base price added successfully!'
  public static CURRENT_GOLD_RATE_REQUIRED = 'Current gold rate field is required.'
  public static CURRENT_PLATINUM_RATE_REQUIRED = 'Current platinum rate field is required.'
  public static CONVERSION_RATE_REQUIRED = 'Conversion rate field is required.'
  public static MARKUP_PRICE_REQUIRED = 'Markup price field is required.'
  public static ROUND_OFF_REQUIRED = 'Round off rate field is required.'
  public static DELETE_ROLE = 'Delete Role'
  public static CONFIRM_ROLE = 'Are you sure you want to delete this role'
  public static ROLE_NAME_REQIURED = "Role name field is required."
  public static ROLE_STATUS_REQUIRED = "Role status field is required."
  public static USER_NAME_REQUIRED = "User name field is required."
  public static USER_STATUS_REQUIRED = "User status field is required."
  public static ROLE_DELETE = "Role deleted successfully!"
  public static ROLE_UPDATE = 'Role module permission updated successfully!'
  public static ROLE_ADD = 'Role added successfully!'
  public static USER_DELETE = "User deleted successfully!"
  public static USER_UPDATE = 'User updated successfully!'
  public static USER_ADD = 'User added successfully!'
  public static DELETE_USER = 'Delete User'
  public static CONFIRM_USER = 'Are you sure you want to delete this user'
  public static ADD_ROLE = "Add Role"
  public static ADD_USER = "Add User"
  public static ROLE_FIELE_REQUIRED = "Role field is required."
  public static GENERATE_QR = "Generate QR"
  public static ENTER_VALID_URL = "Please enter valid url."
  public static DOWNLOAD_QR = "Download QR Code"
  public static DOWNLOAD_QR_SVG = "Download SVG"
  public static USER_NAME_LENGTH = "User name maximumm length is 50."
  public static EMAIL_LENGTH = "Email maximumm length is 100."
}

