import { Component } from '@angular/core';
import { LoaderService } from './core/service/loader.service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
declare let dataLayer: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'jewelex';
  loading: boolean = false;
  loadingDataImg: boolean = false;
  constructor(private router: Router, private loaderService: LoaderService) {

    this.loaderService.isLoading.subscribe((v) => {
      this.loading = v;
    });
  }

  gtagCodeOnInit() {
    this.router.events.subscribe((event: any) => {
      this.navigationInterceptor(event);
    });


    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        dataLayer.push({
          event: 'pageview',
          pagePath: event.urlAfterRedirects
        })
      }

    })

  }

  // Shows and hides the loading spinner during RouterEvent changes
  navigationInterceptor(event: any): void {

    //Triggered When the navigation starts
    if (event instanceof NavigationStart) {
      this.loadingDataImg = true;
    }
    //Triggered When the navigation ends
    if (event instanceof NavigationEnd) {
      this.loadingDataImg = false;
    }

    // Set loading state to false in both of the below events to hide the spinner in case a request fails
    if (event instanceof NavigationCancel) {
      this.loadingDataImg = false;
    }
    //Triggered When the error occurrs while navigation
    if (event instanceof NavigationError) {
      this.loadingDataImg = false;
    }
  }

}
