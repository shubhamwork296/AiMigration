import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { LoaderService } from './../core/service/loader.service';
import { SessionService } from '../core/service/session.service';
import { Subscription } from 'rxjs';
import { register } from 'swiper/element/bundle';
import { Router } from '@angular/router';
import { ProductDetailsService } from './services/product-details.service';
register();
@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss',
  ]
})
export class CustomerComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  private loaderSubscription!: Subscription;
  private messageEventListener!: (event: MessageEvent) => void;

  constructor(private loaderService: LoaderService, private sessionService: SessionService,
    private cdr: ChangeDetectorRef, private router: Router, private productDetailService: ProductDetailsService) {
    this.loaderService.isLoading.subscribe((v) => {
      this.loading = v;
    });
  }

  ngOnInit(): void {
    // Store the event listener function so we can remove it later
    console.log('Build-V9/18.1')
    this.messageEventListener = (event: MessageEvent) => {
      this.sessionService.isBreadCrumed.subscribe((isBreadCrumed) => {
        if (!isBreadCrumed && event.data?.prodSku) {
          this.receiveMessage(event);
        }
      });
    };

    window.addEventListener('message', this.messageEventListener, false);

    this.loaderSubscription = this.loaderService.isLoading.subscribe((v: boolean) => {
      this.loading = v;
      this.cdr.detectChanges(); // Explicitly trigger change detection
    });
  }

  ngOnDestroy(): void {
    // Remove the event listener
    if (this.messageEventListener) {
      window.removeEventListener('message', this.messageEventListener, false);
    }

    // Unsubscribe from loader subscription
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
  }

  receiveMessage(event: MessageEvent): void {
    console.log("event data receiveMessage");
    this.loading = true;
    this.sessionService.targetOrigin.next(event.origin);
    this.productDetailService.getProductBySku({ productSKU: event.data.prodSku }).subscribe((x: any) => {
      if (x.data) {
        this.sessionService.iframeData.next(x.data);
        setTimeout(() => {
          this.router.navigate(['/home/product'], { queryParams: { categoryId: x.data.CategoryId, articalId: x.data.ArticleId } });
          this.loading = false;
          this.cdr.detectChanges();
        }, 1300);
        // this.router.navigate(['/home/product'], { queryParams: { categoryId: x.data.CategoryId, articalId: x.data.ArticleId } });
        // this.loading = false;
        // this.cdr.detectChanges();
      };
    })
  }


  scrollTop(_event: any) {
    window.scroll(0, 0);
  }
}
