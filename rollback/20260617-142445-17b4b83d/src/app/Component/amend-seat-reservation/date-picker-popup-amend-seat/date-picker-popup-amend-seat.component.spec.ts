import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePickerPopupAmendSeatComponent } from './date-picker-popup-amend-seat.component';

describe('DatePickerPopupAmendSeatComponent', () => {
  let component: DatePickerPopupAmendSeatComponent;
  let fixture: ComponentFixture<DatePickerPopupAmendSeatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatePickerPopupAmendSeatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatePickerPopupAmendSeatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
