import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplaceSmartcardComponent } from './replace-smartcard.component';

describe('ReplaceSmartcardComponent', () => {
  let component: ReplaceSmartcardComponent;
  let fixture: ComponentFixture<ReplaceSmartcardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplaceSmartcardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplaceSmartcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
