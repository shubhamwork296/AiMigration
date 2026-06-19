import { Component } from '@angular/core';
export interface PeriodicElement {
  bookingdate: string;
  reference: string;
  product: string;
  cost: string;
  status: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {reference: 'WXBF97L8(1888296)', bookingdate: 'Thu 29 Oct, 2019', product: 'Smart Card', cost: '£0.00', status: 'In progress'},
];

@Component({
    selector: 'app-replace-smartcard',
    templateUrl: './replace-smartcard.component.html',
    styleUrls: ['./replace-smartcard.component.css'],
    standalone: false
})
export class ReplaceSmartcardComponent {

  displayedColumns: string[] = ['bookingdate', 'reference', 'product', 'cost', 'status'];
  dataSource = ELEMENT_DATA;

}
