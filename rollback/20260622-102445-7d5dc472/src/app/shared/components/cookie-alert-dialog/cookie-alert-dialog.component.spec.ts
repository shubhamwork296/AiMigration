import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieAlertDialogComponent } from './cookie-alert-dialog.component';

describe('CookieAlertDialogComponent', () => {
  let component: CookieAlertDialogComponent;
  let fixture: ComponentFixture<CookieAlertDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CookieAlertDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CookieAlertDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
