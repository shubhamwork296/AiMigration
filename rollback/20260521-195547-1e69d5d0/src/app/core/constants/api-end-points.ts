import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class ApiRouteService {

  // ADMIN APIS CONSTANTS
  register: string = "register";
  forgotPassword: string = "admin/auth/forgotPassword";
  resetPassword: string = "admin/auth/resetPassword";
  login: string = "admin/auth/login";
  myCourse: string = 'course/mycourse';
  addArticle: string = 'admin/article/add';
  articleList: string = 'admin/article/list';
  addCategory: string = 'admin/category/add';
  categoryList: string = 'admin/category/list';
  categoryListDropdown: string = 'admin/category/listDropdown';
  articleListDropdown: string = 'admin/article/listDropdown';
  articleDelete: string = 'admin/article/delete';
  categoryDelete: string = 'admin/category/delete';
  addAttribute: string = 'admin/atribute/add';
  attributeList: string = 'admin/attribute/list';
  parentAttributeListDropdown = 'admin/attribute/parentlist';
  attributeListDropdown: string = 'admin/attribute/listDropdown';
  attributeDelete: string = 'admin/attribute/delete';
  imageViewList: string = 'admin/imageView/list';
  addProduct: string = 'admin/product/add';
  prouductList: string = 'admin/product/list';
  productListDropdown: string = 'admin/product/productDropdown';
  productDelete: string = 'admin/product/delete';
  currencyAddSetting: string = 'admin/setting/add';
  currencySettingList: string = 'admin/setting/list';
  uploadFile: string = 'admin/uploadFile';
  addImageView: string = 'admin/imageView/add';
  imageViewListDropdown: string = 'admin/imageView/listDropdown';
  imageViewDelete: string = 'admin/imageView/delete';
  imageViewOrder: string = 'admin//imageView/order';
  changePassword: string = 'admin/users/changePassword';
  getUserProfile: string = 'admin/users/getProfile';
  profileUpdate: string = 'admin/users/profileUpdate';
  attributeValueDelete: string = 'admin/attribute/attributeDetailDelete';
  bulkUploadValidation: string = 'admin/product/bulkUploadValidation';
  saveBulkUpload: string = 'admin/product/bulkUpload';
  verifyProduct: string = 'admin/product/verifyProduct';
  importFormatExcel: string = 'admin/product/importFormatExcel';
  addPriceData: string = 'admin/addPriceData';
  getPriceData: string = 'admin/getPrice';
  addRole: string = 'admin/role/add';
  roleList: string = 'admin/role/list';
  roleListDropdown: string = 'admin/role/listDropdown';
  roleDelete: string = 'admin/role/delete';
  getPermissions: string = 'admin/permission';
  addUser: string = 'admin/users/add';
  getUsers: string = 'admin/users/list';
  deleteUser: string = 'admin/users/delete';
  deletePrice: string = 'admin/setting/deletePrice';
  countryList: string = 'country/list';

  // FRONT API CONSTANTS
  // showcategoryList : string = 'category/list'
  showcategoryList: string = 'category/all-list';
  productDetails: string = 'product/detail';
  productPlanDetails: string = 'product/planDetail';
  productAttributeList: string = 'attribute/list';
  productCompare: string = 'product/compare';
  similarProducts: string = 'product/similar';
  customerSettings: string = 'settings';
  dashboardStatistics: string = 'admin/dashboard/Statistics';
  attributeOrder: string = 'admin/atribute/order';
  copyProduct: string = 'admin/product/copy';
  productDetailTest: string = 'product/productsByCategory';
  matchingBandDetails: string = 'product/matchingBands';
  showAttributeListSteps: string = 'attribute/listSteps';
  get360Images: string = 'product/threeSixtyViewImages';
  getSimilarCofigAttrDetails: string = 'product/configAttrDetails';
  addProductInCart: string = "product/cartProduct";
  getProductBySku: string = "product/detail-sku";


}


