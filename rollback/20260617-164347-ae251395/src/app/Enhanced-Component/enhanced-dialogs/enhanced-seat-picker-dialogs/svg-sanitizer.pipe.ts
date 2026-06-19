import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Pipe({
    name: 'svgSanitize',
    standalone: false
})
export class SvgSanitizePipe implements PipeTransform {

  constructor(private readonly sanitizer: DomSanitizer) { }

  transform(dom: string) : SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(dom);
  }
}
