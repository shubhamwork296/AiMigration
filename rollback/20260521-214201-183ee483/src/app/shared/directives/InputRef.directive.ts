import { Directive,ElementRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Directive({ selector: '[inputRef]' })
export class InputRefDirective {
  constructor(private ngControl: NgControl,private el : ElementRef) {
    let valueAccessor: any = ngControl?.valueAccessor
    trimValueAccessor(valueAccessor)
  }

  @HostListener('blur') onBlur() {
    const value = this.el.nativeElement.value;
    const valueTrim = value.trim();
    if(value !== valueTrim) {
      this.el.nativeElement.value = valueTrim;
    }
  }  
}

function trimValueAccessor(valueAccessor: ControlValueAccessor) {
  const original = valueAccessor.registerOnChange;

  valueAccessor.registerOnChange = (fn: (_: unknown) => void) => {
    return original.call(valueAccessor, (value: unknown) => {
      return fn(typeof value === 'string' ? value.trim() : value);
    });
  };
}

