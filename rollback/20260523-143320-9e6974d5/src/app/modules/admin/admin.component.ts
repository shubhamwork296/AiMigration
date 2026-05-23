import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LoaderService } from '../../core/service/loader.service';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  favIcon!: HTMLLinkElement;
  loading: boolean = false;
  constructor(@Inject(DOCUMENT) private document: Document, private loaderService: LoaderService) {
    this.loaderService.isLoading.subscribe((v) => {
      this.loading = v;
    });
  }

  ngOnInit(): void {

    this.loadStyle('style.css', 'responsive.css')
    let link: any = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = './../../assets/images/logo_x_et.png';

    // this.document.title = 'Jewelex'
    let body = document.getElementsByTagName('body')[0]
    if (body) {
      body.classList.remove('mat-typography')
      body.classList.remove('blue-theme')
      body.classList.remove('green-theme')
      body.classList.remove('red-theme')
      body.classList.remove('gray-theme')
      body.classList.remove('black-theme')
      body.classList.remove('blue-theme')
    }

  }

  public loadLink(url: string) {
    const head = <HTMLDivElement>document.head;
    const link = document.createElement('link');
    link.innerHTML = '';
    link.href = url;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.className = 'append-link';
    head.appendChild(link);
  }

  loadStyle(styleName: string, responsiveStyleName: string) {
    const head = this.document.getElementsByTagName('head')[0];

    let themeLink = this.document.getElementById(
      'client-theme'
    ) as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = styleName;
    } else {
      const style = this.document.createElement('link');
      style.id = 'client-theme';
      style.rel = 'stylesheet';
      style.href = `${styleName}`;

      head.appendChild(style);
    }

    let themeResponsiveLink = this.document.getElementById(
      'client-theme-responsive'
    ) as HTMLLinkElement;
    if (themeResponsiveLink) {
      themeResponsiveLink.href = responsiveStyleName;
    } else {
      const style = this.document.createElement('link');
      style.id = 'client-theme-responsive';
      style.rel = 'stylesheet';
      style.href = `${responsiveStyleName}`;

      head.appendChild(style);
    }
  }

  scrollTop(_event: any) {
    window.scroll(0, 0);
  }
}
