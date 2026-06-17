import { MatTableDataSource } from '@angular/material/table';

export class MixingDeckModel {
  dataSource: MatTableDataSource<any>;
  travelSolutionCache:string;
  isHideEarlier:boolean;
  isHideLater:boolean;
  cheapestTravelSolutionId:number;
  isReturnDirection:boolean;
}
