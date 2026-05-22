import { Component, HostListener, Injector, OnInit } from '@angular/core';
import { HomeService } from '../services/home.service';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/core/service/http.service';
import { AppConstants } from 'src/app/core/constants/app-constants';
import { SessionService } from 'src/app/core/service/session.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  homeService!: HomeService;
  categoryList: any[] = [];
  httpService!: HttpService;
  sessionService!: SessionService;
  imageUrl: string = '';
  screenWidth: number = window.innerWidth;
  loading: boolean = true;

  constructor(
    private injector: Injector, private router: Router) {
    this.homeService = injector.get<HomeService>(HomeService);
    this.httpService = injector.get<HttpService>(HttpService);
    this.sessionService = injector.get<SessionService>(SessionService);
  }

  ngOnInit(): void {
    this.updateScreenWidth();
    this.loading = true;
    this.httpService.getConfig().subscribe((config: any) => {
      this.imageUrl = config?.imageUrl;
    });
    this.homeService.getCategory().subscribe({
      next: (res: any) => {
        res?.data?.forEach((item: any) => { item.Image = this.imageUrl + AppConstants.CATEGORY_IMAGE_FOLDER_NAME + item.Image });
        this.categoryList = res?.data;
        setTimeout(() => { this.loading = false }, 2000);
      },
      error: (err: any) => { console.log(err) }
    })
  }

  @HostListener('window:resize', [])
  updateScreenWidth() {
    this.screenWidth = window.innerWidth;
  }

  onCategoryClick(item: any) {
    this.router.navigate(['/home/product'], { queryParams: { categoryId: item.CategoryId, articalId: item.ArticleId } });
    this.sessionService.fromCat.next(true);
  }

  getImagePath(item: any): string {
    if (this.screenWidth < 1199) {
      return item.Image.replace('categories/', 'categories/mobile_');
    }
    return item.Image ? item.Image : 'assets/front/images/no_image.jpg';
  }
}
