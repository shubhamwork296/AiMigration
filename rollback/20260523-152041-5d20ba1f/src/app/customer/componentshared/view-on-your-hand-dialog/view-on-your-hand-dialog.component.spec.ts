import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOnYourHandDialogComponent } from './view-on-your-hand-dialog.component';

describe('ViewOnYourHandDialogComponent', () => {
  let component: ViewOnYourHandDialogComponent;
  let fixture: ComponentFixture<ViewOnYourHandDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewOnYourHandDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewOnYourHandDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
