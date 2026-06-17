import {
  Directive,
  Input,
  EventEmitter,
  Output,
  ElementRef,
  HostListener,
} from '@angular/core';

@Directive({
  selector: '[scrollSpy]',
})
export class ScrollSpyDirective {
  @Input() public spiedTags = [];
  @Output() public sectionChange = new EventEmitter<string>();
  private currentSection: string;

  constructor(private readonly _el: ElementRef) {}

  @HostListener('scroll', ['$event'])
  onScroll(event: any) {
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let x;
    if(isMobile){
       x = 50;
    }else {
      x = 300;
    }
    let currentSection: string;
    const children = this._el.nativeElement.children;
    const scrollTop = event.target.scrollTop;
    const parentOffset = event.target.offsetTop;
    for(let element of children){
      if (this.spiedTags.some((spiedTag) => spiedTag === element.tagName)) {
        if ((element.offsetTop) - (parentOffset + x) <= scrollTop) {
          currentSection = element.id;
        }
      }
    }
    if (currentSection !== this.currentSection) {
      this.currentSection = currentSection;
      this.sectionChange.emit(this.currentSection);
    }
  }
}
