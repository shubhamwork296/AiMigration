import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplaceSmartcardpopupComponent } from './replace-smartcardpopup.component';

describe('ReplaceSmartcardpopupComponent', () => {
  let component: ReplaceSmartcardpopupComponent;
  let fixture: ComponentFixture<ReplaceSmartcardpopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplaceSmartcardpopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplaceSmartcardpopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
