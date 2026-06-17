import { ChangeDetectionStrategy, Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-enhanced-payment-not-completed-dialog',
  templateUrl: './enhanced-payment-not-completed-dialog.component.html',
  styleUrls: ['./enhanced-payment-not-completed-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EnhancedPaymentNotCompletedDialogComponent {
  headerTitle: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedPaymentNotCompletedDialogComponent> ){
  }

  ngOnInit(): void {
   this.headerTitle = this.data?.headerTitle;
  }

}
