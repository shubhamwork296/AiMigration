import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddImageViewComponent } from './add-image-view.component';

describe('AddImageViewComponent', () => {
  let component: AddImageViewComponent;
  let fixture: ComponentFixture<AddImageViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddImageViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddImageViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
