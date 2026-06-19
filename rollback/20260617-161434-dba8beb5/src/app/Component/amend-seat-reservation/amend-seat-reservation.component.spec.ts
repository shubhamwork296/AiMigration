import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmendSeatReservationComponent } from './amend-seat-reservation.component';

describe('AmendSeatReservationComponent', () => {
  let component: AmendSeatReservationComponent;
  let fixture: ComponentFixture<AmendSeatReservationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmendSeatReservationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmendSeatReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
