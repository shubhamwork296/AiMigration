import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { RouteDetailsRequest } from 'src/app/models/mixing-deck/route-details-request.model';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { RouteDetailsResponse, TravelChange } from 'src/app/models/mixing-deck/route-details-response.model';

@Component({
  selector: 'app-disruption-service',
  templateUrl: './disruption-service.component.html',
  styleUrls: ['./disruption-service.component.css']
})

export class DisruptionServiceComponent implements OnInit {

  changes: string;
  duration: string;
  displayedColumns: string[];
  dataSource: MatTableDataSource<any>;
  routeDetailsRequest: RouteDetailsRequest;
  routeDetailsResponse: RouteDetailsResponse;
  responseData: ResponseData;
  traveLChanges: TravelChange[];
  dataSourceLength: number;
  darwinText: [];
  showdetailFlag = false;
  isViewBooking: boolean = false;

  columns: ColumnsToDisplay[] = [

    {
      key: "DepartureTime",
      label: 'Departure'
    },
    {
      key: "DarwinDepartureTime",
      label: 'DarwinDeparture'
    },
    {
      key: "Location",
      label: 'Name'
    }
  ]

  constructor(private readonly searchSolutionService: SearchSolutionService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.routeDetailsRequest = new RouteDetailsRequest;
  }
  ngOnInit() {
    this.routeDetailsRequest.TravelSolutionCache = this.data.TravelSolutionCache;
    this.routeDetailsRequest.TravelSolutionId = this.data.TravelSolutionId;
    this.routeDetailsRequest.SaleCompanyId = this.data.SaleCompanyId;
    this.routeDetailsRequest.SearchCustomCache = this.data.SearchCustomCache;
    if (this.data.IsOutward)
      this.routeDetailsRequest.IsOutward = this.data.IsOutward;
    this.changes = this.data.Changes;
    this.duration = this.data.Duration;
    this.isViewBooking = this.data.IsViewBooking ? this.data.IsViewBooking : false;
    this.getRouteDetailsData();

  }

  getRouteDetailsData() {
    this.searchSolutionService.getRouteDetails(this.routeDetailsRequest, this.isViewBooking).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.routeDetailsResponse = this.responseData.Data as RouteDetailsResponse;
            this.dataSource = new MatTableDataSource(this.routeDetailsResponse.TravelChanges);
            this.traveLChanges = this.routeDetailsResponse.TravelChanges;
            this.darwinText = this.routeDetailsResponse.DarwinText;
            this.showdetailFlag = true;
            this.routeDetailsResponse.TravelChanges[0].CallingPoints.forEach(calligPoint => {
              if (calligPoint.IsDelay) {
                this.data.IsDisruption = true;
              }
            })
            if (this.data.IsDisruption) {
              this.displayedColumns = ['DepartureTime', 'DarwinDepartureTime', 'Location']
            } else {
              this.displayedColumns = ['DepartureTime', 'Location']
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  getRouteWiseDataSource(route) {
    let callingPoints = this.traveLChanges.filter(m => m == route)[0].CallingPoints;
    callingPoints.forEach((m, i) => {
      m.IsRouteLocation = true
      if (callingPoints.length == (i + 1)) {
        m.DepartureTime = m.ArrivalTime;
      }
    });
    this.dataSourceLength = callingPoints.length;
    return new MatTableDataSource(callingPoints);
  }

  onChangeCallingPoints(checked, route) {
    if (checked) {
      route.CallingPoints.forEach(m => m.IsRouteLocation = true);
    }
    else {
      route.CallingPoints.forEach(m => m.IsRouteLocation = false);
      route.CallingPoints[0].IsRouteLocation = true;
      route.CallingPoints[route.CallingPoints.length - 1].IsRouteLocation = true;
    }
  }

}

export class ColumnsToDisplay {
  key: string;
  label: string;
}
