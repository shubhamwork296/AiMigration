import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRoleMappingComponent } from './user-role-mapping.component';

describe('UserRoleMappingComponent', () => {
  let component: UserRoleMappingComponent;
  let fixture: ComponentFixture<UserRoleMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserRoleMappingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserRoleMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
