import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeTicketsComponent } from './upgrade-tickets.component';

describe('UpgradeTicketsComponent', () => {
  let component: UpgradeTicketsComponent;
  let fixture: ComponentFixture<UpgradeTicketsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradeTicketsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
