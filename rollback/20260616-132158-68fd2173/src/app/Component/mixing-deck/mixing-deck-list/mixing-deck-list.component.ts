import { Component, Output, Input, EventEmitter, SimpleChanges, ViewChild, Injector } from '@angular/core';
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
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { JourneyModel, FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppConstantsService, ErrorMessageEnum, LocalStorageKeyEnum, TicketTypeEnum } from 'src/app/utility/app-constants.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { InfoPopupComponent } from '../info-popup/info-popup.component';
import { TicketInfoComponent } from '../ticket-info/ticket-info.component';
import { CommonServices } from 'src/app/services/common.service';
import { DisruptionServiceComponent } from '../disruption-service/disruption-service.component';
import { TicketClassInfoPopupComponent } from '../ticket-class-info-popup/ticket-class-info-popup.component';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { SoldoutTicketInfoPopupComponent } from '../soldout-ticket-info-popup/soldout-ticket-info-popup.component';

@Component({
  selector: 'app-mixing-deck-list',
  templateUrl: `./mixing-deck-list.component.html`,
  styleUrls: ['./mixing-deck-list.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
}
)

export class MixingDeckListComponent {
  responseData: ResponseData;
  searchResponse: SearchResponseModel;
  dataSource: MatTableDataSource<any>;
  travelSolutionCache: string;
  isHideEarlier: boolean;
  isHideLater: boolean;

  cheapestTravelSolutionId: number[] = [];
  fastestTravelSolutionId: number[] = [];
  singleFare: number = 0;
  singleFareCurrency: string;

  currentDateString: string;
  ongoingDateString: string;
  selectedTravelSolution: any;
  selectedFare: any;
  selectedOfferId: number;
  selectedServiceId: number;
  defaultSelectedRow: number;
  ticketDescription: string;
  ticketRestriction: string;
  listCounter: number = 0;
  departure: any;
  isdisruption: boolean = false;

  arrival: any;
  isAllTicketVisible: boolean = false;
  showMoreTicket: boolean = false;
  isExpand: boolean = false;
  isBuyNowDisable: boolean = false;
  minDate: Date = new Date();
  maxDate: string = moment(this.minDate).add(6, 'months').format('YYYY-MM-DD');
  timeoutFlag: boolean = false;

  @Input()
  searchRequest: SearchRequestModel;

  @Output() getTravelSolution: EventEmitter<{ fare: FareModel, travelSolution: TravelSolutionModel }> = new EventEmitter()
  @ViewChild('tooltip13', { static: false }) tooltip13: NgbTooltip;
  @ViewChild('tooltip14', { static: false }) tooltip14: NgbTooltip;

  @Output() parentTooltip = new EventEmitter<string>();

  @Output("openAmend") openAmend: EventEmitter<any> = new EventEmitter();
  // added to hide editqtt in case we get travel soln while doing earlier/later after soldout case
  @Output("hideEditQtt") hideEditQtt: EventEmitter<any> = new EventEmitter();


  columns: ColumnsToDisplay[] = [

    {
      key: "TravelSolId",
      label: 'TravelSolId'
    },

    {
      key: "Duration",
      label: 'Duration'
    },
    {
      key: "Changes",
      label: 'Changes'
    },
    {
      key: "SingleFare",
      label: 'Prices'
    }
  ]

  columnsToDisplay = ['Operator', 'RSID', 'DepartureTimeArrivalTime', 'Duration&Changes', 'SingleFare&Actions', 'expand-collapse'];
  expandedElement: TravelSolutionModel | null;
  isStdPremiumAvailableOutward: boolean = false;
  isPromotionAppliedSingle: boolean = false;
  hideAdvanceStandard = false;
  hideAdvanceFirst = false;
  hideAdvanceStdPremium = false;
  tipContent14: boolean;

  sharedSibling: SharedService;
  spinnerService: NgxSpinnerService;
  appConstantsService: AppConstantsService;
  notificationService: NotificationService;
  searchSolutionService: SearchSolutionService;
  commonServices: CommonServices;
  datalayerService: DataLayerService;
  ga4datalayerService: GA4DatalayerService;
  errorMessageEnum: ErrorMessageEnum;
  ticketTypeEnum: TicketTypeEnum;
  isSelectRadioButtonForOutward: boolean = false;
  localStorageKeyEnum: LocalStorageKeyEnum;

  constructor(private readonly injector: Injector, private readonly dialogSingle: MatDialog, public dialog: MatDialog) {
    // Dependency Injection without using constructor's param
    this.sharedSibling = this.injector.get(SharedService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.notificationService = this.injector.get(NotificationService);
    this.searchSolutionService = this.injector.get(SearchSolutionService);
    this.commonServices = this.injector.get(CommonServices);
    this.datalayerService = this.injector.get(DataLayerService);
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
    this.errorMessageEnum = this.injector.get(ErrorMessageEnum);
    this.ticketTypeEnum = this.injector.get(TicketTypeEnum);
    this.currentDateString = moment(new Date()).format('YYYY-MM-DD');

    this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.sharedSibling.fareBreakdownModelData[0] = new FareBreakdownModel();
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  }

  ngOnInitFunction() {
    if (!this.sharedSibling.isAmendSearchOpen) {
      this.ongoingDateString = moment(new Date(this.searchRequest.DepartureTimesStart)).format('YYYY-MM-DD');
      this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
      this.getAllTravelSolution();
      this.departure = this.searchRequest.DepartureLocationName;

      this.arrival = this.searchRequest.ArrivalLocationName;

      this.isBuyNowDisable = false;
    }
    this.isAllTicketVisible = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.searchRequest = changes.searchRequest.currentValue;
    this.ngOnInitFunction();
  }

  addReturnJourney() {
    this.sharedSibling.addReturnTabIndex = 1;
    this.openAmend.emit();
  }

  openAmendSearch() {
    this.openAmend.emit();
    // on click editJourney page scroll to top in open return
    window.scroll(0, 0);
  }
  extendedFareList() {
    this.isAllTicketVisible = true;
    this.sharedSibling.IsViewMoreClick = true;
    this.showMoreTicket = false;
  }

  collapsedFareList() {
    this.isAllTicketVisible = false;
    this.sharedSibling.IsViewMoreClick = false;
  }

  loadGTMDataLayeronExpandingSolutions(element, previousSelectedTravelSolution, SelectedFare) {
    if (element.TravelSolId !== previousSelectedTravelSolution.TravelSolId) {
      let indexOfElement = this.searchResponse.TravelSolutions.indexOf(element);
      try {
        if (this.searchRequest.TravelSolutionDirection == 'OPEN_RETURN') {
          this.datalayerService.loadGTMDataLayerOnExpandingTravelSolution(element, this.searchRequest, indexOfElement, 1, 'Outward', SelectedFare);
          this.ga4datalayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, 1, 'Outward', SelectedFare, false);
        }
        else {
          this.datalayerService.loadGTMDataLayerOnExpandingTravelSolution(element, this.searchRequest, indexOfElement, 0, 'Outward', SelectedFare);
          this.ga4datalayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, 0, 'Outward', SelectedFare, false);
        }
      } catch (err) { console.log(err); }
    }
  }

  onSelectTravelSolution(element) {

    let previousSelectedTravelSolution = this.selectedTravelSolution;
    this.isStdPremiumAvailableOutward = false;
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

    this.singleFare = element.SingleFare;
    this.isAllTicketVisible = false;

    //Journey extras
    let tempFarelist = element.FareList.filter(m => m.Price == element.SingleFare);
    this.selectedFare = tempFarelist[0]
    this.selectedServiceId = tempFarelist[0].ServiceId;
    this.selectedOfferId = tempFarelist[0].OfferId;
    this.ticketDescription = tempFarelist[0].TicketDescription;
    this.ticketRestriction = tempFarelist[0].TicketRestriction;

    element.NewFareList.forEach(obj => {
      obj.FareList.forEach(x => x.MinPrice = false)
    });
    let newFarelist = element.NewFareList.filter(obj => obj.TicketType == this.selectedFare.TicketTypeName)
    newFarelist[0].FareList.forEach(obj => {
      if (obj.Price == this.selectedFare.Price) {
        obj.MinPrice = true;
      }
      else {
        obj.MinPrice = false;
      }
    });


    this.sharedSibling.sendFareData(tempFarelist);
    this.selectedTravelSolution = element;

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

    //Fare breakdown Latest
    this.sharedSibling.resetFareBreakDownData();
    this.sharedSibling.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
    this.sharedSibling.fareBreakdownModelData[0].IsReturnJourney = false;
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
      this.loadGTMDataLayeronExpandingSolutions(element, previousSelectedTravelSolution, SingleSelectedFare);
    }
    catch (err) {
      console.log(err);
    }
  }

  showRouteDetails(row) {
    this.dialogSingle.open(RouteDetailsComponent, {
      width: '1086px',
      disableClose: false,
      id: "routeDetailsPopUpSingle",
      data: {
        TravelSolutionCache: this.searchResponse.Request.SearchCache,
        TravelSolutionId: row.TravelSolId,
        SaleCompanyId: row.SaleCompanyId,
        Changes: row.Changes,
        Duration: row.Duration
      }
    });
  }
  ticketInfo(ticketType: string, fare: FareModel, selectedFare?) {
    let ticketTypeCode = '';
    if (selectedFare && (this.isSelectRadioButtonForOutward) && (selectedFare?.TicketTypeName == fare.TicketTypeName) || (selectedFare.OfferId == fare.OfferId && selectedFare?.ServiceId == fare.ServiceId)) {
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

  filterByStandard(fareList: any) {
    let standardFound = false;
    return fareList.filter(x => {
      if (!standardFound && x.TicketClass == 'Standard') {
        standardFound = true;
        return true;
      }
    });
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

  filterByStdPremium(fareList: any, element: any) {
    if (fareList && fareList.length > 0) {
      let firstPremiumFound = false;
      return fareList.filter(fare => {
        if (!firstPremiumFound && fare.TicketClass === 'Standard Premium') {
          firstPremiumFound = true;
          if (element === this.expandedElement && !this.isStdPremiumAvailableOutward) {
            this.isStdPremiumAvailableOutward = true;
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
      });
      this.filterForAdvanceTicket(fareList);
      return fareList;
    }
  }

  filterByFirst(fareList: any) {
    let firstFound = false;
    return fareList.filter(x => {
      if (!firstFound && x.TicketClass == 'First') {
        firstFound = true;
        return true;
      }
    });
  }

  filterForAdvanceTicket(fareList: any) {
    this.showMoreTicket = false;
    let duplicateList = fareList;

    //getting all but only SupOffAnyAdvance ticket;
    duplicateList = this.filterOutSupOffAnyAdvanceTicket(duplicateList); 

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
      listOfStdPremiumClass = this.filterByStdPremium(x.FareList, null);

      if (x.TicketType.trim() === this.ticketTypeEnum.advanceSingle || x.TicketType.trim() === this.ticketTypeEnum.advanceReturn) {
        advanceTicketFirst = listOfFirstClass;
        advanceTicketStandard = listOfStandard;
        advanceTicketStdPremium = listOfStdPremiumClass;
      }
      else {
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
    });

    if (advanceTicketFirst.length === 0 && advanceTicketStandard.length === 0 && advanceTicketStdPremium.length === 0) {
      return;
    }
    this.hideOrNotAdvTickets(advanceTicketFirst, advanceTicketStandard, advanceTicketStdPremium, tempForStandard, tempForFirstClass, tempForStdPremium)

  }

  filterOutSupOffAnyAdvanceTicket(duplicateList){
    duplicateList = duplicateList.filter(Ticket => {
      if (Ticket.TicketType.trim() == this.ticketTypeEnum.anytimeSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.advanceSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.offPeakSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.superOffPeakSingle || Ticket.TicketType.trim() == this.ticketTypeEnum.anytimeReturn || Ticket.TicketType.trim() == this.ticketTypeEnum.advanceReturn || Ticket.TicketType.trim() == this.ticketTypeEnum.offPeakReturn || Ticket.TicketType.trim() == this.ticketTypeEnum.superOffPeakReturn) {
        return true;
      }
    });
    return duplicateList;
  }


  hideOrNotAdvTickets(advanceTicketFirst, advanceTicketStandard, advanceTicketStdPremium, tempForStandard, tempForFirstClass, tempForStdPremium){  
      // hide or not, adv Standard ticket
      if (advanceTicketStandard.length > 0) {
        tempForStandard.forEach(x => {
          if (x[0].Price <= advanceTicketStandard[0].Price) {
            this.hideAdvanceStandard = true;
            this.showMoreTicket = true;
          }
        })
      }

      // hide or not, adv First ticket
      if (advanceTicketFirst.length > 0) {
        tempForFirstClass.forEach(x => {
          if (x[0].Price <= advanceTicketFirst[0].Price) {
            this.hideAdvanceFirst = true;
            this.showMoreTicket = true;
          }
        })
      }

      // hide or not, adv std Premium ticket
      if (advanceTicketStdPremium.length > 0) {
        tempForStdPremium.forEach(x => {
          if (x[0].Price <= advanceTicketStdPremium[0].Price) {
            this.hideAdvanceStdPremium = true;
            this.showMoreTicket = true;
          }
        })
      }
  }

  onSelectFareTravelSolution(fare, travelSolution) {
    this.isSelectRadioButtonForOutward = true; 
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
    this.sharedSibling.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();

    travelSolution.NewFareList.forEach(obj => {
      obj.FareList.forEach(x => x.MinPrice = false)
    });
    let newFarelist = travelSolution.NewFareList.filter(obj => obj.TicketType == fare.TicketTypeName)
    newFarelist[0].FareList.forEach(obj => {
      if (obj.Price == fare.Price) {
        obj.MinPrice = true;
      }
      else {
        obj.MinPrice = false;
      }
    });

    // Setting Price for Buy Now
    this.singleFare = fare.Price;
    this.singleFareCurrency = fare.Currency;

    //Fare BreakDown
    this.sharedSibling.sendFareData(fare);
    this.selectedFare = fare;
    this.ticketDescription = fare.TicketDescription;
    this.ticketRestriction = fare.TicketRestriction;
    this.selectedServiceId = fare.ServiceId;
    this.selectedOfferId = fare.OfferId;
    this.selectedTravelSolution = travelSolution;
    this.defaultSelectedRow = travelSolution.TravelSolutionId;

    //Fare breakdown Latest
    this.sharedSibling.resetFareBreakDownData();
    this.sharedSibling.fareBreakdownModelData[0].IsReturnJourney = false;
    fare.FareDetails.forEach(fareDetail => {
      let outJourney = new JourneyModel;
      outJourney.Passenger = fareDetail.FarePerson;//'1 * Adult';
      outJourney.PricePerPerson = fareDetail.BasePrice;
      outJourney.TotalPrice = fareDetail.Price;
      outJourney.RailCard = fareDetail.Railcard;
      outJourney.IsCheck = fareDetail.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].OutWardJourney.push(outJourney);
    });
    try {
      let selectTravelSolParams = {
        searchRequest: this.searchRequest,
        searchSource: 'Homepage',
        searchSuccess: false,
        searchError: "",
        searchResponse: this.searchResponse,
        defaultSelectedRow: -1,
        selectedRow: this.selectedTravelSolution.TravelSolId,
        selectedPrice: null,
        defaultSelectedRowSingleReturn: -1,
        SelectedRowReturn: -1
      }
      this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, "single", true, [...this.cheapestTravelSolutionId], this.selectedFare, null, 0);
    } catch (err) {
      console.log(err);
    }
  }




  callParentTooltip() {
    this.parentTooltip.emit('this is a test');
  }

  getAllTravelSolution() {
    if (!this.searchRequest.Searchtype)
      this.searchRequest.Searchtype = "";
    if (this.searchRequest.TravelSolutionDirection == "ONE_WAY" || this.searchRequest.TravelSolutionDirection == "OPEN_RETURN") {
      this.searchRequest.ReturnTimesStart = null;
      this.getTravelSolutions();
    }
    //In case of return journey we got travel solution direction as forward
    else if (this.searchRequest.TravelSolutionDirection == "RETURN" || this.searchRequest.TravelSolutionDirection == "FORWARD") {
      this.searchRequest.IsReturnRequest = true;
    }
  }

  onClickGetNextDaySearch() {
    if (this.listCounter < 7) {
      let date = new Date(this.searchRequest.DepartureTimesStart);
      let nextDate = date.setDate(date.getDate() + 1);
      this.searchRequest.DepartureTimesStart = moment(nextDate).format('YYYY-MM-DDTHH:mm');
      this.ongoingDateString = moment(nextDate).format('YYYY-MM-DD');
      this.getTravelSolutions();
      this.listCounter++;
    }
    else {
      this.notificationService.warn("Maximum limit exceeded!");
    }

  }

  onClickGetPreviousDaySearch() {
    if (this.listCounter > -7) {
      let date = new Date(this.searchRequest.DepartureTimesStart);
      let nextDate = date.setDate(date.getDate() - 1);
      this.searchRequest.DepartureTimesStart = moment(nextDate).format('YYYY-MM-DDTHH:mm');
      this.ongoingDateString = moment(nextDate).format('YYYY-MM-DD');
      this.getTravelSolutions();
      this.listCounter--;
    }
    else {
      this.notificationService.warn("Sorry, You can't click previous now.");
    }

  }

  onClickGetEarlierSearch() {
    this.searchRequest.Searchtype = "EARLIER";
    this.searchRequest.SearchCache = this.searchResponse.Request.SearchCache;
    this.searchRequest.SearchIndex = this.searchResponse.Request.SearchIndex;
    this.searchRequest.TravelSolCount = this.searchResponse.Request.TravelSolCount;
    this.getTravelSolutions();
  }

  onClickGetLaterSearch() {
    this.searchRequest.Searchtype = "LATER";
    this.searchRequest.SearchCache = this.searchResponse.Request.SearchCache;
    this.searchRequest.SearchIndex = this.searchResponse.Request.SearchIndex;
    this.searchRequest.TravelSolCount = this.searchResponse.Request.TravelSolCount;
    this.getTravelSolutions();
  }

  getTravelSolutions() {
    this.dataSource = null;
    
    this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.DepartureTimesStart)).format('YYYY-MM-DDTHH:mm');
    // added to retain the modified departuretimestart on ealier/later to use on return from travel extra 
    if(this.searchRequest.retainedSingleDepartureTimeStart ){
      this.searchRequest.DepartureTimesStart = moment(this.searchRequest.retainedSingleDepartureTimeStart).format('YYYY-MM-DDTHH:mm');
    }
    if (this.searchRequest.Searchtype) {
      this.searchRequest.JourneySearchType = this.searchRequest.Searchtype;
      this.setEarlierLaterSearchDates();
    }
    this.callNewSearchApi();
  }

  bindGrid() {
    if (this.searchResponse.TravelSolutions != null) {
      this.setTravelSolutionsForOpenReturn();
      this.dataSource = new MatTableDataSource(this.searchResponse.TravelSolutions);
      this.travelSolutionCache = this.searchResponse.Request.SearchCache;

      this.isHideEarlier = this.searchResponse.HideEarlier;
      this.isHideLater = this.searchResponse.HideLater;
      this.searchRequest.DepartureTimesStartShow = this.searchResponse.Date;
      this.ongoingDateString = moment(this.searchResponse.Date).format('YYYY-MM-DD');
      if (this.dataSource?.data != null) {
        this.setDataSourceData();
      }
      else {
        this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
        this.singleFare = 0;
      }
    }

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

  setDefaultSelectedOnLoad() {
    if (this.sharedSibling.evaluateRequest != null && this.searchResponse.TravelSolutions != null) {
      let defaultSelectedTS = this.searchResponse.TravelSolutions.find(m => m.TravelSolId
        == this.sharedSibling.evaluateRequest.OutwardTravelSolId);
      if (defaultSelectedTS != null) {
        let defaultSelectedFare = defaultSelectedTS.FareList.find(m =>
          m.OfferId == this.sharedSibling.evaluateRequest.OutwardOfferId
          && m.ServiceId == this.sharedSibling.evaluateRequest.OutwardCatlogServiceId)
        if (defaultSelectedFare != null) {
          this.onSelectFareTravelSolution(defaultSelectedFare, defaultSelectedTS);

          this.expandedElement = defaultSelectedTS;
          if (this.sharedSibling.IsViewMoreClick) {
            this.isAllTicketVisible = true;
          }
        }
      }


    }
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

  showServiceDisruptionDetails(row) {
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
        IsTrainClosed: row.IsTrainClosed,
        SearchCustomCache: this.searchResponse.Request.SearchCache
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

  callGa4DataLayerEventsOnSuccess() {
    try {
      let fullSoldOutJourney;
      let outwardSelectedFare = this.sharedSibling?.journeySummaryModel?.SingleSelectedFare;
      let selectTravelSolParams = {
        searchRequest: this.searchRequest,
        searchSource: 'Homepage',
        searchSuccess: true,
        searchError: '',
        searchResponse: this.searchResponse,
        defaultSelectedRow: this.defaultSelectedRow,
        selectedRow: -1,
        selectedPrice: null,
        defaultSelectedRowSingleReturn: -1,
        SelectedRowReturn: -1
      }
      this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, 0, false, [...this.cheapestTravelSolutionId], outwardSelectedFare, null, 0);
      // ga4-datalayer search and view_list_item event
      let ga4SearchEventParam = new GA4SearchEventParam()
      ga4SearchEventParam.searchSource = 'Homepage';
      ga4SearchEventParam.searchSuccess = true;
      ga4SearchEventParam.searchError = '';
      this.ga4datalayerService.loadGA4DataLayerOnSearch(this.searchRequest, ga4SearchEventParam, this.searchResponse, 0, [...this.cheapestTravelSolutionId], outwardSelectedFare, null);
      
      if (this.isExistSoldOutJourney()) {
        let notrainavailable = this.searchResponse?.TravelSolutions.filter(a => a?.IsTrainClosed)
        if (notrainavailable.length == 5) {
          fullSoldOutJourney = true;
        }
        this.ga4datalayerService.loadGALayerForSoldOutClassOnSearchResults(this.searchRequest, this.searchResponse, fullSoldOutJourney);
      }
    } catch (error) {
      console.log(error);
    }
  }

  callGa4DataLayerEventsOnError() {
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
      this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, -1, false, [...this.cheapestTravelSolutionId], null, null, -1);
      // ga4-datalayer search and view_list_item event
      let ga4SearchEventParam = new GA4SearchEventParam();
      ga4SearchEventParam.searchSource = 'Homepage';
      ga4SearchEventParam.searchSuccess = false;
      ga4SearchEventParam.searchError = this.responseData.ResponseMessage;
      this.ga4datalayerService.loadGA4DataLayerOnSearch(this.searchRequest, ga4SearchEventParam, null, -1, [...this.cheapestTravelSolutionId], null, null);
    
      if (this.isExistSoldOutJourney()) {
        let notrainavailable = this.searchResponse?.TravelSolutions.filter(a => a?.IsTrainClosed);
        if (notrainavailable.length == 5) {
          fullSoldOutJourney = true;
        }
        this.ga4datalayerService.loadGALayerForSoldOutClassOnSearchResults(this.searchRequest, this.searchResponse, fullSoldOutJourney);
      }
    } catch (error) {
      console.log(error);
    }
  }

  callNewSearchApi() {
    this.searchSolutionService.getSolutions(this.searchRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          this.isStdPremiumAvailableOutward = false;
          if (this.responseData.ResponseCode == '200') {
            this.sharedSibling.isSearchErrorSoldOut = false;
            this.sharedSibling.isReturnSearchErrorSoldOut = false;
            this.sharedSibling.isTrainDepartedOrCancelled = false;
            this.sharedSibling.isSearchApiError = false;
            this.sharedSibling.isEarlierLaterSearchApiError = false;
            this.timeoutFlag = false;
            this.searchResponse = this.responseData.Data.SingleTravel;
            localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting, String(this.searchResponse.IsReviewMergedFlowEnabled));
            this.updateSearchResponse();
            this.updateTravelSolutionReponseOnSuccess();            
            this.bindGrid();
            this.setDefaultSelectedOnLoad();
            this.callGa4DataLayerEventsOnSuccess();
          }
          else {
            this.updateTravelSolutionResponseOnError();
          }
        }
      });
  }

  updateTravelSolutionResponseOnError() {
    //Added a property so on earlier/later editQtt input dates do not change
    if (this.searchRequest.JourneySearchType == 'EARLIER' || this.searchRequest.JourneySearchType == 'LATER') {
      this.searchRequest.DepartureTimesStart = this.sharedSibling.editQttDepartureTimeStart;
    }
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
      this.timeoutFlag = true;
      this.sharedSibling.isSearchApiError = true;
    } else if (this.responseData.ResponseCode == '202') {
      this.sharedSibling.timeoutErrorMessage = this.responseData.ResponseMessage;
      this.sharedSibling.isEarlierLaterSearchApiError = true;
    }
    else {
      this.sharedSibling.timeoutErrorMessage = "Sorry, that's our fault.";
      this.timeoutFlag = true;
      this.sharedSibling.isSearchApiError = true;
    }

    this.callGa4DataLayerEventsOnError();
    this.isBuyNowDisable = true;
    this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.singleFare = 0;
  }

  updateTravelSolutionReponseOnSuccess() {
    //Added a property so on earlier/later editQtt input dates do not change
    if (this.searchRequest.JourneySearchType == 'EARLIER' || this.searchRequest.JourneySearchType == 'LATER') {
      this.searchRequest.DepartureTimesStart = this.sharedSibling.editQttDepartureTimeStart;
    }
    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    if (this.searchResponse != null) {
      this.sharedSibling.journeySummaryModel.IsPromo = this.searchResponse.IsPromo;
    }
    if (this.searchResponse && this.searchResponse.IsPromo === true) {
      this.isPromotionAppliedSingle = true;
    }
    else {
      this.isPromotionAppliedSingle = false;
    }
    if (this.searchResponse.IsShowPopup) {
      this.dialogSingle.open(InfoPopupComponent, {
        width: '500px',
        disableClose: false,
        data: {
          Message: this.searchResponse.Message
        }
      });
    }
  }

  updateSearchResponse() {
    if (this.searchResponse != null) {
      let notrainavailable = this.searchResponse.TravelSolutions.filter(a => !a.IsTrainClosed)
      if (notrainavailable.length <= 0) {
        this.sharedSibling.isSearchErrorSoldOut = true;
        this.sharedSibling.timeoutErrorMessage = this.errorMessageEnum.soldOutErrorMessage;
      }
      // added to check if all the solution are departed or cancelled
      let departedOrCacelledTrain = this.searchResponse.TravelSolutions.filter(a => !(a.IsAlreadyDepartured || a.IsCancelled))
      if(departedOrCacelledTrain.length <= 0){
        this.sharedSibling.isTrainDepartedOrCancelled = true;
      }
    }
    if(this.sharedSibling.isSearchErrorSoldOut){
      this.openAmendSearch();
    }else{
      this.hideEditQtt.emit();
    }
  }

  setEarlierLaterSearchDates() {
    if (this.searchResponse?.TravelSolutions) {
      this.searchRequest.FirstTrainDepartureTimesStart = this.searchResponse.TravelSolutions[0].DepartureDate;
      this.searchRequest.LastTrainDepartureTimesStart = this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].DepartureDate;
      this.searchRequest.FirstTrainArrivalTimesStart = this.searchResponse.TravelSolutions[0].ArrivalDate;
      this.searchRequest.LastTrainArrivalTimesStart = this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].ArrivalDate;
      if (this.searchRequest.Traveltype == 'DEPARTAFTER') {
        if (this.searchRequest.Searchtype == 'EARLIER') {
          let numberOfMlSeconds = new Date(this.searchRequest.FirstTrainDepartureTimesStart).getTime();
          let subtractMlSeconds = 20 * 60 * 60 * 1000;
          this.searchRequest.DepartureTimesStart = moment(new Date(numberOfMlSeconds - subtractMlSeconds)).format('YYYY-MM-DDTHH:mm');
        } else if (this.searchRequest.Searchtype == 'LATER') {
          this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.LastTrainDepartureTimesStart)).format('YYYY-MM-DDTHH:mm');
        }
      } else {
        if (this.searchRequest.Searchtype == 'EARLIER') {

          this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.FirstTrainArrivalTimesStart).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');
        } else if (this.searchRequest.Searchtype == 'LATER') {
          this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.LastTrainArrivalTimesStart).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');
        }
      }
      // retaining modified departuretimestart to use on return from travel extra 
      this.searchRequest.retainedSingleDepartureTimeStart = this.searchRequest.DepartureTimesStart;
    }
  }

  setTravelSolutionsForOpenReturn() {
    if (this.searchRequest.TravelSolutionDirection == 'OPEN_RETURN') {
      if (this.searchResponse?.TravelSolutions != null) {
        this.searchResponse.TravelSolutions.forEach(travelSolution => {
          travelSolution.SingleFare = travelSolution.ReturnFare;
          travelSolution.FareList = travelSolution.ReturnFareList;
          travelSolution.NewFareList = travelSolution.NewReturnFareList;
          travelSolution.IsStandardFare = travelSolution.IsRetStandardFare;
          travelSolution.IsStandardPremiumFare = travelSolution.IsRetStandardPremiumFare;
          travelSolution.IsFirstClassFare = travelSolution.IsRetFirstClassFare;
        });
      }
    }
  }

  setDataSourceData() {
    let nonSalableTravelSoution = this.searchResponse.TravelSolutions.filter(m => m.SingleFare > 0 && !m.IsSaleable && !m.IsCancelled
      && !m.IsAlreadyDepartured && !m.IsTrainClosed); // add iscancelled anmol
    if (nonSalableTravelSoution != null && nonSalableTravelSoution != undefined && nonSalableTravelSoution.length > 0) {
      let travelSolutionMinFare = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.SingleFare; }));
      this.setFastestTravelSolution(nonSalableTravelSoution);
      let minFareTravelSolutionList = this.dataSource.data.filter(m => m.SingleFare == travelSolutionMinFare && !m.IsAlreadyDepartured && !m.IsTrainClosed && !m.IsCancelled);
      if (minFareTravelSolutionList != null && minFareTravelSolutionList.length > 0) {
        minFareTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);
        this.cheapestTravelSolutionId = [];
        for (let index = 0; index < minFareTravelSolutionList.length; index++) {
          this.cheapestTravelSolutionId[index] = minFareTravelSolutionList[index].TravelSolId;
        }
        this.getAvantiTravelSolution();
      }
    }
    else {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
      this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
      this.singleFare = 0;
    }
  }

  setFastestTravelSolution(nonSalableTravelSoution) {
    let travelSolutionMinDuration = Math.min.apply(Math, nonSalableTravelSoution.map(function (o) { return o.DurationMinute; }));
    let minDurationTravelSolutionList = this.dataSource.data.filter(m => m.DurationMinute == travelSolutionMinDuration);
      if (minDurationTravelSolutionList != null && minDurationTravelSolutionList.length > 0) {
        minDurationTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);
        this.fastestTravelSolutionId = [];
        for (let index = 0; index < minDurationTravelSolutionList.length; index++) {
          this.fastestTravelSolutionId[index] = minDurationTravelSolutionList[index].TravelSolId;
        }
      }
  }

  setAvantiMinFareTravelSolutionData(minFareAvantiTravelSolutionList) {
    if (minFareAvantiTravelSolutionList.length > 1)
      minFareAvantiTravelSolutionList.sort((a, b) => a.DurationMinute - b.DurationMinute);

    this.defaultSelectedRow = minFareAvantiTravelSolutionList[0].TravelSolId;
    this.singleFare = minFareAvantiTravelSolutionList[0].SingleFare;

    this.singleFareCurrency = minFareAvantiTravelSolutionList[0].Currency;

    if (this.sharedSibling.journeySummaryModel == null) {
      this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
    }
    minFareAvantiTravelSolutionList[0].NewFareList.forEach(x => {
      if (x.IsMinPrice) {
        x.FareList.forEach(element => {
          if (element.MinPrice) {
            if (this.sharedSibling.journeySummaryModel == null) {
              this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
            }
            this.sharedSibling.journeySummaryModel.SingleTime = minFareAvantiTravelSolutionList[0].DarwinDepartureTime + ' → ' + minFareAvantiTravelSolutionList[0].DarwinArrivalTime;
            this.sharedSibling.journeySummaryModel.SingleDuration = minFareAvantiTravelSolutionList[0].Duration;
            this.sharedSibling.journeySummaryModel.SingleChanges = minFareAvantiTravelSolutionList[0].Changes;
            this.sharedSibling.journeySummaryModel.SingleTicketType = element.TicketTypeName;
            this.sharedSibling.journeySummaryModel.SingleCurrency = element.Currency;
            this.sharedSibling.journeySummaryModel.SinglePrice = element.Price;
            this.sharedSibling.journeySummaryModel.SingleTicketDescription = element.TicketDescription;
            this.sharedSibling.journeySummaryModel.SingleOperator = minFareAvantiTravelSolutionList[0].Operator;
            this.sharedSibling.journeySummaryModel.SingleOperatorChange = minFareAvantiTravelSolutionList[0].OperatorChange;
            this.sharedSibling.journeySummaryModel.SingleSaleCompany = minFareAvantiTravelSolutionList[0].SaleCompany;
            this.sharedSibling.journeySummaryModel.SingleSearchCache = this.searchResponse.Request.SearchCache;
            this.sharedSibling.journeySummaryModel.SingleRouteModel = minFareAvantiTravelSolutionList[0];
          }
        });
      }
    });

    this.sharedSibling.sendFareData(minFareAvantiTravelSolutionList[0].FareList.filter(m => m.MinPrice)[0]);

    //Journey extras
    let tempFarelist = minFareAvantiTravelSolutionList[0].FareList.filter(m => m.Price == minFareAvantiTravelSolutionList[0].SingleFare);

    this.sharedSibling.journeySummaryModel.SingleSelectedFare = tempFarelist[0];

    this.selectedFare = tempFarelist[0]
    this.selectedServiceId = tempFarelist[0].ServiceId;
    this.selectedOfferId = tempFarelist[0].OfferId;

    this.ticketDescription = tempFarelist[0].TicketDescription;
    this.ticketRestriction = tempFarelist[0].ticketRestriction;

    this.sharedSibling.sendFareData(tempFarelist);
    this.selectedTravelSolution = minFareAvantiTravelSolutionList[0];

    //Fare breakdown Latest
    this.sharedSibling.resetFareBreakDownData();

    this.sharedSibling.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
    this.sharedSibling.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
    this.sharedSibling.fareBreakdownModelData[0].IsReturnJourney = false;
    tempFarelist[0].FareDetails.forEach(tempFarelistFareDetail => {
      let outJourney = new JourneyModel;
      outJourney.Passenger = tempFarelistFareDetail.FarePerson;//'1 * Adult';
      outJourney.PricePerPerson = tempFarelistFareDetail.BasePrice;
      outJourney.TotalPrice = tempFarelistFareDetail.Price;
      outJourney.RailCard = tempFarelistFareDetail.Railcard;
      outJourney.IsCheck = tempFarelistFareDetail.IsCheck;
      this.sharedSibling.fareBreakdownModelData[0].OutWardJourney.push(outJourney);
    });
    this.expandedElement = minFareAvantiTravelSolutionList[0];
  }

  getAvantiTravelSolution() {
    let AvantiTravelSolution;
    const found = this.dataSource.data.some(m => m.Operator == 1 || m.Operator == 2);
    if (!found) {
      AvantiTravelSolution = this.dataSource.data.filter(m => m.SingleFare > 0 && !m.IsAlreadyDepartured && !m.IsCancelled);
    } else {
      AvantiTravelSolution = this.dataSource.data.filter(m => m.SingleFare > 0 && !m.IsAlreadyDepartured && !m.IsCancelled && !m.IsTrainClosed);
    }
    if (AvantiTravelSolution != null && AvantiTravelSolution.length > 0) {
      let AvantiTravelSolutionMinFare = Math.min.apply(Math, AvantiTravelSolution.map(function (o) { return o.SingleFare; }));
      let minFareAvantiTravelSolutionList = AvantiTravelSolution.filter(m => m.SingleFare == AvantiTravelSolutionMinFare);
      if (minFareAvantiTravelSolutionList != null && minFareAvantiTravelSolutionList.length != 0) {
        this.setAvantiMinFareTravelSolutionData(minFareAvantiTravelSolutionList);
      }          
    }
    else {
      this.defaultSelectedRow = 0;
      this.singleFare = 0;
    }
  }

  isExistSoldOutJourney() {
    let isSoldOutJourney = false;
    if (this.searchResponse?.TravelSolutions) {
      this.searchResponse.TravelSolutions.forEach((travelSolution) => {
        if (travelSolution?.NewFareList) {
          travelSolution.NewFareList.forEach((newFareList) => {
            newFareList.FareList.forEach((fareList) => {
              if (fareList.IsSeatAvailable) {
                return isSoldOutJourney = true;
              }
            });
          });
        }
      });
      return isSoldOutJourney;
    }
  }
}

export class ColumnsToDisplay {
  key: string;
  label: string;
}
