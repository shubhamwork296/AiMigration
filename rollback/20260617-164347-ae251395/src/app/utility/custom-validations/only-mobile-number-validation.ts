import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[appOnlyMobilenumber]',
    standalone: false
})
export class OnlyMobileNumberDirective {

  private navigationKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'Home',
    'End',
    'ArrowLeft',
    'ArrowRight',
    'Clear',
    'Copy',
    'Paste'
  ];
  inputElement: HTMLElement;
  constructor(public el: ElementRef) {
    this.inputElement = el.nativeElement;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (
      this.navigationKeys.indexOf(e.key) > -1 || // Allow: navigation keys: backspace, delete, arrows etc.
      (e.key === 'a' && e.ctrlKey === true) || // Allow: Ctrl+A
      (e.key === '+' && e.shiftKey === true) || // Allow: Ctrl+C
       (e.key === 'v' && e.ctrlKey === true) || // Allow: Ctrl+V
      (e.key === 'a' && e.metaKey === true)  // Allow: Cmd+A (Mac)
    ) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    
       if (e.shiftKey) {
        e.preventDefault();
      }
    
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    let content;
    event.preventDefault();

    if( event.clipboardData ){
      content = event.clipboardData.getData('text/plain').replace(/[^0-9+]+/g, '');
      document.execCommand('insertText', false, content);
      return false;
    }
    else if( window['clipboardData'] ){
      content = window['clipboardData'].getData('Text').replace(/[^0-9+]+/g, '');
      document.execCommand('paste', false, content);
    }
   
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    const textData = event.dataTransfer.getData('text').replace(/\D/g, '');
    this.inputElement.focus();
    document.execCommand('insertText', false, textData);
  }
}