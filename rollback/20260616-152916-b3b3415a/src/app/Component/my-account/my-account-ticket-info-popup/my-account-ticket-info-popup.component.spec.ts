import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAccountTicketInfoPopupComponent } from './my-account-ticket-info-popup.component';

describe('MyAccountTicketInfoPopupComponent', () => {
  let component: MyAccountTicketInfoPopupComponent;
  let fixture: ComponentFixture<MyAccountTicketInfoPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyAccountTicketInfoPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyAccountTicketInfoPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
