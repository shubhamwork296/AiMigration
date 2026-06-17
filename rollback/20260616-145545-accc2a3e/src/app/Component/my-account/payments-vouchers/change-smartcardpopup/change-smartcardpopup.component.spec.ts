import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeSmartcardpopupComponent } from './change-smartcardpopup.component';

describe('ChangeSmartcardpopupComponent', () => {
  let component: ChangeSmartcardpopupComponent;
  let fixture: ComponentFixture<ChangeSmartcardpopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeSmartcardpopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeSmartcardpopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
