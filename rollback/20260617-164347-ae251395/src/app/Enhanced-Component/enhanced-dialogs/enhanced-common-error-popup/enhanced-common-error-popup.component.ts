import { ChangeDetectionStrategy, Component, Inject, Injector, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EnhancedMixingDeckPopupHeadingEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-enhanced-common-error-popup',
    templateUrl: './enhanced-common-error-popup.component.html',
    styleUrls: ['./enhanced-common-error-popup.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class EnhancedCommonErrorPopupComponent {
  headerTitle: string;
  message: string;
  enhancedMixingDeckPopupHeadingEnum: EnhancedMixingDeckPopupHeadingEnum;
  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedCommonErrorPopupComponent>) {
  this.enhancedMixingDeckPopupHeadingEnum = this.injector.get(EnhancedMixingDeckPopupHeadingEnum);
  }

  ngOnInit(): void {
    if (this.data) {
      this.message = this.data?.Message;
      this.headerTitle = this.data?.headerTitle;
    }
  }
}
