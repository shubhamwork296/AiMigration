import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RenewSmartcardComponent } from './renew-smartcard.component';

describe('RenewSmartcardComponent', () => {
  let component: RenewSmartcardComponent;
  let fixture: ComponentFixture<RenewSmartcardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RenewSmartcardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RenewSmartcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
