import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { RouteDetailsRequest } from 'src/app/models/mixing-deck/route-details-request.model';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { RouteDetailsResponse, TravelChange } from 'src/app/models/mixing-deck/route-details-response.model';

@Component({
  selector: 'app-route-details',
  templateUrl: './route-details.component.html',
  styleUrls: ['./route-details.component.css']
})

export class RouteDetailsComponent implements OnInit {

  changes: string;
  duration:string;
  displayedColumns: string[] = ['ArrivalTime', 'DepartureTime', 'Location'];
  dataSource: MatTableDataSource<any>;
  routeDetailsRequest: RouteDetailsRequest;
  routeDetailsResponse: RouteDetailsResponse;
  responseData: ResponseData;
  traveLChanges: TravelChange[];

  columns: ColumnsToDisplay[] = [
    {
      key: "ArrivalTime",
      label: 'Arrival'
    },
    {
      key: "DepartureTime",
      label: 'Departure'
    },
    {
      key: "Location",
      label: 'Name'
    }
  ]

  constructor(private readonly searchSolutionService: SearchSolutionService,
     @Inject(MAT_DIALOG_DATA) public data: any ) {
       this.routeDetailsRequest = new RouteDetailsRequest;
       }
  ngOnInit() {
    this.routeDetailsRequest.TravelSolutionCache = this.data.TravelSolutionCache;
    this.routeDetailsRequest.TravelSolutionId = this.data.TravelSolutionId;
    this.routeDetailsRequest.SaleCompanyId = this.data.SaleCompanyId;
    this.routeDetailsRequest.SearchCustomCache = this.data.SearchCustomCache;
    this.changes = this.data.Changes;
    this.duration = this.data.Duration;

    this.getRouteDetailsData();
  }

getRouteDetailsData()
{
  this.searchSolutionService.getRouteDetails(this.routeDetailsRequest, false).subscribe(
    res => {
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.routeDetailsResponse = this.responseData.Data as RouteDetailsResponse;
              this.dataSource = new MatTableDataSource(this.routeDetailsResponse.TravelChanges);
              this.traveLChanges= this.routeDetailsResponse.TravelChanges;
            }
            else {
              console.log(this.responseData.ResponseMessage);
            }
          }
   });
}

getRouteWiseDataSource(route)
{
  return new MatTableDataSource(this.traveLChanges.filter(m=>m == route)[0].CallingPoints);
}

onChangeCallingPoints(checked, route)
{
  if(checked)
  {
    route.CallingPoints.forEach(m=>m.IsRouteLocation=true);
  }
  else{
    route.CallingPoints.forEach(m=>m.IsRouteLocation=false);
    route.CallingPoints[0].IsRouteLocation = true;
    route.CallingPoints[route.CallingPoints.length-1].IsRouteLocation = true;
  }
}

}

export class ColumnsToDisplay {
  key: string;
  label: string;
}
