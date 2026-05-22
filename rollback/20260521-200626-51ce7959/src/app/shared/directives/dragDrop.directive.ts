import {
  Directive,
  HostListener,
  Output,
  EventEmitter,
  SecurityContext
} from "@angular/core";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface FileHandle {
  file: File,
  url: SafeUrl
}

@Directive({
  selector: "[appDrag]"
})
export class DragDirective {
  @Output() files: EventEmitter<FileHandle[]> = new EventEmitter();


  constructor(private sanitizer: DomSanitizer) { }

  @HostListener("dragover", ["$event"]) public onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener("dragleave", ["$event"]) public onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    let files: FileHandle[] = [] ;
    let transferFile : any = evt.dataTransfer!.files
    for (const element of transferFile) {
      const file = element;
      const url : any = this.sanitizer.sanitize(SecurityContext.URL, window.URL.createObjectURL(file));
      files.push({ file, url });
    }
    if (files.length > 0) {
      this.files.emit(files);
    }
  }
}
