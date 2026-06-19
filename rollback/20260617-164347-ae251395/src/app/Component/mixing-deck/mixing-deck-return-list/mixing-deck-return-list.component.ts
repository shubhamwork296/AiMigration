import {
  Component, OnInit, Output, Input, EventEmitter, SimpleChanges, ViewChild, ChangeDetectorRef, Injector
} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';
import { SearchResponseModel } from 'src/app/models/mixing-deck/search-response.model';
import { GA4SearchEventParam, SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { JourneySummaryModel, TravelSolutionModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { FareModel } from 'src/app/models/mixing-deck/fare.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import * as moment from 'moment';
import { RouteDetailsComponent } from '../route-details/route-details.component';
import { JourneyModel, FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppConstantsService, ErrorMessageEnum, LocalStorageKeyEnum, TicketTypeEnum } from 'src/app/utility/app-constants.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { InfoPopupComponent } from '../info-popup/info-popup.component';
import { TicketInfoComponent } from '../ticket-info/ticket-info.component';
import { CommonServices } from 'src/app/services/common.service';
import { DisruptionServiceComponent } from '../disruption-service/disruption-service.component';
import { TicketClassInfoPopupComponent } from '../ticket-class-info-popup/ticket-class-info-popup.component';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { SoldoutTicketInfoPopupComponent } from '../soldout-ticket-info-popup/soldout-ticket-info-popup.component';

@Component({
    selector: 'app-mixing-deck-return-list',
    templateUrl: './mixing-deck-return-list.component.html',
    styleUrls: ['./mixing-deck-return-list.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
        trigger('detailExpandReturn', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class MixingDeckReturnListComponent implements OnInit {

  currentDateString: string;
  ongoingDateString: string;
  ongoingDateReturnString: string;
  responseData: ResponseData;
  searchResponse: SearchResponseModel;
  dataSource: MatTableDataSource<any>;
  travelSolutionCache: string;
  isHideEarlier: boolean;
  isHideLater: boolean;

  cheapestTravelSolutionId: number[] = [];
  cheapestTravelSolutionReturnId: number[] = [];
  fastestTravelSolutionId: number[] = [];
  fastestTravelSolutionIdReturn: number[] = [];
  fastestTravelSolutionIdSingleReturn: number[] = [];
  isAllTicketVisible: boolean = false;
  showMoreTicket: boolean = false;
  isAllTicketVisibleSingleReturn: boolean = false;
  sliceIndex: number = 2;
  sliceIndexReturn: number = 2;
  sliceIndexSingleReturn: number = 2;
  singleFare: number = 0;
  singleFareCurrency: string;
  isSingleFareSelected: boolean;
  ticketDescription: string;
  ticketRestriction: string;
  ticketDescriptionSingleReturn: string;
  ticketRestrictionSingleReturn: string;
  searchResponseReturn: SearchResponseModel;
  dataSourceReturn: MatTableDataSource<any>;
  travelSolutionCacheReturn: string;
  isHideEarlierReturn: boolean;
  isHideLaterReturn: boolean;
  passengerDetailLabelReturn: string;
  cheapestTravelSolutionIdReturn: number[] = []; //anmol v5
  cheapestTravelSolutionIdSingleReturn: number[] = [];
  selectedFare: any;
  selectedOfferId: number;
  selectedServiceId: number;
  selectedTravelSolution: any;
  selectedSingleReturnOfferId: number;
  selectedSingleReturnServiceId: number;
  selectedSingleReturnTravelSolution: any;
  selectedSingleReturnFare: any;
  selectedReturnTimeId: number;
  isReturnDataLoad: boolean;
  totalFare: number;
  defaultSelectedRow: number;
  defaultSelectedRowSingleReturn: number;
  firstListCounter: number = 0;
  secondListCounter: number = 0;
  departure: any;
  isExpand: boolean = false;
  isExpandSingleReturn: boolean = false;
  isdisruption: boolean = false;
  searchResponseboth: SearchResponseModel;
  tipContent: boolean;

  arrival: any;

  // for Promotional Banner
  singleTravelSolutionsSelected: { TicketTypeCode: string, TicketTypeName: string, TravelSolId: number, fareAmount: number };
  returnTravelSolutionsSelected: { TicketTypeCode: string, TicketTypeName: string, TravelSolId: number, fareAmount: number };
  is2SinglesSelected: boolean = false;
  promotionalData: { ReturnTicketTypeName: string, TwoSinglesCost: number, ReturnCost: number, SavingCost: number, singleTravelSolId: number, returnTravelSolId: number, returnTicketTypeCode: string } = {
    ReturnTicketTypeName: '',
    TwoSinglesCost: 0,
    ReturnCost: 0,
    SavingCost: 0,
    singleTravelSolId: 0,
    returnTravelSolId: 0,
    returnTicketTypeCode: ''
  }

  selectedReturnTimeIdDisabled: boolean = false;
  isBuyNowDisable: boolean = false;
  isBuyNowDisableReturn: boolean = false;
  minDate: Date = new Date();
  maxDate: string = moment(this.minDate).add(6, 'months').format('YYYY-MM-DD');
  tabMinFareReturn: number = 0;
  tabMinFareReturnCurrency: string;
  tabMinFareOutWard: number;
  tabMinFareSingleReturn: number;
  totalForReuturnAndSigle: number = 0;
  activeTab: number;
  timeoutFlag: boolean = false;
  isreturndisabled: boolean = false;
  @Input()
  searchRequest: SearchRequestModel;
  @ViewChild('tooltip15', { static: false }) tooltip15: NgbTooltip;
  @ViewChild('tooltip16', { static: false }) tooltip16: NgbTooltip;
  @ViewChild('tooltip17', { static: false }) tooltip17: NgbTooltip;
  @Output() parentTooltip = new EventEmitter<string>();
  @Output("openAmend") openAmend: EventEmitter<any> = new EventEmitter();
  // added to hide editqtt in case we get travel soln while doing earlier/later after soldout case
  @Output("hideEditQtt") hideEditQtt: EventEmitter<any> = new EventEmitter();
  @Output() getTravelSolution: EventEmitter<{ fare: FareModel, travelSolution: TravelSolutionModel }> = new EventEmitter()
  columns: ColumnsToDisplay[] = [
    {
      key: "TravelSolId",
      label: 'TravelSolId'
    },
    {
      key: "Changes",
      label: 'Changes'
    },
    {
      key: "Duration",
      label: 'Duration'
    },
    {
      key: "SingleFare",
      label: 'Prices'
    },
    {
      key: "ReturnFare",
      label: 'Return Fares'
    }
  ]

  columnsReturn: ColumnsToDisplay[] = [
    {
      key: "TravelSolId",
      label: 'TravelSolId'
    },

    {
      key: "Changes",
      label: 'Changes'
    },
    {
      key: "Duration",
      label: 'Duration'
    },
    {
      key: "SingleFare",
      label: 'Prices'
    },
    {
      key: "ReturnFare",
      label: 'Return Fares'
    }
  ]

  columnsToDisplayReturn = ['Operator', 'RSID', 'DepartureTimeArrivalTime', 'Duration&Changes', 'fastest', 'actions', 'Select'];
  columnsToDisplaySingleReturn = ['Operator', 'RSID', 'DepartureTimeArrivalTime', 'Duration&Changes', 'SingleFare&Actions', 'expand-collapse'];
  columnsToDisplay = ['Operator', 'RSID', 'DepartureTimeArrivalTime', 'Duration&Changes', 'SingleFare&Actions', 'expand-collapse'];
  expandedElement: TravelSolutionModel | null;
  expandedElementReturn: TravelSolutionModel | null;
  returnClick: boolean = false;
  singleClick: boolean = false;
  returnFare;
  returnTravelSolution;
  singleSolutionFare;
  singleSolutionTravelSolution;
  isStdPremiumAvailableOutwardSingle: boolean = false;
  isStdPremiumAvailableOutwardReturn: boolean = false;
  isStdPremiumAvailableReturn: boolean = false;
  isPromotionAppliedSingle: boolean = false;
  isPromotionAppliedReturn: boolean = false;
  hideAdvanceStandard: boolean = false;
  hideAdvanceFirst: boolean = false;
  hideAdvanceStdPremium: boolean = false;
  retainedReturnTimesStart: string;
  retainedDepartureTimesStart: string;
  selectedSingleReturnTravelSolutionForReturn: any;
  sharedSibling: SharedService;
  spinnerService: NgxSpinnerService;
  appConstantsService: AppConstantsService;
  searchSolutionService: SearchSolutionService;
  _notificationservice: NotificationService;
  commonServices: CommonServices;
  datalayerService: DataLayerService;
  ga4datalayerService: GA4DatalayerService;
  errorMessageEnum: ErrorMessageEnum;
  ticketTypeEnum: TicketTypeEnum;
  isSelectRadioButtonForOutward: boolean = false;
  isSelectRadioButtonForReturn: boolean = false;
  localStorageKeyEnum: LocalStorageKeyEnum;

  constructor(private readonly injector: Injector, private readonly changeDetector: ChangeDetectorRef, private readonly dialog: MatDialog, private readonly dialogSingle: MatDialog) {
    // Dependency Injection without using constructor's param, private dialogSingle: MatDialog
    this.sharedSibling = this.injector.get(SharedService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.searchSolutionService = this.injector.get(SearchSolutionService);
    this._notificationservice = this.injector.get(NotificationService);
    this.commonServices = this.injector.get(CommonServices);
    this.datalayerService = this.injector.get(DataLayerService);
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
    this.errorMessageEnum = this.injector.get(ErrorMessageEnum);
    this.ticketTypeEnum = this.injector.get(TicketTypeEnum); 
    
    this.currentDateString = moment(new Date()).format('YYYY-MM-DD');
    this.isSingleFareSelected = true;
    this.isReturnDataLoad = false;
    this.sharedSibling.isReturnLoaderCase = true;
    this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.sharedSibling.fareBreakdownModelData[0] = new FareBreakdownModel();
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
   
  }

  ngOnInit() {
    if (!this.sharedSibling.isAmendSearchOpen) {
      this.ongoingDateString = moment(new Date(this.searchRequest.DepartureTimesStart)).format('YYYY-MM-DD');
      this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
      this.ongoingDateReturnString = moment(new Date(this.searchRequest.ReturnTimesStart)).format('YYYY-MM-DD');
      this.searchRequest.ReturnTimesStartShow = new Date(this.searchRequest.ReturnTimesStart);
      this.tabMinFareReturn = 0;
      this.getAllTravelSolution();
      this.departure = this.searchRequest.DepartureLocationName; 
      this.isSingleFareSelected = false;
      this.arrival = this.searchRequest.ArrivalLocationName;

      this.isBuyNowDisable = false;
      this.isBuyNowDisableReturn = false;
    }
    this.searchSolutionService.getPromotionalDataAction().subscribe(res => {
      if (res.action == 'change') {
        this.activeTab = 1;
        this.selectPromotionalBannerTicket(res.promotionalData);
      }
    })
    this.isAllTicketVisible = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.searchRequest = changes.searchRequest.currentValue;
    this.ngOnInit();
  }
  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }
  extendedFareList() {
    this.isAllTicketVisible = true;
    this.sharedSibling.IsViewMoreClick = true;
    this.showMoreTicket = false;
  }
  openAmendSearch() {
    this.openAmend.emit();
    window.scroll(0, 0);
  }
  collapsedFareList() {
    this.isAllTicketVisible = false;
    this.sharedSibling.IsViewMoreClick = false;
  }
  extendedFareListSingleReturn() {
    this.isAllTicketVisibleSingleReturn = true;
    this.sharedSibling.IsViewMoreClickSingleReturn = true;
  }

  collapsedFareListSingleReturn() {
    this.isAllTicketVisibleSingleReturn = false;
    this.sharedSibling.IsViewMoreClickSingleReturn = false;
  }

  callParentTooltip() {
    this.parentTooltip.emit('this is a test');
  }
  setSliceIndex(_element) {
    this.sliceIndex = 2;
    this.sliceIndexReturn = 2;

  }

  loadGTMDataLayeronExpandingSolutions(element, isSingleReturnElement, selectedFare, previousSelectedTravelSolution) {
    let indexOfElement = -1;
    try {
      if (isSingleReturnElement && element.TravelSolId !== previousSelectedTravelSolution.TravelSolId) {
        indexOfElement = this.searchResponseReturn.TravelSolutions.indexOf(element);
        this.datalayerService.loadGTMDataLayerOnExpandingTravelSolution(element, this.searchRequest, indexOfElement, this.activeTab, 'Inward', selectedFare);
        this.ga4datalayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, this.activeTab, 'Inward', selectedFare, false);
      }
      else if (isSingleReturnElement === false && element.TravelSolId !== previousSelectedTravelSolution.TravelSolId) {
        indexOfElement = this.searchResponse.TravelSolutions.indexOf(element);
        this.datalayerService.loadGTMDataLayerOnExpandingTravelSolution(element, this.searchRequest, indexOfElement, this.activeTab, 'Outward', selectedFare);
        this.ga4datalayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, this.activeTab, 'Outward', selectedFare, false);
      }
    } catch (err) { console.log(err); }
  }

  onSelectTravelSolution(element) {
    let previousSelectedTravelSolution = this.selectedTravelSolution;
    this.isStdPremiumAvailableOutwardSingle = false;
    this.isStdPremiumAvailableOutwardReturn = false;
    this.defaultSelectedRow = element.TravelSolId;
    if (element == this.selectedTravelSolution) {

      if (this.expandedElement == null) {
        this.expandedElement = element;
        this.isExpand = true;
      } else {
        this.expandedElement = null;
        this.isExpand = false;
      }
  
      this.defaultSelectedRow = 0;
 
      return;
    } else {
      this.expandedElement = element;
      this.isExpand = true;
    }

    this.isAllTicketVisible = false;

    let tempFarelist;

    if (this.isSingleFareSelected) {
      
      element.FareList.forEach(obj => obj.MinPrice = obj.Price == element.SingleFare);
      this.totalFare = element.SingleFare + this.sharedSibling.journeySummaryModel.ReturnPrice;
      this.singleFare = element.SingleFare;
      tempFarelist = element.FareList.filter(m => m.Price == element.SingleFare);
      this.isSingleFareSelected = true;

      this.sharedSibling.singleSolutionFare = tempFarelist[0];
      this.sharedSibling.singleSolutionTravelSolution = element;
      this.singleClick = true;
    }
    else {
      element.ReturnFareList.forEach(obj => obj.MinPrice = obj.Price == element.ReturnFare);
      this.totalFare = element.ReturnFare;
      this.singleFare = element.ReturnFare;
      tempFarelist = element.ReturnFareList.filter(m => m.Price == element.ReturnFare);
      this.isSingleFareSelected = false;

      this.sharedSibling.returnFare = tempFarelist[0];
      this.sharedSibling.returnTravelSolution = element;
      this.returnClick = true;
    }



    //Journey extra
    this.selectedOfferId = tempFarelist[0].OfferId;
    this.selectedServiceId = tempFarelist[0].ServiceId;
    this.selectedFare = tempFarelist[0];
    this.selectedTravelSolution = element;
    this.ticketDescription = tempFarelist[0].TicketDescription;
    this.ticketRestriction = tempFarelist[0].TicketRestriction;
    this.setMinPriceOfSelectedTravelSoln(element);

    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    this.sharedSibling.journeySummaryModel.SingleTime = element.DarwinDepartureTime + ' → ' + element.DarwinArrivalTime;
    this.sharedSibling.journeySummaryModel.SingleDuration = element.Duration;
    this.sharedSibling.journeySummaryModel.SingleChanges = element.Changes;
    this.sharedSibling.journeySummaryModel.SingleTicketType = tempFarelist[0].TicketTypeName;
    this.sharedSibling.journeySummaryModel.SingleCurrency = tempFarelist[0].Currency;
    this.sharedSibling.journeySummaryModel.SinglePrice = tempFarelist[0].Price;
    this.sharedSibling.journeySummaryModel.SingleTicketDescription = tempFarelist[0].TicketDescription;
    this.sharedSibling.journeySummaryModel.SingleOperator = element.Operator;
    this.sharedSibling.journeySummaryModel.SingleOperatorChange = element.OperatorChange;
    this.sharedSibling.journeySummaryModel.SingleSaleCompany = element.SaleCompany;
    this.sharedSibling.journeySummaryModel.SingleSelectedFare = tempFarelist[0];
    this.sharedSibling.journeySummaryModel.SingleSearchCache = this.searchResponse.Request.SearchCache;
    this.sharedSibling.journeySummaryModel.SingleRouteModel = element;

    //Fare Breakdown Latest
    this.sharedSibling.resetFareBreakDownData();
    this.sharedSibling.fareBreakdownModelData[0].IsReturnJourney = true;
    this.sharedSibling.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
    tempFarelist[0].FareDetails.forEach(obj => {
      let outJourney = new JourneyModel;
      outJourney.Passenger = obj.FarePerson;//'1 * Adult';
      outJourney.PricePerPerson = obj.BasePrice;
      outJourney.TotalPrice = obj.Price;
      outJourney.RailCard = obj.Railcard;
      outJourney.IsCheck = obj.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].OutWardJourney.push(outJourney);
    });
    
    try {
      let SingleSelectedFare = this.sharedSibling?.journeySummaryModel?.SingleSelectedFare;
      this.loadGTMDataLayeronExpandingSolutions(element, false, SingleSelectedFare, previousSelectedTravelSolution);
    } catch (error) {
      console.log(error);
    }

    // hide promotional banner if other row is selected
    let setPromotionalBannerData = { display: false, promotionalData: this.promotionalData }
    this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);

    // If selected different travel solution where ticket is already selected then // * Check to show promotional banner or not
    this.setPromotionalBannerData(this.sharedSibling.journeySummaryModel.SingleSelectedFare, this.sharedSibling.journeySummaryModel.SingleRouteModel, false);

    // on select outward travel solution in returnFrom section upadate return travel solutions  -- FGPICOET-1309 - prashant
    if (!this.isSingleFareSelected){
      this.setReturnTravelSolutionData();
    }
  }

  setMinPriceOfSelectedTravelSoln(element){
    let newFarelist ;
    if(this.isSingleFareSelected){
      element.NewFareList.forEach(obj => {
        obj.FareList.forEach(x => x.MinPrice = false)
      });
      newFarelist = element.NewFareList.find(obj => obj.TicketType == this.selectedFare.TicketTypeName)
    }else{
      element.NewReturnFareList.forEach(obj => {
        obj.FareList.forEach(x => x.MinPrice = false)
      });
      newFarelist = element.NewReturnFareList.find(obj => obj.TicketType == this.selectedFare.TicketTypeName)
    }
    if(newFarelist){
      newFarelist.FareList.forEach(obj => {
        if (obj.Price == this.selectedFare.Price) {
          obj.MinPrice = true;
        }
        else {
          obj.MinPrice = false;
        }
      });
    }
  }

  checkId(arr: any, find: any) {
    if (arr != null && arr != undefined) {
      let ar = arr.filter(x => x == find);
      if (ar.length > 0) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }

  }
  setSliceIndexReturn(element) {
    if (this.isSingleFareSelected) {
      this.totalFare = element.SingleFare;
      this.singleFare = element.SingleFare;
    }
    else {
      this.totalFare = element.ReturnFare;
      this.singleFare = element.ReturnFare;
    }
    this.sliceIndexReturn = 2;

  }

  setSliceIndexSingleReturn(_element) {
  
    this.sliceIndexSingleReturn = 2;
  }
  onSelectTravelSolutionSingleReturn(element) {
    let previousSelectedTravelSolution = this.selectedSingleReturnTravelSolution;
    this.isStdPremiumAvailableReturn = false;
    this.defaultSelectedRowSingleReturn = element.TravelSolId; //anmol v5
    if (element == this.selectedSingleReturnTravelSolution) {

      if (this.expandedElementReturn == null) {
        this.expandedElementReturn = element;
        this.isExpand = true;
      } else {
        this.expandedElementReturn = null;
        this.isExpand = false;
      }
      
      this.defaultSelectedRowSingleReturn = 0;
      
      return;
    }
    else {
      this.expandedElementReturn = element;
      this.isExpand = true;
    }
    this.isAllTicketVisibleSingleReturn = false;
    
    this.totalFare = this.singleFare + element.SingleFare;
    this.sliceIndexSingleReturn = 2;

    // journey Extra
    element.FareList.forEach(obj => obj.MinPrice = obj.Price == element.SingleFare);
    let tempFarelist = element.FareList.filter(m => m.Price == element.SingleFare);
    this.selectedSingleReturnOfferId = tempFarelist[0].OfferId;
    this.selectedSingleReturnServiceId = tempFarelist[0].ServiceId;
    this.selectedSingleReturnTravelSolution = element;
    this.selectedSingleReturnFare = tempFarelist[0];
    this.ticketDescriptionSingleReturn = tempFarelist[0].TicketDescription;
    this.ticketRestrictionSingleReturn = tempFarelist[0].TicketRestriction;

    element.NewFareList.forEach(obj => {
      obj.FareList.forEach(x => x.MinPrice = false)
    });
    let newFarelist = element.NewFareList.find(obj => obj.TicketType == this.selectedSingleReturnFare.TicketTypeName)
    if(newFarelist){
      newFarelist.FareList.forEach(obj => {
        if (obj.Price == this.selectedSingleReturnFare.Price) {
          obj.MinPrice = true;
        }
        else {
          obj.MinPrice = false;
        }
      });
    }

    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    this.sharedSibling.journeySummaryModel.ReturnTime = element.DarwinDepartureTime + ' → ' + element.DarwinArrivalTime;
    this.sharedSibling.journeySummaryModel.ReturnDuration = element.Duration;
    this.sharedSibling.journeySummaryModel.ReturnChanges = element.Changes;
    if(this.checkTraveSolutionDirection()){
        this.sharedSibling.journeySummaryModel.ReturnTicketType = this.sharedSibling.journeySummaryModel.SingleTicketType;
    }else{
      this.sharedSibling.journeySummaryModel.ReturnTicketType = tempFarelist[0].TicketTypeName;
    }
    this.sharedSibling.journeySummaryModel.ReturnCurrency = tempFarelist[0].Currency;
    this.sharedSibling.journeySummaryModel.ReturnPrice = tempFarelist[0].Price;
    this.sharedSibling.journeySummaryModel.ReturnTicketDescription = tempFarelist[0].TicketDescription;
    this.sharedSibling.journeySummaryModel.ReturnOperator = element.Operator;
    this.sharedSibling.journeySummaryModel.ReturnOperatorChange = element.OperatorChange;
    this.sharedSibling.journeySummaryModel.ReturnSaleCompany = element.SaleCompany;
    this.sharedSibling.journeySummaryModel.ReturnSelectedFare = tempFarelist[0];
    this.sharedSibling.journeySummaryModel.ReturnSearchCache = this.searchResponseReturn.Request.SearchCacheReturn;
    this.sharedSibling.journeySummaryModel.ReturnRouteModel = element;

    //Fare Breakdown Latest
    this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    tempFarelist[0].FareDetails.forEach(obj => {
      let returnJourney = new JourneyModel;
      returnJourney.Passenger = obj.FarePerson;//'1 * Adult';
      returnJourney.PricePerPerson = obj.BasePrice;
      returnJourney.TotalPrice = obj.Price;
      returnJourney.RailCard = obj.Railcard;
      returnJourney.IsCheck = obj.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney.push(returnJourney);
    });
    try {
      let ReturnSelectedFare = this.sharedSibling?.journeySummaryModel?.ReturnSelectedFare;
      this.loadGTMDataLayeronExpandingSolutions(element, true, ReturnSelectedFare, previousSelectedTravelSolution);
    } catch (error) {
      console.log(error);
    }

    // hide promotional banner if other row is selected
    let setPromotionalBannerData = { display: false, promotionalData: this.promotionalData }
    this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);

    // If selected different travel solution where ticket is already selected then // * Check to show promotional banner or not
    this.setPromotionalBannerData(this.sharedSibling.journeySummaryModel.ReturnSelectedFare, this.sharedSibling.journeySummaryModel.ReturnRouteModel, true);
  }

  showRouteDetailsReturn(row, isReturnCase) {
    this.dialog.open(RouteDetailsComponent, {
      width: '1086px',
      disableClose: false,
      id: "routeDetailsPopUpReturn",
      data: {
        TravelSolutionCache: isReturnCase ? this.searchResponseReturn.Request.SearchCacheReturn : this.searchResponse.Request.SearchCache,
        TravelSolutionId: row.TravelSolId,
        SaleCompanyId: row.SaleCompanyId,
        Changes: row.Changes,
        Duration: row.Duration
      }
    });
  }

  filterByStandard(fareList: any) {
    if (fareList != null) {
      let standardFound = false;
      return fareList.filter(x => {
        if (!standardFound && x.TicketClass == 'Standard') {
          standardFound = true;
          return true;
        }
      });
    }
  }
  filterByFirst(fareList: any) {
    if (fareList != null) {
      let firstFound = false;
      return fareList.filter(x => {
        if (!firstFound && x.TicketClass == 'First') {
          firstFound = true;
          return true;
        }
      });
    }
  }
  isStdPremiumAvailableForOutwardAndRet(isSingleReturn) {
    if (!this.isStdPremiumAvailableOutwardSingle && this.activeTab === 0 && !isSingleReturn) {
      this.isStdPremiumAvailableOutwardSingle = true;
    }
    else if (!this.isStdPremiumAvailableOutwardReturn && this.activeTab === 1 && isSingleReturn) {
      this.isStdPremiumAvailableOutwardReturn = true;
    }
  }
  filterByStdPremium(fareList: any, isOutwardList: boolean, element: any, isSingleReturn: boolean) {
    if (fareList && fareList.length > 0) {
      let firstPremiumFound = false;
      return fareList.filter(fare => {
        if (!firstPremiumFound && fare.TicketClass === 'Standard Premium') {
          firstPremiumFound = true;
          if (isOutwardList && element === this.expandedElement) {
            this.isStdPremiumAvailableForOutwardAndRet(isSingleReturn);
          }
          else if (!isOutwardList && !this.isStdPremiumAvailableReturn && element === this.expandedElementReturn) {
            this.isStdPremiumAvailableReturn = true;
          }
          return true;
        }
        return false;
      });
    }
  }

  filterByAdvSupOffAny(fareList: any, saleCompany: any) {
    if (fareList != null) {
      let earlyBirdTicketExist = this.checkEarlyBirdExist(fareList);
      fareList = fareList.filter(x => {
        if (earlyBirdTicketExist) {
          return this.commonServices.checkTicketTypeForOffPeak(this.ticketTypeEnum.earlyBirdAnytimeSingle, x, saleCompany);
        } else {
          return this.commonServices.checkTicketTypeForOffPeak(this.ticketTypeEnum.anytimeSingle, x, saleCompany);
        }
      }
      );
      this.filterForAdvanceTicket(fareList);
      return fareList;
    }
  }

  isShowHideOnAdvTicket(advanceTicketStandard, tempForStandard, advanceTicketFirst, tempForFirstClass, advanceTicketStdPremium, tempForStdPremium) {
    // hide or not, adv Standard ticket
    if (advanceTicketStandard.length > 0) {
      tempForStandard.forEach(x => {
        if (x[0].Price <= advanceTicketStandard[0].Price) {
          this.hideAdvanceStandard = true;
          this.showMoreTicket = true;
        }
      });
    }

    // hide or not, adv First ticket
    if (advanceTicketFirst.length > 0) {
      tempForFirstClass.forEach(x => {
        if (x[0].Price <= advanceTicketFirst[0].Price) {
          this.hideAdvanceFirst = true;
          this.showMoreTicket = true;
        }
      });
    }

    // hide or not, adv std Premium ticket
    if (advanceTicketStdPremium.length > 0) {
      tempForStdPremium.forEach(x => {
        if (x[0].Price <= advanceTicketStdPremium[0].Price) {
          this.hideAdvanceStdPremium = true;
          this.showMoreTicket = true;
        }
      });
    }
  }

  getArrayOfListOfClasses(listOfStandard, tempForStandard, listOfFirstClass, tempForFirstClass, listOfStdPremiumClass, tempForStdPremium) {
    if (listOfStandard.length > 0) {
      tempForStandard.push(listOfStandard);
    }

    if (listOfFirstClass.length > 0) {
      tempForFirstClass.push(listOfFirstClass);
    }

    if (listOfStdPremiumClass.length > 0) {
      tempForStdPremium.push(listOfStdPremiumClass);
    }
  }

  filterForAdvanceTicket(fareList: any) {
    this.showMoreTicket = false;
    let duplicateList = fareList;

    //getting all but only SupOffAnyAdvance ticket;
    duplicateList = duplicateList.filter(Ticket => {
      if (Ticket.TicketType.trim() == this.ticketTypeEnum.anytimeSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.advanceSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.offPeakSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.superOffPeakSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.anytimeReturn || Ticket.TicketType.trim() == this.ticketTypeEnum.advanceReturn || Ticket.TicketType.trim() == this.ticketTypeEnum.offPeakReturn || Ticket.TicketType.trim() == this.ticketTypeEnum.superOffPeakReturn) {
        return true;
      }
    });

    let tempForStandard = [], tempForFirstClass = [], advanceTicketFirst = [], advanceTicketStandard = [];
    this.hideAdvanceStandard = false;
    this.hideAdvanceFirst = false;
    let listOfStandard = [], listOfFirstClass = [];

    // for std Premium
    let tempForStdPremium = [], advanceTicketStdPremium = [];
    this.hideAdvanceStdPremium = false;
    let listOfStdPremiumClass = [];
    // for std Premium

    //getting advance tickets & listOfStd, listOfFirst, listOfStdPremium.
    duplicateList.forEach(x => {
      listOfStandard = this.filterByStandard(x.FareList);
      listOfFirstClass = this.filterByFirst(x.FareList);
      listOfStdPremiumClass = this.filterByStdPremium(x.FareList, false, null, null);

      if (x.TicketType.trim() === this.ticketTypeEnum.advanceSingle || x.TicketType.trim() === this.ticketTypeEnum.advanceReturn) {
        advanceTicketFirst = listOfFirstClass;
        advanceTicketStandard = listOfStandard;
        advanceTicketStdPremium = listOfStdPremiumClass;
      }
      else {
        this.getArrayOfListOfClasses(listOfStandard, tempForStandard, listOfFirstClass, tempForFirstClass, listOfStdPremiumClass, tempForStdPremium);
      }
    });

    if (advanceTicketFirst.length === 0 && advanceTicketStandard.length === 0 && advanceTicketStdPremium.length === 0) {
      return;
    }
    else {
      this.isShowHideOnAdvTicket(advanceTicketStandard, tempForStandard, advanceTicketFirst, tempForFirstClass, advanceTicketStdPremium, tempForStdPremium);
    }

  }

  tempFare: any;

  getMinPriceOfNewReturnFareList(newReturnFareList, fare) {
    if (newReturnFareList) {
      newReturnFareList.FareList.forEach(obj => {
        if (obj.Price == fare.Price) {
          obj.MinPrice = true;
        }
        else {
          obj.MinPrice = false;
        }
      });
    }
  }
  getMinPriceOfNewFareList(newFarelist, fare) {
    if (newFarelist) {
      newFarelist.FareList.forEach(newFareListFare => {
        if (newFareListFare.Price == fare.Price) {
          newFareListFare.MinPrice = true;
        }
        else {
          newFareListFare.MinPrice = false;
        }
      });
    }
  }

  // nkchange0112
  onSelectFareTravelSolution(fare, travelSolution, isReturnFare, isRadioBtnClick?: boolean) { 
    this.isSelectRadioButtonForOutward = isRadioBtnClick; 
    this.CheckSeatAvailalble(fare.TicketTypeName, fare.TicketClass);

    this.sharedSibling.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
    this.defaultSelectedRow = travelSolution.TravelSolId;
    let defaultSelectedTS = this.searchResponse.TravelSolutions.find(m => m.TravelSolId == this.defaultSelectedRow);
    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    this.sharedSibling.journeySummaryModel.SingleTime = travelSolution.DarwinDepartureTime + ' → ' + travelSolution.DarwinArrivalTime;
    this.sharedSibling.journeySummaryModel.SingleDuration = travelSolution.Duration;
    this.sharedSibling.journeySummaryModel.SingleChanges = travelSolution.Changes;
    this.sharedSibling.journeySummaryModel.SingleTicketType = fare.TicketTypeName;
    this.sharedSibling.journeySummaryModel.SingleCurrency = fare.Currency;
    this.sharedSibling.journeySummaryModel.SinglePrice = fare.Price;
    this.sharedSibling.journeySummaryModel.SingleTicketDescription = fare.TicketDescription;
    this.sharedSibling.journeySummaryModel.SingleOperator = travelSolution.Operator;
    this.sharedSibling.journeySummaryModel.SingleOperatorChange = travelSolution.OperatorChange;
    this.sharedSibling.journeySummaryModel.SingleSaleCompany = travelSolution.SaleCompany;
    this.sharedSibling.journeySummaryModel.SingleSelectedFare = fare;
    this.sharedSibling.journeySummaryModel.SingleSearchCache = this.searchResponse.Request.SearchCache;
    this.sharedSibling.journeySummaryModel.SingleRouteModel = travelSolution;
    this.sharedSibling.journeySummaryModel.ReturnSelectedFare = fare;

    if (isReturnFare) {
      this.sharedSibling.journeySummaryModel.IsSingleFareSelected = false;
      this.isSingleFareSelected = false;
      defaultSelectedTS.NewReturnFareList.forEach(obj => {
        obj.FareList.forEach(x => x.MinPrice = false)
      });
      let newReturnFareList = defaultSelectedTS.NewReturnFareList.find(obj => obj.TicketType == fare.TicketTypeName)
      
      this.getMinPriceOfNewReturnFareList(newReturnFareList, fare);
      this.singleFare = fare.Price;
      this.totalFare = this.singleFare;
      this.sharedSibling.returnFare = fare;
      this.sharedSibling.returnTravelSolution = travelSolution;
      if (this.commonServices.checkNullOrUndefined(this.sharedSibling.selectedReturnTimeId)) {
        this.selectedReturnTimeId = this.sharedSibling.selectedReturnTimeId;
        let defaultSelectedReturnTS = this.searchResponseReturn.TravelSolutions.find(m => m.TravelSolId == this.selectedReturnTimeId);
        if(defaultSelectedReturnTS){
          this.onSelectReturnTime(defaultSelectedReturnTS);
          if(this.checkTraveSolutionDirection()){
              this.sharedSibling.journeySummaryModel.ReturnTicketType = fare.TicketTypeName;
          }
        }
      }
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    }
    else {
      this.sharedSibling.journeySummaryModel.IsSingleFareSelected = true;
      this.isSingleFareSelected = true;
      
      defaultSelectedTS.NewFareList.forEach(obj => {
        obj.FareList.forEach(x => x.MinPrice = false)
      });
      let newFarelist = defaultSelectedTS.NewFareList.find(obj => obj.TicketType == fare.TicketTypeName);
      
      this.getMinPriceOfNewFareList(newFarelist, fare);
      this.singleFare = fare.Price;
      this.totalFare = this.singleFare + this.sharedSibling.journeySummaryModel.ReturnPrice;
      this.sharedSibling.singleSolutionFare = fare;
      this.sharedSibling.singleSolutionTravelSolution = travelSolution;
      if(this.selectedSingleReturnTravelSolution){
        this.onSelectFareTravelSolutionSingleReturn(this.selectedSingleReturnFare, this.selectedSingleReturnTravelSolution, false);
      }
    }

    fare.MinPrice = true;   
    this.singleFareCurrency = fare.Currency;

    this.expandedElement = defaultSelectedTS;
    //Fare BreakDown
    this.sharedSibling.sendReturnFareData(fare, fare, this.totalFare,
      true, this.isSingleFareSelected);
    this.tempFare = fare;
    // Work for Journey Extra
    this.selectedOfferId = fare.OfferId;
    this.selectedServiceId = fare.ServiceId;
    this.selectedTravelSolution = travelSolution;
    this.selectedFare = fare;
    this.ticketDescription = fare.TicketDescription;
    this.ticketRestriction = fare.TicketRestriction;
    this.getTravelSolution.emit({ fare, travelSolution });

    //Fare Breakdown Latest
    this.sharedSibling.resetFareBreakDownData();
    this.sharedSibling.fareBreakdownModelData[0].IsReturnJourney = true;
    fare.FareDetails.forEach(fareDetailObj => {
      let outJourney = new JourneyModel;
      outJourney.Passenger = fareDetailObj.FarePerson;//'1 * Adult';
      outJourney.PricePerPerson = fareDetailObj.BasePrice;
      outJourney.TotalPrice = fareDetailObj.Price;
      outJourney.RailCard = fareDetailObj.Railcard;
      outJourney.IsCheck = fareDetailObj.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].OutWardJourney.push(outJourney);
    });
    
    if (isRadioBtnClick !== false) {
      try {
        let searchResponseboth = new SearchResponseModel();
        searchResponseboth.TravelSolutions = this.searchResponse.TravelSolutions;
        searchResponseboth.RetTravelSolutions = null;
        let outwardSelectedFare = this.sharedSibling.journeySummaryModel?.SingleSelectedFare;
        let selectTravelSolParams = {
          searchRequest: this.searchRequest,
          searchSource: 'Homepage',
          searchSuccess: false,
          searchError: "",
          searchResponse: searchResponseboth,
          defaultSelectedRow: -1,
          selectedRow: this.selectedTravelSolution.TravelSolId,
          selectedPrice: null,
          defaultSelectedRowSingleReturn: -1,
          SelectedRowReturn: this.selectedSingleReturnTravelSolution.TravelSolId
        }
        this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, "single", true, [...this.cheapestTravelSolutionId, ...this.cheapestTravelSolutionIdSingleReturn], outwardSelectedFare, null, this.activeTab);
      }
      catch (err) {
        console.log(err);
      }
    }
    this.setPromotionalBannerData(fare, travelSolution, false);

  }
  isCheckedForSingleAndSingleReturnOfSameticketTypeCode() {
    // ! Logic to check if both single and single return are selected of same ticket type code
    if (this.returnTravelSolutionsSelected && this.singleTravelSolutionsSelected) {
      if (this.returnTravelSolutionsSelected.TicketTypeCode == this.singleTravelSolutionsSelected.TicketTypeCode) {
        this.is2SinglesSelected = true;
      } else {
        this.is2SinglesSelected = false;
      }
    } else {
      this.is2SinglesSelected = false;
    }
  }
  setShowingBannerInCaseOfSvrTypeCode(travelSolution) {
    for (let returnFare of travelSolution.ReturnFareList) {
      if (returnFare.TicketTypeCode == 'SVR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost < returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price;
          this.promotionalData.returnTicketTypeCode = 'SVR';
        }
      }
    }
  }
  setShowingBannerInCaseOfCdrTypeCode(travelSolution) {
    for (let returnFare of travelSolution.ReturnFareList) {
      if (returnFare.TicketTypeCode == 'CDR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost < returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'CDR';
        }
      }
    }
  }
  setShowingBannerInCaseOfSorTypeCode(travelSolution) {
    for (let returnFare of travelSolution.ReturnFareList) {
      if (returnFare.TicketTypeCode == 'SOR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost < returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'SQR';
        }
      }
    }
  }
  setShowingBannerInCaseOfSdrTypeCode(travelSolution) {
    for (let returnFare of travelSolution.ReturnFareList) {
      if (returnFare.TicketTypeCode == 'SDR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost < returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'SDR';
        }
      }
    }
  }
  setShowingBannerInCaseOfFdrTypeCode(travelSolution) {
    for (let returnFare of travelSolution.ReturnFareList) {
      if (returnFare.TicketTypeCode == 'FDR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost < returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'FDR';
        }
      }
    }
  }
  checkCasesInCaseOfIsSingleReturnFalse(travelSolution) {
    switch (this.singleTravelSolutionsSelected.TicketTypeCode) {
      case 'SVS': this.setShowingBannerInCaseOfSvrTypeCode(travelSolution);
        break;
      case 'CDS': this.setShowingBannerInCaseOfCdrTypeCode(travelSolution);
        break;
      case 'SOK': this.setShowingBannerInCaseOfSorTypeCode(travelSolution);
        break;
      case 'SDS': this.setShowingBannerInCaseOfSdrTypeCode(travelSolution);
        break;
      case 'FDS': this.setShowingBannerInCaseOfFdrTypeCode(travelSolution);
        break;
    }
  }

  isCheckedCasesInCaseOfIsSingleReturn() {
    let returnFareList = this.dataSource.filteredData.filter((el) => { return el.TravelSolId == this.singleTravelSolutionsSelected.TravelSolId })[0].ReturnFareList;
    switch (this.singleTravelSolutionsSelected.TicketTypeCode) {
      case 'SVS': this.setShowingBannerInCaseOfSingleReturnSvsTypeCode(returnFareList);
        break;
      case 'CDS': this.setShowingBannerInCaseOfSingleReturnCdsTypeCode(returnFareList);
        break;
      case 'SOK': this.setShowingBannerInCaseOfSingleReturnSokTypeCode(returnFareList);
        break;
      case 'SDS': this.setShowingBannerInCaseOfSingleReturnSdsTypeCode(returnFareList);
        break;
      case 'FDS': this.setShowingBannerInCaseOfSingleReturnFdsTypeCode(returnFareList);
        break;
    }
  }
  setShowingBannerInCaseOfSingleReturnSvsTypeCode(returnFareList) {
    for (let returnFare of returnFareList) {
      if (returnFare.TicketTypeCode == 'SVR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost <= returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'SVR';
          this.is2SinglesSelected = true;
          break;
        }
      }
    }
  }
  setShowingBannerInCaseOfSingleReturnCdsTypeCode(returnFareList) {
    for (let returnFare of returnFareList) {
      if (returnFare.TicketTypeCode == 'CDR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost <= returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'CDR';
          this.is2SinglesSelected = true;
          break;
        }
      }
    }
  }
  setShowingBannerInCaseOfSingleReturnSokTypeCode(returnFareList) {
    for (let returnFare of returnFareList) {
      if (returnFare.TicketTypeCode == 'SOR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost <= returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'SQR';
          this.is2SinglesSelected = true;
          break;
        }
      }
    }
  }
  setShowingBannerInCaseOfSingleReturnSdsTypeCode(returnFareList) {
    for (let returnFare of returnFareList) {
      if (returnFare.TicketTypeCode == 'SDR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost <= returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price
          this.promotionalData.returnTicketTypeCode = 'SDR';
          this.is2SinglesSelected = true;
          break;
        }
      }
    }
  }
  setShowingBannerInCaseOfSingleReturnFdsTypeCode(returnFareList) {
    for (let returnFare of returnFareList) {
      if (returnFare.TicketTypeCode == 'FDR') {
        // compare price of 2 singles and return
        let TwoSinglesCost = this.singleTravelSolutionsSelected.fareAmount + this.returnTravelSolutionsSelected.fareAmount;
        // don't show promotional banner if 2 singles price is low
        if (TwoSinglesCost <= returnFare.Price) {
          this.is2SinglesSelected = false
        } else {
          this.promotionalData.ReturnCost = returnFare.Price;
          this.promotionalData.ReturnTicketTypeName = returnFare.TicketTypeName;
          this.promotionalData.TwoSinglesCost = TwoSinglesCost;
          this.promotionalData.SavingCost = TwoSinglesCost - returnFare.Price;
          this.promotionalData.returnTicketTypeCode = 'FDR';
          this.is2SinglesSelected = true;
          break;
        }
      }
    }
  }

  setObjOfPromotionalBannerData() {
    if (!this.is2SinglesSelected) {
      // hide banner if there is any
      let setPromotionalBannerData = { display: false, promotionalData: this.promotionalData }
      this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);
    }

    // if we do not have return facilities then don't show promotional banner
    if (this.promotionalData.ReturnCost == 0 && !this.promotionalData.returnTicketTypeCode) {
      // do nothing and hide banner if there is any
      let setPromotionalBannerData = { display: false, promotionalData: this.promotionalData }
      this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);
    } else {
      let setPromotionalBannerData = { display: this.is2SinglesSelected, promotionalData: this.promotionalData }
      this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);
    }
  }
  getComparePriceOfReturnFareList(isSingleReturn, travelSolution) {
    if (this.is2SinglesSelected) {
      if (!isSingleReturn) {
        this.checkCasesInCaseOfIsSingleReturnFalse(travelSolution);
      } else {
        if (this.singleTravelSolutionsSelected && this.dataSource) {
          this.isCheckedCasesInCaseOfIsSingleReturn();
        }
      }
      this.promotionalData.singleTravelSolId = this.singleTravelSolutionsSelected.TravelSolId;
      this.promotionalData.returnTravelSolId = this.returnTravelSolutionsSelected.TravelSolId;
    }
  }
  // Method to set the promotional banner data
  setPromotionalBannerData(fare, travelSolution, isSingleReturn) {
    this.promotionalData = {
      ReturnCost: 0,
      ReturnTicketTypeName: '',
      SavingCost: 0,
      TwoSinglesCost: 0,
      returnTicketTypeCode: '',
      returnTravelSolId: 0,
      singleTravelSolId: 0
    }

    // * If isSingleReturn is false
    if (!isSingleReturn) {
      // * Check which travel solution of single Travel is selected 
      this.singleTravelSolutionsSelected = {
        TicketTypeCode: (fare.TicketTypeCode == 'SVS' || fare.TicketTypeCode == 'CDS' || fare.TicketTypeCode == 'SOK' || fare.TicketTypeCode == 'SDS' || fare.TicketTypeCode == 'FDS') ? fare.TicketTypeCode : 'NOT MATCH SINGLE',
        TicketTypeName: fare.TicketTypeName,
        TravelSolId: travelSolution.TravelSolId,
        fareAmount: fare.Price
      }
    } else {
      // * Check which travel solution of return single Travel is selected 
      this.returnTravelSolutionsSelected = {
        TicketTypeCode: (fare.TicketTypeCode == 'SVS' || fare.TicketTypeCode == 'CDS' || fare.TicketTypeCode == 'SOK' || fare.TicketTypeCode == 'SDS' || fare.TicketTypeCode == 'FDS') ? fare.TicketTypeCode : 'NOT MATCH RETURN',
        TicketTypeName: fare.TicketTypeName,
        TravelSolId: travelSolution.TravelSolId,
        fareAmount: fare.Price
      }
    }
    // ! Logic to check if both single and single return are selected of same ticket type code
    this.isCheckedForSingleAndSingleReturnOfSameticketTypeCode();

    // compare with price of return fare list
    this.getComparePriceOfReturnFareList(isSingleReturn, travelSolution);

    this.setObjOfPromotionalBannerData();

  }

  CheckSeatAvailalble(TicketType, TicketClass) {
    if (this.searchResponseReturn.RetTravelSolutions) {
      this.getTrvlSolutionValueOnCheckSeatAvailalble(TicketType, TicketClass);
      this.dataSourceReturn = new MatTableDataSource(this.searchResponseReturn.TravelSolutions);
    }
  }

  getTrvlSolutionValueOnCheckSeatAvailalble(TicketType, TicketClass) {
    this.searchResponseReturn.TravelSolutions.forEach(travelSolution => {
      if (!travelSolution.IsSingleSaleable && travelSolution.SingleFare > 0) {
        travelSolution.NewReturnFareList.forEach(ticket => {
          if (ticket.TicketType === TicketType) {
            ticket.FareList.forEach(fare => {
              if (fare.TicketClass === TicketClass && travelSolution.Operator == "1") {
                travelSolution.IsSeatavailable = fare.IsSeatAvailable;
                travelSolution.IsRetTrainClosed = fare.IsSeatAvailable;
              }

            });
          }
        })
      }
    });
  }



  onSelectFareTravelSolutionSingleReturn(fare, travelSolution, isRadioBtnClick?: boolean) {
    this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    this.isSelectRadioButtonForReturn = isRadioBtnClick;
    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    this.sharedSibling.journeySummaryModel.ReturnTime = travelSolution.DarwinDepartureTime + ' → ' + travelSolution.DarwinArrivalTime;
    this.sharedSibling.journeySummaryModel.ReturnDuration = travelSolution.Duration;
    this.sharedSibling.journeySummaryModel.ReturnChanges = travelSolution.Changes;
    if(this.checkTraveSolutionDirection()){
        this.sharedSibling.journeySummaryModel.ReturnTicketType = this.sharedSibling.journeySummaryModel.SingleTicketType;
    } else {
      this.sharedSibling.journeySummaryModel.ReturnTicketType = fare.TicketTypeName;
    }
    this.sharedSibling.journeySummaryModel.ReturnCurrency = fare.Currency;
    this.sharedSibling.journeySummaryModel.ReturnPrice = fare.Price;
    this.sharedSibling.journeySummaryModel.ReturnTicketDescription = fare.TicketDescription;
    this.sharedSibling.journeySummaryModel.ReturnOperator = travelSolution.Operator;
    this.sharedSibling.journeySummaryModel.ReturnOperatorChange = travelSolution.OperatorChange;
    this.sharedSibling.journeySummaryModel.ReturnSaleCompany = travelSolution.SaleCompany;
    this.sharedSibling.journeySummaryModel.ReturnSelectedFare = fare;
    this.sharedSibling.journeySummaryModel.ReturnSearchCache = this.searchResponseReturn.Request.SearchCacheReturn;
    this.sharedSibling.journeySummaryModel.ReturnRouteModel = travelSolution;
    

    travelSolution.NewFareList.forEach(obj => {
      obj.FareList.forEach(x => x.MinPrice = false)
    });
    let newFarelist = travelSolution.NewFareList.find(obj => obj.TicketType == fare.TicketTypeName)
    if(newFarelist){
      newFarelist.FareList.forEach(fareList => {
        if (fareList.Price == fare.Price) {
          fareList.MinPrice = true;
        }
        else {
          fareList.MinPrice = false;
        }
      });
    }


    this.totalFare = this.singleFare + fare.Price;


    this.singleFareCurrency = fare.Currency;
    this.expandedElementReturn = travelSolution;

    //Fare BreakDown
    this.sharedSibling.sendReturnFareData(this.tempFare, fare, this.totalFare,
      true, this.isSingleFareSelected);

    // Work for Journey Extra
    this.selectedSingleReturnOfferId = fare.OfferId;
    this.selectedSingleReturnServiceId = fare.ServiceId;
    this.selectedSingleReturnFare = fare;
    this.selectedSingleReturnTravelSolution = travelSolution;
    this.ticketDescriptionSingleReturn = fare.TicketDescription;
    this.ticketRestrictionSingleReturn = fare.TicketRestriction;
    

    this.getTravelSolution.emit({ fare, travelSolution });

    //Fare Breakdown Latest
    fare.FareDetails.forEach(fareDetail => {
      let returnJourney = new JourneyModel;
      returnJourney.Passenger = fareDetail.FarePerson;//'1 * Adult';
      returnJourney.PricePerPerson = fareDetail.BasePrice;
      returnJourney.TotalPrice = fareDetail.Price;
      returnJourney.RailCard = fareDetail.Railcard;
      returnJourney.IsCheck = fareDetail.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney.push(returnJourney);
    });

    if (isRadioBtnClick !== false) {
      try {
        let searchResponseboth = new SearchResponseModel();
        searchResponseboth.TravelSolutions = this.searchResponseReturn.TravelSolutions;
        searchResponseboth.RetTravelSolutions = null;

        let returnSelectedFare = this.sharedSibling?.journeySummaryModel?.ReturnSelectedFare;
        let selectTravelSolParams = {
          searchRequest: this.searchRequest,
          searchSource: 'Homepage',
          searchSuccess: false,
          searchError: "",
          searchResponse: searchResponseboth,
          defaultSelectedRow: -1,
          selectedRow: travelSolution.TravelSolId,
          selectedPrice: null,
          defaultSelectedRowSingleReturn: -1,
          SelectedRowReturn: this.selectedSingleReturnTravelSolution.TravelSolId
        }
        this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, "return", true, [...this.cheapestTravelSolutionId, ...this.cheapestTravelSolutionIdSingleReturn], returnSelectedFare, null, this.activeTab);
      }
      catch (err) {
        console.log(err);
      }
    }

    this.setPromotionalBannerData(fare, travelSolution, true);

  }


  onSelectReturnTime(element) {
    this.selectedReturnTimeId = element.TravelSolId;
    this.sharedSibling.selectedReturnTimeId = this.selectedReturnTimeId;
    this.selectedSingleReturnTravelSolutionForReturn = element;//anmol v3
    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    this.sharedSibling.journeySummaryModel.ReturnTime = element.DarwinDepartureTime + ' → ' + element.DarwinArrivalTime;
    this.sharedSibling.journeySummaryModel.ReturnDuration = element.Duration;
    this.sharedSibling.journeySummaryModel.ReturnChanges = element.Changes;
    this.sharedSibling.journeySummaryModel.ReturnOperator = element.Operator;
    this.sharedSibling.journeySummaryModel.ReturnOperatorChange = element.OperatorChange;
    this.sharedSibling.journeySummaryModel.ReturnSaleCompany = element.SaleCompany;
    this.sharedSibling.journeySummaryModel.ReturnSearchCache = this.searchResponseReturn.Request.SearchCacheReturn;
    this.sharedSibling.journeySummaryModel.ReturnRouteModel = element;

    // hide promotional banner if other row is selected
    let setPromotionalBannerData = { display: false, promotionalData: this.promotionalData }
    this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);
  }

  checkReturnTravelSolution(travelSolution) {
    let fareList = travelSolution.ReturnFareList.length > 0 ? travelSolution.ReturnFareList : travelSolution.FareList;
    return fareList.some(m => m.ServiceId == this.selectedServiceId && m.OfferId == this.selectedOfferId);
  }

  getAllTravelSolution() {
    this.searchRequest.Searchtype = "";
    this.searchRequest.SearchtypeReturn = "";
    this.activeTab = 1;
    this.retainedDepartureTimesStart = null;
    this.retainedReturnTimesStart = null;
    //In case of return journey we got travel solution direction as forward
    if (this.searchRequest.TravelSolutionDirection == "RETURN" || this.searchRequest.TravelSolutionDirection == "FORWARD") {
      this.isReturnDataLoad = true;
      this.searchRequest.IsReturnRequest = true;
      this.searchRequest.TravelSolutionDirection = "FORWARD";
      this.getTravelSolutions();
    }
  }


  onClickGetEarlierSearch(isReturnCase) {
    if (this.isOutwardBeforeReturnJourney() || !isReturnCase) {
      this.isReturnDataLoad = isReturnCase;
      if (this.isReturnDataLoad) {
        this.searchRequest.TravelSolutionDirection = "FORWARD";
        this.searchRequest.SearchCacheReturn = this.searchResponseReturn.Request.SearchCacheReturn;
        this.searchRequest.SearchIndexReturn = this.searchResponseReturn.Request.SearchIndexReturn;
        this.searchRequest.TravelSolCountReturn = this.searchResponseReturn.Request.TravelSolCountReturn;
        this.searchRequest.SearchtypeReturn = "EARLIER";
      }
      else {
        this.searchRequest.TravelSolutionDirection = "FORWARD";
        this.searchRequest.SearchCache = this.searchResponse.Request.SearchCache;
        this.searchRequest.SearchIndex = this.searchResponse.Request.SearchIndex;
        this.searchRequest.TravelSolCount = this.searchResponse.Request.TravelSolCount;
        this.searchRequest.Searchtype = "EARLIER";
      }
      this.getTravelSolutions();
    }
    else {
      this._notificationservice.warn("Return service should not be before departing service.");
    }
  }

  onClickGetLaterSearch(isReturnCase) {
    if (this.isOutwardBeforeReturnJourney() || isReturnCase) {
      this.isReturnDataLoad = isReturnCase;
      if (this.isReturnDataLoad) {
        this.searchRequest.TravelSolutionDirection = "FORWARD";
        this.searchRequest.SearchCacheReturn = this.searchResponseReturn.Request.SearchCacheReturn;
        this.searchRequest.SearchIndexReturn = this.searchResponseReturn.Request.SearchIndexReturn;
        this.searchRequest.TravelSolCountReturn = this.searchResponseReturn.Request.TravelSolCountReturn;
        this.searchRequest.SearchtypeReturn = "LATER";
      }
      else {
        this.searchRequest.TravelSolutionDirection = "FORWARD";
        this.searchRequest.SearchCache = this.searchResponse.Request.SearchCache;
        this.searchRequest.SearchIndex = this.searchResponse.Request.SearchIndex;
        this.searchRequest.TravelSolCount = this.searchResponse.Request.TravelSolCount;
        this.searchRequest.Searchtype = "LATER";
      }
      this.getTravelSolutions();
    }
    else {
      this._notificationservice.warn("Return service should not be before departing service.");
    }
  }

  isOutwardBeforeReturnJourney(){
    let outwardLastTrain = this.searchResponse?.TravelSolutions?.length > 0 ? this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1] : null;
    let returnFirstTrain = this.searchResponseReturn?.TravelSolutions?.length > 0 ? this.searchResponseReturn.TravelSolutions[0] : null;

    if (outwardLastTrain && returnFirstTrain && (outwardLastTrain.ArrivalDate >= returnFirstTrain.DepartureDate)) {
      return false;
    } else {
      return true;
    }
  }

  clearAllSelectedTSAndTicket(){
    this.sharedSibling.singleSolutionFare = null;
    this.sharedSibling.returnFare = null;
  }
  
  doesFirstAndSecTravelSolDepartureTimeAmendExists() {
    if (this.sharedSibling.firstTravelSolDepartureTimeAmend != undefined && this.sharedSibling.firstTravelSolDepartureTimeAmend != "")
      this.searchRequest.DepartureTimesStart = moment(this.sharedSibling.firstTravelSolDepartureTimeAmend).format('YYYY-MM-DDTHH:mm');
    if (this.sharedSibling.secondTravelSolDepartureTimeAmend != undefined && this.sharedSibling.secondTravelSolDepartureTimeAmend != "")
      this.searchRequest.ReturnTimesStart = moment(this.sharedSibling.secondTravelSolDepartureTimeAmend).format('YYYY-MM-DDTHH:mm');

    if (this.searchRequest.SearchtypeReturn == "") {
      this.dataSource = null;
    }
  }

  resetJourneySummaryModelForSingleTravel() {
    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    if (this.searchResponse != null) {
      this.sharedSibling.journeySummaryModel.IsPromo = this.searchResponse.IsPromo;
    }
    if (this.responseData.Data.SingleTravel == null && this.searchRequest.Searchtype == '' && this.searchRequest.SearchtypeReturn == '') {
      this.searchResponse = null;
    }
  }

  getSearchResReturnInCaseOfRetTravel(notrainavailable) {
    if (this.responseData.Data.ReturnTravel) {
      let returnnotavailable;
      this.isStdPremiumAvailableReturn = false;
      this.searchResponseReturn = this.responseData.Data.ReturnTravel;

      if (new Date(this.searchResponseReturn.Date).getFullYear().toString() === '1') {
        this.searchResponseReturn.Date = new Date(this.searchRequest.ReturnTimesStart);
      }
      if (this.searchResponseReturn.TravelSolutions != null) {
        returnnotavailable = this.searchResponseReturn.TravelSolutions.filter(a => !a.IsRetTrainClosed)

        if (returnnotavailable.length <= 0) {
          this.sharedSibling.isReturnSearchErrorSoldOut = true;
          this.sharedSibling.timeoutErrorMessage = this.errorMessageEnum.soldOutErrorMessage;
        }
      }
      if ((returnnotavailable && returnnotavailable.length <= 0) && (notrainavailable && notrainavailable.length <= 0)) {
        this.sharedSibling.isSearchErrorSoldOut = true;
        this.sharedSibling.isReturnSearchErrorSoldOut = true;
        this.sharedSibling.timeoutErrorMessage = this.errorMessageEnum.soldOutErrorMessage;

      }
    }
  }

  clearAllSearchResponseReturn() {
    if (this.sharedSibling.isSearchErrorSoldOut || this.sharedSibling.isReturnSearchErrorSoldOut) {
      this.openAmendSearch();
    } else {
      this.hideEditQtt.emit();
    }

    if (this.responseData.Data.ReturnTravel == null && this.searchRequest.Searchtype == '' && this.searchRequest.SearchtypeReturn == '') {
      this.searchResponseReturn = null;
    }

    if (this.responseData.Data.SingleTravel && this.responseData.Data.ReturnTravel && this.responseData.Data.SingleTravel.TravelSolutions == null && this.responseData.Data.ReturnTravel.TravelSolutions == null) {
      this.searchResponse = null;
      this.searchResponseReturn = null;
    }
    if (this.searchResponse != null && this.searchResponse.IsShowPopup && !this.isReturnDataLoad) {
      this.showInfoPopup(this.searchResponse.Message);
    }
  }

  getDepartAndReturnTimeStart() {
    if (this.sharedSibling?.evaluateRequest != null && this.searchResponse?.TravelSolutions != null) {
      if (this.sharedSibling.firstTravelSolDepartureTimeAmend != undefined && this.sharedSibling.firstTravelSolDepartureTimeAmend != "") {
        this.searchRequest.DepartureTimesStart = moment(this.sharedSibling.firstTravelSolDepartureTimeAmend).format('YYYY-MM-DDTHH:mm');
        this.searchResponse.Request.DepartureTimesStart = moment(this.sharedSibling.firstTravelSolDepartureTimeAmend).format('YYYY-MM-DDTHH:mm');
      }
      if (this.sharedSibling.secondTravelSolDepartureTimeAmend != undefined && this.sharedSibling.secondTravelSolDepartureTimeAmend != "") {
        this.searchRequest.ReturnTimesStart = moment(this.sharedSibling.secondTravelSolDepartureTimeAmend).format('YYYY-MM-DDTHH:mm');
        this.searchResponseReturn.Request.ReturnTimesStart = moment(this.sharedSibling.secondTravelSolDepartureTimeAmend).format('YYYY-MM-DDTHH:mm');
      }
    }

    //Added a property so on earlier/later editQtt input dates do not change
    if (this.searchRequest.JourneySearchType == 'EARLIER' || this.searchRequest.JourneySearchType == 'LATER' || this.searchRequest.JourneySearchTypeReturn == 'EARLIER' || this.searchRequest.JourneySearchTypeReturn == 'LATER') {
      this.searchRequest.DepartureTimesStart = this.sharedSibling.editQttDepartureTimeStart;
      if (this.sharedSibling.editQttReturnTimeStart)
        this.searchRequest.ReturnTimesStart = this.sharedSibling.editQttReturnTimeStart;
    }
    if (this.responseData.Data.SingleTravel && this.responseData.Data.SingleTravel.IsPromo === true) {
      this.isPromotionAppliedSingle = true;
    }
    else {
      this.isPromotionAppliedSingle = false;
    }
  }

  getPromotionAppliedRetValue() {
    if (this.responseData.Data.ReturnTravel && this.responseData.Data.ReturnTravel.IsPromo === true) {
      this.isPromotionAppliedReturn = true;
    }
    else {
      this.isPromotionAppliedReturn = false;
    }
  }

  setPromotionalBannerDataForSingleAndRetSelectedFare() {
    try {
      let fullSoldOutJourney;
      this.searchResponseboth = new SearchResponseModel();
      this.searchResponseboth.TravelSolutions = this.searchResponse.TravelSolutions;
      this.searchResponseboth.RetTravelSolutions = this.searchResponseReturn ? this.searchResponseReturn.TravelSolutions : null;
      let outwardSelectedFare = this.sharedSibling?.journeySummaryModel?.SingleSelectedFare;
      let returnSelectedFare = this.sharedSibling?.journeySummaryModel?.ReturnSelectedFare;
      setTimeout(() => {
        let defaultSelectedRowForReturn = null;
        if (this.activeTab == 0) {
          if (this.expandedElementReturn) {
            defaultSelectedRowForReturn = this.expandedElementReturn.TravelSolId;
          }
        } else {
          defaultSelectedRowForReturn = this.selectedReturnTimeId;
        }
        let selectTravelSolParams = {
          searchRequest: this.searchRequest,
          searchSource: 'Homepage',
          searchSuccess: true,
          searchError: '',
          searchResponse: this.searchResponseboth,
          defaultSelectedRow: this.defaultSelectedRow,
          selectedRow: -1,
          selectedPrice: null,
          defaultSelectedRowSingleReturn: defaultSelectedRowForReturn,
          SelectedRowReturn: -1
        }
        this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, this.activeTab, false, [...this.cheapestTravelSolutionId, ...this.cheapestTravelSolutionIdSingleReturn], outwardSelectedFare, returnSelectedFare, this.activeTab);
      }, 1000);
      // ga4-datalayer search and view_list_item event
      let ga4SearchEventParam = new GA4SearchEventParam();
      ga4SearchEventParam.searchSource = 'Homepage';
      ga4SearchEventParam.searchSuccess = true;
      ga4SearchEventParam.searchError = '';
      this.ga4datalayerService.loadGA4DataLayerOnSearch(this.searchRequest, ga4SearchEventParam, this.searchResponseboth, this.activeTab, [...this.cheapestTravelSolutionId, ...this.cheapestTravelSolutionIdSingleReturn], outwardSelectedFare, returnSelectedFare);
      
      if (this.isExistSoldOutJourney()) {
        let notrainavailable = this.searchResponse?.TravelSolutions.filter(a => a?.IsTrainClosed);
        let notrainavailableForReturn = this.searchResponseReturn?.TravelSolutions.filter(a => a?.IsTrainClosed);
        if (notrainavailable?.length == 5 && notrainavailableForReturn?.length == 5) {
          fullSoldOutJourney = true;
        }
        this.ga4datalayerService.loadGALayerForSoldOutClassOnSearchResults(this.searchRequest, this.searchResponseboth, fullSoldOutJourney);
      }
    } catch (error) {
      console.log(error);
    }

    this.callSetPromotionalBannerDataMethod();
  }

  callSetPromotionalBannerDataMethod(){
    if (this.sharedSibling.journeySummaryModel.SingleSelectedFare) {
      this.setPromotionalBannerData(this.sharedSibling.journeySummaryModel.SingleSelectedFare, this.sharedSibling.journeySummaryModel.SingleRouteModel, false);
    }
    if (this.sharedSibling.journeySummaryModel.ReturnSelectedFare) {
      this.setPromotionalBannerData(this.sharedSibling.journeySummaryModel.ReturnSelectedFare, this.sharedSibling.journeySummaryModel.ReturnRouteModel, true);
    }
  }

  getTimeOutErrorMessage() {
    if (this.responseData.ResponseCode == '201') {
      if (this.responseData.Data.IsNoResultsForChangesFilters) {
        this.sharedSibling.timeoutErrorMessage = this.responseData.Data.ChangesFilterMessage;
      }
      else if (this.responseData.Data.IsNoResultsForOperartorFilters) {
        this.sharedSibling.timeoutErrorMessage = this.responseData.Data.OperartorFilterMessage;
      }
      else {
        this.sharedSibling.timeoutErrorMessage = "Sorry, that's our fault.";
      }
    } else if (this.responseData.ResponseCode == '202') {

      this.sharedSibling.timeoutErrorMessage = this.responseData.ResponseMessage;
    }
    else {
      this.sharedSibling.timeoutErrorMessage = "Sorry, that's our fault.";
    }

    if (this.responseData.ResponseCode == '202') {
      this.sharedSibling.isEarlierLaterSearchApiError = true;
    } else {
      this.timeoutFlag = true;
      this.sharedSibling.isSearchApiError = true;
    }
  }

  callGa4DataLayerOnSearch() {
    try {
      let fullSoldOutJourney;
      let selectTravelSolParams = {
        searchRequest: this.searchRequest,
        searchSource: 'Homepage',
        searchSuccess: false,
        searchError: this.responseData.ResponseMessage,
        searchResponse: null,
        defaultSelectedRow: -1,
        selectedRow: -1,
        selectedPrice: null,
        defaultSelectedRowSingleReturn: -1,
        SelectedRowReturn: -1
      }
      this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, -1, false, [...this.cheapestTravelSolutionId, ...this.cheapestTravelSolutionIdSingleReturn], null, null, -1);
      // ga4-datalayer search and view_list_item event
      let ga4SearchEventParam = new GA4SearchEventParam()
      ga4SearchEventParam.searchSource = 'Homepage';
      ga4SearchEventParam.searchSuccess = false;
      ga4SearchEventParam.searchError = this.responseData.ResponseMessage;
      this.ga4datalayerService.loadGA4DataLayerOnSearch(this.searchRequest, ga4SearchEventParam, null, -1, [...this.cheapestTravelSolutionId, ...this.cheapestTravelSolutionIdSingleReturn], null, null);
      
      if (this.isExistSoldOutJourney()) {
        let notrainavailable = this.searchResponse?.TravelSolutions.filter(a => a?.IsTrainClosed);
        let notrainavailableForReturn = this.searchResponseReturn?.TravelSolutions.filter(a => a?.IsTrainClosed);
        if (notrainavailable?.length == 5 && notrainavailableForReturn?.length == 5) {
          fullSoldOutJourney = true;
        }
        this.ga4datalayerService.loadGALayerForSoldOutClassOnSearchResults(this.searchRequest, this.searchResponseboth, fullSoldOutJourney);
      }
    } catch (error) {
      console.log(error);
    }
    this.isBuyNowDisable = true;
    this.isBuyNowDisableReturn = true;
    this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.totalFare = 0;
  }

  getDepartAndRetTimeStartInCaseOfTravelType() {
    if (this.searchRequest.TraveltypeReturn == 'DEPARTAFTER') {
      if (this.searchRequest.SearchtypeReturn == 'EARLIER') {
        let numberOfMlSeconds = new Date(this.searchRequest.FirstTrainDepartureTimesStartReturn).getTime();
        let subtractMlSeconds = 20 * 60 * 60 * 1000;
        this.searchRequest.ReturnTimesStart = moment(new Date(numberOfMlSeconds - subtractMlSeconds)).format('YYYY-MM-DDTHH:mm');
        let addFifteenMins = 0.25 * 60 * 60 * 1000;
        if (this.searchRequest.ReturnTimesStart <= this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].DepartureDate) {
          //when see earlier of return -- returnTimestart would be outwards last train departture time plus 15 min  
          let numberOfMlSecondsOne = new Date(this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].DepartureDate).getTime();
          this.searchRequest.ReturnTimesStart = moment(new Date(numberOfMlSecondsOne + addFifteenMins)).format('YYYY-MM-DDTHH:mm');
        }
      } else if (this.searchRequest.SearchtypeReturn == 'LATER') {
        // earlierLater Changes
        this.searchRequest.ReturnTimesStart = moment(new Date(this.searchRequest.LastTrainDepartureTimesStartReturn)).format('YYYY-MM-DDTHH:mm');
      }
    } else {
      if (this.searchRequest.SearchtypeReturn == 'EARLIER') {
        // earlierLater Changes
        this.searchRequest.ReturnTimesStart = moment(new Date(this.searchRequest.FirstTrainArrivalTimesStartReturn).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');

      } else if (this.searchRequest.SearchtypeReturn == 'LATER') {
        // earlierLater Changes
        this.searchRequest.ReturnTimesStart = moment(new Date(this.searchRequest.LastTrainArrivalTimesStartReturn).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');
      }
    }
  }

  getTimeoutErrMsgToNoResultsForNewEarlierLater() {
    // on click outward's earlier for trains before current DateTime
    if (this.responseData.Data.IsNoResultsForNewEarlierLater) {
      this.sharedSibling.isEarlierLaterSearchApiError = true;
      this.sharedSibling.timeoutErrorMessage = `Sorry, your ticket search failed to load.To get back on track please try again`;
    }
  }

  fineNoTrainsAvailable(notrainavailable) {
    if (notrainavailable.length <= 0) {
      this.sharedSibling.isSearchErrorSoldOut = true;
      this.sharedSibling.timeoutErrorMessage = this.errorMessageEnum.soldOutErrorMessage;
    }
    let departedOrCacelledTrain = this.searchResponse.TravelSolutions.filter(a => !(a.IsAlreadyDepartured || a.IsCancelled))
    if (departedOrCacelledTrain.length <= 0) {
      this.sharedSibling.isTrainDepartedOrCancelled = true;
    }
  }

  doesSingleTravelExists() {
    return this.responseData?.Data?.SingleTravel?.TravelSolutions != null;
  }

  checkJourneySearchTypeValue() {
    //Added a property so on earlier/later editQtt input dates do not change   
    if (this.searchRequest.JourneySearchType == 'EARLIER' || this.searchRequest.JourneySearchType == 'LATER' || this.searchRequest.JourneySearchTypeReturn == 'EARLIER' || this.searchRequest.JourneySearchTypeReturn == 'LATER') {
      this.searchRequest.DepartureTimesStart = this.sharedSibling.editQttDepartureTimeStart;
      if (this.sharedSibling.editQttReturnTimeStart)
        this.searchRequest.ReturnTimesStart = this.sharedSibling.editQttReturnTimeStart;
    }
  }

  callGetTravelSolution() {
    this.searchSolutionService.getSolutions(this.searchRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          this.searchRequest.TravelSolutionDirection = "RETURN";
          if (this.responseData.ResponseCode == '200') {
            let notrainavailable;
            this.timeoutFlag = false;
            this.sharedSibling.isSearchApiError = false;
            this.sharedSibling.isEarlierLaterSearchApiError = false;
            this.sharedSibling.isSearchErrorSoldOut = false;
            this.sharedSibling.isReturnSearchErrorSoldOut = false;
            this.sharedSibling.isTrainDepartedOrCancelled = false;

            this.getTimeoutErrMsgToNoResultsForNewEarlierLater();

            if (this.doesSingleTravelExists()) {
              this.isStdPremiumAvailableOutwardSingle = false;
              this.isStdPremiumAvailableOutwardReturn = false;
              this.searchResponse = this.responseData.Data.SingleTravel;
              localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting, String(this.searchResponse.IsReviewMergedFlowEnabled));

              if (this.searchResponse != null) {

                notrainavailable = this.searchResponse.TravelSolutions.filter(a => !a.IsTrainClosed)

                this.fineNoTrainsAvailable(notrainavailable);

              }
            }

            this.resetJourneySummaryModelForSingleTravel();

            this.getSearchResReturnInCaseOfRetTravel(notrainavailable);

            this.clearAllSearchResponseReturn();

            this.getDepartAndReturnTimeStart();

            this.getPromotionAppliedRetValue();

            this.setTravelSolutionData(this.searchResponseReturn);

            this.setPromotionalBannerDataForSingleAndRetSelectedFare();

          }
          else {

            this.checkJourneySearchTypeValue();

            this.getTimeOutErrorMessage();

            this.callGa4DataLayerOnSearch();

          }
        }

      });
  }

  isRetainedReturnTimeStart() {
    if (this.retainedReturnTimesStart) {
      this.searchRequest.ReturnTimesStart = moment(new Date(this.retainedReturnTimesStart)).format('YYYY-MM-DDTHH:mm');
    }
  }

  getDepartAndRetTimeStartInCaseSearchType() {
    if (this.searchRequest.Searchtype == 'EARLIER') {
      let numberOfMlSeconds = new Date(this.searchRequest.FirstTrainDepartureTimesStart).getTime();
      let subtractMlSeconds = 20 * 60 * 60 * 1000;
      this.searchRequest.DepartureTimesStart = moment(new Date(numberOfMlSeconds - subtractMlSeconds)).format('YYYY-MM-DDTHH:mm');
    } else if (this.searchRequest.Searchtype == 'LATER') {

      this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.LastTrainDepartureTimesStart)).format('YYYY-MM-DDTHH:mm');

      if (this.searchRequest.SearchtypeReturn == 'EARLIER' && (new Date(this.searchRequest.DepartureTimesStart).getDate() == new Date(this.searchRequest.ReturnTimesStart).getDate())) {
        let numberOfMlSeconds = new Date(this.searchResponseReturn.TravelSolutions[0].DepartureDate).getTime();
        let subtractMlSeconds = 0.25 * 60 * 60 * 1000;
        this.searchRequest.ReturnTimesStart = moment(new Date(numberOfMlSeconds - subtractMlSeconds)).format('YYYY-MM-DDTHH:mm');
      }
    }
  }

  doesAvantiTravelSolExistsInCaseReturnDtafalse() {
    if (this.searchResponse?.TravelSolutions) {

      this.isRetainedReturnTimeStart();
      
      this.searchRequest.FirstTrainDepartureTimesStart = this.searchResponse.TravelSolutions[0].DepartureDate;
      this.searchRequest.LastTrainDepartureTimesStart = this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].DepartureDate;
      this.searchRequest.FirstTrainArrivalTimesStart = this.searchResponse.TravelSolutions[0].ArrivalDate;
      this.searchRequest.LastTrainArrivalTimesStart = this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].ArrivalDate;
      if (this.searchRequest.Traveltype == 'DEPARTAFTER') {

        this.getDepartAndRetTimeStartInCaseSearchType();

      } else {
        if (this.searchRequest.Searchtype == 'EARLIER') {
          this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.FirstTrainArrivalTimesStart).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');
        } else if (this.searchRequest.Searchtype == 'LATER') {
          this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.LastTrainArrivalTimesStart).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');

        }
      }
      this.retainedDepartureTimesStart = this.searchRequest.DepartureTimesStart;
    }
  }

  getFirstAndLastTrainDepartRetTimeStart() {
    if (this.searchResponseReturn?.TravelSolutions) {
      // earlierLater Changes
      if (this.retainedDepartureTimesStart) {
        this.searchRequest.DepartureTimesStart = moment(new Date(this.retainedDepartureTimesStart)).format('YYYY-MM-DDTHH:mm');
      }
      this.searchRequest.FirstTrainDepartureTimesStartReturn = this.searchResponseReturn.TravelSolutions[0].DepartureDate;
      this.searchRequest.LastTrainDepartureTimesStartReturn = this.searchResponseReturn.TravelSolutions[this.searchResponseReturn.TravelSolutions.length - 1].DepartureDate;
      this.searchRequest.FirstTrainArrivalTimesStartReturn = this.searchResponseReturn.TravelSolutions[0].ArrivalDate;
      this.searchRequest.LastTrainArrivalTimesStartReturn = this.searchResponseReturn.TravelSolutions[this.searchResponseReturn.TravelSolutions.length - 1].ArrivalDate;

      this.getDepartAndRetTimeStartInCaseOfTravelType();

      this.retainedReturnTimesStart = this.searchRequest.ReturnTimesStart;
    }
  }

  getTravelSolutions() {
    this.clearAllSelectedTSAndTicket();

    this.doesFirstAndSecTravelSolDepartureTimeAmendExists();

    this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.DepartureTimesStart)).format('YYYY-MM-DDTHH:mm');
    this.searchRequest.ReturnTimesStart = moment(new Date(this.searchRequest.ReturnTimesStart)).format('YYYY-MM-DDTHH:mm');
    if (this.searchRequest.Searchtype || this.searchRequest.SearchtypeReturn) {
      // earlierLater Changes
      if (!this.isReturnDataLoad) {
        this.searchRequest.JourneySearchType = this.searchRequest.Searchtype;

        this.doesAvantiTravelSolExistsInCaseReturnDtafalse();

      } else {
        this.searchRequest.JourneySearchTypeReturn = this.searchRequest.SearchtypeReturn;

        this.getFirstAndLastTrainDepartRetTimeStart();
      }
    }
    this.callGetTravelSolution();
  }

  getReturnTravelSolutions(searchResponseReturn) {
    this.dataSourceReturn = null;
    this.searchRequest.TravellerId = this.searchResponse.Request.TravellerId;
    this.searchResponseReturn = searchResponseReturn;

    if (this.searchResponseReturn.IsShowPopup && this.isReturnDataLoad) {
      this.showInfoPopup(this.searchResponseReturn.Message);
    }
 
    this.setReturnTravelSolutionData();
    
    // earlierLater Changes
      this.dataSource = new MatTableDataSource(this.searchResponse.TravelSolutions);
    this.dataSourceReturn = new MatTableDataSource(this.searchResponseReturn.TravelSolutions);
  }
  isTicketTypeAdvance(ticketType: string) {
    if (ticketType != undefined && ticketType != "") {
      ticketType = ticketType.toLowerCase();
      if (ticketType.indexOf('advance') != -1) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }
  showInfoPopup(message: string) {

    this.dialog.open(InfoPopupComponent, {
      width: '500px',
      disableClose: false,
      data: {
        Message: message
      }
    });  
  }

  doesAvantiTravelSolSingleRetLengthExists(avantiTravelSolutionSingleReturn, avantiTravelSolutionSingleReturnPrice) {
    if (avantiTravelSolutionSingleReturn != null && avantiTravelSolutionSingleReturn.length > 0) {
      let avantiTravelSolutionSingleReturnMinFarePrice = Math.min.apply(Math, avantiTravelSolutionSingleReturnPrice.filter((travelSolution) => travelSolution.SingleFare > 0).map(function (o) { return o.SingleFare; }));
      this.tabMinFareSingleReturn = avantiTravelSolutionSingleReturnMinFarePrice;
    }
  }

  findAvantiTravelSolutionSingleReturnList(avantiTravelSolutionSingleReturn) {
    let found = this.searchResponseReturn.TravelSolutions.some(m => m.Operator == '1' || m.Operator == '2');
    if (!found) {
      avantiTravelSolutionSingleReturn = this.searchResponseReturn.TravelSolutions.filter(m => (!m.IsAlreadyDepartured));
    } else {
      avantiTravelSolutionSingleReturn = this.searchResponseReturn.TravelSolutions.filter(m => ((m.Operator == '1' || m.Operator == '2') && !m.IsAlreadyDepartured));

    }
    return avantiTravelSolutionSingleReturn;
  }

  getActiveTabValue(minFareAvantiTravelSolutionSingleReturnListPrice) {
    this.tabMinFareOutWard = minFareAvantiTravelSolutionSingleReturnListPrice[0].SingleFare;
    this.totalForReuturnAndSigle = this.tabMinFareOutWard + this.tabMinFareSingleReturn;
    if (this.sharedSibling.returnFare != null && this.sharedSibling.activeTabValue == 1) {
      this.activeTab = 1
    } else if (this.sharedSibling.singleSolutionFare != null && this.sharedSibling.activeTabValue == 0) {
      this.activeTab = 0
    } else {
      this.activeTab = (this.tabMinFareReturn > this.totalForReuturnAndSigle) ? 0 : 1;
    }
  }

  resetJourneySummaryForNewFareData(minFareAvantiTravelSolutionSingleReturnList) {
    minFareAvantiTravelSolutionSingleReturnList[0].NewFareList.forEach(x => {
      if (x.IsMinPrice) {

        x.FareList.forEach(element => {
          if (element.MinPrice && !element.IsSeatAvailable) {

            if (this.sharedSibling.journeySummaryModel == null) {
              this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
            }
            this.sharedSibling.journeySummaryModel.SingleTime = minFareAvantiTravelSolutionSingleReturnList[0].DarwinDepartureTime + ' → ' + minFareAvantiTravelSolutionSingleReturnList[0].DarwinArrivalTime;
            this.sharedSibling.journeySummaryModel.SingleDuration = minFareAvantiTravelSolutionSingleReturnList[0].Duration;
            this.sharedSibling.journeySummaryModel.SingleChanges = minFareAvantiTravelSolutionSingleReturnList[0].Changes;
            this.sharedSibling.journeySummaryModel.SingleTicketType = element.TicketTypeName;
            this.sharedSibling.journeySummaryModel.SingleCurrency = element.Currency;
            this.sharedSibling.journeySummaryModel.SinglePrice = element.Price;
            this.sharedSibling.journeySummaryModel.SingleTicketDescription = element.TicketDescription;
            this.sharedSibling.journeySummaryModel.SingleOperator = minFareAvantiTravelSolutionSingleReturnList[0].Operator;
            this.sharedSibling.journeySummaryModel.SingleOperatorChange = minFareAvantiTravelSolutionSingleReturnList[0].OperatorChange;
            this.sharedSibling.journeySummaryModel.SingleSaleCompany = minFareAvantiTravelSolutionSingleReturnList[0].SaleCompany;
            this.sharedSibling.journeySummaryModel.SingleSearchCache = this.searchResponse.Request.SearchCache;
            this.sharedSibling.journeySummaryModel.SingleRouteModel = minFareAvantiTravelSolutionSingleReturnList[0];
            this.sharedSibling.journeySummaryModel.IsSingleFareSelected = true;
          }
        });
      }
    });
    this.singleFare = this.sharedSibling.journeySummaryModel.SinglePrice;
    this.totalFare = this.sharedSibling.journeySummaryModel.SinglePrice + ((this.sharedSibling.journeySummaryModel.ReturnPrice != undefined && this.sharedSibling.journeySummaryModel.ReturnPrice != null) ? this.sharedSibling.journeySummaryModel.ReturnPrice : 0);
    this.isSingleFareSelected = true;
    this.defaultSelectedRow = minFareAvantiTravelSolutionSingleReturnList[0].TravelSolId;
    this.expandedElement = minFareAvantiTravelSolutionSingleReturnList[0];
    this.selectedTravelSolution = minFareAvantiTravelSolutionSingleReturnList[0];
    this.singleFareCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
    this.tabMinFareReturnCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
  }

  resetJourneySummaryForNewRetFareData(minFareAvantiTravelSolutionSingleReturnList) {
    minFareAvantiTravelSolutionSingleReturnList[0].NewReturnFareList.forEach(x => {
      if (x.IsMinPrice) {
        x.FareList.forEach(fareListObj => {
          if (fareListObj.MinPrice && !fareListObj.IsSeatAvailable) {
            if (this.sharedSibling.journeySummaryModel == null) {
              this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
            }
            this.sharedSibling.journeySummaryModel.SingleTime = minFareAvantiTravelSolutionSingleReturnList[0].DarwinDepartureTime + ' → ' + minFareAvantiTravelSolutionSingleReturnList[0].DarwinArrivalTime;
            this.sharedSibling.journeySummaryModel.SingleDuration = minFareAvantiTravelSolutionSingleReturnList[0].Duration;
            this.sharedSibling.journeySummaryModel.SingleChanges = minFareAvantiTravelSolutionSingleReturnList[0].Changes;
            this.sharedSibling.journeySummaryModel.SingleTicketType = fareListObj.TicketTypeName;
            this.sharedSibling.journeySummaryModel.SingleCurrency = fareListObj.Currency;
            this.sharedSibling.journeySummaryModel.SinglePrice = fareListObj.Price;
            this.sharedSibling.journeySummaryModel.SingleTicketDescription = fareListObj.TicketDescription;
            this.sharedSibling.journeySummaryModel.SingleOperator = minFareAvantiTravelSolutionSingleReturnList[0].Operator;
            this.sharedSibling.journeySummaryModel.SingleOperatorChange = minFareAvantiTravelSolutionSingleReturnList[0].OperatorChange;
            this.sharedSibling.journeySummaryModel.SingleSaleCompany = minFareAvantiTravelSolutionSingleReturnList[0].SaleCompany;
            this.sharedSibling.journeySummaryModel.SingleSearchCache = this.searchResponse.Request.SearchCache;
            this.sharedSibling.journeySummaryModel.SingleRouteModel = minFareAvantiTravelSolutionSingleReturnList[0];
            this.sharedSibling.journeySummaryModel.IsSingleFareSelected = false;
          }
        });
      }
    });
  }
  
  setFareBreakDownModelDataForOutJourney(minFareItem) {
    this.selectedOfferId = minFareItem[0].OfferId;
    this.selectedServiceId = minFareItem[0].ServiceId;
    this.selectedFare = minFareItem[0];

    if (this.activeTab == 1) {
      this.CheckSeatAvailalble(this.selectedFare.TicketTypeName, this.selectedFare.TicketClass)
    }
    this.ticketDescription = minFareItem[0].TicketDescription;
    this.ticketRestriction = minFareItem[0].TicketRestriction;
    this.sharedSibling.journeySummaryModel.SingleSelectedFare = minFareItem[0];
    this.sharedSibling.sendFareData(minFareItem[0]);

    //Fare Breakdown Latest
    this.sharedSibling.resetFareBreakDownData();
    this.sharedSibling.fareBreakdownModelData[0].IsReturnJourney = true;
    this.sharedSibling.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
    minFareItem[0].FareDetails.forEach(minFareItemFareDetail => {
      let outJourney = new JourneyModel;
      outJourney.Passenger = minFareItemFareDetail.FarePerson;//'1 * Adult';
      outJourney.PricePerPerson = minFareItemFareDetail.BasePrice;
      outJourney.TotalPrice = minFareItemFareDetail.Price;
      outJourney.RailCard = minFareItemFareDetail.Railcard;
      outJourney.IsCheck = minFareItemFareDetail.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].OutWardJourney.push(outJourney);
    });
  }

  getCheapestTravelSolutionReturnId(minFareAvantiTravelSolutionSingleReturnList) {
    this.cheapestTravelSolutionReturnId = [];
    for (let index = 0; index < minFareAvantiTravelSolutionSingleReturnList.length; index++) {
      this.cheapestTravelSolutionReturnId[index] = minFareAvantiTravelSolutionSingleReturnList[index].TravelSolId;
    }
  }

  findAvantiTravelSolutionSingleRetListFromNonSalable(AvantiTravelSolutionSingleReturn, nonSalableTravelSoutionReturnPreSelect) {
    let foundValue = nonSalableTravelSoutionReturnPreSelect.some(m => m.Operator == '1' || m.Operator == '2');
    if (!foundValue) {
      AvantiTravelSolutionSingleReturn = nonSalableTravelSoutionReturnPreSelect.filter(m => (!m.IsAlreadyDepartured));
    } else {
      AvantiTravelSolutionSingleReturn = nonSalableTravelSoutionReturnPreSelect.filter(m => ((m.Operator == '1' || m.Operator == '2') && !m.IsAlreadyDepartured));

    }
    return AvantiTravelSolutionSingleReturn;
  }

  findNonSalableTravelSoultionRetListFromRetFare(nonSalableTravelSoutionReturn) {
    if (this.sharedSibling.returnFare != null && this.sharedSibling.activeTabValue != 1) {
      nonSalableTravelSoutionReturn = this.searchResponse.TravelSolutions.filter(m => m.ReturnFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured && !m.IsTrainClosed);
    } else {
      nonSalableTravelSoutionReturn = this.searchResponse.TravelSolutions.filter(m => m.ReturnFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured && !m.IsRetTrainClosed);
    }
    return nonSalableTravelSoutionReturn;
  }

  setMinFareAvantiTravelSolutionSingleReturnList(minFareAvantiTravelSolutionSingleReturnList, AvantiTravelSolutionSingleReturn) {
    if (this.doesMinFareAvantiTravelSolSingleReturnExists(minFareAvantiTravelSolutionSingleReturnList)) {
      if (minFareAvantiTravelSolutionSingleReturnList.length > 1) {
        minFareAvantiTravelSolutionSingleReturnList.sort((a, b) => a.DurationMinute - b.DurationMinute);
      }
      let minFareItem;
      if (this.activeTab == 0) {
        let AvantiTravelSolutionSingleReturnMinFareOne = Math.min.apply(Math, AvantiTravelSolutionSingleReturn.map(function (o) { return o.SingleFare; }));

        let minFareAvantiTravelSolutionSingleReturnList = AvantiTravelSolutionSingleReturn.filter(m => m.SingleFare == AvantiTravelSolutionSingleReturnMinFareOne);
        if (minFareAvantiTravelSolutionSingleReturnList.length > 1)
          minFareAvantiTravelSolutionSingleReturnList.sort((a, b) => a.DurationMinute - b.DurationMinute);

        this.getCheapestTravelSolutionReturnId(minFareAvantiTravelSolutionSingleReturnList);

        minFareItem = minFareAvantiTravelSolutionSingleReturnList[0].FareList.filter(m => m.MinPrice);

        this.resetJourneySummaryForNewFareData(minFareAvantiTravelSolutionSingleReturnList);
      }
      else {
        minFareItem = minFareAvantiTravelSolutionSingleReturnList[0].ReturnFareList.filter(m => m.Price == minFareAvantiTravelSolutionSingleReturnList[0].ReturnFare);
        this.singleFare = minFareAvantiTravelSolutionSingleReturnList[0].ReturnFare;
        this.totalFare = minFareAvantiTravelSolutionSingleReturnList[0].ReturnFare;

        this.resetJourneySummaryForNewRetFareData(minFareAvantiTravelSolutionSingleReturnList);
        
        this.isSingleFareSelected = false;
        this.defaultSelectedRow = minFareAvantiTravelSolutionSingleReturnList[0].TravelSolId;
        this.expandedElement = minFareAvantiTravelSolutionSingleReturnList[0];
        this.selectedTravelSolution = minFareAvantiTravelSolutionSingleReturnList[0];
        this.singleFareCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
        this.tabMinFareReturnCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
      }
      this.setFareBreakDownModelDataForOutJourney(minFareItem);
    }
    else {
      this.resetTravelSolValueInCaseOfTravelSolLengthNotExists();
    }
  }

  getAvantiTravelSolutionSingleReturnFromNonSalable(nonSalableTravelSoutionReturnPreSelect, AvantiTravelSolutionSingleReturn) {
    let AvantiTravelSolutionSingleReturnPrice = nonSalableTravelSoutionReturnPreSelect.filter(m => (!m.IsAlreadyDepartured));
    if (this.doesAvantiTravelSolutionSingleReturnExists(AvantiTravelSolutionSingleReturn)) {
      let AvantiTravelSolutionSingleReturnMinFare = Math.min.apply(Math, AvantiTravelSolutionSingleReturn.map(function (o) { return o.ReturnFare; }));
      let AvantiTravelSolutionSingleReturnMinFarePrice = Math.min.apply(Math, AvantiTravelSolutionSingleReturnPrice.map(function (o) { return o.SingleFare; }));
      let AvantiTravelSolutioneturnMinFarePrice = Math.min.apply(Math, AvantiTravelSolutionSingleReturnPrice.map(function (o) { return o.ReturnFare; }));
      this.tabMinFareReturn = 0;
      this.tabMinFareOutWard = 0;
      this.totalForReuturnAndSigle = 0;
      this.tabMinFareReturn = AvantiTravelSolutioneturnMinFarePrice;
      let minFareAvantiTravelSolutionSingleReturnList = AvantiTravelSolutionSingleReturn.filter(m => m.ReturnFare == AvantiTravelSolutionSingleReturnMinFare);
      let minFareAvantiTravelSolutionSingleReturnListPrice = AvantiTravelSolutionSingleReturnPrice.filter(m => m.SingleFare == AvantiTravelSolutionSingleReturnMinFarePrice);

      this.getActiveTabValue(minFareAvantiTravelSolutionSingleReturnListPrice);

      this.setMinFareAvantiTravelSolutionSingleReturnList(minFareAvantiTravelSolutionSingleReturnList, AvantiTravelSolutionSingleReturn);

    }
    else {
      this.resetTravelSolValueInCaseOfTravelSolLengthNotExists();
    }
  }

  sortMinFareTravelSolutionList(minFareTravelSolutionListReturn) {
    if (this.isMinFareTravelSolutionReturnListExists(minFareTravelSolutionListReturn)) {
      minFareTravelSolutionListReturn.sort((a, b) => a.DurationMinute - b.DurationMinute);

      this.getCheapestTravelSolutionIdReturnList(minFareTravelSolutionListReturn);

      let nonSalableTravelSoutionReturnPreSelect = this.searchResponse.TravelSolutions.filter(m => m.ReturnFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured && !m.IsSingleSaleable && !m.IsReturnSaleable && !m.IsTrainClosed);
      let AvantiTravelSolutionSingleReturn;
      AvantiTravelSolutionSingleReturn = this.findAvantiTravelSolutionSingleRetListFromNonSalable(AvantiTravelSolutionSingleReturn, nonSalableTravelSoutionReturnPreSelect);
      this.getAvantiTravelSolutionSingleReturnFromNonSalable(nonSalableTravelSoutionReturnPreSelect, AvantiTravelSolutionSingleReturn);
    }
  }

  isMinDurationTravelSolutionList(minFareTravelSolutionList) {
    if (this.isMinFareTravelSolutionExists(minFareTravelSolutionList)) {
      minFareTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);

      this.getCheapestTravelSolutionIdList(minFareTravelSolutionList);

      let nonSalableTravelSoutionReturn;

      nonSalableTravelSoutionReturn = this.findNonSalableTravelSoultionRetListFromRetFare(nonSalableTravelSoutionReturn);
      if (this.doesNonSalableTravelSoutionReturnExists(nonSalableTravelSoutionReturn)) {
        let travelSolutionMinFareReturn = Math.min.apply(Math, nonSalableTravelSoutionReturn.map(function (o) { if (!o.IsSaleable) { return o.ReturnFare; } }));
        let travelSolutionMinDurationReturn = Math.min.apply(Math, nonSalableTravelSoutionReturn.map(function (o) { return o.DurationMinute; }));
        let minDurationTravelSolutionListReturn = nonSalableTravelSoutionReturn.filter(m => m.DurationMinute == travelSolutionMinDurationReturn && !m.IsAlreadyDepartured);

        this.getFastestTravelSolutionIdReturnList(minDurationTravelSolutionListReturn);

        let minFareTravelSolutionListReturn = nonSalableTravelSoutionReturn.filter(m => m.ReturnFare == travelSolutionMinFareReturn && !m.IsAlreadyDepartured);

        this.sortMinFareTravelSolutionList(minFareTravelSolutionListReturn);
      } else {
        let AvantiTravelSolutionSingleReturn;
        AvantiTravelSolutionSingleReturn = this.findAvantiTravelSolutionSingleRetListFromNonSalable(AvantiTravelSolutionSingleReturn, minFareTravelSolutionList);
        this.getActiveTabValue(minFareTravelSolutionList);
        this.activeTab = 0;
        this.setMinFareAvantiTravelSolutionSingleReturnList(minFareTravelSolutionList, AvantiTravelSolutionSingleReturn);
      }
      this.setDefaultSelectedOnLoad();
    }
  }

  //for tab 1 and tab 2 for outward journey 
  setTravelSolutionData(searchResponseReturn) {
    this.travelSolutionCache = this.searchResponse.Request.SearchCache;
    this.isHideEarlier = this.searchResponse.HideEarlier;
    this.isHideLater = this.searchResponse.HideLater;

    if (this.searchResponse.TravelSolutions != null) {
      let avantiTravelSolutionSingleReturn;
      let avantiTravelSolutionSingleReturnPrice;
      
      if (this.searchResponseReturn.TravelSolutions != null) {

        avantiTravelSolutionSingleReturn = this.findAvantiTravelSolutionSingleReturnList(avantiTravelSolutionSingleReturn);

        avantiTravelSolutionSingleReturnPrice = this.searchResponseReturn.TravelSolutions.filter(m => (!m.IsAlreadyDepartured));
      }
      this.tabMinFareSingleReturn = 0;

      this.doesAvantiTravelSolSingleRetLengthExists(avantiTravelSolutionSingleReturn, avantiTravelSolutionSingleReturnPrice);

      //defaultcase check of seat not  available 
      let nonSalableTravelSoution = this.searchResponse.TravelSolutions.filter(m => m.SingleFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured && !m.IsTrainClosed);
      if (this.isNonSalableTravelSolutionExists(nonSalableTravelSoution)) {
        let travelSolutionMinDuration = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.DurationMinute; }));
        let minDurationTravelSolutionList = this.searchResponse.TravelSolutions.filter(m => m.DurationMinute == travelSolutionMinDuration);

        this.isLengthOfMinDurationTravelSolutionListExists(minDurationTravelSolutionList);

        let travelSolutionMinFare = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.SingleFare; }));
        let minFareTravelSolutionList = this.searchResponse.TravelSolutions.filter(m => m.SingleFare == travelSolutionMinFare && !m.IsSaleable && !m.IsAlreadyDepartured);
        
        this.isMinDurationTravelSolutionList(minFareTravelSolutionList);
        
        this.getReturnTravelSolutions(searchResponseReturn);
        this.dataSource = new MatTableDataSource(this.searchResponse.TravelSolutions);
      }
      else {
        // case when all outward solution soldout/ departed/ cancelled
        this.sharedSibling.journeySummaryModel.SinglePrice = 0;
        this.totalForReuturnAndSigle = this.totalForReuturnAndSigle - this.singleFare;
        this.selectedOfferId = 0;
        this.selectedServiceId = 0;
        this.getReturnTravelSolutions(searchResponseReturn);
      }
    }
    this.searchRequest.TravellerId = this.searchResponse.Request.TravellerId;
    this.searchRequest.DepartureTimesStartShow = this.searchResponse.Date;
  }

  checkStringExist(allText: string, str: string) {
    if (str != undefined && str != "" && allText != undefined && allText != "") {
      if ((allText.trim()).toLowerCase() == (str.trim()).toLowerCase()) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      return false
    }
  }

  setFareBreakdownModelDataForReturnJourney(minFareTravelSolutionList) {
    // journey Extra
    let tempFarelist = minFareTravelSolutionList[0].FareList.filter(m => m.Price == minFareTravelSolutionList[0].SingleFare);
    this.selectedSingleReturnOfferId = tempFarelist[0].OfferId;
    this.selectedSingleReturnServiceId = tempFarelist[0].ServiceId;
    this.selectedSingleReturnTravelSolution = minFareTravelSolutionList[0];
    this.selectedSingleReturnFare = tempFarelist[0];
    this.ticketDescriptionSingleReturn = tempFarelist[0].TicketDescription;
    this.ticketRestrictionSingleReturn = tempFarelist[0].TicketRestriction;

    this.sharedSibling.journeySummaryModel.ReturnSelectedFare = tempFarelist[0];

    if (this.sharedSibling.fareBreakdownModelData.length) {
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    }
    else {
      this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
      this.sharedSibling.fareBreakdownModelData[0] = new FareBreakdownModel();
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    }
    tempFarelist[0].FareDetails.forEach(tempFarelistFareDetail => {
      let returnJourney = new JourneyModel;
      returnJourney.Passenger = tempFarelistFareDetail.FarePerson;
      returnJourney.PricePerPerson = tempFarelistFareDetail.BasePrice;
      returnJourney.TotalPrice = tempFarelistFareDetail.Price;
      returnJourney.RailCard = tempFarelistFareDetail.Railcard;
      returnJourney.IsCheck = tempFarelistFareDetail.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney.push(returnJourney);
    });
  }

  resetFareBreakdownModelDataForReturnJourney() {
    if (this.sharedSibling.fareBreakdownModelData.length) {
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    }
    else {
      this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    }

    this.selectedSingleReturnTravelSolution = null;
    this.sharedSibling.journeySummaryModel.ReturnChanges = null;
    this.sharedSibling.journeySummaryModel.ReturnCurrency = null;
    this.sharedSibling.journeySummaryModel.ReturnDuration = null;
    this.sharedSibling.journeySummaryModel.ReturnOperator = null;
    this.sharedSibling.journeySummaryModel.ReturnOperatorChange = null;
    this.sharedSibling.journeySummaryModel.ReturnPrice = null;
    this.sharedSibling.journeySummaryModel.ReturnRouteModel = null;
    this.sharedSibling.journeySummaryModel.ReturnSaleCompany = null;
    this.sharedSibling.journeySummaryModel.ReturnSearchCache = null;
    this.sharedSibling.journeySummaryModel.ReturnSelectedFare = null;
    this.sharedSibling.journeySummaryModel.ReturnTicketDescription = null;
    this.sharedSibling.journeySummaryModel.ReturnTicketType = null;
    this.sharedSibling.journeySummaryModel.ReturnTime = null;
  }

  getCheapestTravelSoultionId(minFareTravelSolutionList) {
    this.cheapestTravelSolutionIdSingleReturn = [];
    for (let index = 0; index < minFareTravelSolutionList.length; index++) {
      this.cheapestTravelSolutionIdSingleReturn[index] = minFareTravelSolutionList[index].TravelSolId;
    }
  }

  setDataForSelectedOutwardFare() {
    if (!this.isSingleFareSelected) {
      this.sharedSibling.isReturnFareListAvailableForSingleSelectedTraveSoln = this.searchResponseReturn.TravelSolutions.some(travelSolution => {
        return this.checkReturnTravelSolution(travelSolution);
      });
    }
  }

  setSearchCacheReturn() {
    return this.searchResponseReturn.Request != null ? this.searchResponseReturn.Request.SearchCacheReturn : null;
  }

  getNonSalableTravelSolution() {
    return this.searchResponseReturn.TravelSolutions.filter(m => m.SingleFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured);
  }

  getMinDurationTravelSolutions(travelSolutionMinDuration) {
    return this.searchResponseReturn.TravelSolutions.filter(m => m.DurationMinute == travelSolutionMinDuration);
  }

  getMinFareTravelSolutionList(travelSolutionMinFare) {
    let minFareTravelSolutionList;
    if (this.isSingleFareSelected) {
      minFareTravelSolutionList = this.searchResponseReturn.TravelSolutions.filter(m => m.SingleFare == travelSolutionMinFare && !m.IsTrainClosed);
    } else {
      minFareTravelSolutionList = this.searchResponseReturn.TravelSolutions.filter(m => m.SingleFare == travelSolutionMinFare && !m.IsRetTrainClosed);
    }
    return minFareTravelSolutionList;
  }

  isMinFareTravelSolutionExists(minFareTravelSolutionList) {
    return minFareTravelSolutionList != null && minFareTravelSolutionList.length > 0;
  }

  setReturnTravelSolutionData() {
    this.travelSolutionCacheReturn = this.setSearchCacheReturn();
    this.isHideEarlierReturn = this.searchResponseReturn.HideEarlier;
    this.isHideLaterReturn = this.searchResponseReturn.HideLater;
    this.sharedSibling.isReturnFareListAvailableForSingleSelectedTraveSoln = true;

    if (this.searchResponseReturn.TravelSolutions != null) {
      this.setDataForSelectedOutwardFare();
      let nonSalableTravelSoution = this.getNonSalableTravelSolution();
      
      if (this.isNonSalableTravelSolutionExists(nonSalableTravelSoution)) {
        let travelSolutionMinFare = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.SingleFare; }));
        let travelSolutionMinDuration = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.DurationMinute; }));
        let minDurationTravelSolutionList = this.getMinDurationTravelSolutions(travelSolutionMinDuration);

        this.checkLengthOfminDurationTravelSolutionList(minDurationTravelSolutionList);

        let minFareTravelSolutionList = this.getMinFareTravelSolutionList(travelSolutionMinFare);
        

        if (this.isMinFareTravelSolutionExists(minFareTravelSolutionList)) {
          minFareTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);
          this.getCheapestTravelSoultionId(minFareTravelSolutionList);
         
          this.expandedElementReturn = minFareTravelSolutionList[0];

          this.isSingleFareSelectedExists(minFareTravelSolutionList);
        }
      } else {
        this.resetFareBreakdownModelDataForReturnJourney();
      }
    }

    this.searchRequest.ReturnTimesStartShow = this.searchResponseReturn.Date;
    this.setDefaultSelectedOnLoadReturn();
  }

  isSingleFareSelectedExists(minFareTravelSolutionList) {

    if (this.isSingleFareSelected) {
      this.setJourneySumModelOfSolutionFareListInCaseOfIsMinPrice(minFareTravelSolutionList);

      this.totalFare = this.getTotalFareForSingleAndReturn();

      this.setFareBreakdownModelDataForReturnJourney(minFareTravelSolutionList);
    }
    else {
      let minDurationTravelSolutionListReturnPreSelect = this.getPreSelectedMinDurationReturnTravelSoultionList();

      if (minDurationTravelSolutionListReturnPreSelect) {
        minDurationTravelSolutionListReturnPreSelect = this.getMinDurationReturnTravelSolutions(minDurationTravelSolutionListReturnPreSelect);
      }

      if (this.isTravelSolutionExists()) {
        minDurationTravelSolutionListReturnPreSelect.sort((a, b) => a.DurationMinute - b.DurationMinute);
      }

      this.checkLengthOfReturnTravelSolutionList(minDurationTravelSolutionListReturnPreSelect);
    }
  }

  getMinDurationReturnTravelSolutions(minDurationTravelSolutionListReturnPreSelect) {
    minDurationTravelSolutionListReturnPreSelect = minDurationTravelSolutionListReturnPreSelect.filter(m => {
      return this.checkReturnFareList(m);
    });
    return minDurationTravelSolutionListReturnPreSelect;
  }

  checkReturnFareList(m) {
    return m.ReturnFareList.some(retfare => retfare.ServiceId == this.selectedServiceId && retfare.OfferId == this.selectedOfferId)
  }

  getPreSelectedMinDurationReturnTravelSoultionList() {
    let minDurationTravelSolutionListReturnPreSelect
    let getTravelSolOperatorValue = this.searchResponseReturn.TravelSolutions.some(m => m.Operator == '1' || m.Operator == ' 2');
    if (!getTravelSolOperatorValue) {
      minDurationTravelSolutionListReturnPreSelect = this.searchResponseReturn.TravelSolutions.filter(m => m.SingleFare > 0 && !m.IsCancelled && !m.IsAlreadyDepartured && !m.IsSaleable && !m.IsReturnSaleable && !m.IsRetTrainClosed);
    } else {
      minDurationTravelSolutionListReturnPreSelect = this.searchResponseReturn.TravelSolutions.filter(m => (m.Operator == '1' || m.Operator == '2') && m.SingleFare > 0 && !m.IsCancelled && !m.IsAlreadyDepartured && !m.IsSaleable && !m.IsReturnSaleable && !m.IsRetTrainClosed);
    }
    return minDurationTravelSolutionListReturnPreSelect;
  }

  isNonSalableTravelSolutionExists(nonSalableTravelSoution) {
    return nonSalableTravelSoution != null && nonSalableTravelSoution != undefined && nonSalableTravelSoution.length > 0;
  }

  getTotalFareForSingleAndReturn() {
    return ((this.sharedSibling.journeySummaryModel.SinglePrice != undefined && this.sharedSibling.journeySummaryModel.SinglePrice != null) ? this.sharedSibling.journeySummaryModel.SinglePrice : 0) + ((this.sharedSibling.journeySummaryModel.ReturnPrice != undefined && this.sharedSibling.journeySummaryModel.ReturnPrice != null) ? this.sharedSibling.journeySummaryModel.ReturnPrice : 0);
  }

  isTravelSolutionExists() {
    return this.searchResponseReturn.TravelSolutions != null && this.searchResponseReturn.TravelSolutions.length > 0;
  }

  checkLengthOfminDurationTravelSolutionList(minDurationTravelSolutionList) {
    if (minDurationTravelSolutionList != null && minDurationTravelSolutionList.length > 0) {
      minDurationTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);
      this.fastestTravelSolutionIdSingleReturn = [];
      for (let index = 0; index < minDurationTravelSolutionList.length; index++) {
        this.fastestTravelSolutionIdSingleReturn[index] = minDurationTravelSolutionList[index].TravelSolId;
      }
    }
  }

  checkLengthOfReturnTravelSolutionList(minDurationTravelSolutionListReturnPreSelect) {
    if (minDurationTravelSolutionListReturnPreSelect.length > 0) {
      this.selectedReturnTimeId = minDurationTravelSolutionListReturnPreSelect[0].TravelSolId;
      this.sharedSibling.selectedReturnTimeId = this.selectedReturnTimeId;
      this.selectedSingleReturnTravelSolutionForReturn = minDurationTravelSolutionListReturnPreSelect[0];

      minDurationTravelSolutionListReturnPreSelect[0].NewFareList.forEach(x => {
        this.setJourneySumModelOfSolutionReturnFareListInCaseOfIsMinPrice(x, minDurationTravelSolutionListReturnPreSelect);
      });
    }
  }

  setJourneySumModelOfSolutionFareListInCaseOfIsMinPrice(minFareTravelSolutionList) {
    minFareTravelSolutionList[0].NewFareList.forEach(x => {
      if (x.IsMinPrice) {
        x.FareList.forEach(element => {
          if (element.MinPrice && !element.IsSeatAvailable) {
            if (this.sharedSibling.journeySummaryModel == null) {
              this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
            }
            this.sharedSibling.journeySummaryModel.IsSingleFareSelected = true;
            this.sharedSibling.journeySummaryModel.ReturnTime = minFareTravelSolutionList[0].DarwinDepartureTime + ' → ' + minFareTravelSolutionList[0].DarwinArrivalTime;
            this.sharedSibling.journeySummaryModel.ReturnDuration = minFareTravelSolutionList[0].Duration;
            this.sharedSibling.journeySummaryModel.ReturnChanges = minFareTravelSolutionList[0].Changes;
            if(this.checkTraveSolutionDirection()){
                this.sharedSibling.journeySummaryModel.ReturnTicketType = this.sharedSibling.journeySummaryModel.SingleTicketType;
            } else {
              this.sharedSibling.journeySummaryModel.ReturnTicketType = element.TicketTypeName;
            }
            this.sharedSibling.journeySummaryModel.ReturnCurrency = element.Currency;
            this.sharedSibling.journeySummaryModel.ReturnPrice = element.Price;
            this.sharedSibling.journeySummaryModel.ReturnTicketDescription = element.TicketDescription;
            this.sharedSibling.journeySummaryModel.ReturnOperator = minFareTravelSolutionList[0].Operator;
            this.sharedSibling.journeySummaryModel.ReturnOperatorChange = minFareTravelSolutionList[0].OperatorChange;
            this.sharedSibling.journeySummaryModel.ReturnSaleCompany = minFareTravelSolutionList[0].SaleCompany;
            this.sharedSibling.journeySummaryModel.ReturnSearchCache = this.searchResponseReturn.Request.SearchCacheReturn;
            this.sharedSibling.journeySummaryModel.ReturnRouteModel = minFareTravelSolutionList[0];
          }
        });
      }
    });
  }
  setJourneySumModelOfSolutionReturnFareListInCaseOfIsMinPrice(x, minDurationTravelSolutionListReturnPreSelect) {
    if (x.IsMinPrice) {
      x.FareList.forEach(element => {
        if (element.MinPrice && !element.IsSeatAvailable) {
          if (this.sharedSibling.journeySummaryModel == null) {
            this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
          }
          this.sharedSibling.journeySummaryModel.IsSingleFareSelected = false;
          this.sharedSibling.journeySummaryModel.ReturnTime = minDurationTravelSolutionListReturnPreSelect[0].DarwinDepartureTime + ' → ' + minDurationTravelSolutionListReturnPreSelect[0].DarwinArrivalTime;
          this.sharedSibling.journeySummaryModel.ReturnDuration = minDurationTravelSolutionListReturnPreSelect[0].Duration;
          this.sharedSibling.journeySummaryModel.ReturnChanges = minDurationTravelSolutionListReturnPreSelect[0].Changes;
          if(this.checkTraveSolutionDirection()){
              this.sharedSibling.journeySummaryModel.ReturnTicketType = this.sharedSibling.journeySummaryModel.SingleTicketType;
          } else {
            this.sharedSibling.journeySummaryModel.ReturnTicketType = element.TicketTypeName;
          }
          this.sharedSibling.journeySummaryModel.ReturnCurrency = element.Currency;
          this.sharedSibling.journeySummaryModel.ReturnPrice = element.Price;
          this.sharedSibling.journeySummaryModel.ReturnTicketDescription = element.TicketDescription;
          this.sharedSibling.journeySummaryModel.ReturnOperator = minDurationTravelSolutionListReturnPreSelect[0].Operator;
          this.sharedSibling.journeySummaryModel.ReturnOperatorChange = minDurationTravelSolutionListReturnPreSelect[0].OperatorChange;
          this.sharedSibling.journeySummaryModel.ReturnSaleCompany = minDurationTravelSolutionListReturnPreSelect[0].SaleCompany;
          this.sharedSibling.journeySummaryModel.ReturnSearchCache = this.searchResponseReturn.Request.SearchCacheReturn;
          this.sharedSibling.journeySummaryModel.ReturnRouteModel = minDurationTravelSolutionListReturnPreSelect[0];
        }
      });
    }
  }
  ticketInfo(ticketType: string, fare: FareModel, selectedFare?) {
    let ticketTypeCode = '';
    if (selectedFare && (this.isSelectRadioButtonForOutward || this.isSelectRadioButtonForReturn) && (selectedFare?.TicketTypeName == fare.TicketTypeName) || (selectedFare.OfferId == fare.OfferId && selectedFare?.ServiceId == fare.ServiceId)) {
      ticketTypeCode = selectedFare.TicketTypeCode;
    } else {
      ticketTypeCode = fare.TicketTypeCode;
    }
    this.dialog.open(TicketInfoComponent, {
      disableClose: false,
      panelClass: 'ticket-info',
      data: {
        TicketType: ticketType.trim(),
        fare: fare,
        ticketTypeCode: ticketTypeCode,
        isSearchResults: true
      }
    });
  }

  showAllClassInfo(isStdPremiumAvailable , ticketClassType) {
    this.dialog.open(TicketClassInfoPopupComponent, {
      disableClose: false,
      panelClass: 'ticketinfopopup',
      width: isStdPremiumAvailable ? '1000px' : '660px',
      data: {
        isStdPremiumAvailable: isStdPremiumAvailable,
        ticketClassType: ticketClassType
      }
    });
  }

  setDefaultSelectedOnLoad() {
    if (this.sharedSibling.evaluateRequest != null && this.searchResponse.TravelSolutions != null) {

      let defaultSelectedTS = this.searchResponse.TravelSolutions.find(m => m.TravelSolId
        == this.sharedSibling.evaluateRequest.OutwardTravelSolId);
      if (!this.sharedSibling.isSingleReturnCase) {
        this.isSingleFareSelected = true;
        this.activeTab = 0;
        this.checkDefaultSelectedFareInCaseSingleReturn(defaultSelectedTS);
      }
      else {
        this.isSingleFareSelected = false;
        this.activeTab = 1;
        this.checkDefaultSelectedFareInCaseSingle(defaultSelectedTS);
      }
    }
  }

  checkDefaultSelectedFareInCaseSingleReturn(defaultSelectedTS) {
    if (defaultSelectedTS != null) {
      let defaultSelectedFare = defaultSelectedTS.FareList.find(m =>
        m.OfferId == this.sharedSibling.evaluateRequest.OutwardOfferId
        && m.ServiceId == this.sharedSibling.evaluateRequest.OutwardCatlogServiceId)
      if (defaultSelectedFare != null) {

        this.onSelectFareTravelSolution(defaultSelectedFare, defaultSelectedTS, false, false);
        this.expandedElement = defaultSelectedTS;
        if (this.sharedSibling.IsViewMoreClick) {
          this.isAllTicketVisible = true;
        }
      }
    }
  }
  checkDefaultSelectedFareInCaseSingle(defaultSelectedTS) {
    if (defaultSelectedTS != null) {
      let defaultSelectedFare = defaultSelectedTS.ReturnFareList.find(m =>
        m.OfferId == this.sharedSibling.evaluateRequest.OutwardOfferId
        && m.ServiceId == this.sharedSibling.evaluateRequest.OutwardCatlogServiceId)
      if (defaultSelectedFare != null) {

        this.onSelectFareTravelSolution(defaultSelectedFare, defaultSelectedTS, true, false);
        this.expandedElement = defaultSelectedTS;
        if (this.sharedSibling.IsViewMoreClickSingleReturn) {
          this.isAllTicketVisibleSingleReturn = true;
        }
      }

    }
  }

  setDefaultSelectedOnLoadReturn() {
    if (this.sharedSibling.evaluateRequest != null && this.searchResponseReturn.TravelSolutions != null) {
      let defaultSelectedTS = this.searchResponseReturn.TravelSolutions.find(m => m.TravelSolId
        == this.sharedSibling.evaluateRequest.ReturnTravelSolId);
      if (defaultSelectedTS != null) {
        this.setDefaultSelectedTSforReturn(defaultSelectedTS)   
      }
      this.sharedSibling.evaluateRequest = null;
    }
  }

  setDefaultSelectedTSforReturn(defaultSelectedTS) {
    let defaultSelectedFare = defaultSelectedTS.FareList.find(m =>
      m.OfferId == this.sharedSibling.evaluateRequest.ReturnOfferId
      && m.ServiceId == this.sharedSibling.evaluateRequest.ReturnCatlogServiceId)
    if (!this.sharedSibling.isSingleReturnCase) {
      if (defaultSelectedFare != null) {
        this.onSelectFareTravelSolutionSingleReturn(defaultSelectedFare, defaultSelectedTS, false);
        this.expandedElementReturn = defaultSelectedTS;
        if (this.sharedSibling.IsViewMoreClickSingleReturn) {
          this.isAllTicketVisibleSingleReturn = true;
        }
      }
    }
    else {
      this.onSelectReturnTime(defaultSelectedTS);
    }
  }

  showServiceDisruptionDetails(row, isReturnTravelTicket) {
    this.dialogSingle.open(DisruptionServiceComponent, {
      width: '1086px',
      disableClose: false,
      id: "serviceDisruptionPopUpSingle",
      panelClass: 'your-journey-popup',
      data: {
        TravelSolutionCache: row.TravelSolutionCache,
        TravelSolutionId: row.TravelSolId,
        SaleCompanyId: row.SaleCompanyId,
        Changes: row.Changes,
        Duration: row.Duration,
        IsDisruption: row.IsDelayed,
        SearchCustomCache: (isReturnTravelTicket === false) ? this.searchResponse.Request.SearchCache : this.searchResponseReturn.Request.SearchCacheReturn
      }
    });

  }
  checkEarlyBirdExist(fareList) {
    let earlyBirdTicketExist = false;
    for(let fare of fareList){
      if (fare.TicketType.trim() == this.ticketTypeEnum.earlyBirdAnytimeSingle) {
        earlyBirdTicketExist = true;
        break;
      }
    }
    return earlyBirdTicketExist;
  }

  tabChange() {
    this.isAllTicketVisible = false;
    this.isStdPremiumAvailableOutwardSingle = false;
    this.isStdPremiumAvailableOutwardReturn = false;
    this.isStdPremiumAvailableReturn = false;
    this.sharedSibling.IsViewMoreClick = false;
    this.sharedSibling.activeTabValue = this.activeTab;
    this.sharedSibling.journeySummaryModel.ReturnOperator = null;
    if (this.sharedSibling.returnFare != null && this.activeTab == 1) {
      this.onSelectFareTravelSolution(this.sharedSibling.returnFare, this.sharedSibling.returnTravelSolution, true, false)
    }
    else if (this.sharedSibling.singleSolutionFare != null && this.activeTab == 0) {
      this.onSelectFareTravelSolution(this.sharedSibling.singleSolutionFare, this.sharedSibling.singleSolutionTravelSolution, false, false)
    }
    else {
      this.ticketChangeOnTabChange(this.searchResponseReturn, this.activeTab);
    }

    if (this.activeTab == 1) {
      let setPromotionalBannerData = { display: false, promotionalData: this.promotionalData }
      this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);
    }

    if(this.sharedSibling.journeySummaryModel.SingleSelectedFare){
      this.setPromotionalBannerData(this.sharedSibling.journeySummaryModel.SingleSelectedFare, this.sharedSibling.journeySummaryModel.SingleRouteModel, false);
    }

    if (this.sharedSibling.journeySummaryModel.ReturnSelectedFare) {
      this.setPromotionalBannerData(this.sharedSibling.journeySummaryModel.ReturnSelectedFare, this.sharedSibling.journeySummaryModel.ReturnRouteModel, true);
    }

  }

  onClickSingleOrSingleReturn(flag) {
    if (!flag) {
      this.singleClick = true;
    }
    if (flag) {
      this.returnClick = true;
    }
  }

  selectPromotionalBannerTicket(PromotionalResponse) {
    this.selectSingleTravelSolutionReturn(PromotionalResponse);
    this.selectReturnTravelSolutionReturn(PromotionalResponse);

    let setPromotionalBannerData = { display: false, promotionalData: this.promotionalData }
    this.searchSolutionService.setPromotionalBannerData(setPromotionalBannerData);

  }

  selectSingleTravelSolutionReturn(PromotionalResponse) {
    if (this.dataSource) {
      let singleTravelSolutionIndex = this.dataSource.filteredData.findIndex((x) => x.TravelSolId == PromotionalResponse.singleTravelSolId)

      let singleTravelSolution = this.dataSource.filteredData[singleTravelSolutionIndex];

      let fare;

      singleTravelSolution.NewReturnFareList.forEach(returnFareList => {
        for(let fareList of returnFareList.FareList){
          if (fareList.TicketTypeCode == PromotionalResponse.returnTicketTypeCode) {
            fare = fareList;
            break;
          }
        }
      });

      this.onSelectFareTravelSolution(fare, singleTravelSolution, true);
      this.onClickSingleOrSingleReturn(true);
    }
  }

  selectReturnTravelSolutionReturn(PromotionalResponse) {
    if (this.dataSourceReturn) {
      let returnTravelSolutionIndex = this.dataSourceReturn.filteredData.findIndex((x) => x.TravelSolId == PromotionalResponse.returnTravelSolId)

      let returnTravelSolution = this.dataSourceReturn.filteredData[returnTravelSolutionIndex];

      if (!returnTravelSolution.IsSaleable && !returnTravelSolution.IsReturnSaleable && this.checkReturnTravelSolution(returnTravelSolution)) {
        this.onSelectReturnTime(returnTravelSolution);
      }
    }
  }

  isLengthOfMinDurationTravelSolutionListExists(minDurationTravelSolutionList) {
    if (minDurationTravelSolutionList != null && minDurationTravelSolutionList.length > 0) {
      minDurationTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);
      this.fastestTravelSolutionId = [];
      for (let index = 0; index < minDurationTravelSolutionList.length; index++) {
        this.fastestTravelSolutionId[index] = minDurationTravelSolutionList[index].TravelSolId;
      }
    }
  }

  isSingleFareSelectedValue(activeTab) {
    if (activeTab === 0) {
      this.isSingleFareSelected = true;
    } else {
      this.isSingleFareSelected = false;
    }
  }

  getNonSalableTravelSoution() {
    return this.searchResponse.TravelSolutions.filter(m => m.SingleFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured);
  }

  getMinDurationTravelSolutionList(travelSolutionMinDuration) {
    return this.searchResponse.TravelSolutions.filter(m => m.DurationMinute == travelSolutionMinDuration);
  }

  findMinFareTravelSolutionList(travelSolutionMinFare) {
    return this.searchResponse.TravelSolutions.filter(m => m.SingleFare == travelSolutionMinFare && !m.IsSaleable && !m.IsAlreadyDepartured);
  }

  getCheapestTravelSolutionIdList(minFareTravelSolutionList) {
    this.cheapestTravelSolutionId = [];
    for (let index = 0; index < minFareTravelSolutionList.length; index++) {
      this.cheapestTravelSolutionId[index] = minFareTravelSolutionList[index].TravelSolId;
    }
  }

  getNonSalableTravelSoutionReturn() {
    return this.searchResponse.TravelSolutions.filter(m => m.ReturnFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured);
  }

  doesNonSalableTravelSoutionReturnExists(nonSalableTravelSoutionReturn) {
    return nonSalableTravelSoutionReturn != null && nonSalableTravelSoutionReturn != undefined && nonSalableTravelSoutionReturn.length > 0;
  }

  getFastestTravelSolutionIdReturnList(minDurationTravelSolutionListReturn) {
    if (minDurationTravelSolutionListReturn != null && minDurationTravelSolutionListReturn.length > 0) {
      minDurationTravelSolutionListReturn.sort((a, b) => a.DurationMinute - b.DurationMinute);
      this.fastestTravelSolutionIdReturn = [];
      for (let index = 0; index < minDurationTravelSolutionListReturn.length; index++) {
        this.fastestTravelSolutionIdReturn[index] = minDurationTravelSolutionListReturn[index].TravelSolId;
      }
    }
  }

  getCheapestTravelSolutionIdReturnList(minFareTravelSolutionListReturn) {
    this.cheapestTravelSolutionIdReturn = [];
    for (let index = 0; index < minFareTravelSolutionListReturn.length; index++) {
      this.cheapestTravelSolutionIdReturn[index] = minFareTravelSolutionListReturn[index].TravelSolId;
    }
  }

  resetJourneySummaryModelForNewFareList(minFareAvantiTravelSolutionSingleReturnList) {
    minFareAvantiTravelSolutionSingleReturnList[0].NewFareList.forEach(minFareAvantiTravelSolutionSingleReturnListNewFareList => {
      if (minFareAvantiTravelSolutionSingleReturnListNewFareList.IsMinPrice) {
        minFareAvantiTravelSolutionSingleReturnListNewFareList.FareList.forEach(fare => {
          if (fare.MinPrice && !fare.IsSeatAvailable) {
            if (this.sharedSibling.journeySummaryModel == null) {
              this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
            }
            this.sharedSibling.journeySummaryModel.SingleTime = minFareAvantiTravelSolutionSingleReturnList[0].DarwinDepartureTime + ' → ' + minFareAvantiTravelSolutionSingleReturnList[0].DarwinArrivalTime;
            this.sharedSibling.journeySummaryModel.SingleDuration = minFareAvantiTravelSolutionSingleReturnList[0].Duration;
            this.sharedSibling.journeySummaryModel.SingleChanges = minFareAvantiTravelSolutionSingleReturnList[0].Changes;
            this.sharedSibling.journeySummaryModel.SingleTicketType = fare.TicketTypeName;
            this.sharedSibling.journeySummaryModel.SingleCurrency = fare.Currency;
            this.sharedSibling.journeySummaryModel.SinglePrice = fare.Price;
            this.sharedSibling.journeySummaryModel.SingleTicketDescription = fare.TicketDescription;
            this.sharedSibling.journeySummaryModel.SingleOperator = minFareAvantiTravelSolutionSingleReturnList[0].Operator;
            this.sharedSibling.journeySummaryModel.SingleOperatorChange = minFareAvantiTravelSolutionSingleReturnList[0].OperatorChange;
            this.sharedSibling.journeySummaryModel.SingleSaleCompany = minFareAvantiTravelSolutionSingleReturnList[0].SaleCompany;
            this.sharedSibling.journeySummaryModel.SingleSearchCache = this.searchResponse.Request.SearchCache;
            this.sharedSibling.journeySummaryModel.SingleRouteModel = minFareAvantiTravelSolutionSingleReturnList[0];
            this.sharedSibling.journeySummaryModel.IsSingleFareSelected = true;
          }
        });
      }
    });
    this.singleFare = this.sharedSibling.journeySummaryModel.SinglePrice;
    this.totalFare = this.sharedSibling.journeySummaryModel.SinglePrice + ((this.sharedSibling.journeySummaryModel.ReturnPrice != undefined && this.sharedSibling.journeySummaryModel.ReturnPrice != null) ? this.sharedSibling.journeySummaryModel.ReturnPrice : 0);
    this.isSingleFareSelected = true;
    this.sharedSibling.isSingleReturnCase = false;
    this.defaultSelectedRow = minFareAvantiTravelSolutionSingleReturnList[0].TravelSolId;
    this.expandedElement = minFareAvantiTravelSolutionSingleReturnList[0];
    this.selectedTravelSolution = minFareAvantiTravelSolutionSingleReturnList[0];
    this.singleFareCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
    this.tabMinFareReturnCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
  }

  resetJourneySummaryModelForNewReturnFareList(minFareAvantiTravelSolutionSingleReturnList) {
    minFareAvantiTravelSolutionSingleReturnList[0].NewReturnFareList.forEach(minFareAvantiTravelSolutionSingleReturnListNewReturnFareList => {
      if (minFareAvantiTravelSolutionSingleReturnListNewReturnFareList.IsMinPrice) {
        minFareAvantiTravelSolutionSingleReturnListNewReturnFareList.FareList.forEach(element => {
          if (element.MinPrice && !element.IsSeatAvailable) {
            if (this.sharedSibling.journeySummaryModel == null) {
              this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
            }
            this.sharedSibling.journeySummaryModel.SingleTime = minFareAvantiTravelSolutionSingleReturnList[0].DarwinDepartureTime + ' → ' + minFareAvantiTravelSolutionSingleReturnList[0].DarwinArrivalTime;
            this.sharedSibling.journeySummaryModel.SingleDuration = minFareAvantiTravelSolutionSingleReturnList[0].Duration;
            this.sharedSibling.journeySummaryModel.SingleChanges = minFareAvantiTravelSolutionSingleReturnList[0].Changes;
            this.sharedSibling.journeySummaryModel.SingleTicketType = element.TicketTypeName;
            this.sharedSibling.journeySummaryModel.SingleCurrency = element.Currency;
            this.sharedSibling.journeySummaryModel.SinglePrice = element.Price;
            this.sharedSibling.journeySummaryModel.SingleTicketDescription = element.TicketDescription;
            this.sharedSibling.journeySummaryModel.SingleOperator = minFareAvantiTravelSolutionSingleReturnList[0].Operator;
            this.sharedSibling.journeySummaryModel.SingleOperatorChange = minFareAvantiTravelSolutionSingleReturnList[0].OperatorChange;
            this.sharedSibling.journeySummaryModel.SingleSaleCompany = minFareAvantiTravelSolutionSingleReturnList[0].SaleCompany;
            this.sharedSibling.journeySummaryModel.SingleSearchCache = this.searchResponse.Request.SearchCache;
            this.sharedSibling.journeySummaryModel.SingleRouteModel = minFareAvantiTravelSolutionSingleReturnList[0];
            this.sharedSibling.journeySummaryModel.IsSingleFareSelected = false;
          }
        });
      }
    });
    this.isSingleFareSelected = false;
    this.defaultSelectedRow = minFareAvantiTravelSolutionSingleReturnList[0].TravelSolId;
    this.expandedElement = minFareAvantiTravelSolutionSingleReturnList[0];
    this.selectedTravelSolution = minFareAvantiTravelSolutionSingleReturnList[0];
    this.singleFareCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
    this.tabMinFareReturnCurrency = minFareAvantiTravelSolutionSingleReturnList[0].Currency;
  }

  doesAvantiTravelSolutionSingleReturnExists(AvantiTravelSolutionSingleReturn) {
    return AvantiTravelSolutionSingleReturn != null && AvantiTravelSolutionSingleReturn.length > 0
  }

  setFareBreakDownModelDataForOutwardJourney(minFareItem) {
    //Fare Breakdown Latest
    this.sharedSibling.resetFareBreakDownData();
    this.sharedSibling.fareBreakdownModelData[0].IsReturnJourney = true;
    this.sharedSibling.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
    this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    minFareItem[0].FareDetails.forEach(fareDetail => {
      let outJourney = new JourneyModel;
      outJourney.Passenger = fareDetail.FarePerson;//'1 * Adult';
      outJourney.PricePerPerson = fareDetail.BasePrice;
      outJourney.TotalPrice = fareDetail.Price;
      outJourney.RailCard = fareDetail.Railcard;
      outJourney.IsCheck = fareDetail.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].OutWardJourney.push(outJourney);
    });
  }

  isMinFareTravelSolutionReturnListExists(minFareTravelSolutionListReturn) {
    return minFareTravelSolutionListReturn != null && minFareTravelSolutionListReturn.length > 0;
  }

  getAvantiTravelSolutionSingleReturnList(AvantiTravelSolutionSingleReturn, nonSalableTravelSoutionReturnPreSelect, getValueForOperator) {
    if (getValueForOperator) {
      AvantiTravelSolutionSingleReturn = nonSalableTravelSoutionReturnPreSelect.filter(m => ((m.Operator == '1' || m.Operator == '2') && !m.IsAlreadyDepartured && !m.IsTrainClosed));
      // when avanti travel solution are available but soldout and other operator travel solution available
      if (!AvantiTravelSolutionSingleReturn || AvantiTravelSolutionSingleReturn.length == 0) {
        AvantiTravelSolutionSingleReturn = nonSalableTravelSoutionReturnPreSelect.filter(m => (!m.IsAlreadyDepartured && !m.IsTrainClosed));
      }
    } else {
      AvantiTravelSolutionSingleReturn = nonSalableTravelSoutionReturnPreSelect.filter(m => !m.IsAlreadyDepartured && !m.IsTrainClosed);
    }
    return AvantiTravelSolutionSingleReturn;
  }

  getMinFareAvantiTravelSolutionSingleReturnList(activeTab, AvantiTravelSolutionSingleReturn, minFareAvantiTravelSolutionSingleReturnList, AvantiTravelSolutionSingleReturnMinFare) {
    if (activeTab == 1) {
      minFareAvantiTravelSolutionSingleReturnList = AvantiTravelSolutionSingleReturn.filter(m => m.ReturnFare == AvantiTravelSolutionSingleReturnMinFare && !m.IsRetTrainClosed);

    } else {
      minFareAvantiTravelSolutionSingleReturnList = AvantiTravelSolutionSingleReturn.filter(m => m.ReturnFare == AvantiTravelSolutionSingleReturnMinFare && !m.IsTrainClosed);
    }
    return minFareAvantiTravelSolutionSingleReturnList;
  }

  doesMinFareAvantiTravelSolSingleReturnExists(minFareAvantiTravelSolutionSingleReturnList) {
    return minFareAvantiTravelSolutionSingleReturnList != null && minFareAvantiTravelSolutionSingleReturnList.length > 0;
  }

  findNonSalableTravelSoutionReturnList(nonSalableTravelSoutionReturn, travelSolutionMinDurationReturn) {
    return nonSalableTravelSoutionReturn.filter(m => m.DurationMinute == travelSolutionMinDurationReturn && !m.IsAlreadyDepartured);
  }

  findMinFareItemFromReturnFareList(minFareAvantiTravelSolutionSingleReturnList) {
    return minFareAvantiTravelSolutionSingleReturnList[0].ReturnFareList.filter(m => m.Price == minFareAvantiTravelSolutionSingleReturnList[0].ReturnFare);
  }

  findMinFareItemFromFareList(minFareAvantiTravelSolutionSingleReturnList) {
    return minFareAvantiTravelSolutionSingleReturnList[0].FareList.filter(m => m.MinPrice);
  }

  getSelectedFareFromMinFareItems(minFareItem) {
    this.selectedOfferId = minFareItem[0].OfferId;
    this.selectedServiceId = minFareItem[0].ServiceId;
    this.selectedFare = minFareItem[0];
    if (this.activeTab == 1) {
      this.CheckSeatAvailalble(this.selectedFare.TicketTypeName, this.selectedFare.TicketClass)
    }
    this.ticketDescription = minFareItem[0].TicketDescription;
    this.ticketRestriction = minFareItem[0].TicketRestriction;

    this.sharedSibling.journeySummaryModel.SingleSelectedFare = minFareItem[0];
    this.sharedSibling.journeySummaryModel.ReturnSelectedFare = minFareItem[0];

    this.sharedSibling.sendFareData(minFareItem[0]);

    this.setFareBreakDownModelDataForOutwardJourney(minFareItem);
  }

  findMinFareTravelSolutionListReturn(nonSalableTravelSoutionReturn, travelSolutionMinFareReturn) {
    return nonSalableTravelSoutionReturn.filter(m => m.ReturnFare == travelSolutionMinFareReturn && !m.IsAlreadyDepartured);
  }

  getValueForOperatorFromTravelSol(nonSalableTravelSoutionReturnPreSelect) {
    return nonSalableTravelSoutionReturnPreSelect.some(m => m.Operator == '1' || m.Operator == '2');
  }

  checkedValueOfActiveTab(activeTab, minFareItem, AvantiTravelSolutionSingleReturn, minFareAvantiTravelSolutionSingleReturnList) {
    if (activeTab == 0) {

      let AvantiTravelSolutionSingleReturnMinFare = Math.min.apply(Math, AvantiTravelSolutionSingleReturn.map(function (o) { return o.SingleFare; }));

      let minFareAvantiTravelSolutionSingleReturnList = AvantiTravelSolutionSingleReturn.filter(m => m.SingleFare == AvantiTravelSolutionSingleReturnMinFare);
      if (minFareAvantiTravelSolutionSingleReturnList.length > 1)
        minFareAvantiTravelSolutionSingleReturnList.sort((a, b) => a.DurationMinute - b.DurationMinute);
      minFareItem = this.findMinFareItemFromFareList(minFareAvantiTravelSolutionSingleReturnList);

      this.resetJourneySummaryModelForNewFareList(minFareAvantiTravelSolutionSingleReturnList);

    }
    else {
      this.sharedSibling.isSingleReturnCase = true;
      minFareItem = this.findMinFareItemFromReturnFareList(minFareAvantiTravelSolutionSingleReturnList);

      this.singleFare = minFareAvantiTravelSolutionSingleReturnList[0].ReturnFare;
      this.totalFare = minFareAvantiTravelSolutionSingleReturnList[0].ReturnFare;

      this.resetJourneySummaryModelForNewReturnFareList(minFareAvantiTravelSolutionSingleReturnList);

    }
    this.getSelectedFareFromMinFareItems(minFareItem);
  }

  resetTravelSolValueInCaseOfTravelSolLengthNotExists() {
    this.defaultSelectedRow = 0;
    this.singleFare = 0;
    this.totalFare = 0;
    this.expandedElement = null;
    this.selectedTravelSolution = null;
  }

  findNonSalableTravelSolObj() {
    return this.searchResponse.TravelSolutions.filter(m => m.ReturnFare > 0 && !m.IsSaleable && !m.IsCancelled && !m.IsAlreadyDepartured && !m.IsSingleSaleable && !m.IsReturnSaleable);
  }

  setMinFareAvantiTravelSolutionSingleRetList(AvantiTravelSolutionSingleReturn, activeTab) {
    if (this.doesAvantiTravelSolutionSingleReturnExists(AvantiTravelSolutionSingleReturn)) {
      let AvantiTravelSolutionSingleReturnMinFare = Math.min.apply(Math, AvantiTravelSolutionSingleReturn.map(function (o) { return o.ReturnFare; }));
      let minFareAvantiTravelSolutionSingleReturnList;

      minFareAvantiTravelSolutionSingleReturnList = this.getMinFareAvantiTravelSolutionSingleReturnList(activeTab, AvantiTravelSolutionSingleReturn, minFareAvantiTravelSolutionSingleReturnList, AvantiTravelSolutionSingleReturnMinFare);

      if (this.doesMinFareAvantiTravelSolSingleReturnExists(minFareAvantiTravelSolutionSingleReturnList)) {
        if (minFareAvantiTravelSolutionSingleReturnList.length > 1)
          minFareAvantiTravelSolutionSingleReturnList.sort((a, b) => a.DurationMinute - b.DurationMinute);

        let minFareItem;

        this.checkedValueOfActiveTab(activeTab, minFareItem, AvantiTravelSolutionSingleReturn, minFareAvantiTravelSolutionSingleReturnList);
      }
      else {
        this.resetTravelSolValueInCaseOfTravelSolLengthNotExists();
      }
    }

    else {
      this.resetTravelSolValueInCaseOfTravelSolLengthNotExists();
    }
  }

  setMinFareTravelSolListRet(nonSalableTravelSoutionReturn, activeTab) {
    if (this.doesNonSalableTravelSoutionReturnExists(nonSalableTravelSoutionReturn)) {

      let travelSolutionMinFareReturn = Math.min.apply(Math, nonSalableTravelSoutionReturn.map(function (o) { if (!o.IsSaleable) { return o.ReturnFare; } }));
      let travelSolutionMinDurationReturn = Math.min.apply(Math, nonSalableTravelSoutionReturn.map(function (o) { return o.DurationMinute; }));
      let minDurationTravelSolutionListReturn = this.findNonSalableTravelSoutionReturnList(nonSalableTravelSoutionReturn, travelSolutionMinDurationReturn);

      this.getFastestTravelSolutionIdReturnList(minDurationTravelSolutionListReturn);

      let minFareTravelSolutionListReturn = this.findMinFareTravelSolutionListReturn(nonSalableTravelSoutionReturn, travelSolutionMinFareReturn);

      if (this.isMinFareTravelSolutionReturnListExists(minFareTravelSolutionListReturn)) {

        minFareTravelSolutionListReturn.sort((a, b) => a.DurationMinute - b.DurationMinute);

        this.getCheapestTravelSolutionIdReturnList(minFareTravelSolutionListReturn);

        let nonSalableTravelSoutionReturnPreSelect;
        nonSalableTravelSoutionReturnPreSelect = this.findNonSalableTravelSolObj();

        let AvantiTravelSolutionSingleReturn;
        let getValueForOperator = this.getValueForOperatorFromTravelSol(nonSalableTravelSoutionReturnPreSelect);

        AvantiTravelSolutionSingleReturn = this.getAvantiTravelSolutionSingleReturnList(AvantiTravelSolutionSingleReturn, nonSalableTravelSoutionReturnPreSelect, getValueForOperator);

        this.setMinFareAvantiTravelSolutionSingleRetList(AvantiTravelSolutionSingleReturn, activeTab);
      }
    }
  }

  ticketChangeOnTabChange(searchResponseReturn, activeTab) {

    this.isSingleFareSelectedValue(activeTab);

    this.travelSolutionCache = this.searchResponse.Request.SearchCache;
    this.isHideEarlier = this.searchResponse.HideEarlier;
    this.isHideLater = this.searchResponse.HideLater;

    if (this.searchResponse.TravelSolutions != null) {

      let nonSalableTravelSoution = this.getNonSalableTravelSoution();

      if (this.isNonSalableTravelSolutionExists(nonSalableTravelSoution)) {

        let travelSolutionMinDuration = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.DurationMinute; }));
        let minDurationTravelSolutionList = this.getMinDurationTravelSolutionList(travelSolutionMinDuration);

        this.isLengthOfMinDurationTravelSolutionListExists(minDurationTravelSolutionList);

        let travelSolutionMinFare = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.SingleFare; }));
        let minFareTravelSolutionList = this.findMinFareTravelSolutionList(travelSolutionMinFare);

        if (this.isMinFareTravelSolutionExists(minFareTravelSolutionList)) {

          minFareTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);

          this.getCheapestTravelSolutionIdList(minFareTravelSolutionList);

          let nonSalableTravelSoutionReturn = this.getNonSalableTravelSoutionReturn();

          this.setMinFareTravelSolListRet(nonSalableTravelSoutionReturn, activeTab);

          this.setDefaultSelectedOnLoad();
        }
        this.getReturnTravelSolutions(searchResponseReturn);
        this.dataSource = new MatTableDataSource(this.searchResponse.TravelSolutions);

      }
      else {
        this.getReturnTravelSolutions(searchResponseReturn);
      }
    }
    this.searchRequest.TravellerId = this.searchResponse.Request.TravellerId;
    this.searchRequest.DepartureTimesStartShow = this.searchResponse.Date;
  }

  // open soldout ticket info popup on similar options click
  soldoutTicketInfo( ticketType ) {
    this.dialog.open(SoldoutTicketInfoPopupComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'common-popup-theme',
      data : {
        ticketType : ticketType
      }
    });
  }

  convertSingleTabZeroToBlank(){
    return this.totalForReuturnAndSigle == 0 ? '' : this.totalForReuturnAndSigle.toFixed(2);
  }

  isExistSoldOutJourney() {
    let isSoldOutJourney = false;
    this.searchResponseboth.TravelSolutions.forEach((travelSolution) => {
      if (travelSolution?.NewFareList) {
        travelSolution.NewFareList.forEach((newFareList) => {
          newFareList.FareList.forEach((fareList) => {
            if (fareList.IsSeatAvailable) {
              return isSoldOutJourney = true;
            }
          });
        });
      }
      else if (travelSolution?.NewReturnFareList) {
        travelSolution.NewReturnFareList.forEach((newReturnFareList) => {
          newReturnFareList.FareList.forEach((fareList) => {
            if (fareList.IsSeatAvailable) {
              return isSoldOutJourney = true;
            }
          });
        });
      }
    });
    this.searchResponseboth.RetTravelSolutions.forEach((travelSolution) => {
      if (travelSolution?.NewFareList) {
        travelSolution.NewFareList.forEach((newFareList) => {
          newFareList.FareList.forEach((fareList) => {
            if (fareList.IsSeatAvailable) {
              return isSoldOutJourney = true;
            }
          });
        });
      }
      else if (travelSolution?.NewReturnFareList) {
        travelSolution.NewReturnFareList.forEach((newReturnFareList) => {
          newReturnFareList.FareList.forEach((fareList) => {
            if (fareList.IsSeatAvailable) {
              return isSoldOutJourney = true;
            }
          });
        });
      }
    });
    return isSoldOutJourney;
  }

  checkTraveSolutionDirection(){
    return (this.searchRequest.TravelSolutionDirection == 'OPEN_RETURN' ? true : (this.searchRequest.TravelSolutionDirection == 'RETURN' ? (this.sharedSibling?.journeySummaryModel?.IsSingleFareSelected ? false : true) : false)) 
    && !(this.sharedSibling.isSearchErrorSoldOut || this.sharedSibling.isReturnSearchErrorSoldOut);
  }
}

export class ColumnsToDisplay {
  key: string;
  label: string;
}
