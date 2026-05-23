import {
    Directive, ElementRef, Input, OnInit, Renderer2, Optional, OnDestroy
  } from '@angular/core';
  import { NgModel } from '@angular/forms';
  import { Subject } from 'rxjs';
 
  @Directive({
    selector: '[appInputMaxLength]'
  })
  export class InputMaxLengthDirective implements OnInit, OnDestroy {
    @Input() appInputMaxLength!: number;
    private destroyed$ = new Subject();
  
    constructor(
      private el: ElementRef,
      private renderer: Renderer2,
      @Optional() private ngModel: NgModel,
    ) {}
  

    ngOnInit() {
      this.renderer.setAttribute(this.el.nativeElement, 'maxLength', this.appInputMaxLength.toString());
    }
  
  
    ngOnDestroy() {
      this.destroyed$?.next(0);
      this.destroyed$.complete();
    }
  
  }