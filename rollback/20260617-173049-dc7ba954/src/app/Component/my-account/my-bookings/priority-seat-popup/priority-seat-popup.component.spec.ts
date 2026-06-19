import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrioritySeatPopupComponent } from './priority-seat-popup.component';

describe('PrioritySeatPopupComponent', () => {
  let component: PrioritySeatPopupComponent;
  let fixture: ComponentFixture<PrioritySeatPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrioritySeatPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrioritySeatPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
