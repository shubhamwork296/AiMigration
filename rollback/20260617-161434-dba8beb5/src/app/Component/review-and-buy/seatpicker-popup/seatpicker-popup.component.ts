declare let seamless: any;
import { Component, OnInit, Inject, ViewChild, ElementRef, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JourneyDetail, ReservationSeat } from 'src/app/models/review-buy/review-buy-model';
import { SeatPickerResponseDto, FacilityData, CoachData, SeatPickerRequestDto, SeatData, UpdateReservationRequestDto, UpdateReservationResponseDto, SvgCoach } from 'src/app/models/review-buy/seat-picker-model';
import { ReviewBuyService } from 'src/app/services/review-buy.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { CommonServices } from 'src/app/services/common.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { MyAccountService } from 'src/app/services/my-account.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { Ga4ItemListEnum, SeatPickerMsgsEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-seatpicker-popup',
    templateUrl: './seatpicker-popup.component.html',
    styleUrls: ['./seatpicker-popup.component.css'],
    standalone: false
})
export class SeatpickerPopupComponent implements OnInit {
  journey: JourneyDetail;
  seatInfo: ReservationSeat;
  seatPickerResponse: SeatPickerResponseDto;
  tempSeatData: SeatData[];
  seatPickerRequest: SeatPickerRequestDto;
  updateReservationRequestDto: UpdateReservationRequestDto;
  updateReservationResponseDto: UpdateReservationResponseDto;
  responseData: ResponseData;
  selectedSeats: string;
  previousSelectedSeat: string;
  previousSelectedCoach: string;

  selectedSeat: string;
  dropdownSelectedSeat: string;
  dropdownSelectedCoach: string;
  selectedCoach: string;
  tempSelectedCoach: string;
  tempPrevCoach: string;
  previousCoach: string;
  nextCoach: string;
  travelDirection: boolean = true;
  totalCoaches;
  currentCoach = 0;
  currentCoachIndex = 0;
  availableSeats = [];
  isChangedSeatClicked: boolean = false;
  previousSelectedSeatTaget: any;
  seatPickerNotAvailable: boolean = false;
  coachNotAvailable: boolean = false;
  coachNotReservable: boolean = false;
  unavailableCoach: boolean = false;
  sucessfullysaved: boolean = false;
  failToSave: boolean = false;
  unavailableCoachSVG ="<svg contentScriptType=\"text/ecmascript\" width=\"305\" height=\"1100\" zoomAndPan=\"magnify\" contentStyleType=\"text/css\" preserveAspectRatio=\"xMidYMid meet\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\"></svg>";
  defaultCoachType: string;
  SelectedCoachType: string;
  isSaveDisabled: boolean = true;
  outwardText: string = "Outbound";
  updatedCount: number = 0;
  showCnacelledWithDD: string = "";
  prevTxtElement: any;
  onChangeOtherSeat: boolean = false;
  isSeatPickerDataLoaded: boolean = false;
  currentSection: string;
  coachValue: string;
  seatkey: string
  journeyDetailFlag: boolean = false;
  closeSeatPikr: boolean = false;
  svgClickCount = 0;
  closeSeatPickerDiv: boolean = false;

  oldNewSeatObject = {};
  seatFacility;
  coachOverlayClassArray = [];
  selSeatDataSet = [];
  prevSelectedSeat: any;
  txtAnimVal: any;
  seatFaciltities = [{ Name: 'Power Socket', Icon: 'POWE' },
  { Name: 'Luggage', Icon: 'LUGG' },
  { Name: 'Priority Seat', Icon: 'PSEA' },
  { Name: 'Wheelchair Space', Icon: 'WCHR' },
  { Name: 'Toilet (including disabled)', Icon: 'NRWC' },
  { Name: 'Shop', Icon: 'SHOP' },
  { Name: 'Unreserved', Icon: 'UNRESERVED' },
  { Name: 'Bicycle', Icon: 'CYCLE' },
  { Name: 'Quiet', Icon: 'QUIE' },
  { Name: 'Window', Icon: 'WIND' },
  { Name: 'Aisle', Icon: 'AISL' },
  { Name: 'Complimentary WiFi', Icon: 'INFW' },
  { Name: 'Forwards', Icon: 'ODR' },
  { Name: 'Backwards', Icon: 'IDR' },
  { Name: 'Individual seat', Icon: 'INDL' },
  { Name: 'Restricted view', Icon: 'NOWI' },
  { Name: 'Wheelchair companion', Icon: 'WCHC' },
  { Name: 'Table', Icon: 'TABL' },
  { Name: 'USB only', Icon: 'POWU' }]

  @ViewChild('svgContainer', { static: true }) svgContainer: ElementRef;
  selButton: any;
  selSeatsLength: number;
  selectedSeatsArr = [];
  isFacilityExpanded: boolean = false;
  firstSelSeat: string;
  firstSelCoach: string;
  dataInventoryClassArr = [];
  reviewBuyJourneyTimeStampArr = [];

  isSeatButtonClicked: boolean = false;
  onlyIFSeatChanged: boolean = true;
  isTriggeredOnce: number = 0;
  reviewBuyService: ReviewBuyService;

