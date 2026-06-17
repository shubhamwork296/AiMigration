import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import {Observable} from 'rxjs';
import {startWith, map} from 'rxjs/operators';
import { CommonServices } from 'src/app/services/common.service';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { environment } from 'src/environments/environment';

export interface Railcard {
  value: string;
  viewValue: string;
}

export interface State {
  flag: string;
  name: string;
  population: string;
}

@Component({
  selector: 'home-component',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  constructor(private readonly formbulider: FormBuilder, private readonly commonServices:CommonServices ) {
   
    }
    responseData: ResponseData;
    locationData= Array<LocationMasterData>();
    response: ResponseData

  searchModel: any = this.formbulider.group({
    Departure:['',[Validators.required]],
    Arrival:['',[Validators.required]],
    RailcardID:['',[Validators.required]]
    });

  control = new FormControl();

  filteredLocations: Observable<LocationMasterData[]>;

  locations: LocationMasterData[];



  departures: string[] = ['Champs-Élysées', 'Lombard Street', 'Abbey Road', 'Fifth Avenue'];
  filteredDepartures: Observable<string[]>;

  arrivals: string[] = ['Lombard Street', 'Abbey Road', 'Fifth Avenue'];
  filteredArrivals: Observable<string[]>;

  stations: string[] = ['Lombard Street', 'Abbey Road', 'Fifth Avenue'];
  filteredStations: Observable<string[]>;

  routeOption = 'Via';

  minStartDate = new Date(2019, 11, 5);
  maxStartDate = new Date(2020, 12, 5);

  minEndDate = new Date(2019, 11, 5);
  maxEndDate = new Date(2019, 12, 5);

  travlerOption ='Adult'

  RailcardList: Railcard[] = [
    {value: '0', viewValue: 'Two Together Railcard'},
    {value: '1', viewValue: 'Network Railcard'},
    {value: '2', viewValue: 'Annual Gold Card'}
  ];

  ngOnInit() {
    window.location.href= environment.qttUrl;    
    }

    private _filterLocations(value: string): LocationMasterData[] {
      const filterValue = value.toLowerCase();
      return this.locations.filter(location => location.Name.toLowerCase().indexOf(filterValue) === 0);
    }

    private _filterDepartures(value: string): string[] {
      const filterValue = this._normalizeValue(value);
      return this.departures.filter(departure => this._normalizeValue(departure).includes(filterValue));
    }

    private _filterArrivals(value: string): string[] {
      const filterArrivalValue = this._normalizeValue(value);
      return this.arrivals.filter(arrival => this._normalizeValue(arrival).includes(filterArrivalValue));
    }

    private _filterStations(value: string): string[] {
      const filterStationValue = this._normalizeValue(value);
      return this.stations.filter(station => this._normalizeValue(station).includes(filterStationValue));
    }

    private _normalizeValue(value: string): string {
      return value.toLowerCase().replace(/\s/g, '');
    }

    onClickSubmit(formData) {
     alert(formData.Departure)
   }

   getLocations(){
    this.commonServices.getLocations().subscribe(
      res => {
            if (res != null) {
              this.responseData = res as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                this.locations = this.responseData.Data;
                this.filteredLocations = this.control.valueChanges
                .pipe(
                  startWith(''),
                  map(location => location ? this._filterLocations(location) : this.locations.slice())
                );
              }
              else {
                console.log(this.responseData.ResponseMessage);
              }
            }
     });
  }
}
