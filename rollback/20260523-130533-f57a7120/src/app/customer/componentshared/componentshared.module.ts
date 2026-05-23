import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSliderModule} from '@angular/material/slider';

import { SafeHtmlPipe } from 'src/app/shared/pipes/safe-html.pipe';
import { TruncateTextPipe } from 'src/app/shared/pipes/truncate-text.pipe';
import {RouterModule} from '@angular/router';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ViewOnYourHandDialogComponent } from './view-on-your-hand-dialog/view-on-your-hand-dialog.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {HeaderComponent } from '../componentshared/header/header.component'
@NgModule({
  declarations: [ 
    ViewOnYourHandDialogComponent,
    SafeHtmlPipe,
    TruncateTextPipe,
    HeaderComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatSliderModule,
    RouterModule,
    ModalModule.forRoot(),
    DragDropModule
  ], exports:[
    CommonModule,
    ViewOnYourHandDialogComponent,
    SafeHtmlPipe,
    TruncateTextPipe,
    RouterModule,
    ModalModule,
    DragDropModule,
    HeaderComponent
  ],
  providers : [
     BsModalService, BsModalRef
  ]
})
export class ComponentsharedModule { }
