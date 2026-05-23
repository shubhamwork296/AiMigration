import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TruncateTextPipe } from './pipes/truncate-text.pipe';
import { ToastrModule } from 'ng6-toastr-notifications';
import { RouterModule } from '@angular/router';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { NgDynamicBreadcrumbModule } from "ng-dynamic-breadcrumb";
import { NgxPaginationModule } from 'ngx-pagination';
import { DragDirective } from './directives/dragDrop.directive';
import { InputRefDirective } from './directives/InputRef.directive';
import { InputMaxLengthDirective } from './directives/input-max-length-directive'
import { ColorPickerModule } from 'ngx-color-picker';
import { MaskDirective } from './directives/mask.directive';
import { AuthorizeDirective } from './directives/authorize-directive';
import { DragDropModule } from '@angular/cdk/drag-drop';
@NgModule({
  declarations: [
    DragDirective,
    InputRefDirective,
    InputMaxLengthDirective,
    MaskDirective,
    AuthorizeDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ToastrModule.forRoot(),
    ModalModule.forRoot(),
    NgDynamicBreadcrumbModule,
    NgxPaginationModule,
    ColorPickerModule,
    DragDropModule
  ],
  providers: [
    DatePipe, TruncateTextPipe, BsModalService, BsModalRef
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDirective,
    InputRefDirective,
    InputMaxLengthDirective,
    RouterModule,
    ToastrModule,
    ModalModule,
    NgDynamicBreadcrumbModule,
    NgxPaginationModule,
    ColorPickerModule,
    MaskDirective,
    AuthorizeDirective,
    DragDropModule
  ]
})
export class SharedModule { }
