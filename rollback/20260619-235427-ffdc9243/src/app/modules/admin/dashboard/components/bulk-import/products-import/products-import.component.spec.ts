import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsImportComponent } from './products-import.component';

describe('ProductsImportComponent', () => {
  let component: ProductsImportComponent;
  let fixture: ComponentFixture<ProductsImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductsImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
