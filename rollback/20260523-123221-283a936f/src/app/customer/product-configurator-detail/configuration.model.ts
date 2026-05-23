export interface AttributeListStepRequest {
  articleId: number;
  categoryId: number;
  step: number;
  countryId: number;
  selectedAttrs: SelectedAttrRequest[];
  dropdownAttr: SelectedAttrRequest[];
}

export interface SelectedAttrRequest {
  attrId: number;
  attrDtl: number;
}

export interface AttributeMapData {
  attributes: AttributeMap[];
}

export interface AttributeMap {
  pid: number;
  [key: string]: number;
}

export interface AttributeData {
  attributes: Attribute[];
}

export interface Attribute {
  AttributeId: number;
  AttributeName: string;
  ArticleId: number;
  ImageViewId: number;
  IsConfigurable: number;
  AttributeOrder: number;
  IsDefault: number;
  DisplayIn: string;
  IsEngravable: number;
  step: null | number;
  PrAttrId: null;
  SummaryOrder: number;
  des: string;
  AttributeDetailValue: any
  show_description?: number
  attributeDetails: AttributeDetail[];
}

export interface AttributeDetail {
  AttributeDetailId: number;
  AttributeId: number;
  AttributeDetailValue: string;
  AttributeDetailImage: string;
  AttributeDetailEngravImg: string;
  color: string;
  SecondryColor: null | string;
  AttributeDetailOrder: number;
  is_checked?: number;  // Added for runtime selection state
  is_show?: number;
  singleToneStart?: number;
  doubleToneStart?: number;
}

export interface Product {
  ProductId: number;
  ProductSKU: string;
  parent_sku: string;
  CoreSku: string;
  IsEngravable: number;
  IsMatchingBand: number;
  ProductName: string;
  Description: string;
  Price: string;
  CategoryId: number;
  CategoryName: string;
  ArticleId: number;
  IncrementalFactor: string;
  ArticleName: string;
  CountryId: number;
  productDetails: any[];
  ConfigAttribs: ConfigAttrib[];
  fileDetails: FileDetail[];
  productPrice: string;
  configurable_attribute?: Attribute[];  // Added for runtime configuration attributes
}

export interface FileDetail {
  ImageId: number;
  ItemId: number;
  ItemType: string;
  FileType: string;
  Uri: string;
  ImageViewId: number;
  Mimetype: string;
  IsActive: number;
  CreatedBy: number;
  CreatedOn: string;
  ModifiedBy: number;
  is_show?: number;
  ModifiedOn: string;
  ImageViewName: string | '';
  ImageViewOrder: null | number;
}

export interface ConfigAttrib {
  id: number;
  pid: number;
  [key: string]: number;
}

export interface Category {
  CategoryId: number;
  CategoryName: string;
  ArticleId: number;
  is_select?: number;  // Added for runtime selection state
}

export interface SkuSelectedAttribute {
  atrId: number;
  atrDetailId: number;
}

export interface SelectedAttributeDetail {
  AttributeId: number;
  AttributeDetailId: number;
  AttributeOrder: any;
}

export interface PlanPrice {
  plan_id: number;
  plan_value: string;
  plan_price: number;
  plan_priceWithoutDec: number;
  is_checked: boolean;
  plan_code?: string;  // Added for plan code
}

export interface Country {
  id: number;
  code: string;
  name: string;
}

export interface SwiperConfig {
  slidesToShow: number;
  slidesToScroll: number;
  autoplay: boolean;
  autoplaySpeed: number;
  infinite: boolean;
  responsive: SwiperResponsiveConfig[];
}

export interface SwiperResponsiveConfig {
  breakpoint: number;
  settings: {
    slidesToShow: number;
  };
}

export interface ShapeAttributeDetail {
  AttributeDetailId: number;
  AttributeId: number;
  is_checked: number;
}

export interface SimilarProduct {
  ProductId: number;
  ProductName: string;
  Price: string;
  fileDetails: FileDetail[];
}

export interface MatchingBandProduct {
  ProductId: number;
  ProductName: string;
  fileDetails: FileDetail[];
  MatchingBandProductId: number;
  is_checked?: number;  // Added for runtime selection state
}
