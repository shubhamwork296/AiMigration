import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmendReviewBuyComponent } from './amend-review-buy.component';

describe('AmendReviewBuyComponent', () => {
  let component: AmendReviewBuyComponent;
  let fixture: ComponentFixture<AmendReviewBuyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmendReviewBuyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmendReviewBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
