import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundBookingComponent } from './refund-booking.component';

describe('RefundBookingComponent', () => {
  let component: RefundBookingComponent;
  let fixture: ComponentFixture<RefundBookingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RefundBookingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RefundBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
