import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSearchComponent } from './login-search.component';

describe('LoginSearchComponent', () => {
  let component: LoginSearchComponent;
  let fixture: ComponentFixture<LoginSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
