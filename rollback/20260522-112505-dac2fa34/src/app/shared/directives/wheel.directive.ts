import {
  Directive,
  HostListener,
  Output,
  EventEmitter,
} from '@angular/core';
@Directive({
  selector: '[wheel]',
})
export class WheelDirective {
  @Output()
  public myCustomMouseover = new EventEmitter<any>();

  i: number = 1;

  @HostListener('mousewheel', ['$event']) onMousewheel(event : any) {
    if (event.wheelDelta > 0) {
      this.myCustomMouseover.emit(this.i + 1);
    }
    if (event.wheelDelta < 0) {
      this.myCustomMouseover.emit(this.i - 1);
    }
  }
}
