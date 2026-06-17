import {
  ChangeDetectionStrategy,
  signal,
  Component,
  Inject,
  OnInit,
  ViewEncapsulation,
  HostListener,
  Injector,
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { map, Observable, of, startWith } from "rxjs";
import { LocationMasterData } from "src/app/models/master/location-master.model";
import { ResponseData } from "src/app/models/common/response.model";
import { MyPreferencesResponse } from "src/app/models/account/my-preferences.model";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { CommonServices } from "src/app/services/common.service";

@Component({
  selector: "enhanced-search-journey-station-dialogs",
  templateUrl: "./enhanced-search-journey-station-dialogs.component.html",
  styleUrls: ["./enhanced-search-journey-station-dialogs.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EnhancedSearchJourneyStationDialogs implements OnInit {
  isMobile = false;
  headerTitle: string;
  readonly panelOpenState = signal(false);
  @HostListener("window:resize")
  value = "London";
  amendSearchRequest: EnhancedSearchRequestModel;
  isDeparture: boolean;
  isViaAvoid: boolean;
  isVia: boolean = true;
  filteredDeparturesPopular: Observable<LocationMasterData[]>;
  filteredDeparturesMore: Observable<LocationMasterData[]>;
  filteredDeparturesFavourite: Observable<LocationMasterData[]>;
  filteredArrivalsPopular: Observable<LocationMasterData[]>;
  filteredArrivalsMore: Observable<LocationMasterData[]>;
  filteredArrivalsFavourite: Observable<LocationMasterData[]>;
  filteredViaAvoidPopular: Observable<LocationMasterData[]>;
  filteredViaAvoidMore: Observable<LocationMasterData[]>;
  filteredViaAvoidFavourite: Observable<LocationMasterData[]>;
  locations: LocationMasterData[];
  filteredOutLocation: LocationMasterData[];
  popularLocations: LocationMasterData[];
  favouriteLocations: LocationMasterData[];
  responseData: ResponseData;
  locationForm: FormGroup;
  departureLocationName = new FormControl();
  arrivalLocationName = new FormControl();
  viaAvoidStationName = new FormControl();
  myPreferencesResponse: MyPreferencesResponse;
  showPopular: boolean = false;
  showFavourite: boolean = false;
  showMoreStation: boolean = false;
  DepartureLocation: number;
  ArrivalLocation: number;
  DepartureLocationName: string;
  ArrivalLocationName: string;
  PathConstraintLocation: number;
  commonService: CommonServices;
  formbuilder: FormBuilder;
  pathConstraintType: string;
  selectedButton: string = 'VIA';
  isArrving: boolean;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EnhancedSearchJourneyStationDialogs>,
    private readonly injector: Injector
  ) {
    this.commonService = this.injector.get(CommonServices);
    this.formbuilder = this.injector.get(FormBuilder);
  }

  ngOnInit(): void {
    this.pathConstraintType = this.data.isVia ? 'VIA' : 'AVOID';
    this.selectedButton = this.pathConstraintType;
    this.DepartureLocation = this.data.DepartureLocation;
    this.DepartureLocationName = this.data.DepartureLocationName;
    this.ArrivalLocation = this.data.ArrivalLocation;
    this.ArrivalLocationName = this.data.ArrivalLocationName;
    this.PathConstraintLocation = this.data.PathConstraintLocation;
    this.locations = this.data.locations;
    this.isDeparture = this.data.isDeparture;
    this.isArrving = this.data.isArrving;
    this.isViaAvoid = this.data.isViaAvoid;
    this.isVia = this.data.isVia;
    this.popularLocations = this.data.popularStations;
    this.popularLocations = [...this.popularLocations].sort((a, b) =>
      a.Name.localeCompare(b.Name)
    );
    this.filteredDeparturesPopular = of(this.popularLocations);
    this.filteredArrivalsPopular = of(this.popularLocations);
    this.filteredViaAvoidPopular = of(this.popularLocations);
    if (this.popularLocations.length != 0) {
      this.showPopular = true;
    } else {
      this.showPopular = false;
    }
    if (
      localStorage.getItem("CustomerKey") != null &&
      localStorage.getItem("Email") != null
    ) {
      this.setPrefrencesStationData();
    }
    this.filterOutFavouriteAndPopularFromMasterLocation();
    this.createForm();
    this.checkMobile();
  }

  setPrefrencesStationData() {
    this.myPreferencesResponse = JSON.parse(
      localStorage.getItem("myPreferencesResponse")
    );
    if (this.myPreferencesResponse != null) {
      this.favouriteLocations = this.locations.filter((item) => {
        if (this.myPreferencesResponse.FavouriteStationsList != null) {
          if (
            this.myPreferencesResponse.FavouriteStationsList.indexOf(
              item.Name
            ) !== -1
          ) {
            return true;
          }
        }
      });
      if (this.favouriteLocations.length != 0) {
        this.showFavourite = true;
      } else {
        this.showFavourite = false;
      }
    }
  }

  // filter out the common location out of pupular and master location
  filterOutFavouriteAndPopularFromMasterLocation() {
    this.filteredOutLocation = this.locations;
    if (this.favouriteLocations && this.favouriteLocations.length > 0) {
      // ReArrange the favourite locations in alphabetical order
      this.favouriteLocations = [...this.favouriteLocations].sort((a, b) =>
        a.Name.localeCompare(b.Name)
      );
      this.filteredDeparturesFavourite = of(this.favouriteLocations);
      this.filteredArrivalsFavourite = of(this.favouriteLocations);
      this.filteredViaAvoidFavourite = of(this.favouriteLocations);

      // FilterOut Favourite locations of popular locations
      if (this.popularLocations.length > 0) {
        this.popularLocations = this.commonService.commonFilterFunction(
          this.popularLocations,
          this.favouriteLocations
        );
        this.filteredDeparturesPopular = of(this.popularLocations);
        this.filteredArrivalsPopular = of(this.popularLocations);
        this.filteredViaAvoidPopular = of(this.popularLocations);
      }

      // filterOut favourite location from Masterlocation
      this.filteredOutLocation = this.commonService.commonFilterFunction(
        this.filteredOutLocation,
        this.favouriteLocations
      );
    }
    // filterOut popular from Masterlocation
    if (this.popularLocations.length > 0) {
      this.filteredOutLocation = this.commonService.commonFilterFunction(
        this.filteredOutLocation,
        this.popularLocations
      );
    }
  }

  createForm() {
    this.locationForm = this.formbuilder.group({
      departureLocationName: new FormControl(),
      arrivalLocationName: new FormControl(),
      viaAvoidStationName: new FormControl(),
    });
  }

  setMoreStationBool() {
    this.showMoreStation = false;
    return [];
  }

  onLocationChanges(event) {
    if (event.keyCode == 9) {
      return;
    }
    if (event.keyCode == 13) {
      event.preventDefault();
    } else {
      if (this.isDeparture && !this.isViaAvoid) {
        this.isDepartureNotViaAvoid();
      } else if (this.isArrving) {
        this.notDepartureNotViaAvoid();
      } else if (!this.isDeparture && this.isViaAvoid) {
        this.notDepartureIsViaAvoid();
      }
    }
  }

  isDepartureNotViaAvoid() {
    this.filteredDeparturesMore = this.locationForm
      .get("departureLocationName")
      .valueChanges.pipe(
        startWith(""),
        map((location) =>
          location.length > 2
            ? this._filterLocationsMore(location)
            : this.setMoreStationBool()
        )
      );
    this.filteredDeparturesPopular = this.locationForm
      .get("departureLocationName")
      .valueChanges.pipe(
        startWith(""),
        map((location) => this._filterLocationsPopular(location))
      );
    if (this.showFavourite) {
      this.filteredDeparturesFavourite = this.locationForm
        .get("departureLocationName")
        .valueChanges.pipe(
          startWith(""),
          map((location) => this._filterLocationsFavourite(location))
        );
    }
  }

  notDepartureNotViaAvoid() {
    this.filteredArrivalsMore = this.locationForm
      .get("arrivalLocationName")
      .valueChanges.pipe(
        startWith(""),
        map((location) =>
          location.length > 2
            ? this._filterLocationsMore(location)
            : this.setMoreStationBool()
        )
      );
    this.filteredArrivalsPopular = this.locationForm
      .get("arrivalLocationName")
      .valueChanges.pipe(
        startWith(""),
        map((location) => this._filterLocationsPopular(location))
      );
    if (this.showFavourite) {
      this.filteredArrivalsFavourite = this.locationForm
        .get("arrivalLocationName")
        .valueChanges.pipe(
          startWith(""),
          map((location) => this._filterLocationsFavourite(location))
        );
    }
  }

  notDepartureIsViaAvoid() {
    this.filteredViaAvoidMore = this.locationForm
      .get("viaAvoidStationName")
      .valueChanges.pipe(
        startWith(""),
        map((location) =>
          location.length > 2
            ? this._filterLocationsMore(location)
            : this.setMoreStationBool()
        )
      );
    this.filteredViaAvoidPopular = this.locationForm
      .get("viaAvoidStationName")
      .valueChanges.pipe(
        startWith(""),
        map((location) => this._filterLocationsPopular(location))
      );
    if (this.showFavourite) {
      this.filteredViaAvoidFavourite = this.locationForm
        .get("viaAvoidStationName")
        .valueChanges.pipe(
          startWith(""),
          map((location) => this._filterLocationsFavourite(location))
        );
    }
  }

  onStationSelected(station, _code) {
    if (this.isDeparture && !this.isViaAvoid) {
      this.DepartureLocationName = station;
      this.DepartureLocation = this.findLocationCode(station);
    } else if (!this.isDeparture && this.isViaAvoid) {
      this.PathConstraintLocation = this.findLocationCode(station);
    } else {
      this.ArrivalLocationName = station;
      this.ArrivalLocation = this.findLocationCode(station);
    }
    this.dialogRef.close({
      DepartureLocationName: this.DepartureLocationName,
      DepartureLocation: this.DepartureLocation,
      PathConstraintLocation: this.PathConstraintLocation,
      ArrivalLocationName: this.ArrivalLocationName,
      ArrivalLocation: this.ArrivalLocation,
      PathConstraintType: this.pathConstraintType
    });
  }

  findLocationCode(value) {
    if (value !== null && value !== "" && value !== undefined && value !== 0) {
      let station = this.locations.filter((m) => m.Name == value);
      return station[0].Id;
    } else {
      return 0;
    }
  }

  private _filterLocationsMore(value: string): LocationMasterData[] {
    const filterValue = value.toLowerCase();
    // load more filtered station
    let suggestedLocations = this.commonService.getFilteredStation(
      this.filteredOutLocation,
      filterValue
    );
    suggestedLocations = this.commonService.getMoreFilteredStations(
      suggestedLocations,
      filterValue
    );

    if (suggestedLocations.length != 0) {
      this.showMoreStation = true;
      return suggestedLocations;
    } else {
      this.showMoreStation = false;
      return [];
    }
  }

  private _filterLocationsPopular(value: string): LocationMasterData[] {
    const filterValue = value.toLowerCase();
    // load pupular filtered station
    let suggestedLocations = this.commonService.getFilteredStation(
      this.popularLocations,
      filterValue
    );
    suggestedLocations = this.commonService.getMoreFilteredStations(
      suggestedLocations,
      filterValue
    );

    if (suggestedLocations.length != 0) {
      this.showPopular = true;
      return suggestedLocations;
    } else {
      this.showPopular = false;
      return [];
    }
  }

  private _filterLocationsFavourite(value: string): LocationMasterData[] {
    const filterValue = value.toLowerCase();
    // load favourite filtered station
    let suggestedLocations = this.commonService.getFilteredStation(
      this.favouriteLocations,
      filterValue
    );
    suggestedLocations = this.commonService.getMoreFilteredStations(
      suggestedLocations,
      filterValue
    );

    if (suggestedLocations.length != 0) {
      this.showFavourite = true;
      return suggestedLocations;
    } else {
      this.showFavourite = false;
      return [];
    }
  }

  _allowSelection(option: string): { [className: string]: boolean } {
    return {
      "no-data": option === "No results found",
    };
  }

  onSelectViaAvoid(type: string){
    this.selectedButton = type;
    this.pathConstraintType = type;
    this.amendSearchRequest.PathConstraintType = type ? type : '';
  }

  onClose() {
    this.dialogRef.close(this.amendSearchRequest);
  }

  onResize() {
    this.checkMobile();
  }

  clearDepartureField(formControlName) {
    this.locationForm?.get(formControlName)?.setValue('');
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
}
