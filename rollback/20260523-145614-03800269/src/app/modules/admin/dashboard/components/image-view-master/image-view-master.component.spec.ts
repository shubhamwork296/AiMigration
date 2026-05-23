import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageViewMasterComponent } from './image-view-master.component';

describe('ImageViewMasterComponent', () => {
  let component: ImageViewMasterComponent;
  let fixture: ComponentFixture<ImageViewMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageViewMasterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageViewMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
