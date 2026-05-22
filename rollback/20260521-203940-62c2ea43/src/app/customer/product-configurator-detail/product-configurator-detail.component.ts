import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  LOCALE_ID,
  Injector,
  OnDestroy,
  ElementRef,
  QueryList,
  ViewChildren,
  HostListener,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { DOCUMENT, Location } from '@angular/common';
import { HomeService } from '../services/home.service';
import { ProductDetailsService } from '../services/product-details.service';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import * as $ from 'jquery';
import { SessionService } from 'src/app/core/service/session.service';
import { CommonService } from 'src/app/core/service/common.service';
import { BroadCasterService } from 'src/app/core/service/broad-caster.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';
import { LoaderService } from 'src/app/core/service/loader.service';
import { RingSizePopUpComponent } from '../ring-size-pop-up/ring-size-pop-up.component';
import { register } from 'swiper/element/bundle';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  AttributeMap,
  AttributeListStepRequest,
  Attribute,
  Product,
  Category,
  SkuSelectedAttribute,
  PlanPrice,
  Country,
  AttributeDetail,
  SelectedAttributeDetail,
  SelectedAttrRequest,
} from './configuration.model';
register();
declare const gtag: Function;
@Component({
  selector: 'app-product-configurator-detail',
  templateUrl: './product-configurator-detail.component.html',
  styleUrls: ['./product-configurator-detail.component.scss'],
})
export class ProductConfiguratorDetailComponent implements OnInit, OnDestroy {
  @ViewChildren('swiperEl') swiperEls!: QueryList<ElementRef>;
  private initializedSwipers = new Set<ElementRef>();
  zoom_state: number = 0;
  show_scroll_top: boolean = false;
  is_compare_disable: boolean = false;
  currentImage: number = 0;
  currentSteap: number = 3;
  categoryId: number = 22;
  loadAPI!: Promise<any>;
  attributesList: Attribute[] = [];
  previewImageSrc: string = '';
  zoomImageSrc: string = '';
  defult_prodct_band_image: string = '';
  defaultImageSrc: string = '';
  slider_show: boolean = false;
  stepThreeAttributes: Attribute[] = [];
  selectedProductMap: SelectedAttributeDetail[] = [];
  selectedAttrs: any[] = [];
  is_hide: boolean = false;
  braceletsStyleGroupData: any[] = [];
  slider_image_360_degree: any[] = [];
  is_product_compare: number = 0;
  stepThreeAttributeResponse: AttributeMap[] = [];
  productDetails: Product | null = null;
  currentSliderIndex: number = 0;
  appCons: typeof AppConstants = AppConstants;
  default_currency: string = AppConstants.DEFAULT_CURRENCY;
  file_type: string = AppConstants.FILE_TYPE_IMAGE;
  imageUrl: string = '';
  categories: Category[] = [];
  productId: number = 0;
  configurableAttributes: any[] = [];
  broadCastService!: BroadCasterService;
  selectedCategoryName?: string;
  image_needs_to_be_show: number = 0;
  videoUrl: string = '';
  try_ring_on_hand: string = '';
  articleId: number = 0;
  modalService!: BsModalService;
  homeService!: HomeService;
  productDetailService!: ProductDetailsService;
  httpService!: HttpService;
  commonService!: CommonService;
  similarProductStepThreeAttributes: Attribute[] = [];
  similarStop$: Subject<boolean> = new Subject<boolean>();
  current_product_id: number = 0;
  default_image_view_id: number = 0;
  active_swiper_index: number = 0;
  height: number = 0;
  addDelayForVideoToPlay: number = 1;
  summaryItemPerColummn: number = 4;
  isCategoryCall: boolean = true;
  specialSKU: string = '';
  planPriceList: PlanPrice[] = [];
  is_wrap_text: boolean = false;
  isSkuRedirect: boolean = false;
  showRingSizeError: boolean = false;
  skuProductData: any = null;
  countryId?: number;
  skuProdSelectedAttribute: SkuSelectedAttribute[] = [];
  countryList: Country[] = [];
  isDoubleColor: boolean = false;
  defaultImageViewId: number = 0;
  summayArrtibutes: any = null;
  isHalfImage: boolean = false;
  hideTitle: boolean = false;
  selectedIndex = 0;
  cellWidth: number = 0;
  cellHeight: number = 0;
  isHorizontal: boolean = false;
  rotateFn = this.isHorizontal ? 'rotateY' : 'rotateX';
  radius: number = 0;
  theta: number = 0;
  is_slider_reset: boolean = false;
  is_smilar_call_delay: boolean = true;
  default_font: string = 'first_eng_font';
  engraving_image: string = '';
  engraving_text: string = '';
  deviceService!: DeviceDetectorService;
  is_original_product: boolean = true;
  mainProductDetails: Product | null = null;
  is_try_on_show: number = 0;
  shape_attribute_details: Attribute[] = [];
  selectedShapeDetails: any[] = [];
  is_ring_size_check: number = 0;
  ring_size_attribute_id: number = 0;
  selected_ring_size_attribute_id: number = 0;
  dropdown_ring_size_change: boolean = false;
  find_ring_size: boolean = false;
  contact_us: boolean = false;
  productIdFromUrl: number = 0;
  categoryIdFromUrl: number = 0;
  configurable_attribute: any[] = [];
  cartUrl: string = '';
  imageShowCount: number = 5;
  cartId: string = '';
  zoomControlScale: number = 1.2;
  limitZoom: number = 1.2;
  minScale: number = 1.2;
  minPanScale: number = 1.2;
  isVideoAvailable: boolean = false;
  color_theme: string = 'blue';
  attributeId: number = 0;
  targetOrigin: string = '*';
  scrolled: boolean = false;
  withOutSwipeOption: number[] = [];
  bsModalRef?: BsModalRef
  singleToneSqence: number = 0;
  doubleToneSqence: number = 0;
  isFromCat: boolean = false;
  isMobile: boolean = false;
  scrollState: 'top' | 'scrolled' = 'top';
  private similar_subscription: Subscription | undefined;
  private image_subscription: Subscription | undefined;
  private timeoutIds: any[] = [];
  private discountStartDate: string = '';
  private discountEndDate: string = '';
  private discountPercent: number = 0;
  discountPrice: number = 0;
  isDiscountAvailable: boolean = false;
  checkDiscountInterval: boolean = true;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    @Inject(LOCALE_ID) public locale: string,
    private injector: Injector,
    private location: Location,
    private loader: LoaderService,
    private breakpointObserver: BreakpointObserver,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });

    this.broadCastService = injector.get<BroadCasterService>(BroadCasterService);
    this.modalService = injector.get<BsModalService>(BsModalService);
    this.homeService = injector.get<HomeService>(HomeService);
    this.productDetailService = injector.get<ProductDetailsService>(
      ProductDetailsService
    );
    this.httpService = injector.get<HttpService>(HttpService);
    this.commonService = injector.get<CommonService>(CommonService);
    this.deviceService = injector.get<DeviceDetectorService>(
      DeviceDetectorService
    );
    this.route.queryParams.subscribe((params) => {
      if (Object.keys(params).length > 0 && 'cartId' in params) {
        this.cartId = params.cartId ? params.cartId : '';
      }
      if (Object.keys(params).length > 0 && 'categoryId' in params && 'articalId' in params) {
        this.categoryId = params.categoryId ? Number(params.categoryId) : 22;
        this.articleId = params.articalId ? Number(params.articalId) : 0;
      }
      else {
        this.cartId = '';
      }
    });
    this.route.url.subscribe(() => {
      this.categoryIdFromUrl = this.route.snapshot.params.category
        ? Number(this.route.snapshot.params.category)
        : 0;
      this.productIdFromUrl = this.route.snapshot.params.product
        ? Number(this.route.snapshot.params.product)
        : 0;
    });
  }

  ngAfterViewChecked(): void {
    // Angular-centric swiper initialization
    this.ngZone.run(() => {
      this.swiperEls.forEach((elRef) => {
        if (!this.initializedSwipers.has(elRef)) {
          const swiperEl: any = elRef.nativeElement;

          // Modern approach: let Angular event handlers manage the swiper
          if (swiperEl.swiper) {
            // Swiper is already initialized via Angular events
            this.initializedSwipers.add(elRef);
          } else {
            // Wait for swiper to initialize
            swiperEl.addEventListener('swiperinit', () => {
              this.initializedSwipers.add(elRef);
            });
          }
        }
      });
    });
  }

  /**
   * @deprecated - This method is replaced by Angular-centric swiper navigation
   * Left for backward compatibility but should not be used in new implementations
   */

  @HostListener('window:scroll', [])

  onWindowScroll(): void {
    const scrollY = window.scrollY;
    this.scrolled = scrollY > 35;
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight - 270;
    this.hideTitle = scrollPosition >= pageHeight ? true : false;

    if (!this.isMobile) return;

    if (scrollY > 0 && this.scrollState !== 'scrolled') {
      this.scrollState = 'scrolled';
      const message = { type: 'toggleMenu', showMenu: false };
      window.parent.postMessage(message, '*');
    }

    if (scrollY === 0 && this.scrollState !== 'top') {
      this.scrollState = 'top';
      const message = { type: 'toggleMenu', showMenu: true };
      window.parent.postMessage(message, '*');
    }
  }

  ngOnInit(): void {
    this.sessionService.iframeData.subscribe((product: any) => {
      if (product) {
        this.skuProductData = product;
        this.articleId = product?.ArticleId;
        this.categoryId = product?.CategoryId;
        this.isSkuRedirect = true;
      }
    })
    window.addEventListener('message', this.eventMessage.bind(this), false); // here were listening for messages from the parent window
    this.sessionService.targetOrigin.subscribe((origin: any) => {
      this.targetOrigin = origin;
    });

    this.sessionService.fromCat.subscribe((isCate: boolean) => {
      this.isFromCat = isCate;
    })
    this.httpService.getConfig().subscribe((config: any) => {
      this.addColorTheme(config.colorTheme);
      this.withOutSwipeOption = config.withOutSwipeOption;
      this.attributeId = config.AttributeId;
      this.setCategoryInSession(this.categoryId);
      this.imageUrl = config.imageUrl;
      this.is_try_on_show = config.is_try_on;
      this.cartUrl = config.cartUrl;
      this.imageShowCount = config.imageShowCount;
      this.summaryItemPerColummn = config.summaryItemPerColummn;
      this.specialSKU = config.specialSKU;
      this.countryList = config.countries;
      var url = (window.location != window.parent.location)
        ? document.referrer : document.location.href;
      const countryCode = this.extractTLD(url);
      const country: Country | undefined = countryCode ? this.countryList.find((country: Country) => country.code == countryCode.toUpperCase()) : undefined;
      if (country) {
        this.countryId = country.id;
      } else {
        this.countryId = 1;
      }
      this.broadCastService.broadcast('client_token', config.diamondAuthToken);
      this.getAllAttributes().then((_response: any) => {

        this.currentSteap = 3;
        this.getAttributeListSteps(
          this.updateFinalAttributeReques(this.selectedProductMap)
        );
      });
    });
    this.broadCastService.on('currency').subscribe((currency) => {
      if (currency) {
        this.default_currency = currency;
      } else {
        this.default_currency = AppConstants.DEFAULT_CURRENCY;
      }
    });
  }

  eventMessage(event: MessageEvent) {
    if (event.origin.includes('michaelhill.com.au') || event.origin.includes('localhost') || event.origin.includes('michaelhill')) {
      this.targetOrigin = event.origin || 'https://www.michaelhill.com.au';
    } else {
      this.targetOrigin = 'https://www.michaelhill.com.au';
    }
  }

  extractTLD(url: string): string | null {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');
      return parts[parts.length - 1].toString(); // Gets the last part (e.g., 'com', 'uk')
    } catch (error) {
      return null;
    }
  }

  checkDiscountDetails() {
    this.broadCastService.on('start_date').subscribe((start_date) => {
      this.discountStartDate = start_date;
    });
    this.broadCastService.on('end_date').subscribe((end_date) => {
      this.discountEndDate = end_date;
    });
    this.broadCastService
      .on('discount_percent')
      .subscribe((discount_percent) => {
        this.discountPercent = discount_percent > 0 ? discount_percent : 0;
      });
  }

  setProductSkuDataInSelectedAttribute(ConfigAttribs: any) {
    let skuProdCombination = ConfigAttribs.map(({ id, atr_26, atr_27, atr_29, pid, ...rest }: { id: any;[key: string]: any }) => rest);
    this.skuProdSelectedAttribute = Object.entries(skuProdCombination[0])
      .map(([key, value]) => {
        const atrId = parseInt(key.split('_')[1], 10);
        return { atrId, atrDetailId: value as number };
      })
      .sort((a, b) => a.atrId - b.atrId);
  }


  playAudio() {
    let audio = new Audio();
    audio.src = 'assets/front/audio/slide_audio.mp3';
    audio.load();
    audio.play();
  }
  // TO GET ALL CATEGORIES
  getCategories() {
    let request = {
      articleId: this.articleId,
      page: 0,
      perPage: 0,
    };
    this.homeService.getCategoryList(request).subscribe((response: any) => {
      if (
        response &&
        response.type == AppConstants.success &&
        response.data &&
        response.data.length > 0
      ) {
        let category_index = response?.data?.findIndex(
          (category_data: any) =>
            category_data.CategoryId == this.categoryIdFromUrl
        );
        this.isCategoryCall = false;
        response?.data?.forEach((element: any) => {
          element['is_select'] = 0;
          element.Image = element?.Image
            ? this.imageUrl +
            AppConstants.CATEGORY_IMAGE_FOLDER_NAME +
            element?.Image
            : '';
        });
        response.data[category_index > -1 ? category_index : 0][
          'is_select'
        ] = 1;
        this.categoryId =
          response.data[category_index > -1 ? category_index : 0].CategoryId;
        this.selectedCategoryName =
          response.data[category_index > -1 ? category_index : 0].CategoryName;
        this.categories = response?.data;
        this.setCategoryInSession(this.categoryId);
      } else {
        this.categories = [];
      }
    });
  }

  public loadScript() {
    if (document.getElementById('support-script')) {
      let myobj = document.getElementById('support-script') as HTMLScriptElement;
      myobj.src = 'assets/js/script.js';
      document.body.appendChild(myobj);
    } else {
      let node = document.createElement('script');
      node.src = 'assets/js/script.js';
      node.type = 'text/javascript';
      node.async = false;
      node.id = 'support-script';
      document.getElementsByTagName('body')[0].appendChild(node);
    }
  }
  // FOR GET IMAGE INDEX OF 360 DEGREE SLIDER
  changeImage(index: any) {
    this.currentImage = index;
    const $this = this;
    $('.list img').each(function (_index) {
      if ($this.currentImage == _index) {
        $('.list li').eq(_index).show().siblings().hide();
      }
    });
  }

  // GET ALL DATA COMBINATION ACCORDING STEP
  getAttributeListSteps(selected_attributes: SelectedAttrRequest[], check_size?: number) {
    return new Promise((resolve) => {
      let selectedAttrs = this.isSkuRedirect
        ? selected_attributes?.filter((item: any) => !AppConstants.RING_ATTRIBUTES.includes(item.attrId))
        : selected_attributes;

      let dropdownAttr: any[] = [];

      if (this.isSkuRedirect) {
        dropdownAttr = selected_attributes?.filter((item: any) => AppConstants.RING_ATTRIBUTES.includes(item.attrId));
      } else if (check_size === 1) {
        dropdownAttr = this.checkRingSizeAvailable(this.selectedProductMap);
      }

      let request: AttributeListStepRequest = {
        articleId: this.articleId,
        categoryId: this.categoryId,
        step: this.currentSteap,
        countryId: this.countryId!,
        selectedAttrs: selectedAttrs,
        dropdownAttr: dropdownAttr,
      };
      this.homeService.fetchAttributeListSteps(request)
        .subscribe((response) => {
          if (
            response &&
            response.type == AppConstants.success &&
            response?.data &&
            response?.data?.attributes &&
            response?.data?.attributes.length > 0
          ) {
            if (check_size == 1) {
              resolve(response);
            } else {
              this.filterAttributesAccordingStep(this.attributesList);
              this.stepThreeAttributeResponse = response?.data?.attributes;
              if (this.isSkuRedirect) {
                this.setProductSkuDataInSelectedAttribute(this.skuProductData.ConfigAttribs);
              }
              this.updateStepAttribute(
                this.stepThreeAttributes,
                this.selectedProductMap,
                this.stepThreeAttributeResponse,
                1
              );
              // Angular-centric: Scroll selected attributes into view after attributes are loaded
              // This ensures pre-selected attributes are visible when component loads
              setTimeout(() => {
                this.scrollAllSelectedAttributesIntoView();
              }, 300);
            }
          }
        });
    });
  }

  checkListStepsData(response: any) {
    if (
      this.ring_size_attribute_id > 0 &&
      this.selected_ring_size_attribute_id > 0
    ) {
      let expression: any[] = [];
      expression.push({
        key: 'atr_' + this.ring_size_attribute_id,
        operation: 'equal',
        value: this.selected_ring_size_attribute_id,
      });
      const attributeFound = response?.data?.attributes?.filter((item: any) =>
        expression.every((expr: any) =>
          AppConstants.evaluateExpression(expr, item)
        )
      );
      if (attributeFound?.length > 0) {
        let ring_size = this.stepThreeAttributes.find(
          (element: any) => element.AttributeId == this.ring_size_attribute_id
        );
        let findInSelectedAttribute = this.selectedProductMap.findIndex(
          (attribute: any) =>
            attribute.AttributeId == this.ring_size_attribute_id
        );
        if (findInSelectedAttribute == -1) {
          this.selectedProductMap.push({
            AttributeId: this.ring_size_attribute_id,
            AttributeDetailId: this.selected_ring_size_attribute_id,
            AttributeOrder: ring_size?.AttributeOrder,
          });

        } else {
          this.selectedProductMap[
            findInSelectedAttribute
          ].AttributeDetailId = this.selected_ring_size_attribute_id;
        }

        this.setRingSizeDropDown(response);
      } else {
        this.setRingSizeDropDown(response);
      }
    } else {
      if (
        this.checkRingSizeAvailable(this.selectedProductMap).length > 0
      ) {
        this.ring_size_attribute_id = this.checkRingSizeAvailable(
          this.selectedProductMap
        )[0].attrId;

        this.setRingSizeDropDown(response);
      }
    }
  }

  setRingSizeDropDown(response: any) {
    let ring_size = this.stepThreeAttributes.find(
      (element: any) =>
        element.AttributeId == this.ring_size_attribute_id

    );
    if (ring_size?.attributeDetails && ring_size?.attributeDetails.length > 0) {
      ring_size.attributeDetails.forEach((element: any) => {
        element.is_checked = 0;
        let ring_size_index = response.data.attributes.findIndex(
          (sub_element: any) =>
            element.AttributeDetailId ==
            sub_element['atr_' + this.ring_size_attribute_id]
        );
        if (ring_size_index !== -1) {
          element.is_show = 1;
        } else {
          element.is_show = 0;
        }
      });
      this.getProductDetail();
    }
  }

  updateRingSizeAvailabilty(
    available_ring_size: any,
    all_ring_size: any,
    attributeId: any,
    attributeOrder: any
  ) {
    all_ring_size.forEach((element: any) => {
      let ring_size = available_ring_size.findIndex(
        (sub_element: any) =>
          element.AttributeDetailId == sub_element['atr_' + attributeId]
      );
      if (ring_size !== -1) {
        element.is_show = 1;
      }
    });
  }

  // GET ALL ATTRIBUTE MASTER
  getAllAttributes() {
    return new Promise((resolve) => {
      let attribute_request = {
        attributeId: 0,
        articleId: this.articleId,
      };
      this.productDetailService
        .getAllAttributeList(attribute_request)
        .subscribe((response) => {
          if (response && response.type == AppConstants.success) {
            this.attributesList = response?.data?.attributes;
            this.attributesList?.forEach((element: Attribute) => {
              if (element.IsConfigurable == 1) {
                this.configurableAttributes.push(element);
              }
              element.attributeDetails = element?.attributeDetails?.filter(
                (sub_element: any) => sub_element.AttributeDetailValue !== "NA"
              );
              element?.attributeDetails?.forEach((sub_element: any) => {
                sub_element['is_checked'] = 0;
                sub_element['is_show'] = 0;
                sub_element.AttributeDetailImage =
                  sub_element?.AttributeDetailImage
                    ? this.imageUrl +
                    AppConstants.ATTRIBUTE_IMAGE_FOLDER_NAME +
                    sub_element?.AttributeDetailImage
                    : '';
                if (element.AttributeName.toLowerCase() == AppConstants.METAL_COLOR) {
                  if (sub_element.color && !sub_element.SecondryColor && this.singleToneSqence == 0) {
                    sub_element.singleToneStart = 1;
                    this.singleToneSqence = 1;
                  }
                  if (sub_element.color && sub_element.SecondryColor && this.doubleToneSqence == 0) {
                    sub_element.doubleToneStart = 1;
                    this.doubleToneSqence = 1;
                    this.isDoubleColor = true
                  }
                }
                if (sub_element.AttributeDetailValue == "NA") {

                }
              });
            });
            resolve(this.attributesList);
          }
        });
    });
  }

  // CHANGE CATEGORT IF HAVE MULTIPLE OPTION
  changeCategory(categoryId: any, is_similar: any) {
    this.categories.map((res: any) => {
      res.is_select = 0;
    });
    let category = this.categories.findIndex(
      (cat: any) => cat.CategoryId == categoryId
    );
    if (category > -1) {
      this.categories[category].is_select = 1;
      this.selectedCategoryName = this.categories[category].CategoryName;
      this.categoryId = categoryId;
      this.setCategoryInSession(this.categoryId);
      if (!is_similar) {
        this.dropdown_ring_size_change = false;
        this.currentSteap = 3;
      }
    }
  }

  getAttributeBySteps(attributeData: any, key: any) {
    // COMMENTED OUT - SAFE APPROACH: Step one/two functionality removed
    // key.forEach((element: any, index: any) => {
    //   let attribute_id = element.split('_')[1];
    //   let attributeObj = attributeData.find(
    //     (attribute: any) => attribute.AttributeId == attribute_id
    //   );
    //   if (this.currentSteap == 1) {
    //     this.stepOneAttributes.push(attributeObj);
    //   }
    // });
  }

  // MASTER DATA ITERATOR FOR UPDATE STEP ONE ATTRIBUTE DATA FOR SELECTION
  updateStepAttribute(
    stepAttributes: any,
    stepSelectedAttribute: any,
    stepSelectedAttributeResponse: any,
    check_ring_size?: any
  ) {
    stepAttributes?.forEach((element: any, index: any) => {
      if (
        !(
          this.ring_size_attribute_id > 0 &&
          element.AttributeId == this.ring_size_attribute_id
        )
      ) {
        this.updateAllAttributeDetails(
          element,
          stepSelectedAttribute,
          stepSelectedAttributeResponse,
          index
        );
      }
    });
    if (this.currentSteap == 3) {
      this.updateProductDetails(check_ring_size);
    }
    this.isSkuRedirect = false;
  }

  updateAllAttributeDetails(
    element: any,
    stepSelectedAttribute: any,
    stepSelectedAttributeResponse: any,
    index: any
  ) {
    element.attributeDetails.forEach((sub_element: any, sub_index: any) => {
      sub_element.is_show = this.showAttribute(
        element.AttributeId,
        sub_element.AttributeDetailId,
        element.AttributeOrder,
        element.attributeDetails.length,
        stepSelectedAttribute,
        stepSelectedAttributeResponse
      );
      if (!sub_element.is_show) {
        if (
          document.getElementById(
            sub_element.AttributeDetailId + '_' + sub_index + '_' + index
          )
        ) {
          let radio = document.getElementById(
            sub_element.AttributeDetailId + '_' + sub_index + '_' + index
          ) as HTMLInputElement;
          if (radio) radio.checked = false;
        }
      } else if (sub_element.is_checked == 1) {
        if (
          document.getElementById(
            sub_element.AttributeDetailId + '_' + sub_index + '_' + index
          )
        ) {
          let radio = document.getElementById(
            sub_element.AttributeDetailId + '_' + sub_index + '_' + index
          ) as HTMLInputElement;
          if (radio) radio.checked = true;
        }
      }

      if (sub_index == element.attributeDetails.length - 1) {
        this.checkAttributeValueNotChecked(element);
      }
    });
  }

  updateProductDetails(check_ring_size?: any) {
    if (check_ring_size == 0) {
      this.getProductDetail();
    } else {
      if (this.ring_size_attribute_id > 0) {
        let ring_size = this.selectedProductMap.findIndex(
          (element: any) => element.AttributeId == this.ring_size_attribute_id
        );
        if (ring_size > -1) {
          this.selectedProductMap.splice(ring_size, 1);

        }
      }
      let finalSelectedAttribute = [...this.selectedProductMap];
      this.getAllRingSizeAttributes(
        this.isSkuRedirect ? this.updateSkuAttributeRequest(this.skuProductData.ConfigAttribs[0], 0) : this.updateFinalAttributeReques(finalSelectedAttribute)
      );
    }
  }

  updateSkuAttributeRequest(selectedAttrs: any, type: number) {
    let selAttri = Object.keys(selectedAttrs)?.filter((key) => key.includes('atr_'));
    let arr: { attrId: number; attrDtl: number; }[] = [];
    selAttri.forEach(item => {
      arr.push({ attrId: Number(item.split('_')[1]), attrDtl: selectedAttrs[item] })
    });
    return type == 0 ? arr : arr?.filter((item: any) => !this.appCons.RING_ATTRIBUTES.includes(item.attrId))
  }

  // TO CHECK ATTRIBUTE VALUE ARE CECKED OR NOT FOR STEP ONE
  checkAttributeValueNotChecked(attributes: any) {
    let index = attributes.attributeDetails.findIndex(
      (attribute_detail: any) => attribute_detail.is_checked == 1
    );
    if (index == -1) {
      let avilableAttribute = attributes.attributeDetails?.filter(
        (attribute: any) => attribute.is_show
      );

      if (avilableAttribute && avilableAttribute.length > 0) {
        avilableAttribute[0].is_checked = 1;
        this.selectedProductMap.push({
          AttributeId: avilableAttribute[0].AttributeId,
          AttributeDetailId: avilableAttribute[0].AttributeDetailId,
          AttributeOrder: attributes.AttributeOrder,
        });
      }
    }
  }

  // FOR CHECK ATTRIBUTE VALUE ARE AVAILABVLE OR NOT ACCORDING PARENT ATTRIBUTE SELECTION COMBINATION WITH STEP DATA.
  showAttribute(
    attributeId: any,
    atttributeDetailId: any,
    attributeOrder: any,
    attributeDetailLength: any,
    stepSelectedAttribute: any,
    selectedStepAttributeResponse: any
  ): boolean {
    if (!stepSelectedAttribute || stepSelectedAttribute.length === 0) {
      return this.handleNoStepSelected(attributeId, atttributeDetailId, selectedStepAttributeResponse);
    }

    const expression = this.buildExpression(stepSelectedAttribute, attributeId, attributeOrder, atttributeDetailId);
    const attributeFound = this.findMatchingAttribute(selectedStepAttributeResponse, expression);

    if (attributeFound.length > 0) {
      if (this.isSkuRedirect) {
        const atrDetailId = this.getSkuProdAttributeDetailId(attributeId);
        this.updateFoundAttributes(attributeId, atrDetailId);
      } else {
        this.updateFoundAttributes(attributeId, atttributeDetailId);
      }
      return true;
    } else {
      this.unselectAttributeValueByAttributeId(attributeId, atttributeDetailId);
      return false;
    }
  }

  private buildExpression(
    stepSelectedAttribute: any[],
    attributeId: any,
    attributeOrder: any,
    atttributeDetailId: any
  ): any[] {
    const expression = stepSelectedAttribute
      .filter((element) => element.AttributeOrder < attributeOrder)
      .map((element) => ({
        key: 'atr_' + element.AttributeId,
        operation: 'equal',
        value: element.AttributeDetailId,
      }));

    expression.push({
      key: 'atr_' + attributeId,
      operation: 'equal',
      value: atttributeDetailId,
    });

    return expression;
  }

  private findMatchingAttribute(response: any[], expression: any[]): any[] {
    return response?.filter((item) =>
      expression.every((expr) =>
        AppConstants.evaluateExpression(expr, item)
      )
    );
  }

  private handleNoStepSelected(attributeId: any, atttributeDetailId: any, response: any[]): boolean {
    const index = response.findIndex(
      (attribute) => attribute['atr_' + attributeId] === atttributeDetailId
    );

    if (index > -1) {
      if (this.isSkuRedirect) {
        const atrDetailId = this.getSkuProdAttributeDetailId(attributeId);
        this.selectedAttributeValueByAttributeId(attributeId, atrDetailId);
      } else {
        this.selectedAttributeValueByAttributeId(attributeId, atttributeDetailId);
      }
      this.getSelectedAttributeValue(attributeId);
      return true;
    } else {
      this.unselectAttributeValueByAttributeId(attributeId, atttributeDetailId);
      return false;
    }
  }

  private getSkuProdAttributeDetailId(attributeId: any): any {
    return this.skuProdSelectedAttribute.find(x => x.atrId === attributeId)?.atrDetailId;
  }

  updateFoundAttributes(attributeId: any, atttributeDetailId: any) {
    if (this.productId > 0) {
      this.setDefaultSelectedAttribute();
    } else {
      this.selectedAttributeValueByAttributeId(attributeId, atttributeDetailId);
      this.getSelectedAttributeValue(attributeId);
    }
  }

  setDefaultSelectedAttribute() {
    this.setDefultAttributeForStepThree();
  }

  setDefultAttributeForStepThree() {
    this.selectedProductMap.forEach((element: any) => {

      let attribute_index = this.stepThreeAttributes.findIndex(
        (attribute: any) => attribute.AttributeId == element.AttributeId
      );
      if (attribute_index > -1) {
        let attribute_detail_Index = this.stepThreeAttributes[
          attribute_index
        ].attributeDetails.findIndex(
          (attribute_detail: any) =>
            attribute_detail.AttributeDetailId == element.AttributeDetailId
        );
        if (attribute_detail_Index > -1) {
          this.stepThreeAttributes[attribute_index].attributeDetails[
            attribute_detail_Index
          ].is_checked = 1;
        }
      }
    });
  }
  // RETUTN FOR IF ANY ATTRIBUTE HAVE AT LEAST ONE ATTRIBUTE SELETED
  getCheckedAttribute(attributeDetail: any) {
    let is_checked: boolean = false;
    for (const iterator of attributeDetail) {
      is_checked = iterator.is_checked == 1 || iterator.is_show == 1 ? true : false;

      if (is_checked) {
        break;
      }
    }

    return is_checked;
  }

  // FOR CHANGE ANY ATTRIBUTE
  changeAtrribute(
    attributeId: number,
    attributeDetailId: number,
    stepAttributes: Attribute[],
    stepSelectedAttributes: SelectedAttributeDetail[],
    check_ring_size?: number
  ) {
    this.updateImageViewIdAccordingToAttributeSelection(attributeId);

    stepAttributes.forEach((attribute) => {
      if (attribute.AttributeId == attributeId) {
        attribute.attributeDetails.forEach((attributeDetail) => {
          if (attributeDetail.AttributeDetailId == attributeDetailId) {
            attributeDetail.is_checked = 1;
            stepSelectedAttributes.push({
              AttributeId: attributeDetail.AttributeId,
              AttributeDetailId: attributeDetail.AttributeDetailId,
              AttributeOrder: attribute.AttributeOrder,
            });
          } else {
            let attributeFound = stepSelectedAttributes.findIndex(
              (x) =>
                x.AttributeDetailId == attributeDetail.AttributeDetailId
            );
            if (attributeFound > -1) {
              stepSelectedAttributes.splice(attributeFound, 1);
            }
            attributeDetail.is_checked = 0;
          }
        });
      }
    });

    this.updateStepAttribute(
      stepAttributes,
      stepSelectedAttributes,
      this.stepThreeAttributeResponse,
      check_ring_size
    );

    // This handles cases where attribute dependencies affect visibility
    setTimeout(() => {
      this.scrollAllSelectedAttributesIntoView();
    }, 200);

    setTimeout(() => {
      this.swiperEls.forEach((elRef) => {
        const swiperEl = elRef.nativeElement;
        const swiper = swiperEl?.swiper;

        if (swiper) {
          swiper.update(); // recalculate slide size and position

          const parent = swiperEl.closest('.swiper-wrapper-parent');
          const prevBtn = parent?.querySelector('.swiper-button-prev-custom') as HTMLElement;
          const nextBtn = parent?.querySelector('.swiper-button-next-custom') as HTMLElement;

          this.updateNavButtons(swiper, prevBtn, nextBtn); // refresh nav button state
        }
      });
    }, 50); // Delay ensures DOM is updated
  }

  private updateNavButtons(swiper: any, prevBtn: HTMLElement, nextBtn: HTMLElement): void {
    if (!swiper || swiper.slides.length === 0) return;

    if (swiper.isBeginning) {
      prevBtn.setAttribute('disabled', 'true');
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.removeAttribute('disabled');
      prevBtn.classList.remove('disabled');
    }

    if (swiper.isEnd) {
      nextBtn.setAttribute('disabled', 'true');
      nextBtn.classList.add('disabled');
    } else {
      nextBtn.removeAttribute('disabled');
      nextBtn.classList.remove('disabled');
    }
  }

  /**
   * Angular-centric method to scroll selected attribute into view within its specific swiper
   */
  scrollToSelectedSlideItemIntoView(slideIndex: number, attributeId: number): void {
    // Enhanced validation using Angular patterns
    if (slideIndex < 0 || !attributeId) {
      console.warn('Invalid slideIndex or attributeId for scrolling:', { slideIndex, attributeId });
      return;
    }

    this.ngZone.run(() => {
      // Try multiple approaches to find the swiper with Angular-friendly fallbacks
      let swiperInstance = this.findSwiperInstance(attributeId);

      if (swiperInstance) {
        this.scrollSlideInSpecificSwiperWithValidation(swiperInstance, slideIndex, attributeId);
      } else {
        // If swiper not found immediately, try again after a short delay
        // This handles cases where swipers are still initializing
        setTimeout(() => {
          swiperInstance = this.findSwiperInstance(attributeId);
          if (swiperInstance) {
            this.scrollSlideInSpecificSwiperWithValidation(swiperInstance, slideIndex, attributeId);
          } else {
            console.warn('Swiper instance not found after retries for attributeId:', attributeId);
          }
        }, 500);
      }
    });
  }

  /**
   * Angular method to find swiper instance with multiple fallback strategies
   */
  private findSwiperInstance(attributeId: number): any {
    // Strategy 1: Find by data attribute (most reliable)
    const swiperSelector = `swiper-container[data-attribute-id="${attributeId}"]`;
    const swiperElement = document.querySelector(swiperSelector) as HTMLElement & { swiper: any };

    if (swiperElement && swiperElement.swiper) {
      return swiperElement.swiper;
    }
    return null;
  }

  /**
   * Angular-enhanced method to scroll with additional validation and error handling
   */
  private scrollSlideInSpecificSwiperWithValidation(swiper: any, slideIndex: number, attributeId: number): void {
    if (!swiper) {
      console.warn('Invalid swiper instance for attributeId:', attributeId);
      return;
    }

    // Additional validation: ensure swiper is ready and has slides
    if (!swiper.slides || swiper.slides.length === 0) {
      console.warn('Swiper has no slides for attributeId:', attributeId);
      return;
    }

    // Validate slideIndex is within bounds
    if (slideIndex >= swiper.slides.length) {
      console.warn('SlideIndex out of bounds:', { slideIndex, totalSlides: swiper.slides.length, attributeId });
      // Try to scroll to the last slide instead
      slideIndex = swiper.slides.length - 1;
    }

    // Call the enhanced scrolling method
    this.scrollSlideInSpecificSwiper(swiper, slideIndex);
  }

  /**
   * Angular-centric method to scroll to specific slide in a swiper instance
   */
  private scrollSlideInSpecificSwiper(swiper: any, slideIndex: number): void {
    // Angular-style validation
    if (!swiper || !swiper.slides || slideIndex < 0) {
      console.warn('Invalid swiper or slideIndex:', { swiper: !!swiper, slidesCount: swiper?.slides?.length, slideIndex });
      return;
    }

    // Ensure slideIndex is within bounds (Angular safety pattern)
    const maxSlideIndex = swiper.slides.length - 1;
    const safeSlideIndex = Math.min(slideIndex, maxSlideIndex);

    const slideToShow = swiper.slides[safeSlideIndex];
    if (!slideToShow) {
      console.warn('Slide not found at safe index:', safeSlideIndex);
      return;
    }

    // Get swiper container and slide positions using Angular-friendly approach
    const swiperContainer = swiper.el;
    const containerRect = swiperContainer.getBoundingClientRect();
    const slideRect = slideToShow.getBoundingClientRect();

    // Check if slide is fully visible using Angular-style boolean logic
    const isFullyVisible = slideRect.left >= containerRect.left &&
      slideRect.right <= containerRect.right;

    if (!isFullyVisible) {
      // Calculate optimal slide position using Angular mathematical patterns
      let targetIndex = safeSlideIndex;

      // Smart positioning logic for better UX
      if (slideRect.right > containerRect.right) {
        // Slide is cut off on the right - calculate best starting position
        const slidesPerView = Math.floor(containerRect.width / slideRect.width) || 1;
        targetIndex = Math.max(0, safeSlideIndex - slidesPerView + 1);
      } else if (slideRect.left < containerRect.left) {
        // Slide is cut off on the left - show from the selected slide
        targetIndex = safeSlideIndex;
      }

      // Perform smooth slide animation using Angular-friendly duration
      swiper.slideTo(targetIndex, 300); // 300ms for smooth UX

      // Update Angular component state after animation completes
      setTimeout(() => {
        const attributeId = parseInt(swiperContainer.getAttribute('data-attribute-id') || '0');
        if (attributeId) {
          this.updateSwiperState(swiper, attributeId);
          // Trigger Angular change detection if needed
          this.cdr.markForCheck();
        }
      }, 350); // Slightly longer than animation for safety
    }
  }

  private swiperStates = new Map<number, any>();
  @ViewChild('attributeWithImageTemplate', { static: true }) attributeWithImageTemplate!: ElementRef;
  @ViewChild('attributeWithoutImageTemplate', { static: true }) attributeWithoutImageTemplate!: ElementRef;
  @ViewChild('stoneAttributeTemplate', { static: true }) stoneAttributeTemplate!: ElementRef;

  /**
   * Angular-centric swiper initialization
   */
  onSwiperInit(swiper: any, attributeId: number): void {
    this.ngZone.run(() => {
      this.swiperStates.set(attributeId, {
        instance: swiper,
        isBeginning: true,
        isEnd: false,
        activeIndex: 0
      });

      // Angular-centric: Configure swiper for CSS-based gaps
      this.configureSwiperForCSSGaps(swiper);

      // Update initial state
      this.updateSwiperState(swiper, attributeId);

      // Update navigation button states
      this.updateNavigationButtonStates(attributeId, swiper);

      // Angular-centric: Check if this swiper has a selected attribute and scroll to it
      setTimeout(() => {
        const attribute = this.stepThreeAttributes?.find((attr: any) =>
          attr.AttributeId === attributeId
        );
        if (attribute) {
          this.findAndScrollToSelectedSlideItemIntoView(attribute);
        }
      }, 200);

      // Broadcast initialization
      this.broadCastService?.broadcast('swiper_initialized', {
        attributeId,
        swiper
      });
    });
  }

  /**
   * Angular method to configure swiper for CSS-managed gaps instead of space-between attribute
   */
  private configureSwiperForCSSGaps(swiper: any): void {
    if (!swiper) return;

    try {
      // Angular-centric: Ensure swiper works properly with CSS gaps
      // Override any existing spaceBetween settings
      if (swiper.params) {
        swiper.params.spaceBetween = 0; // Let CSS handle the spacing
      }

      // Angular: Update swiper configuration
      swiper.update();

      // Angular: Ensure proper slide sizing with CSS gaps
      this.adjustSlideSizingForCSSGaps(swiper);

    } catch (error) {
      console.warn('Angular swiper CSS gap configuration warning:', error);
    }
  }

  /**
   * Angular method to adjust slide sizing for CSS-managed gaps
   */
  private adjustSlideSizingForCSSGaps(swiper: any): void {
    if (!swiper || !swiper.slides) return;

    try {
      // Angular: Recalculate slide positions accounting for CSS gaps
      swiper.slides.forEach((slide: HTMLElement, index: number) => {
        // Ensure CSS gap classes are applied
        slide.classList.add('angular-css-gap-slide');

        // Mark last slide for CSS targeting
        if (index === swiper.slides.length - 1) {
          slide.classList.add('angular-last-slide');
        }
      });

      // Angular: Force update after CSS class changes
      setTimeout(() => {
        swiper.update();
        swiper.updateSize();
        swiper.updateSlides();
      }, 50);

    } catch (error) {
      console.warn('Angular slide sizing adjustment warning:', error);
    }
  }

  /**
   * Angular-reactive method to update swiper gaps based on conditions
   */
  updateSwiperGapsForResponsive(): void {
    this.ngZone.run(() => {
      this.swiperStates.forEach((state, attributeId) => {
        if (state.instance) {
          this.adjustSwiperGapForScreenSize(state.instance, attributeId);
        }
      });
    });
  }

  /**
   * Angular method to adjust swiper gap based on screen size
   */
  private adjustSwiperGapForScreenSize(swiper: any, attributeId: number): void {
    if (!swiper) return;

    const swiperContainer = swiper.el;
    if (!swiperContainer) return;

    // Angular-reactive: Adjust based on screen width
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 768;

    // Apply Angular-managed CSS classes based on screen size
    if (isMobile) {
      swiperContainer.classList.add('angular-mobile-gap');
      swiperContainer.classList.remove('angular-desktop-gap');
    } else {
      swiperContainer.classList.add('angular-desktop-gap');
      swiperContainer.classList.remove('angular-mobile-gap');
    }

    // Force swiper update to recalculate with new gap settings
    setTimeout(() => {
      swiper.update();
    }, 100);
  }

  /**
   * Handle slide change events
   */
  onSlideChange(swiper: any, attributeId: number): void {
    this.ngZone.run(() => {
      this.updateSwiperState(swiper, attributeId);

      // Update active swiper index
      this.active_swiper_index = swiper.activeIndex;

      // Update navigation button states
      this.updateNavigationButtonStates(attributeId, swiper);

      // Trigger change detection
      this.cdr.markForCheck();
    });
  }

  /**
   * Handle reaching beginning of swiper
   */
  onReachBeginning(swiper: any, attributeId: number): void {
    this.ngZone.run(() => {
      this.updateSwiperState(swiper, attributeId);
      this.updateNavigationButtonStates(attributeId, swiper);
    });
  }

  /**
   * Handle reaching end of swiper
   */
  onReachEnd(swiper: any, attributeId: number): void {
    this.ngZone.run(() => {
      this.updateSwiperState(swiper, attributeId);
      this.updateNavigationButtonStates(attributeId, swiper);
    });
  }

  /**
   * Update swiper state for navigation buttons
   */
  private updateSwiperState(swiper: any, attributeId: number): void {
    const state = this.swiperStates.get(attributeId);
    if (state) {
      state.isBeginning = swiper.isBeginning;
      state.isEnd = swiper.isEnd;
      state.activeIndex = swiper.activeIndex;
      state.instance = swiper;
    }
  }

  /**
   * Angular-centric swiper navigation with fallback
   */
  navigateSwiper(direction: 'prev' | 'next', attributeId: number): void {
    // First try to get from swiperStates
    const state = this.swiperStates.get(attributeId);

    if (state?.instance) {
      this.ngZone.run(() => {
        if (direction === 'prev') {
          state.instance.slidePrev(300);
        } else {
          state.instance.slideNext(300);
        }
      });
      return;
    }

    // Fallback: Find swiper by attribute data
    this.ngZone.run(() => {
      const swiperContainer = document.querySelector(`[data-attribute-id="${attributeId}"] swiper-container`) as any;

      if (swiperContainer?.swiper) {
        if (direction === 'prev') {
          swiperContainer.swiper.slidePrev(300);
        } else {
          swiperContainer.swiper.slideNext(300);
        }

        // Update button states after navigation
        setTimeout(() => {
          this.updateNavigationButtonStates(attributeId, swiperContainer.swiper);
        }, 350);
      }
    });
  }

  /**
   * Get swiper state with fallback to DOM query
   */
  getSwiperState(attributeId: number): any {
    // First check swiperStates
    const state = this.swiperStates.get(attributeId);
    if (state) {
      return state;
    }

    // Fallback: Get current state from DOM
    const swiperContainer = document.querySelector(`[data-attribute-id="${attributeId}"] swiper-container`) as any;

    if (swiperContainer?.swiper) {
      const swiper = swiperContainer.swiper;
      return {
        isBeginning: swiper.isBeginning || false,
        isEnd: swiper.isEnd || false,
        activeIndex: swiper.activeIndex || 0,
        instance: swiper
      };
    }

    // Default fallback state
    return {
      isBeginning: true,
      isEnd: false,
      activeIndex: 0
    };
  }

  /**
   * Update navigation button states manually
   */
  private updateNavigationButtonStates(attributeId: number, swiper: any): void {
    const navContainer = document.querySelector(`[data-swiper-id="${attributeId}"]`);
    if (!navContainer) return;

    const prevBtn = navContainer.querySelector('.swiper-button-prev-custom') as HTMLButtonElement;
    const nextBtn = navContainer.querySelector('.swiper-button-next-custom') as HTMLButtonElement;

    if (prevBtn) {
      prevBtn.disabled = swiper.isBeginning;
      if (swiper.isBeginning) {
        prevBtn.classList.add('disabled');
      } else {
        prevBtn.classList.remove('disabled');
      }
    }

    if (nextBtn) {
      nextBtn.disabled = swiper.isEnd;
      if (swiper.isEnd) {
        nextBtn.classList.add('disabled');
      } else {
        nextBtn.classList.remove('disabled');
      }
    }

    // Hide both buttons if there's only one slide
    if (swiper.isBeginning && swiper.isEnd && swiper.slides.length <= 1) {
      prevBtn?.classList.add('d-none');
      nextBtn?.classList.add('d-none');
    } else {
      prevBtn?.classList.remove('d-none');
      nextBtn?.classList.remove('d-none');
    }
  }

  /**
   * Filter visible attribute details using Angular patterns
   */
  getVisibleAttributeDetails(attributeDetails: AttributeDetail[]): AttributeDetail[] {
    if (!attributeDetails) return [];

    let att = attributeDetails.filter(attr =>
      !!attr.is_show &&
      attr.AttributeDetailValue !== 'NA'
    );
    return att
  }

  /**
   * Calculate correct slide index using Angular data binding patterns
   * This ensures the slideIndex matches the actual DOM slide position
   */
  getCorrectSlideIndexForAttribute(targetAttributeValue: AttributeDetail, attributeDetails: AttributeDetail[]): number {
    if (!targetAttributeValue || !attributeDetails) {
      return 0;
    }

    // Use the same filtering logic as the template to get visible attributes
    const visibleAttributes = this.getVisibleAttributeDetails(attributeDetails);

    // Find the position of the target attribute in the visible attributes array
    // This matches exactly what Angular renders in the DOM
    const correctIndex = visibleAttributes.findIndex(attr =>
      attr.AttributeDetailId === targetAttributeValue.AttributeDetailId && attr.AttributeId === targetAttributeValue.AttributeId
    );

    // Angular development mode debugging (can be removed in production)
    if (correctIndex === -1) {
      console.warn('Attribute not found in visible attributes:', {
        targetId: targetAttributeValue.AttributeDetailId,
        visibleCount: visibleAttributes.length,
        totalCount: attributeDetails.length
      });
    }

    // Return the correct index, defaulting to 0 if not found
    return correctIndex >= 0 ? correctIndex : 0;
  }

  /**
   * Angular trackBy function for performance optimization
   */
  trackByAttributeId(index: number, item: any): any {
    return item?.AttributeDetailId || index;
  }

  /**
   * Get slide styles using Angular binding
   */
  getSlideStyles(attributeValue: AttributeDetail) {
    return !attributeValue.is_show ? { 'display': 'none' } : {};
  }

  /**
   * Get slide classes using Angular binding
   */
  getSlideClasses(attributeValue: AttributeDetail) {
    return {
      'active': attributeValue?.is_checked === 1,
      'hidden': !attributeValue.is_show
    };
  }

  /**
   * Handle attribute slide click with Angular patterns
   */
  onAttributeSlideClick(index: number, attributeDetail: AttributeDetail, setThreeAttribute: Attribute): void {
    this.ngZone.run(() => {
      // Calculate the correct DOM slide index using Angular data patterns
      // This ensures we scroll to the right position even when attributes are filtered
      // Use timeout to ensure Angular has completed change detection and DOM updates
      const correctSlideIndex = this.getCorrectSlideIndexForAttribute(
        attributeDetail,
        setThreeAttribute.attributeDetails
      );

      // Trigger attribute change if needed
      if (attributeDetail.is_checked !== 1) {
        this.onAttributeChange(attributeDetail);
      }

      setTimeout(() => {
        // Always scroll selected attribute into view for better UX (even if already selected)
        this.scrollToSelectedSlideItemIntoView(index, setThreeAttribute.AttributeId);
      }, 50);

    });
  }

  /**
   * Angular-centric method to scroll all selected attributes into view
   * Useful when component loads or when parent attributes change visibility
   */
  scrollAllSelectedAttributesIntoView(): void {
    this.ngZone.run(() => {
      // Allow Angular to complete any pending change detection

      const swipeAbleAttributes = [AppConstants.ATTRIBUTE_DESIGN, AppConstants.ATTRIBUTE_PROFILE, AppConstants.ATTRIBUTE_SETTNG, AppConstants.ATTRIBUTE_STONE_CUT, AppConstants.ATTRIBUTE_STONE_SPREAD, AppConstants.ATTRIBUTE_DIMANOND_CUT];

      setTimeout(() => {
        this.stepThreeAttributes.filter(x => swipeAbleAttributes.indexOf(x.AttributeName) > -1)?.forEach((attribute) => {
          if (attribute.attributeDetails) {
            this.findAndScrollToSelectedSlideItemIntoView(attribute);
          }
        });
      }, 150);
    });
  }

  /**
   * Angular method to scroll the selected attribute of a specific atxtribute group into view
   */
  private findAndScrollToSelectedSlideItemIntoView(attribute: Attribute): void {
    if (!attribute || !attribute.attributeDetails) return;

    // Find the selected (checked) attribute
    const selectedAttributeDetail = attribute.attributeDetails.find((attr) => attr.is_checked === 1);

    if (selectedAttributeDetail) {
      // Calculate the correct slide index for the selected attribute
      const correctSlideIndex = this.getCorrectSlideIndexForAttribute(
        selectedAttributeDetail,
        attribute.attributeDetails
      );

      // Use timeout to ensure Angular has completed change detection and DOM updates
      setTimeout(() => {
        // Scroll to the selected attribute
        this.scrollToSelectedSlideItemIntoView(correctSlideIndex, attribute.AttributeId);
      }, 150);
    }
  }

  /**
   * Handle attribute change with Angular patterns
   */
  onAttributeChange(attributeDetail: AttributeDetail): void {
    this.changeAtrribute(
      attributeDetail.AttributeId,
      attributeDetail.AttributeDetailId,
      this.stepThreeAttributes,
      this.selectedProductMap
    );
  }

  /**
   * Get template context for ng-template
   */
  getTemplateContext(attributeValue: any, j: number, i: number, setThreeAttribute: any): any {
    return {
      $implicit: attributeValue,
      attributeValue,
      j,
      i,
      setThreeAttribute,
      getRadioName: (attrDetailId: number, attrId: number, jIndex: number, iIndex: number) =>
        this.getRadioName(attrDetailId, attrId, jIndex, iIndex),
      getRadioId: (attrDetailId: number, attrId: number, jIndex: number, iIndex: number) =>
        this.getRadioId(attrDetailId, attrId, jIndex, iIndex)
    };
  }

  /**
   * Generate radio button name using Angular patterns
   * Include attributeId to ensure uniqueness across different attribute groups
   */
  public getRadioName(attributeDetailId: number, attributeId: number, j: number, i: number): string {
    return `attr_${attributeId}_${attributeDetailId}_${j}_${i}`;
  }

  /**
   * Generate radio button ID using Angular patterns
   * Include attributeId to ensure uniqueness across different attribute groups
   */
  public getRadioId(attributeDetailId: number, attributeId: number, j: number, i: number): string {
    return `attr_${attributeId}_${attributeDetailId}_${j}_${i}`;
  }

  /**
   * Handle image loading errors with Angular patterns
   */
  onImageError(event: any): void {
    if (event?.target) {
      event.target.src = 'assets/front/images/no_image.jpg';
    }
  }

  /**
   * Clean up swiper instances on destroy
   */
  private cleanupSwipers(): void {
    this.swiperStates.forEach((state, attributeId) => {
      if (state.instance?.destroy) {
        state.instance.destroy(true, true);
      }
    });
    this.swiperStates.clear();
  }


  updateImageViewIdAccordingToAttributeSelection(attributeId: any) {
    let attribute = this.attributesList.find(
      (attribute_element: any) => attribute_element.AttributeId == attributeId
    );
    if (attribute && attribute?.ImageViewId && attribute?.ImageViewId > 0) {
      this.default_image_view_id = attribute?.ImageViewId;
    } else {
      this.default_image_view_id = 0;
    }
  }

  uncheckAllAttribute(attributes: any) {
    attributes.forEach((element: any) => {
      element.attributeDetails.forEach((sub_element: any) => {
        sub_element.is_checked = 0;
      });
    });
  }

  // TO SELECTE ATTRIBUTE VALUE BY ATTRIBUTEID AND ATTRIBUTE VALUE ID
  selectedAttributeValueByAttributeId(
    attribute_id: any,
    attribute_detail_id: any
  ) {
    let attributeObj;
    attributeObj = this.stepThreeAttributes.find(
      (attribute: any) => attribute.AttributeId == attribute_id
    );

    if (
      attributeObj &&
      attributeObj?.attributeDetails &&
      attributeObj?.attributeDetails?.length > 0
    ) {
      let getCheckedAtrribute = attributeObj?.attributeDetails.findIndex(
        (sub_attribute: any) => sub_attribute.is_checked == 1
      );
      if (getCheckedAtrribute == -1) {
        let getAtrribute = attributeObj?.attributeDetails.findIndex(
          (sub_attribute: any) =>
            sub_attribute.AttributeDetailId == attribute_detail_id
        );

        if (getAtrribute > -1) {
          attributeObj.attributeDetails[getAtrribute].is_checked = 1;
        }
      }
    }
  }

  // TO UNSELECTE ATTRIBUTE VALUE BY ATTRIBUTEID AND ATTRIBUTE VALUE ID
  unselectAttributeValueByAttributeId(
    attribute_id: any,
    attribute_detail_id: any
  ) {
    let attributeObj;
    attributeObj = this.stepThreeAttributes.find(
      (attribute: any) => attribute.AttributeId == attribute_id
    );
    if (
      attributeObj &&
      attributeObj?.attributeDetails &&
      attributeObj?.attributeDetails?.length > 0
    ) {
      let getCheckedAtrribute = attributeObj?.attributeDetails.findIndex(
        (sub_attribute: any) =>
          sub_attribute.AttributeDetailId == attribute_detail_id
      );

      if (getCheckedAtrribute > -1) {
        this.removeSelectedDataIfAnyAttributeDetailValueChange(
          attribute_detail_id
        );

        attributeObj.attributeDetails[getCheckedAtrribute].is_checked = 0;
      }
    }

    return attributeObj;
  }

  removeSelectedDataIfAnyAttributeDetailValueChange(attribute_detail_id: any) {
    let attributeFound = this.selectedProductMap.findIndex(
      (attribute: any) => attribute.AttributeDetailId == attribute_detail_id
    );
    if (attributeFound > -1) {
      this.selectedProductMap.splice(attributeFound, 1);

    }
  }

  // TO DEVIDER MATSTER DATA INTO STEPS
  filterAttributesAccordingStep(attributeData: any) {
    this.stepThreeAttributes = attributeData;
    this.stepThreeAttributes.sort(
      (firstEle: any, secondEle: any) =>
        firstEle.AttributeOrder - secondEle.AttributeOrder
    );
  }

  // FOR UPDATE SELECTED ATTRIBUTE FROM STEP ONE
  getSelectedAttributeValue(attribute_id: any) {
    this.updateSelectedAttribute(
      attribute_id,
      this.stepThreeAttributes,
      this.selectedProductMap
    );
  }

  private updateSelectedAttribute(
    attribute_id: any,
    sourceAttributes: any[],
    selectedAttributes: any[]
  ) {
    const attributeObj = sourceAttributes.find(
      (attribute: any) => attribute.AttributeId == attribute_id
    );

    const checkedAttribute = attributeObj?.attributeDetails.find(
      (sub_attribute: any) => sub_attribute.is_checked == 1
    );

    if (!checkedAttribute) return;

    const exists = selectedAttributes.some(
      (sub_attribute: any) =>
        sub_attribute.AttributeId == checkedAttribute.AttributeId &&
        sub_attribute.AttributeDetailId == checkedAttribute.AttributeDetailId
    );

    if (!exists) {
      selectedAttributes.push({
        AttributeId: checkedAttribute.AttributeId,
        AttributeDetailId: checkedAttribute.AttributeDetailId,
        AttributeOrder: attributeObj.AttributeOrder,
      });
    }
  }

  // TO COMBINE STEP SELECTED ATTRIBUTE AND SEND FOR STEP LIST REQUEST API.
  getSeletedAttributeRequest(selectedData: any) {
    selectedData.forEach((element: any) => {
      this.selectedAttrs.push({
        attrId: element.AttributeId,
        attrDtl: element.AttributeDetailId,
      });
    });
    return this.selectedAttrs;
  }

  updateFinalAttributeReques(selectedData: any) {
    let selectedAttrs: any[] = [];
    selectedData.forEach((element: any) => {
      selectedAttrs.push({
        attrId: element.AttributeId,
        attrDtl: element.AttributeDetailId,
      });
    });
    return selectedAttrs;
  }

  scroll = (_event: any): void => {
    const snumber: number = window.scrollY;

    if (snumber >= 200 && this.currentSteap == 3) {
      this.show_scroll_top = true;
    } else {
      this.show_scroll_top = false;
    }
  };

  // SET CTAGORY ID IN SESSION
  setCategoryInSession(category_id: any) {
    this.sessionService.setSession('categoryId', category_id);
  }

  // SET SELETED DIAMOND DETAILS IN SESSION (1ST STEP)
  setSelectedDaimonDetailsInSession(daimond_details: any) {
    this.sessionService.setSession('daimond_details', daimond_details);
  }

  // SET SELECTED BRACELET STYLES IN SESSION (2ND STEP)
  setSeletedBraceletesStylesInSession(braceletes_styles: any) {
    this.sessionService.setSession('braceletes_styles', braceletes_styles);
  }

  // SET SELETED PRODUCT ATTRIBUTES IN SESSION (3RD STEP)
  setSeletedProductAtributeInSession(prodct_atrribute: any) {
    this.sessionService.setSession('product', prodct_atrribute);
  }

  getProductDetail() {
    const finalSelectedAttribute = [...this.selectedProductMap];
    this.setSeletedProductAtributeInSession(finalSelectedAttribute);

    const selectedAttrs = this.isSkuRedirect
      ? this.updateSkuAttributeRequest(this.skuProductData.ConfigAttribs[0], 1)
      : this.updateFinalAttributeReques(finalSelectedAttribute);

    const request = {
      selectedAttrs,
      categoryId: this.categoryId,
      articleId: this.articleId,
      metal: this.getCurrentMetal(finalSelectedAttribute),
      countryId: this.countryId,
    };

    this.productDetailService.getProductDetail(request).subscribe((response) => {
      if (response?.type === AppConstants.success && response?.data) {
        if (response.data.fileDetails) {
          response.data.fileDetails = response.data.fileDetails.sort(
            (a: { ImageViewOrder: number | null }, b: { ImageViewOrder: number | null }) =>
              (a.ImageViewOrder || 0) - (b.ImageViewOrder || 0)
          );
        }
        this.handleProductDetailSuccess(response);
      }
    });
  }

  private handleProductDetailSuccess(response: any): void {
    this.resetMediaStates();
    this.productDetails = response.data;
    this.mainProductDetails = this.productDetails;
    this.current_product_id = this.productDetails?.ProductId || 0;

    if (this.default_image_view_id === 0) {
      this.checkImageViewOfAttribute();
    }

    // COMMENTED OUT - SAFE APPROACH: this.checkProductIsMatchingBand(response);
    this.updateFileUriDetails(response.data);

    this.checkProductVideoAvailableInFileDetails(response.data).then(() => {
      // this.updateFileDetailByImageView(response.data, this.default_image_view_id);
      this.updateFileDetailByImageView(response.data, this.defaultImageViewId);
    });

    // let prd = response.data.fileDetails.find((x: any) => x.ImageViewId == 3);
    // this.changeProductImage(prd.uri, prd.ImageViewId, prd.FileType, null);

    this.updateRingSizeAvailibality();
    this.getConfigureAndUnConfigureAttribute(this.productDetails);
    this.GetConfigurableDetails(
      response.data.ConfigAttribs,
      false,
      this.productDetails?.productDetails
    );
    this.replaceUrlState(this.categoryId, this.productDetails?.ProductId);
    this.checkDiscountAvailable(Number(this.productDetails?.productPrice));

    if (this.similar_subscription) {
      this.similar_subscription.unsubscribe();
    }

    this.getProductPlanDetails(response.data.productPrice, response.data.CountryId);
  }

  private resetMediaStates(): void {
    this.previewImageSrc = '';
    this.defaultImageSrc = '';
    this.videoUrl = '';
    this.slider_show = false;
    this.file_type = AppConstants.FILE_TYPE_VIDEO;
  }


  getProductPlanDetails(price: string, countryId: number) {
    let request = { price: price, countryId: this.countryId };
    this.productDetailService.getProducPlanDetail(request).subscribe((response) => {
      if (response && response?.type == AppConstants.success) {
        this.planPriceList = response.data.map((element: any) => {
          element.plan_priceWithoutDec = parseInt(element.plan_price);
          if (element.plan_value.toUpperCase() == AppConstants.NO_PLAN) {
            element.is_checked = true;
          } else { element.is_checked = false; }
          return element;
        });
      }
    });
  }

  onPlanChange(plan: { is_checked: boolean, plan_id: number }) {
    this.planPriceList.forEach((element: any) => {
      if (element.plan_id == plan.plan_id) {
        element.is_checked = true;
      } else {
        element.is_checked = false;
      }
    });
  }

  getCurrentMetal(selected_attributes: any) {
    let is_platinum = 0;
    let metal = this.attributesList.find((attribute_element: any) =>
      attribute_element.AttributeName.toLowerCase().includes(
        AppConstants.METAL_COLOR
      )
    );
    if (metal) {
      let attribute_value = metal.attributeDetails?.filter((object1: any) => {
        return selected_attributes.some(
          (object2: any) =>
            object1.AttributeDetailId == object2.AttributeDetailId
        );
      });
      if (attribute_value && attribute_value.length > 0) {
        if (
          attribute_value[0]?.AttributeDetailValue.toLowerCase().includes(
            AppConstants.METAL_VALUE_1
          ) ||
          attribute_value[0]?.AttributeDetailValue.toLowerCase().includes(
            AppConstants.METAL_VALUE_2
          )
        ) {
          is_platinum = 1;
        }
      }
    }
    return is_platinum;
  }

  updateRingSizeAvailibality() {
    if (
      this.productDetails?.ConfigAttribs &&
      this.productDetails.ConfigAttribs.length > 0
    ) {
      let ring_size = this.stepThreeAttributes.find(
        (element: any) => element.AttributeId == this.ring_size_attribute_id
      );

      if (
        ring_size?.attributeDetails &&
        ring_size?.attributeDetails.length > 0
      ) {
        ring_size.attributeDetails.forEach((element: any) => {
          if (
            element.AttributeDetailId ==
            this.productDetails?.ConfigAttribs[0][
            'atr_' + this.ring_size_attribute_id
            ]
          ) {
            element.is_checked = 1;
            this.selected_ring_size_attribute_id = element.AttributeDetailId;
            let findInSelectedAttribute =
              this.selectedProductMap.findIndex(
                (attribute: any) =>
                  attribute.AttributeId == this.ring_size_attribute_id
              );
            if (findInSelectedAttribute == -1) {
              this.selectedProductMap.push({
                AttributeId: this.ring_size_attribute_id,
                AttributeDetailId: element.AttributeDetailId,
                AttributeOrder: ring_size?.AttributeOrder,
              });

            } else {
              this.selectedProductMap[
                findInSelectedAttribute
              ].AttributeDetailId = element.AttributeDetailId;
            }

            this.selectedProductMap =
              this.selectedProductMap.sort(
                (firstEle: any, secondEle: any) =>
                  firstEle.AttributeOrder - secondEle.AttributeOrder
              );

            this.setSeletedProductAtributeInSession(
              this.selectedProductMap
            );
          }
        });
      }
    }
  }

  checkRingSizeAvailable(selectedAttribute: any) {
    let details: any[] = [];
    if (selectedAttribute && selectedAttribute.length > 0) {
      if (this.ring_size_attribute_id > 0) {
        details.push({ attrId: this.ring_size_attribute_id, attrDtl: 0 });
      } else {
        this.attributesList.map((element: any) => {
          let size: boolean =
            selectedAttribute.findIndex(
              (sub_element: any) =>
                sub_element.AttributeId == element.AttributeIdS
            ) == -1;
          if (size) {
            if (element.AttributeName.toLowerCase()?.includes(
              AppConstants.RING_SIZE
            )) {
              details.push({ attrId: element.AttributeId, attrDtl: 0 });
            }
          }
        });
      }
    }

    return details;
  }

  checkImageViewOfAttribute() {
    // Simplified version - no step one attributes to check
    // Default image view handling can be implemented here if needed
  }

  getConfigureAndUnConfigureAttribute(element: any) {
    let configurable_attribute: any = [];
    let unconfigurable_attribute: any = [];
    element?.productDetails?.forEach((prod_element: any) => {
      unconfigurable_attribute.push(prod_element);
    });
    element['configure_attribute'] =
      configurable_attribute && configurable_attribute.length > 0
        ? configurable_attribute
        : [];
    element['unconfigurable_attribute'] =
      unconfigurable_attribute && unconfigurable_attribute.length > 0
        ? unconfigurable_attribute
        : [];
  }

  GetConfigurableDetails(
    ConfigAttribs: any,
    is_return: boolean,
    productDetails: any
  ) {
    this.configurable_attribute = [];
    this.getConfigurbaleAttributesDetails(
      this.configurableAttributes,
      ConfigAttribs
    );
    productDetails?.forEach((detail: any) => {
      if (detail.DisplayIn == '1') {
        let obj: any = {};
        obj = {
          AttributeName: detail.AttributeName,
          AttributeDetailValue: detail.AttributeDetailValue,
          SummaryOrder: detail.SummaryOrder,
          AttributeId: detail.AttributeId,
        };
        this.configurable_attribute.push(obj);
      }
    });
    this.configurable_attribute.splice(0, 0, {
      AttributeName: "SKU",
      AttributeDetailValue: this.productDetails?.ProductSKU.toUpperCase(),
      // AttributeDetailValue: this.productDetails.CoreSku?.toUpperCase(),
      SummaryOrder: 0,
      AttributeId: 0,
    })
    if (is_return) {
      return this.configurable_attribute.sort(
        (firstEle: any, secondEle: any) =>
          firstEle.SummaryOrder - secondEle.SummaryOrder
      );
    } else {
      this.productDetails!['configurable_attribute'] =
        this.configurable_attribute.sort(
          (firstEle: any, secondEle: any) =>
            firstEle.SummaryOrder - secondEle.SummaryOrder
        );
    }
    this.splitConfigurableAttribute(this.configurable_attribute)
  }

  getConfigurbaleAttributesDetails(attributes: any, ConfigAttribs: any) {
    attributes.forEach((element: any) => {
      if (element.AttributeId && element.DisplayIn == '1') {
        element?.attributeDetails?.forEach((sub_sub_element: any) => {
          if (
            AppConstants.checkAttributeComibinationFound(
              element,
              sub_sub_element,
              ConfigAttribs
            )
          ) {
            let obj: any = {};
            obj = {
              AttributeName: element.AttributeName,
              AttributeDetailValue: sub_sub_element.AttributeDetailValue,
              SummaryOrder: element.SummaryOrder,
              AttributeId: element.AttributeId,
            };
            this.configurable_attribute.push(obj);
          }
        });
      }
    });
  }

  setDefaultCurrency(currency: any, price: any) {
    let update_currency: any = '';
    update_currency = parseInt(price);
    return update_currency ? update_currency : '';
  }

  getStepsSelectedAtrributeName(attributeDetail: any, attributeMaster: any) {
    let selectedAttribute: any = [];
    attributeDetail.sort(
      (firstEle: any, secondEle: any) =>
        firstEle.AttributeOrder - secondEle.AttributeOrder
    );
    attributeDetail.forEach((element: any) => {
      let attributeObj = attributeMaster.find(
        (attribute: any) => attribute.AttributeId == element.AttributeId
      );
      let getCheckedAtrribute = attributeObj?.attributeDetails.find(
        (sub_attribute: any) =>
          sub_attribute.AttributeDetailId == element.AttributeDetailId &&
          sub_attribute.is_checked == 1
      );
      if (getCheckedAtrribute) {
        selectedAttribute.push({
          name: getCheckedAtrribute.AttributeDetailValue,
        });
      }
    });
    return selectedAttribute;
  }

  updateFileUriDetails(element: any) {
    let show_count = 0;
    let checkVideo = element?.fileDetails.findIndex(
      (fileDetail: any) => fileDetail.FileType == AppConstants.FILE_TYPE_VIDEO
    );

    if (checkVideo !== -1) {
      element.fileDetails[checkVideo]['is_show'] = 1;
      show_count++;
    }
    element?.fileDetails?.forEach((file_element: any) => {
      if (
        show_count < this.imageShowCount &&
        this.nameToLowerCase(file_element?.ImageViewName) !==
        AppConstants.ON_HAND_RING_NAME &&
        this.nameToLowerCase(file_element?.ImageViewName) !==
        AppConstants.MATCHING_BAND_NAME
      ) {
        show_count++;
        file_element['is_show'] = 1;
      } else if (file_element.FileType !== AppConstants.FILE_TYPE_VIDEO) {
        file_element['is_show'] = 0;
      }
      file_element['thumbnail_uri'] = file_element?.Uri
        ? this.imageUrl +
        AppConstants.PRODUCT_THUMBNAIL_IMAGE_FOLDER_NAME +
        file_element?.Uri
        : '';
      file_element.Uri = file_element?.Uri
        ? this.imageUrl +
        AppConstants.PRODUCT_IMAGE_FOLDER_NAME +
        file_element?.Uri
        : '';
    });

    let count = this.imageToshowCount(element?.fileDetails);
    if (count > this.imageShowCount) {
      this.image_needs_to_be_show = count - this.imageShowCount;
    }

    for (let i = 0; i < element?.fileDetails.length; i++) {
      if (
        this.nameToLowerCase(element?.fileDetails[i]?.ImageViewName) ==
        AppConstants.ON_HAND_RING_NAME
      ) {
        this.try_ring_on_hand = element?.fileDetails[i].Uri;
        break;
      }
    }
  }

  imageToshowCount(fileDetails: any) {
    let count = 0;
    for (const file of fileDetails) {
      if (
        this.nameToLowerCase(file?.ImageViewName) !==
        AppConstants.ON_HAND_RING_NAME &&
        this.nameToLowerCase(file?.ImageViewName) !==
        AppConstants.MATCHING_BAND_NAME
      ) {
        count++;
      }
    }
    return count;
  }

  nameToLowerCase(name: string, fistCap?: boolean) {
    if (fistCap) {
      return name?.charAt(0) + name?.slice(1)?.toLowerCase()
    } else {
      return name?.toLowerCase();
    }
  }

  checkProductVideoAvailableInFileDetails(element: any) {
    return new Promise((resolve) => {
      let is_video_available = element?.fileDetails.findIndex(
        (fileDetail: any) => fileDetail.FileType == AppConstants.FILE_TYPE_VIDEO
      );
      if (is_video_available == -1) {
        this.file_type = AppConstants.FILE_TYPE_IMAGE;
        resolve(false);
        this.isVideoAvailable = false;
      } else {
        if (!this.defaultImageViewId) {
          this.file_type = AppConstants.FILE_TYPE_VIDEO;
          this.changeProductImage(
            element?.fileDetails[is_video_available]?.Uri,
            0,
            element?.fileDetails[is_video_available]?.FileType,
            1
          );
          this.isVideoAvailable = true;
          resolve(true);
        } if (this.defaultImageViewId) {
          let prd = element.fileDetails.find((x: any) => x.ImageViewId == this.defaultImageViewId);
          this.changeProductImage(prd.Uri, prd.ImageViewId, prd.FileType, 2);
          this.isVideoAvailable = false;
          resolve(false);
        }
      }
    });
  }

  updateFileDetailByImageView(element: any, image_view_id: any) {
    let is_image_select: boolean = false;
    let is_image_view_match: boolean = false;
    for (let i = 0; i < element?.fileDetails.length; i++) {
      if (
        image_view_id == 0 ||
        image_view_id == '' ||
        image_view_id == null ||
        image_view_id == undefined
      ) {
        if (
          element?.fileDetails[i].Uri &&
          element?.fileDetails[i].FileType == AppConstants.FILE_TYPE_IMAGE &&
          element?.fileDetails[i]?.ImageViewName?.toLowerCase() !==
          AppConstants.ON_HAND_RING_NAME &&
          element?.fileDetails[i]?.ImageViewName?.toLowerCase() !==
          AppConstants.MATCHING_BAND_NAME
        ) {
          this.zoomImageSrc = element?.fileDetails[i].Uri;
          this.previewImageSrc = this.zoomImageSrc;
          this.defaultImageSrc = element?.fileDetails[i].Uri;
          is_image_select = true;
          this.file_type = this.getCurrentFileType();

          break;
        }
      } else {
        if (
          element?.fileDetails[i].ImageViewId == image_view_id &&
          element?.fileDetails[i].Uri &&
          element?.fileDetails[i].FileType == AppConstants.FILE_TYPE_IMAGE &&
          element?.fileDetails[i]?.ImageViewName?.toLowerCase() !==
          AppConstants.ON_HAND_RING_NAME &&
          element?.fileDetails[i]?.ImageViewName?.toLowerCase() !==
          AppConstants.MATCHING_BAND_NAME
        ) {
          this.zoomImageSrc = element?.fileDetails[i].Uri;
          this.previewImageSrc = this.zoomImageSrc;
          this.defaultImageSrc = element?.fileDetails[i].Uri;
          is_image_select = true;
          this.file_type = this.getCurrentFileType();
          is_image_view_match = true;
          break;
        }
      }
    }

    this.noImageViewFound(is_image_select, is_image_view_match, element);
  }

  noImageViewFound(
    is_image_select: any,
    is_image_view_match: any,
    element: any
  ) {
    if (!is_image_select && !is_image_view_match) {
      let image_index = element?.fileDetails.findIndex(
        (x: any) =>
          x.FileType == AppConstants.FILE_TYPE_IMAGE &&
          x.Uri &&
          x.ImageViewName?.toLowerCase() !== AppConstants.ON_HAND_RING_NAME &&
          x.ImageViewName?.toLowerCase() !== AppConstants.MATCHING_BAND_NAME
      );

      if (image_index !== -1) {
        this.zoomImageSrc = element?.fileDetails[image_index].Uri;
        this.previewImageSrc = this.zoomImageSrc;
        this.defaultImageSrc = element?.fileDetails[image_index].Uri;
        this.file_type = this.getCurrentFileType();
      } else {
        for (let i = 0; i < element?.fileDetails.length; i++) {
          if (
            element?.fileDetails[i].Uri &&
            element?.fileDetails[i].FileType == AppConstants.FILE_TYPE_VIDEO
          ) {
            this.videoUrl = element?.fileDetails[i].Uri;
            this.file_type = AppConstants.FILE_TYPE_VIDEO;

            break;
          }
        }
      }
    }
  }

  show_extra_images() {
    this.image_needs_to_be_show = 0;
    this.productDetails?.fileDetails?.forEach((file_element: any) => {
      if (
        file_element?.is_show == 0 &&
        this.nameToLowerCase(file_element?.ImageViewName) !==
        AppConstants.ON_HAND_RING_NAME &&
        this.nameToLowerCase(file_element?.ImageViewName) !==
        AppConstants.MATCHING_BAND_NAME
      ) {
        file_element.is_show = 1;
      }
    });
  }

  changeProductImage(
    uri: any,
    _image_view_id: any,
    file_type: any,
    autoPaly?: any
  ) {
    this.defaultImageViewId = _image_view_id
    this.slider_show = false;
    this.isHalfImage = _image_view_id == 3 ? true : false;
    if (uri && file_type == AppConstants.FILE_TYPE_IMAGE) {
      this.zoomImageSrc = uri;
      this.previewImageSrc = uri;
      this.file_type = file_type;
    } else if (uri && file_type == AppConstants.FILE_TYPE_VIDEO) {
      this.videoUrl = uri;
      this.file_type = file_type;
      if (autoPaly == 1 && this.addDelayForVideoToPlay == 1) {
        setTimeout(() => {
          this.playVideo('player');
        }, 4000);
      }
    }

  }

  setSimilarProductFileDetails(fileDetails: any): any {
    let url: string = '';
    if (fileDetails && fileDetails.length > 0) {
      if (
        fileDetails[0]?.FileType == 'image' &&
        fileDetails[0]?.Uri &&
        fileDetails[0]?.ImageViewName?.toLowerCase() !==
        AppConstants.ON_HAND_RING_NAME &&
        fileDetails[0]?.ImageViewName?.toLowerCase() !==
        AppConstants.MATCHING_BAND_NAME
      ) {
        url = fileDetails[0].Uri
          ? this.imageUrl +
          AppConstants.PRODUCT_THUMBNAIL_IMAGE_FOLDER_NAME +
          fileDetails[0]?.Uri
          : '';
      }
    } else {
      url = 'assets/front/images/no_image.jpg';
    }

    return url;
  }

  checkMulipleAttributeDiffrent(difference: any, findInSelectedAttribute: any) {
    if (difference.length > 1) {
      this.uncheckAllAttribute(this.stepThreeAttributes);
      this.updateStepAttribute(
        this.stepThreeAttributes,
        this.selectedProductMap,
        this.stepThreeAttributeResponse
      );
    } else {
      this.selected_ring_size_attribute_id =
        this.selectedProductMap[
          findInSelectedAttribute
        ].AttributeDetailId;
      let ring_size = this.selectedProductMap.findIndex(
        (element: any) => element.AttributeId == this.ring_size_attribute_id
      );
      if (ring_size > -1) {
        this.selectedProductMap.splice(ring_size, 1);
      }
      this.getAllRingSizeAttributes(
        this.updateFinalAttributeReques(
          this.selectedProductMap
        )
      );
    }
  }

  getDifference(array1: any, array2: any) {
    return array1?.filter((object1: any) => {
      return !array2.some((object2: any) => {
        return object1.AttributeDetailId === object2.AttributeDetailId;
      });
    });
  }

  scrollTop() {
    window.scroll(0, 0);
  }

  ngOnDestroy(): void {
    this.similarStop$?.unsubscribe();
    // Angular-centric swiper cleanup
    this.cleanupSwipers();
    let myObj = document.getElementById('support-script');
    if (myObj) {
      myObj.remove();
    }
  }

  preventScroll(e: any) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  pauseVideo(id: any) {
    let video: any = this.document.getElementById(id);
    if (video) {
      video?.pause();
    }
  }

  playVideo(id: any) {
    let video: any = this.document.getElementById(id);
    if (video) {
      video.muted = true;
      video?.play();
      this.addDelayForVideoToPlay = 0;
    }
  }

  checkImageNotExists(is_image_select: any, product_details: any) {
    if (!is_image_select) {
      const imageUri = this.getFirstValidImageUri(product_details?.fileDetails);
      if (imageUri) {
        this.zoomImageSrc = imageUri;
        this.previewImageSrc = imageUri;
        this.defaultImageSrc = imageUri;
        this.file_type = this.getCurrentFileType();
      } else {
        const videoUri = this.getFirstValidVideoUri(product_details?.fileDetails);
        if (videoUri) {
          this.videoUrl = videoUri;
          this.file_type = this.getCurrentFileType();
        }
      }
    }
  }

  private getFirstValidImageUri(fileDetails: any[]): string | null {
    const image = fileDetails?.find(
      (x: any) =>
        x.FileType === AppConstants.FILE_TYPE_IMAGE &&
        x.Uri &&
        x.ImageViewName?.toLowerCase() !== AppConstants.ON_HAND_RING_NAME &&
        x.ImageViewName?.toLowerCase() !== AppConstants.MATCHING_BAND_NAME
    );
    return image?.Uri ?? null;
  }

  private getFirstValidVideoUri(fileDetails: any[]): string | null {
    const video = fileDetails?.find(
      (x: any) =>
        x.Uri && x.FileType === AppConstants.FILE_TYPE_VIDEO
    );
    return video?.Uri ?? null;
  }

  validateMaxLength(event: any) {
    const isDesktopDevice = this.deviceService.isDesktop();

    if (!isDesktopDevice) {
      if (event.target.value.length < 25) {
        return true;
      } else {
        if (
          !(event.which == '46' || event.which == '8' || event.which == '13')
        ) {
          event.preventDefault();
          return false;
        }
      }
    }
  }

  lettersOnly(event: any) {
    let inp = String.fromCharCode(event.keyCode);
    // Allow numbers, alpahbets, space, underscore
    if (/^[ A-Za-z0-9({":';<>?})[\]_@./!$%+-]*$/.test(inp)) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }

  updateFileDetails(matching_band: any) {
    for (let i = 0; i < matching_band?.fileDetails.length; i++) {
      if (
        matching_band?.fileDetails[i]?.FileType ==
        AppConstants.FILE_TYPE_IMAGE &&
        matching_band?.fileDetails[i]?.ImageViewName?.toLowerCase() ==
        AppConstants.MATCHING_BAND_NAME
      ) {
        if (
          !matching_band?.image?.includes(
            this.imageUrl + AppConstants.PRODUCT_IMAGE_FOLDER_NAME
          )
        ) {
          matching_band[AppConstants.FILE_TYPE_IMAGE] = matching_band
            ?.fileDetails[i]?.Uri
            ? this.imageUrl +
            AppConstants.PRODUCT_IMAGE_FOLDER_NAME +
            matching_band?.fileDetails[i]?.Uri
            : '';
          break;
        }
      }
    }
  }

  checkSizeIsAvailable(attributeName: string): boolean {
    if (attributeName?.toLowerCase()?.includes(AppConstants.RING_SIZE)) {
      return true;
    } else {
      return false;
    }
  }

  getOptionValue(
    AttributeDetailId: number,
    AttributeId: number,
    stepThreeAttributes: any[],
    stepThreeSelectedAttribute: any[]
  ) {
    this.dropdown_ring_size_change = true;
    this.changeAtrribute(
      AttributeId,
      Number(AttributeDetailId),
      stepThreeAttributes,
      stepThreeSelectedAttribute,
      0
    );
  }

  splitConfigurableAttribute(inputArray: any) {
    let summaryData: any = [];
    if (this.isFromCat) {
      summaryData = inputArray?.filter((item: any) => item.AttributeName !== "SIZE")
    } else {
      summaryData = inputArray;
    }
    if (summaryData && summaryData?.length > 0) {
      const result: any = summaryData.reduce(
        (resultArray: any, item: any, index: any) => {
          const chunkIndex = Math.floor(index / this.summaryItemPerColummn);
          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
          }
          if (item.AttributeDetailValue != 'NA') {
            resultArray[chunkIndex].push(item);
          }
          return resultArray;
        },
        []
      );
      this.summayArrtibutes = result;
    }
  }

  getAttributeDetails(attributeId: number) {
    if (attributeId && attributeId != 0) {
      return this.productDetails?.configurable_attribute?.find(
        (x: any) => x.AttributeId == attributeId
      );
    }
  }

  getAllRingSizeAttributes(selected_attributes: any) {
    this.getAttributeListSteps(selected_attributes, 1).then((resp: any) => {
      if (
        resp &&
        resp.data &&
        resp.data.attributes &&
        resp.data.attributes.length > 0
      ) {
        this.checkListStepsData(resp);
      }
    });
  }

  findRingSize() {
    this.find_ring_size = !this.find_ring_size;
    this.scrollTop();
  }

  contactUs() {
    this.contact_us = !this.contact_us;
    this.scrollTop();
  }

  replaceUrlState(category_id: any, product_id: any) {
    if (this.categoryIdFromUrl > 0 && this.productIdFromUrl > 0) {
      this.location.replaceState(
        '/home/product/' + category_id + '/' + product_id
      );
    }
  }

  addProductInCart() {
    let finalSelectedAttribute = [...this.selectedProductMap];
    let cartRequest = {
      articalId: this.articleId,
      productId: this.productDetails?.ProductId,
      cartId: this.cartId,
      engrave_text: this.engraving_text,
      engrave_font: this.getFontName(this.default_font),
      is_engrave: this.productDetails?.IsEngravable,
      imageUrl: this.imageUrl + AppConstants.PRODUCT_IMAGE_FOLDER_NAME,
      metal: this.getCurrentMetal(finalSelectedAttribute),
      specialSKU: this.productDetails?.ProductSKU,
      plan: this.planPriceList.find(x => x?.is_checked === true)
    };
    gtag('event', 'add_to_cart',
      {
        currency: this.default_currency,
        value: 7.77,
        items: [
          {
            item_id: this.productDetails?.ProductSKU,
            item_name: this.productDetails?.ProductName,
            affiliation: '',
            coupon: '',
            discount: 0,
            index: 0,
            item_brand: '',
            item_category: this.selectedCategoryName,
            item_category2: '',
            item_category3: '',
            item_category4: '',
            item_category5: '',
            item_list_id: '',
            item_list_name: '',
            item_variant: '',
            location_id: '',
            price: Number(this.productDetails?.productPrice),
            quantity: 1,
          },
        ],
      });
    this.productDetailService.addProductInCart(cartRequest).subscribe({
      next: this.handleCartResponse.bind(this),
      error: this.handleCartError.bind(this),
    });
  }

  addToBasket() {
    if (!this.isFromCat) {
      // Clear any previous error state
      this.showRingSizeError = false;
      let ringSize = this.productDetails?.configurable_attribute?.find((x: any) => x.AttributeName == "SIZE")?.AttributeDetailValue;
      // if (this.targetOrigin && this.productDetails) {
      let params = {
        type: 'addItemToCart',
        productId: this.productDetails?.CoreSku,
        specialOrderSKU: this.productDetails?.ProductSKU,
        ringSize: ringSize,
        planCode: this.planPriceList?.find(x => x?.is_checked === true)?.plan_code,
        parentSku: this.productDetails?.CoreSku,
      }
      let targetOrigin: string = this.targetOrigin ? this.targetOrigin : 'https://www.michaelhill.com.au'
      console.log(params, targetOrigin, "Add to basket")
      window.parent.postMessage(
        params,
        targetOrigin
      )
      // }
    } else {
      // Set error state to show red outline and error message
      let RingSizeAttribute = this.stepThreeAttributes.find(x => x.AttributeName === "SIZE")
      this.showRingSizeError = true;
      this.openRingModal(RingSizeAttribute?.attributeDetails);
      // Clear error state after 5 seconds
      setTimeout(() => {
        this.showRingSizeError = false;
      }, 5000);
    }
  }

  handleCartResponse(_response: any) {
    this.loader.isLoading.next(false);
    parent.window.location.href = _response?.data?.url
      ? _response?.data?.url
      : this.cartUrl;
  }

  handleCartError(_error: any) {
    this.loader.isLoading.next(false);
    parent.window.location.href = _error?.data?.url
      ? _error?.data?.url
      : this.cartUrl;
  }

  getFontName(value: string) {
    if (value == 'first_eng_font') {
      return 'dancing_font';
    } else if (value == 'two_eng_font') {
      return 'vipnagorgialla_font';
    } else if (value == 'three_eng_font') {
      return 'normal_font';
    }
  }

  getCurrentFileType() {
    return this.isVideoAvailable
      ? AppConstants.FILE_TYPE_VIDEO
      : AppConstants.FILE_TYPE_IMAGE;
  }

  addColorTheme(colorTheme: any) {
    this.color_theme = colorTheme;
    let body = document.getElementsByTagName('body')[0];
    if (this.color_theme == 'blue') {
      this.add_blue_theme(body);
    } else if (this.color_theme == 'purple') {
      this.add_purple_theme(body);
    } else if (this.color_theme == 'green') {
      this.add_green_theme(body);
    } else if (this.color_theme == 'red') {
      this.add_red_theme(body);
    } else if (this.color_theme == 'gray') {
      this.add_gray_theme(body);
    } else if (this.color_theme == 'black') {
      this.add_black_theme(body);
    } else if (this.color_theme == 'light-yellow') {
      this.add_light_yellow_theme(body);
    } else {
      this.add_blue_theme(body);
    }
  }

  add_blue_theme(body: any) {
    if (body) {
      body.classList.add('blue-theme-new');
    }
  }

  add_light_yellow_theme(body: any) {
    if (body) {
      body.classList.add('light-yellow-theme-new');
    }
  }

  add_purple_theme(body: any) {
    if (body) {
      body.classList.add('parpal-theme-new');
    }
  }

  add_green_theme(body: any) {
    if (body) {
      body.classList.add('dark-green-theme-new');
    }
  }

  add_red_theme(body: any) {
    if (body) {
      body.classList.add('red-themee');
    }
  }

  add_gray_theme(body: any) {
    if (body) {
      body.classList.add('gray-themee');
    }
  }

  add_black_theme(body: any) {
    if (body) {
      body.classList.add('black-themee');
    }
  }

  cancalSubscriptions() {
    if (this.similar_subscription) {
      this.similar_subscription.unsubscribe();
    }

    if (this.image_subscription) {
      this.image_subscription.unsubscribe();
    }
    this.timeoutIds.forEach((id) => {
      clearTimeout(id);
    });
  }

  checkDiscountAvailable(productPrice: number) {
    if (this.discountPercent > 0) {
      this.discountPrice =
        productPrice - (this.discountPercent / 100) * productPrice;
      if (
        this.discountStartDate !== '' &&
        this.discountStartDate !== null &&
        this.discountStartDate !== undefined &&
        this.discountEndDate !== '' &&
        this.discountEndDate !== null &&
        this.discountEndDate !== undefined
      ) {
        if (this.checkDiscountInterval) {
          setInterval(() => {
            this.checkDiscountInterval = false;
            let fromDatetime: Date = new Date(
              this.discountStartDate.toString()
            );
            let toDatetime: Date = new Date(this.discountEndDate.toString());
            let currentDatetime: Date = new Date();
            let isBetween: boolean = this.checkIfBetween(
              currentDatetime,
              fromDatetime,
              toDatetime
            );
            this.isDiscountAvailable = isBetween;
          }, 1000);
        }
      } else if (
        this.discountStartDate !== '' &&
        this.discountStartDate !== null &&
        this.discountStartDate !== undefined &&
        (this.discountEndDate == '' ||
          this.discountEndDate == null ||
          this.discountEndDate == undefined)
      ) {
        if (this.checkDiscountInterval) {
          setInterval(() => {
            this.checkDiscountInterval = false;
            let fromDatetime: Date = new Date(
              this.discountStartDate.toString()
            );
            let currentDatetime: Date = new Date();
            let isBetween: boolean = currentDatetime >= fromDatetime;
            this.isDiscountAvailable = isBetween;
          }, 1000);
        }
      } else {
        this.isDiscountAvailable = false;
      }
    } else {
      this.discountPrice = 0;
      this.isDiscountAvailable = false;
    }
  }

  checkIfBetween(current: Date, from: Date, to: Date): boolean {
    return current >= from && current <= to;
  }

  checkSwipe(id: any) {
    let swipe = this.withOutSwipeOption.find(x => x == id);
    return swipe ? true : false
  }

  openRingModal(attribute_value: any) {
    const initialState = {
      selected_ring_size_attribute_id: this.isFromCat ? 0 : this.selected_ring_size_attribute_id,
      attributeList: attribute_value
    };
    this.bsModalRef = this.modalService.show(RingSizePopUpComponent, { class: 'modal-md modal_show_slide', initialState });
    this.bsModalRef.content.OnRingSizeSection.subscribe((data: any) => {
      this.getOptionValue(data?.AttributeDetailId, data?.AttributeId, this.stepThreeAttributes, this.selectedProductMap);
      // Clear error state when ring size is selected
      this.showRingSizeError = false;
    });
  }

  getSelectedRingValue(configValues: any): string {
    let value = configValues?.find((x: any) => x.AttributeName?.toLowerCase()?.includes(AppConstants.RING_SIZE)).AttributeDetailValue;
    // return value ? `Select Size: ${value}` : 'Select Size';
    return this.isFromCat ? 'Select Size' : value ? `Select Size: ${value}` : 'Select Size';
  }

  toggleTitleText() {
    if (this.is_wrap_text === true) {
      this.is_wrap_text = false;
    } else {
      this.is_wrap_text = true;
    }
  }

  toggleDescription(attribute: any) {
    attribute.show_description = !attribute.show_description;
  }

  goToJewelleryBuilder() {
    this.router.navigate(['#']);
    this.sessionService.isBreadCrumed.next(true);
    this.sessionService.iframeData.next(null)
  }
}

