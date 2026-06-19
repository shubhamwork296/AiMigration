import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeEmailModalComponent } from './change-email-modal.component';

describe('ChangeEmailModalComponent', () => {
  let component: ChangeEmailModalComponent;
  let fixture: ComponentFixture<ChangeEmailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChangeEmailModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeEmailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
