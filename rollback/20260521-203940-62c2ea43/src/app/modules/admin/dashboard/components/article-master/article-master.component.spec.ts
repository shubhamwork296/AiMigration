import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticleMasterComponent } from './article-master.component';

describe('ArticleMasterComponent', () => {
  let component: ArticleMasterComponent;
  let fixture: ComponentFixture<ArticleMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArticleMasterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArticleMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
