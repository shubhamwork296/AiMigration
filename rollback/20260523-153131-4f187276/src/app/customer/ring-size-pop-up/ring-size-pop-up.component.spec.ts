import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RingSizePopUpComponent } from './ring-size-pop-up.component';

describe('RingSizePopUpComponent', () => {
  let component: RingSizePopUpComponent;
  let fixture: ComponentFixture<RingSizePopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RingSizePopUpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RingSizePopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
