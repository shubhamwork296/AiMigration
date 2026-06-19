import { ChangeDetectionStrategy, Component, Inject, Injector, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnhancedReviewBuyAndDeliveryErrorMessageEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-season-ticket-basket-dialog',
    templateUrl: './season-ticket-basket-dialog.component.html',
    styleUrls: ['./season-ticket-basket-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class SeasonTicketBasketDialogComponent {
  headerTitle: string = 'Sorry, we can’t process your action';
  enhancedReviewBuyAndDeliveryErrorMessageEnum: EnhancedReviewBuyAndDeliveryErrorMessageEnum;

  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SeasonTicketBasketDialogComponent>) {
    this.enhancedReviewBuyAndDeliveryErrorMessageEnum = this.injector.get(EnhancedReviewBuyAndDeliveryErrorMessageEnum);
  }

}
