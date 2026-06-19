import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CojJourneyExtrasComponent } from './coj-journey-extras.component';

describe('CojJourneyExtrasComponent', () => {
  let component: CojJourneyExtrasComponent;
  let fixture: ComponentFixture<CojJourneyExtrasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CojJourneyExtrasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CojJourneyExtrasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