  commonService: CommonServices;
  sharedService: SharedService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  myAccountService: MyAccountService;
  ga4DatalayerService: GA4DatalayerService;
  openedFeature: string;
  ga4ItemListEnum: Ga4ItemListEnum;
  isPostSale: boolean = false;
  reopenCache: string;
  seatPickerMsgsEnum: SeatPickerMsgsEnum;
  arrayObject = [];
  multipleSeatTypeInSameCoachObject = [];
  lastHeight: any;
  dataInventoryClassObject= [{
    ticketClass: 'Standard',
    dataInventoryClass: '2V'
  },{
    ticketClass: 'Standard Premium',
    dataInventoryClass: '2P'
  },{
    ticketClass: 'First Class',
    dataInventoryClass: '1C'
  },{
    ticketClass: 'Standard',
    dataInventoryClass: '2C'
  }];
  hitachiFinalOverHeight;
  firstMatchedHitachiSeatHeight;
  initialOverLayHeight;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SeatpickerPopupComponent>, private readonly injector: Injector) {

    // Dependency Injection without using constructor's param
    this.reviewBuyService = this.injector.get(ReviewBuyService);
    this.commonService = this.injector.get(CommonServices);
    this.sharedService = this.injector.get(SharedService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.myAccountService = this.injector.get(MyAccountService);
    this.ga4DatalayerService = this.injector.get(GA4DatalayerService);
    this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
    this.seatPickerMsgsEnum = this.injector.get(SeatPickerMsgsEnum);

    this.journey = new JourneyDetail();
    this.seatInfo = new ReservationSeat();
    this.journey = data.journey;
    this.seatInfo = data.seatInfo;
    this.isPostSale = data.isPostSale;
    this.reopenCache = data.reopenCache;
    this.seatPickerResponse = new SeatPickerResponseDto();
    this.seatPickerResponse.Coaches = new Array<CoachData>();
    this.seatPickerResponse.TrainFacilities = new Array<FacilityData>();
    this.seatPickerResponse.SvgCoaches = new Array<SvgCoach>();
    this.updateReservationRequestDto = new UpdateReservationRequestDto();
    this.updateReservationRequestDto.IsDateChange = data.isDateChange ? true : false;

    this.seatPickerRequest = new SeatPickerRequestDto();
    this.seatPickerRequest.Arrival = this.seatInfo.Arrival;
    this.seatPickerRequest.Departure = this.seatInfo.Departure;
    this.seatPickerRequest.ArrivalLocation = this.seatInfo.ArrivalLocation;
    this.seatPickerRequest.DepartureLocation = this.seatInfo.DepartureLocation;
    this.seatPickerRequest.IsOutward = data.isOutWardJourney;
    this.seatPickerRequest.JourneyCreationDate = this.journey.CreationDate;
    if (this.isPostSale) {
      this.seatPickerRequest.ReviewBuyCache = this.sharedService.postSaleReviewBuyCache;
    } else {
      this.seatPickerRequest.ReviewBuyCache = this.sharedService.reviewBuyCache;
    }
    this.seatPickerRequest.IsPostSale = this.isPostSale;
    this.currentSection = '';
  }

  ngOnInit() {
    this.openedFeature = this.data.openedFeature;

    this.reviewBuyJourneyTimeStampArr = this.sharedService.reviewBuyJourneyTimeStampArr || [];
    if (this.sharedService.isFromAmendReservation) {
      this.seatPickerResponse = this.sharedService.seatPickerResponseAmend;
      this.isSeatPickerDataLoaded = true;

      if (this.seatPickerRequest.IsOutward) {
        this.outwardText = "Outbound";
        this.seatPickerRequest.Traveldate = (this.data.isAmendReviewBuyData === true) ? this.journey.OutwardDetail.DepartureTime : this.data.journey.TravelDate;
      }
      else {
        this.outwardText = "Return";
        this.seatPickerRequest.Traveldate = (this.data.isAmendReviewBuyData === true) ? this.journey.ReturnDetail.DepartureTime : this.data.journey.TravelDate;
      }
      this.bindSeatPickerResponse();
    } else {
      if (this.seatPickerRequest.IsOutward) {
        this.outwardText = "Outbound";
        this.seatPickerRequest.Traveldate = this.journey.OutwardDetail.TravelDate;
      }
      else {
        this.outwardText = "Return";
        this.seatPickerRequest.Traveldate = this.journey.ReturnDetail.TravelDate;
      }

      this.getSeatPickerData();
    }
  }

  setUnavailableSeatDisabled() {
    setTimeout(() => {
      let svgs = document.getElementById('parentDiv').getElementsByTagName('svg') as any as Array<HTMLElement>;
      for (let j = 0; j < svgs.length; j++) {
        let totalUseTags:any = svgs[j].getElementsByTagName('use');
        if (this.seatPickerResponse.SvgCoaches[j].SvgLayout == '') {
          j++;
        }
        let coachIndex = j;
        this.availableSeats = this.seatPickerResponse.SvgCoaches[coachIndex].AvailableSeats;
        this.coachValue = this.seatPickerResponse.SvgCoaches[j].CoachIndex;

        for(let totalUseTag of totalUseTags){
          let textElement = this.getNextSiblingTextElementOfUseTag(totalUseTag.parentNode);
          if (textElement) {
            let x = textElement.textContent.trim();
            let isSeatExists = false;

            let bookedSeat = this.seatPickerResponse.Seat.find(m => m.Seat == x && m.Coach == this.coachValue);

            this.checkAndSetSeatAttributesValue(x, isSeatExists, j, totalUseTag, textElement, bookedSeat);
          }
        }
      }
    }, 100);


  }

  checkAndSetSeatAttributesValue(x, isSeatExists, j, totalUseTag, textElement, bookedSeat) {
    if (bookedSeat != undefined && bookedSeat != null) {
      isSeatExists = true;
      this.coachValue = bookedSeat.Coach;
    }
    if (isSeatExists) {
      if (totalUseTag.tagName == 'use') {
        this.getUseTagbaseValInCaseOfSeatExist(totalUseTag, textElement);
      }
    }
    let isSeatAvailable = this.checkSeatAvailable(x, totalUseTag);
    if (isSeatAvailable && this.coachOverlayClassArray[j] === '' && this.isSeatButtonClicked) {
      totalUseTag.setAttribute("tabindex", (j + 1) + x);
      totalUseTag.setAttribute("aria-label", 'seat' + x);
      if (!totalUseTag.hasAttribute('seatEvent')) {
        totalUseTag.addEventListener('keypress', this.onClick.bind(this));
        totalUseTag.setAttribute("seatEvent", "true")
      }
    } else {
      totalUseTag.setAttribute("tabindex", '-1');
    }
    if (!isSeatAvailable && !isSeatExists) {
      if (totalUseTag.tagName == 'use') {
        this.getTotalUseTagbaseVal(totalUseTag, textElement);
      }
    }
  }

  getUseTagbaseValInCaseOfSeatExist(totalUseTag, textElement) {
    if (totalUseTag.href.animVal == "#sfseat" || totalUseTag.href.animVal == "#sfseattabl") {
      totalUseTag.href.baseVal = "#sfseatselected";
      this.previousSelectedSeatTaget = totalUseTag;
    }
    else if (totalUseTag.href.animVal == "#sbseat" || totalUseTag.href.animVal == "#sbseattabl") {
      totalUseTag.href.baseVal = "#sbseatselected";
      this.previousSelectedSeatTaget = totalUseTag;
    }
    textElement.style.cursor = "not-allowed";
    totalUseTag.style.cursor = "not-allowed";
  }

  getTotalUseTagbaseVal(totalUseTag, textElement) {
    if (totalUseTag.href.animVal == "#sfseat") {
      totalUseTag.href.baseVal = "#sfseatselectedgrey";
    }
    else if (totalUseTag.href.animVal == "#sbseat") {
      totalUseTag.href.baseVal = "#sbseatselectedgrey";
    }
    else if (totalUseTag.href.animVal == "#sbseattabl") {
      totalUseTag.href.baseVal = "#sbseatselectedgrey";
    }
    else if (totalUseTag.href.animVal == "#sfseattabl") {
      totalUseTag.href.baseVal = "#sfseatselectedgrey";
    }

    else if (totalUseTag.href.animVal == "#sbseatselected") {
      totalUseTag.href.baseVal = "#sbseatselectedgrey";
    }
    else if (totalUseTag.href.animVal == "#sfseatselected") {
      totalUseTag.href.baseVal = "#sfseatselectedgrey";
    }
    textElement.style.cursor = "not-allowed";
    totalUseTag.style.cursor = "not-allowed";
    textElement.style.outline = "none";
    totalUseTag.style.outline = "none";
  }

  getAllSelectedSeats() {
    let reservedSeatString = "";
    this.seatPickerResponse.Seat.forEach(seat => {
      reservedSeatString += seat.Coach + seat.Seat + ",";
    });
    return reservedSeatString.replace(/,\s*$/, "");
  }

  onClick(event) {
    this.getTxtAnimVal(event);
    if ((event.target.tagName == 'use' || event.target.tagName == 'text')) {
      if (this.txtAnimVal != "#sfseatselectedgrey" && this.txtAnimVal != "#sbseatselectedgrey"
        && this.txtAnimVal != "#sfseatselected" && this.txtAnimVal != "#sbseatselected"
        && this.txtAnimVal != "#sbseatunavailable" && this.txtAnimVal != "#sfseatunavailable" && this.txtAnimVal != "#bike_space_available") {
        this.onlyIFSeatChanged = false;

        this.previousSelectedCoach = this.selectedCoach;
        if (this.selectedSeat.charAt(0) === '0') {
          this.selectedSeat = this.selectedSeat.slice(1);
        }
        this.previousSelectedSeat = this.selectedSeat;


        this.previousSelectedSeatTaget = document.getElementById('parentDiv').querySelector('#' + this.previousSelectedCoach).getElementsByTagName('svg')[0].getElementById(this.previousSelectedSeat).children[0];


        if (event.target.tagName == 'use') {
          this.selectedCoach = event.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.getAttribute("id");
          this.checkValueForSelectedSeat(event);
          
        }
        if (event.target.tagName == 'text') {
          let data = ( <HTMLElement>( <HTMLElement>event.target ).parentNode.parentNode.parentNode.parentNode.parentNode.parentNode );
          this.selectedCoach = data?.getAttribute('id');
          this.getPreviousElementSibling(event);
        }
        this.onSeatSelection(this.selectedCoach, this.selectedSeat);
        this.seatButtonClicked();
      }
    }
  }

  getTxtAnimVal(event) {
    if (event.target.tagName == 'text') {
      let prevElementSibling = this.getPrevSiblingGElementOfTextTag(event.target.previousElementSibling);
      this.txtAnimVal = prevElementSibling.firstChild.nextSibling.href.animVal;
    } else {
      this.txtAnimVal = event.target.href.animVal;
    }
  }

  seatButtonClicked() {
    if (this.isSeatButtonClicked) {
      window.setTimeout(() => document.getElementById('saveseat').focus(), 0);
      this.isSeatButtonClicked = false;
      this.setUnavailableSeatDisabled();

      let dom = Array.from(document.getElementById('coachParent').children);
      dom.forEach((element, index) => {
        if (this.coachOverlayClassArray[index] == '') {
          element.setAttribute("tabindex", '-1');
        }
      });
    }
  }

  getPreviousElementSibling(event) {
    let previousElementSibling = this.getPrevSiblingGElementOfTextTag(event.target.previousElementSibling);
    if (previousElementSibling.firstChild.nextSibling.href.animVal != "#sfseatselectedgrey"
      && previousElementSibling.firstChild.nextSibling.href.animVal != "#sbseatselectedgrey"
      && previousElementSibling.firstChild.nextSibling.href.animVal != "#sfseatselected"
      && previousElementSibling.firstChild.nextSibling.href.animVal != "#sbseatselected"
      && previousElementSibling.firstChild.nextSibling.href.animVal != "#sbseatunavailable"
      && previousElementSibling.firstChild.nextSibling.href.animVal != "#sfseatunavailable") {
      this.isSaveDisabled = false;
      this.showCnacelledWithDD = "";
      this.selectedSeat = event.target.textContent;
      this.removePreviousSeatSelection();
      this.getPreviousSelectedSeatTaget(previousElementSibling);
    }
  }

  checkValueForSelectedSeat(event) {
    if (event.target.href.animVal != "#sfseatselectedgrey" && event.target.href.animVal != "#sbseatselectedgrey"
      && event.target.href.animVal != "#sfseatselected" && event.target.href.animVal != "#sbseatselected"
      && event.target.href.animVal != "#sbseatunavailable" && event.target.href.animVal != "#sfseatunavailable") {
      this.isSaveDisabled = false;
      this.showCnacelledWithDD = "";
      this.removePreviousSeatSelection();
      if (event.target.href.animVal == "#sfseat" || event.target.href.animVal == "#sfseattabl") {
        event.target.href.baseVal = "#sfseatselected";
        this.previousSelectedSeatTaget = event.target;
      }
      else if (event.target.href.animVal == "#sbseat" || event.target.href.animVal == "#sbseattabl") {
        event.target.href.baseVal = "#sbseatselected";
        this.previousSelectedSeatTaget = event.target;
      }
      let textElement = this.getNextSiblingTextElementOfUseTag(event.target.parentNode);
      this.selectedSeat = textElement.textContent;
    }
  }

  onSeatSelection(selCoach, selSeat) {
    let selectedElement = document.getElementById('parentDiv').querySelector('#' + selCoach).getElementsByTagName('svg')[0].getElementById(selSeat);
    let dataSeatProperties = selectedElement.getAttribute('data-seat-properties').split(' ');
    this.seatFacility = this.seatFaciltities.filter(el => {
      return dataSeatProperties.find(element => {
        return element === el.Icon;
      });
    });

    this.oldNewSeatObject[this.seatkey.trim()] = selCoach + selSeat;

    let txtElem = document.getElementById('parentDiv').querySelector('#' + this.selectedCoach).getElementsByTagName('svg')[0].getElementById(this.selectedSeat).nextElementSibling as HTMLElement;
    txtElem.removeAttribute('style');

    let prevTxtElement = document.getElementById('parentDiv').querySelector('#' + this.previousSelectedCoach).getElementsByTagName('svg')[0].getElementById(this.previousSelectedSeat).nextElementSibling as HTMLElement;
    prevTxtElement.removeAttribute('style');

    setTimeout(() => {
      txtElem.setAttribute('style', 'stroke: rgb(255,255,255); stroke-width: 0.5; fill: white;');
      prevTxtElement.setAttribute('style', 'stroke: rgb(0,0,0); stroke-width: 0.5;');
    }, 20);

    let index = this.seatPickerResponse.Seat.findIndex(seat => seat.Coach === this.previousSelectedCoach && seat.Seat === this.previousSelectedSeat)

    let selSeatData = new SeatData();
    selSeatData.Seat = this.selectedSeat;
    selSeatData.CoachType = this.SelectedCoachType;
    selSeatData.Coach = this.selectedCoach;

    this.seatPickerResponse.Seat[index] = selSeatData;
    this.selSeatDataSet[index] = selSeatData;

  }

  removePreviousSeatSelection() {
    if (this.previousSelectedSeatTaget != undefined) {
      if (this.previousSelectedSeatTaget.href.animVal == "#sfseatselected") {
        this.previousSelectedSeatTaget.href.baseVal = "#sfseat";
      }
      else if (this.previousSelectedSeatTaget.href.animVal == "#sbseatselected") {
        this.previousSelectedSeatTaget.href.baseVal = "#sbseat";
      }
    }
  }

  getPreviousSelectedSeatTaget(previousElementSibling) {
    if (previousElementSibling.firstChild.nextSibling.href.animVal == "#sfseat" || previousElementSibling.firstChild.nextSibling.href.animVal == "#sfseattabl") {
      previousElementSibling.firstChild.nextSibling.href.baseVal = "#sfseatselected";
      this.previousSelectedSeatTaget = previousElementSibling.firstChild.nextSibling;
    }
    else if (previousElementSibling.firstChild.nextSibling.href.animVal == "#sbseat" || previousElementSibling.firstChild.nextSibling.href.animVal == "#sbseattabl") {
      previousElementSibling.firstChild.nextSibling.href.baseVal = "#sbseatselected";
      this.previousSelectedSeatTaget = previousElementSibling.firstChild.nextSibling;
    }
  }

  checkSeatAvailable(originalSeatNo, totalUseTag) {
    if (originalSeatNo) {
      let otherSeats = this.seatPickerResponse.Seat.filter(x => x.Seat != this.updateReservationRequestDto.OldSeat);
      otherSeats.forEach(journey => {
        this.seatPickerResponse.SvgCoaches.find(x => x.CoachIndex == journey.Coach).AvailableSeats = this.seatPickerResponse.SvgCoaches.find(x => x.CoachIndex == journey.Coach).AvailableSeats.filter(x => x != journey.Seat);
      });
      this.availableSeats = this.availableSeats.filter(availableSeat => {
        let flag = true;
        otherSeats.forEach(seat => {
          if (this.coachValue === seat.Coach && availableSeat === seat.Seat) {
            flag = false;
          }
        })
        return flag;
      });
      let dataSeatProperties = totalUseTag.parentNode.getAttribute('data-seat-properties');
      if (this.availableSeats.indexOf(originalSeatNo) != -1 && dataSeatProperties != this.ga4ItemListEnum.bikeSpaceAvailable) {
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

  getNextSiblingTextElementOfUseTag(nextElement) {
    let i = 1;
    while (nextElement) {
      if (nextElement.nodeName == 'text') {
        return nextElement;
      }
      nextElement = nextElement.nextElementSibling;
      i++;
    }
  }

  getPrevSiblingGElementOfTextTag(prevElement) {
    let i = 1;
    while (prevElement) {
      if (prevElement.nodeName == 'g') {
        return prevElement;
      }
      prevElement = prevElement.previousElementSibling;
      i++;
    }
  }

  getSeatPickerData() {
    this.isSeatPickerDataLoaded = false;
    this.reviewBuyService.viewSeatPicker(this.seatPickerRequest).subscribe(res => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          this.isSeatPickerDataLoaded = true;
          this.seatPickerResponse = this.responseData.Data;
          this.seatPickerResponse.Coaches.reverse();
          this.seatPickerResponse.SvgCoaches.reverse();
          this.selectedCoach = this.seatPickerResponse.DefaultCoach;
          this.dropdownSelectedCoach = this.seatPickerResponse.DefaultCoach;
          if (this.seatPickerResponse.DefaultSeat.charAt(0) === '0') {
            this.seatPickerResponse.DefaultSeat = this.seatPickerResponse.DefaultSeat.slice(1);
          }
          this.selectedSeat = this.seatPickerResponse.DefaultSeat;
          this.prevSelectedSeat = this.responseData.Data.Seat.slice();

          this.currentCoachIndex = this.seatPickerResponse.SvgCoaches.findIndex(seat => seat.CoachIndex == this.selectedCoach);
          this.totalCoaches = this.seatPickerResponse.SvgCoaches.length;
          this.currentSection = this.seatPickerResponse.SvgCoaches[0].CoachIndex;

          this.getStyleOfSeatAndCoaches();


          this.SelectedCoachType = this.defaultCoachType = this.seatPickerResponse.Coaches[this.currentCoachIndex].CoachType;
          this.tempSeatData = JSON.parse(JSON.stringify(this.seatPickerResponse.Seat));
          if (this.updatedCount == 2 || this.updatedCount == 0) {
            this.selectedSeats = this.getAllSelectedSeats();
          }

          this.setUnavailableSeatDisabled();
          this.getTravelSolutionValue();

        }
        else {
          this.seatPickerNotAvailable = true;
        }



      }

      let styleElem = document.head.appendChild(document.createElement("style"));
      styleElem.innerHTML = "#seat-header::before {background: #FF4713;}";
    });
  }

  getStyleOfSeatAndCoaches() {
    setTimeout(() => {
      let dataSeatProperties = document.getElementById('parentDiv').querySelector('#' + this.selectedCoach).getElementsByTagName('svg')[0].getElementById(this.selectedSeat).getAttribute('data-seat-properties').split(' ');
      this.filterSeatFacility(dataSeatProperties);

      this.seatPickerResponse.Seat.forEach((seat, index) => {
        if (seat.Seat.charAt(0) === '0') {
          seat.Seat = seat.Seat.slice(1);
        }
        if (index == 0) {
          this.firstSelSeat = seat.Seat;
          this.firstSelCoach = seat.Coach;
        }

        let txtElem = document.getElementById('parentDiv').querySelector('#' + seat.Coach).getElementsByTagName('svg')[0].getElementById(seat.Seat).nextElementSibling as HTMLElement;

        txtElem.removeAttribute('style');
        setTimeout(() => {
          txtElem.setAttribute('style', 'stroke: rgb(255,255,255); stroke-width: 0.5; fill: white;');
        }, 20);
      })

      seamless.elementScrollIntoView(document.getElementById('parentDiv').querySelector('#' + this.firstSelCoach).getElementsByTagName('svg')[0].getElementById(this.firstSelSeat), {
        block: "center"
      });


      this.getDataInventoryClassOnCoaches();


      if (this.updatedCount > 0) {
        this.coachOverlayClassArray = [];
      }

      this.getCoachOverlayClass();

      const dom = document.getElementById('coachParent').querySelector('#' + this.selectedCoach);
      if (dom) {
        seamless.elementScrollIntoView(dom, {
          block: "center"
        });
      }

      (document.getElementById('booked-seats').children[0] as HTMLElement).click();


    });
  }

  getDataInventoryClassOnCoaches() {
    for (let i = 0; i < this.seatPickerResponse.Coaches.length; i++) {
      if (document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0] === undefined) {
        this.dataInventoryClassArr[i] = '';
      } else if (document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0].getElementsByTagName('text')[0] == undefined) {
        this.dataInventoryClassArr[i] = '';
      } else {
        let firstSeatElement = document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0].getElementsByTagName('text')[0].innerHTML;

        let dataInventoryClass = document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0].getElementById(firstSeatElement).getAttribute('data-inventory-class');
        if (dataInventoryClass === "2V") {
          this.dataInventoryClassArr[i] = dataInventoryClass;
        } else {
          this.dataInventoryClassArr[i] = '';
        }
      }
    }
  }

  filterSeatFacility(dataSeatProperties) {
    this.seatFacility = this.seatFaciltities.filter(facility => {
      return dataSeatProperties.find(element => {
        return element === facility.Icon;
      });
    });
  }

  getTravelSolutionValue() {
    if (this.seatPickerResponse.TravelDirection == "FORWARD") {
      this.travelDirection = true;
    }
    else {
      this.travelDirection = false;
    }
  }

  getCoachOverlayClass() {
    this.seatPickerResponse?.SvgCoaches?.forEach((seatPickerResponseSvgcoach, index) => {
      let matchedDataInventoryClass='';
      this.setSplitCoachInventoryClassAndSeatsArrayObject(seatPickerResponseSvgcoach, index);
      matchedDataInventoryClass = this.checkForMultipleInventoryClassesInSplitCoach();
      if (matchedDataInventoryClass !== '') {
        this.setCoachOverlayInCaseOfSplitCoach(matchedDataInventoryClass, index);
      } else {
        this.handleNoMatchedDataInventoryClass(seatPickerResponseSvgcoach, index);
      }
      this.arrayObject = [];
    });
  }

  seatPickerResponseForSeatAndCoaches() {
    this.seatPickerResponse.Seat.forEach((seatPickerResponseSeat, index) => {
      if (seatPickerResponseSeat.Seat.charAt(0) === '0') {
        seatPickerResponseSeat.Seat = seatPickerResponseSeat.Seat.slice(1);
      }
      if (index == 0) {
        this.firstSelSeat = seatPickerResponseSeat.Seat;
        this.firstSelCoach = seatPickerResponseSeat.Coach;
      }

      let txtElem = document.getElementById('parentDiv').querySelector('#' + seatPickerResponseSeat.Coach).getElementsByTagName('svg')[0].getElementById(seatPickerResponseSeat.Seat).nextElementSibling as HTMLElement;
      txtElem.removeAttribute('style');
      setTimeout(() => {
        txtElem.setAttribute('style', 'stroke: rgb(255,255,255); stroke-width: 0.5; fill: white;');
      }, 20);
    })
    seamless.elementScrollIntoView(document.getElementById('parentDiv').querySelector('#' + this.firstSelCoach).getElementsByTagName('svg')[0].getElementById(this.firstSelSeat), {
      block: "center"
    });

    for (let i = 0; i < this.seatPickerResponse.Coaches.length; i++) {
      if (document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0] === undefined) {
        this.dataInventoryClassArr[i] = '';
      } else if (document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0].getElementsByTagName('text')[0] == undefined) {
        this.dataInventoryClassArr[i] = '';
      } else {
        let firstSeatElement = document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0].getElementsByTagName('text')[0].innerHTML;

        let dataInventoryClass = document.getElementById('parentDiv').querySelector('#' + this.seatPickerResponse.Coaches[i].Coach).getElementsByTagName('svg')[0].getElementById(firstSeatElement).getAttribute('data-inventory-class');
        if (dataInventoryClass === "2V") {
          this.dataInventoryClassArr[i] = dataInventoryClass;
        } else {
          this.dataInventoryClassArr[i] = '';
        }
      }
    }

    if (this.updatedCount > 0) {
      this.coachOverlayClassArray = [];
    }

  }
  seatPickerResponseForSvgCoaches() {
    this.seatPickerResponse?.SvgCoaches?.forEach((svgcoach, index) => {
      let matchedDataInventoryClass='';
      this.setSplitCoachInventoryClassAndSeatsArrayObject(svgcoach, index);
      matchedDataInventoryClass = this.checkForMultipleInventoryClassesInSplitCoach();
      if(matchedDataInventoryClass !== ''){
        this.setCoachOverlayInCaseOfSplitCoach(matchedDataInventoryClass, index);
      }else {
        this.handleNoMatchedDataInventoryClass(svgcoach, index);
      }
      this.arrayObject = [];
    })
  }
  bindSeatPickerResponse() {
    this.seatPickerResponse.Coaches.reverse();
    this.seatPickerResponse.SvgCoaches.reverse();
    this.selectedCoach = this.seatPickerResponse.DefaultCoach;
    this.dropdownSelectedCoach = this.seatPickerResponse.DefaultCoach;
    if (this.seatPickerResponse.DefaultSeat.charAt(0) === '0') {
      this.seatPickerResponse.DefaultSeat = this.seatPickerResponse.DefaultSeat.slice(1);
    }
    this.selectedSeat = this.seatPickerResponse.DefaultSeat;
    this.prevSelectedSeat = this.seatPickerResponse.Seat.slice();
    this.currentCoachIndex = this.seatPickerResponse.SvgCoaches.findIndex(seat => seat.CoachIndex == this.selectedCoach);
    this.totalCoaches = this.seatPickerResponse.SvgCoaches.length;
    this.currentSection = this.seatPickerResponse.SvgCoaches[0].CoachIndex;

    setTimeout(() => {
      let dataSeatProperties = document.getElementById('parentDiv').querySelector('#' + this.selectedCoach).getElementsByTagName('svg')[0].getElementById(this.selectedSeat).getAttribute('data-seat-properties').split(' ');
      this.seatFacility = this.seatFaciltities.filter(seatFacility => {
        return dataSeatProperties.find(element => {
          return element === seatFacility.Icon;
        });
      });
      
      this.seatPickerResponseForSeatAndCoaches();

      this.seatPickerResponseForSvgCoaches();
      
      const dom = document.getElementById('coachParent').querySelector('#' + this.selectedCoach);
      if (dom) {
        seamless.elementScrollIntoView(dom, {
          block: "center"
        });
      }

      (document.getElementById('booked-seats').children[0] as HTMLElement).click();


    });

    this.SelectedCoachType = this.defaultCoachType = this.seatPickerResponse.Coaches[this.currentCoachIndex].CoachType;
    this.tempSeatData = JSON.parse(JSON.stringify(this.seatPickerResponse.Seat));
    if (this.updatedCount == 2 || this.updatedCount == 0) {
      this.selectedSeats = this.getAllSelectedSeats();
    }

    this.setUnavailableSeatDisabled();

    if (this.seatPickerResponse.TravelDirection == "FORWARD") {
      this.travelDirection = true;
    }
    else {
      this.travelDirection = false;
    }
    let styleElem = document.head.appendChild(document.createElement("style"));
    styleElem.innerHTML = "#seat-header::before {background: #FF4713;}";
  }

  saveSeat() {
    this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, this.ga4ItemListEnum.saveSelectionAttemptAction);
    this.updateReservationRequestDto.JourneyCreationDate = this.seatPickerResponse.JourneyCreationDate;
    this.updateReservationRequestDto.IsOutward = this.seatPickerRequest.IsOutward;
    this.updateReservationRequestDto.ArrivalLocation = this.seatPickerRequest.ArrivalLocation;
    this.updateReservationRequestDto.DepartureLocation = this.seatPickerRequest.DepartureLocation;

    this.updateReservationRequestDto.NewCoach = '';
    this.updateReservationRequestDto.NewSeat = '';



    this.selSeatDataSet = this.selSeatDataSet.filter(el => {
      return el != null;
    });

    const filterByReference = this.seatPickerResponse.Seat.filter(el => {
      return !this.selSeatDataSet.find(element => {
        return element.Seat === el.Seat && element.Coach === el.Coach;
      });
    });

    filterByReference.forEach(el => {
      let seat = el.Seat;
      let coach = el.Coach
      let key = coach + seat;
      this.oldNewSeatObject[key] = coach + seat
    })
    for(let selectedSeat of this.prevSelectedSeat){
      let oldCoach = selectedSeat.Coach;
      let oldSeat = selectedSeat.Seat;

      this.updateReservationRequestDto.oldCoachAr.push(oldCoach);
      this.updateReservationRequestDto.oldSeatAr.push(oldSeat);
      let key = oldCoach + oldSeat;
      let value = this.oldNewSeatObject[key];
      let newCoach = value.match(/[a-zA-Z]+/g);
      let newSeat = value.match(/\d+/g);
      this.updateReservationRequestDto.newCoachAr.push(newCoach[0]);
      this.updateReservationRequestDto.newSeatAr.push(newSeat[0]);
    }

    if (this.updatedCount == 0) {
      this.updateReservationRequestDto.OldCoach = '';
      this.updateReservationRequestDto.OldSeat = '';
    }

    this.updateReservationRequestDto.TravelCache = this.seatPickerResponse.TravelCache;
    if (this.sharedService.isFromAmendReservation) {
      this.updateReservationAmend();
    }
    else {
      this.updateDateOnReviewBuyAfterSaveSelection();
      this.updateReservationReviewBuy();
    }
  }

  // updated Date after saveselection in case of review and buy change seat
  updateDateOnReviewBuyAfterSaveSelection() {
    if (this.seatPickerRequest.IsOutward) {
      this.seatPickerRequest.Traveldate = this.journey.OutwardDetail.DepartureTime;
    }
    else {
      this.seatPickerRequest.Traveldate = this.journey.ReturnDetail.DepartureTime;
    }
  }

  getUpdateReservationReviewBuy() {
    this.updatedCount = this.updateReservationResponseDto.UpdateCount;
    this.reviewBuyJourneyTimeStampArr.forEach(JourneyTimeStamp => {
      if (JourneyTimeStamp.CreationDate === new Date(this.journey.CreationDate).getTime()) {
        JourneyTimeStamp.updateCount = this.updateReservationResponseDto.UpdateCount;
      }
    });
    this.showCnacelledWithDD = this.updatedCount >= 1 ? "- cancelled" : "";
    if (this.updateReservationResponseDto.IsSuccess) {
      this.sucessfullysaved = this.updateReservationResponseDto.IsSuccess;
      this.selSeatsLength = this.updateReservationResponseDto.NewseatAr.length;
      for (let i = 0; i < this.selSeatsLength; i++) {
        let selSeat = this.updateReservationResponseDto.NewCoachAr[i] + this.updateReservationResponseDto.NewseatAr[i];
        this.selectedSeatsArr.push(selSeat);
      }
      this.selectedSeats = this.selectedSeatsArr.toString();
      this.sharedService.reviewBuyResponse.ReviewBuyCache = this.updateReservationResponseDto.ReviewBuyCache;
      this.setSharedServiceReviewByCacheForNormalAndPostSale();
      this.selectedCoach = this.updateReservationResponseDto.SelectedCoach;
      let styleElem = document.head.appendChild(document.createElement("style"));
      styleElem.innerHTML = "#seat-header::before {background: #6CAF35;}";
      this.ga4DatalayerService.loadGALayerForSuccessfullySaveSeatSelection(this.openedFeature, this.data.bookingReferenceNumber, this.updateReservationResponseDto, this.data.isOutWardJourney, this.data.journey);
      this.sharedService.CojReviewBuyResponseDto.COJData.COJEvaluateCache = this.updateReservationResponseDto.EvaluateCache;
      //  Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //  Set shared cache data
    }
    else {
      this.sharedService.reviewBuyResponse.ReviewBuyCache = this.updateReservationResponseDto.ReviewBuyCache;
      this.sharedService.reviewBuyCache = this.updateReservationResponseDto.ReviewBuyCache;
      if (this.updatedCount > 0) {
        this.updateReservationRequestDto.oldCoachAr = [];
        this.updateReservationRequestDto.oldSeatAr = [];
        this.updateReservationRequestDto.newCoachAr = [];
        this.updateReservationRequestDto.newSeatAr = [];
      }
      if (this.updatedCount == 3 && (this.updateReservationResponseDto.ReviewBuyCache == "" || this.updateReservationResponseDto.ReviewBuyCache == null)) {
        this.sharedService.reviewBuyResponse.Journey = new Array<JourneyDetail>();
        this.sharedService.reviewBuyResponse.BasketCount = 0;
        this.sharedService.getBasketCount.emit(0);

      }
      this.failToSave = !this.updateReservationResponseDto.IsSuccess;
      this.selectedCoach = this.updateReservationRequestDto.OldCoach;

      let styleElem = document.head.appendChild(document.createElement("style"));
      styleElem.innerHTML = "#seat-header::before {background: #C0414D;}";
      this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, this.ga4ItemListEnum.saveSelectionFailedAction, this.updateReservationResponseDto.Message);
    }
  }
  updateReservationReviewBuy() {
    this.updateReservationRequestDto.UpdateCount = this.updateReservationResponseDto != null ? this.updateReservationResponseDto.UpdateCount : 0;
    this.updateReservationRequestDto.ReviewBuyCache = this.sharedService.reviewBuyResponse.ReviewBuyCache;
    if(this.isPostSale){
      this.updateReservationRequestDto.ReopenCache = this.reopenCache;
      this.updateReservationRequestDto.EvaluateCache = this.sharedService.CojReviewBuyResponseDto.COJData.COJEvaluateCache;
    }
    this.updateReservationRequestDto.IsPostSale = this.isPostSale;
    this.reviewBuyService.UpdateReservation(this.updateReservationRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.updateReservationResponseDto = this.responseData.Data;
            this.getUpdateReservationReviewBuy();
            //  Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //  Set shared cache data
          }
          else {
            this.failToSave = true;
            this.sucessfullysaved = false;
            this.selectedCoach = this.updateReservationRequestDto.OldCoach;
            let styleElem = document.head.appendChild(document.createElement("style"));
            styleElem.innerHTML = "#seat-header::before {background: #C0414D;}";
            this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, this.ga4ItemListEnum.saveSelectionFailedAction, this.responseData.Error);
          }
        }
      });
  }
  
  getUpdatedReservationAmend() {
    this.updatedCount = this.updateReservationResponseDto.UpdateCount;
    this.showCnacelledWithDD = this.updatedCount >= 1 ? "- cancelled" : "";
    if (this.updateReservationResponseDto.IsSuccess) {
      this.sucessfullysaved = this.updateReservationResponseDto.IsSuccess;
      this.selSeatsLength = this.updateReservationResponseDto.NewseatAr.length;
      for (let i = 0; i < this.selSeatsLength; i++) {
        let selSeat = this.updateReservationResponseDto.NewCoachAr[i] + this.updateReservationResponseDto.NewseatAr[i];
        this.selectedSeatsArr.push(selSeat);
      }
      this.selectedSeats = this.selectedSeatsArr.toString();
      this.sharedService.reviewBuyCache = this.updateReservationResponseDto.ReviewBuyCache;
      this.sharedService.seatPickerResponseAmend.AmendEvaluateCache = this.updateReservationResponseDto.EvaluateCache;
      this.selectedCoach = this.updateReservationResponseDto.SelectedCoach;

      let styleElem = document.head.appendChild(document.createElement("style"));
      styleElem.innerHTML = "#seat-header::before {background: #6CAF35;}";
      this.ga4DatalayerService.loadGALayerForSuccessfullySaveSeatSelForViewBooking(this.openedFeature, this.data.bookingReferenceNumber, this.updateReservationResponseDto, this.data.isOutWardJourney, this.data.bookingDetailsResponse);
    }
    else {
      if (this.updatedCount > 0) {
        this.updateReservationRequestDto.oldCoachAr = [];
        this.updateReservationRequestDto.oldSeatAr = [];
        this.updateReservationRequestDto.newCoachAr = [];
        this.updateReservationRequestDto.newSeatAr = [];
      }
      if (this.updatedCount == 3) {
        this.sharedService.reviewBuyCache = this.updateReservationResponseDto.ReviewBuyCache;
      }
      this.failToSave = !this.updateReservationResponseDto.IsSuccess;
      this.selectedCoach = this.updateReservationRequestDto.OldCoach;

      let styleElem = document.head.appendChild(document.createElement("style"));
      styleElem.innerHTML = "#seat-header::before {background: #C0414D;}";
      this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, this.ga4ItemListEnum.saveSelectionFailedAction, this.updateReservationResponseDto.Message);
    }
  }
  updateReservationAmend() {
    this.updateReservationRequestDto.UpdateCount = this.updateReservationResponseDto != null ? this.updateReservationResponseDto.UpdateCount : 0;
    this.updateReservationRequestDto.EvaluateCache = this.sharedService.seatPickerResponseAmend.AmendEvaluateCache;
    this.updateReservationRequestDto.ReviewBuyCache = (this.sharedService?.reviewBuyCache) ? this.sharedService.reviewBuyCache : null;
    this.updateReservationRequestDto.IsReturnTypeTicket = this.data.IsReturnTypeTicket;
    this.reviewBuyService.UpdateReservationAmend(this.updateReservationRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.updateReservationResponseDto = this.responseData.Data;
            this.getUpdatedReservationAmend();
            //  Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //  Set shared cache data
          }
          else {
            this.failToSave = true;
            this.sucessfullysaved = false;
            this.selectedCoach = this.updateReservationRequestDto.OldCoach;
            let styleElem = document.head.appendChild(document.createElement("style"));
            styleElem.innerHTML = "#seat-header::before {background: #C0414D;}";
            this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, this.ga4ItemListEnum.saveSelectionFailedAction, this.responseData.Error);
          }
        }
      });
  }

  changeOtherSeat() {
    if (this.updatedCount == 3) {
      this.dialogRef.close();
    }
    else {
      if (this.sharedService.isFromAmendReservation) {
        this.onChangeOtherSeat = true;
        this.changeOtherSeatRequestAmend();
        this.sucessfullysaved = false;
        this.failToSave = false;
        this.isSaveDisabled = true;
        this.tempSelectedCoach = '';
      } else {
        this.onChangeOtherSeat = true;
        this.seatPickerRequest.ReviewBuyCache = this.sharedService.reviewBuyCache;
        this.getSeatPickerData();
        this.sucessfullysaved = false;
        this.failToSave = false;
        this.isSaveDisabled = true;
        this.tempSelectedCoach = '';
      }
    }
  }

  changeOtherSeatRequestAmend() {
    let changeOtherSeatRequestDto: SeatPickerRequestDto = this.getChangeOtherSeatRequestDto();

    this.myAccountService.fetchViewSeatPickerPostSale(changeOtherSeatRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.seatPickerResponse = this.responseData.Data;
            // for word spacing under view booking
            this.sharedService.seatPickerResponseAmend = this.seatPickerResponse;
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            this.bindSeatPickerResponse();
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  getChangeOtherSeatRequestProcess(changeOtherSeatRequestDto) {
    if (this.data?.isOutWardJourney) {
      changeOtherSeatRequestDto.Traveldate = (this.data.isAmendReviewBuyData === true) ? this.journey.OutwardDetail.DepartureTime : this.data?.journey?.DepartureTime;
    } else if (!this.data?.isOutWardJourney) {
      changeOtherSeatRequestDto.Traveldate = (this.data.isAmendReviewBuyData === true) ? this.journey.ReturnDetail.DepartureTime : this.data?.journey?.DepartureTime;
    }
  }

  getChangeOtherSeatRequestDto() {
    let changeOtherSeatRequestDto = new SeatPickerRequestDto();
    changeOtherSeatRequestDto.IsDateChange = this.data?.isDateChange ? true : false;
    changeOtherSeatRequestDto.IsReturnTypeTicket = this.data.IsReturnTypeTicket;
    changeOtherSeatRequestDto.Arrival = this.seatInfo?.Arrival;
    changeOtherSeatRequestDto.ArrivalLocation = this.seatInfo?.ArrivalLocation;
    changeOtherSeatRequestDto.Departure = this.seatInfo?.Departure;
    changeOtherSeatRequestDto.DepartureLocation = this.seatInfo?.DepartureLocation;
    changeOtherSeatRequestDto.IsOutward = this.data?.isOutWardJourney;
    this.getChangeOtherSeatRequestProcess(changeOtherSeatRequestDto);
    changeOtherSeatRequestDto.Traveldate = this.seatPickerResponse.Traveldate;
    changeOtherSeatRequestDto.JourneyCreationDate = this.sharedService?.seatPickerResponseAmend?.JourneyCreationDate;
    changeOtherSeatRequestDto.ReviewBuyCache = (this.sharedService?.reviewBuyCache) ? this.sharedService?.reviewBuyCache : null;
    changeOtherSeatRequestDto.EvaluateCache = this.sharedService.seatPickerResponseAmend.AmendEvaluateCache;
    return changeOtherSeatRequestDto;
  }


  onSeatButtonClicked(event, indexOfelement) {
    if (event.pointerType === '' && this.isTriggeredOnce > 0) {
      this.isSeatButtonClicked = true;
      let dom = Array.from(document.getElementById('coachParent').children);
      dom.forEach((element, index1) => {
        if (this.coachOverlayClassArray[index1] == '') {
          element.setAttribute("tabindex", (index1 + 1).toString());
        }
      });
      let coachOnFocus = dom.filter((_el, index2) => {
        if (this.coachOverlayClassArray[index2] == '') {
          return true;
        }
      });
      (coachOnFocus[0] as HTMLElement).focus();
    }

    this.selButton = indexOfelement;

    this.seatkey = event.target.innerText;

    if (Object.keys(this.oldNewSeatObject).length > 0) {
      if (Object.values(this.oldNewSeatObject).includes(this.seatkey)) {
        let key = Object.keys(this.oldNewSeatObject).find(k => this.oldNewSeatObject[k] === this.seatkey);
        this.seatkey = key;
      }
    }

    let selSeat = event.target.innerText.match(/\d+/g);
    let selCoach = event.target.innerText.match(/[a-zA-Z]+/g);

    if (selSeat[0].charAt(0) === '0') {
      selSeat[0] = selSeat[0].slice(1);
    }
    this.selectedSeat = selSeat[0];
    this.selectedCoach = selCoach[0];

    let dataSeatProperties = document.getElementById('parentDiv').querySelector('#' + this.selectedCoach).getElementsByTagName('svg')[0].getElementById(this.selectedSeat).getAttribute('data-seat-properties').split(' ');
    this.seatFacility = this.seatFaciltities.filter(Facility => {
      return dataSeatProperties.find(element => {
        return element === Facility.Icon;
      });
    });

    setTimeout(() => {
      seamless.elementScrollIntoView(document.getElementById('parentDiv').querySelector('#' + this.selectedCoach).getElementsByTagName('svg')[0].getElementById(this.selectedSeat), {
        block: "center"
      }); 
    },100);
    if (this.svgClickCount == 0) {
      this.svgClickCount++;
      document.getElementById('parentDiv').addEventListener('click', this.onClick.bind(this));
    }
    this.isTriggeredOnce++;
  }

  exitWithoutSaving() {
    this.isChangedSeatClicked = false;
    this.isSaveDisabled = true;
    this.selectedSeat = this.seatPickerResponse.DefaultSeat;
    this.selectedCoach = this.seatPickerResponse.DefaultCoach;
    this.seatPickerResponse.Seat = new Array<SeatData>();
    this.seatPickerResponse.Seat = this.tempSeatData;
    this.tempSeatData = JSON.parse(JSON.stringify(this.seatPickerResponse.Seat));
    this.selectedSeats = this.getAllSelectedSeats();
    this.svgContainer.nativeElement.querySelector('svg')
      .removeEventListener('click', this.onClick.bind(this));
    this.dialogRef.close();


  }


  onSectionChange(sectionId: string) {
    this.currentSection = sectionId;

    const dom = document.getElementById('coachParent').querySelector('#' + this.currentSection);
    if (dom) {
      seamless.elementScrollIntoView(dom, {
        block: "center"
      });

    }
  }

  scrollTo(section: string) {
    const dom = document.getElementById('parentDiv').querySelector('#' + section)
    if (dom) {
      seamless.elementScrollIntoView(dom, {
        block: "center"
      });
    }
  }

  scrollToOnKeypress(section: string) {
    this.setUnavailableSeatDisabled();
    setTimeout(() => {

      const coaches = this.seatPickerResponse.SvgCoaches.filter(svgCoach => svgCoach.CoachIndex === section);
      let onSeatFocus = [...coaches[0].AvailableSeats].sort()[0];
      if (onSeatFocus.charAt(0) === '0') {
        onSeatFocus = onSeatFocus.slice(1);
      }
      (document.getElementById('parentDiv').querySelector('#' + section).getElementsByTagName('svg')[0].getElementById(onSeatFocus).children[0] as HTMLElement).focus();

    })
  }

  toggleJourneyDetailFlag() {
    this.journeyDetailFlag = !this.journeyDetailFlag;
    let journeyDetailsAction = this.journeyDetailFlag ? this.ga4ItemListEnum.journeyDetailsSeeMoreAction : this.ga4ItemListEnum.journeyDetailsSeeLessAction;
    this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, journeyDetailsAction);
  }

  closeSeatPicker() {
    this.closeSeatPickerDiv = true;
    this.closeSeatPikr = !this.closeSeatPikr;
    this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, this.ga4ItemListEnum.closeAction);
  }

  closeSeatPickerBtn() {
    this.closeSeatPickerDiv = false;
    this.closeSeatPikr = !this.closeSeatPikr;
    this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, this.ga4ItemListEnum.cancelAction);
  }

  exitSeatPicker() {
    this.dialogRef.close();

  }
  //1484 for showing updateReservationResponse Message
  showMsgonSaveSeatSelection(updateReservationResponseMsg) {
    if (updateReservationResponseMsg) {
      if (updateReservationResponseMsg.toLowerCase().indexOf('successfully') > -1) {
        return true;
      }
      else {
        return false;
      }
    }
  }

  scrollToEndOfSeatFacilities(isFacilityExpanded) {
    setTimeout(() => {
      document.getElementById("idJourneyDetailDiv").scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      });
    }, 100);
    isFacilityExpanded = isFacilityExpanded ? this.ga4ItemListEnum.seatPickerFeatureSeeMoreAction : this.ga4ItemListEnum.seatPickerFeatureSeeLessAction;
    this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.openedFeature, this.data.bookingReferenceNumber, isFacilityExpanded);
  }

  setSharedServiceReviewByCacheForNormalAndPostSale(){
    if (this.isPostSale) {
      this.sharedService.postSaleReviewBuyCache = this.updateReservationResponseDto.ReviewBuyCache;
    } else {
      this.sharedService.reviewBuyCache = this.updateReservationResponseDto.ReviewBuyCache;
    }
  }

  setSplitCoachInventoryClassAndSeatsArrayObject(seatPickerResponseSvgcoach, index){
    let availableSeatsArray = seatPickerResponseSvgcoach?.TotalQuantity !== seatPickerResponseSvgcoach?.AvailableQuantity ? this.setAvailableSeatsArrayIfSplitCoachSeatsAreDisabled(index) : seatPickerResponseSvgcoach?.AvailableSeats;
    availableSeatsArray.forEach((e,j) => {
      this.arrayObject.push({
        seat: e,
        coach: this.seatPickerResponse?.Coaches[index]?.Coach,
        inventoryClass: document?.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.getElementsByTagName('svg')[0]?.getElementById(e)?.getAttribute('data-inventory-class'),
        height: document?.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.getElementsByTagName('svg')[0]?.getElementsByTagName('use')[`PL-1-${e}`]?.getAttribute('y')
      });
    });
  }

  getUniqueDataInventoryClassArray(){
    return this.arrayObject?.filter((value, index, self) =>
      index === self.findIndex((t) => (
          t?.inventoryClass === value?.inventoryClass && !t?.inventoryClass?.includes('9B')
      ))
    );
  }

  setCoachTypeOnLeftNavigationOfSeatPicker(index){
    const uniquerySeatDataInventoryArray = this.getUniqueDataInventoryClassArray();
    this.dataInventoryClassObject?.forEach(element => {
      if(element?.ticketClass?.toLowerCase() !== this.seatPickerResponse?.Seat[0]?.CoachType?.toLowerCase() && uniquerySeatDataInventoryArray?.length > 1){
        if(this.arrayObject?.map(e=> e?.inventoryClass)?.indexOf(element?.dataInventoryClass) == 0 && this.multipleSeatTypeInSameCoachObject?.length == 0){
          this.multipleSeatTypeInSameCoachObject = [];
          this.multipleSeatTypeInSameCoachObject.push(element);
          let data = this.dataInventoryClassObject?.filter(el => el?.ticketClass?.toLowerCase() !== element?.ticketClass?.toLowerCase()  && el?.ticketClass?.toLowerCase() !== this.seatPickerResponse?.Seat[0]?.CoachType?.toLowerCase());
          this.multipleSeatTypeInSameCoachObject.unshift(data);
        } else if (this.arrayObject?.map(e=> e.inventoryClass)?.indexOf(element?.dataInventoryClass) > 0 && this.multipleSeatTypeInSameCoachObject?.length == 0) {
          this.multipleSeatTypeInSameCoachObject = [];
          this.multipleSeatTypeInSameCoachObject.push(element);
          let data = this.dataInventoryClassObject?.filter(el => el?.ticketClass?.toLowerCase() !== element?.ticketClass?.toLowerCase()  && el?.ticketClass?.toLowerCase() !== this.seatPickerResponse?.Seat[0]?.CoachType?.toLowerCase());
          this.multipleSeatTypeInSameCoachObject.push(data[0]);
        }
      }
    });
    this.setSplitCoach(uniquerySeatDataInventoryArray, index);
  }

  setSplitCoach(uniquerySeatDataInventoryArray, index){
    if(this.multipleSeatTypeInSameCoachObject?.length > 1 && uniquerySeatDataInventoryArray?.length > 1){
      this.seatPickerResponse.Coaches[index]['splitCoach'] = true;
    } else {
      this.seatPickerResponse.Coaches[index]['splitCoach'] = false;
    }
  }

  checkForMultipleInventoryClassesInSplitCoach(){
    let otherDataInventoryClass='';
    let selectedSeatTypeObject = this.dataInventoryClassObject?.filter(e => e.ticketClass?.toLowerCase() == this.seatPickerResponse?.Seat[0]?.CoachType?.toLowerCase());
    this.dataInventoryClassObject?.forEach(element => {
      if(element?.ticketClass?.toLowerCase() !== this.seatPickerResponse?.Seat[0]?.CoachType?.toLowerCase()){
        let matched = this.arraysHaveMatchingObjects(selectedSeatTypeObject,this.arrayObject);
        let index = this.arrayObject?.map(e=> e.inventoryClass)?.indexOf(element?.dataInventoryClass);
        if(index !== -1 && matched){
          this.multipleSeatTypeInSameCoachObject = [];
          this.setCoachTypeAccordingTotravelDirection(index,element, selectedSeatTypeObject);
          otherDataInventoryClass = element?.dataInventoryClass;
          return;
        }
      }
    });
    return otherDataInventoryClass;
  }

  arraysHaveMatchingObjects(arr1, arr2) {
    return arr2?.some(item1 => arr1?.some(item2 => item1.inventoryClass === item2.dataInventoryClass));
  }

  setCoachTypeAccordingTotravelDirection(index,element, selectedSeatTypeObject){
    if(this.seatPickerResponse?.Coaches[0]?.Coach?.toUpperCase() !== 'A'){
      if(index == 0){
        this.multipleSeatTypeInSameCoachObject.push(element);
        this.multipleSeatTypeInSameCoachObject.push(selectedSeatTypeObject[0]);
      } else{
        this.multipleSeatTypeInSameCoachObject.push(element);
        this.multipleSeatTypeInSameCoachObject.unshift(selectedSeatTypeObject[0]);
      }
    } else {
      if(index == 0){
        this.multipleSeatTypeInSameCoachObject.push(element);
        this.multipleSeatTypeInSameCoachObject.unshift(selectedSeatTypeObject[0]);
      } else{
        this.multipleSeatTypeInSameCoachObject.push(element);
        this.multipleSeatTypeInSameCoachObject.push(selectedSeatTypeObject[0]);
      }
    }
  }

  setOverlayClassInCaseOfHitachi(matchedDataInventoryClass, index){
    let firstMatchedIndex = this.arrayObject?.map(e=> e.inventoryClass)?.indexOf(matchedDataInventoryClass);
    let firstHeight = this.arrayObject[firstMatchedIndex].height;
    let lstIndex = this.arrayObject?.map(e=> e.inventoryClass)?.lastIndexOf(matchedDataInventoryClass);
    this.lastHeight = this.arrayObject[lstIndex].height;
    let final = Math.abs(firstHeight-this.lastHeight) + 41;
    let txtElem = document?.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.querySelector('#overlayNewhgt') as HTMLElement;
    let txtElem2 = document?.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.querySelector('#seatContainerDiv') as HTMLElement;
    txtElem.getElementsByTagName('span')[0].innerText = 'This area is not available for your ticket type';
    txtElem.removeAttribute('style');
    txtElem.setAttribute('class', 'hitachi-overlay-msg');
    txtElem.setAttribute('style', `top:${this.lastHeight}px; height:${final}px; content: "";position: absolute;left: 0;width: 100%;background-color: rgba(39, 39, 39, 0.7607843137254902);`);
    txtElem2.setAttribute('style', `position: relative`);
  }

  setCoachOverlayInCaseOfSplitCoach(matchedDataInventoryClass, index){
    this.seatPickerResponse.Coaches[index]['splitCoach'] = true;
    const svgHeight = this.getSvgHeight(index);
    const firstMatchedIndex = this.getFirstMatchedIndex(matchedDataInventoryClass);
    this.setOverLayOnSplitCoachAccordingToTravelDirection(matchedDataInventoryClass, firstMatchedIndex, svgHeight);
    let txtElem = document.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.querySelector('#overlayNewhgt') as HTMLElement;
    let txtElem2 = document.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.querySelector('#seatContainerDiv') as HTMLElement;
    txtElem.getElementsByTagName('span')[0].innerText = this.seatPickerMsgsEnum?.splitCoachOverlayCoachMessage;
    txtElem.removeAttribute('style');
    txtElem.setAttribute('class', 'hitachi-overlay-msg');
    txtElem.setAttribute('style', `${this.initialOverLayHeight}; height:${this.hitachiFinalOverHeight}px; content: "";position: absolute;left: 0;width: 100%;background-color: rgba(39, 39, 39, 0.7607843137254902);`);
    txtElem2.setAttribute('style', `position: relative`);
    if (this.isStandardCoachType() && this.hasInventoryClass('2V')) {
      txtElem.setAttribute('style', `${this.initialOverLayHeight}; height:${this.hitachiFinalOverHeight - 2}px; content: "";position: absolute;left: 0;width: 100%;background-color: rgba(39, 39, 39, 0.7607843137254902);`);
      this.setOverLayOn2VDataInventoryClassInCaseOfSplitCoach(index);
    }
  }

  setOverLayOn2VDataInventoryClassInCaseOfSplitCoach(index){
    const svgHeight = this.getSvgHeight(index);
    const firstMatchedIndex = this.getFirstMatchedIndex('2V');
    this.setOverLayOnSplitCoachAccordingToTravelDirection('2V', firstMatchedIndex, svgHeight);
    let txtElem = document.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.querySelector('#overlayNewhgt2') as HTMLElement;
    txtElem.getElementsByTagName('span')[0].innerText = this.seatPickerMsgsEnum?.unreservedAreaSeatsMessageForSplitCoach;
    txtElem.setAttribute('class', 'hitachi-overlay-msg');
    txtElem.setAttribute('style', `${this.initialOverLayHeight}; height:${this.hitachiFinalOverHeight - 3}px; content: "";position: absolute;left: 0;width: 100%;background-color: rgba(39, 39, 39, 0.7607843137254902);`);
  }

  setOverLayOnSplitCoachAccordingToTravelDirection(matchedDataInventoryClass, firstMatchedIndex, svgHeight){
    let lastSeatheight;
    if(this.seatPickerResponse?.Coaches[0]?.Coach?.toUpperCase() !== 'A'){
      if(firstMatchedIndex == 0){
        let lastIndex = this.arrayObject?.map(e=> e.inventoryClass)?.lastIndexOf(matchedDataInventoryClass);
        lastSeatheight = this.arrayObject[lastIndex].height;
        this.firstMatchedHitachiSeatHeight = lastSeatheight;
        this.initialOverLayHeight = 'top:0px'; 
        this.hitachiFinalOverHeight = Math.abs(this.firstMatchedHitachiSeatHeight)+56;
      } else {
        this.firstMatchedHitachiSeatHeight = this.arrayObject[firstMatchedIndex].height;
        this.initialOverLayHeight = 'bottom:10px';
        this.hitachiFinalOverHeight = Math.abs(svgHeight - this.firstMatchedHitachiSeatHeight) + 15;
      }
    } else {
      if(firstMatchedIndex == 0){
        let lastIndex = this.arrayObject?.map(e=> e.inventoryClass)?.lastIndexOf(matchedDataInventoryClass);
        lastSeatheight = this.arrayObject[lastIndex].height;
        this.firstMatchedHitachiSeatHeight = lastSeatheight;
        this.initialOverLayHeight = 'bottom:10px';
        this.hitachiFinalOverHeight = Math.abs(svgHeight - this.firstMatchedHitachiSeatHeight) + 15;
      } else {
        this.firstMatchedHitachiSeatHeight = this.arrayObject[firstMatchedIndex].height;
        this.initialOverLayHeight = 'top:0px'; 
        this.hitachiFinalOverHeight = Math.abs(this.firstMatchedHitachiSeatHeight)+56;
      }
    }
  }
  
  setAvailableSeatsArrayIfSplitCoachSeatsAreDisabled(index){
    let newAvailableSeatsArray = [];
    let svgSeatsLength = document?.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.getElementsByTagName('svg')[0]?.getElementsByTagName('g')?.length;
    for(let i = 0; i < svgSeatsLength; i++){
      let dataInventoryClassTag = document?.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.getElementsByTagName('svg')[0]?.getElementsByTagName('g')[i]?.getAttribute('data-inventory-class');
      if(dataInventoryClassTag == '2P' || dataInventoryClassTag == '2V' || dataInventoryClassTag == '1C' || dataInventoryClassTag == '2C'){
        newAvailableSeatsArray.push(document?.getElementById('parentDiv')?.querySelector('#' + this.seatPickerResponse?.Coaches[index]?.Coach)?.getElementsByTagName('svg')[0]?.getElementsByTagName('g')[i]?.getAttribute('id'));
      };
    }
    return newAvailableSeatsArray;
  }

  isStandardCoachType(): boolean {
    return this.seatPickerResponse?.Seat[0]?.CoachType?.toLowerCase() === 'standard';
  }
  
  hasInventoryClass(inventoryClass: string): boolean {
    return this.arrayObject?.map(e => e.inventoryClass)?.indexOf(inventoryClass) !== -1;
  }

  getSvgHeight(index: number): any {
    return document.getElementById('parentDiv')
      ?.querySelector(`#${this.seatPickerResponse?.Coaches[index]?.Coach}`)
      ?.getElementsByTagName('svg')[0]
      ?.getAttribute('height');
  }

  getFirstMatchedIndex(dataInventoryClass: string): number {
    return this.arrayObject?.map(e => e.inventoryClass)?.indexOf(dataInventoryClass);
  }

  handleNoMatchedDataInventoryClass(seatPickerResponseSvgcoach: any, index: number): void {
    this.seatPickerResponse.Coaches[index]['splitCoach'] = false;
  
    if (this.seatPickerNotAvailable) {
      this.coachOverlayClassArray[index] = "carriage-overlay";
    } else if (!this.coachOverlayClassArray[index] && seatPickerResponseSvgcoach?.SvgLayout === '') {
      this.coachOverlayClassArray[index] = "coach-unavailable-overlay";
    } else if (!this.coachOverlayClassArray[index] && (this.seatPickerResponse?.Coaches?.filter(coach => coach?.Coach === seatPickerResponseSvgcoach?.CoachIndex)[0]?.CoachType != this.seatPickerResponse?.Seat[0]?.CoachType)) {
      this.coachOverlayClassArray[index] = "coach-overlay";
    } else if (!this.coachOverlayClassArray[index] && seatPickerResponseSvgcoach?.AvailableSeats?.length === 0) {
      this.coachOverlayClassArray[index] = "coach-unreservable-overlay";
    } else if (this.dataInventoryClassArr[index]) {
      this.coachOverlayClassArray[index] = "coach-unreservable-overlay-advance-travel";
    } else {
      this.coachOverlayClassArray[index] = '';
    }
    this.setCoachTypeOnLeftNavigationOfSeatPicker(index);
  }
}
