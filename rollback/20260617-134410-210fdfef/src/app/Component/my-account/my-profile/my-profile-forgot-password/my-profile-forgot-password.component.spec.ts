import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProfileForgotPasswordComponent } from './my-profile-forgot-password.component';

describe('MyProfileForgotPasswordComponent', () => {
  let component: MyProfileForgotPasswordComponent;
  let fixture: ComponentFixture<MyProfileForgotPasswordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyProfileForgotPasswordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyProfileForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
