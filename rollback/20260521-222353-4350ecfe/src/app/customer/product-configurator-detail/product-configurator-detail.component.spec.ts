import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductConfiguratorDetailComponent } from './product-configurator-detail.component';

describe('ProductConfiguratorDetailComponent', () => {
  let component: ProductConfiguratorDetailComponent;
  let fixture: ComponentFixture<ProductConfiguratorDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductConfiguratorDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductConfiguratorDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
