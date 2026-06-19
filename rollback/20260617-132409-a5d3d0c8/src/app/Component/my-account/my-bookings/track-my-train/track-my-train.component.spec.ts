import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackMyTrainComponent } from './track-my-train.component';
describe('TrackMyTrainComponent', () => {
  let component: TrackMyTrainComponent;
  let fixture: ComponentFixture<TrackMyTrainComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackMyTrainComponent ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(TrackMyTrainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});