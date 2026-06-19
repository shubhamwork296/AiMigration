import { ChangeDetectionStrategy, Component, Inject, Injector, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationErrorMsg } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-enhanced-common-confirmation-dialog',
    templateUrl: './enhanced-common-confirmation-dialog.component.html',
    styleUrls: ['./enhanced-common-confirmation-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class EnhancedCommonConfirmationDialogComponent {
  notificationErrorMsg: NotificationErrorMsg;
  headerTitle: string;

  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedCommonConfirmationDialogComponent>) {
      this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
      this.headerTitle = this.data.headerTitle;
    }
}
