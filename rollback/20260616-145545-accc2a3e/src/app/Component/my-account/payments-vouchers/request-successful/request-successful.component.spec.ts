import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestSuccessfulComponent } from './request-successful.component';

describe('RequestSuccessfulComponent', () => {
  let component: RequestSuccessfulComponent;
  let fixture: ComponentFixture<RequestSuccessfulComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestSuccessfulComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestSuccessfulComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
