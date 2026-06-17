import { ChangeDetectionStrategy, signal, Component, Inject, OnInit, ViewEncapsulation } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {MatExpansionModule} from '@angular/material/expansion';

@Component({
  selector: "enhanced-ticket-information-dialogs",
  templateUrl: "./enhanced-ticket-information-dialogs.component.html",
  styleUrls: ['./enhanced-ticket-information-dialogs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class EnhancedTicketInformationDialogsComponent{
    headerTitle: string;
    readonly panelOpenState = signal(false);
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EnhancedTicketInformationDialogsComponent> ){
        console.log('constructor');
    }
}